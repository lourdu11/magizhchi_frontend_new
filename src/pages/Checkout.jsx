import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, CreditCard, Wallet, ShieldCheck, CheckCircle, AlertCircle, Mail, Phone, User as UserIcon, Smartphone, ArrowRight, ArrowLeft, Package, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import { cartService, orderService, authService, adminService } from '../services';
import { useAuthStore, useCartStore } from '../store';
import { loadRazorpay } from '../utils/scriptLoader';
import SafeImage from '../components/common/SafeImage';

export default function Checkout() {
  const { isAuthenticated, user } = useAuthStore();
  const { setItemCount } = useCartStore();
  const navigate = useNavigate();
  
  // Checkout Steps: 1 = Shipping, 2 = Review & Payment
  const [step, setStep] = useState(() => {
    const saved = sessionStorage.getItem('magizhchi-checkout-step');
    return saved ? Number(saved) : 1;
  });
  const [paymentMethod, setPaymentMethod] = useState(() => {
    return sessionStorage.getItem('magizhchi-checkout-payment') || 'cod';
  });
  const [address, setAddress] = useState(() => {
    const saved = sessionStorage.getItem('magizhchi-checkout-address');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { 
      name: user?.name || '', 
      phone: user?.phone || '', 
      addressLine1: '', 
      addressLine2: '', 
      city: '', 
      state: 'Tamil Nadu', 
      pincode: '' 
    };
  });
  const [guestDetails, setGuestDetails] = useState(() => {
    const saved = sessionStorage.getItem('magizhchi-checkout-guest');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { email: '' };
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [localCartItems, setLocalCartItems] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    sessionStorage.setItem('magizhchi-checkout-step', step);
  }, [step]);

  useEffect(() => {
    sessionStorage.setItem('magizhchi-checkout-payment', paymentMethod);
  }, [paymentMethod]);

  useEffect(() => {
    sessionStorage.setItem('magizhchi-checkout-address', JSON.stringify(address));
  }, [address]);

  useEffect(() => {
    sessionStorage.setItem('magizhchi-checkout-guest', JSON.stringify(guestDetails));
  }, [guestDetails]);

  // Fetch data
  const { data: userProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authService.getMe().then(r => r.data.data.user),
    enabled: isAuthenticated,
  });
  
  const { data: storeSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => adminService.getPublicSettings().then(r => r.data.data),
  });

  const { data: apiCart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart().then(r => r.data.data.cart),
    enabled: isAuthenticated,
  });

  // Settings Logic
  const isCodEnabled = storeSettings?.payment?.codEnabled === true;
  const isOnlineEnabled = storeSettings?.payment?.onlineEnabled !== false;
  const shippingThreshold = Number(storeSettings?.shipping?.freeShippingThreshold ?? 999);
  
  // Calculate dynamic flat rate based on state
  const isTamilNadu = address.state?.toLowerCase().includes('tamil nadu');
  const flatRate = isTamilNadu 
    ? Number(storeSettings?.shipping?.flatRateTN ?? 50) 
    : Number(storeSettings?.shipping?.flatRateOut ?? 100);

  const codExtra = Number(storeSettings?.payment?.codCharges ?? 0);
  const codMaxLimit = Number(storeSettings?.payment?.codThreshold ?? 50000);

  // Initialize
  useEffect(() => {
    if (!isAuthenticated) {
      const items = JSON.parse(localStorage.getItem('magizhchi-guest-cart') || '[]');
      setLocalCartItems(items);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (userProfile?.addresses?.length > 0 && !address.addressLine1) {
      const defaultAddr = userProfile.addresses.find(a => a.isDefault) || userProfile.addresses[0];
      setAddress({
        name: defaultAddr.name || user?.name || '',
        phone: defaultAddr.phone || user?.phone || '',
        addressLine1: defaultAddr.addressLine1 || '',
        addressLine2: defaultAddr.addressLine2 || '',
        city: defaultAddr.city || '',
        state: defaultAddr.state || 'Tamil Nadu',
        pincode: defaultAddr.pincode || '',
      });
    } else if (user && !address.name) {
      setAddress(prev => ({ ...prev, name: user.name || prev.name, phone: user.phone || prev.phone }));
    }
  }, [userProfile, user]);

  const updateAddr = useCallback((k, v) => {
    setAddress(a => ({ ...a, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: '' }));
  }, [errors]);

  const validateShipping = useCallback(() => {
    const newErrors = {};
    if (!address.name.trim()) newErrors.name = 'Full name is required';
    if (!address.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(address.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    if (!address.addressLine1.trim()) newErrors.addressLine1 = 'Street address is required';
    if (!address.city.trim()) newErrors.city = 'City/District is required';
    if (!address.state.trim()) newErrors.state = 'State is required';
    if (!address.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(address.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }
    
    if (!isAuthenticated && !guestDetails.email.trim()) {
      newErrors.email = 'Email is required for guest checkout';
    } else if (!isAuthenticated && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestDetails.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [address, guestDetails.email, isAuthenticated]);

  const nextStep = useCallback(() => {
    if (step === 1 && validateShipping()) setStep(2);
  }, [step, validateShipping]);

  const prevStep = useCallback(() => setStep(1), []);

  const items = useMemo(() => isAuthenticated ? (apiCart?.items || []) : localCartItems, [isAuthenticated, apiCart, localCartItems]);
  
  const subtotal = useMemo(() => items.reduce((sum, item) => {
    const price = item.productId?.discountedPrice || item.productId?.sellingPrice || 0;
    return sum + price * item.quantity;
  }, 0), [items]);

  const shipping = useMemo(() => subtotal >= shippingThreshold ? 0 : flatRate, [subtotal, shippingThreshold, flatRate]);
  const currentCodCharge = useMemo(() => (paymentMethod === 'cod' && isCodEnabled) ? codExtra : 0, [paymentMethod, isCodEnabled, codExtra]);
  const total = useMemo(() => subtotal + shipping + currentCodCharge, [subtotal, shipping, currentCodCharge]);
  const isWithinCodLimit = useMemo(() => subtotal <= codMaxLimit, [subtotal, codMaxLimit]);
  const canUseCod = useMemo(() => isCodEnabled && isWithinCodLimit, [isCodEnabled, isWithinCodLimit]);

  useEffect(() => {
    if (paymentMethod === 'cod' && !canUseCod) {
      setPaymentMethod('razorpay');
      if (!isWithinCodLimit && isCodEnabled) toast.error(`COD is not available for orders above Rs.${codMaxLimit}`);
    }
    if (paymentMethod === 'razorpay' && !isOnlineEnabled) {
      setPaymentMethod('cod');
    }
  }, [canUseCod, isWithinCodLimit, paymentMethod, isCodEnabled, codMaxLimit, isOnlineEnabled]);

  const dynamicPaymentMethods = useMemo(() => [
    { id: 'razorpay', label: 'Pay Online', desc: 'Cards, UPI, Netbanking, Wallets', icon: CreditCard, show: isOnlineEnabled },
    { id: 'cod', label: 'Cash on Delivery', desc: !isWithinCodLimit ? `Limit Rs.${codMaxLimit}` : `Pay on Delivery`, icon: Wallet, show: isCodEnabled },
  ].filter(m => m.show), [isOnlineEnabled, isWithinCodLimit, codMaxLimit, isCodEnabled]);

  const handlePlaceOrderClick = () => {
    if (items.length === 0) return toast.error('Cart is empty');
    setShowConfirmModal(true);
  };

  const executeOrder = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const orderItems = items.map(item => ({
        productId: item.productId._id,
        size: item.variant?.size || item.size,
        color: item.variant?.color || item.color,
        quantity: item.quantity,
        isCombo: item.isCombo || false,
        comboSelections: item.comboSelections || []
      }));

      const payload = {
        items: orderItems,
        shippingAddress: {
          name:         address.name,
          phone:        address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || '',
          city:         address.city || '',
          state:        address.state,
          pincode:      address.pincode,
        },
        paymentMethod,
      };

      if (!isAuthenticated) {
        payload.guestDetails = { name: address.name, phone: address.phone, email: guestDetails.email || '' };
      }

      const { data } = await orderService.createOrder(payload);
      const { order, razorpayOrder } = data.data;

      // Clear carts
      if (!isAuthenticated) {
        localStorage.removeItem('magizhchi-guest-cart');
        setLocalCartItems([]);
        setItemCount(0);
      }

      // Clear checkout persistence on successful order
      sessionStorage.removeItem('magizhchi-checkout-step');
      sessionStorage.removeItem('magizhchi-checkout-address');
      sessionStorage.removeItem('magizhchi-checkout-guest');
      sessionStorage.removeItem('magizhchi-checkout-payment');

      if (paymentMethod === 'cod') {
        toast.success('Order placed!');
        navigate(`/order-confirmation/${order._id}`);
        return;
      }

      // Load Razorpay dynamically
      const success = await loadRazorpay();
      if (!success) {
        toast.error('Failed to load payment gateway. Please check your internet.');
        return;
      }

      // Razorpay
      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'Magizhchi Garments',
        description: `Order #${order.orderNumber}`,
        order_id: razorpayOrder.id,
        prefill: { name: address.name, email: guestDetails.email || user?.email, contact: address.phone },
        theme: { color: '#D4AF37' },
        handler: async (res) => {
          try {
            await orderService.verifyPayment({ orderId: order._id, razorpayOrderId: res.razorpay_order_id, razorpayPaymentId: res.razorpay_payment_id, razorpaySignature: res.razorpay_signature });
            toast.success('Payment successful!');
            navigate(`/order-confirmation/${order._id}`);
          } catch { toast.error('Payment verification failed'); }
        }
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally { setLoading(false); }
  };

  const districtsByState = {
    'Tamil Nadu': ['Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram', 'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'],
    'Kerala': ['Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'],
    'Karnataka': ['Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir'],
    'Andhra Pradesh': ['Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Kadapa', 'Krishna', 'Kurnool', 'Nellore', 'Prakasam', 'Srikakulam', 'Visakhapatnam', 'Vizianagaram', 'West Godavari'],
    'Telangana': ['Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagtial', 'Jangaon', 'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam', 'Kumuram Bheem', 'Mahabubabad', 'Mahabubnagar', 'Mancherial', 'Medak', 'Medchal', 'Mulugu', 'Nagarkurnool', 'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal (Rural)', 'Warangal (Urban)', 'Yadadri Bhuvanagiri'],
    'Maharashtra': ['Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'],
    'Delhi': ['Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi'],
    'Puducherry': ['Karaikal', 'Mahe', 'Puducherry', 'Yanam'],
  };

  const currentDistricts = districtsByState[address.state] || ['Other'];

  return (
    <>
      <Helmet><title>Checkout — Magizhchi Garments</title></Helmet>
      <div className="min-h-dvh bg-cream-bg py-8 pb-36 lg:pb-8">
        <div className="container-custom max-w-5xl">
          
          {/* Progress Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-black text-charcoal tracking-tight uppercase">Checkout</h1>
              {!isAuthenticated && <div className="bg-premium-gold/10 text-premium-gold text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-premium-gold/20 flex items-center gap-2">✨ GUEST MODE</div>}
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-premium-gold' : 'text-text-muted opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${step >= 1 ? 'bg-premium-gold text-charcoal' : 'bg-light-bg'}`}>1</div>
                <span className="text-[10px] font-black uppercase tracking-widest">Shipping</span>
              </div>
              <div className="flex-1 h-[1px] bg-border-light" />
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-premium-gold' : 'text-text-muted opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${step >= 2 ? 'bg-premium-gold text-charcoal' : 'bg-light-bg'}`}>2</div>
                <span className="text-[10px] font-black uppercase tracking-widest">Review & Pay</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Step Content */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div 
                    key="step-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="bg-white rounded-3xl border border-border-light p-8 shadow-xl shadow-black/5">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-premium-gold/10 flex items-center justify-center text-premium-gold">
                          <MapPin size={20} />
                        </div>
                        <h2 className="text-lg font-black text-charcoal uppercase tracking-tight">Delivery Address</h2>
                      </div>

                      {userProfile?.addresses?.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto pb-4 mb-8 no-scrollbar">
                          {userProfile.addresses.map((addr, idx) => (
                            <button key={idx} onClick={() => setAddress({ ...addr })} className="min-w-[200px] text-left p-5 rounded-2xl border-2 border-light-bg hover:border-premium-gold bg-light-bg/30 transition-all group">
                               <p className="text-[10px] font-black text-premium-gold uppercase tracking-widest mb-1">{addr.type}</p>
                               <p className="text-xs font-bold text-charcoal truncate">{addr.name}</p>
                               <p className="text-[10px] text-text-muted truncate">{addr.city || addr.district}, {addr.pincode}</p>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {!isAuthenticated && (
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Email Address *</label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40" size={16} />
                              <input 
                                value={guestDetails.email} 
                                onChange={e => setGuestDetails({ ...guestDetails, email: e.target.value })} 
                                className={`input pl-11 ${errors.email ? 'border-red-500 bg-red-50/10' : ''}`} 
                                placeholder="For order updates" 
                              />
                            </div>
                            {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.email}</p>}
                          </div>
                        )}
                        
                        <div>
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Full Name *</label>
                          <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40" size={16} />
                            <input value={address.name} onChange={e => updateAddr('name', e.target.value)} className={`input pl-11 ${errors.name ? 'border-red-500 bg-red-50/10' : ''}`} placeholder="Receiver Name" />
                          </div>
                          {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.name}</p>}
                        </div>
                        
                        <div>
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Phone Number (10 Digits) *</label>
                          <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40" size={16} />
                            <input value={address.phone} onChange={e => updateAddr('phone', e.target.value.replace(/\D/g, '').slice(0,10))} className={`input pl-11 font-mono ${errors.phone ? 'border-red-500 bg-red-50/10' : ''}`} placeholder="9876543210" />
                          </div>
                          {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.phone}</p>}
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Street Address *</label>
                          <input value={address.addressLine1} onChange={e => updateAddr('addressLine1', e.target.value)} className={`input ${errors.addressLine1 ? 'border-red-500 bg-red-50/10' : ''}`} placeholder="House no., Apartment, Street" />
                          {errors.addressLine1 && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.addressLine1}</p>}
                        </div>
                        
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Landmark / Apartment (Optional)</label>
                          <input value={address.addressLine2} onChange={e => updateAddr('addressLine2', e.target.value)} className="input" placeholder="e.g. Near Big Temple" />
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">City / District *</label>
                          <div className="relative">
                            {districtsByState[address.state] ? (
                              <select value={address.city} onChange={e => updateAddr('city', e.target.value)} className={`input appearance-none bg-white ${errors.city ? 'border-red-500 bg-red-50/10' : ''}`}>
                                <option value="">Select City</option>
                                {currentDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            ) : (
                              <input value={address.city} onChange={e => updateAddr('city', e.target.value)} className={`input ${errors.city ? 'border-red-500 bg-red-50/10' : ''}`} placeholder="Enter City" />
                            )}
                            {districtsByState[address.state] && <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-text-muted pointer-events-none" size={14} />}
                          </div>
                          {errors.city && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.city}</p>}
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">State *</label>
                          <div className="relative">
                            <select value={address.state} onChange={e => { updateAddr('state', e.target.value); updateAddr('city', districtsByState[e.target.value]?.[0] || ''); }} className="input appearance-none bg-white">
                              {Object.keys(districtsByState).concat(['Bihar', 'Gujarat', 'Punjab', 'Rajasthan', 'Uttar Pradesh', 'West Bengal']).sort().map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-text-muted pointer-events-none" size={14} />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Country</label>
                          <input value="India" disabled className="input bg-light-bg cursor-not-allowed font-bold opacity-60" />
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Pincode *</label>
                          <input value={address.pincode} onChange={e => updateAddr('pincode', e.target.value.replace(/\D/g, '').slice(0,6))} className={`input font-mono ${errors.pincode ? 'border-red-500 bg-red-50/10' : ''}`} placeholder="600001" />
                          {errors.pincode && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.pincode}</p>}
                        </div>
                      </div>

                      <button 
                        onClick={nextStep} 
                        className="w-full btn-gold py-5 rounded-[2rem] mt-10 font-black tracking-[0.2em] shadow-xl shadow-premium-gold/20 flex items-center justify-center gap-2 group"
                      >
                        CONTINUE TO REVIEW <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Items Summary */}
                    <div className="bg-white rounded-3xl border border-border-light p-8 shadow-xl shadow-black/5">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-premium-gold/10 flex items-center justify-center text-premium-gold">
                            <Package size={20} />
                          </div>
                          <h2 className="text-lg font-black text-charcoal uppercase tracking-tight">Review Items</h2>
                        </div>
                        <button onClick={prevStep} className="text-[10px] font-black text-premium-gold uppercase tracking-widest flex items-center gap-1 hover:underline">
                          <ArrowLeft size={12} /> Edit Shipping
                        </button>
                      </div>

                      <div className="space-y-4">
                        {items.map(item => (
                          <div key={item._id} className="flex flex-col gap-4 p-4 rounded-2xl bg-light-bg/30 border border-border-light">
                            <div className="flex gap-4">
                              <SafeImage src={item.productId.images?.[0]} className="w-20 h-24 object-cover rounded-xl bg-white shadow-sm" />
                              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                <div>
                                  <p className="font-bold text-charcoal text-sm truncate">{item.productId.name}</p>
                                  {item.isCombo ? (
                                    <div className="mt-2 space-y-1">
                                      {item.comboSelections?.map((sel, idx) => (
                                        <p key={idx} className="text-[9px] font-black text-text-muted uppercase tracking-tight">
                                          Slot {idx + 1}: {sel.productName} ({sel.size})
                                        </p>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex gap-2 mt-2">
                                      <span className="text-[10px] font-black px-2 py-0.5 bg-white border border-border-light rounded-md text-text-muted uppercase">
                                        Size: {item.variant?.size || item.size}
                                      </span>
                                      <span className="text-[10px] font-black px-2 py-0.5 bg-white border border-border-light rounded-md text-text-muted uppercase">
                                        Color: {item.variant?.color || item.color}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Qty: {item.quantity}</p>
                                  <p className="font-black text-premium-gold">₹{( (item.productId.discountedPrice || item.productId.sellingPrice) * item.quantity).toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Selection */}
                    <div className="bg-white rounded-3xl border border-border-light p-8 shadow-xl shadow-black/5">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-premium-gold/10 flex items-center justify-center text-premium-gold">
                          <CreditCard size={20} />
                        </div>
                        <h2 className="text-lg font-black text-charcoal uppercase tracking-tight">Payment Method</h2>
                      </div>
                      
                      <div className="space-y-4">
                        {dynamicPaymentMethods.map(({ id, label, desc, icon: Icon }) => {
                          const isDisabled = id === 'cod' && !canUseCod;
                          return (
                            <label key={id} className={`flex items-start gap-5 p-6 rounded-[2rem] border-2 transition-all ${isDisabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer hover:border-premium-gold/50'} ${paymentMethod === id ? 'border-premium-gold bg-gold-soft ring-4 ring-premium-gold/5' : 'border-border-light bg-light-bg/20'}`}>
                              <input type="radio" disabled={isDisabled} checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} className="mt-1.5 accent-premium-gold w-6 h-6" />
                              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-charcoal border border-border-light shadow-sm">
                                <Icon size={24} className={paymentMethod === id ? 'text-premium-gold' : 'text-text-muted opacity-40'} />
                              </div>
                              <div className="flex-1">
                                <p className="font-black text-charcoal text-sm uppercase tracking-tight">{label}</p>
                                <p className="text-[10px] text-text-muted uppercase font-bold tracking-[0.2em] mt-1">{desc}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar: Order Summary */}
            <div className="lg:col-span-4">
              <div className="bg-charcoal text-white rounded-[2.5rem] p-8 sticky top-24 shadow-2xl shadow-charcoal/30 overflow-hidden group">
                <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-premium-gold/5 rounded-full blur-[100px] group-hover:bg-premium-gold/10 transition-colors" />
                
                <h3 className="font-black uppercase tracking-[0.3em] text-[10px] text-white/40 mb-8 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-premium-gold" /> Secure Summary
                </h3>

                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Subtotal</span>
                    <span className="font-black font-mono">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Shipping</span>
                    <span className="font-black font-mono">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                  </div>
                  {paymentMethod === 'cod' && codExtra > 0 && (
                    <div className="flex justify-between items-center text-premium-gold">
                      <span className="text-xs font-bold uppercase tracking-widest">COD Fee</span>
                      <span className="font-black font-mono">+₹{codExtra}</span>
                    </div>
                  )}
                  
                  <div className="h-[1px] bg-white/10 my-6" />
                  
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Final Total</span>
                      <span className="text-xs text-stock-in font-bold uppercase tracking-widest mt-1">Incl. GST 5%</span>
                    </div>
                    <span className="text-3xl font-black text-premium-gold tracking-tighter font-mono">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                {step === 2 ? (
                  <button 
                    onClick={handlePlaceOrderClick} 
                    disabled={loading || items.length === 0} 
                    className="w-full btn-gold h-14 rounded-[2rem] mt-10 font-black tracking-[0.2em] shadow-xl shadow-premium-gold/20 flex items-center justify-center gap-3 active:scale-95 transition-transform"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle size={20} /> COMPLETE ORDER</>}
                  </button>
                ) : (
                  <button 
                    onClick={nextStep} 
                    className="w-full btn-white h-14 rounded-[2rem] mt-10 font-black tracking-[0.2em] shadow-xl text-charcoal flex items-center justify-center gap-3 active:scale-95 transition-transform"
                  >
                    CONTINUE <ArrowRight size={20} />
                  </button>
                )}

                <div className="mt-8 flex items-center justify-center gap-4 opacity-30 grayscale contrast-125">
                   <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Razorpay_logo.png" alt="Razorpay" className="h-4 object-contain" />
                   <div className="w-[1px] h-3 bg-white/20" />
                   <span className="text-[9px] font-black tracking-widest uppercase">Safe Payment</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA (Visible only on small screens) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-charcoal p-4 z-40 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        <div className="flex justify-between items-center mb-3 px-2">
           <div className="flex flex-col text-white">
             <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Final Total</span>
             <span className="text-xl font-black text-premium-gold font-mono">₹{total.toLocaleString()}</span>
           </div>
        </div>
        {step === 2 ? (
          <button 
            onClick={handlePlaceOrderClick} 
            disabled={loading || items.length === 0} 
            className="w-full h-14 btn-gold rounded-2xl font-black tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle size={20} /> PLACE ORDER</>}
          </button>
        ) : (
          <button 
            onClick={nextStep} 
            className="w-full h-14 btn-white rounded-2xl font-black tracking-[0.2em] shadow-xl text-charcoal flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            CONTINUE <ArrowRight size={20} />
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmModal(false)} className="absolute inset-0 bg-charcoal/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full admin-modal-container max-w-md rounded-[3.5rem] p-12 text-center shadow-2xl">
              <div className="w-24 h-24 bg-premium-gold/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 relative">
                <div className="absolute inset-0 bg-premium-gold/5 rounded-[2.5rem] animate-ping" />
                <ShieldCheck size={48} className="text-premium-gold" />
              </div>
              <h3 className="text-3xl font-black text-charcoal tracking-tight mb-3 uppercase">Final Check</h3>
              <p className="text-text-muted font-medium mb-10 leading-relaxed px-4">You are about to place an order for <span className="text-premium-gold font-black underline underline-offset-4">₹{total.toLocaleString()}</span>. Continue?</p>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 h-14 bg-light-bg rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] text-text-muted hover:bg-border-light transition-colors">Review</button>
                <button onClick={executeOrder} className="flex-1 h-14 bg-premium-gold rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] text-charcoal shadow-xl hover:shadow-premium-gold/30 transition-all active:scale-95">Place Order</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
