import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars

import { Eye, EyeOff, ArrowLeft, Phone, Mail, Sparkles, ShieldCheck } from 'lucide-react';
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



  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  // Detect input type for dynamic UI
  const inputType = isEmail(identifier) ? 'email' : isPhone(identifier) ? 'phone' : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return toast.error('Enter your email or phone number');
    if (!password) return toast.error('Enter your password');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');

    setLoading(true);
    try {
      const { data } = await authService.login(identifier.trim(), password);
      const { user, accessToken, isNewUser } = data.data;
      setAuth(user, accessToken);

      if (isNewUser) {
        toast.success(`Welcome to Magizhchi, ${user.name}! 🎉`, { duration: 4000 });
      } else {
        toast.success(`Welcome back, ${user.name}!`);
      }

      const role = user.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'staff') navigate('/staff');
      else navigate(from);
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
      const { user, accessToken } = data.data;
      setAuth(user, accessToken);
      toast.success(`Welcome to Magizhchi, ${user.name}! ✨`, { duration: 4000 });
      navigate(from);
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

      <div className="min-h-screen bg-cream-bg flex">
        {/* ── Left Panel (desktop) ── */}
        <div className="hidden lg:flex flex-col justify-between w-5/12 bg-dark-gradient p-12 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-premium-gold/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-premium-gold/8 rounded-full blur-3xl" />
          </div>

          {/* Logo */}
          <div className="relative z-10">
            <div className="font-display text-3xl font-bold text-white tracking-[0.2em]">MAGIZHCHI</div>
            <div className="text-[9px] text-white/40 tracking-[0.5em] uppercase mt-1">GARMENTS</div>
          </div>

          {/* Middle content */}
          <div className="relative z-10">
            <div className="w-12 h-0.5 bg-gold-gradient mb-8" />
            <h2 className="text-white text-3xl font-bold leading-snug mb-4">
              Your style,<br />your account.
            </h2>
            <p className="text-white/50 leading-relaxed text-sm max-w-xs">
              New here? Just enter your phone or email with a password — we'll create your account instantly. No registration form needed.
            </p>

            <div className="mt-10 space-y-4">
              {[
                { icon: '🔐', text: 'Secure login — no OTP needed to sign in' },
                { icon: '✨', text: 'First visit auto-creates your account' },
                { icon: '📦', text: 'Track orders & manage wishlist' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-white/50 text-sm">
                  <span className="text-base">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="relative z-10 text-white/20 text-xs">
            © {new Date().getFullYear()} Magizhchi Garments. All rights reserved.
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            {/* Back link */}
            <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm mb-8">
              <ArrowLeft size={16} /> Back to Store
            </Link>

            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="font-display text-2xl font-bold tracking-widest">MAGIZHCHI</div>
              <div className="text-[9px] text-text-muted tracking-[0.4em] uppercase mt-1">GARMENTS</div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-text-primary">Welcome</h1>
              <p className="text-text-muted text-sm mt-1">
                Login or create an account — all in one step
              </p>
            </div>

            {/* Auto-create notice */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-2.5"
            >
              <Sparkles size={15} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-amber-700 text-xs leading-relaxed">
                <strong>New customer?</strong> Just enter any phone/email + a password (8+ chars). We'll create your account automatically — no sign-up form needed!
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identifier input */}
              <div>
                <label className="text-sm font-medium text-text-primary block mb-1.5">
                  Phone Number or Email
                </label>
                <div className="relative">
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="9876543210 or you@email.com"
                    className="input pr-10"
                    autoComplete="username"
                    inputMode="text"
                  />

                  {/* Type indicator icon */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-all">
                    <AnimatePresence mode="wait">
                      {inputType === 'phone' && (
                        <motion.div key="phone" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Phone size={16} className="text-premium-gold" />
                        </motion.div>
                      )}
                      {inputType === 'email' && (
                        <motion.div key="email" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Mail size={16} className="text-premium-gold" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                {/* Helper text */}
                <AnimatePresence>
                  {inputType === 'phone' && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <ShieldCheck size={11} /> Phone number detected
                    </motion.p>
                  )}
                  {inputType === 'email' && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <ShieldCheck size={11} /> Email address detected
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password input */}
              <div>
                <label className="text-sm font-medium text-text-primary block mb-1.5">
                  Password <span className="text-text-muted font-normal">(min 8 characters)</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="input pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        password.length >= i * 3
                          ? password.length >= 12 ? 'bg-emerald-500'
                          : password.length >= 8 ? 'bg-amber-400' : 'bg-red-400'
                          : 'bg-gray-200'
                      }`} />
                    ))}
                  </div>
                )}
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-premium-gold hover:underline">
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full py-3.5 text-base font-semibold disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" />
                    </svg>
                    Please wait...
                  </span>
                ) : 'Continue →'}
              </motion.button>
            </form>

              {/* Instant Guest Login */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-light"></div></div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-cream-bg px-4 text-text-muted">Or skip registration</span></div>
              </div>

              <motion.button
                type="button"
                onClick={handleQuickGuest}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-premium-gold/30 hover:border-premium-gold bg-premium-gold/5 flex flex-col items-center gap-1 transition-all group"
              >
                <div className="flex items-center gap-2 font-black text-[10px] text-premium-gold tracking-[0.2em] uppercase">
                  <Sparkles size={14} className="animate-pulse" />
                  Continue as Guest
                </div>
                <span className="text-[9px] text-text-muted font-bold opacity-60 group-hover:opacity-100 uppercase tracking-widest">Instant Demo Profile · One Click</span>
              </motion.button>
          </motion.div>
        </div>
      </div>
    </>
  );
}
