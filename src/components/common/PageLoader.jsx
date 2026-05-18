export default function PageLoader() {
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
              src="/receipt_logo.jpg" 
              alt="Magizhchi Logo" 
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
        <p className="text-[8px] text-charcoal/40 tracking-[0.25em] uppercase mt-4 animate-pulse">
          Loading Luxury...
        </p>
      </div>
    </div>
  );
}
