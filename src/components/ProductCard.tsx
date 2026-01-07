import { Plus } from 'lucide-react';
import type { Product } from '../store/cartStore';
import { useCartStore } from '../store/cartStore';

interface Props {
    product: Product;
}

export default function ProductCard({ product }: Props) {
    const addToCart = useCartStore((state) => state.addToCart);

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all hover:scale-105 border-2 border-[#F2A900]">
            <div className="relative h-48 w-full">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-0 right-0 bg-[#D91A2A] text-white px-3 py-1 rounded-bl-lg font-bold">
                    ${product.price}
                </div>
            </div>
            <div className="p-4">
                <h3 className="text-xl font-bold text-[#3E2723] mb-2 font-heading">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                <button
                    onClick={() => addToCart(product, 1)}
                    className="w-full bg-[#D91A2A] hover:bg-[#b91522] text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Agregar
                </button>
            </div>
        </div>
    );
}
