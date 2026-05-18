import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, ShoppingBag, Users, Package, AlertTriangle, Eye, 
  IndianRupee, ArrowUpRight, ArrowDownRight, CreditCard, 
  Clock, CheckCircle2, Truck, Plus, Boxes, LayoutGrid, Sparkles
} from 'lucide-react';
import { adminService } from '../../services';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DashboardSkeleton } from '../../components/common/Skeletons';

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const COLORS = ['#D4AF37', '#1A1A1A', '#4A4A4A', '#8A8A8A', '#B5B5B5'];

function StatCard({ icon: Icon, label, value, trend, trendValue, sub, color = 'text-charcoal', bg = 'bg-white' }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`${bg} rounded-[2.5rem] md:rounded-[3rem] border border-border-light p-6 md:p-8 shadow-sm hover:border-premium-gold transition-all group relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-premium-gold/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-premium-gold/10 transition-colors" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-light-bg flex items-center justify-center text-charcoal shadow-inner group-hover:scale-110 transition-transform">
            <Icon size={20} className="md:size-[22px]" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {trendValue}
            </div>
          )}
        </div>
        <p className="text-[9px] md:text-[10px] text-text-muted font-black uppercase tracking-[0.2em] mb-1 md:mb-2">{label}</p>
        <p className={`text-xl md:text-2xl font-black tracking-tighter ${color}`}>{value}</p>
        {sub && <p className="text-[8px] md:text-[9px] text-text-muted font-bold mt-2 uppercase tracking-widest leading-tight">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isChartReady, setIsChartReady] = useState(false);
  
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-dashboard-v2'],
    queryFn: () => adminService.getDashboard().then(r => r.data.data),
    refetchInterval: 30000,
  });

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['admin-analytics-v2'],
    queryFn: () => adminService.getSalesAnalytics({ period: 'daily' }).then(r => r.data.data),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!isLoadingStats && !isLoadingAnalytics) {
      const timer = setTimeout(() => setIsChartReady(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoadingStats, isLoadingAnalytics]);

  if ((isLoadingStats || isLoadingAnalytics) && (!dashboardStats || !analytics)) return <DashboardSkeleton />;

  const d = dashboardStats || {};
  const a = analytics || {};
  const salesTrend = a.data || [];

  return (
    <div className="space-y-8 md:space-y-10 pb-20">
      {/* ─── Premium Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-border-light shadow-sm">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-charcoal tracking-tighter uppercase leading-none">Business Pulse</h1>
          <p className="text-[10px] md:text-xs text-text-muted font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] mt-3 flex items-center gap-2">
            <Sparkles size={14} className="text-premium-gold" /> Real-time Enterprise Intelligence
          </p>
        </div>
        <div className="grid grid-cols-2 md:flex gap-3 md:gap-4">
          <button onClick={() => navigate('/admin/catalog')} className="px-4 md:px-8 py-3 md:py-4 bg-light-bg text-charcoal rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-charcoal hover:text-white transition-all flex items-center justify-center gap-2">
            <LayoutGrid size={16} /> Catalog
          </button>
          <button onClick={() => navigate('/admin/create-bill')} className="px-4 md:px-8 py-3 md:py-4 bg-charcoal text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center justify-center gap-2">
            <Plus size={16} /> Billing
          </button>
        </div>
      </div>

      {/* ─── Top Stats Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard icon={TrendingUp} label="Today's Revenue" value={formatCurrency(d.revenue?.today)} trend={d.revenue?.today > 0 ? 'up' : 'down'} trendValue={a.summary?.growth ? `${a.summary.growth > 0 ? '+' : ''}${Number(a.summary.growth).toFixed(1)}%` : 'Live'} sub="Across all channels" color="text-charcoal" />
        <StatCard icon={Sparkles} label="Today's Profit" value={formatCurrency(d.revenue?.todayProfit)} trend={d.revenue?.todayProfit >= 0 ? 'up' : 'down'} trendValue={d.revenue?.todayProfit >= 0 ? 'Positive' : 'Negative'} sub="Net margin calculated" color="text-emerald-600" />
        <StatCard icon={CreditCard} label="Settled Value" value={formatCurrency(d.erp?.settledValue)} sub="Total payments made" color="text-indigo-600" />
        <StatCard icon={Users} label="Active Partners" value={d.erp?.activePartners || 0} sub="Managed Trade Partners" color="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <StatCard icon={Package} label="Procurement Volume" value={formatCurrency(d.erp?.procurementVolume)} sub="Gross purchase history" bg="bg-charcoal" color="text-white" />
         <StatCard icon={AlertTriangle} label="Net Payables" value={formatCurrency(d.erp?.totalPayables)} sub="Current outstanding" color="text-red-600" />
      </div>

      {/* ─── Primary Analytics Section ─── */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-[3.5rem] border border-border-light p-10 shadow-sm relative overflow-hidden">
           <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-charcoal uppercase tracking-tighter">Growth Velocity</h3>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">30-Day Transaction Volume</p>
              </div>
              <div className="flex gap-2">
                 <div className="flex items-center gap-2 px-4 py-2 bg-light-bg rounded-xl text-[9px] font-black uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-premium-gold" /> Revenue
                 </div>
              </div>
           </div>
           
           <div className="w-full block">
              {isChartReady && salesTrend.length > 0 ? (
                <ResponsiveContainer width="99%" height={350} minWidth={0} minHeight={0} debounce={100}>
                  <AreaChart data={salesTrend}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                    <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '20px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] w-full flex items-center justify-center bg-light-bg/30 rounded-3xl animate-pulse">
                   <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Warming up intelligence...</p>
                </div>
              )}
           </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-[3.5rem] border border-border-light p-10 shadow-sm">
           <h3 className="text-xl font-black text-charcoal uppercase tracking-tighter mb-8">Category Mix</h3>
           <div className="w-full block">
              {isChartReady && a.categoryData?.length > 0 ? (
                <ResponsiveContainer width="99%" height={250} minWidth={0} minHeight={0} debounce={100}>
                  <PieChart>
                    <Pie
                      data={a.categoryData?.slice(0, 5) || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="revenue"
                    >
                      {a.categoryData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] w-full flex items-center justify-center bg-light-bg/30 rounded-full animate-pulse" />
              )}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="text-center">
                    <p className="text-[10px] font-black text-text-muted uppercase">Top Lead</p>
                    <p className="text-sm font-black text-charcoal uppercase">{a.categoryData?.[0]?._id || 'None'}</p>
                 </div>
              </div>
           </div>
           <div className="space-y-4 mt-8">
              {a.categoryData?.slice(0, 3).map((cat, i) => (
                <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-[11px] font-bold text-charcoal uppercase">{cat._id}</span>
                   </div>
                   <span className="text-[11px] font-black text-text-muted">{Math.round((cat.revenue / a.summary?.totalRevenue) * 100)}%</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* ─── Operational Pulse ─── */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Real-time Order Feed */}
        <div className="lg:col-span-2 bg-white rounded-[3.5rem] border border-border-light p-10 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-charcoal uppercase tracking-tighter flex items-center gap-3">
                 <Clock className="text-premium-gold" size={20} /> Transaction Pulse
              </h3>
              <button onClick={() => navigate('/admin/orders')} className="text-[10px] font-black text-premium-gold uppercase tracking-widest hover:underline">View All Orders</button>
           </div>
           <div className="flex-1 space-y-6 overflow-y-auto max-h-[400px] pr-4 custom-scrollbar">
                             {d.recentTransactions?.map((order, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  key={order._id} className="flex items-center justify-between p-6 bg-light-bg/50 rounded-[2rem] border border-border-light/40 group hover:border-premium-gold transition-all"
                >
                   <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-charcoal shadow-sm font-black text-lg group-hover:bg-charcoal group-hover:text-white transition-all">
                         {order.userId?.name?.[0] || 'G'}
                      </div>
                      <div>
                         <div className="flex items-center gap-3">
                            <span className="text-base font-black text-charcoal">#{order.orderNumber}</span>
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${order.isGuestOrder ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                               {order.isGuestOrder ? 'Guest' : 'Member'}
                            </span>
                         </div>
                         <p className="text-[10px] text-text-muted font-bold mt-1 uppercase tracking-widest">
                            {order.userId?.name || 'Guest Checkout'} · {new Date(order.createdAt).toLocaleTimeString()}
                         </p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-lg font-black text-charcoal tracking-tight">{formatCurrency(order.pricing?.totalAmount)}</p>
                      <div className="flex items-center justify-end gap-2 mt-1">
                         <div className={`w-1.5 h-1.5 rounded-full ${order.orderStatus === 'delivered' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                         <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">{order.orderStatus}</span>
                      </div>
                   </div>
                </motion.div>
              ))}
           </div>
        </div>

        <div className="space-y-8">
           {/* Low Stock Pulse (Google Red Material Card) */}
           <div className="bg-[#fce8e6]/60 border border-[#FAD2CF] rounded-[3.5rem] p-10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#EA4335]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="relative z-10">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black text-[#C5221F] uppercase tracking-tighter">Stock Fragility</h3>
                    <div className="w-8 h-8 bg-[#EA4335]/15 text-[#C5221F] rounded-lg flex items-center justify-center animate-pulse">
                       <AlertTriangle size={18} />
                    </div>
                 </div>
                 <div className="space-y-4">
                    {d.lowStockProducts?.slice(0, 4).map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/90 rounded-2xl border border-[#FAD2CF]/60 shadow-sm">
                         <div className="min-w-0">
                            <p className="text-[11px] font-black text-[#202124] truncate">{p.productName || p.name}</p>
                            <p className="text-[9px] text-[#5F6368] font-bold uppercase tracking-widest">{p.size} · {p.color}</p>
                         </div>
                         <div className="text-right shrink-0">
                            {/* BUG #14 FIX: use availableStock (correct API field) not p.avail (undefined) */}
                          <p className="text-xs font-black text-[#D93025]">{p.availableStock ?? p.totalStock ?? 0} left</p>
                         </div>
                      </div>
                    ))}
                    <button onClick={() => navigate('/admin/catalog')} className="w-full py-4 mt-2 bg-[#C5221F] hover:bg-[#B0120A] text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-[#EA4335]/10">
                       Refill Catalog
                    </button>
                 </div>
              </div>
           </div>

           {/* Payment Modes */}
           <div className="bg-white rounded-[3.5rem] border border-border-light p-10 shadow-sm">
              <h3 className="text-lg font-black text-charcoal uppercase tracking-tighter mb-6 flex items-center gap-2">
                 <CreditCard size={18} className="text-premium-gold" /> Settlement Split
              </h3>
              <div className="space-y-5">
                 {a.paymentData?.slice(0, 4).map((pay, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                         <span className="text-charcoal">{pay._id || 'Unknown'}</span>
                         <span className="text-text-muted">{formatCurrency(pay.revenue)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-light-bg rounded-full overflow-hidden">
                         <motion.div 
                            initial={{ width: 0 }} animate={{ width: `${(pay.revenue / a.summary?.totalRevenue) * 100}%` }}
                            className="h-full bg-charcoal rounded-full" 
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
