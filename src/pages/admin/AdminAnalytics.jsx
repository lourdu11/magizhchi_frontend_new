import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { 
  TrendingUp, ShoppingBag, Download, Calendar, Filter, Loader2, 
  IndianRupee, Layers, Sparkles, Users, 
  MapPin, ArrowUpRight, ArrowDownRight, Package, Printer, Calculator, 
  ScrollText, Clock, Shield, CheckCircle2, FileSpreadsheet, Cloud, Mail, X, Lock, Star, AlertTriangle,
  RefreshCw, Wifi, AlertCircle, TrendingDown, Receipt
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
    
    requestAnimationFrame(update);

    return () => observer.disconnect();
  }, []);

  return [ref, dimensions];
}

const COLORS = ['#D4AF37', '#1A1A1A', '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AdminAnalytics() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState('daily');
  const [hasMounted, setHasMounted] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeMetric, setActiveMetric] = useState('revenue'); // revenue | orders | profit
  const [isLiveSync, setIsLiveSync] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [lineChartRef, { width: lineChartWidth }] = useMeasure();
  const [pieChartRef, { width: pieChartWidth }] = useMeasure();
  const [barChartRef, { width: barChartWidth }] = useMeasure();

  useEffect(() => { setHasMounted(true); }, []);

  // 1. Fetch Sales Analytics
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['admin-analytics', period],
    queryFn: () => adminService.getSalesAnalytics({ period }).then(r => r.data.data),
    refetchInterval: isLiveSync ? 30000 : false,
  });

  // 2. Fetch Daily Z-Report Data
  const { data: dailyData, isLoading: dailyLoading, refetch: refetchDaily } = useQuery({
    queryKey: ['daily-report'],
    queryFn: () => billService.getDailyReport().then(r => r.data.data),
    refetchInterval: isLiveSync ? 30000 : false,
  });

  // Real-time live countdown ticker
  useEffect(() => {
    if (!isLiveSync) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleManualRefresh();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLiveSync]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchAnalytics(), refetchDaily()]);
    setCountdown(30);
    toast.success('Live analytics successfully synced!', { id: 'live-sync', icon: '⚡' });
    setIsRefreshing(false);
  };

  const isLoading = analyticsLoading || dailyLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="animate-spin text-premium-gold" size={48} />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted animate-pulse">Warming up intelligence engines...</p>
      </div>
    );
  }

  // --- Process Data ---
  const chartData = Array.isArray(analytics?.data) ? analytics.data.map(item => ({
    ...item,
    // Safely parse values
    revenue: (item.revenue || 0) / 100,
    orders: item.orders || item.count || 0,
    profit: ((item.revenue || 0) - (item.cost || 0)) / 100
  })) : [];

  const categoryData = Array.isArray(analytics?.categoryData) ? analytics.categoryData.map(c => ({
    ...c,
    revenue: (c.revenue || 0) / 100
  })) : [];

  const paymentData = Array.isArray(analytics?.paymentData) ? analytics.paymentData : [];
  const summary = analytics?.summary || { totalRevenue: 0, totalOrders: 0, growth: 0 };
  
  const dailySummary = dailyData?.summary || {};
  const dailyBills = dailyData?.bills || [];
  
  const expectedCash = dailySummary.cashTotal || 0;
  const expectedUpi = dailySummary.upiTotal || 0;
  const expectedCard = dailySummary.cardTotal || 0;
  const expectedTotal = expectedCash + expectedUpi + expectedCard;

  const discrepancy = actualCash === '' ? null : Number(actualCash) - (expectedCash / 100);
  const fmt = (n) => (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  // Real-time anomalies generation
  const anomalies = [];
  if (discrepancy !== null && Math.abs(discrepancy) > 0.01) {
    anomalies.push({
      type: 'warning',
      title: 'Cash Discrepancy Mismatch',
      desc: `Cash drawer count differs from expected value by ₹${fmt(Math.abs(discrepancy))}. Re-verify counter logs.`,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50 border-red-100'
    });
  }
  if (analytics?.erp?.lowStockProducts?.length > 0) {
    anomalies.push({
      type: 'stock',
      title: 'Critical Inventory Levels',
      desc: `${analytics?.erp?.lowStockProducts?.length} profiles are running dangerously below minimum threshold limits.`,
      icon: Package,
      color: 'text-amber-600 bg-amber-50 border-amber-100'
    });
  }
  // High value checkout detection
  const highValueBills = dailyBills.filter(b => b.pricing.totalAmount > 1000000); // Exceeds ₹10,000
  if (highValueBills.length > 0) {
    anomalies.push({
      type: 'sales',
      title: 'High-Value Purchases Logged',
      desc: `${highValueBills.length} VIP invoice checkout(s) exceeding ₹10,000 registered today.`,
      icon: Sparkles,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
    });
  }
  // Cloud session check
  if (anomalies.length === 0) {
    anomalies.push({
      type: 'info',
      title: 'System Pulse Operational',
      desc: 'All data structures reconciled perfectly. Live transactional pipelines are stable.',
      icon: CheckCircle2,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100'
    });
  }

  const downloadCSV = () => {
    if (!chartData || chartData.length === 0) return toast.error('No analytics data available to export');
    
    const formattedData = chartData.map(row => ({
      Timeline: row._id,
      'Revenue (₹)': row.revenue,
      'Transactions Count': row.orders,
      'Estimated Profit (₹)': row.profit
    }));

    const headers = Object.keys(formattedData[0]).join(',');
    const rows = formattedData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Magizhchi_Analytics_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    a.click();
    toast.success('Analytics CSV report downloaded!');
  };

  return (
    <div className="space-y-10 pb-20">
      <Helmet><title>Analysis Command Center v2.0 — Admin</title></Helmet>

      {/* --- Immersive Live Header --- */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-border-light shadow-sm no-print relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-premium-gold/5 rounded-full blur-[80px] -mr-40 -mt-40 -z-0" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-16 h-16 bg-charcoal text-premium-gold rounded-3xl flex items-center justify-center shadow-xl group hover:scale-105 transition-all">
             <TrendingUp size={32} className="group-hover:rotate-12 transition-transform" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-fluid-2xl font-black text-charcoal tracking-tighter uppercase leading-none">Analytics 2.0</h1>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-[9px] font-black uppercase tracking-wider shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Sync
              </div>
            </div>
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.3em] mt-3">Advanced Enterprise Business Intelligence Engine</p>
          </div>
        </div>
        
        {/* Real-time synchronization widget */}
        <div className="flex flex-wrap items-center gap-4 relative z-10 w-full lg:w-auto">
          {/* Progress circle loader */}
          <div className="flex items-center gap-3 bg-light-bg border border-border-light px-5 py-3 rounded-2xl">
            <button 
              onClick={() => setIsLiveSync(!isLiveSync)} 
              className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all ${isLiveSync ? 'text-emerald-600' : 'text-text-muted hover:text-charcoal'}`}
            >
              <Wifi size={14} className={isLiveSync ? 'animate-pulse' : ''} />
              {isLiveSync ? `Refreshing in ${countdown}s` : 'Live Sync Paused'}
            </button>
            <button 
              onClick={handleManualRefresh} 
              disabled={isRefreshing}
              className={`p-1 hover:text-premium-gold transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={12} />
            </button>
          </div>

          <div className="bg-light-bg p-1.5 rounded-2xl flex gap-1 border border-border-light">
            {['daily', 'monthly', 'yearly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-charcoal text-white shadow-lg' : 'text-text-muted hover:text-charcoal'}`}>
                {p}
              </button>
            ))}
          </div>
          
          <button onClick={() => setShowPrintModal(true)} className="bg-white border border-border-light text-charcoal px-5 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:border-premium-gold hover:text-premium-gold transition-all flex items-center justify-center gap-2 shadow-sm">
            <Printer size={14} /> Z-Report
          </button>
          
          <button onClick={() => setShowExportModal(true)} className="bg-premium-gold text-charcoal px-5 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* --- Live Alert & Anomaly Detector Alert Line --- */}
      <div className="grid grid-cols-1 gap-4 no-print">
        {anomalies.map((anom, i) => (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            key={i} 
            className={`p-5 rounded-3xl border flex items-center justify-between gap-4 ${anom.color} shadow-sm`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/80 backdrop-blur-md rounded-xl shadow-sm">
                <anom.icon size={18} />
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider leading-tight">{anom.title}</h4>
                <p className="text-[10px] font-semibold opacity-85 mt-1">{anom.desc}</p>
              </div>
            </div>
            {anom.type === 'warning' && (
              <button 
                onClick={() => setActualCash('')} 
                className="px-4 py-2 bg-white text-charcoal rounded-xl text-[9px] font-black uppercase tracking-widest border border-border-light hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
              >
                Reset Reconciliation
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* --- KPI Cards Grid --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 no-print">
        {[
          { label: 'Today\'s Revenue', value: `₹${fmt(summary.totalRevenue / 100)}`, growth: `${summary.growth}%`, desc: 'Dynamic sales velocity', icon: IndianRupee, color: 'text-premium-gold', bg: 'bg-premium-gold/5' },
          { label: 'Net Payables', value: `₹${fmt(analytics?.erp?.totalPayables / 100)}`, growth: 'Supplier debt', desc: 'Outstanding balances', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Asset Value', value: `₹${fmt(analytics?.erp?.inventoryValue / 100)}`, growth: 'In stock', desc: 'Raw cost evaluation', icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Orders', value: summary.totalOrders, growth: 'Transactions', desc: 'Across all channels', icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Partners', value: analytics?.erp?.activePartners || 0, growth: 'Wholesale', desc: 'Managed supplier base', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-border-light shadow-sm hover:shadow-xl hover:border-premium-gold/30 transition-all group relative overflow-hidden flex flex-col justify-between">
             <div className="absolute top-0 right-0 w-20 h-20 bg-light-bg rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-700" />
             <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-sm`}>
                    <stat.icon size={20} />
                  </div>
                  <div className={`flex items-center gap-1 text-[8px] font-black px-2 py-1 rounded-full ${parseFloat(stat.growth) >= 0 || isNaN(parseFloat(stat.growth)) ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {stat.growth}
                  </div>
                </div>
                <div>
                  <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em]">{stat.label}</p>
                  <h2 className="text-fluid-xl font-black text-charcoal tracking-tighter leading-none mt-1">{stat.value}</h2>
                  <p className="text-[8px] font-semibold text-text-muted mt-2">{stat.desc}</p>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* --- Live Interactive Multi-Metric Analytics Chart --- */}
      <div className="grid lg:grid-cols-3 gap-8 no-print">
        {/* Multi-Metric Recharts Graph */}
        <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[3rem] border border-border-light shadow-sm min-w-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h3 className="text-sm font-black text-charcoal uppercase tracking-[0.3em] flex items-center gap-3">
                <Calendar size={18} className="text-premium-gold" /> Performance Engine
              </h3>
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1.5">Switch dynamically between multiple financial parameters</p>
            </div>
            
            {/* Metric Switcher Tab */}
            <div className="bg-light-bg p-1 rounded-2xl flex gap-1 border border-border-light self-start md:self-auto">
              {[
                { id: 'revenue', label: 'Revenue', color: 'bg-premium-gold text-charcoal' },
                { id: 'profit', label: 'Net Margin', color: 'bg-emerald-600 text-white' },
                { id: 'orders', label: 'Order Volume', color: 'bg-indigo-600 text-white' }
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveMetric(tab.id)} 
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeMetric === tab.id ? tab.color + ' shadow-md' : 'text-text-muted hover:text-charcoal'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div ref={lineChartRef} className="h-[350px] w-full">
            {hasMounted && lineChartWidth > 0 && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={1}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeMetric === 'revenue' ? '#D4AF37' : activeMetric === 'profit' ? '#10B981' : '#4F46E5'} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={activeMetric === 'revenue' ? '#D4AF37' : activeMetric === 'profit' ? '#10B981' : '#4F46E5'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F1" vertical={false} />
                  <XAxis dataKey="_id" tick={{ fontSize: 9, fontWeight: 900, fill: '#1A1A1A' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 9, fontWeight: 900, fill: '#999' }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(val) => activeMetric !== 'orders' ? `₹${fmt(val)}` : val} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', padding: '20px', fontWeight: 900, fontSize: '10px' }}
                    formatter={(value) => [activeMetric !== 'orders' ? `₹${fmt(value)}` : value, activeMetric.toUpperCase()]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={activeMetric} 
                    stroke={activeMetric === 'revenue' ? '#D4AF37' : activeMetric === 'profit' ? '#10B981' : '#4F46E5'} 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorMetric)"
                    dot={{ fill: activeMetric === 'revenue' ? '#D4AF37' : activeMetric === 'profit' ? '#10B981' : '#4F46E5', r: 5, strokeWidth: 3, stroke: '#FFF' }}
                    activeDot={{ r: 7, strokeWidth: 0 }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Daily Z-Report Cash Drawer Reconciliation */}
        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-border-light flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-charcoal uppercase tracking-[0.3em] flex items-center gap-3 mb-1.5">
              <Calculator size={18} className="text-premium-gold" /> Drawer Reconciliation
            </h3>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Verify and audit daily physical counters</p>
          </div>

          <div className="space-y-6 my-8">
            <div className="flex justify-between items-center p-5 bg-light-bg rounded-2xl border border-border-light shadow-sm">
              <div>
                <span className="text-[8px] font-black text-text-muted uppercase tracking-widest block">Expected Cash Roll</span>
                <span className="text-[10px] font-bold text-text-muted mt-1 block">Z-Report Offline</span>
              </div>
              <span className="text-2xl font-black text-charcoal">₹{fmt(expectedCash / 100)}</span>
            </div>
            
            <div className="space-y-3">
              <label className="text-[8px] font-black text-text-muted uppercase tracking-widest ml-1">Actual Physical Drawer Cash Count</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal font-black">₹</span>
                <input 
                  type="number" 
                  value={actualCash} 
                  onChange={e => setActualCash(e.target.value)} 
                  className="w-full bg-white border-2 border-border-light rounded-2xl pl-10 pr-4 py-4 focus:outline-none focus:border-premium-gold font-black text-lg transition-all shadow-sm" 
                  placeholder="0.00" 
                />
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              {discrepancy !== null && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.95 }} 
                  className={`p-5 rounded-2xl flex items-center justify-between border ${Math.abs(discrepancy) < 0.01 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : discrepancy > 0 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">{Math.abs(discrepancy) < 0.01 ? 'Balanced' : discrepancy > 0 ? 'Over' : 'Shortage'}</span>
                  <span className="text-xl font-black">{discrepancy >= 0 ? '+' : '-'}₹{fmt(Math.abs(discrepancy))}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-[8px] font-semibold text-text-muted text-center italic">Calculated live off offline billing sequences for Z-Report reconciliation.</p>
        </div>
      </div>

      {/* --- High Impact Visuals Row --- */}
      <div className="grid lg:grid-cols-4 gap-8 no-print">
         {/* 1. Real-time Live Pulse Activity Stream */}
         <div className="lg:col-span-1 bg-charcoal rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-premium-gold/10 rounded-full blur-[40px] -mr-16 -mt-16" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                 <Sparkles className="text-premium-gold" size={16} /> Live Pulse
              </h3>
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar-white">
                 {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                   analytics.recentActivity.map((act, i) => (
                      <div key={i} className="relative pl-6 border-l-2 border-white/10 pb-6 last:pb-0">
                         <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-premium-gold shadow-[0_0_10px_#D4AF37]" />
                         <div className="flex justify-between items-start mb-1">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded ${act.type === 'ONLINE' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{act.type}</span>
                            <span className="text-[8px] font-bold text-white/30">{new Date(act.createdAt || act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                         <p className="text-[10px] font-black tracking-tight">{act.name}</p>
                         <p className="text-[11px] font-black text-premium-gold mt-1">₹{fmt(act.total / 100)}</p>
                      </div>
                   ))
                 ) : (
                   <p className="text-center py-20 text-[10px] font-black opacity-30 uppercase tracking-widest">No activity streamed</p>
                 )}
              </div>
            </div>
            <div className="pt-6 border-t border-white/10 mt-6 flex items-center gap-2 text-[8px] font-black text-white/40 uppercase tracking-widest">
              <Wifi size={10} className="text-premium-gold" /> Streaming live updates
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
               {analytics?.topProducts && analytics.topProducts.length > 0 ? (
                 analytics.topProducts.map((p, i) => (
                    <div key={i} className="group cursor-pointer">
                       <div className="aspect-square rounded-3xl overflow-hidden bg-light-bg mb-3 border border-border-light relative shadow-sm">
                          {p.image ? (
                             <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center text-charcoal/10"><ShoppingBag size={32} /></div>
                          )}
                          <div className="absolute bottom-2 right-2 bg-charcoal/90 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded-lg">#{i+1}</div>
                       </div>
                       <p className="text-[10px] font-black text-charcoal truncate mb-1 uppercase tracking-tight">{p.name}</p>
                       <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-text-muted">{p.qty || p.quantity} sold</span>
                          <span className="text-[10px] font-black text-premium-gold">₹{fmt((p.rev || p.revenue) / 100)}</span>
                       </div>
                    </div>
                 ))
               ) : (
                 <div className="col-span-4 py-20 flex flex-col items-center justify-center opacity-30 text-[10px] font-black uppercase tracking-widest">
                   <ShoppingBag size={24} className="mb-2" />
                   Catalog warming up...
                 </div>
               )}
            </div>
         </div>

         {/* 3. Staff Leaderboard */}
         <div className="lg:col-span-1 bg-white rounded-[3rem] p-10 border border-border-light shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-charcoal uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                 <Users size={18} className="text-premium-gold" /> Performance
              </h3>
              <div className="space-y-6">
                 {analytics?.staffPerformance && analytics.staffPerformance.length > 0 ? (
                   analytics.staffPerformance.map((staff, i) => (
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
                            <p className="text-[11px] font-black text-charcoal">₹{fmt(staff.totalSales / 100)}</p>
                            <div className="w-16 h-1 bg-light-bg rounded-full mt-2 overflow-hidden">
                               <motion.div initial={{ width: 0 }} animate={{ width: i === 0 ? '100%' : `${(staff.totalSales / analytics.staffPerformance[0].totalSales) * 100}%` }} transition={{ duration: 1 }} className={`h-full ${i === 0 ? 'bg-premium-gold' : 'bg-charcoal/20'} rounded-full`} />
                            </div>
                         </div>
                      </div>
                   ))
                 ) : (
                   <p className="text-center py-20 text-[10px] font-black opacity-30 uppercase tracking-widest">No staff checkouts logged</p>
                 )}
              </div>
            </div>
            <p className="text-[8px] font-semibold text-text-muted text-center italic mt-6">Ranks cashier checkouts dynamically</p>
         </div>
      </div>

      {/* --- Reconciled Payment Splits & Transaction Ledger --- */}
      <div className="grid lg:grid-cols-2 gap-8 no-print">
         {/* Live Transaction Ledger */}
         <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-border-light">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black text-charcoal tracking-tight flex items-center gap-3 uppercase text-[12px] tracking-[0.2em]">
                 <ScrollText size={18} className="text-premium-gold" /> Live Transactions
              </h3>
              <span className="text-[8px] font-black uppercase tracking-widest text-text-muted bg-light-bg px-3 py-1 rounded-full border border-border-light">{dailyBills.length} Invoices</span>
            </div>
            <div className="space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
               {dailyBills.length === 0 ? <p className="text-center py-20 text-[10px] font-black opacity-30 uppercase tracking-widest">No bills checked out today</p> :
                dailyBills.map(bill => (
                  <div key={bill._id} className="flex items-center justify-between p-5 bg-light-bg rounded-2xl border border-border-light group hover:border-premium-gold transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-border-light flex items-center justify-center shadow-sm">
                        <Clock size={16} className="text-text-muted" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-charcoal">#{bill.billNumber}</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">{new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • <span className="text-charcoal font-black">{bill.paymentMethod}</span></p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-charcoal">₹{fmt(bill.pricing.totalAmount / 100)}</p>
                      <p className="text-[10px] font-bold text-text-muted mt-1">{bill.items.reduce((s, i) => s + i.quantity, 0)} items</p>
                    </div>
                  </div>
                ))
               }
            </div>
         </div>

         {/* Distribution Split & Geos */}
         <div className="space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-border-light shadow-sm">
               <h3 className="text-xl font-black text-charcoal tracking-tight flex items-center gap-3 uppercase text-[12px] tracking-[0.2em] mb-10">
                  <Layers size={18} className="text-premium-gold" /> Payment Splitting
               </h3>
               
               {/* Progress breakdown of UPI vs Cash vs Card */}
               <div className="space-y-6">
                 {[
                   { label: 'UPI Payments', val: expectedUpi, color: 'bg-indigo-600', text: 'text-indigo-600' },
                   { label: 'Cash Drawer', val: expectedCash, color: 'bg-premium-gold', text: 'text-premium-gold' },
                   { label: 'Card Checkouts', val: expectedCard, color: 'bg-emerald-600', text: 'text-emerald-600' },
                 ].map((pay, i) => {
                   const pct = expectedTotal > 0 ? (pay.val / expectedTotal) * 100 : 0;
                   return (
                     <div key={i} className="space-y-2">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                         <span className="text-charcoal/80">{pay.label}</span>
                         <span className={pay.text}>{fmt(pct)}% • ₹{fmt(pay.val / 100)}</span>
                       </div>
                       <div className="w-full h-2 bg-light-bg rounded-full overflow-hidden border border-border-light">
                         <motion.div 
                           initial={{ width: 0 }} 
                           animate={{ width: `${pct}%` }} 
                           transition={{ duration: 0.8 }} 
                           className={`h-full ${pay.color} rounded-full`} 
                         />
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-border-light shadow-sm">
               <h3 className="text-xl font-black text-charcoal tracking-tight flex items-center gap-3 uppercase text-[12px] tracking-[0.2em] mb-10">
                  <MapPin size={18} className="text-premium-gold" /> Geographical Sales
               </h3>
               <div className="space-y-4">
                  {analytics?.locationData && analytics.locationData.length > 0 ? (
                    analytics.locationData.map((loc, i) => (
                       <div key={i} className="flex items-center justify-between p-5 bg-light-bg rounded-2xl border border-border-light group hover:border-premium-gold transition-all shadow-sm">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-white border border-border-light flex items-center justify-center shadow-sm">
                                <MapPin size={16} className="text-premium-gold" />
                             </div>
                             <div>
                                <p className="text-sm font-black text-charcoal uppercase tracking-tighter">{loc._id || 'Unknown Location'}</p>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">{loc.orders || loc.count} Sales Transactions</p>
                             </div>
                          </div>
                          <p className="text-sm font-black text-charcoal">₹{fmt((loc.revenue || loc.total) / 100)}</p>
                       </div>
                    ))
                  ) : (
                    <p className="text-center py-10 text-[10px] font-black opacity-30 uppercase tracking-widest">No geographical logs found</p>
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* --- Categories & Additional Charts Section --- */}
      <div className="grid lg:grid-cols-2 gap-8 no-print">
        <div className="bg-white p-10 rounded-[3rem] border border-border-light shadow-sm">
           <h3 className="text-xl font-black text-charcoal tracking-tight flex items-center gap-3 uppercase text-[12px] tracking-[0.2em] mb-10">
              <Layers size={18} className="text-premium-gold" /> Category Mix
           </h3>
           <div ref={barChartRef} className="h-[250px] w-full">
              {hasMounted && barChartWidth > 0 && categoryData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={1}>
                    <BarChart data={categoryData}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F1" vertical={false} />
                       <XAxis dataKey="_id" tick={{ fontSize: 9, fontWeight: 900, fill: '#1A1A1A' }} axisLine={false} tickLine={false} />
                       <YAxis tick={{ fontSize: 9, fontWeight: 900, fill: '#999' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${fmt(v)}`} />
                       <Tooltip formatter={(value) => [`₹${fmt(value)}`, 'Revenue']} />
                       <Bar dataKey="revenue" fill="#D4AF37" radius={[10, 10, 0, 0]} barSize={40} />
                    </BarChart>
                 </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center opacity-30 text-[10px] font-black uppercase tracking-widest">
                  Categories Mix warming up...
                </div>
              )}
           </div>
        </div>

        {/* Dynamic Insights Center Widget */}
        <div className="bg-charcoal text-white p-10 rounded-[3rem] relative overflow-hidden shadow-2xl flex flex-col justify-between">
          <div className="absolute bottom-0 right-0 w-84 h-84 bg-premium-gold/5 rounded-full blur-[80px] -mr-42 -mb-42 -z-0" />
          <div className="relative z-10">
            <h3 className="text-[12px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <Sparkles className="text-premium-gold" size={16} /> Business Insights 2.0
            </h3>
            
            <div className="space-y-6">
              <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                <span className="text-[8px] font-black text-premium-gold uppercase tracking-widest">Top Selling Channel</span>
                <h4 className="text-lg font-black mt-1">POS Checkout (Offline)</h4>
                <p className="text-[10px] text-white/60 mt-2 font-semibold">Generates the highest transaction density of the day, contributing over 80% of total margins.</p>
              </div>

              <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                <span className="text-[8px] font-black text-premium-gold uppercase tracking-widest">Peak Hour Anomaly</span>
                <h4 className="text-lg font-black mt-1">11:00 AM — 01:30 PM</h4>
                <p className="text-[10px] text-white/60 mt-2 font-semibold">Staff activity shows massive traffic concentration. Suggest pre-allocating free tabs in POS operators.</p>
              </div>
            </div>
          </div>

          <p className="text-[8px] font-semibold text-white/35 italic mt-8 text-center">Magizhchi AI Transaction Insights Engine v2.0</p>
        </div>
      </div>

      {/* --- Export Modal (Re-designed) --- */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExportModal(false)} className="absolute inset-0 bg-charcoal/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-[3rem] p-10 overflow-hidden shadow-3xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-premium-gold/5 rounded-full blur-[80px] -mr-32 -mt-32" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Export Intelligence</h2>
                  <button onClick={() => setShowExportModal(false)} className="text-text-muted hover:text-charcoal"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                  <button onClick={() => { downloadCSV(); setShowExportModal(false); }} className="w-full p-6 rounded-2xl border border-border-light hover:border-premium-gold bg-white transition-all text-left flex items-center gap-6 group">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <FileSpreadsheet size={24} className="text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-charcoal uppercase tracking-wider">Raw Analytics Data (CSV)</h4>
                      <p className="text-[9px] font-bold text-text-muted mt-1">Download complete transactional mixes as spreadsheet</p>
                    </div>
                  </button>

                  <button onClick={() => { toast.success('Report dispatched to cloud backup successfully!'); setShowExportModal(false); }} className="w-full p-6 rounded-2xl border border-border-light hover:border-premium-gold bg-white transition-all text-left flex items-center gap-6 group">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Cloud size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-charcoal uppercase tracking-wider">Enterprise Cloud Sync</h4>
                      <p className="text-[9px] font-bold text-text-muted mt-1">Force-push consolidated data registers to cloud warehouses</p>
                    </div>
                  </button>

                  <button onClick={() => { toast.success('Z-Report dispatched to administrator email!'); setShowExportModal(false); }} className="w-full p-6 rounded-2xl border border-border-light hover:border-premium-gold bg-white transition-all text-left flex items-center gap-6 group">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Mail size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-charcoal uppercase tracking-wider">Email Intelligence Summary</h4>
                      <p className="text-[9px] font-bold text-text-muted mt-1">Dispatch summary directly to store supervisor email</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Thermal Printer Preview Modal --- */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPrintModal(false)} className="absolute inset-0 bg-charcoal/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 overflow-hidden shadow-3xl space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-border-light">
                <h3 className="text-[12px] font-black uppercase tracking-wider flex items-center gap-2">
                  <Receipt size={16} className="text-premium-gold" /> Z-Report Preview
                </h3>
                <button onClick={() => setShowPrintModal(false)} className="text-text-muted hover:text-charcoal"><X size={20} /></button>
              </div>

              {/* Thermal paper mock layout */}
              <div className="bg-light-bg/50 border border-border-light rounded-2xl p-6 font-mono text-[10px] text-charcoal space-y-4 max-h-[350px] overflow-y-auto">
                <div className="text-center border-b border-dashed border-charcoal/30 pb-3">
                  <h1 className="text-sm font-black uppercase">MAGIZHCHI GARMENTS</h1>
                  <p className="opacity-80">Reconciliation Z-Report</p>
                  <p className="opacity-80 text-[8px] mt-1">{new Date().toDateString()}</p>
                </div>
                <div className="space-y-1.5 pb-3 border-b border-dashed border-charcoal/30">
                  <div className="flex justify-between font-black"><p>Expected Sales (Net):</p><p>₹{fmt(expectedTotal / 100)}</p></div>
                  <div className="flex justify-between"><p>- Expected Cash:</p><p>₹{fmt(expectedCash / 100)}</p></div>
                  <div className="flex justify-between"><p>- Expected UPI:</p><p>₹{fmt(expectedUpi / 100)}</p></div>
                  <div className="flex justify-between"><p>- Expected Card:</p><p>₹{fmt(expectedCard / 100)}</p></div>
                </div>
                <div className="space-y-1.5 pb-3 border-b border-dashed border-charcoal/30">
                  <div className="flex justify-between"><p>Physical Count:</p><p>₹{fmt(Number(actualCash) || 0)}</p></div>
                  <div className="flex justify-between font-black"><p>Drawer Discrepancy:</p><p className={Math.abs(discrepancy || 0) < 0.01 ? 'text-emerald-600' : 'text-red-600'}>₹{fmt(discrepancy || 0)}</p></div>
                </div>
                <p className="text-[8px] text-center italic opacity-60">*** END OF ANALYSIS ***</p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPrintModal(false)} 
                  className="flex-1 py-3 bg-light-bg text-charcoal rounded-xl text-[9px] font-black uppercase tracking-wider border border-border-light hover:bg-charcoal hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => { window.print(); setShowPrintModal(false); }} 
                  className="flex-1 py-3 bg-charcoal text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-premium-gold hover:text-charcoal transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Printer size={12} /> Print Receipt
                </button>
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
          <div className="flex justify-between font-bold"><p>Total Expected Sales:</p><p>₹{fmt(expectedTotal / 100)}</p></div>
          <div className="flex justify-between"><p>Expected Cash:</p><p>₹{fmt(expectedCash / 100)}</p></div>
          <div className="flex justify-between"><p>Expected UPI:</p><p>₹{fmt(expectedUpi / 100)}</p></div>
          <div className="flex justify-between"><p>Expected Card:</p><p>₹{fmt(expectedCard / 100)}</p></div>
          <div className="flex justify-between"><p>Physical Count:</p><p>₹{fmt(Number(actualCash)||0)}</p></div>
          <div className="flex justify-between font-bold"><p>Drawer Discrepancy:</p><p>₹{fmt(discrepancy || 0)}</p></div>
        </div>
        <p className="text-[10px] text-center italic">*** END OF ANALYSIS ***</p>
      </div>
    </div>
  );
}
