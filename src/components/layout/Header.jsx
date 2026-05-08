import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, User, Menu, X, ChevronDown, Sparkles } from 'lucide-react';
import { useAuthStore, useCartStore, useUIStore, useWishlistStore } from '../../store';
import { cartService, categoryService, wishlistService } from '../../services';
import SafeImage from '../common/SafeImage';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Collections', path: '/collections', hasDropdown: true },
  { label: 'Track Order', path: '/track-order' },
  { label: 'About', path: '/about' },
  { label: 'Services', path: '/services' },
  { label: 'Contact', path: '/contact' },
];

const CATEGORIES = [
  { label: 'All Essentials', path: '/collections' },
  { label: 'Premium Shirts', path: '/collections/shirts' },
  { label: 'Casual T-Shirts', path: '/collections/t-shirts' },
  { label: 'Classic Jeans', path: '/collections/jeans' },
  { label: 'Office Formals', path: '/collections/formals' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const { isAuthenticated, user, logout } = useAuthStore();
  const { itemCount, setItemCount } = useCartStore();
  const { itemCount: wishlistCount } = useWishlistStore();
  const { isMobileMenuOpen, setMobileMenu } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart().then(r => r.data.data.cart),
    enabled: isAuthenticated,
  });

  const { setWishlist } = useWishlistStore();
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistService.getWishlist().then(r => r.data.data),
    enabled: isAuthenticated,
  });

  const { data: catsData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories().then(r => r.data.data?.categories || r.data.data || []),
  });

  const categories = catsData?.length > 0 
    ? [{ label: 'All Essentials', path: '/collections' }, ...catsData.map(c => ({ label: c.name, path: `/collections/${c.slug}` }))]
    : [{ label: 'All Essentials', path: '/collections' }];

  useEffect(() => {
    if (cartData?.items) setItemCount(cartData.items.length);
  }, [cartData, setItemCount]);

  useEffect(() => {
    if (wishlistData?.wishlist?.products) {
      setWishlist(wishlistData.wishlist.products);
    }
  }, [wishlistData, setWishlist]);


  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 50);
      if (currentScrollY < 10) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 will-change-transform ${scrolled ? 'glass h-16 md:h-20 shadow-2xl shadow-black/10' : 'bg-transparent h-20 md:h-24'} ${!visible ? '-translate-y-full md:translate-y-0' : 'translate-y-0'}`}>
        <div className="container-custom h-full">

          {/* ─────────────────────────────────────────────
              MOBILE HEADER  (visible below lg)
              Layout: [Menu] [Logo — centered] [Cart]
              Three equal flex-1 columns guarantee true centering.
          ───────────────────────────────────────────── */}
          <div className="flex lg:hidden items-center h-full w-full px-2">

            {/* Left: hamburger */}
            <div className="flex-1 flex justify-start">
              <button
                onClick={() => setMobileMenu(true)}
                aria-label="Open navigation menu"
                className="w-10 h-10 flex items-center justify-center text-charcoal hover:text-premium-gold transition-colors"
              >
                <Menu size={22} />
              </button>
            </div>

            {/* Center: logo (naturally centred because both sides are flex-1) */}
            <div className="flex-1 flex justify-center">
              <Link to="/" className="flex items-center gap-2 leading-none mt-[-12px]" style={{ textDecoration: 'none' }}>
                <SafeImage
                  src="https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0043.jpg?updatedAt=1772379265473"
                  alt="Magizhchi"
                  width={150}
                  className={`w-auto aspect-square object-cover rounded-full transition-all duration-500 flex-shrink-0 ${scrolled ? 'h-7' : 'h-9'}`}
                />
                <div className="flex flex-col leading-none">
                  <span
                    className="font-black text-charcoal whitespace-nowrap"
                    style={{ fontSize: '14px', letterSpacing: '0.05em', lineHeight: 1 }}
                  >
                    MAGIZHCHI
                  </span>
                  <span
                    className="font-black text-premium-gold uppercase whitespace-nowrap"
                    style={{ fontSize: '8px', letterSpacing: '0.25em', marginTop: '3px', lineHeight: 1 }}
                  >
                    GARMENTS
                  </span>
                </div>
              </Link>
            </div>

            {/* Right: cart & wishlist */}
            <div className="flex-1 flex justify-end items-center gap-1">
              {isAuthenticated && (
                <Link
                  to="/wishlist"
                  aria-label="Wishlist"
                  className="relative w-10 h-10 flex items-center justify-center text-charcoal hover:text-premium-gold transition-colors"
                >
                  <Heart size={20} />
                  {wishlistCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-premium-gold text-white text-[7px] font-black rounded-full flex items-center justify-center shadow-lg">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}
              <Link
                to="/cart"
                aria-label="Cart"
                className="relative w-10 h-10 flex items-center justify-center text-charcoal hover:text-premium-gold transition-colors"
              >
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-charcoal text-white text-[7px] font-black rounded-full flex items-center justify-center shadow-lg">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* ─────────────────────────────────────────────
              DESKTOP / LAPTOP HEADER  (visible lg+)
          ───────────────────────────────────────────── */}
          <div className="hidden lg:flex items-center justify-between h-full flex-nowrap gap-2">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link to="/" aria-label="Go to homepage" className="flex items-center gap-2 md:gap-3 group transition-transform">
                <motion.div
                  whileHover={{ rotateY: 360, scale: 1.1 }}
                  transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                  style={{ transformStyle: "preserve-3d" }}
                  className="perspective-1000"
                >
                  <SafeImage src="https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0043.jpg?updatedAt=1772379265473" width={200} alt="Magizhchi" className={`transition-all duration-500 w-auto aspect-square object-cover rounded-full ${scrolled ? 'h-8 md:h-12' : 'h-10 md:h-14'}`} />
                </motion.div>
                <div className="flex flex-col transition-all duration-500 overflow-hidden">
                  <motion.span
                    whileHover={{ z: 50, color: '#D4AF37' }}
                    className={`font-black tracking-[0.1em] text-charcoal leading-none transition-all duration-500 whitespace-nowrap ${scrolled ? 'text-lg md:text-2xl' : 'text-xl md:text-3xl'}`}
                  >
                    MAGIZHCHI
                  </motion.span>
                  <span className={`font-black tracking-[0.4em] text-premium-gold uppercase transition-all duration-500 whitespace-nowrap ${scrolled ? 'text-[8px] mt-1' : 'text-[10px] mt-1.5'}`}>
                    GARMENTS
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
              {NAV_LINKS.map(link => (
                <div key={link.path} className="relative group/nav"
                  onMouseEnter={() => link.hasDropdown && setShowDropdown(true)}
                  onMouseLeave={() => link.hasDropdown && setShowDropdown(false)}>
                  <Link to={link.path} aria-label={`Go to ${link.label}`} className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-1 ${location.pathname === link.path ? 'text-premium-gold' : 'text-charcoal hover:text-premium-gold'}`}>
                    {link.label} {link.hasDropdown && <ChevronDown size={12} className={`transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />}
                  </Link>
                  {link.hasDropdown && (
                    <AnimatePresence mode="wait">
                      {showDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 mt-4 w-64 glass rounded-[2rem] shadow-2xl border border-white/40 overflow-hidden py-4"
                        >
                          {categories.map(cat => (
                            <Link key={cat.path} to={cat.path} className="flex items-center gap-3 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-charcoal hover:text-premium-gold hover:bg-premium-gold/5 transition-all">
                              <Sparkles size={12} className="text-premium-gold/60" /> {cat.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </nav>

            {/* Icons */}
            <div className="flex items-center gap-0.5 md:gap-4 flex-shrink-0">
              {isAuthenticated && (
                <Link to="/wishlist" aria-label={`Wishlist (${wishlistCount} items)`} className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center text-charcoal hover:text-premium-gold transition-colors relative">
                  <Heart size={20} />
                  {wishlistCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-4 h-4 bg-premium-gold text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-lg">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              <Link to="/cart" aria-label={`Cart (${itemCount} items)`} className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center text-charcoal hover:text-premium-gold transition-colors relative">
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-4 h-4 bg-charcoal text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-lg">
                    {itemCount}
                  </span>
                )}
              </Link>

              <div className="hidden md:block relative">
                {isAuthenticated ? (
                  <div className="relative group/user">
                    <button onClick={() => setShowUserMenu(!showUserMenu)} aria-label="Toggle user menu" className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all ${showUserMenu ? 'bg-premium-gold text-charcoal' : 'bg-charcoal text-premium-gold hover:scale-105'}`}>
                      <User size={18} />
                    </button>
                    <AnimatePresence mode="wait">
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 15, rotateX: -15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, rotateX: -10, scale: 0.95 }}
                          transition={{ type: "spring", damping: 20, stiffness: 300 }}
                          style={{ transformOrigin: "top right", transformStyle: "preserve-3d" }}
                          className="absolute top-full right-0 mt-4 w-56 glass rounded-[2rem] shadow-2xl border border-white/40 overflow-hidden py-4 z-[100] perspective-1000"
                        >
                          <div className="px-6 py-4 border-b border-white/20 mb-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-charcoal/60">Welcome back</p>
                            <p className="text-xs font-black text-charcoal truncate">{user?.name || 'Customer'}</p>
                          </div>
                          {user?.role === 'admin' ? (
                            <Link to="/admin" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-premium-gold hover:bg-premium-gold/5 transition-all">Admin Panel</Link>
                          ) : user?.role === 'staff' ? (
                            <Link to="/staff" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-premium-gold hover:bg-premium-gold/5 transition-all">Staff Portal</Link>
                          ) : (
                            <>
                              <Link to="/dashboard" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-charcoal/60 hover:text-premium-gold hover:bg-premium-gold/5 transition-all">My Account</Link>
                              <Link to="/dashboard/orders" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-charcoal/60 hover:text-premium-gold hover:bg-premium-gold/5 transition-all">Order History</Link>
                            </>
                          )}
                          <div className="h-px bg-white/20 my-2 mx-4" />
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-stock-out hover:bg-stock-out/5 transition-all text-left">Sign Out</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link to="/login" className="px-6 py-2.5 bg-charcoal text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-premium-gold hover:text-charcoal transition-all">Login</Link>
                )}
              </div>
            </div>
          </div>

        </div>

      </header>

      <AnimatePresence mode="wait">
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileMenu(false)}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full max-h-[100dvh] bg-white z-[70] shadow-2xl flex flex-col"
              style={{ width: 'min(80vw, 320px)' }}
            >
              <div className="flex-none flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <Link to="/" onClick={() => setMobileMenu(false)} className="flex items-center gap-3">
                  <SafeImage src="https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0043.jpg?updatedAt=1772379265473" width={150} alt="Logo" className="h-9 w-auto aspect-square object-cover rounded-full" />
                  <div className="flex flex-col leading-none">
                    <span className="font-black text-[15px] tracking-tight text-charcoal">MAGIZHCHI</span>
                    <span className="font-black text-[8px] tracking-[0.28em] text-premium-gold uppercase mt-0.5">GARMENTS</span>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileMenu(false)}
                  aria-label="Close menu"
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-charcoal hover:bg-gray-200 transition-all ml-2 flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-1">
                {NAV_LINKS.map((link, idx) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.1 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setMobileMenu(false)}
                      className={`block py-4 text-xl font-black tracking-tight border-b border-gray-100 last:border-0 transition-colors ${location.pathname === link.path ? 'text-premium-gold' : 'text-charcoal hover:text-premium-gold'}`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="pt-5"
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-premium-gold mb-3">Collections</p>
                  {categories.map((cat, idx) => (
                    <motion.div
                      key={cat.path}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + idx * 0.05 }}
                    >
                      <Link
                        to={cat.path}
                        onClick={() => setMobileMenu(false)}
                        className="flex items-center gap-2 py-3.5 text-[11px] font-black uppercase tracking-widest text-charcoal/70 hover:text-premium-gold transition-colors border-b border-gray-100 last:border-0"
                      >
                        <Sparkles size={9} className="text-premium-gold/70 flex-shrink-0" />
                        {cat.label}
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>

                {isAuthenticated && (
                  <div className="pt-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-premium-gold mb-3">My Account</p>
                    {user?.role === 'admin' ? (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenu(false)}
                        className="block py-2.5 text-sm font-bold text-premium-gold hover:text-premium-gold transition-colors border-b border-gray-50 last:border-0"
                      >
                        Admin Panel
                      </Link>
                    ) : user?.role === 'staff' ? (
                      <Link
                        to="/staff"
                        onClick={() => setMobileMenu(false)}
                        className="block py-2.5 text-sm font-bold text-premium-gold hover:text-premium-gold transition-colors border-b border-gray-50 last:border-0"
                      >
                        Staff Portal
                      </Link>
                    ) : (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => setMobileMenu(false)}
                          className="block py-2.5 text-sm font-bold text-charcoal hover:text-premium-gold transition-colors border-b border-gray-50 last:border-0"
                        >
                          My Profile
                        </Link>
                        <Link
                          to="/dashboard/orders"
                          onClick={() => setMobileMenu(false)}
                          className="block py-2.5 text-sm font-bold text-charcoal hover:text-premium-gold transition-colors border-b border-gray-50 last:border-0"
                        >
                          Order History
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-none px-6 pt-4 pb-8 border-t border-gray-100">
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="w-full py-3.5 bg-stock-out/10 text-stock-out font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-stock-out hover:text-white transition-all"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenu(false)}
                    className="btn-primary block w-full text-center py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg"
                  >
                    Login
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
