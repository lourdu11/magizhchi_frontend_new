import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2, Loader2, X, Save, Mail, Phone, Edit2, Percent, TrendingUp, Trophy, IndianRupee, ShoppingBag, Target, ShieldCheck, Users, Receipt, FileText, LayoutDashboard, Tag, Truck, Boxes, Star, BarChart2, Smartphone, UserCog, Image, Settings } from 'lucide-react';
import { adminService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import api from '../../services/api';

const StaffBarChart = lazy(() => import('./charts/StaffBarChart'));

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

export default function AdminStaff() {
  const navigate = useNavigate();
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

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/staff/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['admin-staff']); toast.success('Staff removed'); },
  });

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
          <button onClick={() => navigate('/admin/staff/new')} className="bg-premium-gold text-charcoal px-4 sm:px-4 sm:px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-premium-gold/20">
            <UserPlus size={14} /> New Staff
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-10">
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
                   <button onClick={() => navigate(`/admin/staff/edit/${s._id}`)} className="flex-1 bg-light-bg text-charcoal py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all">Edit Details</button>
                   <button onClick={() => { if (window.confirm(`Delete ${s.name}'s account?`)) deleteMutation.mutate(s._id); }} className="w-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
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

