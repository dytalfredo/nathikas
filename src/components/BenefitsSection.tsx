import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, Heart, Zap, Star } from 'lucide-react';

export default function BenefitsSection() {
    const containerRef = useRef<HTMLDivElement>(null);

    // Floating animation variants
    const floatingVariant = {
        animate: {
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <section ref={containerRef} className="relative h-screen overflow-hidden bg-[#3E2723]">
            {/* Video Background */}
            <div className="absolute inset-0 z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-80"
                >
                    {/* Placeholder: User needs to add a video file here */}
                    <source src="/videos/chamoybol.mp4" type="video/mp4" />
                    {/* Fallback image if video fails/missing */}
                    <img src="/images/recursos/recurso1.png" alt="Background" className="w-full h-full object-cover" />
                </video>
                {/* Lighter overlay since there is no text to read */}
                <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Floating SVGs / Particles */}
            <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                <motion.div
                    variants={floatingVariant}
                    animate="animate"
                    className="absolute top-[20%] left-[10%] text-[#F2A900] opacity-60"
                >
                    <Sparkles size={64} />
                </motion.div>
                <motion.div
                    variants={floatingVariant}
                    animate="animate"
                    transition={{ delay: 1 }}
                    className="absolute bottom-[30%] right-[15%] text-[#D91A2A] opacity-60"
                >
                    <Heart size={80} />
                </motion.div>
                <motion.div
                    variants={floatingVariant}
                    animate="animate"
                    transition={{ delay: 2 }}
                    className="absolute top-[40%] right-[25%] text-[#FDF6E3] opacity-50"
                >
                    <Zap size={56} />
                </motion.div>
                <motion.div
                    variants={floatingVariant}
                    animate="animate"
                    transition={{ delay: 0.5 }}
                    className="absolute bottom-[20%] left-[20%] text-[#F2A900] opacity-50"
                >
                    <Star size={72} />
                </motion.div>
            </div>
        </section>
    );
}
