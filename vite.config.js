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
    chunkSizeWarningLimit: 1500, // Increase limit to avoid warnings, let Vite do its job
    sourcemap: false,
    modulePreload: false,
  },
});

