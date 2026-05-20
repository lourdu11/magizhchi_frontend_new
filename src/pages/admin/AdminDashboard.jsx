import { useState, useEffect, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';

const DashboardRevenueChart = lazy(() => import('./charts/DashboardRevenueChart'));
import {
  TrendingUp, ShoppingBag, Users, Package, AlertTriangle,
  IndianRupee, ArrowUpRight, ArrowDownRight, CreditCard,
  Clock, Plus, LayoutGrid, Sparkles, Truck, ShoppingCart,
  AlertCircle, CheckCircle2, RefreshCw, Store, Globe, Zap
} from 'lucide-react';
import { adminService } from '../../services';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtNum = (n) => Number(n || 0).toLocaleString('en-IN');

// ── Live Clock ──────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-right">
      <p className="text-2xl font-black text-charcoal tracking-tighter tabular-nums">
        {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">
        {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
    </div>
  );
}

// ── KPI Card ────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, trend, trendVal, color, bgColor, delay = 0 }) {
  const isUp = trend === 'up';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-3xl border border-border-light p-6 shadow-sm hover:shadow-lg hover:border-premium-gold/40 transition-all group relative overflow-hidden"
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity" style={{ background: bgColor }} />
      <div className="flex items-start justify-between mb-5">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: bgColor + '20' }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {trendVal}
          </div>
        )}
      </div>
      <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-2xl font-black text-charcoal tracking-tighter">{value}</p>
      {sub && <p className="text-[9px] text-text-muted font-bold mt-2 uppercase tracking-widest">{sub}</p>}
    </motion.div>
  );
}

// ── Section Header ───────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, sub, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-premium-gold/10 flex items-center justify-center">
          <Icon size={18} className="text-premium-gold" />
        </div>
        <div>
          <h2 className="text-sm font-black text-charcoal uppercase tracking-wider">{title}</h2>
          {sub && <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-0.5">{sub}</p>}
        </div>
      </div>
      {action && (
        <button onClick={onAction} className="text-[9px] font-black text-premium-gold uppercase tracking-widest hover:underline">
          {action}
        </button>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [chartReady, setChartReady] = useState(false);

  const { data: d = {}, isLoading: loadD, refetch: refetchD } = useQuery({
    queryKey: ['dashboard-v3'],
    queryFn: () => adminService.getDashboard().then(r => r.data.data),
    refetchInterval: 30000,
  });

  const { data: a = {}, isLoading: loadA } = useQuery({
    queryKey: ['analytics-v3-daily'],
    queryFn: () => adminService.getSalesAnalytics({ period: 'daily' }).then(r => r.data.data),
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!loadD && !loadA) {
      const t = setTimeout(() => setChartReady(true), 300);
      return () => clearTimeout(t);
    }
  }, [loadD, loadA]);

  const salesTrend = a?.data || [];
  const totalRevMonth = a?.summary?.totalRevenue || 0;
  const growth = a?.summary?.growth || 0;
  const categoryData = a?.categoryData || [];
  const paymentData = a?.paymentData || [];
  const transactions = d?.recentTransactions || [];
  const lowStock = d?.lowStockProducts || [];

  if (loadD && !d?.revenue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-3xl bg-premium-gold/10 flex items-center justify-center animate-pulse">
          <Zap size={32} className="text-premium-gold" />
        </div>
        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Loading Business Pulse...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">

      {/* ── HERO HEADER ─────────────────────────────────────────── */}
      <div className="bg-charcoal rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-charcoal to-black" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-premium-gold/5 blur-[80px] -mr-48 -mt-48" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">Live — All Systems Operational</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter leading-none uppercase">Business Pulse</h1>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em] mt-2">Magizhchi ERP — Command Center</p>
          </div>
          <div className="flex items-center gap-6">
            <LiveClock />
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/admin/catalog')}
                className="px-5 py-3 bg-white/10 text-white border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <LayoutGrid size={14} /> Catalog
              </button>
              <button
                onClick={() => navigate('/admin/create-bill')}
                className="px-5 py-3 bg-premium-gold text-charcoal rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> New Bill
              </button>
              <button
                onClick={() => refetchD()}
                className="p-3 bg-white/10 text-white border border-white/10 rounded-2xl hover:bg-white/20 transition-all"
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Today Revenue Hero Number */}
        <div className="relative z-10 mt-8 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Today's Revenue", value: fmt(d?.revenue?.today), icon: IndianRupee, color: '#D4AF37', good: (d?.revenue?.today || 0) >= 0 },
            { label: "Today's Profit", value: fmt(d?.revenue?.todayProfit), icon: TrendingUp, color: '#10B981', good: (d?.revenue?.todayProfit || 0) >= 0 },
            { label: 'Pending Orders', value: fmtNum(d?.orders?.pending), icon: Clock, color: '#F59E0B', good: true },
            { label: 'Total Customers', value: fmtNum(d?.users), icon: Users, color: '#818CF8', good: true },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: item.color + 'aa' }}>{item.label}</p>
              <p className="text-2xl md:text-3xl font-black text-white tracking-tighter">{item.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── KPI GRID ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard icon={IndianRupee} label="This Month" value={fmt(d?.revenue?.month)} sub="Month-to-date" trend="up" trendVal={growth > 0 ? `+${growth}%` : `${growth}%`} color="#D4AF37" bgColor="#D4AF37" delay={0} />
        <KpiCard icon={Truck} label="Delivered" value={fmtNum(d?.orders?.delivered)} sub="Completed orders" color="#10B981" bgColor="#10B981" delay={0.05} />
        <KpiCard icon={ShoppingCart} label="Pending" value={fmtNum(d?.orders?.pending)} sub="Awaiting dispatch" color="#F59E0B" bgColor="#F59E0B" delay={0.1} />
        <KpiCard icon={AlertTriangle} label="Payables Due" value={fmt(d?.erp?.totalPayables)} sub="Supplier balance" trend="down" trendVal="Owed" color="#EF4444" bgColor="#EF4444" delay={0.15} />
        <KpiCard icon={CreditCard} label="Settled" value={fmt(d?.erp?.settledValue)} sub="Paid to suppliers" color="#6366F1" bgColor="#6366F1" delay={0.2} />
        <KpiCard icon={Package} label="Partners" value={fmtNum(d?.erp?.activePartners)} sub="Active suppliers" color="#8B5CF6" bgColor="#8B5CF6" delay={0.25} />
      </div>

      {/* ── REVENUE CHART + LOW STOCK ───────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-border-light p-8 shadow-sm">
          <SectionHeader icon={TrendingUp} title="30-Day Revenue Trend" sub="Combined online orders + POS bills" />
          {chartReady && salesTrend.length > 0 ? (
            <Suspense fallback={<div className="h-[280px] w-full bg-light-bg/50 rounded-2xl animate-pulse" />}>
              <DashboardRevenueChart data={salesTrend} />
            </Suspense>
          ) : (
            <div className="h-[280px] flex items-center justify-center">
              {salesTrend.length === 0 && !loadA ? (
                <div className="text-center">
                  <TrendingUp size={40} className="text-border-light mx-auto mb-3" />
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">No sales data yet</p>
                  <p className="text-[9px] text-text-muted mt-1">Make your first sale to see trends here</p>
                </div>
              ) : (
                <div className="w-full h-full bg-light-bg/50 rounded-2xl animate-pulse" />
              )}
            </div>
          )}
        </div>

        {/* Low Stock Panel */}
        <div className="bg-white rounded-[2.5rem] border border-red-100 p-8 shadow-sm">
          <SectionHeader
            icon={AlertCircle}
            title="Low Stock Alert"
            sub={`${lowStock.length} items critical`}
            action="Restock"
            onAction={() => navigate('/admin/catalog')}
          />
          {lowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <CheckCircle2 size={36} className="text-emerald-400 mb-3" />
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">All Stock Healthy</p>
              <p className="text-[9px] text-text-muted mt-1">No items below threshold</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {lowStock.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100/80 group hover:border-red-300 transition-all">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-[11px] font-black text-charcoal truncate">{item.productName || item.name}</p>
                    <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-0.5">{item.size} · {item.color}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black text-red-600">{item.availableStock ?? item.totalStock ?? 0}</p>
                    <p className="text-[8px] text-red-400 font-bold uppercase">left</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── LIVE TRANSACTION FEED ──────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-border-light p-8 shadow-sm">
        <SectionHeader
          icon={Sparkles}
          title="Live Transaction Feed"
          sub="Real-time combined orders & POS bills"
          action="View All Orders"
          onAction={() => navigate('/admin/orders')}
        />
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag size={40} className="text-border-light mb-3" />
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">No transactions yet today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-light">
                  {['Type', 'Customer', 'ID', 'Amount', 'Status', 'Time'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light/50">
                {transactions.map((tx, i) => (
                  <motion.tr
                    key={tx._id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group hover:bg-light-bg/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${tx.type === 'ONLINE' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-700'}`}>
                        {tx.type === 'ONLINE' ? <Globe size={9} /> : <Store size={9} />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white ${tx.type === 'ONLINE' ? 'bg-blue-500' : 'bg-amber-500'}`}>
                          {(tx.name || 'G').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] font-black text-charcoal">{tx.name || 'Guest'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[11px] font-black text-charcoal font-mono">#{tx.id || tx.orderNumber || tx.billNumber}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[11px] font-black text-charcoal">{fmt(tx.total || tx.pricing?.totalAmount)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${(tx.orderStatus === 'delivered' || tx.orderStatus === 'completed') ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">{tx.orderStatus || tx.status || 'completed'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[9px] font-bold text-text-muted">
                        {new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── PAYMENT SPLIT + ERP SNAPSHOT ──────────────────────── */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Payment Methods */}
        <div className="bg-white rounded-[2.5rem] border border-border-light p-8 shadow-sm">
          <SectionHeader icon={CreditCard} title="Payment Split" sub="How customers pay" />
          {paymentData.length === 0 ? (
            <div className="text-center py-10 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-50">No payment data</div>
          ) : (
            <div className="space-y-5">
              {paymentData.slice(0, 5).map((pay, i) => {
                const total = paymentData.reduce((s, p) => s + (p.revenue || 0), 0);
                const pct = total > 0 ? ((pay.revenue || 0) / total) * 100 : 0;
                const colors = ['#D4AF37', '#4F46E5', '#10B981', '#F59E0B', '#EF4444'];
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: colors[i] }} />
                        <span className="text-[10px] font-black text-charcoal uppercase tracking-wider">{pay._id || 'Unknown'}</span>
                      </div>
                      <span className="text-[10px] font-black text-text-muted">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-light-bg rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: colors[i] }}
                      />
                    </div>
                    <p className="text-[9px] text-text-muted font-bold text-right">{fmt(pay.revenue)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ERP Snapshot */}
        <div className="bg-charcoal rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-premium-gold/5 blur-[60px] -mr-24 -mt-24" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-xl bg-premium-gold/20 flex items-center justify-center">
                <Package size={18} className="text-premium-gold" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">ERP Snapshot</h2>
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Supplier & procurement</p>
              </div>
            </div>
            {[
              { label: 'Procurement Volume', val: fmt(d?.erp?.procurementVolume), color: 'text-white' },
              { label: 'Total Settled', val: fmt(d?.erp?.settledValue), color: 'text-emerald-400' },
              { label: 'Payables Due', val: fmt(d?.erp?.totalPayables), color: 'text-red-400' },
              { label: "Today's Wastage", val: fmt(d?.erp?.todayWastage), color: 'text-amber-400' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-white/10 last:border-0">
                <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">{item.label}</span>
                <span className={`text-sm font-black ${item.color}`}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-[2.5rem] border border-border-light p-8 shadow-sm">
          <SectionHeader icon={ShoppingBag} title="Top Categories" sub="By revenue this period" />
          {categoryData.length === 0 ? (
            <div className="text-center py-10 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-50">No category data</div>
          ) : (
            <div className="space-y-4">
              {categoryData.slice(0, 5).map((cat, i) => {
                const total = categoryData.reduce((s, c) => s + (c.revenue || 0), 0);
                const pct = total > 0 ? ((cat.revenue || 0) / total) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-8 h-8 shrink-0 rounded-xl bg-premium-gold/10 flex items-center justify-center text-[10px] font-black text-premium-gold">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[10px] font-black text-charcoal truncate uppercase">{cat._id || 'Uncategorized'}</span>
                        <span className="text-[9px] font-bold text-text-muted shrink-0 ml-2">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-light-bg rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, delay: i * 0.1 }}
                          className="h-full bg-premium-gold rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
