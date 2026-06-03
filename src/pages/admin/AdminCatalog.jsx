import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
   Plus, Search, Loader2, Package, Layers, Tag, BarChart3, AlertCircle,
   ExternalLink, Edit3, Trash2, Eye, Filter, Download, ChevronRight,
   Boxes, LayoutGrid, List, Sparkles, IndianRupee, MoreVertical, Settings2,
   CheckCircle2, TrendingUp, History, X, ChevronDown, Printer, QrCode,
   ArrowUp, ArrowDown, Save, RefreshCw, Globe, ShoppingBag, ShoppingCart
} from 'lucide-react';
import { adminService, inventoryService, productService, categoryService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SafeImage from '../../components/common/SafeImage';

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const CompactStat = ({ label, value, icon: Icon, color, pulse }) => (
   <div className="bg-white rounded-2xl border border-border-light p-4 shadow-sm flex items-center gap-4 group hover:border-premium-gold transition-all">
      <div className={`p-3 rounded-xl ${color} text-white ${pulse ? 'animate-pulse' : ''}`}>
         <Icon size={16} />
      </div>
      <div>
         <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest mb-0.5">{label}</p>
         <p className="text-lg font-black text-charcoal tracking-tight">{value}</p>
      </div>
   </div>
);

export default function AdminCatalog() {
   const [activeView, setActiveView] = useState('gallery'); // 'gallery' or 'list'
   const [search, setSearch] = useState('');
   const [filterCategory, setFilterCategory] = useState('All');
   const [showQuickStock, setShowQuickStock] = useState(null);
   const [showHistory, setShowHistory] = useState(null);
   const [adjustment, setAdjustment] = useState({ quantity: 1, type: 'add', reason: 'Stock In' });
   const [deleteProductConfirm, setDeleteProductConfirm] = useState(null);

   const queryClient = useQueryClient();
   const navigate = useNavigate();

   // --- Queries ---
   const { data: history, isLoading: isLoadingHistory } = useQuery({
      queryKey: ['stock-history', showHistory?._id],
      queryFn: () => inventoryService.getHistory(showHistory._id).then(r => r.data.data),
      enabled: !!showHistory
   });
   const { data: productsData, isLoading: isLoadingProducts } = useQuery({
      queryKey: ['admin-products', search, filterCategory],
      queryFn: () => adminService.getAdminProducts({
         search: search || undefined,
         category: filterCategory === 'All' ? undefined : filterCategory
      }).then(r => r.data.data),
   });
   const products = Array.isArray(productsData?.data) ? productsData.data : (Array.isArray(productsData) ? productsData : []);

   const { data: inventoryData } = useQuery({
      queryKey: ['admin-inventory'],
      queryFn: () => inventoryService.getInventory({ limit: 1000 }).then(r => r.data.data),
   });
   const inventory = inventoryData || [];

   const { data: categoriesData } = useQuery({
      queryKey: ['categories'],
      queryFn: () => categoryService.getCategories().then(r => r.data),
      staleTime: 0,
      refetchOnMount: true,
   });
   const categories = categoriesData?.data?.categories || categoriesData?.data || [];

   // --- Mutations ---
   const adjustStockMutation = useMutation({
      mutationFn: ({ id, data }) => inventoryService.adjustStock(id, data),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
         queryClient.invalidateQueries({ queryKey: ['admin-products'] });
         queryClient.invalidateQueries({ queryKey: ['admin-health'] });
         queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
         queryClient.invalidateQueries({ queryKey: ['product'] });
         queryClient.invalidateQueries({ queryKey: ['product-variants'] });
         toast.success('Stock adjusted successfully');
         setShowQuickStock(null);
      }
   });

   const toggleChannelMutation = useMutation({
      mutationFn: ({ id, channel }) => inventoryService.toggleChannel(id, { channel }),
      onSuccess: (res) => {
         queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
         queryClient.invalidateQueries({ queryKey: ['admin-products'] });
         queryClient.invalidateQueries({ queryKey: ['admin-health'] });
         queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
         queryClient.invalidateQueries({ queryKey: ['product'] });
         queryClient.invalidateQueries({ queryKey: ['product-variants'] });
         toast.success('Status updated');
      }
   });

   const restoreChannelsMutation = useMutation({
      mutationFn: () => inventoryService.restoreChannels(),
      onSuccess: (res) => {
         queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
         queryClient.invalidateQueries({ queryKey: ['admin-products'] });
         queryClient.invalidateQueries({ queryKey: ['products'] });
         queryClient.invalidateQueries({ queryKey: ['pos-products'] });
         toast.success(res.data?.message || 'Channels restored for in-stock items');
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to restore channels')
   });

   const updateDetailsMutation = useMutation({
      mutationFn: ({ id, data }) => inventoryService.updateDetails(id, data),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
         queryClient.invalidateQueries({ queryKey: ['admin-products'] });
         queryClient.invalidateQueries({ queryKey: ['products'] });
         queryClient.invalidateQueries({ queryKey: ['pos-products'] });
         queryClient.invalidateQueries({ queryKey: ['admin-health'] });
         queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
         queryClient.invalidateQueries({ queryKey: ['product'] });
         queryClient.invalidateQueries({ queryKey: ['product-variants'] });
         toast.success('Variant updated');
      }
   });

   const deleteProductMutation = useMutation({
      mutationFn: (id) => productService.deleteProduct(id),
      onSuccess: (res) => {
         queryClient.invalidateQueries({ queryKey: ['admin-products'] });
         queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
         queryClient.invalidateQueries({ queryKey: ['products'] });
         queryClient.invalidateQueries({ queryKey: ['pos-products'] });
         const msg = res.data?.message || 'Product removed from gallery';
         toast.success(msg);
         setDeleteProductConfirm(null);
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
   });

   // --- Logic ---
   const catalogItems = useMemo(() => {
      const map = {};
      inventory.forEach(item => {
         const pid = item.productRef?._id || item.productRef;
         if (pid) {
            if (!map[pid]) map[pid] = [];
            map[pid].push(item);
         }
      });

      let profiles = [...products];
      const finalMap = { ...map };

      // Find unlinked inventory
      const unlinked = inventory.filter(item => !item.productRef);
      const unlinkedByName = {};

      unlinked.forEach(item => {
         if (!unlinkedByName[item.productName]) unlinkedByName[item.productName] = [];
         unlinkedByName[item.productName].push(item);
      });

      // Create virtual profiles for unlinked items
      Object.keys(unlinkedByName).forEach(name => {
         const items = unlinkedByName[name];
         const virtualId = `unlinked-${name}`;

         const existingProduct = products.find(p => p.name.toLowerCase() === name.toLowerCase());
         if (existingProduct) {
            finalMap[existingProduct._id] = [...(finalMap[existingProduct._id] || []), ...items];
         } else {
            profiles.push({
               _id: virtualId,
               name: name,
               isVirtual: true,
               category: { name: items[0].category || 'Uncategorized' },
               sellingPrice: items[0].sellingPrice,
               images: items[0].images || [],
               isActive: false
            });
            finalMap[virtualId] = items;
         }
      });

      // --- Catalog View Optimization ---
      // We show ALL products that exist in the catalog, whether they have stock or not.
      // If a product has variants, we show them. If not, it's just a profile waiting for stock.
      return { profiles, map: finalMap };
   }, [products, inventory]);

   const stats = useMemo(() => {
      // Only count items that actually exist in physical inventory with stock > 0
      const activeInventory = inventory.filter(x => (x.totalStock || 0) > 0);

      const totalCost = activeInventory.reduce((s, x) => s + (x.purchasePrice * (x.totalStock || 0)), 0);
      const totalMRP = activeInventory.reduce((s, x) => s + (x.sellingPrice * (x.totalStock || 0)), 0);

      const lowStock = activeInventory.filter(x => {
         const avail = Math.max(0, (x.totalStock + x.returned) - (x.onlineSold + x.offlineSold + x.damaged + (x.reservedStock || 0)));
         return avail > 0 && avail <= (x.lowStockThreshold || 5);
      }).length;

      return { totalCost, totalMRP, lowStock, totalSKUs: activeInventory.length };
   }, [inventory]);

   return (
      <div className="space-y-6 pb-20">
         <Helmet><title>Catalog Master — Magizhchi ERP</title></Helmet>

         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light pb-6">
            <div>
               <h1 className="text-3xl font-black text-charcoal tracking-tighter uppercase">Catalog Master</h1>
               <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Unified Product Intelligence & Channel Control</p>
            </div>
            <div className="flex items-center flex-wrap gap-3">
               <div className="flex bg-light-bg p-1 rounded-xl border border-border-light mr-4">
                  <button
                     onClick={() => setActiveView('gallery')}
                     className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'gallery' ? 'bg-white text-charcoal shadow-sm' : 'text-text-muted hover:text-charcoal'}`}
                  >
                     <LayoutGrid size={12} /> Gallery
                  </button>
                  <button
                     onClick={() => setActiveView('list')}
                     className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'list' ? 'bg-white text-charcoal shadow-sm' : 'text-text-muted hover:text-charcoal'}`}
                  >
                     <List size={12} /> List View
                  </button>
               </div>
               <button 
                  onClick={() => restoreChannelsMutation.mutate()} 
                  disabled={restoreChannelsMutation.isPending}
                  className="px-4 py-3 bg-white text-charcoal border border-border-light rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-premium-gold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                  title="Fix all in-stock items that are hidden from Web/POS"
               >
                  {restoreChannelsMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Restore
               </button>
               <button onClick={() => navigate('/admin/products/new')} className="px-4 sm:px-6 py-3 bg-charcoal text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-2 shadow-lg shadow-charcoal/10">
                  <Plus size={16} /> New Profile
               </button>
            </div>
         </div>

         {/* Stats */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <CompactStat label="Asset Value" value={formatCurrency(stats.totalCost)} icon={IndianRupee} color="bg-emerald-500" />
            <CompactStat label="Revenue Pot." value={formatCurrency(stats.totalMRP)} icon={TrendingUp} color="bg-premium-gold" />
            <CompactStat label="Stock Depth" value={`${stats.totalSKUs} SKUs`} icon={Layers} color="bg-indigo-500" />
            <CompactStat label="Alerts" value={stats.lowStock} icon={AlertCircle} color="bg-red-500" pulse={stats.lowStock > 0} />
         </div>

         {/* Search & Filter */}
         <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-4 rounded-3xl border border-border-light shadow-sm">
            <div className="relative flex-1 w-full group">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-premium-gold transition-colors" size={18} />
               <input
                  className="w-full bg-light-bg border-none rounded-2xl pl-14 pr-6 py-3.5 focus:ring-2 focus:ring-premium-gold/10 font-bold text-sm"
                  placeholder="Search catalog by name or SKU..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
               />
            </div>
            <div className="flex-1 lg:flex-none flex items-center gap-3 bg-light-bg px-4 sm:px-6 py-3.5 rounded-2xl border border-transparent hover:border-premium-gold/20 transition-all cursor-pointer">
               <Filter size={16} className="text-text-muted" />
               <select
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 text-charcoal cursor-pointer p-0"
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
               >
                  <option value="All">All Categories</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
               </select>
            </div>
         </div>

         {/* ─── CONDITIONAL CONTENT ─── */}
         <AnimatePresence mode="wait">
            {activeView === 'gallery' ? (
               <motion.div
                  key="gallery"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
               >
                  <div className="flex items-center justify-between px-4">
                     <h3 className="text-sm font-black text-charcoal uppercase tracking-tighter flex items-center gap-2">
                        <Package size={16} className="text-premium-gold" /> Web Gallery Profiles
                     </h3>
                     <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{products.length} Profiles Found</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                     {isLoadingProducts ? (
                        <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-premium-gold mx-auto" size={40} /></div>
                     ) : products.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-border-light">
                           <Package size={40} className="mx-auto text-text-muted/30 mb-4" />
                           <p className="text-xs font-bold text-text-muted uppercase tracking-widest">No display profiles created yet.</p>
                           <button onClick={() => navigate('/admin/products/new')} className="mt-4 text-[10px] font-black text-premium-gold uppercase tracking-widest hover:underline">Create your first profile</button>
                        </div>
                     ) : products.map(product => (
                        <motion.div
                           key={product._id}
                           layout
                           className="group bg-white rounded-[3rem] border border-border-light overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-charcoal/5 transition-all duration-500"
                        >
                           {/* ... rest of product card ... */}
                           <div className="aspect-[4/5] relative overflow-hidden bg-light-bg">
                              <SafeImage src={product.images?.[0]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              <div className="absolute top-6 left-6 flex flex-col gap-2">
                                 <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm">
                                    <span className="text-[10px] font-black text-charcoal uppercase tracking-widest">{product.category?.name || 'General'}</span>
                                 </div>
                                 <div className={`px-4 py-2 backdrop-blur-md rounded-2xl shadow-sm ${product.source === 'procurement' ? 'bg-blue-500/10 text-blue-600' : 'bg-purple-500/10 text-purple-600'}`}>
                                    <span className="text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                       {product.source === 'procurement' ? <ShoppingCart size={10} /> : <Plus size={10} />}
                                       {product.source === 'procurement' ? 'Inventory Product' : 'Manual Inventory'}
                                    </span>
                                 </div>
                              </div>
                              <div className="absolute top-6 right-6 flex gap-2">
                                 <button onClick={() => navigate(`/admin/products/${product._id}`)} className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-charcoal hover:bg-charcoal hover:text-white transition-all shadow-sm">
                                    <Edit3 size={16} />
                                 </button>
                                 <button onClick={() => setDeleteProductConfirm(product)} className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                    <Trash2 size={16} />
                                 </button>
                              </div>

                              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                                 <div className="flex -space-x-3">
                                    {(catalogItems.map[product._id] || []).slice(0, 4).map((inv, idx) => (
                                       <div key={inv._id} className="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[8px] font-black uppercase overflow-hidden" style={{ backgroundColor: inv.color?.toLowerCase(), color: ['white', 'yellow'].includes(inv.color?.toLowerCase()) ? 'black' : 'white' }}>
                                          {inv.size}
                                       </div>
                                    ))}
                                    {(catalogItems.map[product._id] || []).length > 4 && (
                                       <div className="w-8 h-8 rounded-full border-2 border-white bg-charcoal text-white shadow-md flex items-center justify-center text-[8px] font-black">
                                          +{(catalogItems.map[product._id] || []).length - 4}
                                       </div>
                                    )}
                                 </div>
                                 <div className="px-4 py-2 bg-charcoal text-white rounded-2xl shadow-xl shadow-charcoal/20">
                                  <div className="flex flex-col">
                                    {product.discountedPrice < product.sellingPrice && (
                                      <span className="text-[8px] text-text-muted line-through opacity-50">₹{product.sellingPrice}</span>
                                    )}
                                    <span className="text-[10px] font-black uppercase tracking-widest text-premium-gold">₹{product.discountedPrice || product.sellingPrice}</span>
                                  </div>
                                 </div>
                              </div>
                           </div>

                           <div className="p-4 md:p-8">
                              <div className="flex items-center justify-between mb-4">
                                 <h4 className="font-black text-charcoal text-lg tracking-tight truncate mr-4">{product.name}</h4>
                                 <div className={`w-3 h-3 rounded-full ${product.isActive ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'bg-red-500 shadow-lg shadow-red-500/20'}`} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="p-4 bg-light-bg/50 rounded-2xl border border-border-light/50">
                                    <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Total Stock</p>
                                    <p className="font-black text-charcoal">{(catalogItems.map[product._id] || []).reduce((s, x) => s + x.totalStock, 0)} Units</p>
                                 </div>
                                 <div className="p-4 bg-light-bg/50 rounded-2xl border border-border-light/50">
                                    <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">SKU Count</p>
                                    <p className="font-black text-charcoal">{(catalogItems.map[product._id] || []).length} Variants</p>
                                 </div>
                              </div>
                           </div>
                        </motion.div>
                     ))}
                  </div>
               </motion.div>
            ) : (
               <motion.div
                  key="list"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
               >
                  <div className="flex items-center justify-between px-4">
                     <div>
                        <h3 className="text-sm font-black text-charcoal uppercase tracking-tighter flex items-center gap-2">
                           <History size={16} className="text-premium-gold" /> Catalog Inventory Master
                        </h3>
                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">Verified Display Profiles & Live Variant Tracking</p>
                     </div>
                     <div className="flex items-center flex-wrap gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-100">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                           <span className="text-[9px] font-black uppercase">Live Analytics</span>
                        </div>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                           {products.length} Profiles
                        </span>
                     </div>
                  </div>

                  <div className="bg-white rounded-[3rem] border border-border-light overflow-hidden shadow-sm">
                     <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left border-collapse">
                           <thead>
                              <tr className="bg-light-bg/50 border-b border-border-light">
                                 <th className="px-4 md:px-8 py-4 sm:py-6 text-[10px] font-black text-text-muted uppercase tracking-widest w-[30%]">Product Profile</th>
                                 <th className="px-4 md:px-8 py-4 sm:py-6 text-[10px] font-black text-text-muted uppercase tracking-widest">Variant Depth (Size/Color/Stock)</th>
                                 <th className="px-4 md:px-8 py-4 sm:py-6 text-[10px] font-black text-text-muted uppercase tracking-widest text-center">Global Status</th>
                                 <th className="px-4 md:px-8 py-4 sm:py-6 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Market Price</th>
                                 <th className="px-4 md:px-8 py-4 sm:py-6 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Sync</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-border-light/40">
                              {catalogItems.profiles.length === 0 ? (
                                 <tr><td colSpan="5" className="py-24 text-center text-xs font-bold text-text-muted uppercase tracking-widest">No active products found. Please link your inventory to display profiles.</td></tr>
                              ) : catalogItems.profiles.map(product => {
                                 const variants = catalogItems.map[product._id] || [];
                                 const totalAvail = variants.reduce((s, item) => s + Math.max(0, (item.totalStock + item.returned) - (item.onlineSold + item.offlineSold + item.damaged + (item.reservedStock || 0))), 0);

                                 return (
                                    <tr key={product._id} className="group hover:bg-light-bg/10 transition-all align-top">
                                       <td className="px-4 md:px-8 py-4 md:py-8">
                                          <div className="flex items-center flex-wrap gap-4">
                                             <SafeImage src={product.images?.[0]} className="w-12 h-16 rounded-2xl object-cover bg-light-bg shadow-sm" />
                                             <div>
                                                <div className="font-black text-charcoal text-sm leading-tight mb-1">{product.name}</div>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                   <span className="text-[9px] font-black px-2 py-0.5 bg-light-bg rounded-md text-text-muted uppercase">{product.category?.name || 'General'}</span>
                                                   <span className="text-[9px] font-bold text-premium-gold uppercase tracking-widest">{product.sku || 'REF-N/A'}</span>
                                                   <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${product.source === 'procurement' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                      {product.source === 'procurement' ? 'Inventory Product' : 'Manual Inventory'}
                                                   </span>
                                                </div>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-4 md:px-8 py-4 md:py-8">
                                          <div className="flex flex-wrap gap-2 max-w-lg">
                                             {variants.length === 0 ? (
                                                <div className="text-[10px] font-bold text-red-400 uppercase italic">No physical variants linked to this profile.</div>
                                             ) : variants.map(v => {
                                                const avail = Math.max(0, (v.totalStock + v.returned) - (v.onlineSold + v.offlineSold + v.damaged + (v.reservedStock || 0)));
                                                const isLow = avail <= (v.lowStockThreshold || 5);

                                                return (
                                                   <div key={v._id} className="relative group/var flex items-center">
                                                      <div
                                                         className={`px-3 py-2 rounded-xl border flex flex-col items-center min-w-[65px] transition-all relative ${isLow ? 'bg-red-50 border-red-200' : 'bg-white border-border-light group-hover/var:border-premium-gold group-hover/var:shadow-md'}`}
                                                      >
                                                         <span className="text-[7px] font-black text-text-muted uppercase leading-none mb-0.5">{v.color}</span>
                                                         <span className="text-[10px] font-black text-charcoal uppercase leading-none">{v.size}</span>
                                                         <span className={`text-[11px] font-black ${isLow ? 'text-red-600' : 'text-charcoal'}`}>{avail}</span>
                                                         <div className="w-full h-1 mt-1 rounded-full bg-light-bg overflow-hidden">
                                                            <div className={`h-full ${isLow ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (avail / 50) * 100)}%` }} />
                                                         </div>

                                                         <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover/var:opacity-100 transition-all z-20">
                                                            <button onClick={(e) => { e.stopPropagation(); setAdjustment({ quantity: 1, type: 'add', reason: 'Quick Add' }); setShowQuickStock(v); }} className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110"><Plus size={12} /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); setAdjustment({ quantity: 1, type: 'subtract', reason: 'Quick Remove' }); setShowQuickStock(v); }} className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110"><X size={12} /></button>
                                                         </div>
                                                      </div>

                                                      <div className="opacity-0 group-hover/var:opacity-100 transition-all ml-1.5 z-20">
                                                         <div className="flex flex-col gap-1 p-1 bg-white/95 backdrop-blur-sm rounded-lg border border-border-light shadow-md">
                                                            <button onClick={(e) => { e.stopPropagation(); setAdjustment({ quantity: 1, type: 'return', reason: 'Customer Return' }); setShowQuickStock(v); }} className="p-1.5 hover:bg-green-50 text-text-muted hover:text-green-600 rounded-md transition-all" title="Return"><RefreshCw size={12} /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); setAdjustment({ quantity: 1, type: 'exchange_in', reason: 'Exchange' }); setShowQuickStock(v); }} className="p-1.5 hover:bg-blue-50 text-text-muted hover:text-blue-600 rounded-md transition-all" title="Exchange"><ShoppingBag size={12} /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); setAdjustment({ quantity: 1, type: 'damage', reason: 'Damage' }); setShowQuickStock(v); }} className="p-1.5 hover:bg-red-50 text-text-muted hover:text-red-500 rounded-md transition-all" title="Damage"><AlertCircle size={12} /></button>
                                                         </div>
                                                      </div>
                                                   </div>
                                                );
                                             })}
                                          </div>
                                       </td>
                                       <td className="px-4 md:px-8 py-4 md:py-8">
                                          <div className="flex flex-col items-center gap-3">
                                             <div className="flex items-center flex-wrap gap-4">
                                                <button
                                                   disabled={product.isVirtual}
                                                   onClick={async () => {
                                                      if (product.isVirtual) return;
                                                      const newActiveState = !product.isActive;
                                                      try {
                                                         await productService.updateProduct(product._id, { isActive: newActiveState });
                                                         if (variants.length > 0) {
                                                            await Promise.all(
                                                               variants.map(v =>
                                                                  inventoryService.updateChannelConfig(v._id, {
                                                                     onlineEnabled: newActiveState,
                                                                     offlineEnabled: v.offlineEnabled,
                                                                     onlineAllocatedStock: v.onlineAllocatedStock || 0,
                                                                     offlineAllocatedStock: v.offlineAllocatedStock || 0,
                                                                  })
                                                               )
                                                            );
                                                         }
                                                         queryClient.invalidateQueries(['admin-products']);
                                                         queryClient.invalidateQueries(['admin-inventory']);
                                                         toast.success(`Web: ${newActiveState ? 'VISIBLE' : 'HIDDEN'} — ${variants.length} variant(s) synced`);
                                                      } catch (err) {
                                                         toast.error('Failed to update web status');
                                                      }
                                                   }}
                                                   className="flex flex-col items-center gap-1 group/status"
                                                >
                                                   <div className={`w-3 h-3 rounded-full transition-all duration-300 ${product.isActive ? 'bg-green-500 shadow-lg shadow-green-500/20 scale-110' : 'bg-gray-300 group-hover/status:bg-gray-400'}`} />
                                                   <span className={`text-[8px] font-black uppercase tracking-tighter ${product.isActive ? 'text-green-600' : 'text-text-muted'}`}>Web</span>
                                                </button>

                                                <button
                                                   onClick={async () => {
                                                      const anyEnabled = variants.some(v => v.offlineEnabled);
                                                      const targetStatus = !anyEnabled;
                                                      toast.loading(`${targetStatus ? 'Enabling' : 'Disabling'} POS for ${variants.length} variants...`, { id: 'pos-sync' });
                                                      try {
                                                         await Promise.all(
                                                            variants.map(v =>
                                                               inventoryService.updateChannelConfig(v._id, {
                                                                  offlineEnabled: targetStatus,
                                                                  onlineEnabled: v.onlineEnabled,
                                                                  onlineAllocatedStock: v.onlineAllocatedStock || 0,
                                                                  offlineAllocatedStock: v.offlineAllocatedStock || 0,
                                                               })
                                                         )
                                                         );
                                                         queryClient.invalidateQueries(['admin-inventory']);
                                                         toast.success(`POS: ${targetStatus ? 'ACTIVE' : 'INACTIVE'} for all ${variants.length} variant(s)`, { id: 'pos-sync' });
                                                      } catch (err) {
                                                         toast.error('Failed to sync POS status', { id: 'pos-sync' });
                                                      }
                                                   }}
                                                   className="flex flex-col items-center gap-1 group/status"
                                                >
                                                   <div className={`w-3 h-3 rounded-full transition-all duration-300 ${variants.some(v => v.offlineEnabled) ? 'bg-orange-500 shadow-lg shadow-orange-500/20 scale-110' : 'bg-gray-300 group-hover/status:bg-gray-400'}`} />
                                                   <span className={`text-[8px] font-black uppercase tracking-tighter ${variants.some(v => v.offlineEnabled) ? 'text-orange-600' : 'text-text-muted'}`}>POS</span>
                                                </button>
                                             </div>
                                             <div className="text-[10px] font-black text-charcoal bg-light-bg px-3 py-1 rounded-full uppercase tracking-tighter">
                                                Total: {totalAvail} Pcs
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-4 md:px-8 py-4 md:py-8 text-right">
                                          <div className="font-black text-charcoal text-lg tracking-tighter">₹{product.sellingPrice}</div>
                                          <div className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Global MSRP</div>
                                       </td>
                                       <td className="px-4 md:px-8 py-4 md:py-8 text-right">
                                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                             <button onClick={() => navigate(`/admin/products/${product._id}`)} className="p-3 bg-white border border-border-light rounded-2xl text-charcoal hover:bg-charcoal hover:text-white transition-all shadow-sm" title="Edit product">
                                                <Settings2 size={14} />
                                             </button>
                                             {!product.isVirtual && (
                                                <button onClick={() => setDeleteProductConfirm(product)} className="p-3 bg-white border border-red-100 rounded-2xl text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Delete product">
                                                   <Trash2 size={14} />
                                                </button>
                                             )}
                                          </div>
                                       </td>
                                    </tr>
                                 );
                              })}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>


         {/* ─── QUICK MODALS ─── */}
         <AnimatePresence>
            {showQuickStock && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/40 backdrop-blur-md" onClick={() => setShowQuickStock(null)} />
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full admin-modal-container max-w-lg rounded-[3.5rem] shadow-2xl p-12 border border-border-light overflow-hidden">
                     <div className="flex items-center justify-between mb-10">
                        <div>
                           <h2 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Inventory Pulse</h2>
                           <div className="flex items-center gap-2 mt-1">
                              <input
                                 className="text-[10px] text-premium-gold font-black uppercase tracking-widest bg-light-bg/50 px-2 py-0.5 rounded border-none w-20"
                                 value={showQuickStock.color}
                                 onChange={e => setShowQuickStock({ ...showQuickStock, color: e.target.value })}
                                 onBlur={() => updateDetailsMutation.mutate({ id: showQuickStock._id, data: { color: showQuickStock.color } })}
                                 onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                              />
                              <span className="text-[10px] text-text-muted font-bold">/</span>
                              <div className="flex items-center bg-light-bg/50 px-2 py-0.5 rounded border-none min-w-[60px]">
                                 {STANDARD_SIZES.includes(showQuickStock.size) || !showQuickStock.size ? (
                                    <select
                                       className="text-[10px] text-premium-gold font-black uppercase tracking-widest bg-transparent border-none p-0 appearance-none cursor-pointer w-full text-center"
                                       value={showQuickStock.size}
                                       onChange={e => setShowQuickStock({ ...showQuickStock, size: e.target.value })}
                                       onBlur={() => updateDetailsMutation.mutate({ id: showQuickStock._id, data: { size: showQuickStock.size } })}
                                    >
                                       {STANDARD_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                       <option value="custom">Other...</option>
                                    </select>
                                 ) : (
                                    <input
                                       className="text-[10px] text-premium-gold font-black uppercase tracking-widest bg-transparent border-none p-0 w-12 text-center"
                                       value={showQuickStock.size === 'custom' ? '' : showQuickStock.size}
                                       onChange={e => setShowQuickStock({ ...showQuickStock, size: e.target.value })}
                                       onBlur={() => updateDetailsMutation.mutate({ id: showQuickStock._id, data: { size: showQuickStock.size } })}
                                       onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                                       autoFocus
                                    />
                                 )}
                              </div>
                              <span className="text-[10px] text-text-muted font-bold ml-2">({showQuickStock.productName})</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <button onClick={() => { setShowHistory(showQuickStock); setShowQuickStock(null); }} className="p-4 hover:bg-premium-gold/10 text-premium-gold rounded-full" title="View Audit Ledger"><History size={20} /></button>
                           <button onClick={() => setShowQuickStock(null)} className="p-4 hover:bg-light-bg rounded-full"><X size={24} /></button>
                        </div>
                     </div>

                     <div className="space-y-8">
                        <div className="bg-light-bg/50 p-4 sm:p-6 rounded-3xl border border-border-light/50 flex items-center justify-between">
                           <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Current Active Stock</p>
                           <p className="text-2xl font-black text-charcoal">{showQuickStock.totalStock} Units</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Transaction Logic</label>
                              <select className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-6 py-4 font-black text-sm" value={adjustment.type} onChange={e => setAdjustment({ ...adjustment, type: e.target.value })}>
                                 <option value="add">Stock In / Purchase (+)</option>
                                 <option value="return">Customer Return (+)</option>
                                 <option value="exchange_in">Exchange Inbound (+)</option>
                                 <option value="subtract">Damage / Wastage (-)</option>
                                 <option value="exchange_out">Exchange Outbound (-)</option>
                                 <option value="sale_correction">Sale Correction (-)</option>
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Quantity</label>
                              <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-6 py-4 font-black text-xl" value={adjustment.quantity} onChange={e => setAdjustment({ ...adjustment, quantity: Number(e.target.value) })} />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Market Price (MSRP)</label>
                              <div className="relative">
                                 <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-charcoal">₹</span>
                                 <input
                                    type="number"
                                    className="w-full bg-light-bg border-none rounded-2xl pl-10 pr-6 py-4 font-black text-sm"
                                    value={showQuickStock.sellingPrice}
                                    onChange={e => setShowQuickStock({ ...showQuickStock, sellingPrice: Number(e.target.value) })}
                                    onBlur={() => updateDetailsMutation.mutate({ id: showQuickStock._id, data: { sellingPrice: showQuickStock.sellingPrice } })}
                                 />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Purchase Cost</label>
                              <div className="relative">
                                 <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-text-muted">₹</span>
                                 <input
                                    type="number"
                                    className="w-full bg-light-bg/50 border-none rounded-2xl pl-10 pr-6 py-4 font-black text-sm text-text-muted"
                                    value={showQuickStock.purchasePrice}
                                    onChange={e => setShowQuickStock({ ...showQuickStock, purchasePrice: Number(e.target.value) })}
                                    onBlur={() => updateDetailsMutation.mutate({ id: showQuickStock._id, data: { purchasePrice: showQuickStock.purchasePrice } })}
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Audit Trail & Transaction Notes</label>
                           <input className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-6 py-4 font-bold text-sm" placeholder="e.g. Size exchange for Bill #1234" value={adjustment.reason} onChange={e => setAdjustment({ ...adjustment, reason: e.target.value })} />
                        </div>
                     </div>

                     <button
                        onClick={() => adjustStockMutation.mutate({
                           id: showQuickStock._id,
                           data: {
                              quantity: adjustment.quantity,
                              reason: adjustment.reason,
                              type: adjustment.type
                           }
                        })}
                        disabled={adjustStockMutation.isPending}
                        className="w-full mt-10 bg-charcoal text-white py-4 sm:py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center justify-center gap-3"
                     >
                        {adjustStockMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> Authorize Sync</>}
                     </button>
                  </motion.div>
               </div>
            )}

            {showHistory && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/40 backdrop-blur-md" onClick={() => setShowHistory(null)} />
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full admin-modal-container max-w-2xl rounded-[3.5rem] shadow-2xl p-12 border border-border-light max-h-[80vh] flex flex-col">
                     <div className="flex items-center justify-between mb-10 flex-none">
                        <div>
                           <h2 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Audit Ledger</h2>
                           <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">{showHistory.productName} — {showHistory.size}/{showHistory.color}</p>
                        </div>
                        <button onClick={() => setShowHistory(null)} className="p-4 hover:bg-light-bg rounded-full"><X size={24} /></button>
                     </div>

                     <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-6">
                        {isLoadingHistory ? (
                           <div className="py-20 text-center"><Loader2 className="animate-spin text-premium-gold mx-auto" size={40} /></div>
                        ) : (!history || history.length === 0) ? (
                           <div className="py-20 text-center text-xs font-bold text-text-muted uppercase tracking-widest">No movement history found.</div>
                        ) : history.map((m, i) => (
                           <div key={i} className="p-4 sm:p-6 bg-light-bg/30 rounded-3xl border border-border-light/50 flex items-center justify-between group hover:border-premium-gold transition-all">
                              <div className="flex items-center flex-wrap gap-4">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${m.quantity > 0 ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-red-500 shadow-red-500/20'}`}>
                                    {m.quantity > 0 ? <Plus size={18} /> : <ArrowDown size={18} />}
                                 </div>
                                 <div>
                                    <p className="text-xs font-black text-charcoal uppercase tracking-tight">{m.reason}</p>
                                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">
                                       {new Date(m.timestamp).toLocaleString()} • {m.performedBy?.name || 'System'}
                                    </p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className={`text-lg font-black tracking-tighter ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                                 </p>
                                 <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Units</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>

         {/* ─── Delete Product Confirmation ─── */}
         <AnimatePresence>
            {deleteProductConfirm && (
               <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={() => setDeleteProductConfirm(null)} />
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full admin-modal-container max-w-sm rounded-[2.5rem] shadow-2xl border border-border-light p-10 text-center">
                     <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100">
                        <Trash2 size={28} className="text-red-500" />
                     </div>
                     <h3 className="text-xl font-black text-charcoal uppercase tracking-tight mb-2">Remove from Gallery?</h3>
                     <p className="text-sm font-bold text-charcoal mb-1">{deleteProductConfirm.name}</p>
                     <p className="text-[10px] font-bold text-text-muted mb-2">{deleteProductConfirm.category?.name}</p>
                     <p className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-4 py-2 rounded-xl mb-6">
                        If this product has orders or bills, it will be deactivated (hidden) instead of permanently deleted to preserve your financial records.
                     </p>
                     <div className="flex gap-3">
                        <button onClick={() => setDeleteProductConfirm(null)} className="flex-1 py-4 bg-light-bg text-charcoal font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-border-light transition-all">Cancel</button>
                        <button
                           onClick={() => deleteProductMutation.mutate(deleteProductConfirm._id)}
                           disabled={deleteProductMutation.isPending}
                           className="flex-1 py-4 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                           {deleteProductMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
