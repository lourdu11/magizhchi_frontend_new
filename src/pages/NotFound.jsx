import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Compass, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>404 — Page Not Found | Magizhchi Garments</title>
      </Helmet>
      
      <div className="min-h-dvh bg-white text-charcoal flex items-center justify-center relative overflow-hidden px-4 py-12">
        {/* Sleek Golden Ambient Glow Backgrounds */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-premium-gold/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-premium-gold/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1.5s' }} />

        {/* Animated Background Grid Lines for Luxury Texture */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        {/* Main Content Card Container */}
        <div className="relative z-10 max-w-xl w-full bg-white/80 border border-premium-gold/25 backdrop-blur-md rounded-[32px] p-4 md:p-8 md:p-12 text-center shadow-2xl relative overflow-hidden group">
          {/* Inner Light Sweep Effect */}
          <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-charcoal/5 to-transparent skew-x-12 transition-all duration-1000 group-hover:left-[150%]" />

          {/* Micro-logo top icon */}
          <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full border border-premium-gold/30 animate-ping opacity-30" />
            <div className="absolute w-20 h-20 bg-black rounded-full border border-premium-gold/25 flex items-center justify-center shadow-lg overflow-hidden">
              <img 
                src="/receipt_logo.webp" 
                alt="Magizhchi Logo" 
                width={112}
                height={112}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover scale-[1.02]" 
              />
            </div>
          </div>

          {/* Huge Glowing 404 Text */}
          <div className="relative mb-6">
            <h1 className="text-8xl md:text-9xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-premium-gold via-gold-light to-gold-dark drop-shadow-[0_10px_20px_rgba(212,175,55,0.15)] select-none">
              404
            </h1>
            <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[12vw] md:text-[6rem] font-black text-charcoal/5 tracking-wider select-none pointer-events-none uppercase">
              LOST
            </p>
          </div>

          {/* Error Message */}
          <div className="space-y-3 mb-8">
            <h2 className="text-2xl font-bold font-display text-charcoal uppercase tracking-wider">
              Lost in Luxury
            </h2>
            <p className="text-xs text-charcoal/70 leading-relaxed max-w-sm mx-auto">
              The page you are looking for has either been moved, cataloged differently, or does not exist in our system. Let us guide you back.
            </p>
          </div>

          {/* Premium Interactive Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/" 
              className="w-full sm:w-auto px-4 sm:px-6 py-3 rounded-full bg-gradient-to-r from-premium-gold via-gold-light to-premium-gold hover:from-gold-light hover:to-premium-gold text-charcoal font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-lg shadow-premium-gold/15 flex items-center justify-center gap-2 group/btn"
            >
              <ArrowLeft size={14} className="transition-transform group-hover/btn:-translate-x-1" />
              Go Home
            </Link>
            <Link 
              to="/collections" 
              className="w-full sm:w-auto px-4 sm:px-6 py-3 rounded-full bg-charcoal/5 border border-charcoal/10 hover:border-premium-gold/30 hover:bg-charcoal/10 text-charcoal font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ShoppingBag size={14} className="text-premium-gold" />
              Browse Products
            </Link>
          </div>

          {/* Interactive footer links with luxury look */}
          <div className="mt-10 pt-8 border-t border-charcoal/10 flex justify-center gap-6 text-[10px] uppercase font-bold tracking-widest text-charcoal/40">
            <Link to="/about" className="hover:text-premium-gold transition-colors">About Us</Link>
            <span className="text-charcoal/20">•</span>
            <Link to="/contact" className="hover:text-premium-gold transition-colors">Contact</Link>
            <span className="text-charcoal/20">•</span>
            <Link to="/track-order" className="hover:text-premium-gold transition-colors">Track Order</Link>
          </div>
        </div>
      </div>
    </>
  );
}
