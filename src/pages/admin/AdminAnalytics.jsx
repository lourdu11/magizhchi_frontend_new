import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { 
  TrendingUp, ShoppingBag, Download, Calendar, Filter, Loader2, 
  IndianRupee, PieChart as PieChartIcon, Layers, Sparkles, Users, 
  MapPin, ArrowUpRight, ArrowDownRight, Package, Printer, Calculator, 
  ScrollText, Clock, Shield, CheckCircle2, FileSpreadsheet, Cloud, Mail, X, Lock, Star
} from 'lucide-react';
import { adminService, billService } from '../../services';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Custom hook for ultra-reliable element measurement
function useMeasure() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    
    const update = () => {
      if (ref.current) {
        const { width, height } = ref.current.getBoundingClientRect();
        setDimensions(prev => {
          if (Math.abs(prev.width - width) < 0.1 && Math.abs(prev.height - height) < 0.1) return prev;
          return { width, height };
        });
      }
    };

    const observer = new ResizeObserver(update);
    observer.observe(ref.current);
    
    // Immediate update for initial paint
    requestAnimationFrame(update);

    return () => observer.disconnect();
  }, []);

  return [ref, dimensions];
}

const COLORS = ['#D4AF37', '#1A1A1A', '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('daily');
  const [hasMounted, setHasMounted] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingState, setExportingState] = useState(null);
  const [sessionId] = useState(() => `MGZ-ANL-${Math.floor(Math.random() * 1000000)}`);

  const [lineChartRef, { width: lineChartWidth }] = useMeasure();
  const [pieChartRef, { width: pieChartWidth }] = useMeasure();
  const [barChartRef, { width: barChartWidth }] = useMeasure();

  useEffect(() => { setHasMounted(true); }, []);

  // 1. Fetch Sales Analytics (Trends, Regional, etc.)
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-analytics', period],
    queryFn: () => adminService.getSalesAnalytics({ period }).then(r => r.data.data),
  });

  // 2. Fetch Daily Z-Report Data (Live Ledger, Cash Reconciliation)
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['daily-report'],
    queryFn: () => billService.getDailyReport().then(r => r.data.data),
  });

  const isLoading = analyticsLoading || dailyLoading;

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-premium-gold" size={40} /></div>;

  // --- Process Data ---
  const chartData = analytics?.data || [];
  const categoryData = analytics?.categoryData || [];
  const paymentData = analytics?.paymentData || [];
  const summary = analytics?.summary || { totalRevenue: 0, totalOrders: 0, growth: 0 };
  
  const dailySummary = dailyData?.summary || {};
  const dailyBills = dailyData?.bills || [];
  const expectedCash = dailySummary.cashTotal || 0;
  const discrepancy = actualCash === '' ? null : Number(actualCash) - expectedCash;
  const fmt = (n) => (n || 0).toLocaleString('en-IN');

  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) return toast.error('No data to export');
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}.csv`);
    a.click();
  };

  return (
    <div className="space-y-10 pb-20">
      <Helmet><title>Analysis Command Center — Admin</title></Helmet>

      {/* --- Immersive Header (Merged) --- */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 bg-white p-10 rounded-[3rem] border border-border-light shadow-sm no-print">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-premium-gold/10 rounded-2xl flex items-center justify-center text-premium-gold">
               <TrendingUp size={24} />
            </div>
            <h1 className="text-3xl font-black text-charcoal tracking-tight">Business Analysis</h1>
          </div>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em]">Combined intelligence & daily z-report</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-light-bg p-1.5 rounded-2xl flex gap-1">
            {['daily', 'monthly', 'yearly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-charcoal text-white shadow-xl' : 'text-text-muted hover:text-charcoal'}`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={() => window.print()} className="bg-white border border-border-light text-charcoal px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-premium-gold transition-all flex items-center gap-2">
            <Printer size={14} /> Z-Report
          </button>
          <button onClick={() => setShowExportModal(true)} className="bg-premium-gold text-charcoal px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* --- KPI Cards Expanded --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 no-print">
        {[
          { label: 'Total Revenue', value: `₹${fmt(summary.totalRevenue)}`, growth: `${summary.growth}%`, icon: IndianRupee, color: 'text-premium-gold', bg: 'bg-premium-gold/5' },
          { label: 'Avg Ticket', value: `₹${fmt(summary.avgTicket)}`, growth: 'AOV', icon: Star, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Orders', value: summary.totalOrders, growth: 'Live', icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Staff Leader', value: analytics?.staffPerformance?.[0]?.name || 'N/A', growth: 'Sales', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Cash Balance', value: `₹${fmt(dailySummary.cashTotal)}`, growth: 'Drawer', icon: Calculator, color: 'text-orange-600', bg: 'bg-orange-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-border-light shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
             <div className="absolute top-0 right-0 w-16 h-16 bg-light-bg/50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-700" />
             <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon size={20} />
                  </div>
                  <div className={`flex items-center gap-1 text-[8px] font-black px-2 py-1 rounded-full ${parseFloat(stat.growth) >= 0 || isNaN(parseFloat(stat.growth)) ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {stat.growth}
                  </div>
                </div>
                <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <h2 className="text-xl font-black text-charcoal tracking-tighter leading-none">{stat.value}</h2>
             </div>
          </div>
        ))}
      </div>

      {/* --- High Impact Visuals Row --- */}
      <div className="grid lg:grid-cols-4 gap-8 no-print">
         {/* 1. Real-time Activity Stream */}
         <div className="lg:col-span-1 bg-charcoal rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-premium-gold/10 rounded-full blur-[40px] -mr-16 -mt-16" />
            <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
               <Sparkles className="text-premium-gold" size={16} /> Live Pulse
            </h3>
            <div className="space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar-white pr-2">
               {analytics?.recentActivity?.map((act, i) => (
                  <div key={i} className="relative pl-6 border-l-2 border-white/10 pb-6 last:pb-0">
                     <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-premium-gold shadow-[0_0_10px_#D4AF37]" />
                     <div className="flex justify-between items-start mb-1">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded ${act.type === 'ONLINE' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{act.type}</span>
                        <span className="text-[8px] font-bold text-white/30">{new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                     <p className="text-[10px] font-black tracking-tight">{act.name}</p>
                     <p className="text-[12px] font-black text-premium-gold mt-1">₹{fmt(act.total)}</p>
                  </div>
               ))}
            </div>
         </div>

         {/* 2. Top Products Visual Gallery */}
         <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-border-light shadow-sm">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-sm font-black text-charcoal uppercase tracking-[0.3em] flex items-center gap-3">
                  <ShoppingBag size={18} className="text-premium-gold" /> Moving Fast
               </h3>
               <span className="text-[8px] font-black uppercase tracking-widest text-text-muted bg-light-bg px-3 py-1 rounded-full border border-border-light">Top 8 SKUs</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               {analytics?.topProducts?.map((p, i) => (
                  <div key={i} className="group cursor-pointer">
                     <div className="aspect-square rounded-3xl overflow-hidden bg-light-bg mb-3 border border-border-light relative">
                        {p.image ? (
                           <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-charcoal/10"><ShoppingBag size={32} /></div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-charcoal/90 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded-lg">#{i+1}</div>
                     </div>
                     <p className="text-[10px] font-black text-charcoal truncate mb-1 uppercase tracking-tight">{p.name}</p>
                     <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-text-muted">{p.qty} sold</span>
                        <span className="text-[10px] font-black text-premium-gold">₹{fmt(p.rev)}</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* 3. Staff Leaderboard */}
         <div className="lg:col-span-1 bg-white rounded-[3rem] p-10 border border-border-light shadow-sm">
            <h3 className="text-sm font-black text-charcoal uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
               <Users size={18} className="text-premium-gold" /> Performance
            </h3>
            <div className="space-y-6">
               {analytics?.staffPerformance?.map((staff, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                     <div className="relative">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 ${i === 0 ? 'bg-premium-gold/10 border-premium-gold text-premium-gold' : 'bg-light-bg border-border-light text-charcoal'}`}>
                           {staff.name.substring(0, 1)}
                        </div>
                        {i === 0 && <div className="absolute -top-2 -right-2 bg-charcoal text-white text-[8px] font-black p-1 rounded-full border-2 border-white"><Sparkles size={8} /></div>}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-charcoal truncate uppercase">{staff.name}</p>
                        <p className="text-[9px] font-bold text-text-muted mt-0.5">{staff.txns} Bills</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[11px] font-black text-charcoal">₹{fmt(staff.totalSales)}</p>
                        <div className="w-16 h-1 bg-light-bg rounded-full mt-2 overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: i === 0 ? '100%' : `${(staff.totalSales / analytics.staffPerformance[0].totalSales) * 100}%` }} transition={{ duration: 1 }} className={`h-full ${i === 0 ? 'bg-premium-gold' : 'bg-charcoal/20'} rounded-full`} />
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* --- Analysis Section Continued --- */}
      <div className="grid lg:grid-cols-3 gap-8 no-print">
        {/* Revenue Over Time Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-border-light shadow-sm min-w-0">
          <h3 className="text-xl font-black text-charcoal tracking-tight flex items-center gap-3 uppercase text-[12px] tracking-[0.2em] mb-10">
            <Calendar size={18} className="text-premium-gold" /> Revenue Over Time
          </h3>
          <div ref={lineChartRef} className="h-[350px] w-full">
            {hasMounted && lineChartWidth > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F1" vertical={false} />
                  <XAxis dataKey="_id" tick={{ fontSize: 10, fontWeight: 900, fill: '#1A1A1A' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 900, fill: '#999' }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '20px', fontWeight: 900, fontSize: '10px' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={5} dot={{ fill: '#D4AF37', r: 6, strokeWidth: 3, stroke: '#FFF' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Daily Cash Reconciliation (From Daily Report) */}
        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-border-light">
          <h3 className="text-xl font-black text-charcoal tracking-tight flex items-center gap-3 uppercase text-[12px] tracking-[0.2em] mb-10">
            <Calculator size={18} className="text-premium-gold" /> Cash Reconciliation
          </h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center p-5 bg-light-bg rounded-2xl">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Expected</span>
              <span className="text-xl font-black text-charcoal">₹{fmt(expectedCash)}</span>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Physical Count</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal font-black">₹</span>
                <input type="number" value={actualCash} onChange={e => setActualCash(e.target.value)} className="w-full bg-white border-2 border-border-light rounded-2xl pl-10 pr-4 py-4 focus:outline-none focus:border-premium-gold font-black text-lg transition-all" placeholder="0.00" />
              </div>
            </div>
            {discrepancy !== null && (
              <div className={`p-5 rounded-2xl flex items-center justify-between ${discrepancy === 0 ? 'bg-emerald-50 text-emerald-600' : discrepancy > 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest">{discrepancy === 0 ? 'Balanced' : discrepancy > 0 ? 'Over' : 'Short'}</span>
                <span className="text-xl font-black">₹{fmt(Math.abs(discrepancy))}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 no-print">
         {/* Live Transaction Ledger */}
         <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-border-light">
            <h3 className="text-xl font-black text-charcoal tracking-tight flex items-center gap-3 uppercase text-[12px] tracking-[0.2em] mb-10">
               <ScrollText size={18} className="text-premium-gold" /> Live Transaction Ledger
            </h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
               {dailyBills.length === 0 ? <p className="text-center py-20 text-[10px] font-black opacity-30 uppercase">No transactions yet today</p> :
                dailyBills.map(bill => (
                  <div key={bill._id} className="flex items-center justify-between p-5 bg-light-bg rounded-2xl border border-border-light group hover:border-premium-gold transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Clock size={16} className="text-text-muted" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-charcoal">#{bill.billNumber}</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">{new Date(bill.createdAt).toLocaleTimeString()} • {bill.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-charcoal">₹{fmt(bill.pricing.totalAmount)}</p>
                      <p className="text-[10px] font-bold text-text-muted mt-1">{bill.items.length} items</p>
                    </div>
                  </div>
                ))
               }
            </div>
         </div>

         {/* Distribution Split */}
         <div className="space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-border-light shadow-sm">
               <h3 className="text-xl font-black text-charcoal tracking-tight flex items-center gap-3 uppercase text-[12px] tracking-[0.2em] mb-10">
                  <Layers size={18} className="text-premium-gold" /> Category Performance
               </h3>
               <div ref={barChartRef} className="h-[250px] w-full">
                  {hasMounted && barChartWidth > 0 && (
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F1" vertical={false} />
                           <XAxis dataKey="_id" tick={{ fontSize: 10, fontWeight: 900, fill: '#1A1A1A' }} axisLine={false} tickLine={false} />
                           <YAxis tick={{ fontSize: 10, fontWeight: 900, fill: '#999' }} axisLine={false} tickLine={false} />
                           <Tooltip />
                           <Bar dataKey="revenue" fill="#D4AF37" radius={[10, 10, 0, 0]} barSize={40} />
                        </BarChart>
                     </ResponsiveContainer>
                  )}
               </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-border-light shadow-sm">
               <h3 className="text-xl font-black text-charcoal tracking-tight flex items-center gap-3 uppercase text-[12px] tracking-[0.2em] mb-10">
                  <MapPin size={18} className="text-premium-gold" /> Geographical Sales
               </h3>
               <div className="space-y-4">
                  {analytics?.locationData?.map((loc, i) => (
                     <div key={i} className="flex items-center justify-between p-5 bg-light-bg rounded-2xl border border-border-light group hover:border-premium-gold transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-white border border-border-light flex items-center justify-center">
                              <MapPin size={16} className="text-premium-gold" />
                           </div>
                           <div>
                              <p className="text-sm font-black text-charcoal uppercase tracking-tighter">{loc._id}</p>
                              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">{loc.orders} Sales Transactions</p>
                           </div>
                        </div>
                        <p className="text-sm font-black text-charcoal">₹{fmt(loc.revenue)}</p>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* --- Export Modal (From Daily Report) --- */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExportModal(false)} className="absolute inset-0 bg-charcoal/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl bg-white rounded-[3rem] p-12 overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-premium-gold/5 rounded-full blur-[80px] -mr-32 -mt-32" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Export Intelligence</h2>
                  <button onClick={() => setShowExportModal(false)} className="text-text-muted hover:text-charcoal"><X size={24} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'csv', title: 'Raw Data (CSV)', icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { id: 'cloud', title: 'Cloud Sync', icon: Cloud, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { id: 'admin', title: 'Email Dispatch', icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50' },
                  ].map(opt => (
                    <button key={opt.id} onClick={() => { setExportingState('success'); setTimeout(() => { setShowExportModal(false); setExportingState(null); }, 1500); }} className="p-8 rounded-3xl border-2 border-light-bg hover:border-premium-gold bg-white transition-all text-left flex items-center gap-6 group">
                      <div className={`w-14 h-14 ${opt.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <opt.icon size={28} className={opt.color} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-charcoal uppercase tracking-tight">{opt.title}</h4>
                        <p className="text-[10px] font-bold text-text-muted mt-1">Session: {sessionId.split('-')[2]}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Thermal Printer Layout (Print Only) --- */}
      <div className="hidden print:block text-black bg-white p-4 font-mono w-[300px] text-xs">
        <div className="text-center mb-4 border-b border-dashed pb-4">
          <h1 className="text-xl font-bold uppercase mb-1">MAGIZHCHI</h1>
          <p className="text-[10px]">Consolidated Z-Report Analysis</p>
          <p className="text-[10px]">{new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
        </div>
        <div className="space-y-1 mb-4 border-b border-dashed pb-4">
          <div className="flex justify-between font-bold"><p>Total Revenue:</p><p>₹{fmt(summary.totalRevenue)}</p></div>
          <div className="flex justify-between"><p>Expected Cash:</p><p>₹{fmt(expectedCash)}</p></div>
          <div className="flex justify-between"><p>Actual Cash:</p><p>₹{fmt(Number(actualCash)||0)}</p></div>
          <div className="flex justify-between font-bold"><p>Discrepancy:</p><p>₹{fmt(discrepancy || 0)}</p></div>
        </div>
        <p className="text-[10px] text-center italic">*** END OF ANALYSIS ***</p>
      </div>
    </div>
  );
}
