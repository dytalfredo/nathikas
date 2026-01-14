import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Music } from 'lucide-react';

export default function LoadingScreen() {
    const [isVisible, setIsVisible] = useState(true);
    const [progress, setProgress] = useState(0);

    const handleEnter = () => {
        sessionStorage.setItem('hasSeenLoadingScreen', 'true');
        document.documentElement.classList.remove('app-loading');

        // Remove static loader if it exists
        const staticLoader = document.getElementById('static-loader');
        if (staticLoader) {
            staticLoader.style.opacity = '0';
            setTimeout(() => staticLoader.remove(), 500);
        }

        // Dispatch event for other components to know loading is done
        window.dispatchEvent(new CustomEvent('loading-completed'));

        setIsVisible(false);
    };

    useEffect(() => {
        // Check if seen on client mount
        const hasSeen = sessionStorage.getItem('hasSeenLoadingScreen');
        if (hasSeen) {
            document.documentElement.classList.remove('app-loading');
            // Remove static loader immediately if already seen
            const staticLoader = document.getElementById('static-loader');
            if (staticLoader) staticLoader.remove();

            setIsVisible(false);
            return;
        } else {
            // If we are showing the loader, we can hide the static one now that React has hydrated 
            // BUT only if we want the React one to take over. 
            // Actually, the static one looks identical (mostly), so we can just let React overlay it.
            // OR better: remove static loader as soon as React mounts to let React handle animations?
            // No, that might cause a flicker. Best is to keep static loader until we are sure React is rendered.
            // Since this component uses AnimatePresence and is visible, it will cover the static loader.
            // We can safely remove the static loader now to avoid duplicate DOM elements, 
            // but let's do it gently or just wait until exit.

            // Strategy: Let static loader stay until User clicks Enter, OR remove/hide it now if React is perfectly aligned.
            // Safest: Hide static loader immediately upon mount to prevent double-rendering artifacts if alignment is off.
            const staticLoader = document.getElementById('static-loader');
            if (staticLoader) staticLoader.style.display = 'none';
        }

        if (isVisible) {
            document.body.style.overflow = 'hidden';

            // Simulate loading progress
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 1;
                });
            }, 50); // 5 seconds total

            return () => {
                clearInterval(interval);
                document.body.style.overflow = 'auto';
            };
        }
    }, [isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -20, transition: { duration: 0.8, ease: "easeInOut" } }}
                    className="fixed inset-0 z-[9999] bg-[#FDF6E3] flex flex-col items-center justify-center p-4 overflow-hidden gap-8"
                    suppressHydrationWarning
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("/recursos/papel-picado-bottom.webp")', backgroundSize: 'cover' }}></div>

                    {/* Animated Sprite - Reserved space for scaled item */}
                    <div className="w-64 h-64 flex items-center justify-center flex-none relative">
                        <div
                            className="w-16 h-16 animate-sprite"
                            style={{
                                backgroundImage: "url('/images/animacion-login-sprite.webp')",
                                backgroundSize: "512px 64px",
                                backgroundRepeat: "no-repeat",
                                animationDuration: "5s",
                                transform: "scale(4)",
                            }}
                        ></div>
                    </div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-3xl md:text-5xl font-heading text-[#D91A2A] text-center drop-shadow-md z-10"
                    >
                        Gomitas Enchiladas
                    </motion.h1>

                    {/* Loading Bar */}
                    <div className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden border-2 border-[#D91A2A]/20 flex-none z-10">
                        <motion.div
                            className="h-full bg-[#F2A900]"
                            style={{ width: `${progress}%` }}
                            transition={{ ease: "linear" }}
                        />
                    </div>

                    {/* Enter Button - Only shows when loading is done */}
                    <div className="h-16 flex items-center justify-center z-10">
                        <AnimatePresence>
                            {progress === 100 && (
                                <motion.button
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleEnter}
                                    className="bg-[#D91A2A] text-white text-xl font-bold py-3 px-10 rounded-full shadow-[0_4px_15px_rgba(217,26,42,0.4)] hover:bg-[#b9151e] transition-colors uppercase tracking-wide"
                                >
                                    Ingresar
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-6 z-10">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-[#D91A2A] hover:text-[#F2A900] transition-colors p-3 bg-white/60 rounded-full shadow-sm hover:scale-110 transform duration-200" aria-label="Síguenos en Instagram">
                            <Instagram size={28} />
                        </a>
                        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-[#D91A2A] hover:text-[#F2A900] transition-colors p-3 bg-white/60 rounded-full shadow-sm hover:scale-110 transform duration-200" aria-label="Síguenos en TikTok">
                            <Music size={28} />
                        </a>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
