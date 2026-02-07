import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShoppingCart, CreditCard, Minus, Plus, Trash2, ArrowLeft, ArrowRight, Loader2, HelpCircle, AlertTriangle, Percent, CheckCircle, LogIn, User, Sparkles, X, Package } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import type { Product } from '../store/cartStore';
import { venezuelaData } from '../data/venezuela';
import { getAgenciesForCity } from '../data/agencies';
import mrwData from '../data/agenciasMrw2.json';
import zoomData from '../data/zoom_venezuela_filtrado.json';
// driver.js import moved to dynamic import to avoid SSR issues
import "driver.js/dist/driver.css";
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { useAlertStore } from '../store/alertStore';
import { loginAnonymously, loginWithGoogle, logout, syncUserProfile } from '../lib/auth-service';
import { requestNotificationPermission } from '../lib/notification-service';
import { getMessagingInstance } from '../lib/firebase';
import { Bell } from 'lucide-react';
import { CustomSelect } from './ui/CustomSelect';
import UserOrdersModal from './UserOrdersModal';
import resources from '../data/resources.json';
import appConfig from '../data/app-config.json';



// Assuming data is passed as props
interface Props {
    data: any;
}

export default function OrderFlow({ data }: Props) {
    const { items, addToCart, removeFromCart, updateQuantity } = useCartStore();
    const { user } = useAuthStore();
    const [step, setStep] = useState(1);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showOrdersModal, setShowOrdersModal] = useState(false);

    const [selectedState, setSelectedState] = useState('');
    // const [selectedCity, setSelectedCity] = useState(''); // Removed as per new requirement
    const [shippingMethod, setShippingMethod] = useState('');
    const [selectedAgency, setSelectedAgency] = useState('');
    const [userName, setUserName] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [userCedula, setUserCedula] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [address, setAddress] = useState('');

    // Recipient Info (if different from customer)
    const [isGift, setIsGift] = useState(false);
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [recipientCedula, setRecipientCedula] = useState('');
    // Initial State - Set Zelle as default
    const [paymentBank, setPaymentBank] = useState('Zelle');
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentId, setPaymentId] = useState('');
    const [paymentPhone, setPaymentPhone] = useState('');
    const [paymentSourceBank, setPaymentSourceBank] = useState('');

    // Zelle-specific verification
    const [zelleEmail, setZelleEmail] = useState('');
    const [zelleSenderName, setZelleSenderName] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    // Currency Exchange State
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [totalInBs, setTotalInBs] = useState<number>(0);
    const [rateLoading, setRateLoading] = useState(false);

    const [stocks, setStocks] = useState<Record<string, number>>({});
    const [productConfig, setProductConfig] = useState<Record<string, { enabled: boolean, price?: number, deliveryCost?: number }>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dynamicSettings, setDynamicSettings] = useState<any>(null);
    const [hasMessaging, setHasMessaging] = useState(!!getMessagingInstance());
    const [gridCols, setGridCols] = useState(2);
    const [productsLoaded, setProductsLoaded] = useState(false);

    // Custom style classes
    const inputClass = "w-full px-4 py-3 rounded-xl border-2 border-[#F2A900]/30 focus:border-[#F2A900] bg-white outline-none transition-all text-[#3E2723] placeholder:text-gray-400 font-medium disabled:opacity-70 disabled:bg-gray-50";
    const labelClass = "block text-[#3E2723] font-bold mb-2 ml-1";

    useEffect(() => {
        const updateGridCols = () => {
            const width = window.innerWidth;
            if (width >= 1280) setGridCols(4); // xl
            else if (width >= 1024) setGridCols(3); // lg
            else if (width >= 768) setGridCols(4); // md
            else if (width >= 640) setGridCols(3); // sm
            else setGridCols(2); // default
        };

        updateGridCols();
        window.addEventListener('resize', updateGridCols);
        return () => window.removeEventListener('resize', updateGridCols);
    }, []);

    useEffect(() => {
        // Update messaging presence if it loads after mount
        if (!hasMessaging) {
            const checkMessaging = setInterval(() => {
                const instance = getMessagingInstance();
                if (instance) {
                    setHasMessaging(true);
                    clearInterval(checkMessaging);
                }
            }, 1000);
            return () => clearInterval(checkMessaging);
        }
    }, [hasMessaging]);

    useEffect(() => {
        // Listen to live stock
        if (!db) {
            console.warn("Firestore 'db' is not initialized. Stock updates disabled.");
            return;
        }

        const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
            const stockMap: Record<string, number> = {};
            const configMap: Record<string, { enabled: boolean, price?: number, deliveryCost?: number }> = {};

            snapshot.forEach(doc => {
                const d = doc.data();
                stockMap[doc.id] = d.stock || 0;
                configMap[doc.id] = {
                    enabled: d.enabled !== false, // Default to true
                    price: d.price, // Optional price override
                    deliveryCost: d.deliveryCost || 0
                };
            });
            setStocks(stockMap);
            setProductConfig(configMap);
            setProductsLoaded(true);
        });

        // Listen to live settings
        const unsubSettings = onSnapshot(doc(db, "settings", "global"), (doc) => {
            if (doc.exists()) {
                setDynamicSettings(doc.data());
            }
        });

        return () => {
            unsubProducts();
            unsubSettings();
        };
    }, []);

    // ... (rest of the code)

    // Derived state with dynamic pricing
    const cartItemsWithDynamicPrice = items.map(item => {
        const config = productConfig[item.id];
        const basePrice = config?.price ?? item.price;
        const deliveryCost = config?.deliveryCost || 0;
        return {
            ...item,
            price: basePrice + deliveryCost
        };
    });

    const totalItems = cartItemsWithDynamicPrice.reduce((acc, item) => acc + item.quantity, 0);
    const baseSubtotal = cartItemsWithDynamicPrice.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    useEffect(() => {
        if (user && !user.isAnonymous) {

            // Prioritize user profile data if local state is empty
            if (user.name && !userName) {
                setUserName(user.name);
            }
            if (user.phone && !userPhone) {
                setUserPhone(user.phone);
            }
            if (user.cedula && !userCedula) {
                setUserCedula(user.cedula);
            }
            if (user.email && !userEmail) {
                setUserEmail(user.email);
            }
        }
    }, [user, userName, userPhone, userCedula, userEmail]);

    // Auto-fill address when agency changes (MRW)
    // Auto-fill address when agency changes (MRW)
    // Auto-fill address when agency changes (MRW)
    useEffect(() => {
        if (shippingMethod === 'MRW' && selectedAgency) {
            const agency = (mrwData as any[]).find(a => a.codigo === selectedAgency);

            if (agency) {
                // Format: Agencia MRW CODE - NAME \n ADDRESS \n STATE
                const newAddress = `Agencia MRW ${agency.codigo} - ${agency.nombre}\n${agency.direccion}\n${agency.estado}`;
                setAddress(newAddress);
            }
        }
    }, [selectedAgency, shippingMethod]);

    // Calculate available agencies based on state and method
    const availableAgencies = useMemo(() => {
        if (!selectedState || !shippingMethod) return [];

        const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const targetState = normalize(selectedState);

        if (shippingMethod === 'MRW') {
            return (mrwData as any[]).filter(agency =>
                normalize(agency.estado) === targetState
            );
        } else if (shippingMethod === 'Zoom') {
            return (zoomData as any[]).filter(agency =>
                normalize(agency.estado) === targetState
            );
        }
        return [];
    }, [selectedState, shippingMethod]);

    // Calculate volume discount
    // Calculate volume discount per item
    const getDiscountForItem = (quantity: number) => {
        if (!dynamicSettings?.discounts) return 0;
        // User requested "6 o mas" (6 or more)
        if (quantity >= 6) {
            return dynamicSettings.discounts.tier1;
        }
        return 0;
    };

    const discountAmount = cartItemsWithDynamicPrice.reduce((acc, item) => {
        const percent = getDiscountForItem(item.quantity);
        return acc + (item.price * item.quantity * (percent / 100));
    }, 0);
    const subtotal = baseSubtotal - discountAmount;
    const shippingCost = 0;
    const total = subtotal;

    // Scroll to section on step change (if not handled by explicit click)
    useEffect(() => {
        if (step === 1) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const targetId = step === 2 ? 'step-shipping' : 'step-payment';
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [step]);

    // Fetch Exchange Rate
    useEffect(() => {
        const fetchRate = async () => {
            setRateLoading(true);
            try {
                const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
                const data = await response.json();
                if (data && data.promedio) {
                    setExchangeRate(data.promedio);
                }
            } catch (error) {
                console.error("Error fetching exchange rate:", error);
            } finally {
                setRateLoading(false);
            }
        };

        fetchRate();
    }, []);

    // Calculate Total in Bs
    useEffect(() => {
        if (exchangeRate && total) {
            setTotalInBs(total * exchangeRate);
        }
    }, [total, exchangeRate]);

    const startTour = async () => {
        // Dynamically import driver.js to avoid SSR 'window is not defined' error
        const { driver } = await import("driver.js");

        const wrapDesc = (textValue: string, imgNum: number) => `
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px;">
                <img src="${(resources.recursos as any)[`r${imgNum}`]}" style="width: 100px; height: auto; margin-bottom: 5px;" class="animate-bounce-slow" />
                <span style="font-size: 15px; line-height: 1.5; font-weight: 500; color: #3E2723;">${textValue}</span>
            </div>
        `;

        const driverObj = driver({
            showProgress: true,
            animate: true,
            popoverClass: "driverjs-theme font-sans",
            onHighlightStarted: () => {
                document.body.style.overflow = 'hidden';
            },
            onDestroyed: () => {
                document.body.style.overflow = 'auto';
            },
            steps: [
                {
                    element: '#step-products',
                    popover: {
                        title: '<span style="color:#D91A2A; font-weight:800; font-size:18px;">1. Elige tu Antojo</span>',
                        description: wrapDesc('Explora nuestra selección de gomitas y agrega las que más te gusten a tu carrito.', 12)
                    }
                },
                ...(cartItemsWithDynamicPrice.length > 0 ? [{
                    element: window.innerWidth < 1024 ? '#cart-summary-mobile' : '#cart-summary-desktop',
                    popover: {
                        title: '<span style="color:#D91A2A; font-weight:800; font-size:18px;">Resumen del Pedido</span>',
                        description: wrapDesc('Aquí puedes ver el detalle de lo que llevas y el total a pagar.', 13)
                    }
                }] : []),
                {
                    element: '#step-shipping',
                    popover: {
                        title: '<span style="color:#D91A2A; font-weight:800; font-size:18px;">2. Envío</span>',
                        description: wrapDesc('Ingresa tus datos de envío, selecciona tu estado/ciudad y elige tu agencia de preferencia.', 14)
                    }
                },
                {
                    element: '#step-payment',
                    popover: {
                        title: '<span style="color:#D91A2A; font-weight:800; font-size:18px;">3. Pago y Confirmación</span>',
                        description: wrapDesc('Realiza el pago móvil y confirma tu pedido. ¡Te redirigiremos a WhatsApp para finalizar!', 15)
                    }
                },
            ],
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: '¡Entendido!',
        });
        driverObj.drive();
    };

    const handleConfirmOrder = () => {
        // Validation check for all required fields
        const missingFields: string[] = [];

        // Customer Info
        if (!userName) missingFields.push("Tu Nombre");
        if (!userPhone) missingFields.push("Tu WhatsApp");
        if (!userCedula) missingFields.push("Cédula");
        if (!userEmail) missingFields.push("Tu Correo");

        // Recipient Info (if gift)
        if (isGift) {
            if (!recipientName) missingFields.push("Nombre de quien recibe");
            if (!recipientPhone) missingFields.push("WhatsApp de quien recibe");
            if (!recipientCedula) missingFields.push("Cédula de quien recibe");
        }

        // Shipping Info
        if (!selectedState) missingFields.push("Estado de Envío");

        if (shippingMethod !== 'retiro' && !selectedAgency) missingFields.push("Agencia de Envío");

        // Payment Info (Specific to method)
        if (paymentBank === 'Zelle') {
            if (!zelleEmail) missingFields.push("Correo de quien pagó");
            if (!zelleSenderName) missingFields.push("Nombre de quien pagó");
            if (!paymentId) missingFields.push("Cédula");
        } else {
            // Default to Pago Movil or general
            if (!paymentBank) missingFields.push("Método de Pago");
            if (paymentBank === 'Pago Móvil') {
                if (!paymentReference) missingFields.push("Referencia de Pago");
                if (!paymentId) missingFields.push("Cédula del Pagador");
                if (!paymentPhone) missingFields.push("Teléfono de Pago");
            }
        }

        if (cartItemsWithDynamicPrice.length === 0) missingFields.push("Al menos un producto");

        if (missingFields.length > 0) {
            useAlertStore.getState().showAlert(
                "Información Faltante",
                `Por favor completa los siguientes campos: ${missingFields.join(', ')}`,
                "warning"
            );
            return;
        }

        if (!acceptedTerms) {
            useAlertStore.getState().showAlert(
                "Términos incompletos",
                "Debes aceptar los términos y condiciones para continuar.",
                "error"
            );
            return;
        }

        // Clean number for link (remove spaces, symbols)
        const businessPhone = appConfig.contact.whatsapp.replace(/\D/g, '');

        let message = `*NUEVO PEDIDO - NATHIKAS*\n\n`;
        message += `👤 *Comprador:* ${userName}\n`;
        message += `🪪 *Cédula:* ${userCedula}\n`;
        message += `📞 *WhatsApp:* ${userPhone}\n`;

        if (isGift) {
            message += `\n🎁 *RECEPTOR (REGALO):*\n`;
            message += `- Nombre: ${recipientName}\n`;
            message += `- Cédula: ${recipientCedula}\n`;
            message += `- WhatsApp: ${recipientPhone}\n`;
        }

        message += `\n`;

        message += `📦 *PRODUCTOS:*\n`;
        cartItemsWithDynamicPrice.forEach(item => {
            message += `- ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
        });
        message += `\n💰 *Total:* $${subtotal.toFixed(2)}\n\n`;

        message += `📍 *ENVÍO:*\n`;
        message += `- Estado: ${selectedState}\n`;

        message += `- Método: ${shippingMethod}\n`;
        if (selectedAgency) {
            const agency = availableAgencies.find((a: any) => a.codigo === selectedAgency);
            message += `- Agencia: ${agency?.nombre || selectedAgency}\n`;
        }
        if (address) {
            message += `- Dirección: ${address}\n`;
        }

        message += `\n💳 *DATOS DE PAGO:*\n`;
        message += `- Método: ${paymentBank}\n`;
        if (paymentBank === 'Zelle') {
            message += `- Correo: ${zelleEmail}\n`;
            message += `- Nombre: ${zelleSenderName}\n`;
            message += `- Cédula: ${paymentId}\n`;
        } else {
            message += `- Ref: ${paymentReference}\n`;
            message += `- Cédula: ${paymentId}\n`;
            message += `- Banco: ${paymentSourceBank}\n`;
            message += `- Tel Pago: ${paymentPhone}\n`;
        }

        const encodedMessage = encodeURIComponent(message);

        // SAVE TO FIREBASE
        const saveOrder = async () => {
            setIsSubmitting(true);
            try {
                // 1. Asegurar Autenticación (Anónima)
                let currentUser = useAuthStore.getState().user;
                if (!currentUser) {

                    const anonUser = await loginAnonymously();
                    if (!anonUser) throw new Error("No se pudo crear sesión anónima");
                    currentUser = { uid: anonUser.uid, email: null, role: null };
                }

                // 2. Determinar si hay ítems sin stock (backorders)
                const backorders = cartItemsWithDynamicPrice.filter(item => (stocks[item.id] || 0) < item.quantity);
                const isBackorder = backorders.length > 0;

                const batch = writeBatch(db);

                // Deduct stock (solo lo que haya disponible, no ir a negativo)
                cartItemsWithDynamicPrice.forEach(item => {
                    const available = stocks[item.id] || 0;
                    const toDeduct = Math.min(available, item.quantity);
                    if (toDeduct > 0) {
                        const productRef = doc(db, "products", item.id);
                        batch.update(productRef, {
                            stock: available - toDeduct
                        });
                    }
                });

                // Save order
                const orderData = {
                    customerId: currentUser.uid,
                    userName,
                    userPhone,
                    userCedula,
                    userEmail,
                    isGift,
                    recipient: isGift ? {
                        name: recipientName,
                        phone: recipientPhone,
                        cedula: recipientCedula
                    } : null,
                    items: cartItemsWithDynamicPrice.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
                    subtotal,
                    total,
                    selectedState,

                    shippingMethod,
                    selectedAgency,
                    paymentBank,
                    paymentSourceBank,
                    paymentReference,
                    paymentId,
                    paymentPhone,
                    zelleEmail,
                    zelleSenderName,
                    status: 'pendiente',
                    isBackorder,
                    createdAt: serverTimestamp()
                };

                const orderRef = await addDoc(collection(db, "orders"), orderData);

                // 3. Si hay backorders, registrarlos en la entidad de producción
                if (isBackorder) {
                    for (const item of backorders) {
                        const available = stocks[item.id] || 0;
                        const needed = item.quantity - available;

                        await addDoc(collection(db, "production_needs"), {
                            orderId: orderRef.id,
                            productId: item.id,
                            productName: item.name,
                            quantityNeeded: needed,
                            status: 'pendiente',
                            createdAt: serverTimestamp()
                        });
                    }
                }

                await batch.commit();

                // 4. Preparar mensaje de WhatsApp con aviso de backorder
                if (isBackorder) {
                    message += `\n⚠️ *AVISO DE PRODUCCIÓN:*\nEste pedido incluye productos en producción. Será atendido en las próximas 24-48 horas.`;
                }
                const encodedMessage = encodeURIComponent(message);

                // 4. Send Confirmation Email (Non-blocking)
                if (userEmail) {
                    fetch('/.netlify/functions/notifications', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: userEmail,
                            userName: userName,
                            orderId: orderRef.id,
                            customerId: currentUser.uid,
                            status: 'pendiente'
                        })
                    }).catch(err => console.error("Failed to trigger notification:", err));
                }

                // 5. Cleanup and Success Message
                useAlertStore.getState().showAlert(
                    "¡Pedido enviado!",
                    "Tu pedido ha sido registrado con éxito. Serás redirigido a WhatsApp en unos segundos para finalizar.",
                    "success"
                );
                setShowSuccess(true);

                // 6. Open WhatsApp (Delayed)
                setTimeout(() => {
                    window.open(`https://wa.me/${businessPhone}?text=${encodedMessage}`, '_blank');
                }, 3000);

                // Si ya está logueado (no anónimo), sincronizamos perfil por si cambió algo
                // Nota: Solo sincronizamos los datos del COMPRADOR, no los del receptor.
                if (user && !user.isAnonymous) {
                    syncUserProfile(user.uid, {
                        name: userName,
                        phone: userPhone,
                        cedula: userCedula,
                        email: userEmail
                    });
                }
            } catch (err) {
                console.error("Error saving order:", err);
                useAlertStore.getState().showAlert(
                    "¡Ups! Algo salió mal",
                    "Hubo un problema al procesar tu pedido. Es posible que necesites revisar tu conexión o los permisos de Firebase.",
                    "error"
                );
            } finally {
                setIsSubmitting(false);
            }
        };

        saveOrder();
    };

    const handleAuthClick = () => {
        if (user && !user.isAnonymous) {
            logout();
        } else {
            // If anonymous or not logged in at all, try google login
            handleGoogleLogin();
        }
    };

    const handleGoogleLogin = async () => {
        setIsSubmitting(true);
        try {
            const googleUser = await loginWithGoogle();
            if (googleUser) {
                // Determine what to sync: only non-empty fields from the current form
                const dataToSync: any = {
                    email: googleUser.email
                };
                if (userName) dataToSync.name = userName;
                if (userPhone) dataToSync.phone = userPhone;
                if (userCedula) dataToSync.cedula = userCedula;

                await syncUserProfile(googleUser.uid, dataToSync);

                useAlertStore.getState().showAlert(
                    "¡Bienvenido de nuevo!",
                    "Tu sesión se ha iniciado correctamente.",
                    "success"
                );

                // Only redirect if we are in the success/post-order flow (linking account)
                if (showSuccess) {
                    setTimeout(() => {
                        window.location.href = '/shop';
                    }, 1500);
                }
                // If logging in from header/normal flow, we verify if we need to auto-fill immediately
                // The useEffect [user] will handle the auto-fill naturally as 'user' updates
            }
        } catch (err) {
            console.error("Error linking google profile:", err);
            useAlertStore.getState().showAlert(
                "Error al iniciar sesión",
                "No pudimos conectar con Google. Por favor intenta de nuevo.",
                "error"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetFlow = () => {
        // Clear cart globally
        useCartStore.getState().clearCart();

        setStep(1);
        setShowSuccess(false);

        // Reset states only if not a permanent user
        if (!user || user.isAnonymous) {
            setUserName('');
            setUserPhone('');
            setUserCedula('');
            setUserEmail('');
        }

        setIsGift(false);
        setRecipientName('');
        setRecipientPhone('');
        setRecipientCedula('');

        setPaymentBank('');
        setPaymentReference('');
        setPaymentId('');
        setPaymentPhone('');
        setPaymentSourceBank('');
        setZelleEmail('');
        setZelleSenderName('');
    };



    useEffect(() => {
        // Function to initiate tour safely
        const initiateTour = () => {
            // Short delay to ensure sections are rendered and visual stability
            setTimeout(() => {
                // Check if user is logged in (not anonymous) to skip tour
                const currentUser = useAuthStore.getState().user;
                if (currentUser && !currentUser.isAnonymous) {
                    return;
                }
                startTour();
            }, 800);
        };

        const hasSeenLoading = sessionStorage.getItem('hasSeenLoadingScreen');
        if (hasSeenLoading) {
            initiateTour();
        } else {
            // Wait for loading screen to finish
            const handleLoadingComplete = () => {
                initiateTour();
                window.removeEventListener('loading-completed', handleLoadingComplete);
            };
            window.addEventListener('loading-completed', handleLoadingComplete);

            return () => {
                window.removeEventListener('loading-completed', handleLoadingComplete);
            };
        }
    }, []);

    return (
        <div className="min-h-screen bg-[#FDF6E3] font-sans text-[#3E2723] pb-20 relative">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#FDF6E3]/95 backdrop-blur-sm shadow-sm border-b-4 border-[#F2A900] px-4 py-3 flex items-center justify-between gap-4">
                <a href="/" className="flex items-center gap-2 shrink-0">
                    <ArrowLeft size={24} className="text-[#D91A2A]" />
                    <span className="font-bold text-[#D91A2A] hidden sm:inline">Volver</span>
                </a>

                <div className="flex items-center gap-2 flex-grow justify-center">
                    <img src={resources.logo} alt="Nathikas Logo" className="h-8 w-auto" />
                </div>
                <div className="flex items-center gap-3">
                    {/* Notification Request Button */}
                    {hasMessaging && typeof window !== 'undefined' && Notification.permission !== 'granted' && user && (
                        <button
                            onClick={() => user.uid && requestNotificationPermission(user.uid)}
                            className="w-10 h-10 flex items-center justify-center text-[#F2A900] hover:bg-[#FDF6E3] hover:shadow-md rounded-full transition-all"
                            title="Activar Notificaciones"
                        >
                            <Bell size={24} className="animate-pulse" />
                        </button>
                    )}

                    {/* User Orders Button */}
                    {user && !user.isAnonymous && (
                        <button
                            onClick={() => setShowOrdersModal(true)}
                            className="bg-white/50 hover:bg-white text-[#D91A2A] w-10 h-10 md:w-auto md:px-4 md:h-10 rounded-full font-bold text-xs md:text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                            title="Mis Pedidos"
                        >
                            <Package size={20} />
                            <span className="hidden md:inline">Mis Pedidos</span>
                        </button>
                    )}

                    {/* Auth Status / Login Trigger */}
                    <button
                        onClick={handleAuthClick}
                        className="relative group overflow-hidden bg-[#D91A2A] hover:bg-[#B71523] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-xs md:text-sm shadow-md transition-all flex items-center gap-2"
                        title={user && !user.isAnonymous ? "Cerrar sesión" : "Iniciar sesión"}
                    >
                        {user && !user.isAnonymous ? (
                            <>
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                    <User size={12} />
                                </div>
                                <span className="hidden sm:inline">{user.name?.split(' ')[0]}</span>
                            </>
                        ) : (
                            <>
                                <User size={16} className="text-white" />
                                <span className="hidden sm:inline">Entrar</span>
                            </>
                        )}
                    </button>
                    <button onClick={startTour} className="w-10 h-10 flex items-center justify-center text-[#D91A2A] hover:bg-white hover:shadow-md rounded-full transition-all" title="Ver Tutorial">
                        <HelpCircle size={24} />
                    </button>
                </div>
            </header>

            <UserOrdersModal
                isOpen={showOrdersModal}
                onClose={() => setShowOrdersModal(false)}
            />

            <main className="container mx-auto max-w-7xl px-4 pt-8 pb-12">
                <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-12 items-start">
                    <div className="space-y-8">

                        {showSuccess ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6 border-4 border-[#F2A900]"
                            >
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={48} strokeWidth={3} />
                                </div>

                                <h2 className="text-3xl font-heading font-bold text-[#3E2723]">¡PEDIDO REALIZADO!</h2>
                                <p className="text-gray-600">
                                    Gracias por elegir **Nathikas**. Tu pedido ha sido registrado y en breve recibirás noticias por WhatsApp.
                                </p>

                                {/* Notification Prompt for Customers */}
                                {hasMessaging && typeof window !== 'undefined' && Notification.permission !== 'granted' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-[#D91A2A]/5 p-6 rounded-2xl border-2 border-[#D91A2A]/20 space-y-4"
                                    >
                                        <div className="flex items-center justify-center gap-3 text-[#D91A2A]">
                                            <Bell className="animate-bounce" size={24} />
                                            <h3 className="font-bold text-lg">¿Avisarte por aquí?</h3>
                                        </div>
                                        <p className="text-xs text-gray-600 font-medium">
                                            Activa las notificaciones para saber al instante cuando tu pago sea validado y cuando tus gomitas vayan en camino.
                                        </p>
                                        <button
                                            onClick={() => user?.uid && requestNotificationPermission(user.uid)}
                                            className="w-full bg-[#3E2723] text-white py-3 rounded-xl font-bold hover:bg-[#2D1C1A] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <Bell size={18} />
                                            ACTIVAR NOTIFICACIONES
                                        </button>
                                    </motion.div>
                                )}

                                {!user || user.isAnonymous ? (
                                    <div className="bg-[#FDF6E3] p-6 rounded-2xl border-2 border-dashed border-[#F2A900] space-y-4">
                                        <h3 className="font-bold text-[#D91A2A] text-lg">¿Quieres guardar tus datos?</h3>
                                        <p className="text-xs text-gray-500">
                                            Vincula tu cuenta con Google para que en tu próxima compra tus datos (Cédula, nombre y teléfono) se carguen automáticamente.
                                        </p>
                                        <button
                                            onClick={handleGoogleLogin}
                                            disabled={isSubmitting}
                                            className="w-full bg-white border-2 border-gray-200 py-3 rounded-xl flex items-center justify-center gap-3 font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                                <>
                                                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                                                    <span>Vincular con Google</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                        <p className="text-green-800 text-sm font-bold">✓ Datos sincronizados con tu cuenta</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => window.location.href = '/shop'}
                                    className="w-full bg-[#D91A2A] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#B71524] transition-all"
                                >
                                    <span>VOLVER A LA TIENDA</span>
                                    <ArrowRight size={20} />
                                </button>
                            </motion.div>
                        ) : (
                            <>
                                {/* Step 1: Elige tu Antojo */}
                                <section className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border-4 border-[#F2A900] scroll-mt-24" id="step-products">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="bg-[#F2A900] text-[#3E2723] w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl font-heading shadow-lg border-2 border-white shrink-0">1</div>
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-bold font-heading text-[#D91A2A]">ELIGE TU ANTOJO</h2>
                                            <p className="text-gray-500 text-sm">Selecciona las gomitas que más te gusten</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                        {!productsLoaded ? (
                                            // Loading Skeletons
                                            Array.from({ length: 8 }).map((_, i) => (
                                                <div
                                                    key={`skeleton-${i}`}
                                                    className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 flex flex-col h-full animate-pulse"
                                                >
                                                    <div className="aspect-square bg-gray-100 rounded-t-2xl relative overflow-hidden">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                                                    </div>
                                                    <div className="p-4 flex-grow flex flex-col gap-3">
                                                        <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto"></div>
                                                        <div className="h-3 bg-gray-100 rounded w-full"></div>
                                                        <div className="h-8 bg-gray-100 rounded w-1/2 mx-auto mt-auto"></div>
                                                        <div className="h-10 bg-gray-100 rounded-xl w-full mt-2"></div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            data.products
                                                .filter((p: Product) => {
                                                    // Only show if enabled in Firestore (or if config doesn't exist yet, we default to show)
                                                    // This is safe now because productsLoaded=true ensures we have the config
                                                    const config = productConfig[p.id];
                                                    return config ? config.enabled : true;
                                                })
                                                .map((product: Product) => {
                                                    const config = productConfig[product.id];
                                                    // Use dynamic price if available
                                                    const basePrice = config?.price ?? product.price;
                                                    const deliveryCost = config?.deliveryCost || 0;
                                                    const displayPrice = basePrice + deliveryCost;

                                                    const inCart = items.find(i => i.id === product.id);
                                                    return (
                                                        <motion.div
                                                            key={product.id}
                                                            className={`bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all border-2 flex flex-col group cursor-pointer ${inCart ? 'border-[#F2A900]' : 'border-gray-100 hover:border-[#F2A900]'}`}
                                                            whileHover={{ y: -5 }}
                                                            onClick={() => addToCart(product, 1)}
                                                        >
                                                            <div className="aspect-square bg-[#FDF6E3]/30 flex items-center justify-center p-3 relative overflow-hidden rounded-t-2xl">
                                                                <img
                                                                    src={product.image}
                                                                    alt={product.name}
                                                                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                                                                />
                                                                {inCart && (
                                                                    <div className="absolute top-2 right-2 bg-[#D91A2A] text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-lg border-2 border-white animate-bounce-in">
                                                                        {inCart.quantity}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="p-3 md:p-4 text-center flex-grow flex flex-col justify-between gap-2">
                                                                <div>
                                                                    <h3 className="font-bold text-xs md:text-sm leading-tight text-[#3E2723] line-clamp-2 h-10 flex items-center justify-center">{product.name}</h3>
                                                                    {product.description && (
                                                                        <p className="text-gray-500 text-xs leading-relaxed px-2 mb-2">{product.description}</p>
                                                                    )}
                                                                    <p className="text-[#D91A2A] font-bold text-lg md:text-xl mt-1">${displayPrice.toFixed(2)}</p>
                                                                </div>

                                                                {inCart ? (
                                                                    <div className="flex flex-col gap-2 mt-auto">
                                                                        <div className="flex items-center justify-between gap-1 bg-[#FDF6E3] rounded-full p-1 border-2 border-[#F2A900] text-black w-full overflow-hidden">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, Math.max(0, inCart.quantity - 1)); }}
                                                                                className="w-8 h-8 shrink-0 flex items-center justify-center bg-white rounded-full text-[#D91A2A] shadow-sm hover:bg-red-50 transition-colors"
                                                                            >
                                                                                <Minus size={14} />
                                                                            </button>
                                                                            <span className="font-bold text-sm min-w-[20px]">{inCart.quantity}</span>
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, inCart.quantity + 1); }}
                                                                                className="w-8 h-8 shrink-0 flex items-center justify-center bg-[#F2A900] text-[#3E2723] rounded-full shadow-sm hover:bg-[#d99700] transition-colors"
                                                                            >
                                                                                <Plus size={14} />
                                                                            </button>
                                                                        </div>
                                                                        {(stocks[product.id] || 0) < inCart.quantity && (
                                                                            <div className="text-[10px] text-[#D91A2A] font-bold leading-tight bg-red-50 p-2 rounded-lg border border-red-100 italic">
                                                                                Produciendo más unidades...
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}
                                                                        className="w-full py-2.5 rounded-xl font-bold text-sm shadow-md mt-auto transition-all bg-[#D91A2A] text-white hover:bg-[#B71524] hover:shadow-lg active:scale-95"
                                                                    >
                                                                        {(stocks[product.id] || 0) <= 0 ? 'PEDIR (EN PROD.)' : 'AGREGAR'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })
                                        )
                                        }

                                        {/* Dynamic Placeholders to fill grid gaps */}
                                        {(() => {
                                            const visibleProducts = data.products.filter((p: Product) => {
                                                const config = productConfig[p.id];
                                                return config ? config.enabled : true;
                                            }).length;
                                            const placeholdersNeeded = (gridCols - (visibleProducts % gridCols)) % gridCols;

                                            return Array.from({ length: placeholdersNeeded }).map((_, i) => (
                                                <div
                                                    key={`placeholder-${i}`}
                                                    className="bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-6 text-center group grayscale opacity-60 min-h-[280px] md:min-h-[320px] transition-all"
                                                >
                                                    <div className="w-20 h-20 mb-4 group-hover:scale-110 transition-transform duration-500 flex items-center justify-center bg-white/50 rounded-full p-4 border-2 border-gray-100">
                                                        <img
                                                            src="/images/logo.webp"
                                                            alt="Nathikas Logo"
                                                            className="w-full h-full object-contain mix-blend-luminosity opacity-40"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block">Próximamente</span>
                                                        <h3 className="text-sm font-bold text-gray-400">NUEVO ANTOJO</h3>
                                                    </div>
                                                    <div className="mt-8 w-full max-w-[120px] h-9 bg-gray-100/80 rounded-xl" />
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </section>

                                {/* Cart Summary (Visible on mobile or when items change) */}
                                <AnimatePresence>
                                    {cartItemsWithDynamicPrice.length > 0 && (
                                        <motion.section
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="bg-white rounded-3xl shadow-xl border-4 border-[#F2A900] p-6 lg:hidden overflow-hidden"
                                            id="cart-summary-mobile"
                                        >
                                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                                <ShoppingCart className="text-[#D91A2A]" size={20} />
                                                Resumen del Pedido
                                            </h3>
                                            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                {cartItemsWithDynamicPrice.map((item) => (
                                                    <div key={item.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold">{item.name}</p>
                                                                <p className="text-gray-500">${item.price} x {item.quantity}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex flex-col items-end">
                                                                {getDiscountForItem(item.quantity) > 0 ? (
                                                                    <>
                                                                        <span className="text-xs text-gray-400 line-through">${(item.price * item.quantity).toFixed(2)}</span>
                                                                        <span className="font-bold text-green-600">
                                                                            ${((item.price * item.quantity) * (1 - getDiscountForItem(item.quantity) / 100)).toFixed(2)}
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <span className="font-bold text-[#D91A2A]">${(item.price * item.quantity).toFixed(2)}</span>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => removeFromCart(item.id)}
                                                                className="text-gray-400 hover:text-[#D91A2A]"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="space-y-2 border-t border-gray-100 pt-4">
                                                <div className="flex justify-between items-center text-sm text-gray-500">
                                                    <span>Subtotal:</span>
                                                    <span>${baseSubtotal.toFixed(2)}</span>
                                                </div>
                                                {discountAmount > 0 && (
                                                    <div className="flex justify-between items-center text-sm text-green-600 font-bold">
                                                        <div className="flex items-center gap-1">
                                                            <Percent size={14} />
                                                            <span>Descuento por Volumen:</span>
                                                        </div>
                                                        <span>-${discountAmount.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center font-bold text-xl text-[#D91A2A]">
                                                    <span>Total:</span>
                                                    <span>${subtotal.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </motion.section>
                                    )}
                                </AnimatePresence>

                                {/* Step 2: ¿A Dónde lo Enviamos? */}
                                <section className={`transition-opacity duration-500 bg-white rounded-3xl shadow-xl p-6 md:p-8 border-4 border-[#F2A900] scroll-mt-24 ${items.length === 0 ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`} id="step-shipping">
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 flex items-start gap-3">
                                        <div className="bg-blue-100 p-1.5 rounded-full shrink-0 mt-0.5">
                                            <Sparkles size={16} className="text-blue-600" />
                                        </div>
                                        <p className="text-sm text-blue-800">
                                            <span className="font-bold">Tip:</span> Al finalizar tu compra podrás <span className="font-bold">iniciar sesión con Google</span> para que tus datos se guarden y tus próximos pedidos sean mucho más rápidos.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="bg-[#F2A900] text-[#3E2723] w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl font-heading shadow-lg border-2 border-white shrink-0">2</div>
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-bold font-heading text-[#D91A2A]">DATOS DE ENVÍO</h2>
                                            <p className="text-gray-500 text-sm">Completa la información para tu entrega</p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">

                                        {/* Name, Phone and Cedula */}
                                        {/* DEBUG BLOCK */}


                                        {/* User Data Recovery (Debug/Manual) */}
                                        {user && !user.isAnonymous && (
                                            <div className="mb-4 flex justify-end">
                                                <button
                                                    onClick={() => {
                                                        if (user.name) setUserName(user.name);
                                                        if (user.phone) setUserPhone(user.phone);
                                                        if (user.cedula) setUserCedula(user.cedula);
                                                        if (user.email) setUserEmail(user.email);
                                                    }}
                                                    className="text-xs font-bold text-[#D91A2A] underline hover:text-[#B71524] flex items-center gap-1 bg-[#FDF6E3] px-3 py-1 rounded-full border border-[#D91A2A]/20"
                                                >
                                                    <Sparkles size={12} />
                                                    Recuperar mis datos guardados
                                                </button>
                                            </div>
                                        )}

                                        {/* Name, Phone and Cedula Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold mb-1 text-gray-700">Nombre Completo</label>
                                                <input
                                                    type="text"
                                                    value={userName}
                                                    onChange={(e) => setUserName(e.target.value)}
                                                    className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 focus:outline-none focus:border-[#F2A900] transition-colors"
                                                    placeholder="Ej. Juan Pérez"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold mb-1 text-gray-700">Cédula</label>
                                                <input
                                                    type="text"
                                                    value={userCedula}
                                                    onChange={(e) => setUserCedula(e.target.value)}
                                                    className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 focus:outline-none focus:border-[#F2A900] transition-colors"
                                                    placeholder="V-12345678"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold mb-1 text-gray-700">WhatsApp</label>
                                                <input
                                                    type="tel"
                                                    value={userPhone}
                                                    onChange={(e) => setUserPhone(e.target.value)}
                                                    className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 focus:outline-none focus:border-[#F2A900] transition-colors"
                                                    placeholder="+58 412 1234567"
                                                />
                                            </div>
                                        </div>

                                        {/* Gift Toggle */}
                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsGift(!isGift)}
                                                className={`flex items-center gap-3 w-full p-4 rounded-xl border-2 transition-all ${isGift ? 'border-[#D91A2A] bg-[#D91A2A]/5' : 'border-gray-100 bg-gray-50'}`}
                                            >
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 ${isGift ? 'bg-[#D91A2A] border-[#D91A2A] text-white' : 'border-gray-300 bg-white'}`}>
                                                    {isGift && <CheckCircle size={14} strokeWidth={3} />}
                                                </div>
                                                <span className={`font-bold text-sm ${isGift ? 'text-[#D91A2A]' : 'text-gray-500'}`}>
                                                    🎁 ¿Este pedido es un regalo para alguien más?
                                                </span>
                                            </button>
                                        </div>

                                        {/* Recipient Fields (if gift) */}
                                        <AnimatePresence>
                                            {isGift && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="bg-[#FDF6E3] p-4 rounded-2xl border-2 border-[#F2A900]/30 space-y-4 mt-2">
                                                        <h4 className="text-xs font-bold text-[#D91A2A] uppercase flex items-center gap-2">
                                                            <ShoppingCart size={14} /> Datos de quien recibe
                                                        </h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-bold mb-1 text-gray-500 uppercase">Nombre del Receptor</label>
                                                                <input
                                                                    type="text"
                                                                    value={recipientName}
                                                                    onChange={(e) => setRecipientName(e.target.value)}
                                                                    className="w-full bg-white border-2 border-gray-100 rounded-lg p-2 text-sm focus:outline-none focus:border-[#F2A900]"
                                                                    placeholder="Ej. Maria Gomez"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold mb-1 text-gray-500 uppercase">WhatsApp del Receptor</label>
                                                                <input
                                                                    type="tel"
                                                                    value={recipientPhone}
                                                                    onChange={(e) => setRecipientPhone(e.target.value)}
                                                                    className="w-full bg-white border-2 border-gray-100 rounded-lg p-2 text-sm focus:outline-none focus:border-[#F2A900]"
                                                                    placeholder="+58 412..."
                                                                />
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <label className="block text-[10px] font-bold mb-1 text-gray-500 uppercase">Cédula del Receptor</label>
                                                                <input
                                                                    type="text"
                                                                    value={recipientCedula}
                                                                    onChange={(e) => setRecipientCedula(e.target.value)}
                                                                    className="w-full bg-white border-2 border-gray-100 rounded-lg p-2 text-sm focus:outline-none focus:border-[#F2A900]"
                                                                    placeholder="V-22..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Email field */}
                                        <div>
                                            <label className="block text-sm font-bold mb-1 text-gray-700">Correo Electrónico (para notificaciones)</label>
                                            <input
                                                type="email"
                                                value={userEmail}
                                                onChange={(e) => setUserEmail(e.target.value)}
                                                className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 focus:outline-none focus:border-[#F2A900] transition-colors"
                                                placeholder="tu@correo.com"
                                            />
                                        </div>

                                        {/* Shipping Method - First Step */}
                                        <div className="mb-6">
                                            <label className="block text-[#3E2723] font-bold mb-3 ml-1">Método de Envío</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    type="button"
                                                    className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${shippingMethod === 'MRW' ? 'border-[#D91A2A] bg-[#D91A2A]/10 text-[#D91A2A] shadow-md' : 'border-[#F2A900]/30 text-gray-400 hover:border-[#F2A900] bg-white'}`}
                                                    onClick={() => {
                                                        setShippingMethod('MRW');
                                                        setSelectedAgency('');
                                                        // Keep state/city if user switches method? Better reset to avoid confusion vs agency list match. 
                                                        // User flow implies strict steps. Let's keep distinct.
                                                        // Actually, sticking to strict funnel, maybe reset downstream.
                                                    }}
                                                >
                                                    MRW
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${shippingMethod === 'Zoom' ? 'border-[#007A33] bg-[#007A33]/10 text-[#007A33] shadow-md' : 'border-[#F2A900]/30 text-gray-400 hover:border-[#F2A900] bg-white'}`}
                                                    onClick={() => { setShippingMethod('Zoom'); setSelectedAgency(''); }}
                                                >
                                                    Zoom
                                                </button>
                                            </div>
                                        </div>

                                        {/* State Selection */}
                                        {shippingMethod && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="space-y-2"
                                            >
                                                <label className={labelClass}>Estado</label>
                                                <div className="relative">
                                                    <CustomSelect
                                                        options={venezuelaData.map(s => s.estado).sort().map(state => ({ value: state, label: state }))}
                                                        value={selectedState}
                                                        onChange={(val) => {
                                                            setSelectedState(val);
                                                            setSelectedAgency('');
                                                        }}
                                                        placeholder="Selecciona tu Estado"
                                                        searchPlaceholder="Buscar estado..."
                                                        emptyMessage="Estado no encontrado"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Agency Select - Shows after State */}
                                        {selectedState && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="space-y-2"
                                            >
                                                <label className={labelClass}>Agencia {shippingMethod}</label>
                                                <div className="relative">
                                                    <CustomSelect
                                                        options={availableAgencies.map((a: any) => ({
                                                            value: a.codigo,
                                                            label: `${a.codigo} - ${a.nombre} (${a.direccion.substring(0, 30)}...)`
                                                        }))}
                                                        value={selectedAgency}
                                                        onChange={(val) => {
                                                            setSelectedAgency(val);
                                                            const agency = availableAgencies.find((a: any) => a.codigo === val);
                                                            if (agency) {
                                                                setAddress(`${agency.nombre} - ${agency.direccion}`);
                                                            }
                                                        }}
                                                        placeholder="Selecciona la Agencia"
                                                        searchPlaceholder="Buscar agencia..."
                                                        emptyMessage="No hay agencias disponibles en esta zona"
                                                        disabled={availableAgencies.length === 0}
                                                    />
                                                </div>
                                                {availableAgencies.length === 0 && (
                                                    <p className="text-sm text-red-500 mt-1">
                                                        No encontramos agencias en este estado. Intenta otro.
                                                    </p>
                                                )}
                                            </motion.div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-bold mb-1 text-gray-700">Dirección Exacta</label>
                                            <textarea
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 focus:outline-none focus:border-[#F2A900] transition-colors h-24 resize-none"
                                                placeholder="Casa, Edificio, Punto de referencia..."
                                            ></textarea>
                                        </div>
                                    </div>
                                </section>

                                {/* Step 3: Pago Móvil */}
                                <section className={`transition-opacity duration-500 bg-white rounded-3xl shadow-xl p-6 md:p-8 border-4 border-[#F2A900] scroll-mt-24 ${items.length === 0 ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`} id="step-payment">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="bg-[#F2A900] text-[#3E2723] w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl font-heading shadow-lg border-2 border-white shrink-0">3</div>
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-bold font-heading text-[#D91A2A]">PAGO Y RECIBO</h2>
                                            <p className="text-gray-500 text-sm">Realiza tu pago y confirma tu pedido</p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl shadow-lg p-6 relative overflow-hidden">
                                        {/* Background Pattern */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F2A900]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                            <CreditCard className="text-[#D91A2A]" size={20} />
                                            {paymentBank || 'Pago Móvil'}
                                        </h3>

                                        {/* Payment Method Selector (Dynamic) */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            {dynamicSettings?.paymentMethods?.filter((m: any) => m.enabled).map((method: any) => (
                                                <button
                                                    key={method.id}
                                                    type="button"
                                                    className={`p-4 rounded-xl border-2 flex items-center justify-between font-bold transition-all ${paymentBank.toLowerCase().includes(method.name.toLowerCase()) ? 'border-[#D91A2A] bg-[#D91A2A]/5' : 'border-gray-100 hover:border-[#F2A900]'}`}
                                                    onClick={() => setPaymentBank(method.name)}
                                                >
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="text-sm">{method.name}</span>
                                                        {paymentBank.toLowerCase().includes(method.name.toLowerCase()) && (
                                                            <span className="text-[10px] bg-[#D91A2A] text-white px-2 py-0.5 rounded-full animate-pulse">SELECCIONADO</span>
                                                        )}
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentBank.toLowerCase().includes(method.name.toLowerCase()) ? 'bg-[#D91A2A] border-[#D91A2A] text-white rotate-0' : 'border-gray-300 text-transparent rotate-90'}`}>
                                                        <CheckCircle size={14} />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Dynamic Payment Instructions */}
                                        <div className="bg-[#FDF6E3] p-4 rounded-xl border border-[#F2A900]/30 mb-6 flex flex-col md:flex-row gap-6 items-center">
                                            <div className="flex-1 space-y-2 text-sm w-full">
                                                {(!paymentBank || paymentBank === 'Pago Móvil') ? (
                                                    <>
                                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-0.5 sm:gap-4">
                                                            <span className="text-gray-600 shrink-0 text-[10px] sm:text-xs">Banco:</span>
                                                            <span className="font-bold text-left sm:text-right break-words text-xs sm:text-sm">{dynamicSettings?.pagoMovil?.bank || data.payment.pagoMovil.bank}</span>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-0.5 sm:gap-4">
                                                            <span className="text-gray-600 shrink-0 text-[10px] sm:text-xs">Teléfono:</span>
                                                            <span className="font-bold text-left sm:text-right break-words text-xs sm:text-sm">{dynamicSettings?.pagoMovil?.phone || data.payment.pagoMovil.phone}</span>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-0.5 sm:gap-4">
                                                            <span className="text-gray-600 shrink-0 text-[10px] sm:text-xs">Cédula:</span>
                                                            <span className="font-bold text-left sm:text-right break-words text-xs sm:text-sm">{dynamicSettings?.pagoMovil?.id || data.payment.pagoMovil.id}</span>
                                                        </div>

                                                        <div className="mt-4 pt-4 border-t border-[#F2A900]/30">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-xs text-gray-600 font-bold uppercase">Tasa del día (BCV):</span>
                                                                <span className="text-xs font-bold text-[#D91A2A]">
                                                                    {rateLoading ? 'Cargando...' : exchangeRate ? `Bs. ${exchangeRate.toFixed(2)}` : 'No disponible'}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-[#F2A900]/50 shadow-sm">
                                                                <span className="text-sm font-bold text-[#3E2723]">Monto a pagar en Bolívares:</span>
                                                                <span className="text-lg font-bold text-[#D91A2A]">
                                                                    {rateLoading ? '...' : totalInBs > 0 ? `Bs. ${totalInBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '---'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : paymentBank === 'Zelle' ? (
                                                    <>
                                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-0.5 sm:gap-4">
                                                            <span className="text-gray-600 shrink-0 text-[10px] sm:text-xs">Nombre Titular:</span>
                                                            <span className="font-bold text-left sm:text-right break-words text-xs sm:text-sm">{dynamicSettings?.zelle?.name || 'Cargando...'}</span>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-0.5 sm:gap-4">
                                                            <span className="text-gray-600 shrink-0 text-[10px] sm:text-xs">Correo Electrónico:</span>
                                                            <span className="font-bold text-left sm:text-right break-all text-xs sm:text-sm">{dynamicSettings?.zelle?.email || 'Cargando...'}</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center py-4 text-gray-400">
                                                        Selecciona un método para ver los detalles.
                                                    </div>
                                                )}
                                            </div>
                                            {(!paymentBank || paymentBank === 'Pago Móvil') && (
                                                <div className="w-24 h-24 bg-white p-2 rounded-lg shadow-sm shrink-0">
                                                    {/* QR Code Image */}
                                                    <img
                                                        src={appConfig.payment.qrImage}
                                                        alt="QR Pago Móvil"
                                                        className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                                                        onClick={() => window.open(appConfig.payment.qrImage, '_blank')}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            (e.target as HTMLImageElement).parentElement!.innerText = 'QR no disponible';
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Payment Verification Form */}
                                        <div className="space-y-4 mb-6">
                                            <h4 className="font-bold text-sm text-[#D91A2A] border-b border-[#D91A2A]/20 pb-2 flex items-center gap-2">
                                                <CreditCard size={16} />
                                                DATOS DE TU PAGO
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {(paymentBank === 'Pago Móvil' || !paymentBank) && (
                                                    <>
                                                        <div>
                                                            <label className="block text-xs font-bold mb-1 text-gray-700 uppercase">Banco Emisor</label>
                                                            <input
                                                                type="text"
                                                                value={paymentSourceBank}
                                                                onChange={(e) => setPaymentSourceBank(e.target.value)}
                                                                className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 text-sm focus:outline-none focus:border-[#F2A900] transition-colors"
                                                                placeholder="Ej. Banesco, Mercantil..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold mb-1 text-gray-700 uppercase">Referencia (Últimos 4 o 6 dígitos)</label>
                                                            <input
                                                                type="text"
                                                                value={paymentReference}
                                                                onChange={(e) => setPaymentReference(e.target.value)}
                                                                className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 text-sm focus:outline-none focus:border-[#F2A900] transition-colors"
                                                                placeholder="0000"
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <label className="block text-xs font-bold text-gray-700 uppercase">Teléfono del Pago</label>
                                                                {userPhone && paymentPhone !== userPhone && (
                                                                    <button
                                                                        onClick={() => setPaymentPhone(userPhone)}
                                                                        className="text-[10px] text-[#D91A2A] font-bold hover:bg-red-100 transition-colors py-0.5 px-2 bg-red-50 rounded-full border border-red-100 flex items-center gap-1"
                                                                    >
                                                                        <User size={10} /> MI WHATSAPP
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <input
                                                                type="tel"
                                                                value={paymentPhone}
                                                                onChange={(e) => setPaymentPhone(e.target.value)}
                                                                className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 text-sm focus:outline-none focus:border-[#F2A900] transition-colors"
                                                                placeholder="04121234567"
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {paymentBank === 'Zelle' && (
                                                    <>
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <label className="block text-xs font-bold text-gray-700 uppercase">Correo de quien realizó el pago</label>
                                                                {userEmail && zelleEmail !== userEmail && (
                                                                    <button
                                                                        onClick={() => setZelleEmail(userEmail)}
                                                                        className="text-[10px] text-[#D91A2A] font-bold hover:bg-red-100 transition-colors py-0.5 px-2 bg-red-50 rounded-full border border-red-100 flex items-center gap-1"
                                                                    >
                                                                        <User size={10} /> MI CORREO
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <input
                                                                type="email"
                                                                value={zelleEmail}
                                                                onChange={(e) => setZelleEmail(e.target.value)}
                                                                className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 text-sm focus:outline-none focus:border-[#F2A900] transition-colors"
                                                                placeholder="ejemplo@correo.com"
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <label className="block text-xs font-bold text-gray-700 uppercase">Nombre del Titular de la cuenta</label>
                                                                {userName && zelleSenderName !== userName && (
                                                                    <button
                                                                        onClick={() => setZelleSenderName(userName)}
                                                                        className="text-[10px] text-[#D91A2A] font-bold hover:bg-red-100 transition-colors py-0.5 px-2 bg-red-50 rounded-full border border-red-100 flex items-center gap-1"
                                                                    >
                                                                        <User size={10} /> MI NOMBRE
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={zelleSenderName}
                                                                onChange={(e) => setZelleSenderName(e.target.value)}
                                                                className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 text-sm focus:outline-none focus:border-[#F2A900] transition-colors"
                                                                placeholder="Juan Perez"
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                <div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <label className="block text-xs font-bold text-gray-700 uppercase">Cédula del Titular</label>
                                                        {userCedula && paymentId !== userCedula && (
                                                            <button
                                                                onClick={() => setPaymentId(userCedula)}
                                                                className="text-[10px] text-[#D91A2A] font-bold hover:bg-red-100 transition-colors py-0.5 px-2 bg-red-50 rounded-full border border-red-100 flex items-center gap-1"
                                                            >
                                                                <User size={10} /> MI CÉDULA
                                                            </button>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={paymentId}
                                                        onChange={(e) => setPaymentId(e.target.value)}
                                                        className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 text-sm focus:outline-none focus:border-[#F2A900] transition-colors"
                                                        placeholder="V-12345678"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${acceptedTerms ? 'bg-[#007A33] border-[#007A33]' : 'border-gray-300 bg-white'}`}>
                                                    {acceptedTerms && <CheckCircle size={14} className="text-white" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={acceptedTerms}
                                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                                />
                                                <span className="text-xs text-gray-500">
                                                    He leído y acepto los <button type="button" className="font-bold text-[#D91A2A] underline hover:text-[#B71523]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }}>Términos y Condiciones</button>, incluyendo las políticas de envío y reembolso.
                                                </span>
                                            </label>
                                        </div>

                                        <button
                                            onClick={handleConfirmOrder}
                                            className="w-full bg-[#007A33] text-white py-4 rounded-xl font-bold text-xl shadow-[0_4px_14px_0_rgba(0,122,51,0.39)] hover:bg-[#006028] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                        >
                                            <span>CONFIRMAR PEDIDO</span>
                                            <div className="bg-white/20 rounded-full p-1">
                                                <ArrowRight className="w-5 h-5" />
                                            </div>
                                        </button>
                                        <p className="text-center text-xs text-gray-500 mt-4">
                                            Al confirmar, serás redirigido a WhatsApp con tu pedido.
                                        </p>
                                    </div>
                                </section>

                            </>
                        )}
                    </div>

                    {/* Desktop Sidebar Sticky Cart */}
                    <aside className="hidden lg:block sticky top-24">
                        {cartItemsWithDynamicPrice.length > 0 ? (
                            <div id="cart-summary-desktop" className="bg-white rounded-3xl shadow-2xl border-4 border-[#F2A900] p-6 space-y-6 overflow-hidden">
                                <h3 className="font-bold text-xl flex items-center gap-3 text-[#3E2723]">
                                    <ShoppingCart className="text-[#D91A2A]" size={24} />
                                    Tu Carrito
                                </h3>

                                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {cartItemsWithDynamicPrice.map((item) => (
                                        <div key={item.id} className="flex justify-between items-start gap-3 border-b border-gray-100 pb-3 h-20">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#FDF6E3] shrink-0 border border-gray-100">
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-bold text-sm text-[#3E2723] truncate">{item.name}</p>
                                                    <p className="text-xs text-gray-500">${item.price} x {item.quantity}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                {getDiscountForItem(item.quantity) > 0 ? (
                                                    <>
                                                        <span className="text-xs text-gray-400 line-through">${(item.price * item.quantity).toFixed(2)}</span>
                                                        <span className="font-bold text-sm text-green-600">
                                                            ${((item.price * item.quantity) * (1 - getDiscountForItem(item.quantity) / 100)).toFixed(2)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="font-bold text-sm text-[#D91A2A]">${(item.price * item.quantity).toFixed(2)}</span>
                                                )}
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-gray-300 hover:text-[#D91A2A] transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3 pt-4 border-t-2 border-dashed border-[#FDF6E3]">
                                    <div className="flex justify-between items-center text-sm text-gray-600">
                                        <span>Subtotal:</span>
                                        <span className="font-semibold">${baseSubtotal.toFixed(2)}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between items-center text-sm text-green-600 font-bold bg-green-50 p-2 rounded-lg">
                                            <div className="flex items-center gap-1">
                                                <Percent size={14} />
                                                <span>Ahorro por Volumen:</span>
                                            </div>
                                            <span>-${discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-sm text-gray-500 font-medium">
                                        <span>Envío:</span>
                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold uppercase">Cobro en Destino</span>
                                    </div>
                                    <div className="flex justify-between items-center font-bold text-2xl text-[#D91A2A] pt-2">
                                        <span>Total:</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                </div>

                                {items.some(i => (stocks[i.id] || 0) < i.quantity) && (
                                    <div className="p-3 bg-orange-50 border-2 border-orange-100 rounded-2xl flex items-start gap-3">
                                        <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                                        <p className="text-[10px] text-orange-800 leading-tight">
                                            Algunos productos están en producción. Tu pedido se enviará en 24-48 horas.
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4">
                                    {step < 3 ? (
                                        <button
                                            onClick={() => {
                                                const nextStep = step + 1;
                                                setStep(nextStep);
                                                const targetId = nextStep === 2 ? 'step-shipping' : 'step-payment';
                                                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="w-full bg-[#D91A2A] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-[#B71524] transition-all flex items-center justify-center gap-2 group"
                                        >
                                            Siguiente Paso
                                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    ) : (
                                        <div className="space-y-3">
                                            <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors text-left">
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${acceptedTerms ? 'bg-[#007A33] border-[#007A33]' : 'border-gray-300 bg-white'}`}>
                                                    {acceptedTerms && <CheckCircle size={14} className="text-white" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={acceptedTerms}
                                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                                />
                                                <span className="text-xs text-gray-500">
                                                    Acepto los <button type="button" className="font-bold text-[#D91A2A] underline hover:text-[#B71523]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }}>Términos y Condiciones</button>
                                                </span>
                                            </label>
                                            <button
                                                onClick={handleConfirmOrder}
                                                disabled={isSubmitting}
                                                className={`transition-all duration-300 shadow-lg flex items-center justify-center gap-2 disabled:opacity-80
                                                    ${isSubmitting
                                                        ? 'w-16 h-16 rounded-full bg-[#F2A900] text-[#3E2723]'
                                                        : 'w-full bg-[#007A33] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#006028]'
                                                    }`}
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="animate-spin w-8 h-8" />
                                                ) : (
                                                    <>
                                                        Finalizar Pedido
                                                        <CheckCircle size={20} />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-400">
                                            Seguro y rápido vía WhatsApp 🛡️
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl shadow-xl border-4 border-dashed border-gray-200 p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                    <ShoppingCart size={32} />
                                </div>
                                <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
                            </div>
                        )}
                    </aside>
                </div>
            </main >

            <div className="fixed bottom-0 left-0 w-full pointer-events-none z-0 md:hidden">
                <img src="/recursos/papel-picado-bottom.webp" className="w-full opacity-100" alt="" />
            </div>

            {/* Terms Modal */}
            <AnimatePresence>
                {showTermsModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTermsModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col relative z-10 border-4 border-[#F2A900]"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-20">
                                <h3 className="font-heading font-bold text-xl text-[#D91A2A]">Términos y Condiciones</h3>
                                <button
                                    onClick={() => setShowTermsModal(false)}
                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-[#D91A2A] transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 text-sm text-gray-600">
                                <section>
                                    <h4 className="font-bold text-[#3E2723] mb-2">1. Introducción</h4>
                                    <p>Bienvenido a Nathikas. Al acceder y realizar compras en nuestro sitio web, aceptas los siguientes términos y condiciones. Nos reservamos el derecho de actualizar esta información en cualquier momento.</p>
                                </section>

                                <section>
                                    <h4 className="font-bold text-[#3E2723] mb-2">2. Envíos y Entregas</h4>
                                    <p className="mb-2">Realizamos envíos a nivel nacional a través de nuestros aliados comerciales (MRW, Zoom).</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Los tiempos de entrega son estimados y dependen de la empresa de encomiendas.</li>
                                        <li>No nos hacemos responsables por retrasos fuera de nuestro control (clima, fallas viales).</li>
                                        <li>Es responsabilidad del cliente proporcionar datos exactos. No nos hacemos responsables por direcciones, incorrectas.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h4 className="font-bold text-[#3E2723] mb-2">3. Pagos y Reembolsos</h4>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Aceptamos Pago Móvil, Zelle y Transferencias.</li>
                                        <li><strong>No aceptamos devoluciones</strong> una vez el producto (alimento perecedero) ha sido entregado.</li>
                                        <li>Reportar cualquier desperfecto en un plazo máximo de 24 horas con evidencia fotográfica.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h4 className="font-bold text-[#3E2723] mb-2">4. Privacidad</h4>
                                    <p>Tus datos son utilizados únicamente para el procesamiento y envío de tu pedido. Puedes optar por vincular tu cuenta Google para facilitar futuras compras.</p>
                                </section>
                            </div>
                            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                                <button
                                    onClick={() => {
                                        setAcceptedTerms(true);
                                        setShowTermsModal(false);
                                    }}
                                    className="bg-[#007A33] text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-[#006028] transition-colors flex items-center gap-2"
                                >
                                    <CheckCircle size={16} />
                                    Aceptar y Cerrar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div >
    );
}



