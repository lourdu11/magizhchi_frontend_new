import { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Package, Heart, Star, Wallet, MapPin, ChevronRight, LogOut, Edit, Lock, Plus, Trash2, Check, Loader2, Phone, Mail, ShoppingCart, User as UserIcon, Smartphone } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useWishlistStore } from '../store';
import { orderService } from '../services';
import { districtsByState } from '../utils/locations';

import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import SafeImage from '../components/common/SafeImage';

const NAV = [
  { path: '', label: 'My Orders', icon: Package },
  { path: 'profile', label: 'Profile', icon: User },
  { path: 'addresses', label: 'Addresses', icon: MapPin },
  { path: 'wishlist', label: 'Wishlist', icon: Heart },
  { path: 'reviews', label: 'My Reviews', icon: Star },
];

// ── Status Badge
const statusColors = { placed: 'bg-blue-50 text-blue-700', confirmed: 'bg-indigo-50 text-indigo-700', shipped: 'bg-amber-50 text-amber-700', out_for_delivery: 'bg-orange-50 text-orange-700', delivered: 'bg-green-50 text-green-700', cancelled: 'bg-red-50 text-red-700', returned: 'bg-purple-50 text-purple-700' };

function StatusBadge({ status }) {
  return <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusColors[status] || 'bg-gray-50 text-gray-700'}`}>{status?.replace(/_/g, ' ')}</span>;
}

// ── Orders Tab
function MyOrders() {
  const qc = useQueryClient();
  const { data: orders, isLoading } = useQuery({ 
    queryKey: ['my-orders'], 
    queryFn: () => orderService.getMyOrders().then(r => r?.data?.data || []) 
  });
  const cancelMutation = useMutation({
    mutationFn: (id) => orderService.cancelOrder(id, 'Customer cancelled'),
    onSuccess: () => { toast.success('Order cancelled'); qc.invalidateQueries(['my-orders']); },
  });


  if (isLoading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-premium-gold" size={36} /></div>;
  if (!Array.isArray(orders) || orders.length === 0) return <div className="py-20 text-center"><Package size={48} className="text-border-light mx-auto mb-3" /><p className="text-text-muted">No orders yet. Start shopping!</p><Link to="/collections" className="btn-primary mt-4 inline-block">Browse Products</Link></div>;

  return (
    <div className="space-y-4">
      {(Array.isArray(orders) ? orders : []).map(order => {
        if (!order) return null;
        return (
          <div key={order._id} className="bg-light-bg rounded-2xl overflow-hidden border border-border-light">
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-border-light">
              <div>
                <p className="text-xs font-bold text-text-muted">ORDER #{order.orderNumber || ''}</p>
                <p className="text-xs text-text-muted">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.orderStatus} />
                {['placed', 'confirmed'].includes(order.orderStatus) && (
                  <button onClick={() => { if (window.confirm('Cancel this order?')) cancelMutation.mutate(order._id); }} className="text-xs text-red-500 hover:underline font-bold">Cancel</button>
                )}
              </div>
            </div>
            <div className="p-5 space-y-3">
              {(Array.isArray(order.items) ? order.items : []).map((item, i) => {
                if (!item) return null;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <SafeImage src={item.productImage} alt="" width={120} quality={70} className="w-16 h-16 rounded-xl object-cover bg-white" />
                    <div className="flex-1">
                      <p className="font-semibold text-text-primary text-sm">{item.productName || ''}</p>
                      <p className="text-xs text-text-muted">{item.variant?.size || ''} · {item.variant?.color || ''} · Qty: {item.quantity || 0}</p>
                      <p className="text-sm font-bold text-premium-gold mt-0.5">Rs.{item.total?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-5 pb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-text-primary">Total: <span className="text-premium-gold">Rs.{order.pricing?.totalAmount?.toLocaleString('en-IN')}</span></p>
              <div className="flex gap-2">
                {order.invoiceUrl && <a href={order.invoiceUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-premium-gold hover:underline">Invoice ↓</a>}
                {order.orderStatus === 'delivered' && !order.returnRequest?.isRequested && (
                  <Link to={`/dashboard/return/${order._id}`} className="text-xs font-bold text-text-muted hover:text-text-primary">Return / Exchange</Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Profile Tab
function Profile() {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/users/profile', data),
    onSuccess: (r) => { updateUser(r.data.data); toast.success('Profile updated'); setEditing(false); },
  });
  const pwMutation = useMutation({
    mutationFn: (data) => api.put('/users/change-password', data),
    onSuccess: () => { toast.success('Password changed'); setPwForm({ currentPassword: '', newPassword: '' }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-6">
      <div className="bg-light-bg rounded-2xl p-4 sm:p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-dark-gradient flex items-center justify-center text-premium-gold text-3xl font-bold">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h3 className="text-lg font-bold text-text-primary">{user?.name}</h3>
          <p className="text-sm text-text-muted flex items-center gap-1"><Mail size={12} /> {user?.email}</p>
          {user?.phone && <p className="text-sm text-text-muted flex items-center gap-1"><Phone size={12} /> {user?.phone}</p>}
        </div>
        <button onClick={() => setEditing(!editing)} className="ml-auto btn-dark py-2 px-4 text-sm flex items-center gap-2"><Edit size={14} /> Edit</button>
      </div>

      {editing && (
        <div className="bg-white rounded-2xl border border-border-light p-4 sm:p-6 space-y-4">
          <h4 className="font-bold text-text-primary">Edit Profile</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block"><span className="text-xs font-bold text-text-muted uppercase mb-1 block">Full Name</span>
              <input className="w-full bg-light-bg border border-border-light rounded-xl px-4 py-2.5" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></label>
            <label className="block"><span className="text-xs font-bold text-text-muted uppercase mb-1 block">Phone</span>
              <input className="w-full bg-light-bg border border-border-light rounded-xl px-4 py-2.5" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></label>
          </div>
          <button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending} className="btn-dark flex items-center gap-2 px-4 sm:px-6 py-2.5">
            {updateMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <><Check size={14} /> Save</>}
          </button>
        </div>
      )}

      {!user?.email?.startsWith('guest_') && (
        <div className="bg-white rounded-2xl border border-border-light p-4 sm:p-6 space-y-4">
          <h4 className="font-bold text-text-primary flex items-center gap-2"><Lock size={16} /> Change Password</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block"><span className="text-xs font-bold text-text-muted uppercase mb-1 block">Current Password</span>
              <input type="password" className="w-full bg-light-bg border border-border-light rounded-xl px-4 py-2.5" value={pwForm.currentPassword} onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})} /></label>
            <label className="block"><span className="text-xs font-bold text-text-muted uppercase mb-1 block">New Password</span>
              <input type="password" className="w-full bg-light-bg border border-border-light rounded-xl px-4 py-2.5" value={pwForm.newPassword} onChange={e => setPwForm({...pwForm, newPassword: e.target.value})} /></label>
          </div>
          <button onClick={() => pwMutation.mutate(pwForm)} disabled={pwMutation.isPending} className="btn-dark flex items-center gap-2 px-4 sm:px-6 py-2.5">
            {pwMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : 'Change Password'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Addresses Tab
function Addresses() {
  const { user, updateUser } = useAuthStore();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ type: 'home', name: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: 'Tamil Nadu', pincode: '', isDefault: false });
  const [errors, setErrors] = useState({});
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (data) => api.post('/users/addresses', data),
    onSuccess: (r) => { updateUser(r.data.data); toast.success('Address added'); setAdding(false); qc.invalidateQueries(['auth-me']); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/addresses/${id}`),
    onSuccess: (r) => { updateUser(r.data.data); toast.success('Address removed'); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-text-primary">Saved Addresses</h3>
        <button onClick={() => setAdding(!adding)} className="btn-primary text-sm flex items-center gap-2 py-2 px-4"><Plus size={14} /> Add New</button>
      </div>

      {adding && (
        <div className="bg-white rounded-2xl border border-border-light p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Address Type</label>
              <select className="w-full bg-light-bg border border-border-light rounded-xl px-4 py-3 font-bold appearance-none" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="hidden sm:block"></div>

            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Full Name *</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40" size={16} />
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={`w-full bg-light-bg border border-border-light rounded-xl pl-11 pr-4 py-3 font-medium placeholder:text-text-muted/50 focus:outline-none focus:border-charcoal ${errors.name ? 'border-red-500 bg-red-50/10' : ''}`} placeholder="Receiver Name" />
              </div>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Phone Number (10 Digits) *</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40" size={16} />
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g, '').slice(0,10)})} className={`w-full bg-light-bg border border-border-light rounded-xl pl-11 pr-4 py-3 font-mono font-medium placeholder:text-text-muted/50 focus:outline-none focus:border-charcoal ${errors.phone ? 'border-red-500 bg-red-50/10' : ''}`} placeholder="9876543210" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Street Address *</label>
              <input value={form.addressLine1} onChange={e => setForm({...form, addressLine1: e.target.value})} className={`w-full bg-light-bg border border-border-light rounded-xl px-4 py-3 font-medium placeholder:text-text-muted/50 focus:outline-none focus:border-charcoal ${errors.addressLine1 ? 'border-red-500 bg-red-50/10' : ''}`} placeholder="House no., Apartment, Street" />
            </div>
            
            <div className="sm:col-span-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Landmark / Apartment (Optional)</label>
              <input value={form.addressLine2} onChange={e => setForm({...form, addressLine2: e.target.value})} className="w-full bg-light-bg border border-border-light rounded-xl px-4 py-3 font-medium placeholder:text-text-muted/50 focus:outline-none focus:border-charcoal" placeholder="e.g. Near Big Temple" />
            </div>

            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Pincode *</label>
              <input value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value.replace(/\D/g, '').slice(0,6)})} className={`w-full bg-light-bg border border-border-light rounded-xl px-4 py-3 font-mono font-medium placeholder:text-text-muted/50 focus:outline-none focus:border-charcoal ${errors.pincode ? 'border-red-500 bg-red-50/10' : ''}`} placeholder="600001" />
            </div>

            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">City / District *</label>
              <div className="relative">
                {districtsByState[form.state] ? (
                  <select value={form.city} onChange={e => setForm({...form, city: e.target.value})} className={`w-full bg-light-bg border border-border-light rounded-xl px-4 py-3 font-medium appearance-none focus:outline-none focus:border-charcoal ${errors.city ? 'border-red-500 bg-red-50/10' : ''}`}>
                    <option value="">Select City</option>
                    {(districtsByState[form.state] || []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                ) : (
                  <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className={`w-full bg-light-bg border border-border-light rounded-xl px-4 py-3 font-medium placeholder:text-text-muted/50 focus:outline-none focus:border-charcoal ${errors.city ? 'border-red-500 bg-red-50/10' : ''}`} placeholder="Enter City" />
                )}
                {districtsByState[form.state] && <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-text-muted pointer-events-none" size={14} />}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">State *</label>
              <div className="relative">
                <select value={form.state} onChange={e => { setForm({...form, state: e.target.value, city: districtsByState[e.target.value]?.[0] || ''}); }} className="w-full bg-light-bg border border-border-light rounded-xl px-4 py-3 font-medium appearance-none focus:outline-none focus:border-charcoal">
                  {Object.keys(districtsByState).concat(['Bihar', 'Gujarat', 'Punjab', 'Rajasthan', 'Uttar Pradesh', 'West Bengal']).sort().map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-text-muted pointer-events-none" size={14} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Country</label>
              <input value="India" disabled className="w-full bg-light-bg border border-border-light rounded-xl px-4 py-3 font-bold opacity-60 cursor-not-allowed" />
            </div>
            
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} className="w-4 h-4 text-charcoal rounded focus:ring-charcoal/20 border-border-light cursor-pointer" />
              <label htmlFor="isDefault" className="text-xs font-bold text-charcoal cursor-pointer">Set as default address</label>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => addMutation.mutate(form)} disabled={addMutation.isPending} className="btn-dark px-4 sm:px-6 py-2.5 flex items-center gap-2">
              {addMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : 'Save Address'}
            </button>
            <button onClick={() => setAdding(false)} className="text-sm text-text-muted">Cancel</button>
          </div>
        </div>
      )}

      {(!Array.isArray(user?.addresses) || user.addresses.length === 0) && !adding && (
        <div className="py-12 text-center text-text-muted bg-light-bg rounded-2xl"><MapPin size={36} className="mx-auto mb-2 text-border-light" /><p>No saved addresses. Add your first address.</p></div>
      )}

      {(Array.isArray(user?.addresses) ? user.addresses : []).map(addr => {
        if (!addr) return null;
        return (
          <div key={addr._id} className="bg-white rounded-2xl border border-border-light p-5 flex items-start justify-between group">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-light-bg text-text-muted uppercase">{addr.type || ''}</span>
                {addr.isDefault && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-premium-gold/10 text-premium-gold uppercase">Default</span>}
              </div>
              <p className="font-semibold text-text-primary">{addr.name || ''}</p>
              <p className="text-sm text-text-muted">{addr.addressLine1 || ''}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
              <p className="text-sm text-text-muted">{addr.city || ''}, {addr.state || ''} — {addr.pincode || ''}</p>
              <p className="text-sm text-text-muted">{addr.phone || ''}</p>
            </div>
            <button onClick={() => { if (window.confirm('Remove this address?')) deleteMutation.mutate(addr._id); }} className="p-2 text-text-muted hover:text-stock-out hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Wishlist Tab
function MyWishlist() {
  const qc = useQueryClient();
  const { setWishlist } = useWishlistStore();

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api.get('/wishlist').then(r => r?.data?.data || null),
  });

  const removeMutation = useMutation({
    mutationFn: (productId) => api.delete(`/wishlist/${productId}`),
    onSuccess: () => { qc.invalidateQueries(['wishlist']); toast.success('Removed from wishlist'); },
  });

  const addToCartMutation = useMutation({
    mutationFn: ({ productId, variant }) => api.post('/cart', { productId, variant, quantity: 1 }),
    onSuccess: () => { qc.invalidateQueries(['cart']); toast.success('Added to cart!'); },
    onError: () => toast.error('Could not add to cart'),
  });

  if (isLoading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-premium-gold" size={36} /></div>;

  const items = Array.isArray(wishlist?.wishlist?.products) ? wishlist.wishlist.products : [];

  if (!items.length) {
    return (
      <div className="py-20 text-center">
        <Heart size={48} className="text-border-light mx-auto mb-3" />
        <p className="text-text-muted">Your wishlist is empty.</p>
        <Link to="/collections" className="btn-primary mt-4 inline-block">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {(Array.isArray(items) ? items : []).map((item) => {
        if (!item) return null;
        const product = item.productId || item;
        if (!product || !product._id) return null;
        const price = product.discountedPrice || product.sellingPrice;
        const firstVariant = Array.isArray(product.variants) ? product.variants[0] : null;

        return (
          <div key={product._id} className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm group hover:shadow-md transition-all relative flex flex-col h-full">
            {/* Image */}
            <div className="relative aspect-[4/5] bg-light-bg overflow-hidden">
              <Link to={`/product/${product.slug || ''}`}>
                <SafeImage
                  src={product.images?.[0]}
                  alt={product.name || ''}
                  width={300}
                  quality={70}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </Link>
              {(product.discountPercentage || 0) > 0 && (
                <span className="absolute top-3 left-3 bg-premium-gold text-charcoal text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg shadow-premium-gold/10">
                  -{product.discountPercentage}%
                </span>
              )}
              <button
                onClick={() => removeMutation.mutate(product._id)}
                className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-full shadow-md text-red-500 hover:scale-110 transition-all backdrop-blur-sm"
                title="Remove from wishlist"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Info */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <Link to={`/product/${product.slug || ''}`}>
                  <h4 className="font-bold text-text-primary text-sm hover:text-premium-gold transition-colors line-clamp-1">{product.name || ''}</h4>
                </Link>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-bold text-charcoal text-sm">Rs.{price?.toLocaleString('en-IN')}</span>
                  {(product.discountPercentage || 0) > 0 && (
                    <span className="text-xs text-text-muted line-through font-medium">Rs.{product.sellingPrice?.toLocaleString('en-IN')}</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => addToCartMutation.mutate({ productId: product._id, variant: { size: firstVariant?.size, color: firstVariant?.color } })}
                disabled={addToCartMutation.isPending || !firstVariant}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-premium-gold to-amber-500 text-charcoal py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:from-charcoal hover:to-charcoal hover:text-white transition-all disabled:opacity-50"
              >
                <ShoppingCart size={14} />
                {!firstVariant ? 'Out of Stock' : 'Move to Cart'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Dashboard
export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const activeSegment = location.pathname.split('/dashboard/')?.[1] || '';

  const handleLogout = () => { 
    navigate('/'); 
    setTimeout(() => {
      logout();
    }, 50);
  };

  return (
    <div className="container-custom py-4 md:py-8">
      <Helmet><title>My Account — Magizhchi</title></Helmet>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
            <div className="p-4 sm:p-6 bg-dark-gradient">
              <div className="w-14 h-14 rounded-xl bg-premium-gold/20 flex items-center justify-center text-premium-gold text-2xl font-bold mb-3">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <p className="font-bold text-white">{user?.name}</p>
              <p className="text-white/60 text-xs">{user?.email}</p>
            </div>
            <nav className="p-2">
              {NAV.map(item => (
                <Link key={item.path} to={`/dashboard${item.path ? `/${item.path}` : ''}`} className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeSegment === item.path ? 'bg-charcoal text-white' : 'text-text-muted hover:text-text-primary hover:bg-light-bg'}`}>
                  <span className="flex items-center gap-3"><item.icon size={16} /> {item.label}</span>
                  <ChevronRight size={14} />
                </Link>
              ))}
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all mt-2">
                <LogOut size={16} /> Logout
              </button>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <Routes>
            <Route index element={<MyOrders />} />
            <Route path="profile" element={<Profile />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="wishlist" element={<MyWishlist />} />
            <Route path="reviews" element={<div className="py-12 text-center text-text-muted">Reviews you have written will appear here.</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
