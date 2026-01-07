import { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GummyRain from './GummyRain';

export default function HeroSection({ scrollToStore }: { scrollToStore: () => void }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (
        <section
            className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[url('/images/fondo1m.png')] md:bg-[url('/images/fondo1.png')] bg-cover bg-center"
        >
            {/* Gummy Rain Particles (Layered) */}
            <GummyRain id="tsparticles-back" zIndex="z-0" count={10} />
            <GummyRain id="tsparticles-front" zIndex="z-[60]" count={10} />

            {/* Background Decorations */}


            {/* Navbar */}
            <nav className="absolute top-0 left-0 w-full px-4 md:px-8 py-4 md:py-6 z-50 flex justify-between items-center bg-gradient-to-b from-black/40 to-transparent">
                <motion.div
                    className="flex items-center gap-2 cursor-pointer"
                    initial="initial"
                    whileHover="hover"
                >
                    <img src="/images/logo.png" alt="Nathikas Logo" className="h-12 md:h-16 w-auto drop-shadow-md z-10" />
                    <motion.div
                        variants={{
                            initial: { opacity: 0, x: -20, width: 0 },
                            hover: { opacity: 1, x: 0, width: "auto" }
                        }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <span className="text-3xl md:text-5xl font-bold text-[#D91A2A] font-heading drop-shadow-md whitespace-nowrap pr-2">
                            Nathikas
                        </span>
                    </motion.div>
                </motion.div>

                {/* Desktop Menu */}
                <div className="hidden md:flex gap-4">
                    <button className="bg-[#D91A2A] text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-[#b9151e] transition-colors ring-2 ring-white/50">
                        Usuario
                    </button>
                    <a href="/shop" className="bg-[#007A33] text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-[#006028] transition-colors ring-2 ring-white/50 block">
                        Comprar
                    </a>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-[#FDF6E3] p-2 bg-black/20 rounded-full backdrop-blur-sm"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
                </button>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-20 left-4 right-4 bg-[#FDF6E3] rounded-2xl shadow-2xl p-6 flex flex-col gap-4 border-4 border-[#F2A900] md:hidden"
                        >
                            <button className="w-full bg-[#D91A2A] text-white px-6 py-3 rounded-xl font-bold text-xl shadow-md">
                                Usuario
                            </button>
                            <a href="/shop" className="w-full text-center bg-[#007A33] text-white px-6 py-3 rounded-xl font-bold text-xl shadow-md block">
                                Comprar
                            </a>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>



            {/* Center Decoration Image (Layered between background and foreground) */}
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10 w-80 md:w-[500px]"
            >
                <picture>
                    <source media="(max-width: 767px)" srcSet="/recursos/recurso2m.png" />
                    <img src="/recursos/recurso2.png" alt="Decoración Mexicana" className="w-full h-auto" />
                </picture>
            </motion.div>

            <div className="container mx-auto px-4 z-20 text-center relative mb-48">

                {/* Papel Picado Top Border */}
                <div className="absolute -top-32 left-0 right-0 h-16 flex justify-center space-x-4 opacity-80">
                    {/* Placeholder for actual papel picado image/css if needed */}
                </div>



                {/* CTA Button */}
                <motion.a
                    href="/shop"
                    initial={{ scale: 0 }}
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, -3, 3, -3, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: "easeInOut",
                        times: [0, 0.2, 0.5, 0.6, 0.7, 1]
                    }}
                    whileHover={{ scale: 1.15, rotate: 0 }}
                    whileTap={{ scale: 0.95 }}
                    className="mb-8 bg-[#F2A900] text-[#3E2723] px-6 py-3 md:px-10 md:py-4 rounded-full text-xl md:text-3xl font-bold font-heading shadow-[0_0_20px_rgba(242,169,0,0.6)] border-4 border-white hover:bg-[#ffb700] transition-colors z-50 relative pointer-events-auto inline-block text-center"
                >
                    QUIERO MIS GOMITAS 🍬
                </motion.a>



            </div>

            {/* Bottom Wave Decoration */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-30 translate-y-10">
                <svg className="relative block w-full h-[100px] text-[#F2A900]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" className="fill-current"></path>
                </svg>
            </div>
        </section>
    );
}
