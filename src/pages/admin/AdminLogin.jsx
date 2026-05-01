import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, KeyRound, Smartphone, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../../store';
import { authService } from '../../services';
import { toast } from 'react-hot-toast';

import { Helmet } from 'react-helmet-async';

export default function AdminLogin() {
  const [step, setStep] = useState('login'); // login, forgot, otp, reset
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setAuth, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already logged in as admin/staff
  if (isAuthenticated && user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'staff') return <Navigate to="/staff" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.login(identifier, password);
      if (data.data.user.role !== 'admin' && data.data.user.role !== 'staff') {
        toast.error('Unauthorized access. Admin/Staff only.');
        return;
      }
      setAuth(data.data.user, data.data.accessToken);
      toast.success(`Welcome back, ${data.data.user.role === 'admin' ? 'Admin' : 'Staff'}!`);
      
      if (data.data.user.role === 'admin') navigate('/admin');
      else if (data.data.user.role === 'staff') navigate('/staff');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(identifier);
      toast.success('OTP sent successfully!');
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.verifyOTP(identifier, otp, 'password_reset');
      toast.success('OTP Verified!');
      setStep('reset');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
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
      toast.success('Password reset successful!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <Helmet><title>Admin Portal — Magizhchi</title></Helmet>

      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />

      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-900/50 backdrop-blur-3xl border border-slate-800 p-8 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.3)] relative z-10"
      >
        <AnimatePresence mode="wait">
          {step === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-primary/20 rounded-2xl mb-4 border border-gold-primary/30 shadow-lg shadow-gold-primary/10">
                  <ShieldCheck className="w-8 h-8 text-gold-primary" />
                </div>
                <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Admin Portal</h1>
                <p className="text-slate-400 font-medium">Magizhchi Secure Management</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Identity</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-gold-primary transition-colors" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Email or Phone Number"
                      className="w-full bg-slate-800/40 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gold-primary/50 focus:border-gold-primary transition-all font-bold placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Password</label>
                    <button 
                      type="button" 
                      onClick={() => setStep('forgot')} 
                      className="text-xs font-black uppercase tracking-[0.05em] text-gold-primary hover:text-white hover:underline underline-offset-4 transition-all duration-300"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-gold-primary transition-colors" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/40 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gold-primary/50 focus:border-gold-primary transition-all font-bold placeholder:text-slate-600 shadow-inner"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold-primary hover:bg-white text-slate-900 font-black py-5 rounded-2xl shadow-2xl shadow-gold-primary/20 flex items-center justify-center gap-3 group transition-all duration-500 disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 size={22} className="group-hover:scale-110 transition-transform" /> <span className="text-base tracking-tight">Access Dashboard</span></>}
                </button>
              </form>
            </motion.div>
          )}

          {step === 'forgot' && (
            <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="mb-8">
                <button onClick={() => setStep('login')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-bold">
                  <ChevronLeft size={18} /> Back to Login
                </button>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-2xl mb-4 border border-blue-500/30">
                  <KeyRound className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Password Recovery</h2>
                <p className="text-slate-400">Enter your registered email or phone to receive a recovery code.</p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Registered Identifier</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="admin@magizhchi.com / 934488..."
                      className="w-full bg-slate-800/40 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Verification Code <ArrowRight size={20} /></>}
                </button>
              </form>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="mb-8">
                <button onClick={() => setStep('forgot')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-bold">
                  <ChevronLeft size={18} /> Wrong Number?
                </button>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-2xl mb-4 border border-purple-500/30">
                  <Smartphone className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Verify Account</h2>
                <p className="text-slate-400">Enter the 6-digit code sent to your device.</p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Security Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="0 0 0 0 0 0"
                    className="w-full bg-slate-800/40 border border-slate-700 text-white text-center text-3xl tracking-[0.5em] py-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-black"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-purple-600/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Code <CheckCircle2 size={20} /></>}
                </button>
              </form>
            </motion.div>
          )}

          {step === 'reset' && (
            <motion.div key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-2xl mb-4 border border-green-500/30">
                  <ShieldCheck className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Secure Reset</h2>
                <p className="text-slate-400">Set a strong new password for your admin account.</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/40 border border-slate-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/40 border border-slate-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-green-600/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Complete Secure Reset <ArrowRight size={20} /></>}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 text-center">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
            System Authenticated & Encrypted
          </p>
        </div>
      </motion.div>
    </div>
  );
}
