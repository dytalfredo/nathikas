import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, collection, onSnapshot, query, writeBatch, getDocs } from 'firebase/firestore';
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
    AlertCircle
} from 'lucide-react';
import { useAlertStore } from '../../store/alertStore';

interface ProductPrice {
    id: string;
    name: string;
    price: number;
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
}

export default function SettingsView() {
    const [activeTab, setActiveTab] = useState<'pagos' | 'productos' | 'descuentos' | 'bot' | 'usuarios' | 'developer'>('pagos');
    const [settings, setSettings] = useState<GlobalSettings | null>(null);
    const [products, setProducts] = useState<ProductPrice[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const showAlert = useAlertStore(state => state.showAlert);

    // User Creation State
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<'administrator' | 'asistente' | 'vendedor'>('vendedor');
    const [isCreatingUser, setIsCreatingUser] = useState(false);

    useEffect(() => {
        if (!db) return;

        // Load Global Settings
        const loadSettings = async () => {
            try {
                const settingsDoc = await getDoc(doc(db, "settings", "global"));
                if (settingsDoc.exists()) {
                    setSettings(settingsDoc.data() as GlobalSettings);
                } else {
                    // Default settings if none exist
                    const defaultSettings: GlobalSettings = {
                        pagoMovil: { bank: '0102 - Banco de Venezuela', phone: '0414-1234567', id: '12345678' },
                        discounts: { tier1: 5, tier2: 10 },
                        bot: { apiUrl: '', apiKey: '', enabled: false },
                        zelle: { name: '', email: '' },
                        paymentMethods: [
                            { id: 'pago-movil', name: 'Pago Móvil', enabled: true },
                            { id: 'zelle', name: 'Zelle', enabled: false },
                            { id: 'binance', name: 'Binance', enabled: false }
                        ]
                    };
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
                productsData.push({ id: doc.id, name: doc.data().name, price: doc.data().price || 0 });
            });
            setProducts(productsData);
            setLoading(false);
        });

        loadSettings();
        return () => unsubProducts();
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
        } catch (err) {
            console.error("Error updating price:", err);
            showAlert("Error", "No se pudo actualizar el precio.", "error");
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
            const firebaseConfig = {
                apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
                authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
                projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
                storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                appId: import.meta.env.PUBLIC_FIREBASE_APP_ID
            };

            const { initializeApp, deleteApp } = await import('firebase/app');
            const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');

            const secondaryApp = initializeApp(firebaseConfig, "Secondary");
            const secondaryAuth = getAuth(secondaryApp);

            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUserEmail, newUserPassword);
            const uid = userCredential.user.uid;

            await setDoc(doc(db, "users", uid), {
                email: newUserEmail,
                role: newUserRole,
                name: newUserEmail.split('@')[0],
                createdAt: new Date(),
                isAnonymous: false
            });

            await deleteApp(secondaryApp);
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

    if (loading || !settings) {
        return <div className="p-12 text-center text-gray-400 font-bold">Cargando configuraciones...</div>;
    }

    const tabs = [
        { id: 'pagos', label: 'Pagos', icon: CreditCard },
        { id: 'productos', label: 'Precios', icon: Package },
        { id: 'descuentos', label: 'Descuentos', icon: Percent },
        { id: 'bot', label: 'SensiBot', icon: Bot },
        { id: 'usuarios', label: 'Usuarios', icon: UserPlus },
        { id: 'developer', label: 'Developer', icon: ShieldAlert },
    ];

    return (
        <div className="space-y-6">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading text-[#D91A2A]">Configuraciones del Sistema</h2>
                    <p className="text-gray-600 font-bold text-sm">Administra precios, pagos e integraciones</p>
                </div>
                <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="bg-[#3E2723] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#2D1C1A] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                    GUARDAR CAMBIOS
                </button>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {products.map(product => (
                                <div key={product.id} className="flex items-center justify-between p-4 bg-[#FDF6E3] rounded-2xl border border-gray-100 group">
                                    <span className="font-bold text-[#3E2723]">{product.name}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                defaultValue={product.price}
                                                onBlur={(e) => handleProductPriceChange(product.id, parseFloat(e.target.value))}
                                                className="w-24 bg-white border-2 border-gray-100 rounded-xl p-2 pl-7 focus:border-[#F2A900] outline-none font-bold text-right shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 italic mt-4">* Los cambios de precios se guardan automáticamente al perder el foco (blur) del campo.</p>
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
                                </select>
                            </div>
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
                                className="bg-white border-2 border-red-200 text-red-600 px-8 py-4 rounded-2xl font-bold hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm flex items-center gap-3 active:scale-95"
                            >
                                <Trash2 size={24} />
                                REINICIAR PEDIDOS Y PRODUCCIÓN
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
