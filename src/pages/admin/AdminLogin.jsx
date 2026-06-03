import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, KeyRound, Smartphone, CheckCircle2, ChevronLeft, Fingerprint, Zap, Globe, Cpu, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store';
import { authService } from '../../services';
import { toast } from 'react-hot-toast';

import { Helmet } from 'react-helmet-async';

export default function AdminLogin() {
  const [step, setStep] = useState('login'); // login, forgot, otp, reset
  const [identifier, setIdentifier] = useState(() => sessionStorage.getItem('admin_login_identifier') || '');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setAuth, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  // Restore 2FA step if identifier was saved (page refresh during OTP wait)
  useEffect(() => {
    const saved = sessionStorage.getItem('admin_login_identifier');
    const savedStep = sessionStorage.getItem('admin_login_step');
    if (saved && savedStep === 'verify-2fa') {
      setIdentifier(saved);
      setStep('verify-2fa');
    }
  }, []);

  // Redirect if already logged in as admin/staff
  if (isAuthenticated && user?.role) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'staff') return <Navigate to="/staff" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.login(identifier, password);
      
      // Check for 2FA requirement
      if (data.data?.status === 'OTP_REQUIRED') {
        toast.success(data.message || 'Security Code Required');
        // Persist identifier so 2FA still works after a page refresh
        sessionStorage.setItem('admin_login_identifier', identifier);
        sessionStorage.setItem('admin_login_step', 'verify-2fa');
        setStep('verify-2fa');
        setLoading(false);
        return;
      }

      if (data.data.user.role !== 'admin' && data.data.user.role !== 'staff') {
        toast.error('Unauthorized access. Admin/Staff only.');
        return;
      }
      setAuth(data.data.user, data.data.accessToken);
      toast.success(`Access Granted: ${data.data.user.role === 'admin' ? 'Administrator' : 'Staff'} Session Active`);
      
      if (data.data.user.role === 'admin') navigate('/admin');
      else if (data.data.user.role === 'staff') navigate('/staff');
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
      // Clear session storage on successful auth
      sessionStorage.removeItem('admin_login_identifier');
      sessionStorage.removeItem('admin_login_step');
      setAuth(data.data.user, data.data.accessToken);
      toast.success(`Identity Confirmed. Session Active.`);
      
      if (data.data.user.role === 'admin') navigate('/admin');
      else if (data.data.user.role === 'staff') navigate('/staff');
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
    <div className="min-h-dvh bg-[#F8F9FA] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      <Helmet><title>Security Portal — Magizhchi Garments</title></Helmet>

      {/* ── Google Material Design Dynamic Background ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#4285F4]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#34A853]/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-5%] w-[35%] h-[35%] bg-[#FBBC05]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[30%] left-[-5%] w-[35%] h-[35%] bg-[#EA4335]/10 rounded-full blur-[100px]" />
        
        {/* Subtle dot grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
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
              className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-[0_10px_30px_rgba(32,33,36,0.06)] border border-[#DADCE0] mb-3 relative overflow-hidden"
            >
              {/* Google colorful top bar accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#34A853]" />
              <Fingerprint className="w-8 h-8 text-[#4285F4]" />
            </motion.div>
            <h1 className="font-sans text-xl font-black text-[#202124] tracking-[0.2em] uppercase leading-none">MAGIZHCHI</h1>
            <p className="text-[9px] text-[#5F6368] font-black tracking-[0.4em] mt-2 uppercase">Google Workspace Console</p>
          </Link>
        </div>

        <div className="bg-white border border-[#DADCE0] p-4 md:p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(32,33,36,0.08)] relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 'login' && (
              <motion.div key="login" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-11 h-11 rounded-2xl bg-[#E8F0FE] flex items-center justify-center text-[#1a73e8]">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#202124] tracking-tight">Identity Verification</h2>
                    <p className="text-[9px] font-black text-[#5F6368] uppercase tracking-wider">Secure Administrator Portal</p>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-[#5F6368] ml-1">Terminal ID</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6368] group-focus-within:text-[#1a73e8] transition-colors" />
                      <input
                        type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="admin@magizhchi.com"
                        className="w-full bg-[#F8F9FA] border border-[#DADCE0] text-[#202124] pl-11 pr-5 py-3.5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#1a73e8]/10 focus:border-[#1a73e8] focus:bg-white transition-all font-bold placeholder:text-gray-400 text-xs tracking-wide shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end px-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-[#5F6368]">Access Code</label>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6368] group-focus-within:text-[#1a73e8] transition-colors" />
                      <input
                        type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#F8F9FA] border border-[#DADCE0] text-[#202124] pl-11 pr-5 py-3.5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#1a73e8]/10 focus:border-[#1a73e8] focus:bg-white transition-all font-bold placeholder:text-gray-400 text-xs tracking-widest shadow-inner"
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <button type="button" onClick={() => setStep('forgot')} className="text-[9px] font-black uppercase tracking-widest text-[#1a73e8] hover:text-[#1557b0] transition-all">Forgot Credentials?</button>
                    </div>
                  </div>

                  <button
                    type="submit" disabled={loading}
                    className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 group transition-all shadow-md shadow-[#1a73e8]/10 hover:shadow-[#1a73e8]/25 disabled:opacity-50 text-xs uppercase tracking-[0.15em] relative overflow-hidden"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap size={14} className="group-hover:scale-110 transition-transform" /> <span>Verify & Continue</span></>}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'verify-2fa' && (
              <motion.div key="verify-2fa" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}>
                <button onClick={() => { sessionStorage.removeItem('admin_login_identifier'); sessionStorage.removeItem('admin_login_step'); setStep('login'); setOtp(''); }} className="flex items-center gap-1.5 text-[#5F6368] hover:text-[#1a73e8] transition-colors mb-8 text-[9px] font-black uppercase tracking-widest">
                  <ChevronLeft size={14} /> Return to Login
                </button>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-11 h-11 rounded-2xl bg-[#E8F0FE] flex items-center justify-center text-[#1a73e8]">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#202124] tracking-tight">2FA Security Challenge</h2>
                    <p className="text-[9px] font-black text-[#5F6368] uppercase tracking-wider">Verification required to proceed</p>
                  </div>
                </div>
                <form onSubmit={handleVerifyAdminOTP} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-[#5F6368] ml-1">Secure OTP Code</label>
                    <input
                      type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="0 0 0 0 0 0"
                      className="w-full bg-[#F8F9FA] border border-[#DADCE0] text-[#1a73e8] text-center text-3xl tracking-[0.4em] py-4 rounded-2xl focus:border-[#1a73e8] focus:bg-white focus:outline-none transition-all font-black placeholder:text-gray-300"
                    />
                  </div>
                  <button type="submit" disabled={loading || otp.length < 6} className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#1a73e8]/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50 uppercase text-xs tracking-widest">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Access Console <CheckCircle2 size={16} /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'forgot' && (
              <motion.div key="forgot" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <button onClick={() => setStep('login')} className="flex items-center gap-1.5 text-[#5F6368] hover:text-[#1a73e8] transition-colors mb-8 text-[9px] font-black uppercase tracking-widest">
                  <ChevronLeft size={14} /> Return to Portal
                </button>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-11 h-11 rounded-2xl bg-[#E8F0FE] flex items-center justify-center text-[#1a73e8]">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#202124] tracking-tight">Identity Recovery</h2>
                    <p className="text-[9px] font-black text-[#5F6368] uppercase tracking-wider">Authorized credential dispatch</p>
                  </div>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-[#5F6368] ml-1">Account Identifier</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6368]" />
                      <input
                        type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="admin@magizhchi.com"
                        className="w-full bg-[#F8F9FA] border border-[#DADCE0] text-[#202124] pl-11 pr-5 py-3.5 rounded-2xl focus:border-[#1a73e8] focus:bg-white focus:outline-none transition-all font-bold placeholder:text-gray-400 text-xs"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#1a73e8]/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50 uppercase text-xs tracking-widest">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Dispatch Security Key <ArrowRight size={16} /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}>
                <button onClick={() => setStep('forgot')} className="flex items-center gap-1.5 text-[#5F6368] hover:text-[#1a73e8] transition-colors mb-8 text-[9px] font-black uppercase tracking-widest">
                  <ChevronLeft size={14} /> Re-enter Identity
                </button>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-11 h-11 rounded-2xl bg-[#E8F0FE] flex items-center justify-center text-[#1a73e8]">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#202124] tracking-tight">Signal Verification</h2>
                    <p className="text-[9px] font-black text-[#5F6368] uppercase tracking-wider">6-Digit encrypted validation</p>
                  </div>
                </div>
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-[#5F6368] ml-1">Secure Code</label>
                    <input
                      type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="0 0 0 0 0 0"
                      className="w-full bg-[#F8F9FA] border border-[#DADCE0] text-[#1a73e8] text-center text-3xl tracking-[0.4em] py-4 rounded-2xl focus:border-[#1a73e8] focus:bg-white focus:outline-none transition-all font-black placeholder:text-gray-300"
                    />
                  </div>
                  <button type="submit" disabled={loading || otp.length < 6} className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#1a73e8]/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50 uppercase text-xs tracking-widest">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Identity <CheckCircle2 size={16} /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'reset' && (
              <motion.div key="reset" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-11 h-11 rounded-2xl bg-[#E8F0FE] flex items-center justify-center text-[#1a73e8]">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#202124] tracking-tight">Access Key Reset</h2>
                    <p className="text-[9px] font-black text-[#5F6368] uppercase tracking-wider">Establish new authorization credentials</p>
                  </div>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-wider text-[#5F6368] ml-1">New Access Key</label>
                      <input
                        type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#F8F9FA] border border-[#DADCE0] text-[#202124] px-5 py-3.5 rounded-2xl focus:border-[#1a73e8] focus:bg-white focus:outline-none transition-all font-bold text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-wider text-[#5F6368] ml-1">Confirm Access Key</label>
                      <input
                        type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#F8F9FA] border border-[#DADCE0] text-[#202124] px-5 py-3.5 rounded-2xl focus:border-[#1a73e8] focus:bg-white focus:outline-none transition-all font-bold text-xs"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#1a73e8]/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50 uppercase text-xs tracking-widest">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Update Credentials <ArrowRight size={16} /></>}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Security Badges */}
          <div className="mt-8 pt-6 border-t border-[#F1F3F4] flex flex-col items-center gap-3">
            <div className="flex gap-6">
              <div className="flex items-center gap-1 opacity-70">
                <Globe size={12} className="text-[#4285F4]" />
                <span className="text-[7.5px] font-black text-[#5F6368] uppercase tracking-wider">Cloud Engine</span>
              </div>
              <div className="flex items-center gap-1 opacity-70">
                <Cpu size={12} className="text-[#34A853]" />
                <span className="text-[7.5px] font-black text-[#5F6368] uppercase tracking-wider">Secure Node</span>
              </div>
              <div className="flex items-center gap-1 opacity-70">
                <ShieldCheck size={12} className="text-[#FBBC05]" />
                <span className="text-[7.5px] font-black text-[#5F6368] uppercase tracking-wider">AES-256</span>
              </div>
            </div>
            <p className="text-[#5F6368]/40 text-[7px] font-black uppercase tracking-[0.3em] text-center">
              SYSTEM IDENTIFIER: MG-WORKSPACE-ACTIVE
            </p>
          </div>
        </div>

        {/* Support Link */}
        <div className="mt-8 text-center">
          <p className="text-[#5F6368]/70 text-[8.5px] font-bold uppercase tracking-wider leading-relaxed">
            Trouble logging in? Get support from <br />
            <span className="text-[#1a73e8] hover:text-[#1557b0] cursor-pointer transition-colors font-black">admin-support@magizhchi.com</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
