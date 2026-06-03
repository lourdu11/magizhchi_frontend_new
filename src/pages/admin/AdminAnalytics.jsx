import { useState, useEffect, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';

const AnalyticsAreaChart = lazy(() => import('./charts/AnalyticsCharts').then(m => ({ default: m.AnalyticsAreaChart })));
const AnalyticsBarChart = lazy(() => import('./charts/AnalyticsCharts').then(m => ({ default: m.AnalyticsBarChart })));
import {
  TrendingUp, ShoppingBag, Users, Package, Download,
  RefreshCw, ArrowUpRight, ArrowDownRight, Star, AlertTriangle,
  Layers, MapPin, CreditCard, Zap, Trophy, Wifi
} from 'lucide-react';
import { adminService, billService } from '../../services';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtN = (n) => Number(n || 0).toLocaleString('en-IN');
const COLORS = ['#D4AF37', '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const MEDALS = ['🥇', '🥈', '🥉'];

function SectionCard({ title, icon: Icon, sub, children, className = '' }) {
  return (
    <div className={`bg-white rounded-[2.5rem] border border-border-light p-4 md:p-8 shadow-sm ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-premium-gold/10 flex items-center justify-center">
          <Icon size={18} className="text-premium-gold" />
        </div>
        <div>
          <h2 className="text-sm font-black text-charcoal uppercase tracking-wider">{title}</h2>
          {sub && <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-0.5">{sub}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function SummaryBadge({ label, value, trend, color }) {
  const isPos = trend >= 0;
  return (
    <div className="bg-white rounded-2xl border border-border-light p-5 shadow-sm">
      <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">{label}</p>
      <p className="text-xl font-black text-charcoal tracking-tighter">{value}</p>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-[9px] font-black ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
          {isPos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {isPos ? '+' : ''}{trend}% vs prev period
        </div>
      )}
      {color && <div className="mt-3 h-0.5 rounded-full w-1/2" style={{ background: color }} />}
    </div>
  );
}

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('daily');
  const [ready, setReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: a = {}, isLoading, refetch } = useQuery({
    queryKey: ['analytics-full', period],
    queryFn: () => adminService.getSalesAnalytics({ period }).then(r => r.data.data),
    refetchInterval: 30000,
  });

  const { data: daily = {} } = useQuery({
    queryKey: ['daily-z'],
    queryFn: () => billService.getDailyReport().then(r => r.data.data),
    refetchInterval: 30000,
  });

  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(t);
  }, [period, isLoading]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    toast.success('Data synced!', { icon: '⚡' });
  };

  const salesData = a?.data || [];
  const catData = a?.categoryData || [];
  const payData = a?.paymentData || [];
  const regionData = a?.regionData || [];
  const staffData = a?.staffPerformance || [];
  const topProducts = a?.topProducts || [];
  const deadStock = a?.deadStock || [];
  const lowMargin = a?.lowMargin || [];
  const stockAging = a?.stockAging || [];
  const summary = a?.summary || {};

  const downloadCSV = () => {
    if (!salesData.length) return toast.error('No data to export');
    const rows = salesData.map(r => `${r._id},${r.revenue || 0},${r.orders || 0}`);
    const csv = ['Date,Revenue,Orders', ...rows].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = `analytics_${period}_${Date.now()}.csv`;
    a.click();
    toast.success('CSV downloaded!');
  };

  return (
    <div className="space-y-8 pb-20">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-border-light p-4 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-charcoal rounded-2xl flex items-center justify-center">
                <TrendingUp size={20} className="text-premium-gold" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Intelligence Hub</h1>
                <p className="text-[9px] text-text-muted font-bold uppercase tracking-[0.3em] mt-0.5">Real-time business analytics</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-100">
              <Wifi size={10} className="animate-pulse" /> Live
            </div>
            {/* Period Switcher */}
            <div className="bg-light-bg p-1.5 rounded-2xl flex gap-1 border border-border-light">
              {[
                { id: 'daily', label: '30 Days' },
                { id: 'monthly', label: 'This Year' },
                { id: 'yearly', label: 'All Time' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${period === p.id ? 'bg-charcoal text-white shadow-lg' : 'text-text-muted hover:text-charcoal'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={handleRefresh} disabled={refreshing} className="p-3 bg-light-bg border border-border-light rounded-2xl text-charcoal hover:border-premium-gold transition-all">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button onClick={downloadCSV} className="px-5 py-3 bg-premium-gold text-charcoal rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-border-light">
          <SummaryBadge label="Total Revenue" value={fmt(summary.totalRevenue)} trend={summary.growth} color="#D4AF37" />
          <SummaryBadge label="Total Orders" value={fmtN(summary.totalOrders)} color="#4F46E5" />
          <SummaryBadge label="Avg Order Value" value={fmt(summary.totalOrders > 0 ? summary.totalRevenue / summary.totalOrders : 0)} color="#10B981" />
          <SummaryBadge label="Growth vs Prev" value={`${summary.growth > 0 ? '+' : ''}${summary.growth || 0}%`} trend={summary.growth} color="#F59E0B" />
        </div>
      </div>

      {/* ── REVENUE TREND CHART ─────────────────────────────────── */}
      <SectionCard icon={TrendingUp} title="Revenue Trend" sub={period === 'daily' ? 'Last 30 days' : period === 'monthly' ? 'This year by month' : 'All time by year'}>
        {isLoading ? (
          <div className="h-[300px] bg-light-bg rounded-2xl animate-pulse" />
        ) : salesData.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <TrendingUp size={48} className="text-border-light mb-4" />
            <p className="text-[11px] font-black text-text-muted uppercase tracking-wider">No sales data for this period</p>
            <p className="text-[9px] text-text-muted mt-1">Record sales to see trends appear here</p>
          </div>
        ) : ready && (
          <Suspense fallback={<div className="h-[300px] bg-light-bg rounded-2xl animate-pulse" />}>
            <AnalyticsAreaChart data={salesData} />
          </Suspense>
        )}
      </SectionCard>

      {/* ── THREE COLUMNS: CATEGORIES, PAYMENTS, REGIONS ───────── */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Category Mix */}
        <SectionCard icon={Layers} title="Category Mix" sub="Revenue by category">
          {catData.length === 0 ? (
            <div className="text-center py-4 md:py-8 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">No category data</div>
          ) : (
            <div className="space-y-4">
              {catData.slice(0, 6).map((cat, i) => {
                const total = catData.reduce((s, c) => s + (c.revenue || 0), 0);
                const pct = total > 0 ? ((cat.revenue || 0) / total) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] font-black mb-1.5">
                      <span className="text-charcoal uppercase truncate pr-2">{cat._id || 'Uncategorized'}</span>
                      <span className="text-text-muted shrink-0">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-light-bg rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: i * 0.08 }}
                        className="h-full rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                    </div>
                    <p className="text-[9px] text-text-muted mt-1">{fmt(cat.revenue)} · {fmtN(cat.count)} units</p>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Payment Methods */}
        <SectionCard icon={CreditCard} title="Payment Methods" sub="How customers pay">
          {payData.length === 0 ? (
            <div className="text-center py-4 md:py-8 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">No payment data</div>
          ) : ready && (
            <Suspense fallback={<div className="h-[220px] bg-light-bg rounded-2xl animate-pulse" />}>
              <AnalyticsBarChart data={payData} />
            </Suspense>
          )}
        </SectionCard>

        {/* Regional Sales */}
        <SectionCard icon={MapPin} title="Regional Sales" sub="Orders by state">
          {regionData.length === 0 ? (
            <div className="text-center py-4 md:py-8 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">No regional data</div>
          ) : (
            <div className="space-y-3">
              {regionData.slice(0, 6).map((r, i) => {
                const total = regionData.reduce((s, x) => s + (x.revenue || 0), 0);
                const pct = total > 0 ? ((r.revenue || 0) / total) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-light-bg/50 rounded-2xl border border-border-light/50">
                    <div className="w-6 h-6 rounded-lg bg-premium-gold/10 flex items-center justify-center text-[9px] font-black text-premium-gold shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-charcoal uppercase truncate">{r._id || 'Unknown'}</p>
                      <p className="text-[9px] text-text-muted">{fmtN(r.orders)} orders · {pct.toFixed(0)}%</p>
                    </div>
                    <p className="text-[10px] font-black text-charcoal shrink-0">{fmt(r.revenue)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── STAFF LEADERBOARD ──────────────────────────────────── */}
      <SectionCard icon={Trophy} title="Staff Leaderboard" sub="POS billing performance">
        {staffData.length === 0 ? (
          <div className="text-center py-10 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">No staff billing data logged yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border-light">
                  {['Rank', 'Staff Member', 'Total Billed', 'Transactions', 'Avg Per Bill'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light/50">
                {staffData.map((s, i) => (
                  <tr key={i} className={`group hover:bg-light-bg/50 transition-colors ${i === 0 ? 'bg-premium-gold/5' : ''}`}>
                    <td className="px-4 py-4">
                      <span className="text-xl">{MEDALS[i] || `#${i + 1}`}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center flex-wrap gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white ${i === 0 ? 'bg-premium-gold' : 'bg-charcoal'}`}>
                          {(s.name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] font-black text-charcoal uppercase">{s.name || 'Staff'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[12px] font-black text-charcoal">{fmt(s.totalSales)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[11px] font-bold text-text-muted">{fmtN(s.txns)} bills</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[11px] font-black text-charcoal">{fmt(s.txns > 0 ? s.totalSales / s.txns : 0)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── TOP SELLERS + DEAD STOCK ────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Top Sellers */}
        <SectionCard icon={Star} title="Top Selling Products" sub="Best performers this period">
          {topProducts.length === 0 ? (
            <div className="text-center py-10 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">No product sales data yet</div>
          ) : (
            <div className="space-y-3">
              {topProducts.slice(0, 6).map((p, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-light-bg/50 rounded-2xl border border-border-light group hover:border-premium-gold/40 transition-all">
                  <div className={`w-9 h-9 rounded-xl shrink-0 overflow-hidden bg-light-bg border border-border-light`}>
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-text-muted">{i + 1}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-charcoal truncate uppercase">{p.name}</p>
                    <p className="text-[9px] text-text-muted mt-0.5">{fmtN(p.qty || p.quantity)} units sold</p>
                  </div>
                  <p className="text-[11px] font-black text-premium-gold shrink-0">{fmt(p.rev || p.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Dead Stock Alert */}
        <SectionCard icon={AlertTriangle} title="Dead Stock Alert" sub="0 sales in 30+ days — capital locked">
          {deadStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Zap size={36} className="text-emerald-400 mb-3" />
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">No Dead Stock!</p>
              <p className="text-[9px] text-text-muted mt-1">All products have recent sales activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deadStock.slice(0, 6).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-amber-50/50 rounded-2xl border border-amber-100 group hover:border-amber-300 transition-all">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-[11px] font-black text-charcoal truncate">{item.productName || item.name || 'Unknown'}</p>
                    <p className="text-[9px] text-text-muted font-bold mt-0.5 uppercase">{item.size} · {item.color}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-black text-amber-700">{fmtN(item.totalStock || 0)} units</p>
                    <p className="text-[9px] text-amber-600 font-bold">~{Math.round(item.ageDays || 0)} days old</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── ERP RISK PANEL ─────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Stock Aging */}
        <SectionCard icon={Package} title="Stock Aging Buckets" sub="Inventory by age — lock capital risk">
          {stockAging.length === 0 ? (
            <div className="text-center py-4 md:py-8 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">No aging data</div>
          ) : (
            <div className="space-y-4">
              {stockAging.map((bucket, i) => {
                const total = stockAging.reduce((s, b) => s + (b.count || 0), 0);
                const pct = total > 0 ? ((bucket.count || 0) / total) * 100 : 0;
                const colors = ['#10B981', '#F59E0B', '#EF4444'];
                return (
                  <div key={i} className="p-5 rounded-2xl border border-border-light bg-light-bg/50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] font-black text-charcoal uppercase">{bucket._id}</span>
                      <span className="text-[9px] font-black text-text-muted">{fmtN(bucket.count)} SKUs · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden border border-border-light">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.15 }}
                        className="h-full rounded-full"
                        style={{ background: colors[i] || '#D4AF37' }}
                      />
                    </div>
                    <p className="text-[9px] text-text-muted mt-2 font-bold">Capital locked: {fmt(bucket.value)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Low Margin Products */}
        <SectionCard icon={AlertTriangle} title="Low Margin Products" sub="Below 20% profit margin — needs pricing review">
          {lowMargin.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Trophy size={36} className="text-emerald-400 mb-3" />
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">All Margins Healthy!</p>
              <p className="text-[9px] text-text-muted mt-1">No products below 20% margin</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {lowMargin.map((item, i) => {
                const margin = item.margin ? (item.margin * 100).toFixed(1) : '0.0';
                return (
                  <div key={i} className="flex items-center justify-between p-4 bg-red-50/40 rounded-2xl border border-red-100 group hover:border-red-300 transition-all">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-[11px] font-black text-charcoal truncate">{item.productName || item.name || 'Unknown'}</p>
                      <p className="text-[9px] text-text-muted font-bold mt-0.5 uppercase">{item.size} · {item.color}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-black text-red-600">{margin}% margin</p>
                      <p className="text-[9px] text-text-muted font-bold">₹{item.sellingPrice} sell price</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

    </div>
  );
}
