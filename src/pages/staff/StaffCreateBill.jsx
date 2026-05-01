import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, Receipt, Printer, 
  Loader2, User, X, CreditCard, Wallet, Banknote, Smartphone,
  Package, LayoutGrid, ListFilter, Command, CheckCircle2, History, Shield, Sparkles, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { billService, productService, categoryService } from '../../services';
import { useAuthStore } from '../../store';
import { resolveAssetURL } from '../../utils/assetResolver';
import SafeImage from '../../components/common/SafeImage';

// ─── Constants ─────────────────────────────────────────
const SHORTCUTS = [
  { key: 'F2', action: 'Focus Search' },
  { key: 'F4', action: 'Toggle Grid/List' },
  { key: 'F9', action: 'Quick Checkout' },
  { key: 'Esc', action: 'Clear / Cancel' },
];

export default function StaffCreateBill() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [completedBill, setCompletedBill] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [heldBills, setHeldBills] = useState(() => JSON.parse(localStorage.getItem('magizhchi_held_bills') || '[]'));
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState({ cash: '', upi: '' });

  const searchInputRef = useRef(null);
  const debounceTimer = useRef(null);

  // ─── Data Fetching ───────────────────────────────────
  const { data: categories } = useQuery({
    queryKey: ['pos-categories'],
    queryFn: () => categoryService.getCategories().then(r => r.data.data?.categories || r.data.data || []),
  });


  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['pos-products', selectedCategory, search],
    queryFn: () => {
      const params = { limit: 50, isPOS: 'true' };
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (search) params.search = search;
      return productService.getProducts(params).then(r => r.data.data?.products || r.data.data || []);
    },
    placeholderData: (prev) => prev,
  });

  // ─── Keyboard Shortcuts ──────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setViewMode(v => v === 'grid' ? 'list' : 'grid');
      }
      if (e.key === 'F9') {
        e.preventDefault();
        if (items.length > 0) setIsCheckoutOpen(true);
        else toast.error('Add items first');
      }
      if (e.key === 'Escape') {
        if (selectedProduct) {
          setSelectedProduct(null);
        } else if (isCheckoutOpen) {
          setIsCheckoutOpen(false);
        } else {
          setSearch('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length, isCheckoutOpen, selectedProduct]);

  // ─── Actions ─────────────────────────────────────────
  const addToCart = (product, variant) => {
    if (variant.stock <= 0) return toast.error('Out of stock');
    
    const key = `${product._id}-${variant.size}-${variant.color}`;
    setItems(prev => {
      const existing = prev.find(i => i.key === key);
      if (existing) {
        if (existing.quantity >= variant.stock) {
          toast.error('Insufficient stock');
          return prev;
        }
        return prev.map(i => i.key === key ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        key,
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        size: variant.size,
        color: variant.color,
        price: product.discountedPrice || product.sellingPrice,
        mrp: product.sellingPrice,
        quantity: 1,
        image: resolveAssetURL(product.images?.[0]),
        maxStock: variant.stock,
        gstPercentage: product.gstPercentage || 5
      }];
    });
    setSelectedProduct(null); // Close modal if open
    toast.success(`${product.name} added`, { position: 'bottom-center' });
  };

  const handleProductClick = (product) => {
    if (!product.variants || product.variants.length === 0) return toast.error('No variants available');
    if (product.variants.length === 1) {
      addToCart(product, product.variants[0]);
    } else {
      setSelectedProduct(product);
      setSelectedColor(product.variants[0].color);
    }
  };

  const updateQty = (key, delta) => {
    setItems(prev => prev.map(i => {
      if (i.key !== key) return i;
      const newQty = Math.max(0, i.quantity + delta);
      if (newQty > i.maxStock) {
        toast.error('Insufficient stock');
        return i;
      }
      return { ...i, quantity: newQty };
    }).filter(i => i.quantity > 0));
  };

  const removeItem = (key) => {
    setItems(prev => prev.filter(i => i.key !== key));
  };

  const lookupCustomer = async (phone) => {
    if (phone.length < 10) return;
    setLoadingCustomer(true);
    try {
      const r = await billService.lookupCustomer(phone);
      if (r.data.data?.customer) {
        setCustomer(r.data.data.customer);
        toast.success(`Found: ${r.data.data.customer.name}`);
      }
    } catch {
      // Not found is fine
    } finally {
      setLoadingCustomer(false);
    }
  };

  const holdBill = () => {
    if (items.length === 0) return toast.error('Cart is empty');
    const newHold = { id: Date.now(), customer, items, discount, timestamp: new Date() };
    const updated = [...heldBills, newHold];
    setHeldBills(updated);
    localStorage.setItem('magizhchi_held_bills', JSON.stringify(updated));
    setItems([]);
    setCustomer({ name: '', phone: '', email: '' });
    setDiscount(0);
    toast.success('Bill parked successfully');
  };

  const resumeBill = (id) => {
    if (items.length > 0) return toast.error('Please clear or hold current bill first');
    const bill = heldBills.find(b => b.id === id);
    if (!bill) return;
    setItems(bill.items);
    setCustomer(bill.customer);
    setDiscount(bill.discount || 0);
    const updated = heldBills.filter(b => b.id !== id);
    setHeldBills(updated);
    localStorage.setItem('magizhchi_held_bills', JSON.stringify(updated));
    setShowHeldBills(false);
    toast.success('Bill resumed');
  };

  const handleSearchKeyDown = async (e) => {
    if (e.key === 'Enter' && search.trim() !== '') {
      const code = search.trim();
      setSearch(''); // Clear for next scan immediately

      try {
        // 1. Try Variant-specific Barcode/SKU first (from Inventory)
        const invRes = await billService.getByBarcode(code);
        const invItem = invRes.data.data?.item || invRes.data.data;
        
        if (invItem) {
          // Find the product to get display info
          const prodRes = await productService.getProduct(invItem.productRef?.slug || invItem.productRef?._id, { isPOS: 'true' });
          const product = prodRes.data.data?.product || prodRes.data.data;
          
          if (product) {
            addToCart(product, {
              size: invItem.size,
              color: invItem.color,
              stock: invItem.availableStock
            });
            return;
          }
        }

        // 2. Fallback: Search in pre-fetched productsData (Product-level SKU)
        const match = productsData?.find(p => p.sku?.toLowerCase() === code.toLowerCase());
        if (match) {
          handleProductClick(match);
          return;
        }

        toast.error('Item not found');
      } catch (err) {
        toast.error('Search error');
      }
    }
  };

  // ─── Totals ──────────────────────────────────────────
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  // GST is INCLUSIVE in Indian garment prices
  const tax = items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const rate = (item.gstPercentage || 5) / 100;
    const taxableValue = itemTotal / (1 + rate);
    return sum + (itemTotal - taxableValue);
  }, 0);
  const total = subtotal - discount;

  // ─── Mutation ────────────────────────────────────────
  const createBillMutation = useMutation({
    mutationFn: (data) => billService.createBill(data),
    onSuccess: (r) => {
      setCompletedBill(r.data.data.bill);
      setIsCheckoutOpen(false);
      setItems([]);
      setCustomer({ name: '', phone: '', email: '' });
      setDiscount(0);
      setSplitAmounts({ cash: '', upi: '' });
      toast.success('Transaction Completed!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Transaction failed'),
  });

  const handleCheckout = () => {
    if (paymentMethod === 'split') {
      const cash = Number(splitAmounts.cash) || 0;
      const upi = Number(splitAmounts.upi) || 0;
      if (cash + upi !== total) {
        return toast.error(`Split amounts (₹${cash + upi}) must equal Total (₹${total})`);
      }
    }

    createBillMutation.mutate({
      items: items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        size: i.size,
        color: i.color,
        price: i.price,
        quantity: i.quantity,
        total: i.price * i.quantity,
      })),
      customerDetails: customer,
      paymentMethod,
      paymentDetails: paymentMethod === 'split' ? { cashAmount: Number(splitAmounts.cash), upiAmount: Number(splitAmounts.upi) } : {},
      discount,
      notes: `POS Sale by ${user?.name}`,
    });
  };

  // ─── Render: Receipt ─────────────────────────────────
  if (completedBill) {
    return (
      <div className="min-h-screen bg-light-bg py-12 px-4 flex flex-col items-center">
        <Helmet><title>Invoice #{completedBill.billNumber}</title></Helmet>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] overflow-hidden border border-white relative"
          id="bill-print"
        >
          {/* Header Section */}
          <div className="bg-charcoal p-12 text-center text-white relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--premium-gold)_0%,_transparent_70%)]" />
            <div className="w-16 h-16 bg-premium-gold rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-premium-gold/20">
              <Sparkles className="text-charcoal" size={32} />
            </div>
            <h2 className="font-display text-4xl font-black tracking-[0.4em] mb-2 uppercase">MAGIZHCHI</h2>
            <p className="text-[9px] text-premium-gold font-black tracking-[0.6em] uppercase mb-8">Official Tax Invoice</p>
            
            <div className="inline-flex items-center gap-4 px-6 py-2 bg-white/5 border border-white/10 rounded-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Invoice No.</span>
              <span className="text-sm font-black text-premium-gold">#{completedBill.billNumber}</span>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4 text-left border-t border-white/5 pt-8">
              <div>
                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Date & Time</p>
                <p className="text-[11px] font-bold text-white/80">{new Date(completedBill.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Billing Counter</p>
                <p className="text-[11px] font-bold text-white/80">{user?.name}</p>
              </div>
            </div>
          </div>

          <div className="p-12 space-y-10">
            {/* Customer Section */}
            {completedBill.customerDetails?.name && (
              <div className="p-6 bg-light-bg/50 rounded-[2rem] border border-border-light flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Valued Customer</p>
                  <p className="text-lg font-black text-charcoal">{completedBill.customerDetails.name}</p>
                  <p className="text-xs text-text-muted font-bold mt-0.5">{completedBill.customerDetails.phone}</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-premium-gold">
                  <User size={24} />
                </div>
              </div>
            )}

            {/* Items Table */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">Purchase Summary</h3>
                <span className="text-[10px] font-black text-premium-gold uppercase tracking-[0.2em]">{completedBill.items?.length} Items</span>
              </div>
              <div className="space-y-4">
                {completedBill.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-4 border-b border-border-light last:border-0 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-14 bg-light-bg rounded-xl overflow-hidden border border-border-light group-hover:scale-105 transition-transform">
                        <SafeImage src={item.productId?.images?.[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-charcoal tracking-tight">{item.productName}</p>
                        <p className="text-[9px] text-text-muted uppercase font-black tracking-widest mt-0.5">{item.size} / {item.color} • ₹{item.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-text-muted uppercase mb-1">x{item.quantity}</p>
                      <p className="text-sm font-black text-charcoal">₹{item.total.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Section */}
            <div className="bg-charcoal p-10 rounded-[2.5rem] text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-premium-gold/5 rounded-bl-full" />
              <div className="space-y-3 relative z-10">
                <div className="flex justify-between text-[10px] font-black text-white/30 uppercase tracking-widest">
                  <span>Subtotal Value</span><span>₹{completedBill.pricing?.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black text-white/30 uppercase tracking-widest">
                  <span>GST (5%)</span><span>₹{completedBill.pricing?.gstAmount.toLocaleString()}</span>
                </div>
                {completedBill.pricing?.discount > 0 && (
                  <div className="flex justify-between text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    <span>Loyalty Discount</span><span>−₹{completedBill.pricing.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                  <div>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Total Payable</p>
                    <p className="text-4xl font-black text-premium-gold tracking-tighter">₹{completedBill.pricing?.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Payment via</p>
                    <p className="text-xs font-black uppercase tracking-widest text-white">{completedBill.paymentMethod}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer / Terms */}
            <div className="text-center space-y-6 pt-4">
              <div className="flex items-center justify-center gap-4">
                <div className="h-px flex-1 bg-border-light" />
                <Sparkles size={16} className="text-premium-gold/40" />
                <div className="h-px flex-1 bg-border-light" />
              </div>
              <p className="text-[9px] text-text-muted leading-relaxed max-w-xs mx-auto italic">
                Thank you for choosing Magizhchi Garments. For exchanges, please present this invoice within 7 days.
              </p>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Website</p>
                  <p className="text-[10px] font-bold text-charcoal">magizhchi.com</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Support</p>
                  <p className="text-[10px] font-bold text-charcoal">+91 98765 43210</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SaaS Share & Export Panel */}
        <div className="w-full max-w-2xl mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
          <button 
            onClick={() => {
              const text = `Hi ${completedBill.customerDetails?.name}, your invoice #${completedBill.billNumber} from Magizhchi Garments is ready: ₹${completedBill.pricing?.totalAmount}. Thank you for shopping with us!`;
              window.open(`https://wa.me/91${completedBill.customerDetails?.phone}?text=${encodeURIComponent(text)}`, '_blank');
            }}
            className="flex flex-col items-center gap-3 p-6 bg-white rounded-3xl border border-border-light hover:border-premium-gold transition-all group shadow-sm hover:shadow-xl"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Smartphone size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-charcoal">WhatsApp</span>
          </button>

          <button className="flex flex-col items-center gap-3 p-6 bg-white rounded-3xl border border-border-light hover:border-premium-gold transition-all group shadow-sm hover:shadow-xl">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <History size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-charcoal">Email</span>
          </button>

          <button onClick={() => window.print()} className="flex flex-col items-center gap-3 p-6 bg-white rounded-3xl border border-border-light hover:border-premium-gold transition-all group shadow-sm hover:shadow-xl">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Printer size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-charcoal">Print PDF</span>
          </button>

          <button className="flex flex-col items-center gap-3 p-6 bg-white rounded-3xl border border-border-light hover:border-premium-gold transition-all group shadow-sm hover:shadow-xl">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-charcoal">Cloud Save</span>
          </button>
        </div>

        <div className="flex gap-4 mt-8 w-full max-w-2xl no-print">
          <button onClick={() => setCompletedBill(null)} className="w-full bg-charcoal text-white py-6 rounded-[2rem] flex items-center justify-center gap-4 font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl">
            <Plus size={20} className="text-premium-gold" /> Create Another Bill
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: POS ─────────────────────────────────────
  return (
    <div className="h-screen bg-light-bg flex flex-col overflow-hidden p-6 gap-6">
      <Helmet><title>Professional POS — Magizhchi</title></Helmet>

      {/* ─── Immersive Top Bar: SaaS Style ─── */}
      <div className="flex items-center justify-between bg-white px-10 py-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-white shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-charcoal rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-charcoal/20">
            <LayoutGrid className="text-premium-gold" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-charcoal tracking-tighter leading-tight">Billing Dashboard</h1>
            <div className="flex items-center gap-2 text-[10px] text-text-muted font-black uppercase tracking-widest mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Active Session: {user?.name}
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-10">
          <div className="flex items-center gap-8 border-x border-border-light px-8">
            <div className="text-center group cursor-pointer">
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1 group-hover:text-premium-gold transition-colors">Daily Progress</p>
              <div className="w-32 h-2 bg-light-bg rounded-full overflow-hidden mt-2 relative">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-premium-gold to-orange-400 w-[65%]" />
              </div>
            </div>
            <div className="text-center group cursor-pointer">
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1 group-hover:text-premium-gold transition-colors">Total Sales</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-black text-charcoal tracking-tighter">₹42,500</p>
                <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                  <CheckCircle2 size={12} />
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Backup Status</p>
              <div className="flex items-center gap-2">
                <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Encrypted</p>
                <Shield size={12} className="text-emerald-500" />
              </div>
            </div>
            
            {/* Held Bills Access */}
            <div className="text-center group cursor-pointer" onClick={() => setShowHeldBills(true)}>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1 group-hover:text-premium-gold transition-colors">Parked Sales</p>
              <div className="flex items-center gap-2 justify-center">
                <p className="text-lg font-black text-charcoal tracking-tighter">{heldBills.length}</p>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white ${heldBills.length > 0 ? 'bg-orange-500 shadow-lg shadow-orange-500/20' : 'bg-text-muted'}`}>
                  <History size={12} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {SHORTCUTS.map(s => (
              <div key={s.key} className="flex flex-col items-center">
                <kbd className="bg-light-bg border border-border-light px-2 py-1 rounded-lg text-[9px] font-black text-charcoal shadow-sm min-w-[32px] text-center mb-1">{s.key}</kbd>
                <span className="text-[8px] font-black text-text-muted uppercase tracking-tighter">{s.action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* ─── Left: Product Browsing (70%) ─── */}
        <div className="flex-1 flex flex-col gap-4 min-h-0 bg-white rounded-[2rem] border border-border-light p-6 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
            {/* Search */}
            <div className="relative w-full md:max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-premium-gold transition-colors" size={18} />
              <input
                ref={searchInputRef}
                className="w-full bg-light-bg border border-border-light rounded-2xl pl-12 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-premium-gold/20 focus:border-premium-gold text-sm font-medium transition-all"
                placeholder="Search products or scan barcode (F2)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
              <button 
                onClick={() => setSelectedCategory('All')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${selectedCategory === 'All' ? 'bg-charcoal text-white shadow-lg' : 'bg-light-bg text-text-muted hover:bg-border-light'}`}
              >
                All Products
              </button>
              {categories?.map(cat => (
                <button 
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${selectedCategory === cat.slug ? 'bg-charcoal text-white shadow-lg' : 'bg-light-bg text-text-muted hover:bg-border-light'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Layout */}
          <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
            {isLoadingProducts ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-premium-gold" size={32} />
              </div>
            ) : productsData?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
                <Package size={48} className="mb-4" />
                <p className="font-bold">No products found</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {productsData.map(product => (
                  <div key={product._id} onClick={() => handleProductClick(product)} className="bg-light-bg rounded-[1.5rem] border border-border-light overflow-hidden group hover:border-premium-gold hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full">
                    <div className="relative aspect-[4/5] overflow-hidden bg-white shrink-0">
                      <SafeImage 
                        src={product.images?.[0]} 
                        alt="" 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.variants?.some(v => v.stock > 0 && v.stock < 5) && (
                          <div className="bg-red-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shadow-lg animate-pulse">Low Stock</div>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-[8px] font-black px-2 py-1 rounded-md text-charcoal border border-border-light shadow-sm">
                        {product.sku}
                      </div>
                      <div className="absolute inset-0 bg-charcoal/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white text-charcoal px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all shadow-xl">
                          <Plus size={16} /> Select
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-charcoal line-clamp-2 leading-tight">{product.name}</h3>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-2">{product.variants?.length} Variant{product.variants?.length !== 1 && 's'}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border-light flex items-end justify-between">
                        <span className="text-xs font-black text-text-muted line-through">₹{product.sellingPrice}</span>
                        <span className="text-lg font-black text-premium-gold leading-none">₹{product.discountedPrice || product.sellingPrice}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {productsData.map(product => (
                  <div key={product._id} onClick={() => handleProductClick(product)} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-border-light hover:border-premium-gold hover:shadow-md transition-all cursor-pointer group">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                      <SafeImage src={product.images?.[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-charcoal truncate">{product.name}</h3>
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">{product.sku} • {product.variants?.length} Variant{product.variants?.length !== 1 && 's'}</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-black text-text-muted line-through">₹{product.sellingPrice}</span>
                      <span className="block text-lg font-black text-premium-gold leading-none">₹{product.discountedPrice || product.sellingPrice}</span>
                    </div>
                    <div className="w-10 h-10 bg-light-bg rounded-full flex items-center justify-center group-hover:bg-premium-gold group-hover:text-white transition-colors shrink-0 ml-2">
                      <Plus size={18} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Right: Cart Sidebar (30%) ─── */}
        <div className="w-[400px] flex flex-col bg-charcoal rounded-[2rem] overflow-hidden shadow-2xl shrink-0">
          {/* Cart Header */}
          <div className="p-6 bg-charcoal/50 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-premium-gold rounded-xl flex items-center justify-center shadow-lg shadow-premium-gold/20">
                <ShoppingCart className="text-charcoal" size={20} />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">Active Bill</span>
            </div>
            <div className="flex gap-2">
              <button onClick={holdBill} className="p-2 bg-white/5 text-white/50 hover:text-orange-400 hover:bg-orange-400/10 rounded-lg transition-all" title="Park Sale (Hold Bill)">
                <History size={18} />
              </button>
              <button onClick={() => setItems([])} className="p-2 bg-white/5 text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Clear Bill">
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/20">
                <div className="w-16 h-16 border-4 border-dashed border-white/5 rounded-full flex items-center justify-center mb-4">
                  <Plus size={24} />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest">Cart is empty</p>
                <p className="text-[10px] mt-1 opacity-50">Select products to begin</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {items.map(item => (
                  <motion.div 
                    key={item.key}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-4 group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-white/5 p-1 shrink-0 overflow-hidden border border-white/10">
                      <SafeImage src={item.image} alt="" className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-xs line-clamp-1">{item.productName}</p>
                      <p className="text-white/40 text-[10px] uppercase font-medium mt-0.5">{item.size} / {item.color} • ₹{item.price}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 bg-white/5 p-0.5 rounded-lg border border-white/10">
                          <button onClick={() => updateQty(item.key, -1)} className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-all"><Minus size={12} /></button>
                          <span className="w-6 text-center text-[10px] font-black text-white">{item.quantity}</span>
                          <button onClick={() => updateQty(item.key, 1)} className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-all"><Plus size={12} /></button>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-between">
                      <button onClick={() => removeItem(item.key)} className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition-all self-end"><Trash2 size={14} /></button>
                      <p className="text-premium-gold font-black text-xs">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Cart Footer */}
          <div className="p-6 bg-black/20 border-t border-white/10 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-white/50 text-[10px] font-black uppercase tracking-widest">
                <span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white/50 text-[10px] font-black uppercase tracking-widest">
                <span>Tax (5% GST)</span><span>₹{tax.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                  <span>Discount</span><span>−₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-end pt-2">
                <span className="text-white/40 text-xs font-black uppercase tracking-[0.2em]">Total</span>
                <span className="text-3xl font-black text-premium-gold leading-none">₹{total.toLocaleString()}</span>
              </div>
            </div>

            <button 
              disabled={items.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full bg-premium-gold hover:bg-gold-dark text-charcoal font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-premium-gold/10 transition-all group disabled:opacity-30 disabled:grayscale"
            >
              COMPLETE TRANSACTION (F9)
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Smart Variant Selector Modal ─── */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-charcoal/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[500px]"
            >
              <div className="w-full md:w-2/5 bg-light-bg relative hidden md:block">
                <SafeImage src={selectedProduct.images?.[0]} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                   <h3 className="text-white font-black text-xl leading-tight line-clamp-2">{selectedProduct.name}</h3>
                   <p className="text-premium-gold font-black text-xs uppercase tracking-widest mt-2">{selectedProduct.sku}</p>
                </div>
              </div>
              
              <div className="w-full md:w-3/5 p-8 flex flex-col h-full bg-white relative">
                <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 p-2 bg-light-bg rounded-xl hover:bg-border-light transition-colors"><X size={20} /></button>
                
                <h4 className="text-charcoal font-black text-lg mb-6">Select Variant</h4>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {/* Colors */}
                  <div className="mb-6">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">Available Colors</p>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(selectedProduct.variants.map(v => v.color))].map(c => (
                        <button 
                          key={c}
                          onClick={() => setSelectedColor(c)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedColor === c ? 'bg-charcoal text-white shadow-lg' : 'bg-light-bg text-text-muted hover:bg-border-light'}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Sizes */}
                  <div>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">Available Sizes</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {selectedProduct.variants.filter(v => v.color === selectedColor).map((v, i) => (
                        <button 
                          key={i}
                          disabled={v.stock <= 0}
                          onClick={() => addToCart(selectedProduct, v)}
                          className={`relative p-3 rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${v.stock > 0 ? 'border-border-light hover:border-premium-gold bg-white hover:shadow-md' : 'border-border-light bg-light-bg opacity-50 cursor-not-allowed'}`}
                        >
                          <span className="text-lg font-black text-charcoal">{v.size}</span>
                          <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{v.stock > 0 ? `${v.stock} in stock` : 'Out of Stock'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Checkout Modal ─── */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-charcoal/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[600px] md:h-auto"
            >
              {/* Left: Summary */}
              <div className="w-full md:w-5/12 bg-charcoal p-8 flex flex-col justify-between">
                <div>
                   <h2 className="text-white/40 text-xs font-black uppercase tracking-[0.2em] mb-6">Payment Summary</h2>
                   <div className="space-y-4">
                     {items.map(i => (
                       <div key={i.key} className="flex justify-between text-xs font-bold">
                         <span className="text-white/60">{i.productName} (x{i.quantity})</span>
                         <span className="text-white">₹{(i.price * i.quantity).toLocaleString()}</span>
                       </div>
                     ))}
                   </div>
                </div>
                <div className="pt-6 border-t border-white/10">
                   <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Payable Amount</p>
                   <p className="text-4xl font-black text-premium-gold">₹{total.toLocaleString()}</p>
                </div>
              </div>

              {/* Right: Payment & Customer */}
              <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-charcoal tracking-tight uppercase">Checkout Details</h3>
                  <button onClick={() => setIsCheckoutOpen(false)} className="p-2 bg-light-bg rounded-xl hover:bg-border-light transition-colors"><X size={20} /></button>
                </div>

                <div className="space-y-6">
                  {/* Customer Lookup */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Customer Info</label>
                    <div className="relative group">
                       <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-premium-gold transition-colors" size={18} />
                       <input 
                         className="w-full bg-light-bg border border-border-light rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-premium-gold/20 focus:border-premium-gold text-sm font-bold transition-all"
                         placeholder="Customer Phone (Lookup)"
                         value={customer.phone}
                         onChange={(e) => {
                           const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                           setCustomer({...customer, phone: val});
                           if (val.length === 10) lookupCustomer(val);
                         }}
                       />
                       {loadingCustomer && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-premium-gold animate-spin" size={16} />}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                         className="w-full bg-light-bg border border-border-light rounded-xl px-4 py-3 focus:outline-none text-xs font-bold"
                         placeholder="Customer Name"
                         value={customer.name}
                         onChange={(e) => setCustomer({...customer, name: e.target.value})}
                      />
                      <input 
                         className="w-full bg-light-bg border border-border-light rounded-xl px-4 py-3 focus:outline-none text-xs font-bold"
                         placeholder="Email (Optional)"
                         value={customer.email}
                         onChange={(e) => setCustomer({...customer, email: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Discount */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Discount Amount</label>
                      <div className="flex gap-1.5">
                        {[5, 10, 15].map(pct => (
                          <button key={pct} onClick={() => setDiscount(Math.round(subtotal * (pct/100)))} className="px-2 py-0.5 rounded text-[8px] font-black bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                            {pct}% Off
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative group">
                       <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-premium-gold transition-colors" size={18} />
                       <input 
                         type="number"
                         className="w-full bg-light-bg border border-border-light rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-premium-gold/20 focus:border-premium-gold text-sm font-bold transition-all"
                         placeholder="₹0.00"
                         value={discount}
                         onChange={(e) => setDiscount(Math.min(subtotal, Number(e.target.value)))}
                       />
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Payment Method</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'cash', icon: Banknote, label: 'Cash', color: 'text-emerald-600' },
                        { id: 'gpay', icon: Smartphone, label: 'GPay', color: 'text-blue-600' },
                        { id: 'card', icon: CreditCard, label: 'Card', color: 'text-indigo-600' },
                        { id: 'split', icon: Wallet, label: 'Split', color: 'text-orange-600' }
                      ].map(m => (
                        <button 
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${paymentMethod === m.id ? 'border-premium-gold bg-gold-soft ring-4 ring-premium-gold/5' : 'border-border-light hover:border-border-dark'}`}
                        >
                          <m.icon size={20} className={paymentMethod === m.id ? 'text-premium-gold' : m.color} />
                          <span className={`text-[9px] font-black uppercase tracking-widest ${paymentMethod === m.id ? 'text-charcoal' : 'text-text-muted'}`}>{m.label}</span>
                        </button>
                      ))}
                    </div>

                    {paymentMethod === 'split' && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-text-muted">₹</span>
                          <input type="number" placeholder="Cash Amount" className="w-full bg-light-bg border border-border-light rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:ring-2 focus:ring-premium-gold/20" value={splitAmounts.cash} onChange={e => setSplitAmounts({...splitAmounts, cash: e.target.value})} />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-text-muted">₹</span>
                          <input type="number" placeholder="UPI Amount" className="w-full bg-light-bg border border-border-light rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:ring-2 focus:ring-premium-gold/20" value={splitAmounts.upi} onChange={e => setSplitAmounts({...splitAmounts, upi: e.target.value})} />
                        </div>
                        <div className="col-span-2 text-right pt-1">
                          <span className={`text-[10px] font-black tracking-widest uppercase ${(Number(splitAmounts.cash)||0) + (Number(splitAmounts.upi)||0) === total ? 'text-emerald-500' : 'text-red-500'}`}>
                            Balance Pending: ₹{(total - ((Number(splitAmounts.cash)||0) + (Number(splitAmounts.upi)||0))).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={handleCheckout}
                    disabled={createBillMutation.isLoading}
                    className="w-full bg-charcoal hover:bg-black text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all group disabled:opacity-50"
                  >
                    {createBillMutation.isLoading ? <Loader2 className="animate-spin" size={20} /> : 'CONFIRM & GENERATE INVOICE'}
                    <CheckCircle2 className="w-5 h-5 text-premium-gold" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Held Bills Modal ─── */}
      <AnimatePresence>
        {showHeldBills && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHeldBills(false)} className="absolute inset-0 bg-charcoal/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
              <div className="p-6 border-b border-border-light flex items-center justify-between bg-light-bg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center">
                    <History size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-charcoal tracking-tight text-lg">Parked Sales</h3>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-0.5">{heldBills.length} Bills on Hold</p>
                  </div>
                </div>
                <button onClick={() => setShowHeldBills(false)} className="p-2 bg-white rounded-xl hover:bg-border-light transition-colors"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                {heldBills.length === 0 ? (
                  <div className="py-12 text-center text-text-muted opacity-50">
                    <History size={48} className="mx-auto mb-4" />
                    <p className="font-bold">No parked sales found</p>
                  </div>
                ) : (
                  heldBills.map(bill => (
                    <div key={bill.id} className="bg-light-bg border border-border-light p-4 rounded-[1.5rem] flex items-center justify-between group hover:border-premium-gold transition-colors">
                      <div>
                        <p className="text-xs font-black text-charcoal">{bill.customer?.name || 'Walk-in Customer'}</p>
                        <p className="text-[10px] font-bold text-text-muted mt-1">{new Date(bill.timestamp).toLocaleTimeString()} • {bill.items.length} items</p>
                      </div>
                      <button onClick={() => resumeBill(bill.id)} className="bg-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md hover:bg-premium-gold transition-all text-charcoal">
                        Resume
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
