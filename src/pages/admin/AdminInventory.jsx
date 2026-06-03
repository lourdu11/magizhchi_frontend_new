import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2, X, Save, Plus, Globe, ShoppingBag, AlertTriangle, Package, Edit3, CheckCircle2, PlusCircle, History, Trash2, ShoppingCart, Wrench } from 'lucide-react';
import { inventoryService, productService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import SafeImage from '../../components/common/SafeImage';

const calcAvail = (i) => Math.max(0, i.totalStock - i.onlineSold - i.offlineSold - (i.reservedStock || 0) + i.returned - i.damaged);

const StatusBadge = ({ item }) => {
  const avail = calcAvail(item);
  const threshold = item.lowStockThreshold || 5;
  if (avail === 0) return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700">Out of Stock</span>;
  if (avail <= threshold) return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-700">Low Stock</span>;
  return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700">In Stock</span>;
};

export default function AdminInventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ type: 'correction', quantity: '', reason: '' });
  const [editingPrice, setEditingPrice] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [linkItem, setLinkItem] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [historyItem, setHistoryItem] = useState(null);
  const [viewBillImage, setViewBillImage] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const queryClient = useQueryClient();

  const { data: statsData } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => inventoryService.getStats().then(r => r.data?.data || r.data),
  });

  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['admin-inventory', debouncedSearch, page, filterStatus, showArchived],
    queryFn: () => {
      const params = { search: debouncedSearch, page, limit: 25, includeDeleted: showArchived };
      if (filterStatus === 'critical') params.status = 'low_stock';
      if (filterStatus === 'out') params.status = 'out_of_stock';
      if (filterStatus === 'online') params.onlineEnabled = 'true';
      if (filterStatus === 'offline') params.offlineEnabled = 'true';
      return inventoryService.getInventory(params).then(r => r.data);
    },
  });

  // Reset page on search or filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterStatus, showArchived]);

  const { data: searchProducts } = useQuery({
    queryKey: ['product-search-link', productSearch],
    queryFn: () => productService.getProducts({ search: productSearch }).then(r => r.data.data?.data || r.data.data || []),
    enabled: productSearch.length > 2
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['inventory-history', historyItem?._id],
    queryFn: () => inventoryService.getHistory(historyItem._id).then(r => r.data.data),
    enabled: !!historyItem
  });

  const rawItems = Array.isArray(inventoryData?.data) ? inventoryData.data : (Array.isArray(inventoryData) ? inventoryData : []);
  const items = rawItems.map(i => ({ ...i, availableStock: i.availableStock ?? calcAvail(i) }));

  const filtered = items; // Backend already filtered this

  const lowStockItems = items.filter(i => i.availableStock <= (i.lowStockThreshold || 5) && !i.deletedAt);

  const toggleMutation = useMutation({
    mutationFn: ({ id, channel }) => inventoryService.toggleChannel(id, { channel }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] }); 
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      toast.success('Channel updated'); 
    },
  });

  const priceMutation = useMutation({
    mutationFn: ({ id, price }) => inventoryService.updateSellingPrice(id, { sellingPrice: price }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] }); 
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      toast.success('Price updated'); 
      setEditingPrice(null); 
    },
  });

  const restoreMutation = useMutation({
     mutationFn: (id) => inventoryService.restoreInventory(id),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
       toast.success('Inventory variant restored');
     },
     onError: (err) => toast.error(err.response?.data?.message || 'Restore failed'),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, data }) => inventoryService.adjustStock(id, data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] }); 
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      toast.success('Stock adjusted'); 
      setAdjustItem(null); 
      setAdjustForm({ type: 'correction', quantity: '', reason: '' }); 
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const linkMutation = useMutation({
    mutationFn: ({ id, productId }) => inventoryService.linkProduct(id, { productId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      toast.success('Inventory linked to product display');
      setLinkItem(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Linking failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => inventoryService.deleteItem(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      const msg = res.data?.data?.archived ? 'Variant archived (history preserved)' : 'Variant permanently deleted';
      toast.success(msg);
      setDeleteItem(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });


  const stats = [
    { label: 'Total SKUs', value: items.length, color: 'text-charcoal' },
    { label: 'Total Stock', value: items.reduce((s, i) => s + i.totalStock, 0) + ' pcs', color: 'text-blue-600' },
    { label: 'Low / Out', value: lowStockItems.length, color: 'text-red-600' },
    { label: 'Online Active', value: items.filter(i => i.onlineEnabled).length, color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Master Inventory — Admin</title></Helmet>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-charcoal tracking-tighter uppercase mb-1">Master Inventory</h1>
          <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Live Stock Control — Every item tracked here</p>
        </div>
        <div className="flex items-center flex-wrap gap-3">
           <button onClick={() => setLinkItem('new')} className="px-4 sm:px-4 sm:px-6 py-3 bg-charcoal text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-2 shadow-lg shadow-charcoal/10">
              <Plus size={16} /> Add Manually
           </button>
        </div>
      </div>

      {/* Stats and filters... */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-[2rem] border border-border-light p-4 sm:p-4 sm:p-6 shadow-sm">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-[2rem] p-4 sm:p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={20} className="text-red-600" />
            <span className="text-sm font-black text-red-800 uppercase tracking-tight">Low / Out of Stock — {lowStockItems.length} items need restocking!</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {lowStockItems.slice(0, 8).map(i => (
              <div key={i._id} className="bg-white rounded-[2rem] p-5 flex flex-col justify-between border border-transparent hover:border-red-200 transition-all group shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs font-black text-charcoal line-clamp-1">{i.productName}</div>
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{i.color} • {i.size}</div>
                  </div>
                  <div className={`text-sm font-black ${i.availableStock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                    {i.availableStock === 0 ? 'OUT' : i.availableStock}
                  </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setAdjustItem(i)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Adjust</button>
                   <button onClick={() => setHistoryItem(i)} className="p-2 bg-light-bg text-text-muted rounded-xl hover:bg-charcoal hover:text-white transition-all"><History size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input className="w-full bg-white border border-border-light rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-premium-gold text-sm" placeholder="Search by SKU or name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <button 
           onClick={() => setShowArchived(!showArchived)}
           className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border ${
              showArchived ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-text-muted border-border-light'
           }`}
        >
           <History size={14} />
           {showArchived ? 'Archive Vault' : 'Show Deleted'}
        </button>
        <div className="flex gap-2 flex-wrap">
          {[['all','All'], ['critical','Low Stock'], ['out','Out of Stock'], ['online','Online'], ['offline','Offline']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterStatus(val)} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === val ? 'bg-charcoal text-white shadow-lg' : 'bg-white border border-border-light text-text-muted hover:bg-light-bg'}`}>{label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-border-light overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-light-bg/50 border-b border-border-light">
                {['Product', 'Color / Size', 'Available', 'Stock Breakdown', 'Selling Price', 'Channel Toggles', 'Actions'].map((h, idx) => (
                  <th key={h} className={`px-5 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap ${[3, 4, 5].includes(idx) ? 'hidden lg:table-cell' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light/40">
              {isLoading ? (
                <tr><td colSpan="7" className="py-20 text-center"><Loader2 className="animate-spin text-premium-gold mx-auto" size={36} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="py-20 text-center text-xs font-bold text-text-muted">No inventory items found. Add a purchase bill to populate stock.</td></tr>
              ) : filtered.map(item => (
                <tr key={item._id} className={`hover:bg-light-bg/50 transition-colors group ${item.deletedAt ? 'opacity-40 grayscale-[0.2]' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center flex-wrap gap-4">
                       <div className="w-12 h-14 bg-light-bg rounded-xl overflow-hidden flex-shrink-0 border border-border-light">
                          <SafeImage src={item.productImages?.[0] || item.productRef?.images?.[0]} className="w-full h-full object-cover" />
                       </div>
                       <div>
                          <div className={`font-black text-charcoal text-sm ${item.deletedAt ? 'line-through' : ''}`}>{item.productName}</div>
                          <div className="text-[10px] text-text-muted font-bold mt-0.5">{item.category}</div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                             {item.purchasePrice > 0 ? (
                               <span className="flex items-center gap-1 text-[8px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                 <ShoppingCart size={8} /> Inventory Product
                               </span>
                             ) : (
                               <span className="flex items-center gap-1 text-[8px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                                 <Plus size={8} /> Manual Inventory
                               </span>
                             )}
                             {item.offlineEnabled && (
                               <span className="text-[8px] font-black text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">POS</span>
                             )}
                             {item.onlineEnabled && (
                               <span className="text-[8px] font-black text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Web</span>
                             )}
                             {item.deletedAt && (
                               <span className="text-[8px] font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">ARCHIVED</span>
                             )}
                           </div>
                       </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-charcoal text-sm">{item.color}</div>
                    <div className="text-xs text-text-muted font-bold">Size: {item.size}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-xl font-black text-charcoal">{item.availableStock}</div>
                    <div className="mt-1"><StatusBadge item={item} /></div>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div className="text-[10px] space-y-0.5">
                      <div className="text-text-muted font-bold">Purchased: <span className="text-charcoal">{item.totalStock}</span></div>
                      <div className="text-blue-500 font-bold">Online sold: {item.onlineSold}</div>
                      <div className="text-orange-500 font-bold">POS sold: {item.offlineSold}</div>
                      {(item.reservedStock || 0) > 0 && <div className="text-indigo-500 font-bold">Reserved: {item.reservedStock}</div>}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    {editingPrice === item._id ? (
                      <div className="flex items-center gap-2">
                        <input type="number" className="w-24 bg-light-bg border-none rounded-xl px-3 py-2 font-black text-sm focus:ring-2 focus:ring-premium-gold/30" value={newPrice} onChange={e => setNewPrice(e.target.value)} autoFocus />
                        <button onClick={() => priceMutation.mutate({ id: item._id, price: Number(newPrice) })} className="p-2 bg-green-500 text-white rounded-xl"><Save size={14} /></button>
                        <button onClick={() => setEditingPrice(null)} className="p-2 bg-light-bg text-charcoal rounded-xl"><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setEditingPrice(item._id); setNewPrice(item.sellingPrice || ''); }}>
                        <span className="font-black text-charcoal">₹{item.sellingPrice || '—'}</span>
                        <Edit3 size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[8px] font-black uppercase text-text-muted">WEB</span>
                        <button onClick={() => toggleMutation.mutate({ id: item._id, channel: 'online' })} className={`relative w-10 h-5 rounded-full transition-all ${item.onlineEnabled ? 'bg-green-500 shadow-lg shadow-green-200' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${item.onlineEnabled ? 'left-5.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[8px] font-black uppercase text-text-muted">POS</span>
                        <button onClick={() => toggleMutation.mutate({ id: item._id, channel: 'offline' })} className={`relative w-10 h-5 rounded-full transition-all ${item.offlineEnabled ? 'bg-orange-500 shadow-lg shadow-orange-200' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${item.offlineEnabled ? 'left-5.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    </div>
                  </td>
                   <td className="px-5 py-4">
                     <div className="flex justify-end gap-2">
                       {item.deletedAt ? (
                         <button onClick={() => restoreMutation.mutate(item._id)} className="px-4 py-2 bg-charcoal text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-premium-gold transition-all flex items-center gap-2">
                            <PlusCircle size={14} /> Restore
                         </button>
                       ) : (
                         <div className="flex items-center gap-2">
                            <button onClick={() => setAdjustItem(item)} className="p-2 bg-light-bg text-charcoal rounded-xl hover:bg-charcoal hover:text-white transition-all" title="Adjust Stock"><Edit3 size={16} /></button>
                            <button onClick={() => setHistoryItem(item)} className="p-2 bg-light-bg text-charcoal rounded-xl hover:bg-charcoal hover:text-white transition-all" title="View Stock Ledger"><History size={16} /></button>
                            {!item.productRef && (
                              <button onClick={() => setLinkItem(item)} className="p-2 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all" title="Link to Gallery"><PlusCircle size={16} /></button>
                            )}
                            <button onClick={() => setDeleteItem(item)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all" title="Delete Variant"><Trash2 size={16} /></button>
                         </div>
                       )}
                     </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        {inventoryData?.pagination && inventoryData.pagination.pages > 1 && (
          <div className="bg-light-bg/30 px-4 sm:px-4 sm:px-6 py-4 border-t border-border-light flex items-center justify-between">
            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">
              Showing page {page} of {inventoryData.pagination.pages}
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-border-light rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:grayscale transition-all hover:bg-light-bg"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                 {[...Array(inventoryData.pagination.pages)].map((_, i) => (
                   <button 
                     key={i}
                     type="button"
                     onClick={() => setPage(i + 1)}
                     className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${page === i + 1 ? 'bg-charcoal text-white' : 'hover:bg-light-bg text-text-muted'}`}
                   >
                     {i + 1}
                   </button>
                 ))}
              </div>
              <button 
                type="button"
                onClick={() => setPage(p => Math.min(inventoryData.pagination.pages, p + 1))}
                disabled={page === inventoryData.pagination.pages}
                className="px-4 py-2 bg-white border border-border-light rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:grayscale transition-all hover:bg-light-bg"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal... */}
      <AnimatePresence>
        {adjustItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={() => setAdjustItem(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full admin-modal-container max-w-md rounded-[3rem] shadow-2xl border border-border-light p-4 md:p-4 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-charcoal uppercase tracking-tight">Adjust Stock</h3>
                  <p className="text-xs text-text-muted font-bold mt-1">{adjustItem.productName} • {adjustItem.color} • {adjustItem.size}</p>
                </div>
                <button onClick={() => setAdjustItem(null)} className="p-3 hover:bg-light-bg rounded-full text-text-muted"><X size={20} /></button>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Adjustment Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[['correction', 'Correction'], ['return', 'Return'], ['damage', 'Damage']].map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setAdjustForm(f => ({ ...f, type: val }))} className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${adjustForm.type === val ? 'bg-charcoal text-white' : 'bg-light-bg text-text-muted'}`}>{label}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Quantity</label>
                  <input type="number" min="1" className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 font-black text-xl focus:ring-2 focus:ring-premium-gold/30 text-center" placeholder="0" value={adjustForm.quantity} onChange={e => setAdjustForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Reason (Required)</label>
                  <textarea rows={3} className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 font-medium text-sm resize-none focus:ring-2 focus:ring-premium-gold/30" placeholder="Enter reason for this adjustment..." value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))} />
                </div>

                <button
                  onClick={() => {
                    if (!adjustForm.quantity || !adjustForm.reason) return toast.error('Fill all fields');
                    adjustMutation.mutate({ id: adjustItem._id, data: { type: adjustForm.type, quantity: Number(adjustForm.quantity), reason: adjustForm.reason } });
                  }}
                  disabled={adjustMutation.isPending}
                  className="w-full bg-charcoal text-white py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-premium-gold hover:text-charcoal transition-all flex items-center justify-center gap-2"
                >
                  {adjustMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Commit Adjustment</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {linkItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={() => setLinkItem(null)} />
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full admin-modal-container max-w-md rounded-[3rem] shadow-2xl border border-border-light p-4 md:p-4 md:p-8 flex flex-col max-h-[80vh]">
                <div className="flex-none flex items-center justify-between mb-6">
                   <div>
                      <h3 className="text-lg font-black text-charcoal uppercase tracking-tight">
                         {linkItem === 'new' ? 'Manual Inventory Entry' : 'Link Stock to Product'}
                      </h3>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">
                         {linkItem === 'new' ? 'Direct master entry (bypass procurement)' : `Stock ID: ${linkItem._id}`}
                      </p>
                   </div>
                   <button onClick={() => setLinkItem(null)} className="p-3 hover:bg-light-bg rounded-full text-text-muted"><X size={20} /></button>
                </div>

                {linkItem === 'new' ? (
                   <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                      <div>
                         <label className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Product Name</label>
                         <input className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 font-bold text-sm" placeholder="e.g. Cotton Polo Shirt" id="manualName" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Color</label>
                            <input className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 font-bold text-sm" placeholder="Black" id="manualColor" />
                         </div>
                         <div>
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Size</label>
                            <input className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 font-bold text-sm" placeholder="XL" id="manualSize" />
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Price (MRP)</label>
                            <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 font-bold text-sm" placeholder="999" id="manualPrice" />
                         </div>
                         <div>
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">SKU (Optional)</label>
                            <input className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 font-bold text-sm" placeholder="POLO-BLK-XL" id="manualSku" />
                         </div>
                      </div>
                      <button 
                         onClick={() => {
                            const name = document.getElementById('manualName').value;
                            const color = document.getElementById('manualColor').value;
                            const size = document.getElementById('manualSize').value;
                            const price = document.getElementById('manualPrice').value;
                            const sku = document.getElementById('manualSku').value;
                            if (!name || !color || !size || !price) return toast.error('Required fields missing');
                            
                            inventoryService.createItem({ productName: name, color, size, sellingPrice: price, sku })
                               .then(() => {
                                  queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
                                  toast.success('Manual entry added');
                                  setLinkItem(null);
                               })
                               .catch(err => toast.error(err.response?.data?.message || 'Failed'));
                         }}
                         className="w-full py-4 bg-charcoal text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all shadow-lg"
                      >
                         Create Manual Item
                      </button>
                   </div>
                ) : (
                   <>
                      <div className="flex-none relative mb-6">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                         <input 
                           className="w-full bg-light-bg border-none rounded-2xl pl-12 pr-4 py-4 font-bold text-sm focus:ring-2 focus:ring-premium-gold/30" 
                           placeholder="Search display products..." 
                           value={productSearch}
                           onChange={e => setProductSearch(e.target.value)}
                         />
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                         {searchProducts?.map(p => (
                           <button 
                             key={p._id} 
                             onClick={() => linkMutation.mutate({ id: linkItem._id, productId: p._id })}
                             className="w-full text-left p-4 hover:bg-light-bg rounded-2xl border border-transparent hover:border-premium-gold/20 flex items-center gap-4 transition-all"
                           >
                              <SafeImage src={p.images?.[0]} className="w-10 h-12 rounded-lg object-cover" alt="" />
                              <div>
                                 <div className="text-xs font-black text-charcoal">{p.name}</div>
                                 <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{p.category?.name}</div>
                              </div>
                           </button>
                         ))}
                         {productSearch.length > 2 && !searchProducts?.length && (
                           <div className="py-10 text-center text-xs font-bold text-text-muted uppercase tracking-widest">No products found</div>
                         )}
                         {productSearch.length <= 2 && (
                           <div className="py-10 text-center text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Type at least 3 characters to search</div>
                         )}
                      </div>
                   </>
                )}
             </motion.div>
          </div>
        )}
        {historyItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={() => setHistoryItem(null)} />
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full admin-modal-container max-w-2xl rounded-[3rem] shadow-2xl border border-border-light p-4 md:p-4 md:p-8 flex flex-col max-h-[85vh]">
                <div className="flex-none flex items-center justify-between mb-8">
                   <div>
                      <h3 className="text-xl font-black text-charcoal uppercase tracking-tight">Stock Movement Ledger</h3>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">{historyItem.productName} • {historyItem.color} • {historyItem.size}</p>
                   </div>
                   <button onClick={() => setHistoryItem(null)} className="p-3 hover:bg-light-bg rounded-full text-text-muted transition-colors"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                   {isLoadingHistory ? (
                     <div className="py-20 text-center"><Loader2 className="animate-spin text-premium-gold mx-auto" size={32} /></div>
                   ) : !historyData?.length ? (
                     <div className="py-20 text-center text-xs font-bold text-text-muted uppercase tracking-widest opacity-50 italic">No movement records found.</div>
                   ) : (
                     <div className="space-y-4">
                        {historyData.map((h, i) => (
                          <div key={i} className="bg-light-bg/30 rounded-2xl p-5 border border-border-light flex items-center justify-between group hover:border-premium-gold transition-all">
                             <div className="flex items-center flex-wrap gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${h.type === 'purchase' || h.type === 'return' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                   {h.quantity > 0 ? '+' : ''}{h.quantity}
                                </div>
                                <div>
                                   <div className="text-xs font-black text-charcoal uppercase tracking-tight">{h.type.replace(/_/g, ' ')}</div>
                                   <div className="text-[10px] text-text-muted font-bold mt-0.5">{new Date(h.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                                </div>
                             </div>
                             <div className="text-right flex items-center gap-4">
                                <div className="max-w-[180px]">
                                   <div className="text-[10px] font-black text-charcoal uppercase tracking-widest truncate">{h.reason || 'No description provided'}</div>
                                   <div className="text-[9px] text-text-muted font-bold mt-0.5 italic">By: {h.performedBy?.name || 'System'}</div>
                                </div>
                                {h.referenceId?.billImage && (
                                  <button onClick={() => setViewBillImage(h.referenceId.billImage)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="View Bill Proof">
                                     <Smartphone size={14} />
                                  </button>
                                )}
                             </div>
                          </div>
                        ))}
                     </div>
                   )}
                </div>

                <div className="flex-none pt-8 mt-4 border-t border-border-light">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-light-bg rounded-2xl p-4 text-center">
                         <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Total Procured</p>
                         <p className="text-xl font-black text-charcoal">{historyItem.totalStock}</p>
                      </div>
                      <div className="bg-light-bg rounded-2xl p-4 text-center">
                         <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Currently Avail</p>
                         <p className="text-xl font-black text-premium-gold">{historyItem.availableStock}</p>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
        {viewBillImage && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/90 backdrop-blur-md" onClick={() => setViewBillImage(null)} />
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full admin-modal-container max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
                <div className="flex-none p-4 sm:p-4 sm:p-6 flex items-center justify-between border-b border-border-light">
                   <h3 className="text-sm font-black text-charcoal uppercase tracking-widest">Linked Purchase Invoice</h3>
                   <button onClick={() => setViewBillImage(null)} className="p-3 hover:bg-light-bg rounded-full text-text-muted transition-colors"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-auto bg-light-bg p-4 flex justify-center items-start">
                   <img src={viewBillImage} className="max-w-full rounded-2xl shadow-lg border border-border-light" alt="Bill" />
                </div>
                <div className="flex-none p-4 bg-white border-t border-border-light flex justify-center gap-4">
                   <a href={viewBillImage} download className="btn-primary py-3 px-4 md:px-4 md:px-8 text-[10px] rounded-2xl">Download Proof</a>
                </div>
             </motion.div>
          </div>
        )}
        </AnimatePresence>

      {/* ─── Delete Confirmation Modal ─── */}
      <AnimatePresence>
        {deleteItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={() => setDeleteItem(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full admin-modal-container max-w-sm rounded-[2.5rem] shadow-2xl border border-border-light p-4 md:p-4 md:p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <h3 className="text-xl font-black text-charcoal uppercase tracking-tight mb-2">Delete Variant?</h3>
              <p className="text-sm font-bold text-text-muted mb-1">
                <span className="text-charcoal">{deleteItem.productName}</span> — {deleteItem.size} / {deleteItem.color}
              </p>
              <p className="text-[10px] font-bold text-text-muted mb-6">
                {(deleteItem.onlineSold || 0) + (deleteItem.offlineSold || 0) > 0
                  ? '⚠️ This variant has sales history. It will be archived (not permanently deleted) to preserve the audit trail.'
                  : 'This variant has no sales history. It will be permanently removed.'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteItem(null)} className="flex-1 py-4 bg-light-bg text-charcoal font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-border-light transition-all">Cancel</button>
                <button
                  onClick={() => deleteMutation.mutate(deleteItem._id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-4 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
