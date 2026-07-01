import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, X, ShieldCheck, Percent, Target, LayoutDashboard, Tag, Truck, Boxes, ShoppingBag, Users, Receipt, FileText, Star, BarChart2, Smartphone, Image, Settings } from 'lucide-react';
import { adminService } from '../../services';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';

const STAFF_MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'View main dashboard metrics' },
  { id: 'categories', label: 'Category', icon: Tag, desc: 'Manage product categories' },
  { id: 'procurement', label: 'Procurement Hub', icon: Truck, desc: 'Manage purchases and suppliers' },
  { id: 'profiles', label: 'Product Profiles', icon: Boxes, desc: 'Manage main product catalog' },
  { id: 'orders', label: 'Orders', icon: ShoppingBag, desc: 'View and update customer orders' },
  { id: 'customers', label: 'Customers', icon: Users, desc: 'Access customer database' },
  { id: 'create-bill', label: 'Create Bill', icon: Receipt, desc: 'Billing Station / POS' },
  { id: 'offline-bills', label: 'Offline Bills', icon: FileText, desc: 'Manage manual bills' },
  { id: 'reviews', label: 'Reviews', icon: Star, desc: 'Moderate product reviews' },
  { id: 'analytics', label: 'Analysis', icon: BarChart2, desc: 'View advanced sales analytics' },
  { id: 'broadcast', label: 'Broadcast Center', icon: Smartphone, desc: 'Send promotional messages' },
  { id: 'banners', label: 'Banners', icon: Image, desc: 'Manage app banners' },
  { id: 'settings', label: 'Settings', icon: Settings, desc: 'System configuration' }
];

export default function AdminStaffForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', password: '', commissionRate: '', permissions: [] 
  });

  const { data: staffList, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['admin-staff'],
    queryFn: () => api.get('/admin/staff').then(r => r.data.data),
    enabled: isEditing
  });

  useEffect(() => {
    if (isEditing && staffList) {
      const staffMember = staffList.find(s => s._id === id);
      if (staffMember) {
        setFormData({
          name: staffMember.name || '',
          email: staffMember.email || '',
          phone: staffMember.phone || '',
          password: '',
          commissionRate: staffMember.commissionRate || '',
          permissions: staffMember.permissions || []
        });
      }
    }
  }, [isEditing, staffList, id]);

  const createMutation = useMutation({
    mutationFn: (data) => adminService.createStaff({ ...data, role: 'staff' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-staff']);
      toast.success('Staff account created');
      navigate('/admin/staff');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create staff'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/staff/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-staff']);
      toast.success('Staff details updated');
      navigate('/admin/staff');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update staff'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate({ id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = isLoadingStaff || createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="space-y-10 pb-20">
      <Helmet><title>{isEditing ? 'Refine Staff Account' : 'New Staff Account'} — Admin</title></Helmet>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-4 md:p-4 md:p-8 rounded-[3rem] border border-border-light shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-charcoal tracking-tight uppercase">
            {isEditing ? 'Refine Account' : 'Initialize Account'}
          </h1>
          <p className="text-text-muted text-sm font-medium">Configure staff access and credentials</p>
        </div>
        
        <button 
          onClick={() => navigate('/admin/staff')} 
          className="bg-light-bg text-charcoal px-4 sm:px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
        >
          <X size={14} /> Cancel
        </button>
      </div>

      <div className="bg-white p-5 md:p-10 rounded-[3rem] border border-border-light shadow-sm max-w-5xl mx-auto">
        <h3 className="text-xl font-black text-charcoal mb-8 uppercase tracking-tight flex items-center gap-3">
           <Target size={20} className="text-premium-gold" /> {isEditing ? 'Refine Account Details' : 'Account Details'}
        </h3>
        
        {isLoadingStaff ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-premium-gold" size={40} /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Full Identity</label>
                <input required className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold text-sm" placeholder="e.g. Rahul Sharma" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Email Access <span className="text-gray-400 lowercase normal-case tracking-normal">(Optional)</span></label>
                <input type="email" className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold text-sm" placeholder="staff@magizhchi.in" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Primary Phone</label>
                <input type="tel" className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold text-sm" placeholder="+91 XXXXX XXXXX" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">{isEditing ? 'Set New Password' : 'Secure Password'}</label>
                <input required={!isEditing} type="password" minLength="8" className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold text-sm" placeholder={isEditing ? 'Leave blank to keep current password' : 'Min 8 chars'} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Commission Rate (%)</label>
                <div className="relative">
                   <Percent className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                   <input type="number" step="0.1" className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-black text-sm" placeholder="2.5" value={formData.commissionRate} onChange={e => setFormData({...formData, commissionRate: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-light">
               <h4 className="text-[10px] font-black text-charcoal uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <ShieldCheck size={16} className="text-premium-gold" /> Module Access Control
               </h4>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {STAFF_MODULES.map(module => (
                   <label key={module.id} className="flex items-center gap-3 p-3 bg-light-bg rounded-2xl cursor-pointer hover:bg-premium-gold/5 transition-colors border border-transparent hover:border-premium-gold/20">
                     <input 
                       type="checkbox" 
                       className="w-4 h-4 text-premium-gold rounded border-gray-300 focus:ring-premium-gold"
                       checked={formData.permissions?.includes(module.id)}
                       onChange={(e) => {
                         const newPerms = e.target.checked 
                           ? [...(formData.permissions || []), module.id]
                           : (formData.permissions || []).filter(p => p !== module.id);
                         setFormData({...formData, permissions: newPerms});
                       }}
                     />
                     <span className="text-xs font-bold text-charcoal flex items-center gap-1.5"><module.icon size={14} className="text-text-muted"/> {module.label}</span>
                   </label>
                 ))}
               </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button type="submit" disabled={isLoading} className="bg-charcoal text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-2 shadow-xl disabled:opacity-70">
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Commit Changes</>}
              </button>
              <button type="button" onClick={() => navigate('/admin/staff')} className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-charcoal transition-colors px-4 sm:px-6">Discard</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
