import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
   Plus, Search, Filter, Edit3, Trash2, Package, Tag, IndianRupee, 
   Layers, Eye, Image as ImageIcon, Loader2, X, Save, Sparkles, 
   ShoppingBag, Shield, Layout, Settings2, Share2, Info, CheckCircle2, 
   ChevronDown, Boxes, LayoutGrid, List, TrendingUp, History, Globe, 
   BarChart3, AlertTriangle, Printer, QrCode, RefreshCw, ShoppingCart, Video, SearchCode, DollarSign, Percent, Calculator, MapPin, Activity, Truck,
   Archive, RotateCcw, Upload, Wrench
} from 'lucide-react';
import { StatCardSkeleton, ProductCardSkeleton, TableRowSkeleton } from '../../components/common/Skeletons';
import { adminService, productService, categoryService, inventoryService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '../../hooks/useDebounce';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import SafeImage from '../../components/common/SafeImage';
import SyncIntegrityPanel from '../../components/admin/SyncIntegrityPanel';
import ProductListItem from '../../components/admin/ProductListItem';

export default function ProductProfileCenter() {
   const [quickStockProduct, setQuickStockProduct] = useState(null);
   const [search, setSearch] = useState('');
   const [page, setPage] = useState(1);
   const [filterCategory, setFilterCategory] = useState('all');
   const [sortOrder, setSortOrder] = useState('newest');
   const [showArchived, setShowArchived] = useState(false);

   const debouncedSearch = useDebounce(search, 500);
   const queryClient = useQueryClient();
   const navigate = useNavigate();

   // --- Queries ---
   const { data: productsData, isLoading } = useQuery({
      queryKey: ['admin-products', debouncedSearch, filterCategory, sortOrder, page, showArchived],
      queryFn: () => adminService.getAdminProducts({ 
         search: debouncedSearch, 
         category: filterCategory === 'all' ? undefined : filterCategory,
         sort: sortOrder,
         page,
         limit: 20,
         showDeleted: showArchived
      }).then(r => r.data.data),
   });

   // ── LIVE STOCK SOCKET LISTENER ──
   useEffect(() => {
     const socket = adminService.getSocket?.();
     if (socket) {
       socket.on('STOCK_UPDATED', () => {
         queryClient.invalidateQueries(['admin-products']);
       });
       return () => socket.off('STOCK_UPDATED');
     }
   }, [queryClient]);

   // getAdminProducts: ApiResponse.success(res, { data:[...], stats, nextCursor, hasMore })
   // .then(r => r.data.data) gives us the inner payload: { data:[...products], stats, nextCursor }
   const products = Array.isArray(productsData?.data) ? productsData.data : (Array.isArray(productsData) ? productsData : []);
   const pagination = { total: productsData?.stats?.totalProfiles, hasMore: productsData?.hasMore };
   const stats = productsData?.stats || { onlineEnabled: 0, billingEnabled: 0, procuredStock: 0, totalProfiles: 0 };

   const { data: categoriesRaw } = useQuery({
      queryKey: ['categories'],
      queryFn: () => categoryService.getCategories().then(r => r.data.data?.categories || r.data.categories || r.data.data || r.data),
   });
   const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];

   // --- Mutations ---
   const restoreMutation = useMutation({
      mutationFn: (id) => adminService.restoreProduct(id),
      onSuccess: () => {
         queryClient.invalidateQueries(['admin-products']);
         toast.success('Product Profile Restored');
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Restoration failed'),
   });

   const purgeMutation = useMutation({
      mutationFn: (id) => adminService.purgeProduct(id),
      onSuccess: () => {
         queryClient.invalidateQueries(['admin-products']);
         toast.success('Product Profile Permanently Purged');
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Purge failed'),
   });

   const deleteMutation = useMutation({
      mutationFn: (id) => productService.deleteProduct(id),
      onSuccess: () => {
         queryClient.invalidateQueries(['admin-products']);
         toast.success('Product Profile Archived');
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Archival failed'),
   });

   // --- Render Helpers ---
   const StatCard = ({ label, value, icon: Icon, color }) => (
      <div className="bg-white p-4 sm:p-4 sm:p-6 rounded-[2rem] border border-border-light shadow-sm flex items-center gap-4 group hover:border-premium-gold transition-all">
         <div className={`p-4 rounded-2xl ${color} text-white shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
            <Icon size={20} />
         </div>
         <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{label}</p>
            <p className="text-xl font-black text-charcoal">{value}</p>
         </div>
      </div>
   );

   return (
      <div className="space-y-8 pb-20">
         <Helmet><title>Product Profile Center | Magizhchi Admin</title></Helmet>

         {/* Header */}
         <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
               <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-4xl font-black text-charcoal tracking-tighter uppercase">
                     {showArchived ? 'Archived Profiles' : 'Product Profiles'}
                  </h1>
                  <span className="px-3 py-1 bg-premium-gold text-charcoal rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-premium-gold/20">
                     {showArchived ? 'Archive Vault' : 'Master Module'}
                  </span>
               </div>
               <p className="text-xs text-text-muted font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity size={14} className="text-premium-gold" /> 
                  {showArchived ? 'Restoring records recovers them across all channels' : 'Centralized Inventory, Branding & Channel Control'}
               </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
               <button 
                  onClick={() => setShowArchived(!showArchived)}
                  className={`px-4 sm:px-4 sm:px-6 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center gap-3 active:scale-95 ${
                     showArchived 
                     ? 'bg-amber-100 text-amber-700 border-2 border-amber-200' 
                     : 'bg-white border border-border-light text-text-muted hover:border-premium-gold'
                  }`}
               >
                  {showArchived ? <RotateCcw size={18} /> : <Archive size={18} />}
                  {showArchived ? 'Show Active' : 'Show Archived'}
               </button>
               <button 
                  onClick={() => navigate('/admin/products/new')} 
                  className="px-4 md:px-4 md:px-8 py-4 bg-charcoal text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-charcoal/20 hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-3 active:scale-95"
               >
                  <Plus size={18} /> New Product Profile
               </button>
            </div>
         </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
             {isLoading && products.length === 0 ? (
                <>
                   <StatCardSkeleton />
                   <StatCardSkeleton />
                   <StatCardSkeleton />
                   <StatCardSkeleton />
                </>
             ) : (
                <>
                   <StatCard label="Total Profiles" value={stats.totalProfiles} icon={Boxes} color="bg-charcoal" />
                   <StatCard 
                     label="Enterprise Inventory" 
                     value={stats.procuredStock} 
                     icon={Truck} 
                     color="bg-emerald-600" 
                   />
                   <StatCard label="Online Ready" value={stats.onlineEnabled} icon={Globe} color="bg-blue-600" />
                   <StatCard label="POS Billing" value={stats.billingEnabled} icon={ShoppingCart} color="bg-orange-600" />
                </>
             )}
          </div>

          <div className="mb-6">
             <SyncIntegrityPanel />
          </div>

         {/* Search & Global Filters */}
         <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-premium-gold transition-colors" size={20} />
               <input 
                  className="w-full bg-white border border-border-light rounded-[2rem] pl-16 pr-6 py-5 focus:outline-none focus:ring-4 focus:ring-premium-gold/10 font-bold text-sm shadow-sm transition-all"
                  placeholder={showArchived ? "Search in archive..." : "Search by name, SKU, or barcode..."}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
               />
            </div>
            <select 
               className="bg-white border border-border-light rounded-[2rem] px-4 md:px-4 md:px-8 py-5 text-xs font-black uppercase tracking-widest text-charcoal outline-none focus:ring-4 focus:ring-premium-gold/10 shadow-sm"
               value={filterCategory}
               onChange={e => setFilterCategory(e.target.value)}
            >
               <option value="all">All Categories</option>
               {categories?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
         </div>

         {/* Main Content Area */}
         <AnimatePresence mode="wait">
            {isLoading && products.length === 0 ? (
               <div className="flex flex-col gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                     <div key={i} className="h-32 bg-white rounded-3xl border border-border-light animate-pulse" />
                  ))}
               </div>
            ) : products.length === 0 ? (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-border-light">
                  <Package size={64} className="mx-auto text-text-muted/20 mb-6" />
                  <h3 className="text-xl font-black text-charcoal uppercase tracking-tight">
                     {showArchived ? 'Archive is Empty' : 'Empty Profile Center'}
                  </h3>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-2">
                     {showArchived ? 'No archived records found.' : 'No products found matching your search.'}
                  </p>
                  {!showArchived && (
                     <button onClick={() => navigate('/admin/products/new')} className="mt-8 px-10 py-4 bg-light-bg text-charcoal rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-premium-gold transition-all">Create First Profile</button>
                  )}
               </motion.div>
            ) : (
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4"
               >
                  {products.map((product) => (
                     <ProductListItem 
                        key={product._id} 
                        product={product} 
                        onEdit={() => navigate(`/admin/products/edit/${product._id}`)}
                        onDelete={() => {
                           if (window.confirm('Archive this product? It will be hidden from all channels.')) {
                              deleteMutation.mutate(product._id);
                           }
                        }}
                        onRestore={() => restoreMutation.mutate(product._id)}
                        onPurge={() => {
                           if (window.confirm('CRITICAL ACTION: Permanently delete this product and ALL its inventory history? This cannot be undone.')) {
                              purgeMutation.mutate(product._id);
                           }
                        }}
                        onQuickStock={setQuickStockProduct}
                     />
                  ))}
               </motion.div>
            )}
         </AnimatePresence>

         {/* Pagination */}
         {pagination && pagination.pages > 1 && (
            <div className="flex justify-center mt-12 gap-3">
               <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-12 h-12 bg-white border border-border-light rounded-2xl flex items-center justify-center text-text-muted hover:bg-premium-gold hover:text-charcoal transition-all disabled:opacity-30"><ChevronDown className="rotate-90" /></button>
               {Array.from({ length: pagination.pages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i+1)} className={`w-12 h-12 rounded-2xl text-[10px] font-black transition-all ${page === i+1 ? 'bg-charcoal text-white shadow-xl' : 'bg-white border border-border-light hover:border-premium-gold'}`}>{i+1}</button>
               ))}
               <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="w-12 h-12 bg-white border border-border-light rounded-2xl flex items-center justify-center text-text-muted hover:bg-premium-gold hover:text-charcoal transition-all disabled:opacity-30"><ChevronDown className="-rotate-90" /></button>
            </div>
         )}

         <AnimatePresence>
            {quickStockProduct && (
               <QuickStockModal 
                  product={quickStockProduct} 
                  onClose={() => setQuickStockProduct(null)} 
               />
            )}
         </AnimatePresence>
      </div>
   );
}

function QuickStockModal({ product, onClose }) {
   const [formData, setFormData] = useState({
      size: '',
      color: '',
      stock: 1,
      sellingPrice: product.sellingPrice || 0,
      sku: ''
   });
   const queryClient = useQueryClient();

   const addStockMutation = useMutation({
      mutationFn: (data) => inventoryService.createItem({
         productId: product._id,
         productName: product.name,
         category: product.category?.name || 'General',
         ...data,
         totalStock: Number(data.stock),
         sellingPrice: Number(data.sellingPrice)
      }),
      onSuccess: () => {
         queryClient.invalidateQueries(['admin-products']);
         queryClient.invalidateQueries(['admin-inventory']);
         toast.success(`Stock profile for ${product.name} created!`);
         onClose();
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to add stock')
   });

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" onClick={onClose} />
         <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 20 }} 
            className="relative bg-white w-full admin-modal-container max-w-xl rounded-[3.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col"
         >
            <div className="p-12 pb-0 flex items-center justify-between">
               <div>
                  <h3 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Manual Stock Entry</h3>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2">Initialize physical stock for <span className="text-premium-gold">{product.name}</span></p>
               </div>
               <button onClick={onClose} className="p-4 hover:bg-light-bg rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="p-12 space-y-8">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Size (Required)</label>
                     <input className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-4 font-bold text-sm" placeholder="e.g. XL, 32" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Color (Required)</label>
                     <input className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-4 font-bold text-sm" placeholder="e.g. Navy Blue" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Initial Stock (Pcs)</label>
                     <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-4 font-black text-xl" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Selling Price (₹)</label>
                     <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-4 font-black text-xl" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Reference SKU (Optional)</label>
                  <input className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-4 font-bold text-sm" placeholder="Leave blank for auto-gen" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
               </div>

               <div className="p-4 sm:p-4 sm:p-6 bg-orange-50 rounded-3xl border border-orange-100">
                  <p className="text-[10px] font-bold text-orange-700 leading-relaxed">
                     <span className="font-black uppercase tracking-widest block mb-1">💡 Flexible Workflow</span>
                     This entry is optional. You can close this window now and add stock later from the Procurement Hub or Inventory Master.
                  </p>
               </div>

               <button 
                  onClick={() => {
                     if(!formData.size || !formData.color) return toast.error('Size and Color are required');
                     addStockMutation.mutate(formData);
                  }}
                  disabled={addStockMutation.isPending}
                  className="w-full py-4 sm:py-4 sm:py-6 bg-charcoal text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center justify-center gap-3"
               >
                  {addStockMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Authorize Stock Entry</>}
               </button>
            </div>
         </motion.div>
      </div>
   );
}

