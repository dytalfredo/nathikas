import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import faqs from '../data/faqs.json';
import resources from '../data/resources.json';

export default function FAQSection() {
    // Only allow one open at a time for cleaner UI
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [showAll, setShowAll] = useState(false);

    const toggleAccordion = (index: number) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <section className="py-24 bg-[#7B1E26] text-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F2A900] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#D91A2A] rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

            <div className="container mx-auto px-4 max-w-5xl relative z-10">
                <div className="text-center mb-16">
                    <span className="block text-[#F2A900] font-bold tracking-widest uppercase mb-2">¿Tienes Dudas?</span>
                    <div className="flex items-center justify-center gap-4 md:gap-8 mb-6">
                        <motion.img
                            src={resources.recursos.r6}
                            className="w-12 h-12 md:w-20 md:h-20 object-contain hidden sm:block"
                            animate={{ rotate: [0, 15, -15, 0], y: [0, -10, 10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <h2 className="text-5xl md:text-6xl font-bold font-heading text-white drop-shadow-md">
                            PREGUNTAS FRECUENTES
                        </h2>
                        <motion.img
                            src={resources.recursos.r7}
                            className="w-12 h-12 md:w-20 md:h-20 object-contain hidden sm:block"
                            animate={{ rotate: [0, -15, 15, 0], y: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />
                    </div>
                    <div className="w-24 h-1.5 bg-[#F2A900] mx-auto rounded-full mb-8"></div>
                    <p className="text-[#FDF6E3]/80 text-lg max-w-2xl mx-auto">
                        Aquí resolvemos las inquietudes más comunes sobre nuestros productos picantes, envíos y formas de pago.
                    </p>
                </div>

                <div className="grid gap-4">
                    {faqs.slice(0, showAll ? faqs.length : 5).map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: index * 0.05 }}
                            className={`rounded-2xl overflow-hidden border transition-all duration-300 ${activeIndex === index
                                ? 'bg-black/30 border-[#F2A900] shadow-[0_0_20px_rgba(242,169,0,0.15)]'
                                : 'bg-black/20 border-white/10 hover:border-[#F2A900]/40 hover:bg-black/25'
                                }`}
                        >
                            <button
                                onClick={() => toggleAccordion(index)}
                                className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${activeIndex === index ? 'bg-[#F2A900] text-[#7B1E26]' : 'bg-white/10 text-[#F2A900] group-hover:bg-[#F2A900]/20'}`}>
                                        <HelpCircle size={18} />
                                    </div>
                                    <span className={`text-lg md:text-xl font-bold pr-4 transition-colors ${activeIndex === index ? 'text-[#F2A900]' : 'text-white'}`}>
                                        {faq.question}
                                    </span>
                                </div>

                                <motion.div
                                    animate={{ rotate: activeIndex === index ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex-shrink-0 p-1 rounded-full ${activeIndex === index ? 'bg-[#F2A900] text-[#7B1E26]' : 'text-[#F2A900]'}`}
                                >
                                    <ChevronDown className="w-6 h-6" />
                                </motion.div>
                            </button>

                            <AnimatePresence>
                                {activeIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="px-6 md:px-8 pb-8 pt-0 pl-[4.5rem] md:pl-[5rem]">
                                            <div className="h-px w-full bg-white/10 mb-4"></div>
                                            <p className="text-[#FDF6E3]/90 text-lg leading-relaxed">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {/* Show More Button */}
                {faqs.length > 5 && (
                    <div className="text-center mt-8 mb-4">
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="bg-transparent border-2 border-[#F2A900] text-[#F2A900] hover:bg-[#F2A900] hover:text-[#7B1E26] font-bold py-3 px-8 rounded-full transition-all duration-300"
                        >
                            {showAll ? 'Ver Menos Preguntas' : 'Ver Todas las Preguntas'}
                        </button>
                    </div>
                )}

                {/* Contact CTA */}
                <div className="mt-16 text-center bg-black/20 rounded-3xl p-8 border border-[#F2A900]/30 max-w-3xl mx-auto backdrop-blur-sm">
                    <MessageCircle className="mx-auto text-[#F2A900] mb-4" size={48} />
                    <h3 className="text-2xl font-bold text-white mb-2">¿No encontraste tu respuesta?</h3>
                    <p className="text-[#FDF6E3]/80 mb-6">Estamos aquí para ayudarte. Escríbenos directamente y te responderemos al instante.</p>
                    <a
                        href="https://wa.me/584241234567" // Placeholder number
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        Chatear por WhatsApp
                    </a>
                </div>
            </div>
        </section>
    );
}
