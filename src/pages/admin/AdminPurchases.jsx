import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save, X, Search, ChevronDown, Loader2, Package, Truck, Calendar, Hash, IndianRupee, User, FileText, CheckCircle, Clock, AlertCircle, ExternalLink, Image as ImageIcon, Upload } from 'lucide-react';
import { purchaseService, adminService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import SafeImage from '../../components/common/SafeImage';

const EMPTY_ROW = { productName: '', color: '', size: '', quantity: '', costPrice: '', sellingPrice: '', gstPercent: 5, images: [] };

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function AdminPurchases() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [bill, setBill] = useState({ supplierId: '', supplierName: '', billNumber: '', billDate: new Date().toISOString().slice(0, 10), paymentStatus: 'paid', notes: '' });
  const queryClient = useQueryClient();

  // Bill form state
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { search: urlSearch } = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(urlSearch);
    if (params.get('new') === 'true') {
      const sid = params.get('supplier');
      if (sid && suppliers.length > 0) {
        const s = suppliers.find(s => s._id === sid);
        if (s) {
          setBill(b => ({ ...b, supplierId: sid, supplierName: s.name }));
          setShowForm(true);
        }
      } else if (params.get('new') === 'true') {
        setShowForm(true);
      }
    }
  }, [urlSearch, suppliers]);

  // --- Queries ---
  const { data: purchasesData, isLoading } = useQuery({
    queryKey: ['admin-purchases', search],
    queryFn: () => purchaseService.getPurchases({ search }).then(r => r.data),
  });
  const purchases = purchasesData?.data || [];

  const { data: suppliersData } = useQuery({
    queryKey: ['admin-suppliers'],
    queryFn: () => purchaseService.getSuppliers().then(r => r.data),
  });
  const suppliers = suppliersData?.data || suppliersData || [];

  const createMutation = useMutation({
    mutationFn: (data) => purchaseService.createPurchase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      toast.success('Purchase bill saved & inventory updated!');
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  // --- Row handlers ---
  const updateRow = (idx, field, value) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };
  const addRow = () => setRows(prev => [...prev, { ...EMPTY_ROW }]);
  const removeRow = (idx) => { if (rows.length > 1) setRows(prev => prev.filter((_, i) => i !== idx)); };

  const handleAddExternalImage = (idx) => {
    if (!tempImageUrl) return;
    const currentImages = rows[idx].images || [];
    updateRow(idx, 'images', [...currentImages, tempImageUrl]);
    setTempImageUrl('');
    toast.success('Image added');
  };

  const handleFileUpload = async (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setIsUploading(true);
    try {
      const res = await adminService.uploadImage(formData);
      const url = res.data.url;
      const currentImages = rows[idx].images || [];
      updateRow(idx, 'images', [...currentImages, url]);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (rowIdx, imgIdx) => {
    const currentImages = rows[rowIdx].images || [];
    updateRow(rowIdx, 'images', currentImages.filter((_, i) => i !== imgIdx));
  };

  // --- Calculations ---
  const rowTotal = (r) => {
    const qty = Number(r.quantity) || 0;
    const price = Number(r.costPrice) || 0;
    const gst = Number(r.gstPercent) || 0;
    return qty * price * (1 + gst / 100);
  };
  const grandTotal = rows.reduce((sum, r) => sum + rowTotal(r), 0);
  const subtotal = rows.reduce((sum, r) => sum + ((Number(r.quantity) || 0) * (Number(r.costPrice) || 0)), 0);
  const totalGST = grandTotal - subtotal;

  const handleSubmit = (e) => {
    e.preventDefault();
    const validRows = rows.filter(r => r.productName && r.quantity && r.costPrice);
    if (validRows.length === 0) return toast.error('Add at least one valid item');

    const items = validRows.map(r => ({
      productName: r.productName.trim(),
      color: (r.color || 'Default').trim(),
      size: (r.size || 'Free Size').trim(),
      quantity: Number(r.quantity),
      costPrice: Number(r.costPrice),
      sellingPrice: Number(r.sellingPrice) || Number(r.costPrice) * 1.5,
      gstPercent: Number(r.gstPercent) || 5,
      images: r.images || []
    }));

    createMutation.mutate({
      supplierId: bill.supplierId || undefined,
      supplierName: bill.supplierName,
      billNumber: bill.billNumber,
      purchaseDate: bill.billDate,
      paymentStatus: bill.paymentStatus,
      notes: bill.notes,
      items,
      pricing: { subtotal, gstAmount: totalGST, totalAmount: grandTotal },
    });
  };

  const resetForm = () => {
    setBill({ supplierId: '', supplierName: '', billNumber: '', billDate: new Date().toISOString().slice(0, 10), paymentStatus: 'paid', notes: '' });
    setRows([{ ...EMPTY_ROW }]);
    setShowForm(false);
  };

  const statusBadge = (s) => {
    const map = { paid: { label: 'Paid', cls: 'bg-green-50 text-green-700' }, credit: { label: 'Credit', cls: 'bg-red-50 text-red-700' }, partial: { label: 'Partial', cls: 'bg-yellow-50 text-yellow-700' } };
    const m = map[s] || map.paid;
    return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${m.cls}`}>{m.label}</span>;
  };

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Purchase Management — Admin</title></Helmet>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-charcoal tracking-tighter uppercase mb-1">Purchase Bills</h1>
          <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Supplier Stock Entry → Inventory Auto-Sync</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-charcoal text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-2 shadow-xl">
          <Plus size={14} /> New Purchase Bill
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 p-5 rounded-[2rem] flex items-start gap-4">
        <Package size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-black text-blue-900 uppercase tracking-tight">Supplier → Your Shop Flow</p>
          <p className="text-xs text-blue-700 font-medium mt-1">Enter supplier bill here. System will automatically add stock to <b>Master Inventory</b>. No manual stock entry needed.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
        <input className="w-full bg-white border border-border-light rounded-2xl pl-14 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-premium-gold/20 font-bold text-sm shadow-sm" placeholder="Search bills..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Purchase List */}
      <div className="bg-white rounded-[2.5rem] border border-border-light overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-light-bg/50 border-b border-border-light">
                {['Purchase #', 'Date', 'Supplier', 'Items', 'Total Amount', 'Payment', 'Inventory'].map(h => (
                  <th key={h} className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light/40">
              {isLoading ? (
                <tr><td colSpan="7" className="py-20 text-center"><Loader2 className="animate-spin text-premium-gold mx-auto" size={36} /></td></tr>
              ) : purchases.length === 0 ? (
                <tr><td colSpan="7" className="py-20 text-center text-xs font-bold text-text-muted uppercase tracking-widest">No purchase bills yet. Add your first supplier bill!</td></tr>
              ) : purchases.map(p => (
                <tr key={p._id} className="hover:bg-light-bg/20 transition-all">
                  <td className="px-6 py-5">
                    <div className="font-black text-charcoal text-sm">{p.purchaseNumber}</div>
                    {p.billNumber && <div className="text-[10px] text-text-muted font-bold mt-0.5">Supplier Bill: {p.billNumber}</div>}
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-text-muted">{formatDate(p.purchaseDate || p.createdAt)}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 group/s">
                      <div className="font-bold text-charcoal text-sm">{p.supplierId?.name || p.supplierName || '—'}</div>
                      {p.supplierId?._id && (
                        <button onClick={() => navigate(`/admin/suppliers?search=${p.supplierId.name}`)} className="p-1.5 bg-light-bg rounded-lg text-text-muted hover:text-premium-gold transition-all opacity-0 group-hover/s:opacity-100" title="View Supplier Hub">
                          <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      {(p.items || []).slice(0, 2).map((item, i) => (
                        <div key={i} className="text-[11px] font-bold text-charcoal">
                          {item.productName} <span className="text-text-muted font-medium">× {item.quantity}</span>
                          {item.color && item.color !== 'Default' && <span className="text-text-muted"> • {item.color}</span>}
                          {item.size && item.size !== 'Free Size' && <span className="text-text-muted"> • {item.size}</span>}
                        </div>
                      ))}
                      {(p.items || []).length > 2 && <div className="text-[10px] text-text-muted font-bold">+{p.items.length - 2} more</div>}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-black text-charcoal">{formatCurrency(p.pricing?.totalAmount)}</div>
                    <div className="text-[10px] text-text-muted font-bold mt-0.5">{p.items?.reduce((s, i) => s + i.quantity, 0)} pcs total</div>
                  </td>
                  <td className="px-6 py-5">{statusBadge(p.paymentStatus)}</td>
                  <td className="px-6 py-5">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-green-700 bg-green-50 px-3 py-1.5 rounded-full w-fit">
                      <CheckCircle size={12} /> Stock Added
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Bill Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-8 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={resetForm} />
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl border border-border-light mb-8"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-8 border-b border-border-light bg-light-bg/50 rounded-t-[3rem]">
                <div>
                  <h2 className="text-xl font-black text-charcoal uppercase tracking-tight">New Purchase Bill</h2>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">Supplier Stock Entry</p>
                </div>
                <button onClick={resetForm} className="p-3 hover:bg-white rounded-full text-text-muted hover:text-charcoal transition-all"><X size={22} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {/* Bill Header Info */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Supplier */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Supplier Name</label>
                    <div className="relative">
                      <select
                        className="w-full bg-light-bg border-none rounded-2xl px-5 py-4 font-bold text-sm focus:ring-2 focus:ring-premium-gold/30 appearance-none"
                        value={bill.supplierId}
                        onChange={e => {
                          const s = suppliers.find(s => s._id === e.target.value);
                          setBill(b => ({ ...b, supplierId: e.target.value, supplierName: s?.name || '' }));
                        }}
                      >
                        <option value="">Select Supplier...</option>
                        {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                    <input
                      className="w-full bg-light-bg border-none rounded-2xl px-5 py-3 font-bold text-xs focus:ring-2 focus:ring-premium-gold/30"
                      placeholder="Or type supplier name manually..."
                      value={bill.supplierName}
                      onChange={e => setBill(b => ({ ...b, supplierName: e.target.value, supplierId: '' }))}
                    />
                  </div>

                  {/* Bill Number */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Purchase Status</label>
                    <div className="grid grid-cols-2 gap-2">
                       {[['received', 'Received'], ['draft', 'Draft']].map(([val, label]) => (
                         <button key={val} type="button" onClick={() => setBill(b => ({ ...b, status: val }))} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bill.status === val ? 'bg-charcoal text-white shadow-lg' : 'bg-light-bg text-text-muted'}`}>{label}</button>
                       ))}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Finance & Settlement</label>
                    <div className="grid grid-cols-2 gap-3">
                       <select className="w-full bg-light-bg border-none rounded-xl px-4 py-3 font-black text-xs focus:ring-2 focus:ring-premium-gold/30" value={bill.paymentStatus} onChange={e => setBill(b => ({ ...b, paymentStatus: e.target.value }))}>
                          <option value="pending">Pending</option>
                          <option value="partial">Partial</option>
                          <option value="paid">Fully Paid</option>
                       </select>
                       {bill.status === 'received' && (
                         <input type="number" className="w-full bg-light-bg border-none rounded-xl px-4 py-3 font-bold text-xs focus:ring-2 focus:ring-premium-gold/30" placeholder="Paid Amount (₹)" value={bill.paidAmount} onChange={e => setBill(b => ({ ...b, paidAmount: e.target.value }))} />
                       )}
                    </div>
                    <div className="mt-2">
                       <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1.5">Supplier Bill # & Date</label>
                       <div className="grid grid-cols-2 gap-3">
                          <input className="w-full bg-light-bg border-none rounded-xl px-4 py-3 font-bold text-xs focus:ring-2 focus:ring-premium-gold/30" placeholder="Bill No." value={bill.billNumber} onChange={e => setBill(b => ({ ...b, billNumber: e.target.value }))} />
                          <input type="date" className="w-full bg-light-bg border-none rounded-xl px-4 py-3 font-bold text-xs focus:ring-2 focus:ring-premium-gold/30" value={bill.billDate} onChange={e => setBill(b => ({ ...b, billDate: e.target.value }))} />
                       </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-charcoal uppercase tracking-widest">📦 Stock Items</h3>
                    <span className="text-[10px] text-text-muted font-bold">Each row = one product variant (color + size)</span>
                  </div>

                  {/* Header Row */}
                  <div className="hidden md:grid grid-cols-12 gap-2 px-4 pb-2">
                    {['Product Name', 'Color', 'Size', 'Qty', 'Cost (₹)', 'Sell (₹)', 'GST%', 'Total', ''].map((h, i) => (
                      <div key={i} className={`text-[9px] font-black text-text-muted uppercase tracking-widest ${i === 0 ? 'col-span-3' : i === 5 ? 'col-span-1' : ''}`}>{h}</div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {rows.map((row, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="grid md:grid-cols-12 gap-2 items-center bg-light-bg/40 p-3 rounded-2xl border border-border-light/50">
                        <input className="col-span-3 bg-white border-none rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-premium-gold/30 w-full" placeholder="Product name (e.g. Pants Ancel Fit)" value={row.productName} onChange={e => updateRow(idx, 'productName', e.target.value)} />
                        <input className="bg-white border-none rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-premium-gold/30 w-full" placeholder="Color" value={row.color} onChange={e => updateRow(idx, 'color', e.target.value)} />
                        <input className="bg-white border-none rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-premium-gold/30 w-full" placeholder="Size" value={row.size} onChange={e => updateRow(idx, 'size', e.target.value)} />
                        <input type="number" className="bg-white border-none rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-premium-gold/30 w-full" placeholder="Qty" min="1" value={row.quantity} onChange={e => updateRow(idx, 'quantity', e.target.value)} />
                        <input type="number" className="bg-white border-none rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-premium-gold/30 w-full" placeholder="₹0" step="0.01" value={row.costPrice} onChange={e => updateRow(idx, 'costPrice', e.target.value)} />
                        <input type="number" className="bg-white border-none rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-premium-gold/30 w-full" placeholder="₹0" step="0.01" value={row.sellingPrice} onChange={e => updateRow(idx, 'sellingPrice', e.target.value)} />
                        <select className="bg-white border-none rounded-xl px-3 py-3 font-black text-xs focus:ring-2 focus:ring-premium-gold/30 w-full" value={row.gstPercent} onChange={e => updateRow(idx, 'gstPercent', e.target.value)}>
                          {[0, 5, 12, 18].map(g => <option key={g} value={g}>{g}%</option>)}
                        </select>
                        <div className="font-black text-charcoal text-sm text-right pr-1">{formatCurrency(rowTotal(row))}</div>
                        <div className="flex flex-col gap-1">
                           <button type="button" onClick={() => setExpandedRow(expandedRow === idx ? null : idx)} className={`p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${row.images?.length > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-light-bg text-text-muted hover:bg-indigo-50 hover:text-indigo-600'}`}>
                              <ImageIcon size={14} />
                              {row.images?.length > 0 && <span className="text-[10px] font-black">{row.images.length}</span>}
                           </button>
                           <button type="button" onClick={() => removeRow(idx)} className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                              <Trash2 size={14} />
                           </button>
                        </div>

                        {expandedRow === idx && (
                           <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="col-span-full mt-4 bg-white rounded-2xl border border-indigo-100 p-6 space-y-6">
                              <div className="flex items-center justify-between">
                                 <div>
                                    <h4 className="text-xs font-black text-charcoal uppercase tracking-widest flex items-center gap-2">
                                       <ImageIcon size={14} className="text-indigo-600" /> Visual Assets
                                    </h4>
                                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">High-resolution imagery for customer engagement</p>
                                 </div>
                                 <button type="button" onClick={() => setExpandedRow(null)} className="text-[9px] font-black text-text-muted uppercase hover:text-charcoal">Close Media</button>
                              </div>

                              <div className="grid md:grid-cols-2 gap-8">
                                 {/* URL Input */}
                                 <div className="space-y-3">
                                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">External Image URL</label>
                                    <div className="flex gap-2">
                                       <input 
                                          className="flex-1 bg-light-bg border-none rounded-xl px-4 py-3 font-medium text-xs focus:ring-2 focus:ring-indigo-600/20" 
                                          placeholder="https://..." 
                                          value={tempImageUrl}
                                          onChange={e => setTempImageUrl(e.target.value)}
                                       />
                                       <button type="button" onClick={() => handleAddExternalImage(idx)} className="px-6 py-3 bg-charcoal text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">Add</button>
                                    </div>
                                 </div>

                                 {/* System Upload */}
                                 <div className="space-y-3">
                                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Upload from System</label>
                                    <div className="relative">
                                       <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => handleFileUpload(idx, e)} />
                                       <div className="w-full bg-light-bg border-2 border-dashed border-indigo-100 rounded-xl px-6 py-3 flex items-center justify-center gap-3 text-text-muted group hover:border-indigo-600 hover:text-indigo-600 transition-all">
                                          {isUploading ? <Loader2 size={16} className="animate-spin text-indigo-600" /> : <Upload size={16} />}
                                          <span className="text-[9px] font-black uppercase tracking-widest">{isUploading ? 'Uploading...' : 'Browse Local Files'}</span>
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              {/* Gallery Preview */}
                              {row.images?.length > 0 && (
                                 <div className="pt-4 border-t border-border-light flex flex-wrap gap-4">
                                    {row.images.map((img, imgIdx) => (
                                       <div key={imgIdx} className="relative w-20 h-24 rounded-xl overflow-hidden group shadow-sm border border-border-light bg-light-bg">
                                          <SafeImage src={img} alt="" className="w-full h-full object-cover" />
                                          <button type="button" onClick={() => removeImage(idx, imgIdx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"><X size={10} /></button>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <button type="button" onClick={addRow} className="mt-3 w-full border-2 border-dashed border-border-light rounded-2xl py-4 text-[10px] font-black text-text-muted uppercase tracking-widest hover:border-premium-gold hover:text-premium-gold transition-all flex items-center justify-center gap-2">
                    <Plus size={14} /> Add Another Product
                  </button>
                </div>

                {/* Totals */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-light-bg/50 rounded-[2rem] p-6 space-y-3">
                    <div className="flex justify-between text-xs font-bold text-text-muted">
                      <span>Total Pieces</span>
                      <span className="font-black text-charcoal">{rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0)} pcs</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-text-muted">
                      <span>Subtotal (before GST)</span>
                      <span className="font-black text-charcoal">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-text-muted">
                      <span>GST Amount</span>
                      <span className="font-black text-charcoal">{formatCurrency(totalGST)}</span>
                    </div>
                    <div className="border-t border-border-light pt-3 flex justify-between">
                      <span className="text-sm font-black text-charcoal uppercase">Total Purchase</span>
                      <span className="text-xl font-black text-charcoal">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>

                  <div className="bg-green-50/60 border border-green-100 rounded-[2rem] p-6 flex flex-col justify-center">
                    <div className="text-[10px] font-black text-green-800 uppercase tracking-widest mb-3">After Save, System Will:</div>
                    {['Add stock to Master Inventory', 'Auto-generate barcodes', 'Set default selling prices', 'Make items ready to sell'].map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-bold text-green-700 mb-1.5">
                        <CheckCircle size={13} className="text-green-500 flex-shrink-0" /> {t}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex items-center justify-between border-t border-border-light pt-6">
                  <button type="button" onClick={resetForm} className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-charcoal transition-colors">Cancel</button>
                  <button type="submit" disabled={createMutation.isPending} className="bg-charcoal text-white px-10 py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-charcoal/20 hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-3">
                    {createMutation.isPending ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Save size={18} /> Save Bill & Update Inventory</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
