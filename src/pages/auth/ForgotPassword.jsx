import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars

import { ArrowLeft, Mail, MessageCircle, Eye, EyeOff, CheckCircle, ShieldCheck, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

// Steps: 1=Enter identifier, 2=Enter OTP, 3=New password, 4=Success
const STEPS = { IDENTIFIER: 1, OTP: 2, PASSWORD: 3, SUCCESS: 4 };

const isEmailVal = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhoneVal = (v) => /^\d{10}$/.test(v.replace(/\D/g, ''));

export default function ForgotPassword() {
  const [step, setStep] = useState(STEPS.IDENTIFIER);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpMethod, setOtpMethod] = useState('');
  const [maskedId, setMaskedId] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [validationError, setValidationError] = useState('');
  const navigate = useNavigate();

  const identifierType = isEmailVal(identifier) ? 'email' : isPhoneVal(identifier) ? 'phone' : null;

  // ── OTP input handlers ────────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) setOtp(pasted.split(''));
  };

  // ── Step 1: Send OTP ──────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!identifierType) return toast.error('Enter a valid 10-digit phone or email address');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { identifier: identifier.trim() });
      const method = data.data?.method || (isEmailVal(identifier) ? 'email' : 'whatsapp');
      setOtpMethod(method);
      setMaskedId(data.data?.identifier || identifier);
      toast.success(data.message || 'OTP sent!');

      // Start 60-second resend timer
      setResendTimer(60);
      const timer = setInterval(() => {
        setResendTimer((t) => {
          if (t <= 1) { clearInterval(timer); return 0; }
          return t - 1;
        });
      }, 1000);

      setStep(STEPS.OTP);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP';
      if (err.response?.status === 404) {
        setValidationError(msg);
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length < 6) return toast.error('Enter the complete 6-digit OTP');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { identifier: identifier.trim(), otp: otpStr, purpose: 'password_reset' });
      setStep(STEPS.PASSWORD);
      toast.success('OTP verified!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset Password ────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        identifier: identifier.trim(),
        otp: otp.join(''),
        newPassword,
      });
      setStep(STEPS.SUCCESS);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { identifier: identifier.trim() });
      setOtp(['', '', '', '', '', '']);
      setResendTimer(60);
      const timer = setInterval(() => {
        setResendTimer((t) => {
          if (t <= 1) { clearInterval(timer); return 0; }
          return t - 1;
        });
      }, 1000);
      toast.success('OTP resent!');
    } catch {
      toast.error('Failed to resend OTP');
    } finally {


      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password — Magizhchi Garments</title>
      </Helmet>

      <div className="min-h-screen bg-cream-bg flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Back */}
          <Link to="/login" className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary text-sm mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to Login
          </Link>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-border-light p-8">

            {/* ── Step Indicators ── */}
            <div className="flex items-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > s ? 'bg-emerald-500 text-white' :
                    step === s ? 'bg-primary-black text-white' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {step > s ? <CheckCircle size={14} /> : s}
                  </div>
                  {s < 3 && <div className={`h-0.5 flex-1 transition-all ${step > s ? 'bg-emerald-500' : 'bg-gray-100'}`} />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* ── STEP 1: Enter identifier ── */}
              {step === STEPS.IDENTIFIER && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-2xl font-bold text-text-primary mb-1">Forgot Password?</h1>
                  <p className="text-text-muted text-sm mb-6">
                    Enter your phone or email. OTP will be sent via <strong>WhatsApp</strong> (phone) or <strong>Email</strong>.
                  </p>

                  {/* Channel preview */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className={`border rounded-xl p-3 text-center transition-all ${identifierType === 'phone' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                      <MessageCircle size={20} className={`mx-auto mb-1 ${identifierType === 'phone' ? 'text-emerald-600' : 'text-gray-300'}`} />
                      <p className="text-xs font-medium text-gray-600">Phone Number</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">OTP on WhatsApp</p>
                    </div>
                    <div className={`border rounded-xl p-3 text-center transition-all ${identifierType === 'email' ? 'border-premium-gold bg-amber-50' : 'border-gray-200'}`}>
                      <Mail size={20} className={`mx-auto mb-1 ${identifierType === 'email' ? 'text-amber-600' : 'text-gray-300'}`} />
                      <p className="text-xs font-medium text-gray-600">Email Address</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">OTP on Email</p>
                    </div>
                  </div>

                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-text-primary block mb-1.5">Phone or Email</label>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          if (validationError) setValidationError('');
                        }}
                        placeholder="9876543210 or you@email.com"
                        className="input"
                        autoComplete="username"
                        inputMode="text"
                      />
                      {identifierType === 'phone' && (
                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                          <ShieldCheck size={11} /> OTP will be sent to WhatsApp: {identifier}
                        </p>
                      )}
                      {identifierType === 'email' && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <ShieldCheck size={11} /> OTP will be sent to your email inbox
                        </p>
                      )}
                    </div>

                    {validationError && (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-2 animate-in fade-in slide-in-from-top-2">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                            <X className="text-red-600" size={16} />
                          </div>
                          <div>
                            <p className="text-xs text-red-600 font-bold uppercase tracking-widest mb-1">Account Not Found</p>
                            <p className="text-sm text-red-800 font-medium leading-relaxed">
                              {validationError}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <button type="submit" disabled={loading || !identifierType} className="btn-primary w-full py-3.5 disabled:opacity-50">
                      {loading ? 'Sending OTP...' : `Send OTP ${identifierType === 'phone' ? 'on WhatsApp' : identifierType === 'email' ? 'to Email' : ''}`}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── STEP 2: Enter OTP ── */}
              {step === STEPS.OTP && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${otpMethod === 'whatsapp' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    {otpMethod === 'whatsapp'
                      ? <MessageCircle size={28} className="text-emerald-600" />
                      : <Mail size={28} className="text-amber-600" />}
                  </div>
                  <h2 className="text-xl font-bold text-text-primary mb-1">Enter OTP</h2>
                  <p className="text-text-muted text-sm mb-6">
                    {otpMethod === 'whatsapp'
                      ? `WhatsApp OTP sent to ${maskedId}`
                      : otpMethod === 'dev_console'
                      ? 'OTP sent — check your server terminal'
                      : `Email OTP sent to ${maskedId}`}
                  </p>
                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    {/* OTP boxes */}
                    <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          id={`otp-${i}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(e.target.value, i)}
                          onKeyDown={(e) => handleOtpKeyDown(e, i)}
                          className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all ${
                            digit ? 'border-premium-gold bg-amber-50 text-text-primary' : 'border-border-light bg-white text-text-primary'
                          } focus:border-premium-gold focus:ring-2 focus:ring-premium-gold/20`}
                        />
                      ))}
                    </div>

                    <button type="submit" disabled={loading || otp.join('').length < 6} className="btn-primary w-full py-3.5 disabled:opacity-50">
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>

                    {/* Resend */}
                    <div className="text-center">
                      <p className="text-text-muted text-sm">
                        Didn't receive it?{' '}
                        {resendTimer > 0
                          ? <span className="text-text-muted">Resend in {resendTimer}s</span>
                          : <button type="button" onClick={handleResend} className="text-premium-gold font-medium hover:underline">Resend OTP</button>
                        }
                      </p>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ── STEP 3: New Password ── */}
              {step === STEPS.PASSWORD && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-xl font-bold text-text-primary mb-1">Set New Password</h2>
                  <p className="text-text-muted text-sm mb-6">Choose a strong password (minimum 8 characters)</p>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-text-primary block mb-1.5">New Password</label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="input pr-10"
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                          {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {/* Strength */}
                      {newPassword.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                              newPassword.length >= i * 3
                                ? newPassword.length >= 12 ? 'bg-emerald-500' : newPassword.length >= 8 ? 'bg-amber-400' : 'bg-red-400'
                                : 'bg-gray-200'
                            }`} />
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-text-primary block mb-1.5">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className={`input ${confirmPassword && confirmPassword !== newPassword ? 'border-red-400' : ''}`}
                      />
                      {confirmPassword && confirmPassword !== newPassword && (
                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                      )}
                    </div>

                    <button type="submit" disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}
                      className="btn-primary w-full py-3.5 disabled:opacity-50">
                      {loading ? 'Resetting...' : 'Reset Password & Login'}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── STEP 4: Success ── */}
              {step === STEPS.SUCCESS && (
                <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle size={40} className="text-emerald-600" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-text-primary mb-2">Password Reset!</h2>
                  <p className="text-text-muted text-sm mb-8">Your password has been updated successfully. Login with your new password.</p>
                  <button onClick={() => navigate('/login')} className="btn-primary w-full py-3.5">
                    Go to Login →
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
}
