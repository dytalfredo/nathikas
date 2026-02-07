import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProductIngredient {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
}

export interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
    deliveryCost?: number; // Costo de empaque y envío individual
    ingredients?: ProductIngredient[]; // Ingredientes del producto
}

export interface CartItem extends Product {
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addToCart: (product: Product, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    total: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addToCart: (product, quantity) =>
                set((state) => {
                    const existingItem = state.items.find((item) => item.id === product.id);
                    if (existingItem) {
                        return {
                            items: state.items.map((item) =>
                                item.id === product.id
                                    ? { ...item, quantity: item.quantity + quantity }
                                    : item
                            ),
                        };
                    }
                    return { items: [...state.items, { ...product, quantity }] };
                }),
            removeFromCart: (productId) =>
                set((state) => ({
                    items: state.items.filter((item) => item.id !== productId),
                })),
            updateQuantity: (productId, quantity) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === productId ? { ...item, quantity } : item
                    ),
                })),
            clearCart: () => set({ items: [] }),
            total: () => {
                const { items } = get();
                return items.reduce((acc, item) => {
                    const productPrice = item.price || 0;
                    const deliveryCost = item.deliveryCost || 0;
                    return acc + (productPrice + deliveryCost) * item.quantity;
                }, 0);
            },
        }),
        {
            name: 'nathikas-cart',
        }
    )
);
