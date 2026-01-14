import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Clock, Truck, CheckCircle, Search, Calendar, ChevronRight } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    customerId: string;
    items: OrderItem[];
    total: number;
    status: 'pendiente' | 'pagado' | 'produccion' | 'despachado' | 'entregado' | 'cancelado';
    createdAt: any;
    selectedAgency?: string;
    shippingMethod?: string;
    paymentBank?: string;
}

interface UserOrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UserOrdersModal({ isOpen, onClose }: UserOrdersModalProps) {
    const { user } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !user || !user.uid) return;

        setLoading(true);
        // Query orders where customerId == current user uid
        const q = query(
            collection(db, "orders"),
            where("customerId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData: Order[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Order));
            setOrders(ordersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user orders:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen, user]);

    // Format helpers
    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Fecha desconocida';
        // Handle Firestore Timestamp
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('es-VE', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'pagado': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'produccion': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'despachado': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'entregado': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelado': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pendiente': return <Clock size={16} />;
            case 'pagado': return <CheckCircle size={16} />;
            case 'despachado': return <Truck size={16} />;
            case 'entregado': return <Package size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const getStatusLabel = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 m-auto z-[101] w-full max-w-2xl h-[85vh] bg-[#FDF6E3] rounded-3xl shadow-2xl flex flex-col border-4 border-[#F2A900] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-[#3E2723]/10 bg-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="bg-[#D91A2A]/10 p-3 rounded-xl text-[#D91A2A]">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold font-heading text-[#3E2723]">Mis Pedidos</h2>
                                    <p className="text-sm text-gray-500">Historial reciente de tus compras</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={24} className="text-[#3E2723]" />
                            </button>
                        </div>

                        {/* Order List */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-48 gap-4 opacity-50">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D91A2A]"></div>
                                    <p>Cargando pedidos...</p>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12 opacity-60">
                                    <Package size={64} className="mb-4 text-gray-300" />
                                    <h3 className="text-xl font-bold mb-2">Aún no tienes pedidos</h3>
                                    <p className="max-w-xs text-sm">Tus compras aparecerán aquí una vez que realices tu primer pedido.</p>
                                </div>
                            ) : (
                                orders.map((order) => (
                                    <motion.div
                                        key={order.id}
                                        layoutId={order.id}
                                        className="bg-white rounded-2xl p-5 shadow-sm border border-[#3E2723]/5 hover:border-[#D91A2A]/30 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`p-2 rounded-lg border ${getStatusColor(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-[#3E2723]">#{order.id.slice(-6).toUpperCase()}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${getStatusColor(order.status)}`}>
                                                            {getStatusLabel(order.status)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Calendar size={12} />
                                                        {formatDate(order.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-[#D91A2A]">${order.total.toFixed(2)}</div>
                                                <div className="text-xs text-gray-500">{order.items.length} productos</div>
                                            </div>
                                        </div>

                                        {/* Simplified Items Preview */}
                                        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 space-y-1">
                                            {order.items.slice(0, 3).map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center">
                                                    <span className="truncate flex-1 pr-4">
                                                        <span className="font-bold text-[#D91A2A] mr-1">{item.quantity}x</span>
                                                        {item.name}
                                                    </span>
                                                    <span className="text-gray-400 font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                            {order.items.length > 3 && (
                                                <div className="text-xs text-gray-400 italic pt-1">
                                                    + {order.items.length - 3} productos más...
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
