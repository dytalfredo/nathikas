// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import netlify from "@astrojs/netlify";
import tailwindcss from "@tailwindcss/vite";
import AstroPWA from "@vite-pwa/astro";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
    site: 'https://nathikas.com',
    adapter: netlify(),
    devToolbar: {
        enabled: false
    },
    compressHTML: true,
    build: {
        inlineStylesheets: 'always'
    },
    integrations: [
        react(),
        sitemap({
            filter: (page) => !page.includes('/admin'),
        }),
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
                start_url: "/",
                icons: [
                    {
                        src: "/images/logo.webp",
                        sizes: "192x192",
                        type: "image/webp",
                    },
                    {
                        src: "/images/logo.webp",
                        sizes: "512x512",
                        type: "image/webp",
                    },
                    {
                        src: "/images/logo.webp",
                        sizes: "512x512",
                        type: "image/webp",
                        purpose: "any maskable",
                    },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
                navigateFallback: null,
                maximumFileSizeToCacheInBytes: 10485760, // 10MB
            },
        }),
    ],
    vite: {
        // @ts-ignore
        plugins: [tailwindcss()],
        build: {
            minify: true
        }
    },
});
