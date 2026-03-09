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
            // 1. Fetch current product data and verify stock
            const productRefs = items.map((item: any) => db.collection('products').doc(item.id));
            const productDocs = await transaction.getAll(...productRefs);

            const updates = [];
            const backorders = [];

            for (let i = 0; i < productDocs.length; i++) {
                const doc = productDocs[i];
                const requestedItem = items[i];

                if (!doc.exists) {
                    throw new Error(`El producto solicitado (${requestedItem.id}) no existe en nuestra base de datos. Pudo haber sido eliminado o intentaron inyectarlo. Actividad sospechosa procesada y bloqueada por Netlify Functions.`);
                }

                const productData = doc.data()!;

                // Allow purchasing if enabled
                if (productData.enabled === false) {
                    throw new Error(`El producto ${productData.name} no está disponible actualmente.`);
                }

                // Calculate Price securely
                let basePrice = productData.price;
                const configDeliveryCost = productData.deliveryCost || 0;

                // Handle Promo Pricing Server Side
                if (appliedPromotion && appliedPromotion.id) {
                    const promoDoc = await transaction.get(db.collection('promotions').doc(appliedPromotion.id));
                    if (promoDoc.exists) {
                        const promoData = promoDoc.data() as any;
                        const now = new Date();
                        const expiresAt = promoData.expiresAt?.toDate ? promoData.expiresAt.toDate() : null;

                        if (promoData.enabled && (!expiresAt || expiresAt > now)) {
                            // Promo is valid, check if this product has a promo price
                            const promoProduct = promoData.applicableProducts?.find((p: any) => p.productId === requestedItem.id);
                            if (promoProduct) {
                                basePrice = promoProduct.promoPrice;
                            }
                        }
                    }
                }

                const finalPricePerUnit = basePrice + configDeliveryCost;

                // Handle Stock Management
                const currentStock = productData.stock || 0;
                let toDeduct = Math.min(currentStock, requestedItem.quantity);

                if (toDeduct > 0) {
                    updates.push({
                        ref: doc.ref,
                        newStock: currentStock - toDeduct
                    });
                }

                if (currentStock < requestedItem.quantity) {
                    isBackorder = true;
                    backorders.push({
                        productId: doc.id,
                        productName: productData.name, // Uso el nombre REAL de la bbdd
                        quantityNeeded: requestedItem.quantity - currentStock
                    });
                }

                // Append validated item to final order list
                finalItems.push({
                    id: doc.id,
                    name: productData.name, // Siempre confiamos en el catálogo real
                    quantity: requestedItem.quantity,
                    price: finalPricePerUnit // Precio validado y calculado desde backend
                });

                // Calculate subtotal

                let percentDiscount = 0;
                if (!appliedPromotion && globalDiscounts && requestedItem.quantity >= 6) {
                    percentDiscount = globalDiscounts.tier1 || 0;
                }

                const itemTotal = (finalPricePerUnit * requestedItem.quantity);
                const discountForItem = itemTotal * (percentDiscount / 100);

                subtotal += (itemTotal - discountForItem);
            }

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
            updates.forEach(u => {
                transaction.update(u.ref, { stock: u.newStock });
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
