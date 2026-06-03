import { useState, useEffect } from 'react'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Trash2, Save, X, Search, ChevronDown, Loader2, Package, Truck, 
  Calendar, Hash, IndianRupee, User, FileText, CheckCircle, Clock, 
  AlertCircle, ExternalLink, CreditCard, History, Phone, Mail, MapPin, 
  BarChart3, ArrowUpRight, ArrowDownLeft, Layers, LayoutGrid, AlertTriangle,
  Image as ImageIcon, Upload, UserPlus, Settings
} from 'lucide-react';
import { purchaseService, adminService, inventoryService, productService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store';

// --- Helpers ---
const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const generateRowId = () => {
   if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
   }
   return 'row-' + Math.random().toString(36).substring(2, 11);
};

const createNewPurchaseRow = () => ({
   id: generateRowId(),
   productName: '',
   color: '',
   size: '',
   quantity: '',
   costPrice: '',
   sellingPrice: '',
   images: []
});

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function AdminProcurement() {
   const { isAuthenticated } = useAuthStore();
   const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' or 'suppliers'
   const [showPurchaseForm, setShowPurchaseForm] = useState(() => {
      return localStorage.getItem('open_purchase_form') === 'true';
   });
   const [showSupplierForm, setShowSupplierForm] = useState(() => {
      return localStorage.getItem('open_supplier_form') === 'true';
   });
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
   const [isSubmitted, setIsSubmitted] = useState(false);
   
   const queryClient = useQueryClient();
   const navigate = useNavigate();
   const { search: urlSearch } = useLocation();

   // --- Form States ---
   const [purchaseBill, setPurchaseBill] = useState(() => {
      try {
         const saved = localStorage.getItem('draft_purchase_bill');
         return saved ? JSON.parse(saved) : {
            supplierId: '', supplierName: '', billNumber: '', billDate: new Date().toISOString().slice(0, 10),
            paymentStatus: 'paid', notes: '', paidAmount: 0, status: 'received', billImage: '', totalAmount: ''
         };
      } catch {
         return {
            supplierId: '', supplierName: '', billNumber: '', billDate: new Date().toISOString().slice(0, 10),
            paymentStatus: 'paid', notes: '', paidAmount: 0, status: 'received', billImage: '', totalAmount: ''
         };
      }
   });
   const [isUploadingBill, setIsUploadingBill] = useState(false);
   const [viewBillImage, setViewBillImage] = useState(null);
   const [purchaseRows, setPurchaseRows] = useState(() => {
      try {
         const saved = localStorage.getItem('draft_purchase_rows');
         if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
               return parsed.map(r => r.id ? r : { ...r, id: generateRowId() });
            }
         }
         return [createNewPurchaseRow()];
      } catch {
         return [createNewPurchaseRow()];
      }
   });
   
   const [newSupplier, setNewSupplier] = useState(() => {
      try {
         const saved = localStorage.getItem('draft_new_supplier');
         return saved ? JSON.parse(saved) : { name: '', phone: '', email: '', gstin: '', address: '', openingBalance: '' };
      } catch {
         return { name: '', phone: '', email: '', gstin: '', address: '', openingBalance: '' };
      }
   });
   const [paymentData, setPaymentData] = useState({ amount: '', method: 'Cash', referenceId: '', note: '', date: new Date().toISOString().slice(0, 10) });

   // --- Sync Drafts to LocalStorage ---
   useEffect(() => {
      localStorage.setItem('draft_purchase_bill', JSON.stringify(purchaseBill));
   }, [purchaseBill]);

   useEffect(() => {
      localStorage.setItem('draft_purchase_rows', JSON.stringify(purchaseRows));
   }, [purchaseRows]);

   useEffect(() => {
      localStorage.setItem('draft_new_supplier', JSON.stringify(newSupplier));
   }, [newSupplier]);

   useEffect(() => {
      localStorage.setItem('open_purchase_form', showPurchaseForm);
   }, [showPurchaseForm]);

   useEffect(() => {
      localStorage.setItem('open_supplier_form', showSupplierForm);
   }, [showSupplierForm]);

  // --- Queries ---
  const { data: healthData } = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => adminService.getHealth().then(r => r.data),
    refetchInterval: 30000, // Refresh every 30s
    enabled: isAuthenticated,
  });
  const health = healthData?.data;

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
      queryClient.invalidateQueries({ queryKey: ['admin-health'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
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
      setNewSupplier({ name: '', phone: '', email: '', gstin: '', address: '', openingBalance: '' });
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
      queryClient.invalidateQueries({ queryKey: ['admin-health'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
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
   const duplicatePurchaseRow = (row) => {
      setPurchaseRows(prev => {
         const idx = prev.findIndex(r => r.id === row.id);
         if (idx === -1) return prev;
         const duplicated = {
            ...row,
            id: generateRowId(),
         };
         const next = [...prev];
         next.splice(idx + 1, 0, duplicated);
         return next;
      });
   };
   
   const syncFromCatalog = async (rowId) => {
      const row = purchaseRows.find(r => r.id === rowId);
      const name = row?.productName?.trim();
      if (!name) return toast.error('Enter product name to sync');
      
      setIsUploading(true);
      try {
         const res = await productService.getProducts({ search: name, limit: 1 });
         const product = res.data.data?.data?.[0] || res.data.data?.[0];
         
         if (product) {
            setPurchaseRows(prev => prev.map(r => r.id === rowId ? { 
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

   const handleAddExternalImage = (rowId) => {
      if (!tempImageUrl) return;
      const row = purchaseRows.find(r => r.id === rowId);
      const currentImages = row?.images || [];
      updatePurchaseRow(rowId, 'images', [...currentImages, tempImageUrl]);
      setTempImageUrl('');
      toast.success('Image added');
   };

   const handleFileUpload = async (rowId, e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      setIsUploading(true);
      try {
         const res = await adminService.uploadImage(formData);
         const url = res.data?.url;
         if (url) {
            const row = purchaseRows.find(r => r.id === rowId);
            const currentImages = row?.images || [];
            updatePurchaseRow(rowId, 'images', [...currentImages, url]);
            toast.success('Image uploaded');
         } else {
            throw new Error('No URL returned from server');
         }
      } catch (err) {
         toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
      } finally {
         setIsUploading(false);
      }
   };

   const removeImage = (rowId, imgIdx) => {
      const row = purchaseRows.find(r => r.id === rowId);
      const currentImages = row?.images || [];
      updatePurchaseRow(rowId, 'images', currentImages.filter((_, i) => i !== imgIdx));
   };

   const calculateRowTotal = (r) => {
      const qty = Number(r.quantity) || 0;
      const price = Number(r.costPrice) || 0;
      return qty * price;
   };
   
   const grandTotal = purchaseRows.reduce((sum, r) => sum + calculateRowTotal(r), 0);
   const finalTotalAmount = purchaseBill.totalAmount !== '' && purchaseBill.totalAmount !== undefined ? Number(purchaseBill.totalAmount) : grandTotal;
   const subtotal = grandTotal;
   const totalGST = 0;

   const getDueAmount = () => {
      if (purchaseBill.paymentStatus === 'paid') return 0;
      if (purchaseBill.paymentStatus === 'pending' || purchaseBill.paymentStatus === 'credit') return finalTotalAmount;
      const paid = Number(purchaseBill.paidAmount) || 0;
      return Math.max(0, finalTotalAmount - paid);
   };

   const handlePurchaseSubmit = (e) => {
      e.preventDefault();
      setIsSubmitted(true);

      if (!purchaseBill.supplierId) {
         return toast.error('Please select a supplier partner');
      }
      if (!purchaseBill.billNumber?.trim()) {
         return toast.error('Supplier Bill Number is required');
      }
      if (!purchaseBill.billDate) {
         return toast.error('Transaction Date is required');
      }

      // Check rows
      const validRows = purchaseRows.filter(r => r.productName?.trim() && Number(r.quantity) > 0 && Number(r.costPrice) > 0);
      if (validRows.length === 0) {
         return toast.error('At least one valid item is required with quantity and cost price');
      }

      // Strict check for partially filled rows
      for (let i = 0; i < purchaseRows.length; i++) {
         const r = purchaseRows[i];
         const hasName = !!r.productName?.trim();
         const hasQty = Number(r.quantity) > 0;
         const hasCost = Number(r.costPrice) > 0;

         if (hasName || hasQty || hasCost || r.color || r.size) {
            if (!hasName) return toast.error(`Row ${i + 1}: Product name is required`);
            if (!r.size?.trim()) return toast.error(`Row ${i + 1}: Size is required`);
            if (!hasQty) return toast.error(`Row ${i + 1}: Quantity must be greater than zero`);
            if (!hasCost) return toast.error(`Row ${i + 1}: Cost price must be greater than zero`);
         }
      }

      const finalPaid = purchaseBill.paymentStatus === 'paid' 
         ? finalTotalAmount 
         : (purchaseBill.paymentStatus === 'pending' || purchaseBill.paymentStatus === 'credit') 
            ? 0 
            : Math.min(finalTotalAmount, Number(purchaseBill.paidAmount) || 0);

      const purchaseData = {
         ...purchaseBill,
         items: validRows.map(r => ({ 
            ...r, 
            quantity: Number(r.quantity), 
            costPrice: Number(r.costPrice), 
            sellingPrice: Number(r.sellingPrice) || Number(r.costPrice) * 1.5, 
            images: r.images || [] 
         })),
         pricing: { subtotal: grandTotal, gstAmount: 0, totalAmount: finalTotalAmount },
         paidAmount: finalPaid
      };

      if (editingPurchaseId) {
         updatePurchaseMutation.mutate({ id: editingPurchaseId, data: purchaseData });
      } else {
         createPurchaseMutation.mutate(purchaseData);
      }
   };

   const handleBillImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate size (< 10MB)
      if (file.size > 10 * 1024 * 1024) {
         toast.error('File size exceeds the 10MB limit.');
         return;
      }

      // Validate type
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];
      const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
         toast.error('Unsupported file format. Please upload an image, PDF, Word, or Excel document.');
         return;
      }

      setIsUploadingBill(true);
      const formData = new FormData();
      formData.append('image', file);
      try {
         const { data } = await adminService.uploadImage(formData);
         const url = data?.url;
         if (url) {
            setPurchaseBill(f => ({ ...f, billImage: url }));
            toast.success('Bill attachment uploaded successfully');
         } else {
            throw new Error('No URL returned from server');
         }
      } catch (err) { 
         toast.error('Upload failed: ' + (err.response?.data?.message || err.message)); 
      } finally { 
         setIsUploadingBill(false); 
      }
   };

   const handleCreatePurchase = (p) => {
      setEditingPurchaseId(p._id);
      setPurchaseBill({
         supplierId: p.supplierId?._id || '',
         supplierName: p.supplierName || '',
         billNumber: p.billNumber || '',
         billDate: new Date(p.purchaseDate || p.createdAt).toISOString().slice(0, 10),
         paymentStatus: p.paymentStatus || 'paid',
         notes: p.notes || '',
         paidAmount: p.paidAmount || 0,
         status: p.status || 'received',
         billImage: p.billImage || ''
      });
      setPurchaseRows(p.items.map(item => ({
         id: generateRowId(),
         productName: item.productName,
         color: item.color || '',
         size: item.size || '',
         quantity: item.quantity,
         costPrice: item.costPrice,
         sellingPrice: item.sellingPrice || item.costPrice * 1.5,
         images: item.images || []
      })));
      setIsSubmitted(false);
      setShowPurchaseForm(true);
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
         status: p.status || 'received',
         billImage: p.billImage || '',
         totalAmount: p.pricing?.totalAmount || ''
      });
      setPurchaseRows(p.items.map(item => ({
         id: generateRowId(),
         productName: item.productName,
         color: item.color || '',
         size: item.size || '',
         quantity: item.quantity,
         costPrice: item.costPrice,
         sellingPrice: item.sellingPrice || item.costPrice * 1.5,
         images: item.images || []
      })));
      setIsSubmitted(false);
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
      localStorage.removeItem('draft_purchase_bill');
      localStorage.removeItem('draft_purchase_rows');
      localStorage.removeItem('open_purchase_form');
      setPurchaseBill({ 
         supplierId: '', 
         supplierName: '', 
         billNumber: '', 
         billDate: new Date().toISOString().slice(0, 10), 
         paymentStatus: 'paid', 
         notes: '', 
         paidAmount: 0, 
         status: 'received', 
         billImage: '', 
         totalAmount: '' 
      });
      setPurchaseRows([createNewPurchaseRow()]);
      setEditingPurchaseId(null);
      setIsSubmitted(false);
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
      value: formatCurrency((Array.isArray(suppliers) ? suppliers : []).reduce((sum, s) => sum + (s.procuredVolume || 0), 0)), 
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
      value: (suppliers || []).filter(s => !s.isDeleted).length, 
      icon: Truck, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50' 
    }
  ];

  return (
    <div className="space-y-6 pb-20">
      <Helmet><title>Procurement & Supply Chain — Admin</title></Helmet>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-border-light pb-8">
        <div>
          <h1 className="text-3xl font-black text-charcoal tracking-tighter uppercase leading-none">Procurement Hub</h1>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.3em] mt-2">Unified Supply Chain & Financial Ledger</p>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setShowSupplierForm(true)} className="px-4 md:px-4 md:px-8 py-4 bg-white border border-border-light text-charcoal rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:border-premium-gold transition-all flex items-center gap-2">
              <UserPlus size={16} /> New Partner
           </button>
           <button onClick={() => setShowPurchaseForm(true)} className="px-4 md:px-4 md:px-8 py-4 bg-charcoal text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-2">
              <Plus size={16} /> Record Bill
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="bg-white rounded-[2rem] border border-border-light p-4 sm:p-4 sm:p-6 shadow-sm group hover:border-premium-gold transition-all">
                <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <s.icon size={18} />
                </div>
                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">{s.label}</p>
                <p className="text-xl font-black text-charcoal tracking-tighter">{s.value}</p>
              </div>
            ))}
         </div>

         <div className="bg-white rounded-[2.5rem] border border-border-light p-4 sm:p-4 sm:p-6 shadow-sm overflow-hidden flex flex-col">
            <h3 className="text-[10px] font-black text-charcoal uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
               <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Service Pulse</span>
               <span className="text-[8px] text-text-muted">Live</span>
            </h3>
            <div className="flex gap-2 mb-4">
               <div className={`flex-1 p-2.5 rounded-2xl border ${health?.whatsapp?.ready ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'} transition-all`}>
                  <p className="text-[8px] font-black uppercase tracking-widest mb-1">WhatsApp</p>
                  <p className="text-[10px] font-bold flex items-center gap-1.5">
                    {health?.whatsapp?.ready ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                    {health?.whatsapp?.ready ? 'Ready' : 'Failed'}
                  </p>
               </div>
               <div className={`flex-1 p-2.5 rounded-2xl border ${health?.email?.ready ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'} transition-all`}>
                  <p className="text-[8px] font-black uppercase tracking-widest mb-1">Email</p>
                  <p className="text-[10px] font-bold flex items-center gap-1.5">
                    {health?.email?.ready ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                    {health?.email?.ready ? 'Ready' : 'Failed'}
                  </p>
               </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[120px] pr-1 custom-scrollbar">
               {(!movements || movements.length === 0) ? (
                 <p className="text-[9px] font-bold text-text-muted uppercase italic opacity-50">Awaiting activity...</p>
               ) : movements.slice(0, 5).map((m, i) => (
                 <div key={i} className="flex items-start gap-3 border-l-2 border-border-light pl-4 py-0.5 hover:border-premium-gold transition-all group">
                    <div className="flex-1 min-w-0">
                       <p className="text-[9px] font-black text-charcoal truncate group-hover:text-premium-gold transition-colors">
                          {m.productId?.name || 'Item'}
                       </p>
                       <p className="text-[7px] font-bold text-text-muted uppercase tracking-widest">
                          <span className={m.quantity > 0 ? 'text-emerald-500' : 'text-red-500'}>{m.quantity > 0 ? '+' : ''}{m.quantity}</span> • {m.type.replace('_', ' ')}
                       </p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* ─── Trade Partners Directory ─── */}
      <div className="space-y-6">
         <div className="flex items-center justify-between px-2">
            <h2 className="text-[11px] font-black text-charcoal uppercase tracking-[0.4em] flex items-center gap-3">
               <User size={16} className="text-premium-gold" /> Supplier Directory
            </h2>
            {search && (
              <button onClick={() => setSearch('')} className="text-[9px] font-black text-premium-gold uppercase tracking-widest hover:underline">Clear Filter</button>
            )}
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingSuppliers ? (
              [1,2,3,4].map(i => <div key={i} className="h-40 bg-white rounded-[2rem] border border-border-light animate-pulse" />)
            ) : suppliers.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-[2.5rem] border border-dashed border-border-light text-text-muted font-bold uppercase text-[10px] tracking-widest">No Partners Onboarded</div>
            ) : (
              suppliers.filter(s => !s.isDeleted && (s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search))).slice(0, 4).map(s => (
                <div key={s._id} className={`bg-white rounded-[2rem] border-2 p-4 sm:p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer group ${search === s.name ? 'border-premium-gold ring-4 ring-premium-gold/5' : 'border-border-light hover:border-premium-gold/30'}`} onClick={() => setSearch(s.name)}>
                   <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-light-bg rounded-2xl flex items-center justify-center text-charcoal group-hover:bg-premium-gold transition-colors">
                         <User size={20} />
                      </div>
                      <div className="flex gap-2">
                        <button title="History/Ledger" onClick={(e) => { e.stopPropagation(); setSelectedSupplier(s); setShowLedgerModal(true); }} className="p-2 hover:bg-light-bg rounded-lg text-text-muted hover:text-charcoal transition-all"><History size={16} /></button>
                        <button title="Edit" onClick={(e) => { e.stopPropagation(); handleEditSupplier(s); }} className="p-2 hover:bg-light-bg rounded-lg text-text-muted hover:text-charcoal transition-all"><Settings size={16} /></button>
                        <button title="Archive/Delete" onClick={(e) => { e.stopPropagation(); confirmDelete(s); }} className="p-2 hover:bg-red-50 rounded-lg text-text-muted hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                      </div>
                   </div>
                   <h3 className="font-black text-charcoal text-base truncate">{s.name}</h3>
                   <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-1 mb-4">{s.phone}</p>
                   <div className="pt-4 border-t border-border-light flex justify-between items-end">
                      <div>
                         <p className="text-[8px] font-black text-text-muted uppercase mb-1">Outstanding</p>
                         <p className={`text-sm font-black ${s.netPayables > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(s.netPayables)}</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedSupplier(s); setShowPaymentModal(true); }}
                        className="bg-charcoal text-white text-[8px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-premium-gold transition-all"
                      >
                        Settle
                      </button>
                   </div>
                </div>
              ))
            )}
            {suppliers.length > 4 && (
              <div className="bg-light-bg/30 rounded-[2rem] border border-dashed border-border-light p-4 sm:p-4 sm:p-6 flex flex-col items-center justify-center text-center group hover:bg-white transition-all cursor-pointer" onClick={() => { setSearch(''); /* Reset search to show all in next section maybe? */ }}>
                 <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">+{suppliers.length - 4} More Partners</p>
                 <p className="text-[8px] font-bold text-premium-gold uppercase tracking-widest mt-1 group-hover:underline">View All Ledger</p>
              </div>
            )}
         </div>
      </div>

      {/* ─── MODALS ─── */}
      
      {/* 1. Record Purchase Bill Modal */}
      <AnimatePresence>
         {showPurchaseForm && (
            <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-8 overflow-y-auto">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={resetPurchaseForm} />
               <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative bg-white w-full admin-modal-container max-w-6xl rounded-[4rem] shadow-2xl border border-border-light mb-8 p-12">
                  <div className="flex items-center justify-between mb-10">
                     <div>
                        <h2 className="text-3xl font-black text-charcoal uppercase tracking-tighter">
                           {editingPurchaseId ? 'Edit Procurement Bill' : 'Inventory Procurement'}
                        </h2>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Transforming Purchase Bills into Active Stock</p>
                     </div>
                     <button onClick={resetPurchaseForm} className="p-4 hover:bg-light-bg rounded-full text-text-muted"><X size={28} /></button>
                  </div>

                  <form onSubmit={handlePurchaseSubmit} className="space-y-10">
                     {/* Header Grid */}
                     <div className="grid md:grid-cols-4 gap-8 bg-light-bg/50 p-4 md:p-4 md:p-8 rounded-[2.5rem] border border-border-light/50">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">
                              Supplier Selection <span className="text-red-500 font-bold">*</span>
                           </label>
                           <select 
                              className={`w-full bg-white rounded-2xl px-4 sm:px-4 sm:px-6 py-4 font-black text-sm focus:ring-2 focus:ring-premium-gold/30 ${
                                 isSubmitted && !purchaseBill.supplierId 
                                    ? 'ring-2 ring-red-400 border-2 border-red-400 focus:ring-4 focus:ring-red-100' 
                                    : 'border border-border-light/50 focus:ring-2 focus:ring-premium-gold/20'
                              }`} 
                              value={purchaseBill.supplierId} 
                              onChange={e => {
                                 const s = suppliers.find(x => x._id === e.target.value);
                                 setPurchaseBill({...purchaseBill, supplierId: e.target.value, supplierName: s?.name || ''});
                              }}
                           >
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
                           <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">
                              Supplier Bill # <span className="text-red-500 font-bold">*</span>
                           </label>
                           <input 
                              className={`w-full bg-white rounded-2xl px-4 sm:px-4 sm:px-6 py-4 font-black text-sm focus:ring-2 focus:ring-premium-gold/30 uppercase ${
                                 isSubmitted && !purchaseBill.billNumber?.trim() 
                                    ? 'ring-2 ring-red-400 border-2 border-red-400 focus:ring-4 focus:ring-red-100' 
                                    : 'border border-border-light/50 focus:ring-2 focus:ring-premium-gold/20'
                              }`} 
                              placeholder="e.g. TAX/2024/99" 
                              value={purchaseBill.billNumber} 
                              onChange={e => setPurchaseBill({...purchaseBill, billNumber: e.target.value})} 
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">
                              Transaction Date <span className="text-red-500 font-bold">*</span>
                           </label>
                           <input 
                              type="date" 
                              className={`w-full bg-white rounded-2xl px-4 sm:px-4 sm:px-6 py-4 font-black text-sm focus:ring-2 focus:ring-premium-gold/30 ${
                                 isSubmitted && !purchaseBill.billDate 
                                    ? 'ring-2 ring-red-400 border-2 border-red-400 focus:ring-4 focus:ring-red-100' 
                                    : 'border border-border-light/50 focus:ring-2 focus:ring-premium-gold/20'
                              }`} 
                              value={purchaseBill.billDate} 
                              onChange={e => setPurchaseBill({...purchaseBill, billDate: e.target.value})} 
                           />
                        </div>
                        <div className="space-y-2 relative md:col-span-1">
                           <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Attach Physical Bill</label>
                           <input type="file" className="hidden" id="bill-img-up" onChange={handleBillImageUpload} accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx" />
                           <div className="relative">
                              <label htmlFor="bill-img-up" className={`flex items-center gap-3 w-full bg-white border-2 border-dashed ${purchaseBill.billImage ? 'border-emerald-300 bg-emerald-50/5' : 'border-border-light'} rounded-2xl px-4 sm:px-4 sm:px-6 py-4 cursor-pointer hover:border-premium-gold transition-all shadow-sm`}>
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${purchaseBill.billImage ? 'bg-emerald-100 text-emerald-600' : 'bg-light-bg text-text-muted'} shrink-0`}>
                                    {isUploadingBill ? <Loader2 size={20} className="animate-spin" /> : (purchaseBill.billImage?.toLowerCase().endsWith('.pdf') ? <FileText size={20} /> : <ImageIcon size={20} />)}
                                 </div>
                                 <div className="flex-1 min-w-0 pr-8">
                                    <p className="text-xs font-black text-charcoal truncate">
                                       {purchaseBill.billImage ? (purchaseBill.billImage.split('/').pop() || 'Attached Document') : 'Upload Proof'}
                                    </p>
                                    <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest mt-0.5">
                                       {isUploadingBill ? 'Uploading file...' : purchaseBill.billImage ? '✓ Click to replace' : 'JPG, PNG, PDF, DOC, XLS up to 10MB'}
                                    </p>
                                 </div>
                              </label>
                              {purchaseBill.billImage && !isUploadingBill && (
                                 <button 
                                    type="button" 
                                    onClick={(e) => {
                                       e.preventDefault();
                                       setPurchaseBill(f => ({ ...f, billImage: '' }));
                                       toast.success('Attachment removed');
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm z-10"
                                    title="Remove attachment"
                                 >
                                    <Trash2 size={14} />
                                 </button>
                              )}
                           </div>
                        </div>
                     </div>

                     {/* Dynamic Rows */}
                     <div className="space-y-4">
                        {/* Column headers */}
                        <div className="hidden md:grid grid-cols-12 gap-3 px-3 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">
                           <div className="col-span-3">Product Name *</div>
                           <div className="col-span-2">Custom SKU <span className="normal-case font-medium opacity-60">(opt)</span></div>
                           <div className="col-span-1">Color <span className="normal-case font-medium opacity-60">(opt)</span></div>
                           <div className="col-span-1 text-center">Size *</div>
                           <div className="col-span-1 text-center">Qty *</div>
                           <div className="col-span-1 text-center">Cost ₹ *</div>
                           <div className="col-span-2">Selling Price ₹</div>
                           <div className="col-span-1 text-right">Total</div>
                        </div>
                        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1" style={{scrollbarWidth:'thin'}}>
                           {purchaseRows.map((row, idx) => {
                              const isRowInvalid = isSubmitted && (!row.productName?.trim() || !row.size?.trim() || Number(row.quantity) <= 0 || Number(row.costPrice) <= 0);
                              return (
                                 <div key={row.id} className={`bg-white border rounded-2xl shadow-sm hover:border-premium-gold/60 transition-all p-5 ${isRowInvalid ? 'border-2 border-red-300 bg-red-50/5' : 'border-border-light'}`}>
                                    <div className="grid grid-cols-12 gap-3 items-center">
                                       {/* Product Name */}
                                       <div className="col-span-12 md:col-span-3 flex items-center gap-2">
                                          <div className="flex-1">
                                             <p className="text-[8px] font-black text-text-muted uppercase mb-1 md:hidden">Product Name *</p>
                                             <input 
                                                className={`w-full bg-light-bg/60 border rounded-xl px-4 py-3 text-xs font-bold text-charcoal placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-premium-gold/20 ${
                                                   isSubmitted && !row.productName?.trim() ? 'border-2 border-red-400 focus:ring-4 focus:ring-red-100 bg-red-50/5' : 'border-border-light/50'
                                                }`} 
                                                placeholder="e.g. Cotton Casual Shirt" 
                                                value={row.productName} 
                                                onChange={e => updatePurchaseRow(row.id, 'productName', e.target.value)} 
                                             />
                                          </div>
                                          <button type="button" onClick={() => syncFromCatalog(row.id)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shrink-0" title="Sync from catalog">
                                             <History size={13} />
                                          </button>
                                       </div>

                                       {/* Custom SKU */}
                                       <div className="col-span-6 md:col-span-2">
                                          <p className="text-[8px] font-black text-text-muted uppercase mb-1 md:hidden">Custom SKU</p>
                                          <input 
                                             className="w-full bg-light-bg/60 border border-border-light/50 rounded-xl px-3 py-3 text-xs font-bold text-charcoal placeholder:text-text-muted/40 uppercase focus:outline-none" 
                                             placeholder="AUTO-GEN" 
                                             value={row.sku || ''} 
                                             onChange={e => updatePurchaseRow(row.id, 'sku', e.target.value)} 
                                          />
                                       </div>

                                       {/* Color (optional) */}
                                       <div className="col-span-6 md:col-span-1">
                                          <p className="text-[8px] font-black text-text-muted uppercase mb-1 md:hidden">Color (opt)</p>
                                          <input 
                                             className="w-full bg-light-bg/60 border border-border-light/50 rounded-xl px-3 py-3 text-xs font-bold text-charcoal placeholder:text-text-muted/40 focus:outline-none" 
                                             placeholder="e.g. Red" 
                                             value={row.color} 
                                             onChange={e => updatePurchaseRow(row.id, 'color', e.target.value)} 
                                          />
                                       </div>

                                       {/* Size — dropdown + custom text box for Other */}
                                       <div className="col-span-6 md:col-span-1 flex gap-1.5">
                                          <div className="flex-1">
                                             <p className="text-[8px] font-black text-text-muted uppercase mb-1 md:hidden">Size *</p>
                                             <select 
                                                className={`w-full bg-light-bg/60 border rounded-xl px-1 py-3 text-xs font-bold text-charcoal focus:outline-none ${
                                                   isSubmitted && !row.size?.trim() ? 'border-2 border-red-400 focus:ring-4 focus:ring-red-100 bg-red-50/5' : 'border-border-light/50'
                                                }`} 
                                                value={STANDARD_SIZES.includes(row.size) || row.size === '' ? row.size : '__other__'} 
                                                onChange={e => { 
                                                   if (e.target.value === '__other__') { 
                                                      updatePurchaseRow(row.id, '_sizeMode', 'custom'); 
                                                      updatePurchaseRow(row.id, 'size', ''); 
                                                   } else { 
                                                      updatePurchaseRow(row.id, '_sizeMode', ''); 
                                                      updatePurchaseRow(row.id, 'size', e.target.value); 
                                                   } 
                                                }}
                                             >
                                                <option value="">Size</option>
                                                {STANDARD_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                <option value="__other__">Other</option>
                                             </select>
                                          </div>
                                          {(row._sizeMode === 'custom' || (!STANDARD_SIZES.includes(row.size) && row.size !== '')) && (
                                             <input className="w-16 bg-white border-2 border-premium-gold/50 rounded-xl px-1 py-3 text-xs font-bold text-charcoal focus:outline-none focus:ring-2 focus:ring-premium-gold/30" placeholder="38" value={row.size} onChange={e => updatePurchaseRow(row.id, 'size', e.target.value)} />
                                          )}
                                       </div>

                                       {/* Qty */}
                                       <div className="col-span-4 md:col-span-1">
                                          <p className="text-[8px] font-black text-text-muted uppercase mb-1 md:hidden">Qty *</p>
                                          <input 
                                             type="number" 
                                             min="1" 
                                             className={`w-full bg-light-bg/60 border rounded-xl px-1 py-3 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-premium-gold/20 ${
                                                isSubmitted && (!row.quantity || Number(row.quantity) <= 0) ? 'border-2 border-red-400 focus:ring-4 focus:ring-red-100 bg-red-50/5' : 'border-border-light/50'
                                             }`} 
                                             placeholder="0" 
                                             value={row.quantity} 
                                             onChange={e => {
                                                const val = e.target.value === '' ? '' : Math.max(1, Number(e.target.value) || 1);
                                                updatePurchaseRow(row.id, 'quantity', val);
                                             }} 
                                          />
                                       </div>

                                       {/* Cost Price */}
                                       <div className="col-span-4 md:col-span-1">
                                          <p className="text-[8px] font-black text-text-muted uppercase mb-1 md:hidden">Cost ₹ *</p>
                                          <div className="relative">
                                             <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted">₹</span>
                                             <input 
                                                type="number" 
                                                min="0" 
                                                className={`w-full bg-light-bg/60 border rounded-xl pl-5 pr-1 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-premium-gold/20 ${
                                                   isSubmitted && (!row.costPrice || Number(row.costPrice) <= 0) ? 'border-2 border-red-400 focus:ring-4 focus:ring-red-100 bg-red-50/5' : 'border-border-light/50'
                                                }`} 
                                                placeholder="0" 
                                                value={row.costPrice} 
                                                onChange={e => {
                                                   const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value) || 0);
                                                   updatePurchaseRow(row.id, 'costPrice', val);
                                                }} 
                                             />
                                          </div>
                                       </div>

                                       {/* Selling Price */}
                                       <div className="col-span-4 md:col-span-2">
                                          <p className="text-[8px] font-black text-text-muted uppercase mb-1 md:hidden">Selling ₹</p>
                                          <div className="relative">
                                             <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted">₹</span>
                                             <input 
                                                type="number" 
                                                min="0" 
                                                className="w-full bg-light-bg/60 border border-border-light/50 rounded-xl pl-6 pr-2 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-premium-gold/20" 
                                                placeholder="auto" 
                                                value={row.sellingPrice} 
                                                onChange={e => {
                                                   const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value) || 0);
                                                   updatePurchaseRow(row.id, 'sellingPrice', val);
                                                }} 
                                             />
                                          </div>
                                       </div>

                                       {/* Total + Actions */}
                                       <div className="col-span-12 md:col-span-1 flex items-center justify-between md:flex-col md:items-end gap-2 pt-2 md:pt-0 border-t border-border-light/40 md:border-0">
                                          <span className="font-black text-charcoal text-sm tabular-nums">₹{calculateRowTotal(row).toLocaleString()}</span>
                                          <div className="flex gap-1.5">
                                             <button type="button" onClick={() => duplicatePurchaseRow(row)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all" title="Duplicate Row">
                                                <Layers size={14} />
                                             </button>
                                             <button type="button" onClick={() => setExpandedPurchaseRow(expandedPurchaseRow === row.id ? null : row.id)} className={`p-2 rounded-xl transition-all flex items-center gap-1 ${row.images?.length > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-light-bg text-text-muted hover:bg-indigo-50 hover:text-indigo-600'}`} title="Images">
                                                <ImageIcon size={14} />
                                                {row.images?.length > 0 && <span className="text-[10px] font-black">{row.images.length}</span>}
                                             </button>
                                             <button type="button" onClick={() => removePurchaseRow(row.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Remove"><Trash2 size={14} /></button>
                                          </div>
                                       </div>
                                    </div>

                                    {expandedPurchaseRow === row.id && (
                                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="col-span-full mt-4 bg-light-bg/30 rounded-3xl border border-indigo-100/50 p-4 sm:p-4 sm:p-6 space-y-6">
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
                                                   <button type="button" onClick={() => handleAddExternalImage(row.id)} className="px-4 sm:px-4 sm:px-6 py-3 bg-charcoal text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">Add</button>
                                                </div>
                                             </div>

                                             {/* System Upload */}
                                             <div className="space-y-3">
                                                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Upload from System</label>
                                                <div className="relative">
                                                   <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => handleFileUpload(row.id, e)} />
                                                   <div className="w-full bg-white border-2 border-dashed border-indigo-100 rounded-xl px-4 sm:px-4 sm:px-6 py-3 flex items-center justify-center gap-3 text-text-muted group hover:border-indigo-600 hover:text-indigo-600 transition-all">
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
                                                      <button type="button" onClick={() => removeImage(row.id, imgIdx)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-90 hover:scale-100"><X size={10} /></button>
                                                   </div>
                                                ))}
                                             </div>
                                          )}
                                       </motion.div>
                                    )}
                                 </div>
                              );
                           })}
                        </div>
                        <button type="button" onClick={addPurchaseRow} className="w-full py-4 sm:py-4 sm:py-6 border-2 border-dashed border-border-light rounded-[2rem] text-[10px] font-black text-text-muted uppercase tracking-[0.4em] hover:border-premium-gold hover:text-premium-gold transition-all">
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
                           <div className="flex flex-col">
                              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Financial Impact ₹ *</p>
                              <div className="relative flex items-center">
                                 <span className="absolute left-4 text-xs font-bold text-text-muted/60">₹</span>
                                 <input 
                                    type="number" 
                                    className="w-36 bg-light-bg border border-border-light/60 rounded-xl pl-8 pr-3 py-2 text-xs font-black text-charcoal focus:outline-none focus:ring-2 focus:ring-premium-gold/40 focus:border-premium-gold transition-all" 
                                    placeholder={grandTotal}
                                    value={purchaseBill.totalAmount}
                                    onChange={e => {
                                       const val = e.target.value;
                                       setPurchaseBill(prev => ({
                                          ...prev,
                                          totalAmount: val,
                                          paidAmount: prev.paymentStatus === 'paid' ? (val !== '' ? Number(val) : grandTotal) : prev.paidAmount
                                       }));
                                    }}
                                 />
                              </div>
                              <p className="text-[7px] font-bold text-text-muted/60 uppercase tracking-widest mt-1">Calculated: {formatCurrency(grandTotal)}</p>
                           </div>
                        </div>
                        <div className="flex gap-4">
                           <button type="button" onClick={resetPurchaseForm} className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-charcoal transition-all">Clear Draft</button>
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
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="relative bg-white w-full admin-modal-container max-w-5xl rounded-[4rem] shadow-2xl p-12 border border-border-light max-h-[85vh] overflow-hidden flex flex-col">
               <div className="flex items-center justify-between mb-10 shrink-0">
                  <div>
                    <h2 className="text-3xl font-black text-charcoal uppercase tracking-tighter">Procurement Ledger</h2>
                    <p className="text-xs text-text-muted font-bold uppercase tracking-[0.2em] mt-1">{selectedSupplier?.name} — Trade History</p>
                  </div>
                  <button onClick={() => setShowLedgerModal(false)} className="p-4 hover:bg-light-bg rounded-full text-text-muted"><X size={28} /></button>
               </div>

               <div className="grid grid-cols-3 gap-6 mb-10 shrink-0">
                  <div className="p-4 md:p-4 md:p-8 bg-light-bg rounded-[2.5rem] border border-border-light/50">
                     <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2">Procured Volume</p>
                     <p className="text-2xl font-black text-charcoal tracking-tighter">{formatCurrency(selectedSupplier?.procuredVolume)}</p>
                  </div>
                  <div className="p-4 md:p-4 md:p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
                     <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Settled Value</p>
                     <p className="text-2xl font-black text-emerald-700 tracking-tighter">{formatCurrency(selectedSupplier?.settledValue)}</p>
                  </div>
                  <div className="p-4 md:p-4 md:p-8 bg-red-50 rounded-[2.5rem] border border-red-100">
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
                               <div className="flex items-center flex-wrap gap-4">
                                  <div className="w-10 h-10 bg-light-bg rounded-xl flex items-center justify-center text-text-muted group-hover:bg-premium-gold group-hover:text-charcoal transition-all"><CreditCard size={18} /></div>
                                  <div>
                                     <div className="text-sm font-black text-charcoal">{formatCurrency(p.amount)} <span className="text-[9px] text-text-muted font-bold tracking-widest ml-2 uppercase">{p.method}</span></div>
                                     <div className="text-[10px] text-text-muted font-bold flex items-center gap-1.5 mt-1 uppercase tracking-widest"><Calendar size={10} /> {formatDate(p.date)}</div>
                                  </div>
                               </div>
                                <div className="flex items-center flex-wrap gap-3">
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
                             <div className="flex items-center flex-wrap gap-4">
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
                               <div className="flex items-center flex-wrap gap-4">
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
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full admin-modal-container max-w-lg rounded-[3.5rem] shadow-2xl p-12 border border-border-light">
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
                       <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-4 font-black text-xl" placeholder="0.00" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Pay Mode</label>
                       <select className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-4 font-bold" value={paymentData.method} onChange={e => setPaymentData({...paymentData, method: e.target.value})}>
                          {['Cash', 'UPI', 'Bank', 'Cheque'].map(m => <option key={m} value={m}>{m}</option>)}
                       </select>
                    </div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Reference ID / Note</label>
                   <input className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-4 font-bold" placeholder="e.g. TXN12345" value={paymentData.referenceId} onChange={e => setPaymentData({...paymentData, referenceId: e.target.value})} />
                 </div>
              </div>

              <button 
                onClick={() => recordPaymentMutation.mutate({ id: selectedSupplier._id, data: paymentData, paymentId: editingPaymentId })}
                disabled={recordPaymentMutation.isPending}
                className="w-full mt-10 bg-charcoal text-white py-4 sm:py-4 sm:py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center justify-center gap-3"
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-charcoal/40 backdrop-blur-md" onClick={() => { setShowSupplierForm(false); setEditingSupplierId(null); setNewSupplier({ name: '', phone: '', email: '', gstin: '', address: '', openingBalance: '' }); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full admin-modal-container max-w-4xl rounded-[4rem] shadow-2xl p-12 border border-border-light">
               <div className="flex items-center justify-between mb-12">
                  <h2 className="text-3xl font-black text-charcoal uppercase tracking-tighter">{editingSupplierId ? 'Update Trade Partner' : 'Onboard Trade Partner'}</h2>
                  <button onClick={() => { setShowSupplierForm(false); setEditingSupplierId(null); setNewSupplier({ name: '', phone: '', email: '', gstin: '', address: '', openingBalance: '' }); }} className="p-4 hover:bg-light-bg rounded-full"><X size={28} /></button>
               </div>

               <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Business Trade Name</label>
                        <input className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-5 font-black" placeholder="e.g. Sri Textiles Hub" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Contact Phone</label>
                        <input 
                          className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-5 font-black" 
                          placeholder="10-digit phone number" 
                          value={newSupplier.phone} 
                          onChange={e => setNewSupplier({...newSupplier, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">GSTIN Number</label>
                        <input className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-5 font-black uppercase tracking-widest" placeholder="33AABBC..." value={newSupplier.gstin} onChange={e => setNewSupplier({...newSupplier, gstin: e.target.value})} />
                     </div>
                  </div>
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Opening Balance (₹)</label>
                        <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-5 font-black" placeholder="0.00" value={newSupplier.openingBalance} onChange={e => setNewSupplier({...newSupplier, openingBalance: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Office Address</label>
                        <textarea rows={4} className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-5 font-bold resize-none" placeholder="Complete address..." value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} />
                     </div>
                  </div>
               </div>

                <button 
                   onClick={() => {
                     if (!newSupplier.name || !newSupplier.phone) return toast.error('Name and Phone are required');
                     if (newSupplier.phone.length !== 10) return toast.error('Phone must be 10 digits');
                     const dataToSubmit = {
                        ...newSupplier,
                        openingBalance: Number(newSupplier.openingBalance) || 0
                     };
                     createSupplierMutation.mutate(dataToSubmit);
                   }}
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
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full admin-modal-container max-w-md rounded-[3rem] shadow-2xl p-5 md:p-10 border border-red-100 overflow-hidden text-center">
               <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <AlertTriangle size={40} strokeWidth={2.5} className="animate-bounce" />
               </div>
               
               <h3 className="text-2xl font-black text-charcoal uppercase tracking-tighter mb-3">Terminate Partner?</h3>
               <p className="text-sm text-text-muted font-medium px-4 mb-8 leading-relaxed">
                  Are you sure you want to delete <span className="font-black text-charcoal">"{supplierToDelete?.name}"</span>? 
                  <br />
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-2 block">
                     This supplier has procurement history. Deleting will archive the supplier but preserve all procurement records.
                  </span>
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
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full admin-modal-container max-w-sm rounded-[3.5rem] shadow-2xl p-5 md:p-10 border border-border-light text-center">
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
      {/* 6. View Attached Document Modal */}
      <AnimatePresence>
        {viewBillImage && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-charcoal/60 backdrop-blur-md" onClick={() => setViewBillImage(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full admin-modal-container max-w-4xl rounded-[3rem] shadow-2xl p-4 md:p-4 md:p-8 border border-border-light flex flex-col max-h-[85vh]">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-charcoal uppercase tracking-tighter">Attached Document</h3>
                  <button onClick={() => setViewBillImage(null)} className="p-3 hover:bg-light-bg rounded-full text-text-muted transition-all"><X size={20} /></button>
               </div>
               <div className="flex-1 overflow-auto rounded-2xl border border-border-light/60 bg-light-bg/40 p-2 flex items-center justify-center min-h-[50vh]">
                  {viewBillImage.toLowerCase().endsWith('.pdf') ? (
                    <iframe src={viewBillImage} className="w-full h-[60vh] rounded-xl border-none" title="Attached Bill PDF" />
                  ) : (
                    <img src={viewBillImage} className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-md" alt="Attached Physical Bill" />
                  )}
               </div>
               <div className="flex justify-end gap-4 mt-6">
                  <a href={viewBillImage} target="_blank" rel="noreferrer" className="px-4 sm:px-4 sm:px-6 py-3 bg-charcoal text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all">Open In New Tab</a>
                  <button onClick={() => setViewBillImage(null)} className="px-4 sm:px-4 sm:px-6 py-3 bg-light-bg text-charcoal rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-border-light transition-all">Close</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
