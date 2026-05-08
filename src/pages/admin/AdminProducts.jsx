import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Filter, Edit, Edit3, Trash2, Package, Tag, IndianRupee, 
  Layers, Eye, Image as ImageIcon, Loader2, X, Save, Sparkles, 
  ShoppingBag, Shield, Layout, Settings2, Share2, Info, CheckCircle2, ChevronDown
} from 'lucide-react';
import { adminService, productService, categoryService, inventoryService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '../../hooks/useDebounce';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { resolveAssetURL } from '../../utils/assetResolver';

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function AdminProducts() {
  const [showForm, setShowForm] = useState(() => {
    return localStorage.getItem('open_product_form') === 'true';
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); 
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const debouncedSearch = useDebounce(search, 500);
  const queryClient = useQueryClient();
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // --- Queries ---
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products', debouncedSearch, filterCategory, sortOrder, page],
    queryFn: () => adminService.getAdminProducts({ 
      search: debouncedSearch, 
      category: filterCategory === 'all' ? undefined : filterCategory,
      sort: sortOrder,
      page,
      limit: 10
    }).then(r => r.data),
  });
  
  const products = productsData?.data || [];
  const pagination = productsData?.pagination;

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories().then(r => r.data.data || r.data),
  });
  const categories = categoriesData?.categories || categoriesData || [];

  const { data: inventoryItems } = useQuery({
    queryKey: ['admin-inventory-all-for-media'],
    queryFn: () => inventoryService.getInventory().then(r => r.data.data),
    enabled: showForm
  });

  // --- Query for single product (for direct navigation/edit) ---
  const { data: singleProductResp, isLoading: isLoadingSingle } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => adminService.getAdminProductById(id).then(r => r.data),
    enabled: !!id && id !== 'new' && !products.find(p => p._id === id)
  });
  const singleProduct = singleProductResp?.data?.product;

  useEffect(() => {
    if (id && id !== 'new') {
      const p = products.find(prod => prod._id === id) || singleProduct;
      if (p) {
        setFormData({ 
          ...p, 
          category: p.category?._id || p.category || ''
        });
        setEditingId(id);
        setShowForm(true);
      }
    } else if (id === 'new' || pathname.includes('/products/new')) {
      setShowForm(true);
      setEditingId(null);
    } else {
      setShowForm(false);
      setEditingId(null);
    }
  }, [id, products, singleProduct, pathname]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterCategory, sortOrder]);

  // --- State for the "Display Profile" ---
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('draft_product_formData');
      return saved ? JSON.parse(saved) : {
        name: '', sku: '', category: '', brand: 'Magizhchi', description: '',
        sellingPrice: '', discountPercentage: 0,
        images: [], isFeatured: false, isBestSeller: false, isNewArrival: true, isActive: true
      };
    } catch {
      return {
        name: '', sku: '', category: '', brand: 'Magizhchi', description: '',
        sellingPrice: '', discountPercentage: 0,
        images: [], isFeatured: false, isBestSeller: false, isNewArrival: true, isActive: true
      };
    }
  });

  // --- Sync Draft to LocalStorage ---
  useEffect(() => {
    localStorage.setItem('draft_product_formData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem('open_product_form', showForm);
  }, [showForm]);

  // --- Mutations ---
  const upsertMutation = useMutation({
    mutationFn: ({ id, data }) => id ? productService.updateProduct(id, data) : productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });
      toast.success(editingId ? 'Display settings updated' : 'Product display profile created');
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Action failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });
      toast.success('Product display profile deleted');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Product name is required');
    if (!formData.category) return toast.error('Category is required');
    if (!formData.sellingPrice) return toast.error('Selling price is required for display');
    
    // In this new flow, we don't send variants/stock from here.
    // Stock is handled exclusively in the Inventory module.
    const cleanData = { ...formData };
    delete cleanData.variants; // Ensure no variants are sent from this module

    upsertMutation.mutate({ id: editingId, data: cleanData });
  };

  const resetForm = () => {
    setFormData({
      name: '', sku: '', category: '', brand: 'Magizhchi', description: '',
      sellingPrice: '', discountPercentage: 0,
      images: [], isFeatured: false, isBestSeller: false, isNewArrival: true, isActive: true
    });
    setEditingId(null);
    setShowForm(false);
    setActiveTab('basic');
    navigate('/admin/products');
  };

  const handleAutofill = (item) => {
    const itemCat = item.category?.toLowerCase() || '';
    const categoryId = categories?.find(c => c.name.toLowerCase() === itemCat)?._id || '';
    setFormData(prev => ({
      ...prev,
      name: item.productName,
      category: categoryId,
      sku: item.sku || '',
      sellingPrice: item.sellingPrice || '',
      images: item.images?.length > 0 ? item.images : prev.images
    }));
    toast.success(`Data pulled for ${item.productName}`);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('File too large (Max 5MB)');
    
    setIsUploading(true);
    const fd = new FormData();
    fd.append('image', file);

    try {
      const res = await adminService.uploadImage(fd);
      if (res.data.success) {
        setFormData(prev => ({ ...prev, images: [...prev.images, res.data.url] }));
        toast.success('Image uploaded');
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Product Display Logic — Admin</title></Helmet>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-charcoal tracking-tighter uppercase mb-1">Product Display</h1>
          <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Website Listing & Aesthetics Control</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-charcoal text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-2 shadow-xl shadow-charcoal/10">
              <Plus size={14} /> Create Display Profile
           </button>
        </div>
      </div>

      {/* Logic Information Alert */}
      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex items-start gap-4">
         <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600"><Info size={20} /></div>
         <div>
            <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight">Display vs Inventory Logic</h4>
            <p className="text-xs text-indigo-700 font-medium leading-relaxed mt-1">
               This module controls <b>how products look</b> on the website (Images, Descriptions, SEO). 
               <b>Stock control</b> is now exclusively managed in the <a href="/admin/inventory" className="underline font-bold">Inventory module</a>. 
               Products here will automatically pull stock availability based on their name matching the inventory entries.
            </p>
         </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            className="w-full bg-white border border-border-light rounded-2xl pl-16 pr-6 py-4 focus:outline-none focus:ring-2 focus:ring-premium-gold/20 font-bold text-sm shadow-sm transition-all"
            placeholder="Search display profiles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select 
            className="bg-white border border-border-light rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-charcoal outline-none focus:ring-2 focus:ring-premium-gold/20 shadow-sm"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2.5rem] border border-border-light overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-light-bg/50 border-b border-border-light">
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-widest">Visual Identity</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-widest">Market Class</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-widest">Product Profile</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-widest">Variant Depth (Size/Color/Stock)</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-widest">Global Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light/40">
              {isLoading ? (
                <tr><td colSpan="6" className="py-24 text-center"><Loader2 className="animate-spin text-premium-gold mx-auto" size={40} /></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="6" className="py-24 text-center text-xs font-bold text-text-muted uppercase tracking-widest">No display profiles found. Click "Create Display Profile" to showcase your stock.</td></tr>
              ) : products.map(p => (
                <tr key={p._id} className="hover:bg-light-bg/20 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={resolveAssetURL(p.images?.[0])} 
                          alt="" 
                          className="w-16 h-20 rounded-2xl object-cover bg-light-bg shadow-sm" 
                          onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                        />
                        {!p.isActive && <div className="absolute inset-0 bg-charcoal/60 rounded-2xl flex items-center justify-center text-[8px] text-white font-black uppercase">Hidden</div>}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-charcoal text-sm tracking-tight">{p.name}</span>
                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">{p.sku || 'NO-SKU'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-4 py-1.5 bg-light-bg rounded-full text-[10px] font-black uppercase tracking-widest text-charcoal">{p.category?.name || 'Uncategorized'}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-charcoal text-base tracking-tighter">₹{p.sellingPrice}</span>
                      {p.discountPercentage > 0 && <span className="text-[10px] text-stock-out font-black uppercase tracking-widest">-{p.discountPercentage}% OFF</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                       <div className="flex gap-1 flex-wrap">
                          {p.inventorySummary?.sizes?.slice(0, 5).map(s => <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black border border-indigo-100">{s}</span>)}
                          {p.inventorySummary?.sizes?.length > 5 && <span className="text-[9px] font-bold text-text-muted">+{p.inventorySummary.sizes.length - 5}</span>}
                       </div>
                       <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${p.inventorySummary?.totalStock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                             {p.inventorySummary?.totalStock || 0} in stock
                          </span>
                          <span className="text-[9px] font-bold text-text-muted uppercase">{p.inventorySummary?.variantCount || 0} variants</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex gap-2">
                      {p.isFeatured && <span className="p-2 bg-premium-gold/10 text-premium-gold rounded-xl shadow-sm" title="Featured"><Sparkles size={14} /></span>}
                      {p.isBestSeller && <span className="p-2 bg-charcoal/10 text-charcoal rounded-xl shadow-sm" title="Best Seller"><ShoppingBag size={14} /></span>}
                      <button 
                        onClick={() => {
                          productService.updateProduct(p._id, { isActive: !p.isActive })
                            .then(() => {
                              queryClient.invalidateQueries(['admin-products']);
                              toast.success(`Product is now ${!p.isActive ? 'LIVE' : 'HIDDEN'}`);
                            });
                        }}
                        className={`p-2 rounded-xl shadow-sm transition-all ${p.isActive ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                        title={p.isActive ? 'Active - Click to Hide' : 'Hidden - Click to Show'}
                      >
                        {p.isActive ? <CheckCircle2 size={14} /> : <Shield size={14} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <button 
                        onClick={() => { 
                          setFormData({ ...p, category: p.category?._id || p.category }); 
                          setEditingId(p._id); 
                          setShowForm(true); 
                        }} 
                        className="p-3 bg-light-bg text-charcoal rounded-xl hover:bg-premium-gold hover:text-white transition-all shadow-sm"
                      >
                        <Settings2 size={18} />
                      </button>
                      <button 
                        onClick={() => { if(window.confirm('Delete display profile?')) deleteMutation.mutate(p._id); }} 
                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={18} />
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
          <div className="px-8 py-6 border-t border-border-light flex items-center justify-between gap-4 bg-light-bg/10">
            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">
              Showing page {page} of {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-border-light rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, pagination.pages - 4)) + i;
                if (p < 1 || p > pagination.pages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${p === page ? 'bg-charcoal text-white shadow-xl' : 'border border-border-light hover:border-premium-gold bg-white'}`}>
                    {p}
                  </button>
                );
              })}
              <button 
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-border-light rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Display Settings Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/40 backdrop-blur-md" onClick={resetForm} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-border-light"
            >
              <div className="flex-none p-10 flex items-center justify-between border-b border-border-light bg-light-bg/50">
                <div>
                  <h2 className="text-2xl font-black text-charcoal tracking-tight uppercase">{editingId ? 'Refine Appearance' : 'New Display Profile'}</h2>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">Aesthetics & Content Control</p>
                </div>
                <button onClick={resetForm} className="p-3 hover:bg-white rounded-full transition-colors text-text-muted hover:text-charcoal"><X size={24} /></button>
              </div>

              <div className="flex-none flex items-center gap-1 px-10 py-5 bg-white border-b border-border-light overflow-x-auto no-scrollbar">
                {[
                  { id: 'basic', label: 'Identity & Info', icon: Layout },
                  { id: 'media', label: 'Media Gallery', icon: ImageIcon },
                  { id: 'variants', label: 'Sizes & Colors', icon: Layers }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-charcoal text-white shadow-xl shadow-charcoal/20' : 'text-text-muted hover:bg-light-bg'}`}
                  >
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="max-w-4xl mx-auto">
                  {activeTab === 'basic' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                      
                      {!editingId && (
                        <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2.5rem] flex items-center justify-between group">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform"><Sparkles size={20} /></div>
                              <div>
                                 <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight">Magic Fill from Inventory</h4>
                                 <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-0.5">Quick-link existing stock data to this profile</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              {inventoryItems?.find(i => i.productName === formData.name)?.images?.[0] && (
                                  <img 
                                    src={resolveAssetURL(inventoryItems.find(i => i.productName === formData.name).images[0])} 
                                    alt="" 
                                    className="w-12 h-12 rounded-xl object-cover bg-white shadow-md border-2 border-white ring-1 ring-indigo-100" 
                                  />
                              )}
                              <select 
                                onChange={(e) => {
                                  const item = inventoryItems?.find(i => i._id === e.target.value);
                                  if (item) handleAutofill(item);
                                }}
                                className="bg-white border-none rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm outline-none focus:ring-2 focus:ring-indigo-600/20 min-w-[240px]"
                                value={inventoryItems?.find(i => i.productName === formData.name)?._id || ''}
                              >
                                <option value="">Select Inventory Item...</option>
                                {[...new Set(inventoryItems?.filter(i => !i.productRef).map(i => i.productName))].map(name => {
                                  const item = inventoryItems.find(i => i.productName === name);
                                  return <option key={item._id} value={item._id}>{name}</option>
                                })}
                              </select>
                           </div>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Product Display Name</label>
                              <input required className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 transition-all font-bold text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Ancel Fit Black Pants" />
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Category</label>
                                <select required className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 transition-all font-black text-xs uppercase" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                  <option value="">Choose...</option>
                                  {categories?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">SKU Identity</label>
                                <input className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 transition-all font-black text-xs uppercase" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})} placeholder="SKU-XXXX" />
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Retail Price (₹)</label>
                                <input type="number" required className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 transition-all font-black text-sm" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} placeholder="0.00" />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Discount %</label>
                                <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 transition-all font-black text-sm" value={formData.discountPercentage} onChange={e => setFormData({...formData, discountPercentage: e.target.value})} placeholder="0" />
                              </div>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Product Narrative (Description)</label>
                           <textarea rows="9" className="w-full bg-light-bg border-none rounded-[2rem] px-6 py-6 focus:ring-2 focus:ring-premium-gold/30 transition-all font-medium text-sm resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Write an engaging story for this product..." />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-light-bg/50 rounded-[2.5rem] border border-border-light">
                        {[
                          { key: 'isFeatured', label: 'Featured', icon: Sparkles, color: 'bg-premium-gold' },
                          { key: 'isBestSeller', label: 'Best Seller', icon: ShoppingBag, color: 'bg-charcoal' },
                          { key: 'isNewArrival', label: 'New Arrival', icon: Package, color: 'bg-blue-500' },
                          { key: 'isActive', label: 'Live on Web', icon: CheckCircle2, color: 'bg-green-500' }
                        ].map(toggle => (
                          <div 
                            key={toggle.key} 
                            onClick={() => setFormData(prev => ({ ...prev, [toggle.key]: !prev[toggle.key] }))}
                            className="flex items-center gap-4 cursor-pointer group select-none"
                          >
                            <div className={`w-12 h-7 rounded-full relative transition-all duration-500 ${formData[toggle.key] ? toggle.color + ' shadow-lg' : 'bg-gray-300'}`}>
                              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${formData[toggle.key] ? 'left-6' : 'left-1'}`} />
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${formData[toggle.key] ? 'text-charcoal' : 'text-text-muted'}`}>{toggle.label}</span>
                              <span className="text-[7px] font-bold text-text-muted/50 uppercase tracking-tighter">Status: {formData[toggle.key] ? 'ENABLED' : 'DISABLED'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'media' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                      <div className="p-16 border-2 border-dashed border-border-light rounded-[3.5rem] bg-light-bg/30 text-center relative group overflow-hidden hover:border-premium-gold transition-all">
                        <div className="relative z-10">
                          <ImageIcon size={64} className="mx-auto mb-6 text-text-muted/30 group-hover:scale-110 group-hover:text-premium-gold transition-all duration-500" />
                          <h3 className="text-xl font-black text-charcoal mb-2 uppercase tracking-tight">Visual Assets</h3>
                          <p className="text-xs text-text-muted mb-10 font-bold uppercase tracking-widest">High-resolution imagery for customer engagement</p>
                          
                          <div className="flex flex-col max-w-lg mx-auto gap-4">
                            <div className="flex gap-2">
                              <input 
                                placeholder="External Image URL..." 
                                className="flex-1 bg-white shadow-xl shadow-black/5 rounded-2xl px-6 py-4 outline-none border border-border-light focus:border-premium-gold transition-all text-sm font-bold" 
                                value={imageUrl} 
                                onChange={e => setImageUrl(e.target.value)} 
                              />
                              <button type="button" onClick={() => { if(imageUrl) { setFormData({...formData, images: [...formData.images, imageUrl]}); setImageUrl(''); } }} className="bg-charcoal text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-premium-gold transition-colors">Add</button>
                            </div>
                            <div className="relative">
                              <input type="file" id="product-upload" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                               <div className="flex gap-4">
                                 <label htmlFor="product-upload" className={`flex-1 flex items-center justify-center gap-3 bg-white border border-border-light py-4 rounded-2xl cursor-pointer hover:bg-light-bg transition-all font-black text-[10px] uppercase tracking-widest text-text-muted ${isUploading ? 'opacity-50' : ''}`}>
                                   {isUploading ? <Loader2 size={16} className="animate-spin text-premium-gold" /> : <Plus size={16} />} 
                                   {isUploading ? 'Cloud Syncing...' : 'Upload from System'}
                                 </label>
                               </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6">
                        {formData.images.map((img, i) => (
                          <div key={i} className="relative group aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-light-bg border border-border-light shadow-md hover:shadow-xl transition-all">
                            <img src={resolveAssetURL(img)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            {i === 0 && <div className="absolute top-4 left-4 bg-premium-gold text-charcoal text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg">Cover Asset</div>}
                            <div className="absolute inset-0 bg-charcoal/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button type="button" onClick={() => setFormData({...formData, images: formData.images.filter((_, idx) => idx !== i)})} className="bg-white text-red-500 p-3 rounded-2xl hover:scale-110 transition-transform shadow-xl"><Trash2 size={18} /></button>
                              <button type="button" onClick={() => { const imgs = [...formData.images]; [imgs[0], imgs[i]] = [imgs[i], imgs[0]]; setFormData({...formData, images: imgs}); }} className="bg-white text-charcoal p-3 rounded-2xl hover:scale-110 transition-transform shadow-xl" title="Make Cover"><Eye size={18} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'variants' && (
                    <VariantManagement 
                      productName={formData.name} 
                      category={categories?.find(c => c._id === formData.category)?.name}
                      productId={editingId}
                      sellingPrice={formData.sellingPrice}
                    />
                  )}
                </div>
              </form>

              <div className="flex-none p-10 bg-light-bg/80 backdrop-blur-md border-t border-border-light flex items-center justify-between">
                <button type="button" onClick={resetForm} className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-charcoal transition-colors">Discard Configuration</button>
                <div className="flex gap-4">
                  <button onClick={handleSubmit} disabled={upsertMutation.isPending} className="bg-charcoal text-white px-12 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-charcoal/30 hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-3">
                    {upsertMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> {editingId ? 'Publish Updates' : 'Publish Product'}</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VariantManagement({ productName, category, productId, sellingPrice }) {
  const queryClient = useQueryClient();
  const [newVariant, setNewVariant] = useState({ size: '', color: '', sku: '' });

  const { data: variants, isLoading } = useQuery({
    queryKey: ['product-variants', productName],
    queryFn: () => inventoryService.getInventory({ search: productName }).then(r => (r.data?.data || []).filter(i => i.productName === productName)),
    enabled: !!productName
  });

  const createMutation = useMutation({
    mutationFn: (data) => inventoryService.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['product-variants', productName]);
      toast.success('Variant added');
      setNewVariant({ size: '', color: '', sku: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add variant')
  });

  const handleAdd = () => {
    if (!newVariant.size || !newVariant.color) return toast.error('Size and Color are required');
    createMutation.mutate({
      productName,
      category,
      size: newVariant.size,
      color: newVariant.color,
      sku: newVariant.sku,
      sellingPrice: sellingPrice,
      productRef: productId
    });
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => inventoryService.updateDetails(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['product-variants', productName]);
      queryClient.invalidateQueries(['admin-inventory']);
      queryClient.invalidateQueries(['product']);
      toast.success('Variant updated');
      setEditingVariant(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => inventoryService.deleteItem(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['product-variants', productName]);
      queryClient.invalidateQueries(['admin-inventory']);
      queryClient.invalidateQueries(['admin-products']);
      queryClient.invalidateQueries(['product']);
      queryClient.invalidateQueries(['admin-health']);
      queryClient.invalidateQueries(['dashboard-stats']);
      // Show contextual message: archived (has history) or permanently deleted
      const archived = res?.data?.data?.archived;
      if (archived) {
        toast.success('Variant archived — sales history preserved for audit', { icon: '🗃️' });
      } else {
        toast.success('Variant permanently removed');
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove variant')
  });

  const [editingVariant, setEditingVariant] = useState(null);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
      <div className="bg-light-bg/50 p-8 rounded-[2.5rem] border border-border-light">
        <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-6 ml-1">Add New Size/Color Combination</h4>
        <div className="grid md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Size (e.g. M, 32, Free)</label>
            <div className="bg-white rounded-xl border border-border-light focus-within:ring-2 focus-within:ring-premium-gold/30 transition-all flex items-center pr-4">
              {STANDARD_SIZES.includes(newVariant.size) || !newVariant.size ? (
                <select 
                  className="w-full bg-transparent border-none py-3 px-4 text-sm font-bold appearance-none cursor-pointer"
                  value={newVariant.size}
                  onChange={e => setNewVariant({...newVariant, size: e.target.value})}
                >
                  <option value="">Select Size</option>
                  {STANDARD_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="custom">Other...</option>
                </select>
              ) : (
                <div className="relative w-full">
                  <input 
                    className="w-full bg-transparent border-none py-3 px-4 text-sm font-bold pr-8" 
                    value={newVariant.size === 'custom' ? '' : newVariant.size}
                    onChange={e => setNewVariant({...newVariant, size: e.target.value})}
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={() => setNewVariant({...newVariant, size: ''})}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {(STANDARD_SIZES.includes(newVariant.size) || !newVariant.size) && <ChevronDown size={14} className="text-text-muted pointer-events-none" />}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Color (e.g. Black, Navy)</label>
            <input className="w-full bg-white rounded-xl px-4 py-3 text-sm font-bold border border-border-light focus:ring-2 focus:ring-premium-gold/30" value={newVariant.color} onChange={e => setNewVariant({...newVariant, color: e.target.value})} placeholder="Color" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Custom SKU (Optional)</label>
            <input className="w-full bg-white rounded-xl px-4 py-3 text-sm font-bold border border-border-light focus:ring-2 focus:ring-premium-gold/30" value={newVariant.sku} onChange={e => setNewVariant({...newVariant, sku: e.target.value.toUpperCase()})} placeholder="SKU" />
          </div>
          <button type="button" onClick={handleAdd} disabled={createMutation.isPending} className="bg-charcoal text-white h-[46px] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-premium-gold transition-all flex items-center justify-center gap-2">
            {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Add Variant</>}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Active Variants ({variants?.length || 0})</h4>
        {isLoading ? <Loader2 className="animate-spin text-premium-gold" /> : variants?.length === 0 ? (
          <p className="text-xs font-bold text-text-muted italic p-10 bg-light-bg rounded-3xl text-center border border-dashed border-border-light">No sizes or colors defined yet for this product.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {variants?.map(v => (
              <div key={v._id} className="bg-white p-6 rounded-3xl border border-border-light flex flex-col gap-4 shadow-sm hover:shadow-md transition-all relative group">
                {editingVariant?._id === v._id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <input className="w-full bg-light-bg border-none rounded-xl px-4 py-2 text-xs font-black uppercase" value={editingVariant.color} onChange={e => setEditingVariant({...editingVariant, color: e.target.value})} placeholder="Color" />
                      <div className="bg-light-bg rounded-xl flex items-center pr-2">
                        {STANDARD_SIZES.includes(editingVariant.size) || !editingVariant.size ? (
                          <select 
                            className="w-full bg-transparent border-none py-2 px-4 text-xs font-black uppercase appearance-none cursor-pointer"
                            value={editingVariant.size}
                            onChange={e => setEditingVariant({...editingVariant, size: e.target.value})}
                          >
                            <option value="">Size</option>
                            {STANDARD_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                            <option value="custom">Other...</option>
                          </select>
                        ) : (
                          <div className="relative w-full">
                            <input 
                              className="w-full bg-transparent border-none py-2 px-4 text-xs font-black uppercase pr-6" 
                              value={editingVariant.size === 'custom' ? '' : editingVariant.size}
                              onChange={e => setEditingVariant({...editingVariant, size: e.target.value})}
                              autoFocus
                            />
                            <button type="button" onClick={() => setEditingVariant({...editingVariant, size: ''})} className="absolute right-0 top-1/2 -translate-y-1/2 text-text-muted"><X size={10} /></button>
                          </div>
                        )}
                        {(STANDARD_SIZES.includes(editingVariant.size) || !editingVariant.size) && <ChevronDown size={10} className="text-text-muted pointer-events-none" />}
                      </div>
                    </div>
                    <input className="w-full bg-light-bg border-none rounded-xl px-4 py-2 text-xs font-black uppercase" value={editingVariant.sku} onChange={e => setEditingVariant({...editingVariant, sku: e.target.value.toUpperCase()})} placeholder="SKU" />
                    <div className="flex gap-2">
                      <button onClick={() => updateMutation.mutate({ id: v._id, data: editingVariant })} className="flex-1 bg-charcoal text-white py-2 rounded-xl text-[10px] font-black uppercase">Save</button>
                      <button onClick={() => setEditingVariant(null)} className="flex-1 bg-light-bg text-charcoal py-2 rounded-xl text-[10px] font-black uppercase">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-black text-charcoal uppercase tracking-tight">{v.color}</div>
                        <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Size: {v.size}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Stock</div>
                        <div className={`text-lg font-black ${(v.availableStock || 0) === 0 ? 'text-red-500' : 'text-charcoal'}`}>{v.availableStock || 0}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border-light/50">
                       <span className="text-[9px] font-black text-premium-gold uppercase">{v.sku || 'REF-N/A'}</span>
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => setEditingVariant({...v})} className="p-2 bg-light-bg text-charcoal rounded-lg hover:bg-premium-gold hover:text-white transition-all"><Edit3 size={14} /></button>
                          <button onClick={() => { if(window.confirm('Delete variant?')) deleteMutation.mutate(v._id); }} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                       </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
