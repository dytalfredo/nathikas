import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface Benefit {
    id: number;
    title: string;
    description: string;
    icon: string;
}

interface Props {
    benefits: Benefit[];
}

export default function BenefitsSection({ benefits }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    return (
        <section ref={containerRef} className="relative h-[300vh] bg-[#3E2723]">
            <div
                className="sticky top-0 h-screen flex items-center justify-center overflow-hidden bg-cover bg-center"
                style={{ backgroundImage: "url('/images/fondo1.png')" }}
            >
                {/* Dark Overlay for contrast */}
                <div className="absolute inset-0 bg-black/70 z-0" />

                {/* Dynamic Background Circles */}
                <motion.div
                    className="absolute inset-0 opacity-20"
                    style={{ background: 'radial-gradient(circle at 50% 50%, #D91A2A 0%, transparent 70%)' }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="relative z-10 w-full max-w-6xl px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

                    {/* Visual Side (Left) - Rotates/Changes based on Scroll */}
                    <div className="flex justify-center">
                        <div className="relative w-64 h-64 md:w-96 md:h-96 bg-[#FDF6E3] rounded-full border-8 border-[#F2A900] flex items-center justify-center shadow-[0_0_50px_rgba(242,169,0,0.5)]">
                            {benefits.map((benefit, index) => {
                                // Calculate opacity based on scroll range for each item
                                const rangeStart = index / benefits.length;
                                const rangeEnd = (index + 1) / benefits.length;
                                const opacity = useTransform(scrollYProgress,
                                    [rangeStart, rangeStart + 0.1, rangeEnd - 0.1, rangeEnd],
                                    [0, 1, 1, 0]
                                );
                                const scale = useTransform(scrollYProgress,
                                    [rangeStart, rangeStart + 0.1, rangeEnd - 0.1, rangeEnd],
                                    [0.5, 1, 1, 0.5]
                                );

                                return (
                                    <motion.div
                                        key={benefit.id}
                                        style={{ opacity, scale }}
                                        className="absolute text-9xl md:text-[10rem]"
                                    >
                                        {benefit.icon}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Text Side (Right) */}
                    <div className="text-center md:text-left text-[#FDF6E3]">
                        <h2 className="text-4xl md:text-6xl font-bold font-heading mb-12 text-[#F2A900]">
                            ¿POR QUÉ NATHIKAS?
                        </h2>
                        <div className="relative h-48">
                            {benefits.map((benefit, index) => {
                                const rangeStart = index / benefits.length;
                                const rangeEnd = (index + 1) / benefits.length;
                                const opacity = useTransform(scrollYProgress,
                                    [rangeStart, rangeStart + 0.1, rangeEnd - 0.1, rangeEnd],
                                    [0, 1, 1, 0]
                                );
                                const y = useTransform(scrollYProgress,
                                    [rangeStart, rangeStart + 0.1, rangeEnd - 0.1, rangeEnd],
                                    [50, 0, 0, -50]
                                );

                                return (
                                    <motion.div
                                        key={benefit.id}
                                        style={{ opacity, y }}
                                        className="absolute top-0 left-0 w-full"
                                    >
                                        <h3 className="text-3xl md:text-5xl font-bold mb-4 font-heading text-[#D91A2A] drop-shadow-md">
                                            {benefit.title}
                                        </h3>
                                        <p className="text-xl md:text-2xl leading-relaxed">
                                            {benefit.description}
                                        </p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator at bottom of first view */}
            <motion.div
                style={{ opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0]) }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[#FDF6E3] text-center"
            >
                <p className="mb-2 font-bold">Descubre Más</p>
                <div className="w-6 h-10 border-2 border-[#F2A900] rounded-full mx-auto flex justify-center pt-2">
                    <div className="w-1 h-2 bg-[#F2A900] rounded-full animate-bounce" />
                </div>
            </motion.div>
        </section>
    );
}
