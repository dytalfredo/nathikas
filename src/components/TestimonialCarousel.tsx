import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [testimonials.length]);

    return (
        <section className="py-20 bg-[#F2A900] overflow-hidden relative">
            {/* Decorative background elements */}
            <div className="absolute top-10 left-10 text-6xl opacity-10 rotate-12">⭐</div>
            <div className="absolute bottom-10 right-10 text-6xl opacity-10 -rotate-12">⭐</div>

            <div className="container mx-auto px-4 text-center relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold text-[#3E2723] mb-12 font-heading">
                    SOCIAL PROOF 🗣️
                </h2>

                <div className="relative max-w-4xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.5 }}
                            className="bg-[#FDF6E3] p-8 md:p-12 rounded-2xl shadow-xl mx-4 flex flex-col items-center gap-6 relative border-2 border-[#D91A2A] text-center"
                        >
                            <Quote className="absolute top-4 right-4 text-[#D91A2A] opacity-20" size={64} />

                            <div className="flex-shrink-0">
                                <div className="w-40 h-40 rounded-full border-4 border-[#3E2723] overflow-hidden shadow-lg p-1 bg-white mx-auto">
                                    <img
                                        src={testimonials[currentIndex].image}
                                        alt={testimonials[currentIndex].name}
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-center text-[#F2A900] mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} fill="currentColor" size={24} />
                                    ))}
                                </div>
                                <p className="text-xl md:text-2xl text-[#3E2723] italic mb-6 leading-relaxed">
                                    "{testimonials[currentIndex].text}"
                                </p>
                                <h4 className="text-xl font-bold text-[#D91A2A]">
                                    {testimonials[currentIndex].name}
                                </h4>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <button
                        onClick={prev}
                        className="absolute top-1/2 -left-4 md:-left-16 transform -translate-y-1/2 bg-[#3E2723] text-[#FDF6E3] p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={next}
                        className="absolute top-1/2 -right-4 md:-right-16 transform -translate-y-1/2 bg-[#3E2723] text-[#FDF6E3] p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                <div className="mt-12">
                    <button className="bg-[#D91A2A] text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-[#b9151e] transition-colors transform hover:-translate-y-1">
                        Ver Más Opiniones
                    </button>
                </div>
            </div>
        </section>
    );
}
