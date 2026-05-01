import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2, X, Save, AlertTriangle, Trash2, History, Package, ClipboardList } from 'lucide-react';
import { inventoryService, adminService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function AdminWastage() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({ quantity: '', reason: 'defect', notes: '' });
  
  const queryClient = useQueryClient();

  const { data: inventory, isLoading: isLoadingInv } = useQuery({
    queryKey: ['admin-inventory-search', search],
    queryFn: () => inventoryService.getInventory({ search }).then(r => r.data.data),
    enabled: search.length > 2
  });

  const { data: wastageHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['wastage-history'],
    queryFn: () => adminService.getWastageHistory().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminService.createWastage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wastage-history'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Wastage logged and stock updated');
      setShowForm(false);
      setSelectedItem(null);
      setForm({ quantity: '', reason: 'defect', notes: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to log wastage'),
  });

  return (
    <div className="space-y-6 pb-20">
      <Helmet><title>Wastage & Damage Log — Admin</title></Helmet>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[3rem] border border-border-light shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-charcoal tracking-tight uppercase">Wastage & Damage</h1>
          <p className="text-text-muted text-sm font-medium tracking-tight">Track stock loss due to stains, defects or missing items</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-xl shadow-red-200">
          <Trash2 size={16} /> Log New Wastage
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* History List */}
        <div className="lg:col-span-2 space-y-4">
           <h3 className="text-xs font-black text-charcoal uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
              <History size={16} className="text-premium-gold" /> Recent Loss Records
           </h3>
           
           <div className="bg-white rounded-[3rem] border border-border-light overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-light-bg/50 border-b border-border-light">
                          {['Item Details', 'Qty', 'Loss Value', 'Reason', 'Date'].map(h => (
                             <th key={h} className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-widest">{h}</th>
                          ))}
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light/40">
                       {isLoadingHistory ? (
                          <tr><td colSpan="5" className="py-20 text-center"><Loader2 className="animate-spin text-premium-gold mx-auto" size={32} /></td></tr>
                       ) : wastageHistory?.length === 0 ? (
                          <tr><td colSpan="5" className="py-20 text-center text-xs font-bold text-text-muted uppercase tracking-widest opacity-40">No wastage records found</td></tr>
                       ) : wastageHistory?.map(w => (
                          <tr key={w._id} className="hover:bg-red-50/20 transition-all">
                             <td className="px-8 py-6">
                                <div className="font-black text-charcoal text-sm">{w.productName}</div>
                                <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">{w.color} / {w.size}</div>
                             </td>
                             <td className="px-8 py-6 font-black text-red-600 text-sm">-{w.quantity}</td>
                             <td className="px-8 py-6 font-black text-charcoal text-sm">{formatCurrency(w.lossAmount)}</td>
                             <td className="px-8 py-6">
                                <span className="px-3 py-1 bg-gray-100 text-charcoal text-[9px] font-black uppercase tracking-widest rounded-full">{w.reason}</span>
                             </td>
                             <td className="px-8 py-6 text-[10px] font-bold text-text-muted uppercase">
                                {new Date(w.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        {/* Stats / Info */}
        <div className="space-y-6">
           <div className="bg-charcoal text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                 <ClipboardList size={40} className="text-premium-gold mb-6" />
                 <h3 className="text-xl font-black uppercase tracking-tight mb-2">Audit Notice</h3>
                 <p className="text-xs text-white/60 font-medium leading-relaxed">
                    Recording wastage reduces **Available Stock** and increases the **Damage Counter** in inventory. This loss is deducted from **Gross Profit** calculations.
                 </p>
              </div>
              <div className="absolute -right-10 -bottom-10 opacity-10">
                 <Trash2 size={200} />
              </div>
           </div>
           
           <div className="bg-red-50 border border-red-100 p-8 rounded-[3rem]">
              <h4 className="text-[10px] font-black text-red-800 uppercase tracking-widest mb-4">Common Loss Types</h4>
              <ul className="space-y-3">
                 {[
                   { label: 'Stain', desc: 'Fabric marks from trial or handling' },
                   { label: 'Missing', desc: 'Stock mismatch during physical audit' },
                   { label: 'Defect', desc: 'Manufacturing faults found later' },
                   { label: 'Trial Damage', desc: 'Zip or stitching issues from trials' }
                 ].map((t, i) => (
                   <li key={i} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                      <div>
                         <p className="text-xs font-black text-red-900 leading-none">{t.label}</p>
                         <p className="text-[10px] text-red-700/60 font-medium mt-1">{t.desc}</p>
                      </div>
                   </li>
                 ))}
              </ul>
           </div>
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" onClick={() => setShowForm(false)} />
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl p-12 border border-border-light max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-10 shrink-0">
                   <div>
                      <h2 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Log Stock Loss</h2>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Deducting from physical inventory</p>
                   </div>
                   <button onClick={() => setShowForm(false)} className="p-4 hover:bg-light-bg rounded-full text-text-muted transition-all"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
                   {/* Step 1: Find Item */}
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2">1. Locate Stock SKU</label>
                      <div className="relative">
                         <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                         <input 
                           className="w-full bg-light-bg border-none rounded-2xl pl-16 pr-6 py-5 font-black text-sm focus:ring-2 focus:ring-premium-gold/30" 
                           placeholder="Type product name, color or size (min 3 chars)..." 
                           value={search} 
                           onChange={e => setSearch(e.target.value)} 
                         />
                      </div>
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                         {isLoadingInv ? <div className="text-center py-4"><Loader2 className="animate-spin mx-auto text-premium-gold" size={20} /></div> : 
                          inventory?.map(item => (
                            <button 
                              key={item._id} 
                              onClick={() => setSelectedItem(item)}
                              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${selectedItem?._id === item._id ? 'border-premium-gold bg-gold-soft/10 ring-2 ring-premium-gold/20' : 'border-border-light hover:border-premium-gold/40'}`}
                            >
                               <div>
                                  <div className="text-xs font-black text-charcoal">{item.productName}</div>
                                  <div className="text-[9px] text-text-muted font-bold uppercase tracking-widest">{item.color} • {item.size}</div>
                               </div>
                               <div className="text-right">
                                  <div className="text-xs font-black text-charcoal">{item.availableStock} pcs</div>
                                  <div className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Available</div>
                               </div>
                            </button>
                          ))
                         }
                      </div>
                   </div>

                   {/* Step 2: Form */}
                   {selectedItem && (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pt-6 border-t border-border-light">
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2">Loss Quantity</label>
                              <input 
                                type="number" 
                                className="w-full bg-light-bg border-none rounded-2xl px-6 py-5 font-black text-xl focus:ring-2 focus:ring-premium-gold/30" 
                                placeholder="0" 
                                value={form.quantity}
                                onChange={e => setForm({...form, quantity: e.target.value})}
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2">Reason Type</label>
                              <select 
                                className="w-full bg-light-bg border-none rounded-2xl px-6 py-5 font-black text-sm focus:ring-2 focus:ring-premium-gold/30 appearance-none cursor-pointer"
                                value={form.reason}
                                onChange={e => setForm({...form, reason: e.target.value})}
                              >
                                 <option value="defect">Defect (Factory)</option>
                                 <option value="stain">Stain (Trial/Handling)</option>
                                 <option value="missing">Missing Stock</option>
                                 <option value="trial_damage">Trial Damage (Zip/Thread)</option>
                                 <option value="other">Other</option>
                              </select>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2">Audit Notes</label>
                           <textarea 
                             rows={3} 
                             className="w-full bg-light-bg border-none rounded-[2rem] px-6 py-6 font-medium text-sm focus:ring-2 focus:ring-premium-gold/30 resize-none" 
                             placeholder="Provide specific details about the damage..." 
                             value={form.notes}
                             onChange={e => setForm({...form, notes: e.target.value})}
                           />
                        </div>
                        
                        <button 
                          onClick={() => createMutation.mutate({ inventoryId: selectedItem._id, ...form })}
                          disabled={createMutation.isPending || !form.quantity || !form.notes}
                          className="w-full bg-red-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-3"
                        >
                           {createMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <><Trash2 size={20} /> Authorize Stock Deduction</>}
                        </button>
                     </motion.div>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
