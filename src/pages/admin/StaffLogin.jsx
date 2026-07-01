import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { UserCircle2, Lock, ArrowRight, Loader2, KeyRound, ShieldAlert, CheckCircle2, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store';
import { authService } from '../../services';
import { toast } from 'react-hot-toast';

import { Helmet } from 'react-helmet-async';

export default function StaffLogin() {
  const [step, setStep] = useState('login'); // login, forgot, otp, reset
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setAuth, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  if (isAuthenticated && user?.role) {
    if (user.role === 'staff') return <Navigate to="/admin" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/login" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.login(identifier, password);
      
      // Block Admins from logging in here
      if (data.data.user.role === 'admin') {
        toast.error('Administrators must use the dedicated Admin Portal.');
        return;
      }
      
      // Allow only Staff
      if (data.data.user.role !== 'staff') {
        toast.error('Unauthorized access. Staff members only.');
        return;
      }

      setAuth(data.data.user, data.data.accessToken);
      toast.success(`Access Granted: Welcome back, ${data.data.user.name}`);
      
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed');
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
    <div className="min-h-dvh bg-light-bg flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      <Helmet><title>Staff Portal — Magizhchi Garments</title></Helmet>

      {/* ── Soft Dynamic Background ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-premium-gold/10 rounded-full blur-[100px]" />
      </div>

      {/* ── Secure Container ── */}
      <motion.div 
        layout
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-2xl relative z-10 overflow-hidden border border-border-light"
      >
        {/* Header Ribbon */}
        <div className="h-2 bg-gradient-to-r from-blue-500 via-premium-gold to-blue-500" />

        <div className="p-8 sm:p-10">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center rotate-3 hover:rotate-6 transition-transform">
              <UserCircle2 size={32} strokeWidth={2.5} />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-2xl font-black text-charcoal tracking-tight mb-2">Staff Portal</h1>
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
              {step === 'login' && 'Authorized Access Only'}
              {step === 'forgot' && 'Account Recovery'}
              {step === 'otp' && 'Verify Identity'}
              {step === 'reset' && 'Create New Password'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* ── LOGIN STEP ── */}
            {step === 'login' && (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin} 
                className="space-y-5"
              >
                <div>
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="Email or Phone Number"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      className="w-full bg-light-bg text-charcoal rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:font-medium placeholder:text-text-muted border border-transparent focus:border-blue-500/30"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative group">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-light-bg text-charcoal rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:font-medium placeholder:text-text-muted border border-transparent focus:border-blue-500/30 pr-12"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-charcoal transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={() => setStep('forgot')} className="text-[11px] font-bold text-text-muted hover:text-blue-600 uppercase tracking-wider transition-colors">
                    Forgot Password?
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-blue-600 text-white rounded-2xl py-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-70 group"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      Secure Login <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* ── FORGOT PASSWORD STEP ── */}
            {step === 'forgot' && (
              <motion.form 
                key="forgot"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleForgotPassword} 
                className="space-y-6"
              >
                <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl flex gap-3 text-xs font-bold items-start border border-orange-100">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <p>Enter your registered mobile or email to receive a secure recovery code.</p>
                </div>

                <div>
                  <input 
                    type="text" 
                    placeholder="Email or Phone Number"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="w-full bg-light-bg text-charcoal rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:font-medium placeholder:text-text-muted border border-transparent focus:border-blue-500/30"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-charcoal text-white rounded-2xl py-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Send Code'}
                </button>

                <button type="button" onClick={() => setStep('login')} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-text-muted hover:text-charcoal transition-colors uppercase tracking-wider">
                  <ChevronLeft size={14} /> Back to Login
                </button>
              </motion.form>
            )}

            {/* ── OTP STEP ── */}
            {step === 'otp' && (
              <motion.form 
                key="otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyOTP} 
                className="space-y-6"
              >
                <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl flex gap-3 text-xs font-bold items-start border border-blue-100">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <p>A 6-digit code has been sent to {identifier}.</p>
                </div>

                <div>
                  <input 
                    type="text" 
                    placeholder="6-Digit Code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    className="w-full bg-light-bg text-center tracking-[0.5em] text-charcoal rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-black text-xl placeholder:font-medium placeholder:text-text-muted placeholder:tracking-normal placeholder:text-base border border-transparent focus:border-blue-500/30"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-charcoal text-white rounded-2xl py-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Verify Code'}
                </button>
              </motion.form>
            )}

            {/* ── RESET PASSWORD STEP ── */}
            {step === 'reset' && (
              <motion.form 
                key="reset"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleResetPassword} 
                className="space-y-5"
              >
                <div>
                  <div className="relative group">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="New Password (min 8 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-light-bg text-charcoal rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:font-medium placeholder:text-text-muted border border-transparent focus:border-blue-500/30 pr-12"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-charcoal transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="relative group">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-light-bg text-charcoal rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:font-medium placeholder:text-text-muted border border-transparent focus:border-blue-500/30 pr-12"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      <KeyRound size={16} /> Save & Login
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
