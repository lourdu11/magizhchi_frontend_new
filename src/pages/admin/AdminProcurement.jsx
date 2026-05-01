import { useState, useEffect } from 'react'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Trash2, Save, X, Search, ChevronDown, Loader2, Package, Truck, 
  Calendar, Hash, IndianRupee, User, FileText, CheckCircle, Clock, 
  AlertCircle, ExternalLink, CreditCard, History, Phone, Mail, MapPin, 
  BarChart3, ArrowUpRight, ArrowDownLeft, Layers, LayoutGrid, AlertTriangle,
  Image as ImageIcon, Upload
} from 'lucide-react';
import { purchaseService, adminService, inventoryService, productService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';

// --- Helpers ---
const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const EMPTY_PURCHASE_ROW = { productName: '', color: '', size: '', quantity: '', costPrice: '', sellingPrice: '', images: [] };
const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function AdminProcurement() {
  const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' or 'suppliers'
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [expandedPurchaseRow, setExpandedPurchaseRow] = useState(null);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);
  const [showPurchaseDeleteModal, setShowPurchaseDeleteModal] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { search: urlSearch } = useLocation();

  // --- Form States ---
  const [purchaseBill, setPurchaseBill] = useState({
    supplierId: '', supplierName: '', billNumber: '', billDate: new Date().toISOString().slice(0, 10),
    paymentStatus: 'paid', notes: '', paidAmount: 0, status: 'received'
  });
  const [purchaseRows, setPurchaseRows] = useState([{ ...EMPTY_PURCHASE_ROW }]);
  
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', email: '', gstin: '', address: '', openingBalance: 0 });
  const [paymentData, setPaymentData] = useState({ amount: '', method: 'Cash', referenceId: '', note: '', date: new Date().toISOString().slice(0, 10) });

  // --- Queries ---
  const { data: purchasesData, isLoading: isLoadingPurchases } = useQuery({
    queryKey: ['admin-purchases', search],
    queryFn: () => purchaseService.getPurchases({ search }).then(r => r.data),
    enabled: activeTab === 'purchases'
  });
  const purchases = purchasesData?.data || [];

  const { data: suppliersData, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['admin-suppliers', search],
    queryFn: () => purchaseService.getSuppliers().then(r => r.data),
  });
  const suppliers = suppliersData?.data || suppliersData || [];


  // --- Mutations ---
  const createPurchaseMutation = useMutation({
    mutationFn: (data) => purchaseService.createPurchase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-all-for-media'] });
      queryClient.invalidateQueries({ queryKey: ['stock-history'] });
      toast.success('Purchase recorded successfully');
      resetPurchaseForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save purchase'),
  });

  const updatePurchaseMutation = useMutation({
    mutationFn: ({ id, data }) => purchaseService.updatePurchase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-all-for-media'] });
      queryClient.invalidateQueries({ queryKey: ['stock-history'] });
      toast.success('Purchase updated and inventory synced');
      resetPurchaseForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update purchase'),
  });

  const deletePurchaseMutation = useMutation({
    mutationFn: (id) => purchaseService.deletePurchase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });
      toast.success('Purchase removed and stock rolled back');
      setShowPurchaseDeleteModal(false);
      setPurchaseToDelete(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove purchase'),
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data) => editingSupplierId ? purchaseService.updateSupplier(editingSupplierId, data) : purchaseService.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      toast.success(editingSupplierId ? 'Trade Partner updated' : 'Trade Partner onboarded');
      setShowSupplierForm(false);
      setEditingSupplierId(null);
      setNewSupplier({ name: '', phone: '', email: '', gstin: '', address: '', openingBalance: 0 });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to onboard partner'),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: ({ id, data, paymentId }) => {
      if (paymentId) return purchaseService.updatePayment(id, paymentId, data);
      return purchaseService.recordPayment(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      toast.success(editingPaymentId ? 'Settlement updated' : 'Payment settled successfully');
      setShowPaymentModal(false);
      setEditingPaymentId(null);
      setPaymentData({ amount: '', method: 'Cash', referenceId: '', note: '', date: new Date().toISOString().slice(0, 10) });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to record payment'),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: ({ supplierId, paymentId }) => purchaseService.deletePayment(supplierId, paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      toast.success('Settlement record removed');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove settlement'),
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id) => purchaseService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      toast.success('Supplier removed successfully');
      setShowDeleteModal(false);
      setSupplierToDelete(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove supplier'),
  });

  const confirmDelete = (supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteModal(true);
  };

  // --- Scroll Lock ---
  useEffect(() => {
    const isAnyModalOpen = showPurchaseForm || showSupplierForm || showPaymentModal || showLedgerModal || showDeleteModal || showPurchaseDeleteModal;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showPurchaseForm, showSupplierForm, showPaymentModal, showLedgerModal, showDeleteModal, showPurchaseDeleteModal]);

  // --- Effects ---
  useEffect(() => {
    const params = new URLSearchParams(urlSearch);
    if (params.get('new') === 'true') {
      setActiveTab('purchases');
      const sid = params.get('supplier');
      if (sid && suppliers.length > 0) {
        const s = suppliers.find(s => s._id === sid);
        if (s) {
          setPurchaseBill(b => ({ ...b, supplierId: sid, supplierName: s.name }));
          setShowPurchaseForm(true);
        }
      } else {
        setShowPurchaseForm(true);
      }
    }
  }, [urlSearch, suppliers]);

  // --- Purchase Row Handlers ---
  const updatePurchaseRow = (idx, field, value) => {
    setPurchaseRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };
  const addPurchaseRow = () => setPurchaseRows(prev => [...prev, { ...EMPTY_PURCHASE_ROW }]);
  const removePurchaseRow = (idx) => { if (purchaseRows.length > 1) setPurchaseRows(prev => prev.filter((_, i) => i !== idx)); };
  
  const syncFromCatalog = async (idx) => {
    const name = purchaseRows[idx].productName.trim();
    if (!name) return toast.error('Enter product name to sync');
    
    setIsUploading(true);
    try {
      const res = await productService.getProducts({ search: name, limit: 1 });
      const product = res.data.data?.[0];
      
      if (product) {
        setPurchaseRows(prev => prev.map((r, i) => i === idx ? { 
          ...r, 
          sellingPrice: product.sellingPrice || r.sellingPrice,
          images: product.images?.length > 0 ? product.images : r.images
        } : r));
        toast.success(`Synced metadata for "${product.name}"`);
      } else {
        toast.error('No matching product profile found in catalog');
      }
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddExternalImage = (idx) => {
    if (!tempImageUrl) return;
    const currentImages = purchaseRows[idx].images || [];
    updatePurchaseRow(idx, 'images', [...currentImages, tempImageUrl]);
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
      const currentImages = purchaseRows[idx].images || [];
      updatePurchaseRow(idx, 'images', [...currentImages, url]);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (rowIdx, imgIdx) => {
    const currentImages = purchaseRows[rowIdx].images || [];
    updatePurchaseRow(rowIdx, 'images', currentImages.filter((_, i) => i !== imgIdx));
  };

  const calculateRowTotal = (r) => {
    const qty = Number(r.quantity) || 0;
    const price = Number(r.costPrice) || 0;
    return qty * price;
  };
  
  const grandTotal = purchaseRows.reduce((sum, r) => sum + calculateRowTotal(r), 0);
  const subtotal = grandTotal;
  const totalGST = 0;

  const handlePurchaseSubmit = (e) => {
    e.preventDefault();
    const validRows = purchaseRows.filter(r => r.productName && r.quantity && r.costPrice);
    if (validRows.length === 0) return toast.error('Add items first');

    const payload = {
      ...purchaseBill,
      items: validRows.map(r => ({ ...r, quantity: Number(r.quantity), costPrice: Number(r.costPrice), sellingPrice: Number(r.sellingPrice) || Number(r.costPrice) * 1.5, images: r.images || [] })),
      pricing: { subtotal, gstAmount: totalGST, totalAmount: grandTotal },
    };

    if (editingPurchaseId) {
      updatePurchaseMutation.mutate({ id: editingPurchaseId, data: payload });
    } else {
      createPurchaseMutation.mutate(payload);
    }
  };

  const handleEditPurchase = (p) => {
    setEditingPurchaseId(p._id);
    setPurchaseBill({
      supplierId: p.supplierId?._id || '',
      supplierName: p.supplierName || '',
      billNumber: p.billNumber || '',
      billDate: new Date(p.purchaseDate || p.createdAt).toISOString().slice(0, 10),
      paymentStatus: p.paymentStatus || 'paid',
      notes: p.notes || '',
      paidAmount: p.paidAmount || 0,
      status: p.status || 'received'
    });
    setPurchaseRows(p.items.map(item => ({
      productName: item.productName,
      color: item.color || '',
      size: item.size || '',
      quantity: item.quantity,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice || item.costPrice * 1.5,
      images: item.images || []
    })));
    setShowPurchaseForm(true);
  };

  const handleEditSupplier = (s) => {
    setEditingSupplierId(s._id);
    setNewSupplier({
      name: s.name || '',
      phone: s.phone || '',
      email: s.email || '',
      gstin: s.gstin || '',
      address: s.address || '',
      openingBalance: s.openingBalance || 0
    });
    setShowSupplierForm(true);
  };

  const resetPurchaseForm = () => {
    setPurchaseBill({ supplierId: '', supplierName: '', billNumber: '', billDate: new Date().toISOString().slice(0, 10), paymentStatus: 'paid', notes: '', paidAmount: 0, status: 'received' });
    setPurchaseRows([{ ...EMPTY_PURCHASE_ROW }]);
    setEditingPurchaseId(null);
    setShowPurchaseForm(false);
  };

  // --- Calculations & Live Feed ---
  const { data: movements } = useQuery({
    queryKey: ['stock-movements-latest'],
    queryFn: () => inventoryService.getAllHistory({ limit: 5 }).then(r => r.data.data),
    refetchInterval: 30000 
  });

  const stats = [
    { 
      label: 'Procured Volume', 
      value: formatCurrency((suppliers || []).reduce((sum, s) => sum + (s.procuredVolume || 0), 0)), 
      icon: Package, 
      color: 'text-charcoal', 
      bg: 'bg-light-bg' 
    },
    { 
      label: 'Settled Value', 
      value: formatCurrency((suppliers || []).reduce((sum, s) => sum + (s.settledValue || 0), 0)), 
      icon: BarChart3, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'Net Payables', 
      value: formatCurrency((suppliers || []).reduce((sum, s) => sum + (s.netPayables || 0), 0)), 
      icon: AlertCircle, 
      color: 'text-red-600', 
      bg: 'bg-red-50' 
    },
    { 
      label: 'Active Partners', 
      value: (suppliers || []).length, 
      icon: Truck, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50' 
    }
  ];

  return (
    <div className="space-y-6 pb-20">
      <Helmet><title>Procurement & Supply Chain — Admin</title></Helmet>

      <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-border-light p-6 md:p-10 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
        <div>
          <h1 className="text-4xl font-black text-charcoal tracking-tighter uppercase leading-none">Procurement Hub</h1>
          <p className="text-xs text-text-muted font-bold uppercase tracking-[0.3em] mt-3">Integrated Supply Chain & Financial Ledger</p>
        </div>
        <div className="flex bg-light-bg p-2 rounded-2xl">
          <button 
            onClick={() => setActiveTab('purchases')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'purchases' ? 'bg-white text-charcoal shadow-md' : 'text-text-muted hover:text-charcoal'}`}
          >
            Supply Chain
          </button>
          <button 
            onClick={() => setActiveTab('suppliers')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'suppliers' ? 'bg-white text-charcoal shadow-md' : 'text-text-muted hover:text-charcoal'}`}
          >
            Trade Partners
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="bg-white rounded-[2rem] border border-border-light p-6 shadow-sm group hover:border-premium-gold transition-all">
                <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <s.icon size={18} />
                </div>
                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">{s.label}</p>
                <p className="text-xl font-black text-charcoal tracking-tighter">{s.value}</p>
              </div>
            ))}
         </div>

         <div className="bg-white rounded-[2.5rem] border border-border-light p-6 shadow-sm overflow-hidden">
            <h3 className="text-[10px] font-black text-charcoal uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Stock Pulse
            </h3>
            <div className="space-y-4">
               {(!movements || movements.length === 0) ? (
                 <p className="text-[9px] font-bold text-text-muted uppercase italic">Awaiting movements...</p>
               ) : movements.map((m, i) => (
                 <div key={i} className="flex items-start gap-3 border-l-2 border-border-light pl-4 py-1 hover:border-premium-gold transition-all group">
                    <div className="flex-1 min-w-0">
                       <p className="text-[10px] font-black text-charcoal truncate group-hover:text-premium-gold transition-colors">
                          {m.productId?.name || 'Item'}
                          <span className="ml-2 text-[8px] font-bold text-text-muted uppercase">({m.variant?.color}/{m.variant?.size})</span>
                       </p>
                       <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">
                          <span className={m.quantity > 0 ? 'text-emerald-500' : 'text-red-500'}>{m.quantity > 0 ? '+' : ''}{m.quantity}</span> • {m.type.replace('_', ' ')}
                       </p>
                    </div>
                    <span className="text-[8px] font-black text-text-muted uppercase">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            className="w-full bg-white border border-border-light rounded-[1.5rem] pl-16 pr-6 py-4 focus:outline-none focus:ring-4 focus:ring-premium-gold/10 font-bold text-sm shadow-sm"
            placeholder={activeTab === 'purchases' ? "Search bills by # or supplier..." : "Lookup trade partner by name or phone..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          {activeTab === 'purchases' ? (
            <button onClick={() => setShowPurchaseForm(true)} className="px-8 py-4 bg-charcoal text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-2">
              <Plus size={16} /> Record Purchase
            </button>
          ) : (
            <button onClick={() => setShowSupplierForm(true)} className="px-8 py-4 bg-charcoal text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-2">
              <Plus size={16} /> Onboard Supplier
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'purchases' ? (
          <motion.div key="purchases" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white rounded-[3.5rem] border border-border-light overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-light-bg/50 border-b border-border-light">
                    {['Purchase Ref', 'Supplier Partner', 'Stock Items', 'Bill Value', 'Inventory Status', 'Action'].map(h => (
                      <th key={h} className="px-10 py-8 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light/40">
                  {isLoadingPurchases ? (
                    <tr><td colSpan="6" className="py-24 text-center"><Loader2 className="animate-spin text-premium-gold mx-auto" size={48} /></td></tr>
                  ) : purchases.length === 0 ? (
                    <tr><td colSpan="6" className="py-24 text-center font-bold text-text-muted uppercase text-xs opacity-50">No purchases found.</td></tr>
                  ) : purchases.map(p => (
                    <tr key={p._id} className="hover:bg-light-bg/20 transition-all group">
                      <td className="px-10 py-8">
                        <div className="font-black text-charcoal text-base">{p.purchaseNumber}</div>
                        <div className="text-[10px] text-text-muted font-bold mt-1 uppercase tracking-widest">{formatDate(p.purchaseDate || p.createdAt)}</div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-light-bg rounded-lg flex items-center justify-center text-text-muted"><User size={14} /></div>
                           <div>
                              <div className="font-black text-charcoal text-sm">{p.supplierId?.name || p.supplierName}</div>
                              <button onClick={() => { setActiveTab('suppliers'); setSearch(p.supplierId?.name || p.supplierName); }} className="text-[9px] font-black text-premium-gold uppercase tracking-widest hover:underline mt-0.5">View Ledger</button>
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                         <div className="space-y-1.5">
                            {p.items?.slice(0, 2).map((item, i) => (
                              <div key={i} className="text-[11px] font-bold text-charcoal flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-border-dark" />
                                {item.productName} (x{item.quantity})
                              </div>
                            ))}
                            {p.items?.length > 2 && <div className="text-[9px] font-black text-text-muted pl-3.5 uppercase">+{p.items.length - 2} more items</div>}
                         </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="font-black text-charcoal text-base">{formatCurrency(p.pricing?.totalAmount)}</div>
                        <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${p.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-red-500'}`}>{p.paymentStatus}</div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                           <CheckCircle size={12} /> Sync Success
                        </span>
                      </td>
                      <td className="px-10 py-8">
                         <div className="flex items-center gap-3">
                            <button onClick={() => handleEditPurchase(p)} className="p-4 bg-light-bg text-text-muted rounded-2xl hover:bg-premium-gold hover:text-charcoal transition-all shadow-sm" title="Edit Bill"><FileText size={18} /></button>
                            <button onClick={() => { setPurchaseToDelete(p); setShowPurchaseDeleteModal(true); }} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Delete Bill"><Trash2 size={18} /></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div key="suppliers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white rounded-[3.5rem] border border-border-light overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-light-bg/50 border-b border-border-light">
                    {['Supplier Entity', 'Procured Value', 'Total Settled', 'Outstanding', 'Performance', 'Actions'].map(h => (
                      <th key={h} className="px-10 py-8 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light/40">
                  {isLoadingSuppliers ? (
                    <tr><td colSpan="6" className="py-24 text-center"><Loader2 className="animate-spin text-premium-gold mx-auto" size={48} /></td></tr>
                  ) : suppliers.length === 0 ? (
                    <tr><td colSpan="6" className="py-24 text-center font-bold text-text-muted uppercase text-xs opacity-50">No suppliers onboarded.</td></tr>
                  ) : suppliers.map(s => (
                    <tr key={s._id} className="hover:bg-light-bg/20 transition-all group">
                      <td className="px-10 py-8">
                        <div className="font-black text-charcoal text-base">{s.name}</div>
                        <div className="text-[10px] text-text-muted font-bold flex items-center gap-1.5 mt-1 uppercase tracking-widest"><Phone size={12} /> {s.phone}</div>
                      </td>
                      <td className="px-10 py-8 font-black text-charcoal text-sm">{formatCurrency(s.procuredVolume)}</td>
                      <td className="px-10 py-8 font-black text-emerald-600 text-sm">{formatCurrency(s.settledValue)}</td>
                      <td className="px-10 py-8">
                         <div className={`font-black text-sm flex items-center gap-2 ${s.netPayables > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {s.netPayables > 50000 && <AlertCircle size={14} className="animate-pulse" />}
                            {formatCurrency(s.netPayables)}
                         </div>
                      </td>
                      <td className="px-10 py-8">
                         <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-1.5 h-6 rounded-full ${i <= 4 ? 'bg-premium-gold' : 'bg-light-bg'}`} />)}
                         </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                           <button onClick={() => { setSelectedSupplier(s); setShowPaymentModal(true); }} className="p-4 bg-charcoal text-white rounded-2xl hover:bg-premium-gold hover:text-charcoal transition-all shadow-lg shadow-charcoal/10" title="Record Payment"><CreditCard size={18} /></button>
                           <button onClick={() => { setSelectedSupplier(s); setShowLedgerModal(true); }} className="p-4 bg-light-bg text-charcoal rounded-2xl hover:bg-charcoal hover:text-white transition-all shadow-sm" title="Financial Hub"><History size={18} /></button>
                           <button onClick={() => handleEditSupplier(s)} className="p-4 bg-premium-gold/10 text-charcoal rounded-2xl hover:bg-premium-gold transition-all shadow-sm" title="Edit Partner"><FileText size={18} /></button>
                           <button 
                             onClick={() => confirmDelete(s)} 
                             disabled={deleteSupplierMutation.isPending}
                             className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                             title="Delete Partner"
                           >
                             {deleteSupplierMutation.isPending && supplierToDelete?._id === s._id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODALS ─── */}
      
      {/* 1. Record Purchase Bill Modal */}
      <AnimatePresence>
        {showPurchaseForm && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-8 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={resetPurchaseForm} />
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative bg-white w-full max-w-6xl rounded-[4rem] shadow-2xl border border-border-light mb-8 p-12">
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-charcoal uppercase tracking-tighter">Inventory Procurement</h2>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Transforming Purchase Bills into Active Stock</p>
                  </div>
                  <button onClick={resetPurchaseForm} className="p-4 hover:bg-light-bg rounded-full text-text-muted"><X size={28} /></button>
               </div>

               <form onSubmit={handlePurchaseSubmit} className="space-y-10">
                  {/* Header Grid */}
                  <div className="grid md:grid-cols-4 gap-8 bg-light-bg/50 p-8 rounded-[2.5rem] border border-border-light/50">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Supplier Selection</label>
                       <select className="w-full bg-white border-none rounded-2xl px-6 py-4 font-black text-sm focus:ring-2 focus:ring-premium-gold/30" value={purchaseBill.supplierId} onChange={e => {
                         const s = suppliers.find(x => x._id === e.target.value);
                         setPurchaseBill({...purchaseBill, supplierId: e.target.value, supplierName: s?.name || ''});
                       }}>
                         <option value="">Select Partner...</option>
                         {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                       </select>
                       {purchaseBill.supplierId && (
                         <p className={`text-[9px] font-black uppercase tracking-widest ml-2 mt-1 ${suppliers.find(s => s._id === purchaseBill.supplierId)?.netPayables > 50000 ? 'text-red-500 animate-pulse' : 'text-text-muted'}`}>
                           Current Debt: {formatCurrency(suppliers.find(s => s._id === purchaseBill.supplierId)?.netPayables)}
                         </p>
                       )}
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Supplier Bill #</label>
                       <input className="w-full bg-white border-none rounded-2xl px-6 py-4 font-black text-sm focus:ring-2 focus:ring-premium-gold/30 uppercase" placeholder="e.g. TAX/2024/99" value={purchaseBill.billNumber} onChange={e => setPurchaseBill({...purchaseBill, billNumber: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Transaction Date</label>
                       <input type="date" className="w-full bg-white border-none rounded-2xl px-6 py-4 font-black text-sm focus:ring-2 focus:ring-premium-gold/30" value={purchaseBill.billDate} onChange={e => setPurchaseBill({...purchaseBill, billDate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Payment Status</label>
                       <div className="grid grid-cols-2 gap-3">
                          <select className="w-full bg-white border-none rounded-2xl px-6 py-4 font-black text-sm focus:ring-2 focus:ring-premium-gold/30" value={purchaseBill.paymentStatus} onChange={e => {
                            const status = e.target.value;
                            setPurchaseBill({
                              ...purchaseBill, 
                              paymentStatus: status, 
                              paidAmount: status === 'paid' ? grandTotal : purchaseBill.paidAmount
                            });
                          }}>
                             <option value="paid">Fully Paid</option>
                             <option value="pending">On Credit</option>
                             <option value="partial">Partial Payment</option>
                          </select>
                          {(purchaseBill.paymentStatus === 'paid' || purchaseBill.paymentStatus === 'partial') && (
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-text-muted">₹</span>
                              <input 
                                type="number" 
                                className="w-full bg-white border-none rounded-2xl pl-8 pr-4 py-4 font-black text-sm focus:ring-2 focus:ring-premium-gold/30" 
                                placeholder="Paid"
                                value={purchaseBill.paidAmount} 
                                onChange={e => setPurchaseBill({...purchaseBill, paidAmount: Number(e.target.value)})} 
                              />
                            </div>
                          )}
                       </div>
                    </div>
                  </div>

                  {/* Dynamic Rows */}
                  <div className="space-y-4">
                     <div className="grid grid-cols-12 gap-4 px-4 mb-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                         <div className="col-span-4">Item Identity</div>
                         <div className="col-span-1 text-center">Spec</div>
                         <div className="col-span-1 text-center">Qty</div>
                         <div className="col-span-2">Cost (₹)</div>
                         <div className="col-span-1">Selling (₹)</div>
                         <div className="col-span-2 text-right pr-6">Line Total</div>
                         <div className="col-span-1"></div>
                      </div>
                     <div className="space-y-3 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
                        {purchaseRows.map((row, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-4 items-center bg-white p-4 rounded-[2rem] border border-border-light shadow-sm hover:border-premium-gold transition-all">
                              <div className="col-span-4 flex items-center gap-2">
                                 <input className="flex-1 bg-light-bg/50 border-none rounded-xl px-4 py-3 text-[11px] font-black text-charcoal placeholder:text-text-muted/50" placeholder="Cotton Casual Shirt" value={row.productName} onChange={e => updatePurchaseRow(idx, 'productName', e.target.value)} />
                                 <button type="button" onClick={() => syncFromCatalog(idx)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Sync">
                                    <History size={14} />
                                 </button>
                              </div>

                              <div className="col-span-1 flex flex-col gap-1">
                                 <input className="w-full bg-light-bg/50 border-none rounded-xl py-2 text-center text-[10px] font-black text-charcoal" placeholder="Color" value={row.color} onChange={e => updatePurchaseRow(idx, 'color', e.target.value)} />
                                 <select className="w-full bg-light-bg/50 border-none rounded-xl py-2 text-center text-[10px] font-black text-charcoal" value={row.size} onChange={e => updatePurchaseRow(idx, 'size', e.target.value)}>
                                    <option value="">Size</option>
                                    {STANDARD_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                 </select>
                              </div>

                              <div className="col-span-1">
                                 <input type="number" className="w-full bg-light-bg/50 border-none rounded-xl px-2 py-3 text-[11px] font-black text-center" value={row.quantity} onChange={e => updatePurchaseRow(idx, 'quantity', e.target.value)} />
                              </div>

                              <div className="col-span-2">
                                 <input type="number" className="w-full bg-light-bg/50 border-none rounded-xl px-4 py-3 text-[11px] font-black" placeholder="Cost Price" value={row.costPrice} onChange={e => updatePurchaseRow(idx, 'costPrice', e.target.value)} />
                              </div>

                              <div className="col-span-1 relative">
                                 <input type="number" className="w-full bg-light-bg/50 border-none rounded-xl px-2 py-3 text-[11px] font-black" placeholder="Sell" value={row.sellingPrice} onChange={e => updatePurchaseRow(idx, 'sellingPrice', e.target.value)} />
                              </div>

                              <div className="col-span-2 text-right font-black text-charcoal pr-6 text-sm tabular-nums">
                                 ₹{calculateRowTotal(row).toLocaleString()}
                              </div>

                              <div className="col-span-1 flex flex-col gap-2">
                                 <button type="button" onClick={() => setExpandedPurchaseRow(expandedPurchaseRow === idx ? null : idx)} className={`p-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm ${row.images?.length > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-light-bg text-text-muted hover:bg-indigo-50 hover:text-indigo-600'}`}>
                                    <ImageIcon size={18} />
                                    {row.images?.length > 0 && <span className="text-[11px] font-black">{row.images.length}</span>}
                                 </button>
                                 <button type="button" onClick={() => removePurchaseRow(idx)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={18} /></button>
                              </div>

                             {expandedPurchaseRow === idx && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="col-span-full mt-4 bg-light-bg/30 rounded-3xl border border-indigo-100/50 p-6 space-y-6">
                                   <div className="flex items-center justify-between">
                                      <div>
                                         <h4 className="text-[10px] font-black text-charcoal uppercase tracking-[0.2em] flex items-center gap-2">
                                            <ImageIcon size={14} className="text-indigo-600" /> Visual Assets
                                         </h4>
                                         <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">High-resolution imagery for customer engagement</p>
                                      </div>
                                      <button type="button" onClick={() => setExpandedPurchaseRow(null)} className="text-[9px] font-black text-text-muted uppercase hover:text-charcoal transition-colors">Collapse</button>
                                   </div>

                                   <div className="grid md:grid-cols-2 gap-8">
                                      {/* URL Input */}
                                      <div className="space-y-3">
                                         <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">External Image URL</label>
                                         <div className="flex gap-2">
                                            <input 
                                               className="flex-1 bg-white border border-border-light rounded-xl px-4 py-3 font-medium text-xs focus:ring-2 focus:ring-indigo-600/20" 
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
                                            <div className="w-full bg-white border-2 border-dashed border-indigo-100 rounded-xl px-6 py-3 flex items-center justify-center gap-3 text-text-muted group hover:border-indigo-600 hover:text-indigo-600 transition-all">
                                               {isUploading ? <Loader2 size={16} className="animate-spin text-indigo-600" /> : <Upload size={16} />}
                                               <span className="text-[9px] font-black uppercase tracking-widest">{isUploading ? 'Uploading...' : 'Browse Local Files'}</span>
                                            </div>
                                         </div>
                                      </div>
                                   </div>

                                   {/* Gallery Preview */}
                                   {row.images?.length > 0 && (
                                      <div className="pt-4 border-t border-border-light/50 flex flex-wrap gap-4">
                                         {row.images.map((img, imgIdx) => (
                                            <div key={imgIdx} className="relative w-20 h-24 rounded-2xl overflow-hidden group shadow-sm border border-border-light bg-white p-1">
                                               <img src={img} alt="" className="w-full h-full object-cover rounded-xl" />
                                               <button type="button" onClick={() => removeImage(idx, imgIdx)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-90 hover:scale-100"><X size={10} /></button>
                                            </div>
                                         ))}
                                      </div>
                                   )}
                                </motion.div>
                             )}
                          </div>
                        ))}
                     </div>
                     <button type="button" onClick={addPurchaseRow} className="w-full py-6 border-2 border-dashed border-border-light rounded-[2rem] text-[10px] font-black text-text-muted uppercase tracking-[0.4em] hover:border-premium-gold hover:text-premium-gold transition-all">
                        + Deploy Additional Item
                     </button>
                  </div>

                  {/* Summary & Actions */}
                  <div className="flex items-end justify-between pt-10 border-t border-border-light">
                     <div className="flex gap-10">
                        <div>
                           <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Items Procured</p>
                           <p className="text-xl font-black text-charcoal">{purchaseRows.reduce((s, r) => s + (Number(r.quantity) || 0), 0)} Units</p>
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Financial Impact</p>
                           <p className="text-xl font-black text-charcoal">{formatCurrency(grandTotal)}</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <button type="button" onClick={resetPurchaseForm} className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-charcoal transition-all">Cancel</button>
                        <button type="submit" disabled={createPurchaseMutation.isPending} className="bg-charcoal text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-3">
                           {createPurchaseMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Authorize Procurement</>}
                        </button>
                     </div>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Supplier Ledger Modal */}
      <AnimatePresence>
        {showLedgerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" onClick={() => setShowLedgerModal(false)} />
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="relative bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl p-12 border border-border-light max-h-[85vh] overflow-hidden flex flex-col">
               <div className="flex items-center justify-between mb-10 shrink-0">
                  <div>
                    <h2 className="text-3xl font-black text-charcoal uppercase tracking-tighter">Procurement Ledger</h2>
                    <p className="text-xs text-text-muted font-bold uppercase tracking-[0.2em] mt-1">{selectedSupplier?.name} — Trade History</p>
                  </div>
                  <button onClick={() => setShowLedgerModal(false)} className="p-4 hover:bg-light-bg rounded-full text-text-muted"><X size={28} /></button>
               </div>

               <div className="grid grid-cols-3 gap-6 mb-10 shrink-0">
                  <div className="p-8 bg-light-bg rounded-[2.5rem] border border-border-light/50">
                     <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2">Procured Volume</p>
                     <p className="text-2xl font-black text-charcoal tracking-tighter">{formatCurrency(selectedSupplier?.procuredVolume)}</p>
                  </div>
                  <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
                     <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Settled Value</p>
                     <p className="text-2xl font-black text-emerald-700 tracking-tighter">{formatCurrency(selectedSupplier?.settledValue)}</p>
                  </div>
                  <div className="p-8 bg-red-50 rounded-[2.5rem] border border-red-100">
                     <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-2">Net Payables</p>
                     <p className="text-2xl font-black text-red-700 tracking-tighter">{formatCurrency(selectedSupplier?.netPayables)}</p>
                  </div>
               </div>

               <div className="flex-1 flex gap-10 overflow-hidden">
                  {/* Settlement Timeline */}
                  <div className="flex-1 flex flex-col min-w-0">
                     <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-4 ml-2">Settlement Timeline</h4>
                     <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-4">
                        {!selectedSupplier?.payments?.length ? (
                          <div className="h-full flex items-center justify-center opacity-30 text-[10px] font-black uppercase tracking-widest">No settlements</div>
                        ) : (
                          selectedSupplier.payments.map((p, i) => (
                            <div key={i} className="bg-white border border-border-light p-5 rounded-[2rem] flex items-center justify-between group hover:border-premium-gold transition-all shadow-sm">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-light-bg rounded-xl flex items-center justify-center text-text-muted group-hover:bg-premium-gold group-hover:text-charcoal transition-all"><CreditCard size={18} /></div>
                                  <div>
                                     <div className="text-sm font-black text-charcoal">{formatCurrency(p.amount)} <span className="text-[9px] text-text-muted font-bold tracking-widest ml-2 uppercase">{p.method}</span></div>
                                     <div className="text-[10px] text-text-muted font-bold flex items-center gap-1.5 mt-1 uppercase tracking-widest"><Calendar size={10} /> {formatDate(p.date)}</div>
                                  </div>
                               </div>
                                <div className="flex items-center gap-3">
                                   <div className="text-right hidden md:block">
                                      <div className="text-[9px] font-black text-charcoal uppercase tracking-widest">{p.referenceId || 'CASH'}</div>
                                   </div>
                                   <button 
                                      onClick={() => { 
                                         setEditingPaymentId(p._id); 
                                         setPaymentData({ 
                                            amount: p.amount, 
                                            method: p.method, 
                                            referenceId: p.referenceId || '', 
                                            note: p.note || '', 
                                            date: new Date(p.date).toISOString().slice(0, 10) 
                                         }); 
                                         setShowPaymentModal(true); 
                                      }}
                                      className="p-3 hover:bg-light-bg rounded-xl text-text-muted hover:text-charcoal transition-all"
                                   >
                                      <FileText size={14} />
                                   </button>
                                   <button 
                                      onClick={() => { if(window.confirm('Delete settlement record?')) deletePaymentMutation.mutate({ supplierId: selectedSupplier._id, paymentId: p._id }); }}
                                      className="p-3 hover:bg-red-50 rounded-xl text-text-muted hover:text-red-500 transition-all"
                                   >
                                      <Trash2 size={14} />
                                   </button>
                                </div>
                            </div>
                          ))
                        )}
                     </div>
                  </div>

                  {/* Stock History */}
                  <div className="flex-1 flex flex-col min-w-0 border-l border-border-light pl-10">
                     <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-4 ml-2">Stock In-Flow</h4>
                     <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-4">
                        {/* Opening Balance Entry */}
                        {selectedSupplier?.openingBalance > 0 && (
                          <div className="bg-premium-gold/5 border border-premium-gold/20 p-5 rounded-[2rem] flex items-center justify-between group transition-all mb-4">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-premium-gold text-charcoal rounded-xl flex items-center justify-center shadow-lg shadow-premium-gold/20"><History size={18} /></div>
                                <div>
                                   <div className="text-sm font-black text-charcoal uppercase tracking-widest">Opening Balance</div>
                                   <div className="text-[10px] text-text-muted font-bold tracking-[0.2em]">{formatCurrency(selectedSupplier.openingBalance)} <span className="text-premium-gold ml-2 underline underline-offset-4 decoration-2">CARRIED FORWARD</span></div>
                                </div>
                             </div>
                             <div className="px-3 py-1 bg-premium-gold/20 rounded-full text-[8px] font-black text-premium-gold uppercase tracking-tighter">Legacy</div>
                          </div>
                        )}

                        {!selectedSupplier?.purchases?.length && !selectedSupplier?.openingBalance ? (
                          <div className="h-full flex items-center justify-center opacity-30 text-[10px] font-black uppercase tracking-widest">No stock flow</div>
                        ) : (
                          selectedSupplier.purchases.map((p, i) => (
                            <div key={i} className="bg-light-bg/50 border border-border-light/50 p-5 rounded-[2rem] flex items-center justify-between group hover:border-premium-gold transition-all">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-text-muted"><Truck size={18} /></div>
                                  <div>
                                     <div className="text-sm font-black text-charcoal">{p.purchaseNumber} <span className="text-[9px] text-text-muted font-bold tracking-widest ml-2 uppercase">₹{p.pricing?.totalAmount?.toLocaleString()}</span></div>
                                     <div className="text-[10px] text-text-muted font-bold flex items-center gap-1.5 mt-1 uppercase tracking-widest"><Package size={10} /> {p.items?.length} Items</div>
                                  </div>
                               </div>
                               <button onClick={() => { setShowLedgerModal(false); setActiveTab('purchases'); setSearch(p.purchaseNumber); }} className="p-3 hover:bg-white rounded-xl text-text-muted hover:text-premium-gold transition-all"><ExternalLink size={16} /></button>
                            </div>
                          ))
                        )}
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Record Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-charcoal/40 backdrop-blur-md" onClick={() => setShowPaymentModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 border border-border-light">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black text-charcoal uppercase tracking-tight">{editingPaymentId ? 'Adjust Settlement' : 'Post Settlement'}</h2>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">To: {selectedSupplier?.name}</p>
                </div>
                <button onClick={() => { setShowPaymentModal(false); setEditingPaymentId(null); setPaymentData({ amount: '', method: 'Cash', referenceId: '', note: '', date: new Date().toISOString().slice(0, 10) }); }} className="p-4 hover:bg-light-bg rounded-full"><X size={24} /></button>
              </div>

              <div className="space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Settlement Amount</label>
                       <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 font-black text-xl" placeholder="0.00" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Pay Mode</label>
                       <select className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 font-bold" value={paymentData.method} onChange={e => setPaymentData({...paymentData, method: e.target.value})}>
                          {['Cash', 'UPI', 'Bank', 'Cheque'].map(m => <option key={m} value={m}>{m}</option>)}
                       </select>
                    </div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Reference ID / Note</label>
                   <input className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 font-bold" placeholder="e.g. TXN12345" value={paymentData.referenceId} onChange={e => setPaymentData({...paymentData, referenceId: e.target.value})} />
                 </div>
              </div>

              <button 
                onClick={() => recordPaymentMutation.mutate({ id: selectedSupplier._id, data: paymentData, paymentId: editingPaymentId })}
                disabled={recordPaymentMutation.isPending}
                className="w-full mt-10 bg-charcoal text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center justify-center gap-3"
              >
                {recordPaymentMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> {editingPaymentId ? 'Update Settlement' : 'Commit Settlement'}</>}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Onboard Supplier Modal */}
      <AnimatePresence>
        {showSupplierForm && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-charcoal/40 backdrop-blur-md" onClick={() => { setShowSupplierForm(false); setEditingSupplierId(null); setNewSupplier({ name: '', phone: '', email: '', gstin: '', address: '', openingBalance: 0 }); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl p-12 border border-border-light">
               <div className="flex items-center justify-between mb-12">
                  <h2 className="text-3xl font-black text-charcoal uppercase tracking-tighter">{editingSupplierId ? 'Update Trade Partner' : 'Onboard Trade Partner'}</h2>
                  <button onClick={() => { setShowSupplierForm(false); setEditingSupplierId(null); setNewSupplier({ name: '', phone: '', email: '', gstin: '', address: '', openingBalance: 0 }); }} className="p-4 hover:bg-light-bg rounded-full"><X size={28} /></button>
               </div>

               <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Business Trade Name</label>
                        <input className="w-full bg-light-bg border-none rounded-2xl px-6 py-5 font-black" placeholder="e.g. Sri Textiles Hub" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Contact Phone</label>
                        <input className="w-full bg-light-bg border-none rounded-2xl px-6 py-5 font-black" placeholder="+91 000 000 0000" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">GSTIN Number</label>
                        <input className="w-full bg-light-bg border-none rounded-2xl px-6 py-5 font-black uppercase tracking-widest" placeholder="33AABBC..." value={newSupplier.gstin} onChange={e => setNewSupplier({...newSupplier, gstin: e.target.value})} />
                     </div>
                  </div>
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Opening Balance (₹)</label>
                        <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-6 py-5 font-black" placeholder="0.00" value={newSupplier.openingBalance} onChange={e => setNewSupplier({...newSupplier, openingBalance: Number(e.target.value)})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Office Address</label>
                        <textarea rows={4} className="w-full bg-light-bg border-none rounded-2xl px-6 py-5 font-bold resize-none" placeholder="Complete address..." value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} />
                     </div>
                  </div>
               </div>

               <button 
                  onClick={() => createSupplierMutation.mutate(newSupplier)}
                  disabled={createSupplierMutation.isPending}
                  className="w-full mt-12 bg-charcoal text-white py-7 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center justify-center gap-3"
               >
                  {createSupplierMutation.isPending ? <Loader2 size={24} className="animate-spin" /> : <>{editingSupplierId ? <Save size={24} /> : <Plus size={24} />} {editingSupplierId ? 'Update Details' : 'Authorize Partner'}</>}
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-20 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-charcoal/60 backdrop-blur-md" onClick={() => setShowDeleteModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 border border-red-100 overflow-hidden text-center">
               <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <AlertTriangle size={40} strokeWidth={2.5} className="animate-bounce" />
               </div>
               
               <h3 className="text-2xl font-black text-charcoal uppercase tracking-tighter mb-3">Terminate Partner?</h3>
               <p className="text-sm text-text-muted font-medium px-4 mb-8 leading-relaxed">
                  Are you sure you want to remove <span className="font-black text-charcoal">"{supplierToDelete?.name}"</span>? This action is permanent and cannot be reversed.
               </p>

               <div className="grid grid-cols-2 gap-4 mt-10">
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-text-muted hover:bg-light-bg transition-all"
                  >
                    Hold On
                  </button>
                  <button 
                    onClick={() => deleteSupplierMutation.mutate(supplierToDelete._id)}
                    disabled={deleteSupplierMutation.isPending}
                    className="py-5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                  >
                    {deleteSupplierMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Remove'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* 5. Purchase Delete Confirmation Modal */}
      <AnimatePresence>
        {showPurchaseDeleteModal && (
          <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-20 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-charcoal/40 backdrop-blur-md" onClick={() => setShowPurchaseDeleteModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl p-10 border border-border-light text-center">
               <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <AlertTriangle size={36} />
               </div>
               <h3 className="text-2xl font-black text-charcoal uppercase tracking-tighter mb-3">Rollback Bill?</h3>
               <p className="text-sm text-text-muted font-medium px-4 mb-8 leading-relaxed">
                  Are you sure you want to delete <span className="font-black text-charcoal">"{purchaseToDelete?.purchaseNumber}"</span>? 
                  <br />
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-2 block">Stock will be automatically reduced</span>
               </p>

               <div className="grid grid-cols-2 gap-4 mt-10">
                  <button 
                    onClick={() => setShowPurchaseDeleteModal(false)}
                    className="py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-text-muted hover:bg-light-bg transition-all"
                  >
                    Hold On
                  </button>
                  <button 
                    onClick={() => deletePurchaseMutation.mutate(purchaseToDelete._id)}
                    disabled={deletePurchaseMutation.isPending}
                    className="py-5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                  >
                    {deletePurchaseMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Delete'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
