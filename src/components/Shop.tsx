import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import HeroSection from './HeroSection';
import RitualSteps from './RitualSteps';
import TestimonialCarousel from './TestimonialCarousel';
import VideoCTA from './VideoCTA';
import Footer from './Footer';
import BenefitsSection from './BenefitsSection';
import FAQSection from './FAQSection';

interface Props {
    data: any;
}

export default function Shop({ data }: Props) {
    const cartItems = useCartStore((state) => state.items);
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="min-h-screen bg-[#FDF6E3] relative">
            {/* 1. Hero Section - CTA navigates to /shop directly now */}
            <HeroSection scrollToStore={() => window.location.href = '/shop'} />

            {/* 2. The Ritual (Steps) */}
            <RitualSteps steps={data.ritualSteps || []} />

            {/* 3. Benefits Section (New) */}
            {data.benefits && <BenefitsSection benefits={data.benefits} />}

            <div className="container mx-auto px-4 py-12">
                {/* 5. The Store (Products) - Moved to /shop */}
            </div>

            {/* 6. Testimonials */}
            {data.testimonials && <TestimonialCarousel testimonials={data.testimonials} />}

            {/* 7. FAQ Section (New) */}
            {data.faq && <FAQSection faqs={data.faq} />}

            {/* 8. Video CTA */}
            {data.company.videoCTA && (
                <VideoCTA
                    title={data.company.videoCTA.title}
                    videoUrl={data.company.videoCTA.videoUrl}
                    onCtaClick={() => window.location.href = '/shop'}
                />
            )}

            {/* 9. Footer */}
            <Footer companyData={data.company} />


            {/* Floating Cart Button & Mascot */}
            {totalItems > 0 && (
                <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center">
                    {/* Jumping Skull Mascot */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="w-12 md:w-16 mb-[-10px] pointer-events-none drop-shadow-xl z-20"
                    >
                        <img src="/recursos/recurso1.png" alt="Mascota" className="w-full h-auto" />
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
            )}
        </div>
    );
}
