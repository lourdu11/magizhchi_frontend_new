// ─── Console Noise Filter (Razorpay/Browser clutter) ───
if (typeof window !== 'undefined') {
  const noisePatterns = [
    'react-devtools',
    'x-rtb-fingerprint-id',
    'request-id',
    'accelerometer',
    'devicemotion',
    'deviceorientation',
    'preloaded using link preload',
    'Node cannot be found',
    'Permissions policy',
    'Third-party cookie',
    'refused to get unsafe header',
    'Violation',
  ];

  // Aggressive Global Noise Suppression
  if (process.env.NODE_ENV === 'production' || true) {
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalLog = console.log;

    const shouldSilence = (args) => {
      const msg = args.map(a => {
        try { return typeof a === 'string' ? a : (a?.message || JSON.stringify(a)); }
        catch { return ''; }
      }).join(' ');
      return noisePatterns.some(p => msg.toLowerCase().includes(p.toLowerCase()));
    };

    console.warn = (...args) => { if (!shouldSilence(args)) originalWarn(...args); };
    console.error = (...args) => { if (!shouldSilence(args)) originalError(...args); };
    console.log = (...args) => { if (!shouldSilence(args)) originalLog(...args); };

    // Catch unhandled promise rejections (often from SDKs)
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason?.message || String(event.reason);
      if (noisePatterns.some(p => reason.toLowerCase().includes(p.toLowerCase()))) {
        event.preventDefault();
      }
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
      if (noisePatterns.some(p => event.message.toLowerCase().includes(p.toLowerCase()))) {
        event.preventDefault();
      }
    }, true);
  }
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            gutter={8}
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1A1A1A',
                color: '#F4E5C2',
                border: '1px solid #D4AF37',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
              },
              success: {
                iconTheme: { primary: '#D4AF37', secondary: '#1A1A1A' },
              },
              error: {
                iconTheme: { primary: '#DC2626', secondary: '#fff' },
                style: { borderColor: '#DC2626' },
              },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>
);
