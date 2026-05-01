import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, Trash2, Calendar, Percent, IndianRupee, Loader2 } from 'lucide-react';
import { couponService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';

export default function AdminCoupons() {
  const [showAdd, setShowAdd] = useState(false);
  const queryClient = useQueryClient();

  const { data: couponsData, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => couponService.getAllCoupons().then(r => r.data.data),
  });
  const coupons = couponsData?.coupons || couponsData || [];


  const createMutation = useMutation({
    mutationFn: (data) => couponService.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-coupons']);
      toast.success('Coupon created successfully');
      setShowAdd(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create coupon'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => couponService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-coupons']);
      toast.success('Coupon deleted');
    },
  });

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minPurchaseAmount: 0,
    maxDiscountAmount: '',
    validTo: '',
    usageLimit: { total: '', perUser: 1 }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Manage Coupons — Admin</title></Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Coupons & Discounts</h1>
          <p className="text-text-muted text-sm">Create and manage promotional offers</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="btn-primary flex items-center gap-2"
        >
          {showAdd ? 'Close' : <><Plus size={18} /> Create Coupon</>}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl border border-border-light shadow-sm">
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase">Code</label>
              <input 
                required
                className="w-full bg-light-bg border border-border-light rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-premium-gold"
                placeholder="SAVE20"
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase">Type</label>
              <select 
                className="w-full bg-light-bg border border-border-light rounded-lg px-4 py-2.5 focus:outline-none"
                value={formData.discountType}
                onChange={e => setFormData({...formData, discountType: e.target.value})}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (Rs.)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase">Value</label>
              <input 
                required type="number"
                className="w-full bg-light-bg border border-border-light rounded-lg px-4 py-2.5 focus:outline-none"
                placeholder={formData.discountType === 'percentage' ? '20%' : '500'}
                value={formData.discountValue}
                onChange={e => setFormData({...formData, discountValue: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase">Expiry Date</label>
              <input 
                required type="date"
                className="w-full bg-light-bg border border-border-light rounded-lg px-4 py-2.5 focus:outline-none"
                value={formData.validTo}
                onChange={e => setFormData({...formData, validTo: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase">Min Purchase</label>
              <input 
                type="number"
                className="w-full bg-light-bg border border-border-light rounded-lg px-4 py-2.5 focus:outline-none"
                value={formData.minPurchaseAmount}
                onChange={e => setFormData({...formData, minPurchaseAmount: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase">Usage Limit</label>
              <input 
                type="number"
                className="w-full bg-light-bg border border-border-light rounded-lg px-4 py-2.5 focus:outline-none"
                placeholder="Unlimited"
                value={formData.usageLimit.total}
                onChange={e => setFormData({...formData, usageLimit: {...formData.usageLimit, total: e.target.value}})}
              />
            </div>
            <div className="lg:col-span-2 flex items-end">
              <button 
                type="submit" 
                disabled={createMutation.isLoading}
                className="w-full btn-dark flex items-center justify-center gap-2 py-2.5"
              >
                {createMutation.isLoading ? <Loader2 className="animate-spin" /> : 'Save Coupon'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border-light overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-light-bg border-b border-border-light">
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Coupon</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Discount</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Usage</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Expires</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {isLoading && (
              <tr><td colSpan="5" className="px-6 py-10 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Loading...</td></tr>
            )}
            {coupons?.length === 0 && (
              <tr><td colSpan="5" className="px-6 py-10 text-center text-text-muted">No coupons found. Create your first one!</td></tr>
            )}
            {coupons?.map(coupon => (
              <tr key={coupon._id} className="hover:bg-gold-soft/20 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold-soft flex items-center justify-center">
                      <Tag size={18} className="text-premium-gold" />
                    </div>
                    <div>
                      <p className="font-bold text-text-primary tracking-wider">{coupon.code}</p>
                      <p className="text-xs text-text-muted">{coupon.description || 'General Discount'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                    {coupon.discountType === 'percentage' ? <><Percent size={14} /> {coupon.discountValue}%</> : <><IndianRupee size={14} /> {coupon.discountValue}</>}
                  </div>
                  <p className="text-[10px] text-text-muted">Min order: Rs.{coupon.minPurchaseAmount}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-text-primary">
                    {coupon.usageCount} / {coupon.usageLimit?.total || '∞'}
                  </div>
                  <div className="w-24 h-1 bg-light-bg rounded-full mt-1 overflow-hidden">
                    <div 
                      className="h-full bg-premium-gold" 
                      style={{ width: coupon.usageLimit?.total ? `${(coupon.usageCount / coupon.usageLimit.total) * 100}%` : '10%' }}
                    />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Calendar size={14} />
                    {new Date(coupon.validTo).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => { if(window.confirm('Delete this coupon?')) deleteMutation.mutate(coupon._id); }}
                    className="p-2 text-text-muted hover:text-stock-out transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
