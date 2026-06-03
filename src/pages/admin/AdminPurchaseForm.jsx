import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Trash2, Save, X, Search, ChevronDown, Loader2, Package, Truck, 
  Calendar, Hash, IndianRupee, User, FileText, CheckCircle, Clock, 
  AlertCircle, ExternalLink, CreditCard, History, Phone, Mail, MapPin, 
  BarChart3, ArrowUpRight, ArrowDownLeft, Layers, LayoutGrid, AlertTriangle,
  Image as ImageIcon, Upload, Grid
} from 'lucide-react';
import { purchaseService, adminService, productService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const generateRowId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
     return crypto.randomUUID();
  }
  return 'row-' + Math.random().toString(36).substring(2, 11);
};

const createNewPurchaseRow = () => ({
  id: generateRowId(),
  productName: '',
  sku: '',
  color: '',
  size: '',
  _sizeMode: '', 
  quantity: '',
  costPrice: '',
  sellingPrice: '',
  images: []
});

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function AdminPurchaseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingBill, setIsUploadingBill] = useState(false);
  const [expandedPurchaseRow, setExpandedPurchaseRow] = useState(null);
  const [tempImageUrl, setTempImageUrl] = useState('');
  
  // Matrix State
  const [matrixRowId, setMatrixRowId] = useState(null);
  const [matrixData, setMatrixData] = useState({ sizes: [], colors: '' });

  const [purchaseBill, setPurchaseBill] = useState(() => {
    if (!id) {
      try {
        const saved = localStorage.getItem('purchase_draft_bill');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return {
      supplierId: '', supplierName: '', billNumber: '', billDate: new Date().toISOString().slice(0, 10),
      paymentStatus: 'credit', notes: '', paidAmount: 0, status: 'received', billImage: '',
      manualFinancialImpact: ''
    };
  });

  const [purchaseRows, setPurchaseRows] = useState(() => {
    if (!id) {
      try {
        const saved = localStorage.getItem('purchase_draft_rows');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [createNewPurchaseRow()];
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['admin-suppliers'],
    queryFn: () => purchaseService.getSuppliers().then(r => r.data),
  });
  const suppliers = suppliersData?.data || suppliersData || [];

  const { data: editData, isLoading: isLoadingEdit } = useQuery({
    queryKey: ['purchase-detail', id],
    queryFn: () => purchaseService.getPurchases({ id }).then(r => r.data.data[0]),
    enabled: !!id
  });

  useEffect(() => {
    if (id && editData) {
      setPurchaseBill({
        supplierId: editData.supplierId?._id || '',
        supplierName: editData.supplierName || '',
        billNumber: editData.billNumber || '',
        billDate: new Date(editData.purchaseDate || editData.createdAt).toISOString().slice(0, 10),
        paymentStatus: editData.paymentStatus || 'credit',
        notes: editData.notes || '',
        paidAmount: editData.paidAmount || 0,
        status: editData.status || 'received',
        billImage: editData.billImage || '',
        manualFinancialImpact: editData.pricing?.manualFinancialImpact ?? ''
      });
      setPurchaseRows(editData.items.map(item => ({
        id: generateRowId(),
        productName: item.productName,
        sku: item.sku || '',
        color: item.color || '',
        size: item.size || '',
        _sizeMode: '', 
        quantity: item.quantity,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice || item.costPrice * 1.5,
        images: item.images || []
      })));
    }
  }, [id, editData]);

  // Save draft to localStorage reactively on changes (only for new bills)
  useEffect(() => {
    if (!id) {
      localStorage.setItem('purchase_draft_bill', JSON.stringify(purchaseBill));
      localStorage.setItem('purchase_draft_rows', JSON.stringify(purchaseRows));
    }
  }, [purchaseBill, purchaseRows, id]);

  // Mutations
  const mutation = useMutation({
    mutationFn: (data) => id ? purchaseService.updatePurchase(id, data) : purchaseService.createPurchase(data),
    onSuccess: () => {
      if (!id) {
        localStorage.removeItem('purchase_draft_bill');
        localStorage.removeItem('purchase_draft_rows');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      toast.success(id ? 'Purchase updated' : 'Purchase recorded');
      navigate('/admin/procurement');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed'),
  });

  const updatePurchaseRow = (rowId, field, value) => {
    setPurchaseRows(prev => prev.map(r => r.id === rowId ? { ...r, [field]: value } : r));
  };

  const addPurchaseRow = () => setPurchaseRows(prev => [...prev, createNewPurchaseRow()]);

  const removePurchaseRow = (rowId) => {
    if (purchaseRows.length > 1) {
      setPurchaseRows(prev => prev.filter(r => r.id !== rowId));
    } else {
      setPurchaseRows([createNewPurchaseRow()]);
    }
  };

  const syncFromCatalog = async (rowId) => {
    const row = purchaseRows.find(r => r.id === rowId);
    if (!row?.productName?.trim()) return toast.error('Enter product name to sync');
    setIsUploading(true);
    try {
      const res = await productService.getProducts({ search: row.productName, limit: 1, isAdmin: 'true' });
      const product = res.data.data?.data?.[0] || res.data.data?.[0];
      if (product) {
        setPurchaseRows(prev => prev.map(r => r.id === rowId ? { 
          ...r, 
          productId: product._id,
          sellingPrice: product.sellingPrice || r.sellingPrice,
          images: product.images?.length > 0 ? product.images : r.images
        } : r));
        toast.success(`Synced metadata for "${product.name}"`);
      } else {
        toast.error('No matching product profile found');
      }
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBillImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingBill(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data } = await adminService.uploadImage(formData);
      if (data?.url) {
        setPurchaseBill(f => ({ ...f, billImage: data.url }));
        toast.success('Bill attachment uploaded');
      }
    } catch (err) { 
      toast.error('Upload failed'); 
    } finally { 
      setIsUploadingBill(false); 
    }
  };

  const grandTotal = purchaseRows.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.costPrice) || 0), 0);

  const handlePurchaseSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);

    if (!purchaseBill.supplierId || !purchaseBill.billNumber?.trim()) {
      return toast.error('Supplier and Bill Number are required');
    }

    const cleanedRows = purchaseRows
      .filter(r => r.productName?.trim() && Number(r.quantity) > 0 && Number(r.costPrice) > 0)
      .map(r => ({
        ...r,
        quantity: Number(r.quantity),
        costPrice: Number(r.costPrice),
        sellingPrice: Number(r.sellingPrice) || Number(r.costPrice) * 1.5
      }));

    if (cleanedRows.length === 0) return toast.error('Add at least one valid item');

    const payload = {
      ...purchaseBill,
      items: cleanedRows,
      pricing: {
        manualFinancialImpact: purchaseBill.manualFinancialImpact !== '' ? Number(purchaseBill.manualFinancialImpact) : null
      }
    };

    mutation.mutate(payload);
  };

  // Matrix Logic
  const openMatrix = (rowId) => {
    const row = purchaseRows.find(r => r.id === rowId);
    setMatrixRowId(rowId);
    setMatrixData({ sizes: row.size ? [row.size] : [], colors: row.color || '' });
  };

  const applyMatrix = () => {
    const row = purchaseRows.find(r => r.id === matrixRowId);
    if (!row) return;

    const colors = matrixData.colors.split(',').map(c => c.trim()).filter(c => c);
    const sizes = matrixData.sizes;

    if (sizes.length === 0) return toast.error('Select at least one size');

    // If no color specified, just use sizes
    const variants = [];
    if (colors.length === 0) {
      sizes.forEach(s => variants.push({ color: row.color, size: s }));
    } else {
      colors.forEach(c => {
        sizes.forEach(s => variants.push({ color: c, size: s }));
      });
    }

    const newRows = variants.map(v => ({
      ...row,
      id: generateRowId(),
      color: v.color,
      size: v.size
    }));

    setPurchaseRows(prev => {
      const idx = prev.findIndex(r => r.id === matrixRowId);
      const next = [...prev];
      next.splice(idx, 1, ...newRows);
      return next;
    });

    setMatrixRowId(null);
    toast.success(`Expanded into ${newRows.length} items`);
  };

  const handleCancel = () => {
    if (!id) {
      if (window.confirm('Discard all unsaved purchase bill changes and close?')) {
        localStorage.removeItem('purchase_draft_bill');
        localStorage.removeItem('purchase_draft_rows');
        navigate('/admin/procurement');
      }
    } else {
      navigate('/admin/procurement');
    }
  };

  if (id && isLoadingEdit) return <div className="h-dvh flex items-center justify-center"><Loader2 className="animate-spin text-premium-gold" size={48} /></div>;

  return (
    <div className="min-h-dvh bg-light-bg/30 pb-20">
      <Helmet><title>{id ? 'Edit' : 'New'} Procurement Bill — Admin</title></Helmet>

      {/* Header */}
      <div className="bg-white border-b border-border-light px-4 md:px-4 md:px-8 py-4 sm:py-4 sm:py-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center flex-wrap gap-4">
            <button type="button" onClick={handleCancel} className="p-2 hover:bg-light-bg rounded-xl text-text-muted">
              <X size={24} />
            </button>
            <div>
              <h1 className="text-xl font-black text-charcoal uppercase tracking-tighter">
                {id ? 'Modify Procurement' : 'Inventory Procurement'}
              </h1>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Entry Center</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Bill Total</p>
              <p className="text-xl font-black text-charcoal tabular-nums">{formatCurrency(grandTotal)}</p>
            </div>
            <button 
              type="button"
              onClick={handlePurchaseSubmit}
              disabled={mutation.isPending}
              className="bg-charcoal text-white px-4 md:px-4 md:px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-2"
            >
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Authorize Bill</>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-4 md:p-8 space-y-10">
        <form onSubmit={handlePurchaseSubmit} className="space-y-10">
          {/* Section 1: Core Logistics */}
          <section className="bg-white rounded-[3rem] border border-border-light p-5 md:p-10 shadow-sm space-y-8">
            <h2 className="text-[10px] font-black text-premium-gold uppercase tracking-[0.4em] flex items-center gap-2">
              <Truck size={14} /> Procurement Logistics
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Supplier Partner *</label>
                <select 
                  className="w-full bg-light-bg/50 border border-border-light/50 rounded-2xl px-4 sm:px-4 sm:px-6 py-4 font-black text-sm focus:ring-2 focus:ring-premium-gold/30" 
                  value={purchaseBill.supplierId} 
                  onChange={e => {
                    const s = suppliers.find(x => x._id === e.target.value);
                    setPurchaseBill({...purchaseBill, supplierId: e.target.value, supplierName: s?.name || ''});
                  }}
                >
                  <option value="">Select Partner...</option>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Supplier Bill # *</label>
                <input 
                  className="w-full bg-light-bg/50 border border-border-light/50 rounded-2xl px-4 sm:px-4 sm:px-6 py-4 font-black text-sm focus:ring-2 focus:ring-premium-gold/30 uppercase" 
                  placeholder="e.g. TAX/2024/99" 
                  value={purchaseBill.billNumber} 
                  onChange={e => setPurchaseBill({...purchaseBill, billNumber: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Transaction Date *</label>
                <input 
                  type="date" 
                  className="w-full bg-light-bg/50 border border-border-light/50 rounded-2xl px-4 sm:px-4 sm:px-6 py-4 font-black text-sm focus:ring-2 focus:ring-premium-gold/30" 
                  value={purchaseBill.billDate} 
                  onChange={e => setPurchaseBill({...purchaseBill, billDate: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Attach Bill</label>
                <input type="file" className="hidden" id="bill-img" onChange={handleBillImageUpload} />
                <label htmlFor="bill-img" className="flex items-center gap-3 w-full bg-light-bg/50 border border-dashed border-border-light/50 rounded-2xl px-4 sm:px-4 sm:px-6 py-4 cursor-pointer hover:border-premium-gold transition-all">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-text-muted">
                    {isUploadingBill ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                  </div>
                  <span className="text-[10px] font-black uppercase text-text-muted truncate">
                    {purchaseBill.billImage ? '✓ Attached' : 'Upload File'}
                  </span>
                </label>
              </div>
            </div>
          </section>

          {/* Section 2: Line Items */}
          <section className="bg-white rounded-[3rem] border border-border-light p-5 md:p-10 shadow-sm space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black text-premium-gold uppercase tracking-[0.4em] flex items-center gap-2">
                <Package size={14} /> Stock In-Flow
              </h2>
              <div className="flex gap-2">
                <span className="text-[9px] font-black text-text-muted bg-light-bg px-3 py-1 rounded-full uppercase tracking-widest">
                  {purchaseRows.length} Line Items
                </span>
              </div>
            </div>

            <div className="space-y-4">
               {/* Headers */}
               <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">
                 <div className="col-span-3">Product Name</div>
                 <div className="col-span-2 text-center">SKU</div>
                 <div className="col-span-1 text-center">Color</div>
                 <div className="col-span-1 text-center">Size</div>
                 <div className="col-span-1 text-center">Qty</div>
                 <div className="col-span-1 text-center">Cost ₹</div>
                 <div className="col-span-1 text-center">Selling ₹</div>
                 <div className="col-span-2 text-right pr-12">Total</div>
               </div>

               <div className="space-y-3">
                 {purchaseRows.map((row, idx) => (
                   <div key={row.id} className="bg-light-bg/20 border border-border-light/40 rounded-2xl p-4 group hover:border-premium-gold/40 transition-all">
                     <div className="grid grid-cols-12 gap-4 items-center">
                       {/* Name & Sync */}
                       <div className="col-span-12 md:col-span-3 flex items-center gap-2">
                         <div className="flex-1">
                           <input 
                              className="w-full bg-white border border-border-light/50 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-premium-gold/20" 
                              placeholder="Search or enter name..." 
                              value={row.productName} 
                              onChange={e => updatePurchaseRow(row.id, 'productName', e.target.value)} 
                           />
                         </div>
                         <button type="button" onClick={() => syncFromCatalog(row.id)} className="p-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                            <History size={14} />
                         </button>
                       </div>

                       {/* SKU */}
                       <div className="col-span-6 md:col-span-2">
                          <input 
                            className="w-full bg-white border border-border-light/50 rounded-xl px-3 py-3 text-xs font-bold text-center uppercase focus:outline-none" 
                            placeholder="AUTO" 
                            value={row.sku} 
                            onChange={e => updatePurchaseRow(row.id, 'sku', e.target.value)} 
                          />
                       </div>

                       {/* Color */}
                       <div className="col-span-6 md:col-span-1">
                          <input 
                            className="w-full bg-white border border-border-light/50 rounded-xl px-3 py-3 text-xs font-bold text-center" 
                            placeholder="Color" 
                            value={row.color} 
                            onChange={e => updatePurchaseRow(row.id, 'color', e.target.value)} 
                          />
                       </div>

                       {/* Size */}
                       <div className="col-span-6 md:col-span-1 flex gap-1">
                          <select 
                            className="flex-1 bg-white border border-border-light/50 rounded-xl px-1 py-3 text-xs font-bold text-center appearance-none"
                            value={row.size}
                            onChange={e => updatePurchaseRow(row.id, 'size', e.target.value)}
                          >
                            <option value="">Size</option>
                            {STANDARD_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button type="button" onClick={() => openMatrix(row.id)} className="p-2 bg-charcoal text-white rounded-lg hover:bg-premium-gold transition-all" title="Bulk Matrix">
                             <Grid size={14} />
                          </button>
                       </div>

                       {/* Qty */}
                       <div className="col-span-3 md:col-span-1">
                          <input 
                            type="number" 
                            className="w-full bg-white border border-border-light/50 rounded-xl px-1 py-3 text-xs font-bold text-center" 
                            placeholder="0" 
                            value={row.quantity} 
                            onChange={e => updatePurchaseRow(row.id, 'quantity', e.target.value)} 
                          />
                       </div>

                       {/* Cost */}
                       <div className="col-span-3 md:col-span-1">
                          <input 
                            type="number" 
                            className="w-full bg-white border border-border-light/50 rounded-xl px-1 py-3 text-xs font-bold text-center" 
                            placeholder="0" 
                            value={row.costPrice} 
                            onChange={e => updatePurchaseRow(row.id, 'costPrice', e.target.value)} 
                          />
                       </div>

                       {/* Selling */}
                       <div className="col-span-3 md:col-span-1">
                          <input 
                            type="number" 
                            className="w-full bg-white border border-border-light/50 rounded-xl px-1 py-3 text-xs font-bold text-center" 
                            placeholder="auto" 
                            value={row.sellingPrice} 
                            onChange={e => updatePurchaseRow(row.id, 'sellingPrice', e.target.value)} 
                          />
                       </div>

                       {/* Actions */}
                       <div className="col-span-3 md:col-span-1 flex justify-end gap-2 pr-2">
                          <button type="button" onClick={() => removePurchaseRow(row.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                             <Trash2 size={14} />
                          </button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>

               <button type="button" onClick={addPurchaseRow} className="w-full py-4 sm:py-4 sm:py-6 border-2 border-dashed border-border-light rounded-[2rem] text-[10px] font-black text-text-muted uppercase tracking-[0.4em] hover:border-premium-gold hover:text-premium-gold transition-all">
                 + Add Additional Product Line
               </button>
            </div>
          </section>

          {/* Section 3: Notes & Summary */}
          <section className="grid md:grid-cols-3 gap-8">
             <div className="md:col-span-2 bg-white rounded-[3rem] border border-border-light p-5 md:p-10 shadow-sm">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 mb-4 block">Transaction Notes</label>
                <textarea 
                  rows={4} 
                  className="w-full bg-light-bg/50 border border-border-light/50 rounded-2xl p-4 sm:p-4 sm:p-6 font-bold text-sm resize-none focus:ring-2 focus:ring-premium-gold/20" 
                  placeholder="Internal audit notes or remarks..." 
                  value={purchaseBill.notes} 
                  onChange={e => setPurchaseBill({...purchaseBill, notes: e.target.value})}
                />
             </div>
             <div className="bg-charcoal text-white rounded-[3rem] p-5 md:p-10 shadow-2xl flex flex-col justify-between">
                <div>
                   <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-6">Order Summary</p>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-white/60 uppercase">Items Count</span>
                         <span className="text-sm font-black">{purchaseRows.reduce((s, r) => s + (Number(r.quantity) || 0), 0)} Units</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-white/60 uppercase">Base Value</span>
                         <span className="text-sm font-black">{formatCurrency(grandTotal)}</span>
                      </div>
                      <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                         <span className="text-[11px] font-black text-premium-gold uppercase tracking-widest">Payable Total</span>
                         <span className="text-2xl font-black tabular-nums">{formatCurrency(grandTotal)}</span>
                      </div>
                   </div>
                </div>
                <button type="submit" disabled={mutation.isPending} className="mt-8 w-full bg-premium-gold text-charcoal py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl">
                   {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Authorize & Update Stock'}
                </button>
             </div>
          </section>
        </form>
      </div>

      {/* Bulk Matrix Modal */}
      <AnimatePresence>
         {matrixRowId && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" onClick={() => setMatrixRowId(null)} />
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full admin-modal-container max-w-lg rounded-[3.5rem] shadow-2xl p-12 border border-border-light">
                  <h2 className="text-2xl font-black text-charcoal uppercase tracking-tighter mb-8">Combo Variant Matrix</h2>
                  
                  <div className="space-y-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Select Sizes</label>
                        <div className="grid grid-cols-3 gap-3">
                           {STANDARD_SIZES.map(s => (
                              <button 
                                key={s} 
                                type="button"
                                onClick={() => {
                                   setMatrixData(prev => ({
                                      ...prev,
                                      sizes: prev.sizes.includes(s) ? prev.sizes.filter(x => x !== s) : [...prev.sizes, s]
                                   }));
                                }}
                                className={`py-3 rounded-xl font-black text-xs transition-all border-2 ${matrixData.sizes.includes(s) ? 'bg-charcoal text-white border-charcoal shadow-lg' : 'bg-light-bg text-text-muted border-transparent hover:border-premium-gold'}`}
                              >
                                 {s}
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block">Available Colors (Comma Separated)</label>
                        <input 
                           className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-4 font-bold text-sm" 
                           placeholder="e.g. Red, Blue, Black" 
                           value={matrixData.colors}
                           onChange={e => setMatrixData({...matrixData, colors: e.target.value})}
                        />
                        <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest italic opacity-60">Leave empty to use current row color</p>
                     </div>

                     <button type="button" onClick={applyMatrix} className="w-full bg-charcoal text-white py-4 sm:py-4 sm:py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-premium-gold hover:text-charcoal transition-all">
                        Generate All Variants
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
