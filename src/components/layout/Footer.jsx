import { Link } from 'react-router-dom';

import { MessageCircle, Mail, Phone, MapPin, Share2, Shield } from 'lucide-react';
import { adminService, categoryService } from '../../services';
import { useQuery } from '@tanstack/react-query';

// Custom Social Icons since Lucide removed Brand Icons
const Instagram = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const Facebook = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);


export default function Footer() {
  const { data: settings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => adminService.getPublicSettings().then(r => r.data.data),
  });

  const { data: catsData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories().then(r => r.data.data?.categories || r.data.data || []),
  });

  const categories = (catsData || []).filter(c => c.isActive !== false && (c.productCount === undefined || c.productCount > 0));


  const year = new Date().getFullYear();
  const store = settings?.store || {
    name: 'Magizhchi Garments',
    email: 'info@magizhchigarments.com',
    phone: '+91 73588 85452',
    address: 'Old Bus Stand, Thanjavur, Tamil Nadu — 613001',
    gstin: '33AAAAA0000A1Z5'
  };

  const socialLinks = [
    { icon: Instagram, href: 'https://www.instagram.com/magizhchi_garments_official/', title: 'Instagram' },
    { icon: Facebook, href: 'https://www.facebook.com/magizhchi.garment/', title: 'Facebook' },
    { icon: Phone, href: `tel:${store.phone.replace(/ /g, '')}`, title: 'Call Us' },
    { icon: MessageCircle, href: `https://wa.me/${store.phone.replace(/[^0-9]/g, '')}`, title: 'WhatsApp' },
  ];

  return (
    <footer className="bg-charcoal text-white pb-24 lg:pb-0">
      {/* Newsletter Banner */}
      <div className="bg-dark-gradient border-b border-white/10">
        <div className="container-custom py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-xl font-bold text-white">Get Exclusive Offers</h3>
            <p className="text-white/80 text-sm mt-1">Subscribe for new arrivals, deals &amp; style tips</p>
          </div>
          <form className="flex gap-2 w-full md:w-auto" onSubmit={e => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email"
              aria-label="Newsletter email subscription"
              className="flex-1 md:w-72 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/70 text-sm focus:outline-none focus:border-premium-gold transition-colors"
            />
            <button type="submit" className="btn-gold whitespace-nowrap">Subscribe</button>
          </form>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="block mb-6 group/flogo">
              <div className="perspective-1000 transition-transform duration-300 hover:scale-[1.02]">
                <div className="font-display text-2xl font-black tracking-[0.15em] text-white group-hover/flogo:text-premium-gold transition-colors uppercase">
                  {store.name.split(' ')[0]}
                </div>
                <div className="text-[9px] text-white/60 tracking-[0.4em] uppercase font-black">
                  {store.name.split(' ').slice(1).join(' ') || 'GARMENTS'}
                </div>
              </div>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed mb-6 font-medium">

              Premium men&apos;s clothing. Where tradition meets modern style. Tamil Nadu&apos;s finest fashion destination.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, title }) => (
                <a 
                  key={title} 
                  href={href} 
                  target="_blank" 
                  rel="noreferrer" 
                  title={title}
                  className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center transition-all duration-300 text-white/60 hover:text-charcoal hover:bg-premium-gold hover:scale-110 shadow-lg"
                  aria-label={`Follow us on ${title}`}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>

          </div>


          {/* Shop */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Shop</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/collections/all" className="text-white/80 hover:text-premium-gold text-sm transition-colors">All Products</Link>
              </li>
              {(categories || []).slice(0, 6).map(cat => (
                <li key={cat.slug}>
                  <Link to={`/collections/${cat.slug}`}
                    className="text-white/80 hover:text-premium-gold text-sm transition-colors">{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Help</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'My Account', path: '/dashboard' },
                { label: 'Track Order', path: '/dashboard/orders' },
                { label: 'Returns & Refunds', path: '/refund-policy' },
                { label: 'Shipping Policy', path: '/shipping-policy' },
                { label: 'Privacy Policy', path: '/privacy-policy' },
                { label: 'Terms & Conditions', path: '/terms' },
                { label: 'Contact Us', path: '/contact' },
              ].map(({ label, path }) => (
                <li key={path}>
                  <Link to={path} className="text-white/85 hover:text-premium-gold text-sm transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex gap-2.5 text-white/70 text-sm">
                <Phone size={14} className="text-premium-gold mt-0.5 shrink-0" />
                <a href={`tel:${store.phone.replace(/ /g, '')}`} className="hover:text-premium-gold transition-colors">{store.phone}</a>
              </li>
              <li className="flex gap-2.5 text-white/70 text-sm">
                <Mail size={14} className="text-premium-gold mt-0.5 shrink-0" />
                <a href={`mailto:${store.email}`} className="hover:text-premium-gold transition-colors">{store.email}</a>
              </li>
              <li className="flex gap-2.5 text-white/70 text-sm">
                <MapPin size={14} className="text-premium-gold mt-0.5 shrink-0" />
                <span>{store.address}</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-white/60 font-medium uppercase tracking-wide mb-1">Store Hours</p>
              <p className="text-white/60 text-xs">Mon – Sun: 10:00 AM – 10:00 PM</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-white/60 text-xs">© {year} {store.name}. All rights reserved. {store.gstin && `GSTIN: ${store.gstin}`}</p>
          <div className="flex items-center gap-4">
            <Shield size={14} className="text-premium-gold" />
            <span className="text-white/85 text-xs font-bold uppercase tracking-widest">Secured Payments</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
