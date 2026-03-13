import type { Handler } from '@netlify/functions';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Initialize Firebase Admin if not already initialized
try {
    if (!getApps().length) {
        let serviceAccount;
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            try {
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            } catch (e) {
                console.error("❌ Error parsing FIREBASE_SERVICE_ACCOUNT env var");
            }
        }

        if (!serviceAccount) {
            try {
                const localPath = resolve('./service-account.json');
                if (existsSync(localPath)) {
                    serviceAccount = JSON.parse(readFileSync(localPath, 'utf-8'));
                    console.log("✅ Using local service-account.json");
                }
            } catch (e) {
                console.error("❌ Error reading local service-account.json");
            }
        }

        if (serviceAccount) {
            // Fix for newline escaping issues in private key
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }

            initializeApp({
                credential: cert(serviceAccount)
            });
            console.log("✅ [CreateOrderSys] Firebase Admin inicializado.");
        } else {
            console.warn("⚠️ [CreateOrderSys] FIREBASE_SERVICE_ACCOUNT no configurado y no se encontró service-account.json.");
        }
    }
} catch (e) {
    console.error("❌ [CreateOrderSys] Error inicializando Firebase Admin:", e);
}

export const handler: Handler = async (event) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (!getApps().length) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Configuración de servidor incompleta (Falta Service Account)' })
        };
    }

    // AUTHENTICATION CHECK
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado: Falta token' }) };
    }
    const idToken = authHeader.split('Bearer ')[1];

    try {
        // Verify User Token
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const requestUid = decodedToken.uid;

        const payload = JSON.parse(event.body || '{}');
        const {
            userName,
            userPhone,
            userCedula,
            userEmail,
            isGift,
            recipient,
            items,
            selectedState,
            shippingMethod,
            selectedAgency,
            selectedPickup,
            address,
            userLocation,
            deliveryCost: clientCalculatedDeliveryCost,
            paymentBank,
            paymentSourceBank,
            paymentReference,
            paymentId,
            paymentPhone,
            zelleEmail,
            zelleSenderName,
            appliedPromotion
        } = payload;

        // Basic Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'El pedido debe contener al menos un producto.' })
            };
        }

        const db = getFirestore();
        let subtotal = 0;
        let finalItems = [];
        let isBackorder = false;

        // Fetch Global Settings for Discounts
        let globalDiscounts = null;
        const globalSettingsDoc = await db.collection('settings').doc('global').get();
        if (globalSettingsDoc.exists) {
            globalDiscounts = globalSettingsDoc.data()?.discounts;
        }

        // --- TRANSACTION START ---
        const result = await db.runTransaction(async (transaction) => {
            // 1. Pre-fetch all necessary documents (Products and Promotions)
            const primaryItemRefs = items.map((item: any) => 
                item.promotionId 
                    ? db.collection('promotions').doc(item.promotionId)
                    : db.collection('products').doc(item.id)
            );
            const primaryDocs = await transaction.getAll(...primaryItemRefs);

            const promoDataMap = new Map();
            const productDataMap = new Map();
            const productRefsToFetch = new Set<string>();

            // Phase A: Identify all direct products and promotion sub-products
            primaryDocs.forEach((doc, idx) => {
                const requestedItem = items[idx];
                if (!doc.exists) {
                    throw new Error(`El item solicitado (${requestedItem.id}) no existe en nuestra base de datos. Actividad sospechosa procesada y bloqueada.`);
                }
                const data = doc.data()!;
                if (requestedItem.promotionId) {
                    promoDataMap.set(doc.id, data);
                    // Add all products in the promo to the fetch set
                    (data.applicableProducts || []).forEach((p: any) => productRefsToFetch.add(p.productId));
                } else {
                    productDataMap.set(doc.id, data);
                    productRefsToFetch.add(doc.id);
                }
            });

            // Phase B: Fetch all involved unique products for stock validation
            const uniqueProductRefs = Array.from(productRefsToFetch).map(id => db.collection('products').doc(id));
            const uniqueProductDocs = uniqueProductRefs.length > 0 ? await transaction.getAll(...uniqueProductRefs) : [];
            const actualProductData = new Map();
            uniqueProductDocs.forEach(doc => {
                if (doc.exists) actualProductData.set(doc.id, doc.data());
            });

            const updates = new Map(); // productId -> newStock
            const backorders = [];
            const finalProcessedItems = [];
            let currentSubtotal = 0;

            // Phase C: Validation, Price Calculation and Stock Deduction
            for (let i = 0; i < items.length; i++) {
                const requestedItem = items[i];
                
                if (requestedItem.promotionId) {
                    // --- HANDLE PROMOTION ---
                    const promoData = promoDataMap.get(requestedItem.promotionId);
                    if (!promoData.enabled) throw new Error(`La promoción ${promoData.title} ya no está disponible.`);
                    
                    const now = new Date();
                    const expiresAt = promoData.expiresAt?.toDate ? promoData.expiresAt.toDate() : null;
                    if (expiresAt && expiresAt < now) throw new Error(`La promoción ${promoData.title} ha caducado.`);

                    const promoPrice = promoData.price || 0;
                    currentSubtotal += (promoPrice * requestedItem.quantity);

                    // Deduct stock for each product in the promo
                    (promoData.applicableProducts || []).forEach((ap: any) => {
                        const pData = actualProductData.get(ap.productId);
                        if (!pData) return;

                        const totalQuantityInPromo = (ap.quantity || 1) * requestedItem.quantity;
                        const currentStock = updates.has(ap.productId) ? updates.get(ap.productId) : (pData.stock || 0);
                        const canDeduct = Math.min(currentStock, totalQuantityInPromo);
                        
                        if (canDeduct > 0) {
                            updates.set(ap.productId, currentStock - canDeduct);
                        }

                        if (currentStock < totalQuantityInPromo) {
                            isBackorder = true;
                            backorders.push({
                                productId: ap.productId,
                                productName: pData.name,
                                quantityNeeded: totalQuantityInPromo - currentStock
                            });
                        }
                    });

                    finalProcessedItems.push({
                        id: requestedItem.id,
                        name: promoData.title,
                        quantity: requestedItem.quantity,
                        price: promoPrice,
                        isPromotion: true
                    });

                } else {
                    // --- HANDLE REGULAR PRODUCT ---
                    const pData = actualProductData.get(requestedItem.id);
                    if (!pData || pData.enabled === false) {
                        throw new Error(`El producto solicitado no está disponible.`);
                    }

                    let basePrice = pData.price;
                    const configDeliveryCost = pData.deliveryCost || 0;
                    
                    // Handle Promo Pricing Server Side for non-combo banners if necessary
                    // (Old logic kept for safety with appliedPromotion field)
                    if (appliedPromotion && appliedPromotion.id) {
                        const promoDoc = await transaction.get(db.collection('promotions').doc(appliedPromotion.id));
                        if (promoDoc.exists) {
                            const pDocData = promoDoc.data() as any;
                            const promoProduct = pDocData.applicableProducts?.find((p: any) => p.productId === requestedItem.id);
                            if (promoProduct) basePrice = promoProduct.promoPrice;
                        }
                    }

                    const finalPricePerUnit = basePrice + configDeliveryCost;
                    const currentStock = updates.has(requestedItem.id) ? updates.get(requestedItem.id) : (pData.stock || 0);
                    const toDeduct = Math.min(currentStock, requestedItem.quantity);

                    if (toDeduct > 0) {
                        updates.set(requestedItem.id, currentStock - toDeduct);
                    }

                    if (currentStock < requestedItem.quantity) {
                        isBackorder = true;
                        backorders.push({
                            productId: requestedItem.id,
                            productName: pData.name,
                            quantityNeeded: requestedItem.quantity - currentStock
                        });
                    }

                    let percentDiscount = 0;
                    if (!appliedPromotion && globalDiscounts && requestedItem.quantity >= 6) {
                        percentDiscount = globalDiscounts.tier1 || 0;
                    }

                    const itemTotal = (finalPricePerUnit * requestedItem.quantity);
                    const discountForItem = itemTotal * (percentDiscount / 100);
                    currentSubtotal += (itemTotal - discountForItem);

                    finalProcessedItems.push({
                        id: requestedItem.id,
                        name: pData.name,
                        quantity: requestedItem.quantity,
                        price: finalPricePerUnit
                    });
                }
            }

            subtotal = currentSubtotal;
            finalItems = finalProcessedItems;

            // Total = subtotal
            // El delivery se cobra aparte por WhatsApp según requerimiento del cliente
            const total = subtotal;

            // 2. Prepare Order Document
            const orderRef = db.collection('orders').doc();
            const orderData = {
                customerId: requestUid,
                userName,
                userPhone,
                userCedula,
                userEmail,
                isGift: !!isGift,
                recipient: isGift ? recipient : null,
                items: finalItems,
                subtotal,
                total,
                selectedState,
                shippingMethod,
                selectedAgency,
                selectedPickup,
                address,
                userLocation,
                deliveryCost: 0, // Se deja en 0 porque se cobra por WhatsApp destino
                paymentBank,
                paymentSourceBank,
                paymentReference,
                paymentId,
                paymentPhone,
                zelleEmail,
                zelleSenderName,
                status: 'pendiente',
                isBackorder,
                appliedPromotion: appliedPromotion ? { id: appliedPromotion.id, title: appliedPromotion.title } : null,
                createdAt: FieldValue.serverTimestamp()
            };

            // 3. Write Stock Updates
            updates.forEach((newStock, productId) => {
                transaction.update(db.collection('products').doc(productId), { stock: newStock });
            });

            // 4. Create Order
            transaction.set(orderRef, orderData);

            // 5. Create Production Needs for Backorders
            backorders.forEach(bo => {
                const needRef = db.collection('production_needs').doc();
                transaction.set(needRef, {
                    orderId: orderRef.id,
                    productId: bo.productId,
                    productName: bo.productName,
                    quantityNeeded: bo.quantityNeeded,
                    status: 'pendiente',
                    createdAt: FieldValue.serverTimestamp()
                });
            });

            return { orderId: orderRef.id, orderData };
        });
        // --- TRANSACTION END ---

        // Triger Async Notifications without blocking the response
        if (userEmail) {
            fetch(`${event.headers.origin || 'http://localhost:8888'}/.netlify/functions/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: userEmail,
                    userName: userName,
                    orderId: result.orderId,
                    customerId: requestUid,
                    status: 'pendiente'
                })
            }).catch(e => console.error("Could not trigger notification", e));
        }


        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Pedido creado exitosamente',
                orderId: result.orderId,
                isBackorder
            })
        };

    } catch (error: any) {
        console.error("❌ [CreateOrderSys] Error:", error);

        let status = 500;
        let message = "Hubo un error al procesar tu pedido. Inténtalo de nuevo.";

        if (error.message && error.message.includes("no existe en nuestra base de datos")) {
            status = 400;
            message = error.message;
        } else if (error.code === 'auth/argument-error') {
            status = 401;
            message = "Token de autenticación inválido.";
        }

        return {
            statusCode: status,
            body: JSON.stringify({ error: message })
        };
    }
};
