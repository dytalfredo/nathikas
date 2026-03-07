import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { useAlertStore } from '../../store/alertStore';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where, writeBatch, increment, getDoc, getDocs, addDoc, serverTimestamp, limit } from 'firebase/firestore';
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
    Printer,
    AlertTriangle,
    Wallet,
    Diff
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
    address?: string;
    selectedPickup?: { id: string; name: string; address?: string } | null;
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
    isDispatchView?: boolean;
}

export default function OrdersView({ filterByStatus, title, autoOpenOrderId, onModalClose, isDispatchView }: OrdersViewProps) {
    const { user } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [search, setSearch] = useState('');
    const [shippingFilter, setShippingFilter] = useState('all'); // 'all', 'MRW', 'Zoom', 'Retiro'
    const [groupMode, setGroupMode] = useState('none'); // 'none', 'agency'
    const [showCancelModal, setShowCancelModal] = useState(false);
    // ... (existing state)
    const [cancelReason, setCancelReason] = useState('');
    const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
    const [cancelOption, setCancelOption] = useState<number | null>(null);
    const [duplicateCandidates, setDuplicateCandidates] = useState<Order[]>([]);
    const [manualPaidAmount, setManualPaidAmount] = useState('');
    const [ordersLimit, setOrdersLimit] = useState(50);
    const [selectedForPrint, setSelectedForPrint] = useState<string[]>([]);


    // Dispatch Modal State
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [orderToDispatch, setOrderToDispatch] = useState<string | null>(null);

    // Generic Status Confirmation State
    const [showConfirmStatusModal, setShowConfirmStatusModal] = useState(false);
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ orderId: string, status: string } | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const executeStatusUpdate = async (orderId: string, newStatus: string, trackingNumber?: string, cancelReason?: string) => {
        const order = orders.find(o => o.id === orderId) || selectedOrder;

        if (!order) return;
        setIsUpdating(true);

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
                        setIsUpdating(false);
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

            // CASO CANCELACIÓN
            if (newStatus === 'cancelado') {
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
            } else if (newStatus === 'despachado') {
                batch.update(orderRef, {
                    status: 'despachado',
                    trackingNumber: trackingNumber || ''
                });
            } else {
                batch.update(orderRef, { status: newStatus });
            }

            await batch.commit();

            // Enviar notificación
            if (order.userEmail) {
                const payload: any = {
                    to: order.userEmail,
                    userName: order.userName,
                    orderId: order.id,
                    customerId: order.customerId,
                    status: newStatus,
                    shippingMethod: order.shippingMethod // Add this line
                };
                if (newStatus === 'cancelado') payload.reason = cancelReason;
                if (newStatus === 'despachado') payload.trackingNumber = trackingNumber;

                fetch('/.netlify/functions/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(console.error);
            }

            if (selectedOrder?.id === orderId) {
                let u: any = { status: newStatus };
                if (cancelReason) u.cancelReason = cancelReason;
                if (trackingNumber) u.trackingNumber = trackingNumber;
                setSelectedOrder({ ...selectedOrder, ...u } as any);
            }

            // Reset States
            setShowCancelModal(false);
            setOrderToCancel(null);
            setCancelReason('');

            setShowDispatchModal(false);
            setOrderToDispatch(null);
            setTrackingNumber('');

            setShowConfirmStatusModal(false);
            setPendingStatusUpdate(null);

            useAlertStore.getState().showAlert("Estado Actualizado", "El pedido ha sido actualizado correctamente.", "success");

        } catch (err: any) {
            console.error("Error al actualizar estado:", err);
            useAlertStore.getState().showAlert("Error", "No se pudo cambiar el estado.", "error");
        } finally {
            setIsUpdating(false);
        }
    };

    const findDuplicates = (targetOrder: Order) => {
        if (!targetOrder) return [];
        return orders.filter(o =>
            o.id !== targetOrder.id &&
            o.status !== 'cancelado' &&
            (
                (o.paymentReference && targetOrder.paymentReference && o.paymentReference.length > 4 && o.paymentReference.trim() === targetOrder.paymentReference.trim()) ||
                (o.userName === targetOrder.userName && Math.abs(o.total - targetOrder.total) < 0.01)
            )
        );
    };

    const initCancel = (order: Order) => {
        setOrderToCancel(order.id);
        const dups = findDuplicates(order);
        setDuplicateCandidates(dups);
        setCancelOption(dups.length > 0 ? 1 : 4);
        setCancelReason('');
        setManualPaidAmount('');
        setShowCancelModal(true);
    };

    const getCancelMessage = () => {
        const order = orders.find(o => o.id === orderToCancel);
        if (!order) return cancelReason;

        const supportLink = " Si necesitas ayuda, contáctanos aquí: https://wa.me/584129157564";

        switch (cancelOption) {
            case 1:
                return `Pedido cancelado por duplicidad. Referencia o detalles coinciden con otra orden activa. ${cancelReason}${supportLink}`;
            case 2:
                return `Tu pago ha sido rechazado debido a incongruencias en los datos del Pago Móvil o Zelle. Por favor verifica tu comprobante. ${cancelReason}${supportLink}`;
            case 3:
                const paid = parseFloat(manualPaidAmount || '0');
                const diff = paid - order.total;
                return `Hemos detectado una diferencia en el monto pagado. Recibido: $${paid.toFixed(2)}. Total Orden: $${order.total.toFixed(2)}. Diferencia: $${diff.toFixed(2)}. ${cancelReason}${supportLink}`;
            default:
                return `${cancelReason}${supportLink}`;
        }
    };

    const handleConfirmCancellation = async () => {
        const finalReason = getCancelMessage();
        if (!orderToCancel) return;

        if (cancelOption === 3 && !manualPaidAmount) {
            useAlertStore.getState().showAlert("Dato Requerido", "Indica el monto que pagó el cliente.", "warning");
            return;
        }
        if (cancelOption === 4 && !cancelReason.trim()) {
            useAlertStore.getState().showAlert("Dato Requerido", "Escribe un motivo.", "warning");
            return;
        }

        await executeStatusUpdate(orderToCancel, 'cancelado', undefined, finalReason);
    };

    const openWhatsAppCancel = () => {
        const order = orders.find(o => o.id === orderToCancel);
        if (!order) return;
        const msg = encodeURIComponent(`Hola ${order.userName}, referente a su pedido #${order.id.slice(0, 8)}: ${getCancelMessage()}`);
        window.open(`https://wa.me/${order.userPhone.replace(/\D/g, '')}?text=${msg}`, '_blank');
    };

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
        // Item List
        const itemsText = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
        const splitItems = doc.splitTextToSize(itemsText, 98);
        doc.text(splitItems, 5, 108);

        // Fragile / Warning (Small at bottom)
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        centerText("FRÁGIL / DELICADO", 132, 8, true);

        // Footer
        doc.setFontSize(7);
        centerText("Generado desde Nathikas Admin", 135);

        doc.save(`Etiqueta_${order.id.slice(0, 8)}.pdf`);
    };

    const generateBulkLabels = () => {
        if (selectedForPrint.length === 0) return;

        // A4 format for 4 labels (2x2 grid) or Letter
        // Let's use Letter size: 216mm x 279mm
        // Each label 108x140mm approx fit perfectly in 4 quadrants? 
        // 108*2 = 216, 140*2 = 280. It's tight on A4/Letter margins.
        // Let's reduce slightly to fit margins.

        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'letter' // 215.9 x 279.4 mm
        });

        // Config
        const labelW = 100;
        const labelH = 130;
        const marginX = 6;
        const marginY = 8;
        const gapX = 4;
        const gapY = 4;

        let printedCount = 0;

        selectedForPrint.forEach((orderId, index) => {
            const order = orders.find(o => o.id === orderId);
            if (!order) return;

            // New page every 4 items
            if (printedCount > 0 && printedCount % 4 === 0) {
                doc.addPage();
            }

            // Calculate position (0, 1, 2, 3 on page)
            const positionOnPage = printedCount % 4;
            const col = positionOnPage % 2; // 0 or 1
            const row = Math.floor(positionOnPage / 2); // 0 or 1

            const x = marginX + (col * (labelW + gapX));
            const y = marginY + (row * (labelH + gapY));

            // --- Draw Label Content (Simplified from single label) ---
            // Helper localized to x,y
            const localText = (text: string, localY: number, size: number = 9, bold: boolean = false) => {
                doc.setFontSize(size);
                doc.setFont("helvetica", bold ? "bold" : "normal");
                // Center relative to label
                const textWidth = doc.getTextWidth(text);
                const localX = x + (labelW - textWidth) / 2;
                doc.text(text, localX, y + localY);
            };

            doc.setLineWidth(0.3);
            doc.rect(x, y, labelW, labelH); // Border

            localText("NATHIKAS", 12, 10, true);
            localText("Spicy Gummies & Chamoy", 17, 8);

            doc.line(x, y + 20, x + labelW, y + 20);

            // Recipient
            const rName = (order.isGift && order.recipient?.name) ? order.recipient.name : order.userName;
            const rPhone = (order.isGift && order.recipient?.phone) ? order.recipient.phone : order.userPhone;
            const rCedula = (order.isGift && order.recipient?.cedula) ? order.recipient.cedula : (order.userCedula || 'N/A');

            doc.setFontSize(7);
            doc.setFont("helvetica", "bold");
            doc.text("DESTINATARIO:", x + 4, y + 28);

            doc.setFontSize(11); // Scale down slightly checks
            doc.text(rName.substring(0, 28), x + 4, y + 35);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(`CI: ${rCedula}`, x + 4, y + 41);
            doc.text(`Telf: ${rPhone}`, x + 4, y + 46);

            doc.line(x, y + 50, x + labelW, y + 50);

            // Address
            doc.setFontSize(7);
            doc.setFont("helvetica", "bold");
            doc.text("DIRECCIÓN:", x + 4, y + 56);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(`${order.selectedState}, ${order.selectedCity}`, x + 4, y + 62);

            // Agency logic
            let addressDetail = order.selectedAgency || 'Dirección no especificada';
            let agencyLabel = "";
            if (order.shippingMethod?.toLowerCase() === 'mrw' && order.selectedAgency) {
                const a = (mrwData as any[]).find(i => i.codigo === order.selectedAgency);
                if (a) { agencyLabel = `MRW ${a.codigo}`; addressDetail = a.direccion; }
            } else if (order.shippingMethod?.toLowerCase() === 'zoom' && order.selectedAgency) {
                const a = (zoomData as any[]).find(i => i.codigo === order.selectedAgency);
                if (a) { agencyLabel = `ZOOM ${a.codigo}`; addressDetail = a.direccion; }
            } else if (order.shippingMethod === 'retiro') {
                addressDetail = "RETIRO EN TIENDA";
            }

            if (agencyLabel) {
                doc.setFont("helvetica", "bold");
                doc.text(agencyLabel, x + 4, y + 68);
                doc.setFont("helvetica", "normal");
                const splitInfo = doc.splitTextToSize(addressDetail, labelW - 8);
                doc.text(splitInfo, x + 4, y + 74);
            } else {
                const splitInfo = doc.splitTextToSize(addressDetail, labelW - 8);
                doc.text(splitInfo, x + 4, y + 68);
            }

            // Info Bottom
            doc.line(x, y + 95, x + labelW, y + 95);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text(`Pedido: #${order.id.slice(0, 8)}`, x + 4, y + 100);

            doc.setFont("helvetica", "normal");
            // Item List for Bulk
            const itemsText = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
            // Smaller font for items in bulk view to fit more
            doc.setFontSize(8);
            const splitItems = doc.splitTextToSize(itemsText, labelW - 8);
            // Limit to 6 lines to show significantly more items
            const visibleItems = splitItems.slice(0, 6);
            if (splitItems.length > 6) visibleItems[5] += '...';

            doc.text(visibleItems, x + 4, y + 104);

            // Fragile (Small at bottom)
            localText("FRÁGIL / DELICADO", 126, 8, true);

            printedCount++;
        });

        doc.save(`Etiquetas_Lote_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
        useAlertStore.getState().showAlert("Generado", `${printedCount} etiquetas generadas.`, "success");
        setSelectedForPrint([]);
    };

    const togglePrintSelection = (orderId: string) => {
        setSelectedForPrint(prev =>
            prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
        );
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
            q = query(collection(db, "orders"), where("status", "==", statusFilter), orderBy("createdAt", "desc"), limit(ordersLimit));
        } else {
            q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(ordersLimit));
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
    }, [statusFilter, user?.role, ordersLimit]); // Added ordersLimit dependency

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
        await executeStatusUpdate(orderToCancel, 'cancelado', undefined, cancelReason);
    };

    const confirmDispatch = async () => {
        if (!orderToDispatch) return;
        if (!trackingNumber.trim()) {
            useAlertStore.getState().showAlert("Dato Requerido", "Por favor ingresa el número de guía.", "warning");
            return;
        }
        await executeStatusUpdate(orderToDispatch, 'despachado', trackingNumber);
    };

    const confirmGeneralStatusUpdate = async () => {
        if (!pendingStatusUpdate) return;
        await executeStatusUpdate(pendingStatusUpdate.orderId, pendingStatusUpdate.status);
    }

    const updateStatus = async (orderId: string, newStatus: string) => {
        const order = orders.find(o => o.id === orderId) || selectedOrder;
        if (!order) return;

        // Skip if same status
        if (order.status === newStatus) return;

        if (newStatus === 'cancelado') {
            initCancel(order);
            return;
        }

        if (newStatus === 'despachado') {
            setOrderToDispatch(orderId);
            setTrackingNumber('');
            setShowDispatchModal(true);
            return;
        }

        // For other statuses (pagado, entregado, pendiente), show generic confirmation
        setPendingStatusUpdate({ orderId, status: newStatus });
        setShowConfirmStatusModal(true);
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

            {/* Bulk Print Floating Action Button */}
            {selectedForPrint.length > 0 && (
                <div className="fixed bottom-24 right-6 md:bottom-12 md:right-12 z-[90]">
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onClick={generateBulkLabels}
                        className="bg-[#3E2723] text-[#F2A900] px-6 py-4 rounded-full shadow-2xl border-4 border-[#F2A900] font-bold flex items-center gap-3 hover:transform hover:scale-105 transition-all text-xl"
                    >
                        <Printer size={24} />
                        Imprimir {selectedForPrint.length} Etiquetas
                    </motion.button>
                    <button
                        onClick={() => setSelectedForPrint([])}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                    >
                        <X size={12} />
                    </button>
                </div>
            )}

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
                                    {isDispatchView && <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center"><Printer size={16} /></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${selectedForPrint.includes(order.id) ? 'bg-yellow-50' : ''}`}>
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
                                        {isDispatchView && (
                                            <td className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedForPrint.includes(order.id)}
                                                    onChange={() => togglePrintSelection(order.id)}
                                                    className="w-5 h-5 accent-[#D91A2A] cursor-pointer"
                                                />
                                            </td>
                                        )}
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

            {/* Load More Button */}
            {orders.length >= ordersLimit && (
                <div className="flex justify-center mt-6 mb-12">
                    <button
                        onClick={() => setOrdersLimit(prev => prev + 50)}
                        className="px-6 py-3 bg-white border border-gray-200 text-gray-500 font-bold rounded-full shadow-sm hover:bg-gray-50 hover:text-[#D91A2A] hover:border-[#D91A2A] transition-all flex items-center gap-2"
                    >
                        <Clock size={18} />
                        Cargar más pedidos ({ordersLimit} mostrados)
                    </button>
                </div>
            )}

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
                                            <div className="space-y-3 text-sm">
                                                <p><span className="text-gray-400">Método:</span> <span className="font-bold capitalize">{selectedOrder.shippingMethod}</span></p>

                                                {(() => {
                                                    const method = selectedOrder.shippingMethod?.toLowerCase();

                                                    // MRW
                                                    if (method === 'mrw') {
                                                        const agencyCode = selectedOrder.selectedAgency;
                                                        const agency = agencyCode ? (mrwData as any[]).find(a => a.codigo === agencyCode) : null;
                                                        return (
                                                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-1">
                                                                <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">📦 Agencia MRW de destino</p>
                                                                <p className="font-bold">{agency ? `${agency.nombre}` : (agencyCode || '—')}</p>
                                                                {agency && <p className="text-xs text-gray-500">{agency.codigo} · {agency.direccion}</p>}
                                                                <p className="text-xs text-gray-400">{selectedOrder.selectedState}{selectedOrder.selectedCity ? ` · ${selectedOrder.selectedCity}` : ''}</p>
                                                            </div>
                                                        );
                                                    }

                                                    // ZOOM
                                                    if (method === 'zoom') {
                                                        const agencyCode = selectedOrder.selectedAgency;
                                                        const agency = agencyCode ? (zoomData as any[]).find((a: any) => a.cod_agencia === agencyCode || a.codigo === agencyCode) : null;
                                                        return (
                                                            <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-1">
                                                                <p className="text-[10px] font-bold text-red-500 uppercase mb-1">📦 Agencia ZOOM de destino</p>
                                                                <p className="font-bold">{agency ? `${agency.nombre}` : (agencyCode || '—')}</p>
                                                                {agency && <p className="text-xs text-gray-500">{agency.cod_agencia ?? agency.codigo} · {agency.direccion}</p>}
                                                                <p className="text-xs text-gray-400">{selectedOrder.selectedState}{selectedOrder.selectedCity ? ` · ${selectedOrder.selectedCity}` : ''}</p>
                                                            </div>
                                                        );
                                                    }

                                                    // RETIRO
                                                    if (method === 'retiro') {
                                                        const pickup = selectedOrder.selectedPickup;
                                                        return (
                                                            <div className="bg-green-50 border border-green-100 rounded-xl p-3 space-y-1">
                                                                <p className="text-[10px] font-bold text-green-600 uppercase mb-1">🏪 Local de Retiro</p>
                                                                <p className="font-bold">{pickup?.name || selectedOrder.address || selectedOrder.selectedState || '—'}</p>
                                                                {pickup?.address && <p className="text-xs text-gray-500">{pickup.address}</p>}
                                                            </div>
                                                        );
                                                    }

                                                    // DELIVERY
                                                    if (method === 'delivery') {
                                                        return (
                                                            <div className="bg-[#FDF6E3] border border-[#F2A900]/30 rounded-xl p-3 space-y-2">
                                                                <p className="text-[10px] font-bold text-[#D91A2A] uppercase mb-1">🚚 Dirección de Entrega</p>
                                                                <p className="font-bold leading-snug">{selectedOrder.address || <span className="text-gray-400 italic">No especificada</span>}</p>
                                                                {selectedOrder.userPhone && (
                                                                    <a
                                                                        href={`https://wa.me/${selectedOrder.userPhone.replace(/\D/g, '')}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-2 text-xs font-bold text-[#25D366] hover:underline mt-1"
                                                                    >
                                                                        📞 {selectedOrder.userPhone} · Contactar por WhatsApp
                                                                    </a>
                                                                )}
                                                            </div>
                                                        );
                                                    }

                                                    return null;
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
                                                ].map(opt => {
                                                    const isCurrent = selectedOrder.status === opt.id;

                                                    // Logic for Allowed Transitions
                                                    let isAllowed = false;
                                                    if (isCurrent) isAllowed = true; // Allow clicking current (no-op but enabled)
                                                    else if (opt.id === 'cancelado') isAllowed = true; // Always allow cancel? Or maybe restricted if delivered? Let's say always for now based on user request "ve activando los botones... segun sea el caso" implies unlocking flow.
                                                    else if (selectedOrder.status === 'pendiente' && opt.id === 'pagado') isAllowed = true;
                                                    else if (selectedOrder.status === 'pagado' && opt.id === 'despachado') isAllowed = true;
                                                    else if (selectedOrder.status === 'despachado' && opt.id === 'entregado') isAllowed = true;

                                                    // Special case: If order is 'cancelado', maybe allow reactivation to 'pendiente' or 'pagado'? 
                                                    // The `updateStatus` logic handles stock checks for reactivation. 
                                                    // Let's assume re-activation to 'pagado' is okay if it was cancelled. 
                                                    else if (selectedOrder.status === 'cancelado' && (opt.id === 'pagado' || opt.id === 'pendiente')) isAllowed = true;


                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => isAllowed && updateStatus(selectedOrder.id, opt.id)}
                                                            disabled={!isAllowed}
                                                            className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${isCurrent
                                                                ? `bg-${opt.color}-50 border-${opt.color}-500 text-${opt.color}-700 font-bold`
                                                                : isAllowed
                                                                    ? 'border-gray-100 hover:bg-gray-50 text-gray-600'
                                                                    : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-60'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <opt.icon size={18} />
                                                                {opt.label}
                                                            </div>
                                                            {isCurrent && <CheckCircle2 size={16} />}
                                                            {!isAllowed && !isCurrent && <span className="text-[10px] font-bold uppercase bg-gray-100 px-2 py-0.5 rounded text-gray-400">Bloqueado</span>}
                                                        </button>
                                                    );
                                                })}
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
                            className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full border-4 border-[#D91A2A] flex flex-col max-h-[90vh]"
                        >
                            <div className="bg-[#D91A2A] p-4 text-center shrink-0">
                                <h3 className="font-heading text-xl text-white">Cancelar Pedido</h3>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                                {/* Quick Options */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setCancelOption(1)}
                                        className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-2 transition-all ${cancelOption === 1 ? 'border-[#D91A2A] bg-red-50 text-[#D91A2A]' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                                    >
                                        <Copy size={20} />
                                        Duplicado
                                    </button>
                                    <button
                                        onClick={() => setCancelOption(2)}
                                        className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-2 transition-all ${cancelOption === 2 ? 'border-[#D91A2A] bg-red-50 text-[#D91A2A]' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                                    >
                                        <AlertTriangle size={20} />
                                        Pago Rechazado
                                    </button>
                                    <button
                                        onClick={() => setCancelOption(3)}
                                        className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-2 transition-all ${cancelOption === 3 ? 'border-[#D91A2A] bg-red-50 text-[#D91A2A]' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                                    >
                                        <Diff size={20} />
                                        Diferencia
                                    </button>
                                    <button
                                        onClick={() => setCancelOption(4)}
                                        className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-2 transition-all ${cancelOption === 4 ? 'border-[#D91A2A] bg-red-50 text-[#D91A2A]' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                                    >
                                        <MessageCircle size={20} />
                                        Otro / Manual
                                    </button>
                                </div>

                                {/* Dynamic Content */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    {cancelOption === 1 && (
                                        <div className="space-y-3">
                                            <p className="text-sm font-bold text-gray-600">Posibles Duplicados:</p>
                                            {duplicateCandidates.length > 0 ? (
                                                duplicateCandidates.map(dup => (
                                                    <div key={dup.id} className="bg-white p-2 rounded border text-xs flex justify-between items-center">
                                                        <div>
                                                            <span className="font-bold">#{dup.id.slice(0, 8)}</span> - {dup.status}
                                                            <div className="text-gray-400">${dup.total} - Ref: {dup.paymentReference}</div>
                                                        </div>
                                                        <button className="text-[#D91A2A] font-bold hover:underline" onClick={() => window.alert('Detalle no disponible aquí, revisar en lista.')}>Ver</button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-400 italic">No se detectaron duplicados obvios.</p>
                                            )}
                                        </div>
                                    )}

                                    {cancelOption === 2 && (
                                        <div className="text-center py-2">
                                            <AlertTriangle className="mx-auto text-orange-500 mb-2" size={32} />
                                            <p className="text-sm font-bold text-gray-700">Incongruencias en Pago</p>
                                            <p className="text-xs text-gray-500">Se notificará al usuario que los datos bancarios no coinciden.</p>
                                        </div>
                                    )}

                                    {cancelOption === 3 && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600">Monto Real Pagado ($):</label>
                                            <input
                                                type="number"
                                                value={manualPaidAmount}
                                                onChange={e => setManualPaidAmount(e.target.value)}
                                                className="w-full p-2 border rounded-lg"
                                                placeholder="Ej: 15.00"
                                            />
                                            {manualPaidAmount && orderToCancel && (
                                                <p className="text-xs font-bold text-red-600 text-right">
                                                    Diferencia: ${(parseFloat(manualPaidAmount) - (orders.find(o => o.id === orderToCancel)?.total || 0)).toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-3">
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">Mensaje / Nota Adicional:</label>
                                        <textarea
                                            value={cancelReason}
                                            onChange={(e) => setCancelReason(e.target.value)}
                                            placeholder="Detalles opcionales..."
                                            className="w-full h-20 p-3 bg-white border border-gray-200 rounded-lg text-sm resize-none focus:border-[#D91A2A] focus:outline-none"
                                        />
                                    </div>

                                    <div className="mt-2 text-[10px] text-gray-400 text-center">
                                        * Se incluirá enlace a soporte: 0412-915-7564
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 pt-2">
                                    <button
                                        onClick={openWhatsAppCancel}
                                        className="w-full py-3 rounded-xl font-bold bg-[#25D366] text-white hover:bg-green-600 shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle size={18} />
                                        Enviar WhatsApp al Cliente
                                    </button>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setShowCancelModal(false); setOrderToCancel(null); }}
                                            disabled={isUpdating}
                                            className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-50"
                                        >
                                            Volver
                                        </button>
                                        <button
                                            onClick={handleConfirmCancellation}
                                            disabled={isUpdating}
                                            className="flex-1 py-3 rounded-xl font-bold bg-[#D91A2A] text-white hover:bg-red-700 shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isUpdating ? <span className="animate-spin">⏳</span> : 'Confirmar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
                {showDispatchModal && (
                    <div key="dispatch-modal" className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full border-4 border-purple-500"
                        >
                            <div className="bg-purple-600 p-4 text-center">
                                <h3 className="font-heading text-xl text-white">Registrar Despacho</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-gray-600 font-bold text-center">Por favor ingresa el número de guía o tracking de la empresa de envíos.</p>
                                <input
                                    type="text"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    placeholder="Ej: 123456789 (Zoom / MRW)"
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:bg-white transition-all font-medium text-center text-lg"
                                    autoFocus
                                />
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => { setShowDispatchModal(false); setOrderToDispatch(null); }}
                                        disabled={isUpdating}
                                        className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmDispatch}
                                        disabled={isUpdating}
                                        className="flex-1 py-3 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isUpdating ? <span className="animate-spin">⏳</span> : 'Confirmar Despacho'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showConfirmStatusModal && pendingStatusUpdate && (
                    <div key="confirm-status-modal" className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full border-4 border-[#F2A900]"
                        >
                            <div className="bg-[#F2A900] p-4 text-center">
                                <h3 className="font-heading text-xl text-[#3E2723]">Confirmar Cambio</h3>
                            </div>
                            <div className="p-6 space-y-4 text-center">
                                <p className="text-gray-600">
                                    ¿Estás seguro que deseas cambiar el estado del pedido a <strong className="uppercase text-[#D91A2A]">{pendingStatusUpdate.status}</strong>?
                                </p>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => { setShowConfirmStatusModal(false); setPendingStatusUpdate(null); }}
                                        disabled={isUpdating}
                                        className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmGeneralStatusUpdate}
                                        disabled={isUpdating}
                                        className="flex-1 py-3 rounded-xl font-bold bg-[#F2A900] text-[#3E2723] hover:bg-yellow-500 shadow-lg shadow-yellow-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isUpdating ? <span className="animate-spin">⏳</span> : 'Confirmar'}
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
