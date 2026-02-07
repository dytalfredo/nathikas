import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Plus, Trash2, Search, DollarSign, Calendar, User, FileText, Edit2 } from 'lucide-react';
import { useAlertStore } from '../../store/alertStore';
import { useAuthStore } from '../../store/authStore';
import type { Purchase, PurchaseItem, Ingredient } from '../../types/types';

export default function PurchasesView() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

    const { user } = useAuthStore();
    const showAlert = useAlertStore(state => state.showAlert);

    // Form state
    const [formData, setFormData] = useState({
        supplier: '',
        notes: '',
        items: [] as PurchaseItem[]
    });

    // Item being added
    const [newItem, setNewItem] = useState({
        ingredientId: '',
        quantity: 0,
        unitCost: 0
    });

    useEffect(() => {
        if (!db) return;

        // Load purchases
        const purchasesQuery = query(collection(db, 'purchases'), orderBy('date', 'desc'));
        const unsubPurchases = onSnapshot(purchasesQuery, (snapshot) => {
            const purchasesData: Purchase[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                purchasesData.push({
                    id: doc.id,
                    ...data,
                    date: data.date?.toDate() || new Date(),
                    createdAt: data.createdAt?.toDate() || new Date()
                } as Purchase);
            });
            setPurchases(purchasesData);
            setLoading(false);
        });

        // Load ingredients
        const unsubIngredients = onSnapshot(collection(db, 'ingredients'), (snapshot) => {
            const ingredientsData: Ingredient[] = [];
            snapshot.forEach(doc => {
                ingredientsData.push({ id: doc.id, ...doc.data() } as Ingredient);
            });
            setIngredients(ingredientsData.sort((a, b) => a.name.localeCompare(b.name)));
        });

        return () => {
            unsubPurchases();
            unsubIngredients();
        };
    }, []);

    const handleOpenModal = (purchase?: Purchase) => {
        if (purchase) {
            setEditingPurchase(purchase);
            setFormData({
                supplier: purchase.supplier,
                notes: purchase.notes || '',
                items: [...purchase.items]
            });
        } else {
            setEditingPurchase(null);
            setFormData({ supplier: '', notes: '', items: [] });
        }
        setNewItem({ ingredientId: '', quantity: 0, unitCost: 0 });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPurchase(null);
        setFormData({ supplier: '', notes: '', items: [] });
        setNewItem({ ingredientId: '', quantity: 0, unitCost: 0 });
    };

    const handleAddItem = () => {
        if (!newItem.ingredientId || newItem.quantity <= 0 || newItem.unitCost < 0) {
            showAlert('Error', 'Completa todos los campos del ingrediente', 'error');
            return;
        }

        const ingredient = ingredients.find(i => i.id === newItem.ingredientId);
        if (!ingredient) return;

        const item: PurchaseItem = {
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            quantity: newItem.quantity,
            unit: ingredient.unit,
            unitCost: newItem.unitCost,
            totalCost: newItem.quantity * newItem.unitCost
        };

        setFormData({
            ...formData,
            items: [...formData.items, item]
        });

        setNewItem({ ingredientId: '', quantity: 0, unitCost: 0 });
    };

    const handleRemoveItem = (index: number) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index)
        });
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + item.totalCost, 0);
    };

    const handleSavePurchase = async () => {
        if (!formData.supplier.trim()) {
            showAlert('Error', 'El proveedor es requerido', 'error');
            return;
        }

        if (formData.items.length === 0) {
            showAlert('Error', 'Debes agregar al menos un ingrediente', 'error');
            return;
        }

        if (!user) {
            showAlert('Error', 'No hay usuario autenticado', 'error');
            return;
        }

        try {
            const purchaseData: Partial<Purchase> = {
                supplier: formData.supplier.trim(),
                notes: formData.notes.trim() || undefined,
                items: formData.items,
                totalCost: calculateTotal(),
                updatedAt: new Date()
            };

            if (editingPurchase) {
                // Update existing
                await setDoc(doc(db, 'purchases', editingPurchase.id), {
                    ...purchaseData,
                    date: editingPurchase.date,
                    createdBy: editingPurchase.createdBy,
                    createdAt: editingPurchase.createdAt
                });
                showAlert('¡Éxito!', 'Compra actualizada correctamente', 'success');
            } else {
                // Create new
                const newId = `pur_${Date.now()}`;
                await setDoc(doc(db, 'purchases', newId), {
                    ...purchaseData,
                    date: new Date(),
                    createdBy: user.email || 'unknown',
                    createdAt: new Date()
                });

                // Update stock for each ingredient
                for (const item of formData.items) {
                    const ingredientRef = doc(db, 'ingredients', item.ingredientId);
                    // We need to read current stock first or use increment
                    // Using increment from firestore is safer
                    const { increment } = await import('firebase/firestore');
                    await updateDoc(ingredientRef, {
                        stock: increment(item.quantity),
                        costPerUnit: item.unitCost, // Update cost with latest purchase price
                        lastPurchaseDate: new Date()
                    });
                }

                showAlert('¡Éxito!', 'Compra registrada y stock actualizado', 'success');
            }

            handleCloseModal();
        } catch (error) {
            console.error('Error saving purchase:', error);
            showAlert('Error', 'No se pudo guardar la compra', 'error');
        }
    };

    const handleDeletePurchase = async (purchaseId: string, supplier: string) => {
        const confirm = window.confirm(`¿Estás seguro de eliminar la compra de "${supplier}"? Esta acción no se puede deshacer.`);
        if (!confirm) return;

        try {
            await deleteDoc(doc(db, 'purchases', purchaseId));
            showAlert('Eliminado', 'Compra eliminada correctamente', 'success');
        } catch (error) {
            console.error('Error deleting purchase:', error);
            showAlert('Error', 'No se pudo eliminar la compra', 'error');
        }
    };

    const filteredPurchases = purchases.filter(p =>
        p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.items.some(item => item.ingredientName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return <div className="p-12 text-center text-gray-400 font-bold">Cargando compras...</div>;
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading text-[#D91A2A] flex items-center gap-2">
                        <ShoppingBag size={32} />
                        Gestión de Compras
                    </h2>
                    <p className="text-gray-600 font-bold text-sm">Registra las compras de ingredientes</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-[#3E2723] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#2D1C1A] transition-all shadow-lg active:scale-95"
                >
                    <Plus size={20} />
                    NUEVA COMPRA
                </button>
            </header>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por proveedor o ingrediente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 focus:border-[#F2A900] outline-none font-medium"
                />
            </div>

            {/* Purchases List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredPurchases.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-12 text-center text-gray-400">
                        <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="font-bold">No hay compras registradas</p>
                        <p className="text-sm">Registra tu primera compra para comenzar</p>
                    </div>
                ) : (
                    filteredPurchases.map((purchase) => (
                        <motion.div
                            key={purchase.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
                        >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-12 h-12 bg-[#F2A900] rounded-xl flex items-center justify-center flex-shrink-0">
                                            <ShoppingBag size={24} className="text-[#3E2723]" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-[#3E2723]">{purchase.supplier}</h3>
                                            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {purchase.date.toLocaleDateString('es-VE')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User size={14} />
                                                    {purchase.createdBy}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="space-y-2 mb-3">
                                        {purchase.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-[#FDF6E3] rounded-lg p-3">
                                                <div>
                                                    <span className="font-bold text-[#3E2723]">{item.ingredientName}</span>
                                                    <span className="text-gray-500 text-sm ml-2">
                                                        {item.quantity} {item.unit} × ${item.unitCost.toFixed(2)}
                                                    </span>
                                                </div>
                                                <span className="font-bold text-green-600">
                                                    ${item.totalCost.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {purchase.notes && (
                                        <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                                            <FileText size={16} className="flex-shrink-0 mt-0.5" />
                                            <span>{purchase.notes}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col items-end gap-3">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500 font-bold">Total</p>
                                        <p className="text-2xl font-bold text-[#D91A2A] flex items-center gap-1">
                                            <DollarSign size={20} />
                                            {purchase.totalCost.toFixed(2)}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(purchase)}
                                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePurchase(purchase.id, purchase.supplier)}
                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal for Add/Edit Purchase */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
                        onClick={handleCloseModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl p-8 max-w-3xl w-full shadow-2xl my-8"
                        >
                            <h3 className="text-2xl font-heading text-[#D91A2A] mb-6">
                                {editingPurchase ? 'Editar Compra' : 'Nueva Compra'}
                            </h3>

                            <div className="space-y-6">
                                {/* Supplier and Notes */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Proveedor *</label>
                                        <input
                                            type="text"
                                            value={formData.supplier}
                                            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                            className="w-full bg-[#FDF6E3] border-2 border-gray-100 rounded-xl p-3 focus:border-[#F2A900] outline-none font-medium"
                                            placeholder="Nombre del proveedor"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Notas</label>
                                        <input
                                            type="text"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full bg-[#FDF6E3] border-2 border-gray-100 rounded-xl p-3 focus:border-[#F2A900] outline-none font-medium"
                                            placeholder="Notas adicionales"
                                        />
                                    </div>
                                </div>

                                {/* Add Item Section */}
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50">
                                    <h4 className="font-bold text-[#3E2723] mb-3">Agregar Ingrediente</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div className="md:col-span-2">
                                            <select
                                                value={newItem.ingredientId}
                                                onChange={(e) => {
                                                    const ing = ingredients.find(i => i.id === e.target.value);
                                                    setNewItem({
                                                        ...newItem,
                                                        ingredientId: e.target.value,
                                                        unitCost: ing?.costPerUnit || 0
                                                    });
                                                }}
                                                className="w-full bg-white border-2 border-gray-100 rounded-xl p-2 focus:border-[#F2A900] outline-none font-medium text-sm"
                                            >
                                                <option value="">Seleccionar ingrediente</option>
                                                {ingredients.map(ing => (
                                                    <option key={ing.id} value={ing.id}>
                                                        {ing.name} ({ing.unit})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="Cantidad"
                                                value={newItem.quantity || ''}
                                                onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                                                className="w-full bg-white border-2 border-gray-100 rounded-xl p-2 focus:border-[#F2A900] outline-none font-medium text-sm"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="$/unidad"
                                                value={newItem.unitCost || ''}
                                                onChange={(e) => setNewItem({ ...newItem, unitCost: parseFloat(e.target.value) || 0 })}
                                                className="w-full bg-white border-2 border-gray-100 rounded-xl p-2 focus:border-[#F2A900] outline-none font-medium text-sm"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAddItem}
                                        className="mt-3 bg-[#F2A900] text-[#3E2723] px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#E09800] transition-all flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        Agregar
                                    </button>
                                </div>

                                {/* Items List */}
                                {formData.items.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-[#3E2723] mb-3">Ingredientes ({formData.items.length})</h4>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {formData.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-[#FDF6E3] rounded-xl p-3">
                                                    <div className="flex-1">
                                                        <span className="font-bold text-[#3E2723]">{item.ingredientName}</span>
                                                        <span className="text-gray-500 text-sm ml-2">
                                                            {item.quantity} {item.unit} × ${item.unitCost.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-green-600">${item.totalCost.toFixed(2)}</span>
                                                        <button
                                                            onClick={() => handleRemoveItem(idx)}
                                                            className="p-1 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 pt-4 border-t-2 border-gray-100 flex justify-between items-center">
                                            <span className="font-bold text-[#3E2723]">Total de la Compra</span>
                                            <span className="text-2xl font-bold text-[#D91A2A] flex items-center gap-1">
                                                <DollarSign size={20} />
                                                {calculateTotal().toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleCloseModal}
                                    className="flex-1 bg-gray-100 text-gray-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSavePurchase}
                                    className="flex-1 bg-[#D91A2A] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#B71524] transition-all shadow-lg"
                                >
                                    {editingPurchase ? 'Actualizar' : 'Guardar Compra'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
