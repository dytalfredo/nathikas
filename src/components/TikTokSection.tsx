import { motion } from 'framer-motion';
import resources from '../data/resources.json';

const LOCAL_VIDEOS = [
    resources.videos.tiktok1,
    resources.videos.tiktok2
];

export default function TikTokSection() {
    return (
        <section className="relative py-24 bg-[#F2A900] overflow-visible -mt-32 md:-mt-48 z-30">
            {/* SVG Wave Separator - Same as Testimonials */}
            <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] transform -translate-y-[99%] z-20">
                <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[60px] md:h-[120px] rotate-180">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#F2A900"></path>
                </svg>
            </div>

            {/* Decorative background elements */}
            <div className="absolute top-10 left-10 text-6xl opacity-10 rotate-12">📱</div>
            <div className="absolute bottom-10 right-10 text-6xl opacity-10 -rotate-12">🎵</div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #3E2723 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

            <div className="container mx-auto px-4 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <span className="text-[#3E2723] font-bold tracking-widest uppercase text-sm mb-2 block">Nuestra Comunidad</span>
                    <div className="flex items-center justify-center gap-4 md:gap-8">
                        <motion.img
                            src={resources.recursos.r11}
                            className="w-12 h-12 md:w-20 md:h-20 object-contain hidden sm:block"
                            animate={{ rotate: [0, 15, -15, 0], y: [0, -10, 10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <h2 className="text-4xl md:text-6xl font-bold text-[#3E2723] font-heading drop-shadow-sm">
                            NOSOTROS EN TIKTOK
                        </h2>
                        <motion.img
                            src={resources.recursos.r10}
                            className="w-12 h-12 md:w-20 md:h-20 object-contain hidden sm:block"
                            animate={{ rotate: [0, -15, 15, 0], y: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                    {LOCAL_VIDEOS.map((videoSrc, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className="bg-black/5 rounded-[2.5rem] p-4 border border-white/20 shadow-xl"
                        >
                            <div className="relative w-full aspect-[9/16] rounded-[2rem] overflow-hidden bg-black shadow-inner">
                                <video
                                    src={videoSrc}
                                    className="w-full h-full object-cover"
                                    controls
                                    autoPlay
                                    muted
                                    playsInline
                                    loop
                                    poster={resources.logo} // Optional: use logo as placeholder/poster
                                >
                                    Tu navegador no soporta el elemento de video.
                                </video>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
