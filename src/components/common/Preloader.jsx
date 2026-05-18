import { useState, useEffect } from 'react';

export default function Preloader() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Increment progress bar smoothly up to 100% in 1.5 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const step = Math.floor(Math.random() * 15) + 10;
        return Math.min(prev + step, 100);
      });
    }, 100);

    // Fade out at 1.7 seconds and remove at 2.2 seconds
    const timer = setTimeout(() => {
      setFadeOut(true);
      const removeTimer = setTimeout(() => {
        setLoading(false);
      }, 500);
      return () => clearTimeout(removeTimer);
    }, 1700);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-all duration-700 ease-in-out ${
        fadeOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Sleek Golden Ambient Glow Background */}
      <div className="absolute w-[450px] h-[450px] bg-premium-gold/5 rounded-full blur-[120px] animate-pulse" />

      {/* Main Branding Container */}
      <div className="relative flex flex-col items-center select-none text-center">
        {/* Animated Golden Logo Container */}
        <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
          {/* Outer glowing pulsing ring */}
          <div className="absolute inset-0 rounded-full border border-premium-gold/30 animate-ping opacity-25" />
          {/* Ring segment loader */}
          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-premium-gold animate-spin" style={{ animationDuration: '1.2s' }} />
          {/* Inner solid circular black container featuring the Tamil logo */}
          <div className="absolute w-24 h-24 bg-black rounded-full border border-premium-gold/35 flex items-center justify-center shadow-xl overflow-hidden">
            <img 
              src="/receipt_logo.webp" 
              alt="Magizhchi Logo" 
              width={96}
              height={96}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover scale-[1.02]" 
              onError={(e) => {
                if (e.target.src !== '/receipt_logo.jpg') {
                  e.target.src = '/receipt_logo.jpg';
                }
              }}
            />
          </div>
        </div>

        {/* Elegant Logo Text */}
        <div className="space-y-1 mb-8">
          <h1 className="font-display text-2xl font-black tracking-[0.25em] text-charcoal uppercase flex items-center justify-center gap-1">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-premium-gold via-gold-light to-premium-gold animate-shimmer">
              Magizhchi
            </span>
          </h1>
          <p className="text-[10px] text-premium-gold/90 tracking-[0.45em] uppercase font-bold">
            Garments
          </p>
        </div>

        {/* Premium Progress Bar */}
        <div className="relative w-48 h-1 bg-charcoal/10 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-premium-gold via-gold-light to-gold-dark"
            style={{ 
              width: '100%',
              transformOrigin: 'left',
              transform: `scaleX(${progress / 100})`,
              transition: 'transform 300ms ease-out',
              willChange: 'transform'
            }}
          />
        </div>
        
        {/* Loading percentage */}
        <p className="text-[9px] font-black text-charcoal/50 tracking-[0.2em] uppercase">
          Initializing Luxury • {progress}%
        </p>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 left-0 right-0 text-center">
        <p className="text-[9px] text-charcoal/30 tracking-[0.3em] uppercase">
          EST. 2026 • Premium Garments Collection
        </p>
      </div>
    </div>
  );
}
