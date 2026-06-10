import { useState, useEffect, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';

const AnalyticsAreaChart = lazy(() => import('./charts/AnalyticsCharts').then(m => ({ default: m.AnalyticsAreaChart })));
const AnalyticsBarChart = lazy(() => import('./charts/AnalyticsCharts').then(m => ({ default: m.AnalyticsBarChart })));
import {
  TrendingUp, ShoppingBag, Users, Package, Download,
  RefreshCw, ArrowUpRight, ArrowDownRight, Star, AlertTriangle,
  Layers, MapPin, CreditCard, Zap, Trophy, Wifi, IndianRupee, Store, Globe, PieChart, Activity
} from 'lucide-react';
import { adminService, billService } from '../../services';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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

function SummaryBadge({ label, value, trend, color, sub }) {
  const isPos = trend >= 0;
  return (
    <div className="bg-white rounded-2xl border border-border-light p-5 shadow-sm">
      <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">{label}</p>
      <p className="text-xl font-black text-charcoal tracking-tighter">{value}</p>
      {sub && <p className="text-[10px] font-bold text-text-muted mt-1">{sub}</p>}
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
  const [activeTab, setActiveTab] = useState('sales');
  const [ready, setReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: a = {}, isLoading, refetch } = useQuery({
    queryKey: ['analytics-full', period],
    queryFn: () => adminService.getSalesAnalytics({ period }).then(r => r.data.data),
    refetchInterval: 30000,
  });

  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(t);
  }, [period, activeTab, isLoading]);

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
  
  // New Analytics Fields
  const channelSplit = a?.channelSplit || { online: { revenue: 0, orders: 0 }, offline: { revenue: 0, orders: 0 } };
  const profit = a?.profit || { totalRevenue: 0, totalCost: 0, grossProfit: 0 };
  const customers = a?.customers || { totalUniqueInPeriod: 0, repeatCustomers: 0 };
  
  const erp = a?.erp || {};
  const deadStock = erp?.deadStock || [];
  const lowMargin = erp?.lowMarginItems || [];
  const stockAging = erp?.stockAging || [];
  const summary = a?.summary || {};

  const profitMarginPct = profit.totalRevenue > 0 ? ((profit.grossProfit / profit.totalRevenue) * 100).toFixed(1) : 0;
  const customerRetentionPct = customers.totalUniqueInPeriod > 0 ? ((customers.repeatCustomers / customers.totalUniqueInPeriod) * 100).toFixed(1) : 0;

  const exportToExcel = async () => {
    if (!a || !a.summary) return toast.error('No data to export');
    
    toast.loading('Generating Report...', { id: 'export' });
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Magizhchi Admin';
    wb.created = new Date();

    const styleHeader = (worksheet) => {
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    };

    // 1. Summary Sheet
    const wsSummary = wb.addWorksheet('Overview');
    wsSummary.columns = [
      { header: 'Metric', key: 'metric', width: 35 },
      { header: 'Value', key: 'value', width: 25 }
    ];
    styleHeader(wsSummary);
    wsSummary.addRows([
      { metric: 'Period', value: period },
      { metric: 'Total Income', value: summary.totalRevenue },
      { metric: 'Total Bills', value: summary.totalOrders },
      { metric: 'Avg Bill Value', value: summary.totalOrders > 0 ? summary.totalRevenue / summary.totalOrders : 0 },
      { metric: 'Growth vs Prev Period (%)', value: summary.growth || 0 },
      { metric: 'Net Profit', value: profit.grossProfit },
      { metric: 'Total Purchase Cost', value: profit.totalCost },
      { metric: 'Online Web Income', value: channelSplit.online.revenue },
      { metric: 'Shop POS Income', value: channelSplit.offline.revenue },
      { metric: 'Total Customers', value: customers.totalUniqueInPeriod || 0 },
      { metric: 'Returning Customers', value: customers.repeatCustomers || 0 },
      { metric: 'First Time Buyers', value: (customers.totalUniqueInPeriod || 0) - (customers.repeatCustomers || 0) },
    ]);
    wsSummary.getColumn(2).eachCell((cell, rowNum) => {
      if (rowNum > 2 && rowNum !== 5 && rowNum < 11) {
        cell.numFmt = '"₹"#,##0.00';
        cell.alignment = { horizontal: 'right' };
      }
    });

    // 2. Sales Trend (Income Graph)
    if (salesData.length) {
      const wsSales = wb.addWorksheet('Income Graph');
      wsSales.columns = [
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Income', key: 'revenue', width: 20 },
        { header: 'Bills', key: 'orders', width: 15 }
      ];
      styleHeader(wsSales);
      salesData.forEach(r => wsSales.addRow({ date: r._id, revenue: r.revenue || 0, orders: r.orders || 0 }));
      wsSales.getColumn(2).numFmt = '"₹"#,##0.00';
    }

    // 3. Category Mix (Best Selling Categories)
    if (catData.length) {
      const wsCat = wb.addWorksheet('Categories');
      wsCat.columns = [
        { header: 'Category', key: 'category', width: 25 },
        { header: 'Income', key: 'revenue', width: 20 },
        { header: 'Items Sold', key: 'items', width: 15 }
      ];
      styleHeader(wsCat);
      catData.forEach(c => wsCat.addRow({ category: c._id || 'Uncategorized', revenue: c.revenue || 0, items: c.count || 0 }));
      wsCat.getColumn(2).numFmt = '"₹"#,##0.00';
    }

    // 4. Top Products (Highest Profit Items)
    if (topProducts.length) {
      const wsProd = wb.addWorksheet('Best Selling Items');
      wsProd.columns = [
        { header: 'Product', key: 'product', width: 45 },
        { header: 'Quantity Sold', key: 'qty', width: 15 },
        { header: 'Income', key: 'rev', width: 20 }
      ];
      styleHeader(wsProd);
      topProducts.forEach(p => wsProd.addRow({ product: p.name, qty: p.qty || 0, rev: p.rev || 0 }));
      wsProd.getColumn(3).numFmt = '"₹"#,##0.00';
    }

    // 5. Regional Sales (Orders by City/State)
    if (regionData.length) {
      const wsRegion = wb.addWorksheet('City Wise Sales');
      wsRegion.columns = [
        { header: 'City / State', key: 'region', width: 25 },
        { header: 'Income', key: 'revenue', width: 20 },
        { header: 'Bills', key: 'orders', width: 15 }
      ];
      styleHeader(wsRegion);
      regionData.forEach(r => wsRegion.addRow({ region: r._id || 'Unknown', revenue: r.revenue || 0, orders: r.orders || 0 }));
      wsRegion.getColumn(2).numFmt = '"₹"#,##0.00';
    }

    // 6. Payment Methods
    if (payData.length) {
      const wsPay = wb.addWorksheet('Payment Methods');
      wsPay.columns = [
        { header: 'Method', key: 'method', width: 25 },
        { header: 'Income', key: 'revenue', width: 20 },
        { header: 'Count', key: 'count', width: 15 }
      ];
      styleHeader(wsPay);
      payData.forEach(p => wsPay.addRow({ method: p._id || 'Unknown', revenue: p.revenue || 0, count: p.count || 0 }));
      wsPay.getColumn(2).numFmt = '"₹"#,##0.00';
    }

    // 7. Inventory & Stock Value
    const wsERP = wb.addWorksheet('Stock Value Overview');
    wsERP.columns = [
      { header: 'Metric', key: 'metric', width: 35 },
      { header: 'Value', key: 'value', width: 25 }
    ];
    styleHeader(wsERP);
    wsERP.addRows([
      { metric: 'Value of Stock in Shop', value: erp.inventoryValue || 0 },
      { metric: 'Pending to Suppliers', value: erp.totalPayables || 0 },
      { metric: 'Unsold Items Count', value: deadStock.length },
      { metric: 'Low Profit Items Count', value: lowMargin.length }
    ]);
    wsERP.getCell('B2').numFmt = '"₹"#,##0.00';
    wsERP.getCell('B3').numFmt = '"₹"#,##0.00';

    // 8. Staff Leaderboard
    if (staffData.length) {
      const wsStaff = wb.addWorksheet('Staff Leaderboard');
      wsStaff.columns = [
        { header: 'Staff Name', key: 'name', width: 25 },
        { header: 'Total Billed', key: 'revenue', width: 20 },
        { header: 'Bills Generated', key: 'txns', width: 15 }
      ];
      styleHeader(wsStaff);
      staffData.forEach(s => wsStaff.addRow({ name: s.name || 'Unknown', revenue: s.totalSales || 0, txns: s.txns || 0 }));
      wsStaff.getColumn(2).numFmt = '"₹"#,##0.00';
    }

    // 9. Unsold Items (Dead Stock)
    if (deadStock.length) {
      const wsDead = wb.addWorksheet('Unsold Items (30+ Days)');
      wsDead.columns = [
        { header: 'Product Name', key: 'name', width: 40 },
        { header: 'Variant', key: 'variant', width: 25 },
        { header: 'Stock Left', key: 'stock', width: 15 },
        { header: 'Days Unsold', key: 'days', width: 15 }
      ];
      styleHeader(wsDead);
      deadStock.forEach(d => wsDead.addRow({ name: d.productName || d.name || 'Unknown', variant: `${d.size} - ${d.color}`, stock: d.totalStock || 0, days: Math.round(d.ageDays || 0) }));
    }

    // 10. Low Profit Items
    if (lowMargin.length) {
      const wsMargin = wb.addWorksheet('Low Profit Items');
      wsMargin.columns = [
        { header: 'Product Name', key: 'name', width: 40 },
        { header: 'Variant', key: 'variant', width: 25 },
        { header: 'Margin %', key: 'margin', width: 15 },
        { header: 'Sell Price', key: 'price', width: 15 }
      ];
      styleHeader(wsMargin);
      lowMargin.forEach(l => wsMargin.addRow({ name: l.productName || l.name || 'Unknown', variant: `${l.size} - ${l.color}`, margin: `${l.margin ? (l.margin * 100).toFixed(1) : 0}%`, price: l.sellingPrice || 0 }));
      wsMargin.getColumn(4).numFmt = '"₹"#,##0.00';
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Shop_Analytics_${period}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success('Admin-friendly Excel Downloaded!', { id: 'export' });
  };

  const TABS = [
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'profit', label: 'Profit', icon: IndianRupee },
    { id: 'inventory', label: 'Stock', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-border-light p-4 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-charcoal rounded-2xl flex items-center justify-center">
                <Activity size={20} className="text-premium-gold" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Shop Analytics</h1>
                <p className="text-[9px] text-text-muted font-bold uppercase tracking-[0.3em] mt-0.5">Overview of your shop's performance</p>
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
            <button onClick={exportToExcel} className="px-5 py-3 bg-premium-gold text-charcoal rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2">
              <Download size={14} /> Full Report
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-border-light">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeTab === tab.id ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-text-muted border-border-light hover:border-charcoal/30'}`}
            >
              <tab.icon size={14} className={activeTab === tab.id ? 'text-premium-gold' : ''} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT: SALES REPORT ───────────────────────────── */}
      {activeTab === 'sales' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryBadge label="Total Income" value={fmt(summary.totalRevenue)} trend={summary.growth} color="#D4AF37" />
            <SummaryBadge label="Total Bills" value={fmtN(summary.totalOrders)} color="#4F46E5" />
            <SummaryBadge label="Avg Bill Value" value={fmt(summary.totalOrders > 0 ? summary.totalRevenue / summary.totalOrders : 0)} color="#10B981" />
            <SummaryBadge label="Growth vs Prev" value={`${summary.growth > 0 ? '+' : ''}${summary.growth || 0}%`} trend={summary.growth} color="#F59E0B" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <SectionCard icon={TrendingUp} title="Income Graph" sub={period === 'daily' ? 'Last 30 days' : period === 'monthly' ? 'This year by month' : 'All time by year'}>
              {isLoading ? (
                <div className="h-[300px] bg-light-bg rounded-2xl animate-pulse" />
              ) : salesData.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-center">
                  <TrendingUp size={48} className="text-border-light mb-4" />
                  <p className="text-[11px] font-black text-text-muted uppercase tracking-wider">No sales data</p>
                </div>
              ) : ready && (
                <Suspense fallback={<div className="h-[300px] bg-light-bg rounded-2xl animate-pulse" />}>
                  <AnalyticsAreaChart data={salesData} />
                </Suspense>
              )}
            </SectionCard>

            <div className="space-y-6">
              <SectionCard icon={PieChart} title="Online Web vs Shop POS" sub="Income from Web and Shop">
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Globe size={10} /> Online Web</p>
                    <p className="text-lg font-black text-charcoal">{fmt(channelSplit.online.revenue)}</p>
                    <p className="text-[10px] text-text-muted font-bold mt-0.5">{fmtN(channelSplit.online.orders)} orders</p>
                  </div>
                  <div className="flex-1 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                    <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Store size={10} /> Offline POS</p>
                    <p className="text-lg font-black text-charcoal">{fmt(channelSplit.offline.revenue)}</p>
                    <p className="text-[10px] text-text-muted font-bold mt-0.5">{fmtN(channelSplit.offline.orders)} bills</p>
                  </div>
                </div>
                {/* Category Mix */}
                <div className="mt-6 pt-6 border-t border-border-light">
                  <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Best Selling Categories</h3>
                  {catData.length === 0 ? (
                    <div className="text-[10px] font-black text-text-muted uppercase opacity-50">No data</div>
                  ) : (
                    <div className="space-y-3">
                      {catData.slice(0, 4).map((cat, i) => {
                        const total = catData.reduce((s, c) => s + (c.revenue || 0), 0);
                        const pct = total > 0 ? ((cat.revenue || 0) / total) * 100 : 0;
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-[10px] font-black mb-1">
                              <span className="text-charcoal uppercase truncate">{cat._id || 'Uncategorized'}</span>
                              <span className="text-text-muted">{pct.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 bg-light-bg rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
             <SectionCard icon={CreditCard} title="Payment Methods" sub="How customers pay">
              {payData.length === 0 ? (
                <div className="text-center py-4 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">No payment data</div>
              ) : ready && (
                <Suspense fallback={<div className="h-[220px] bg-light-bg rounded-2xl animate-pulse" />}>
                  <AnalyticsBarChart data={payData} />
                </Suspense>
              )}
            </SectionCard>

            <SectionCard icon={MapPin} title="Orders by City/State" sub="Location wise sales">
              {regionData.length === 0 ? (
                <div className="text-center py-4 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">No regional data</div>
              ) : (
                <div className="space-y-3">
                  {regionData.slice(0, 5).map((r, i) => {
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
        </motion.div>
      )}

      {/* ── TAB CONTENT: PROFIT REPORT ──────────────────────────── */}
      {activeTab === 'profit' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryBadge label="Total Income" value={fmt(profit.totalRevenue)} color="#4F46E5" />
            <SummaryBadge label="Total Purchase Cost" value={fmt(profit.totalCost)} color="#EF4444" sub="Based on item purchase price" />
            <SummaryBadge label="Net Profit" value={fmt(profit.grossProfit)} color="#10B981" sub={`Margin: ${profitMarginPct}%`} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <SectionCard icon={Star} title="Highest Profit Items" sub="Best selling items in this period">
              {topProducts.length === 0 ? (
                <div className="text-center py-10 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">No product sales data</div>
              ) : (
                <div className="space-y-3">
                  {topProducts.slice(0, 6).map((p, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-light-bg/50 rounded-2xl border border-border-light group hover:border-premium-gold/40 transition-all">
                      <div className="w-9 h-9 rounded-xl shrink-0 overflow-hidden bg-light-bg border border-border-light">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-text-muted">{i + 1}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-charcoal truncate uppercase">{p.name}</p>
                        <p className="text-[9px] text-text-muted mt-0.5">{fmtN(p.qty)} units sold</p>
                      </div>
                      <p className="text-[11px] font-black text-emerald-600 shrink-0">{fmt(p.rev)}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard icon={AlertTriangle} title="Low Profit Items" sub="Products below 20% profit margin">
              {lowMargin.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Trophy size={36} className="text-emerald-400 mb-3" />
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">All Margins Healthy!</p>
                  <p className="text-[9px] text-text-muted mt-1">No products below 20% margin</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowMargin.slice(0, 6).map((item, i) => {
                    const margin = item.margin ? (item.margin * 100).toFixed(1) : '0.0';
                    return (
                      <div key={i} className="flex items-center justify-between p-4 bg-red-50/40 rounded-2xl border border-red-100">
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
        </motion.div>
      )}

      {/* ── TAB CONTENT: INVENTORY REPORT ────────────────────────── */}
      {activeTab === 'inventory' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryBadge label="Value of Stock in Shop" value={fmt(erp.inventoryValue || 0)} color="#D4AF37" sub="Estimated capital locked" />
            <SummaryBadge label="Pending to Suppliers" value={fmt(erp.totalPayables || 0)} color="#EF4444" sub="Amount owed to suppliers" />
            <SummaryBadge label="Unsold Items" value={fmtN(deadStock.length)} color="#8B5CF6" sub="Zero sales in 30+ days" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <SectionCard icon={Package} title="Old Stock Breakdown" sub="Inventory by age">
              {stockAging.length === 0 ? (
                <div className="text-center py-4 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">No aging data</div>
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
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-full" style={{ background: colors[i] || '#D4AF37' }} />
                        </div>
                        <p className="text-[9px] text-text-muted mt-2 font-bold">Capital locked: {fmt(bucket.value)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard icon={AlertTriangle} title="Unsold Items (30+ days)" sub="0 sales in 30+ days">
              {deadStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Zap size={36} className="text-emerald-400 mb-3" />
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">No Dead Stock!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deadStock.slice(0, 6).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
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
        </motion.div>
      )}

      {/* ── TAB CONTENT: CUSTOMER REPORT ────────────────────────── */}
      {activeTab === 'customers' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <SummaryBadge label="Total Customers" value={fmtN(customers.totalUniqueInPeriod)} color="#4F46E5" sub="Purchased in this period" />
            <SummaryBadge label="Returning Customers" value={fmtN(customers.repeatCustomers)} color="#10B981" sub={`Retention Rate: ${customerRetentionPct}%`} />
            <SummaryBadge label="First Time Buyers" value={fmtN(customers.totalUniqueInPeriod - customers.repeatCustomers)} color="#F59E0B" sub="First time buyers" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <SectionCard icon={Users} title="New vs Returning Customers" sub="New vs Repeat buyers">
              <div className="py-6">
                <div className="flex justify-between mb-2">
                  <span className="text-[11px] font-black text-charcoal uppercase">New Customers</span>
                  <span className="text-[11px] font-black text-emerald-600">{(100 - parseFloat(customerRetentionPct)).toFixed(1)}%</span>
                </div>
                <div className="h-4 bg-emerald-100 rounded-full overflow-hidden mb-6 border border-emerald-200">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${100 - parseFloat(customerRetentionPct)}%` }} className="h-full bg-emerald-500 rounded-full" />
                </div>

                <div className="flex justify-between mb-2">
                  <span className="text-[11px] font-black text-charcoal uppercase">Repeat Customers</span>
                  <span className="text-[11px] font-black text-blue-600">{customerRetentionPct}%</span>
                </div>
                <div className="h-4 bg-blue-100 rounded-full overflow-hidden border border-blue-200">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${customerRetentionPct}%` }} className="h-full bg-blue-500 rounded-full" />
                </div>
              </div>
            </SectionCard>

            <SectionCard icon={Trophy} title="Staff Leaderboard" sub="Top sales reps (POS)">
              {staffData.length === 0 ? (
                <div className="text-center py-10 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">No staff billing data</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-light">
                        {['Rank', 'Staff Member', 'Total Billed'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light/50">
                      {staffData.map((s, i) => (
                        <tr key={i} className={`group hover:bg-light-bg/50 transition-colors ${i === 0 ? 'bg-premium-gold/5' : ''}`}>
                          <td className="px-4 py-4 text-xl">{MEDALS[i] || `#${i + 1}`}</td>
                          <td className="px-4 py-4">
                            <span className="text-[11px] font-black text-charcoal uppercase">{s.name || 'Staff'}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-[12px] font-black text-charcoal">{fmt(s.totalSales)}</span>
                            <span className="text-[9px] text-text-muted block mt-0.5">{fmtN(s.txns)} bills</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>
        </motion.div>
      )}
    </div>
  );
}
