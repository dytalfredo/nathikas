import { MousePointerClick, Edit3, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap: { [key: string]: any } = {
    MousePointerClick,
    Edit3,
    PartyPopper
};

interface Step {
    id: number;
    title: string;
    description: string;
    icon: string;
}

export default function RitualSteps({ steps }: { steps: Step[] }) {
    return (
        <section className="py-20 bg-[#F2A900] relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#3E2723 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-5xl font-bold text-center text-[#3E2723] mb-16 font-heading"
                >
                    EL RITUAL 🕯️
                </motion.h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connecting line for desktop */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-1 bg-[#D91A2A] -z-10 border-t-2 border-dashed border-[#3E2723]"></div>

                    {steps.map((step, index) => {
                        const Icon = iconMap[step.icon];
                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                                className="flex flex-col items-center text-center"
                            >
                                <div className="w-24 h-24 bg-[#FDF6E3] rounded-full flex items-center justify-center mb-6 shadow-lg border-4 border-[#3E2723] transform hover:scale-110 transition-transform duration-300">
                                    {Icon && <Icon size={40} className="text-[#D91A2A]" />}
                                </div>
                                <h3 className="text-2xl font-bold text-[#3E2723] mb-2 font-heading">{step.title}</h3>
                                <p className="text-[#3E2723] font-semibold max-w-xs">{step.description}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
