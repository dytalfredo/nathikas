import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { collection, doc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Plus, Minus, Save, RotateCcw, Package, AlertTriangle } from 'lucide-react';
import appData from '../../data/app-config.json';

interface ProductStock {
    id: string;
    name: string;
    stock: number;
    price: number;
    image: string;
}

export default function InventoryView() {
    const { user } = useAuthStore();
    const [products, setProducts] = useState<ProductStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !['administrator', 'asistente', 'vendedor'].includes(user.role || '')) {
            setLoading(false);
            return;
        }

        if (!db) {
            console.warn("Firestore 'db' no disponible.");
            setProducts(appData.products.map(p => ({ ...p, stock: 0 })));
            setLoading(false);
            return;
        }

        // Sync with Firestore
        const unsub = onSnapshot(collection(db, "products"),
            (snapshot) => {
                const productsData: ProductStock[] = [];
                snapshot.forEach((doc) => {
                    productsData.push({ id: doc.id, ...doc.data() } as ProductStock);
                });

                if (productsData.length === 0) {
                    setProducts(appData.products.map(p => ({ ...p, stock: 0 })));
                } else {
                    setProducts(productsData);
                }
                setLoading(false);
            },
            (err) => {
                console.error("Error en inventario:", err);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [user?.role]);

    const updateStock = async (productId: string, newStock: number) => {
        if (newStock < 0) return;
        setUpdating(productId);
        try {
            await updateDoc(doc(db, "products", productId), {
                stock: newStock
            });
        } catch (err) {
            console.error("Error updating stock:", err);
            alert("Error al actualizar inventario. Verifica tus permisos.");
        } finally {
            setUpdating(null);
        }
    };

    const initializeInventory = async () => {
        setLoading(true);
        try {
            for (const product of appData.products) {
                await setDoc(doc(db, "products", product.id), {
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    stock: 0
                });
            }
            alert("Inventario inicializado correctamente.");
        } catch (err) {
            console.error("Error initializing:", err);
            alert("Error al inicializar. Revisa la consola y las reglas de Firestore.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-12">
            <RotateCcw className="animate-spin text-[#D91A2A]" size={32} />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-heading text-[#D91A2A]">Control de Inventario</h2>
                    <p className="text-gray-600 font-bold text-sm">Gestiona el stock de tus productos</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={initializeInventory}
                        className="flex-1 md:flex-none bg-white text-gray-500 hover:text-[#D91A2A] px-3 py-2 rounded-xl font-bold shadow-sm border border-gray-100 flex items-center justify-center gap-2 transition-all text-[10px]"
                    >
                        <RotateCcw size={14} />
                        Sincronizar
                    </button>
                    <div className="flex-1 md:flex-none bg-[#D91A2A] text-white px-3 py-2 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 text-xs">
                        <Package size={16} />
                        {products.length} Items
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                    <motion.div
                        key={product.id}
                        layoutId={product.id}
                        className="bg-white rounded-3xl shadow-lg border-2 border-white hover:border-[#F2A900] transition-colors p-6"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-20 h-20 bg-[#FDF6E3] rounded-2xl p-2 shrink-0">
                                <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight mb-1">{product.name}</h3>
                                <p className="text-[#D91A2A] font-bold">${product.price.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="bg-[#FDF6E3] rounded-2xl p-4 border border-[#F2A900]/20">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Existencias Actuales</label>
                            <div className="flex items-center justify-between gap-4">
                                <button
                                    onClick={() => updateStock(product.id, product.stock - 1)}
                                    className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <Minus />
                                </button>

                                <div className="text-center flex-1">
                                    <span className={`text-4xl font-heading ${product.stock <= 5 ? 'text-[#D91A2A]' : 'text-[#3E2723]'}`}>
                                        {product.stock}
                                    </span>
                                    {product.stock <= 5 && (
                                        <div className="flex items-center justify-center gap-1 text-[10px] text-[#D91A2A] font-bold mt-1">
                                            <AlertTriangle size={12} />
                                            STOCK BAJO
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => updateStock(product.id, product.stock + 1)}
                                    className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors"
                                >
                                    <Plus />
                                </button>
                            </div>
                        </div>

                        {updating === product.id && (
                            <div className="mt-4 text-center text-xs font-bold text-[#F2A900] animate-pulse">
                                Sincronizando...
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
