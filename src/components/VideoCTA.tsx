import { motion } from 'framer-motion';
import { ArrowRight, Flame } from 'lucide-react';
import resources from '../data/resources.json';

interface Props {
    title: string;
    videoUrl: string;
    onCtaClick: () => void;
}

export default function VideoCTA({ title, videoUrl, onCtaClick }: Props) {
    return (
        <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-black">
            {/* Video Background */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-60"
            >
                <source src={videoUrl} type="video/mp4" />
                {/* Fallback image if video fails or not provided */}
                <img src={resources.placeholders.ref1} alt="Spicy Background" className="w-full h-full object-cover" />
            </video>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>

            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    className="backdrop-blur-sm bg-white/10 p-8 md:p-12 rounded-3xl border border-white/20 shadow-2xl"
                >
                    <div className="flex justify-center mb-6">
                        <div className="bg-[#D91A2A] p-4 rounded-full animate-pulse">
                            <Flame size={48} className="text-[#F2A900]" />
                        </div>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 font-heading uppercase tracking-widest drop-shadow-lg">
                        {title}
                    </h2>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onCtaClick}
                        className="bg-[#F2A900] text-[#3E2723] text-xl md:text-3xl font-black py-4 px-12 rounded-full shadow-[0_0_30px_rgba(242,169,0,0.6)] hover:shadow-[0_0_50px_rgba(242,169,0,0.8)] transition-all flex items-center gap-4 mx-auto border-4 border-white"
                    >
                        ¡COMPRA TUS GOMITAS YA!
                        <ArrowRight size={32} />
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
}
