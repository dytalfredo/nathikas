import { motion } from 'framer-motion';
import resources from '../data/resources.json';

export default function ProductInfoSection() {
    const cardVariants: any = {
        hidden: { opacity: 0, y: 50 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.2,
                duration: 0.8,
                ease: "easeOut"
            }
        })
    };

    return (
        <section className="relative py-32 pb-48 px-4 overflow-hidden bg-[#2D1B18] text-[#FDF6E3]">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <svg className="w-full h-full" width="100%" height="100%">
                    <pattern id="spicy-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle cx="20" cy="20" r="2" fill="#F2A900" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#spicy-pattern)" />
                </svg>
            </div>

            <div className="container mx-auto max-w-6xl relative z-10">

                {/* Title Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="text-center mb-24"
                >
                    <div className="flex items-center justify-center gap-4 md:gap-8">
                        <motion.img
                            src={resources.particles.g3}
                            className="w-10 h-10 md:w-16 md:h-16 object-contain hidden sm:block opacity-80"
                            animate={{ rotate: [0, 15, -15, 0], y: [0, -10, 10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <h2 className="text-4xl md:text-6xl font-bold text-[#F2A900] font-heading drop-shadow-lg leading-tight uppercase relative inline-block">
                            Qué hacemos en Nathikas
                        </h2>
                        <motion.img
                            src={resources.particles.g5}
                            className="w-10 h-10 md:w-16 md:h-16 object-contain hidden sm:block opacity-80"
                            animate={{ rotate: [0, -15, 15, 0], y: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />
                    </div>
                    <div className="w-32 h-1.5 bg-[#D91A2A] mx-auto mt-6 rounded-full shadow-md"></div>
                </motion.div>


                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">

                    {/* Card 1: Gomitas Enchiladas */}
                    <motion.div
                        custom={0}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={cardVariants}
                        className="bg-[#3E2723] rounded-2xl p-8 border border-[#F2A900]/20 shadow-2xl hover:border-[#F2A900] transition-all duration-300 group hover:-translate-y-2"
                    >
                        <div className="w-full flex justify-center mb-8">
                            <div className="w-32 h-32 relative">
                                <div className="absolute inset-0 bg-[#F2A900] rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <img
                                    src={resources.recursos.r12}
                                    alt="Gomitas Enchiladas"
                                    className="w-full h-full object-contain drop-shadow-xl transform group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-[#F2A900] font-heading text-center">Gomitas Enchiladas</h3>
                        <p className="text-lg leading-relaxed text-[#FDF6E3]/90 text-center">
                            Combinan lo dulce y lo picante con una capa de chamoy, chile, Tajín y otros ingredientes secretos que intensifican su sabor. Son ideales para quienes buscan una experiencia atrevida en cada mordida.
                        </p>
                    </motion.div>

                    {/* Card 2: Gomitas Ahogadas */}
                    <motion.div
                        custom={1}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={cardVariants}
                        className="bg-[#3E2723] rounded-2xl p-8 border border-[#D91A2A]/20 shadow-2xl hover:border-[#D91A2A] transition-all duration-300 group hover:-translate-y-2"
                    >
                        <div className="w-full flex justify-center mb-8">
                            <div className="w-32 h-32 relative">
                                <div className="absolute inset-0 bg-[#D91A2A] rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <img
                                    src={resources.recursos.r13}
                                    alt="Gomitas Ahogadas"
                                    className="w-full h-full object-contain drop-shadow-xl transform group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-[#D91A2A] font-heading text-center">Gomitas Ahogadas</h3>
                        <p className="text-lg leading-relaxed text-[#FDF6E3]/90 text-center">
                            En cambio, llevan más chamoy, lo que las hace jugosas y con un equilibrio ácido-dulce. También tienen Tajín y chile, pero su gran cantidad de chamoy les da una textura única.
                        </p>
                    </motion.div>

                    {/* Card 3: El Chamoy */}
                    <motion.div
                        custom={2}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={cardVariants}
                        className="bg-[#3E2723] rounded-2xl p-8 border border-[#F2A900]/20 shadow-2xl hover:border-[#F2A900] transition-all duration-300 group hover:-translate-y-2"
                    >
                        <div className="w-full flex justify-center mb-8">
                            <div className="w-32 h-32 relative">
                                <div className="absolute inset-0 bg-[#F2A900] rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <img
                                    src={resources.recursos.r14}
                                    alt="El Chamoy"
                                    className="w-full h-full object-contain drop-shadow-xl transform group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-[#F2A900] font-heading text-center">El Chamoy</h3>
                        <p className="text-lg leading-relaxed text-[#FDF6E3]/90 text-center">
                            Es una salsa mexicana hecha con tamarindo y flor de Jamaica, con un toque ácido e intenso. Nathikas tiene una versión venezolana con un giro caribeño, creando un sabor especiado y único.
                        </p>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
