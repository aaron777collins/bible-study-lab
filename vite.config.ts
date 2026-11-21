import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { BOOKS } from "./src/lib/canon/books.ts";
import { VERSE_COUNTS } from "./src/lib/canon/versification.generated.ts";

const base = "/bible-study-lab/";

/**
 * Two small speed helpers for the first load:
 * preload the two fonts every page uses, and fill in the book map for the early chapter fetch in index.html.
 */
function firstLoad(): Plugin {
  return {
    name: "bsl-first-load",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const map = JSON.stringify(Object.fromEntries(BOOKS.map((b) => [b.slug, b.osis])));
        const tags: { tag: string; attrs: Record<string, string>; injectTo: "head" }[] = [];
        const bundle = ctx.bundle ?? {};
        for (const file of Object.keys(bundle)) {
          if (/(gentium-book-plus-latin-400-normal|atkinson-hyperlegible-next-latin-wght-normal)-[^/]*\.woff2$/.test(file)) {
            tags.push({ tag: "link", attrs: { rel: "preload", as: "font", type: "font/woff2", crossorigin: "", href: base + file }, injectTo: "head" });
          }
        }
        // the script chunks the first screen needs, so they download in parallel with the main bundle
        const deps = (name: RegExp) => {
          const entry = Object.values(bundle).find((c) => c.type === "chunk" && name.test(c.fileName));
          const seen = new Set<string>();
          const walk = (f: string) => {
            if (seen.has(f)) return;
            seen.add(f);
            const c = bundle[f];
            if (c && c.type === "chunk") c.imports.forEach(walk);
          };
          if (entry) walk(entry.fileName);
          return [...seen].filter((f) => f.endsWith(".js") && !/\/index-/.test(f)).map((f) => base + f);
        };
        const pre = JSON.stringify({ today: deps(/assets\/Today-/), read: deps(/assets\/Read-/) });
        const starts: number[] = [];
        let n = 0;
        for (let b = 0; b < BOOKS.length; b++) {
          starts.push(n);
          n += VERSE_COUNTS[b].reduce((x, y) => x + y, 0);
        }
        return {
          html: html
            .replace("__BOOK_MAP__", map)
            .replace("__PRELOAD__", pre)
            .replace("__BOOK_START__", JSON.stringify(starts))
            .replace("__OSIS__", JSON.stringify(BOOKS.map((b) => b.osis))),
          tags,
        };
      },
    },
  };
}

export default defineConfig({
  base,
  plugins: [
    firstLoad(),
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
            // Data files never change inside v1, so serve them from the cache first. A RegExp is used because functions cannot carry variables into the service worker.
            urlPattern: /\/bible-study-lab\/data\/v1\//,
            handler: "CacheFirst",
            options: { cacheName: "bsl-data-v1", expiration: { maxEntries: 900, maxAgeSeconds: 60 * 60 * 24 * 365, purgeOnQuotaError: true }, cacheableResponse: { statuses: [200] } },
          },
          {
            urlPattern: /\.woff2$/,
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
