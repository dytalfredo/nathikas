import { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc, setDoc, collection, onSnapshot, query, writeBatch, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard,
    Package,
    Percent,
    Bot,
    Save,
    Plus,
    Trash2,
    DollarSign,
    QrCode,
    Smartphone,
    Globe,
    UserPlus,
    ShieldAlert,
    AlertCircle,
    Bell,
    Mail,
    MapPin,
    Truck,
    Tag,
    Clock,
    Store
} from 'lucide-react';
import { useAlertStore } from '../../store/alertStore';
import type { PickUpPoint, Promotion } from '../../types/types';
import LocationMap from '../LocationMap';

interface ProductPrice {
    id: string;
    name: string;
    price: number;
    deliveryCost?: number;
    enabled?: boolean;
}

interface PaymentMethod {
    id: string;
    name: string;
    enabled: boolean;
    details?: string;
}

interface GlobalSettings {
    pagoMovil: {
        bank: string;
        phone: string;
        id: string;
        qrImage?: string;
    };
    discounts: {
        tier1: number; // > 6 units
        tier2: number; // > 12 units
    };
    bot: {
        apiUrl: string;
        apiKey: string;
        enabled: boolean;
    };
    zelle: {
        name: string;
        email: string;
    };
    paymentMethods: PaymentMethod[];
    notifications: {
        email: {
            pagado: { subject: string; body: string };
            despachado: { subject: string; body: string };
            cancelado: { subject: string; body: string };
        };
        push: {
            pagado: { title: string; body: string };
            despachado: { title: string; body: string };
            cancelado: { title: string; body: string };
        };
    };
}

export default function SettingsView() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<any>(user?.role === 'puntoDeVenta' ? 'logistica' : 'pagos');
    const [settings, setSettings] = useState<GlobalSettings | null>(null);
    const [products, setProducts] = useState<ProductPrice[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // PickUp Points State
    const [pickupPoints, setPickupPoints] = useState<PickUpPoint[]>([]);
    const [isAddingPickup, setIsAddingPickup] = useState(false);
    const [newPickup, setNewPickup] = useState<Partial<PickUpPoint>>({
        enabled: true,
        deliveryRadius: 5,
        deliveryCost: 2,
        city: ''
    });
    const [editingPickupId, setEditingPickupId] = useState<string | null>(null);
    const [editingPickup, setEditingPickup] = useState<Partial<PickUpPoint>>({});

    // Promotions State
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isAddingPromo, setIsAddingPromo] = useState(false);
    const [newPromo, setNewPromo] = useState<Partial<Promotion>>({
        enabled: true,
        type: 'info'
    });

    const showAlert = useAlertStore(state => state.showAlert);

    // User Creation State
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<'administrator' | 'asistente' | 'vendedor' | 'puntoDeVenta'>('vendedor');
    const [newUserPickupId, setNewUserPickupId] = useState<string>('');
    const [isCreatingUser, setIsCreatingUser] = useState(false);

    useEffect(() => {
        if (!db) return;

        // Load Global Settings
        const loadSettings = async () => {
            try {
                const settingsDoc = await getDoc(doc(db, "settings", "global"));
                // Default settings definition
                const defaultSettings: GlobalSettings = {
                    pagoMovil: { bank: '0102 - Banco de Venezuela', phone: '0414-1234567', id: '12345678' },
                    discounts: { tier1: 5, tier2: 10 },
                    bot: { apiUrl: '', apiKey: '', enabled: false },
                    zelle: { name: '', email: '' },
                    paymentMethods: [
                        { id: 'pago-movil', name: 'Pago Móvil', enabled: true },
                        { id: 'zelle', name: 'Zelle', enabled: false },
                        { id: 'binance', name: 'Binance', enabled: false }
                    ],
                    notifications: {
                        email: {
                            pagado: { subject: '¡Pago confirmado! Nathikas #{{orderId}}', body: 'Hola {{userName}}, hemos verificado tu pago.' },
                            despachado: { subject: '¡Envío en camino! Nathikas #{{orderId}}', body: 'Hola {{userName}}, tu pedido va en camino.' },
                            cancelado: { subject: 'Tu pedido Nathikas #{{orderId}} ha sido cancelado', body: 'Hola {{userName}}, tu pedido ha sido cancelado.' }
                        },
                        push: {
                            pagado: { title: '¡Pago Confirmado! ✅', body: 'Hola {{userName}}, estamos preparando tu pedido #{{orderId}}' },
                            despachado: { title: '¡Pedido en Camino! 🚚', body: 'Tus Nathikas van volando a su destino.' },
                            cancelado: { title: 'Pedido Cancelado ❌', body: 'Tu orden #{{orderId}} ha sido cancelada.' }
                        }
                    }
                };

                if (settingsDoc.exists()) {
                    // Merge defaults with existing data to ensure all structure exists (Deep merge for notifications)
                    const data = settingsDoc.data() as Partial<GlobalSettings>;
                    const mergedSettings = {
                        ...defaultSettings,
                        ...data,
                        notifications: {
                            ...defaultSettings.notifications,
                            ...(data.notifications || {})
                        },
                        // Ensure other nested objects are also safe if they exist partially
                        pagoMovil: { ...defaultSettings.pagoMovil, ...(data.pagoMovil || {}) },
                        discounts: { ...defaultSettings.discounts, ...(data.discounts || {}) },
                        bot: { ...defaultSettings.bot, ...(data.bot || {}) }
                    };
                    setSettings(mergedSettings);
                } else {
                    setSettings(defaultSettings);
                    await setDoc(doc(db, "settings", "global"), defaultSettings);
                }
            } catch (err) {
                console.error("Error loading settings:", err);
                showAlert("Error", "No se pudieron cargar las configuraciones.", "error");
            }
        };

        // Load Products
        const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
            const productsData: ProductPrice[] = [];
            snapshot.forEach(doc => {
                const d = doc.data();
                productsData.push({
                    id: doc.id,
                    name: d.name,
                    price: d.price || 0,
                    deliveryCost: d.deliveryCost || 0,
                    enabled: d.enabled !== false // Default to true if not set
                });
            });
            setProducts(productsData);
            setLoading(false);
        });

        loadSettings();

        // Load Pickup Points
        const unsubPickup = onSnapshot(collection(db, "pickup_points"), (snapshot) => {
            const data: PickUpPoint[] = [];
            snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() } as PickUpPoint));
            setPickupPoints(data);
        });

        // Load Promotions
        const unsubPromos = onSnapshot(collection(db, "promotions"), (snapshot) => {
            const data: Promotion[] = [];
            snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() } as Promotion));
            setPromotions(data);
        });

        return () => {
            unsubProducts();
            unsubPickup();
            unsubPromos();
        };
    }, []);

    const handleSaveSettings = async () => {
        if (!settings || !db) return;
        setSaving(true);
        try {
            await setDoc(doc(db, "settings", "global"), settings);
            showAlert("¡Éxito!", "Configuraciones guardadas correctamente.", "success");
        } catch (err) {
            console.error("Error saving settings:", err);
            showAlert("Error", "No se pudieron guardar las configuraciones.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleProductPriceChange = async (productId: string, newPrice: number) => {
        try {
            await setDoc(doc(db, "products", productId), { price: newPrice }, { merge: true });
            setProducts(products.map(p => p.id === productId ? { ...p, price: newPrice } : p));
        } catch (err) {
            console.error("Error updating price:", err);
            showAlert("Error", "No se pudo actualizar el precio.", "error");
        }
    };

    const handleProductStatusChange = async (productId: string, enabled: boolean) => {
        try {
            await setDoc(doc(db, "products", productId), { enabled }, { merge: true });
            // Update local state to reflect change immediately
            setProducts(products.map(p => p.id === productId ? { ...p, enabled } : p));
        } catch (err) {
            console.error("Error updating status:", err);
            showAlert("Error", "No se pudo actualizar el estado.", "error");
        }
    };

    const handleProductDeliveryCostChange = async (productId: string, deliveryCost: number) => {
        try {
            await setDoc(doc(db, "products", productId), { deliveryCost }, { merge: true });
            setProducts(products.map(p => p.id === productId ? { ...p, deliveryCost } : p));
        } catch (err) {
            console.error("Error updating delivery cost:", err);
            showAlert("Error", "No se pudo actualizar el costo de delivery.", "error");
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserEmail || !newUserPassword) {
            showAlert("Faltan Datos", "Por favor completa el correo y la contraseña.", "error");
            return;
        }

        setIsCreatingUser(true);
        try {
            // Llamamos a la función Serverless para crear el usuario con privilegios de administrador
            // Esto evita problemas de permisos de Firestore y la necesidad de "Secondary Apps" en el cliente

            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("No hay usuario autenticado en Firebase.");
            const token = await currentUser.getIdToken();

            const response = await fetch('/.netlify/functions/create_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: newUserEmail,
                    password: newUserPassword,
                    role: newUserRole,
                    name: newUserEmail.split('@')[0],
                    pickupId: newUserRole === 'puntoDeVenta' ? newUserPickupId : undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error desconocido al crear usuario.');
            }

            showAlert("¡Éxito!", `Usuario ${newUserEmail} creado con rol ${newUserRole}`, "success");
            setNewUserEmail('');
            setNewUserPassword('');
        } catch (err: any) {
            console.error("Error creating user:", err);
            showAlert("Error al crear usuario", err.message || "Ocurrió un error inesperado.", "error");
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleResetDatabase = async () => {
        const confirm1 = window.confirm("¡ATENCIÓN! Estás a punto de borrar todos los PEDIDOS y PRODUCCIONES. ¿Estás seguro?");
        if (!confirm1) return;

        const confirm2 = window.prompt("Por seguridad, escribe 'ELIMINAR TODO' para confirmar:");
        if (confirm2 !== 'ELIMINAR TODO') {
            showAlert("Cancelado", "La frase de confirmación no coincide.", "error");
            return;
        }

        setSaving(true);
        try {
            const collectionsToClear = ['orders', 'production_needs'];
            for (const collName of collectionsToClear) {
                const q = query(collection(db, collName));
                const snapshot = await getDocs(q);
                const batch = writeBatch(db);
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }

            showAlert("Base de Datos Limpia", "Se han eliminado los pedidos y producciones correctamente.", "success");
        } catch (err: any) {
            console.error("Error resetting DB:", err);
            showAlert("Error", "No se pudo limpiar la base de datos totalmente.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUsers = async () => {
        const confirm1 = window.confirm("¡PELIGRO EXTREMO! Esto eliminará TODOS los usuarios y sus métodos de acceso, EXCEPTO TU CUENTA ACTUAL. ¿Continuar?");
        if (!confirm1) return;

        const confirm2 = window.prompt("Escribe 'ELIMINAR TODO' para confirmar la eliminación de usuarios:");
        if (confirm2 !== 'ELIMINAR TODO') {
            showAlert("Cancelado", "La frase de confirmación no coincide.", "error");
            return;
        }

        setSaving(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("No authenticado en Firebase");
            const token = await currentUser.getIdToken();

            const response = await fetch('/.netlify/functions/delete_users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ exceptUid: currentUser.uid })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error al eliminar usuarios');

            showAlert("Usuarios Eliminados", `Se eliminaron ${data.deletedAuth} cuentas y ${data.deletedFirestore} perfiles.`, "success");
        } catch (err: any) {
            console.error("Error deleting users:", err);
            showAlert("Error Crítico", err.message || "No se pudo completar la eliminación de usuarios.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !settings) {
        return <div className="p-12 text-center text-gray-400 font-bold">Cargando configuraciones...</div>;
    }

    let allTabs = [
        { id: 'pagos', label: 'Pagos', icon: CreditCard },
        { id: 'productos', label: 'Precios', icon: Package },
        { id: 'descuentos', label: 'Descuentos', icon: Percent },
        { id: 'bot', label: 'SensiBot', icon: Bot },
        { id: 'usuarios', label: 'Usuarios', icon: UserPlus },
        { id: 'notifications', label: 'Notificaciones', icon: Bell },
        { id: 'logistica', label: 'Logística', icon: Truck },
        { id: 'promociones', label: 'Promociones', icon: Tag },
        { id: 'developer', label: 'Developer', icon: ShieldAlert },
    ];

    const tabs = user?.role === 'puntoDeVenta' ? allTabs.filter(t => t.id === 'logistica') : allTabs;

    return (
        <div className="space-y-6">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading text-[#D91A2A]">Configuraciones del Sistema</h2>
                    <p className="text-gray-600 font-bold text-sm">Administra precios, pagos e integraciones</p>
                </div>
                {user?.role !== 'puntoDeVenta' && (
                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="bg-[#3E2723] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#2D1C1A] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                        GUARDAR CAMBIOS
                    </button>
                )}
            </header>

            {/* Tabs Navigation */}
            <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === tab.id
                            ? 'bg-[#F2A900] text-[#3E2723] shadow-md border-b-4 border-yellow-700'
                            : 'bg-white text-gray-400 hover:bg-gray-50'
                            }`}
                    >
                        <tab.icon size={20} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-6 md:p-8"
            >
                {activeTab === 'pagos' && (
                    <div className="space-y-8">
                        <div className="pt-4">
                            <h3 className="text-xl font-heading text-[#3E2723] mb-6 flex items-center gap-2">
                                <Globe className="text-[#3E2723]" /> Métodos de Pago Disponibles
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {settings.paymentMethods.map((method, idx) => (
                                    <div key={method.id} className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-[#FDF6E3] rounded-2xl border border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${method.enabled ? 'bg-[#D91A2A] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                                    {method.name[0]}
                                                </div>
                                                <span className="font-bold text-[#3E2723]">{method.name}</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newMethods = [...settings.paymentMethods];
                                                    newMethods[idx].enabled = !newMethods[idx].enabled;
                                                    setSettings({ ...settings, paymentMethods: newMethods });
                                                }}
                                                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${method.enabled ? 'bg-green-500 text-white shadow-md' : 'bg-gray-200 text-gray-500'
                                                    }`}
                                            >
                                                {method.enabled ? 'ACTIVO' : 'INACTIVO'}
                                            </button>
                                        </div>

                                        {/* Dynamic Forms based on method */}
                                        {method.id === 'pago-movil' && method.enabled && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4"
                                            >
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Banco / Entidad</label>
                                                    <input
                                                        type="text"
                                                        value={settings.pagoMovil.bank}
                                                        onChange={(e) => setSettings({ ...settings, pagoMovil: { ...settings.pagoMovil, bank: e.target.value } })}
                                                        className="w-full bg-white border border-gray-200 rounded-xl p-2 text-sm focus:border-[#F2A900] outline-none"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Teléfono</label>
                                                        <input
                                                            type="text"
                                                            value={settings.pagoMovil.phone}
                                                            onChange={(e) => setSettings({ ...settings, pagoMovil: { ...settings.pagoMovil, phone: e.target.value } })}
                                                            className="w-full bg-white border border-gray-200 rounded-xl p-2 text-sm focus:border-[#F2A900] outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Cédula / RIF</label>
                                                        <input
                                                            type="text"
                                                            value={settings.pagoMovil.id}
                                                            onChange={(e) => setSettings({ ...settings, pagoMovil: { ...settings.pagoMovil, id: e.target.value } })}
                                                            className="w-full bg-white border border-gray-200 rounded-xl p-2 text-sm focus:border-[#F2A900] outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Conditional forms based on method */}
                                        {method.id === 'zelle' && method.enabled && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4"
                                            >
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Nombre del Titular</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ej: Nathikas INC"
                                                        value={settings.zelle?.name || ''}
                                                        onChange={(e) => setSettings({ ...settings, zelle: { ...(settings.zelle || { email: '' }), name: e.target.value } })}
                                                        className="w-full bg-white border border-gray-200 rounded-xl p-2 text-sm focus:border-blue-500 outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Correo Electrónico Zelle</label>
                                                    <input
                                                        type="email"
                                                        placeholder="ventas@nathikas.com"
                                                        value={settings.zelle?.email || ''}
                                                        onChange={(e) => setSettings({ ...settings, zelle: { ...(settings.zelle || { name: '' }), email: e.target.value } })}
                                                        className="w-full bg-white border border-gray-200 rounded-xl p-2 text-sm focus:border-blue-500 outline-none"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'productos' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-heading text-[#3E2723] mb-6 flex items-center gap-2">
                            <DollarSign className="text-green-500" /> Precios de Productos
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {products.map(product => (
                                <div key={product.id} className={`p-4 rounded-2xl border transition-colors ${product.enabled ? 'bg-[#FDF6E3] border-gray-100' : 'bg-gray-100 border-gray-200 opacity-75'}`}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleProductStatusChange(product.id, !product.enabled)}
                                                className={`w-10 h-6 rounded-full p-1 transition-colors relative ${product.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                                                title={product.enabled ? "Producto Activo" : "Producto Inactivo"}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${product.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </button>
                                            <span className={`font-bold ${product.enabled ? 'text-[#3E2723]' : 'text-gray-500 line-through'}`}>{product.name}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Precio Base</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        defaultValue={product.price}
                                                        onBlur={(e) => handleProductPriceChange(product.id, parseFloat(e.target.value))}
                                                        className="w-28 bg-white border-2 border-gray-100 rounded-xl p-2 pl-7 focus:border-[#F2A900] outline-none font-bold text-right shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Costo Delivery</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        defaultValue={(product as any).deliveryCost || 0}
                                                        onBlur={(e) => handleProductDeliveryCostChange(product.id, parseFloat(e.target.value) || 0)}
                                                        className="w-28 bg-white border-2 border-gray-100 rounded-xl p-2 pl-7 focus:border-[#F2A900] outline-none font-bold text-right shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <label className="text-[10px] font-bold text-[#D91A2A] uppercase block mb-1">Precio Final</label>
                                                <div className="font-bold text-lg text-[#D91A2A]">
                                                    ${(product.price + ((product as any).deliveryCost || 0)).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 italic mt-4">* Los cambios de precios y costos de delivery se guardan automáticamente al perder el foco (blur) del campo. El precio final es la suma del precio base + costo de delivery.</p>
                    </div>
                )}

                {activeTab === 'descuentos' && (
                    <div className="space-y-8">
                        <h3 className="text-xl font-heading text-[#3E2723] mb-6 flex items-center gap-2">
                            <Percent className="text-[#D91A2A]" /> Tarifas de Descuento por Volumen
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-[#D91A2A]/5 p-6 rounded-3xl border-2 border-[#D91A2A]/10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-[#D91A2A]">Escala 1 ({" > "} 6 unidades)</span>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={settings.discounts.tier1}
                                            onChange={(e) => setSettings({ ...settings, discounts: { ...settings.discounts, tier1: parseInt(e.target.value) } })}
                                            className="w-20 bg-white border-2 border-[#D91A2A]/20 rounded-xl p-3 pr-8 focus:border-[#D91A2A] outline-none font-bold text-right"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 font-bold">Se aplica a todo el carrito si la suma de unidades es mayor a 6.</p>
                            </div>

                            <div className="bg-[#F2A900]/5 p-6 rounded-3xl border-2 border-[#F2A900]/10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-[#F2A900]">Escala 2 ({" > "} 12 unidades)</span>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={settings.discounts.tier2}
                                            onChange={(e) => setSettings({ ...settings, discounts: { ...settings.discounts, tier2: parseInt(e.target.value) } })}
                                            className="w-20 bg-white border-2 border-[#F2A900]/20 rounded-xl p-3 pr-8 focus:border-[#F2A900] outline-none font-bold text-right"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 font-bold">Se aplica a todo el carrito si la suma de unidades es mayor a 12.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'bot' && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-heading text-[#3E2723] flex items-center gap-2">
                                <Bot className="text-blue-500" /> Integración SensiBot
                            </h3>
                            <button
                                onClick={() => setSettings({ ...settings, bot: { ...settings.bot, enabled: !settings.bot.enabled } })}
                                className={`px-6 py-2 rounded-2xl font-bold transition-all ${settings.bot.enabled ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'
                                    }`}
                            >
                                {settings.bot.enabled ? 'BOT ACTIVADO' : 'BOT DESACTIVADO'}
                            </button>
                        </div>

                        <div className={`space-y-6 transition-opacity ${settings.bot.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">URL del Servicio (Webhook)</label>
                                <input
                                    type="text"
                                    placeholder="https://tu-servicio-sensibot.com/webhook"
                                    value={settings.bot.apiUrl}
                                    onChange={(e) => setSettings({ ...settings, bot: { ...settings.bot, apiUrl: e.target.value } })}
                                    className="w-full bg-[#FDF6E3] border-2 border-gray-100 rounded-xl p-4 focus:border-blue-500 outline-none font-medium text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">API Key / Token de Acceso</label>
                                <input
                                    type="password"
                                    placeholder="••••••••••••••••••••"
                                    value={settings.bot.apiKey}
                                    onChange={(e) => setSettings({ ...settings, bot: { ...settings.bot, apiKey: e.target.value } })}
                                    className="w-full bg-[#FDF6E3] border-2 border-gray-100 rounded-xl p-4 focus:border-blue-500 outline-none font-medium text-sm"
                                />
                            </div>
                        </div>

                        {settings.bot.enabled && (
                            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                                <p className="text-blue-700 text-xs font-bold leading-relaxed">
                                    SensiBot recibirá notificaciones en tiempo real sobre nuevos pedidos, pagos confirmados y actualizaciones de producción. Asegúrate de que el webhook sea accesible públicamente.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'usuarios' && (
                    <div className="space-y-8">
                        <h3 className="text-xl font-heading text-[#3E2723] mb-6 flex items-center gap-2">
                            <UserPlus className="text-[#D91A2A]" /> Crear Nuevo Usuario de Staff
                        </h3>

                        <form onSubmit={handleCreateUser} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 max-w-xl space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F2A900] outline-none"
                                    placeholder="ejemplo@nathikas.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Contraseña Temporal</label>
                                <input
                                    type="password"
                                    required
                                    value={newUserPassword}
                                    onChange={(e) => setNewUserPassword(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F2A900] outline-none"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Rol del Sistema</label>
                                <select
                                    value={newUserRole}
                                    onChange={(e) => setNewUserRole(e.target.value as any)}
                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F2A900] outline-none font-bold"
                                >
                                    <option value="vendedor">Vendedor (Ventas / Inventario)</option>
                                    <option value="asistente">Asistente (Producción / Pedidos)</option>
                                    <option value="administrator">Administrador (Acceso Total)</option>
                                    <option value="puntoDeVenta">Punto de Venta</option>
                                </select>
                            </div>

                            {newUserRole === 'puntoDeVenta' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Local Asignado</label>
                                    <select
                                        value={newUserPickupId}
                                        onChange={(e) => setNewUserPickupId(e.target.value)}
                                        required
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F2A900] outline-none font-bold"
                                    >
                                        <option value="" disabled>Selecciona un punto de retiro o delivery</option>
                                        {pickupPoints.map(point => (
                                            <option key={point.id} value={point.id}>
                                                {point.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={isCreatingUser}
                                className="w-full bg-[#D91A2A] text-white py-3 rounded-xl font-bold hover:bg-[#B71524] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isCreatingUser ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
                                CREAR USUARIO
                            </button>
                        </form>
                        <div className="flex gap-2 p-4 bg-yellow-50 rounded-2xl border border-yellow-100 items-start max-w-xl">
                            <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] text-yellow-700 font-bold leading-normal">
                                Nota: Los nuevos usuarios podrán iniciar sesión con estas credenciales. Se recomienda que cambien su contraseña en su primer ingreso si es posible.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="space-y-8">
                        <header className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-heading text-[#3E2723] flex items-center gap-2">
                                    <Bell className="text-[#D91A2A]" /> Configuración de Notificaciones
                                </h3>
                                <p className="text-xs text-gray-500 font-bold mt-1">Usa {"{{userName}}"}, {"{{orderId}}"} y {"{{status}}"} como variables.</p>
                            </div>
                        </header>

                        {(['pagado', 'despachado', 'cancelado'] as const).map((status) => (
                            <div key={status} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-6">
                                <h4 className="font-bold text-[#D91A2A] uppercase flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#D91A2A]" />
                                    Estado: {status}
                                </h4>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Email Template */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700 border-b pb-2">
                                            <Mail size={16} /> Correo Electrónico
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400">ASUNTO</label>
                                                <input
                                                    type="text"
                                                    value={settings.notifications.email[status].subject}
                                                    onChange={(e) => {
                                                        const newNotif = { ...settings.notifications };
                                                        newNotif.email[status].subject = e.target.value;
                                                        setSettings({ ...settings, notifications: newNotif });
                                                    }}
                                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F2A900] outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400">CUERPO (TEXTO/HTML)</label>
                                                <textarea
                                                    value={settings.notifications.email[status].body}
                                                    onChange={(e) => {
                                                        const newNotif = { ...settings.notifications };
                                                        newNotif.email[status].body = e.target.value;
                                                        setSettings({ ...settings, notifications: newNotif });
                                                    }}
                                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F2A900] outline-none h-32 resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Push Notification Template */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700 border-b pb-2">
                                            <Smartphone size={16} /> Notificación Push
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400">TÍTULO</label>
                                                <input
                                                    type="text"
                                                    value={settings.notifications.push[status].title}
                                                    onChange={(e) => {
                                                        const newNotif = { ...settings.notifications };
                                                        newNotif.push[status].title = e.target.value;
                                                        setSettings({ ...settings, notifications: newNotif });
                                                    }}
                                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#D91A2A] outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400">MENSAJE CORTO</label>
                                                <textarea
                                                    value={settings.notifications.push[status].body}
                                                    onChange={(e) => {
                                                        const newNotif = { ...settings.notifications };
                                                        newNotif.push[status].body = e.target.value;
                                                        setSettings({ ...settings, notifications: newNotif });
                                                    }}
                                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#D91A2A] outline-none h-32 resize-none"
                                                    maxLength={150}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'logistica' && (
                    <div className="space-y-8">
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <h3 className="text-xl font-heading text-[#3E2723] flex items-center gap-2">
                                <Store className="text-[#F2A900]" /> Puntos de Retiro / Delivery Fijo
                            </h3>
                            {user?.role !== 'puntoDeVenta' && (
                                <button
                                    onClick={() => setIsAddingPickup(!isAddingPickup)}
                                    className="bg-[#D91A2A] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#B71524] transition-all text-sm"
                                >
                                    <Plus size={16} /> AÑADIR LOCAL
                                </button>
                            )}
                        </header>

                        {isAddingPickup && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-50 p-6 rounded-3xl border-2 border-[#D91A2A]/20 space-y-4 mb-8"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Nombre del Local"
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F2A900] outline-none"
                                        value={newPickup.name || ''}
                                        onChange={e => setNewPickup({ ...newPickup, name: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Teléfono"
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F2A900] outline-none"
                                        value={newPickup.phone || ''}
                                        onChange={e => setNewPickup({ ...newPickup, phone: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Ciudad"
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F2A900] outline-none"
                                        value={newPickup.city || ''}
                                        onChange={e => setNewPickup({ ...newPickup, city: e.target.value })}
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Dirección Exacta"
                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F2A900] outline-none"
                                    value={newPickup.address || ''}
                                    onChange={e => setNewPickup({ ...newPickup, address: e.target.value })}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400">RADIO DELIVERY (KM)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F2A900] outline-none"
                                            value={newPickup.deliveryRadius || 5}
                                            onChange={e => setNewPickup({ ...newPickup, deliveryRadius: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-[10px] font-bold text-gray-400">COSTO DELIVERY ($)</label>
                                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    className="w-3.5 h-3.5 accent-[#D91A2A]"
                                                    checked={!!(newPickup as any).deliveryCostNegotiable}
                                                    onChange={e => setNewPickup({ ...newPickup, deliveryCostNegotiable: e.target.checked } as any)}
                                                />
                                                <span className="text-[9px] font-bold text-[#D91A2A] uppercase">Negociable</span>
                                            </label>
                                        </div>
                                        <input
                                            type="number"
                                            disabled={!!(newPickup as any).deliveryCostNegotiable}
                                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F2A900] outline-none disabled:opacity-40 disabled:bg-gray-100"
                                            value={(newPickup as any).deliveryCostNegotiable ? 0 : (newPickup.deliveryCost || 2)}
                                            onChange={e => setNewPickup({ ...newPickup, deliveryCost: parseFloat(e.target.value) })}
                                        />
                                        {(newPickup as any).deliveryCostNegotiable && (
                                            <p className="text-[9px] text-[#D91A2A] font-bold mt-1">Se coordinara con el gestor de envios</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400">UBICACIÓN EN MAPA</label>
                                    <LocationMap onLocationSelect={(lat, lng) => setNewPickup({ ...newPickup, lat, lng })} />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={() => setIsAddingPickup(false)}
                                        className="px-4 py-2 text-gray-500 font-bold hover:text-gray-700"
                                    >
                                        CANCELAR
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!newPickup.name || !newPickup.lat) {
                                                showAlert("Error", "Completa nombre y ubicación", "error");
                                                return;
                                            }
                                            await addDoc(collection(db, "pickup_points"), { ...newPickup, createdAt: serverTimestamp() });
                                            setIsAddingPickup(false);
                                            setNewPickup({ enabled: true, deliveryRadius: 5, deliveryCost: 2, city: '' });
                                            showAlert("Éxito", "Punto de retiro agregado", "success");
                                        }}
                                        className="bg-[#D91A2A] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#B71524] shadow-md"
                                    >
                                        GUARDAR PUNTO
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {pickupPoints.filter(p => user?.role === 'puntoDeVenta' ? p.id === user?.pickupId : true).map(point => (
                                <div key={point.id} className="bg-[#FDF6E3] p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-[#3E2723] text-lg">{point.name}</h4>
                                                <span className="text-[10px] bg-[#D91A2A]/10 text-[#D91A2A] px-2 py-0.5 rounded-full font-bold uppercase">{point.city}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">{point.address}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    if (editingPickupId === point.id) {
                                                        setEditingPickupId(null);
                                                        setEditingPickup({});
                                                    } else {
                                                        setEditingPickupId(point.id);
                                                        setEditingPickup({ deliveryRadius: point.deliveryRadius, deliveryCost: point.deliveryCost });
                                                    }
                                                }}
                                                className="text-[#F2A900] p-2 hover:bg-yellow-50 rounded-full transition-colors"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            </button>
                                            {user?.role !== 'puntoDeVenta' && (
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm("¿Eliminar este punto?")) {
                                                            const batch = writeBatch(db);
                                                            batch.delete(doc(db, "pickup_points", point.id));
                                                            await batch.commit();
                                                            showAlert("Eliminado", "Punto eliminado", "info");
                                                        }
                                                    }}
                                                    className="text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {editingPickupId === point.id ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="grid grid-cols-2 gap-4 text-xs mb-3"
                                        >
                                            <div className="space-y-1">
                                                <label className="block text-gray-400 font-bold uppercase">Radio Delivery (KM)</label>
                                                <input
                                                    type="number"
                                                    min="0.5"
                                                    step="0.5"
                                                    value={editingPickup.deliveryRadius ?? point.deliveryRadius}
                                                    onChange={e => setEditingPickup(p => ({ ...p, deliveryRadius: parseFloat(e.target.value) }))}
                                                    className="w-full bg-white border-2 border-[#F2A900] rounded-xl p-2 text-sm font-bold focus:outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <label className="block text-gray-400 font-bold uppercase">Costo Delivery ($)</label>
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="w-3 h-3 accent-[#D91A2A]"
                                                            checked={!!(editingPickup as any).deliveryCostNegotiable}
                                                            onChange={e => setEditingPickup(p => ({ ...p, deliveryCostNegotiable: e.target.checked } as any))}
                                                        />
                                                        <span className="text-[9px] font-bold text-[#D91A2A] uppercase">Negociable</span>
                                                    </label>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    disabled={!!(editingPickup as any).deliveryCostNegotiable}
                                                    value={editingPickup.deliveryCost ?? point.deliveryCost}
                                                    onChange={e => setEditingPickup(p => ({ ...p, deliveryCost: parseFloat(e.target.value) }))}
                                                    className="w-full bg-white border-2 border-[#F2A900] rounded-xl p-2 text-sm font-bold focus:outline-none disabled:opacity-40 disabled:bg-gray-100"
                                                />
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    const isNeg = !!(editingPickup as any).deliveryCostNegotiable;
                                                    await updateDoc(doc(db, "pickup_points", point.id), {
                                                        deliveryRadius: editingPickup.deliveryRadius ?? point.deliveryRadius,
                                                        deliveryCost: isNeg ? 0 : (editingPickup.deliveryCost ?? point.deliveryCost),
                                                        deliveryCostNegotiable: isNeg,
                                                    });
                                                    setEditingPickupId(null);
                                                    setEditingPickup({});
                                                    showAlert("¡Guardado!", "Delivery actualizado.", "success");
                                                }}
                                                className="col-span-2 bg-[#D91A2A] text-white py-2 rounded-xl text-xs font-bold hover:bg-[#B71524] transition-all"
                                            >
                                                GUARDAR CAMBIOS
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div className="bg-white p-3 rounded-xl border border-gray-100">
                                                <span className="block text-gray-400 font-bold uppercase mb-1">Radio Delivery</span>
                                                <span className="font-bold text-[#3E2723]">{point.deliveryRadius} KM</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-gray-100">
                                                <span className="block text-gray-400 font-bold uppercase mb-1">Costo Delivery</span>
                                                {(point as any).deliveryCostNegotiable ? (
                                                    <span className="font-bold text-[#D91A2A]">A CONVENIR</span>
                                                ) : (
                                                    <span className="font-bold text-[#D91A2A]">${point.deliveryCost.toFixed(2)}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {user?.role !== 'puntoDeVenta' && (
                                        <div className="mt-4 flex items-center gap-2">
                                            <button
                                                onClick={async () => {
                                                    await updateDoc(doc(db, "pickup_points", point.id), { enabled: !point.enabled });
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${point.enabled ? 'bg-green-500 text-white border-green-600' : 'bg-gray-200 text-gray-500 border-gray-300'}`}
                                            >
                                                {point.enabled ? 'ACTIVO' : 'INACTIVO'}
                                            </button>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Estado de operaciones</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'promociones' && (
                    <div className="space-y-8">
                        <header className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-heading text-[#3E2723] flex items-center gap-2">
                                    <Tag className="text-[#F2A900]" /> Gestión de Promociones
                                </h3>
                                <p className="text-xs text-gray-500 font-bold mt-1">Destaca ofertas con tiempo limitado en la tienda.</p>
                            </div>
                            <button
                                onClick={() => setIsAddingPromo(true)}
                                className="bg-[#F2A900] text-[#3E2723] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#e09b00] transition-all shadow-md"
                            >
                                <Plus size={18} /> AGREGAR PROMO
                            </button>
                        </header>

                        {isAddingPromo && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-50 p-6 rounded-3xl border-2 border-[#F2A900]/20 space-y-4 mb-8"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Título de la Promo"
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F2A900] outline-none"
                                        value={newPromo.title || ''}
                                        onChange={e => setNewPromo({ ...newPromo, title: e.target.value })}
                                    />
                                    <select
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F2A900] outline-none font-bold"
                                        value={newPromo.type || 'info'}
                                        onChange={e => setNewPromo({ ...newPromo, type: e.target.value as any })}
                                    >
                                        <option value="info">Informativa</option>
                                        <option value="discount">Descuento (%)</option>
                                        <option value="fixed">Precio Fijo ($)</option>
                                        <option value="combo">Combo (Productos específicos)</option>
                                    </select>
                                </div>
                                <textarea
                                    placeholder="Descripción corta"
                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F2A900] outline-none h-24 resize-none"
                                    value={newPromo.description || ''}
                                    onChange={e => setNewPromo({ ...newPromo, description: e.target.value })}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400">FECHA DE CADUCIDAD</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F2A900] outline-none"
                                            onChange={e => setNewPromo({ ...newPromo, expiresAt: new Date(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400">URL IMAGEN (OPCIONAL)</label>
                                        <input
                                            type="text"
                                            placeholder="https://..."
                                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F2A900] outline-none"
                                            value={newPromo.image || ''}
                                            onChange={e => setNewPromo({ ...newPromo, image: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Product Selection for Promo */}
                                <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-100">
                                    <h5 className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                                        <Package size={14} /> PRODUCTOS EN PROMOCIÓN (DEJA EN BLANCO PARA TODA LA TIENDA)
                                    </h5>
                                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {products.map(product => {
                                            const isSelected = newPromo.applicableProducts?.some(p => p.productId === product.id);
                                            const promoProduct = newPromo.applicableProducts?.find(p => p.productId === product.id);

                                            return (
                                                <div key={product.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected ? 'border-[#F2A900] bg-[#F2A900]/5' : 'border-gray-100 bg-gray-50'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                const updated = [...(newPromo.applicableProducts || [])];
                                                                if (e.target.checked) {
                                                                    updated.push({ productId: product.id, productName: product.name, promoPrice: product.price });
                                                                } else {
                                                                    const index = updated.findIndex(p => p.productId === product.id);
                                                                    if (index > -1) updated.splice(index, 1);
                                                                }
                                                                setNewPromo({ ...newPromo, applicableProducts: updated });
                                                            }}
                                                            className="w-4 h-4 accent-[#F2A900]"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-bold text-[#3E2723]">{product.name}</p>
                                                            <p className="text-[10px] text-gray-400">Precio Ref: ${product.price}</p>
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold text-[#F2A900]">$ PROMO:</span>
                                                            <input
                                                                type="number"
                                                                className="w-20 bg-white border border-[#F2A900] rounded-lg p-1 text-xs font-bold focus:outline-none"
                                                                value={promoProduct?.promoPrice || 0}
                                                                onChange={(e) => {
                                                                    const updated = [...(newPromo.applicableProducts || [])];
                                                                    const index = updated.findIndex(p => p.productId === product.id);
                                                                    if (index > -1) {
                                                                        updated[index].promoPrice = parseFloat(e.target.value);
                                                                        setNewPromo({ ...newPromo, applicableProducts: updated });
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={() => setIsAddingPromo(false)}
                                        className="px-4 py-2 text-gray-500 font-bold hover:text-gray-700"
                                    >
                                        CANCELAR
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!newPromo.title || !newPromo.expiresAt) {
                                                showAlert("Error", "Título y Fecha son requeridos", "error");
                                                return;
                                            }
                                            await addDoc(collection(db, "promotions"), { ...newPromo, createdAt: serverTimestamp() });
                                            setIsAddingPromo(false);
                                            setNewPromo({ enabled: true, type: 'info' });
                                            showAlert("Éxito", "Promoción creada", "success");
                                        }}
                                        className="bg-[#F2A900] text-[#3E2723] px-6 py-2 rounded-xl font-bold hover:bg-[#e09b00] shadow-md"
                                    >
                                        GUARDAR PROMO
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {promotions.map(promo => {
                                const isExpired = promo.expiresAt?.toDate ? promo.expiresAt.toDate() < new Date() : false;
                                return (
                                    <div key={promo.id} className={`p-6 rounded-3xl border shadow-sm relative overflow-hidden flex flex-col justify-between ${isExpired ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-100'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isExpired ? 'bg-gray-200 text-gray-400' : 'bg-[#F2A900] text-[#3E2723]'}`}>
                                                    <Tag size={16} />
                                                </div>
                                                <h4 className="font-bold text-[#3E2723] text-sm">{promo.title}</h4>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm("¿Eliminar promo?")) {
                                                        await deleteDoc(doc(db, "promotions", promo.id));
                                                        showAlert("Eliminada", "Promoción eliminada", "info");
                                                    }
                                                }}
                                                className="text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <p className="text-xs text-gray-500 mb-4 line-clamp-2">{promo.description}</p>

                                        {promo.applicableProducts && promo.applicableProducts.length > 0 && (
                                            <div className="mb-4 space-y-1">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase">Productos:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {promo.applicableProducts.map(p => (
                                                        <span key={p.productId} className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                                                            {p.productName}: ${p.promoPrice}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 border-t pt-3">
                                                <Clock size={12} />
                                                CADUCA: {promo.expiresAt?.toDate ? promo.expiresAt.toDate().toLocaleString() : 'N/A'}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <button
                                                    onClick={async () => {
                                                        await updateDoc(doc(db, "promotions", promo.id), { enabled: !promo.enabled });
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${promo.enabled ? 'bg-green-500 text-white border-green-600' : 'bg-gray-200 text-gray-500 border-gray-300'}`}
                                                >
                                                    {promo.enabled ? 'ACTIVO' : 'INACTIVO'}
                                                </button>
                                                {isExpired && <span className="text-red-500 font-bold text-[10px] uppercase">Vencida</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'developer' && (
                    <div className="space-y-8">
                        <div className="flex items-center gap-2 mb-6 text-red-600">
                            <ShieldAlert size={24} />
                            <h3 className="text-xl font-heading">Zona de Peligro (Developer)</h3>
                        </div>

                        <div className="bg-red-50 p-8 rounded-[2rem] border-2 border-red-100 space-y-6">
                            <div>
                                <h4 className="font-bold text-red-800">Limpieza de Base de Datos</h4>
                                <p className="text-sm text-red-600/70 mt-1 font-bold">
                                    Esta acción eliminará de forma irreversible todos los registros de <span className="underline">Pedidos</span> y <span className="underline">Producción</span>.
                                    Los perfiles de usuario y las configuraciones globales se mantendrán intactos.
                                </p>
                            </div>

                            <button
                                onClick={handleResetDatabase}
                                className="bg-white border-2 border-red-200 text-red-600 px-8 py-4 rounded-2xl font-bold hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm flex items-center gap-3 active:scale-95 w-full md:w-auto justify-center"
                            >
                                <Trash2 size={24} />
                                REINICIAR PEDIDOS Y PRODUCCIÓN
                            </button>

                            <button
                                onClick={handleDeleteUsers}
                                className="bg-red-600 border-2 border-red-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-red-700 hover:border-red-700 transition-all shadow-md flex items-center gap-3 active:scale-95 w-full md:w-auto justify-center"
                            >
                                <UserPlus size={24} className="rotate-45" /> {/* Simulating a UserDelete icon */}
                                ELIMINAR TODOS LOS USUARIOS
                            </button>

                            <div className="border-t border-red-100 pt-6">
                                <p className="text-[10px] text-red-400 font-bold flex items-center gap-2">
                                    <Smartphone size={14} /> ID del Admin Actual: {useAuthStore.getState().user?.uid}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
