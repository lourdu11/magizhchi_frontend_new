import './storage-polyfill';
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
    'Failed to decode downloaded font',
    'OTS parsing error',
    'credentials mode does not match',
    'Permissions policy violation',
  ];

  // Only run noise filter in development to keep production main-thread lean
  if (import.meta.env.DEV) {
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
  }
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css';
// ─── Sentry Frontend Initialization (Deferred to prevent main-thread blocking) ───
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn && sentryDsn !== "https://placeholder@sentry.io/placeholder") {
  const initSentry = async () => {
    try {
      const Sentry = await import("@sentry/react");
      Sentry.init({
        dsn: sentryDsn,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        tracesSampleRate: 0.1,         // 10% traces to save CPU/network
        replaysSessionSampleRate: 0.0, // Disable continuous session replay recording
        replaysOnErrorSampleRate: 1.0, // Capture replays only when errors occur
      });
    } catch (err) {
      console.error("Failed to initialize Sentry:", err);
    }
  };

  if (document.readyState === 'complete') {
    initSentry();
  } else {
    window.addEventListener('load', () => {
      setTimeout(initSentry, 1000); // Boot Sentry 1s after load to yield main thread to layout/paint
    });
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
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
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
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
