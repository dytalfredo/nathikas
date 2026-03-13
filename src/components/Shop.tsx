import { useState, useEffect, memo, startTransition } from 'react';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import HeroSection from './HeroSection';
// Direct imports to reduce request count and bundle sections together
import RitualSteps from './RitualSteps';
import BenefitsSection from './BenefitsSection';
import TikTokSection from './TikTokSection';
import B2BSection from './B2BSection';
import FAQSection from './FAQSection';
import ProductInfoSection from './ProductInfoSection';
import Footer from './Footer';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import type { Promotion } from '../types/types';
import { Percent, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
    data: any;
}

const EMPTY_ARRAY: any[] = [];

const Shop = memo(function Shop({ data }: Props) {
    const [isHydrated, setIsHydrated] = useState(false);
    const [promotions, setPromotions] = useState<Promotion[]>([]);

    useEffect(() => {
        startTransition(() => {
            setIsHydrated(true);
        });

        // Fetch promotions
        const unsub = onSnapshot(collection(db, "promotions"), (snapshot) => {
            const now = new Date();
            const promos = snapshot.docs.map(doc => {
                const data = doc.data() as any;
                const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : null;
                return { id: doc.id, ...data, expiresAt } as Promotion;
            });
            setPromotions(promos.filter(p => p.enabled && (!p.expiresAt || p.expiresAt > now)));
        });

        return () => unsub();
    }, []);

    const cartItems = useCartStore((state) => isHydrated ? state.items : EMPTY_ARRAY);
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="min-h-screen bg-[#FDF6E3] relative">
            {/* 1. Hero Section - CTA navigates to /shop directly now */}
            <HeroSection scrollToStore={() => window.location.href = '/shop'} />

            {/* 1.5 Promotions Section (New) */}
            {promotions.length > 0 && (
                <section className="py-12 bg-white overflow-hidden">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-[#F2A900] p-2 rounded-xl text-[#3E2723]">
                                <Sparkles size={24} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold font-heading text-[#D91A2A]">PROMOCIONES IMPERDIBLES</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {promotions.map((promo) => (
                                <motion.div
                                    key={promo.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="group relative rounded-3xl overflow-hidden shadow-2xl border-4 border-[#F2A900]/10 hover:border-[#F2A900] transition-all cursor-pointer bg-[#FDF6E3]"
                                    onClick={() => window.location.href = '/shop'}
                                >
                                    <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden">
                                        <img
                                            src={promo.image || '/recursos/recurso1.webp'}
                                            alt={promo.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
                                            <div className="flex justify-between items-end gap-6">
                                                <div className="space-y-2">
                                                    <div className="inline-flex items-center gap-2 bg-[#F2A900] text-[#3E2723] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                                        <Percent size={12} />
                                                        Oferta Especial
                                                    </div>
                                                    <h3 className="text-2xl md:text-3xl font-bold text-white font-heading leading-tight">{promo.title}</h3>
                                                    <p className="text-white/80 text-sm md:text-base line-clamp-2 max-w-lg">{promo.description}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    {promo.price && (
                                                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 mb-3">
                                                            <p className="text-white/60 text-xs font-bold uppercase">Desde</p>
                                                            <p className="text-[#F2A900] text-3xl md:text-4xl font-bold font-heading">${promo.price}</p>
                                                        </div>
                                                    )}
                                                    <div className="bg-[#D91A2A] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#B71524] transition-all shadow-lg flex items-center gap-2 group-hover:translate-x-1">
                                                        <span>LO QUIERO</span>
                                                        <ArrowRight size={20} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 2. The Ritual (Steps) */}
            <RitualSteps steps={data.ritualSteps || []} />

            {/* 3. Benefits Section (New) */}
            <BenefitsSection />

            {/* 3.5 Product Info Section */}
            <ProductInfoSection />

            <div className="container mx-auto px-4 py-12">
                {/* 5. The Store (Products) - Moved to /shop */}
            </div>

            <TikTokSection />

            {/* 6.5 B2B Partnership Section */}
            <B2BSection />

            {/* 7. FAQ Section (New) */}
            {data.faq && <FAQSection faqs={data.faq} contact={data.contact} />}


            {/* 9. Footer */}
            <Footer
                companyData={data.company}
                contact={data.contact}
                social={data.social}
            />



            {/* Floating Cart Button & Mascot */}
            {
                totalItems > 0 && (
                    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center">
                        {/* Jumping Skull Mascot */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="w-12 md:w-16 mb-[-10px] pointer-events-none drop-shadow-xl z-20"
                        >
                            <img src="/recursos/recurso1.webp" alt="Mascota" className="w-full h-auto" />
                        </motion.div>

                        <a
                            href="/shop"
                            className="bg-[#F2A900] text-[#3E2723] p-5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:bg-[#e09b00] hover:shadow-[0_8px_30px_rgba(242,169,0,0.4)] transition-all hover:scale-110 flex items-center gap-3 border-4 border-white animate-bounce-in relative z-10"
                        >
                            <div className="relative">
                                <ShoppingCart size={28} />
                                <span className="absolute -top-2 -right-2 bg-[#D91A2A] text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                    {totalItems}
                                </span>
                            </div>
                            <span className="font-bold text-xl hidden md:block">Ver Carrito</span>
                        </a>
                    </div>
                )
            }
        </div>
    );
});

export default Shop;
