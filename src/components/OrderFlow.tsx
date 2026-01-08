import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, MapPin, Truck, CreditCard, Minus, Plus, Trash2, ArrowLeft, ArrowRight, Loader2, HelpCircle, AlertTriangle, Percent, CheckCircle, LogIn } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import type { Product } from '../store/cartStore';
import { venezuelaData } from '../data/venezuela';
import { getAgenciesForCity } from '../data/agencies';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { useAlertStore } from '../store/alertStore';
import { loginAnonymously, loginWithGoogle, syncUserProfile } from '../lib/auth-service';

const LeafletMap = lazy(() => import('./LeafletMap'));

// Assuming data is passed as props
interface Props {
    data: any;
}

export default function OrderFlow({ data }: Props) {
    const { items, addToCart, removeFromCart, updateQuantity } = useCartStore();
    const { user } = useAuthStore();
    const [step, setStep] = useState(1);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [shippingMethod, setShippingMethod] = useState('');
    const [selectedAgency, setSelectedAgency] = useState('');
    const [userName, setUserName] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [userCedula, setUserCedula] = useState('');
    const [userEmail, setUserEmail] = useState('');

    // Recipient Info (if different from customer)
    const [isGift, setIsGift] = useState(false);
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [recipientCedula, setRecipientCedula] = useState('');
    const [paymentBank, setPaymentBank] = useState('');
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentId, setPaymentId] = useState('');
    const [paymentPhone, setPaymentPhone] = useState('');

    // Zelle-specific verification
    const [zelleEmail, setZelleEmail] = useState('');
    const [zelleSenderName, setZelleSenderName] = useState('');

    const [stocks, setStocks] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dynamicSettings, setDynamicSettings] = useState<any>(null);

    useEffect(() => {
        setIsMounted(true);
        // Listen to live stock
        if (!db) {
            console.warn("Firestore 'db' is not initialized. Stock updates disabled.");
            return;
        }

        const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
            const stockMap: Record<string, number> = {};
            snapshot.forEach(doc => {
                stockMap[doc.id] = doc.data().stock || 0;
            });
            setStocks(stockMap);
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

    const filteredCities = venezuelaData.find(d => d.estado === selectedState)?.ciudades || [];
    const availableAgencies = selectedCity && shippingMethod ? getAgenciesForCity(shippingMethod, selectedCity) : [];

    // Derived state
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    const baseSubtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Calculate volume discount
    let discountPercent = 0;
    if (dynamicSettings?.discounts) {
        if (totalItems > 12) {
            discountPercent = dynamicSettings.discounts.tier2;
        } else if (totalItems > 6) {
            discountPercent = dynamicSettings.discounts.tier1;
        }
    }

    const discountAmount = baseSubtotal * (discountPercent / 100);
    const subtotal = baseSubtotal - discountAmount;
    const shippingCost = 5.00; // Example fixed shipping
    const total = subtotal + shippingCost;

    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    const startTour = () => {
        const tutorialImg = '<img src="/recursos/recurso4.png" class="tutorial-mascot-anim" style="width: 60px; height: auto; flex-shrink: 0;" />';
        const wrapDesc = (textValue: string) => `<div style="display: flex; align-items: center; gap: 12px; text-align: left;">${tutorialImg}<span style="font-size: 14px; line-height: 1.4; font-weight: 600;">${textValue}</span></div>`;

        const driverObj = driver({
            showProgress: true,
            animate: true,
            popoverClass: "driverjs-theme",
            onHighlightStarted: () => {
                document.body.style.overflow = 'hidden';
            },
            onDestroyed: () => {
                document.body.style.overflow = 'auto';
            },
            steps: [
                { element: '#step-products', popover: { title: 'Paso 1: Elige tu Antojo', description: wrapDesc('Explora nuestra selección de gomitas y agrega las que más te gusten a tu carrito.') } },
                ...(items.length > 0 ? [{ element: '#cart-summary', popover: { title: 'Resumen del Pedido', description: wrapDesc('Aquí puedes ver el detalle de lo que llevas y el total a pagar.') } }] : []),
                { element: '#step-shipping', popover: { title: 'Paso 2: Envío', description: wrapDesc('Ingresa tus datos, selecciona tu ciudad y elige si prefieres MRW, Zoom o retiro personal.') } },
                { element: '#map-container', popover: { title: 'Ubicación', description: wrapDesc('Usa el mapa para confirmar tu ubicación exacta o buscar la agencia más cercana.') } },
                { element: '#step-payment', popover: { title: 'Paso 3: Pago y Confirmación', description: wrapDesc('Realiza el pago móvil y confirma tu pedido. ¡Te redirigiremos a WhatsApp para finalizar!') } },
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

        // Recipient Info (if gift)
        if (isGift) {
            if (!recipientName) missingFields.push("Nombre de quien recibe");
            if (!recipientPhone) missingFields.push("WhatsApp de quien recibe");
            if (!recipientCedula) missingFields.push("Cédula de quien recibe");
        }

        // Shipping Info
        if (!selectedState) missingFields.push("Estado de Envío");
        if (!selectedCity) missingFields.push("Ciudad de Envío");
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

        if (items.length === 0) missingFields.push("Al menos un producto");

        if (missingFields.length > 0) {
            useAlertStore.getState().showAlert(
                "Información Faltante",
                `Por favor completa los siguientes campos: ${missingFields.join(', ')}`,
                "warning"
            );
            return;
        }

        const businessPhone = "+584141234567"; // Adjust as needed

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
        items.forEach(item => {
            message += `- ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
        });
        message += `\n💰 *Total:* $${subtotal.toFixed(2)}\n\n`;

        message += `📍 *ENVÍO:*\n`;
        message += `- Estado: ${selectedState}\n`;
        message += `- Ciudad: ${selectedCity}\n`;
        message += `- Método: ${shippingMethod}\n`;
        if (selectedAgency) {
            const agency = availableAgencies.find(a => a.id === selectedAgency);
            message += `- Agencia: ${agency?.name || selectedAgency}\n`;
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
                    console.log("Iniciando sesión anónima para el cliente...");
                    const anonUser = await loginAnonymously();
                    if (!anonUser) throw new Error("No se pudo crear sesión anónima");
                    currentUser = { uid: anonUser.uid, email: null, role: null };
                }

                // 2. Determinar si hay ítems sin stock (backorders)
                const backorders = items.filter(item => (stocks[item.id] || 0) < item.quantity);
                const isBackorder = backorders.length > 0;

                const batch = writeBatch(db);

                // Deduct stock (solo lo que haya disponible, no ir a negativo)
                items.forEach(item => {
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
                    items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
                    subtotal,
                    total,
                    selectedState,
                    selectedCity,
                    shippingMethod,
                    selectedAgency,
                    paymentBank,
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
                let finalMessage = message;
                if (isBackorder) {
                    finalMessage += `\n⚠️ *AVISO DE PRODUCCIÓN:*\nEste pedido incluye productos en producción. Será atendido en las próximas 24-48 horas.`;
                }
                const encodedMessage = encodeURIComponent(finalMessage);

                // Open WhatsApp
                window.open(`https://wa.me/${businessPhone}?text=${encodedMessage}`, '_blank');

                // 5. Cleanup and Success Message
                useAlertStore.getState().showAlert(
                    "¡Pedido enviado!",
                    "Tu pedido ha sido registrado con éxito. Serás redirigido a WhatsApp para finalizar.",
                    "success"
                );
                setShowSuccess(true);

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

    const handleGoogleLogin = async () => {
        setIsSubmitting(true);
        try {
            const googleUser = await loginWithGoogle();
            if (googleUser) {
                await syncUserProfile(googleUser.uid, {
                    name: userName,
                    phone: userPhone,
                    cedula: userCedula,
                    email: googleUser.email
                });

                useAlertStore.getState().showAlert(
                    "¡Perfil Guardado!",
                    "Tu cuenta ha sido vinculada y tus datos guardados para futuras compras.",
                    "success"
                );
            }
        } catch (err) {
            console.error("Error linking google profile:", err);
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
        setZelleEmail('');
        setZelleSenderName('');
    };

    useEffect(() => {
        // Auto-fill from user profile if logged in
        if (user && !user.isAnonymous && user.role) {
            if (!userName && user.name) setUserName(user.name);
            if (!userPhone && user.phone) setUserPhone(user.phone);
            if (!userCedula && user.cedula) setUserCedula(user.cedula);
            if (!userEmail && user.email) setUserEmail(user.email);
        }
    }, [user]);

    useEffect(() => {
        if (isMounted) {
            // Short delay to ensure sections are rendered
            const timer = setTimeout(() => {
                startTour();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isMounted]);

    return (
        <div className="min-h-screen bg-[#FDF6E3] font-sans text-[#3E2723] pb-20 relative">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#FDF6E3]/95 backdrop-blur-sm shadow-sm border-b-4 border-[#F2A900] px-4 py-3 flex items-center justify-between">
                <a href="/" className="flex items-center gap-2">
                    <ArrowLeft size={24} className="text-[#D91A2A]" />
                    <span className="font-bold text-[#D91A2A]">Volver</span>
                </a>
                <div className="flex items-center gap-2">
                    <img src="/images/logo.png" alt="Nathikas Logo" className="h-8 w-auto" />
                </div>
                <button onClick={startTour} className="w-10 h-10 flex items-center justify-center text-[#D91A2A] hover:bg-[#FDF6E3] hover:shadow-md rounded-full transition-all" title="Ver Tutorial">
                    <HelpCircle size={24} />
                </button>
            </header>

            <main className="container mx-auto max-w-lg px-4 pt-6">

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
                            onClick={handleResetFlow}
                            className="w-full bg-[#D91A2A] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#B71524] transition-all"
                        >
                            <span>VOLVER A LA TIENDA</span>
                            <ArrowRight size={20} />
                        </button>
                    </motion.div>
                ) : (
                    <>
                        {/* Step 1: Elige tu Antojo */}
                        <section className="mb-12" id="step-products">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-[#F2A900] text-[#3E2723] w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl font-heading shadow-md border-2 border-white">1</div>
                                <h2 className="text-2xl font-bold font-heading text-[#D91A2A]">ELIGE TU ANTOJO</h2>
                            </div>

                            {/* Extra Compact Product Grid */}
                            <div className="grid grid-cols-3 gap-2">
                                {data.products.map((product: Product) => {
                                    const inCart = items.find(i => i.id === product.id);
                                    return (
                                        <motion.div
                                            key={product.id}
                                            className={`bg-white rounded-xl shadow-md overflow-hidden border-2 flex flex-col ${inCart ? 'border-[#F2A900]' : 'border-transparent'}`}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="aspect-square bg-gray-50 flex items-center justify-center p-1 relative">
                                                <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                                                {inCart && (
                                                    <div className="absolute top-0.5 right-0.5 bg-[#D91A2A] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                                                        {inCart.quantity}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-1.5 text-center flex-grow flex flex-col justify-between gap-0.5">
                                                <div>
                                                    <h3 className="font-bold text-[9px] md:text-xs leading-tight line-clamp-2 h-6 md:h-8 flex items-center justify-center">{product.name}</h3>
                                                    <p className="text-[#D91A2A] font-bold text-xs md:text-sm mt-0.5">${product.price.toFixed(2)}</p>
                                                </div>

                                                {inCart ? (
                                                    <div className="flex flex-col gap-1 mt-1">
                                                        <div className="flex items-center justify-between gap-1 bg-[#FDF6E3] rounded-full p-1 border border-[#F2A900] text-black w-full overflow-hidden">
                                                            <button
                                                                onClick={() => updateQuantity(product.id, Math.max(0, inCart.quantity - 1))}
                                                                className="w-6 h-6 md:w-7 md:h-7 shrink-0 flex items-center justify-center bg-white rounded-full text-[#D91A2A] shadow-sm hover:bg-red-50"
                                                            >
                                                                <Minus size={10} />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                value={inCart.quantity}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value);
                                                                    if (!isNaN(val) && val >= 0) {
                                                                        updateQuantity(product.id, val);
                                                                    } else if (e.target.value === '') {
                                                                        updateQuantity(product.id, 0);
                                                                    }
                                                                }}
                                                                className="w-full min-w-0 bg-transparent text-center font-bold text-[10px] md:text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                            <button
                                                                onClick={() => updateQuantity(product.id, inCart.quantity + 1)}
                                                                className="w-6 h-6 md:w-7 md:h-7 shrink-0 flex items-center justify-center bg-[#F2A900] text-[#3E2723] rounded-full shadow-sm hover:bg-[#d99700]"
                                                            >
                                                                <Plus size={10} />
                                                            </button>
                                                        </div>
                                                        {(stocks[product.id] || 0) < inCart.quantity && (
                                                            <div className="text-[7px] md:text-[8px] text-[#D91A2A] font-bold leading-tight bg-red-50 p-1 rounded border border-red-100 italic">
                                                                Produciendo más unidades...
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => addToCart(product, 1)}
                                                        className="w-full py-1 rounded-lg font-bold text-[9px] md:text-xs shadow-md mt-1 transition-all bg-[#D91A2A] text-white"
                                                    >
                                                        {(stocks[product.id] || 0) <= 0 ? 'PEDIR (EN PROD.)' : 'AGREGAR'}
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Cart Summary (Always visible if items exist) */}
                        <AnimatePresence>
                            {items.length > 0 && (
                                <motion.section
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-white rounded-2xl shadow-xl border-4 border-[#F2A900] p-6 mb-12 overflow-hidden"
                                    id="cart-summary"
                                >
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                        <ShoppingCart className="text-[#D91A2A]" size={20} />
                                        Resumen del Pedido
                                    </h3>
                                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {items.map((item) => (
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
                                                    <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
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
                                        {discountPercent > 0 && (
                                            <div className="flex justify-between items-center text-sm text-green-600 font-bold">
                                                <div className="flex items-center gap-1">
                                                    <Percent size={14} />
                                                    <span>Descuento por Volumen ({discountPercent}%):</span>
                                                </div>
                                                <span>-${discountAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center font-bold text-xl text-[#D91A2A]">
                                            <span>Total:</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {items.some(i => (stocks[i.id] || 0) < i.quantity) && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-4 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl flex items-start gap-3"
                                        >
                                            <AlertTriangle className="text-orange-500 shrink-0" size={20} />
                                            <div className="text-xs text-orange-800 leading-relaxed">
                                                <p className="font-bold mb-1">
                                                    En este momento nos encontramos produciendo más, de igual forma tu pedido será programado y atendido durante las próximas 24 horas.
                                                </p>
                                                <p className="opacity-75">
                                                    Este estado suele retrasar tu envío de uno a dos días más.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.section>
                            )}
                        </AnimatePresence>

                        {/* Step 2: ¿A Dónde lo Enviamos? */}
                        <section className={`mb-12 transition-opacity duration-500 ${items.length === 0 ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`} id="step-shipping">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-[#F2A900] text-[#3E2723] w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl font-heading shadow-md border-2 border-white">2</div>
                                <h2 className="text-2xl font-bold font-heading text-[#D91A2A]">¿A DÓNDE LO ENVIAMOS?</h2>
                            </div>

                            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">

                                {/* Name, Phone and Cedula */}
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

                                {/* State and City Selector */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-1 text-gray-700">Estado</label>
                                        <select
                                            value={selectedState}
                                            onChange={(e) => {
                                                setSelectedState(e.target.value);
                                                setSelectedCity('');
                                            }}
                                            className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 focus:outline-none focus:border-[#F2A900] transition-colors text-gray-700"
                                        >
                                            <option value="">Seleccione Estado</option>
                                            {venezuelaData.map((state) => (
                                                <option key={state.estado} value={state.estado}>{state.estado}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1 text-gray-700">Ciudad</label>
                                        <select
                                            value={selectedCity}
                                            onChange={(e) => setSelectedCity(e.target.value)}
                                            disabled={!selectedState}
                                            className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 focus:outline-none focus:border-[#F2A900] transition-colors disabled:opacity-50 text-gray-700"
                                        >
                                            <option value="">Seleccione Ciudad</option>
                                            {filteredCities.map((city) => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Shipping Method */}
                                <div className="mt-4">
                                    <label className="block text-sm font-bold mb-2 text-gray-700">Método de Envío</label>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <button
                                            type="button"
                                            className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${shippingMethod === 'MRW' ? 'border-[#D91A2A] bg-[#D91A2A]/10 text-[#D91A2A]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                            onClick={() => { setShippingMethod('MRW'); setSelectedAgency(''); }}
                                        >
                                            MRW
                                        </button>
                                        <button
                                            type="button"
                                            className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${shippingMethod === 'Zoom' ? 'border-[#007A33] bg-[#007A33]/10 text-[#007A33]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                            onClick={() => { setShippingMethod('Zoom'); setSelectedAgency(''); }}
                                        >
                                            Zoom
                                        </button>
                                    </div>

                                    {/* Agency Selector */}
                                    {shippingMethod && selectedCity ? (
                                        <div className="animate-fadeIn mb-4">
                                            <label className="block text-sm font-bold mb-1 text-gray-700">Selecciona la Agencia {shippingMethod}</label>
                                            <select
                                                value={selectedAgency}
                                                onChange={(e) => setSelectedAgency(e.target.value)}
                                                className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 focus:outline-none focus:border-[#F2A900] transition-colors text-gray-700"
                                            >
                                                <option value="">Seleccione una agencia en {selectedCity}</option>
                                                {availableAgencies.map((agency) => (
                                                    <option key={agency.id} value={agency.id}>{agency.name} - {agency.address}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : shippingMethod ? (
                                        <p className="text-sm text-[#D91A2A] mb-4">Por favor selecciona una ciudad para ver las agencias.</p>
                                    ) : null}
                                </div>


                                {/* Map or Image */}
                                <div className="w-full h-64 rounded-xl overflow-hidden shadow-md border-2 border-[#E0E0E0] hover:border-[#F2A900] transition-colors relative z-0" id="map-container">
                                    {isMounted ? (
                                        <Suspense fallback={<div className="bg-gray-200 w-full h-full flex items-center justify-center animate-pulse"><Loader2 className="animate-spin text-[#D91A2A]" /></div>}>
                                            <LeafletMap />
                                        </Suspense>
                                    ) : (
                                        <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-400">Cargando mapa...</div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-1 text-gray-700">Dirección Exacta</label>
                                    <textarea className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 focus:outline-none focus:border-[#F2A900] transition-colors h-24 resize-none" placeholder="Casa, Edificio, Punto de referencia..."></textarea>
                                </div>
                            </div>
                        </section>

                        {/* Step 3: Pago Móvil */}
                        <section className={`mb-12 transition-opacity duration-500 ${items.length === 0 ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`} id="step-payment">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-[#F2A900] text-[#3E2723] w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl font-heading shadow-md border-2 border-white">3</div>
                                <h2 className="text-2xl font-bold font-heading text-[#D91A2A]">PAGO Y RECIBO</h2>
                            </div>

                            <div className="bg-white rounded-2xl shadow-lg p-6 relative overflow-hidden">
                                {/* Background Pattern */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F2A900]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <CreditCard className="text-[#D91A2A]" size={20} />
                                    {paymentBank || 'Pago Móvil'}
                                </h3>

                                {/* Dynamic Payment Instructions */}
                                <div className="bg-[#FDF6E3] p-4 rounded-xl border border-[#F2A900]/30 mb-6 flex flex-col md:flex-row gap-6 items-center">
                                    <div className="flex-1 space-y-2 text-sm w-full">
                                        {(!paymentBank || paymentBank === 'Pago Móvil') ? (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Banco:</span>
                                                    <span className="font-bold">{dynamicSettings?.pagoMovil?.bank || data.payment.pagoMovil.bank}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Teléfono:</span>
                                                    <span className="font-bold">{dynamicSettings?.pagoMovil?.phone || data.payment.pagoMovil.phone}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Cédula:</span>
                                                    <span className="font-bold">{dynamicSettings?.pagoMovil?.id || data.payment.pagoMovil.id}</span>
                                                </div>
                                            </>
                                        ) : paymentBank === 'Zelle' ? (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Nombre Titular:</span>
                                                    <span className="font-bold">{dynamicSettings?.zelle?.name || 'Cargando...'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Correo Electrónico:</span>
                                                    <span className="font-bold">{dynamicSettings?.zelle?.email || 'Cargando...'}</span>
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
                                            {/* QR Code Placeholder */}
                                            <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white text-xs text-center">QR CODE</div>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Method Selector (Dynamic) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {dynamicSettings?.paymentMethods?.filter((m: any) => m.enabled).map((method: any) => (
                                        <button
                                            key={method.id}
                                            type="button"
                                            className={`p-4 rounded-xl border-2 flex items-center justify-between font-bold transition-all ${paymentBank.toLowerCase().includes(method.name.toLowerCase()) ? 'border-[#D91A2A] bg-[#D91A2A]/5' : 'border-gray-100 hover:border-[#F2A900]'}`}
                                            onClick={() => setPaymentBank(method.name)}
                                        >
                                            <span>{method.name}</span>
                                            <CreditCard size={18} className={paymentBank.toLowerCase().includes(method.name.toLowerCase()) ? 'text-[#D91A2A]' : 'text-gray-300'} />
                                        </button>
                                    ))}
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
                                                        value={paymentBank === 'Pago Móvil' ? '' : paymentBank} // This is used as placeholder if not Pago Movil
                                                        onChange={(e) => setPaymentBank(e.target.value)}
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
                                                    <label className="block text-xs font-bold mb-1 text-gray-700 uppercase">Teléfono del Pago</label>
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
                                                    <label className="block text-xs font-bold mb-1 text-gray-700 uppercase">Correo de quien realizó el pago</label>
                                                    <input
                                                        type="email"
                                                        value={zelleEmail}
                                                        onChange={(e) => setZelleEmail(e.target.value)}
                                                        className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 text-sm focus:outline-none focus:border-[#F2A900] transition-colors"
                                                        placeholder="ejemplo@correo.com"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold mb-1 text-gray-700 uppercase">Nombre del Titular de la cuenta</label>
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
                                            <label className="block text-xs font-bold mb-1 text-gray-700 uppercase">Cédula del Titular</label>
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
            </main>

            {/* Bottom Decoration */}
            <div className="fixed bottom-0 left-0 w-full pointer-events-none z-0 md:hidden">
                <img src="/recursos/papel-picado-bottom.png" className="w-full opacity-100" alt="" />
            </div>
        </div>
    );
}
