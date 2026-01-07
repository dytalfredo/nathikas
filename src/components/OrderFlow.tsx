import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, MapPin, Truck, CreditCard, Minus, Plus, Trash2, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import type { Product } from '../store/cartStore';
import { venezuelaData } from '../data/venezuela';
import { getAgenciesForCity } from '../data/agencies';

const LeafletMap = lazy(() => import('./LeafletMap'));

// Assuming data is passed as props
interface Props {
    data: any;
}

export default function OrderFlow({ data }: Props) {
    const { items, addToCart, removeFromCart, updateQuantity } = useCartStore();
    const [step, setStep] = useState(1);
    const [isMounted, setIsMounted] = useState(false);
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [shippingMethod, setShippingMethod] = useState('');
    const [selectedAgency, setSelectedAgency] = useState('');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const filteredCities = venezuelaData.find(d => d.estado === selectedState)?.ciudades || [];
    const availableAgencies = selectedCity && shippingMethod ? getAgenciesForCity(shippingMethod, selectedCity) : [];

    // Derived state
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingCost = 5.00; // Example fixed shipping
    const total = subtotal + shippingCost;

    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    return (
        <div className="min-h-screen bg-[#FDF6E3] font-sans text-[#3E2723] pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#FDF6E3]/95 backdrop-blur-sm shadow-sm border-b-4 border-[#F2A900] px-4 py-3 flex items-center justify-between">
                <a href="/" className="flex items-center gap-2">
                    <ArrowLeft size={24} className="text-[#D91A2A]" />
                    <span className="font-bold text-[#D91A2A]">Volver</span>
                </a>
                <div className="flex items-center gap-2">
                    <img src="/images/logo.png" alt="Nathikas Logo" className="h-8 w-auto" />
                </div>
                <div className="w-16"></div> {/* Spacer for center alignment */}
            </header>

            <main className="container mx-auto max-w-lg px-4 pt-6">

                {/* Step 1: Elige tu Antojo */}
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-[#F2A900] text-[#3E2723] w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl font-heading shadow-md border-2 border-white">1</div>
                        <h2 className="text-2xl font-bold font-heading text-[#D91A2A]">ELIGE TU ANTOJO</h2>
                    </div>

                    {/* Product Grid with Container Queries */}
                    <div className="@container">
                        <div className="grid grid-cols-1 @min-[340px]:grid-cols-2 gap-4">
                            {data.products.map((product: Product) => {
                                const inCart = items.find(i => i.id === product.id);
                                return (
                                    <motion.div
                                        key={product.id}
                                        className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${inCart ? 'border-[#F2A900]' : 'border-transparent'}`}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="aspect-square relative overflow-hidden bg-gray-100">
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                            {inCart && (
                                                <div className="absolute top-2 right-2 bg-[#F2A900] text-[#3E2723] text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                                                    x{inCart.quantity}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 text-center">
                                            <h3 className="font-bold text-sm leading-tight mb-1 h-10 flex items-center justify-center">{product.name}</h3>
                                            <p className="text-[#D91A2A] font-bold mb-3">${product.price.toFixed(2)}</p>

                                            {inCart ? (
                                                <div className="flex items-center justify-center gap-2 bg-[#FDF6E3] rounded-full p-1 border border-[#F2A900]">
                                                    <button
                                                        onClick={() => updateQuantity(product.id, Math.max(0, inCart.quantity - 1))}
                                                        className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-[#D91A2A] shadow-sm hover:bg-gray-50"
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <span className="font-bold w-4 text-center">{inCart.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(product.id, inCart.quantity + 1)}
                                                        className="w-8 h-8 flex items-center justify-center bg-[#F2A900] rounded-full text-[#3E2723] shadow-sm hover:bg-[#e09b00]"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => addToCart(product, 1)}
                                                    className="w-full bg-[#D91A2A] text-white py-2 rounded-lg font-bold text-sm shadow-md hover:bg-[#b9151e] transition-colors"
                                                >
                                                    AGREGAR
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
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
                            <div className="flex justify-between items-center font-bold text-xl text-[#D91A2A] border-t-2 border-dashed border-gray-200 pt-4">
                                <span>Total:</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* Step 2: ¿A Dónde lo Enviamos? */}
                <section className={`mb-12 transition-opacity duration-500 ${items.length === 0 ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-[#F2A900] text-[#3E2723] w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl font-heading shadow-md border-2 border-white">2</div>
                        <h2 className="text-2xl font-bold font-heading text-[#D91A2A]">¿A DÓNDE LO ENVIAMOS?</h2>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">

                        {/* Name and Phone */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-1 text-gray-700">Nombre Completo</label>
                                <input type="text" className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 focus:outline-none focus:border-[#F2A900] transition-colors" placeholder="Ej. Juan Pérez" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 text-gray-700">WhatsApp</label>
                                <input type="tel" className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-lg p-3 focus:outline-none focus:border-[#F2A900] transition-colors" placeholder="+58 412 1234567" />
                            </div>
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
                        <div className="w-full h-64 rounded-xl overflow-hidden shadow-md border-2 border-[#E0E0E0] hover:border-[#F2A900] transition-colors relative z-0">
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
                <section className={`mb-12 transition-opacity duration-500 ${items.length === 0 ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-[#F2A900] text-[#3E2723] w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl font-heading shadow-md border-2 border-white">3</div>
                        <h2 className="text-2xl font-bold font-heading text-[#D91A2A]">PAGO Y RECIBO</h2>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F2A900]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <CreditCard className="text-[#D91A2A]" size={20} />
                            Pago Móvil
                        </h3>

                        <div className="bg-[#FDF6E3] p-4 rounded-xl border border-[#F2A900]/30 mb-6 flex flex-col md:flex-row gap-6 items-center">
                            <div className="flex-1 space-y-2 text-sm w-full">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Banco:</span>
                                    <span className="font-bold">Banesco</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Teléfono:</span>
                                    <span className="font-bold">0412-1234567</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Cédula:</span>
                                    <span className="font-bold">V-12.345.678</span>
                                </div>
                            </div>
                            <div className="w-24 h-24 bg-white p-2 rounded-lg shadow-sm shrink-0">
                                {/* QR Code Placeholder */}
                                <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white text-xs text-center">QR CODE</div>
                            </div>
                        </div>

                        <button
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

            </main>

            {/* Bottom Decoration */}
            <div className="fixed bottom-0 left-0 w-full pointer-events-none z-0 md:hidden">
                <img src="/recursos/papel-picado-bottom.png" className="w-full opacity-100" alt="" />
            </div>
        </div>
    );
}
