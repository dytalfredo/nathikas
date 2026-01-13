import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);

    useEffect(() => {
        // Check if iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIosDevice);

        // Check if already in standalone mode
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        if (isIosDevice && !isStandalone) {
            // Logic to show IOS prompt could go here, maybe once per session
            const hasSeenPrompt = sessionStorage.getItem('iosPwaPromptSeen');
            if (!hasSeenPrompt) {
                setShowIOSPrompt(true);
            }
        }

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const closeIOSPrompt = () => {
        setShowIOSPrompt(false);
        sessionStorage.setItem('iosPwaPromptSeen', 'true');
    }

    return (
        <AnimatePresence>
            {/* Android / Desktop Install Button */}
            {deferredPrompt && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    onClick={handleInstallClick}
                    className="fixed bottom-4 left-4 z-50 bg-[#D91A2A] text-white px-4 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 hover:bg-[#B71524] transition-all border-2 border-white"
                >
                    <Download size={20} />
                    <span>Instalar App</span>
                </motion.button>
            )}

            {/* iOS Instructions Prompt */}
            {showIOSPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t-4 border-[#F2A900] shadow-2xl rounded-t-3xl"
                >
                    <div className="max-w-md mx-auto relative">
                        <button
                            onClick={closeIOSPrompt}
                            className="absolute -top-2 -right-2 bg-gray-100 rounded-full p-1 text-gray-400"
                        >
                            ✕
                        </button>
                        <h3 className="font-bold text-[#D91A2A] text-lg mb-2">¡Instala Nathikas!</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Para una mejor experiencia, agrega nuestra app a tu inicio.
                        </p>
                        <div className="flex items-center gap-4 text-sm font-bold text-[#3E2723]">
                            <div className="flex flex-col items-center gap-1">
                                <span>1. Toca</span>
                                <img src="/images/ios-share.svg" alt="Share" className="w-6 h-6" />
                            </div>
                            <span>→</span>
                            <div className="flex flex-col items-center gap-1">
                                <span>2. Selecciona</span>
                                <span>"Agregar a Inicio"</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
