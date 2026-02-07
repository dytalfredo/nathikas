import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { useAlertStore } from '../../store/alertStore';
import { collection, doc, updateDoc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Save, RotateCcw, Package, AlertTriangle, Leaf, Edit2, Trash2, Search, DollarSign, ChefHat } from 'lucide-react';
import appData from '../../data/app-config.json';
import type { Ingredient, ProductIngredient } from '../../types/types';

interface ProductStock {
    id: string;
    name: string;
    stock: number;
    price: number;
    image: string;
    deliveryCost?: number;
    ingredients?: ProductIngredient[];
}

export default function InventoryView() {
    const { user } = useAuthStore();
    const showAlert = useAlertStore(state => state.showAlert);

    // Tab State
    const [activeTab, setActiveTab] = useState<'products' | 'ingredients'>('products');

    // Products State
    const [products, setProducts] = useState<ProductStock[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [updatingStock, setUpdatingStock] = useState<string | null>(null);

    // Ingredients State
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loadingIngredients, setLoadingIngredients] = useState(true);
    const [ingredientSearch, setIngredientSearch] = useState('');
    const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [ingredientFormData, setIngredientFormData] = useState({
        name: '',
        unit: 'kg',
        costPerUnit: 0,
        supplier: ''
    });

    // Recipe Modal State
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductStock | null>(null);
    const [recipeIngredients, setRecipeIngredients] = useState<ProductIngredient[]>([]);
    const [newRecipeItem, setNewRecipeItem] = useState({
        ingredientId: '',
        quantity: 0
    });

    // Load Data
    useEffect(() => {
        if (!user || !['administrator', 'asistente', 'vendedor'].includes(user.role || '') || !db) {
            setLoadingProducts(false);
            setLoadingIngredients(false);
            return;
        }

        // 1. Load Products
        const unsubProducts = onSnapshot(collection(db, "products"),
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
                setLoadingProducts(false);
            },
            (err) => {
                console.error("Error loading products:", err);
                setLoadingProducts(false);
            }
        );

        // 2. Load Ingredients
        const unsubIngredients = onSnapshot(collection(db, "ingredients"),
            (snapshot) => {
                const ingredientsData: Ingredient[] = [];
                snapshot.forEach((doc) => {
                    ingredientsData.push({ id: doc.id, ...doc.data() } as Ingredient);
                });
                setIngredients(ingredientsData.sort((a, b) => a.name.localeCompare(b.name)));
                setLoadingIngredients(false);
            },
            (err) => {
                console.error("Error loading ingredients:", err);
                setLoadingIngredients(false);
            }
        );

        return () => {
            unsubProducts();
            unsubIngredients();
        };
    }, [user?.role]);


    // --- PRODUCT ACTIONS ---

    const updateStock = async (productId: string, newStock: number) => {
        if (newStock < 0) return;
        setUpdatingStock(productId);
        try {
            await updateDoc(doc(db, "products", productId), {
                stock: newStock
            });
        } catch (err) {
            console.error("Error updating stock:", err);
            showAlert("Error", "No se pudo actualizar el stock.", "error");
        } finally {
            setUpdatingStock(null);
        }
    };

    const initializeInventory = async () => {
        setLoadingProducts(true);
        try {
            for (const product of appData.products) {
                // Check if document exists before overwritting to preserve existing data like recipes
                // Actually setDoc with merge: true is safer
                await setDoc(doc(db, "products", product.id), {
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    stock: 0
                }, { merge: true });
            }
            showAlert("¡Éxito!", "Inventario sincronizado.", "success");
        } catch (err) {
            console.error("Error initializing:", err);
            showAlert("Error", "Fallo la sincronización.", "error");
        } finally {
            setLoadingProducts(false);
        }
    };


    // --- INGREDIENT ACTIONS ---

    const handleOpenIngredientModal = (ingredient?: Ingredient) => {
        if (ingredient) {
            setEditingIngredient(ingredient);
            setIngredientFormData({
                name: ingredient.name,
                unit: ingredient.unit,
                costPerUnit: ingredient.costPerUnit,
                supplier: ingredient.supplier || ''
            });
        } else {
            setEditingIngredient(null);
            setIngredientFormData({ name: '', unit: 'kg', costPerUnit: 0, supplier: '' });
        }
        setIsIngredientModalOpen(true);
    };

    const handleSaveIngredient = async () => {
        if (!ingredientFormData.name.trim()) {
            showAlert('Error', 'El nombre es requerido', 'error');
            return;
        }

        try {
            const data: Partial<Ingredient> = {
                name: ingredientFormData.name.trim(),
                unit: ingredientFormData.unit,
                costPerUnit: ingredientFormData.costPerUnit,
                supplier: ingredientFormData.supplier.trim() || undefined,
                updatedAt: new Date()
            };

            if (editingIngredient) {
                await updateDoc(doc(db, 'ingredients', editingIngredient.id), data);
                showAlert('¡Éxito!', 'Ingrediente actualizado', 'success');
            } else {
                const newId = `ing_${Date.now()}`;
                await setDoc(doc(db, 'ingredients', newId), {
                    ...data,
                    createdAt: new Date()
                });
                showAlert('¡Éxito!', 'Ingrediente creado', 'success');
            }
            setIsIngredientModalOpen(false);
        } catch (error) {
            console.error('Error saving ingredient:', error);
            showAlert('Error', 'No se pudo guardar', 'error');
        }
    };

    const handleDeleteIngredient = async (id: string, name: string) => {
        if (!window.confirm(`¿Eliminar "${name}"?`)) return;
        try {
            await deleteDoc(doc(db, 'ingredients', id));
            showAlert('Eliminado', 'Ingrediente eliminado', 'success');
        } catch (error) {
            showAlert('Error', 'No se pudo eliminar', 'error');
        }
    };

    const filteredIngredients = ingredients.filter(ing =>
        ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()) ||
        (ing.supplier && ing.supplier.toLowerCase().includes(ingredientSearch.toLowerCase()))
    );


    // --- RECIPE ACTIONS ---

    const handleOpenRecipeModal = (product: ProductStock) => {
        setEditingProduct(product);
        setRecipeIngredients(product.ingredients || []);
        setNewRecipeItem({ ingredientId: '', quantity: 0 });
        setIsRecipeModalOpen(true);
    };

    const handleAddIngredientToRecipe = () => {
        if (!newRecipeItem.ingredientId || newRecipeItem.quantity <= 0) {
            showAlert('Error', 'Selecciona ingrediente y cantidad válida', 'error');
            return;
        }

        const ingredient = ingredients.find(i => i.id === newRecipeItem.ingredientId);
        if (!ingredient) return;

        // Check if already exists
        if (recipeIngredients.some(i => i.ingredientId === ingredient.id)) {
            showAlert('Error', 'El ingrediente ya está en la receta', 'error');
            return;
        }

        const newItem: ProductIngredient = {
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            quantity: newRecipeItem.quantity,
            unit: ingredient.unit
        };

        setRecipeIngredients([...recipeIngredients, newItem]);
        setNewRecipeItem({ ingredientId: '', quantity: 0 });
    };

    const handleRemoveIngredientFromRecipe = (index: number) => {
        setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
    };

    const handleSaveRecipe = async () => {
        if (!editingProduct) return;

        try {
            await updateDoc(doc(db, 'products', editingProduct.id), {
                ingredients: recipeIngredients
            });
            showAlert('¡Éxito!', 'Receta guardada correctamente', 'success');
            setIsRecipeModalOpen(false);
        } catch (error) {
            console.error('Error saving recipe:', error);
            showAlert('Error', 'No se pudo guardar la receta', 'error');
        }
    };


    if (loadingProducts || loadingIngredients) return (
        <div className="flex justify-center p-12">
            <RotateCcw className="animate-spin text-[#D91A2A]" size={32} />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-heading text-[#D91A2A]">Control de Inventario</h2>
                    <p className="text-gray-600 font-bold text-sm">Gestiona productos, stock e ingredientes</p>
                </div>

                <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'products'
                            ? 'bg-[#D91A2A] text-white shadow-md'
                            : 'text-gray-500 hover:text-[#D91A2A]'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Package size={16} />
                            Productos
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('ingredients')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'ingredients'
                            ? 'bg-[#D91A2A] text-white shadow-md'
                            : 'text-gray-500 hover:text-[#D91A2A]'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Leaf size={16} />
                            Ingredientes
                        </div>
                    </button>
                </div>
            </div>

            {/* TAB: PRODUCTS */}
            {activeTab === 'products' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button
                            onClick={initializeInventory}
                            className="bg-white text-gray-500 hover:text-[#D91A2A] px-3 py-2 rounded-xl font-bold shadow-sm border border-gray-100 flex items-center gap-2 transition-all text-xs"
                        >
                            <RotateCcw size={14} />
                            Sincronizar Productos
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <motion.div
                                key={product.id}
                                layoutId={product.id}
                                className="bg-white rounded-3xl shadow-lg border-2 border-white hover:border-[#F2A900] transition-colors p-6 flex flex-col h-full"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-20 h-20 bg-[#FDF6E3] rounded-2xl p-2 shrink-0">
                                        <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight mb-1">{product.name}</h3>
                                        <p className="text-[#D91A2A] font-bold">
                                            ${(product.price + (product.deliveryCost || 0)).toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-[#FDF6E3] rounded-2xl p-4 border border-[#F2A900]/20 mb-4">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Existencias</label>
                                    <div className="flex items-center justify-between gap-4">
                                        <button
                                            onClick={() => updateStock(product.id, product.stock - 1)}
                                            className="w-10 h-10 shrink-0 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <Minus size={18} />
                                        </button>

                                        <div className="text-center flex-1 min-w-0">
                                            <input
                                                type="number"
                                                value={product.stock}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (!isNaN(val) && val >= 0) updateStock(product.id, val);
                                                    else if (e.target.value === '') updateStock(product.id, 0);
                                                }}
                                                className={`w-full bg-transparent text-center font-heading text-3xl focus:outline-none ${product.stock <= 5 ? 'text-[#D91A2A]' : 'text-[#3E2723]'}`}
                                            />
                                            {product.stock <= 5 && (
                                                <div className="flex items-center justify-center gap-1 text-[10px] text-[#D91A2A] font-bold mt-1">
                                                    <AlertTriangle size={12} />
                                                    BAJO
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => updateStock(product.id, product.stock + 1)}
                                            className="w-10 h-10 shrink-0 bg-white rounded-xl shadow-sm flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleOpenRecipeModal(product)}
                                        className="w-full bg-gray-50 text-[#3E2723] hover:bg-[#F2A900] hover:text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                                    >
                                        <ChefHat size={16} />
                                        {product.ingredients?.length ? `Receta (${product.ingredients.length})` : 'Definir Receta'}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: INGREDIENTS */}
            {activeTab === 'ingredients' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar ingrediente..."
                                value={ingredientSearch}
                                onChange={(e) => setIngredientSearch(e.target.value)}
                                className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 focus:border-[#F2A900] outline-none font-medium"
                            />
                        </div>
                        <button
                            onClick={() => handleOpenIngredientModal()}
                            className="bg-[#3E2723] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#2D1C1A] transition-all shadow-lg text-sm"
                        >
                            <Plus size={18} />
                            NUEVO INGREDIENTE
                        </button>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                        {filteredIngredients.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <Leaf size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="font-bold">No hay ingredientes registrados</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#FDF6E3] border-b-2 border-gray-100">
                                        <tr>
                                            <th className="text-left p-4 font-bold text-[#3E2723]">Nombre</th>
                                            <th className="text-left p-4 font-bold text-[#3E2723]">Existencias</th>
                                            <th className="text-left p-4 font-bold text-[#3E2723]">Unidad</th>
                                            <th className="text-left p-4 font-bold text-[#3E2723]">Costo/U</th>
                                            <th className="text-left p-4 font-bold text-[#3E2723]">Proveedor</th>
                                            <th className="text-right p-4 font-bold text-[#3E2723]">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredIngredients.map((ingredient) => (
                                            <tr key={ingredient.id} className="border-b border-gray-100 hover:bg-[#FDF6E3]/50">
                                                <td className="p-4 font-bold text-[#3E2723]">{ingredient.name}</td>
                                                <td className="p-4">
                                                    <span className={`font-bold ${!ingredient.stock || ingredient.stock <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                                                        {ingredient.stock || 0}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600">
                                                        {ingredient.unit}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-bold text-green-600">
                                                    ${ingredient.costPerUnit.toFixed(2)}
                                                </td>
                                                <td className="p-4 text-sm text-gray-600">{ingredient.supplier || '-'}</td>
                                                <td className="p-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleOpenIngredientModal(ingredient)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDeleteIngredient(ingredient.id, ingredient.name)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL: INGREDIENT FORM */}
            <AnimatePresence>
                {isIngredientModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setIsIngredientModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <h3 className="text-2xl font-heading text-[#D91A2A] mb-6">
                                {editingIngredient ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Nombre</label>
                                    <input
                                        value={ingredientFormData.name}
                                        onChange={e => setIngredientFormData({ ...ingredientFormData, name: e.target.value })}
                                        className="w-full bg-[#FDF6E3] border border-gray-100 rounded-xl p-3 focus:border-[#F2A900] outline-none font-bold"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Unidad</label>
                                        <select
                                            value={ingredientFormData.unit}
                                            onChange={e => setIngredientFormData({ ...ingredientFormData, unit: e.target.value })}
                                            className="w-full bg-[#FDF6E3] border border-gray-100 rounded-xl p-3 focus:border-[#F2A900] outline-none text-sm font-medium"
                                        >
                                            <option value="kg">Kilogramos</option>
                                            <option value="g">Gramos</option>
                                            <option value="l">Litros</option>
                                            <option value="ml">Mililitros</option>
                                            <option value="unidades">Unidades</option>
                                            <option value="paquetes">Paquetes</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Costo ($)</label>
                                        <input
                                            type="number" step="0.01" min="0"
                                            value={ingredientFormData.costPerUnit}
                                            onChange={e => setIngredientFormData({ ...ingredientFormData, costPerUnit: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-[#FDF6E3] border border-gray-100 rounded-xl p-3 focus:border-[#F2A900] outline-none font-bold"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Proveedor</label>
                                    <input
                                        value={ingredientFormData.supplier}
                                        onChange={e => setIngredientFormData({ ...ingredientFormData, supplier: e.target.value })}
                                        className="w-full bg-[#FDF6E3] border border-gray-100 rounded-xl p-3 focus:border-[#F2A900] outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setIsIngredientModalOpen(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">Cancelar</button>
                                <button onClick={handleSaveIngredient} className="flex-1 bg-[#D91A2A] text-white py-3 rounded-xl font-bold hover:bg-[#B71524]">Guardar</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL: RECIPE EDITOR */}
            <AnimatePresence>
                {isRecipeModalOpen && editingProduct && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setIsRecipeModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl h-[90vh] flex flex-col"
                        >
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                                <div className="w-16 h-16 bg-[#FDF6E3] rounded-xl p-1 shrink-0">
                                    <img src={editingProduct.image} className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-heading text-[#D91A2A]">Receta: {editingProduct.name}</h3>
                                    <p className="text-sm text-gray-500">Define los ingredientes necesarios para producir un item.</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2">
                                {/* Add Item */}
                                <div className="bg-gray-50 p-4 rounded-xl border-dashed border-2 border-gray-200 mb-6">
                                    <h4 className="font-bold text-[#3E2723] mb-3 text-sm">Agregar Ingrediente</h4>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <select
                                            value={newRecipeItem.ingredientId}
                                            onChange={e => setNewRecipeItem({ ...newRecipeItem, ingredientId: e.target.value })}
                                            className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-sm"
                                        >
                                            <option value="">Seleccionar ingrediente...</option>
                                            {ingredients.map(ing => (
                                                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number" step="0.01" min="0" placeholder="Cantidad"
                                            value={newRecipeItem.quantity || ''}
                                            onChange={e => setNewRecipeItem({ ...newRecipeItem, quantity: parseFloat(e.target.value) || 0 })}
                                            className="w-24 bg-white border border-gray-200 rounded-lg p-2 text-sm"
                                        />
                                        <button
                                            onClick={handleAddIngredientToRecipe}
                                            className="bg-[#F2A900] text-[#3E2723] px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#E09800]"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="space-y-2">
                                    <h4 className="font-bold text-[#3E2723] text-sm mb-2">Ingredientes Actuales ({recipeIngredients.length})</h4>
                                    {recipeIngredients.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">No hay ingredientes asignados.</p>
                                    ) : (
                                        recipeIngredients.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-[#FDF6E3] p-3 rounded-xl">
                                                <span className="font-bold text-[#3E2723] text-sm">{item.ingredientName}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-medium bg-white px-2 py-1 rounded-md">
                                                        {item.quantity} {item.unit}
                                                    </span>
                                                    <button onClick={() => handleRemoveIngredientFromRecipe(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
                                <button onClick={() => setIsRecipeModalOpen(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">Cancelar</button>
                                <button onClick={handleSaveRecipe} className="flex-1 bg-[#D91A2A] text-white py-3 rounded-xl font-bold hover:bg-[#B71524]">Guardar Receta</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
