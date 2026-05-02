import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2, ShieldCheck, Truck, Globe, Share2, CreditCard, Wallet, Percent, BellRing, Mail, Smartphone, User, KeyRound, CheckCircle2 } from 'lucide-react';
import { adminService, userService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { user: currentUser, setAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');

  // Store Settings Query
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminService.getSettings().then(r => r.data.data),
  });

  // User Profile Query (for Admin Profile tab)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: () => userService.getProfile().then(r => r.data.data),
  });

  const [formData, setFormData] = useState({
    store: { name: '', email: '', phone: '', address: '', gstin: '' },
    payment: { onlineEnabled: true, codEnabled: true, codCharges: 50, codThreshold: 50000 },
    shipping: { flatRateTN: 50, flatRateOut: 100, freeShippingThreshold: 999 },
    notifications: {
      email: { host: '', port: 587, user: '', password: '', alertEmail: '' },
      whatsapp: { adminPhone: '' },
      orderNotifications: { enabled: true, method: 'both' },
      contactNotifications: { enabled: true, method: 'both' },
      lowStockAlert: { enabled: true, method: 'both' }
    },
    seo: { metaTitle: '', metaDescription: '' }
  });

  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    gstin: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        ...formData,
        ...settings,
        store: { ...formData.store, ...(settings.store || {}) },
        payment: { ...formData.payment, ...(settings.payment || {}) },
        shipping: { ...formData.shipping, ...(settings.shipping || {}) },
        notifications: { 
          email: { 
            host: settings.notifications?.email?.host || '', 
            port: settings.notifications?.email?.port || 587, 
            user: settings.notifications?.email?.user || '', 
            password: '', 
            alertEmail: settings.notifications?.email?.alertEmail || settings.store?.email || ''
          },
          whatsapp: { 
            adminPhone: settings.notifications?.whatsapp?.adminPhone || settings.store?.phone || '' 
          },
          orderNotifications: {
            enabled: settings.notifications?.orderNotifications?.enabled ?? true,
            method: settings.notifications?.orderNotifications?.method || 'both'
          },
          contactNotifications: {
            enabled: settings.notifications?.contactNotifications?.enabled ?? true,
            method: settings.notifications?.contactNotifications?.method || 'both'
          },
          lowStockAlert: {
            enabled: settings.notifications?.lowStockAlert?.enabled ?? true,
            method: settings.notifications?.lowStockAlert?.method || 'both'
          }
        },
        seo: { ...formData.seo, ...(settings.seo || {}) },
      });
    }
  }, [settings]);

  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        phone: profile.phone || '',
        gstin: profile.gstin || ''
      });
    }
  }, [profile]);

  const settingsMutation = useMutation({
    mutationFn: (data) => adminService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
      toast.success('Store settings updated');
    },
    onError: () => toast.error('Failed to update store settings'),
  });

  const profileMutation = useMutation({
    mutationFn: (data) => userService.updateProfile(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
      // Update auth store with new name/phone
      const updatedUser = { ...currentUser, ...res.data.data };
      setAuth(updatedUser, localStorage.getItem('accessToken'));
      toast.success('Admin profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => userService.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to change password'),
  });

  const handleSettingsSubmit = (e) => {
    e.preventDefault();
    
    // Create a copy and sanitize
    const sanitizedData = { ...formData };
    if (sanitizedData.notifications?.email?.alertEmail) {
      sanitizedData.notifications.email.alertEmail = sanitizedData.notifications.email.alertEmail.trim().toLowerCase();
    }

    const isEmailChanged = sanitizedData.notifications?.email?.alertEmail !== settings?.notifications?.email?.alertEmail;

    settingsMutation.mutate(sanitizedData, {
      onSuccess: () => {
        if (isEmailChanged) {
          toast.success('Notification email updated successfully');
        }
      }
    });
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    profileMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    passwordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  if (settingsLoading || profileLoading) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loader2 className="animate-spin text-premium-gold" size={48} />
    </div>
  );

  const updateStore = (k, v) => setFormData({ ...formData, store: { ...formData.store, [k]: v } });
  const updatePayment = (k, v) => {
    setFormData(prev => ({
      ...prev,
      payment: { ...(prev.payment || {}), [k]: v }
    }));
  };
  const updateShipping = (k, v) => setFormData({ ...formData, shipping: { ...formData.shipping, [k]: v } });
  const updateEmail = (k, v) => setFormData({ ...formData, notifications: { ...formData.notifications, email: { ...formData.notifications.email, [k]: v } } });
  const updateWhatsApp = (k, v) => setFormData({ ...formData, notifications: { ...formData.notifications, whatsapp: { ...formData.notifications.whatsapp, [k]: v } } });

  return (
    <div className="space-y-8 font-sans pb-20">
      <Helmet><title>Admin Settings — Magizhchi</title></Helmet>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-charcoal tracking-tight">System Settings</h1>
          <p className="text-text-muted font-medium">Control your admin profile and store logic.</p>
        </div>
        {activeTab !== 'profile' && (
          <button 
            onClick={handleSettingsSubmit}
            disabled={settingsMutation.isPending}
            className="bg-charcoal text-white px-8 py-4 rounded-2xl font-black text-sm tracking-widest shadow-2xl shadow-charcoal/20 hover:bg-premium-gold transition-all flex items-center gap-3"
          >
            {settingsMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Save Store Settings</>}
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'profile', label: 'Admin Profile', icon: User },
            { id: 'general', label: 'Store Info', icon: Globe },
            { id: 'payment', label: 'Payment & COD', icon: Wallet },
            { id: 'shipping', label: 'Shipping', icon: Truck },
            { id: 'notifications', label: 'Notifications', icon: BellRing },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-premium-gold text-charcoal shadow-lg shadow-premium-gold/20' : 'bg-white text-text-muted hover:bg-light-bg'}`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-border-light p-8 shadow-sm overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
                {/* Personal Details */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-border-light pb-4">
                    <div className="w-12 h-12 bg-charcoal text-premium-gold rounded-2xl flex items-center justify-center shadow-lg">
                      <User size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-charcoal tracking-tight">Personal Details</h2>
                      <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Update your admin credentials</p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="grid md:grid-cols-2 gap-6 p-1">
                    <label className="block">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Full Name</span>
                      <input className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Phone Number</span>
                      <input className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Admin GSTIN (Optional)</span>
                      <input className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold" value={profileData.gstin} onChange={e => setProfileData({...profileData, gstin: e.target.value})} />
                    </label>
                    <div className="md:col-span-2 pt-2">
                      <button 
                        type="submit"
                        disabled={profileMutation.isPending}
                        className="bg-charcoal text-white px-8 py-4 rounded-xl font-black text-xs tracking-widest hover:bg-premium-gold transition-all flex items-center gap-2"
                      >
                        {profileMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> Update Details</>}
                      </button>
                    </div>
                  </form>
                </section>

                {/* Change Password */}
                <section className="space-y-6 pt-6 border-t border-border-light">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-premium-gold/10 text-premium-gold rounded-2xl flex items-center justify-center">
                      <KeyRound size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-charcoal tracking-tight">Security</h2>
                      <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Update your access password</p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="space-y-6 p-1">
                    <label className="block max-w-md">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Current Password</span>
                      <input type="password" required className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold" value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} />
                    </label>
                    <div className="grid md:grid-cols-2 gap-6">
                      <label className="block">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">New Password</span>
                        <input type="password" required className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Confirm New Password</span>
                        <input type="password" required className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
                      </label>
                    </div>
                    <div className="pt-2">
                      <button 
                        type="submit"
                        disabled={passwordMutation.isPending}
                        className="bg-charcoal text-white px-8 py-4 rounded-xl font-black text-xs tracking-widest hover:bg-premium-gold transition-all flex items-center gap-2"
                      >
                        {passwordMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <><ShieldCheck size={16} /> Change Password</>}
                      </button>
                    </div>
                  </form>
                </section>
              </motion.div>
            )}

            {activeTab === 'general' && (
              <motion.div key="general" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <label className="block">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Store Name</span>
                    <input className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold" value={formData.store.name} onChange={e => updateStore('name', e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Support Email</span>
                    <input className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold" value={formData.store.email} onChange={e => updateStore('email', e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Store Phone</span>
                    <input className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold" value={formData.store.phone} onChange={e => updateStore('phone', e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Store GSTIN</span>
                    <input className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold" value={formData.store.gstin} onChange={e => updateStore('gstin', e.target.value)} />
                  </label>
                </div>
                <label className="block">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Store Address</span>
                  <textarea rows="3" className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-medium resize-none" value={formData.store.address} onChange={e => updateStore('address', e.target.value)} />
                </label>
              </motion.div>
            )}

            {activeTab === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                {/* Online Payment Switch */}
                <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button 
                        type="button"
                        onClick={() => updatePayment('onlineEnabled', !formData.payment?.onlineEnabled)}
                        className={`w-14 h-8 rounded-full relative transition-all duration-300 flex items-center p-1 ${formData.payment?.onlineEnabled ? 'bg-blue-600 shadow-lg shadow-blue-200' : 'bg-gray-300'}`}
                      >
                        <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 transform ${formData.payment?.onlineEnabled ? 'translate-x-6' : 'translate-x-0'} shadow-md`} />
                      </button>
                      <div>
                        <h3 className="font-black text-charcoal uppercase tracking-tighter">Enable Online Payments</h3>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Master toggle for UPI/Card/NetBanking at checkout</p>
                      </div>
                    </div>
                    <CreditCard className={formData.payment?.onlineEnabled ? 'text-blue-600' : 'text-gray-300'} size={32} />
                  </div>
                </div>

                {/* COD Switch */}
                <div className="p-6 bg-gold-soft/30 rounded-[2rem] border border-premium-gold/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button 
                        type="button"
                        onClick={() => updatePayment('codEnabled', !formData.payment?.codEnabled)}
                        className={`w-14 h-8 rounded-full relative transition-all duration-300 flex items-center p-1 ${formData.payment?.codEnabled ? 'bg-premium-gold shadow-lg shadow-premium-gold/30' : 'bg-gray-300'}`}
                      >
                        <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 transform ${formData.payment?.codEnabled ? 'translate-x-6' : 'translate-x-0'} shadow-md`} />
                      </button>
                      <div>
                        <h3 className="font-black text-charcoal uppercase tracking-tighter">Enable Cash on Delivery (COD)</h3>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Toggle to allow/disallow COD globally at checkout</p>
                      </div>
                    </div>
                    <Wallet className={formData.payment?.codEnabled ? 'text-premium-gold' : 'text-gray-300'} size={32} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <label className="block">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">COD Extra Charges (₹)</span>
                    <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-black text-lg" value={formData.payment.codCharges} onChange={e => updatePayment('codCharges', e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Max Order Amount for COD (₹)</span>
                    <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-black text-lg" value={formData.payment.codThreshold} onChange={e => updatePayment('codThreshold', e.target.value)} />
                  </label>
                </div>
              </motion.div>
            )}

            {activeTab === 'shipping' && (
              <motion.div key="shipping" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <label className="block">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Tamil Nadu Shipping (Local) (₹)</span>
                    <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-black text-lg" value={formData.shipping.flatRateTN} onChange={e => updateShipping('flatRateTN', e.target.value)} />
                    <p className="text-[9px] text-premium-gold mt-2 font-bold uppercase">Applied for orders within Tamil Nadu</p>
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Other States Shipping (National) (₹)</span>
                    <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-black text-lg" value={formData.shipping.flatRateOut} onChange={e => updateShipping('flatRateOut', e.target.value)} />
                    <p className="text-[9px] text-text-muted mt-2 font-bold uppercase">Applied for all other states in India</p>
                  </label>
                </div>
                
                <label className="block max-w-md">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Free Shipping Above (₹)</span>
                  <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-black text-lg" value={formData.shipping.freeShippingThreshold} onChange={e => updateShipping('freeShippingThreshold', e.target.value)} />
                </label>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-10">
                {/* Admin Alert Destinations */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3 border-b border-border-light pb-4">
                      <div className="w-10 h-10 bg-premium-gold/10 rounded-xl flex items-center justify-center text-premium-gold">
                         <BellRing size={20} />
                      </div>
                      <div>
                         <h3 className="font-black text-charcoal uppercase tracking-tighter">Admin Alert Destinations</h3>
                         <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Where to send order & contact notifications</p>
                      </div>
                   </div>
                   
                   <div className="grid md:grid-cols-2 gap-8">
                      <label className="block">
                         <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Admin WhatsApp Number</span>
                         <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#25D366]" size={18} />
                            <input className="w-full bg-light-bg border-none rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-[#25D366]/30 font-black text-lg" 
                              value={formData.notifications.whatsapp.adminPhone} 
                              onChange={e => updateWhatsApp('adminPhone', e.target.value)} 
                              placeholder="9344881275" />
                         </div>
                         <p className="text-[9px] text-text-muted mt-2 font-bold uppercase italic">Receives WhatsApp alerts</p>
                      </label>

                      <label className="block">
                         <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Admin Notification Email</span>
                         <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-premium-gold" size={18} />
                            <input className="w-full bg-light-bg border-none rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-black text-lg" 
                              value={formData.notifications.email.alertEmail} 
                              onChange={e => updateEmail('alertEmail', e.target.value)} 
                              placeholder="admin@magizhchi.in" />
                         </div>
                         <p className="text-[9px] text-text-muted mt-2 font-bold uppercase italic">Receives Email alerts</p>
                      </label>
                   </div>
                </div>

                {/* Order Alerts */}
                <div className="space-y-6 pt-6 border-t border-border-light">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                            <Smartphone size={20} />
                         </div>
                         <div>
                            <h3 className="font-black text-charcoal uppercase tracking-tighter">Order Alerts</h3>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">New orders and cancellations</p>
                         </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, notifications: { ...formData.notifications, orderNotifications: { ...formData.notifications.orderNotifications, enabled: !formData.notifications.orderNotifications?.enabled } } })}
                        className={`w-14 h-8 rounded-full relative transition-all duration-300 flex items-center p-1 ${formData.notifications.orderNotifications?.enabled ? 'bg-blue-500 shadow-lg shadow-blue-200' : 'bg-gray-300'}`}
                      >
                        <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 transform ${formData.notifications.orderNotifications?.enabled ? 'translate-x-6' : 'translate-x-0'} shadow-md`} />
                      </button>
                   </div>

                   {formData.notifications.orderNotifications?.enabled && (
                     <div className="max-w-md">
                        <label className="block">
                           <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Notification Method</span>
                           <select className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-black text-sm appearance-none" 
                             value={formData.notifications.orderNotifications?.method || 'both'} 
                             onChange={e => setFormData({ ...formData, notifications: { ...formData.notifications, orderNotifications: { ...formData.notifications.orderNotifications, method: e.target.value } } })}>
                              <option value="whatsapp">WhatsApp Only</option>
                              <option value="email">Email Only</option>
                              <option value="both">Both WhatsApp & Email</option>
                           </select>
                        </label>

                        <button 
                          type="button"
                          onClick={() => toast.promise(adminService.updateSettings({...formData, testAlert: true, testType: 'order'}), {
                            loading: 'Sending order test...',
                            success: 'Order test triggered!',
                            error: 'Failed to send order test'
                          })}
                          className="mt-4 px-6 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-colors border border-blue-100"
                        >
                          Send Test Order Alert
                        </button>
                     </div>
                   )}
                </div>

                {/* Contact Alerts */}
                <div className="space-y-6 pt-6 border-t border-border-light">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500">
                            <Mail size={20} />
                         </div>
                         <div>
                            <h3 className="font-black text-charcoal uppercase tracking-tighter">Contact Alerts</h3>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Inquiries from contact form</p>
                         </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, notifications: { ...formData.notifications, contactNotifications: { ...formData.notifications.contactNotifications, enabled: !formData.notifications.contactNotifications?.enabled } } })}
                        className={`w-14 h-8 rounded-full relative transition-all duration-300 flex items-center p-1 ${formData.notifications.contactNotifications?.enabled ? 'bg-purple-500 shadow-lg shadow-purple-200' : 'bg-gray-300'}`}
                      >
                        <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 transform ${formData.notifications.contactNotifications?.enabled ? 'translate-x-6' : 'translate-x-0'} shadow-md`} />
                      </button>
                   </div>

                   {formData.notifications.contactNotifications?.enabled && (
                     <div className="max-w-md">
                        <label className="block">
                           <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Notification Method</span>
                           <select className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-black text-sm appearance-none" 
                             value={formData.notifications.contactNotifications?.method || 'both'} 
                             onChange={e => setFormData({ ...formData, notifications: { ...formData.notifications, contactNotifications: { ...formData.notifications.contactNotifications, method: e.target.value } } })}>
                              <option value="whatsapp">WhatsApp Only</option>
                              <option value="email">Email Only</option>
                              <option value="both">Both WhatsApp & Email</option>
                           </select>
                        </label>

                        <button 
                          type="button"
                          onClick={() => toast.promise(adminService.updateSettings({...formData, testAlert: true, testType: 'contact'}), {
                            loading: 'Sending contact test...',
                            success: 'Contact test triggered!',
                            error: 'Failed to send contact test'
                          })}
                          className="mt-4 px-6 py-2 bg-purple-50 text-purple-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-100 transition-colors border border-purple-100"
                        >
                          Send Test Contact Alert
                        </button>
                     </div>
                   )}
                </div>


                 {/* Low Stock Section */}
                 <div className="space-y-6 pt-6 border-t border-border-light">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                             <Percent size={20} />
                          </div>
                          <div>
                             <h3 className="font-black text-charcoal uppercase tracking-tighter">Low Stock Auto Alerts</h3>
                             <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Get notified when inventory is low</p>
                          </div>
                       </div>
                       <button 
                         type="button"
                         onClick={() => setFormData({ ...formData, notifications: { ...formData.notifications, lowStockAlert: { ...formData.notifications.lowStockAlert, enabled: !formData.notifications.lowStockAlert?.enabled } } })}
                         className={`w-14 h-8 rounded-full relative transition-all duration-300 flex items-center p-1 ${formData.notifications.lowStockAlert?.enabled ? 'bg-red-500 shadow-lg shadow-red-200' : 'bg-gray-300'}`}
                       >
                         <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 transform ${formData.notifications.lowStockAlert?.enabled ? 'translate-x-6' : 'translate-x-0'} shadow-md`} />
                       </button>
                    </div>

                    <div className="max-w-md">
                       <label className="block">
                          <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Notification Method</span>
                          <select className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-black text-sm appearance-none" 
                            value={formData.notifications.lowStockAlert?.method || 'both'} 
                            onChange={e => setFormData({ ...formData, notifications: { ...formData.notifications, lowStockAlert: { ...formData.notifications.lowStockAlert, method: e.target.value } } })}>
                             <option value="whatsapp">WhatsApp Only</option>
                             <option value="email">Email Only</option>
                             <option value="both">Both WhatsApp & Email</option>
                          </select>
                       </label>
                    </div>
                    
                     <button 
                       type="button"
                       onClick={() => toast.promise(adminService.updateSettings({...formData, testAlert: true, testType: 'stock'}), {
                         loading: 'Sending stock test...',
                         success: 'Stock test triggered!',
                         error: 'Failed to send stock test'
                       })}
                       className="px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                     >
                       Send Test Stock Alert
                     </button>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
