import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// base: "./" keeps asset paths relative so the build works on any static host (GitHub Pages, Netlify, Vercel).
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "Full-Stack Mastery",
        short_name: "FS Mastery",
        description: "Databases, React, Next.js, Node and NestJS taught one idea per screen, with a SQL engine that runs offline.",
        theme_color: "#2563eb",
        background_color: "#f4f6f9",
        display: "standalone",
        orientation: "any",
        start_url: "./",
        scope: "./",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Cache everything the app needs, including the 1 MB SQLite WebAssembly engine.
        globPatterns: ["**/*.{js,css,html,wasm,png,svg,ico,woff2}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: "index.html",
      },
    }),
  ],
  test: { environment: "node" },
} as any);
