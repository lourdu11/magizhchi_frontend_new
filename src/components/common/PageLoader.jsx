import { useState, useEffect } from 'react';

export default function PageLoader() {
  const [showRetry, setShowRetry] = useState(false);
  const [showForceRetry, setShowForceRetry] = useState(false);

  useEffect(() => {
    // After 8 seconds: show "Taking too long?" hint
    const hintTimer = setTimeout(() => setShowRetry(true), 8000);
    // After 15 seconds: show full retry button (force escape from infinite loading)
    const forceTimer = setTimeout(() => setShowForceRetry(true), 15000);

    return () => {
      clearTimeout(hintTimer);
      clearTimeout(forceTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md">
      {/* Sleek Golden Ambient Glow Background */}
      <div className="absolute w-[300px] h-[300px] bg-premium-gold/5 rounded-full blur-[80px] animate-pulse" />

      {/* Main Spinner Container */}
      <div className="relative flex flex-col items-center select-none text-center">
        {/* Animated Golden Logo Container */}
        <div className="relative w-24 h-24 mb-5 flex items-center justify-center">
          {/* Ring segment loader */}
          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-premium-gold animate-spin" style={{ animationDuration: '1s' }} />
          {/* Inner solid circular black container featuring the Tamil logo */}
          <div className="absolute w-20 h-20 bg-black rounded-full border border-premium-gold/25 flex items-center justify-center shadow-lg overflow-hidden animate-pulse">
            <img 
              src="/receipt_logo.webp" 
              alt="Magizhchi Logo" 
              width={80}
              height={80}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover scale-[1.02]" 
            />
          </div>
        </div>

        {/* Elegant Logo Text */}
        <div className="space-y-0.5">
          <h2 className="font-display text-lg font-black tracking-[0.25em] text-charcoal uppercase">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-premium-gold via-gold-light to-premium-gold">
              Magizhchi
            </span>
          </h2>
          <p className="text-[9px] text-premium-gold/90 tracking-[0.4em] uppercase font-bold">
            Garments
          </p>
        </div>
        
        {/* Subtle loading caption */}
        {!showRetry && (
          <p className="text-[8px] text-charcoal/40 tracking-[0.25em] uppercase mt-4 animate-pulse">
            Loading Luxury...
          </p>
        )}

        {/* Timeout Hint — appears after 8 seconds */}
        {showRetry && !showForceRetry && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-5 py-2 text-[10px] text-premium-gold/80 tracking-[0.15em] uppercase font-bold hover:text-premium-gold transition-colors animate-fade-in-up"
          >
            Taking too long? Tap to reload
          </button>
        )}

        {/* Force Retry — appears after 15 seconds (escapes infinite loading) */}
        {showForceRetry && (
          <div className="mt-6 flex flex-col items-center gap-3 animate-fade-in-up">
            <p className="text-xs text-charcoal/50 font-medium">
              Slow connection detected
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-charcoal text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg hover:bg-charcoal/90 transition-all active:scale-95"
            >
              Reload Page
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="text-[10px] text-charcoal/40 uppercase tracking-widest font-bold hover:text-charcoal/60 transition-colors"
            >
              Go to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
