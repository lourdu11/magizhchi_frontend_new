import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2, X, ClipboardCheck, AlertTriangle, ArrowRight, History, Package, RotateCcw, Save } from 'lucide-react';
import { inventoryService, adminService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function AdminAudit() {
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [physicalCount, setPhysicalCount] = useState('');
  const [reason, setReason] = useState('Periodic Audit');
  
  const queryClient = useQueryClient();

  const { data: inventory, isLoading: isLoadingInv } = useQuery({
    queryKey: ['admin-inventory-search', search],
    queryFn: () => inventoryService.getInventory({ search }).then(r => r.data.data),
    enabled: search.length > 2
  });

  const reconcileMutation = useMutation({
    mutationFn: (data) => adminService.reconcileStock(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      toast.success(res.data.message || 'Stock reconciled successfully');
      setSelectedItem(null);
      setPhysicalCount('');
      setSearch('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reconcile stock'),
  });

  const diff = selectedItem ? Number(physicalCount) - selectedItem.availableStock : 0;

  return (
    <div className="space-y-10 pb-20">
      <Helmet><title>Stock Audit & Reconciliation — Admin</title></Helmet>

      {/* Header */}
      <div className="bg-white p-12 rounded-[4rem] border border-border-light shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-charcoal tracking-tight uppercase">Physical Stock Audit</h1>
          <p className="text-text-muted text-sm font-medium tracking-tight mt-2 max-w-xl">
             Compare physical shelf stock with system records and pass adjustment entries to maintain 100% inventory accuracy.
          </p>
        </div>
        <ClipboardCheck className="absolute -right-10 -bottom-10 text-premium-gold/10" size={300} />
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
         {/* Step 1: Selection */}
         <div className="bg-white p-10 rounded-[3rem] border border-border-light shadow-sm space-y-8">
            <div className="flex items-center gap-4 mb-2">
               <div className="w-10 h-10 rounded-2xl bg-gold-soft flex items-center justify-center font-black text-premium-gold">1</div>
               <h3 className="text-xl font-black text-charcoal uppercase tracking-tighter">Locate Item</h3>
            </div>

            <div className="relative">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
               <input 
                 className="w-full bg-light-bg border-none rounded-2xl pl-16 pr-6 py-6 font-black text-sm focus:ring-2 focus:ring-premium-gold/30" 
                 placeholder="Scan barcode or type item name..." 
                 value={search} 
                 onChange={e => setSearch(e.target.value)} 
               />
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               {isLoadingInv ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-premium-gold" size={30} /></div> : 
                inventory?.length === 0 ? <div className="text-center py-10 text-xs font-black text-text-muted uppercase tracking-widest opacity-40">Search for an item to start audit</div> :
                inventory?.map(item => (
                  <button 
                    key={item._id} 
                    onClick={() => setSelectedItem(item)}
                    className={`w-full text-left p-6 rounded-3xl border transition-all flex items-center justify-between group ${selectedItem?._id === item._id ? 'border-premium-gold bg-gold-soft/10 ring-4 ring-premium-gold/5' : 'border-border-light hover:border-premium-gold/40'}`}
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl border border-border-light flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                           <Package size={20} className="text-premium-gold" />
                        </div>
                        <div>
                           <div className="text-sm font-black text-charcoal">{item.productName}</div>
                           <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{item.color} • {item.size}</div>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="text-sm font-black text-charcoal">{item.availableStock}</div>
                        <div className="text-[9px] text-text-muted font-bold uppercase tracking-widest">System Qty</div>
                     </div>
                  </button>
                ))
               }
            </div>
         </div>

         {/* Step 2: Reconciliation */}
         <div className="space-y-8">
            <AnimatePresence mode="wait">
               {selectedItem ? (
                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white p-12 rounded-[3rem] border border-border-light shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-10">
                       <div className="w-10 h-10 rounded-2xl bg-premium-gold flex items-center justify-center font-black text-white">2</div>
                       <h3 className="text-xl font-black text-charcoal uppercase tracking-tighter">Enter Findings</h3>
                    </div>

                    <div className="space-y-10">
                       <div className="grid grid-cols-2 gap-8">
                          <div className="p-8 bg-light-bg/50 rounded-[2.5rem] border border-border-light">
                             <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">System Stock</p>
                             <p className="text-4xl font-black text-charcoal tracking-tighter">{selectedItem.availableStock}</p>
                          </div>
                          <div className="p-8 bg-premium-gold/5 rounded-[2.5rem] border border-premium-gold/20">
                             <p className="text-[10px] font-black text-premium-gold uppercase tracking-widest mb-2">Physical Count</p>
                             <input 
                               type="number" 
                               className="w-full bg-transparent border-none p-0 text-4xl font-black text-charcoal tracking-tighter focus:ring-0 placeholder:text-charcoal/10"
                               placeholder="0"
                               value={physicalCount}
                               onChange={e => setPhysicalCount(e.target.value)}
                               autoFocus
                             />
                          </div>
                       </div>

                       {physicalCount !== '' && (
                         <div className={`p-8 rounded-[2.5rem] flex items-center justify-between border ${diff === 0 ? 'bg-green-50 border-green-100 text-green-800' : diff > 0 ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Adjustment Required</p>
                               <p className="text-xl font-black tracking-tight">{diff > 0 ? `+${diff}` : diff} Units</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</p>
                               <p className="text-xs font-black uppercase tracking-widest">{diff === 0 ? 'Matched Perfectly' : diff > 0 ? 'Surplus Found' : 'Shortage Found'}</p>
                            </div>
                         </div>
                       )}

                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2">Audit Reason</label>
                          <input 
                            className="w-full bg-light-bg border-none rounded-2xl px-6 py-5 font-black text-xs focus:ring-2 focus:ring-premium-gold/30" 
                            placeholder="e.g. Monthly Audit, Shelf Clearance..." 
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                          />
                       </div>

                       <div className="pt-4 grid grid-cols-2 gap-4">
                          <button onClick={() => setSelectedItem(null)} className="py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest text-text-muted bg-light-bg hover:bg-border-light transition-all">Cancel</button>
                          <button 
                            disabled={reconcileMutation.isPending || physicalCount === ''}
                            onClick={() => reconcileMutation.mutate({ inventoryId: selectedItem._id, physicalCount: Number(physicalCount), reason })}
                            className="py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] text-white bg-charcoal shadow-2xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center justify-center gap-3"
                          >
                             {reconcileMutation.isPending ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Pass Adjustment</>}
                          </button>
                       </div>
                    </div>
                 </motion.div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center p-20 bg-light-bg/30 rounded-[3rem] border-2 border-dashed border-border-light text-center">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm mb-6 text-text-muted/30">
                       <RotateCcw size={32} />
                    </div>
                    <p className="text-xs font-black text-text-muted uppercase tracking-widest max-w-[200px] leading-relaxed">
                       Select an item from the left to begin reconciliation
                    </p>
                 </div>
               )}
            </AnimatePresence>

            {/* Audit History / Tips */}
            <div className="bg-charcoal text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                  <AlertTriangle className="text-premium-gold mb-6" size={32} />
                  <h4 className="text-xl font-black uppercase tracking-tight mb-2">Audit Business Rules</h4>
                  <ul className="space-y-4">
                     <li className="flex gap-3">
                        <div className="w-1 h-1 rounded-full bg-premium-gold mt-1.5 shrink-0" />
                        <p className="text-[10px] font-medium text-white/60 leading-relaxed">Reconciliation updates **Total Stock** to ensure **Available Stock** matches physical findings.</p>
                     </li>
                     <li className="flex gap-3">
                        <div className="w-1 h-1 rounded-full bg-premium-gold mt-1.5 shrink-0" />
                        <p className="text-[10px] font-medium text-white/60 leading-relaxed">Every adjustment creates a **Stock Movement Log** for full audit traceability.</p>
                     </li>
                     <li className="flex gap-3">
                        <div className="w-1 h-1 rounded-full bg-premium-gold mt-1.5 shrink-0" />
                        <p className="text-[10px] font-medium text-white/60 leading-relaxed">Profit calculations are NOT retroactively affected, only future stock availability.</p>
                     </li>
                  </ul>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
