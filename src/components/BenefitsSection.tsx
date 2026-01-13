import { useRef } from 'react';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import resources from '../data/resources.json';

export default function BenefitsSection() {
    const containerRef = useRef<HTMLDivElement>(null);

    // Floating animation variants with specific tweaks for each item
    const float1: Variants = {
        animate: {
            y: [0, -30, 0],
            x: [0, 10, 0],
            rotate: [0, 10, -5, 0],
            transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }
    };

    const float2: Variants = {
        animate: {
            y: [0, 40, 0], // Moves down instead of up
            rotate: [0, -10, 5, 0],
            scale: [1, 1.1, 1],
            transition: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }
        }
    };

    const float3: Variants = {
        animate: {
            y: [0, -20, 0],
            x: [0, -15, 0],
            rotate: [0, 15, 0],
            transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }
        }
    };

    const float4: Variants = {
        animate: {
            y: [0, 25, 0],
            rotate: [0, -5, -15, 0],
            transition: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
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
                    <source src={resources.videos.chamoybol} type="video/mp4" />
                    {/* Fallback image if video fails/missing */}
                    <img src={resources.recursos.r1} alt="Background" className="w-full h-full object-cover" />
                </video>
                {/* Lighter overlay since there is no text to read */}
                <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Top Wave Decoration (Flipped) from HeroSection - Ritual Pattern */}
            <div className="absolute top-0 left-0 w-full overflow-hidden leading-none z-30 rotate-180">
                <svg className="relative block w-full h-[120px] text-[#F2A900]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" preserveAspectRatio="none">
                    <defs>
                        <pattern id="wave-dot-pattern-benefits" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <circle cx="20" cy="20" r="2.5" fill="#3E2723" fillOpacity="0.15" />
                        </pattern>
                    </defs>
                    <path d="M0,120L0,64C144,40,288,100,432,60C576,20,720,100,864,40C1008,0,1152,80,1296,40C1368,20,1440,60,1440,120L1440,120Z" className="fill-current"></path>
                    <path d="M0,120L0,64C144,40,288,100,432,60C576,20,720,100,864,40C1008,0,1152,80,1296,40C1368,20,1440,60,1440,120L1440,120Z" fill="url(#wave-dot-pattern-benefits)"></path>
                </svg>
            </div>

            {/* Floating Images / Particles - Dispersed and Transparent */}
            <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                <motion.img
                    src={resources.recursos.r10}
                    variants={float1}
                    animate="animate"
                    className="absolute top-[10%] left-[5%] w-24 h-24 object-contain opacity-40 blur-[1px]"
                />
                <motion.img
                    src={resources.recursos.r11}
                    variants={float2}
                    animate="animate"
                    className="absolute bottom-[15%] right-[5%] w-32 h-32 object-contain opacity-30 blur-[1px]"
                />
                <motion.img
                    src={resources.recursos.r12}
                    variants={float3}
                    animate="animate"
                    className="absolute top-[20%] right-[10%] w-24 h-24 object-contain opacity-35"
                />
                <motion.img
                    src={resources.recursos.r13}
                    variants={float4}
                    animate="animate"
                    className="absolute bottom-[20%] left-[15%] w-28 h-28 object-contain opacity-25 blur-[1px]"
                />
                {/* Adding a couple more for better dispersion per request "dispersen mas" */}
                <motion.img
                    src={resources.recursos.r12}
                    variants={float2}
                    animate="animate"
                    className="absolute top-[50%] left-[45%] w-16 h-16 object-contain opacity-20"
                />
                <motion.img
                    src={resources.recursos.r10}
                    variants={float4}
                    animate="animate"
                    className="absolute top-[15%] left-[50%] w-20 h-20 object-contain opacity-25"
                />
            </div>
        </section>
    );
}
