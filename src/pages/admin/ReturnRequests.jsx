import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCcw, CheckCircle, XCircle, Eye, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { adminService } from '../../services';

export default function ReturnRequests() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-return-requests'],
    queryFn: () => adminService.getAllOrders({ hasReturn: true }).then(r => {
      const all = r.data.data?.orders || r.data.data || [];
      return all.filter(o => o.returnRequest?.isRequested);
    }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, adminNote }) => adminService.updateReturnStatus(id, { status, adminNote }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-return-requests']);
      toast.success('Return status updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const handleUpdate = (id, status) => {
    const adminNote = window.prompt(`Enter note for ${status} (optional):`);
    updateStatusMutation.mutate({ id, status, adminNote });
  };

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-premium-gold" size={40} />
    </div>
  );

  return (
    <div className="space-y-6">
      <Helmet><title>Return Requests — Admin</title></Helmet>

      <div>
        <h1 className="text-2xl font-bold text-text-primary">Return & Exchange Requests</h1>
        <p className="text-text-muted text-sm">Manage product returns and customer refunds</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', count: orders?.filter(o => o.returnRequest?.status === 'pending').length || 0, color: 'text-amber-600 bg-amber-50' },
          { label: 'Approved', count: orders?.filter(o => o.returnRequest?.status === 'approved').length || 0, color: 'text-green-600 bg-green-50' },
          { label: 'Rejected', count: orders?.filter(o => o.returnRequest?.status === 'rejected').length || 0, color: 'text-red-600 bg-red-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-border-light p-4 text-center shadow-sm">
            <p className="text-xs font-bold text-text-muted uppercase mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border-light overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-light-bg border-b border-border-light">
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Order #</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase hidden md:table-cell">Customer</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Reason</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {orders?.length === 0 && (
              <tr><td colSpan="5" className="px-6 py-12 text-center text-text-muted">No return requests found.</td></tr>
            )}
            {orders?.map(order => (
              <tr key={order._id} className="hover:bg-light-bg/50 transition-colors group">
                <td className="px-6 py-4 font-bold text-text-primary">#{order.orderNumber}</td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <p className="text-sm font-medium">{order.userId?.name || order.guestDetails?.name || 'Guest'}</p>
                  <p className="text-xs text-text-muted">{order.userId?.phone || order.guestDetails?.phone}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start gap-2 max-w-xs">
                    <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-text-primary italic line-clamp-2">"{order.returnRequest?.reason}"</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                    order.returnRequest?.status === 'pending' ? 'bg-amber-50 text-amber-700'
                    : order.returnRequest?.status === 'approved' ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                  }`}>
                    {order.returnRequest?.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {order.returnRequest?.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdate(order._id, 'approved')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => handleUpdate(order._id, 'rejected')}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
