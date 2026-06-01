import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2, ShieldCheck, Truck, Globe, Share2, CreditCard, Wallet, Percent, BellRing, Mail, Smartphone, User, KeyRound, CheckCircle2, Trash2, RotateCcw } from 'lucide-react';
import { adminService, userService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { user: currentUser, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');
  const [resetSelections, setResetSelections] = useState({
    dashboard: true,
    category: false,
    procurement: false,
    catalog: false,
    orders: false,
    customer: false,
    createBill: false,
    offlineBills: true,
    reviews: true,
    analysis: true,
    broadcast: false,
    staff: false,
    banners: false
  });

  const [showResetModal, setShowResetModal] = useState(false);
  const isVerified = true;
  const [, setIsVerified] = useState(true);
  const [securityKeyInput, setSecurityKeyInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveConfirmInput, setSaveConfirmInput] = useState('');
  // Prevent double-click duplicate email sends
  const [testLoading, setTestLoading] = useState({ order: false, contact: false, stock: false });

  const toggleSelection = (key) => {
    setResetSelections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAllSelections = (value) => {
    const updated = {};
    Object.keys(resetSelections).forEach(k => {
      updated[k] = value;
    });
    setResetSelections(updated);
  };

  // Store Settings Query
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminService.getSettings().then(r => r.data.data),
    enabled: isVerified,
  });

  // User Profile Query (for Admin Profile tab)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: () => userService.getProfile().then(r => r.data.data),
    enabled: isVerified,
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
      setFormData(prev => ({
        ...prev,
        ...settings,
        store: { ...prev.store, ...(settings.store || {}) },
        payment: { ...prev.payment, ...(settings.payment || {}) },
        shipping: { ...prev.shipping, ...(settings.shipping || {}) },
        notifications: {
          email: {
            host: settings.notifications?.email?.host || '',
            port: settings.notifications?.email?.port || 587,
            user: settings.notifications?.email?.user || '',
            password: '',
            alertEmail: settings.notifications?.email?.alertEmail || ''
          },
          whatsapp: {
            adminPhone: settings.notifications?.whatsapp?.adminPhone || ''
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
        seo: { ...prev.seo, ...(settings.seo || {}) },
      }));
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

  const isEmailDirty = formData.notifications?.email?.alertEmail?.trim().toLowerCase() !== (settings?.notifications?.email?.alertEmail || '').trim().toLowerCase();
  const isPhoneDirty = formData.notifications?.whatsapp?.adminPhone?.trim() !== (settings?.notifications?.whatsapp?.adminPhone || '').trim();
  const isSmtpHostDirty = (formData.notifications?.email?.host || '').trim() !== (settings?.notifications?.email?.host || '').trim();
  const isSmtpPortDirty = Number(formData.notifications?.email?.port || 587) !== Number(settings?.notifications?.email?.port || 587);
  const isSmtpUserDirty = (formData.notifications?.email?.user || '').trim() !== (settings?.notifications?.email?.user || '').trim();
  const isSmtpPassDirty = (formData.notifications?.email?.password || '') !== '';
  const isDirty = isEmailDirty || isPhoneDirty || isSmtpHostDirty || isSmtpPortDirty || isSmtpUserDirty || isSmtpPassDirty;

  const settingsMutation = useMutation({
    mutationFn: (data) => adminService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
      toast.success('Store settings updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update store settings'),
  });

  const profileMutation = useMutation({
    mutationFn: (data) => userService.updateProfile(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
      const updatedUser = { ...currentUser, ...res.data.data };
      updateUser(updatedUser);
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
    if (e) e.preventDefault();
    
    const alertEmail = formData.notifications?.email?.alertEmail?.trim().toLowerCase();
    if (alertEmail) {
      const emailList = alertEmail.split(/[\s,;]+/).map(item => item.trim()).filter(Boolean);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of emailList) {
        if (!emailRegex.test(email)) {
          return toast.error(`Invalid email format: ${email}`);
        }
      }
    }

    setSaveConfirmInput('');
    setShowSaveModal(true);
  };

  const executeSettingsSave = () => {
    const confirmPhrase = 'SAVE SETTINGS';
    if (saveConfirmInput !== confirmPhrase) {
      return toast.error('Save aborted: Security passkey did not match.', { icon: '🛡️' });
    }

    setShowSaveModal(false);
    settingsMutation.mutate(formData);
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

  const [systemBackups, setSystemBackups] = useState([]);
  const [expiredBackups, setExpiredBackups] = useState([]);
  const [resetStep, setResetStep] = useState(1); // 1: Confirm, 2: OTP
  const [resetOtpInput, setResetOtpInput] = useState('');
  
  const fetchSystemBackups = async () => {
    try {
      const res = await adminService.getSystemBackups();
      setSystemBackups(res.data?.data?.active || []);
      setExpiredBackups(res.data?.data?.expired || []);
    } catch (error) {
      console.error('Failed to fetch system backups', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'maintenance') {
      fetchSystemBackups();
    }
  }, [activeTab]);

  const handleRestoreBackup = async (backupId) => {
    if (!window.confirm('Are you sure you want to restore this backup? This will overwrite the current live database collections.')) return;
    
    toast.promise(
      adminService.restoreSystemData({ logId: backupId }).then(() => {
        fetchSystemBackups();
        queryClient.clear();
        queryClient.invalidateQueries();
      }),
      {
        loading: 'Restoring backup from shadow collections...',
        success: '🎉 System Data successfully restored to its previous state!',
        error: (err) => `Restore failed: ${err.response?.data?.message || err.message}`
      }
    );
  };

  const handleSystemResetTrigger = () => {
    const selectedKeys = Object.keys(resetSelections).filter(k => resetSelections[k]);
    if (selectedKeys.length === 0) {
      return toast.error("Please select at least one system data module to reset.", { icon: '⚠️' });
    }
    setResetConfirmInput('');
    setResetOtpInput('');
    setResetStep(1);
    setShowResetModal(true);
  };

  const requestResetOTP = async () => {
    const confirmPhrase = "DELETE";
    if (resetConfirmInput !== confirmPhrase) {
      return toast.error('Reset aborted: Confirmation text did not match.', { icon: '🛡️' });
    }
    
    const toastId = toast.loading('Initiating secure reset protocol...');
    try {
      const res = await adminService.resetSystemData({ selections: resetSelections });
      if (res.data?.data?.status === 'OTP_REQUIRED') {
        const customMsg = res.data?.message || `OTP Sent! Check your ${res.data.data.method}.`;
        toast.success(customMsg, { id: toastId, duration: 8000 });
        setResetStep(2); // Move to OTP entry
      } else {
        toast.dismiss(toastId);
      }
    } catch (error) {
      toast.error(`Failed to initiate reset: ${error.response?.data?.message || error.message}`, { id: toastId });
    }
  };

  const executeSystemReset = () => {
    if (!resetOtpInput || resetOtpInput.length < 6) {
      return toast.error('Please enter the 6-digit OTP sent to your admin contact.');
    }

    toast.promise(
      adminService.resetSystemData({ selections: resetSelections, otp: resetOtpInput }).then(r => {
        // 🚨 CRITICAL: Clear POS Local Cache to prevent logical mismatching
        if (resetSelections.offlineBills || resetSelections.catalog || resetSelections.procurement || resetSelections.createBill) {
          localStorage.removeItem('pos_cart_sessions');
          localStorage.removeItem('pos_active_tab');
          localStorage.removeItem('pos_completed_bill');
          localStorage.removeItem('magizhchi_held_bills');
          localStorage.removeItem('pos_editing_bill_id');
          console.log('AdminSettings: POS LocalStorage cleared after system reset.');
        }
        
        // Force completely purging and clearing React Query cache to guarantee immediate reload of all stats
        queryClient.clear();
        queryClient.invalidateQueries();
        setShowResetModal(false);
        fetchSystemBackups(); // Refresh the available backups
        return r;
      }),
      {
        loading: 'Processing granular system data reset...',
        success: '🎉 Selected system modules safely backed up and reset! You have 30 minutes to undo.',
        error: (err) => `Failed to reset system: ${err.response?.data?.message || err.message}`
      }
    );
  };

  const handleVerifyKey = (e) => {
    e.preventDefault();
    setIsVerifying(true);
    
    setTimeout(() => {
      if (securityKeyInput === '__disabled_client_side_gate__') {
        setIsVerified(true);
        sessionStorage.setItem('admin_settings_verified', 'true');
        toast.success('Access Granted! Welcome to Settings.', {
          icon: '🔓',
          style: {
            borderRadius: '1.5rem',
            background: '#1E1E1E',
            color: '#fff',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
          }
        });
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        toast.error('Invalid Security Key. Access Denied.', {
          icon: '🛡️',
          style: {
            borderRadius: '1.5rem',
            background: '#1E1E1E',
            color: '#fff',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
          }
        });
      }
      setIsVerifying(false);
    }, 800);
  };

  if (!isVerified) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans p-4">
        <Helmet><title>Security Lock — Magizhchi</title></Helmet>
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={shake ? { x: [-10, 10, -10, 10, -5, 5, 0] } : { scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-[2.5rem] border border-border-light shadow-2xl p-8 text-center space-y-6"
        >
          {/* Animated Lock Circle */}
          <div className="flex justify-center">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="w-20 h-20 bg-premium-gold/10 text-premium-gold rounded-full flex items-center justify-center shadow-inner"
              >
                <KeyRound size={36} className="text-premium-gold" />
              </motion.div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-charcoal text-white rounded-full flex items-center justify-center border-2 border-white shadow-md">
                <ShieldCheck size={14} className="text-premium-gold" />
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-charcoal tracking-tight">Security Lock</h2>
            <p className="text-xs text-text-muted font-semibold leading-relaxed px-2">
              This settings area contains highly sensitive business configurations. Enter your security key to unlock.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleVerifyKey} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Enter access password..."
                value={securityKeyInput}
                onChange={(e) => setSecurityKeyInput(e.target.value)}
                className="w-full bg-light-bg border border-border-light focus:border-premium-gold rounded-2xl px-5 py-4 pl-12 focus:ring-4 focus:ring-premium-gold/10 outline-none font-sans font-bold text-sm tracking-widest text-charcoal transition-all placeholder:text-charcoal/30 placeholder:tracking-normal text-center"
              />
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30" size={18} />
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-charcoal text-white hover:bg-premium-gold hover:text-charcoal px-8 py-4 rounded-2xl font-black text-xs tracking-widest transition-all shadow-xl shadow-charcoal/10 flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Verify Access
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

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
            className={`px-8 py-4 rounded-2xl font-black text-sm tracking-widest shadow-2xl transition-all flex items-center gap-3 ${isDirty ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200' : 'bg-charcoal text-white hover:bg-premium-gold shadow-charcoal/20'}`}
          >
            {settingsMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> {isDirty ? 'Save Pending Changes' : 'Save Store Settings'}</>}
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
            { id: 'maintenance', label: 'System Maintenance', icon: Trash2 },
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
                         <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Admin WhatsApp Numbers (Optional)</span>
                         <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#25D366]" size={18} />
                            <input className="w-full bg-light-bg border-none rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-[#25D366]/30 font-black text-lg" 
                              value={formData.notifications.whatsapp.adminPhone} 
                              onChange={e => updateWhatsApp('adminPhone', e.target.value)} 
                              placeholder="9344881275, 9876543210" />
                         </div>
                         <p className="text-[9px] text-text-muted mt-2 font-bold uppercase italic">Receives WhatsApp alerts (Separate multiple with commas)</p>
                      </label>

                      <label className="block">
                         <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Admin Notification Emails (Optional)</span>
                         <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-premium-gold" size={18} />
                            <input className={`w-full bg-light-bg border-none rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-premium-gold/30 font-black text-lg ${isEmailDirty ? 'ring-2 ring-amber-400' : ''}`} 
                              value={formData.notifications.email.alertEmail} 
                              onChange={e => updateEmail('alertEmail', e.target.value)} 
                              placeholder="admin@magizhchi.in, manager@magizhchi.in" />
                         </div>
                         {isEmailDirty ? (
                           <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mt-2 animate-pulse">⚠️ Unsaved Change — Alerts still going to {settings?.notifications?.email?.alertEmail || 'nowhere'}</p>
                         ) : (
                           <p className="text-[9px] text-text-muted mt-2 font-bold uppercase italic">Receives Email alerts (Separate multiple with commas)</p>
                         )}
                       </label>
                    </div>

                    {/* Custom SMTP Configuration (Dynamically Configurable SMTP Server) */}
                    <div className="mt-8 p-6 bg-light-bg/40 rounded-[2rem] border border-border-light space-y-6">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-premium-gold/10 text-premium-gold rounded-lg flex items-center justify-center">
                            <Mail size={16} />
                         </div>
                         <div>
                            <h4 className="text-xs font-black text-charcoal uppercase tracking-wider">Custom SMTP Mail Server (SMTP மெயில் சர்வர்)</h4>
                            <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Optional: Link any SMTP mail service to bypass default Brevo server</p>
                         </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                         <label className="block">
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">SMTP Host</span>
                            <input className="w-full bg-white border border-border-light focus:border-premium-gold rounded-2xl px-5 py-4 focus:ring-4 focus:ring-premium-gold/10 outline-none font-sans font-bold text-sm text-charcoal" 
                              value={formData.notifications.email.host} 
                              onChange={e => updateEmail('host', e.target.value)} 
                              placeholder="smtp.gmail.com" />
                         </label>

                         <label className="block">
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">SMTP Port</span>
                            <input type="number" className="w-full bg-white border border-border-light focus:border-premium-gold rounded-2xl px-5 py-4 focus:ring-4 focus:ring-premium-gold/10 outline-none font-sans font-bold text-sm text-charcoal" 
                              value={formData.notifications.email.port} 
                              onChange={e => updateEmail('port', e.target.value)} 
                              placeholder="587" />
                         </label>

                         <label className="block">
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">SMTP Username (Email)</span>
                            <input className="w-full bg-white border border-border-light focus:border-premium-gold rounded-2xl px-5 py-4 focus:ring-4 focus:ring-premium-gold/10 outline-none font-sans font-bold text-sm text-charcoal" 
                              value={formData.notifications.email.user} 
                              onChange={e => updateEmail('user', e.target.value)} 
                              placeholder="your-email@gmail.com" />
                         </label>

                         <label className="block">
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">SMTP Password / App Password</span>
                            <input type="password" className="w-full bg-white border border-border-light focus:border-premium-gold rounded-2xl px-5 py-4 focus:ring-4 focus:ring-premium-gold/10 outline-none font-sans font-bold text-sm text-charcoal" 
                              value={formData.notifications.email.password} 
                              onChange={e => updateEmail('password', e.target.value)} 
                              placeholder="••••••••••••••••" />
                         </label>
                      </div>

                      <div className="p-4 bg-premium-gold/5 rounded-2xl border border-premium-gold/10 flex items-start gap-3">
                         <ShieldCheck className="text-premium-gold shrink-0 mt-0.5" size={16} />
                         <p className="text-[9px] font-bold text-[#8C6D1F] leading-normal uppercase">
                            Security Note: Keep host/port/user empty to fallback to default high-speed Brevo cloud SMTP! If you use Gmail, generate a 16-character "App Password" in Google Settings and paste it above!
                         </p>
                      </div>
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

                       <div className="flex flex-col gap-2">
                         <button 
                           type="button"
                           disabled={isEmailDirty || testLoading.order}
                           onClick={() => {
                             if (isEmailDirty || testLoading.order) return;
                             setTestLoading(p => ({ ...p, order: true }));
                             toast.promise(
                               adminService.testNotifications('order').then(r => { if (!r.data.success) throw new Error(r.data.message); return r; }).finally(() => setTestLoading(p => ({ ...p, order: false }))),
                               {
                                 loading: 'Sending order test email...',
                                 success: (r) => {
                                   const d = r.data.data?.emailOrder;
                                   return d?.messageId
                                     ? `✅ Brevo accepted! ID:${d.messageId} → Check ${settings?.notifications?.email?.alertEmail}`
                                     : `✅ ${d?.message || 'Order alert sent! Check inbox.'}` ;
                                 },
                                 error: (e) => `❌ ${e.response?.data?.message || e.message}`
                               }
                             )
                           }}
                           className={`mt-4 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${isEmailDirty ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`} data-test="order-btn"
                         >
                           {testLoading.order ? '⏳ Sending...' : 'Send Test Order Alert'}
                         </button>
                         {isEmailDirty && <p className="text-[9px] text-amber-600 font-bold uppercase text-center mt-1">Save settings first to test updated email</p>}
                       </div>
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

                         <div className="flex flex-col gap-2">
                           <button 
                             type="button"
                             disabled={isEmailDirty}
                             onClick={() => {
                               if (isEmailDirty) return;
                               toast.promise(
                                 adminService.testNotifications('contact').then(r => { if (!r.data.success) throw new Error(r.data.message); return r; }).finally(() => setTestLoading(p => ({ ...p, contact: false }))),
                                 {
                                   loading: 'Sending contact test email...',
                                   success: (r) => {
                                     const d = r.data.data?.emailContact;
                                     return d?.messageId
                                       ? `✅ Brevo accepted! ID:${d.messageId} → Check ${settings?.notifications?.email?.alertEmail}`
                                       : `✅ ${d?.message || 'Contact alert sent! Check inbox.'}` ;
                                   },
                                   error: (e) => `❌ ${e.response?.data?.message || e.message}`
                                 }
                               )
                             }}
                             className={`mt-4 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${isEmailDirty ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50' : testLoading.contact ? 'bg-purple-100 text-purple-400 border-purple-100 cursor-not-allowed' : 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100'}`}
                           >
                             {testLoading.contact ? '⏳ Sending...' : 'Send Test Contact Alert'}
                           </button>
                           {isEmailDirty && <p className="text-[9px] text-amber-600 font-bold uppercase text-center mt-1">Save settings first to test updated email</p>}
                         </div>
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
                    
                    <div className="flex flex-col gap-2">
                      <button 
                         type="button"
                         disabled={isEmailDirty}
                         onClick={() => {
                           if (isEmailDirty) return;
                           toast.promise(
                             adminService.testNotifications('stock').then(r => { if (!r.data.success) throw new Error(r.data.message); return r; }).finally(() => setTestLoading(p => ({ ...p, stock: false }))),
                             {
                               loading: 'Sending stock test alert...',
                               success: () => `✅ Stock alert sent! Check ${settings?.notifications?.email?.alertEmail}`,
                               error: (e) => `❌ ${e.response?.data?.message || e.message}`
                             }
                           )
                         }}
                         className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${isEmailDirty ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50' : testLoading.stock ? 'bg-red-100 text-red-400 border-red-100 cursor-not-allowed' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}
                       >
                         {testLoading.stock ? '⏳ Sending...' : 'Send Test Stock Alert'}
                       </button>
                        {isEmailDirty && <p className="text-[9px] text-amber-600 font-bold uppercase text-center mt-1">Save settings first to test updated email</p>}
                     </div>
                  </div>
                </motion.div>
            )}

            {activeTab === 'maintenance' && (
                  <motion.div key="maintenance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                    <div>
                      <h2 className="text-xl font-black text-charcoal tracking-tight">Granular System Data Reset</h2>
                      <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">Select exactly which data modules you wish to reset</p>
                    </div>

                    {/* Data Restore Safety Panel */}
                    <div className="space-y-4 mb-8">
                      {/* Active Restorable Backups */}
                      <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><RotateCcw size={20} /></div>
                          <div>
                            <h3 className="font-black text-charcoal uppercase tracking-tighter">Available Shadow Backups (30-Min Grace)</h3>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Restore data wiped accidentally during a recent reset</p>
                          </div>
                        </div>
                        
                        {systemBackups.length === 0 ? (
                          <div className="p-4 bg-white/50 rounded-xl border border-blue-100/50 text-center text-xs font-bold text-blue-800/60 uppercase tracking-widest">
                            No active backups available in the grace period.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {systemBackups.map(b => (
                              <div key={b._id} className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-black text-charcoal">Backup created at: {new Date(b.createdAt).toLocaleTimeString()} ({new Date(b.createdAt).toLocaleDateString()})</p>
                                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Expires at: {new Date(b.canRestoreUntil).toLocaleTimeString()}</p>
                                  <p className="text-[9px] font-bold text-blue-600 uppercase mt-1">Modules: {b.modulesReset.join(', ')}</p>
                                </div>
                                <button onClick={() => handleRestoreBackup(b._id)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">
                                  <RotateCcw size={14} /> Restore
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Expired / Permanently Deleted History */}
                      {expiredBackups.length > 0 && (
                        <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gray-200 text-gray-500 rounded-xl"><Trash2 size={20} /></div>
                            <div>
                              <h3 className="font-black text-charcoal uppercase tracking-tighter">Historical Data Wipes (Permanently Deleted)</h3>
                              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Audit log of system resets that have passed the grace period</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {expiredBackups.map(b => (
                              <div key={b._id} className="p-4 bg-white/40 rounded-2xl border border-gray-200 flex items-center justify-between opacity-80">
                                <div>
                                  <p className="text-xs font-black text-gray-500 line-through decoration-red-500/30">Wiped at: {new Date(b.createdAt).toLocaleTimeString()} ({new Date(b.createdAt).toLocaleDateString()})</p>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Modules: {b.modulesReset.join(', ')}</p>
                                </div>
                                <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-100">
                                  {b.status === 'restored' ? 'RESTORED' : 'DATA DESTROYED'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bulk Select Toggles */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => selectAllSelections(true)}
                        className="bg-light-bg hover:bg-premium-gold/15 hover:text-[#8C6D1F] border border-border-light px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-charcoal/80 transition-all"
                      >
                        Select All Modules
                      </button>
                      <button
                        type="button"
                        onClick={() => selectAllSelections(false)}
                        className="bg-light-bg hover:bg-red-50 hover:text-red-600 border border-border-light px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-charcoal/80 transition-all"
                      >
                        Deselect All
                      </button>
                    </div>

                    {/* Grid checklist */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { key: 'dashboard', label: 'Dashboard Stats', desc: 'Wipes cached statistics counters and forces instant dashboard reload' },
                        { key: 'category', label: 'Garment Categories', desc: 'Deletes all catalog category collections and groupings' },
                        { key: 'procurement', label: 'Procurement Hub', desc: 'Wipes all supplier directories, transaction ledgers, and purchases' },
                        { key: 'catalog', label: 'Product Profiles', desc: 'Deletes all product listings, cost structures, and variants inventory' },
                        { key: 'orders', label: 'Customer Orders', desc: 'Permanently clears all web sales, online orders, and customer billing histories' },
                        { key: 'customer', label: 'Customer Directory', desc: 'Removes registered retail user profiles (safely retains admin profiles)' },
                        { key: 'createBill', label: 'Create Bill Session', desc: 'Wipes all active operator cart sessions, POS tabs, and held billing sessions' },
                        { key: 'offlineBills', label: 'Offline Bills / Invoices', desc: 'Permanently deletes all store billing invoices, physical sales, and local PDF references' },
                        { key: 'reviews', label: 'Customer Reviews', desc: 'Wipes catalog rating stars and feedback posts left by web buyers' },
                        { key: 'analysis', label: 'Sales Analysis & Logs', desc: 'Resets stock transaction history, recorded damages, and sells counts' },
                        { key: 'broadcast', label: 'Broadcast Center', desc: 'Wipes out WhatsApp campaign broadcast queues, template lists, and delivery logs' },
                        { key: 'staff', label: 'Staff Accounts', desc: 'Removes billing operators, assistants, and clerk log-ins' },
                        { key: 'banners', label: 'Slider Banners', desc: 'Clears e-commerce homepage hero sliders and advertising images' },
                        { key: 'coupons', label: 'Discount Coupons', desc: 'Permanently deletes all promotional codes and discount coupons' },
                        { key: 'support', label: 'Customer Support', desc: 'Wipes all contact form submissions and chatbot queries' },
                        { key: 'templates', label: 'Message Templates', desc: 'Deletes all saved WhatsApp and Email broadcast templates' },
                        { key: 'counters', label: 'System Counters', desc: 'Resets all auto-incrementing invoice and order numbers back to zero' },
                      ].map(module => {
                        const isChecked = resetSelections[module.key] || false;
                        return (
                          <div
                            key={module.key}
                            onClick={() => toggleSelection(module.key)}
                            className={`p-5 rounded-3xl border cursor-pointer transition-all flex items-start gap-4 ${isChecked ? 'bg-premium-gold/5 border-premium-gold/40 shadow-md' : 'bg-white hover:bg-light-bg/50 border-border-light'}`}
                          >
                            <div className="pt-0.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // managed by click on parent div
                                className="rounded border-gray-300 text-premium-gold focus:ring-premium-gold w-5 h-5 cursor-pointer accent-premium-gold"
                              />
                            </div>
                            <div>
                              <p className={`font-black text-xs uppercase tracking-wider ${isChecked ? 'text-charcoal' : 'text-charcoal/80'}`}>{module.label}</p>
                              <p className="text-[10px] text-text-muted font-semibold mt-1 leading-relaxed">{module.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Final Danger Card and Action Button */}
                    <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100 mt-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-xs font-black text-red-600 uppercase tracking-widest animate-pulse">
                          ⚠️ WARNING: Selected data modules will be deleted forever. This CANNOT be undone!
                        </div>
                        <button
                          type="button"
                          onClick={handleSystemResetTrigger}
                          className="bg-red-600 text-white hover:bg-red-700 px-8 py-4 rounded-2xl font-black text-xs tracking-widest shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 size={16} /> Reset Selected Data Modules
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
        </div>
    </div>

      {/* Premium Custom Security Reset Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetModal(false)}
              className="absolute inset-0 bg-charcoal/60 backdrop-blur-md"
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] border border-red-100 shadow-3xl overflow-hidden p-8 z-10 space-y-6"
            >
              {/* Header Icon */}
              <div className="flex items-center gap-4">
                <div className="p-4 bg-red-50 rounded-2xl text-red-600 animate-bounce">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-charcoal tracking-tight">Critical Safety Verification</h3>
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">High-Risk Administrative Action</p>
                </div>
              </div>

              {resetStep === 1 ? (
                <>
                  {/* Modules warning list */}
                  <div className="p-5 bg-red-50/50 rounded-2xl border border-red-50 space-y-2">
                    <p className="text-[11px] font-black text-charcoal/80 uppercase tracking-wider">
                      ⚠️ This will permanently delete selected data modules:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {Object.keys(resetSelections).filter(k => resetSelections[k]).map(k => {
                        const labels = {
                          dashboard: 'Dashboard', category: 'Category', procurement: 'Procurement Hub',
                          catalog: 'Product Profiles', orders: 'Orders', customer: 'Customers',
                          createBill: 'Create Bill', offlineBills: 'Offline Bills', reviews: 'Reviews',
                          analysis: 'Analysis', broadcast: 'Broadcast Center', staff: 'Staff', banners: 'Banners'
                        };
                        return (
                          <span key={k} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                            {labels[k] || k}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-text-muted font-semibold mt-2 leading-relaxed">
                      Deleting these modules will erase all associated records, configurations, and logs from the cloud database. This action is final and CANNOT be reversed.
                    </p>
                  </div>

                  {/* Confirmation Prompt Input */}
                  <div className="space-y-3 bg-red-50/30 p-5 rounded-3xl border border-red-100/50">
                    <label className="block text-[10px] font-black text-charcoal/70 uppercase tracking-[0.15em] text-center">
                      To confirm permanent deletion, type <span className="text-red-600 font-extrabold font-mono">DELETE</span> below:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Type DELETE..."
                        value={resetConfirmInput}
                        onChange={(e) => setResetConfirmInput(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl border border-border-light bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100/50 outline-none font-sans font-black text-sm tracking-widest text-charcoal transition-all placeholder:text-charcoal/30 placeholder:tracking-normal text-center shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowResetModal(false)}
                      className="flex-1 bg-light-bg hover:bg-gray-200 text-charcoal font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={resetConfirmInput !== 'DELETE'}
                      onClick={requestResetOTP}
                      className={`flex-1 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all ${resetConfirmInput === 'DELETE' ? 'bg-red-600 text-white hover:bg-red-700 hover:scale-[1.02] active:scale-95 shadow-lg shadow-red-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'}`}
                    >
                      <ShieldCheck size={16} /> Request OTP
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* OTP Step */}
                  <div className="space-y-3 bg-red-50/30 p-5 rounded-3xl border border-red-100/50">
                    <label className="block text-[10px] font-black text-charcoal/70 uppercase tracking-[0.15em] text-center">
                      Enter the 6-digit OTP sent to your admin contact:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter OTP..."
                        value={resetOtpInput}
                        onChange={(e) => setResetOtpInput(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl border border-border-light bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100/50 outline-none font-sans font-black text-2xl tracking-[0.5em] text-charcoal transition-all text-center shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowResetModal(false)}
                      className="flex-1 bg-light-bg hover:bg-gray-200 text-charcoal font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={resetOtpInput.length < 6}
                      onClick={executeSystemReset}
                      className={`flex-1 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all ${resetOtpInput.length >= 6 ? 'bg-red-600 text-white hover:bg-red-700 hover:scale-[1.02] active:scale-95 shadow-lg shadow-red-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'}`}
                    >
                      <Trash2 size={16} /> Confirm Reset
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Save Settings Security Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveModal(false)}
              className="absolute inset-0 bg-charcoal/60 backdrop-blur-md"
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] border border-premium-gold/20 shadow-3xl overflow-hidden p-8 z-10 space-y-6"
            >
              {/* Header Icon */}
              <div className="flex items-center gap-4">
                <div className="p-4 bg-premium-gold/10 text-premium-gold rounded-2xl animate-bounce">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-charcoal tracking-tight">Authorize Store Changes</h3>
                  <p className="text-[10px] text-premium-gold font-bold uppercase tracking-widest">Administrative Verification</p>
                </div>
              </div>

              {/* Warning/Info Box */}
              <div className="p-5 bg-gold-soft/10 rounded-2xl border border-premium-gold/10 space-y-2">
                <p className="text-[11px] font-black text-charcoal/80 uppercase tracking-wider">
                  🔑 Confirming configuration updates:
                </p>
                <p className="text-[10px] text-text-muted font-semibold leading-relaxed">
                  You are about to modify global store settings, checkout parameters, notifications, or shipping structures. Confirm the action to continue.
                </p>
              </div>

              {/* Confirmation Prompt Input */}
              <div className="space-y-3 bg-light-bg p-5 rounded-3xl border border-border-light">
                <label className="block text-[10px] font-black text-charcoal/70 uppercase tracking-[0.15em] text-center">
                  Enter <span className="text-premium-gold font-extrabold font-mono">SAVE SETTINGS</span> to continue:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type SAVE SETTINGS..."
                    value={saveConfirmInput}
                    onChange={(e) => setSaveConfirmInput(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border border-border-light bg-white focus:border-premium-gold focus:ring-4 focus:ring-premium-gold/10 outline-none font-sans font-bold text-sm tracking-widest text-charcoal transition-all placeholder:text-charcoal/30 placeholder:tracking-normal text-center shadow-inner"
                  />
                </div>
              </div>

              {/* Actions buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 bg-light-bg hover:bg-gray-200 text-charcoal font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saveConfirmInput !== 'SAVE SETTINGS'}
                  onClick={executeSettingsSave}
                  className={`flex-1 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all ${saveConfirmInput === 'SAVE SETTINGS' ? 'bg-charcoal text-white hover:bg-premium-gold hover:text-charcoal hover:scale-[1.02] active:scale-95 shadow-lg shadow-charcoal/20' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'}`}
                >
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>

  );
}
