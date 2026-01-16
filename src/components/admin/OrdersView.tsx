import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { useAlertStore } from '../../store/alertStore';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where, writeBatch, increment, getDoc, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
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
    Package,
    RotateCcw,
    Printer
} from 'lucide-react';
import mrwData from '../../data/agenciasMrw2.json';
import zoomData from '../../data/zoom_venezuela_filtrado.json';
import { jsPDF } from 'jspdf';

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    customerId?: string;
    userName: string;
    userPhone: string;
    userCedula?: string;
    userEmail?: string;
    isGift?: boolean;
    recipient?: {
        name: string;
        phone: string;
        cedula: string;
    } | null;
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
    zelleEmail?: string;
    zelleSenderName?: string;
    cancelReason?: string;
    status: 'pendiente' | 'pagado' | 'despachado' | 'entregado' | 'cancelado';
    isBackorder?: boolean;
    createdAt: any;
}

interface OrdersViewProps {
    filterByStatus?: string;
    title?: string;
    autoOpenOrderId?: string | null;
    onModalClose?: () => void;
}

export default function OrdersView({ filterByStatus, title, autoOpenOrderId, onModalClose }: OrdersViewProps) {
    const { user } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [search, setSearch] = useState('');
    const [shippingFilter, setShippingFilter] = useState('all'); // 'all', 'MRW', 'Zoom', 'Retiro'
    const [groupMode, setGroupMode] = useState('none'); // 'none', 'agency'
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

    const generateShippingLabel = (order: Order) => {
        // 1/4 Letter Size (approx 108mm x 140mm)
        // Orientation: Portrait
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: [108, 140]
        });

        // Helper to center text
        const centerText = (text: string, y: number, fontSize: number = 10, isBold: boolean = false) => {
            doc.setFontSize(fontSize);
            doc.setFont("helvetica", isBold ? "bold" : "normal");
            const textWidth = doc.getTextWidth(text);
            const x = (108 - textWidth) / 2;
            doc.text(text, x, y);
        };

        // --- Header ---
        doc.setLineWidth(0.5);
        doc.rect(2, 2, 104, 136); // Border

        centerText("NATHIKAS", 10, 16, true);
        centerText("Spicy Gummies & Chamoy", 15, 8);

        doc.line(2, 18, 106, 18); // Separator

        // Determine Recipient (Gift vs Own)
        const recipientName = (order.isGift && order.recipient?.name) ? order.recipient.name : order.userName;
        const recipientPhone = (order.isGift && order.recipient?.phone) ? order.recipient.phone : order.userPhone;
        const recipientCedula = (order.isGift && order.recipient?.cedula) ? order.recipient.cedula : (order.userCedula || 'N/A');

        // --- Recipient Info ---
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("DESTINATARIO:", 5, 25);

        doc.setFontSize(12);
        doc.text(recipientName, 5, 32);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`CI: ${recipientCedula}`, 5, 38);
        doc.text(`Telf: ${recipientPhone}`, 5, 44);

        doc.line(2, 48, 106, 48); // Separator

        // --- Address Info ---
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("DIRECCIÓN DE ENVÍO:", 5, 55);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`${order.selectedState}, ${order.selectedCity}`, 5, 62);

        // Agency / Address Logic
        let addressDetail = order.selectedAgency || 'Dirección no especificada';
        let agencyLabel = "";

        if (order.shippingMethod?.toLowerCase() === 'mrw' && order.selectedAgency) {
            const agency = (mrwData as any[]).find(a => a.codigo === order.selectedAgency);
            if (agency) {
                agencyLabel = `MRW ${agency.codigo}`;
                addressDetail = agency.direccion; // Full address
            }
        } else if (order.shippingMethod?.toLowerCase() === 'zoom' && order.selectedAgency) {
            const agency = (zoomData as any[]).find(a => a.codigo === order.selectedAgency);
            if (agency) {
                agencyLabel = `ZOOM ${agency.codigo}`;
                addressDetail = agency.direccion;
            }
        } else if (order.shippingMethod === 'retiro') {
            addressDetail = "RETIRO EN TIENDA";
        }

        // Handle long address
        if (agencyLabel) {
            doc.setFont("helvetica", "bold");
            doc.text(agencyLabel, 5, 68);
            doc.setFont("helvetica", "normal");
            const splitAddress = doc.splitTextToSize(addressDetail, 98);
            doc.text(splitAddress, 5, 74);
        } else {
            const splitAddress = doc.splitTextToSize(addressDetail, 98);
            doc.text(splitAddress, 5, 68);
        }

        doc.line(2, 95, 106, 95); // Separator

        // --- Order Details ---
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`Pedido: #${order.id.slice(0, 8)}`, 5, 102);
        doc.text(`Fecha: ${order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}`, 55, 102);

        doc.setFont("helvetica", "normal");
        doc.text(`Cant. Productos: ${order.items.reduce((acc, item) => acc + item.quantity, 0)}`, 5, 108);

        // Fragile / Warning
        doc.setLineWidth(0.8);
        doc.rect(30, 115, 48, 15);
        centerText("FRÁGIL / DELICADO", 124, 12, true);

        // Footer
        doc.setFontSize(7);
        centerText("Generado desde Nathikas Admin", 135);

        doc.save(`Etiqueta_${order.id.slice(0, 8)}.pdf`);
    };

    const [statusFilter, setStatusFilter] = useState(filterByStatus || 'all');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    // Update internal status filter if prop changes (e.g. switching tabs in Dashboard)
    useEffect(() => {
        if (filterByStatus) setStatusFilter(filterByStatus);
    }, [filterByStatus]);

    // ... (rest of the filteredOrders logic remains, but we need to sort filteredOrders in memory if we don't do it in query)
    // Actually, let's do it in memory for filteredOrders to keep the "search" etc working fast without re-fetching.
    // BUT the query below fetches based on status.

    // Computed Filtered Orders
    const filteredOrders = orders.filter(order => {
        // ... (existing search and shipping filter logic)
        const matchesSearch =
            order.userName.toLowerCase().includes(search.toLowerCase()) ||
            order.id.includes(search);

        let matchesShipping = true;
        if (shippingFilter !== 'all') {
            if (shippingFilter === 'Retiro') {
                matchesShipping = order.shippingMethod === 'retiro';
            } else {
                matchesShipping = order.shippingMethod?.toLowerCase() === shippingFilter.toLowerCase();
            }
        }

        return matchesSearch && matchesShipping;
    }).sort((a, b) => { // Sort in memory
        const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
        const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // ... (groupedOrders logic remains same, dependent on filteredOrders)

    // Computed Grouped Orders
    const groupedOrders = filteredOrders.reduce((groups, order) => {
        if (groupMode === 'agency') {
            // Group key: Use agency code or 'retiro' or 'unknown'
            let key = order.selectedAgency || (order.shippingMethod === 'retiro' ? 'retiro' : 'Sin Agencia');
            if (!groups[key]) groups[key] = [];
            groups[key].push(order);
        }
        return groups;
    }, {} as Record<string, Order[]>);

    useEffect(() => {
        // No intentar leer si no hay usuario o no tiene rol administrativo
        if (!user || !['administrator', 'asistente', 'vendedor'].includes(user.role || '')) {
            setLoading(false);
            return;
        }

        if (!db) {
            console.warn("Firestore 'db' no disponible para cargar pedidos.");
            setLoading(false);
            return;
        }

        // Base query - always sort by createdAt for consistency, but we handle direction in memory or here
        // Note: Changing orderBy direction in query requires an index if combined with where.
        // To be safe and avoid "Missing Index" errors for now (since we might not have them), 
        // we can fetch DESC and reverse in memory if needed, OR just match the query.
        // Let's stick to state-based filtering on Firestore side for efficiency on Status.

        let q;

        if (statusFilter !== 'all') {
            q = query(collection(db, "orders"), where("status", "==", statusFilter), orderBy("createdAt", "desc"));
        } else {
            q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
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
    }, [statusFilter, user?.role]); // Removed filterByStatus prop from dependency, using statusFilter state instead

    // Auto-open order details if requested
    useEffect(() => {
        if (autoOpenOrderId && orders.length > 0) {
            const order = orders.find(o => o.id === autoOpenOrderId);
            if (order) {
                setSelectedOrder(order);
            }
        }
    }, [autoOpenOrderId, orders]);

    const confirmCancellation = async () => {
        if (!orderToCancel || !cancelReason.trim()) {
            useAlertStore.getState().showAlert("Dato Requerido", "Debes indicar un motivo.", "warning");
            return;
        }

        const orderId = orderToCancel;
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        try {
            const batch = writeBatch(db);
            const orderRef = doc(db, "orders", orderId);

            // Devolver stock al inventario
            order.items.forEach(item => {
                const productRef = doc(db, "products", item.id);
                batch.update(productRef, {
                    stock: increment(item.quantity)
                });
            });

            batch.update(orderRef, {
                status: 'cancelado',
                cancelReason: cancelReason
            });

            await batch.commit();

            // Enviar notificación
            if (order.userEmail) {
                try {
                    await fetch('/.netlify/functions/notifications', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: order.userEmail,
                            userName: order.userName,
                            orderId: order.id,
                            customerId: order.customerId,
                            status: 'cancelado',
                            reason: cancelReason,
                        })
                    });
                } catch (e) {
                    console.error("Error enviando email cancelación:", e);
                }
            }

            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: 'cancelado', cancelReason });
            }

            setShowCancelModal(false);
            setOrderToCancel(null);
            setCancelReason('');

            useAlertStore.getState().showAlert("Orden Cancelada", "El pedido ha sido cancelado y el stock restaurado.", "success");

        } catch (err: any) {
            console.error("Error al cancelar:", err);
            useAlertStore.getState().showAlert("Error", "No se pudo cancelar la orden.", "error");
        }
    };

    const updateStatus = async (orderId: string, newStatus: string) => {
        const order = orders.find(o => o.id === orderId) || selectedOrder;
        if (!order) return;

        if (newStatus === 'cancelado') {
            if (order.status === 'cancelado') return;
            setOrderToCancel(orderId);
            setCancelReason('');
            setShowCancelModal(true);
            return;
        }

        try {
            const batch = writeBatch(db);
            const orderRef = doc(db, "orders", orderId);

            // CASO REACTIVACIÓN: Pedido CANCELADO se REACTIVA -> Se vuelve a quitar stock
            if (order.status === 'cancelado' && newStatus !== 'cancelado') {
                for (const item of order.items) {
                    const productSnap = await getDoc(doc(db, "products", item.id));
                    const currentStock = productSnap.data()?.stock || 0;
                    if (currentStock < item.quantity) {
                        useAlertStore.getState().showAlert(
                            "Stock Insuficiente",
                            `No hay stock suficiente de ${item.name} para reactivar este pedido.`,
                            "error"
                        );
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

            // Notificación (simplificada)
            if (order.userEmail && ['pagado', 'despachado'].includes(newStatus)) {
                fetch('/.netlify/functions/notifications', {
                    method: 'POST',
                    body: JSON.stringify({
                        to: order.userEmail,
                        userName: order.userName,
                        orderId: order.id,
                        status: newStatus
                    })
                }).catch(console.error);
            }

            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus as any });
            }
        } catch (err: any) {
            console.error("Error al actualizar estado:", err);
            useAlertStore.getState().showAlert("Error", "No se pudo cambiar el estado.", "error");
        }
    };

    const syncProductionNeeds = async (order: Order) => {
        if (!order.isBackorder) return;

        // Safety check: Don't sync if already dispatched or cancelled
        if (['despachado', 'entregado', 'cancelado'].includes(order.status)) {
            useAlertStore.getState().showAlert(
                "Acción no permitida",
                "No se puede sincronizar la producción de un pedido que ya ha sido despachado, entregado o cancelado.",
                "warning"
            );
            return;
        }

        try {
            // 1. Check if records already exist
            const q = query(collection(db, "production_needs"), where("orderId", "==", order.id));
            const snap = await getDocs(q);

            if (!snap.empty) {
                useAlertStore.getState().showAlert(
                    "Información",
                    "Ya existen registros de producción para este pedido. Si no los ves, es posible que ya hayan sido marcados como completados.",
                    "info"
                );
                return;
            }

            // 2. If not, recreate them
            // We'll have to rely on the order items. Since we don't know the stock at the EXACT moment of purchase 
            // for legacy orders, we'll create needs for ALL items if it was a backorder? 
            // No, better to try to be smart if possible, but the safest for the user's manual sync is to ask or just do it for all items.
            // Actually, let's just create records for all items in the order as a "Force Sync".

            for (const item of order.items) {
                await addDoc(collection(db, "production_needs"), {
                    orderId: order.id,
                    productId: item.id,
                    productName: item.name,
                    quantityNeeded: item.quantity, // En un sync manual, asumimos que se necesita todo o el user lo ajustará
                    status: 'pendiente',
                    createdAt: serverTimestamp()
                });
            }

            useAlertStore.getState().showAlert(
                "Sincronización Exitosa",
                "Se han regenerado los registros de producción para este pedido.",
                "success"
            );
        } catch (err) {
            console.error("Error syncing production:", err);
            useAlertStore.getState().showAlert("Error", "No se pudo sincronizar con producción.", "error");
        }
    };

    const StatusBadge = ({ status, isBackorder }: { status: string, isBackorder?: boolean }) => {
        const styles = {
            pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            pagado: 'bg-blue-100 text-blue-700 border-blue-200',
            despachado: 'bg-purple-100 text-purple-700 border-purple-200',
            entregado: 'bg-green-100 text-green-700 border-green-200',
            cancelado: 'bg-red-100 text-red-700 border-red-200',
        };
        return (
            <div className="flex flex-col items-center gap-1">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase ${styles[status as keyof typeof styles]}`}>
                    {status}
                </span>
                {isBackorder && (
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-[#D91A2A] text-white border border-red-700 animate-pulse">
                        EN PRODUCCIÓN
                    </span>
                )}
            </div>
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

            {/* Filters and Controls */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-[#D91A2A]" />
                    <span className="font-bold text-sm text-gray-600">Filtrar:</span>
                </div>

                <div className="flex gap-2">
                    {['all', 'MRW', 'Zoom', 'Retiro'].map(method => (
                        <button
                            key={method}
                            onClick={() => setShippingFilter(method)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${shippingFilter === method
                                ? 'bg-[#F2A900] text-[#3E2723] border-[#F2A900]'
                                : 'bg-white text-gray-400 border-gray-200 hover:border-[#F2A900]'
                                }`}
                        >
                            {method === 'all' ? 'Todos' : method}
                        </button>
                    ))}
                </div>

                {/* Status Filter */}
                <div className="w-px h-6 bg-gray-200 mx-2"></div>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-600">Estado:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border text-gray-600 text-xs font-bold border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#F2A900] cursor-pointer"
                    >
                        <option value="all">Todos</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="pagado">Pagado</option>
                        <option value="despachado">Despachado</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>

                {/* Sort Order */}
                <div className="w-px h-6 bg-gray-200 mx-2"></div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                        className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all border bg-white text-gray-600 border-gray-200 hover:border-[#F2A900]"
                        title={sortOrder === 'desc' ? "Más recientes primero" : "Más antiguos primero"}
                    >
                        <Clock size={14} />
                        {sortOrder === 'desc' ? 'Recientes' : 'Antiguos'}
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-200 mx-2"></div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setGroupMode(groupMode === 'agency' ? 'none' : 'agency')}
                        className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all border ${groupMode === 'agency'
                            ? 'bg-[#D91A2A] text-white border-[#D91A2A]'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-[#D91A2A]'
                            }`}
                    >
                        <Package size={14} />
                        Agrupar por Agencia
                    </button>
                </div>

                {groupMode === 'agency' && (
                    <span className="text-xs font-bold text-[#D91A2A] bg-red-50 px-2 py-1 rounded-md">
                        {Object.keys(groupedOrders).length} Agencias/Grupos encontrados
                    </span>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-white hidden md:block">
                {groupMode === 'agency' ? (
                    <div className="divide-y">
                        {Object.entries(groupedOrders).map(([groupKey, groupOrders]) => {
                            // Lookup agency details for the header
                            let groupTitle = groupKey;
                            const firstOrder = groupOrders[0];
                            const method = firstOrder.shippingMethod?.toLowerCase();

                            if (method === 'mrw') {
                                const agency = (mrwData as any[]).find(a => a.codigo === groupKey);
                                if (agency) groupTitle = `MRW ${agency.codigo} - ${agency.nombre} (${agency.direccion})`;
                            } else if (method === 'zoom') {
                                const agency = (zoomData as any[]).find(a => a.cod_agencia === groupKey);
                                if (agency) groupTitle = `ZOOM ${agency.cod_agencia} - ${agency.nombre} (${agency.direccion})`;
                            } else if (groupKey === 'retiro') {
                                groupTitle = "📍 Retiro en Tienda / Personal";
                            }

                            return (
                                <div key={groupKey} className="bg-white">
                                    <div className="bg-gray-50 p-3 px-6 flex items-center justify-between border-l-4 border-[#D91A2A]">
                                        <h3 className="font-bold text-sm text-[#3E2723] flex items-center gap-2">
                                            {groupTitle}
                                        </h3>
                                        <span className="text-xs font-bold bg-white px-2 py-1 rounded border shadow-sm">
                                            {groupOrders.length} paquetes
                                        </span>
                                    </div>
                                    <table className="w-full text-left">
                                        {/* Minimal header/body for grouped items */}
                                        <tbody className="divide-y divide-gray-100">
                                            {groupOrders.map((order) => (
                                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-3 pl-8 w-32">
                                                        <p className="font-bold text-xs">#{order.id.slice(0, 8)}</p>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-xs">{order.userName}</span>
                                                            <span className="text-[10px] text-gray-400">CI: {order.userCedula}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex flex-col text-xs">
                                                            <span>{order.items.length} productos</span>
                                                            <span className="font-bold text-[#D91A2A]">${order.total.toFixed(2)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 w-24">
                                                        <StatusBadge status={order.status} isBackorder={order.isBackorder} />
                                                    </td>
                                                    <td className="p-3 w-16">
                                                        <button onClick={() => setSelectedOrder(order)} className="p-1 hover:bg-gray-200 rounded">
                                                            <Eye size={16} className="text-gray-500" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                    </div>
                ) : (
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
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-bold text-xs">#{order.id.slice(0, 8)}</p>
                                            <p className="text-[10px] text-gray-400">{order.createdAt?.toDate().toLocaleDateString()}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-[#FDF6E3] rounded-full flex items-center justify-center text-[#D91A2A] overflow-hidden shrink-0">
                                                    {(() => {
                                                        const m = order.shippingMethod?.toLowerCase();
                                                        if (m === 'mrw') return <span className="font-black text-[8px] text-blue-900 tracking-tighter">MRW</span>;
                                                        if (m === 'zoom') return <span className="font-black text-[8px] text-red-600 tracking-tighter">ZOOM</span>;
                                                        if (m === 'retiro') return <span className="font-black text-[8px] text-green-700 tracking-tighter">RETIRO</span>;
                                                        return <User size={14} />;
                                                    })()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm leading-tight">{order.userName}</p>
                                                    <p className="text-xs text-blue-600">{order.userPhone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-[#D91A2A]">${order.total.toFixed(2)}</td>
                                        <td className="p-4 text-black">
                                            <StatusBadge status={order.status} isBackorder={order.isBackorder} />
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
                )}
            </div>

            {/* Mobile Card View (Filtered) */}
            < div className="grid grid-cols-1 gap-4 md:hidden" >
                {
                    filteredOrders.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 font-bold bg-white rounded-3xl">No hay pedidos filtrados.</div>
                    ) : (
                        filteredOrders.map((order) => (
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
                                        <p className="font-bold text-sm text-[#3E2723] leading-tight break-words">{order.userName}</p>
                                        <p className="text-[10px] text-gray-400">{order.shippingMethod} - {order.selectedAgency || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-bold text-[#D91A2A] mb-1">${order.total.toFixed(2)}</p>
                                    <StatusBadge status={order.status} isBackorder={order.isBackorder} />
                                </div>
                            </motion.div>
                        ))
                    )
                }
            </div >

            {/* Order Details Modal / Mobile Drawer */}
            <AnimatePresence>
                {
                    selectedOrder && (
                        <div key="order-details-modal" className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ y: "100%", opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: "100%", opacity: 0 }}
                                className="bg-[#FDF6E3] w-full max-w-4xl h-[95vh] md:h-auto md:max-h-[90vh] rounded-t-[2.5rem] md:rounded-3xl shadow-2xl overflow-hidden border-t-4 md:border-4 border-[#F2A900] flex flex-col"
                            >
                                <div className="bg-[#D91A2A] p-4 flex items-center justify-between text-white">
                                    <div className="flex flex-col">
                                        <h3 className="font-heading text-2xl">Detalle del Pedido</h3>
                                        {selectedOrder.isBackorder && (
                                            <span className="text-[10px] font-bold bg-white text-[#D91A2A] px-2 py-0.5 rounded-full w-fit">ORDEN EN PRODUCCIÓN</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => selectedOrder && generateShippingLabel(selectedOrder)}
                                            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                                            title="Imprimir Etiqueta"
                                        >
                                            <Printer size={14} /> ETIQUETA
                                        </button>
                                        {selectedOrder.isBackorder && ['pendiente', 'pagado'].includes(selectedOrder.status) && (
                                            <button
                                                onClick={() => syncProductionNeeds(selectedOrder)}
                                                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                                                title="Sincronizar con Producción"
                                            >
                                                <RotateCcw size={14} /> SYNC
                                            </button>
                                        )}
                                        <button onClick={() => {
                                            setSelectedOrder(null);
                                            onModalClose?.();
                                        }}><X /></button>
                                    </div>
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
                                                {selectedOrder.userCedula && (
                                                    <div className="col-span-2">
                                                        <p className="text-gray-400 text-xs">Cédula Cliente</p>
                                                        <p className="font-bold">{selectedOrder.userCedula}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </section>

                                        <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                            <h4 className="font-bold text-sm text-[#D91A2A] mb-3 uppercase flex items-center gap-2">
                                                <Truck size={16} /> Envío
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                                <p><span className="text-gray-400">Método:</span> <span className="font-bold capitalize">{selectedOrder.shippingMethod}</span></p>
                                                <p><span className="text-gray-400">Destino:</span> <span className="font-bold">{selectedOrder.selectedState}, {selectedOrder.selectedCity}</span></p>

                                                {selectedOrder.selectedAgency && (() => {
                                                    // Function to lookup agency details
                                                    let agencyDetails = selectedOrder.selectedAgency;
                                                    const method = selectedOrder.shippingMethod?.toLowerCase();
                                                    const agencyCode = selectedOrder.selectedAgency;

                                                    if (method === 'mrw') {
                                                        const agency = (mrwData as any[]).find(a => a.codigo === agencyCode);
                                                        if (agency) {
                                                            agencyDetails = `${agency.codigo} - ${agency.nombre} - ${agency.direccion}`;
                                                        }
                                                    } else if (method === 'zoom') {
                                                        const agency = (zoomData as any[]).find(a => a.codigo === agencyCode);
                                                        if (agency) {
                                                            agencyDetails = `${agency.codigo} - ${agency.nombre} - ${agency.direccion}`;
                                                        }
                                                    }

                                                    return (
                                                        <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                                            <p className="text-gray-400 text-xs mb-1">Agencia Seleccionada:</p>
                                                            <p className="font-bold text-sm leading-snug break-words">
                                                                {agencyDetails}
                                                            </p>
                                                        </div>
                                                    );
                                                })()}

                                            </div>
                                        </section>

                                        {selectedOrder.isGift && selectedOrder.recipient && (
                                            <section className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100">
                                                <h4 className="text-xs font-bold text-pink-600 uppercase mb-3 flex items-center gap-2">
                                                    🎁 Datos del Receptor (Regalo)
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-gray-400 text-xs">Nombre</p>
                                                        <p className="font-bold">{selectedOrder.recipient.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-400 text-xs">Teléfono</p>
                                                        <p className="font-bold text-pink-600">{selectedOrder.recipient.phone}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-gray-400 text-xs">Cédula</p>
                                                        <p className="font-bold">{selectedOrder.recipient.cedula}</p>
                                                    </div>
                                                </div>
                                            </section>
                                        )}

                                        <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                            <h4 className="font-bold text-sm text-[#D91A2A] mb-3 uppercase flex items-center gap-2">
                                                <Truck size={16} /> {selectedOrder.paymentBank === 'Zelle' ? 'Zelle' : 'Pago Móvil'}
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                {selectedOrder.paymentBank === 'Zelle' ? (
                                                    <>
                                                        <div className="col-span-2">
                                                            <p className="text-gray-400 text-xs">Nombre Titular (Zelle)</p>
                                                            <p className="font-bold">{selectedOrder.zelleSenderName || '(No registrado)'}</p>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <p className="text-gray-400 text-xs">Correo Zelle</p>
                                                            <p className="font-bold">{selectedOrder.zelleEmail || '(No registrado)'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-400 text-xs">Cédula</p>
                                                            <p className="font-bold">{selectedOrder.paymentId}</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
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
                                                    </>
                                                )}
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
                    )
                }
                {showCancelModal && (
                    <div key="cancel-modal" className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full border-4 border-[#D91A2A]"
                        >
                            <div className="bg-[#D91A2A] p-4 text-center">
                                <h3 className="font-heading text-xl text-white">Cancelar Pedido</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-gray-600 font-bold text-center"> Por favor indica el motivo de la cancelación. Esta acción devolverá el stock al inventario.</p>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Ej: Cliente solicitó cancelación, falta de pago..."
                                    className="w-full h-32 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#F2A900] focus:bg-white transition-all resize-none font-medium"
                                    autoFocus
                                />
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => { setShowCancelModal(false); setOrderToCancel(null); }}
                                        className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-500 hover:bg-gray-200"
                                    >
                                        Volver
                                    </button>
                                    <button
                                        onClick={confirmCancellation}
                                        className="flex-1 py-3 rounded-xl font-bold bg-[#D91A2A] text-white hover:bg-red-700 shadow-lg shadow-red-200"
                                    >
                                        Confirmar Cancelación
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >
        </div >
    );
}
