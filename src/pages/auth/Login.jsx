import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { Eye, EyeOff, ArrowLeft, Phone, Mail, Sparkles, ShieldCheck, Zap, Info, ArrowRight, Star, CheckCircle2, Lock, Key } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import { authService } from '../../services';
import { useAuthStore } from '../../store';
import SafeImage from '../../components/common/SafeImage';

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v) => /^\d{10}$/.test(v.replace(/\D/g, ''));

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('smart');

  const { setAuth, logout, isAuthenticated, user } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/';

  useEffect(() => {
    const checkHydration = () => {
      if (useAuthStore.persist.hasHydrated()) {
        setIsHydrated(true);
      }
    };
    checkHydration();
    const timer = setTimeout(checkHydration, 50);
    return () => clearTimeout(timer);
  }, []);

  // ─── REDIRECTION HELPER ───
  const performRedirect = (userData) => {
    const role = userData?.role;
    
    // Safety check: Only allow 'user' role on this page
    if (role !== 'user') {
      logout();
      toast.error('Access Denied. Please use the Admin or Staff login portal.');
      return;
    }

    const dashboardPath = (from === '/' || from === '/login' || from.includes('/admin') || from.includes('/staff')) ? '/' : from;
    navigate(dashboardPath, { replace: true });
  };

  // Handle case where user visits /login while already logged in
  useEffect(() => {
    if (isHydrated && isAuthenticated && user?.role) {
      if (user.role === 'user') {
        performRedirect(user);
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'staff') {
        navigate('/staff', { replace: true });
      }
    }
  }, [isHydrated, isAuthenticated, user]);

  // Don't render if already redirecting
  if (isAuthenticated && user?.role === 'user') return null;

  const inputType = isEmail(identifier) ? 'email' : isPhone(identifier) ? 'phone' : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return toast.error('Enter your email or phone number');
    if (!password) return toast.error('Enter your password');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');

    setLoading(true);
    try {
      const { data } = await authService.login(identifier.trim(), password);
      const userData = data.data.user;
      const accessToken = data.data.accessToken;

      // ROLE ENFORCEMENT: Customer portal ONLY for users
      if (userData.role !== 'user') {
        setLoading(false);
        return toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-bold">Access Restricted</span>
            <span className="text-xs">This portal is for customers only. Please use the {userData.role} login page.</span>
          </div>,
          { duration: 5000 }
        );
      }

      setAuth(userData, accessToken);
      
      if (userData.isNewUser) {
        toast.success(`Welcome to Magizhchi, ${userData.name}! 🎉`, { duration: 4000 });
      } else {
        toast.success(`Welcome back, ${userData.name}!`);
      }

      performRedirect(userData);

    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickGuest = async () => {
    setLoading(true);
    try {
      const { data } = await authService.quickGuest();
      const userData = data.data.user;
      const accessToken = data.data.accessToken;
      setAuth(userData, accessToken);
      toast.success(`Welcome to Magizhchi, ${userData.name}! ✨`, { duration: 4000 });
      performRedirect(userData);
    } catch (err) {
      toast.error('Failed to create guest profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login — Magizhchi Garments</title>
        <meta name="description" content="Login to Magizhchi Garments to shop premium men's fashion." />
      </Helmet>

      <div className="min-h-dvh bg-gradient-to-tr from-[#FAF8F5] via-[#FFFDFB] to-[#F7F4EF] flex flex-col lg:flex-row overflow-x-hidden relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-premium-gold/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-[300px] h-[300px] bg-premium-gold/3 rounded-full blur-[80px] pointer-events-none" />

        {/* ── Left Side (Premium Brand Sidebar) ── */}
        <div className="hidden lg:flex lg:w-[45%] bg-[#0B0B0C] relative overflow-hidden flex-col justify-between p-16 border-r border-white/[0.05]">
          {/* Animated Background Mesh */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div 
              animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15], x: [0, 40, 0], y: [0, -30, 0] }} 
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} 
              className="absolute top-[-15%] left-[-15%] w-[700px] h-[700px] bg-gradient-to-br from-premium-gold/20 to-transparent rounded-full blur-[130px]" 
            />
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1], x: [0, -30, 0], y: [0, 50, 0] }} 
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }} 
              className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-premium-gold/15 rounded-full blur-[110px]" 
            />
          </div>

          {/* Logo Section */}
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 group">
              <SafeImage
                src="https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0043.jpg?updatedAt=1772379265473"
                alt="Magizhchi Logo"
                width={55}
                height={55}
                quality={80}
                priority={true}
                fetchPriority="high"
                loading="eager"
                className="w-12 h-12 object-cover rounded-full shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-transform duration-500 group-hover:scale-105"
              />
              <div className="flex flex-col leading-none">
                <h1 className="font-display text-2xl font-black text-white tracking-widest leading-none">MAGIZHCHI</h1>
                <p className="text-[8px] text-premium-gold/70 font-black tracking-[0.25em] mt-1.5 uppercase leading-none">Premium Garments</p>
              </div>
            </Link>
          </div>

          {/* Core Content */}
          <div className="relative z-10 mt-12 my-auto">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
              <span className="inline-block px-3 py-1 bg-premium-gold/10 border border-premium-gold/20 text-premium-gold rounded-full text-[9px] font-black uppercase tracking-[0.25em] mb-6">CUSTOMER PORTAL</span>
              <h2 className="text-5xl xl:text-6xl font-black text-white leading-[1.1] mb-8 tracking-tight">
                Elegance in <br />
                <span className="bg-gradient-to-r from-premium-gold via-amber-400 to-premium-gold bg-clip-text text-transparent italic font-serif">Every Thread.</span>
              </h2>
              
              <div className="space-y-4 max-w-md">
                {[
                  { icon: ShieldCheck, title: 'Frosted Security Shield', desc: 'Enterprise-grade end-to-end encryption keeping your purchases and details completely secure.' },
                  { icon: Zap, title: 'Zero Friction Login', desc: 'No lengthy sign-up forms. Enter phone or email with a password to instantly create or access your profile.' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md hover:bg-white/[0.05] transition-all">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-premium-gold/20 to-amber-500/10 flex items-center justify-center text-premium-gold border border-premium-gold/20 shrink-0"><item.icon size={20} /></div>
                    <div>
                      <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-1.5">{item.title}</h4>
                      <p className="text-white/40 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Footer Section */}
          <div className="relative z-10 flex justify-between items-center border-t border-white/[0.05] pt-6">
            <p className="text-white/20 text-[10px] font-bold tracking-widest uppercase">Est. 2024 · Tamil Nadu</p>
            <p className="text-premium-gold/40 text-[9px] font-bold tracking-[0.2em] uppercase">Handcrafted for You</p>
          </div>
        </div>

        {/* ── Right Side (Interactive Glassmorphic Form) ── */}
        <div className="flex-1 flex flex-col min-h-dvh relative z-10">
          {/* Top Header Navigation */}
          <div className="flex items-center justify-between px-8 py-8 lg:px-16">
            <Link to="/" className="lg:hidden flex items-center gap-3 group">
               <SafeImage
                 src="https://ik.imagekit.io/Lourdu/magizhchi_garments/maghchi%20image/IMG-20251126-WA0043.jpg?updatedAt=1772379265473"
                 alt="Magizhchi Logo"
                 width={55}
                 height={55}
                 quality={80}
                 priority={true}
                 fetchPriority="high"
                 loading="eager"
                 className="w-10 h-10 object-cover rounded-full shadow-[0_0_15px_rgba(212,175,55,0.2)]"
               />
               <div className="flex flex-col leading-none">
                 <span className="font-black text-charcoal text-sm tracking-widest leading-none">MAGIZHCHI</span>
                 <span className="font-black text-premium-gold text-[8px] tracking-[0.25em] mt-1 uppercase leading-none">Garments</span>
               </div>
            </Link>
            <Link to="/" className="text-[10px] font-black text-charcoal/40 hover:text-premium-gold uppercase tracking-[0.2em] transition-all flex items-center gap-2 px-4 py-2 bg-white border border-charcoal/5 rounded-full shadow-sm hover:shadow-md">
              <ArrowLeft size={13} /> Back to Store
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center px-6 pb-20">
            <div className="w-full max-w-[450px]">
              
              {/* Heading */}
              <div className="text-center mb-6">
                <motion.h3 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-black text-charcoal tracking-tight mb-2">Customer Login</motion.h3>
                <p className="text-charcoal/50 text-sm font-medium">Access your premium wardrobe, active orders and wishlist</p>
              </div>



              {/* ── ULTRA-HIGH LEVEL INTERACTIVE PORTAL GUIDE ── */}
              <div className="bg-white border border-charcoal/5 shadow-xl shadow-charcoal/5 rounded-[2rem] overflow-hidden mb-6">
                <div className="bg-premium-gold/5 px-6 py-3 border-b border-charcoal/5 flex items-center gap-2">
                  <Sparkles size={15} className="text-premium-gold" />
                  <h4 className="text-[10px] font-black text-charcoal uppercase tracking-[0.2em]">Magizhchi Interactive Smart Guide</h4>
                </div>
                
                {/* Guide Segmented Tabs Selector */}
                <div className="flex border-b border-charcoal/5 bg-[#FAF8F5]/50 p-1.5 gap-1">
                  {[
                    { id: 'smart', label: '⚡ Smart Login', icon: Zap },
                    { id: 'forgot', label: '🔑 Recovery', icon: Key },
                    { id: 'guest', label: '👤 Guest Access', icon: Star }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveGuideTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                        activeGuideTab === tab.id 
                          ? 'bg-charcoal text-white shadow-md shadow-charcoal/15' 
                          : 'text-charcoal/50 hover:bg-charcoal/5'
                      }`}
                    >
                      <tab.icon size={12} className={activeGuideTab === tab.id ? 'text-premium-gold' : 'text-charcoal/40'} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content Display */}
                <div className="p-5 min-h-[95px] flex items-center bg-[#FFFDFB]">
                  <AnimatePresence mode="wait">
                    {activeGuideTab === 'smart' && (
                      <motion.div 
                        key="smart" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                        className="space-y-2 w-full"
                      >
                        <p className="text-[10px] font-bold text-premium-gold uppercase tracking-[0.15em] flex items-center gap-1">⚡ 2-in-1 Seamless Auto Portal</p>
                        <p className="text-[11px] leading-relaxed text-charcoal/60 font-medium">
                          No separate sign-up pages or activation links! Enter your Email or 10-digit Phone, type an 8-character password, and click <strong className="text-charcoal">Unlock</strong>. If you are <strong className="text-charcoal font-black">New</strong>, our system creates your profile and password instantly in 0.1s. If you are a <strong className="text-charcoal font-black">Returning Customer</strong>, we simply verify your password and log you in. Your active cart, shipping addresses, and wishlist load automatically!
                        </p>
                      </motion.div>
                    )}

                    {activeGuideTab === 'forgot' && (
                      <motion.div 
                        key="forgot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                        className="space-y-2 w-full"
                      >
                        <p className="text-[10px] font-bold text-premium-gold uppercase tracking-[0.15em] flex items-center gap-1">🔑 2-Step Secure OTP Password Reset</p>
                        <p className="text-[11px] leading-relaxed text-charcoal/60 font-medium">
                          Forgot your password? Click <strong className="text-charcoal">Forgot?</strong> above the password field. Enter your email or phone to receive a secure 6-digit OTP instantly via <strong className="text-emerald-600">WhatsApp</strong> or <strong className="text-amber-600">Email</strong>. Enter it to set your new password!
                        </p>
                      </motion.div>
                    )}

                    {activeGuideTab === 'guest' && (
                      <motion.div 
                        key="guest" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                        className="space-y-2 w-full"
                      >
                        <p className="text-[10px] font-bold text-premium-gold uppercase tracking-[0.15em] flex items-center gap-1">👤 One-Click Instant Guest Mode</p>
                        <p className="text-[11px] leading-relaxed text-charcoal/60 font-medium">
                          In a rush? Click <strong className="text-charcoal">Continue as Guest</strong> at the bottom. A temporary account is generated in 1 second, allowing you to checkout and build your wishlist immediately without any password!
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Identifier Box */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-charcoal/40 uppercase tracking-[0.2em] px-1">Phone or Email</label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-charcoal/30 group-focus-within:text-premium-gold transition-colors duration-300">
                      {inputType === 'email' ? <Mail size={16} /> : <Phone size={16} />}
                    </div>
                    <input
                      type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="9876543210 or your@email.com"
                      className="w-full pl-12 pr-6 py-3.5 bg-white border-2 border-charcoal/[0.06] rounded-2xl text-sm font-bold focus:border-premium-gold focus:ring-[4px] focus:ring-premium-gold/15 outline-none transition-all duration-300 shadow-sm"
                    />
                  </div>
                </div>

                {/* Password Box */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[9px] font-black text-charcoal/40 uppercase tracking-[0.2em]">Password</label>
                    <Link to="/forgot-password" className="text-[9px] font-black text-premium-gold hover:text-amber-600 transition-colors uppercase tracking-[0.15em]">Forgot?</Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-charcoal/30 group-focus-within:text-premium-gold transition-colors duration-300">
                      <Zap size={16} />
                    </div>
                    <input
                      type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full pl-12 pr-12 py-3.5 bg-white border-2 border-charcoal/[0.06] rounded-2xl text-sm font-bold focus:border-premium-gold focus:ring-[4px] focus:ring-premium-gold/15 outline-none transition-all duration-300 shadow-sm"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-charcoal/20 hover:text-charcoal transition-colors">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit" disabled={loading} whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-6 bg-gradient-to-r from-charcoal via-[#1C1C1E] to-charcoal text-white rounded-2xl font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-charcoal/25 hover:shadow-premium-gold/15 hover:from-premium-gold hover:to-amber-500 hover:text-charcoal transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 border border-white/[0.05]"
                >
                  {loading ? 'Verifying Credentials...' : 'Customer Unlock →'}
                </motion.button>
              </form>

              {/* Alternative Divider */}
              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-charcoal/[0.05]"></div></div>
                <div className="relative flex justify-center"><span className="bg-[#FFFDFB] px-4 text-[9px] font-black text-charcoal/20 uppercase tracking-[0.4em]">Alternative</span></div>
              </div>

              {/* Guest Access Button */}
              <motion.button
                type="button" onClick={handleQuickGuest} disabled={loading} whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.99 }}
                className="w-full p-5 rounded-2xl bg-white border-2 border-dashed border-premium-gold/30 hover:border-premium-gold hover:bg-premium-gold/[0.03] transition-all duration-300 flex items-center gap-4 shadow-sm"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-premium-gold/15 to-amber-500/10 flex items-center justify-center text-premium-gold border border-premium-gold/20 shrink-0"><Star size={18} /></div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-premium-gold uppercase tracking-[0.25em] mb-1">Continue as Guest</p>
                  <p className="text-[9px] text-charcoal/40 font-bold uppercase tracking-widest">No password needed · 1-Click Access</p>
                </div>
                <ArrowRight size={13} className="ml-auto text-premium-gold opacity-50" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
