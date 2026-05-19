import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
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
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'date-fns'],
  },
  server: {
    port: 5173,
    strictPort: false,   // auto-use 5174, 5175... if 5173 is busy
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 150,
    sourcemap: false,
    modulePreload: {
      resolveDependencies(url, deps, context) {
        // Eagerly preload ONLY critical core runtime; defer all heavy secondary chunks to keep main thread unblocked
        const excludedList = ['charts', 'ui-lib', 'data-layer', 'telemetry', 'form-utils', 'image-compressor', 'carousel', 'date-utils'];
        return deps.filter(dep => !excludedList.some(ex => dep.includes(ex)));
      }
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/chart.js') || id.includes('node_modules/d3') || id.includes('node_modules/victory')) {
            return 'charts';
          }
          if (id.includes('node_modules/@radix-ui') || id.includes('node_modules/headlessui') || id.includes('node_modules/framer-motion')) {
            return 'ui-lib';
          }
          if (id.includes('node_modules/@sentry')) {
            return 'telemetry';
          }
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod') || id.includes('node_modules/@hookform')) {
            return 'form-utils';
          }
          if (id.includes('node_modules/browser-image-compression')) {
            return 'image-compressor';
          }
          if (id.includes('node_modules/swiper')) {
            return 'carousel';
          }
          if (id.includes('node_modules/date-fns')) {
            return 'date-utils';
          }
          if (id.includes('node_modules')) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
              return 'react-core';
            }
            if (id.includes('node_modules/axios') || id.includes('node_modules/@tanstack') || id.includes('node_modules/react-query')) {
              return 'data-layer';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
