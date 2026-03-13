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
    promotionId?: string;
    promoProducts?: { id: string, name: string, quantity: number }[];
}

interface CartState {
    items: CartItem[];
    addToCart: (product: Product, quantity: number) => void;
    addPromotionToCart: (promotion: any) => void;
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
                    if (quantity <= 0) return state;
                    // Dont merge regular products with bundles
                    const existingItem = state.items.find((item) => item.id === product.id && !item.promotionId);
                    if (existingItem) {
                        return {
                            items: state.items.map((item) =>
                                item.id === product.id && !item.promotionId
                                    ? { ...item, quantity: item.quantity + quantity }
                                    : item
                            ),
                        };
                    }
                    return { items: [...state.items, { ...product, quantity }] };
                }),
            addPromotionToCart: (promotion) =>
                set((state) => {
                    // Check if this promotion is already in cart
                    const existingPromo = state.items.find((item) => item.promotionId === promotion.id);
                    
                    if (existingPromo) {
                        return {
                            items: state.items.map((item) =>
                                item.promotionId === promotion.id
                                    ? { ...item, quantity: item.quantity + 1 }
                                    : item
                            ),
                        };
                    }

                    const promoItem: CartItem = {
                        id: promotion.id, // For uniqueness in cart summary keys
                        name: promotion.title,
                        price: promotion.price || promotion.value || 0,
                        image: promotion.image || '/recursos/recurso1.webp',
                        description: promotion.description,
                        quantity: 1,
                        promotionId: promotion.id,
                        promoProducts: (promotion.applicableProducts || []).map((p: any) => ({
                            id: p.productId,
                            name: p.productName,
                            quantity: p.quantity || 1
                        }))
                    };

                    return { items: [...state.items, promoItem] };
                }),
            removeFromCart: (productId) =>
                set((state) => ({
                    items: state.items.filter((item) => item.id !== productId),
                })),
            updateQuantity: (productId, quantity) =>
                set((state) => {
                    if (quantity <= 0) {
                        return {
                            items: state.items.filter((item) => item.id !== productId),
                        };
                    }
                    return {
                        items: state.items.map((item) =>
                            item.id === productId ? { ...item, quantity } : item
                        ),
                    };
                }),
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
