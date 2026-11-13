import React, { useState, useRef, useEffect, useContext } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, motionValue } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import {
    Menu,
    X,
    Play,
    ArrowUpRight,
    ArrowRight,
    ShoppingBag,
    MessageCircle,
    ChevronDown,
    Check,
    Phone,
    Mail,
    Sparkles
} from 'lucide-react';

interface Props {
    data?: any;
}

// Capas separadas para composición 3D con profundidad real (Acto 2: Libertad & Flexibilidad)
const HADA_BG_SRC = '/influencer/hada-layer-1-bg.jpg';
const HADA_BODY_SRC = '/influencer/hada-layer-2-body.png';
const HADA_PLANTS_SRC = '/influencer/hada-layer-3-plants.png';
const HADA_HAND_SRC = '/influencer/hada-layer-4-hand.png';

// Photos for the 2 infinite vertical carousels in Section 2 (tightly packed & 15deg tilted)
const CAROUSEL_COL_1 = [
    { src: '/influencer/hero-nathika.webp', alt: 'Nathika Night Editorial' },
    { src: '/influencer/urban-1.webp', alt: 'Nathika Urban Red Lights' },
    { src: '/nuevas/foton1.jpeg', alt: 'Nathika Lifestyle 1' },
    { src: '/influencer/urban-3.webp', alt: 'Nathika Sunglasses Night' },
    { src: '/nuevas/foton3.jpeg', alt: 'Nathika Travelling' },
    { src: '/nuevas/IMG_3179.webp', alt: 'Nathika Adventure' },
];

const CAROUSEL_COL_2 = [
    { src: '/influencer/urban-2.webp', alt: 'Nathika Payphone Street' },
    { src: '/nuevas/foton2.jpeg', alt: 'Nathika Sport & Vibe' },
    { src: '/influencer/urban-4.webp', alt: 'Nathika Night Booth' },
    { src: '/nuevas/foton4.jpeg', alt: 'Nathika Experience' },
    { src: '/nuevas/foton5.jpeg', alt: 'Nathika Outdoor' },
    { src: '/nuevas/IMG_3181.webp', alt: 'Nathika Community' },
];

// 5 Vertical Videos for the Full-Width Urban Drag Carousel
const URBAN_VIDEOS = [
    {
        id: '01',
        src: '/videos/videonati1.mp4',
        poster: '/influencer/hero-nathika.webp',
        tag: 'LIFESTYLE & VIBE',
        title: 'Conexión Sin Filtros',
        location: 'NIGHT SESSION // 01',
        startTime: 0
    },
    {
        id: '02',
        src: '/videos/videonati2.mp4',
        poster: '/influencer/urban-2.webp',
        tag: 'EXPERIENCIAS',
        title: 'Comunidad en Movimiento',
        location: 'STREET STORY // 02',
        startTime: 0
    },
    {
        id: '03',
        src: '/videos/videonati1.mp4#t=4',
        poster: '/influencer/urban-3.webp',
        tag: 'SPORT & ADRENALINA',
        title: 'Energía que Contagia',
        location: 'ACTION REEL // 03',
        startTime: 4
    },
    {
        id: '04',
        src: '/videos/chamoybol.mp4',
        poster: '/influencer/urban-1.webp',
        tag: 'CREATIVE DIRECTION',
        title: 'Sabor & Rebeldía',
        location: 'NATHIKAS LAB // 04',
        startTime: 0
    },
    {
        id: '05',
        src: '/videos/videonati2.mp4#t=3',
        poster: '/influencer/urban-4.webp',
        tag: 'TRAVELLING & TODO',
        title: 'Explorando el Mundo',
        location: 'ON THE ROAD // 05',
        startTime: 3
    }
];

const SERVICES_LIST = [
    {
        bold: 'Organizar estrategias',
        rest: 'personalizadas desde cero para que tu marca conecte con millennials y Gen Z que viven la experiencia.'
    },
    {
        bold: 'Guionismo y Storytelling',
        rest: 'con ganchos reales y formatos dinámicos que atrapan en segundos sin sonar a publicidad repetida.'
    },
    {
        bold: 'Dirección creativa',
        rest: 'cuidando locaciones, estética visual, actitud y puesta en escena alineada con tu proyecto.'
    },
    {
        bold: 'Edición y post producción',
        rest: 'de alto impacto vertical con ritmo urbano, diseño sonoro envolvente y retención máxima.'
    },
    {
        bold: 'Análisis de métricas',
        rest: 'y resultados claros post-campaña para medir el alcance orgánico, la conversación y el retorno.'
    }
];

const SERVICE_OPTIONS = [
    {
        value: 'Campaña Completa 360°',
        label: 'Campaña Completa 360° (Todo incluido)',
        desc: 'Estrategia, guion, producción, edición y reporte de métricas',
        badge: 'RECOMENDADO'
    },
    {
        value: 'Organizar estrategias',
        label: 'Organizar estrategias',
        desc: 'Planificación creativa a medida para tu marca'
    },
    {
        value: 'Guionismo y Storytelling',
        label: 'Guionismo y Storytelling',
        desc: 'Ganchos reales y narrativa que atrapa en segundos'
    },
    {
        value: 'Dirección creativa',
        label: 'Dirección creativa',
        desc: 'Estética visual, locaciones y puesta en escena'
    },
    {
        value: 'Edición y post producción',
        label: 'Edición y post producción',
        desc: 'Edición vertical con ritmo urbano y alta retención'
    },
    {
        value: 'Análisis de métricas',
        label: 'Análisis de métricas',
        desc: 'Evaluación de rendimiento, alcance y conversión'
    }
];

const INFLUENCER_FAQS = [
    {
        question: '¿Cómo es el proceso para trabajar juntos en una campaña?',
        answer: '¡Súper directo y sin complicaciones! Primero conversamos sobre tu marca y lo que quieres lograr. Con eso armo una propuesta creativa personalizada con guion y storytelling (cero formatos repetidos). Una vez aprobada, grabo, edito en alta calidad y publicamos midiendo el impacto real.'
    },
    {
        question: '¿Solo haces menciones o te encargas de toda la producción?',
        answer: 'Me encargo del 360° completo: desde organizar la estrategia, escribir el guion con ganchos reales y dirigir la estética visual, hasta la grabación, edición y post producción, cerrando con el análisis de métricas.'
    },
    {
        question: '¿En qué redes sociales publicas y también creas contenido UGC?',
        answer: 'Podemos activar campañas directamente en mis redes principales (Instagram, TikTok, YouTube y Facebook) para conectar con mi comunidad, o desarrollar piezas UGC y contenido exclusivo para que tu marca lo utilice en sus propios canales y pauta publicitaria (Ads).'
    },
    {
        question: '¿Con qué tipo de marcas y sectores colaboras?',
        answer: 'Me apasiona mostrarle al mundo un poco de todo: colaboro con marcas de lifestyle, sport, travelling, gastronomía, moda, tecnología y experiencias. Si tu marca busca autenticidad, rebeldía e impacto real, ¡hacemos equipo!'
    },
    {
        question: '¿Cuánto tiempo toma tener lista una campaña?',
        answer: 'Dependiendo de la producción y locaciones, el tiempo promedio desde que aprobamos el concepto creativo y guion hasta la entrega del video editado es de 4 a 7 días hábiles.'
    },
    {
        question: '¿Trabajas con marcas fuera de Venezuela?',
        answer: '¡Totalmente! El 65% de mi comunidad principal está en Venezuela y cuento con un 35% de alcance internacional activo en Colombia, Estados Unidos y España, por lo que trabajo tanto con marcas locales como internacionales.'
    }
];

/* =========================================================================
 * "SOBRE MÍ" EPIC SCROLL REVEAL SYSTEM (zero layout shift on mobile)
 * -------------------------------------------------------------------------
 * Uses an invisible static "ghost sizer" to lock exact DOM height & width
 * permanently, while an absolute GPU-composited layer animates scale, y,
 * rotate, and opacity smoothly on scroll.
 * ========================================================================= */

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const ScrollBlockProgressContext = React.createContext<MotionValue<number> | null>(null);
const STATIC_ONE = motionValue(1);

function EpicScrollBlock({
    children,
    initialScale = 1.15,
    initialRotate = 0,
    className = ''
}: {
    children: React.ReactNode;
    initialScale?: number;
    initialRotate?: number;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 639px)');
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    // Default to 1 so SSR and initial paint render at 100% full intensity (never stuck dim)
    const rawProgress = useMotionValue(1);
    const smoothProgress = useSpring(rawProgress, {
        stiffness: 170,
        damping: 26,
        mass: 0.32
    });

    useEffect(() => {
        let isFirst = true;

        const update = () => {
            const el = ref.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const vh = window.innerHeight || document.documentElement.clientHeight || 800;
            const startY = vh * 0.96;
            const endY = vh * 0.56;
            const p = Math.max(0, Math.min(1, (startY - rect.top) / (startY - endY)));

            if (isFirst) {
                isFirst = false;
                rawProgress.jump(p);
                smoothProgress.jump(p);
            } else {
                rawProgress.set(p);
            }
        };

        update();
        const rafId = requestAnimationFrame(update);
        window.addEventListener('scroll', update, { passive: true, capture: true });
        window.addEventListener('resize', update, { passive: true });

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [rawProgress, smoothProgress]);

    const cappedDesktopScale = Math.min(initialScale, 1.15);
    const effectiveScale = isMobile ? Math.min(initialScale, 1.06) : cappedDesktopScale;

    const scale = useTransform(smoothProgress, [0, 0.45, 1], [effectiveScale, effectiveScale * 0.95, 1]);
    const y = useTransform(smoothProgress, [0, 0.45, 1], [isMobile ? 36 : 60, isMobile ? 12 : 18, 0]);
    const x = useTransform(smoothProgress, [0, 0.5, 1], [isMobile ? -8 : -18, isMobile ? -2 : -5, 0]);
    const rotate = useTransform(smoothProgress, [0, 0.5, 1], [initialRotate, initialRotate * 0.25, 0]);
    const rotateX = useTransform(smoothProgress, [0, 0.5, 1], [22, 7, 0]);
    const opacity = useTransform(smoothProgress, [0, 0.25, 1], [0.35, 1, 1]);

    return (
        <div ref={ref} className={`relative w-full ${className}`}>
            {/* Static sizer locks exact DOM height & width so layout NEVER shifts */}
            <div aria-hidden="true" className="invisible pointer-events-none select-none w-full">
                {children}
            </div>

            {/* GPU-composited animated layer */}
            <ScrollBlockProgressContext.Provider value={smoothProgress}>
                <motion.div
                    style={{
                        scale,
                        y,
                        x,
                        rotate,
                        rotateX,
                        opacity,
                        transformPerspective: 900,
                        transformOrigin: 'left top'
                    }}
                    className="absolute inset-x-0 top-0 w-full will-change-transform"
                >
                    {children}
                </motion.div>
            </ScrollBlockProgressContext.Provider>
        </div>
    );
}

/** Marker sweep that paints behind emphasized words as the block docks into place. */
function HighlightSweep({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    const progress = useContext(ScrollBlockProgressContext) ?? STATIC_ONE;
    const scaleX = useTransform(progress, [0.3, 0.85], [0, 1]);

    return (
        <span className={`relative inline-block isolate px-1.5 -mx-0.5 font-black text-white ${className}`}>
            <motion.span
                aria-hidden="true"
                style={{ scaleX }}
                className="absolute inset-x-0 bottom-[0.06em] h-[0.46em] bg-linear-to-r from-[#D91424] to-[#FF2A40] -skew-x-6 origin-left -z-10 rounded-[3px] shadow-[0_4px_14px_rgba(217,20,36,0.45)]"
            />
            {children}
        </span>
    );
}

/** Stamp word (like ¡TODO!) that slams onto the page as its parent block docks. */
function StampWord({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    const progress = useContext(ScrollBlockProgressContext) ?? STATIC_ONE;
    const scale = useTransform(progress, [0.35, 0.82, 1], [0.72, 1.16, 1]);
    const rotate = useTransform(progress, [0.35, 0.82, 1], [-12, 3, -3]);

    return (
        <motion.span
            style={{ scale, rotate }}
            className={`inline-block font-anton tracking-wide text-[#FF3347] text-[1.42em] leading-[0.82] px-1 drop-shadow-[0_4px_12px_rgba(217,20,36,0.5)] will-change-transform ${className}`}
        >
            {children}
        </motion.span>
    );
}

export default function InfluencerLanding({ data }: Props) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [unmutedVideoIdx, setUnmutedVideoIdx] = useState<number | null>(null);
    const [brandName, setBrandName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [selectedService, setSelectedService] = useState('Campaña Completa 360°');
    const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
    const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
    const selectorRef = useRef<HTMLDivElement>(null);

    // Drag carousel refs & state
    const carouselViewportRef = useRef<HTMLDivElement>(null);
    const carouselTrackRef = useRef<HTMLDivElement>(null);
    const [dragConstraints, setDragConstraints] = useState({ left: -1600, right: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [showSwipeHint, setShowSwipeHint] = useState(false);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

    // "Sobre mí" bio: scroll progress rail (transform-only, no layout work)
    const bioRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: bioProgress } = useScroll({
        target: bioRef,
        offset: ['start 85%', 'end 55%']
    });

    // "Métricas" Act 2: multi-layer 3D depth parallax (Fondo -> Hada -> Plantas -> Mano)
    const metricsRef = useRef<HTMLElement>(null);
    const metricsRawProgress = useMotionValue(0.35);
    const metricsSmoothProgress = useSpring(metricsRawProgress, {
        stiffness: 110,
        damping: 26,
        mass: 0.45
    });
    const forestBgScale = useTransform(metricsSmoothProgress, [0, 0.5, 1], [1.06, 1.02, 1]);
    const forestBgY = useTransform(metricsSmoothProgress, [0, 1], [-16, 16]);
    const fairyY = useTransform(metricsSmoothProgress, [0, 1], [14, -14]);
    const plantsFgY = useTransform(metricsSmoothProgress, [0, 1], [28, -28]);
    const plantsFgScale = useTransform(metricsSmoothProgress, [0, 1], [1.03, 1]);
    const sunbeamsOpacity = useTransform(metricsSmoothProgress, [0, 0.35, 1], [0.2, 0.85, 0.65]);

    useEffect(() => {
        const updateMetricsScroll = () => {
            const el = metricsRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const vh = window.innerHeight || document.documentElement.clientHeight || 800;
            const totalTravel = vh + rect.height;
            const raw = totalTravel > 0 ? (vh - rect.top) / totalTravel : 0.35;
            metricsRawProgress.set(Math.max(0, Math.min(1, raw)));
        };

        updateMetricsScroll();
        window.addEventListener('scroll', updateMetricsScroll, { passive: true, capture: true });
        window.addEventListener('resize', updateMetricsScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', updateMetricsScroll, true);
            window.removeEventListener('resize', updateMetricsScroll);
        };
    }, [metricsRawProgress]);

    const whatsappNumber = '584128919386';

    // Close custom service dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
                setServiceDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const updateConstraints = () => {
            if (carouselTrackRef.current && carouselViewportRef.current) {
                const trackWidth = carouselTrackRef.current.scrollWidth;
                const viewportWidth = carouselViewportRef.current.clientWidth;
                setDragConstraints({
                    left: -Math.max(0, trackWidth - viewportWidth),
                    right: 0
                });
            }
        };

        updateConstraints();
        window.addEventListener('resize', updateConstraints);
        const timer = setTimeout(updateConstraints, 500);
        return () => {
            window.removeEventListener('resize', updateConstraints);
            clearTimeout(timer);
        };
    }, []);

    // Transient animated finger swipe hint when the video carousel enters viewport
    useEffect(() => {
        const viewportEl = carouselViewportRef.current;
        if (!viewportEl) return;

        let hideTimer: ReturnType<typeof setTimeout> | null = null;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting) {
                    setShowSwipeHint(true);
                    if (hideTimer) clearTimeout(hideTimer);
                    hideTimer = setTimeout(() => {
                        setShowSwipeHint(false);
                    }, 3400);
                } else {
                    setShowSwipeHint(false);
                    if (hideTimer) clearTimeout(hideTimer);
                }
            },
            { threshold: 0.35 }
        );

        observer.observe(viewportEl);
        return () => {
            observer.disconnect();
            if (hideTimer) clearTimeout(hideTimer);
        };
    }, []);

    const openWhatsApp = (customService?: string) => {
        const srv = customService || selectedService;
        const lines = [
            '¡Hola Nathika! ⚡ Vi tu web y quiero cotizar una campaña contigo.',
            '',
            `*Marca / Proyecto:* ${brandName || 'Por definir'}`,
            contactPhone ? `*Teléfono:* ${contactPhone}` : null,
            contactEmail ? `*Correo:* ${contactEmail}` : null,
            `*Servicio de interés:* ${srv}`,
            '',
            '¡Cuéntame cómo empezamos!'
        ].filter((line) => line !== null);

        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
    };

    const toggleVideoSound = (index: number) => {
        if (isDragging) return;
        setUnmutedVideoIdx(prev => (prev === index ? null : index));
    };

    return (
        <div className="min-h-screen bg-[#08090C] text-[#F6F2EB] font-editorial overflow-x-clip selection:bg-[#D91424] selection:text-white">
            {/* =====================================================================
                NAVIGATION OVERLAY DRAWER
               ===================================================================== */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col justify-between p-6 md:p-12"
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-anton text-2xl tracking-wider text-white">
                                SOY NATHIKA<span className="text-[#D91424]">.</span>
                            </span>
                            <button
                                onClick={() => setMenuOpen(false)}
                                className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-[#D91424] hover:text-white transition-colors"
                                aria-label="Cerrar menú"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <nav className="flex flex-col gap-4 my-auto max-w-xl">
                            {[
                                { label: '01 / INICIO', href: '#hero' },
                                { label: '02 / SOBRE MÍ', href: '#sobre-nathika' },
                                { label: '03 / MÉTRICAS Y ESTADÍSTICAS', href: '#metricas' },
                                { label: '04 / SERVICIOS 360°', href: '#servicios' },
                                { label: '05 / REELS & CONTACTO', href: '#reels-carousel' },
                                { label: '06 / PREGUNTAS FRECUENTES', href: '#faq' },
                            ].map((item, i) => (
                                <a
                                    key={i}
                                    href={item.href}
                                    onClick={() => setMenuOpen(false)}
                                    className="font-anton text-4xl sm:text-6xl text-white hover:text-[#D91424] transition-colors tracking-tight uppercase"
                                >
                                    {item.label}
                                </a>
                            ))}

                            <div className="pt-6 border-t border-white/15 mt-4">
                                <a
                                    href="/tienda"
                                    className="inline-flex items-center gap-3 px-6 py-3.5 [--paper:#F2EFE9] text-[#090A0D] font-mono-zine font-bold text-sm uppercase tracking-wider torn-paper-btn hover:[--paper:#D91424] hover:text-white transition-colors"
                                >
                                    <ShoppingBag size={18} />
                                    <span>IR A LA TIENDA DE GOMITAS (SECUNDARIA)</span>
                                    <ArrowUpRight size={18} />
                                </a>
                            </div>
                        </nav>

                        <div className="flex items-center justify-between text-xs font-mono-zine text-white/60 border-t border-white/10 pt-4">
                            <span>LIFESTYLE · SPORT · TRAVELLING</span>
                            <span>@NATHIKAS.VE</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* =====================================================================
                SECTION 1: HERO (REBELDE FUERTE + FANCY COLLAGE ZINE)
               ===================================================================== */}
            <section
                id="hero"
                className="relative w-full min-h-[100svh] flex flex-col justify-between overflow-hidden bg-[#07090E] select-none"
            >
                {/* 1. Clean Night City + Red Neon Bokeh Background */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/influencer/hero-bg-clean.webp"
                        alt="Fondo Urbano Nocturno Nathika"
                        className="w-full h-full object-cover object-center scale-105 brightness-[0.85] contrast-115"
                    />
                    <div className="absolute inset-0 bg-linear-to-b from-black/35 via-transparent to-black/85" />
                    <div className="absolute inset-0 halftone-overlay opacity-35 pointer-events-none" />
                </div>

                {/* 2. Torn Kraft Paper & Masking Tape Side Scraps (Left & Right Edges) */}
                <div
                    className="absolute left-0 top-[47%] w-6 sm:w-10 md:w-14 h-44 sm:h-56 bg-[#C5AA87] kraft-strip-left z-20 shadow-xl pointer-events-none opacity-95"
                    style={{
                        backgroundImage:
                            'repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 2px, transparent 2px, transparent 6px)'
                    }}
                />
                <div className="absolute right-[-18px] top-[12%] w-24 sm:w-32 h-8 tape-clear rotate-[28deg] z-20 pointer-events-none" />
                <div
                    className="absolute right-0 top-[15%] w-5 sm:w-9 md:w-12 h-52 sm:h-64 bg-[#C8AE8B] kraft-strip-right z-20 shadow-xl pointer-events-none opacity-95"
                />
                <div className="absolute right-[-10px] top-[41%] w-24 sm:w-28 h-8 tape-clear -rotate-[38deg] z-20 pointer-events-none" />
                <div className="absolute left-[-16px] bottom-[-6px] w-28 sm:w-36 h-10 tape-clear rotate-[36deg] z-20 pointer-events-none" />

                {/* 3. TOP BAR: Only Top-Left Torn Paper Menu Button */}
                <div className="relative z-40 flex items-start justify-between w-full">
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="[--paper:#F3F1EC] text-[#0B0C0E] pt-3 pb-4 pl-4 pr-7 sm:pt-4 sm:pb-5 sm:pl-6 sm:pr-9 torn-paper-corner-left shadow-lg group cursor-pointer transition-transform hover:scale-105"
                        aria-label="Abrir Menú"
                    >
                        <div className="relative flex items-center justify-center w-12 h-10 sm:w-14 sm:h-11">
                            <svg
                                viewBox="0 0 80 60"
                                className="absolute inset-0 w-full h-full text-[#0B0C0E] group-hover:text-[#D91424] transition-colors"
                            >
                                <path
                                    d="M12,30 C10,12 28,5 44,6 C62,7 74,16 72,31 C70,46 54,54 36,53 C18,52 8,42 12,27 C15,14 32,8 50,10"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.8"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <Menu size={22} strokeWidth={2.5} className="relative z-10" />
                        </div>
                    </button>
                </div>

                {/* 4. CENTRAL COLLAGE STAGE: Huge "SOY NATHIKA." + Huge Cutout + Aligned HIK Overlay + Animated Stars */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-end w-full max-w-[980px] mx-auto px-2 -mt-6 sm:-mt-10">
                    
                    {/* Top-Left Animated Stars Cluster near SOY */}
                    <motion.svg
                        viewBox="0 0 130 120"
                        animate={{ y: [0, -7, 0], rotate: [-4, 5, -4] }}
                        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute left-[4%] sm:left-[12%] md:left-[16%] top-0 sm:top-[2%] w-24 sm:w-32 md:w-36 h-24 sm:h-32 z-30 pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]"
                    >
                        <motion.path
                            d="M55,10 L62,32 L82,22 L66,38 L78,54 L58,44 L45,58 L48,36 L32,26 L52,28 Z"
                            fill="none"
                            stroke="#F4F1EA"
                            strokeWidth="3.2"
                            strokeLinejoin="round"
                            animate={{ scale: [0.92, 1.12, 0.92], rotate: [-8, 8, -8] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ transformOrigin: '58px 34px' }}
                        />
                        <motion.path
                            d="M25,38 L31,58 L50,48 L35,62 L44,78 L28,68 L15,80 L19,60 L5,50 L23,52 Z"
                            fill="none"
                            stroke="#FF3347"
                            strokeWidth="3"
                            strokeLinejoin="round"
                            animate={{ scale: [1.08, 0.88, 1.08], rotate: [10, -10, 10] }}
                            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                            style={{ transformOrigin: '28px 60px' }}
                        />
                        <motion.path
                            d="M78,48 L84,68 L102,58 L87,72 L96,88 L80,78 L68,90 L72,70 L58,60 L75,62 Z"
                            fill="none"
                            stroke="#F4F1EA"
                            strokeWidth="3"
                            strokeLinejoin="round"
                            animate={{ scale: [0.9, 1.15, 0.9], rotate: [-12, 12, -12] }}
                            transition={{ duration: 3.1, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                            style={{ transformOrigin: '80px 70px' }}
                        />
                    </motion.svg>

                    {/* GIANT RANSOM / MAGAZINE TITLE: "SOY NATHIKA." (Tall, Elongated League Gothic Typography) */}
                    <div className="relative w-full flex flex-col items-center select-none pointer-events-none">
                        
                        {/* ROW 1: "SOY" (Behind Nathika) */}
                        <div className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2.5 leading-none">
                            <span className="font-anton text-[7.8rem] sm:text-[10.8rem] md:text-[12.8rem] lg:text-[14.2rem] text-white tracking-tight leading-[0.82] drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)]">
                                S
                            </span>
                            <span className="inline-flex items-center justify-center torn-ransom-tile [--paper:#EAE8E3] px-2.5 sm:px-4 py-1 -rotate-1">
                                <span className="font-anton text-[7.4rem] sm:text-[10.2rem] md:text-[12.2rem] lg:text-[13.6rem] text-[#17181C] leading-[0.82]">
                                    O
                                </span>
                            </span>
                            <span className="inline-flex items-center justify-center torn-ransom-tile [--paper:#C81D25] px-3 sm:px-4.5 py-1.5 rotate-1">
                                <span
                                    className="font-anton text-[7.4rem] sm:text-[10.2rem] md:text-[12.2rem] lg:text-[13.6rem] text-[#1A1617] leading-[0.82]"
                                    style={{ WebkitTextStroke: '2.5px #F4F1EA' }}
                                >
                                    Y
                                </span>
                            </span>
                        </div>

                        {/* ROW 2: "NATHIKA." Wrapper (Contains BOTH z-10 Background Row AND z-30 Exact Foreground HIK Outline!) */}
                        <div className="relative w-full mt-0.5 sm:mt-1">
                            
                            {/* LAYER A (z-10, BEHIND NATHIKA CUTOUT): Full NATHIKA. */}
                            <div className="relative z-10 flex items-end justify-center gap-1 sm:gap-1.5 leading-none w-full px-1">
                                <span className="relative inline-block">
                                    <span className="absolute -inset-x-1 top-1 bottom-1 bg-[#B8141E]/85 -rotate-1" />
                                    <span className="relative font-anton text-[7.5rem] sm:text-[10.6rem] md:text-[12.8rem] lg:text-[14.4rem] text-white leading-[0.82]">
                                        N
                                    </span>
                                </span>
                                <span className="relative inline-block">
                                    <span className="absolute -inset-x-1 top-2 bottom-1 bg-[#8C1119]/80 rotate-1" />
                                    <span className="relative font-anton text-[7.5rem] sm:text-[10.6rem] md:text-[12.8rem] lg:text-[14.4rem] text-white leading-[0.82]">
                                        A
                                    </span>
                                </span>
                                <span className="font-anton text-[7.5rem] sm:text-[10.6rem] md:text-[12.8rem] lg:text-[14.4rem] text-white leading-[0.82]">
                                    T
                                </span>
                                <span
                                    className="font-anton text-[7.5rem] sm:text-[10.6rem] md:text-[12.8rem] lg:text-[14.4rem] text-transparent leading-[0.82]"
                                    style={{ WebkitTextStroke: '2.4px rgba(255,255,255,0.92)' }}
                                >
                                    H
                                </span>
                                <span className="inline-flex flex-col items-center justify-center bg-[#ECEAE4] px-2 sm:px-3 py-1.5 mx-0.5 shadow-xl">
                                    <span className="w-3.5 sm:w-5 md:w-6 h-3.5 sm:h-5 md:h-6 bg-[#C81D25] mb-1.5" />
                                    <span className="w-3.5 sm:w-5 md:w-6 h-16 sm:h-25 md:h-31 lg:h-35 bg-[#C81D25]" />
                                </span>
                                <span className="inline-flex items-center justify-center torn-ransom-tile [--paper:#EAE8E2] px-2.5 sm:px-3.5 py-1">
                                    <span className="font-anton text-[7.2rem] sm:text-[10.2rem] md:text-[12.4rem] lg:text-[14rem] text-[#18191D] leading-[0.82]">
                                        K
                                    </span>
                                </span>
                                <span className="font-anton text-[7.5rem] sm:text-[10.6rem] md:text-[12.8rem] lg:text-[14.4rem] text-white leading-[0.82]">
                                    A.
                                </span>
                            </div>

                            {/* LAYER B (z-30, ON TOP OF NATHIKA CUTOUT): Exact Aligned H I K Outlines */}
                            <div
                                aria-hidden="true"
                                className="absolute inset-0 z-30 flex items-end justify-center gap-1 sm:gap-1.5 leading-none w-full px-1 pointer-events-none"
                            >
                                {/* Invisible spacers N, A, T with identical metrics */}
                                <span className="relative inline-block opacity-0">
                                    <span className="relative font-anton text-[7.5rem] sm:text-[10.6rem] md:text-[12.8rem] lg:text-[14.4rem] leading-[0.82]">
                                        N
                                    </span>
                                </span>
                                <span className="relative inline-block opacity-0">
                                    <span className="relative font-anton text-[7.5rem] sm:text-[10.6rem] md:text-[12.8rem] lg:text-[14.4rem] leading-[0.82]">
                                        A
                                    </span>
                                </span>
                                <span className="font-anton text-[7.5rem] sm:text-[10.6rem] md:text-[12.8rem] lg:text-[14.4rem] leading-[0.82] opacity-0">
                                    T
                                </span>
                                {/* Visible H Outline on top of hair */}
                                <span
                                    className="font-anton text-[7.5rem] sm:text-[10.6rem] md:text-[12.8rem] lg:text-[14.4rem] text-transparent leading-[0.82]"
                                    style={{ WebkitTextStroke: '2.2px rgba(255,255,255,0.9)' }}
                                >
                                    H
                                </span>
                                {/* Visible I Outline on top of hair */}
                                <span className="inline-flex flex-col items-center justify-center border-2 border-white/85 px-2 sm:px-3 py-1.5 mx-0.5">
                                    <span className="w-3.5 sm:w-5 md:w-6 h-3.5 sm:h-5 md:h-6 border-2 border-white/85 mb-1.5" />
                                    <span className="w-3.5 sm:w-5 md:w-6 h-16 sm:h-25 md:h-31 lg:h-35 border-2 border-white/85" />
                                </span>
                                {/* Visible K Outline on top of hair */}
                                <span className="inline-flex items-center justify-center border-2 border-white/80 px-2 sm:px-3 py-0.5">
                                    <span
                                        className="font-anton text-[7.2rem] sm:text-[10.2rem] md:text-[12.4rem] lg:text-[14rem] text-transparent leading-[0.82]"
                                        style={{ WebkitTextStroke: '2.2px rgba(255,255,255,0.9)' }}
                                    >
                                        K
                                    </span>
                                </span>
                                {/* Invisible spacer A. */}
                                <span className="font-anton text-[7.5rem] sm:text-[10.6rem] md:text-[12.8rem] lg:text-[14.4rem] leading-[0.82] opacity-0">
                                    A.
                                </span>
                            </div>

                        </div>
                    </div>

                    {/* FOREGROUND CUTOUT PORTRAIT OF NATHIKA (TIGHTLY CROPPED & HUGE, z-20) */}
                    <div className="relative z-20 w-[340px] sm:w-[460px] md:w-[540px] lg:w-[600px] -mt-9 sm:-mt-14 md:-mt-18 mx-auto flex flex-col items-center">
                        
                        {/* Left Animated Stars & Hand-Drawn Arrow */}
                        <motion.svg
                            viewBox="0 0 120 220"
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute -left-6 sm:-left-12 top-[4%] w-24 sm:w-32 h-44 sm:h-56 z-30 pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]"
                        >
                            <motion.path
                                d="M26,12 L30,26 L44,20 L33,30 L40,42 L28,35 L18,44 L21,30 L10,22 L24,24 Z"
                                fill="none"
                                stroke="#F4F1EA"
                                strokeWidth="3"
                                animate={{ scale: [0.9, 1.18, 0.9], rotate: [-15, 15, -15] }}
                                transition={{ duration: 2.3, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ transformOrigin: '27px 28px' }}
                            />
                            <motion.path
                                d="M45,38 L52,58 L70,48 L56,62 L65,78 L48,68 L35,80 L39,60 L25,50 L43,52 Z"
                                fill="none"
                                stroke="#FF3347"
                                strokeWidth="3.2"
                                animate={{ scale: [1.1, 0.88, 1.1], rotate: [12, -12, 12] }}
                                transition={{ duration: 2.7, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                                style={{ transformOrigin: '48px 60px' }}
                            />
                            <motion.path
                                d="M92,32 L98,50 L114,42 L101,54 L109,68 L94,60 L82,70 L86,52 L74,44 L89,46 Z"
                                fill="none"
                                stroke="#F4F1EA"
                                strokeWidth="3.2"
                                animate={{ scale: [0.92, 1.15, 0.92], rotate: [-10, 10, -10] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                                style={{ transformOrigin: '94px 52px' }}
                            />
                            <path
                                d="M28,95 C20,130 28,158 46,178"
                                fill="none"
                                stroke="#F4F1EA"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                            />
                            <path
                                d="M32,172 L47,180 L44,160"
                                fill="none"
                                stroke="#F4F1EA"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </motion.svg>

                        {/* Right Squiggle Arrow & Animated Red Star */}
                        <motion.svg
                            viewBox="0 0 130 220"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                            className="absolute -right-6 sm:-right-12 top-[6%] w-24 sm:w-32 h-44 sm:h-56 z-30 pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]"
                        >
                            <path
                                d="M75,18 C32,30 35,55 68,62 C98,68 85,95 55,112"
                                fill="none"
                                stroke="#F4F1EA"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                            />
                            <path
                                d="M58,98 L52,114 L70,110"
                                fill="none"
                                stroke="#F4F1EA"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <motion.path
                                d="M76,118 L85,146 L112,136 L90,154 L102,178 L78,162 L56,178 L66,152 L46,136 L72,140 Z"
                                fill="none"
                                stroke="#C81D25"
                                strokeWidth="3.5"
                                strokeLinejoin="round"
                                animate={{ scale: [0.9, 1.2, 0.9], rotate: [-14, 14, -14] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ transformOrigin: '78px 150px' }}
                            />
                        </motion.svg>

                        {/* Bottom-Right Red Curved Arrow pointing to Button */}
                        <svg
                            viewBox="0 0 100 120"
                            className="absolute -right-2 sm:-right-6 bottom-[14%] w-16 sm:w-20 h-24 z-30 pointer-events-none"
                        >
                            <path
                                d="M82,12 C84,52 65,82 32,96"
                                fill="none"
                                stroke="#C81D25"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                            />
                            <path
                                d="M44,82 L28,97 L48,102"
                                fill="none"
                                stroke="#C81D25"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>

                        {/* Tightly Cropped High-Res Cutout Image of Nathika */}
                        <img
                            src="/influencer/nathika-cutout-tight.webp"
                            alt="Nathika"
                            className="w-full h-auto object-contain drop-shadow-[0_22px_45px_rgba(0,0,0,0.9)] relative z-20"
                            fetchPriority="high"
                        />

                        {/* SINGLE TORN PAPER CTA BUTTON: "COTIZA TU PRESUPUESTO" */}
                        <div className="absolute bottom-[13%] sm:bottom-[14%] inset-x-0 z-30 flex items-center justify-center px-4">
                            <a
                                href="#cta-slide"
                                onClick={(e) => {
                                    e.preventDefault();
                                    openWhatsApp('Cotización de Presupuesto');
                                }}
                                className="[--paper:#EFECE6] hover:[--paper:#D91424] text-[#121316] hover:text-white px-7 sm:px-10 py-3.5 sm:py-4 torn-paper-btn shadow-[0_14px_35px_rgba(0,0,0,0.8)] hover:scale-105 active:scale-95 transition-all cursor-pointer pointer-events-auto"
                            >
                                <span className="font-mono-zine font-bold text-sm sm:text-base md:text-lg tracking-[0.1em] uppercase">
                                    COTIZA TU PRESUPUESTO
                                </span>
                            </a>
                        </div>

                        {/* Bottom Signature + Social Icons Bar (No Player Bar) */}
                        <div className="absolute bottom-5 sm:bottom-6 inset-x-2 sm:inset-x-4 z-30 flex items-center justify-between px-4 pointer-events-auto">
                            <svg viewBox="0 0 140 32" className="w-24 sm:w-28 h-6 text-white/90 ml-[18%] sm:ml-[24%]">
                                <path
                                    d="M4,24 L10,6 L14,22 L22,8 L25,22 L32,12 L36,20 L44,11 L48,19 L58,14 L64,18 L85,14 L112,12"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>

                            <div className="flex items-center gap-2.5 sm:gap-3 text-white">
                                <a
                                    href="https://instagram.com/nathikas.ve"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-[#D91424] hover:scale-110 transition-all"
                                    aria-label="Instagram"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="2" width="20" height="20" rx="5" />
                                        <circle cx="12" cy="12" r="4" />
                                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                                    </svg>
                                </a>
                                <a
                                    href="https://instagram.com/nathikas.ve"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs hover:bg-[#D91424] hover:text-white transition-all"
                                    aria-label="Facebook"
                                >
                                    f
                                </a>
                                <a
                                    href="https://tiktok.com/@nathikas.ve"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-[#D91424] hover:scale-110 transition-all font-mono-zine font-bold text-base leading-none"
                                    aria-label="TikTok / X"
                                >
                                    𝕏
                                </a>
                                <button
                                    onClick={() => openWhatsApp('Contacto directo desde el Hero')}
                                    className="hover:text-[#D91424] hover:scale-110 transition-all cursor-pointer"
                                    aria-label="WhatsApp"
                                >
                                    <MessageCircle size={20} />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Puente atmosférico inferior hacia Sección 2 (suaviza el corte del recorte sin tapar íconos z-30) */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-28 sm:h-36 bg-linear-to-b from-transparent via-[#0B0204]/80 to-[#090204] z-[25]"
                />
            </section>

            {/* =====================================================================
                SECTION 2: SOBRE MÍ — ¡HOLA! SOY NATHIKAS (SERIA, EDITORIAL, CRIMSON PALETTE)
               ===================================================================== */}
            <section
                id="sobre-nathika"
                className="relative w-full py-28 sm:py-36 lg:py-44 bg-linear-to-br from-[#4D0B13] via-[#3A070E] to-[#220408] text-[#F7F3EE] overflow-x-clip"
            >
                {/* Background ambient glow wrapped in overflow-hidden so sticky works */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Puente atmosférico superior desde el Hero (mismo estilo nocturno/carmesí, sin corte duro) */}
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 h-36 sm:h-48 bg-linear-to-b from-[#090204] via-[#240408]/75 to-transparent"
                    />
                    <div className="absolute top-1/4 right-10 w-[550px] h-[550px] bg-[#D91424]/15 rounded-full blur-[160px]" />
                    <div className="absolute bottom-1/4 left-10 w-[450px] h-[450px] bg-[#FF1E38]/10 rounded-full blur-[150px]" />
                    <div className="absolute inset-0 grain-overlay opacity-[0.18]" />
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-6 items-start">
                        
                        {/* LEFT + MIDDLE ZONE (Sticky on Desktop while Giant Text shrinks & docks on Right) */}
                        <div className="lg:col-span-5 lg:sticky lg:top-12 relative flex items-center justify-center lg:justify-between py-4">
                            
                            {/* Carousel frame: editorial double frame + corner registration marks + torn badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 40, rotate: -3 }}
                                whileInView={{ opacity: 1, y: 0, rotate: -1.5 }}
                                viewport={{ once: true, amount: 0.25 }}
                                transition={{ duration: 1.0, ease: EASE_OUT_EXPO }}
                                className="relative shrink-0"
                            >
                            {/* Soft crimson glow behind the frame */}
                            <div aria-hidden className="absolute -inset-6 bg-[#D91424]/25 blur-[60px] rounded-[40px] pointer-events-none" />

                            {/* Subtle handwritten caption tag above the frame */}
                            <div aria-hidden className="absolute -top-7 right-4 z-30 flex items-center gap-2 pointer-events-none -rotate-2">
                                <span className="font-hand text-lg sm:text-xl text-[#FFD9DC] drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                                    mood &amp; cámara ✦
                                </span>
                            </div>

                            {/* Corner registration marks */}
                            <span aria-hidden className="absolute -top-2.5 -left-2.5 w-5 h-5 border-t-2 border-l-2 border-[#FFD9DC]/65 z-30 pointer-events-none" />
                            <span aria-hidden className="absolute -top-2.5 -right-2.5 w-5 h-5 border-t-2 border-r-2 border-[#FFD9DC]/65 z-30 pointer-events-none" />
                            <span aria-hidden className="absolute -bottom-2.5 -left-2.5 w-5 h-5 border-b-2 border-l-2 border-[#FFD9DC]/65 z-30 pointer-events-none" />
                            <span aria-hidden className="absolute -bottom-2.5 -right-2.5 w-5 h-5 border-b-2 border-r-2 border-[#FFD9DC]/65 z-30 pointer-events-none" />

                            {/* Floating torn cutout badge */}
                            <motion.a
                                href="https://instagram.com/nathikas.ve"
                                target="_blank"
                                rel="noreferrer"
                                initial={{ opacity: 0, scale: 0.5, rotate: 16 }}
                                whileInView={{ opacity: 1, scale: 1, rotate: -4 }}
                                viewport={{ once: true, amount: 0.4 }}
                                transition={{ type: 'spring', stiffness: 240, damping: 14, delay: 0.45 }}
                                whileHover={{ scale: 1.06, rotate: 0 }}
                                className="absolute -bottom-4 -left-3 sm:-left-5 z-30 flex items-center gap-2 [--paper:#F9F6F0] torn-ransom-tile text-[#1A0306] px-4 py-2"
                            >
                                <span className="relative flex w-2.5 h-2.5">
                                    <span className="absolute inset-0 rounded-full bg-[#D91424] animate-ping opacity-75" />
                                    <span className="relative w-2.5 h-2.5 rounded-full bg-[#D91424]" />
                                </span>
                                <span className="font-mono-zine text-[11px] font-bold uppercase tracking-[0.14em]">@nathikas.ve</span>
                            </motion.a>

                            {/* Editorial dark-crimson & cream double frame */}
                            <div className="relative p-1.5 rounded-[32px] border border-[#FFD9DC]/25 bg-[#1B0306]/80 shadow-[0_30px_80px_rgba(0,0,0,0.65)]">
                            <div className="relative p-[2px] rounded-[28px] bg-linear-to-br from-[#FFD9DC]/60 via-white/10 to-[#D91424]/70">
                            {/* Viewport Mask for the 15-Degree Right-Tilted Dual Carousels */}
                            <div className="relative w-[280px] sm:w-[350px] md:w-[390px] h-[500px] sm:h-[620px] lg:h-[720px] overflow-hidden rounded-[26px] bg-[#2A050A]">
                                {/* 15-degree tilted inner stage scaled up so rotated corners never show empty space */}
                                <div className="absolute -inset-24 rotate-[15deg] scale-110 flex items-center justify-center">
                                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 w-[340px] sm:w-[410px] h-[960px]">
                                        
                                        {/* Column 1: Scrolls UP infinitely (Tightly packed photos) */}
                                        <div className="relative h-full overflow-hidden">
                                            <div className="animate-marquee-up flex flex-col gap-1.5 sm:gap-2">
                                                {[...CAROUSEL_COL_1, ...CAROUSEL_COL_1].map((img, idx) => (
                                                    <div
                                                        key={`col1-${idx}`}
                                                        className="w-full aspect-[4/4.4] rounded-[16px] sm:rounded-[20px] overflow-hidden border border-white/20 shadow-lg bg-[#2A050A] shrink-0"
                                                    >
                                                        <img
                                                            src={img.src}
                                                            alt={img.alt}
                                                            loading="lazy"
                                                            className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Column 2: Scrolls DOWN infinitely (Tightly packed photos) */}
                                        <div className="relative h-full overflow-hidden">
                                            <div className="animate-marquee-down flex flex-col gap-1.5 sm:gap-2">
                                                {[...CAROUSEL_COL_2, ...CAROUSEL_COL_2].map((img, idx) => (
                                                    <div
                                                        key={`col2-${idx}`}
                                                        className="w-full aspect-[4/4.4] rounded-[16px] sm:rounded-[20px] overflow-hidden border border-white/20 shadow-lg bg-[#2A050A] shrink-0"
                                                    >
                                                        <img
                                                            src={img.src}
                                                            alt={img.alt}
                                                            loading="lazy"
                                                            className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* Top & bottom subtle vignette fade on carousel window */}
                                <div className="absolute inset-x-0 top-0 h-14 bg-linear-to-b from-[#460A11] to-transparent pointer-events-none z-10" />
                                <div className="absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-[#2B050A] to-transparent pointer-events-none z-10" />
                            </div>
                            </div>
                            </div>
                            </motion.div>

                            {/* MIDDLE ZONE: Vertical White/Cream Social Pill Bar right next to the tilted carousels */}
                            <div className="relative -ml-5 sm:-ml-6 lg:ml-0 z-20 bg-[#F9F6F0] text-[#4A0A12] rounded-[34px] py-6 sm:py-8 px-3 sm:px-4 shadow-[0_24px_60px_rgba(0,0,0,0.75)] border border-white flex flex-col items-center justify-between gap-6 sm:gap-8 shrink-0">
                                
                                {/* 1. YouTube */}
                                <a
                                    href="https://tiktok.com/@nathikas.ve"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex flex-col items-center text-center group"
                                >
                                    <div className="w-10 h-8 sm:w-12 sm:h-9 rounded-xl bg-[#4A0A12] group-hover:bg-[#D91424] text-white flex items-center justify-center transition-colors shadow-md">
                                        <Play size={16} className="fill-current ml-0.5" />
                                    </div>
                                    <span className="text-[10px] sm:text-[11px] font-bold text-[#4A0A12]/80 leading-tight mt-1.5">
                                        YouTube
                                    </span>
                                    <span className="text-[10px] font-extrabold text-[#4A0A12]">
                                        Vlogs
                                    </span>
                                </a>

                                {/* 2. Instagram */}
                                <a
                                    href="https://instagram.com/nathikas.ve"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex flex-col items-center text-center group"
                                >
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border-[2.5px] border-[#4A0A12] group-hover:border-[#D91424] text-[#4A0A12] group-hover:text-[#D91424] flex items-center justify-center transition-colors">
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                            <rect x="2" y="2" width="20" height="20" rx="5" />
                                            <circle cx="12" cy="12" r="4" />
                                            <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
                                        </svg>
                                    </div>
                                    <span className="text-[10px] sm:text-[11px] font-bold text-[#4A0A12]/80 leading-tight mt-1.5">
                                        Instagram
                                    </span>
                                    <span className="text-[10px] font-extrabold text-[#4A0A12]">
                                        Comunidad
                                    </span>
                                </a>

                                {/* 3. Facebook */}
                                <a
                                    href="https://instagram.com/nathikas.ve"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex flex-col items-center text-center group"
                                >
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#4A0A12] group-hover:bg-[#D91424] text-white flex items-center justify-center font-anton text-2xl transition-colors shadow-md">
                                        f
                                    </div>
                                    <span className="text-[10px] sm:text-[11px] font-bold text-[#4A0A12]/80 leading-tight mt-1.5">
                                        Facebook
                                    </span>
                                    <span className="text-[10px] font-extrabold text-[#4A0A12]">
                                        Alcance
                                    </span>
                                </a>

                                {/* 4. TikTok */}
                                <a
                                    href="https://tiktok.com/@nathikas.ve"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex flex-col items-center text-center group"
                                >
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#4A0A12] group-hover:bg-[#D91424] text-white flex items-center justify-center transition-colors shadow-md">
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                        </svg>
                                    </div>
                                    <span className="text-[10px] sm:text-[11px] font-bold text-[#4A0A12]/80 leading-tight mt-1.5">
                                        TikTok
                                    </span>
                                    <span className="text-[10px] font-extrabold text-[#4A0A12]">
                                        Viral
                                    </span>
                                </a>

                            </div>
                        </div>

                        {/* RIGHT ZONE: "SOBRE MÍ" + "¡HOLA! SOY NATHIKAS" + EPIC SCROLL BIO (zero layout shift) */}
                        <div className="lg:col-span-7 lg:pl-8 xl:pl-12 pr-2 sm:pr-6 min-w-0 pb-12">

                            {/* Title Block with Giant-to-Docked Epic Entrance */}
                            <EpicScrollBlock initialScale={1.15} initialRotate={-2}>
                                {/* Eyebrow row */}
                                <div className="flex flex-wrap items-center gap-3 mb-4 sm:mb-5">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#C81D25] border border-white/20 font-mono-zine text-[11px] sm:text-xs font-bold uppercase tracking-[0.26em] text-white shadow-md">
                                        02 // SOBRE MÍ
                                    </span>
                                    <span className="font-hand text-xl sm:text-2xl text-[#FFD9DC] -rotate-3">
                                        ~ sin filtros ~
                                    </span>
                                </div>

                                <h2 className="font-anton uppercase leading-[0.88] tracking-tight text-[#F9F6F0] select-none">
                                    <span className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
                                        <span className="text-5xl sm:text-7xl xl:text-[5.8rem] drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]">
                                            ¡HOLA!
                                        </span>
                                        <span className="inline-flex items-center justify-center torn-ransom-tile [--paper:#F3F1EC] text-[#141518] px-3 sm:px-4 py-0.5 sm:py-1 -rotate-2">
                                            <span className="text-4xl sm:text-6xl xl:text-[4.8rem] leading-[0.84]">
                                                SOY
                                            </span>
                                        </span>
                                    </span>

                                    <span className="relative inline-flex items-center mt-2 sm:mt-2.5">
                                        <span className="inline-flex items-center justify-center torn-ransom-tile [--paper:#C81D25] text-white px-4 sm:px-6 py-1 sm:py-1.5 rotate-1">
                                            <span
                                                className="text-5xl sm:text-7xl xl:text-[6rem] leading-[0.84] drop-shadow-[0_3px_0_rgba(255,255,255,0.22)]"
                                                style={{ WebkitTextStroke: '1px rgba(255,255,255,0.25)' }}
                                            >
                                                NATHIKAS
                                            </span>
                                        </span>
                                        <motion.svg
                                            viewBox="0 0 40 40"
                                            animate={{ rotate: [0, 14, -10, 0], scale: [0.95, 1.15, 0.95] }}
                                            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                                            className="w-7 h-7 sm:w-9 sm:h-9 -ml-2 -mt-10 sm:-mt-14 text-[#FFD9DC] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] shrink-0"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M20,2 L23,15 L36,12 L25,20 L34,30 L21,25 L16,38 L15,24 L3,26 L14,18 L6,8 L18,14 Z"
                                                fill="currentColor"
                                            />
                                        </motion.svg>
                                    </span>
                                </h2>
                            </EpicScrollBlock>

                            {/* Bio with vertical scroll-progress rail + numbered markers */}
                            <div ref={bioRef} className="relative mt-10 sm:mt-14 pl-6 sm:pl-9">
                                <span aria-hidden className="absolute left-0 top-1 bottom-1 w-[2px] bg-white/12 rounded-full" />
                                <motion.span
                                    aria-hidden
                                    style={{ scaleY: bioProgress }}
                                    className="absolute left-0 top-1 bottom-1 w-[2px] bg-linear-to-b from-[#FF3347] via-[#FF6B78] to-[#FFD9DC] rounded-full origin-top shadow-[0_0_10px_rgba(255,51,71,0.5)]"
                                />

                                <div className="space-y-8 sm:space-y-10 font-editorial">
                                    {/* Block 01 */}
                                    <EpicScrollBlock initialScale={1.14} initialRotate={-1.5}>
                                        <div className="relative">
                                            <span className="font-mono-zine text-[10px] tracking-[0.24em] text-[#FFD9DC]/65 uppercase block mb-1.5">
                                                01 // IDENTIDAD
                                            </span>
                                            <p className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-white leading-[1.18] tracking-tight">
                                                Me llamo{' '}
                                                <span className="font-serif-display italic text-[#FFD9DC] text-[1.18em] font-normal">
                                                    Nathalia,
                                                </span>{' '}
                                                ¡aunque todos me conocen como{' '}
                                                <HighlightSweep>Nathika!</HighlightSweep>
                                            </p>
                                        </div>
                                    </EpicScrollBlock>

                                    {/* Block 02 */}
                                    <EpicScrollBlock initialScale={1.14} initialRotate={1.4}>
                                        <div className="relative">
                                            <span className="font-mono-zine text-[10px] tracking-[0.24em] text-[#FFD9DC]/65 uppercase block mb-1.5">
                                                02 // PROPÓSITO
                                            </span>
                                            <p className="text-2xl sm:text-3xl xl:text-[34px] font-bold text-[#F7F3EE] leading-[1.22] tracking-tight">
                                                Más allá de crear contenido,{' '}
                                                <HighlightSweep>creo comunidades.</HighlightSweep>{' '}
                                                Comunidades que no se cierran a explorar de todo, porque{' '}
                                                <span className="font-serif-display italic text-[#FFD9DC] text-[1.15em] font-normal">
                                                    aman
                                                </span>{' '}
                                                todo lo que les muestro.
                                            </p>
                                        </div>
                                    </EpicScrollBlock>

                                    {/* Block 03 */}
                                    <EpicScrollBlock initialScale={1.14} initialRotate={-1.2}>
                                        <div className="relative">
                                            <span className="font-mono-zine text-[10px] tracking-[0.24em] text-[#FFD9DC]/65 uppercase block mb-1.5">
                                                03 // ESTILO DE VIDA
                                            </span>
                                            <p className="text-2xl sm:text-3xl xl:text-[34px] font-bold text-[#F7F3EE] leading-[1.22] tracking-tight">
                                                Hago{' '}
                                                <HighlightSweep>lifestyle, sport y travelling</HighlightSweep>{' '}
                                                pero me apasiona mostrarle al mundo un poco de{' '}
                                                <StampWord>¡TODO!</StampWord>
                                            </p>
                                        </div>
                                    </EpicScrollBlock>

                                    {/* Block 04 */}
                                    <EpicScrollBlock initialScale={1.14} initialRotate={1.2}>
                                        <div className="relative">
                                            <span className="font-mono-zine text-[10px] tracking-[0.24em] text-[#FFD9DC]/65 uppercase block mb-1.5">
                                                04 // CONEXIÓN REAL
                                            </span>
                                            <p className="text-xl sm:text-2xl xl:text-[30px] font-semibold text-[#F7F3EE]/95 leading-[1.26] tracking-tight">
                                                Mi comunidad{' '}
                                                <span className="font-serif-display italic text-[#FFD9DC] text-[1.15em] font-normal">
                                                    confía
                                                </span>{' '}
                                                en lo que recomiendo porque vivimos las{' '}
                                                <HighlightSweep>experiencias juntos.</HighlightSweep>
                                            </p>
                                        </div>
                                    </EpicScrollBlock>

                                    {/* Block 05 */}
                                    <EpicScrollBlock initialScale={1.14} initialRotate={-1}>
                                        <div className="relative">
                                            <span className="font-mono-zine text-[10px] tracking-[0.24em] text-[#FFD9DC]/65 uppercase block mb-1.5">
                                                05 // ESTRATEGIA
                                            </span>
                                            <p className="text-xl sm:text-2xl xl:text-[30px] font-semibold text-[#F7F3EE]/95 leading-[1.26] tracking-tight">
                                                Por eso, no aplico formatos repetidos: creo{' '}
                                                <HighlightSweep>estrategias personalizadas</HighlightSweep>{' '}
                                                para que tu marca no solo se vea, sino que{' '}
                                                <span className="font-black text-[#FF3347]">
                                                    impacte y conecte de verdad.
                                                </span>
                                            </p>
                                        </div>
                                    </EpicScrollBlock>
                                </div>

                                {/* Handwritten Signature */}
                                <motion.p
                                    initial={{ opacity: 0, y: 12, rotate: -5 }}
                                    whileInView={{ opacity: 1, y: 0, rotate: -3 }}
                                    viewport={{ once: true, amount: 0.4 }}
                                    transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
                                    className="mt-10 font-hand text-4xl sm:text-5xl text-[#FFD9DC] origin-left drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
                                >
                                    — Nathika ✨
                                </motion.p>
                            </div>

                        </div>

                    </div>
                </div>

                {/* Atmospheric nocturnal bridge: softens deep crimson into dark forest obsidian */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-36 sm:h-48 bg-linear-to-b from-transparent via-[#160507]/85 to-[#080D0A] z-0"
                />
            </section>

            {/* =====================================================================
                SECTION 3: MÉTRICAS Y ESTADÍSTICAS (ACTO 2: HADA · PROFUNDIDAD 4 CAPAS)
               ===================================================================== */}
            <section
                ref={metricsRef}
                id="metricas"
                className="relative w-full py-32 sm:py-44 lg:py-52 bg-[#080D0A] text-[#F4F9F5] overflow-hidden select-none"
            >
                {/* LAYER 1 (z-1): Bosque profundo de fondo (parallax suave al hacer scroll) */}
                <motion.div
                    aria-hidden="true"
                    style={{ scale: forestBgScale, y: forestBgY }}
                    className="absolute inset-0 z-[1] pointer-events-none will-change-transform"
                >
                    <img
                        src={HADA_BG_SRC}
                        alt=""
                        className="w-full h-full object-cover object-[center_30%] brightness-[0.9] contrast-[1.04]"
                    />
                    <div className="absolute inset-0 bg-linear-to-b from-[#080D0A]/90 via-[#102015]/28 to-[#0B150E]/92" />
                </motion.div>

                {/* Rayos crepusculares diagonales desde arriba a la izquierda */}
                <motion.div
                    aria-hidden="true"
                    style={{ opacity: sunbeamsOpacity }}
                    className="absolute -top-24 -left-24 w-[130%] h-[420px] sm:h-[520px] -rotate-[22deg] origin-top-left pointer-events-none mix-blend-screen z-[2]"
                >
                    <div className="w-full h-full bg-linear-to-r from-[#ECF6EE]/30 via-[#C7E0CD]/12 to-transparent blur-2xl" />
                </motion.div>

                {/* Partículas luminosas flotantes en el bosque */}
                <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden z-[3]">
                    {[
                        { left: '14%', top: '26%', delay: 0 },
                        { left: '78%', top: '18%', delay: 0.7 },
                        { left: '84%', top: '44%', delay: 1.3 },
                        { left: '22%', top: '68%', delay: 0.4 },
                        { left: '72%', top: '76%', delay: 1.1 }
                    ].map((sp, i) => (
                        <motion.span
                            key={i}
                            animate={{ y: [0, -14, 0], opacity: [0.25, 0.85, 0.25], scale: [0.8, 1.25, 0.8] }}
                            transition={{ duration: 4.2 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: sp.delay }}
                            style={{ left: sp.left, top: sp.top }}
                            className="absolute w-1.5 h-1.5 rounded-full bg-[#EDF7EF] shadow-[0_0_12px_rgba(220,248,225,0.95)]"
                        />
                    ))}
                </div>

                {/* Puente nocturno superior desde Acto 1 */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-28 sm:h-36 bg-linear-to-b from-[#080D0A] to-transparent z-[4]"
                />

                {/* Nota: Sin z-index en container/grids superiores para que z-[10], z-[15], z-[20], z-[25] y z-[30] intercalen en 3D real */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-10 max-w-6xl relative">

                    {/* 1. CLEAN COOL-WHITE EDITORIAL HEADER */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.25 }}
                        transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
                        className="text-center mb-16 sm:mb-24 lg:mb-28 relative z-[30]"
                    >
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/12 backdrop-blur-md border border-white/25 mb-5 sm:mb-6">
                            <Sparkles size={13} className="text-[#D8F0DD]" />
                            <span className="font-mono-zine text-[10px] sm:text-xs font-bold uppercase tracking-[0.24em] text-[#ECF6EE]">
                                03 // LIBERTAD &amp; FLEXIBILIDAD
                            </span>
                        </div>

                        <h2 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight leading-[0.95] text-[#F4F9F5] drop-shadow-[0_6px_26px_rgba(0,0,0,0.45)]">
                            MÉTRICAS Y <br /> ESTADÍSTICAS
                        </h2>

                        <p className="mt-4 sm:mt-5 font-editorial text-xs sm:text-sm tracking-[0.26em] uppercase text-[#E3EFE6]/90 font-semibold">
                            ÚLTIMOS 30 DÍAS
                        </p>
                    </motion.div>

                    {/* 2. TOP 4 FROSTED GLASS KPI CARDS (Left) + 4-LAYER INTERLEAVED FAIRY DEPTH STAGE (Right / Below on Mobile) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 lg:gap-10 items-stretch mb-16 sm:mb-24 lg:mb-28 relative">

                        {/* Left (lg:col-span-7): 2x2 Frosted KPI Cards (glass backdrop at z-10, crisp typography at z-30) */}
                        <div className="lg:col-span-7 grid grid-cols-2 gap-5 sm:gap-7 lg:gap-8">

                            {/* Card 1: CUENTAS ALCANZADAS (+250K) */}
                            <div className="relative group p-5 sm:p-7 min-h-[165px] sm:min-h-[206px]">
                                <motion.div
                                    aria-hidden="true"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.55, delay: 0.05, ease: EASE_OUT_EXPO }}
                                    className="absolute inset-0 glass-forest-card rounded-[20px] sm:rounded-[24px] z-[10] pointer-events-none transition-transform duration-300 group-hover:-translate-y-1"
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.55, delay: 0.05, ease: EASE_OUT_EXPO }}
                                    className="relative z-[30] text-[#18221A] flex flex-col justify-between h-full transition-transform duration-300 group-hover:-translate-y-1"
                                >
                                    <p className="font-editorial text-xs sm:text-sm md:text-base font-bold uppercase tracking-tight leading-tight text-center text-[#1E2A20]">
                                        CUENTAS <br /> ALCANZADAS
                                    </p>

                                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-auto pt-1">
                                        <span className="font-editorial text-3xl sm:text-4xl xl:text-[2.6rem] font-extrabold tracking-tight text-[#141E16] leading-none">
                                            +250K
                                        </span>
                                        <svg viewBox="0 0 24 38" className="w-4 h-7 sm:w-5 sm:h-9 text-[#7AA367] shrink-0">
                                            <line x1="12" y1="35" x2="12" y2="5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                                            <polyline points="5,12 12,4 19,12" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Card 2: INTERACCIONES (32.4K) */}
                            <div className="relative group p-5 sm:p-7 min-h-[165px] sm:min-h-[206px]">
                                <motion.div
                                    aria-hidden="true"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.55, delay: 0.12, ease: EASE_OUT_EXPO }}
                                    className="absolute inset-0 glass-forest-card rounded-[20px] sm:rounded-[24px] z-[10] pointer-events-none transition-transform duration-300 group-hover:-translate-y-1"
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.55, delay: 0.12, ease: EASE_OUT_EXPO }}
                                    className="relative z-[30] text-[#18221A] flex flex-col justify-between h-full transition-transform duration-300 group-hover:-translate-y-1"
                                >
                                    <p className="font-editorial text-xs sm:text-sm md:text-base font-bold uppercase tracking-tight leading-tight text-center text-[#1E2A20]">
                                        INTERACCIONES
                                    </p>

                                    <div className="relative flex flex-col items-center justify-center my-auto pt-1 pb-1 sm:pb-0">
                                        <span className="font-editorial text-3xl sm:text-4xl xl:text-[2.6rem] font-extrabold tracking-tight text-[#141E16] leading-none">
                                            32.4K
                                        </span>
                                        <svg viewBox="0 0 110 28" className="w-20 sm:w-24 h-6 mt-1 text-[#243326]/75">
                                            <path
                                                d="M18,12 C15,7 9,9 9,14 C9,19 18,24 18,24 C18,24 27,19 27,14 C27,9 21,7 18,12 Z"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.6"
                                            />
                                            <path
                                                d="M84,9 C84,6 88,4 93,4 C98,4 102,6 102,10 C102,13 98,16 93,16 C91,16 89,15.5 87.5,15 L83,18 L84.5,14 C84,12.5 84,11 84,9 Z"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                            />
                                            <circle cx="96" cy="21" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
                                        </svg>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Card 3: SEGUIDORES NETOS (+8,250) */}
                            <div className="relative group p-5 sm:p-7 min-h-[165px] sm:min-h-[206px]">
                                <motion.div
                                    aria-hidden="true"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.55, delay: 0.19, ease: EASE_OUT_EXPO }}
                                    className="absolute inset-0 glass-forest-card rounded-[20px] sm:rounded-[24px] z-[10] pointer-events-none transition-transform duration-300 group-hover:-translate-y-1"
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.55, delay: 0.19, ease: EASE_OUT_EXPO }}
                                    className="relative z-[30] text-[#18221A] flex flex-col justify-between h-full transition-transform duration-300 group-hover:-translate-y-1"
                                >
                                    <p className="font-editorial text-xs sm:text-sm md:text-base font-bold uppercase tracking-tight leading-tight text-center text-[#1E2A20]">
                                        SEGUIDORES <br /> NETOS
                                    </p>

                                    <div className="flex flex-col items-center justify-center my-auto pt-1">
                                        <span className="font-editorial text-3xl sm:text-4xl xl:text-[2.6rem] font-extrabold tracking-tight text-[#141E16] leading-none">
                                            +8,250
                                        </span>
                                        <span className="mt-1.5 font-editorial text-xs sm:text-sm font-medium text-[#2A3A2D]">
                                            (en 30 días)
                                        </span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Card 4: REPRODUCCIONES DE REELS (1.8M) */}
                            <div className="relative group p-5 sm:p-7 min-h-[165px] sm:min-h-[206px]">
                                <motion.div
                                    aria-hidden="true"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.55, delay: 0.26, ease: EASE_OUT_EXPO }}
                                    className="absolute inset-0 glass-forest-card rounded-[20px] sm:rounded-[24px] z-[10] pointer-events-none transition-transform duration-300 group-hover:-translate-y-1"
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.55, delay: 0.26, ease: EASE_OUT_EXPO }}
                                    className="relative z-[30] text-[#18221A] flex flex-col justify-between h-full transition-transform duration-300 group-hover:-translate-y-1"
                                >
                                    <p className="font-editorial text-xs sm:text-sm md:text-base font-bold uppercase tracking-tight leading-tight text-center text-[#1E2A20]">
                                        REPRODUCCIONES <br /> DE REELS
                                    </p>

                                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-auto pt-1">
                                        <span className="font-editorial text-2xl sm:text-4xl xl:text-[2.6rem] font-extrabold tracking-tight text-[#141E16] leading-none">
                                            1.8M
                                        </span>
                                        <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-8 sm:h-8 text-[#1C281E] shrink-0">
                                            <rect x="4" y="6" width="28" height="24" rx="5.5" fill="none" stroke="currentColor" strokeWidth="2.3" />
                                            <line x1="4" y1="13" x2="32" y2="13" stroke="currentColor" strokeWidth="2" />
                                            <line x1="11" y1="6" x2="15" y2="13" stroke="currentColor" strokeWidth="2" />
                                            <line x1="21" y1="6" x2="25" y2="13" stroke="currentColor" strokeWidth="2" />
                                            <polygon points="15,17 15,25 23,21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </motion.div>
                            </div>

                        </div>

                        {/* Right (lg:col-span-5): Synchronized 4-Layer Depth Stage (Layer 2 Body -> Layer 3 Plants -> Layer 4 Hand + CTA) */}
                        <div className="lg:col-span-5 relative min-h-[380px] sm:min-h-[440px] lg:min-h-[444px] flex items-end justify-center">

                            {/* Ethereal back glow anchored behind the fairy */}
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-10 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-radial from-[#D9F5DF]/28 via-[#79B485]/14 to-transparent blur-3xl z-[5]"
                            />

                            {/* LAYER 2 (z-15): Cuerpo de Nathika Hada + Silueta Luminosa (misma escala 764:1024 y parallax fairyY) */}
                            <motion.div
                                aria-hidden="true"
                                style={{ y: fairyY }}
                                className="pointer-events-none absolute left-[46%] lg:left-[40%] -translate-x-1/2 bottom-[-18px] sm:bottom-[-22px] w-[460px] sm:w-[540px] lg:w-[590px] aspect-[764/1024] z-[15] will-change-transform"
                            >
                                <motion.div
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
                                    className="relative w-full h-full"
                                >
                                    <motion.img
                                        src={HADA_BODY_SRC}
                                        alt=""
                                        aria-hidden="true"
                                        animate={{ opacity: [0.28, 0.65, 0.28], scale: [1.015, 1.035, 1.015] }}
                                        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                                        className="absolute inset-0 w-full h-full object-contain fairy-silhouette-glow mix-blend-screen"
                                    />
                                    <motion.img
                                        src={HADA_BODY_SRC}
                                        alt="Nathika Hada - Libertad y Naturaleza"
                                        initial={{ opacity: 0, filter: 'blur(5px) brightness(1.22)' }}
                                        whileInView={{ opacity: 0.98, filter: 'blur(0px) brightness(1.03)' }}
                                        viewport={{ once: true, amount: 0.15 }}
                                        transition={{ duration: 1.0, delay: 0.2, ease: EASE_OUT_EXPO }}
                                        className="relative w-full h-full object-contain drop-shadow-[0_14px_26px_rgba(5,16,9,0.55)]"
                                    />
                                </motion.div>
                            </motion.div>

                            {/* LAYER 3 (z-20): Plantas de primer plano cruzando DELANTE del vestido/cuerpo de Nathika y detrás de su mano */}
                            <motion.div
                                aria-hidden="true"
                                style={{ y: plantsFgY, scale: plantsFgScale }}
                                className="pointer-events-none absolute left-[46%] lg:left-[40%] -translate-x-1/2 bottom-[-18px] sm:bottom-[-22px] w-[460px] sm:w-[540px] lg:w-[590px] aspect-[764/1024] z-[20] will-change-transform"
                            >
                                <div
                                    className="w-full h-full"
                                    style={{
                                        maskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 90%, transparent 100%)',
                                        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 90%, transparent 100%)'
                                    }}
                                >
                                    <div
                                        className="w-full h-full"
                                        style={{
                                            maskImage: 'linear-gradient(to bottom, black 0%, black 85%, transparent 100%)',
                                            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 85%, transparent 100%)'
                                        }}
                                    >
                                        <motion.img
                                            src={HADA_PLANTS_SRC}
                                            alt=""
                                            initial={{ opacity: 0 }}
                                            whileInView={{ opacity: 1 }}
                                            viewport={{ once: true, amount: 0.1 }}
                                            transition={{ duration: 0.9, delay: 0.25, ease: EASE_OUT_EXPO }}
                                            className="w-full h-full object-contain drop-shadow-[0_10px_22px_rgba(4,12,7,0.48)]"
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {/* LAYER 4 (z-25): Mano derecha del hada POR DELANTE de las plantas, sincronizada en Y con Layer 2 para conservar anatomía del brazo */}
                            <motion.div
                                aria-hidden="true"
                                style={{ y: fairyY }}
                                className="pointer-events-none absolute left-[46%] lg:left-[40%] -translate-x-1/2 bottom-[-18px] sm:bottom-[-22px] w-[460px] sm:w-[540px] lg:w-[590px] aspect-[764/1024] z-[25] will-change-transform"
                            >
                                <motion.div
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-full h-full"
                                >
                                    <motion.img
                                        src={HADA_HAND_SRC}
                                        alt=""
                                        initial={{ opacity: 0, filter: 'blur(4px) brightness(1.15)' }}
                                        whileInView={{ opacity: 1, filter: 'blur(0px) brightness(1.03)' }}
                                        viewport={{ once: true, amount: 0.15 }}
                                        transition={{ duration: 1.0, delay: 0.2, ease: EASE_OUT_EXPO }}
                                        className="w-full h-full object-contain drop-shadow-[0_8px_18px_rgba(4,14,8,0.52)]"
                                    />
                                </motion.div>
                            </motion.div>

                            {/* Interactive CTA Pill ("Trabajemos juntos") siempre nítido y clickable en z-32 */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.7, delay: 0.38, ease: EASE_OUT_EXPO }}
                                className="relative z-[32] mb-2 sm:mb-4 lg:mb-3 pointer-events-auto"
                            >
                                <a
                                    href="#reels-carousel"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedService('Campaña Completa 360°');
                                        document.getElementById('reels-carousel')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#F2F9F3]/95 hover:bg-white text-[#18261B] border border-white shadow-[0_12px_30px_rgba(6,22,11,0.5)] backdrop-blur-md transition-all hover:scale-105 whitespace-nowrap group"
                                >
                                    <Sparkles size={14} className="text-[#56895E] group-hover:rotate-12 transition-transform" />
                                    <span className="font-editorial text-xs sm:text-sm font-extrabold tracking-tight">
                                        Trabajemos juntos
                                    </span>
                                    <ArrowRight size={14} className="text-[#56895E] group-hover:translate-x-0.5 transition-transform" />
                                </a>
                            </motion.div>

                        </div>

                    </div>

                    {/* 3. BOTTOM BENTO CARDS: DATOS DEMOGRÁFICOS + ALCANCE GEOGRÁFICO (z-28 sobre follaje inferior) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-9 lg:gap-10 items-stretch relative z-[28]">

                        {/* CARD 1: DATOS DEMOGRÁFICOS */}
                        <motion.div
                            initial={{ opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
                            className="lg:col-span-6 glass-forest-grid-card rounded-[22px] sm:rounded-[26px] p-6 sm:p-8 lg:p-9 text-[#18221A] flex flex-col justify-between"
                        >
                            <h3 className="font-editorial text-lg sm:text-2xl font-bold uppercase tracking-tight text-center text-[#1B261D] mb-6 sm:mb-8">
                                DATOS DEMOGRÁFICOS
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center my-auto">

                                {/* Sub-col 1: RANGO DE EDAD */}
                                <div className="sm:col-span-7 space-y-3.5">
                                    <h4 className="font-editorial text-xs sm:text-sm font-bold uppercase tracking-wide text-[#253327]">
                                        RANGO DE EDAD
                                    </h4>

                                    <div className="space-y-3.5 border-l-2 border-[#465948]/55 pl-2.5 py-0.5">
                                        {[
                                            { label: '18-24', pct: '52%', barWidth: '72%', delay: 0 },
                                            { label: '25-34', pct: '35%', barWidth: '48%', delay: 0.12 },
                                            { label: 'Otros', pct: '13%', barWidth: '20%', delay: 0.24 }
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center gap-2">
                                                <span className="font-editorial text-xs sm:text-sm font-semibold text-[#1E2A20] w-11 shrink-0">
                                                    {item.label}
                                                </span>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: item.barWidth }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 0.85, delay: item.delay, ease: EASE_OUT_EXPO }}
                                                    className="h-5 sm:h-6 hatched-bar-sage border border-[#617863]/55 rounded-[2px]"
                                                />
                                                <span className="font-editorial text-sm sm:text-base font-bold text-[#18221A]">
                                                    {item.pct}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Sub-col 2: GÉNERO */}
                                <div className="sm:col-span-5 flex flex-col items-center">
                                    <h4 className="font-editorial text-xs sm:text-sm font-bold uppercase tracking-wide text-[#253327] mb-3">
                                        GÉNERO
                                    </h4>

                                    <div className="space-y-3.5 w-full max-w-[190px]">
                                        {[
                                            { label: 'MUJERES 65%', rot: '-1.5deg' },
                                            { label: 'HOMBRES 35%', rot: '1.2deg' }
                                        ].map((g) => (
                                            <div key={g.label} className="relative py-2 px-3 text-center">
                                                <svg
                                                    viewBox="0 0 180 46"
                                                    preserveAspectRatio="none"
                                                    className="absolute inset-0 w-full h-full pointer-events-none text-[#84A281]/75"
                                                >
                                                    <ellipse cx="90" cy="23" rx="85" ry="18" fill="none" stroke="currentColor" strokeWidth="1.6" />
                                                    <ellipse cx="90" cy="23" rx="82" ry="16" fill="none" stroke="currentColor" strokeWidth="1.2" transform={`rotate(${g.rot} 90 23)`} />
                                                </svg>
                                                <span className="relative z-10 font-editorial text-xs sm:text-sm font-bold tracking-tight text-[#1A261C]">
                                                    {g.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </motion.div>

                        {/* CARD 2: ALCANCE GEOGRÁFICO */}
                        <motion.div
                            initial={{ opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.65, delay: 0.1, ease: EASE_OUT_EXPO }}
                            className="lg:col-span-6 glass-forest-card rounded-[22px] sm:rounded-[26px] p-6 sm:p-8 lg:p-9 text-[#18221A] flex flex-col justify-between"
                        >
                            <h3 className="font-editorial text-lg sm:text-2xl font-bold uppercase tracking-tight text-center text-[#1B261D] mb-6 sm:mb-8">
                                ALCANCE GEOGRÁFICO
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center my-auto">

                                {/* Left: VENEZUELA (65%) + Botanical-Stone Map */}
                                <div className="sm:col-span-7 flex flex-col items-center">
                                    <div className="glass-forest-pill px-4 py-1.5 rounded-full">
                                        <span className="font-editorial text-sm sm:text-base font-extrabold tracking-tight uppercase text-[#1A261C]">
                                            VENEZUELA (65%)
                                        </span>
                                    </div>

                                    <div className="relative w-full max-w-[235px] pt-2.5 flex items-center justify-center">
                                        <svg viewBox="0 0 260 175" className="w-full h-auto">
                                            {/* Venezuela silhouette in calm sage-stone palette */}
                                            <path
                                                d="M58,22 L72,14 L84,26 L102,26 L124,20 L152,22 L176,18 L194,28 L218,32 L212,48 L228,64 L242,78 L226,96 L236,116 L220,126 L196,120 L186,138 L178,162 L152,166 L138,148 L142,126 L122,122 L96,118 L84,102 L68,94 L56,74 L46,56 L48,36 Z"
                                                fill="#858F84"
                                                fillOpacity="0.88"
                                                stroke="#222E24"
                                                strokeWidth="2.2"
                                                strokeLinejoin="round"
                                            />
                                            <ellipse cx="182" cy="14" rx="7" ry="4" fill="#222E24" />

                                            {/* Delicate curved arrow from "Mi comunidad principal" */}
                                            <path d="M40,122 C44,102 52,92 66,90" fill="none" stroke="#222E24" strokeWidth="1.8" strokeLinecap="round" />
                                            <path d="M59,85 L68,90 L60,96" fill="none" stroke="#222E24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>

                                        <div className="absolute left-0 bottom-2 text-center leading-tight -rotate-2">
                                            <p className="font-hand text-base sm:text-lg text-[#1C281E]">
                                                Mi comunidad <br /> principal
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: ALCANCE INTERNACIONAL (35%) + Clean Frosted Pills */}
                                <div className="sm:col-span-5 flex flex-col items-center text-center space-y-3.5">
                                    <p className="font-editorial text-xs sm:text-sm font-bold uppercase leading-tight text-[#1E2A20] mb-1">
                                        ALCANCE <br /> INTERNACIONAL (35%)
                                    </p>

                                    {['COLOMBIA', 'EE.UU.', 'ESPAÑA'].map((country) => (
                                        <div
                                            key={country}
                                            className="glass-forest-pill w-full max-w-[160px] py-1.5 px-4 rounded-full text-center"
                                        >
                                            <span className="font-editorial text-sm sm:text-base font-extrabold tracking-wide uppercase text-[#18221A]">
                                                {country}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        </motion.div>

                    </div>

                </div>

                {/* Bottom atmospheric bridge back to Act 3 (#servicios) */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-28 sm:h-36 bg-linear-to-b from-transparent via-[#0B150E]/90 to-[#1B0306] z-0"
                />
            </section>

            {/* =====================================================================
                SECTION 4: DEDICATED SERVICES SECTION ("RELÁJATE TÚ QUE YO ME ENCARGO DE:")
               ===================================================================== */}
            <section
                id="servicios"
                className="relative w-full py-28 sm:py-36 lg:py-44 bg-linear-to-b from-[#1B0306] via-[#260509] to-[#140204] text-[#F7F3EE] border-t border-white/10 overflow-hidden"
            >
                <div className="absolute inset-0 halftone-light opacity-20 pointer-events-none" />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#D91424]/12 rounded-full blur-[160px] pointer-events-none" />

                <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-6xl relative z-10">
                    
                    {/* Section Header */}
                    <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-3">
                        <span className="font-editorial text-xs sm:text-sm font-extrabold uppercase tracking-[0.28em] text-[#FF3347] block">
                            SERVICIOS & PRODUCCIÓN 360°
                        </span>
                        <h2 className="font-anton text-6xl sm:text-8xl md:text-9xl uppercase leading-[0.86] tracking-tight text-white">
                            RELÁJATE TÚ QUE YO <br />
                            <span className="text-[#FF3347]">ME ENCARGO DE:</span>
                        </h2>
                    </div>

                    {/* 5 Services Scrapbook / Editorial Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 sm:gap-8">
                        {SERVICES_LIST.map((srv, idx) => {
                            const isLightCard = idx === 0 || idx === 3;
                            const isCreamCard = idx === 2;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 28 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-40px' }}
                                    transition={{ duration: 0.45, delay: idx * 0.08 }}
                                    whileHover={{ y: -6 }}
                                    className={`relative p-7 sm:p-8 rounded-sm shadow-[0_20px_45px_rgba(0,0,0,0.65)] flex flex-col justify-between min-h-[240px] ${
                                        isLightCard
                                            ? '[--paper:#F3F1EC] text-[#141518] torn-paper-card -rotate-1'
                                            : isCreamCard
                                            ? '[--paper:#EFE5B4] text-[#141518] torn-paper-card rotate-1'
                                            : 'chalkboard-grid text-[#F7F3EE] border-2 border-[#B3946E]/60 rotate-0'
                                    }`}
                                >
                                    {/* Decorative washi tape on alternating cards */}
                                    {idx % 2 === 0 ? (
                                        <div className="absolute -top-3 left-8 w-24 h-6 washi-tape-red -rotate-3 pointer-events-none" />
                                    ) : (
                                        <div className="absolute -top-3 right-8 w-24 h-6 washi-tape-beige rotate-6 pointer-events-none" />
                                    )}

                                    <div className="flex items-center justify-between mb-4">
                                        <span
                                            className={`font-anton text-5xl sm:text-6xl leading-none ${
                                                isLightCard || isCreamCard ? 'text-[#B81922]' : 'text-[#FF3347]'
                                            }`}
                                        >
                                            0{idx + 1}
                                        </span>
                                        <span
                                            className={`w-2.5 h-2.5 rounded-full ${
                                                isLightCard || isCreamCard ? 'bg-[#141518]' : 'bg-[#FF3347]'
                                            }`}
                                        />
                                    </div>

                                    <div className="space-y-2.5 my-auto">
                                        <h3
                                            className={`font-anton text-3xl sm:text-4xl uppercase tracking-wide leading-[0.95] ${
                                                isLightCard || isCreamCard ? 'text-[#121316]' : 'text-white'
                                            }`}
                                        >
                                            {srv.bold}
                                        </h3>
                                        <p
                                            className={`text-sm sm:text-base font-medium leading-relaxed ${
                                                isLightCard || isCreamCard ? 'text-[#25262B]' : 'text-[#F4EFEA]/85'
                                            }`}
                                        >
                                            {srv.rest}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* 6th Card: Direct Quote CTA Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.45, delay: 0.4 }}
                            whileHover={{ y: -6 }}
                            className="relative p-7 sm:p-8 rounded-sm [--paper:#8E1B20] text-white torn-paper-card rotate-1 shadow-[0_20px_45px_rgba(0,0,0,0.65)] flex flex-col justify-between min-h-[240px]"
                        >
                            <div className="space-y-2">
                                <span className="font-mono-zine text-xs uppercase tracking-widest text-white/80 block">
                                    // TODO EN UN SOLO LUGAR
                                </span>
                                <h3 className="font-anton text-4xl sm:text-5xl uppercase leading-[0.92]">
                                    ¿CREAMOS ALGO BRUTAL JUNTOS?
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={() => openWhatsApp('Cotización de Servicios 360°')}
                                className="mt-6 w-full py-3.5 px-5 [--paper:#F3F1EC] hover:[--paper:#ffffff] text-[#121316] font-mono-zine font-bold text-xs sm:text-sm uppercase tracking-wider torn-paper-btn shadow-xl transition-transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>COTIZAR TU PRESUPUESTO</span>
                                <ArrowRight size={16} />
                            </button>
                        </motion.div>
                    </div>

                </div>
            </section>

            {/* =====================================================================
                SECTION 5: FULL-WIDTH VERTICAL VIDEO CAROUSEL + DRAG & DROP + CONTACT FORM
               ===================================================================== */}
            <section id="reels-carousel" className="relative w-full max-w-full py-20 sm:py-28 lg:py-36 bg-[#07080A] overflow-hidden select-none border-t border-white/10">
                {/* DRAGGABLE FULL-WIDTH VIEWPORT */}
                <div
                    ref={carouselViewportRef}
                    onPointerDown={() => setShowSwipeHint(false)}
                    className="relative w-full max-w-full overflow-hidden cursor-grab active:cursor-grabbing"
                >
                    {/* TRANSIENT ANIMATED DRAGGING FINGER HINT (Appears & Disappears Automatically) */}
                    <AnimatePresence>
                        {showSwipeHint && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                transition={{ duration: 0.35 }}
                                className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
                            >
                                <div className="relative flex flex-col items-center gap-3 bg-black/55 backdrop-blur-md px-7 py-5 rounded-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
                                    {/* Animated Swipe Track + Finger SVG */}
                                    <div className="relative w-36 h-16 flex items-center justify-center">
                                        {/* Drag trail line */}
                                        <motion.div
                                            animate={{
                                                width: ['20px', '96px', '20px'],
                                                opacity: [0.2, 0.85, 0.2],
                                                x: [28, -8, 28]
                                            }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                            className="h-1.5 rounded-full bg-linear-to-r from-[#FF3347] to-white/80"
                                        />

                                        {/* Animated Hand / Finger Dragging Left */}
                                        <motion.div
                                            animate={{
                                                x: [38, -38, 38],
                                                rotate: [8, -12, 8],
                                                scale: [1, 0.92, 1]
                                            }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                            className="absolute top-1 flex flex-col items-center"
                                        >
                                            {/* Touch ripple circle at fingertip */}
                                            <motion.span
                                                animate={{ scale: [0.8, 1.6, 0.8], opacity: [0.9, 0, 0.9] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                                                className="w-6 h-6 rounded-full border-2 border-[#FF3347] bg-[#FF3347]/30 -mb-3"
                                            />
                                            {/* Hand / Pointing Finger SVG */}
                                            <svg
                                                viewBox="0 0 36 44"
                                                className="w-10 h-12 text-white drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)]"
                                            >
                                                <path
                                                    d="M14,4 C14,1.8 15.8,0 18,0 C20.2,0 22,1.8 22,4 L22,16 L24.5,16 C26.4,16 28,17.6 28,19.5 L28,21 L30.5,21 C32.4,21 34,22.6 34,24.5 L34,31 C34,38.2 28.2,44 21,44 L15,44 C9.5,44 5,39.5 5,34 L5,25 C5,23.1 6.6,21.5 8.5,21.5 C10.4,21.5 12,23.1 12,25 L12,28 L14,28 L14,4 Z"
                                                    fill="currentColor"
                                                    stroke="#121316"
                                                    strokeWidth="2"
                                                />
                                            </svg>
                                        </motion.div>
                                    </div>

                                    <span className="font-mono-zine text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">
                                        DESLIZA PARA VER MÁS
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div
                        ref={carouselTrackRef}
                        drag="x"
                        dragConstraints={dragConstraints}
                        dragElastic={0.08}
                        onDragStart={() => {
                            setIsDragging(true);
                            setShowSwipeHint(false);
                        }}
                        onDragEnd={() => setTimeout(() => setIsDragging(false), 120)}
                        className="flex flex-row items-stretch w-max"
                    >
                        {/* 5 CLEAN VERTICAL VIDEO PANELS SIDE-BY-SIDE (Full device width on mobile!) */}
                        {URBAN_VIDEOS.map((vid, idx) => {
                            const isUnmuted = unmutedVideoIdx === idx;

                            return (
                                <div
                                    key={vid.id}
                                    onClick={() => toggleVideoSound(idx)}
                                    className="relative w-screen sm:w-[48vw] md:w-[33.333vw] lg:w-[25vw] xl:w-[22vw] h-[82vh] sm:h-[85vh] min-h-[620px] max-h-[880px] shrink-0 overflow-hidden bg-[#101217] group"
                                >
                                    <video
                                        ref={(el) => {
                                            videoRefs.current[idx] = el;
                                        }}
                                        src={vid.src}
                                        poster={vid.poster}
                                        autoPlay
                                        loop
                                        muted={!isUnmuted}
                                        playsInline
                                        onLoadedMetadata={(e) => {
                                            if (vid.startTime > 0) {
                                                e.currentTarget.currentTime = vid.startTime;
                                            }
                                        }}
                                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 pointer-events-none"
                                    />
                                </div>
                            );
                        })}

                        {/* 6TH PANEL INSIDE THE SAME CAROUSEL: UPGRADED CONTACT FORM (Marca + Teléfono + Correo + Custom Selector) */}
                        <div
                            id="cta-slide"
                            className="relative w-screen sm:w-[74vw] md:w-[58vw] lg:w-[46vw] xl:w-[40vw] h-[82vh] sm:h-[85vh] min-h-[620px] max-h-[880px] shrink-0 bg-linear-to-br from-[#2B060B] via-[#130609] to-[#08090C] p-6 sm:p-9 md:p-11 flex flex-col justify-between relative overflow-y-auto no-scrollbar"
                        >
                            <div className="space-y-2.5 relative z-10">
                                <h3 className="font-anton text-5xl sm:text-6xl md:text-7xl uppercase text-white leading-[0.88] tracking-tight">
                                    ¿LISTO PARA QUE TU MARCA <span className="text-[#FF3347]">CONECTE DE VERDAD?</span>
                                </h3>
                                <p className="text-xs sm:text-sm text-white/80 font-medium leading-relaxed max-w-md">
                                    Cero formatos repetidos. Armemos una estrategia personalizada donde mi comunidad viva la experiencia de tu marca.
                                </p>
                            </div>

                            {/* CONTACT FORM FIELDS */}
                            <div
                                className="space-y-3 relative z-20 my-auto py-3"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                {/* Field 1: Marca o Proyecto */}
                                <div className="space-y-1">
                                    <label className="font-mono-zine text-[10px] uppercase tracking-widest text-white/75 block">
                                        TU MARCA O PROYECTO
                                    </label>
                                    <input
                                        type="text"
                                        value={brandName}
                                        onChange={(e) => setBrandName(e.target.value)}
                                        placeholder="Ej: Red Bull, Nike, Tu Marca..."
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/65 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#FF3347] transition-colors"
                                    />
                                </div>

                                {/* Field 2 & 3: Teléfono + Correo Electrónico (2 cols on sm+) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div className="space-y-1">
                                        <label className="font-mono-zine text-[10px] uppercase tracking-widest text-white/75 flex items-center gap-1.5">
                                            <Phone size={11} className="text-[#FF3347]" />
                                            <span>TELÉFONO / WHATSAPP</span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={contactPhone}
                                            onChange={(e) => setContactPhone(e.target.value)}
                                            placeholder="+58 412 000 0000"
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-black/65 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#FF3347] transition-colors"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="font-mono-zine text-[10px] uppercase tracking-widest text-white/75 flex items-center gap-1.5">
                                            <Mail size={11} className="text-[#FF3347]" />
                                            <span>CORREO ELECTRÓNICO</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            placeholder="contacto@tumarca.com"
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-black/65 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#FF3347] transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Field 4: Custom Interactive Service Selector */}
                                <div className="space-y-1 relative" ref={selectorRef}>
                                    <label className="font-mono-zine text-[10px] uppercase tracking-widest text-white/75 flex items-center gap-1.5">
                                        <Sparkles size={11} className="text-[#FF3347]" />
                                        <span>¿QUÉ NECESITAS QUE ME ENCARGUE?</span>
                                    </label>

                                    {(() => {
                                        const currentOption =
                                            SERVICE_OPTIONS.find((opt) => opt.value === selectedService) || SERVICE_OPTIONS[0];

                                        return (
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setServiceDropdownOpen((prev) => !prev)}
                                                    className={`w-full px-3.5 py-2.5 rounded-xl bg-black/75 border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                                        serviceDropdownOpen
                                                            ? 'border-[#FF3347] shadow-[0_0_20px_rgba(255,51,71,0.25)]'
                                                            : 'border-white/20 hover:border-white/40'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF3347] shrink-0 shadow-[0_0_8px_#FF3347]" />
                                                        <div className="truncate">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-white truncate">
                                                                    {currentOption.label}
                                                                </span>
                                                                {currentOption.badge && (
                                                                    <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-mono-zine font-bold uppercase bg-[#D91424] text-white rounded-full">
                                                                        {currentOption.badge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-white/55 truncate">
                                                                {currentOption.desc}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <motion.span
                                                        animate={{ rotate: serviceDropdownOpen ? 180 : 0 }}
                                                        transition={{ duration: 0.25 }}
                                                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                                            serviceDropdownOpen
                                                                ? 'bg-[#FF3347] text-white'
                                                                : 'bg-white/10 text-white/80'
                                                        }`}
                                                    >
                                                        <ChevronDown size={16} />
                                                    </motion.span>
                                                </button>

                                                <AnimatePresence>
                                                    {serviceDropdownOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                                            transition={{ duration: 0.18 }}
                                                            className="absolute left-0 right-0 bottom-full mb-2 z-50 bg-[#140407]/98 backdrop-blur-xl border border-[#FF3347]/50 rounded-2xl p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.95)] max-h-[250px] overflow-y-auto"
                                                        >
                                                            {SERVICE_OPTIONS.map((opt) => {
                                                                const active = opt.value === selectedService;
                                                                return (
                                                                    <button
                                                                        key={opt.value}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedService(opt.value);
                                                                            setServiceDropdownOpen(false);
                                                                        }}
                                                                        className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                                                            active
                                                                                ? 'bg-[#D91424]/25 border border-[#FF3347]/50 text-white'
                                                                                : 'hover:bg-white/8 text-white/85 border border-transparent'
                                                                        }`}
                                                                    >
                                                                        <div className="min-w-0">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs sm:text-sm font-bold text-white truncate">
                                                                                    {opt.label}
                                                                                </span>
                                                                                {opt.badge && (
                                                                                    <span className="px-1.5 py-0.5 text-[8px] font-mono-zine font-bold uppercase bg-[#D91424] text-white rounded-full">
                                                                                        {opt.badge}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-[11px] text-white/55 truncate">
                                                                                {opt.desc}
                                                                            </p>
                                                                        </div>

                                                                        <div
                                                                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                                                                active
                                                                                    ? 'bg-[#FF3347] text-white'
                                                                                    : 'border border-white/20 text-transparent'
                                                                            }`}
                                                                        >
                                                                            <Check size={12} strokeWidth={3} />
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => openWhatsApp()}
                                    className="w-full py-3.5 px-6 [--paper:#F4F1EA] hover:[--paper:#D91424] text-[#0B0C0E] hover:text-white font-mono-zine font-bold text-xs sm:text-sm uppercase tracking-wider torn-paper-btn shadow-2xl transition-all flex items-center justify-center gap-3 cursor-pointer mt-1"
                                >
                                    <MessageCircle size={18} />
                                    <span>COTIZAR AHORA CON NATHIKA</span>
                                    <ArrowRight size={18} />
                                </button>
                            </div>

                            <div
                                className="pt-2.5 border-t border-white/15 flex items-center justify-between text-xs font-mono-zine relative z-10"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <span className="text-white/60">¿BUSCAS GOMITAS & CHAMOY?</span>
                                <a
                                    href="/tienda"
                                    className="text-[#FF4D5E] hover:text-white font-bold uppercase flex items-center gap-1 underline underline-offset-4"
                                >
                                    <span>IR A LA TIENDA</span>
                                    <ArrowUpRight size={15} />
                                </a>
                            </div>
                        </div>

                    </motion.div>
                </div>
            </section>

            {/* =====================================================================
                SECTION 6: PREGUNTAS FRECUENTES (FAQ EDITORIAL / REBELDE)
               ===================================================================== */}
            <section
                id="faq"
                className="relative w-full py-28 sm:py-36 lg:py-44 bg-linear-to-b from-[#170306] via-[#1E0408] to-[#0D0204] text-[#F7F3EE] border-t border-white/10 overflow-hidden"
            >
                <div className="absolute inset-0 halftone-light opacity-20 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#D91424]/10 rounded-full blur-[160px] pointer-events-none" />

                <div className="container mx-auto px-4 sm:px-6 lg:px-10 max-w-4xl relative z-10">
                    
                    {/* FAQ Header */}
                    <div className="text-center mb-14 sm:mb-18 space-y-3">
                        <span className="font-editorial text-xs sm:text-sm font-extrabold uppercase tracking-[0.28em] text-[#FF3347] block">
                            DUDAS & COLABORACIONES
                        </span>
                        <h2 className="font-anton text-6xl sm:text-8xl md:text-9xl uppercase leading-[0.86] tracking-tight text-white">
                            PREGUNTAS <span className="text-[#FF3347]">FRECUENTES</span>
                        </h2>
                    </div>

                    {/* Accordion List */}
                    <div className="space-y-4">
                        {INFLUENCER_FAQS.map((item, idx) => {
                            const isOpen = openFaqIdx === idx;
                            return (
                                <div
                                    key={idx}
                                    className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                                        isOpen
                                            ? 'bg-[#2A060B]/90 border-[#FF3347]/70 shadow-[0_16px_40px_rgba(0,0,0,0.65)]'
                                            : 'bg-black/40 border-white/12 hover:border-white/25'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                                        className="w-full px-6 py-5 sm:px-8 sm:py-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span
                                                className={`font-anton text-2xl sm:text-3xl leading-none shrink-0 ${
                                                    isOpen ? 'text-[#FF3347]' : 'text-white/45'
                                                }`}
                                            >
                                                0{idx + 1}
                                            </span>
                                            <span className="font-editorial font-bold text-base sm:text-lg md:text-xl text-white leading-snug">
                                                {item.question}
                                            </span>
                                        </div>

                                        <motion.span
                                            animate={{ rotate: isOpen ? 180 : 0 }}
                                            transition={{ duration: 0.25 }}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                                isOpen
                                                    ? 'bg-[#FF3347] text-white'
                                                    : 'bg-white/10 text-white/75'
                                            }`}
                                        >
                                            <ChevronDown size={18} />
                                        </motion.span>
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.28, ease: 'easeInOut' }}
                                            >
                                                <div className="px-6 pb-6 sm:px-8 sm:pb-7 pt-0 pl-14 sm:pl-18">
                                                    <div className="h-px w-full bg-white/10 mb-4" />
                                                    <p className="text-sm sm:text-base text-[#F7F3EE]/85 leading-relaxed font-medium">
                                                        {item.answer}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>

                </div>
            </section>

            {/* =====================================================================
                SECTION 7: SIMPLE FOOTER (SOCIAL BUTTONS + NORMAL "Nathika" TEXT + COPYRIGHT + ALFREDO MENDOZA LINK)
               ===================================================================== */}
            <footer className="w-full py-12 sm:py-14 bg-[#08090C] border-t border-white/10 text-[#F6F2EB]">
                <div className="container mx-auto px-4 sm:px-6 max-w-5xl flex flex-col items-center text-center gap-6">
                    
                    {/* Social Network Buttons */}
                    <div className="flex items-center justify-center gap-3.5 sm:gap-4">
                        {/* Instagram */}
                        <a
                            href="https://instagram.com/nathikas.ve"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram"
                            className="w-11 h-11 rounded-full bg-white/8 hover:bg-[#D91424] border border-white/15 hover:border-[#D91424] text-white flex items-center justify-center transition-all hover:scale-110"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="2" width="20" height="20" rx="5" />
                                <circle cx="12" cy="12" r="4" />
                                <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
                            </svg>
                        </a>

                        {/* TikTok */}
                        <a
                            href="https://tiktok.com/@nathikas.ve"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="TikTok"
                            className="w-11 h-11 rounded-full bg-white/8 hover:bg-[#D91424] border border-white/15 hover:border-[#D91424] text-white flex items-center justify-center transition-all hover:scale-110"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                            </svg>
                        </a>

                        {/* YouTube */}
                        <a
                            href="https://tiktok.com/@nathikas.ve"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="YouTube"
                            className="w-11 h-11 rounded-full bg-white/8 hover:bg-[#D91424] border border-white/15 hover:border-[#D91424] text-white flex items-center justify-center transition-all hover:scale-110"
                        >
                            <Play size={18} className="fill-current ml-0.5" />
                        </a>

                        {/* Facebook */}
                        <a
                            href="https://instagram.com/nathikas.ve"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Facebook"
                            className="w-11 h-11 rounded-full bg-white/8 hover:bg-[#D91424] border border-white/15 hover:border-[#D91424] text-white flex items-center justify-center font-editorial font-bold text-lg transition-all hover:scale-110"
                        >
                            f
                        </a>

                        {/* WhatsApp */}
                        <button
                            type="button"
                            onClick={() => openWhatsApp('Contacto desde el Footer')}
                            aria-label="WhatsApp"
                            className="w-11 h-11 rounded-full bg-white/8 hover:bg-[#D91424] border border-white/15 hover:border-[#D91424] text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
                        >
                            <MessageCircle size={19} />
                        </button>
                    </div>

                    {/* Brand Name in Normal Text + Copyright & Year */}
                    <div className="space-y-1.5">
                        <p className="font-editorial text-xl sm:text-2xl font-semibold text-white tracking-normal">
                            Nathika
                        </p>
                        <p className="font-editorial text-xs sm:text-sm text-white/60">
                            &copy; {new Date().getFullYear()} Nathika. Todos los derechos reservados.
                        </p>
                    </div>

                    {/* Designed by Alfredo Mendoza */}
                    <div className="pt-4 border-t border-white/10 w-full max-w-xs">
                        <p className="font-editorial text-xs sm:text-sm text-white/60">
                            Diseñado por{' '}
                            <a
                                href="https://alfredomendoza.netlify.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-[#FF3347] hover:text-white transition-colors underline underline-offset-4"
                            >
                                Alfredo Mendoza
                            </a>
                        </p>
                    </div>

                </div>
            </footer>
        </div>
    );
}
