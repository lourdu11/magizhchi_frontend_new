import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars

import { Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import { authService } from '../../services';
import { useAuthStore } from '../../store';

const STEPS = { DETAILS: 1, OTP: 2, DONE: 3 };

export default function Register() {
  const [step, setStep] = useState(STEPS.DETAILS);
  const [form, setForm] = useState({ name: '', identifier: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.identifier) return toast.error('Email or phone is required');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (!/(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(form.password)) {
      return toast.error('Password needs 1 uppercase, 1 number, 1 special character');
    }
    setLoading(true);
    try {
      await authService.sendOTP(form.identifier, 'register');
      toast.success('OTP sent! Check your email/phone');
      setStep(STEPS.OTP);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter 6-digit OTP');
    setLoading(true);
    try {
      const isEmail = form.identifier.includes('@');
      const { data } = await authService.register({
        name: form.name,
        [isEmail ? 'email' : 'phone']: form.identifier,
        password: form.password,
        otp,
      });
      setAuth(data.data.user, data.data.accessToken);
      setStep(STEPS.DONE);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Create Account — Magizhchi Garments</title></Helmet>
      <div className="min-h-screen bg-cream-bg flex">
        {/* Left */}
        <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-dark-gradient p-12 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-premium-gold/10 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 text-center">
            <div className="font-display text-4xl font-bold text-white tracking-[0.2em] mb-2">MAGIZHCHI</div>
            <div className="text-xs text-white/40 tracking-[0.5em] uppercase mb-8">GARMENTS</div>
            <div className="w-16 h-0.5 bg-gold-gradient mx-auto mb-8" />
            <div className="space-y-3 text-left">
              {['Free shipping on orders above Rs.999', 'Easy 7-day returns', 'Exclusive member discounts', 'Order tracking & GST invoices'].map(b => (
                <div key={b} className="flex items-center gap-3 text-white/70 text-sm">
                  <div className="w-5 h-5 rounded-full bg-premium-gold/20 flex items-center justify-center shrink-0">
                    <span className="text-premium-gold text-xs">✓</span>
                  </div>
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <Link to="/login" className="flex items-center gap-2 text-text-muted hover:text-text-primary text-sm mb-8">
              <ArrowLeft size={16} /> Back to Login
            </Link>

            {/* Step Done */}
            {step === STEPS.DONE ? (
              <div className="text-center py-8">
                <CheckCircle size={56} className="text-stock-in mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-text-primary mb-2">Account Created!</h2>
                <p className="text-text-muted">Welcome to Magizhchi Garments. Redirecting...</p>
              </div>
            ) : (
              <>
                {/* Step indicators */}
                <div className="flex items-center gap-2 mb-8">
                  {[1, 2].map(s => (
                    <div key={s} className={`flex items-center gap-2 ${s < 2 ? 'flex-1' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-premium-gold text-primary-black' : 'bg-border-light text-text-muted'}`}>{s}</div>
                      {s < 2 && <div className={`flex-1 h-0.5 transition-all ${step > s ? 'bg-premium-gold' : 'bg-border-light'}`} />}
                    </div>
                  ))}
                </div>

                {step === STEPS.DETAILS && (
                  <>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Create Account</h2>
                    <p className="text-text-muted text-sm mb-6">Join Magizhchi Garments family</p>
                    <form onSubmit={handleSendOTP} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-text-primary block mb-1.5">Full Name</label>
                        <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Your full name" className="input" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-primary block mb-1.5">Email or Phone</label>
                        <input value={form.identifier} onChange={e => update('identifier', e.target.value)} placeholder="email@example.com or 9999999999" className="input" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-primary block mb-1.5">Password</label>
                        <div className="relative">
                          <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)}
                            placeholder="Min 8 chars, 1 uppercase, 1 number" className="input pr-10" />
                          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-primary block mb-1.5">Confirm Password</label>
                        <input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)}
                          placeholder="Repeat password" className="input" />
                      </div>
                      <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                        {loading ? 'Sending OTP...' : 'Send OTP →'}
                      </button>
                    </form>
                  </>
                )}

                {step === STEPS.OTP && (
                  <>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Verify OTP</h2>
                    <p className="text-text-muted text-sm mb-6">Enter the 6-digit code sent to <strong>{form.identifier}</strong></p>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-text-primary block mb-1.5">OTP Code</label>
                        <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="6-digit OTP"
                          className="input text-center text-2xl tracking-[0.5em] font-bold" maxLength={6} />
                      </div>
                      <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3.5">
                        {loading ? 'Creating Account...' : 'Create Account'}
                      </button>
                      <button type="button" onClick={() => authService.sendOTP(form.identifier, 'register')}
                        className="text-xs text-premium-gold hover:underline w-full text-center">
                        Resend OTP
                      </button>
                    </form>
                  </>
                )}

                <p className="text-center text-text-muted text-sm mt-6">
                  Already have an account?{' '}
                  <Link to="/login" className="text-premium-gold font-semibold hover:underline">Sign In</Link>
                </p>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
