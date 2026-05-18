import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Scissors, Truck, Users, Palette, CheckCircle, ArrowRight, Zap, Sparkles, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Services() {
  const services = [
    {
      title: "Next-Gen Curation",
      desc: "Massive and attractive collections curated specifically for the youngsters of Thanjavur. We stay ahead of global trends to bring you the best.",
      icon: LayoutGrid,
      color: "bg-orange-50 text-orange-600",
      features: ["Trendy Streetwear", "Premium Formals", "Exclusive Accessories"]
    },
    {
      title: "Master Tailoring",
      desc: "Experience the luxury of a perfect fit. Our master tailors use centuries-old techniques combined with modern precision.",
      icon: Scissors,
      color: "bg-blue-50 text-blue-600",
      features: ["Custom Measurements", "Premium Italian Fabrics", "Signature Stitching"]
    },
    {
      title: "Fast Logistics",
      desc: "Reliable and secure shipping. We ensure your favorite garments reach you within 2 to 3 days across India.",
      icon: Zap,
      color: "bg-emerald-50 text-emerald-600",
      features: ["2-3 Days Delivery", "Real-time Tracking", "Secure Packaging"]
    },
    {
      title: "Private Styling",
      desc: "Personalized fashion consultation for weddings, events, and professional transformations.",
      icon: Palette,
      color: "bg-premium-gold/10 text-premium-gold",
      features: ["Color Palettes", "Wedding Specials", "Image Consulting"]
    }
  ];

  return (
    <div className="min-h-dvh bg-[#F8F8F6] overflow-hidden">
      <Helmet>
        <title>Bespoke Services — Magizhchi Garments</title>
        <meta name="description" content="Explore our high-level services including next-gen fashion curation, master tailoring, and express delivery in Thanjavur." />
      </Helmet>

      {/* ─── Hero: High-Impact ─── */}
      <section className="bg-charcoal py-24 md:py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-premium-gold/5 rounded-full blur-[120px] -mt-20 -mr-20" />
        <div className="container-custom relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-[10px] font-black tracking-[0.4em] text-premium-gold uppercase mb-6 block">Our Craft</span>
            <h1 className="font-serif text-5xl md:text-8xl text-white font-bold leading-tight tracking-tighter mb-8">
              Excellence <span className="text-premium-gold">Defined</span>
            </h1>
            <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto font-medium">
              We provide comprehensive fashion solutions that blend heritage craftsmanship with next-gen innovation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Services Grid: Modern ─── */}
      <section className="py-24 md:py-32 relative">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-10">
            {services.map((service, idx) => (
              <motion.div 
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[3rem] p-12 border border-border-light shadow-xl hover:shadow-2xl transition-all group"
              >
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-10 transition-transform group-hover:scale-110 ${service.color}`}>
                  <service.icon size={40} />
                </div>
                <h3 className="font-serif text-3xl text-charcoal font-bold mb-6 tracking-tight">{service.title}</h3>
                <p className="text-text-muted text-lg font-medium mb-10 leading-relaxed">
                  {service.desc}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                  {service.features.map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-premium-gold" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/60">{f}</span>
                    </div>
                  ))}
                </div>

                <Link to="/contact" className="group inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-charcoal hover:text-premium-gold transition-colors">
                  Inquire Service <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Special Mention: Post Delivery ─── */}
      <section className="py-24 bg-white border-y border-border-light">
        <div className="container-custom">
          <div className="bg-[#F8F8F6] rounded-[4rem] p-12 md:p-20 flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Truck size={16} /> Pan-India Shipping
              </div>
              <h2 className="font-serif text-4xl md:text-6xl text-charcoal font-bold tracking-tight">Post Delivery</h2>
              <p className="text-text-muted text-lg font-medium leading-relaxed">
                Experience reliable fashion delivery right to your doorstep. Shop your favorite collections today and receive them within 2 to 3 business days. Our logistics network ensures your order is handled with the utmost care.
              </p>
              <div className="pt-4">
                <Link to="/collections" className="btn-primary px-12 py-5 rounded-2xl inline-block">Shop Now</Link>
              </div>
            </div>
            <div className="w-full lg:w-1/3 aspect-square bg-charcoal rounded-[3rem] flex items-center justify-center relative overflow-hidden shadow-2xl">
               <Zap size={120} className="text-premium-gold relative z-10 animate-pulse" />
               <div className="absolute inset-0 bg-gradient-to-br from-premium-gold/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-32 bg-[#F8F8F6]">
        <div className="container-custom">
          <div className="text-center max-w-4xl mx-auto space-y-12">
            <Sparkles size={64} className="text-premium-gold mx-auto opacity-50" />
            <h2 className="font-serif text-4xl md:text-7xl text-charcoal font-bold tracking-tighter leading-tight">
              Ready for a Style <span className="italic text-premium-gold">Revolution?</span>
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <Link to="/contact" className="btn-gold px-16 py-6 rounded-2xl shadow-2xl w-full sm:w-auto">Start Consultation</Link>
               <Link to="/collections" className="text-charcoal font-black uppercase tracking-widest text-sm hover:text-premium-gold transition-colors underline decoration-premium-gold decoration-2 underline-offset-8">Explore Catalog</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
