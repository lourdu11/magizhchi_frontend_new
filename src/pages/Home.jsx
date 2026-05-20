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
  { name: 'Shirts', slug: 'shirts', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400&auto=format&fit=crop', items: '120+ Items' },
  { name: 'T-Shirts', slug: 't-shirts', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop', items: '80+ Items' },
  { name: 'Jeans', slug: 'jeans', img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=400&auto=format&fit=crop', items: '50+ Items' },
  { name: 'Formals', slug: 'formals', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=400&auto=format&fit=crop', items: '40+ Items' }
];

const DEFAULT_SLIDES = [
  {
    id: "default-hero",
    title: "Premium Casual\nPants Collection",
    subtitle: "Modern comfort and effortless style for everyday wear.",
    accent: "New Arrival",
    img: "https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0054.jpg?updatedAt=1772379274925",
    mobileImg: "https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0054.jpg?updatedAt=1772379274925",
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
  const glowRef = useRef(null);

  const [framer, setFramer] = useState(null);

  useEffect(() => {
    if (!isMobile) {
      import('framer-motion').then(setFramer);
    }
  }, [isMobile]);

  const MotionDiv = framer ? framer.motion.div : 'div';
  const MotionP = framer ? framer.motion.p : 'p';
  const MotionA = framer ? framer.motion.a : 'a';
  const HeroContent = framer ? framer.motion.div : 'div';
  const CategoryCard = framer ? framer.motion(Link) : Link;
  const AnimatePresenceComponent = framer ? framer.AnimatePresence : ({ children }) => <>{children}</>;

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

  const { data: bannersData } = useQuery({
    queryKey: ['banners', 'active'],
    queryFn: () => bannerService.getActiveBanners().then(r => r.data.data),
    select: (data) => (data || [])
      .filter(b => b.isActive)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
  });

  const { data: catsData } = useQuery({
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
    accent: b.accent || "New Collection",
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
    mobileGravity: b.mobileGravity || b.desktopGravity || 'auto',
    accent: b.type === 'hero' ? 'New Arrival' : 'Special Offer'
  })) || [];

  const slides = dynamicSlides.length > 0 ? dynamicSlides : DEFAULT_SLIDES;

  useEffect(() => {
    if (isMobile) return;
    const handleMouseMove = (e) => {
      if (glowRef.current) {
        glowRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
        glowRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
      {slides.length > 0 && (
        <section className="relative h-[65vh] md:h-[80vh] w-full bg-charcoal overflow-hidden p-0 m-0">
          <AnimatePresenceComponent mode="wait" initial={false}>
          <MotionDiv 
            key={heroIdx}
            initial={isMobile ? {} : { opacity: 0, scale: 1.1 }}
            animate={isMobile ? {} : { opacity: 1, scale: 1 }}
            exit={isMobile ? {} : { opacity: 0 }}
            transition={isMobile ? { duration: 0 } : { duration: 1 }}
            className="absolute inset-0 w-full h-full p-0 m-0"
          >
            <SafeImage 
              src={isMobile ? (slides[heroIdx]?.mobileImg || slides[heroIdx]?.img) : slides[heroIdx]?.img} 
              alt="" 
              width={isMobile ? 400 : 1200} 
              height={isMobile ? 600 : 800}
              quality={heroIdx === 0 ? (isMobile ? 45 : 60) : 40}
              fetchPriority="high"
              loading="eager"
              style={{ 
                objectFit: isMobile ? (slides[heroIdx]?.mobileFit || 'cover') : (slides[heroIdx]?.fit || 'cover'),
                objectPosition: isMobile ? (slides[heroIdx]?.mobilePos || 'center') : (slides[heroIdx]?.pos || 'center'),
                transform: `scale(${isMobile ? (slides[heroIdx]?.mobileScale || 1) : (slides[heroIdx]?.scale || 1)})`
              }}
              crop="fill"
              gravity={isMobile ? slides[heroIdx]?.mobileGravity : slides[heroIdx]?.gravity}
              aspect={isMobile ? '4:5' : '21:9'}
              srcSet={heroIdx === 0 ? "https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0054.jpg?updatedAt=1772379274925&tr=w-1200,h-800,q-60,f-auto 1200w, https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0054.jpg?updatedAt=1772379274925&tr=w-800,h-533,q-50,f-auto 800w, https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0054.jpg?updatedAt=1772379274925&tr=w-400,h-600,q-45,f-auto 400w" : undefined}
              sizes={heroIdx === 0 ? "(max-width: 480px) 360px, (max-width: 1024px) 800px, 1200px" : undefined}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
          </MotionDiv>
        </AnimatePresenceComponent>

        <div className="relative z-10 container-custom h-full flex flex-col justify-center pt-20">
          <HeroContent
            {...(isMobile ? {} : {
              initial: { opacity: 0, x: -50 },
              animate: { 
                opacity: 1, 
                x: 0,
                y: [0, -10, 0],
              },
              whileHover: { 
                rotateY: 8, 
                rotateX: -4,
                z: 50,
                transition: { duration: 0.4 }
              },
              style: { 
                transformStyle: "preserve-3d",
                perspective: "2000px" 
              },
              transition: { 
                duration: 0.8,
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }
            })}
            className="max-w-3xl"
          >
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
          </HeroContent>
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
      )}

      {/* ── Category Spotlight ── */}
      <section className="py-24 bg-white cls-stable-section" style={{ minHeight: '420px', contain: 'layout' }}>
        <div className="container-custom">
          <MotionDiv 
            {...(isMobile ? {} : {
              initial: { opacity: 0, y: 40 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true }
            })}
            className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
          >
            <div>
              <MotionP 
                {...(isMobile ? {} : {
                  initial: { opacity: 0, x: -20 },
                  whileInView: { opacity: 1, x: 0 },
                  transition: { delay: 0.2 }
                })}
                className="text-premium-gold font-black uppercase tracking-widest text-xs mb-3"
              >
                Essentials
              </MotionP>
              <h2 className="text-4xl md:text-6xl font-black text-charcoal tracking-tighter">Shop by Lifestyle</h2>
            </div>
            <Link to="/collections" className="text-sm font-bold text-charcoal hover:text-premium-gold flex items-center gap-2 group transition-all">
              Discover All <div className="w-10 h-10 rounded-full border border-charcoal/10 flex items-center justify-center group-hover:bg-charcoal group-hover:text-white transition-all group-hover:scale-110 group-hover:rotate-12"><ArrowRight size={18} /></div>
            </Link>
          </MotionDiv>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {homeCategories.map((cat, i) => (
              <CategoryCard 
                key={cat.slug || cat._id}
                to={`/collections/${cat.slug}`}
                {...(isMobile ? {} : {
                  initial: { opacity: 0, y: 30 },
                  whileInView: { opacity: 1, y: 0 },
                  whileHover: { 
                    rotateY: 12, 
                    rotateX: -8,
                    scale: 1.08,
                    z: 30,
                    transition: { duration: 0.3 }
                  },
                  transition: { delay: i * 0.1 },
                  viewport: { once: true },
                  style: { transformStyle: "preserve-3d" }
                })}
                className="group relative block aspect-[4/5] rounded-[3rem] overflow-hidden bg-light-bg perspective-2000 w-full h-full"
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
              </CategoryCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Showcase ── */}
      <section className="py-24 bg-light-bg rounded-[3rem] md:rounded-[5rem] mx-2 md:mx-6">
        <div className="container-custom">
          <MotionDiv 
            {...(isMobile ? {} : {
              initial: { opacity: 0, scale: 0.9 },
              whileInView: { opacity: 1, scale: 1 },
              viewport: { once: true }
            })}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-premium-gold/10 rounded-full mb-6">
              <Sparkles className="text-premium-gold" size={16} />
              <span className="text-premium-gold font-black uppercase tracking-widest text-[10px]">Staff Favorites</span>
            </div>
            <h2 className="text-4xl md:text-7xl font-black text-charcoal tracking-tight mb-6">Trending Now</h2>
            <MotionP 
              {...(isMobile ? {} : {
                initial: { opacity: 0, y: 20 },
                whileInView: { opacity: 1, y: 0 },
                transition: { delay: 0.3 }
              })}
              className="text-text-secondary max-w-xl mx-auto font-medium"
            >
              Curated pieces that define modern sophistication. Hand-picked by our stylists for the current season.
            </MotionP>
          </MotionDiv>

          {loadingFeatured ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-10 opacity-30 select-none pointer-events-none">
              {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-10">
              {featured.map(product => <ProductCard key={product._id} product={product} />)}
            </div>
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
              <MotionDiv 
                key={i} 
                {...(isMobile ? {} : {
                  initial: { opacity: 0, scale: 0.8, y: 30 },
                  whileInView: { opacity: 1, scale: 1, y: 0 },
                  whileHover: { y: -10 },
                  transition: { delay: i * 0.2 },
                  viewport: { once: true }
                })}
                className="space-y-4"
              >
                <div className="w-16 h-16 bg-charcoal text-premium-gold rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-charcoal/10 transition-transform group-hover:rotate-6">
                  <item.icon size={28} />
                </div>
                <h3 className="text-xl font-black text-charcoal">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mobile Friendly WhatsApp CTA ── */}
      <section className="py-20 bg-charcoal relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-premium-gold/5 rounded-full blur-[100px] -mr-48 -mt-48" />
        <MotionDiv 
          {...(isMobile ? {} : {
            initial: { opacity: 0, y: 40 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true }
          })}
          className="container-custom relative z-10 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4">Personal Styling <br/>on WhatsApp</h2>
            <p className="text-white/40 font-medium">Chat with our fashion experts for sizing & style advice.</p>
          </div>
          <MotionA 
            {...(isMobile ? {} : {
              whileHover: { scale: 1.05, rotate: -2 },
              whileTap: { scale: 0.95 }
            })}
            href="https://wa.me/917358885452" 
            className="px-10 py-5 bg-[#25D366] text-white rounded-[2rem] font-black tracking-widest text-sm hover:scale-105 transition-all shadow-2xl shadow-[#25D366]/20"
          >
            CONNECT NOW
          </MotionA>
        </MotionDiv>
      </section>
    </div>
  );
}
