import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Search, Eye, Download, Printer, Loader2, Calendar, Trash2, User } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { billService } from '../../services';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store';
import { useVirtualizer } from '@tanstack/react-virtual';

export default function AdminBills() {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [deletingBill, setDeletingBill] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  
  const parentRef = useRef(null);

  const { data: billsData, isLoading } = useQuery({
    queryKey: ['admin-bills', search, dateFilter],
    queryFn: () => billService.getBills({ search, date: dateFilter }).then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, reason }) => billService.deleteBill(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bills'] });
      setDeletingBill(null);
      setDeleteReason('');
      toast.success('Bill deleted and stock restored');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const confirmDelete = () => {
    if (!deleteReason.trim()) return toast.error('Please specify a reason');
    deleteMutation.mutate({ id: deletingBill._id, reason: deleteReason });
  };

  const bills = Array.isArray(billsData?.data) ? billsData.data : (Array.isArray(billsData) ? billsData : []);

  const rowVirtualizer = useVirtualizer({
    count: bills.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  const downloadCSV = () => {
    if (!bills.length) return;
    const headers = ['Bill #', 'Staff', 'Customer', 'Phone', 'Amount', 'Payment', 'Date'];
    const rows = bills.map(b => [b.billNumber, b.staffId?.name || '-', b.customerDetails?.name || 'Walk-in', b.customerDetails?.phone || '-', (b.pricing?.totalAmount / 100), b.paymentMethod, new Date(b.createdAt).toLocaleDateString('en-IN')]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bills.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Offline Bills — Admin</title></Helmet>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Offline Bills</h1>
          <p className="text-text-muted text-sm">All bills created by staff at the counter</p>
        </div>
        <button onClick={downloadCSV} className="btn-dark flex items-center gap-2 self-start py-2 px-4 text-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm">
          <p className="text-xs font-bold text-text-muted uppercase mb-1">Active Bills</p>
          <p className="text-2xl font-bold text-text-primary">{bills.filter(b => b.status !== 'voided').length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm">
          <p className="text-xs font-bold text-text-muted uppercase mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-premium-gold">Rs.{(bills.filter(b => b.status !== 'voided').reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0) / 100).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm col-span-2 md:col-span-1">
          <p className="text-xs font-bold text-text-muted uppercase mb-1">Voided Bills</p>
          <p className="text-2xl font-bold text-red-500">{bills.filter(b => b.status === 'voided').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input className="w-full bg-white border border-border-light rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-premium-gold text-sm" placeholder="Search by Bill # or customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input type="date" className="bg-white border border-border-light rounded-xl pl-9 pr-4 py-2.5 focus:outline-none text-sm" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        </div>
      </div>

      {/* Bills Table */}
      <div ref={parentRef} className="bg-white rounded-2xl border border-border-light overflow-auto max-h-[650px] shadow-sm">
        <table className="w-full text-left border-collapse relative">
          <thead>
            <tr className="sticky top-0 z-10 border-b border-border-light shadow-sm">
              <th className="bg-light-bg px-4 sm:px-6 py-4 text-xs font-bold text-text-muted uppercase">Bill #</th>
              <th className="bg-light-bg px-4 sm:px-6 py-4 text-xs font-bold text-text-muted uppercase hidden md:table-cell">Customer</th>
              <th className="bg-light-bg px-4 sm:px-6 py-4 text-xs font-bold text-text-muted uppercase hidden lg:table-cell">Staff</th>
              <th className="bg-light-bg px-4 sm:px-6 py-4 text-xs font-bold text-text-muted uppercase">Amount</th>
              <th className="bg-light-bg px-4 sm:px-6 py-4 text-xs font-bold text-text-muted uppercase hidden md:table-cell">Payment</th>
              <th className="bg-light-bg px-4 sm:px-6 py-4 text-xs font-bold text-text-muted uppercase hidden lg:table-cell">Date</th>
              <th className="bg-light-bg px-4 sm:px-6 py-4 text-xs font-bold text-text-muted uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {isLoading && <tr><td colSpan="7" className="py-12 text-center"><Loader2 className="animate-spin text-premium-gold inline-block" /></td></tr>}
            {!isLoading && bills.length === 0 && <tr><td colSpan="7" className="py-12 text-center text-text-muted">No bills found.</td></tr>}
            {!isLoading && bills.length > 0 && (
              <>
                {rowVirtualizer.getVirtualItems()[0]?.start > 0 && (
                  <tr>
                    <td colSpan="7" style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }} />
                  </tr>
                )}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const bill = bills[virtualRow.index];
                  if (!bill) return null;
                  return (
                    <tr 
                      key={bill._id} 
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualRow.index}
                      className={`hover:bg-light-bg/50 transition-colors group ${bill.status === 'voided' ? 'opacity-60 grayscale-[0.3]' : ''}`}
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <p className={`font-bold text-sm ${bill.status === 'voided' ? 'text-red-600 line-through' : 'text-text-primary'}`}>#{bill.billNumber}</p>
                          {bill.status === 'voided' && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-600 border border-red-200 uppercase tracking-tighter">Voided</span>
                          )}
                        </div>
                        <p className="text-[10px] text-text-muted">{bill.items?.length} item{bill.items?.length !== 1 ? 's' : ''}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                        <p className="text-sm font-medium text-text-primary">{bill.customerDetails?.name || 'Walk-in'}</p>
                        <p className="text-xs text-text-muted">{bill.customerDetails?.phone || '—'}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                        <p className="text-sm text-text-muted">{bill.staffId?.name || '—'}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <p className={`font-bold ${bill.status === 'voided' ? 'text-text-muted' : 'text-premium-gold'}`}>Rs.{(bill.pricing?.totalAmount / 100).toLocaleString('en-IN')}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${bill.status === 'voided' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700'}`}>{bill.paymentMethod}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                        <p className="text-sm text-text-muted">{new Date(bill.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right flex justify-end gap-2">
                        <button onClick={() => window.print()} title="Print Bill" className="p-2 text-text-muted hover:text-premium-gold transition-colors opacity-0 group-hover:opacity-100">
                          <Printer size={16} />
                        </button>
                        {bill.status !== 'voided' && (
                          <button 
                            onClick={() => setDeletingBill(bill)} 
                            title="Delete Bill (Return/Error)"
                            className="p-2 text-text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end > 0 && (
                  <tr>
                    <td colSpan="7" style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px` }} />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
      {/* Deletion Modal */}
      <AnimatePresence>
        {deletingBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeletingBill(null)} className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-3xl p-4 md:p-8 max-w-md w-full shadow-2xl border border-border-light">
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
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1.5">Authorized Performer</label>
                  <div className="flex items-center gap-2 p-3 bg-light-bg rounded-xl border border-border-light/60">
                    <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-premium-gold border border-border-light shadow-sm"><User size={12} /></div>
                    <span className="text-[11px] font-bold text-charcoal">{currentUser?.name} (Admin)</span>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1.5">Void Reason</label>
                  <select 
                    value={deleteReason} 
                    onChange={e => setDeleteReason(e.target.value)}
                    className="w-full bg-white border border-border-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 font-bold transition-all"
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
                      className="w-full mt-2 bg-white border border-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 font-bold"
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
                  className="py-3 px-4 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/10"
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
