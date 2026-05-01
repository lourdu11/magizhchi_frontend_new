import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Search, Eye, Download, Printer, Loader2, Calendar } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { billService } from '../../services';

export default function AdminBills() {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const { data: billsData, isLoading } = useQuery({
    queryKey: ['admin-bills', search, dateFilter],
    queryFn: () => billService.getBills({ search, date: dateFilter }).then(r => r.data.data),
  });

  const bills = billsData?.bills || billsData || [];


  const downloadCSV = () => {
    if (!bills.length) return;
    const headers = ['Bill #', 'Staff', 'Customer', 'Phone', 'Amount', 'Payment', 'Date'];
    const rows = bills.map(b => [b.billNumber, b.staffId?.name || '-', b.customerDetails?.name || 'Walk-in', b.customerDetails?.phone || '-', b.pricing?.totalAmount, b.paymentMethod, new Date(b.createdAt).toLocaleDateString('en-IN')]);
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm">
          <p className="text-xs font-bold text-text-muted uppercase mb-1">Total Bills</p>
          <p className="text-2xl font-bold text-text-primary">{bills.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm">
          <p className="text-xs font-bold text-text-muted uppercase mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-premium-gold">Rs.{bills.reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm col-span-2 md:col-span-1">
          <p className="text-xs font-bold text-text-muted uppercase mb-1">Avg Bill Value</p>
          <p className="text-2xl font-bold text-text-primary">Rs.{bills.length ? Math.round(bills.reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0) / bills.length).toLocaleString('en-IN') : 0}</p>
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
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-light-bg border-b border-border-light">
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Bill #</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase hidden md:table-cell">Customer</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase hidden lg:table-cell">Staff</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase hidden md:table-cell">Payment</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase hidden lg:table-cell">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {isLoading && <tr><td colSpan="7" className="py-12 text-center"><Loader2 className="animate-spin text-premium-gold inline-block" /></td></tr>}
            {!isLoading && bills.length === 0 && <tr><td colSpan="7" className="py-12 text-center text-text-muted">No bills found.</td></tr>}
            {bills.map(bill => (
              <tr key={bill._id} className="hover:bg-light-bg/50 transition-colors group">
                <td className="px-6 py-4">
                  <p className="font-bold text-text-primary text-sm">#{bill.billNumber}</p>
                  <p className="text-[10px] text-text-muted">{bill.items?.length} item{bill.items?.length !== 1 ? 's' : ''}</p>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <p className="text-sm font-medium text-text-primary">{bill.customerDetails?.name || 'Walk-in'}</p>
                  <p className="text-xs text-text-muted">{bill.customerDetails?.phone || '—'}</p>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  <p className="text-sm text-text-muted">{bill.staffId?.name || '—'}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-premium-gold">Rs.{bill.pricing?.totalAmount?.toLocaleString('en-IN')}</p>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 uppercase">{bill.paymentMethod}</span>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  <p className="text-sm text-text-muted">{new Date(bill.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => window.print()} className="p-2 text-text-muted hover:text-premium-gold transition-colors opacity-0 group-hover:opacity-100">
                    <Printer size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
