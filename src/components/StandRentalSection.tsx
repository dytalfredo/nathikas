import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Sparkles, Check, ArrowRight, ArrowLeft, BookOpen, Star, Ruler, X } from 'lucide-react';
import appConfig from '../data/app-config.json';

// Las 13 imágenes webp del carrusel original para la revista
const MAGAZINE_IMAGES = [
    "/nuevas/IMG_3179.webp",
    "/nuevas/IMG_3180.webp",
    "/nuevas/IMG_3181.webp",
    "/nuevas/IMG_3182.webp",
    "/nuevas/IMG_3184.webp",
    "/nuevas/IMG_3185.webp",
    "/nuevas/IMG_3551.webp",
    "/nuevas/IMG_4029 (1).webp",
    "/nuevas/IMG_4031.webp",
    "/nuevas/IMG_4034.webp",
    "/nuevas/IMG_4035.webp",
    "/nuevas/IMG_4036.webp",
    "/nuevas/IMG_4037.webp"
];

// Las 6 imágenes jpeg del stand para ver en grande
const STAND_DETAILS_IMAGES = [
    "/nuevas/foton1.jpeg",
    "/nuevas/foton2.jpeg",
    "/nuevas/foton3.jpeg",
    "/nuevas/foton4.jpeg",
    "/nuevas/foton5.jpeg",
    "/nuevas/foton6.jpeg"
];

export default function StandRentalSection() {
    const [page, setPage] = useState(0);
    const [isFlipping, setIsFlipping] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const nextPage = () => {
        if (isFlipping || page >= MAGAZINE_IMAGES.length - 1) return;
        setIsFlipping(true);
        setPage((prev) => prev + 1);
        setTimeout(() => setIsFlipping(false), 600); // Espera a que termine la transición
    };

    const prevPage = () => {
        if (isFlipping || page <= 0) return;
        setIsFlipping(true);
        setPage((prev) => prev - 1);
        setTimeout(() => setIsFlipping(false), 600);
    };

    // Navegación del Lightbox
    const nextLightbox = () => {
        if (lightboxIndex === null) return;
        setLightboxIndex((prev) => (prev! + 1) % STAND_DETAILS_IMAGES.length);
    };

    const prevLightbox = () => {
        if (lightboxIndex === null) return;
        setLightboxIndex((prev) => (prev! - 1 + STAND_DETAILS_IMAGES.length) % STAND_DETAILS_IMAGES.length);
    };

    // Mensaje estructurado de WhatsApp
    const whatsappBaseUrl = `https://wa.me/${appConfig.contact.whatsapp.replace(/\D/g, '')}`;
    const getWhatsAppUrl = (option: string) => {
        const text = encodeURIComponent(
            `Hola, me interesa contratar el Stand de Nathikas para un evento.\n\n` +
            `Opción de interés: ${option}\n\n` +
            `Por favor, envíenme más información sobre disponibilidad y costos.`
        );
        return `${whatsappBaseUrl}?text=${text}`;
    };

    return (
        <section className="py-24 bg-[#FDF6E3] text-[#3E2723] relative overflow-hidden">
            {/* Elementos decorativos picantes flotantes */}
            <div className="absolute top-10 left-5 opacity-20 pointer-events-none animate-bounce" style={{ animationDuration: '4s' }}>
                <span className="text-5xl">🌵</span>
            </div>
            <div className="absolute bottom-10 right-5 opacity-20 pointer-events-none animate-bounce" style={{ animationDuration: '6s' }}>
                <span className="text-5xl">🔥</span>
            </div>

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                {/* Cabecera de la Sección */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="text-[#D91A2A] font-bold tracking-widest uppercase text-sm mb-3 block flex items-center justify-center gap-2">
                        <Sparkles size={16} className="animate-spin text-[#F2A900]" style={{ animationDuration: '3s' }} />
                        Eventos y Celebraciones
                    </span>
                    <h2 className="text-4xl md:text-6xl font-bold font-heading text-[#3E2723] mb-4">
                        Alquila el Stand <span className="text-[#D91A2A]">Nathikas</span>
                    </h2>
                    <p className="max-w-2xl mx-auto text-base md:text-lg text-gray-700 font-medium">
                        Lleva la verdadera fiesta mexicana de gomitas y chamoy a tus eventos corporativos, cumpleaños, bodas y bazares. Sorprende a tus invitados con una experiencia visual y de sabor única.
                    </p>
                </motion.div>

                {/* Subsección 1: Información y Opciones de Contratación */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Detalles e Incluidos (Izquierda) */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-7 space-y-8"
                    >
                        <div className="bg-white p-8 rounded-3xl shadow-xl border-4 border-[#F2A900]/20">
                            <h3 className="text-2xl font-bold text-[#D91A2A] font-heading mb-6 flex items-center gap-3">
                                <BookOpen className="text-[#F2A900]" /> ¿Qué incluye la experiencia Nathikas?
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex gap-4 items-start">
                                    <div className="bg-[#F2A900]/10 p-2 rounded-xl text-[#F2A900] shrink-0">
                                        <Check size={20} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Montaje Premium</h4>
                                        <p className="text-sm text-gray-600">Stand decorado con neones, colores de la marca y temática mexicana.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="bg-[#D91A2A]/10 p-2 rounded-xl text-[#D91A2A] shrink-0">
                                        <Check size={20} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Gomitas Ilimitadas</h4>
                                        <p className="text-sm text-gray-600">Gran variedad de gomitas (enchiladas, dulces, ácidas) para todos los gustos.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="bg-[#F2A900]/10 p-2 rounded-xl text-[#F2A900] shrink-0">
                                        <Check size={20} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Salsa Chamoy Artesanal</h4>
                                        <p className="text-sm text-gray-600">Nuestra exclusiva receta tradicional para bañar las gomitas.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="bg-[#D91A2A]/10 p-2 rounded-xl text-[#D91A2A] shrink-0">
                                        <Check size={20} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Personal de Servicio</h4>
                                        <p className="text-sm text-gray-600">Operadores debidamente uniformados y entrenados para atender a tus invitados.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Opciones de Contratación */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Opción 1: Stand Standard */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="bg-white p-6 rounded-3xl shadow-lg border-2 border-gray-100 hover:border-[#F2A900] transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="inline-block bg-[#FDF6E3] px-3 py-1 rounded-xl text-xs font-bold text-[#F2A900] uppercase tracking-wider mb-3">
                                        Clásico & Delicioso
                                    </div>
                                    <h4 className="text-2xl font-bold font-heading text-[#3E2723] mb-2">Stand Solo</h4>
                                    <p className="text-sm text-gray-600 mb-6">
                                        El stand de exhibición completamente equipado con personal de servicio y productos ilimitados. Perfecto para cumpleaños y bodas.
                                    </p>
                                </div>
                                <a
                                    href={getWhatsAppUrl("Solo Stand (Sin Personaje)")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full text-center bg-[#3E2723] text-white font-bold py-3 rounded-2xl hover:bg-[#D91A2A] transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    Cotizar Stand Solo <ArrowRight size={16} />
                                </a>
                            </motion.div>

                            {/* Opción 2: Stand Premium con Personaje */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="bg-[#3E2723] text-white p-6 rounded-3xl shadow-xl border-4 border-[#F2A900] transition-all flex flex-col justify-between relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 bg-[#F2A900] text-[#3E2723] font-bold text-[10px] px-3 py-1 rounded-bl-2xl uppercase tracking-wider">
                                    Recomendado
                                </div>
                                <div>
                                    <div className="inline-block bg-[#D91A2A] px-3 py-1 rounded-xl text-xs font-bold text-white uppercase tracking-wider mb-3">
                                        Experiencia Completa
                                    </div>
                                    <h4 className="text-2xl font-bold font-heading text-white mb-2 flex items-center gap-2">
                                        Stand + Personaje <Star size={18} fill="#F2A900" className="text-[#F2A900]" />
                                    </h4>
                                    <p className="text-sm text-gray-300 mb-6">
                                        Además de todo el stand e ingredientes, contaremos con la presencia de la **influencer de Nathikas** (creadora de contenido de la marca) animando la estación, tomándose fotos y creando contenido dinámico.
                                    </p>
                                </div>
                                <a
                                    href={getWhatsAppUrl("Stand + Personaje (Influencer)")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full text-center bg-[#F2A900] text-[#3E2723] font-bold py-3 rounded-2xl hover:bg-white hover:text-[#D91A2A] transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    Cotizar Stand + Personaje <ArrowRight size={16} />
                                </a>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Especificaciones y Galería de Fotos del Stand (Derecha) */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-5 space-y-6"
                    >
                        {/* Especificaciones y Medidas del Stand */}
                        <div className="bg-white p-8 rounded-3xl shadow-xl border-4 border-[#D91A2A]/20">
                            <h3 className="text-2xl font-bold text-[#D91A2A] font-heading mb-4 flex items-center gap-3">
                                <Ruler className="text-[#D91A2A]" /> Medidas del Stand
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                                Nuestro stand está diseñado para ser compacto pero sumamente llamativo, adaptándose con facilidad a cualquier espacio interior o exterior.
                            </p>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-[#FDF6E3] p-3 rounded-2xl border border-gray-200">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Ancho</p>
                                    <p className="text-lg font-bold text-[#3E2723]">1.20 m</p>
                                </div>
                                <div className="bg-[#FDF6E3] p-3 rounded-2xl border border-gray-200">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Profundidad</p>
                                    <p className="text-lg font-bold text-[#3E2723]">0.60 m</p>
                                </div>
                                <div className="bg-[#FDF6E3] p-3 rounded-2xl border border-gray-200">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Alto</p>
                                    <p className="text-lg font-bold text-[#3E2723]">0.75 m</p>
                                </div>
                            </div>
                        </div>

                        {/* Galería de Detalles del Stand (Imágenes JPEG) */}
                        <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-gray-100">
                            <h4 className="font-bold text-lg mb-3 text-[#3E2723] flex items-center gap-2">
                                <Sparkles size={18} className="text-[#F2A900]" /> Fotos de la Estructura (JPG)
                            </h4>
                            <p className="text-xs text-gray-500 mb-4">Haz clic sobre cualquier imagen para verla en tamaño grande.</p>
                            
                            <div className="grid grid-cols-3 gap-2">
                                {STAND_DETAILS_IMAGES.map((img, idx) => (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setLightboxIndex(idx)}
                                        className="aspect-square rounded-xl overflow-hidden cursor-pointer relative group border-2 border-gray-100 hover:border-[#D91A2A] transition-all shadow-xs"
                                    >
                                        <img src={img} className="w-full h-full object-cover" alt={`Detalle stand ${idx + 1}`} />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                                            Ver más
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Nota de reserva */}
                        <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100 flex items-center gap-4">
                            <div className="bg-[#F2A900]/10 p-3 rounded-full text-[#F2A900] shrink-0">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h5 className="font-bold">¿Reserva con anticipación?</h5>
                                <p className="text-xs text-gray-500">Recomendamos reservar con al menos 15 días de anticipación para asegurar stock y disponibilidad de fecha.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Subsección: Banner de Empresa / Corporativo (Horizontal y de Ancho Completo) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-16 bg-white p-8 md:p-12 rounded-3xl shadow-xl border-4 border-[#F2A900]/20 flex flex-col lg:flex-row items-center gap-8 max-w-6xl mx-auto"
                >
                    <div className="lg:w-1/2">
                        <span className="text-[#D91A2A] font-bold text-xs uppercase tracking-widest mb-2 block">Corporativo & Bazares</span>
                        <h3 className="text-3xl md:text-4xl font-bold font-heading text-[#3E2723] mb-4">¿Eres una empresa?</h3>
                        <p className="text-gray-700 leading-relaxed">
                            Potencia tu marca o evento corporativo integrando un stand viral. Hemos trabajado con múltiples marcas en lanzamientos de productos, activaciones en tiendas y bazares de alto tráfico en toda Venezuela, logrando un impacto publicitario único.
                        </p>
                    </div>
                    <div className="lg:w-1/2 w-full bg-[#FDF6E3] p-6 rounded-2xl border-2 border-[#F2A900]/30 space-y-4">
                        <div className="flex items-start gap-3">
                            <span className="bg-[#D91A2A] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✔</span>
                            <p className="text-sm font-semibold text-gray-700 leading-tight">Opciones de personalización de vasos y empaques con tu logo.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="bg-[#D91A2A] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✔</span>
                            <p className="text-sm font-semibold text-gray-700 leading-tight">Impulso en las redes sociales oficiales de Nathikas (+100k seguidores).</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="bg-[#D91A2A] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✔</span>
                            <p className="text-sm font-semibold text-gray-700 leading-tight">Activación viral que asegura historias y menciones orgánicas de tus asistentes.</p>
                        </div>
                    </div>
                </motion.div>

                {/* Subsección 3: Galería de Revista Interactiva (Framer Motion - Pila Física Perfecta y Libre de Parpadeos) */}
                <div className="mt-24 text-center">
                    <h3 className="text-3xl font-bold font-heading text-[#3E2723] mb-2">
                        Galería del Stand y Eventos
                    </h3>
                    <p className="text-sm text-gray-600 mb-8 max-w-md mx-auto">
                        Pasa las páginas de nuestra revista interactiva para ver fotos reales del stand, el personaje de Nathikas y la vibra de nuestros eventos.
                    </p>

                    {/* El Contenedor de la Revista */}
                    <div className="relative max-w-md mx-auto aspect-3/4 bg-white rounded-3xl shadow-2xl border-8 border-white group select-none">
                        
                        {/* Efecto Lomo de la Revista (Sombra central que simula encuadernación) */}
                        <div className="absolute top-0 bottom-0 left-0 w-4 bg-linear-to-r from-black/20 via-black/5 to-transparent z-50 pointer-events-none" />
                        
                        {/* Contenedor Perspectiva 3D */}
                        <div className="w-full h-full relative" style={{ perspective: '2200px' }}>
                            {MAGAZINE_IMAGES.map((imgSrc, i) => {
                                const isFlipped = i < page;
                                const isCurrent = i === page;
                                const isNextUnder = i === page + 1;
                                const isPrevUpper = i === page - 1;

                                // Optimización de render: Sólo dibujamos la actual, la siguiente y la anterior
                                const shouldRender = isCurrent || isFlipped || isNextUnder;

                                if (!shouldRender) return null;

                                return (
                                    <motion.div
                                        key={i}
                                        initial={false}
                                        animate={{
                                            rotateY: isFlipped ? -180 : 0,
                                            zIndex: isCurrent ? 25 : (isPrevUpper ? 30 : 10),
                                        }}
                                        transition={{
                                            duration: 0.6,
                                            ease: [0.25, 1, 0.5, 1], // Curva de deformación física muy fluida
                                        }}
                                        style={{
                                            originX: 0, // Pivot en el lomo izquierdo
                                            transformStyle: 'preserve-3d',
                                        }}
                                        className="absolute inset-0 w-full h-full origin-left"
                                    >
                                        {/* CARA FRENTE (Visible de 0 a 90 grados) */}
                                        <div 
                                            className="absolute inset-0 w-full h-full backface-hidden"
                                            style={{ backfaceVisibility: 'hidden' }}
                                        >
                                            <img
                                                src={imgSrc}
                                                alt={`Página frente ${i + 1}`}
                                                className="w-full h-full object-cover rounded-2xl select-none"
                                                draggable="false"
                                            />
                                            {/* Sombra realista de lomo en cada hoja */}
                                            <div className="absolute inset-0 bg-linear-to-r from-black/15 via-transparent to-transparent rounded-2xl pointer-events-none" />
                                        </div>

                                        {/* CARA REVERSO (Visible de 90 a 180 grados, reflejada horizontalmente) */}
                                        <div 
                                            className="absolute inset-0 w-full h-full"
                                            style={{ 
                                                backfaceVisibility: 'hidden',
                                                transform: 'rotateY(180deg)' 
                                            }}
                                        >
                                            <img
                                                src={imgSrc}
                                                alt={`Página reverso ${i + 1}`}
                                                className="w-full h-full object-cover rounded-2xl select-none"
                                                style={{ transform: 'scaleX(-1)' }} // Despejado para lectura natural al girar
                                                draggable="false"
                                            />
                                            {/* Gradiente de sombra al voltear la página */}
                                            <div className="absolute inset-0 bg-linear-to-l from-white/10 via-transparent to-black/25 rounded-2xl pointer-events-none" />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Controles de Navegación Superpuestos (Sólo visibles en Hover) */}
                        <div className="absolute inset-x-0 bottom-6 flex justify-between px-6 z-50 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                                onClick={prevPage}
                                disabled={page === 0 || isFlipping}
                                className={`p-3 bg-white/95 text-[#3E2723] rounded-full shadow-lg border-2 border-gray-100 hover:bg-[#F2A900] hover:text-white transition-colors duration-200 ${page === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <button
                                onClick={nextPage}
                                disabled={page === MAGAZINE_IMAGES.length - 1 || isFlipping}
                                className={`p-3 bg-white/95 text-[#3E2723] rounded-full shadow-lg border-2 border-gray-100 hover:bg-[#F2A900] hover:text-white transition-colors duration-200 ${page === MAGAZINE_IMAGES.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <ArrowRight size={20} />
                            </button>
                        </div>

                        {/* Indicador de Página (Número) */}
                        <div className="absolute top-6 right-6 bg-[#3E2723]/90 backdrop-blur-xs text-white text-xs font-bold px-3 py-1.5 rounded-xl z-40 select-none shadow-md">
                            {page + 1} / {MAGAZINE_IMAGES.length}
                        </div>
                    </div>

                    {/* Paginación de Puntos */}
                    <div className="flex justify-center gap-2 mt-6">
                        {MAGAZINE_IMAGES.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    if (isFlipping || index === page) return;
                                    setIsFlipping(true);
                                    setPage(index);
                                    setTimeout(() => setIsFlipping(false), 600);
                                }}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${page === index ? 'bg-[#D91A2A] w-6' : 'bg-gray-300 hover:bg-gray-400'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* LIGHTBOX MODAL DE FOTOS (Para ver las fotos de la estructura más grandes) */}
            <AnimatePresence>
                {lightboxIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4"
                    >
                        {/* Cabecera del Lightbox */}
                        <div className="flex justify-between items-center text-white px-4 py-2">
                            <span className="text-sm font-semibold tracking-wider uppercase">
                                Estructura del Stand ({lightboxIndex + 1} / {STAND_DETAILS_IMAGES.length})
                            </span>
                            <button
                                onClick={() => setLightboxIndex(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white"
                            >
                                <X size={28} />
                            </button>
                        </div>

                        {/* Visor de Imagen Central */}
                        <div className="relative flex-1 flex items-center justify-center max-w-4xl mx-auto w-full group">
                            {/* Botón de Izquierda */}
                            <button
                                onClick={prevLightbox}
                                className="absolute left-4 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors border border-white/20 z-10 cursor-pointer"
                            >
                                <ArrowLeft size={24} />
                            </button>

                            {/* Contenedor de la Imagen */}
                            <motion.div
                                key={lightboxIndex}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="relative max-h-[75vh] max-w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10"
                            >
                                <img
                                    src={STAND_DETAILS_IMAGES[lightboxIndex]}
                                    alt={`Detalle stand ampliado ${lightboxIndex + 1}`}
                                    className="max-h-[75vh] max-w-full object-contain pointer-events-none"
                                />
                            </motion.div>

                            {/* Botón de Derecha */}
                            <button
                                onClick={nextLightbox}
                                className="absolute right-4 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors border border-white/20 z-10 cursor-pointer"
                            >
                                <ArrowRight size={24} />
                            </button>
                        </div>

                        {/* Indicadores inferiores */}
                        <div className="flex justify-center gap-2 py-4">
                            {STAND_DETAILS_IMAGES.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setLightboxIndex(idx)}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${idx === lightboxIndex ? 'bg-[#F2A900] w-6' : 'bg-gray-500'}`}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
