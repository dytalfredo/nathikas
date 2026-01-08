import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where, writeBatch, increment, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    CheckCircle2,
    Truck,
    Eye,
    MessageCircle,
    Copy,
    Search,
    Filter,
    X,
    User,
    Package
} from 'lucide-react';

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    userName: string;
    userPhone: string;
    items: OrderItem[];
    total: number;
    subtotal: number;
    shippingMethod: string;
    selectedCity: string;
    selectedState: string;
    selectedAgency?: string;
    paymentBank: string;
    paymentReference: string;
    paymentId: string;
    paymentPhone: string;
    userEmail?: string;
    cancelReason?: string;
    status: 'pendiente' | 'pagado' | 'despachado' | 'entregado' | 'cancelado';
    createdAt: any;
}

export default function OrdersView({ filterByStatus, title }: { filterByStatus?: string, title?: string }) {
    const { user } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        // No intentar leer si no hay usuario o no tiene rol administrativo
        if (!user || !['administrator', 'asistente', 'vendedor'].includes(user.role || '')) {
            setLoading(false);
            return;
        }

        let q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

        if (filterByStatus) {
            q = query(collection(db, "orders"), where("status", "==", filterByStatus), orderBy("createdAt", "desc"));
        }

        const unsub = onSnapshot(q,
            (snapshot) => {
                const ordersData: Order[] = [];
                snapshot.forEach((doc) => {
                    ordersData.push({ id: doc.id, ...doc.data() } as Order);
                });
                setOrders(ordersData);
                setLoading(false);
            },
            (err) => {
                console.error("Error en snapshot de pedidos:", err);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [filterByStatus, user?.role]);

    const updateStatus = async (orderId: string, newStatus: string) => {
        const order = orders.find(o => o.id === orderId) || selectedOrder;
        if (!order) return;

        let reason = '';
        if (newStatus === 'cancelado') {
            reason = window.prompt("Escribe el motivo de la cancelación:") || '';
            if (!reason) {
                alert("Debes indicar un motivo para cancelar.");
                return;
            }
        }

        // Si ya está cancelado y se intenta volver a cancelar, no hacer nada
        if (order.status === 'cancelado' && newStatus === 'cancelado') return;

        try {
            const batch = writeBatch(db);
            const orderRef = doc(db, "orders", orderId);

            // CASO A: Pedido se CANCELA -> Se devuelve el stock al inventario
            if (newStatus === 'cancelado' && order.status !== 'cancelado') {
                order.items.forEach(item => {
                    const productRef = doc(db, "products", item.id);
                    batch.update(productRef, {
                        stock: increment(item.quantity)
                    });
                });
                batch.update(orderRef, { cancelReason: reason });
            }

            // CASO B: Pedido CANCELADO se REACTIVA -> Se vuelve a quitar stock
            if (order.status === 'cancelado' && newStatus !== 'cancelado') {
                // Validación rápida de stock antes de reactivar
                for (const item of order.items) {
                    const productSnap = await getDoc(doc(db, "products", item.id));
                    const currentStock = productSnap.data()?.stock || 0;
                    if (currentStock < item.quantity) {
                        alert(`No hay stock suficiente de ${item.name} para reactivar este pedido.`);
                        return;
                    }
                }

                order.items.forEach(item => {
                    const productRef = doc(db, "products", item.id);
                    batch.update(productRef, {
                        stock: increment(-item.quantity)
                    });
                });
            }

            batch.update(orderRef, { status: newStatus });
            await batch.commit();

            // Enviar Notificación por Correo
            if (order.userEmail && ['pagado', 'despachado', 'cancelado'].includes(newStatus)) {
                try {
                    await fetch('/api/send-notification', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            to: order.userEmail,
                            userName: order.userName,
                            orderId: order.id,
                            status: newStatus,
                            reason: reason,
                        })
                    });
                } catch (emailErr) {
                    console.error("Error enviando correo:", emailErr);
                }
            }

            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus as any, cancelReason: reason });
            }
        } catch (err: any) {
            console.error("Error al actualizar estado:", err);
            alert("Error al actualizar: " + (err.message || "Permisos insuficientes"));
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            pagado: 'bg-blue-100 text-blue-700 border-blue-200',
            despachado: 'bg-purple-100 text-purple-700 border-purple-200',
            entregado: 'bg-green-100 text-green-700 border-green-200',
            cancelado: 'bg-red-100 text-red-700 border-red-200',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase ${styles[status as keyof typeof styles]}`}>
                {status}
            </span>
        );
    };

    if (loading) return <div className="p-12 text-center text-gray-500 font-bold">Cargando pedidos...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-heading text-[#D91A2A]">{title || "Ventas y Pedidos"}</h2>
                    <p className="text-gray-600 font-bold">Monitorea y gestiona las compras realizadas</p>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente o ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-white border-2 border-white rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-[#F2A900] w-64 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-white hidden md:block">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#FDF6E3] border-b">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Orden</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Cliente</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Total</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-xs">#{order.id.slice(0, 8)}</p>
                                        <p className="text-[10px] text-gray-400">{order.createdAt?.toDate().toLocaleDateString()}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-[#FDF6E3] rounded-full flex items-center justify-center text-[#D91A2A]">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm leading-tight">{order.userName}</p>
                                                <p className="text-xs text-blue-600">{order.userPhone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold text-[#D91A2A]">${order.total.toFixed(2)}</td>
                                    <td className="p-4 text-black">
                                        <StatusBadge status={order.status} />
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="p-2 bg-gray-100 hover:bg-[#F2A900] hover:text-[#3E2723] rounded-lg transition-all"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {orders.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 font-bold bg-white rounded-3xl">No hay pedidos.</div>
                ) : (
                    orders.map((order) => (
                        <motion.div
                            key={order.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedOrder(order)}
                            className="bg-white p-4 rounded-3xl shadow-md border-2 border-white flex items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[#FDF6E3] rounded-2xl flex items-center justify-center text-[#D91A2A] shrink-0">
                                    <User size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-heading text-sm text-[#D91A2A] truncate">#{order.id.slice(0, 8)}</p>
                                    <p className="font-bold text-sm text-[#3E2723] truncate">{order.userName}</p>
                                    <p className="text-[10px] text-gray-400">{order.createdAt?.toDate().toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="font-bold text-[#D91A2A] mb-1">${order.total.toFixed(2)}</p>
                                <StatusBadge status={order.status} />
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Order Details Modal / Mobile Drawer */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            className="bg-[#FDF6E3] w-full max-w-4xl h-[95vh] md:h-auto md:max-h-[90vh] rounded-t-[2.5rem] md:rounded-3xl shadow-2xl overflow-hidden border-t-4 md:border-4 border-[#F2A900] flex flex-col"
                        >
                            <div className="bg-[#D91A2A] p-4 flex items-center justify-between text-white">
                                <h3 className="font-heading text-2xl">Detalle del Pedido</h3>
                                <button onClick={() => setSelectedOrder(null)}><X /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                        <h4 className="font-bold text-sm text-[#D91A2A] mb-3 uppercase flex items-center gap-2">
                                            <User size={16} /> Info Cliente
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-400 text-xs">Nombre</p>
                                                <p className="font-bold">{selectedOrder.userName}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs">Teléfono</p>
                                                <p className="font-bold text-blue-600">{selectedOrder.userPhone}</p>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                        <h4 className="font-bold text-sm text-[#D91A2A] mb-3 uppercase flex items-center gap-2">
                                            <Truck size={16} /> Envío
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="text-gray-400">Método:</span> <span className="font-bold capitalize">{selectedOrder.shippingMethod}</span></p>
                                            <p><span className="text-gray-400">Destino:</span> <span className="font-bold">{selectedOrder.selectedState}, {selectedOrder.selectedCity}</span></p>
                                            {selectedOrder.selectedAgency && (
                                                <p><span className="text-gray-400">Agencia:</span> <span className="font-bold">{selectedOrder.selectedAgency}</span></p>
                                            )}
                                        </div>
                                    </section>

                                    <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                        <h4 className="font-bold text-sm text-[#D91A2A] mb-3 uppercase flex items-center gap-2">
                                            <Truck size={16} /> Pago Móvil
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-400 text-xs">Banco</p>
                                                <p className="font-bold">{selectedOrder.paymentBank}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs">Referencia</p>
                                                <p className="font-bold">{selectedOrder.paymentReference}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs">ID Pagador</p>
                                                <p className="font-bold">{selectedOrder.paymentId}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs">Telf Pago</p>
                                                <p className="font-bold">{selectedOrder.paymentPhone}</p>
                                            </div>
                                            {selectedOrder.userEmail && (
                                                <div className="col-span-2">
                                                    <p className="text-gray-400 text-xs">Correo</p>
                                                    <p className="font-bold text-[#D91A2A]">{selectedOrder.userEmail}</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {selectedOrder.status === 'cancelado' && selectedOrder.cancelReason && (
                                        <section className="bg-red-50 p-4 rounded-2xl border border-red-100 italic">
                                            <p className="text-xs text-red-400 mb-1 font-bold uppercase">Motivo de Cancelación:</p>
                                            <p className="text-sm text-red-700">"{selectedOrder.cancelReason}"</p>
                                        </section>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                        <h4 className="font-bold text-sm text-[#D91A2A] mb-3 uppercase flex items-center gap-2">
                                            <Package size={16} /> Productos
                                        </h4>
                                        <div className="space-y-3">
                                            {selectedOrder.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0">
                                                    <div>
                                                        <p className="font-bold">{item.name}</p>
                                                        <p className="text-xs text-gray-400">Cant: {item.quantity}</p>
                                                    </div>
                                                    <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                                                </div>
                                            ))}
                                            <div className="pt-2 border-t flex justify-between font-heading text-xl text-[#D91A2A]">
                                                <span>TOTAL</span>
                                                <span>${selectedOrder.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="bg-white p-4 rounded-2xl shadow-sm border-2 border-[#F2A900]">
                                        <h4 className="font-bold text-sm text-[#D91A2A] mb-4 uppercase">Gestión de Estatus</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {[
                                                { id: 'pagado', label: 'Marcar como Pagado', icon: CheckCircle2, color: 'blue' },
                                                { id: 'despachado', label: 'Marcar Despachado', icon: Truck, color: 'purple' },
                                                { id: 'entregado', label: 'Marcar Entregado', icon: CheckCircle2, color: 'green' },
                                                { id: 'cancelado', label: 'Cancelar Orden', icon: X, color: 'red' },
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => updateStatus(selectedOrder.id, opt.id)}
                                                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${selectedOrder.status === opt.id
                                                        ? `bg-${opt.color}-50 border-${opt.color}-500 text-${opt.color}-700 font-bold`
                                                        : 'border-gray-100 hover:bg-gray-50 text-gray-600'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <opt.icon size={18} />
                                                        {opt.label}
                                                    </div>
                                                    {selectedOrder.status === opt.id && <CheckCircle2 size={16} />}
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
