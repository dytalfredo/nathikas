import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import resources from '../data/resources.json';

interface Testimonial {
    id: number;
    name: string;
    text: string;
    image: string;
}

export default function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const next = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prev = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    useEffect(() => {
        const timer = setInterval(next, 6000); // Slower interval for better readability
        return () => clearInterval(timer);
    }, [testimonials.length]);

    return (
        <section className="relative py-24 bg-[#F2A900] overflow-visible -mt-32 md:-mt-48 z-30">
            {/* SVG Wave Separator - Positioned at the top to transition from previous section */}
            <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] transform -translate-y-[99%] z-20">
                <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[60px] md:h-[120px] rotate-180">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#F2A900"></path>
                </svg>
            </div>

            {/* Decorative background elements */}
            <div className="absolute top-10 left-10 text-6xl opacity-10 rotate-12">⭐</div>
            <div className="absolute bottom-10 right-10 text-6xl opacity-10 -rotate-12">⭐</div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #3E2723 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

            <div className="container mx-auto px-4 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <span className="text-[#3E2723] font-bold tracking-widest uppercase text-sm mb-2 block">Opiniones Reales</span>
                    <div className="flex items-center justify-center gap-4 md:gap-8">
                        <motion.img
                            src={resources.recursos.r11}
                            className="w-12 h-12 md:w-20 md:h-20 object-contain hidden sm:block"
                            animate={{ rotate: [0, 15, -15, 0], y: [0, -10, 10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <h2 className="text-4xl md:text-6xl font-bold text-[#3E2723] font-heading drop-shadow-sm">
                            SOCIAL PROOF
                        </h2>
                        <motion.img
                            src={resources.recursos.r10}
                            className="w-12 h-12 md:w-20 md:h-20 object-contain hidden sm:block"
                            animate={{ rotate: [0, -15, 15, 0], y: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />
                    </div>
                </motion.div>

                <div className="relative max-w-5xl mx-auto">
                    {/* Main Card Container */}
                    <div className="relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.4 }}
                                className="bg-white/90 backdrop-blur-sm p-8 md:p-14 rounded-[2.5rem] shadow-2xl mx-4 md:mx-12 border border-white/50 relative"
                            >
                                <Quote className="absolute top-6 right-8 text-[#D91A2A] opacity-10" size={120} />

                                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
                                    {/* Image Side */}
                                    <div className="flex-shrink-0 relative group">
                                        <div className="absolute inset-0 bg-[#D91A2A] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                        <div className="size-32 md:size-48 rounded-full border-4 border-white shadow-xl overflow-hidden relative">
                                            <img
                                                src={testimonials[currentIndex].image}
                                                alt={testimonials[currentIndex].name}
                                                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                                            />
                                        </div>
                                        {/* Verification Badge */}
                                        <div className="absolute bottom-2 right-2 bg-[#007A33] text-white p-1.5 rounded-full border-2 border-white shadow-sm" title="Compra Verificada">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                    </div>

                                    {/* Content Side */}
                                    <div className="flex-1 text-center md:text-left">
                                        <div className="flex justify-center md:justify-start text-[#F2A900] mb-4 space-x-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} fill="currentColor" size={24} className="drop-shadow-sm" />
                                            ))}
                                        </div>

                                        <p className="text-xl md:text-2xl text-[#3E2723] font-medium leading-relaxed mb-6 font-serif">
                                            "{testimonials[currentIndex].text}"
                                        </p>

                                        <div>
                                            <h4 className="text-2xl font-bold text-[#D91A2A] font-heading">
                                                {testimonials[currentIndex].name}
                                            </h4>
                                            <span className="text-gray-500 text-sm font-bold uppercase tracking-wide">Cliente Verificado ✨</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation Buttons - Absolute positioned relative to container */}
                        <button
                            onClick={prev}
                            className="hidden md:flex absolute top-1/2 -left-4 transform -translate-y-1/2 bg-[#3E2723] text-[#FDF6E3] p-4 rounded-full shadow-lg hover:bg-[#D91A2A] hover:scale-110 transition-all z-20 group"
                            aria-label="Previous testimonial"
                        >
                            <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={next}
                            className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 bg-[#3E2723] text-[#FDF6E3] p-4 rounded-full shadow-lg hover:bg-[#D91A2A] hover:scale-110 transition-all z-20 group"
                            aria-label="Next testimonial"
                        >
                            <ChevronRight size={28} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="flex justify-center gap-4 mt-8 md:hidden">
                        <button
                            onClick={prev}
                            className="bg-[#3E2723] text-[#FDF6E3] p-3 rounded-full shadow-lg hover:bg-[#D91A2A] transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={next}
                            className="bg-[#3E2723] text-[#FDF6E3] p-3 rounded-full shadow-lg hover:bg-[#D91A2A] transition-colors"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                {/* Button Removed */}
            </div>
        </section>
    );
}
