// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [VitePWA({
      strategies: "generateSW",
      filename: "sw.js",
      registerType: "autoUpdate",
      injectRegister: null,
      devOptions: { enabled: false },
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,png,ico,webmanifest}"],
        // No cached private conversations or API responses: offline has a dedicated draft-only page.
        additionalManifestEntries: [{ url: "/offline", revision: "offline-drafts-v1" }],
        navigateFallback: null,
        runtimeCaching: [
          { urlPattern: ({ request, url }) => request.mode === "navigate" && url.origin === self.location.origin && !/^\/(~oauth|api|auth)/.test(url.pathname), handler: "NetworkFirst", options: { cacheName: "teft-public-navigations", networkTimeoutSeconds: 5, precacheFallback: { fallbackURL: "/offline" }, cacheableResponse: { statuses: [200] }, expiration: { maxEntries: 8, maxAgeSeconds: 86400 } } },
          { urlPattern: ({ url }) => url.origin === self.location.origin && /\/assets\/.*-[\w-]{8,}\.(js|css|png|woff2)$/.test(url.pathname), handler: "CacheFirst", options: { cacheName: "teft-hashed-assets", expiration: { maxEntries: 100, maxAgeSeconds: 2592000 } } },
        ],
      },
    })],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
