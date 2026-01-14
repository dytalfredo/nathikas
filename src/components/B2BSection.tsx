import { motion } from 'framer-motion';
import { Users, Award, TrendingUp, ArrowRight } from 'lucide-react';
import resources from '../data/resources.json';

export default function B2BSection() {
    return (
        <section className="py-24 bg-[#3E2723] text-[#FDF6E3] relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(${resources.backgrounds.blackScales})` }}></div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="text-[#F2A900] font-bold tracking-widest uppercase text-sm mb-4 block">Alianzas Comerciales</span>
                    <h2 className="text-4xl md:text-5xl font-bold font-heading mb-4 leading-tight">
                        Impulsa tu Negocio con <span className="text-[#D91A2A]">Nathikas</span>
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg opacity-90">
                        Únete a la revolución del sabor. Buscamos aliados estratégicos: mercados, farmacias y tiendas exclusivas.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

                    {/* Benefit 1: Influencer Power */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#2D1B18] p-8 rounded-2xl border border-[#F2A900]/20 hover:border-[#F2A900] transition-colors group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users size={100} />
                        </div>
                        <div className="w-14 h-14 bg-[#F2A900]/10 rounded-lg flex items-center justify-center mb-6 text-[#F2A900] group-hover:scale-110 transition-transform">
                            <Users size={32} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-white">Tráfico Viral (+100k)</h3>
                        <p className="text-[#FDF6E3]/80 leading-relaxed">
                            Nuestra fundadora es una influencer con <strong>más de 100,000 seguidores</strong> en TikTok. Convertimos su audiencia en tus clientes, dirigiendo tráfico real y apasionado directamente a tu puerta.
                        </p>
                    </motion.div>

                    {/* Benefit 2: Quality */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#2D1B18] p-8 rounded-2xl border border-[#D91A2A]/20 hover:border-[#D91A2A] transition-colors group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Award size={100} />
                        </div>
                        <div className="w-14 h-14 bg-[#D91A2A]/10 rounded-lg flex items-center justify-center mb-6 text-[#D91A2A] group-hover:scale-110 transition-transform">
                            <Award size={32} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-white">Las Mejores de Venezuela</h3>
                        <p className="text-[#FDF6E3]/80 leading-relaxed">
                            No vendemos simples golosinas, ofrecemos <strong>las mejores gomitas mexicanas</strong> del país. Un producto premium con sabor auténtico y adictivo que no tiene competencia en el mercado local.
                        </p>
                    </motion.div>

                    {/* Benefit 3: Business Growth */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="bg-[#2D1B18] p-8 rounded-2xl border border-[#F2A900]/20 hover:border-[#F2A900] transition-colors group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp size={100} />
                        </div>
                        <div className="w-14 h-14 bg-[#F2A900]/10 rounded-lg flex items-center justify-center mb-6 text-[#F2A900] group-hover:scale-110 transition-transform">
                            <TrendingUp size={32} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-white">Alta Rotación</h3>
                        <p className="text-[#FDF6E3]/80 leading-relaxed">
                            Un producto tendencia que se vende solo. Atrae a un público joven y curioso dispuesto a pagar por calidad. Garantizamos <strong>márgenes atractivos</strong> y una rotación constante de inventario.
                        </p>
                    </motion.div>

                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="text-center mt-16"
                >
                    <a
                        href="https://wa.me/584128919386?text=Hola,%20me%20interesa%20ser%20distribuidor%20de%20Nathikas"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#F2A900] text-[#3E2723] font-bold py-4 px-8 rounded-full hover:bg-white hover:text-[#D91A2A] transition-all transform hover:scale-105 shadow-xl"
                    >
                        ¡Quiero ser Distribuidor!
                        <ArrowRight size={20} />
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
