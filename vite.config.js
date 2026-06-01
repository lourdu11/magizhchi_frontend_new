import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'node:process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shouldAnalyze = process.env.ANALYZE === 'true';

import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';



export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'gzip', ext: '.gz' }),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
    ...(shouldAnalyze ? [visualizer({ filename: './stats.html', open: false })] : []),
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
          // Consolidate ALL lucide-react icons into one chunk (eliminates 20+ tiny HTTP requests)
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          // Let Rollup handle everything else automatically (React, charts, etc.)
          // This prevents CJS interop wrappers from leaking into the wrong chunks.
        },
      },
    },
  },
});
