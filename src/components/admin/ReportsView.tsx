import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Package,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    Filter
} from 'lucide-react';

interface Order {
    id: string;
    total: number;
    subtotal: number;
    items: any[];
    status: string;
    createdAt: any;
}

export default function ReportsView() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('all'); // '7d', '30d', 'all'

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const ordersData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Order[];
                setOrders(ordersData);
            } catch (err) {
                console.error("Error fetching reports data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    // Helper functions for stats
    const totalRevenue = orders
        .filter(o => o.status !== 'cancelado')
        .reduce((sum, o) => sum + (o.total || 0), 0);

    const paidOrders = orders.filter(o => o.status === 'pagado' || o.status === 'despachado' || o.status === 'entregado').length;
    const pendingOrders = orders.filter(o => o.status === 'pendiente').length;

    // Top Products implementation
    const productStats = orders
        .filter(o => o.status !== 'cancelado')
        .reduce((acc: any, order) => {
            order.items.forEach(item => {
                if (!acc[item.name]) {
                    acc[item.name] = { name: item.name, quantity: 0, revenue: 0 };
                }
                acc[item.name].quantity += item.quantity;
                acc[item.name].revenue += item.quantity * item.price;
            });
            return acc;
        }, {});

    const topProducts = Object.values(productStats)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-[#F2A900] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-gray-500">Cargando Reportes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold text-[#3E2723]">PANEL DE ESTADÍSTICAS</h2>
                    <p className="text-gray-500">Resumen detallado de ventas y rendimiento.</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    {['7d', '30d', 'all'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeframe === t
                                    ? 'bg-[#D91A2A] text-white shadow-md'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {t === '7d' ? '7 Días' : t === '30d' ? '30 Días' : 'Histórico'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Ventas Totales"
                    value={`$${totalRevenue.toFixed(2)}`}
                    icon={DollarSign}
                    color="blue"
                    trend="+12%"
                />
                <StatCard
                    title="Pedidos Pagados"
                    value={paidOrders.toString()}
                    icon={CheckCircle2}
                    color="green"
                    trend="+5%"
                />
                <StatCard
                    title="Pendientes"
                    value={pendingOrders.toString()}
                    icon={Clock}
                    color="orange"
                    trend="-2%"
                />
                <StatCard
                    title="Ticket Promedio"
                    value={`$${(totalRevenue / (orders.length || 1)).toFixed(2)}`}
                    icon={TrendingUp}
                    color="purple"
                    trend="+8%"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* sales Chart (Visual Placeholder with CSS) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <Calendar size={18} className="text-[#D91A2A]" />
                            Actividad de Pedidos (Mensual)
                        </h3>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-2 px-2">
                        {[40, 65, 45, 80, 55, 90, 70, 45, 60, 85, 95, 100].map((val, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${val}%` }}
                                transition={{ delay: i * 0.05, duration: 0.5 }}
                                className="flex-1 bg-gradient-to-t from-[#F2A900] to-[#F2D000] rounded-t-lg relative group"
                            >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {Math.floor(val * 1.5)}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold px-2 pt-2 border-t">
                        <span>ENE</span>
                        <span>FEB</span>
                        <span>MAR</span>
                        <span>ABR</span>
                        <span>MAY</span>
                        <span>JUN</span>
                        <span>JUL</span>
                        <span>AGO</span>
                        <span>SEP</span>
                        <span>OCT</span>
                        <span>NOV</span>
                        <span>DIC</span>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <h3 className="font-bold flex items-center gap-2">
                        <Package size={18} className="text-[#D91A2A]" />
                        Productos Top
                    </h3>

                    <div className="space-y-4">
                        {topProducts.map((p: any, i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center font-bold text-xs text-gray-400">
                                        #{i + 1}
                                    </div>
                                    <div className="max-w-[120px]">
                                        <p className="font-bold text-sm truncate">{p.name}</p>
                                        <p className="text-[10px] text-gray-400">{p.quantity} unidades</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-[#007A33]">${p.revenue.toFixed(2)}</p>
                                    <div className="w-20 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(p.revenue / (topProducts[0] as any).revenue) * 100}%` }}
                                            className="h-full bg-[#F2A900]"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {topProducts.length === 0 && (
                            <div className="text-center py-10 text-gray-400 text-sm italic">
                                Sin datos de ventas aún.
                            </div>
                        )}
                    </div>

                    <button className="w-full py-3 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                        Ver Inventario Completo
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        orange: 'bg-orange-50 text-orange-600',
        purple: 'bg-purple-50 text-purple-600'
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4"
        >
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${colors[color]}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={`flex items-center text-[10px] font-bold ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                        {trend.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
                <h4 className="text-2xl font-bold text-[#3E2723] mt-1">{value}</h4>
            </div>
        </motion.div>
    );
}

import { CheckCircle2, Clock } from 'lucide-react';
