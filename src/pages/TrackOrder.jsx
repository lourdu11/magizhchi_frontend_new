import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Package, MapPin, Clock, CheckCircle, Truck, ShoppingBag, AlertCircle, Phone, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { publicService } from '../services';
import { toast } from 'react-hot-toast';

export default function TrackOrder() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!query) return toast.error('Enter your Order ID or Phone Number');
    
    setLoading(true);
    setOrder(null);
    try {
      // Determine if it's a phone number (just digits, 10 or more) or order ID
      const cleanQuery = query.trim();
      const isPhone = /^\d{10}$/.test(cleanQuery.replace(/\s/g, ''));
      
      const payload = isPhone 
        ? { phone: cleanQuery.replace(/\s/g, '') } 
        : { orderNumber: cleanQuery.toUpperCase() };

      const { data } = await publicService.trackOrder(payload);
      setOrder(data.data.order);
      toast.success('Order status retrieved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order not found. Check details.');
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = [
    { id: 'placed', label: 'Order Placed', icon: ShoppingBag },
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { id: 'processing', label: 'Processing', icon: Clock },
    { id: 'shipped', label: 'Shipped', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: Package },
  ];

  const currentIdx = statusSteps.findIndex(s => s.id === order?.orderStatus);

  return (
    <div className="min-h-screen bg-cream-bg py-12">
      <Helmet><title>Track Your Order — Magizhchi Garments</title></Helmet>
      
      <div className="container-custom max-w-4xl">
          <div className="text-center mb-10">
          <span className="text-xs font-black tracking-widest text-premium-gold uppercase">Real-Time Updates</span>
          <h1 className="text-4xl font-black text-charcoal mt-3 mb-4 tracking-tighter">Track Your Journey</h1>
          <p className="text-text-muted max-w-lg mx-auto font-medium">Enter your <strong>Order ID</strong> or <strong>Phone Number</strong> to see exactly where your premium garments are.</p>
        </div>

        {/* Tracking Form */}
        <div className="bg-white rounded-3xl border border-border-light p-8 shadow-sm mb-10 max-w-2xl mx-auto">
          <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4 items-stretch">
            <div className="flex-1">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Order ID or Phone Number</label>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-premium-gold" />
                <input 
                  className="w-full bg-light-bg border border-border-light rounded-xl pl-11 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-premium-gold/20 text-sm font-bold placeholder:text-text-muted/40" 
                  placeholder="e.g. ORD-1234 or 9876543210" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-dark px-8 py-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black tracking-widest md:mt-6 transition-all active:scale-95"
            >
              {loading ? 'Searching...' : 'TRACK ORDER'}
            </button>
          </form>
        </div>

        <AnimatePresence mode="wait">
          {order && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Status Tracker */}
              <div className="bg-white rounded-3xl border border-border-light p-10 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-premium-gold uppercase tracking-widest bg-premium-gold/10 px-2 py-0.5 rounded">Order #{order.orderNumber}</span>
                    </div>
                    <h3 className="text-xl font-black text-charcoal">Status: <span className="text-premium-gold uppercase">{order.orderStatus.replace(/_/g, ' ')}</span></h3>
                    <p className="text-xs text-text-muted mt-1 font-bold">Estimated Delivery: {order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toDateString() : 'TBA'}</p>
                  </div>
                  {order.trackingInfo?.trackingNumber && (
                    <div className="bg-light-bg px-6 py-3 rounded-2xl border border-border-light text-center">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Tracking ID</p>
                      <p className="font-black text-charcoal">{order.trackingInfo.trackingNumber}</p>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="relative flex justify-between">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-light-bg -translate-y-1/2 z-0" />
                  <div 
                    className="absolute top-1/2 left-0 h-1 bg-premium-gold -translate-y-1/2 z-0 transition-all duration-1000" 
                    style={{ width: `${(currentIdx / (statusSteps.length - 1)) * 100}%` }}
                  />
                  
                  {statusSteps.map((step, i) => {
                    const isDone = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    const Icon = step.icon;
                    
                    return (
                      <div key={step.id} className="relative z-10 flex flex-col items-center group">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${isDone ? 'bg-premium-gold text-white scale-110' : 'bg-white text-text-muted border border-border-light'}`}>
                          <Icon size={20} />
                          {isCurrent && <div className="absolute inset-0 rounded-2xl border-2 border-premium-gold animate-ping opacity-30" />}
                        </div>
                        <p className={`absolute -bottom-8 whitespace-nowrap text-[10px] font-black uppercase tracking-tighter ${isDone ? 'text-charcoal' : 'text-text-muted opacity-50'}`}>{step.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Details Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-border-light p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="text-premium-gold" size={20} />
                    <h4 className="font-black text-charcoal uppercase tracking-widest text-xs">Shipping Address</h4>
                  </div>
                  <p className="font-black text-charcoal">{order.shippingAddress.name}</p>
                  <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                    {order.shippingAddress.addressLine1}, {order.shippingAddress.addressLine2}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                  </p>
                </div>

                <div className="bg-white rounded-3xl border border-border-light p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <ShoppingBag className="text-premium-gold" size={20} />
                    <h4 className="font-black text-charcoal uppercase tracking-widest text-xs">Items Summary</h4>
                  </div>
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <img src={item.productImage || '/placeholder.jpg'} className="w-12 h-12 rounded-xl object-cover" />
                        <div className="flex-1">
                          <p className="text-xs font-black text-charcoal leading-tight">{item.productName}</p>
                          <p className="text-[10px] text-text-muted font-bold">{item.variant.size} / {item.variant.color} × {item.quantity}</p>
                        </div>
                        <p className="font-black text-premium-gold text-sm">₹{item.total.toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-border-light flex justify-between items-center">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Amount Paid</p>
                      <p className="text-lg font-black text-charcoal">₹{order.pricing.totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
