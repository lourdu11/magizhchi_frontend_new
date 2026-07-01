import { useState, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2, Loader2, X, Save, Mail, Phone, Edit2, Percent, TrendingUp, Trophy, IndianRupee, ShoppingBag, Target, ShieldCheck, Users, Receipt, FileText } from 'lucide-react';
import { adminService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import api from '../../services/api';

const StaffBarChart = lazy(() => import('./charts/StaffBarChart'));

export default function AdminStaff() {
  const [showAdd, setShowAdd] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', commissionRate: '' });

  const { data: staff, isLoading } = useQuery({
    queryKey: ['admin-staff'],
    queryFn: () => api.get('/admin/staff').then(r => r.data.data),
  });

  const { data: performance, isLoading: loadingPerf } = useQuery({
    queryKey: ['staff-performance'],
    queryFn: () => adminService.getStaffPerformance().then(r => r.data.data),
    enabled: activeTab === 'performance'
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminService.createStaff({ ...data, role: 'staff' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-staff']);
      toast.success('Staff account created');
      setShowAdd(false);
      setFormData({ name: '', email: '', phone: '', password: '', commissionRate: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create staff'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/staff/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-staff']);
      toast.success('Staff details updated');
      setEditingStaff(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update staff'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/staff/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['admin-staff']); toast.success('Staff removed'); },
  });

  const startEdit = (s) => {
    setEditingStaff(s._id);
    setFormData({ name: s.name, email: s.email, phone: s.phone || '', password: '', commissionRate: s.commissionRate || '', permissions: s.permissions || [] });
  };

  return (
    <div className="space-y-10 pb-20">
      <Helmet><title>Staff Command Center — Admin</title></Helmet>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-4 md:p-4 md:p-8 rounded-[3rem] border border-border-light shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-charcoal tracking-tight uppercase">Staff Operations</h1>
          <p className="text-text-muted text-sm font-medium">Performance tracking & Access control</p>
        </div>
        
        <div className="flex items-center flex-wrap gap-3">
          <div className="bg-light-bg p-1.5 rounded-2xl flex gap-1">
            <button onClick={() => setActiveTab('list')} className={`px-4 sm:px-4 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-charcoal text-white shadow-xl' : 'text-text-muted hover:text-charcoal'}`}>Accounts</button>
            <button onClick={() => setActiveTab('performance')} className={`px-4 sm:px-4 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'performance' ? 'bg-charcoal text-white shadow-xl' : 'text-text-muted hover:text-charcoal'}`}>Performance</button>
          </div>
          <button onClick={() => { setShowAdd(!showAdd); setEditingStaff(null); setFormData({ name: '', email: '', phone: '', password: '', commissionRate: '', permissions: [] }); }} className="bg-premium-gold text-charcoal px-4 sm:px-4 sm:px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-premium-gold/20">
            {showAdd ? <X size={14} /> : <><UserPlus size={14} /> New Staff</>}
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-10">
          {(showAdd || editingStaff) ? (
            <div className="bg-white p-5 md:p-10 rounded-[3rem] border border-border-light shadow-sm max-w-5xl mx-auto">
              <h3 className="text-xl font-black text-charcoal mb-8 uppercase tracking-tight flex items-center gap-3">
                 <Target size={20} className="text-premium-gold" /> {editingStaff ? 'Refine Account' : 'Initialize Account'}
              </h3>
              <form onSubmit={(e) => { 
                e.preventDefault(); 
                if (editingStaff) {
                  updateMutation.mutate({ id: editingStaff, data: formData });
                } else {
                  createMutation.mutate(formData);
                }
              }} className="space-y-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Full Identity</label>
                    <input required className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold text-sm" placeholder="e.g. Rahul Sharma" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Email Access <span className="text-gray-400 lowercase normal-case tracking-normal">(Optional)</span></label>
                    <input type="email" className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold text-sm" placeholder="staff@magizhchi.in" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Primary Phone</label>
                    <input type="tel" className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold text-sm" placeholder="+91 XXXXX XXXXX" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">{editingStaff ? 'Set New Password' : 'Secure Password'}</label>
                    <input required={!editingStaff} type="password" minLength="8" className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold text-sm" placeholder={editingStaff ? 'Leave blank to keep current password' : 'Min 8 chars'} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Commission Rate (%)</label>
                    <div className="relative">
                       <Percent className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                       <input type="number" step="0.1" className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-black text-sm" placeholder="2.5" value={formData.commissionRate} onChange={e => setFormData({...formData, commissionRate: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-light">
                   <h4 className="text-[10px] font-black text-charcoal uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                     <ShieldCheck size={16} className="text-premium-gold" /> Module Access Control
                   </h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {[
                       { id: 'orders', label: 'Orders', icon: ShoppingBag },
                       { id: 'customers', label: 'Customers', icon: Users },
                       { id: 'create-bill', label: 'Create Bill', icon: Receipt },
                       { id: 'offline-bills', label: 'Offline Bills', icon: FileText }
                     ].map(module => (
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
                  <button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading} className="bg-charcoal text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-2 shadow-xl">
                    {(createMutation.isLoading || updateMutation.isLoading) ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Commit Changes</>}
                  </button>
                  <button type="button" onClick={() => { setShowAdd(false); setEditingStaff(null); }} className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-charcoal transition-colors px-4 sm:px-4 sm:px-6">Discard</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-6 max-w-3xl mx-auto">
              {isLoading && <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-premium-gold" size={40} /></div>}
              {staff?.length === 0 && <div className="py-24 text-center text-text-muted font-bold uppercase tracking-widest">No staff accounts registered.</div>}
            {staff?.map(s => (
              <div key={s._id} className="bg-white p-4 md:p-4 md:p-8 rounded-[3rem] border border-border-light shadow-sm flex flex-col gap-6 group hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="flex items-center gap-5">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-charcoal flex items-center justify-center text-premium-gold font-black text-2xl group-hover:scale-110 transition-transform">
                     {s.name?.[0]?.toUpperCase()}
                   </div>
                   <div>
                      <h4 className="font-black text-charcoal text-lg tracking-tight">{s.name}</h4>
                      <p className="text-[10px] bg-gold-soft/30 text-premium-gold font-black px-3 py-1 rounded-full w-fit uppercase tracking-wider mt-1">Certified Staff</p>
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="flex items-center gap-3 text-xs font-bold text-text-muted">
                      <div className="w-8 h-8 bg-light-bg rounded-xl flex items-center justify-center"><Mail size={14} /></div>
                      {s.email}
                   </div>
                   {s.phone && (
                     <div className="flex items-center gap-3 text-xs font-bold text-text-muted">
                        <div className="w-8 h-8 bg-light-bg rounded-xl flex items-center justify-center"><Phone size={14} /></div>
                        {s.phone}
                     </div>
                   )}
                   <div className="flex items-center gap-3 text-xs font-black text-emerald-600">
                      <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center"><Percent size={14} /></div>
                      {s.commissionRate || 0}% Sales Commission
                   </div>
                </div>

                <div className="flex gap-2 mt-2">
                   <button onClick={() => startEdit(s)} className="flex-1 bg-light-bg text-charcoal py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all">Edit Details</button>
                   <button onClick={() => { if (window.confirm(`Delete ${s.name}'s account?`)) deleteMutation.mutate(s._id); }} className="w-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {/* Performance Overview */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-4 md:p-4 md:p-8 rounded-[2.5rem] border border-border-light shadow-sm">
               <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6"><ShoppingBag size={24} /></div>
               <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Top Performer</p>
               <h2 className="text-2xl font-black text-charcoal tracking-tight">{performance?.[0]?.name || '—'}</h2>
            </div>
            <div className="bg-white p-4 md:p-4 md:p-8 rounded-[2.5rem] border border-border-light shadow-sm">
               <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><IndianRupee size={24} /></div>
               <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Total Sales (Staff)</p>
               <h2 className="text-2xl font-black text-charcoal tracking-tight">₹{performance?.reduce((sum, p) => sum + p.totalSales, 0).toLocaleString()}</h2>
            </div>
            <div className="bg-white p-4 md:p-4 md:p-8 rounded-[2.5rem] border border-border-light shadow-sm">
               <div className="w-12 h-12 bg-premium-gold/10 text-premium-gold rounded-2xl flex items-center justify-center mb-6"><Trophy size={24} /></div>
               <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Total Commission Paid</p>
               <h2 className="text-2xl font-black text-charcoal tracking-tight">₹{performance?.reduce((sum, p) => sum + p.totalCommission, 0).toLocaleString()}</h2>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-5 md:p-10 rounded-[3rem] border border-border-light shadow-sm">
               <h3 className="text-xs font-black text-charcoal uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                  <TrendingUp size={18} className="text-premium-gold" /> Sales Leaderboard
               </h3>
               <div className="h-[400px] w-full">
                  <Suspense fallback={<div className="h-[400px] w-full bg-light-bg rounded-2xl animate-pulse" />}>
                     <StaffBarChart data={performance} />
                  </Suspense>
               </div>
            </div>

            <div className="bg-white p-5 md:p-10 rounded-[3rem] border border-border-light shadow-sm">
               <h3 className="text-xs font-black text-charcoal uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                  <Target size={18} className="text-premium-gold" /> Efficiency Metrics
               </h3>
               <div className="space-y-4">
                  {performance?.map((p, i) => (
                    <div key={i} className="p-4 sm:p-4 sm:p-6 bg-light-bg/50 rounded-3xl border border-border-light flex items-center justify-between group hover:bg-white transition-all">
                       <div className="flex items-center flex-wrap gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-premium-gold shadow-sm border border-border-light group-hover:scale-110 transition-transform">
                             #{i + 1}
                          </div>
                          <div>
                             <p className="text-sm font-black text-charcoal">{p.name}</p>
                             <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{p.totalBills} Bills Generated</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-black text-emerald-600">₹{p.totalCommission.toLocaleString()}</p>
                          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-1">Earnings</p>
                       </div>
                    </div>
                  ))}
                  {(!performance || performance.length === 0) && (
                    <div className="py-20 text-center text-xs font-bold text-text-muted uppercase tracking-widest">No performance data yet</div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

