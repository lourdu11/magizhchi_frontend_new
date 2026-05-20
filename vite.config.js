import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'gzip', ext: '.gz' }),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
    {
      name: 'non-blocking-css',
      transformIndexHtml(html) {
        return html.replace(
          /<link rel="stylesheet" ([^>]*?)href="([^"]+?\.css)"([^>]*?)>/g,
          '<link rel="stylesheet" $1href="$2"$3 media="print" onload="this.media=\'all\'">'
        );
      }
    }
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
    // Guarantee a single copy of React so CJS interop wrappers (e.g. inside recharts)
    // don't create a duplicate React module that every user-facing page must import.
    dedupe: ['react', 'react-dom', 'react-dom/server', 'react-router-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'date-fns'],
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true, secure: false, cookieDomainRewrite: 'localhost' },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true, secure: false },
    },
  },

  build: {
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── 1. React core FIRST — highest priority so CJS interop helpers
          //       for React (used inside recharts, framer-motion, etc.) land here
          //       and not inside the charts chunk. ──────────────────────────────
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/react-router-dom/') ||
            id.includes('node_modules/scheduler/') ||
            // React 18 store shim — required by React, zustand, tanstack, recharts
            id.includes('node_modules/use-sync-external-store/')
          ) {
            return 'react-core';
          }

          // ── 2. Data-fetching layer ──────────────────────────────────────────
          if (
            id.includes('node_modules/axios') ||
            id.includes('node_modules/@tanstack') ||
            id.includes('node_modules/react-query')
          ) {
            return 'data-layer';
          }

          // ── 3. Framer-motion isolated so its loading can be deferred ────────
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }

          // ── 4. UI component libraries ────────────────────────────────────────
          if (id.includes('node_modules/@radix-ui') || id.includes('node_modules/headlessui')) {
            return 'ui-lib';
          }

          // ── 5. Narrow-purpose utilities ───────────────────────────────────────
          if (id.includes('node_modules/@sentry')) return 'telemetry';
          if (
            id.includes('node_modules/react-hook-form') ||
            id.includes('node_modules/zod') ||
            id.includes('node_modules/@hookform')
          ) return 'form-utils';
          if (id.includes('node_modules/browser-image-compression')) return 'image-compressor';
          if (id.includes('node_modules/swiper')) return 'carousel';
          if (id.includes('node_modules/date-fns')) return 'date-utils';
          if (id.includes('node_modules/lucide-react')) return 'icons';

          // ── 6. VENDOR — catch ALL other node_modules BEFORE charts ───────────
          //    Shared transitive deps (d3 sub-packages, tiny-invariant, clsx, …)
          //    that recharts and user-pages both need MUST land in vendor, not
          //    inside charts.  If charts were listed first, Rollup would put those
          //    shared modules inside charts and force every user page to import it.
          if (id.includes('node_modules') && !id.includes('node_modules/recharts')) {
            return 'vendor';
          }

          // ── 7. Charts LAST — only recharts-specific code ends up here ────────
          //    Because vendor already claimed all shared transitive deps, this chunk
          //    is now a pure recharts-only bundle loaded solely on admin pages.
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
        },
      },
    },
  },
});

