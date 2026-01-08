import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { initAuth, logout } from '../../lib/auth-service';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Package,
    Truck,
    Users,
    LogOut,
    Menu,
    X,
    ShoppingCart,
    Clock,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';

// Sub-components for sections
import InventoryView from './InventoryView';
import OrdersView from './OrdersView';

export default function Dashboard() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('orders');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    if (!user) return null;

    const menuItems = [
        { id: 'orders', label: 'Pedidos', icon: ShoppingCart, roles: ['administrator', 'asistente', 'vendedor'] },
        { id: 'inventory', label: 'Inventario', icon: Package, roles: ['administrator', 'asistente', 'vendedor'] },
        { id: 'shipments', label: 'Despachos', icon: Truck, roles: ['administrator', 'asistente'] },
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(user.role as string));

    return (
        <div className="min-h-screen bg-[#FDF6E3] flex flex-col font-sans text-[#3E2723]">
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar (Tablet/Desktop) */}
                <aside
                    className={`bg-white shadow-xl z-50 transition-all duration-300 hidden md:flex flex-col h-screen sticky top-0 ${isSidebarOpen ? 'w-64' : 'w-20'}`}
                >
                    <div className="p-6 flex items-center gap-4 border-b">
                        <img src="/images/logo.png" alt="Logo" className="w-10 h-10 flex-shrink-0" />
                        {isSidebarOpen && <span className="font-heading text-2xl text-[#D91A2A]">Admin</span>}
                    </div>

                    <nav className="flex-1 p-4 space-y-2">
                        {filteredMenu.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-4 p-3 rounded-xl font-bold transition-all ${activeTab === item.id
                                    ? 'bg-[#F2A900] text-[#3E2723] shadow-md'
                                    : 'hover:bg-[#FDF6E3] text-gray-500'
                                    }`}
                            >
                                <item.icon size={24} />
                                {isSidebarOpen && <span>{item.label}</span>}
                            </button>
                        ))}
                    </nav>

                    <div className="p-4 border-t">
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-4 p-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-all"
                        >
                            <LogOut size={24} />
                            {isSidebarOpen && <span>Cerrar Sesión</span>}
                        </button>
                    </div>
                </aside>

                <div className="flex-1 flex flex-col min-w-0 h-screen">
                    {/* Header (Desktop) */}
                    <header className="bg-white shadow-sm p-4 hidden md:flex items-center justify-between z-40">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-[#FDF6E3] rounded-lg transition-colors"
                        >
                            {isSidebarOpen ? <X /> : <Menu />}
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="font-bold text-sm">{user.email}</p>
                                <p className="text-xs text-[#D91A2A] capitalize">{user.role}</p>
                            </div>
                            <div className="w-10 h-10 bg-[#F2A900] rounded-full flex items-center justify-center font-bold text-[#3E2723] border-2 border-white shadow-sm">
                                {user.email?.[0].toUpperCase()}
                            </div>
                        </div>
                    </header>

                    {/* Header (Mobile) */}
                    <header className="bg-white shadow-sm p-4 flex items-center justify-between md:hidden sticky top-0 z-40">
                        <div className="flex items-center gap-2">
                            <img src="/images/logo.png" alt="Logo" className="w-8 h-8" />
                            <span className="font-heading text-xl text-[#D91A2A]">Admin</span>
                        </div>
                        <div className="w-8 h-8 bg-[#F2A900] rounded-full flex items-center justify-center font-bold text-[#3E2723] text-xs border-2 border-white shadow-sm">
                            {user.email?.[0].toUpperCase()}
                        </div>
                    </header>

                    {/* Main Content Area */}
                    <div className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="max-w-6xl mx-auto"
                            >
                                {activeTab === 'orders' && <OrdersView />}
                                {activeTab === 'inventory' && <InventoryView />}
                                {activeTab === 'shipments' && <OrdersView filterByStatus="pagado" title="Gestión de Despachos" />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-around items-center md:hidden z-50 safe-area-bottom">
                {filteredMenu.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-all relative ${activeTab === item.id
                            ? 'text-[#D91A2A]'
                            : 'text-gray-400'
                            }`}
                    >
                        <item.icon size={20} className={activeTab === item.id ? 'scale-110' : ''} />
                        <span className="text-[10px] font-bold">{item.label}</span>
                        {activeTab === item.id && (
                            <motion.div
                                layoutId="navMarker"
                                className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#D91A2A] rounded-b-full"
                            />
                        )}
                    </button>
                ))}
                <button
                    onClick={logout}
                    className="flex flex-col items-center gap-1 p-2 min-w-[64px] text-gray-400"
                >
                    <LogOut size={20} />
                    <span className="text-[10px] font-bold">Salir</span>
                </button>
            </nav>
        </div>
    );
}
