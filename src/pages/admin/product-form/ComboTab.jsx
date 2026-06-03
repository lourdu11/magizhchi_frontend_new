import { useState, useEffect } from 'react';
import { useProductForm } from './FormContext';
import { SectionHeader } from './Common';
import { X, Plus, PlusCircle, Save, ChevronDown, Search, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../../../services';
import { toast } from 'react-hot-toast';
import SafeImage from '../../../components/common/SafeImage';
import api from '../../../services/api';

export default function ComboTab({ onCommit, onCancel }) {
  const { state, dispatch } = useProductForm();
  const { formData } = state;

  const setFormData = (payload) => dispatch({ type: 'SET_FORM_DATA', payload });

  return (
    <div className="space-y-12">
      <ComboOrchestrator 
        comboSlots={formData.comboSlots} 
        comboVariants={formData.comboVariants}
        onUpdate={(slots, variants) => setFormData({ comboSlots: slots, comboVariants: variants })} 
        onCancel={onCancel}
        onCommit={onCommit}
      />
    </div>
  );
}

function ComboOrchestrator({ comboSlots, comboVariants, onUpdate, onCancel, onCommit }) {
   const { state, dispatch } = useProductForm();
   const { formData } = state;
   const setFormData = (payload) => dispatch({ type: 'SET_FORM_DATA', payload });
   const [searchQuery, setSearchQuery] = useState('');
   const [searchResults, setSearchResults] = useState([]);
   const [isSearching, setIsSearching] = useState(false);
   const [activeSlotId, setActiveSlotId] = useState(null);
   const [slotInputs, setSlotInputs] = useState({});

   const getAddLabel = (slotName) => {
      const lower = (slotName || '').toLowerCase();
      if (lower.includes('top') || lower.includes('shirt')) return 'Shirt';
      if (lower.includes('bottom') || lower.includes('pant')) return 'Pant';
      return 'Product';
   };

   useEffect(() => {
      const timer = setTimeout(async () => {
         if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
         }
         setIsSearching(true);
         try {
            const res = await adminService.getAdminProducts({ search: searchQuery, limit: 10 });
            // API shape: { success, data: { data: [...products], stats, ... } }
            const products = res.data?.data?.data || res.data?.data || [];
            setSearchResults(Array.isArray(products) ? products : []);
         } catch (e) {
            console.error('Combo Search Error:', e);
            setSearchResults([]);
         } finally {
            setIsSearching(false);
         }
      }, 500);
      return () => clearTimeout(timer);
   }, [searchQuery]);

   const addProductToSlot = async (slotId, product) => {
      try {
         const res = await api.get(`/products/pos/${product._id}/variants`);
         const variants = res.data?.data?.variants || [];
         
         const updatedSlots = comboSlots.map(slot => {
            if (slot.id !== slotId) return slot;
            const prodWithSync = { ...product, syncedVariants: variants };
            return { ...slot, products: [prodWithSync] }; 
         });
         onUpdate(updatedSlots, comboVariants);
      } catch (e) {
         console.error('Failed to fetch live variants:', e);
         const updatedSlots = comboSlots.map(slot => {
            if (slot.id !== slotId) return slot;
            const prodWithSync = { ...product, syncedVariants: product.syncedVariants || [] };
            return { ...slot, products: [prodWithSync] }; 
         });
         onUpdate(updatedSlots, comboVariants);
      }
      setSearchQuery('');
      setSearchResults([]);
      setActiveSlotId(null);
   };

   const removeProductFromSlot = (slotId) => {
      const updatedSlots = comboSlots.map(slot => {
         if (slot.id !== slotId) return slot;
         return { ...slot, products: [] };
      });
      onUpdate(updatedSlots, comboVariants);
   };

   const handleAddVariant = (slotId) => {
      const input = slotInputs[slotId] || {};
      if (!input.size || !input.color) return toast.error('Size and Color are required');
      
      const updatedSlots = comboSlots.map(slot => {
         if (slot.id !== slotId) return slot;
         const product = slot.products[0];
         if (!product) return slot;
         
         const sourceVariant = (product.variants || product.syncedVariants || []).find(v => v.size === input.size && v.color?.toLowerCase() === input.color?.toLowerCase());
         
         const newVariant = {
            id: `v-${Date.now()}`,
            size: input.size,
            color: input.color,
            available: sourceVariant?.liveStock?.availableStock ?? sourceVariant?.availableStock ?? sourceVariant?.available ?? sourceVariant?.qty ?? 0,
            qty: input.qty ? parseInt(input.qty) : (sourceVariant?.liveStock?.availableStock ?? sourceVariant?.availableStock ?? sourceVariant?.available ?? sourceVariant?.qty ?? 0)
         };
         
         const updatedProduct = {
            ...product,
            syncedVariants: [...(product.syncedVariants || []), newVariant]
         };
         
         return { ...slot, products: [updatedProduct] };
      });
      
      onUpdate(updatedSlots, comboVariants);
      setSlotInputs({ ...slotInputs, [slotId]: { ...input, size: '', color: '', qty: 0 } });
      toast.success('Variant added to catalog');
   };

   const totalVariants = comboSlots.reduce((acc, slot) => acc + (slot.products[0]?.syncedVariants?.length || 0), 0);
   const progress = Math.min(100, (totalVariants / 10) * 100); 

   return (
      <div className="space-y-16">
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-12 rounded-[3.5rem] border border-border-light shadow-sm">
            <div className="space-y-1">
               <div className="flex items-center flex-wrap gap-4">
                  <h2 className="text-4xl font-black text-charcoal uppercase tracking-tighter">Combo Orchestration</h2>
                  <div className="px-5 py-1.5 bg-charcoal text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Draft</div>
               </div>
               <p className="text-[13px] text-text-muted font-bold uppercase tracking-widest opacity-60 mt-1">Bundle multiple products into a single offer</p>
            </div>
            <button onClick={onCancel} className="px-10 py-5 bg-white border border-border-light text-charcoal rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-sm hover:bg-red-50 hover:text-red-500 transition-all flex items-center gap-4 group">
               <X size={20} className="group-hover:scale-110 transition-transform" /> Cancel Entry
            </button>
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
            {comboSlots.map((slot, idx) => {
               const product = slot.products[0];
               const isDisabled = idx > 0 && comboSlots[0].products.length === 0; 
               const input = slotInputs[slot.id] || { size: '', color: '', qty: 0 };
               
               return (
                  <div key={slot.id} className={`space-y-8 transition-all duration-700 ${isDisabled ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
                     <div className="flex items-center justify-between px-4 sm:px-4 sm:px-6">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-full bg-charcoal text-white flex items-center justify-center font-black text-sm shadow-xl">
                              {idx + 1}
                           </div>
                           <input 
                              className="text-[15px] font-black text-charcoal uppercase tracking-[0.3em] bg-transparent border-none focus:ring-0 w-full"
                              value={slot.name}
                              onChange={e => {
                                 const updatedSlots = comboSlots.map(s => s.id === slot.id ? { ...s, name: e.target.value } : s);
                                 onUpdate(updatedSlots, comboVariants);
                              }}
                           />
                        </div>
                        <span className="px-4 sm:px-4 sm:px-6 py-2 bg-[#F8F1DE] text-[#D4AF37] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#D4AF37]/20">Target Slot</span>
                     </div>

                     <div className="bg-white p-12 rounded-[4rem] border border-border-light shadow-[0_20px_50px_-10px_rgba(0,0,0,0.05)] space-y-12">
                        {product ? (
                           <div className="space-y-12">
                              <div className="flex items-center justify-between bg-light-bg/30 p-4 md:p-4 md:p-8 rounded-[2.5rem] border border-border-light/50">
                                 <div className="flex items-center gap-8">
                                    <div className="w-20 h-20 bg-white rounded-2xl overflow-hidden border border-border-light shadow-inner p-2">
                                       <SafeImage src={product.thumbnail} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="space-y-2">
                                       <h4 className="text-[18px] font-black text-charcoal uppercase tracking-tight">{product.name}</h4>
                                       <div className="flex items-center flex-wrap gap-3">
                                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">{product.syncedVariants?.length || 0} Variants Synchronized</span>
                                       </div>
                                    </div>
                                 </div>
                                 <button onClick={() => removeProductFromSlot(slot.id)} className="w-12 h-12 rounded-full bg-white text-text-muted hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center border border-border-light/50 shadow-sm">
                                    <X size={18} />
                                 </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                 <div className="space-y-4">
                                    <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-2 block text-center">Size Option</label>
                                    <div className="relative">
                                       <select 
                                          className="w-full bg-white border border-border-light rounded-2xl px-4 py-7 font-black text-[16px] uppercase outline-none focus:ring-4 focus:ring-charcoal/5 shadow-sm appearance-none cursor-pointer text-center"
                                          value={input.size}
                                          onChange={e => setSlotInputs({...slotInputs, [slot.id]: {...input, size: e.target.value}})}
                                       >
                                          <option value="">SELECT...</option>
                                          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => <option key={s} value={s}>{s}</option>)}
                                       </select>
                                       <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-charcoal/30"><ChevronDown size={18} /></div>
                                    </div>
                                 </div>
                                 <div className="space-y-4">
                                    <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-2 block text-center">Color Shade</label>
                                    <input 
                                       className="w-full bg-white border border-border-light rounded-2xl px-4 py-7 font-black text-[16px] uppercase outline-none focus:ring-4 focus:ring-charcoal/5 shadow-sm placeholder:text-text-muted/30 text-center" 
                                       placeholder="E.G. RED"
                                       value={input.color}
                                       onChange={e => setSlotInputs({...slotInputs, [slot.id]: {...input, color: e.target.value}})}
                                    />
                                 </div>
                                 <div className="space-y-4">
                                    <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-2 block text-center">Allocated Stock</label>
                                    <input 
                                       type="number"
                                       className="w-full bg-light-bg/50 border border-border-light rounded-2xl px-4 py-7 font-black text-[16px] text-center text-charcoal shadow-inner outline-none focus:ring-4 focus:ring-charcoal/5 placeholder:text-text-muted/30"
                                       placeholder={(() => {
                                           const product = slot.products[0];
                                           const variant = (product?.variants || product?.syncedVariants || []).find(v => v.size === input.size && v.color?.toLowerCase().trim() === input.color?.toLowerCase().trim());
                                           const available = variant?.liveStock?.availableStock ?? variant?.availableStock ?? variant?.available ?? variant?.qty ?? 0;
                                           return variant ? `MAX: ${available}` : '---';
                                       })()}
                                       value={input.qty || ''}
                                       onChange={e => setSlotInputs({...slotInputs, [slot.id]: {...input, qty: e.target.value}})}
                                    />
                                 </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 min-h-[54px] bg-light-bg/20 p-4 sm:p-4 sm:p-6 rounded-[2rem] border-2 border-dashed border-border-light/50">
                                 <AnimatePresence>
                                    {product.syncedVariants?.map((v, vIdx) => (
                                       <motion.div 
                                          initial={{ scale: 0.5, opacity: 0 }} 
                                          animate={{ scale: 1, opacity: 1 }} 
                                          key={v.id} 
                                          className="px-4 sm:px-4 sm:px-6 py-2.5 bg-charcoal text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 shadow-lg"
                                       >
                                          <span className="flex items-center gap-2">
                                             {v.size} — {v.color}
                                             <span className="opacity-50">|</span>
                                             <span className="text-premium-gold">{v.qty ?? v.available ?? v.availableStock ?? v.liveStock?.availableStock ?? 0} PCS</span>
                                          </span>
                                          <button onClick={() => {
                                             const updatedSlots = comboSlots.map(s => {
                                                if (s.id !== slot.id) return s;
                                                return { ...s, products: [{ ...product, syncedVariants: product.syncedVariants.filter((_, i) => i !== vIdx) }] };
                                             });
                                             onUpdate(updatedSlots, comboVariants);
                                          }}><X size={12} /></button>
                                       </motion.div>
                                    ))}
                                 </AnimatePresence>
                              </div>

                              <button 
                                 onClick={() => handleAddVariant(slot.id)}
                                 className="w-full h-[84px] bg-charcoal text-white rounded-[2.5rem] text-[14px] font-black uppercase tracking-[0.4em] hover:bg-premium-gold hover:text-charcoal transition-all shadow-xl flex items-center justify-center gap-6 group"
                              >
                                 <PlusCircle size={32} className="group-hover:rotate-180 transition-transform duration-500" />
                                 Sync Variant to Combo
                              </button>
                           </div>
                        ) : (
                           <div className="relative">
                              <button 
                                 onClick={() => setActiveSlotId(slot.id)}
                                 className="w-full py-32 border-4 border-dashed border-border-light rounded-[3.5rem] flex flex-col items-center justify-center gap-8 text-text-muted hover:border-premium-gold hover:text-charcoal hover:bg-premium-gold/5 transition-all group"
                              >
                                 <div className="w-20 h-20 rounded-full bg-light-bg flex items-center justify-center group-hover:bg-premium-gold group-hover:scale-110 transition-all"><Plus size={32} /></div>
                                 <div className="text-center">
                                    <span className="text-sm font-black uppercase tracking-[0.4em] block">Draft {getAddLabel(slot.name)}</span>
                                 </div>
                              </button>

                              {activeSlotId === slot.id && (
                                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-x-0 -bottom-16 z-[100] px-4">
                                    <div className="relative group/search">
                                       <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-premium-gold" size={24} />
                                       <input 
                                          autoFocus
                                          className="w-full bg-white border-4 border-premium-gold rounded-[2.5rem] pl-20 pr-40 py-7 text-[13px] font-black uppercase outline-none shadow-2xl transition-all"
                                          placeholder={`Identify ${getAddLabel(slot.name)}...`}
                                          value={searchQuery}
                                          onChange={e => setSearchQuery(e.target.value)}
                                          onKeyDown={e => {
                                             if (e.key === 'Enter' && searchResults.length > 0) {
                                                e.preventDefault();
                                                addProductToSlot(slot.id, searchResults[0]);
                                             }
                                          }}
                                       />
                                       {searchResults.length > 0 && (
                                          <div className="absolute left-0 right-0 top-full mt-6 bg-white rounded-[3.5rem] shadow-2xl border border-border-light overflow-hidden max-h-[400px] overflow-y-auto">
                                             {searchResults.map(prod => (
                                                <button key={prod._id} onClick={() => addProductToSlot(slot.id, prod)} className="w-full flex items-center gap-8 p-4 md:p-4 md:p-8 hover:bg-light-bg transition-all border-b border-border-light last:border-none group/item">
                                                   <div className="w-16 h-16 rounded-2xl bg-light-bg shrink-0 overflow-hidden border border-border-light group-hover/item:border-premium-gold transition-all">
                                                      <SafeImage src={prod.thumbnail} className="w-full h-full object-contain" />
                                                   </div>
                                                   <div className="flex-1 min-w-0">
                                                      <p className="text-[12px] font-black text-charcoal truncate uppercase">{prod.name}</p>
                                                      <div className="mt-3 flex flex-wrap gap-2">
                                                         {prod.syncedVariants?.map(v => (
                                                            <div key={v.id} className="px-3 py-1 bg-white rounded-lg border border-border-light flex items-center gap-2">
                                                               <span className="text-[9px] font-black text-charcoal">{v.size}</span>
                                                               <div className="w-px h-2 bg-border-light" />
                                                               <span className="text-[9px] font-black text-text-muted">{v.color}</span>
                                                               <div className="w-px h-2 bg-border-light" />
                                                               <span className="text-[9px] font-black text-premium-gold">{v.liveStock?.availableStock ?? v.availableStock ?? v.qty ?? 0} PCS</span>
                                                            </div>
                                                         ))}
                                                         {(!prod.syncedVariants || prod.syncedVariants.length === 0) && (
                                                            <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">No variants added yet</p>
                                                         )}
                                                      </div>
                                                   </div>
                                                   <PlusCircle className="text-premium-gold shrink-0" size={24} />
                                                </button>
                                             ))}
                                          </div>
                                       )}
                                    </div>
                                 </motion.div>
                              )}
                           </div>
                        )}
                     </div>
                  </div>
               );
            })}

            <button 
               onClick={() => onUpdate([...comboSlots, { id: `slot-${Date.now()}`, name: `Choice Tier ${comboSlots.length + 1}`, products: [] }], comboVariants)}
               className="border-4 border-dashed border-border-light rounded-[4.5rem] flex flex-col items-center justify-center gap-8 text-text-muted hover:border-premium-gold hover:text-premium-gold hover:bg-premium-gold/5 transition-all min-h-[600px]"
            >
               <div className="w-24 h-24 rounded-full bg-light-bg flex items-center justify-center"><Plus size={40} /></div>
               <div className="text-center">
                  <span className="text-sm font-black uppercase tracking-[0.5em] block">Add Choice Tier</span>
               </div>
            </button>
         </div>

         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 pt-12 border-t-2 border-border-light/30">
            <div className="flex-1 space-y-6">
               <div className="flex items-center justify-between px-2">
                  <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.4em]">Configuration Progress</p>
                  <span className="text-[11px] font-black text-charcoal uppercase tracking-widest">{Math.round(progress)}%</span>
               </div>
               <div className="w-full h-2 bg-light-bg rounded-full overflow-hidden shadow-inner">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-premium-gold" />
               </div>
            </div>
            <div className="flex items-center gap-8 shrink-0">
               <button onClick={onCancel} className="px-14 py-4 sm:py-4 sm:py-6 bg-white border-2 border-border-light text-text-muted rounded-[2.2rem] text-[12px] font-black uppercase tracking-[0.3em] hover:bg-red-50 hover:text-red-500 transition-all">Discard Draft</button>
               <button onClick={onCommit} className="px-14 py-4 sm:py-4 sm:py-6 bg-charcoal text-white rounded-[2.2rem] text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all flex items-center gap-5">
                  <Save size={22} className="text-premium-gold" /> Commit Master Profile
               </button>
            </div>
         </div>
      </div>
   );
}
