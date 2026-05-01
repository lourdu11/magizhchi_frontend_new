import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Truck, RefreshCw, Shield, ShoppingBag, Sparkles, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { productService, bannerService } from '../services';
import ProductCard from '../components/product/ProductCard';
import SafeImage from '../components/common/SafeImage';

const HERO_SLIDES = [
  {
    id: 1,
    title: 'Modern\nGentleman',
    subtitle: "Tamil Nadu's destination for MAGIZHCHI GARMENTS. Discover the art of perfect tailoring.",

    cta: 'Shop Collection',
    ctaLink: '/collections',
    img: 'https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0048.jpg?updatedAt=1772379292131',
    accent: 'Luxury Fabrics'
  },
  {
    id: 2,
    title: 'The Formal\nStandard',
    subtitle: 'From boardroom to weddings. Look your absolute best with our premium formal range.',
    cta: 'Explore Suits',
    ctaLink: '/collections/formals',
    img: 'https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0097.jpg?updatedAt=1772379295602',
    accent: 'Office Ready'
  },
  {
    id: 3,
    title: 'Casual\nComfort',
    subtitle: 'Elevate your daily style with our range of premium t-shirts and comfort wear.',
    cta: 'Shop Casuals',
    ctaLink: '/collections/t-shirts',
    img: 'https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0085.jpg?updatedAt=1772379294664',
    accent: 'Everyday Style'
  },
  {
    id: 4,
    title: 'Timeless\nDenim',
    subtitle: 'Classic jeans that fit perfectly and last forever. The foundation of every wardrobe.',
    cta: 'Explore Jeans',
    ctaLink: '/collections/jeans',
    img: 'https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0054.jpg?updatedAt=1772379274925',
    accent: 'Built To Last'
  }
];

const CATEGORIES = [
  { name: 'Shirts', slug: 'shirts', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400&auto=format&fit=crop', items: '120+ Items' },
  { name: 'T-Shirts', slug: 't-shirts', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop', items: '80+ Items' },
  { name: 'Jeans', slug: 'jeans', img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=400&auto=format&fit=crop', items: '50+ Items' },
  { name: 'Formals', slug: 'formals', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=400&auto=format&fit=crop', items: '40+ Items' }
];

export default function Home() {
  const [heroIdx, setHeroIdx] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { data: featuredData, isLoading: loadingFeatured } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getProducts({ isFeatured: 'true', limit: 8 }).then(r => r.data.data),
  });

  const { data: allProductsData } = useQuery({
    queryKey: ['products', 'latest'],
    queryFn: () => productService.getProducts({ limit: 8 }).then(r => r.data.data),
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
  const homeCategories = catsData?.slice(0, 4) || [];
  
  // Transform dynamic banners to match Hero layout
  const dynamicSlides = bannersData?.map(b => ({
    id: b._id,
    title: b.title.includes(' ') && !b.title.includes('\n') ? b.title.replace(' ', '\n') : b.title,
    subtitle: b.subtitle || "Premium Quality & Timeless Style",
    cta: 'Shop Now',
    ctaLink: b.link,
    img: b.desktopImage,
    accent: b.type === 'hero' ? 'New Arrival' : 'Special Offer'
  })) || [];

  const slides = dynamicSlides.length > 0 ? dynamicSlides : HERO_SLIDES;

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIdx(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Reset index if slides count changes (e.g. from 4 demo to 1 real)
  useEffect(() => {
    if (heroIdx >= slides.length) {
      setHeroIdx(0);
    }
  }, [slides.length, heroIdx]);

  return (
    <div className="overflow-x-hidden relative">
      <Helmet><title>MAGIZHCHI GARMENTS — Premium Men's Wear</title></Helmet>

      {/* Global Mouse Glow */}
      <div 
        className="fixed inset-0 pointer-events-none z-[1] transition-opacity duration-1000"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(212, 175, 55, 0.03), transparent 80%)`
        }}
      />


      {/* ── Hero Section ── */}
      <section className="relative h-[65vh] md:h-[80vh] w-full bg-charcoal overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div 
            key={heroIdx}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <SafeImage src={slides[heroIdx]?.img} alt="" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 container-custom h-full flex flex-col justify-center pt-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              y: [0, -10, 0], // Subtle floating effect
            }}
            whileHover={{ 
              rotateY: 8, 
              rotateX: -4,
              z: 50,
              transition: { duration: 0.4 }
            }}
            style={{ 
              transformStyle: "preserve-3d",
              perspective: "2000px" 
            }}
            transition={{ 
              duration: 0.8,
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" } // Loop for floating
            }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-2 mb-6" style={{ transform: "translateZ(30px)" }}>
              <div className="w-10 h-[1px] bg-premium-gold" />
              <span className="text-premium-gold font-black uppercase tracking-[0.4em] text-[10px]">{slides[heroIdx]?.accent}</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white leading-[0.9] mb-8 whitespace-pre-line tracking-tighter" style={{ transform: "translateZ(60px)" }}>
              {slides[heroIdx]?.title}
            </h1>
            <p className="text-white/60 text-base md:text-xl mb-10 max-w-lg leading-relaxed font-medium" style={{ transform: "translateZ(80px)" }}>
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
          </motion.div>
        </div>


        {/* Hero Nav */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setHeroIdx(i)} className={`h-1.5 rounded-full transition-all duration-500 ${i === heroIdx ? 'w-12 bg-premium-gold' : 'w-3 bg-white/30'}`} />
          ))}
        </div>
      </section>

      {/* ── Category Spotlight ── */}
      <section className="py-24 bg-white">
        <div className="container-custom">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
          >
            <div>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-premium-gold font-black uppercase tracking-widest text-xs mb-3"
              >
                Essentials
              </motion.p>
              <h2 className="text-4xl md:text-6xl font-black text-charcoal tracking-tighter">Shop by Lifestyle</h2>
            </div>
            <Link to="/collections" className="text-sm font-bold text-charcoal hover:text-premium-gold flex items-center gap-2 group transition-all">
              Discover All <div className="w-10 h-10 rounded-full border border-charcoal/10 flex items-center justify-center group-hover:bg-charcoal group-hover:text-white transition-all group-hover:scale-110 group-hover:rotate-12"><ArrowRight size={18} /></div>
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {homeCategories.map((cat, i) => (
              <motion.div 
                key={cat.slug || cat._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Link to={`/collections/${cat.slug}`} className="group relative block aspect-[4/5] rounded-[3rem] overflow-hidden bg-light-bg perspective-2000">
                  <motion.div 
                    whileHover={{ 
                      rotateY: 12, 
                      rotateX: -8,
                      scale: 1.08,
                      z: 30,
                      transition: { duration: 0.3 }
                    }}
                    style={{ transformStyle: "preserve-3d" }}
                    className="w-full h-full"
                  >
                    <SafeImage src={cat.image || cat.img} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                    <div className="absolute bottom-10 left-8" style={{ transform: "translateZ(50px)" }}>
                      <p className="text-white font-black text-3xl tracking-tighter mb-1 uppercase">{cat.name}</p>
                      <div className="inline-block px-4 py-1.5 bg-premium-gold rounded-full">
                        <p className="text-charcoal text-[8px] font-black uppercase tracking-[0.2em]">{cat.items || 'Explore'}</p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Showcase ── */}
      <section className="py-24 bg-light-bg rounded-[3rem] md:rounded-[5rem] mx-2 md:mx-6">
        <div className="container-custom">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-premium-gold/10 rounded-full mb-6">
              <Sparkles className="text-premium-gold" size={16} />
              <span className="text-premium-gold font-black uppercase tracking-widest text-[10px]">Staff Favorites</span>
            </div>
            <h2 className="text-4xl md:text-7xl font-black text-charcoal tracking-tight mb-6">Trending Now</h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-text-secondary max-w-xl mx-auto font-medium"
            >
              Curated pieces that define modern sophistication. Hand-picked by our stylists for the current season.
            </motion.p>
          </motion.div>

          {loadingFeatured ? (
            <div className="h-40 flex items-center justify-center">
              <Loader2 className="animate-spin text-premium-gold" size={32} />
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
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ y: -10 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <div className="w-16 h-16 bg-charcoal text-premium-gold rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-charcoal/10 transition-transform group-hover:rotate-6">
                  <item.icon size={28} />
                </div>
                <h3 className="text-xl font-black text-charcoal">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mobile Friendly WhatsApp CTA ── */}
      <section className="py-20 bg-charcoal relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-premium-gold/5 rounded-full blur-[100px] -mr-48 -mt-48" />
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container-custom relative z-10 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4">Personal Styling <br/>on WhatsApp</h2>
            <p className="text-white/40 font-medium">Chat with our fashion experts for sizing & style advice.</p>
          </div>
          <motion.a 
            whileHover={{ scale: 1.05, rotate: -2 }}
            whileTap={{ scale: 0.95 }}
            href="https://wa.me/917358885452" 
            className="px-10 py-5 bg-[#25D366] text-white rounded-[2rem] font-black tracking-widest text-sm hover:scale-105 transition-all shadow-2xl shadow-[#25D366]/20"
          >
            CONNECT NOW
          </motion.a>
        </motion.div>
      </section>
    </div>
  );
}
