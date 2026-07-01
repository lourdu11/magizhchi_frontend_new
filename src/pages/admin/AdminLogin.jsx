import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, KeyRound, Smartphone, CheckCircle2, ChevronLeft, Fingerprint, Zap, Globe, Cpu, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store';
import { authService } from '../../services';
import { toast } from 'react-hot-toast';

import { Helmet } from 'react-helmet-async';

export default function AdminLogin() {
  const [step, setStep] = useState('login'); // login, forgot, otp, reset
  const [identifier, setIdentifier] = useState(() => sessionStorage.getItem('admin_login_identifier') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setAuth, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_login_identifier');
    const savedStep = sessionStorage.getItem('admin_login_step');
    if (saved && savedStep === 'verify-2fa') {
      setIdentifier(saved);
      setStep('verify-2fa');
    }
  }, []);

  if (isAuthenticated && user?.role) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'staff') return <Navigate to="/staff/login" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.login(identifier, password);
      
      if (data.data?.status === 'OTP_REQUIRED') {
        toast.success(data.message || 'Security Code Required');
        sessionStorage.setItem('admin_login_identifier', identifier);
        sessionStorage.setItem('admin_login_step', 'verify-2fa');
        setStep('verify-2fa');
        setLoading(false);
        return;
      }

      if (data.data.user.role === 'staff') {
        toast.error('Staff members must use the dedicated Staff Portal.');
        return;
      }

      if (data.data.user.role !== 'admin') {
        toast.error('Unauthorized access. Admin only.');
        return;
      }
      setAuth(data.data.user, data.data.accessToken);
      toast.success(`Access Granted: Administrator Session Active`);
      
      if (data.data.user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAdminOTP = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Please enter the security code');
    if (!identifier) return toast.error('Session expired. Please login again.');
    setLoading(true);
    try {
      const { data } = await authService.verifyAdmin2FA({ identifier, otp });
      sessionStorage.removeItem('admin_login_identifier');
      sessionStorage.removeItem('admin_login_step');
      setAuth(data.data.user, data.data.accessToken);
      toast.success(`Identity Confirmed. Session Active.`);
      
      if (data.data.user.role === 'admin') navigate('/admin');
      else if (data.data.user.role === 'staff') navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid Security Code');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(identifier);
      toast.success('Security Code dispatched.');
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Recovery failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.verifyOTP(identifier, otp, 'password_reset');
      toast.success('Identity Verified');
      setStep('reset');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid Security Code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const { data } = await authService.resetPassword({ identifier, otp, newPassword });
      setAuth(data.data.user, data.data.accessToken);
      toast.success('Credential Update Successful');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-charcoal flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      <Helmet><title>Security Portal — Magizhchi Garments</title></Helmet>

      {/* ── Luxury Dark Dynamic Background ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-premium-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-premium-gold/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03]" />
      </div>

      {/* ── Secure Container ── */}
      <motion.div 
        layout
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex flex-col items-center group mb-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="w-16 h-16 bg-gradient-to-br from-charcoal-light to-charcoal rounded-3xl flex items-center justify-center shadow-2xl border border-white/5 mb-3 relative overflow-hidden"
            >
              <Fingerprint className="w-8 h-8 text-premium-gold" />
            </motion.div>
            <h1 className="font-sans text-xl font-black text-white tracking-[0.2em] uppercase leading-none">MAGIZHCHI</h1>
            <p className="text-[9px] text-premium-gold font-black tracking-[0.4em] mt-2 uppercase">Command Center</p>
          </Link>
        </div>

        <div className="bg-charcoal-light/50 backdrop-blur-xl border border-white/5 p-6 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 'login' && (
              <motion.div key="login" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-11 h-11 rounded-2xl bg-premium-gold/10 flex items-center justify-center text-premium-gold border border-premium-gold/20">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight">Identity Verification</h2>
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">Secure Administrator Portal</p>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-text-muted ml-1">Terminal ID</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-premium-gold transition-colors" />
                      <input
                        type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="admin@magizhchi.com"
                        className="w-full bg-charcoal border border-white/10 text-white pl-11 pr-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-premium-gold/50 focus:border-premium-gold transition-all font-bold placeholder:text-text-muted/30 text-xs tracking-wide"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end px-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-text-muted">Access Code</label>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-premium-gold transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-charcoal border border-white/10 text-white pl-11 pr-12 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-premium-gold/50 focus:border-premium-gold transition-all font-bold placeholder:text-text-muted/30 text-xs tracking-widest"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-premium-gold transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button type="button" onClick={() => setStep('forgot')} className="text-[9px] font-black uppercase tracking-widest text-premium-gold hover:text-white transition-all">Forgot Credentials?</button>
                    </div>
                  </div>

                  <button
                    type="submit" disabled={loading}
                    className="w-full bg-premium-gold hover:bg-premium-gold/90 text-charcoal font-black py-4 rounded-2xl flex items-center justify-center gap-2 group transition-all shadow-lg shadow-premium-gold/20 disabled:opacity-50 text-xs uppercase tracking-[0.15em] relative overflow-hidden"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap size={14} className="group-hover:scale-110 transition-transform" /> <span>Verify & Continue</span></>}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'verify-2fa' && (
              <motion.div key="verify-2fa" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}>
                <button onClick={() => { sessionStorage.removeItem('admin_login_identifier'); sessionStorage.removeItem('admin_login_step'); setStep('login'); setOtp(''); }} className="flex items-center gap-1.5 text-text-muted hover:text-premium-gold transition-colors mb-8 text-[9px] font-black uppercase tracking-widest">
                  <ChevronLeft size={14} /> Return to Login
                </button>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-11 h-11 rounded-2xl bg-premium-gold/10 flex items-center justify-center text-premium-gold border border-premium-gold/20">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight">2FA Security Challenge</h2>
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">Verification required</p>
                  </div>
                </div>
                <form onSubmit={handleVerifyAdminOTP} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-text-muted ml-1">Secure OTP Code</label>
                    <input
                      type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="0 0 0 0 0 0"
                      className="w-full bg-charcoal border border-white/10 text-premium-gold text-center text-3xl tracking-[0.4em] py-4 rounded-2xl focus:border-premium-gold focus:outline-none transition-all font-black placeholder:text-white/10"
                    />
                  </div>
                  <button type="submit" disabled={loading || otp.length < 6} className="w-full bg-premium-gold hover:bg-premium-gold/90 text-charcoal font-black py-4 rounded-2xl shadow-lg shadow-premium-gold/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 uppercase text-xs tracking-widest">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Access Console <CheckCircle2 size={16} /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'forgot' && (
              <motion.div key="forgot" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <button onClick={() => setStep('login')} className="flex items-center gap-1.5 text-text-muted hover:text-premium-gold transition-colors mb-8 text-[9px] font-black uppercase tracking-widest">
                  <ChevronLeft size={14} /> Return to Portal
                </button>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-11 h-11 rounded-2xl bg-premium-gold/10 flex items-center justify-center text-premium-gold border border-premium-gold/20">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight">Identity Recovery</h2>
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">Authorized credential dispatch</p>
                  </div>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-text-muted ml-1">Account Identifier</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="admin@magizhchi.com"
                        className="w-full bg-charcoal border border-white/10 text-white pl-11 pr-5 py-3.5 rounded-2xl focus:border-premium-gold focus:outline-none transition-all font-bold placeholder:text-text-muted/30 text-xs"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-premium-gold hover:bg-premium-gold/90 text-charcoal font-black py-4 rounded-2xl shadow-lg shadow-premium-gold/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 uppercase text-xs tracking-widest">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Dispatch Security Key <ArrowRight size={16} /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}>
                <button onClick={() => setStep('forgot')} className="flex items-center gap-1.5 text-text-muted hover:text-premium-gold transition-colors mb-8 text-[9px] font-black uppercase tracking-widest">
                  <ChevronLeft size={14} /> Re-enter Identity
                </button>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-11 h-11 rounded-2xl bg-premium-gold/10 flex items-center justify-center text-premium-gold border border-premium-gold/20">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight">Signal Verification</h2>
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">6-Digit encrypted validation</p>
                  </div>
                </div>
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-text-muted ml-1">Secure Code</label>
                    <input
                      type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="0 0 0 0 0 0"
                      className="w-full bg-charcoal border border-white/10 text-premium-gold text-center text-3xl tracking-[0.4em] py-4 rounded-2xl focus:border-premium-gold focus:outline-none transition-all font-black placeholder:text-white/10"
                    />
                  </div>
                  <button type="submit" disabled={loading || otp.length < 6} className="w-full bg-premium-gold hover:bg-premium-gold/90 text-charcoal font-black py-4 rounded-2xl shadow-lg shadow-premium-gold/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 uppercase text-xs tracking-widest">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Identity <CheckCircle2 size={16} /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'reset' && (
              <motion.div key="reset" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-11 h-11 rounded-2xl bg-premium-gold/10 flex items-center justify-center text-premium-gold border border-premium-gold/20">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight">Access Key Reset</h2>
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">Establish new authorization</p>
                  </div>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5 relative group">
                      <label className="text-[9px] font-black uppercase tracking-wider text-text-muted ml-1">New Access Key</label>
                      <input
                        type={showPassword ? "text" : "password"} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-charcoal border border-white/10 text-white px-5 py-3.5 rounded-2xl focus:border-premium-gold focus:outline-none transition-all font-bold text-xs pr-12"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 translate-y-1 text-text-muted hover:text-premium-gold transition-colors">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="space-y-1.5 relative group">
                      <label className="text-[9px] font-black uppercase tracking-wider text-text-muted ml-1">Confirm Access Key</label>
                      <input
                        type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-charcoal border border-white/10 text-white px-5 py-3.5 rounded-2xl focus:border-premium-gold focus:outline-none transition-all font-bold text-xs pr-12"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-premium-gold hover:bg-premium-gold/90 text-charcoal font-black py-4 rounded-2xl shadow-lg shadow-premium-gold/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 uppercase text-xs tracking-widest">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Update Credentials <ArrowRight size={16} /></>}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Security Badges */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-3">
            <div className="flex gap-6">
              <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                <Globe size={12} className="text-premium-gold" />
                <span className="text-[7.5px] font-black text-text-muted uppercase tracking-wider">Cloud Engine</span>
              </div>
              <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                <Cpu size={12} className="text-premium-gold" />
                <span className="text-[7.5px] font-black text-text-muted uppercase tracking-wider">Secure Node</span>
              </div>
              <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                <ShieldCheck size={12} className="text-premium-gold" />
                <span className="text-[7.5px] font-black text-text-muted uppercase tracking-wider">AES-256</span>
              </div>
            </div>
            <p className="text-white/20 text-[7px] font-black uppercase tracking-[0.3em] text-center">
              SYSTEM IDENTIFIER: MG-SECURE-ACTIVE
            </p>
          </div>
        </div>

        {/* Support Link */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-[8.5px] font-bold uppercase tracking-wider leading-relaxed">
            Trouble logging in? Get support from <br />
            <span className="text-premium-gold hover:text-white cursor-pointer transition-colors font-black">admin-support@magizhchi.com</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
