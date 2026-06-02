import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Truck, RefreshCw, Shield, ShoppingBag, Sparkles, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { productService, bannerService, categoryService } from '../services';
import ProductCard from '../components/product/ProductCard';
import SkeletonCard from '../components/product/SkeletonCard';
import SafeImage from '../components/common/SafeImage';

const CATEGORIES = [
  { name: 'Shirts', slug: 'shirts', img: 'https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0045.jpg?tr=w-400,h-500,q-80,f-webp', items: '120+ Items' },
  { name: 'T-Shirts', slug: 't-shirts', img: 'https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0045.jpg?tr=w-400,h-500,q-80,f-webp', items: '80+ Items' },
  { name: 'Jeans', slug: 'jeans', img: 'https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0057.jpg?tr=w-400,h-500,q-80,f-webp', items: '50+ Items' },
  { name: 'Formals', slug: 'formals', img: 'https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0054.jpg?tr=w-400,h-500,q-80,f-webp', items: '40+ Items' }
];

const DEFAULT_SLIDES = [
  {
    id: "default-hero",
    title: "Premium Casual\nPants Collection",
    subtitle: "Modern comfort and effortless style for everyday wear.",
    accent: "New Arrival",
    img: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1440&auto=format&fit=crop",
    mobileImg: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=800&auto=format&fit=crop",
    cta: 'Shop Now',
    ctaLink: '/collections/pants',
    fit: 'cover',
    pos: 'top',
    scale: 1,
    gravity: 'north',
    mobileFit: 'cover',
    mobilePos: 'center',
    mobileScale: 1,
    mobileGravity: 'auto'
  }
];

export default function Home() {
  const [heroIdx, setHeroIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [visibleCount, setVisibleCount] = useState(4);
  const glowRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: featuredData, isLoading: loadingFeatured } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getProducts({ isFeatured: 'true', limit: 8 }).then(r => r.data.data?.data || r.data.data || []),
  });

  const { data: allProductsData } = useQuery({
    queryKey: ['products', 'latest'],
    queryFn: () => productService.getProducts({ limit: 8 }).then(r => r.data.data?.data || r.data.data || []),
    enabled: !loadingFeatured && (!featuredData || (Array.isArray(featuredData) && featuredData.length === 0)),
  });

  const { data: bannersData, isLoading: loadingBanners } = useQuery({
    queryKey: ['banners', 'active'],
    queryFn: () => bannerService.getActiveBanners().then(r => r.data.data),
    select: (data) => (data || [])
      .filter(b => b.isActive)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
  });

  const { data: catsData, isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories().then(r => r.data.data?.categories || r.data.data || []),
  });

  const featured = (featuredData?.length > 0) ? featuredData : (allProductsData || []);

  // Stable category array to prevent CLS (Layout Shift) when loading dynamic categories
  const rawCats = catsData || [];
  const homeCategories = [...rawCats.slice(0, 4)];
  if (homeCategories.length < 4) {
    const needed = 4 - homeCategories.length;
    const fallbackItems = CATEGORIES.filter(c => !homeCategories.some(h => h.slug === c.slug));
    homeCategories.push(...fallbackItems.slice(0, needed));
  }
  
  // Transform dynamic banners to match Hero layout
  const dynamicSlides = bannersData?.map(b => ({
    id: b._id,
    title: b.title.includes(' ') && !b.title.includes('\n') ? b.title.replace(' ', '\n') : b.title,
    subtitle: b.subtitle || "Premium Quality & Timeless Style",
    accent: b.accent || (b.type === 'hero' ? 'New Arrival' : 'Special Offer'),
    img: b.desktopImage,
    mobileImg: b.mobileImage || b.desktopImage,
    cta: 'Shop Now',
    ctaLink: b.link,
    fit: b.desktopFit || 'cover',
    pos: b.desktopPos || 'center',
    scale: b.desktopScale || 1,
    gravity: b.desktopGravity || 'auto',
    mobileFit: b.mobileFit || b.desktopFit || 'cover',
    mobilePos: b.mobilePos || b.desktopPos || 'center',
    mobileScale: b.mobileScale || b.desktopScale || 1,
    mobileGravity: b.mobileGravity || b.desktopGravity || 'auto'
  })) || [];

  const slides = dynamicSlides.length > 0 ? dynamicSlides : DEFAULT_SLIDES;

  useEffect(() => {
    if (isMobile) return;
    let rafId;
    const handleMouseMove = (e) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (glowRef.current) {
          glowRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
          glowRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
        }
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [isMobile]);

  // Auto-play carousel (Disabled on mobile to reduce main-thread tasks)
  useEffect(() => {
    if (isMobile) return;
    const timer = setInterval(() => {
      setHeroIdx(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, isMobile]);

  // Reset index if slides count changes (e.g. from 4 demo to 1 real)
  useEffect(() => {
    if (heroIdx >= slides.length) {
      setHeroIdx(0);
    }
  }, [slides.length, heroIdx]);

  return (
    <div className="overflow-x-hidden relative">
      <Helmet>
        <title>MAGIZHCHI GARMENTS — Premium Men's Wear</title>
      </Helmet>

      {/* Global Mouse Glow */}
      <div 
        ref={glowRef}
        className="fixed inset-0 pointer-events-none z-[1] transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(600px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(212, 175, 55, 0.03), transparent 80%)'
        }}
      />


      {/* ── Hero Section ── */}
      {loadingBanners ? (
        <section className="relative h-[65vh] md:h-[80vh] w-full bg-charcoal overflow-hidden flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-12 h-12 text-premium-gold animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 animate-pulse">Loading Hero Banner...</p>
          </div>
        </section>
      ) : (
        slides.length > 0 && (
          <section className="relative h-[65vh] md:h-[80vh] w-full bg-charcoal overflow-hidden p-0 m-0">
            <div 
              key={heroIdx}
              className={`absolute inset-0 w-full h-full p-0 m-0 ${heroIdx === 0 ? '' : 'animate-fade-scale-in'}`}
            >
              {(() => {
                const currentFit = isMobile ? (slides[heroIdx]?.mobileFit || 'cover') : (slides[heroIdx]?.fit || 'cover');
                const isContain = currentFit === 'contain';
                const currentSrc = isMobile ? (slides[heroIdx]?.mobileImg || slides[heroIdx]?.img) : slides[heroIdx]?.img;
                
                return (
                    <>
                      {/* Main Focus Image */}
                    <SafeImage 
                      src={currentSrc} 
                      alt="" 
                      className="absolute inset-0 w-full h-full"
                      width={isMobile ? 480 : 1440} 
                      height={isMobile ? 720 : 960}
                      quality={heroIdx === 0 ? (isMobile ? 45 : 60) : 40}
                      fetchPriority="high"
                      loading="eager"
                      style={{ 
                        objectFit: currentFit,
                        objectPosition: isMobile ? (slides[heroIdx]?.mobilePos || 'center') : (slides[heroIdx]?.pos || 'center'),
                        transform: `scale(${isMobile ? (slides[heroIdx]?.mobileScale || 1) : (slides[heroIdx]?.scale || 1)})`
                      }}
                      crop={isContain ? undefined : 'fill'}
                      gravity={isContain ? undefined : (isMobile ? slides[heroIdx]?.mobileGravity : slides[heroIdx]?.gravity)}
                      aspect={isContain ? undefined : (isMobile ? '4:5' : '21:9')}
                      sizes="100vw"
                    />
                  </>
                );
              })()}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent pointer-events-none" />
            </div>

            <div className="relative z-10 container-custom h-full flex flex-col justify-center pt-20">
              <div className="max-w-3xl hover:scale-[1.02] transition-transform duration-500">
                <div className="flex items-center gap-2 mb-6" style={{ transform: "translateZ(30px)" }}>
                  <div className="w-10 h-[1px] bg-premium-gold" />
                  <span className="text-premium-gold font-black uppercase tracking-[0.4em] text-[10px]">{slides[heroIdx]?.accent}</span>
                </div>
                <h1 className="text-5xl md:text-8xl font-black text-white leading-[0.9] mb-8 whitespace-pre-line tracking-tighter" style={{ transform: "translateZ(60px)" }}>
                  {slides[heroIdx]?.title}
                </h1>
                <p className="text-white/80 text-base md:text-xl mb-10 max-w-lg leading-relaxed font-medium" style={{ transform: "translateZ(80px)" }}>
                  {slides[heroIdx]?.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4" style={{ transform: "translateZ(100px)" }}>
                  <Link to="/collections" className="btn-gold group">
                    Shop The Collection <ArrowRight size={18} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link to="/about" className="px-8 py-4 bg-white/10 backdrop-blur-md text-white font-bold rounded-2xl border border-white/20 hover:bg-white/20 transition-all text-center">
                    Our Story
                  </Link>
                </div>
              </div>
            </div>

            {/* Hero Nav */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
              {slides.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setHeroIdx(i)} 
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 w-3 rounded-full transition-all duration-500 origin-center ${i === heroIdx ? 'scale-x-[4] bg-premium-gold' : 'bg-white/30'}`} 
                />
              ))}
            </div>
          </section>
        )
      )}

      {/* ── Category Spotlight ── */}
      <section className="py-24 bg-white cls-stable-section" style={{ minHeight: '420px', contain: 'layout' }}>
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 animate-fade-in-up delay-100">
            <div>
              <p className="text-premium-gold font-black uppercase tracking-widest text-xs mb-3 animate-fade-in-up delay-200">
                Essentials
              </p>
              <h2 className="text-4xl md:text-6xl font-black text-charcoal tracking-tighter">Shop by Lifestyle</h2>
            </div>
            <Link to="/collections" className="text-sm font-bold text-charcoal hover:text-premium-gold flex items-center gap-2 group transition-all">
              Discover All <div className="w-10 h-10 rounded-full border border-charcoal/10 flex items-center justify-center group-hover:bg-charcoal group-hover:text-white transition-all group-hover:scale-110 group-hover:rotate-12"><ArrowRight size={18} /></div>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {loadingCats ? (
              Array(4).fill(0).map((_, i) => (
                <div 
                  key={i} 
                  className="relative aspect-[4/5] rounded-[3rem] overflow-hidden bg-charcoal/5 animate-pulse w-full h-full border border-border-light flex items-center justify-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-charcoal/20 animate-spin" />
                  </div>
                </div>
              ))
            ) : (
              homeCategories.map((cat, i) => (
                <Link
                  key={cat.slug || cat._id}
                  to={`/collections/${cat.slug}`}
                  className="group relative block aspect-[4/5] rounded-[3rem] overflow-hidden bg-light-bg perspective-2000 w-full h-full animate-fade-in-up hover:scale-[1.05] hover:-translate-y-2 transition-all duration-500"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <SafeImage 
                    src={cat.image || cat.img} 
                    alt={cat.name} 
                    width={400} 
                    height={500} 
                    sizes="(max-width: 640px) 40vw, (max-width: 1024px) 20vw, 240px"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                  <div className="absolute bottom-10 left-8" style={isMobile ? {} : { transform: "translateZ(50px)" }}>
                    <p className="text-white font-black text-3xl tracking-tighter mb-1 uppercase">{cat.name}</p>
                    <div className="inline-block px-4 py-1.5 bg-premium-gold rounded-full">
                      <p className="text-charcoal text-[8px] font-black uppercase tracking-[0.2em]">{cat.items || 'Explore'}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Featured Showcase ── */}
      <section className="py-24 bg-light-bg rounded-[3rem] md:rounded-[5rem] mx-2 md:mx-6">
        <div className="container-custom">
          <div className="text-center mb-20 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-premium-gold rounded-full mb-6">
              <Sparkles className="text-charcoal" size={16} />
              <span className="text-charcoal font-black uppercase tracking-widest text-[10px]">Staff Favorites</span>
            </div>
            <h2 className="text-4xl md:text-7xl font-black text-charcoal tracking-tight mb-6">Trending Now</h2>
            <p className="text-text-secondary max-w-xl mx-auto font-medium animate-fade-in-up delay-300">
              Curated pieces that define modern sophistication. Hand-picked by our stylists for the current season.
            </p>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-10 opacity-30 select-none pointer-events-none">
              {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-10">
                {featured.slice(0, visibleCount).map(product => <ProductCard key={product._id} product={product} />)}
              </div>
              {visibleCount < featured.length && (
                <div className="mt-12 text-center">
                  <button onClick={() => setVisibleCount(featured.length)} className="btn-outline px-8 py-3 rounded-2xl inline-flex items-center gap-2">
                    Load More <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}

          <div className="mt-20 text-center">
            <Link to="/collections" className="btn-outline px-12 py-5 rounded-3xl inline-flex items-center gap-3">
              Browse Complete Catalog <ShoppingBag size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust Banner ── */}
      <section className="py-24">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {/* Icon Blocks */}
            {[
              { icon: Truck, title: 'Rapid Delivery', desc: 'Secure pan-India shipping with real-time tracking.' },
              { icon: RefreshCw, title: 'Seamless Returns', desc: 'No-questions-asked 7-day exchange policy.' },
              { icon: Shield, title: 'Authenticity Guarantee', desc: 'Only 100% genuine premium fabrics & hardware.' }
            ].map((item, i) => (
              <div 
                key={i}
                className="space-y-4 animate-fade-in-up hover:-translate-y-2 transition-transform duration-300"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <div className="w-16 h-16 bg-charcoal text-premium-gold rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-charcoal/10 transition-transform group-hover:rotate-6">
                  <item.icon size={28} />
                </div>
                <h3 className="text-xl font-black text-charcoal">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mobile Friendly WhatsApp CTA ── */}
      <section className="py-20 bg-charcoal relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-premium-gold/5 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="container-custom relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 animate-fade-in-up delay-200">
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4">Personal Styling <br/>on WhatsApp</h2>
            <p className="text-white/70 font-medium">Chat with our fashion experts for sizing & style advice.</p>
          </div>
          <a
            href="https://wa.me/917358885452" 
            className="px-10 py-5 bg-[#25D366] text-charcoal rounded-[2rem] font-black tracking-widest text-sm hover:scale-105 hover:-rotate-2 active:scale-95 transition-all shadow-2xl shadow-[#25D366]/20"
          >
            CONNECT NOW
          </a>
        </div>
      </section>
    </div>
  );
}

