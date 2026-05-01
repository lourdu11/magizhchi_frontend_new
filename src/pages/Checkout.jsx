import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, CreditCard, Wallet, ShieldCheck, CheckCircle, AlertCircle, Mail, Phone, User as UserIcon } from 'lucide-react';
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
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [address, setAddress] = useState({ name: user?.name || '', phone: '', addressLine1: '', addressLine2: '', city: '', state: 'Tamil Nadu', pincode: '' });
  const [guestDetails, setGuestDetails] = useState({ email: '' });
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [localCartItems, setLocalCartItems] = useState([]);

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

  const updateAddr = (k, v) => setAddress(a => ({ ...a, [k]: v }));

  const items = isAuthenticated ? (apiCart?.items || []) : localCartItems;
  const subtotal = items.reduce((sum, item) => {
    const price = item.productId?.discountedPrice || item.productId?.sellingPrice || 0;
    return sum + price * item.quantity;
  }, 0);

  const shipping = subtotal >= shippingThreshold ? 0 : flatRate;
  const currentCodCharge = (paymentMethod === 'cod' && isCodEnabled) ? codExtra : 0;
  const total = subtotal + shipping + currentCodCharge;
  const isWithinCodLimit = subtotal <= codMaxLimit;
  const canUseCod = isCodEnabled && isWithinCodLimit;

  useEffect(() => {
    if (paymentMethod === 'cod' && !canUseCod) {
      setPaymentMethod('razorpay');
      if (!isWithinCodLimit && isCodEnabled) toast.error(`COD is not available for orders above Rs.${codMaxLimit}`);
    }
    if (paymentMethod === 'razorpay' && !isOnlineEnabled) {
      setPaymentMethod('cod');
    }
  }, [canUseCod, isWithinCodLimit, paymentMethod, isCodEnabled, codMaxLimit, isOnlineEnabled]);

  const dynamicPaymentMethods = [
    { id: 'razorpay', label: 'Pay Online', desc: 'Cards, UPI, Netbanking, Wallets', icon: CreditCard, show: isOnlineEnabled },
    { id: 'cod', label: 'Cash on Delivery', desc: !isWithinCodLimit ? `Limit Rs.${codMaxLimit}` : `Pay on Delivery`, icon: Wallet, show: isCodEnabled },
  ].filter(m => m.show);

  const handlePlaceOrderClick = () => {
    if (!address.name || !address.phone || !address.addressLine1 || !address.city || !address.pincode) return toast.error('Please fill all address fields');
    if (items.length === 0) return toast.error('Cart is empty');
    setShowConfirmModal(true);
  };

  const executeOrder = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const orderItems = items.map(item => ({
        productId: item.productId._id,
        size: item.variant.size,
        color: item.variant.color,
        quantity: item.quantity,
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
      <div className="min-h-screen bg-cream-bg py-8">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h1 className="section-title">Checkout</h1>
            {!isAuthenticated && <div className="bg-premium-gold/10 text-premium-gold text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-premium-gold/20 flex items-center gap-2">✨ GUEST CHECKOUT MODE</div>}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              
              <div className="bg-white rounded-xl border border-border-light p-6">
                <div className="flex items-center gap-2 mb-5">
                  <MapPin size={20} className="text-premium-gold" />
                  <h2 className="font-semibold text-text-primary">Delivery Address</h2>
                </div>

                {userProfile?.addresses?.length > 0 && (
                   <div className="flex gap-3 overflow-x-auto pb-4 mb-6 no-scrollbar">
                    {userProfile.addresses.map((addr, idx) => (
                      <button key={idx} onClick={() => setAddress({ ...addr })} className="min-w-[200px] text-left p-4 rounded-xl border-2 border-light-bg hover:border-premium-gold bg-light-bg/30 transition-all group">
                         <p className="text-[10px] font-black text-premium-gold uppercase tracking-widest mb-1">{addr.type}</p>
                         <p className="text-xs font-bold text-charcoal truncate">{addr.name}</p>
                         <p className="text-[10px] text-text-muted truncate">{addr.city || addr.district}, {addr.pincode}</p>
                      </button>
                    ))}
                   </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">Full Name</label><input value={address.name} onChange={e => updateAddr('name', e.target.value)} className="input" placeholder="Receiver Name" /></div>
                  <div><label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">Phone Number</label><input value={address.phone} onChange={e => updateAddr('phone', e.target.value)} className="input" placeholder="Mobile Number" /></div>
                  <div className="sm:col-span-2"><label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">Street Address</label><input value={address.addressLine1} onChange={e => updateAddr('addressLine1', e.target.value)} className="input" placeholder="House no., Apartment, Street" /></div>
                  
                  <div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">City / District</label>
                    {districtsByState[address.state] ? (
                      <select value={address.city} onChange={e => updateAddr('city', e.target.value)} className="input appearance-none bg-white">
                        <option value="">Select City/District</option>
                        {currentDistricts.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    ) : (
                      <input value={address.city || ''} onChange={e => updateAddr('city', e.target.value)} className="input" placeholder="Enter City" />
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">State</label>
                    <select value={address.state} onChange={e => {
                      updateAddr('state', e.target.value);
                      updateAddr('city', districtsByState[e.target.value]?.[0] || '');
                    }} className="input appearance-none bg-white">
                      {['Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">Country</label>
                    <input value="India" disabled className="input bg-light-bg cursor-not-allowed font-bold" />
                  </div>

                  <div><label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">Pincode</label><input value={address.pincode} onChange={e => updateAddr('pincode', e.target.value)} className="input" placeholder="6-digit Pincode" /></div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-border-light p-6">
                <div className="flex items-center gap-2 mb-5">
                  <CreditCard size={20} className="text-premium-gold" />
                  <h2 className="font-semibold text-text-primary">Payment</h2>
                </div>
                <div className="space-y-3">
                  {dynamicPaymentMethods.map(({ id, label, desc, icon: Icon }) => {
                    const isDisabled = id === 'cod' && !canUseCod;
                    if (id === 'cod' && !isCodEnabled) return null;
                    return (
                      <label key={id} className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${isDisabled ? 'opacity-50 grayscale' : 'cursor-pointer'} ${paymentMethod === id ? 'border-premium-gold bg-gold-soft' : 'border-border-light'}`}>
                        <input type="radio" disabled={isDisabled} checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} className="mt-1 accent-premium-gold" />
                        <Icon size={20} className={paymentMethod === id ? 'text-premium-gold' : 'text-text-muted'} />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-charcoal">{label}</p>
                          <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-border-light p-6 sticky top-24 shadow-xl shadow-black/5">
                <h3 className="font-black text-charcoal uppercase tracking-widest text-xs mb-6">Order Summary</h3>
                <div className="space-y-4 max-h-72 overflow-y-auto mb-6 no-scrollbar">
                  {items.map(item => (
                    <div key={item._id} className="flex gap-4">
                      <SafeImage src={item.productId.images?.[0]} className="w-16 h-20 object-cover rounded-xl bg-light-bg" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-charcoal line-clamp-1">{item.productId.name}</p>
                        <p className="text-[10px] text-text-muted font-bold mt-1 uppercase">{item.variant.size} / {item.variant.color} × {item.quantity}</p>
                        <p className="text-sm font-black text-premium-gold mt-2">₹{( (item.productId.discountedPrice || item.productId.sellingPrice) * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-6 border-t border-border-light">
                  <div className="flex justify-between text-xs font-bold text-text-muted uppercase"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-xs font-bold text-text-muted uppercase"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
                  {paymentMethod === 'cod' && codExtra > 0 && <div className="flex justify-between text-xs font-bold text-text-muted uppercase"><span>COD Extra</span><span>₹{codExtra}</span></div>}
                  <div className="flex justify-between pt-3 text-lg font-black text-charcoal"><span>Total</span><span className="text-premium-gold">₹{total.toLocaleString()}</span></div>
                </div>

                <button onClick={handlePlaceOrderClick} disabled={loading} className="w-full btn-gold py-5 rounded-2xl mt-8 font-black tracking-[0.2em] shadow-lg shadow-premium-gold/20">
                  {loading ? 'PROCESSING...' : 'PLACE ORDER'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmModal(false)} className="absolute inset-0 bg-charcoal/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-[3rem] p-10 text-center">
              <div className="w-20 h-20 bg-premium-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={40} className="text-premium-gold" />
              </div>
              <h3 className="text-2xl font-black text-charcoal tracking-tight mb-2">Final Confirmation</h3>
              <p className="text-text-muted font-medium mb-8">Ready to order <span className="text-premium-gold font-black">₹{total.toLocaleString()}</span> worth of premium garments?</p>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 bg-light-bg rounded-2xl font-black text-[10px] uppercase tracking-widest text-text-muted">Review</button>
                <button onClick={executeOrder} className="flex-1 py-4 bg-premium-gold rounded-2xl font-black text-[10px] uppercase tracking-widest text-charcoal shadow-lg">Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
