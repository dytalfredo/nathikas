import { useCallback, useEffect, useState, useMemo } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Container, Engine } from "tsparticles-engine";

interface Props {
    id?: string;
    zIndex?: string;
    count?: number;
}

export default function GummyRain({ id = "tsparticles", zIndex = "z-0", count = 15 }: Props) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const particlesInit = useCallback(async (engine: Engine) => {
        await loadSlim(engine);
    }, []);

    const particlesLoaded = useCallback(async (container: Container | undefined) => {
        // console.log(container);
    }, []);

    const particlesOptions = useMemo(() => ({
        fullScreen: { enable: false }, // Restrict to parent container
        fpsLimit: 60,
        particles: {
            number: {
                value: count, // Not too many to distract
                density: {
                    enable: true,
                    area: 800,
                },
            },
            shape: {
                type: "image",
                image: [
                    {
                        src: "/particulas/g1.webp",
                        width: 100,
                        height: 100,
                    },
                    {
                        src: "/particulas/g2.webp",
                        width: 100,
                        height: 100,
                    },
                    {
                        src: "/particulas/g3.webp",
                        width: 100,
                        height: 100,
                    },
                    {
                        src: "/particulas/g4.webp",
                        width: 100,
                        height: 100,
                    },
                    {
                        src: "/particulas/g5.webp",
                        width: 100,
                        height: 100,
                    },
                    {
                        src: "/particulas/g6.webp",
                        width: 100,
                        height: 100,
                    },
                ],
            },
            opacity: {
                value: 0.9,
                random: false,
            },
            size: {
                value: { min: 15, max: 20 },
                random: false,
            },
            move: {
                enable: true,
                speed: 3,
                direction: "bottom",
                random: false,
                straight: false,
                outModes: {
                    default: "out",
                },
                attract: {
                    enable: false,
                    rotateX: 600,
                    rotateY: 1200,
                },
            },
            rotate: {
                value: { min: 0, max: 360 },
                direction: "random",
                animation: {
                    enable: true,
                    speed: 5,
                }
            }
        },
        detectRetina: false,
    }), [count]);

    if (!isMounted) return null;

    const ParticlesComponent = (Particles as any).default || Particles;

    return (
        <ParticlesComponent
            id={id}
            className={`absolute inset-0 ${zIndex} pointer-events-none`}
            init={particlesInit}
            loaded={particlesLoaded}
            options={particlesOptions}
        />
    );
}
