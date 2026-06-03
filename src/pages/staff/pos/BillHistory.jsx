import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Calendar, Printer, Trash2, ChevronLeft, 
  ChevronRight, Loader2, Eye, Receipt, User, Clock
} from 'lucide-react';
import { billService } from '../../../services';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { usePOS } from './POSContext';
import { dbService } from '../../../utils/db';

export default function BillHistory() {
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  
  const { state, dispatch } = usePOS();
  const { offlineBills } = state;

  const { data, isLoading } = useQuery({
    queryKey: ['pos-bills', { search, date, page }],
    queryFn: () => billService.getBills({ search, date, page, limit: 10 }).then(res => res.data.data),
  });

  const voidMutation = useMutation({
    mutationFn: (id) => billService.deleteBill(id, 'Voided from POS History'),
    onSuccess: () => {
      queryClient.invalidateQueries(['pos-bills']);
      toast.success('Bill voided successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to void bill')
  });

  const handleReprint = (bill) => {
    toast.success(`Reprinting Bill: ${bill.billNumber}`);
    
    // Normalize format to support both backend bill structure and raw items list
    const items = bill.items?.map(i => ({
      productId: i.productId || i.productRef?._id,
      productName: i.productName || i.name,
      price: i.price,
      quantity: i.quantity,
      size: i.size || 'STD',
      color: i.color || ''
    })) || [];
    
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = bill.discount || bill.pricing?.discountAmount || 0;
    
    dispatch({ 
      type: 'SET_LAST_BILL', 
      payload: {
        billNumber: bill.billNumber,
        date: bill.date || bill.createdAt,
        items,
        subtotal,
        discount,
        total: subtotal - discount,
        paymentMethod: bill.paymentMethod || 'cash',
        customerDetails: bill.customerDetails || bill.customer
      } 
    });
    
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="flex-1 flex flex-col bg-light-bg/20 min-h-0">
      {/* Header / Search */}
      <div className="bg-white p-4 md:p-8 border-b border-border-light flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Sales History</h2>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1 opacity-60">Manage and reprint your recent bills</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              className="pl-12 pr-6 py-3 bg-light-bg/50 border border-border-light rounded-2xl text-sm font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-premium-gold/50"
              placeholder="Search Bill / Phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="date"
              className="pl-12 pr-6 py-3 bg-light-bg/50 border border-border-light rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-premium-gold/50"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-premium-gold" size={48} />
          </div>
        ) : (!data?.data?.length && (!offlineBills || offlineBills.length === 0)) ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-30">
            <Receipt size={64} className="mb-4" />
            <p className="text-xl font-black uppercase tracking-widest">No Bills Found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* Render Offline Pending Bills */}
            {offlineBills?.map(bill => (
              <div key={bill.id} className="bg-amber-50/50 p-4 sm:p-6 rounded-[2rem] border-2 border-amber-300/40 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">
                  Offline Pending
                </div>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                      <Receipt size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-charcoal uppercase tracking-tighter">{bill.billNumber}</span>
                        <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 animate-pulse">
                          Pending Sync
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                         <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono">
                            <Clock size={12} className="inline mr-1" />
                            {format(new Date(bill.createdAt), 'hh:mm a')}
                         </div>
                         <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                            <User size={12} /> {bill.customerDetails?.name || 'Guest'}
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-12">
                     <div className="text-right">
                        <span className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total Amount</span>
                        <span className="text-xl font-black text-charcoal">₹{(bill.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) - (bill.discount || 0)).toLocaleString()}</span>
                     </div>
                     
                     <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleReprint(bill)}
                          className="w-12 h-12 rounded-2xl bg-amber-500 text-white hover:bg-amber-600 transition-all flex items-center justify-center shadow-sm"
                          title="Reprint"
                        >
                          <Printer size={18} />
                        </button>
                        <button 
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to discard this offline pending bill?')) {
                              await dbService.delete('offlineBills', bill.id);
                              dispatch({ type: 'REMOVE_OFFLINE_BILL', payload: bill.id });
                              toast.success('Offline bill discarded.');
                            }
                          }}
                          className="w-12 h-12 rounded-2xl bg-white text-text-muted hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center border border-border-light/50 shadow-sm"
                          title="Discard Bill"
                        >
                          <Trash2 size={18} />
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Render Synchronized Bills */}
            {data?.data?.map(bill => (
              <div key={bill._id} className="bg-white p-4 sm:p-6 rounded-[2rem] border border-border-light shadow-sm hover:shadow-xl hover:shadow-charcoal/5 transition-all group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-light-bg rounded-2xl flex items-center justify-center text-charcoal shadow-inner">
                      <Receipt size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-charcoal uppercase tracking-tighter">{bill.billNumber}</span>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${bill.status === 'voided' ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'}`}>
                          {bill.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                         <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono">
                            <Clock size={12} className="inline mr-1" />
                            {format(new Date(bill.createdAt), 'hh:mm a')}
                         </div>
                         <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                            <User size={12} /> {bill.customerDetails?.name || 'Guest'}
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-12">
                     <div className="text-right">
                        <span className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total Amount</span>
                        <span className="text-xl font-black text-charcoal">₹{(bill.pricing?.totalAmount / 100).toLocaleString()}</span>
                     </div>
                     
                     <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleReprint(bill)}
                          className="w-12 h-12 rounded-2xl bg-light-bg text-text-muted hover:bg-premium-gold hover:text-charcoal transition-all flex items-center justify-center shadow-sm"
                          title="Reprint"
                        >
                          <Printer size={18} />
                        </button>
                        <button 
                          onClick={() => voidMutation.mutate(bill._id)}
                          disabled={bill.status === 'voided' || voidMutation.isPending}
                          className="w-12 h-12 rounded-2xl bg-white text-text-muted hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center border border-border-light/50 shadow-sm disabled:opacity-30"
                          title="Void Bill"
                        >
                          <Trash2 size={18} />
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.pages > 1 && (
        <div className="bg-white p-4 sm:p-6 border-t border-border-light flex items-center justify-center gap-8">
           <button 
             disabled={page === 1}
             onClick={() => setPage(p => p - 1)}
             className="w-12 h-12 rounded-full border border-border-light flex items-center justify-center text-text-muted hover:bg-light-bg disabled:opacity-30 transition-all"
           >
             <ChevronLeft size={20} />
           </button>
           <span className="text-xs font-black uppercase tracking-widest">Page {page} of {data.pages}</span>
           <button 
             disabled={page === data.pages}
             onClick={() => setPage(p => p + 1)}
             className="w-12 h-12 rounded-full border border-border-light flex items-center justify-center text-text-muted hover:bg-light-bg disabled:opacity-30 transition-all"
           >
             <ChevronRight size={20} />
           </button>
        </div>
      )}
    </div>
  );
}
