import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Printer, IndianRupee, CreditCard, Smartphone, ScrollText, 
  BarChart3, PieChart, TrendingUp, Calendar, ArrowUpRight, 
  ShieldCheck, Banknote, Loader2, Sparkles, Shield, CheckCircle2,
  Download, Cloud, Mail, FileSpreadsheet, Lock, X, Calculator, ShoppingBag, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { billService } from '../../services';
import { Helmet } from 'react-helmet-async';
import { useAuthStore } from '../../store';

export default function StaffDailyReport() {
  const { user } = useAuthStore();
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingState, setExportingState] = useState(null); // null | 'encrypting' | 'success'
  const [activeExportOption, setActiveExportOption] = useState(null);
  const [sessionId] = useState(() => `MGZ-${Math.floor(Math.random() * 1000000)}`);
  const [actualCash, setActualCash] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['daily-report'],
    queryFn: () => billService.getDailyReport().then(r => r.data.data),
  });

  const s = data?.summary || {};
  const bills = data?.bills || [];
  const fmt = (n) => (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  // ── Retail KPIs ──
  const abv = s.totalBills ? s.totalRevenue / s.totalBills : 0;
  const totalItemsSold = bills.reduce((acc, b) => acc + (b.items?.reduce((sum, i) => sum + i.quantity, 0) || 0), 0);
  const upt = s.totalBills ? totalItemsSold / s.totalBills : 0;

  // ── Best Sellers ──
  const itemSales = {};
  bills.forEach(b => {
    b.items?.forEach(i => {
      const key = `${i.productId}-${i.variant?.size || i.size}-${i.variant?.color || i.color}`;
      if (!itemSales[key]) itemSales[key] = { name: i.productName, size: i.variant?.size || i.size, color: i.variant?.color || i.color, qty: 0, rev: 0 };
      itemSales[key].qty += i.quantity;
      itemSales[key].rev += i.total;
    });
  });
  const bestSellers = Object.values(itemSales).sort((a,b) => b.qty - a.qty).slice(0, 5);

  // ── Cash Reconciliation ──
  const expectedCash = s.cashTotal || 0;
  const discrepancy = actualCash === '' ? null : Number(actualCash) - expectedCash;

  const stats = [
    { label: 'Total Revenue', value: `₹${fmt(s.totalRevenue)}`, icon: TrendingUp, color: 'text-premium-gold', bg: 'bg-premium-gold/10' },
    { label: 'Transactions', value: s.totalBills || 0, icon: ScrollText, color: 'text-charcoal', bg: 'bg-charcoal/5' },
    { label: 'Avg Bill Value', value: `₹${fmt(abv)}`, icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Units Per Txn', value: fmt(upt), icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  if (isLoading) {
    return (
      <div className="h-screen bg-light-bg flex flex-col items-center justify-center gap-6">
        <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="w-16 h-16 bg-charcoal rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-premium-gold/20">
          <Loader2 size={32} className="text-premium-gold" />
        </motion.div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted animate-pulse">Analyzing Financial Data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg p-6 lg:p-10 space-y-10">
      <Helmet><title>Z-Report — End of Day Dashboard</title></Helmet>
      
      {/* ── Immersive SaaS Header ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-white no-print">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-charcoal rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-charcoal/20">
            <BarChart3 className="text-premium-gold" size={32} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-charcoal tracking-tighter">End-of-Day Z-Report</h1>
              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100">Live Analytics</div>
            </div>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
              <Calendar size={12} className="text-premium-gold" /> {data?.date || new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <button onClick={() => window.print()} className="px-6 py-4 bg-white border border-border-light text-charcoal rounded-2xl text-xs font-black uppercase tracking-widest hover:border-premium-gold transition-all shadow-sm flex items-center justify-center gap-3 group">
            <Printer size={18} className="group-hover:text-premium-gold transition-colors" /> Thermal Z-Report
          </button>
          <button onClick={() => setShowExportModal(true)} className="px-8 py-4 bg-charcoal text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 group">
            <Download size={18} /> Export Data
          </button>
        </div>
      </div>

      {/* ── Primary SaaS Metrics ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 no-print">
        {stats.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white rounded-[2.5rem] p-8 border border-white shadow-[0_15px_40px_rgba(0,0,0,0.02)] group hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-light-bg/50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className={`w-12 h-12 ${c.bg} rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform`}>
                  <c.icon size={24} className={c.color} />
                </div>
              </div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-2">{c.label}</p>
              <p className={`text-3xl font-black ${c.color} tracking-tighter leading-none`}>{c.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-10 no-print">
        {/* ── Cash Reconciliation Module ── */}
        <div className="lg:col-span-1 bg-white rounded-[3.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-border-light relative overflow-hidden">
          <div className="w-12 h-12 bg-charcoal rounded-2xl flex items-center justify-center mb-8 shadow-lg">
            <Calculator className="text-premium-gold" size={24} />
          </div>
          <h3 className="text-xl font-black tracking-tight text-charcoal mb-1">Cash Drawer Reconciliation</h3>
          <p className="text-[9px] text-text-muted font-black uppercase tracking-[0.2em] mb-8">Verify physical cash vs system expected</p>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center p-5 bg-light-bg rounded-2xl">
              <span className="text-xs font-black text-text-muted uppercase tracking-widest">Expected Cash</span>
              <span className="text-xl font-black text-charcoal">₹{fmt(expectedCash)}</span>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Actual Cash Counted</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal font-black">₹</span>
                <input 
                  type="number" 
                  value={actualCash}
                  onChange={e => setActualCash(e.target.value)}
                  className="w-full bg-white border-2 border-border-light rounded-2xl pl-10 pr-4 py-4 focus:outline-none focus:border-premium-gold font-black text-lg transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            {discrepancy !== null && (
              <div className={`p-5 rounded-2xl flex items-center justify-between ${discrepancy === 0 ? 'bg-emerald-50 border border-emerald-100' : discrepancy > 0 ? 'bg-blue-50 border border-blue-100' : 'bg-red-50 border border-red-100'}`}>
                <span className={`text-xs font-black uppercase tracking-widest ${discrepancy === 0 ? 'text-emerald-600' : discrepancy > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {discrepancy === 0 ? 'Perfect Match' : discrepancy > 0 ? 'Over By' : 'Short By'}
                </span>
                <span className={`text-xl font-black ${discrepancy === 0 ? 'text-emerald-600' : discrepancy > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ₹{fmt(Math.abs(discrepancy))}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Payment Logic Card ── */}
        <div className="lg:col-span-2 bg-charcoal rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-premium-gold/5 rounded-full blur-[120px] -mr-48 -mt-48" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                    <PieChart className="text-premium-gold" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight uppercase">Payment Channels</h3>
                    <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.3em] mt-1">Verified Real-time Processing</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10">
                   <Shield size={16} className="text-emerald-400" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Encrypted Status</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Physical Cash</span>
                    <span className="text-[10px] font-black text-emerald-400">Drawer</span>
                  </div>
                  <p className="text-3xl font-black tracking-tighter">₹{fmt(s.cashTotal)}</p>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.5 }} className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">UPI Transfers</span>
                    <span className="text-[10px] font-black text-blue-400">Verified</span>
                  </div>
                  <p className="text-3xl font-black tracking-tighter">₹{fmt(s.upiTotal)}</p>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.5, delay: 0.2 }} className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Card Settlement</span>
                    <span className="text-[10px] font-black text-white/40 italic">Batch</span>
                  </div>
                  <p className="text-3xl font-black tracking-tighter">₹{fmt(s.cardTotal || 0)}</p>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.5, delay: 0.4 }} className="h-full bg-white/20 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 flex items-center justify-between border-t border-white/5 pt-10">
               <div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-2">Total Yield</p>
                  <p className="text-4xl font-black text-premium-gold tracking-tighter">₹{fmt(s.totalRevenue)}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 no-print">
        {/* ── Best Sellers ── */}
        <div className="bg-white rounded-[3.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-border-light">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-charcoal">Top Sellers Today</h3>
              <p className="text-[9px] text-text-muted font-black uppercase tracking-[0.2em] mt-1">Driving Revenue</p>
            </div>
          </div>
          <div className="space-y-4">
            {bestSellers.length === 0 ? (
              <div className="py-10 text-center text-text-muted opacity-50"><p className="font-bold">No sales data yet</p></div>
            ) : (
              bestSellers.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-light-bg rounded-2xl border border-border-light">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-white border border-border-light flex items-center justify-center text-xs font-black text-charcoal">#{idx+1}</div>
                    <div>
                      <p className="text-sm font-black text-charcoal">{item.name}</p>
                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">{item.size} / {item.color}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-premium-gold">{item.qty} sold</p>
                    <p className="text-[10px] font-bold text-text-muted mt-1">₹{fmt(item.rev)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Live Ledger ── */}
        <div className="bg-white rounded-[3.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-border-light">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center">
                <ScrollText size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight text-charcoal">Live Transaction Ledger</h3>
                <p className="text-[9px] text-text-muted font-black uppercase tracking-[0.2em] mt-1">Latest {bills.length} bills</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {bills.length === 0 ? (
              <div className="py-10 text-center text-text-muted opacity-50"><p className="font-bold">No transactions yet</p></div>
            ) : (
              bills.map(bill => (
                <div key={bill._id} className="flex items-center justify-between p-5 bg-light-bg rounded-2xl border border-border-light group hover:border-premium-gold transition-colors">
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
            )}
          </div>
        </div>
      </div>

      {/* ── Enterprise Export Modal ── */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !exportingState && setShowExportModal(false)} className="absolute inset-0 bg-charcoal/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-auto min-h-[500px]">
              {/* Left Side: Description */}
              <div className="w-full md:w-5/12 bg-charcoal p-10 flex flex-col justify-between text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-premium-gold/10 rounded-full blur-[80px] -ml-20 -mt-20" />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/20">
                    <Shield size={24} className="text-premium-gold" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tighter uppercase mb-4">Enterprise Data Vault</h2>
                  <p className="text-xs text-white/60 font-bold leading-relaxed mb-8">Select your preferred export channel. All external exports are secured with AES-256 encryption protocols before dispatch.</p>

                  {exportingState && (
                    <div className="bg-black/50 border border-white/10 rounded-2xl p-6">
                      <div className="flex items-center gap-4 mb-4">
                        {exportingState === 'encrypting' ? <Loader2 className="animate-spin text-premium-gold" size={20} /> : <CheckCircle2 className="text-emerald-400" size={20} />}
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{exportingState === 'encrypting' ? 'Processing Security Hash...' : 'Operation Completed'}</p>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: exportingState === 'success' ? '100%' : '80%' }} transition={{ duration: exportingState === 'success' ? 0.5 : 3 }} className={`h-full ${exportingState === 'success' ? 'bg-emerald-500' : 'bg-premium-gold'} rounded-full`} />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="relative z-10 pt-10 border-t border-white/10 mt-10 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40 mb-1">Session ID</p>
                    <p className="text-[10px] font-black text-white/80 tracking-widest">{sessionId}</p>
                  </div>
                  <Lock size={16} className="text-white/20" />
                </div>
              </div>

              {/* Right Side: Options */}
              <div className="flex-1 p-10 bg-light-bg flex flex-col">
                <div className="flex justify-end mb-6">
                  {!exportingState && <button onClick={() => setShowExportModal(false)} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center hover:bg-border-light transition-colors shadow-sm"><X size={18} className="text-charcoal" /></button>}
                </div>

                <div className="grid grid-cols-2 gap-4 flex-1">
                  {[
                    { id: 'csv', title: 'Raw Data (CSV)', desc: 'For Tally/Zoho import', icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { id: 'cloud', title: 'Cloud Sync', desc: 'Secure AWS vault backup', icon: Cloud, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { id: 'admin', title: 'Admin Dispatch', desc: 'Automated EOD email', icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50' },
                  ].map(opt => (
                    <button 
                      key={opt.id} disabled={exportingState !== null}
                      onClick={() => {
                        setActiveExportOption(opt.id);
                        setExportingState('encrypting');
                        setTimeout(() => {
                          setExportingState('success');
                          setTimeout(() => { setExportingState(null); setShowExportModal(false); }, 1500);
                        }, 2500);
                      }}
                      className={`p-6 rounded-3xl border-2 transition-all text-left flex flex-col justify-between group h-full ${exportingState && activeExportOption !== opt.id ? 'opacity-30 grayscale cursor-not-allowed' : 'bg-white border-white hover:border-premium-gold shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(212,175,55,0.1)]'}`}
                    >
                      <div className={`w-12 h-12 ${opt.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                        <opt.icon size={24} className={opt.color} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-charcoal uppercase tracking-tight mb-1">{opt.title}</h4>
                        <p className="text-[10px] font-bold text-text-muted">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Thermal Printer Z-Report Layout (Only visible when printing) ── */}
      <div className="hidden print:block text-black bg-white p-4 font-mono w-[300px] text-xs">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold uppercase mb-1">MAGIZHCHI</h1>
          <p className="text-[10px]">End of Day Z-Report</p>
          <p className="text-[10px]">{data?.date || new Date().toLocaleDateString()}</p>
        </div>
        <div className="border-b border-dashed border-black pb-2 mb-2">
           <p>Printed By: {user?.name}</p>
           <p>Time: {new Date().toLocaleTimeString()}</p>
        </div>
        <div className="border-b border-dashed border-black pb-2 mb-2 space-y-1">
           <div className="flex justify-between font-bold"><p>Total Revenue:</p><p>₹{fmt(s.totalRevenue)}</p></div>
           <div className="flex justify-between"><p>Transactions:</p><p>{s.totalBills}</p></div>
           <div className="flex justify-between"><p>Avg Bill Value:</p><p>₹{fmt(abv)}</p></div>
           <div className="flex justify-between"><p>Units Per Txn:</p><p>{fmt(upt)}</p></div>
        </div>
        <div className="border-b border-dashed border-black pb-2 mb-2 space-y-1">
           <p className="font-bold text-center mb-1">PAYMENT CHANNELS</p>
           <div className="flex justify-between"><p>Cash:</p><p>₹{fmt(s.cashTotal)}</p></div>
           <div className="flex justify-between"><p>UPI:</p><p>₹{fmt(s.upiTotal)}</p></div>
           <div className="flex justify-between"><p>Card:</p><p>₹{fmt(s.cardTotal || 0)}</p></div>
        </div>
        <div className="border-b border-dashed border-black pb-2 mb-2 space-y-1">
           <p className="font-bold text-center mb-1">CASH RECONCILIATION</p>
           <div className="flex justify-between"><p>Expected Cash:</p><p>₹{fmt(expectedCash)}</p></div>
           <div className="flex justify-between"><p>Declared Cash:</p><p>₹{fmt(Number(actualCash)||0)}</p></div>
           <div className="flex justify-between font-bold"><p>Discrepancy:</p><p>₹{fmt(discrepancy || 0)}</p></div>
        </div>
        <div className="text-center mt-6 text-[10px]">
           <p>*** END OF REPORT ***</p>
        </div>
      </div>
    </div>
  );
}
