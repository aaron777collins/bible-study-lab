import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

const base = "/bible-study-lab/";

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Bible Study Lab",
        short_name: "Bible Study",
        description: "Read the Bible, explore cross references, keep private notes and share Scripture. Free, no account.",
        lang: "en",
        start_url: `${base}#/`,
        scope: base,
        display: "standalone",
        background_color: "#f5f7fa",
        theme_color: "#2a4a96",
        categories: ["education", "books", "lifestyle"],
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "icon.svg", sizes: "any", type: "image/svg+xml" },
        ],
      },
      workbox: {
        // The app shell, fonts for Latin, Greek and Hebrew, and the small data files every visit needs.
        globPatterns: [
          "**/*.{js,css,html,svg,png,webmanifest}",
          "**/*-latin-*.woff2",
          "**/*-latin-ext-*.woff2",
          "**/*-greek-*.woff2",
          "**/*-hebrew-*.woff2",
          "data/v1/{votd,files,manifest,translations}.json",
          "data/v1/plans/*.json",
          "data/v1/xref/summary.json",
        ],
        globIgnores: ["**/node_modules/**"],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 3_000_000,
        runtimeCaching: [
          {
            // Data files never change inside v1, so serve them from the cache first.
            urlPattern: ({ url }) => url.pathname.startsWith(`${base}data/v1/`),
            handler: "CacheFirst",
            options: { cacheName: "bsl-data-v1", expiration: { maxEntries: 900, maxAgeSeconds: 60 * 60 * 24 * 365, purgeOnQuotaError: true }, cacheableResponse: { statuses: [200] } },
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith(".woff2"),
            handler: "CacheFirst",
            options: { cacheName: "bsl-fonts", expiration: { maxEntries: 40 }, cacheableResponse: { statuses: [200] } },
          },
        ],
      },
    }),
  ],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  build: { target: "es2022", sourcemap: false },
  worker: { format: "es" },
});
