import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { billService } from '../../services';
import { Helmet } from 'react-helmet-async';
import { Loader2, Receipt, Search, Calendar } from 'lucide-react';

export default function StaffSalesHistory() {
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['bills', dateFilter, search],
    queryFn: () => billService.getBills({ date: dateFilter, search }).then(r => r.data),
  });

  const bills = data?.data || [];
  const totalToday = bills.reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      <Helmet><title>Sales History — Staff</title></Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Receipt size={22} className="text-premium-gold" /> Sales History
          </h1>
          <p className="text-text-muted text-sm">{bills.length} bill{bills.length !== 1 ? 's' : ''} · Rs.{totalToday.toLocaleString('en-IN')} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            className="w-full bg-white border border-border-light rounded-xl pl-10 pr-4 py-2.5 focus:outline-none text-sm"
            placeholder="Search by Bill # or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="date"
            className="bg-white border border-border-light rounded-xl pl-9 pr-4 py-2.5 focus:outline-none text-sm"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-light-bg border-b border-border-light">
              {['Bill #', 'Customer', 'Items', 'Amount', 'Payment', 'Date'].map(h => (
                <th key={h} className="px-5 py-4 text-left text-xs font-bold text-text-muted uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {isLoading && (
              <tr><td colSpan="6" className="px-5 py-12 text-center"><Loader2 className="animate-spin text-premium-gold inline-block" size={28} /></td></tr>
            )}
            {!isLoading && bills.length === 0 && (
              <tr><td colSpan="6" className="px-5 py-12 text-center text-text-muted text-sm">
                <Receipt size={36} className="mx-auto mb-2 text-border-light" />
                No bills found.
              </td></tr>
            )}
            {bills.map(b => (
              <tr key={b._id} className="hover:bg-light-bg/50 transition-colors">
                <td className="px-5 py-3.5 font-bold text-premium-gold">#{b.billNumber}</td>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-text-primary">{b.customerDetails?.name || 'Walk-in'}</p>
                  {b.customerDetails?.phone && <p className="text-xs text-text-muted">{b.customerDetails.phone}</p>}
                </td>
                <td className="px-5 py-3.5 text-text-muted">{b.items?.length || 0} item{b.items?.length !== 1 ? 's' : ''}</td>
                <td className="px-5 py-3.5 font-bold text-text-primary">Rs.{(b.pricing?.totalAmount || 0).toLocaleString('en-IN')}</td>
                <td className="px-5 py-3.5">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 uppercase">{b.paymentMethod}</span>
                </td>
                <td className="px-5 py-3.5 text-text-muted text-xs">{new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
