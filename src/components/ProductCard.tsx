import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '../store/cartStore';
import { useCartStore } from '../store/cartStore';

interface Props {
    product: Product;
}

export default function ProductCard({ product }: Props) {
    const addToCart = useCartStore((state) => state.addToCart);
    const inCart = useCartStore((state) => state.items.find(i => i.id === product.id));

    return (
        <motion.div
            whileHover={{ y: -8 }}
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-[#F2A900] group"
        >
            <div className="relative aspect-square overflow-hidden bg-[#FDF6E3]/30 p-4">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-0 right-0 bg-[#D91A2A] text-white px-4 py-2 rounded-bl-2xl font-bold shadow-lg z-10">
                    ${product.price}
                </div>
                {inCart && (
                    <div className="absolute top-4 left-4 bg-[#F2A900] text-[#3E2723] w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md border-2 border-white animate-bounce-in">
                        {inCart.quantity}
                    </div>
                )}
            </div>
            <div className="p-5 space-y-3">
                <h3 className="text-lg font-bold text-[#3E2723] leading-tight font-heading line-clamp-1">{product.name}</h3>
                <p className="text-gray-500 text-xs line-clamp-2 h-8 leading-relaxed">{product.description}</p>
                <button
                    onClick={() => addToCart(product, 1)}
                    className="w-full bg-[#D91A2A] hover:bg-[#b91522] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 group/btn"
                >
                    <Plus size={18} className="group-hover/btn:rotate-90 transition-transform" />
                    <span>Agregar al Carrito</span>
                </button>
            </div>
        </motion.div>
    );
}
