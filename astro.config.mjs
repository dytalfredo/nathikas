// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import AstroPWA from "@vite-pwa/astro";

// https://astro.build/config
export default defineConfig({
    integrations: [
        react(),
        AstroPWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.svg", "robots.txt"],
            manifest: {
                name: "Nathikas",
                short_name: "Nathikas",
                description: "Nathikas - Sabor mexicano que explota",
                theme_color: "#FDF6E3",
                background_color: "#FDF6E3",
                display: "standalone",
                start_url: "/shop",
                icons: [
                    {
                        src: "/images/logo.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "/images/logo.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "/images/logo.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
                navigateFallback: null,
            },
        }),
    ],
    vite: {
        // @ts-ignore
        plugins: [tailwindcss()],
    },
});
