import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { Eye, EyeOff, ArrowLeft, Phone, Mail, Sparkles, ShieldCheck, Zap, Info, ArrowRight, Star, CheckCircle2, Lock } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import { authService } from '../../services';
import { useAuthStore } from '../../store';

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v) => /^\d{10}$/.test(v.replace(/\D/g, ''));

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

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

    const dashboardPath = (from === '/' || from === '/login' || from.includes('/admin') || from.includes('/staff')) ? '/dashboard' : from;
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

      <div className="min-h-screen bg-[#FDFBF7] flex flex-col lg:flex-row overflow-x-hidden">
        {/* ── Left Side ── */}
        <div className="hidden lg:flex lg:w-1/2 bg-charcoal relative overflow-hidden flex-col justify-between p-16">
          <div className="absolute inset-0 pointer-events-none">
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], x: [0, 50, 0] }} transition={{ duration: 10, repeat: Infinity }} className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-premium-gold/10 rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-4">
              <div className="w-12 h-12 bg-premium-gold rounded-2xl flex items-center justify-center rotate-12 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                <span className="text-charcoal font-black text-xl">M</span>
              </div>
              <div>
                <h1 className="font-display text-2xl font-black text-white tracking-widest leading-none">MAGIZHCHI</h1>
                <p className="text-[10px] text-premium-gold/60 font-black tracking-[0.5em] mt-1.5 uppercase">Premium Garments</p>
              </div>
            </Link>
          </div>

          <div className="relative z-10 mt-12">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-5xl xl:text-6xl font-black text-white leading-[1.1] mb-6">
                Elegance in <br />
                <span className="text-premium-gold italic font-serif">Every Thread.</span>
              </h2>
              <div className="space-y-6 max-w-sm">
                {[
                  { icon: ShieldCheck, title: 'Customer Security', desc: 'Protected by secure encryption and multi-step verification.' },
                  { icon: Zap, title: 'Smart Login', desc: 'No complex forms. Your credentials create your account.' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-premium-gold/10 flex items-center justify-center text-premium-gold"><item.icon size={20} /></div>
                    <div>
                      <h4 className="text-white text-sm font-bold uppercase tracking-widest mb-1">{item.title}</h4>
                      <p className="text-white/30 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="relative z-10"><p className="text-white/20 text-[10px] font-bold tracking-widest uppercase">Est. 2024 · Tamil Nadu</p></div>
        </div>

        {/* ── Right Side ── */}
        <div className="flex-1 flex flex-col min-h-screen">
          <div className="flex items-center justify-between px-8 py-8 lg:px-12">
            <Link to="/" className="lg:hidden flex items-center gap-3">
               <div className="w-10 h-10 bg-charcoal text-premium-gold rounded-xl flex items-center justify-center font-black">M</div>
               <span className="font-black text-charcoal tracking-widest text-sm">MAGIZHCHI</span>
            </Link>
            <Link to="/" className="text-[10px] font-black text-charcoal/40 hover:text-charcoal uppercase tracking-[0.2em] transition-all flex items-center gap-2">
              <ArrowLeft size={14} /> Back to Store
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center px-6 pb-20">
            <div className="w-full max-w-[440px]">
              <div className="text-center mb-8">
                <motion.h3 className="text-4xl font-black text-charcoal mb-3">Customer Login</motion.h3>
                <p className="text-charcoal/50 text-sm font-medium">Access your orders, wishlist and profile</p>
              </div>

              {/* ── IMPORTANT PORTAL NOTICE ── */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex items-start gap-3">
                <Lock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-amber-700 leading-relaxed uppercase tracking-wider">
                  Important: This page is for <span className="underline">Customers Only</span>. Admins and Staff must use their dedicated login portals.
                </p>
              </div>

              {/* ── HOW IT WORKS ── */}
              <div className="bg-white border border-charcoal/5 shadow-xl shadow-charcoal/5 rounded-[2rem] overflow-hidden mb-8">
                <div className="bg-premium-gold/5 px-6 py-4 border-b border-charcoal/5 flex items-center gap-3">
                  <Sparkles size={16} className="text-premium-gold" />
                  <h4 className="text-[11px] font-black text-charcoal uppercase tracking-[0.15em]">Smart Login Guide</h4>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex gap-4">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <p className="text-[10px] leading-relaxed text-charcoal/50 font-bold uppercase tracking-widest">First time? Enter details to create account instantly.</p>
                  </div>
                  <div className="flex gap-4">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <p className="text-[10px] leading-relaxed text-charcoal/50 font-bold uppercase tracking-widest">Returning? Use same password to log in.</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.15em] px-1">Phone or Email</label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-charcoal/30 group-focus-within:text-premium-gold transition-colors">
                      {inputType === 'email' ? <Mail size={18} /> : <Phone size={18} />}
                    </div>
                    <input
                      type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="9876543210 or your@email.com"
                      className="w-full pl-14 pr-6 py-4 bg-white border-2 border-charcoal/5 rounded-[1.5rem] text-sm font-bold focus:border-premium-gold outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.15em]">Password</label>
                    <Link to="/forgot-password" size="sm" className="text-[10px] font-black text-premium-gold hover:underline uppercase tracking-widest">Forgot?</Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-charcoal/30 group-focus-within:text-premium-gold transition-colors">
                      <Zap size={18} />
                    </div>
                    <input
                      type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full pl-14 pr-14 py-4 bg-white border-2 border-charcoal/5 rounded-[1.5rem] text-sm font-bold focus:border-premium-gold outline-none transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-charcoal/20 hover:text-charcoal transition-colors">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit" disabled={loading} whileHover={{ scale: 1.01, y: -2 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-5 bg-charcoal text-white rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-xs shadow-xl shadow-charcoal/20 hover:bg-premium-gold hover:text-charcoal transition-all disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Customer Unlock →'}
                </motion.button>
              </form>

              <div className="relative my-12">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-charcoal/5"></div></div>
                <div className="relative flex justify-center"><span className="bg-[#FDFBF7] px-4 text-[9px] font-black text-charcoal/20 uppercase tracking-[0.4em]">Alternative</span></div>
              </div>

              <motion.button
                type="button" onClick={handleQuickGuest} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full p-6 rounded-[2rem] bg-white border-2 border-dashed border-premium-gold/20 hover:border-premium-gold hover:bg-premium-gold/5 transition-all flex items-center gap-5"
              >
                <div className="w-12 h-12 rounded-2xl bg-premium-gold/10 flex items-center justify-center text-premium-gold group-hover:bg-premium-gold group-hover:text-white transition-all"><Star size={20} /></div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-premium-gold uppercase tracking-[0.2em] mb-1">Continue as Guest</p>
                  <p className="text-[9px] text-charcoal/40 font-bold uppercase tracking-widest">No password needed · 1-Click Access</p>
                </div>
                <ArrowRight size={14} className="ml-auto text-premium-gold opacity-40" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
