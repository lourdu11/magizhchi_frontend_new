import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, Users, History, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  const stats = [
    { num: '4+', label: 'Years of Mastery' },
    { num: '50k+', label: 'Happy Clients' },
    { num: '100+', label: 'Luxury Designs' },
    { num: '4.9★', label: 'Client Rating' }
  ];

  return (
    <div className="min-h-dvh bg-[#F8F8F6] overflow-hidden">
      <Helmet>
        <title>Our Story — Magizhchi Garments</title>
        <meta name="description" content="Discover the legacy of Magizhchi Garments — Thanjavur's premier destination for next-gen fashion and luxury menswear." />
      </Helmet>

      {/* ─── Hero Section: Immersive ─── */}
      <section className="relative h-[80vh] flex items-center justify-center bg-[#080808] overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-[#080808]" />
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-premium-gold/10 rounded-full blur-[120px]" />
        </div>

        <div className="container-custom relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-premium-gold/30 bg-premium-gold/10 text-premium-gold text-[10px] font-black uppercase tracking-[0.3em] mb-8">
              <Sparkles size={14} className="animate-pulse" /> Established 2022
            </span>
            <h1 className="font-serif text-5xl md:text-8xl text-white font-bold leading-tight tracking-tighter mb-8">
              Legacy of <span className="text-premium-gold italic">Excellence</span>
            </h1>
            <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              From the historic heart of Thanjavur, Magizhchi Garments redefined next-gen fashion for the modern gentleman.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Story Section: Modern Grid ─── */}
      <section className="py-24 md:py-32 bg-white relative">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[4/5] bg-charcoal rounded-[3rem] overflow-hidden relative shadow-2xl group">
                <div className="absolute inset-0 bg-premium-gold/10 group-hover:bg-transparent transition-all duration-700" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="text-center">
                     <History size={64} className="text-premium-gold mx-auto mb-6" />
                     <h3 className="font-serif text-4xl text-white font-bold tracking-tight">4+ Years</h3>
                     <p className="text-premium-gold font-black uppercase tracking-widest text-[10px] mt-2">Crafting Dreams</p>
                   </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-premium-gold rounded-[2.5rem] flex flex-col items-center justify-center shadow-2xl p-6 text-center z-20">
                <p className="text-4xl font-black text-charcoal tracking-tighter">#1</p>
                <p className="text-[10px] font-black text-charcoal uppercase tracking-widest mt-1">Fashion Destination<br/>in Thanjavur</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
              <div>
                <span className="text-xs font-black uppercase tracking-[0.3em] text-premium-gold">Our Heritage</span>
                <h2 className="font-serif text-4xl md:text-5xl text-charcoal font-bold mt-4 leading-tight tracking-tight">
                  Born in Thanjavur,<br/>Crafted for the World.
                </h2>
              </div>
              <div className="space-y-6 text-text-muted text-lg leading-relaxed font-medium">
                <p>
                  Magizhchi Garments is not just a brand; it's a testament to the vibrant spirit of Thanjavur. Since 2022, we have been at the forefront of the youngsters' clothing revolution, blending massive, attractive collections with unrivaled quality.
                </p>
                <p>
                  Our founder envisioned a space where "next-gen" wasn't just a label, but a lifestyle. Today, we stand as the premier hub for high-quality menswear, known for our commitment to precision, style, and the ultimate customer experience.
                </p>
              </div>
              <div className="pt-6">
                <Link to="/collections" className="group inline-flex items-center gap-4 text-charcoal font-black uppercase tracking-widest text-sm hover:text-premium-gold transition-all">
                  Explore Collections <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Stats Section: Premium Dark ─── */}
      <section className="py-24 bg-[#080808] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.05)_0%,_transparent_70%)]" />
        <div className="container-custom relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {stats.map((stat, idx) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <p className="font-serif text-5xl md:text-6xl text-premium-gold font-bold mb-3 tracking-tighter">{stat.num}</p>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Values: Glass Cards ─── */}
      <section className="py-24 md:py-32 bg-[#F8F8F6]">
        <div className="container-custom">
          <div className="text-center mb-20">
            <h2 className="font-serif text-4xl md:text-6xl text-charcoal font-bold tracking-tight">Our Core Philosophy</h2>
            <div className="w-24 h-1 bg-premium-gold mx-auto mt-8" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: 'Unrivaled Quality', desc: 'Every fabric is handpicked and every stitch is inspected to meet the highest standards of luxury.' },
              { icon: Sparkles, title: 'Next-Gen Design', desc: 'Staying ahead of trends to provide the youngsters of Thanjavur with the most attractive collections.' },
              { icon: Users, title: 'Client First', desc: 'From personalized styling to 2-3 day delivery, our services are tailored to your lifestyle.' },
            ].map((v, i) => (
              <motion.div 
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-10 rounded-[3rem] border border-border-light shadow-xl hover:shadow-2xl transition-all group"
              >
                <div className="w-16 h-16 bg-premium-gold/10 text-premium-gold rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <v.icon size={32} />
                </div>
                <h4 className="font-serif text-2xl text-charcoal font-bold mb-4 tracking-tight">{v.title}</h4>
                <p className="text-text-muted font-medium leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-32 bg-white">
        <div className="container-custom">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-charcoal rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-premium-gold/10 rounded-full blur-[120px] -mt-20 -mr-20" />
            <div className="relative z-10">
              <h2 className="font-serif text-4xl md:text-6xl text-white font-bold mb-8 tracking-tight">Experience Magizhchi</h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto mb-12 font-medium">
                Visit our premier destination in Thanjavur and discover what true next-gen fashion feels like.
              </p>
              <Link to="/contact" className="btn-gold px-12 py-5 rounded-2xl shadow-2xl">Visit Our Store</Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
