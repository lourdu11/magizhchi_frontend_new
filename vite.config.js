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
    chunkSizeWarningLimit: 1500,
    sourcemap: false,
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — must be first so CJS interop wrappers land here
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-core';
          }

          // Consolidate ALL lucide-react icons into one chunk (eliminates 20+ tiny HTTP requests)
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }

          // Data fetching layer
          if (
            id.includes('node_modules/axios') ||
            id.includes('node_modules/@tanstack')
          ) {
            return 'data-layer';
          }

          // Framer-motion isolated (only loaded by admin/review pages)
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }

          // Recharts isolated (only loaded by admin analytics)
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'charts';
          }
        },
      },
    },
  },
});

