import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Globe, Store, Save, Loader2, Info, Image as ImageIcon, 
  Search, Plus, Trash2, ArrowRight, IndianRupee, Layout, 
  BarChart2, Zap, Shield, HelpCircle, CheckCircle2, ChevronRight
} from 'lucide-react';
import { inventoryService, adminService, productService } from '../../services';
import { toast } from 'react-hot-toast';

export default function AdminSalesChannels({ item, onClose, onRefresh }) {
  const [activeTab, setActiveTab] = useState('online');
  const [isSaving, setIsSaving] = useState(false);
  
  // Inventory state (Channel specific)
  const [invData, setInvData] = useState({
    onlineEnabled: item.onlineEnabled ?? true,
    onlineAllocatedStock: item.onlineAllocatedStock ?? 0,
    offlineEnabled: item.offlineEnabled ?? true,
    offlineAllocatedStock: item.offlineAllocatedStock ?? 0,
    posDisplayName: item.posDisplayName || item.productName,
    posCategory: item.posCategory || item.category,
    isDiscountAllowed: item.isDiscountAllowed ?? true,
    maxDiscountPercent: item.maxDiscountPercent ?? 100,
    sellingPrice: item.sellingPrice ?? 0,
  });

  // Product state (Shared/Online merchandising)
  const [prodData, setProdData] = useState({
    name: '', description: '', shortDescription: '', images: [], 
    category: '', subcategory: '', brand: '', tags: [], 
    sellingPrice: 0, discountPercentage: 0,
    isFeatured: false, isBestSeller: false, isNewArrival: true, isActive: true,
    codEnabled: true, isReturnable: true, deliveryEstimate: '3-5 business days',
    seo: { metaTitle: '', metaDescription: '', keywords: [] }
  });

  const availableStock = item.availableStock || 0;
  const allocatedTotal = Number(invData.onlineAllocatedStock) + Number(invData.offlineAllocatedStock);
  const remainingStock = Math.max(0, availableStock - allocatedTotal);

  useEffect(() => {
    if (item.productRef) {
      // If linked to a product, fetch product details
      const pId = typeof item.productRef === 'object' ? item.productRef._id : item.productRef;
      productService.getProduct(pId).then(res => {
         setProdData(prev => ({ ...prev, ...res.data.data.product }));
      }).catch(() => {
         // Fallback if product not found or other error
         setProdData(prev => ({ ...prev, name: item.productName, sellingPrice: item.sellingPrice }));
      });
    } else {
       // Default if no productRef
       setProdData(prev => ({ ...prev, name: item.productName, sellingPrice: item.sellingPrice }));
    }
  }, [item]);

  const handleSave = async () => {
    if (allocatedTotal > availableStock) {
      return toast.error(`Total allocation exceeds available stock (${availableStock})`);
    }

    setIsSaving(true);
    try {
      // 1. Update Inventory Channel Config
      await inventoryService.updateChannelConfig(item._id, invData);
      
      // 2. If we modified product-level data, update product
      if (item.productRef) {
        const pId = typeof item.productRef === 'object' ? item.productRef._id : item.productRef;
        await productService.updateProduct(pId, prodData);
      }

      toast.success('Sales channels updated');
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const copyFromInventory = () => {
    setProdData(prev => ({
      ...prev,
      name: item.productName,
      sellingPrice: item.sellingPrice,
      category: item.category
    }));
    toast.success('Copied from inventory record');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/60 backdrop-blur-xl" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-6xl h-[90vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-border-light"
      >
        {/* Header Section */}
        <div className="p-8 md:p-12 border-b border-border-light bg-light-bg/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
             <div className="w-20 h-24 bg-white rounded-2xl overflow-hidden border border-border-light shadow-sm hidden sm:block">
                <img src={prodData.images?.[0] || '/placeholder.jpg'} alt="" className="w-full h-full object-cover" />
             </div>
             <div>
                <h2 className="text-3xl font-black text-charcoal tracking-tighter uppercase">{item.productName}</h2>
                <div className="flex items-center gap-3 mt-1">
                   <span className="text-[10px] font-black bg-charcoal text-white px-3 py-1 rounded-full uppercase tracking-widest">{item.sku || 'SKU-NONE'}</span>
                   <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{item.size} / {item.color}</span>
                </div>
             </div>
          </div>

          {/* Stock Meter */}
          <div className="bg-white p-6 rounded-3xl border border-border-light shadow-sm min-w-[280px]">
             <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Master Stock</p>
                <p className="text-lg font-black text-charcoal">{availableStock} Units</p>
             </div>
             <div className="w-full h-2.5 bg-light-bg rounded-full overflow-hidden flex">
                <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(invData.onlineAllocatedStock / availableStock) * 100}%` }} title="Online" />
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(invData.offlineAllocatedStock / availableStock) * 100}%` }} title="Offline" />
             </div>
             <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-indigo-500" />
                   <span className="text-[9px] font-bold text-text-muted uppercase tracking-tight">Online: {invData.onlineAllocatedStock}</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   <span className="text-[9px] font-bold text-text-muted uppercase tracking-tight">POS: {invData.offlineAllocatedStock}</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-gray-200" />
                   <span className="text-[9px] font-bold text-text-muted uppercase tracking-tight">Free: {remainingStock}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-12 py-6 bg-white border-b border-border-light flex items-center gap-2 overflow-x-auto no-scrollbar">
           <button 
             onClick={() => setActiveTab('online')} 
             className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === 'online' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'text-text-muted hover:bg-light-bg'}`}
           >
              <Globe size={16} /> Online Channel
           </button>
           <button 
             onClick={() => setActiveTab('offline')} 
             className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === 'offline' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200' : 'text-text-muted hover:bg-light-bg'}`}
           >
              <Store size={16} /> POS Channel
           </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white">
           <AnimatePresence mode="wait">
              {activeTab === 'online' ? (
                <motion.div key="online" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-12">
                   <div className="grid lg:grid-cols-3 gap-12">
                      {/* Left: General Info */}
                      <div className="lg:col-span-2 space-y-8">
                         <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-charcoal tracking-tight uppercase flex items-center gap-3">
                               <Layout size={20} className="text-indigo-600" /> Web Merchandising
                            </h3>
                            <button onClick={copyFromInventory} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-2">
                               <Zap size={14} /> Sync from Inventory
                            </button>
                         </div>

                         <div className="space-y-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Website Listing Title</label>
                               <input className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 font-bold text-sm" value={prodData.name} onChange={e => setProdData({...prodData, name: e.target.value})} placeholder="e.g. Luxury Magizhchi Silk Blend Shirt" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Category</label>
                                  <input className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 font-black text-xs uppercase" value={prodData.category} onChange={e => setProdData({...prodData, category: e.target.value})} />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Brand</label>
                                  <input className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 font-black text-xs uppercase" value={prodData.brand} onChange={e => setProdData({...prodData, brand: e.target.value})} />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Narrative (Description)</label>
                               <textarea rows="6" className="w-full bg-light-bg border-none rounded-3xl px-6 py-6 font-medium text-sm resize-none" value={prodData.description} onChange={e => setProdData({...prodData, description: e.target.value})} placeholder="Craft the story of this product..." />
                            </div>
                         </div>
                      </div>

                      {/* Right: Online Allocation & Price */}
                      <div className="space-y-8 bg-light-bg/50 p-8 rounded-[3rem] border border-border-light">
                         <div className="space-y-6">
                            <div className="flex items-center justify-between">
                               <h4 className="text-xs font-black text-charcoal uppercase tracking-widest">Active Status</h4>
                               <div onClick={() => setInvData({...invData, onlineEnabled: !invData.onlineEnabled})} className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${invData.onlineEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${invData.onlineEnabled ? 'left-7' : 'left-1'}`} />
                               </div>
                            </div>

                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Stock Allocation</label>
                               <div className="relative">
                                  <input type="number" className="w-full bg-white rounded-2xl px-6 py-4 font-black text-xl border border-border-light" value={invData.onlineAllocatedStock} onChange={e => setInvData({...invData, onlineAllocatedStock: Number(e.target.value)})} />
                                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted uppercase">Units</span>
                               </div>
                               <p className="text-[9px] font-bold text-text-muted italic ml-1">Limit web visibility to this quantity</p>
                            </div>

                            <div className="space-y-2 pt-4">
                               <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Web Selling Price (₹)</label>
                               <div className="relative">
                                  <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                  <input type="number" className="w-full bg-white rounded-2xl px-12 py-4 font-black text-xl border border-border-light" value={prodData.sellingPrice} onChange={e => setProdData({...prodData, sellingPrice: Number(e.target.value)})} />
                               </div>
                            </div>
                         </div>

                         <div className="space-y-4 pt-6 border-t border-border-light/50">
                            {[
                               { key: 'codEnabled', label: 'Cash on Delivery', icon: Shield },
                               { key: 'isReturnable', label: 'Return Eligible', icon: HelpCircle },
                               { key: 'isFeatured', label: 'Featured Product', icon: Zap }
                            ].map(policy => (
                               <label key={policy.key} className="flex items-center justify-between cursor-pointer group">
                                  <div className="flex items-center gap-3">
                                     <policy.icon size={14} className="text-text-muted group-hover:text-indigo-600 transition-colors" />
                                     <span className="text-[10px] font-black text-charcoal uppercase tracking-widest">{policy.label}</span>
                                  </div>
                                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={prodData[policy.key]} onChange={e => setProdData({...prodData, [policy.key]: e.target.checked})} />
                               </label>
                            ))}
                         </div>
                      </div>
                   </div>

                   {/* SEO & Meta */}
                   <div className="bg-light-bg/30 p-10 rounded-[3.5rem] border border-border-light border-dashed">
                      <h4 className="text-xs font-black text-charcoal uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                         <BarChart2 size={18} className="text-indigo-600" /> Search Engine Optimization
                      </h4>
                      <div className="grid md:grid-cols-2 gap-10">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">SEO Title</label>
                            <input className="w-full bg-white border border-border-light rounded-2xl px-6 py-4 font-bold text-sm" value={prodData.seo.metaTitle} onChange={e => setProdData({...prodData, seo: {...prodData.seo, metaTitle: e.target.value}})} placeholder="Meta Title for Google" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Meta Description</label>
                            <textarea rows="3" className="w-full bg-white border border-border-light rounded-2xl px-6 py-4 font-medium text-sm resize-none" value={prodData.seo.metaDescription} onChange={e => setProdData({...prodData, seo: {...prodData.seo, metaDescription: e.target.value}})} placeholder="A brief summary for search results..." />
                         </div>
                      </div>
                   </div>
                </motion.div>
              ) : (
                <motion.div key="offline" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                   <div className="grid lg:grid-cols-3 gap-12">
                      {/* Left: POS Info */}
                      <div className="lg:col-span-2 space-y-10">
                         <div className="flex items-center gap-3">
                            <h3 className="text-xl font-black text-charcoal tracking-tight uppercase flex items-center gap-3">
                               <Store size={20} className="text-emerald-600" /> POS Configuration
                            </h3>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-full tracking-widest">In-Store Control</span>
                         </div>

                         <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">POS Billing Name</label>
                               <input className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 font-black text-sm uppercase" value={invData.posDisplayName} onChange={e => setInvData({...invData, posDisplayName: e.target.value})} placeholder="SHORT NAME FOR BILL" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Quick POS Category</label>
                               <input className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 font-black text-sm uppercase" value={invData.posCategory} onChange={e => setInvData({...invData, posCategory: e.target.value})} placeholder="DEPT" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Inventory SKU / Barcode</label>
                               <div className="flex gap-2">
                                  <input readOnly className="flex-1 bg-light-bg border-none rounded-2xl px-6 py-4 font-black text-sm text-text-muted" value={item.barcode || item.sku} />
                                  <button className="p-4 bg-charcoal text-white rounded-2xl hover:bg-premium-gold transition-colors"><Zap size={18} /></button>
                               </div>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">POS Selling Price (₹)</label>
                               <div className="relative">
                                  <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                  <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-12 py-4 font-black text-xl" value={invData.sellingPrice} onChange={e => setInvData({...invData, sellingPrice: Number(e.target.value)})} />
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Right: Offline Allocation & Discounts */}
                      <div className="space-y-8 bg-light-bg/50 p-8 rounded-[3rem] border border-border-light">
                         <div className="space-y-6">
                            <div className="flex items-center justify-between">
                               <h4 className="text-xs font-black text-charcoal uppercase tracking-widest">POS Availability</h4>
                               <div onClick={() => setInvData({...invData, offlineEnabled: !invData.offlineEnabled})} className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${invData.offlineEnabled ? 'bg-emerald-600' : 'bg-gray-300'}`}>
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${invData.offlineEnabled ? 'left-7' : 'left-1'}`} />
                               </div>
                            </div>

                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">POS Stock Allocation</label>
                               <div className="relative">
                                  <input type="number" className="w-full bg-white rounded-2xl px-6 py-4 font-black text-xl border border-border-light" value={invData.offlineAllocatedStock} onChange={e => setInvData({...invData, offlineAllocatedStock: Number(e.target.value)})} />
                                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted uppercase">Units</span>
                               </div>
                               <p className="text-[9px] font-bold text-text-muted italic ml-1">Limit cashier lookup to this quantity</p>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-border-light/50">
                               <label className="flex items-center justify-between cursor-pointer group">
                                  <span className="text-[10px] font-black text-charcoal uppercase tracking-widest">Allow POS Discount</span>
                                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" checked={invData.isDiscountAllowed} onChange={e => setInvData({...invData, isDiscountAllowed: e.target.checked})} />
                               </label>
                               {invData.isDiscountAllowed && (
                                 <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Max Override %</label>
                                    <input type="number" className="w-full bg-white rounded-xl px-4 py-3 font-black text-sm border border-border-light" value={invData.maxDiscountPercent} onChange={e => setInvData({...invData, maxDiscountPercent: Number(e.target.value)})} />
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-emerald-50/30 p-10 rounded-[3.5rem] border border-emerald-100 border-dashed">
                      <div className="flex items-center gap-6">
                         <div className="p-6 bg-white rounded-[2.5rem] shadow-sm border border-emerald-100">
                            <Store size={40} className="text-emerald-600" />
                         </div>
                         <div>
                            <h4 className="text-xl font-black text-charcoal tracking-tight">Ready for In-Store Display</h4>
                            <p className="text-xs text-text-muted font-medium mt-1">This product is correctly mapped to the POS interface. You can now generate labels and process sales immediately.</p>
                            <button className="mt-4 flex items-center gap-2 px-6 py-3 bg-charcoal text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">
                               <Plus size={14} /> Print Barcode Label
                            </button>
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>

        {/* Footer Section */}
        <div className="p-10 bg-light-bg/80 backdrop-blur-md border-t border-border-light flex items-center justify-between">
           <button onClick={onClose} className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-charcoal transition-colors">Discard Configuration</button>
           <button 
             onClick={handleSave} 
             disabled={isSaving}
             className="bg-charcoal text-white px-16 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-charcoal/30 hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-3 active:scale-95"
           >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Publish to Channels</>}
           </button>
        </div>
      </motion.div>
    </div>
  );
}
