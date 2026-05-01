import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Search, Shield, ShieldOff, Download, Eye, Loader2, Mail, Phone } from 'lucide-react';
import { adminService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', search, page],
    queryFn: () => adminService.getAllUsers({ search, page, limit: 10 }).then(r => r.data.data),
  });
  
  const users = usersData?.users || usersData?.data || usersData || [];
  const pagination = usersData?.pagination;

  const blockMutation = useMutation({
    mutationFn: (id) => adminService.toggleBlockUser(id),
    onSuccess: () => { queryClient.invalidateQueries(['admin-users']); toast.success('User status updated'); },
  });

  const downloadCSV = () => {
    if (!users?.length) return;
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined'];
    const rows = users.map(u => [u.name, u.email, u.phone || '-', u.role, u.isBlocked ? 'Blocked' : 'Active', new Date(u.createdAt).toLocaleDateString('en-IN')]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'users.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Customers — Admin</title></Helmet>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Customers</h1>
          <p className="text-text-muted text-sm">{pagination?.total || users?.length || 0} total customers (incl. guests)</p>
        </div>
        <button onClick={downloadCSV} className="btn-dark flex items-center gap-2 self-start py-2 px-4 text-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        <input
          className="w-full bg-white border border-border-light rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-premium-gold"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-light-bg border-b border-border-light">
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase hidden md:table-cell">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Orders</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase hidden lg:table-cell">LTV (Spent)</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading && <tr><td colSpan="7" className="px-6 py-12 text-center"><Loader2 className="animate-spin inline-block text-premium-gold" /></td></tr>}
              {!isLoading && users?.length === 0 && <tr><td colSpan="7" className="px-6 py-12 text-center text-text-muted">No customers found.</td></tr>}
              {users?.map(user => (
                <tr key={user._id} className="hover:bg-light-bg/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dark-gradient flex items-center justify-center text-premium-gold font-bold text-sm shrink-0">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary text-sm">{user.name}</p>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter ${user.role === 'guest' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="space-y-1">
                      <p className="text-xs flex items-center gap-1 text-text-muted font-medium truncate max-w-[150px]"><Mail size={10} className="shrink-0" /> {user.email || 'N/A'}</p>
                      <p className="text-xs flex items-center gap-1 text-text-muted font-medium"><Phone size={10} className="shrink-0" /> {user.phone || '—'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-text-primary">{user.orderCount || 0} Orders</p>
                      <p className="text-[10px] text-text-muted uppercase font-black">Track Record</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <p className="text-sm font-black text-premium-gold">₹{(user.totalSpent || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-text-muted uppercase font-black">Lifetime Spent</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${user.isBlocked ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                      {user.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {user.role !== 'guest' && (
                        <button
                          onClick={() => { if (window.confirm(`${user.isBlocked ? 'Unblock' : 'Block'} ${user.name}?`)) blockMutation.mutate(user._id); }}
                          className={`p-2 rounded-lg transition-colors ${user.isBlocked ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
                          title={user.isBlocked ? 'Unblock User' : 'Block User'}
                        >
                          {user.isBlocked ? <Shield size={16} /> : <ShieldOff size={16} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-border-light flex items-center justify-between gap-4 bg-light-bg/30">
            <p className="text-xs text-text-muted font-medium">
              Showing page {page} of {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-bold border border-border-light rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, pagination.pages - 4)) + i;
                if (p < 1 || p > pagination.pages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${p === page ? 'bg-charcoal text-white shadow-lg' : 'border border-border-light hover:border-premium-gold bg-white'}`}>
                    {p}
                  </button>
                );
              })}
              <button 
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-1.5 text-xs font-bold border border-border-light rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
