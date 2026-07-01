import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

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
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrolled(currentScrollY > 50);
          if (currentScrollY < 10) {
            setVisible(true);
          } else if (currentScrollY > lastScrollY.current) {
            setVisible(false);
          } else {
            setVisible(true);
          }
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    navigate('/');
    setShowUserMenu(false);
    setTimeout(() => {
      logout();
    }, 50);
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 premium-header h-16 md:h-20 transition-all duration-300 ${scrolled ? 'glass shadow-2xl shadow-black/10' : 'bg-transparent'} ${!visible ? '-translate-y-full md:translate-y-0' : 'translate-y-0'}`}>
        <div className="container-custom h-full">

          {/* MOBILE HEADER */}
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

            {/* Center: logo */}
            <div className="flex-1 flex justify-center">
              <Link 
                to="/" 
                className={`flex items-center gap-2 leading-none transition-transform duration-500 origin-center ${scrolled ? 'scale-90' : 'scale-100'}`} 
                style={{ textDecoration: 'none' }}
              >
                <SafeImage
                  src="https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0043.jpg?updatedAt=1772379265473"
                  alt="Magizhchi"
                  width={150}
                  height={150}
                  quality={100}
                  priority={true}
                  fetchPriority="high"
                  loading="eager"
                  className="w-auto h-8 aspect-square object-cover rounded-full flex-shrink-0"
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

          {/* DESKTOP HEADER */}
          <div className="hidden lg:flex items-center justify-between h-full flex-nowrap gap-2">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link 
                to="/" 
                aria-label="Go to homepage" 
                className={`flex items-center gap-2 md:gap-3 group transition-transform duration-500 origin-left ${scrolled ? 'scale-90' : 'scale-100'}`}
              >
                <div className="perspective-1000 transition-transform duration-500 hover:scale-105">
                  <SafeImage 
                    src="https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0043.jpg?updatedAt=1772379265473" 
                    width={150} 
                    height={150}
                    quality={100}
                    priority={true}
                    fetchPriority="high"
                    loading="eager"
                    alt="Magizhchi" 
                    className="w-auto h-10 md:h-12 aspect-square object-cover rounded-full" 
                  />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-black tracking-[0.1em] text-charcoal leading-none whitespace-nowrap text-lg md:text-2xl hover:text-premium-gold transition-colors duration-300">
                    MAGIZHCHI
                  </span>
                  <span className="font-black tracking-[0.4em] text-premium-gold uppercase whitespace-nowrap text-[8px] mt-1 md:text-[10px] mt-1.5">
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
                    <div
                      className={`absolute top-full left-0 mt-4 w-64 glass rounded-[2rem] shadow-2xl border border-white/40 overflow-hidden py-4 transition-all duration-300 origin-top ${showDropdown ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
                    >
                      {categories.map(cat => (
                        <Link key={cat.path} to={cat.path} className="flex items-center gap-3 px-4 sm:px-6 py-3 text-[10px] font-black uppercase tracking-widest text-charcoal hover:text-premium-gold hover:bg-premium-gold/5 transition-all">
                          <Sparkles size={12} className="text-premium-gold/60" /> {cat.label}
                        </Link>
                      ))}
                    </div>
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
                    <div
                      className={`absolute top-full right-0 mt-4 w-56 glass rounded-[2rem] shadow-2xl border border-white/40 overflow-hidden py-4 z-[100] transition-all duration-300 origin-top-right ${showUserMenu ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
                    >
                      <div className="px-4 sm:px-6 py-4 border-b border-white/20 mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-charcoal/60">Welcome back</p>
                        <p className="text-xs font-black text-charcoal truncate">{user?.name || 'Customer'}</p>
                      </div>
                      {user?.role === 'admin' ? (
                        <Link to="/admin" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 sm:px-6 py-3 text-[10px] font-black uppercase tracking-widest text-premium-gold hover:bg-premium-gold/5 transition-all">Admin Panel</Link>
                      ) : user?.role === 'staff' ? (
                        <Link to="/staff" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 sm:px-6 py-3 text-[10px] font-black uppercase tracking-widest text-premium-gold hover:bg-premium-gold/5 transition-all">Staff Portal</Link>
                      ) : (
                        <>
                          <Link to="/dashboard" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 sm:px-6 py-3 text-[10px] font-black uppercase tracking-widest text-charcoal/60 hover:text-premium-gold hover:bg-premium-gold/5 transition-all">My Account</Link>
                          <Link to="/dashboard" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 sm:px-6 py-3 text-[10px] font-black uppercase tracking-widest text-charcoal/60 hover:text-premium-gold hover:bg-premium-gold/5 transition-all">Order History</Link>
                        </>
                      )}
                      <div className="h-px bg-white/20 my-2 mx-4" />
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 sm:px-6 py-3 text-[10px] font-black uppercase tracking-widest text-stock-out hover:bg-stock-out/5 transition-all text-left">Sign Out</button>
                    </div>
                  </div>
                ) : (
                  <Link to="/login" className="px-4 sm:px-6 py-2.5 bg-charcoal text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-premium-gold hover:text-charcoal transition-all">Login</Link>
                )}
              </div>
            </div>
          </div>

        </div>

      </header>

      {/* Backdrop */}
      <div
        onClick={() => setMobileMenu(false)}
        className={`fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full max-h-[100dvh] bg-white z-[70] shadow-2xl flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 'min(80vw, 320px)' }}
      >
        <div className="flex-none flex items-center justify-between px-4 sm:px-6 py-5 border-b border-gray-100">
          <Link to="/" onClick={() => setMobileMenu(false)} className="flex items-center gap-3">
            <SafeImage src="https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0043.jpg?updatedAt=1772379265473" width={55} height={55} quality={80} alt="Logo" className="h-9 w-auto aspect-square object-cover rounded-full" />
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

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 space-y-1">
          {NAV_LINKS.map((link) => (
            <div key={link.path}>
              <Link
                to={link.path}
                onClick={() => setMobileMenu(false)}
                className={`block py-4 text-xl font-black tracking-tight border-b border-gray-100 last:border-0 transition-colors ${location.pathname === link.path ? 'text-premium-gold' : 'text-charcoal hover:text-premium-gold'}`}
              >
                {link.label}
              </Link>
            </div>
          ))}

          <div className="pt-5">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-premium-gold mb-3">Collections</p>
            {categories.map((cat) => (
              <div key={cat.path}>
                <Link
                  to={cat.path}
                  onClick={() => setMobileMenu(false)}
                  className="flex items-center gap-2 py-3.5 text-[11px] font-black uppercase tracking-widest text-charcoal/70 hover:text-premium-gold transition-colors border-b border-gray-100 last:border-0"
                >
                  <Sparkles size={9} className="text-premium-gold/70 flex-shrink-0" />
                  {cat.label}
                </Link>
              </div>
            ))}
          </div>

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

        <div className="flex-none px-4 sm:px-6 pt-4 pb-8 border-t border-gray-100">
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
      </div>
    </>
  );
}
