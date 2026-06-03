import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Search, Filter, Download, ChevronDown, Loader2, Printer, X, User, MapPin, CreditCard, Calendar, Package, ExternalLink, Info, CheckCircle2, Clock, AlertCircle, Smartphone, Zap } from 'lucide-react';
import { adminService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import ThermalReceipt from '../staff/pos/ThermalReceipt';

const STATUS_OPTIONS = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const STATUS_COLORS = {
  placed: 'bg-blue-50 text-blue-700',
  confirmed: 'bg-indigo-50 text-indigo-700',
  shipped: 'bg-amber-50 text-amber-700',
  out_for_delivery: 'bg-orange-50 text-orange-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
  returned: 'bg-purple-50 text-purple-700',
};

export default function AdminOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const invoiceRef = useRef(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', search, statusFilter, page],
    queryFn: () => adminService.getAllOrders({ search, status: statusFilter, page, limit: 10 }).then(r => r.data),
  });

  const orders = Array.isArray(data?.data?.orders) ? data.data.orders : (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
  const pagination = data?.pagination;
  const total = pagination?.total || orders.length;

  const handlePrint = (order) => {
    setPrintOrder(order);
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 1200);
  };

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => adminService.updateOrderStatus(id, { status }),
    onSuccess: (res, variables) => { 
      qc.invalidateQueries(['admin-orders']); 
      toast.success('Order status updated'); 
      setUpdatingId(null);
      
      // Auto-print if status is shipped
      if (variables.status === 'shipped') {
        const order = orders.find(o => o._id === variables.id);
        if (order) handlePrint(order);
      }
    },
    onError: () => toast.error('Failed to update status'),
  });
  
  const resendReceipt = useMutation({
    mutationFn: (id) => adminService.resendOrderReceipt(id),
    onSuccess: (r) => {
      const { whatsapp, email } = r.data.data || {};
      if (email && whatsapp) toast.success('Receipt sent via WhatsApp & Email');
      else if (email) toast.success('Receipt sent via Email');
      else if (whatsapp) toast.success('Receipt sent via WhatsApp');
      else toast.success('Receipt resent');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to resend receipt'),
  });

  const downloadCSV = () => {
    if (!orders.length) return;
    const headers = ['Order #', 'Customer', 'Email/Phone', 'Amount', 'Status', 'Payment', 'Date'];
    const rows = orders.map(o => [
      o.orderNumber, 
      o.shippingAddress?.name || o.userId?.name || 'Guest', 
      o.guestDetails?.email || o.userId?.email || o.shippingAddress?.phone || '-', 
      o.pricing?.totalAmount, 
      o.orderStatus, 
      o.paymentMethod, 
      new Date(o.createdAt).toLocaleDateString('en-IN')
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'orders.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Orders — Admin</title>
      </Helmet>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
            onUpdateStatus={(id, status) => {
              setUpdatingId(id);
              updateStatus.mutate({ id, status });
            }}
            onPrint={handlePrint}
            onResendWhatsApp={(id) => resendReceipt.mutate(id)}
            isUpdating={updateStatus.isPending && updatingId === selectedOrder._id}
          />
        )}
      </AnimatePresence>

      {/* Hidden Invoice for Printing using Portal */}
      {createPortal(
        <div 
          id="thermal-print-wrapper" 
          className={`fixed inset-0 z-[9999] bg-white overflow-auto ${isPrinting ? 'block' : 'hidden'}`}
        >
          {isPrinting && (
            <div className="no-print fixed top-4 right-4 bg-charcoal text-white px-4 py-2 rounded-full text-xs font-bold animate-pulse shadow-2xl">
              Preparing Thermal Receipt...
            </div>
          )}
          <ThermalReceipt ref={invoiceRef} bill={printOrder} />
        </div>,
        document.body
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ShoppingBag size={22} className="text-premium-gold" /> All Orders
          </h1>
          <p className="text-text-muted text-sm">{total} total orders</p>
        </div>
        <button onClick={downloadCSV} className="btn-dark flex items-center gap-2 self-start py-2 px-4 text-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input className="w-full bg-white border border-border-light rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-premium-gold text-sm" placeholder="Search by order # or customer..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
          <select className="appearance-none bg-white border border-border-light rounded-xl pl-9 pr-8 py-2.5 focus:outline-none text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={14} />
        </div>
      </div>

      {/* Status Summary Chips */}
      <div className="flex gap-2 flex-wrap">
        {['placed', 'shipped', 'delivered', 'cancelled'].map(s => {
          const count = orders.filter(o => o.orderStatus === s).length;
          return (
            <button key={s} onClick={() => { setStatusFilter(statusFilter === s ? '' : s); setPage(1); }} className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${statusFilter === s ? 'bg-charcoal text-white' : STATUS_COLORS[s]}`}>
              {s}: {count}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-light-bg border-b border-border-light">
                {['Order #', 'Customer', 'Items', 'Amount', 'Status', 'Payment', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-4 text-xs font-bold text-text-muted uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading && (
                <tr><td colSpan="8" className="px-5 py-12 text-center"><Loader2 className="animate-spin text-premium-gold inline-block" /></td></tr>
              )}
              {!isLoading && orders.length === 0 && (
                <tr><td colSpan="8" className="px-5 py-12 text-center text-text-muted">No orders found.</td></tr>
              )}
              {orders.map(o => (
                <tr key={o._id} className="hover:bg-light-bg/50 transition-colors group cursor-pointer" onClick={() => setSelectedOrder(o)}>
                  <td className="px-5 py-4">
                    <p className="font-bold text-premium-gold text-sm group-hover:underline">#{o.orderNumber}</p>
                    <p className="text-[10px] text-text-muted">{new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-text-primary text-sm">{o.shippingAddress?.name || o.userId?.name || 'Guest'}</p>
                      {o.isGuestOrder ? (
                        <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-tighter">Guest</span>
                      ) : (
                        <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-200 uppercase tracking-tighter">Member</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] text-text-muted truncate max-w-[160px] flex items-center gap-1">
                        <span className="font-bold opacity-50">E:</span> {o.guestDetails?.email || o.userId?.email || 'Not Provided'}
                      </p>
                      <p className="text-[10px] text-text-muted flex items-center gap-1">
                        <span className="font-bold opacity-50">P:</span> {o.shippingAddress?.phone || o.userId?.phone || 'Not Provided'}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-text-muted">{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-text-primary">Rs.{o.pricing?.totalAmount?.toLocaleString('en-IN')}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${STATUS_COLORS[o.orderStatus] || 'bg-gray-50 text-gray-600'}`}>
                      {o.orderStatus?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-text-muted capitalize">{o.paymentMethod}</span>
                    <span className={`ml-1 text-[10px] font-bold ${o.paymentStatus === 'completed' ? 'text-green-600' : o.paymentStatus === 'failed' ? 'text-red-600 font-extrabold uppercase' : 'text-amber-600'}`}>
                      · {o.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-text-muted whitespace-nowrap">
                    <p>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">{new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                  </td>
                  <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {!['delivered', 'cancelled', 'returned'].includes(o.orderStatus) ? (
                        <div className="relative">
                          <select
                            className="appearance-none bg-light-bg border border-border-light rounded-lg px-3 py-1.5 text-xs focus:outline-none pr-6 cursor-pointer"
                            value={o.orderStatus}
                            disabled={updateStatus.isPending && updatingId === o._id}
                            onChange={e => { setUpdatingId(o._id); updateStatus.mutate({ id: o._id, status: e.target.value }); }}
                          >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" size={10} />
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted italic">Finalized</span>
                      )}
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); resendReceipt.mutate(o._id); }}
                        className="p-2 text-text-muted hover:text-green-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Resend Receipt (WA/Email)"
                      >
                        <Smartphone size={16} />
                      </button>
                      
                      <button 
                        onClick={() => handlePrint(o)}
                        className="p-2 text-text-muted hover:text-premium-gold transition-colors opacity-0 group-hover:opacity-100"
                        title="Print Invoice"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-5 py-4 border-t border-border-light flex items-center justify-between gap-4 bg-light-bg/30">
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

function OrderDetailsModal({ order, onClose, onUpdateStatus, onPrint, isUpdating, onResendWhatsApp }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-4 md:px-8 py-4 sm:py-6 border-b border-border-light flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center flex-wrap gap-4">
            <div className="w-12 h-12 rounded-2xl bg-premium-gold/10 flex items-center justify-center text-premium-gold">
              <Package size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-charcoal">Order #{order.orderNumber}</h2>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${STATUS_COLORS[order.orderStatus]}`}>
                  {order.orderStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                <Calendar size={12} /> Placed on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center flex-wrap gap-3">
            <button 
              onClick={() => onResendWhatsApp(order._id)}
              className="btn-light py-2 px-4 text-xs flex items-center gap-2 rounded-xl border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              title="Resend via WhatsApp & Email"
            >
              <Smartphone size={16} className="text-emerald-600" /> Resend Receipt
            </button>
            <button 
              onClick={() => onPrint(order)}
              className="btn-light py-2 px-4 text-xs flex items-center gap-2 rounded-xl"
            >
              <Printer size={16} /> Print Invoice
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-light-bg rounded-full transition-colors text-text-muted"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <ShoppingBag size={14} className="text-premium-gold" /> Order Items ({order.items.length})
                </h3>
              </div>

              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-light-bg/30 border border-border-light hover:border-premium-gold/30 transition-all group">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-white border border-border-light flex-shrink-0 relative">
                      <img 
                        src={item.productImage || 'https://via.placeholder.com/150'} 
                        alt={item.productName} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute top-1 right-1 bg-charcoal/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                        x{item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-bold text-text-primary text-sm line-clamp-1">{item.productName}</h4>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {item.isCombo ? (
                            <div className="w-full space-y-1 mt-1">
                               {item.comboSelections?.map((sel, sIdx) => (
                                 <p key={sIdx} className="text-[9px] font-black text-text-muted/60 uppercase tracking-tight flex items-center gap-1.5">
                                   <Zap size={8} className="text-premium-gold" /> Slot {sIdx + 1}: {sel.productName} ({sel.size})
                                 </p>
                               ))}
                            </div>
                          ) : (
                            <>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-border-light rounded-md text-text-muted uppercase">Size: {item.variant?.size || 'N/A'}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-border-light rounded-md text-text-muted uppercase">Color: {item.variant?.color || 'N/A'}</span>
                            </>
                          )}
                          {item.sku && <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-border-light rounded-md text-text-muted/60">SKU: {item.sku}</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-text-muted">
                          Rs.{item.price.toLocaleString('en-IN')} per unit
                        </p>
                        <p className="font-bold text-text-primary">
                          Rs.{item.total.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Tracking / Timeline */}
              <div className="pt-6 border-t border-border-light">
                <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-6 flex items-center gap-2">
                  <Clock size={14} className="text-premium-gold" /> Order Timeline
                </h3>
                <div className="space-y-6 relative ml-3">
                  <div className="absolute left-0 top-2 bottom-2 w-[1px] bg-border-light" />
                  {order.statusHistory.slice().reverse().map((h, i) => (
                    <div key={i} className="relative pl-8">
                      <div className={`absolute left-[-4px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${i === 0 ? 'bg-premium-gold scale-125 ring-4 ring-premium-gold/10' : 'bg-border-light'}`} />
                      <div className="flex flex-col">
                        <p className={`text-xs font-bold uppercase tracking-wide ${i === 0 ? 'text-charcoal' : 'text-text-muted'}`}>
                          {h.status.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[10px] text-text-muted opacity-60">
                          {new Date(h.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                        {h.note && <p className="text-[10px] italic text-text-muted mt-1 px-2 py-1 bg-light-bg rounded border-l-2 border-premium-gold/30">{h.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Customer & Pricing */}
            <div className="space-y-8">
              {/* Customer Info */}
              <div className="bg-light-bg/20 rounded-3xl p-4 sm:p-6 border border-border-light space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted mb-4 flex items-center gap-2">
                    <User size={14} className="text-premium-gold" /> Customer Profile
                  </h3>
                  <div className="flex items-center flex-wrap gap-3">
                    <div className="w-10 h-10 rounded-full bg-charcoal text-white flex items-center justify-center font-bold text-sm">
                      {(order.shippingAddress?.name || order.userId?.name || 'G')[0]}
                    </div>
                    <div>
                      <p className="font-bold text-charcoal text-sm">{order.shippingAddress?.name || order.userId?.name || 'Guest User'}</p>
                      <p className="text-[10px] text-text-muted">{order.guestDetails?.email || order.userId?.email || 'No Email'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted mb-3 flex items-center gap-2">
                    <MapPin size={14} className="text-premium-gold" /> Delivery Address
                  </h3>
                  <div className="text-xs text-text-muted leading-relaxed bg-white/50 p-4 rounded-2xl border border-border-light">
                    <p className="font-bold text-charcoal mb-1">{order.shippingAddress?.name}</p>
                    <p>{order.shippingAddress?.addressLine1}</p>
                    {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                    <p className="mt-2 flex items-center gap-1.5 font-bold text-charcoal">
                      <Smartphone size={12} className="opacity-40" /> {order.shippingAddress?.phone}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted mb-3 flex items-center gap-2">
                    <CreditCard size={14} className="text-premium-gold" /> Payment Status
                  </h3>
                  <div className="flex items-center justify-between bg-white/50 p-4 rounded-2xl border border-border-light">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-60">Method</p>
                      <p className="text-xs font-black text-charcoal uppercase">{order.paymentMethod}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-60">Status</p>
                      <div className="flex items-center gap-1 justify-end">
                        {order.paymentStatus === 'completed' ? (
                          <CheckCircle2 size={12} className="text-green-500" />
                        ) : order.paymentStatus === 'failed' ? (
                          <AlertCircle size={12} className="text-red-500" />
                        ) : (
                          <Clock size={12} className="text-amber-500" />
                        )}
                        <p className={`text-xs font-black uppercase ${
                          order.paymentStatus === 'completed' 
                            ? 'text-green-600' 
                            : order.paymentStatus === 'failed' 
                              ? 'text-red-600 font-extrabold' 
                              : 'text-amber-600'
                        }`}>{order.paymentStatus}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-charcoal text-white rounded-3xl p-4 md:p-8 shadow-xl shadow-charcoal/20 relative overflow-hidden group">
                <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-premium-gold/10 rounded-full blur-2xl group-hover:bg-premium-gold/20 transition-colors" />
                
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-6">Financial Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">Subtotal</span>
                    <span className="font-bold font-mono">Rs.{order.pricing.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {order.pricing.couponDiscount > 0 && (
                    <div className="flex justify-between items-center text-sm text-premium-gold">
                      <span>Discount</span>
                      <span className="font-bold font-mono">-Rs.{order.pricing.couponDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">Shipping</span>
                    <span className="font-bold font-mono">{order.pricing.shippingCharges > 0 ? `Rs.${order.pricing.shippingCharges.toLocaleString('en-IN')}` : 'FREE'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">GST (Included)</span>
                    <span className="font-bold font-mono">Rs.{order.pricing.gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-[1px] bg-white/10 my-4" />
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black uppercase tracking-widest text-white/40">Total Payable</span>
                    <span className="text-2xl font-black text-premium-gold font-mono tracking-tight">Rs.{order.pricing.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Admin Actions Quick Toggle */}
              {!['delivered', 'cancelled', 'returned'].includes(order.orderStatus) && (
                <div className="bg-white border border-border-light rounded-3xl p-4 sm:p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
                    <Zap size={14} className="text-premium-gold" /> Update status
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.filter(s => s !== order.orderStatus).map(s => (
                      <button
                        key={s}
                        disabled={isUpdating}
                        onClick={() => onUpdateStatus(order._id, s)}
                        className="text-[10px] font-bold uppercase py-2 px-3 bg-light-bg hover:bg-premium-gold hover:text-charcoal transition-all rounded-xl disabled:opacity-50"
                      >
                        Set {s.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
