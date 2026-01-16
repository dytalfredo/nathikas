import { useState } from 'react';
import { X, Upload, Truck, CheckCircle } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import LocationMap from './LocationMap';
import appConfig from '../data/app-config.json';

interface Props {
    data: any;
    onClose: () => void;
}

type Step = 'CART' | 'USER_DATA' | 'PAYMENT' | 'PROOF' | 'SHIPPING' | 'SUMMARY';

export default function CheckoutFlow({ data, onClose }: Props) {
    const [step, setStep] = useState<Step>('CART');
    const { items, total, removeFromCart, updateQuantity } = useCartStore();

    const [userData, setUserData] = useState({
        name: '',
        phone: '',
        address: '',
        location: null as { lat: number; lng: number } | null,
    });

    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [shippingMethod, setShippingMethod] = useState('');
    const [shippingAgency, setShippingAgency] = useState('');

    const handleNext = () => {
        switch (step) {
            case 'CART': setStep('USER_DATA'); break;
            case 'USER_DATA': setStep('PAYMENT'); break;
            case 'PAYMENT': setStep('PROOF'); break;
            case 'PROOF': setStep('SHIPPING'); break;
            case 'SHIPPING': setStep('SUMMARY'); break;
            default: break;
        }
    };

    const handleWhatsAppOrder = () => {
        const message = `
*Hola Nathikas! Nuevo Pedido* 🌶️

*Cliente:* ${userData.name}
*Teléfono:* ${userData.phone}
*Dirección:* ${userData.address}

*Pedido:*
${items.map(item => `- ${item.quantity}x ${item.name} ($${item.price * item.quantity})`).join('\n')}

*Total Productos:* $${total()}

*Envío:* ${shippingMethod} - ${shippingAgency}
*Coordenadas:* https://maps.google.com/?q=${userData.location?.lat},${userData.location?.lng}

*Pago Realizado:* (Adjunto captura)
    `.trim();

        const encodedMessage = encodeURIComponent(message);
        // Clean number for link (remove spaces, symbols)
        const businessPhone = appConfig.contact.whatsapp.replace(/\D/g, '');
        window.open(`https://wa.me/${businessPhone}?text=${encodedMessage}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[#FDF6E3] w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="bg-[#D91A2A] p-4 flex justify-between items-center text-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold font-heading">
                        {step === 'CART' && 'Tu Carrito'}
                        {step === 'USER_DATA' && 'Tus Datos'}
                        {step === 'PAYMENT' && 'Realizar Pago'}
                        {step === 'PROOF' && 'Confirmar Pago'}
                        {step === 'SHIPPING' && 'Método de Envío'}
                        {step === 'SUMMARY' && 'Resumen del Pedido'}
                    </h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 text-[#3E2723]">

                    {step === 'CART' && (
                        <div className="space-y-4">
                            {items.length === 0 ? <p>Tu carrito está vacío.</p> : items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                                        <div>
                                            <h4 className="font-bold">{item.name}</h4>
                                            <p className="text-sm text-gray-600">${item.price} each</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center border rounded-md">
                                            <button onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))} className="px-2 py-1 hover:bg-gray-100">-</button>
                                            <span className="px-2">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 hover:bg-gray-100">+</button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="text-red-500"><X size={20} /></button>
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-between pt-4 font-bold text-xl border-t border-gray-300 mt-4">
                                <span>Total:</span>
                                <span>${total()}</span>
                            </div>
                        </div>
                    )}

                    {step === 'USER_DATA' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={userData.name}
                                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#F2A900] bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Teléfono</label>
                                <input
                                    type="tel"
                                    value={userData.phone}
                                    onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#F2A900] bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Dirección Escrita</label>
                                <textarea
                                    value={userData.address}
                                    onChange={(e) => setUserData({ ...userData, address: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#F2A900] bg-white"
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    {step === 'PAYMENT' && (
                        <div className="text-center">
                            <h3 className="font-bold text-lg mb-2">Pago Móvil</h3>
                            <p>{data.payment.pagoMovil.bank}</p>
                            <p className="font-mono text-lg">{data.payment.pagoMovil.phone}</p>
                            <p>ID: {data.payment.pagoMovil.id}</p>

                            <div className="my-6 mx-auto w-48 h-48 bg-gray-200 flex items-center justify-center rounded-lg border-2 border-dashed border-[#D91A2A]">
                                <img src={data.payment.qrImage || "/images/qr.webp"} alt="QR Pago" className="w-full h-full object-contain" />
                            </div>

                            <p className="text-sm text-gray-500">Escanea o usa los datos para transferir.</p>
                        </div>
                    )}

                    {step === 'PROOF' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block font-bold mb-2">1. Localización Exacta</label>
                                <p className="text-xs text-gray-500 mb-2">Toca el mapa para marcar tu ubicación de entrega.</p>
                                <LocationMap onLocationSelect={(lat, lng) => setUserData({ ...userData, location: { lat, lng } })} />
                            </div>

                            <div>
                                <label className="block font-bold mb-2">2. Comprobante de Pago</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-white transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <Upload className="mx-auto mb-2 text-gray-400" />
                                    <p>{paymentProof ? paymentProof.name : "Sube tu captura de pantalla aquí"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'SHIPPING' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block font-bold mb-2">Empresa de Envío</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {data.shipping.methods.map((method: any) => (
                                        <button
                                            key={method.id}
                                            onClick={() => setShippingMethod(method.name)}
                                            className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${shippingMethod === method.name ? 'border-[#D91A2A] bg-[#FFE0E3]' : 'border-gray-200 bg-white'}`}
                                        >
                                            <Truck />
                                            <span>{method.name} +${method.cost}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {shippingMethod && (
                                <div>
                                    <label className="block font-bold mb-2">Agencia / Destino</label>
                                    <select
                                        value={shippingAgency}
                                        onChange={(e) => setShippingAgency(e.target.value)}
                                        className="w-full p-2 border rounded-lg bg-white"
                                    >
                                        <option value="">Selecciona una ciudad/agencia</option>
                                        {data.shipping.locations.map((loc: string) => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'SUMMARY' && (
                        <div className="space-y-4 text-center">
                            <CheckCircle size={64} className="text-green-500 mx-auto" />
                            <h3 className="text-2xl font-bold font-heading">¡Está todo listo!</h3>
                            <p>Revisa tu pedido antes de enviar.</p>

                            <div className="bg-white p-4 rounded-lg text-left text-sm space-y-2 shadow-inner">
                                <p><strong>Cliente:</strong> {userData.name}</p>
                                <p><strong>Total:</strong> ${total()}</p>
                                <p><strong>Envío:</strong> {shippingMethod} ({shippingAgency})</p>
                                <p><strong>Ubicación:</strong> {userData.location ? 'Marcada en mapa' : 'No marcada'}</p>
                                <p><strong>Comprobante:</strong> {paymentProof ? 'Adjuntado' : 'No adjuntado'}</p>
                            </div>

                            <p className="text-xs text-gray-500">Al confirmar, serás redirigido a WhatsApp para enviar el pedido.</p>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-white flex justify-between rounded-b-2xl">
                    {step !== 'CART' && (
                        <button
                            onClick={() => {
                                if (step === 'SUMMARY') setStep('SHIPPING');
                                else if (step === 'SHIPPING') setStep('PROOF');
                                else if (step === 'PROOF') setStep('PAYMENT');
                                else if (step === 'PAYMENT') setStep('USER_DATA');
                                else if (step === 'USER_DATA') setStep('CART');
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-black font-semibold"
                        >
                            Atrás
                        </button>
                    )}

                    {step === 'SUMMARY' ? (
                        <button
                            onClick={handleWhatsAppOrder}
                            className="ml-auto bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transform hover:scale-105 transition-all"
                        >
                            Enviar Pedido
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            disabled={items.length === 0}
                            className="ml-auto bg-[#D91A2A] hover:bg-[#b91522] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continuar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
