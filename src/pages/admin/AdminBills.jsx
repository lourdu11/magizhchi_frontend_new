import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Download, Printer, Loader2, Trash2, User, IndianRupee, Wallet, Receipt, X, TrendingUp, Package, Users } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { billService } from '../../services';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store';
import { useVirtualizer } from '@tanstack/react-virtual';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const formatCurrency = (paise) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format((paise || 0) / 100);
};

const COLORS = ['#d4af37', '#1A73E8', '#34D399', '#F87171', '#A78BFA'];

export default function AdminBills() {
  const [search, setSearch] = useState('');
  
  // Date filters
  const now = new Date();
  
  const getLocalYMD = (d) => {
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
  };

  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const [fromDate, setFromDate] = useState(getLocalYMD(firstDay));
  const [toDate, setToDate] = useState(getLocalYMD(now)); // Default to today instead of end of month, more intuitive for "up to today"

  const [selectedBill, setSelectedBill] = useState(null);
  const [deletingBill, setDeletingBill] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const parentRef = useRef(null);

  // ── Queries ──
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-bills-analytics', fromDate, toDate],
    queryFn: () => billService.getBillsAnalytics({ from: fromDate, to: toDate }).then(r => r.data.data),
  });

  const { data: billsData, isLoading: billsLoading } = useQuery({
    queryKey: ['admin-bills-list', search],
    queryFn: () => billService.getBills({ search }).then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, reason }) => billService.deleteBill(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bills-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bills-analytics'] });
      setDeletingBill(null);
      setDeleteReason('');
      if (selectedBill?._id === deletingBill._id) setSelectedBill(null);
      toast.success('Bill voided and stock restored');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const confirmDelete = () => {
    if (!deleteReason.trim()) return toast.error('Please specify a reason');
    deleteMutation.mutate({ id: deletingBill._id, reason: deleteReason });
  };

  const printBill = (bill) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = bill.items.map(item => `
      <tr>
        <td style="padding: 4px 0; font-size: 12px; border-bottom: 1px dashed #ccc;">${item.productName || item.productId?.name || 'Item'} ${item.size ? `(${item.size})` : ''}</td>
        <td style="padding: 4px 0; font-size: 12px; text-align: center; border-bottom: 1px dashed #ccc;">${item.quantity}</td>
        <td style="padding: 4px 0; font-size: 12px; text-align: right; border-bottom: 1px dashed #ccc;">Rs.${(item.unitPrice / 100).toFixed(2)}</td>
        <td style="padding: 4px 0; font-size: 12px; text-align: right; border-bottom: 1px dashed #ccc;">Rs.${((item.unitPrice * item.quantity) / 100).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Print Bill ${bill.billNumber}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 20px; color: #000; width: 300px; }
            h2 { text-align: center; margin: 0 0 10px 0; font-size: 18px; text-transform: uppercase; }
            p { margin: 2px 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .totals { margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
            .totals p { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; }
            .center { text-align: center; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h2>Magizhchi Garments</h2>
          <p class="center">Offline Retail Bill</p>
          <p class="center" style="margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px;">${new Date(bill.createdAt).toLocaleString('en-IN')}</p>
          
          <p><strong>Bill No:</strong> ${bill.billNumber}</p>
          <p><strong>Staff:</strong> ${bill.staffId?.name || 'Counter'}</p>
          <p><strong>Customer:</strong> ${bill.customerDetails?.name || 'Walk-in'}</p>
          <p><strong>Phone:</strong> ${bill.customerDetails?.phone || '-'}</p>
          
          <table>
            <thead>
              <tr>
                <th style="text-align: left; font-size: 12px; border-bottom: 1px solid #000; padding-bottom: 4px;">Item</th>
                <th style="text-align: center; font-size: 12px; border-bottom: 1px solid #000; padding-bottom: 4px;">Qty</th>
                <th style="text-align: right; font-size: 12px; border-bottom: 1px solid #000; padding-bottom: 4px;">Rate</th>
                <th style="text-align: right; font-size: 12px; border-bottom: 1px solid #000; padding-bottom: 4px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="totals">
            <p><span>Subtotal:</span> <span>Rs.${((bill.pricing?.totalAmount + (bill.pricing?.discountAmount || 0)) / 100).toFixed(2)}</span></p>
            ${bill.pricing?.discountAmount ? `<p><span>Discount:</span> <span>-Rs.${(bill.pricing.discountAmount / 100).toFixed(2)}</span></p>` : ''}
            <p style="font-size: 15px; margin-top: 5px; border-top: 1px solid #000; padding-top: 5px;"><span>Net Payable:</span> <span>Rs.${(bill.pricing?.totalAmount / 100).toFixed(2)}</span></p>
          </div>
          
          <p class="center" style="margin-top: 20px; font-size: 11px;">Thank you for shopping with us!</p>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const bills = Array.isArray(billsData?.data) ? billsData.data : [];
  
  const rowVirtualizer = useVirtualizer({
    count: bills.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  const exportToExcel = async () => {
    if (!bills.length) return;
    toast.loading('Generating Excel...', { id: 'export' });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Bills');
    
    ws.columns = [
      { header: 'Bill #', key: 'bill', width: 20 },
      { header: 'Staff', key: 'staff', width: 25 },
      { header: 'Customer', key: 'customer', width: 25 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Payment', key: 'payment', width: 15 },
      { header: 'Date', key: 'date', width: 15 }
    ];

    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };

    bills.forEach(b => {
      ws.addRow({
        bill: b.billNumber,
        staff: b.staffId?.name || '-',
        customer: b.customerDetails?.name || 'Walk-in',
        phone: b.customerDetails?.phone || '-',
        amount: (b.pricing?.totalAmount / 100),
        payment: b.paymentMethod,
        date: new Date(b.createdAt).toLocaleDateString('en-IN')
      });
    });

    ws.getColumn(5).numFmt = '"₹"#,##0.00';
    
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Offline_Bills_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel Downloaded!', { id: 'export' });
  };

  const { summary, dailyRevenue = [], topProducts = [], paymentSplit = [], staffLeaderboard = [] } = analyticsData || {};

  const paymentData = paymentSplit.map((p, i) => ({
    name: p._id.charAt(0).toUpperCase() + p._id.slice(1),
    value: p.amount / 100,
    color: COLORS[i % COLORS.length]
  }));

  return (
    <div className="space-y-6 pb-20 relative">
      <Helmet><title>Offline Billing Analytics — Admin</title></Helmet>
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-5 rounded-2xl border border-border-light shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Receipt className="text-premium-gold" /> Offline Billing Intelligence
          </h1>
          <p className="text-text-muted text-sm mt-1">Real-time performance metrics and POS management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-light-bg rounded-xl p-1 border border-border-light">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-transparent text-sm border-none focus:ring-0 px-2 font-medium" />
            <span className="text-text-muted px-1">to</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-transparent text-sm border-none focus:ring-0 px-2 font-medium" />
          </div>
          <button onClick={exportToExcel} className="btn-dark flex items-center gap-2 py-2 px-4 text-sm rounded-xl whitespace-nowrap">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {analyticsLoading ? (
        <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-premium-gold" /></div>
      ) : (
        <>
          {/* ── KPI Summary Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-text-muted uppercase">Total Revenue</p>
                <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center"><IndianRupee size={16} /></div>
              </div>
              <p className="text-2xl font-black text-charcoal">{formatCurrency(summary?.totalRevenue)}</p>
              <p className="text-xs text-text-muted mt-1 font-medium">{summary?.totalBills || 0} successful bills</p>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-text-muted uppercase">Average Order Value</p>
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><TrendingUp size={16} /></div>
              </div>
              <p className="text-2xl font-black text-charcoal">{formatCurrency(summary?.avgBillValue)}</p>
              <p className="text-xs text-text-muted mt-1 font-medium">Per transaction avg.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-text-muted uppercase">Payment Methods</p>
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><Wallet size={16} /></div>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-text-muted">Cash</span>
                  <span className="text-charcoal">{formatCurrency(summary?.cashTotal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-text-muted">UPI</span>
                  <span className="text-charcoal">{formatCurrency(summary?.upiTotal)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-text-muted uppercase">Items Sold</p>
                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center"><Package size={16} /></div>
              </div>
              <p className="text-2xl font-black text-charcoal">{summary?.totalItems || 0}</p>
              <p className="text-xs text-text-muted mt-1 font-medium">Discount given: <span className="text-red-500 font-bold">{formatCurrency(summary?.totalDiscount)}</span></p>
            </div>
          </div>

          {/* ── Charts & Rankings Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Revenue Trend Chart */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-border-light shadow-sm">
              <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider mb-6">Daily Revenue Trend</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyRevenue} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis 
                      dataKey="_id" 
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10}
                    />
                    <YAxis 
                      tickFormatter={(val) => `₹${val/100000}k`}
                      axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f3f4f6' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-charcoal text-white text-xs p-3 rounded-lg shadow-xl border border-white/10">
                              <p className="font-bold mb-1 opacity-80">{new Date(payload[0].payload._id).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                              <p className="text-premium-gold font-black text-sm">Revenue: {formatCurrency(payload[0].value)}</p>
                              <p className="mt-1">Bills: {payload[0].payload.bills}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="revenue" fill="#1f2937" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Split Pie Chart */}
            <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider mb-4">Payment Methods</h3>
              <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                      {paymentData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                  <span className="text-[10px] font-bold text-text-muted uppercase">Total</span>
                  <span className="text-sm font-black text-charcoal">{formatCurrency(summary?.totalRevenue)}</span>
                </div>
              </div>
              <div className="mt-auto space-y-2">
                {paymentData.map((p, i) => (
                  <div key={p.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }}></div>
                      <span className="font-medium text-text-muted">{p.name}</span>
                    </div>
                    <span className="font-bold text-charcoal">₹{p.value.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm">
              <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider mb-4 flex items-center gap-2"><Package size={16} className="text-premium-gold" /> Top Selling Items</h3>
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-light-bg border border-border-light/50 hover:border-premium-gold/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-xs text-text-muted border border-border-light shadow-sm">#{i+1}</div>
                      <div>
                        <p className="text-sm font-bold text-charcoal line-clamp-1">{p.name}</p>
                        <p className="text-[10px] font-bold text-premium-gold uppercase tracking-wider">{p.qty} Units Sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-charcoal">{formatCurrency(p.revenue)}</p>
                    </div>
                  </div>
                ))}
                {topProducts.length === 0 && <p className="text-sm text-text-muted text-center py-4">No products sold in this period.</p>}
              </div>
            </div>

            {/* Staff Leaderboard */}
            <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm">
              <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider mb-4 flex items-center gap-2"><Users size={16} className="text-blue-500" /> Staff Leaderboard</h3>
              <div className="space-y-3">
                {staffLeaderboard.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-light-bg border border-border-light/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-charcoal text-premium-gold flex items-center justify-center font-black text-sm uppercase">
                        {s.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-charcoal">{s.name}</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{s.bills} Bills generated</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-green-600">{formatCurrency(s.revenue)}</p>
                    </div>
                  </div>
                ))}
                {staffLeaderboard.length === 0 && <p className="text-sm text-text-muted text-center py-4">No staff activity recorded.</p>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Bills Table ── */}
      <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">Recent Transactions</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
            <input 
              className="w-full bg-light-bg border border-border-light rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-premium-gold/20 focus:border-premium-gold text-xs font-medium transition-all" 
              placeholder="Search Bill # or Phone..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>

        <div ref={parentRef} className="border border-border-light rounded-xl overflow-auto h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-light-bg sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-light">Bill #</th>
                <th className="px-4 py-3 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-light">Customer</th>
                <th className="px-4 py-3 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-light">Amount</th>
                <th className="px-4 py-3 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-light">Payment</th>
                <th className="px-4 py-3 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-light text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {billsLoading ? (
                <tr><td colSpan="5" className="py-10 text-center"><Loader2 className="animate-spin text-premium-gold mx-auto" /></td></tr>
              ) : bills.length === 0 ? (
                <tr><td colSpan="5" className="py-10 text-center text-sm text-text-muted font-medium">No bills found for criteria.</td></tr>
              ) : (
                <>
                  {rowVirtualizer.getVirtualItems()[0]?.start > 0 && <tr><td colSpan="5" style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }} /></tr>}
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const bill = bills[virtualRow.index];
                    if (!bill) return null;
                    return (
                      <tr 
                        key={bill._id} 
                        onClick={() => setSelectedBill(bill)}
                        className={`hover:bg-premium-gold/5 cursor-pointer transition-colors ${bill.status === 'voided' ? 'opacity-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <p className={`font-bold text-sm ${bill.status === 'voided' ? 'text-red-500 line-through' : 'text-charcoal'}`}>#{bill.billNumber}</p>
                          {bill.status === 'voided' && <span className="text-[8px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-black uppercase tracking-wider">Void</span>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-charcoal">{bill.customerDetails?.name || 'Walk-in'}</p>
                          <p className="text-[10px] text-text-muted">{bill.customerDetails?.phone || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className={`font-black text-sm ${bill.status === 'voided' ? 'text-text-muted' : 'text-green-600'}`}>
                            {formatCurrency(bill.pricing?.totalAmount)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-black px-2 py-1 rounded bg-light-bg border border-border-light uppercase text-charcoal">
                            {bill.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="text-xs font-medium text-text-muted">{new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                          <p className="text-[10px] text-text-muted/60">{new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                      </tr>
                    );
                  })}
                  {rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end > 0 && (
                    <tr><td colSpan="5" style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px` }} /></tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bill Details Side Drawer ── */}
      <AnimatePresence>
        {selectedBill && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedBill(null)} className="fixed inset-0 bg-charcoal/30 backdrop-blur-sm z-40" />
            <motion.div 
              initial={{ x: '100%', opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: '100%', opacity: 0 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-[100dvh] w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-border-light"
            >
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-border-light flex items-center justify-between bg-light-bg/50">
                <div>
                  <h2 className="text-lg font-black text-charcoal flex items-center gap-2">
                    Bill Details
                    {selectedBill.status === 'voided' && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wider border border-red-200">Voided</span>}
                  </h2>
                  <p className="text-xs font-bold text-premium-gold uppercase tracking-widest mt-1">#{selectedBill.billNumber}</p>
                </div>
                <button onClick={() => setSelectedBill(null)} className="p-2 bg-white border border-border-light rounded-full text-text-muted hover:text-charcoal hover:bg-light-bg transition-colors shadow-sm">
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Meta Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-light-bg rounded-xl border border-border-light">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Date & Time</p>
                    <p className="text-xs font-bold text-charcoal">{new Date(selectedBill.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                  <div className="p-3 bg-light-bg rounded-xl border border-border-light">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Billed By</p>
                    <p className="text-xs font-bold text-charcoal line-clamp-1">{selectedBill.staffId?.name || 'Unknown Staff'}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-4 border border-border-light rounded-2xl bg-white shadow-sm">
                  <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2"><User size={12} /> Customer Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-text-muted font-medium">Name:</span>
                      <span className="text-xs font-bold text-charcoal">{selectedBill.customerDetails?.name || 'Walk-in Customer'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-text-muted font-medium">Phone:</span>
                      <span className="text-xs font-bold text-charcoal">{selectedBill.customerDetails?.phone || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2"><Package size={12} /> Purchased Items ({selectedBill.items?.length})</h3>
                  <div className="border border-border-light rounded-2xl overflow-hidden divide-y divide-border-light">
                    {selectedBill.items?.map((item, idx) => (
                      <div key={idx} className="p-3 bg-white flex justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-charcoal line-clamp-2">{item.productName || item.productId?.name}</p>
                          <p className="text-[10px] text-text-muted font-medium mt-1">
                            {item.size ? `Size: ${item.size} | ` : ''} 
                            {item.color ? `Color: ${item.color}` : ''}
                          </p>
                          <p className="text-[10px] font-bold text-premium-gold mt-1">₹{(item.unitPrice/100).toFixed(2)} × {item.quantity}</p>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <p className="text-xs font-black text-charcoal">₹{((item.unitPrice * item.quantity)/100).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Billing Summary */}
                <div className="p-4 bg-charcoal text-white rounded-2xl shadow-lg relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-premium-gold/10 rounded-full blur-2xl pointer-events-none"></div>
                  <h3 className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3">Payment Summary</h3>
                  <div className="space-y-2 mb-3 pb-3 border-b border-white/10">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-white/80">Subtotal</span>
                      <span>{formatCurrency(selectedBill.pricing?.totalAmount + (selectedBill.pricing?.discountAmount || 0))}</span>
                    </div>
                    {selectedBill.pricing?.discountAmount > 0 && (
                      <div className="flex justify-between text-xs font-medium text-premium-gold">
                        <span>Discount ({selectedBill.discountType})</span>
                        <span>-{formatCurrency(selectedBill.pricing.discountAmount)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white/80">Net Total</span>
                    <span className="text-xl font-black text-premium-gold">{formatCurrency(selectedBill.pricing?.totalAmount)}</span>
                  </div>
                  
                  {/* Payment Methods Breakdown */}
                  <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2">
                    <div className="bg-white/5 p-2 rounded-lg text-center">
                      <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">Cash</p>
                      <p className="text-xs font-bold text-white">{formatCurrency(selectedBill.paymentDetails?.cashAmount)}</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg text-center">
                      <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">UPI</p>
                      <p className="text-xs font-bold text-white">{formatCurrency(selectedBill.paymentDetails?.upiAmount)}</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg text-center">
                      <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">Card</p>
                      <p className="text-xs font-bold text-white">{formatCurrency(selectedBill.paymentDetails?.cardAmount)}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-border-light bg-light-bg/50 flex gap-3">
                {selectedBill.status !== 'voided' && currentUser?.role === 'admin' && (
                  <button 
                    onClick={() => setDeletingBill(selectedBill)}
                    className="flex-1 py-3 rounded-xl border border-red-200 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} /> Void Bill
                  </button>
                )}
                <button 
                  onClick={() => printBill(selectedBill)}
                  className="flex-[2] py-3 rounded-xl bg-charcoal text-white font-black text-xs uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Printer size={14} /> Print Receipt
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Void Modal ── */}
      <AnimatePresence>
        {deletingBill && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeletingBill(null)} className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-border-light">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center border border-red-100">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-charcoal">Void Transaction</h3>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-0.5">Bill #{deletingBill.billNumber}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1.5">Void Reason</label>
                  <select 
                    value={deleteReason} 
                    onChange={e => setDeleteReason(e.target.value)}
                    className="w-full bg-light-bg border border-border-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 font-bold transition-all"
                  >
                    <option value="">-- Select Reason --</option>
                    <option value="Customer Return">Customer Return / Refund</option>
                    <option value="Wrong Bill Entry">Wrong Item / Pricing Error</option>
                    <option value="Size/Color Exchange">Inventory Exchange</option>
                    <option value="Payment Failed">Payment Gateway Failure</option>
                    <option value="Other">Other Reason</option>
                  </select>
                  {deleteReason === 'Other' && (
                    <input 
                      type="text" 
                      placeholder="Specify reason..." 
                      className="w-full mt-2 bg-light-bg border border-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 font-bold"
                      onChange={e => setDeleteReason(e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8">
                <button onClick={() => setDeletingBill(null)} className="py-3 px-4 rounded-xl border border-border-light text-xs font-black uppercase tracking-widest text-text-muted hover:bg-light-bg transition-all">Cancel</button>
                <button 
                  onClick={confirmDelete} 
                  disabled={deleteMutation.isPending}
                  className="py-3 px-4 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Void'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
