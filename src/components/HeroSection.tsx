import { useState, useEffect, memo } from 'react';
import { ArrowRight, Menu, X, User as UserIcon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GummyRain from './GummyRain';
import { useAuthStore } from '../store/authStore';
import { loginWithGoogle, logout } from '../lib/auth-service';
import resources from '../data/resources.json';

const HeroSection = memo(function HeroSection({ scrollToStore }: { scrollToStore: () => void }) {
    const user = useAuthStore((state) => state.user);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async () => {
        if (user && !user.isAnonymous) {
            // If already logged in, maybe show a logout option or go to store
            window.location.href = '/shop';
            return;
        }
        setIsLoggingIn(true);
        try {
            await loginWithGoogle();
        } catch (error) {
            console.error("Login failed:", error);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const [bgImage, setBgImage] = useState(resources.backgrounds.heroDesktop);

    useEffect(() => {
        const updateBg = () => {
            setBgImage(window.innerWidth < 768 ? resources.backgrounds.heroMobile : resources.backgrounds.heroDesktop);
        };
        updateBg(); // Initial check
        window.addEventListener('resize', updateBg);
        return () => window.removeEventListener('resize', updateBg);
    }, []);

    return (
        <section
            className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-cover bg-center"
            style={{
                backgroundImage: `url('${bgImage}')`
            }}
        >
            {/* Gummy Rain Particles (Layered) */}
            <GummyRain id="tsparticles-back" zIndex="z-0" count={10} />
            <GummyRain id="tsparticles-mid" zIndex="z-10" count={10} />

            {/* Background Decorations */}


            {/* Navbar */}
            <nav className="absolute top-0 left-0 w-full px-4 md:px-8 py-4 md:py-6 z-50 flex justify-between items-center bg-gradient-to-b from-black/40 to-transparent">
                <motion.div
                    className="flex items-center gap-2 cursor-pointer"
                    initial="initial"
                    whileHover="hover"
                >
                    <img src={resources.logo} alt="Nathikas Logo" className="h-12 md:h-16 w-auto drop-shadow-md z-10" />
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
                <div className="hidden md:flex gap-4 items-center">
                    <button
                        onClick={handleLogin}
                        disabled={isLoggingIn}
                        className="relative group overflow-hidden bg-[#D91A2A] text-white px-8 py-2.5 rounded-full font-bold shadow-xl hover:shadow-[0_0_25px_rgba(217,26,42,0.5)] transition-all ring-2 ring-white/50 flex items-center gap-2 active:scale-95 disabled:opacity-70"
                    >
                        {user && !user.isAnonymous ? (
                            <>
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                    <UserIcon size={14} />
                                </div>
                                <span className="relative z-10 truncate max-w-[120px]">
                                    {user.name || 'Mi Cuenta'}
                                </span>
                            </>
                        ) : (
                            <>
                                <img src={resources.ui.userPlaceholder} alt="" className="w-5 h-5 object-contain filter brightness-0 invert" />
                                <span className="relative z-10">{isLoggingIn ? '...' : 'Entrar'}</span>
                            </>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </button>

                    {user && !user.isAnonymous && (
                        <button
                            onClick={() => logout()}
                            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={20} />
                        </button>
                    )}

                    <a href="/shop" className="bg-[#007A33] text-white px-8 py-2.5 rounded-full font-bold shadow-lg hover:bg-[#006028] transition-all ring-2 ring-white/50 block active:scale-95">
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
                            className="absolute top-20 left-4 right-4 bg-[#FDF6E3] rounded-3xl shadow-2xl p-8 flex flex-col gap-4 border-4 border-[#F2A900] md:hidden"
                        >
                            <button
                                onClick={() => {
                                    handleLogin();
                                    setIsMenuOpen(false);
                                }}
                                className="w-full bg-[#D91A2A] text-white px-6 py-4 rounded-2xl font-bold text-2xl shadow-xl flex items-center justify-center gap-4 active:scale-95"
                            >
                                {user && !user.isAnonymous ? (
                                    <>
                                        <UserIcon size={24} />
                                        <span>{user.name || 'Mi Perfil'}</span>
                                    </>
                                ) : (
                                    <>
                                        <img src="/recursos/recurso5.png" alt="" className="w-8 h-8 object-contain filter brightness-0 invert" />
                                        <span>Entrar</span>
                                    </>
                                )}
                            </button>

                            {user && !user.isAnonymous && (
                                <button
                                    onClick={() => logout()}
                                    className="w-full bg-gray-200 text-gray-700 px-6 py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-4"
                                >
                                    <LogOut size={24} />
                                    Cerrar Sesión
                                </button>
                            )}

                            <a
                                href="/shop"
                                className="w-full text-center bg-[#007A33] text-white px-6 py-4 rounded-2xl font-bold text-2xl shadow-xl block active:scale-95"
                            >
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



                {/* CTA Button Group - Character + Text */}
                <div className="flex flex-col items-center justify-center relative z-50 mb-8">
                    {/* Character sitting on button */}
                    {/* Button */}
                    <motion.a
                        href="/shop"
                        initial={{ scale: 0 }}
                        animate={{
                            scale: [1, 1.05, 1],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-[#F2A900] text-white px-8 py-3 md:px-12 md:py-5 rounded-full text-2xl md:text-4xl font-bold font-heading tracking-widest shadow-[0_0_20px_rgba(242,169,0,0.6)] border-4 border-white hover:bg-[#ffb700] transition-colors relative flex items-center gap-4"
                    >
                        QUIERO MIS GOMITAS
                        <img
                            src="/recursos/recurso10.png"
                            alt="Mascota"
                            className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-md"
                        />
                    </motion.a>
                </div>



            </div>

            {/* Bottom Wave Decoration */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-30">
                <svg className="relative block w-full h-[120px] text-[#F2A900]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" preserveAspectRatio="none">
                    <defs>
                        <pattern id="wave-dot-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <circle cx="20" cy="20" r="2.5" fill="#3E2723" fillOpacity="0.15" />
                        </pattern>
                    </defs>
                    <path d="M0,120L0,64C144,40,288,100,432,60C576,20,720,100,864,40C1008,0,1152,80,1296,40C1368,20,1440,60,1440,120L1440,120Z" className="fill-current"></path>
                    <path d="M0,120L0,64C144,40,288,100,432,60C576,20,720,100,864,40C1008,0,1152,80,1296,40C1368,20,1440,60,1440,120L1440,120Z" fill="url(#wave-dot-pattern)"></path>
                </svg>
            </div>
        </section>
    );
});

export default HeroSection;
