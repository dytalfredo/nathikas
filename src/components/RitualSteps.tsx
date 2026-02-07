import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import resources from '../data/resources.json';

interface Step {
    id: number;
    title: string;
    description: string;
}

const resourceMap: { [key: number]: string } = {
    1: resources.recursos.r9,
    2: resources.recursos.r8,
    3: resources.recursos.r5
};

export default function RitualSteps({ steps }: { steps: Step[] }) {
    return (
        <section className="py-40 bg-[#F2A900] relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(#3E2723 2.5px, transparent 2.5px)', backgroundSize: '40px 40px' }}></div>


            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="text-center mb-32"
                >
                    <span className="text-[#D91A2A] font-bold tracking-[0.4em] uppercase text-sm mb-4 block">Fácil de Disfrutar</span>
                    <div className="flex items-center justify-center gap-4 md:gap-8">
                        <h2 className="text-6xl md:text-8xl font-bold text-[#3E2723] font-heading drop-shadow-lg leading-tight">
                            EL RITUAL
                        </h2>
                    </div>
                    <div className="w-48 h-2 bg-[#D91A2A] mx-auto mt-8 rounded-full shadow-md"></div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-24 md:gap-16 relative">
                    {/* Connecting line for desktop - Thick and stylistic */}
                    <div className="hidden md:block absolute top-[100px] left-[15%] right-[15%] h-1.5 border-t-4 border-dashed border-[#D91A2A]/40 -z-10"></div>

                    {steps.map((step, index) => {
                        const iconSrc = resourceMap[step.id] || resourceMap[1];
                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 60 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2, duration: 0.8 }}
                                className="flex flex-col items-center text-center group"
                            >
                                <div className="relative mb-12">
                                    {/* Sunburst background effect */}
                                    <div className="absolute inset-0 bg-[#FDF6E3] rounded-full scale-150 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700" />

                                    {/* Rotating decoration */}
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-[-20px] border-2 border-dashed border-[#3E2723]/30 rounded-full group-hover:border-[#D91A2A]/50 transition-colors"
                                    />

                                    <div className="w-40 h-40 md:w-52 md:h-52 bg-[#FDF6E3] rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-4 border-[#3E2723] transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 relative z-10 overflow-hidden p-8 md:p-10">
                                        <img
                                            src={iconSrc}
                                            alt={step.title}
                                            className="w-full h-full object-contain filter drop-shadow-xl group-hover:brightness-110 transition-all"
                                        />
                                    </div>

                                    {/* Step Number Badge */}
                                    <div className="absolute -top-3 -right-3 w-14 h-14 bg-[#D91A2A] text-white rounded-full flex items-center justify-center font-bold border-4 border-white shadow-xl z-20 text-3xl font-heading transform group-hover:scale-125 transition-transform">
                                        {index + 1}
                                    </div>
                                </div>

                                <h3 className="text-4xl font-bold text-[#3E2723] mb-6 font-heading group-hover:text-white group-hover:drop-shadow-[0_2px_4px_rgba(217,26,42,0.5)] transition-all">{step.title}</h3>
                                <p className="text-[#3E2723] font-bold text-xl leading-relaxed max-w-[280px] md:max-w-none opacity-90 group-hover:opacity-100 transition-opacity">
                                    {step.description}
                                </p>

                                {/* Arrow between steps */}
                                {index < steps.length - 1 && (
                                    <>
                                        {/* Desktop Arrow */}
                                        <div className="hidden md:block absolute top-[28%] -right-[50%] transform translate-x-1/2 text-[#D91A2A] z-10 opacity-60 pointer-events-none">
                                            <ArrowRight size={48} strokeWidth={3} />
                                        </div>
                                        {/* Mobile Arrow */}
                                        <div className="md:hidden absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-[#D91A2A] z-10 rotate-90 opacity-60 pointer-events-none">
                                            <ArrowRight size={40} strokeWidth={3} />
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Decorative elements - Larger and more prominent */}

            <div className="absolute top-1/2 right-[-10%] transform -translate-y-1/2 w-96 h-96 opacity-30 pointer-events-none -rotate-12">
                <img src={resources.recursos.r2} className="w-full h-full object-contain" alt="" />
            </div>


        </section>
    );
}
