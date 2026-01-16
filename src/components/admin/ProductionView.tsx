import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, CheckCircle2, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { useAlertStore } from '../../store/alertStore';

interface ProductionNeed {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    quantityNeeded: number;
    status: string;
    createdAt: any;
}

interface ProductionViewProps {
    onNavigateToOrder?: (orderId: string) => void;
}

export default function ProductionView({ onNavigateToOrder }: ProductionViewProps) {
    const [needs, setNeeds] = useState<ProductionNeed[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pendiente'); // 'pendiente', 'completado', 'all'
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [sortBy, setSortBy] = useState<'date' | 'product'>('date');

    useEffect(() => {
        if (!db) return;

        let q;
        // Basic query construction
        if (statusFilter === 'all') {
            q = query(collection(db, "production_needs"));
        } else {
            q = query(collection(db, "production_needs"), where("status", "==", statusFilter));
        }

        const unsub = onSnapshot(q, (snapshot) => {
            const needsData: ProductionNeed[] = [];
            snapshot.forEach((doc) => {
                needsData.push({ id: doc.id, ...doc.data() } as ProductionNeed);
            });

            // Client-side Sort
            needsData.sort((a, b) => {
                if (sortBy === 'product') {
                    return a.productName.localeCompare(b.productName);
                } else {
                    // Date Sort
                    const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
                    const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
                    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                }
            });

            setNeeds(needsData);
            setLoading(false);
        });

        return () => unsub();
    }, [statusFilter, sortOrder, sortBy]); // Re-run if filters/sort change

    // Aggregate needs by product
    const summary = needs.reduce((acc, need) => {
        if (!acc[need.productId]) {
            acc[need.productId] = { name: need.productName, total: 0, orders: 0 };
        }
        acc[need.productId].total += need.quantityNeeded;
        acc[need.productId].orders += 1;
        return acc;
    }, {} as Record<string, { name: string, total: number, orders: number }>);

    const markAsDone = async (needId: string) => {
        try {
            const needRef = doc(db, "production_needs", needId);
            await updateDoc(needRef, { status: 'completado' });
            // Alternatively, deleteDoc(needRef) if you don't want history
        } catch (err) {
            console.error("Error marking as done:", err);
            useAlertStore.getState().showAlert("Error", "No se pudo actualizar el estado.", "error");
        }
    };

    const totalNeeded = Object.values(summary).reduce((sum, item) => sum + item.total, 0);

    if (loading) return <div className="p-12 text-center text-gray-400 font-bold">Cargando requerimientos de producción...</div>;

    return (
        <div className="space-y-6">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading text-[#D91A2A]">Planificación de Producción</h2>
                    <p className="text-gray-600 font-bold">Unidades faltantes para completar pedidos pendientes</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-50 border text-gray-600 text-xs font-bold border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:border-[#F2A900] cursor-pointer"
                    >
                        <option value="pendiente">Pendientes</option>
                        <option value="completado">Completados</option>
                        <option value="all">Todos</option>
                    </select>

                    <div className="w-px h-6 bg-gray-200"></div>

                    {/* Sort Controls */}
                    <button
                        onClick={() => setSortBy(sortBy === 'date' ? 'product' : 'date')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${sortBy === 'date' ? 'bg-[#D91A2A] text-white border-[#D91A2A]' : 'bg-white text-gray-500 border-gray-200'}`}
                    >
                        {sortBy === 'date' ? <Clock size={14} /> : <Package size={14} />}
                        {sortBy === 'date' ? 'Fecha' : 'Producto'}
                    </button>

                    <button
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                        className="p-2 rounded-lg text-xs font-bold transition-all border bg-white text-gray-500 border-gray-200 hover:border-[#F2A900] flex items-center gap-1"
                        title={sortOrder === 'desc' ? "Descendente" : "Ascendente"}
                    >
                        {sortOrder === 'desc' ? 'DESC' : 'ASC'}
                    </button>
                </div>
            </header>

            {/* Total Summary Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#D91A2A] rounded-3xl p-6 text-white shadow-xl flex items-center justify-between border-b-4 border-red-900"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-4 rounded-2xl">
                        <Package size={32} />
                    </div>
                    <div>
                        <p className="text-sm font-bold opacity-80 uppercase tracking-wider">Total a Producir</p>
                        <h3 className="text-4xl font-heading">{totalNeeded} unidades</h3>
                    </div>
                </div>
                <div className="hidden md:block text-right opacity-60">
                    <p className="text-xs font-bold">Actualizado en tiempo real</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Aggregated List */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-xl font-heading text-[#3E2723] mb-6 flex items-center gap-2">
                        <CheckCircle2 className="text-[#F2A900]" /> Resumen por Producto
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(summary).length === 0 ? (
                            <p className="p-8 text-center text-gray-400 italic font-bold">Sin necesidades de producción pendientes ✨</p>
                        ) : (
                            Object.entries(summary).map(([id, data]) => (
                                <div key={id} className="flex items-center justify-between p-4 bg-[#FDF6E3] rounded-2xl border border-orange-100">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[#3E2723]">{data.name}</span>
                                        <span className="text-[10px] text-gray-500 uppercase font-black">{data.orders} pedidos en espera</span>
                                    </div>
                                    <div className="bg-[#D91A2A] text-white px-4 py-2 rounded-xl font-heading text-xl shadow-sm">
                                        {data.total}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Detailed List */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 overflow-hidden flex flex-col">
                    <h3 className="text-xl font-heading text-[#3E2723] mb-6 flex items-center gap-2">
                        <Clock className="text-[#D91A2A]" /> Detalle por Pedido
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar max-h-[500px]">
                        {needs.map((need) => (
                            <div key={need.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow group">
                                <div className="flex flex-col">
                                    <button
                                        onClick={() => onNavigateToOrder?.(need.orderId)}
                                        className="text-xs font-bold text-[#D91A2A] hover:underline uppercase tracking-tighter text-left"
                                    >
                                        Pedido: {need.orderId.slice(-6)}
                                    </button>
                                    <span className="font-bold text-sm text-[#3E2723]">{need.productName}</span>
                                    <span className="text-[10px] text-orange-600 font-bold italic">Faltan {need.quantityNeeded} un.</span>
                                </div>
                                <button
                                    onClick={() => markAsDone(need.id)}
                                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-bold"
                                >
                                    <CheckCircle2 size={16} /> LISTO
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
