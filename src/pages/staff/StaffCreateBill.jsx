import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, Receipt, Printer, 
  Loader2, User, X, CreditCard, Wallet, Banknote, Smartphone,
  Package, LayoutGrid, ListFilter, Command, CheckCircle2, History, Shield, Sparkles, ArrowRight, Mail, Gift, Scissors, Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { billService, productService, categoryService, adminService, inventoryService } from '../../services';
import { useAuthStore } from '../../store';
import { resolveAssetURL, getValidImage } from '../../utils/assetResolver';
import SafeImage from '../../components/common/SafeImage';
import { dbService } from '../../utils/db';
import { usePosLock } from '../../hooks/usePosLock';
import '../../print.css';
// ─── Constants ─────────────────────────────────────────
const SHORTCUTS = [
  { key: 'F2', action: 'Focus Search' },
  { key: 'F4', action: 'Toggle Grid/List' },
  { key: 'F9', action: 'Quick Checkout' },
  { key: 'Esc', action: 'Clear / Cancel' },
];

export default function StaffCreateBill() {
  const { isLocked } = usePosLock();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  // ─── Multi-Session Billing Carts (SaaS Model) ───────
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('pos_active_tab');
    return saved ? Number(saved) : 0;
  });
  const [cartSessions, setCartSessions] = useState(() => {
    const saved = localStorage.getItem('pos_cart_sessions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback below
      }
    }
    return [
      { items: [], customer: { name: '', phone: '', email: '' }, discount: 0, salesStaffId: '', paymentMethod: 'cash', activeCoupon: '' },
      { items: [], customer: { name: '', phone: '', email: '' }, discount: 0, salesStaffId: '', paymentMethod: 'cash', activeCoupon: '' },
      { items: [], customer: { name: '', phone: '', email: '' }, discount: 0, salesStaffId: '', paymentMethod: 'cash', activeCoupon: '' },
    ];
  });

  // Read current active tab values dynamically
  const items = cartSessions[activeTab].items;
  const customer = cartSessions[activeTab].customer;
  const discount = cartSessions[activeTab].discount;
  const salesStaffId = cartSessions[activeTab].salesStaffId;
  const paymentMethod = cartSessions[activeTab].paymentMethod;
  const activeCoupon = cartSessions[activeTab].activeCoupon || '';

  // Setter helper hooks that intercept and target the specific active tab in cartSessions
  const setItems = (valOrFn) => {
    setCartSessions(prev => {
      const copy = [...prev];
      const newVal = typeof valOrFn === 'function' ? valOrFn(copy[activeTab].items) : valOrFn;
      copy[activeTab] = { ...copy[activeTab], items: newVal };
      return copy;
    });
  };

  const setCustomer = (valOrFn) => {
    setCartSessions(prev => {
      const copy = [...prev];
      const newVal = typeof valOrFn === 'function' ? valOrFn(copy[activeTab].customer) : valOrFn;
      copy[activeTab] = { ...copy[activeTab], customer: newVal };
      return copy;
    });
  };

  const setDiscount = (valOrFn) => {
    setCartSessions(prev => {
      const copy = [...prev];
      const newVal = typeof valOrFn === 'function' ? valOrFn(copy[activeTab].discount) : valOrFn;
      copy[activeTab] = { ...copy[activeTab], discount: newVal };
      return copy;
    });
  };

  const setSalesStaffId = (valOrFn) => {
    setCartSessions(prev => {
      const copy = [...prev];
      const newVal = typeof valOrFn === 'function' ? valOrFn(copy[activeTab].salesStaffId) : valOrFn;
      copy[activeTab] = { ...copy[activeTab], salesStaffId: newVal };
      return copy;
    });
  };

  const setPaymentMethod = (valOrFn) => {
    setCartSessions(prev => {
      const copy = [...prev];
      const newVal = typeof valOrFn === 'function' ? valOrFn(copy[activeTab].paymentMethod) : valOrFn;
      copy[activeTab] = { ...copy[activeTab], paymentMethod: newVal };
      return copy;
    });
  };

  const setActiveCoupon = (valOrFn) => {
    setCartSessions(prev => {
      const copy = [...prev];
      const newVal = typeof valOrFn === 'function' ? valOrFn(copy[activeTab].activeCoupon) : valOrFn;
      copy[activeTab] = { ...copy[activeTab], activeCoupon: newVal };
      return copy;
    });
  };

  const [completedBill, setCompletedBill] = useState(() => {
    const saved = localStorage.getItem('pos_completed_bill');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return null;
  });
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [heldBills, setHeldBills] = useState([]);
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState({ cash: '', upi: '' });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemDetails, setCustomItemDetails] = useState({ name: '', price: '' });
  const [editingBillId, setEditingBillId] = useState(null);
  const [selectedComboItems, setSelectedComboItems] = useState({}); // { slotId: { product, variant } }

  // ─── IndexedDB Hydration ───────────
  useEffect(() => {
    const loadFromDB = async () => {
      const savedSessions = await dbService.get('posState', 'cartSessions');
      if (savedSessions) setCartSessions(savedSessions);
      
      const savedActiveTab = await dbService.get('posState', 'activeTab');
      if (savedActiveTab !== undefined) setActiveTab(savedActiveTab);
      
      const savedHeldBills = await dbService.getAll('heldBills');
      if (savedHeldBills) setHeldBills(savedHeldBills);

      const savedEditingId = await dbService.get('posState', 'editingBillId');
      if (savedEditingId) setEditingBillId(savedEditingId);
    };
    loadFromDB();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // ─── REAL-TIME SYNC ENGINE (Socket.io) ───────────
    const socket = adminService.getSocket?.() || null;
    if (socket) {
       const handleSync = () => {
          queryClient.invalidateQueries({ queryKey: ['pos-products'] });
          queryClient.invalidateQueries({ queryKey: ['pos-categories'] });
          queryClient.invalidateQueries({ queryKey: ['staff-session-stats'] });
       };
       socket.on('STOCK_UPDATED', handleSync);
       socket.on('INVENTORY_SYNCED', handleSync);
       socket.on('PRODUCT_CREATED', handleSync);
       socket.on('PRODUCT_ARCHIVED', handleSync);
       socket.on('PRODUCT_PURGED', handleSync);
       
       return () => {
          clearInterval(timer);
          socket.off('STOCK_UPDATED', handleSync);
          socket.off('INVENTORY_SYNCED', handleSync);
          socket.off('PRODUCT_CREATED', handleSync);
          socket.off('PRODUCT_ARCHIVED', handleSync);
          socket.off('PRODUCT_PURGED', handleSync);
       };
    }

    return () => clearInterval(timer);
  }, [queryClient]);

  // ─── Data Queries (must be declared before the useEffects that depend on them) ───
  const { data: categories } = useQuery({
    queryKey: ['pos-categories'],
    queryFn: () => categoryService.getCategories().then(r => r.data.data?.categories || r.data.data || []),
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['pos-products', selectedCategory, search],
    queryFn: () => {
      const params = { limit: 50, isPOS: 'true' };
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (search) params.search = search;
      return productService.getProducts(params).then(r => r.data.data?.data || r.data.data?.products || r.data.data || []);
    },
    placeholderData: (prev) => prev,
  });

  // ─── STALE CACHE HYGIENE (SaaS Audit Fix) ───────────
  useEffect(() => {
    // If we have products (system is alive) but no categories OR 
    // if categories/products are fetched and found to be completely empty after a previous session had data
    if (categories?.length === 0 && productsData?.length === 0 && cartSessions.some(s => s.items.length > 0)) {
      console.log('POS: System reset detected. Clearing stale session cache.');
      const emptySessions = [
        { items: [], customer: { name: '', phone: '', email: '' }, discount: 0, salesStaffId: '', paymentMethod: 'cash', activeCoupon: '' },
        { items: [], customer: { name: '', phone: '', email: '' }, discount: 0, salesStaffId: '', paymentMethod: 'cash', activeCoupon: '' },
        { items: [], customer: { name: '', phone: '', email: '' }, discount: 0, salesStaffId: '', paymentMethod: 'cash', activeCoupon: '' },
      ];
      setCartSessions(emptySessions);
      localStorage.setItem('pos_cart_sessions', JSON.stringify(emptySessions));
      setHeldBills([]);
      localStorage.removeItem('magizhchi_held_bills');
    }
  }, [categories, productsData]);

  useEffect(() => {
    dbService.put('posState', { id: 'activeTab', value: activeTab });
  }, [activeTab]);

  useEffect(() => {
    dbService.put('posState', { id: 'cartSessions', value: cartSessions });
    localStorage.setItem('pos_cart_sessions', JSON.stringify(cartSessions));
    // Instantly sync across tabs
    const channel = new BroadcastChannel('magizhchi_pos_sync');
    channel.postMessage({ type: 'SYNC_CART', payload: cartSessions });
    channel.close();
  }, [cartSessions]);

  useEffect(() => {
    const channel = new BroadcastChannel('magizhchi_pos_sync');
    channel.onmessage = (e) => {
      if (e.data.type === 'SYNC_CART') {
        setCartSessions(e.data.payload);
      }
    };
    return () => channel.close();
  }, []);

  useEffect(() => {
    if (editingBillId) {
      dbService.put('posState', { id: 'editingBillId', value: editingBillId });
    } else {
      dbService.delete('posState', 'editingBillId');
    }
  }, [editingBillId]);

  const searchInputRef = useRef(null);
  const debounceTimer = useRef(null);

  // ─── DEFENSIVE CATEGORY SYNC (SaaS Audit Fix) ──────
  useEffect(() => {
    if (categories && selectedCategory !== 'All') {
      const exists = categories.some(c => c.slug === selectedCategory || c._id === selectedCategory);
      if (!exists) {
        console.log('POS: Selected category not found in current catalog. Resetting to All.');
        setSelectedCategory('All');
      }
    }
  }, [categories, selectedCategory]);

  const { data: staffList } = useQuery({
    queryKey: ['pos-staff-list'],
    queryFn: () => adminService.getPosStaff().then(r => r.data.data || []),
  });


  const { data: sessionStats, refetch: refetchStats } = useQuery({
    queryKey: ['staff-session-stats'],
    queryFn: () => billService.getStaffStats().then(r => r.data.data),
    refetchInterval: 60000, // Refresh every minute
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
    // SaaS flexibility: allow adding to cart even if stock is 0 (negative billing allowed)
    // if (variant.stock <= 0) return toast.error('Out of stock');
    
    const key = `${product._id}-${variant.size}-${variant.color}`;
    setItems(prev => {
      const existing = prev.find(i => i.key === key);
      if (existing) {
        // SaaS flexibility: remove maxStock constraint
        // if (existing.quantity >= variant.stock) {
        //   toast.error('Insufficient stock');
        //   return prev;
        // }
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

  const addCustomService = (serviceName, price) => {
    const key = `service-${serviceName.toLowerCase().replace(/\s+/g, '-')}`;
    setItems(prev => {
      const existing = prev.find(i => i.key === key);
      if (existing) {
        return prev.map(i => i.key === key ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        key,
        productId: null,
        productName: serviceName,
        sku: 'SERVICE',
        size: 'N/A',
        color: 'Bespoke',
        price,
        mrp: price,
        quantity: 1,
        image: null,
        maxStock: 999,
        gstPercentage: 5,
        isService: true
      }];
    });
    toast.success(`${serviceName} applied to cart!`, { position: 'bottom-center' });
  };

  const applyPromoCode = (code, val, type) => {
    let amt = 0;
    if (type === 'percent') {
      amt = Math.round(subtotal * (val / 100));
    } else {
      amt = val;
    }
    setDiscount(Math.min(subtotal, amt));
    setActiveCoupon(code);
    toast.success(`Coupon ${code} activated! (Saved ₹${amt})`, { position: 'bottom-center' });
  };

  const handleProductClick = (product) => {
    if (product.productNature !== 'combo' && (!product.variants || product.variants.length === 0)) {
      // Fallback: allow billing even if variants are not fully set up
      addToCart(product, { size: 'N/A', color: 'Default', stock: 9999 });
      return;
    }
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
      // Removed maxStock check for flexibility
      // if (newQty > i.maxStock) {
      //   toast.error('Insufficient stock');
      //   return i;
      // }
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

  const holdBill = async () => {
    if (items.length === 0) return toast.error('Cart is empty');
    const newHold = { id: Date.now(), customer, items, discount, timestamp: new Date() };
    await dbService.put('heldBills', newHold);
    setHeldBills(prev => [...prev, newHold]);
    setItems([]);
    setCustomer({ name: '', phone: '', email: '' });
    setDiscount(0);
    toast.success('Bill parked successfully');
  };

  const resumeBill = async (id) => {
    if (items.length > 0) return toast.error('Please clear or hold current bill first');
    const bill = heldBills.find(b => b.id === id);
    if (!bill) return;
    setItems(bill.items);
    setCustomer(bill.customer);
    setDiscount(bill.discount || 0);
    setSalesStaffId(bill.salesStaffId || '');
    await dbService.delete('heldBills', id);
    setHeldBills(prev => prev.filter(b => b.id !== id));
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
  
  // DEFENSIVE CALCULATIONS (Fix for negative totals)
  const safeSubtotal = Math.max(0, subtotal);
  const safeDiscount = Math.max(0, Math.min(safeSubtotal, discount));
  const total = Math.max(0, safeSubtotal - safeDiscount);

  // ─── Mutation ────────────────────────────────────────
  const createBillMutation = useMutation({
    queryKey: ['create-bill'],
    mutationFn: (data) => billService.createBill(data),
    onSuccess: (r) => {
      setCompletedBill(r.data.data.bill);
      setIsCheckoutOpen(false);
      setItems([]);
      setCustomer({ name: '', phone: '', email: '' });
      setDiscount(0);
      setSplitAmounts({ cash: '', upi: '' });
      setSalesStaffId('');
      refetchStats(); // Update real-time session total
      toast.success('Transaction Completed!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Transaction failed'),
  });

  const updateBillMutation = useMutation({
    mutationFn: ({ id, data }) => billService.updateBill(id, data),
    onSuccess: (r) => {
      setCompletedBill(r.data.data.bill);
      setIsCheckoutOpen(false);
      setItems([]);
      setCustomer({ name: '', phone: '', email: '' });
      setDiscount(0);
      setSplitAmounts({ cash: '', upi: '' });
      setSalesStaffId('');
      setEditingBillId(null);
      refetchStats(); // Update real-time session total
      toast.success('Invoice Revised Successfully!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Revision failed'),
  });

  const handleEditBill = async () => {
    if (!completedBill) return;
    
    setLoadingCustomer(true); // Re-use loader for transition
    try {
      const cartItems = await Promise.all(completedBill.items.map(async (item) => {
        const sizeVal = item.variant?.size || item.size || 'Free Size';
        const colorVal = item.variant?.color || item.color || 'Default';
        
        // Fetch current stock for this variant to prevent over-selling during edit
        let currentStock = 9999;
        try {
          const invRes = await inventoryService.getInventory({ 
            search: item.productName, 
            size: sizeVal, 
            color: colorVal 
          });
          const invData = invRes.data.data?.inventory || invRes.data.data || [];
          const match = invData.find(i => i.size === sizeVal && i.color === colorVal);
          if (match) {
            // Enterprise Calculation: (Raw Total - All Sales/Reserves) + The quantity from the bill being edited
            currentStock = (match.availableStock || 0) + item.quantity;
          }
        } catch (e) {
          console.error('Stock fetch failed for edit:', e);
        }

        return {
          key: `${item.productId?._id || 'manual'}-${sizeVal}-${colorVal}`,
          productId: item.productId?._id || null,
          productName: item.productName,
          sku: item.sku || 'MANUAL',
          size: sizeVal,
          color: colorVal,
          price: item.price,
          mrp: item.price,
          quantity: item.quantity,
          image: item.productId?.images?.[0] ? resolveAssetURL(item.productId.images[0]) : null,
          maxStock: currentStock,
          gstPercentage: item.gstPercentage || 5
        };
      }));

      setEditingBillId(completedBill._id);
      setItems(cartItems);
      setCustomer(completedBill.customerDetails || { name: '', phone: '', email: '' });
      setDiscount(completedBill.pricing?.discount || 0);
      setSalesStaffId(completedBill.salesStaffId || '');
      setPaymentMethod(completedBill.paymentMethod || 'cash');
      setCompletedBill(null);
      toast.success('Invoice loaded into editor! Stock limits applied.', { icon: '✍️' });
    } catch (err) {
      toast.error('Failed to initialize editor');
    } finally {
      setLoadingCustomer(false);
    }
  };

  const { data: healthData } = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => adminService.getHealth().then(r => r.data),
    refetchInterval: 30000,
    enabled: !!user,
  });
  const health = healthData?.data;

  const deleteBillMutation = useMutation({
    mutationFn: ({ id, reason }) => billService.deleteBill(id, reason),
    onSuccess: () => {
      setCompletedBill(null);
      toast.success('Bill voided and stock restored');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Void failed'),
  });

  const resendBillReceiptMutation = useMutation({
    mutationFn: (id) => billService.resendReceipt(id),
    onSuccess: (r) => {
      const { whatsapp, email } = r.data.data || {};
      if (email) toast.success('Receipt sent via Email');
      else if (whatsapp) toast.success('Receipt sent via WhatsApp');
      else toast.success('Receipt resent');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Resend failed'),
  });

  const handleCheckout = () => {
    if (!customer.name || !customer.phone) {
      return toast.error('Customer Name and Phone (10-digit) are required for receipts');
    }
    if (customer.phone.length !== 10) {
      return toast.error('Phone number must be exactly 10 digits');
    }

    if (paymentMethod === 'split') {
      const cash = Number(splitAmounts.cash) || 0;
      const upi = Number(splitAmounts.upi) || 0;
      if (cash + upi !== total) {
        return toast.error(`Split amounts (₹${cash + upi}) must equal Total (₹${total})`);
      }
    }

    const payload = {
      items: items.map(i => {
        // Ensure productId is only sent if it's a valid MongoDB ObjectId (not a name string for unlinked items)
        const isValidId = i.productId && i.productId.length === 24 && /^[0-9a-fA-F]+$/.test(i.productId);
        return {
          productId: isValidId ? i.productId : undefined,
          productName: i.productName,
          size: i.size,
          color: i.color,
          price: i.price,
          quantity: i.quantity,
          total: i.price * i.quantity,
          comboSelections: i.comboSelections
        };
      }),
      customerDetails: customer,
      paymentMethod,
      paymentDetails: paymentMethod === 'split' ? { cashAmount: Number(splitAmounts.cash), upiAmount: Number(splitAmounts.upi) } : {},
      discount,
      salesStaffId: salesStaffId || undefined,
      notes: editingBillId ? `POS Sale Revised (Original ID: ${editingBillId})` : `POS Sale by ${user?.name}`,
      idempotencyKey: crypto.randomUUID ? crypto.randomUUID() : `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    if (editingBillId) {
      updateBillMutation.mutate({ id: editingBillId, data: payload });
    } else {
      createBillMutation.mutate(payload);
    }
  };

  // ─── Render: Locked POS Tab ────────────────────────────
  if (isLocked) {
    return (
      <div className="fixed inset-0 bg-charcoal z-[999] flex flex-col items-center justify-center p-4 sm:p-6 text-center">
        <Helmet><title>POS Locked — Magizhchi</title></Helmet>
        <div className="bg-red-500/10 border border-red-500/30 p-4 md:p-8 rounded-3xl max-w-lg shadow-2xl backdrop-blur-xl">
          <Shield size={64} className="text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-4">POS Terminal Locked</h1>
          <p className="text-red-200/80 font-medium mb-8 leading-relaxed">
            The Point of Sale terminal is already active in another browser tab. To prevent database corruption and critical inventory desynchronization, multiple active checkout tabs are not allowed.
          </p>
          <button onClick={() => window.close()} className="px-4 md:px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl">
            Close This Tab
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: Receipt ─────────────────────────────────
  if (completedBill) {
    return (
      <div className="min-h-dvh bg-[#F9F9FA] py-12 px-4 flex flex-col items-center select-none relative overflow-hidden">
        <Helmet><title>Tax Invoice #{completedBill.billNumber} — Magizhchi</title></Helmet>

        {/* Backdrop Decorative Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-premium-gold/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[35%] h-[35%] rounded-full bg-charcoal/5 blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.06)] overflow-hidden border border-border-light relative"
          id="bill-print"
        >
          {/* Header Section: Luxury Branding */}
          <div className="bg-charcoal p-5 md:p-10 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_var(--premium-gold)_0%,_transparent_70%)]" />
            
            {/* Elegant Logo Emblem */}
            <div className="w-14 h-14 bg-premium-gold rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-premium-gold/15 border border-white/10 relative">
              <Sparkles className="text-charcoal" size={24} />
            </div>
            
            <h2 className="font-sans text-3xl font-black tracking-[0.3em] mb-1.5 uppercase">MAGIZHCHI</h2>
            <p className="text-[8px] text-premium-gold font-black tracking-[0.5em] uppercase mb-6">INTELLIGENT FASHION SUITE</p>
            
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/[0.04] border border-white/10 rounded-full">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Tax Invoice No.</span>
              <span className="text-xs font-black text-premium-gold">#{completedBill.billNumber}</span>
            </div>

            {completedBill.status === 'voided' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[35deg] pointer-events-none opacity-20 z-50">
                <div className="border-[12px] border-red-500 text-red-500 px-12 py-4 sm:py-6 rounded-3xl font-black text-8xl uppercase tracking-[0.2em] whitespace-nowrap">
                  VOIDED
                </div>
              </div>
            )}
            
            {completedBill.status === 'voided' && (
              <div className="mt-6 flex justify-center">
                <div className="bg-red-500 text-white px-4 sm:px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 shadow-lg shadow-red-500/20">
                   <X size={14} /> Transaction Voided / Stock Reverted
                </div>
              </div>
            )}
            
            <div className="mt-8 grid grid-cols-2 gap-4 text-left border-t border-white/5 pt-6 text-[10px]">
              <div>
                <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-1">Settlement Date</p>
                <p className="font-bold text-white/80">{new Date(completedBill.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
              <div className="text-right">
                <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-1">Billing Counter</p>
                <p className="font-bold text-white/80">{user?.name || 'Authorized Terminal'}</p>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-8 space-y-8">
            {/* Customer Information Card */}
            {completedBill.customerDetails?.name && (
              <div className="p-4 bg-light-bg/50 rounded-2xl border border-border-light/60 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Registered Patron</p>
                  <p className="text-sm font-black text-charcoal">{completedBill.customerDetails.name}</p>
                  <p className="text-[10px] text-text-muted font-bold mt-0.5">{completedBill.customerDetails.phone}</p>
                </div>
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-border-light/60 text-premium-gold">
                  <User size={18} />
                </div>
              </div>
            )}

            {/* Purchase Item List Summary */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1.5">
                <h3 className="text-[8px] font-black text-text-muted uppercase tracking-[0.3em]">Purchase Summary</h3>
                <span className="text-[8px] font-black text-premium-gold uppercase tracking-[0.15em]">{completedBill.items?.length} Items Listed</span>
              </div>
              
              <div className="space-y-3.5">
                {completedBill.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border-light last:border-0 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-light-bg rounded-lg overflow-hidden border border-border-light group-hover:scale-105 transition-transform">
                        <SafeImage src={item.productId?.images?.[0]} width={200} quality={70} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-charcoal tracking-tight">{item.productName}</p>
                        {!item.comboSelections || item.comboSelections.length === 0 ? (
                          <p className="text-[8px] text-text-muted uppercase font-black tracking-widest mt-0.5">
                            {item.size} / {item.color} • ₹{item.price.toLocaleString()}
                          </p>
                        ) : (
                          <div className="mt-1 space-y-0.5">
                            {item.comboSelections.map((sel, idx) => (
                              <p key={idx} className="text-[7px] font-black text-text-muted uppercase tracking-wider">
                                • {sel.productName}: {sel.size} / {sel.color}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-text-muted uppercase mb-0.5">Qty {item.quantity}</p>
                      <p className="text-xs font-black text-charcoal">₹{item.total.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settlement Totals Section */}
            <div className="bg-charcoal p-7 rounded-2xl text-white relative overflow-hidden border border-white/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-premium-gold/5 rounded-bl-full pointer-events-none" />
              <div className="space-y-2 relative z-10 text-[10px]">
                <div className="flex justify-between text-white/30 font-black uppercase tracking-widest">
                  <span>Gross Value</span><span>₹{completedBill.pricing?.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white/30 font-black uppercase tracking-widest">
                  <span>SGST & CGST (5%)</span><span>₹{completedBill.pricing?.gstAmount.toLocaleString()}</span>
                </div>
                {completedBill.pricing?.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-black uppercase tracking-widest">
                    <span>Loyalty Benefit Applied</span><span>−₹{completedBill.pricing.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-4 mt-2 border-t border-white/5 flex justify-between items-end">
                  <div>
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.25em] mb-1">Final Settlement Amount</p>
                    <p className="text-2xl font-black text-premium-gold tracking-tight">₹{completedBill.pricing?.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.25em] mb-1">Payment gateway</p>
                    <p className="text-xs font-black uppercase tracking-widest text-premium-gold">{completedBill.paymentMethod}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature & Disclaimer Footer */}
            <div className="text-center space-y-4 pt-2">
              <div className="flex items-center justify-center gap-3">
                <div className="h-px flex-1 bg-border-light/60" />
                <Sparkles size={12} className="text-premium-gold/40" />
                <div className="h-px flex-1 bg-border-light/60" />
              </div>
              <p className="text-[8px] text-text-muted leading-relaxed max-w-xs mx-auto italic">
                Thank you for choosing Magizhchi Garments. For exchange requests, kindly present this tax invoice within 7 business days.
              </p>
              <div className="flex justify-center gap-6 text-[9px] font-bold">
                <div className="text-center">
                  <p className="text-[7px] font-black text-text-muted uppercase tracking-widest mb-0.5">Online Suite</p>
                  <p className="text-charcoal">magizhchi.com</p>
                </div>
                <div className="text-center">
                  <p className="text-[7px] font-black text-text-muted uppercase tracking-widest mb-0.5">Assistance Line</p>
                  <p className="text-charcoal">+91 98765 43210</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SaaS Share & Export Panel Hub */}
        <div className="w-full max-w-2xl mt-8 no-print space-y-5">
          <div className="flex items-center justify-center gap-3 p-1.5 bg-light-bg border border-border-light shadow-inner max-w-xs mx-auto rounded-xl">
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-border-light shadow-sm">
                <div className={`w-1.5 h-1.5 rounded-full ${health?.whatsapp?.ready ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[7px] font-black uppercase tracking-widest text-charcoal">Whatsapp Link: {health?.whatsapp?.ready ? 'Connected' : 'Offline'}</span>
             </div>
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-border-light shadow-sm">
                <div className={`w-1.5 h-1.5 rounded-full ${health?.email?.ready ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[7px] font-black uppercase tracking-widest text-charcoal">SMTP: {health?.email?.ready ? 'Active' : 'Offline'}</span>
             </div>
          </div>
          
          {/* Quick Action Matrix Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button 
              onClick={() => {
                const text = `Hi ${completedBill.customerDetails?.name}, your invoice #${completedBill.billNumber} from Magizhchi Garments is ready: ₹${completedBill.pricing?.totalAmount}. Thank you for shopping with us!`;
                window.open(`https://wa.me/91${completedBill.customerDetails?.phone}?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="flex flex-col items-center gap-2 p-5 bg-white rounded-2xl border border-border-light hover:border-premium-gold hover:shadow-lg hover:shadow-premium-gold/5 transition-all group shadow-sm text-left relative"
            >
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-100">
                <Smartphone size={18} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-charcoal mt-1">Send WhatsApp</span>
            </button>

            <button 
              onClick={() => {
                if (!completedBill.customerDetails?.email) return toast.error('No email address provided for this customer');
                resendBillReceiptMutation.mutate(completedBill._id);
              }}
              disabled={resendBillReceiptMutation.isPending}
              className="flex flex-col items-center gap-2 p-5 bg-white rounded-2xl border border-border-light hover:border-premium-gold hover:shadow-lg hover:shadow-premium-gold/5 transition-all group shadow-sm text-left relative disabled:opacity-40"
            >
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform border border-blue-100">
                {resendBillReceiptMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-charcoal mt-1">Email Receipt</span>
            </button>

            <button onClick={() => window.print()} className="flex flex-col items-center gap-2 p-5 bg-white rounded-2xl border border-border-light hover:border-premium-gold hover:shadow-lg hover:shadow-premium-gold/5 transition-all group shadow-sm text-left relative">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform border border-orange-100">
                <Printer size={18} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-charcoal mt-1">Print Document</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-5 bg-white rounded-2xl border border-border-light hover:border-premium-gold hover:shadow-lg hover:shadow-premium-gold/5 transition-all group shadow-sm text-left relative">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform border border-purple-100">
                <CheckCircle2 size={18} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-charcoal mt-1">Synergy Cloud Backup</span>
            </button>
          </div>
        </div>

        {/* Back navigation */}
        <div className="flex flex-col md:flex-row gap-4 mt-6 w-full max-w-2xl no-print">
          <button 
            onClick={handleEditBill} 
            disabled={completedBill.status === 'voided'}
            className="flex-1 bg-white border-2 border-charcoal/80 text-charcoal py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.15em] hover:bg-light-bg hover:scale-[1.01] transition-all shadow-lg disabled:opacity-50 disabled:grayscale"
          >
            <Edit size={16} className={`text-premium-gold ${completedBill.status === 'voided' ? '' : 'animate-pulse'}`} /> {completedBill.status === 'voided' ? 'Cannot Edit Voided' : 'Modify / Edit Invoice'}
          </button>
          <button 
            onClick={() => {
              const reason = window.prompt(`Void Bill #${completedBill.billNumber}?\n\nEnter reason (e.g. Return, Wrong Bill):`);
              if (reason === null) return;
              if (!reason.trim()) return toast.error('Reason is required');
              if (window.confirm('Void this bill and restore stock?')) {
                deleteBillMutation.mutate({ id: completedBill._id, reason });
              }
            }} 
            disabled={deleteBillMutation.isPending || completedBill.status === 'voided'}
            className="flex-1 bg-red-50 text-red-600 border-2 border-red-200 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.15em] hover:bg-red-100 transition-all shadow-lg disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
          >
            {deleteBillMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : (completedBill.status === 'voided' ? <CheckCircle2 size={16} /> : <Trash2 size={16} />)} {completedBill.status === 'voided' ? 'VOIDED' : 'Delete Invoice'}
          </button>
          <button 
            onClick={() => setCompletedBill(null)} 
            className="flex-1 bg-charcoal text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.15em] hover:bg-black hover:scale-[1.01] transition-all shadow-xl shadow-charcoal/10"
          >
            <Plus size={16} className="text-premium-gold" /> Compose Another Bill
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: POS ─────────────────────────────────────
  return (
    <div className="h-[100dvh] bg-[#F9F9FA] flex flex-col lg:overflow-hidden overflow-auto p-4 lg:p-4 sm:p-6 pb-36 lg:pb-6 gap-6 relative select-none">
      <Helmet><title>Magizhchi POS Pro — Intelligent Billing Suite</title></Helmet>
      
      {/* Dynamic Aesthetic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-premium-gold/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-400/5 blur-[120px] pointer-events-none" />

      {/* ─── Immersive Top Bar: Ultimate SaaS Style ─── */}
      <div className="flex items-center justify-between bg-white/75 backdrop-blur-md px-4 md:px-8 py-5 rounded-[2rem] shadow-[0_15px_50px_rgba(0,0,0,0.02)] border border-white shrink-0 relative z-10">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-charcoal rounded-2xl flex items-center justify-center shadow-lg shadow-charcoal/10 border border-white/10 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-premium-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="text-premium-gold group-hover:scale-110 transition-transform" size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-charcoal tracking-tight leading-none">Magizhchi POS</h1>
              <span className="px-2.5 py-0.5 bg-premium-gold/10 text-premium-gold text-[8px] font-black uppercase tracking-widest rounded-full border border-premium-gold/20">PRO CLIENT</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-text-muted font-black uppercase tracking-widest mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Operator: {user?.name}</span>
              <span className="text-border-dark">•</span>
              <span className="text-charcoal/80 font-bold tracking-normal text-xs ml-1">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8">
          <div className="flex items-center gap-8 border-x border-border-light px-4 md:px-8">
            {/* Live Progress Tracker */}
            <div className="text-left group cursor-pointer">
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                Daily Sales Target <span className="text-premium-gold font-black">65%</span>
              </p>
              <div className="w-32 h-1.5 bg-light-bg rounded-full overflow-hidden relative border border-border-light shadow-inner">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-premium-gold to-amber-500 w-[65%] rounded-full shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
              </div>
            </div>

            {/* Sales Stats Summary (REAL TIME) */}
            <div className="text-left">
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-0.5">Session Total</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-black text-charcoal tracking-tight">₹{(sessionStats?.sessionTotal || 0).toLocaleString()}</p>
                <div className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 size={10} />
                </div>
              </div>
            </div>

            {/* Parked Sales Counter (Pulsing if active) */}
            <div 
              onClick={() => setShowHeldBills(true)}
              className="text-left group cursor-pointer relative"
            >
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-0.5 group-hover:text-premium-gold transition-colors">Parked Sales</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-black text-charcoal tracking-tight">{heldBills.length}</p>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${heldBills.length > 0 ? 'bg-orange-500 text-white animate-bounce shadow-md shadow-orange-500/20' : 'bg-light-bg border border-border-light text-text-muted'}`}>
                  <History size={10} />
                </div>
              </div>
            </div>
          </div>

          {/* Shortcut Keys HUD */}
          <div className="flex items-center gap-3 bg-light-bg/50 px-4 py-2 rounded-xl border border-border-light/60">
            {SHORTCUTS.map(s => (
              <div key={s.key} className="flex items-center gap-1.5 border-r border-border-light last:border-0 pr-3 last:pr-0">
                <kbd className="bg-white border border-border-light px-1.5 py-0.5 rounded-md text-[8px] font-black text-charcoal shadow-sm min-w-[20px] text-center">{s.key}</kbd>
                <span className="text-[7px] font-black text-text-muted uppercase tracking-tight">{s.action.split(' ')[1] || s.action}</span>
              </div>
            ))}
            <button 
              onClick={() => setShowShortcutsHelp(true)}
              className="ml-2 w-5 h-5 bg-premium-gold/10 hover:bg-premium-gold hover:text-charcoal text-premium-gold rounded-full flex items-center justify-center font-black text-[10px] shadow-sm transition-all border border-premium-gold/20"
              title="Open Platform Guide"
            >
              ?
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main Content Workspace ─── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 lg:overflow-hidden overflow-visible relative z-10">
        
        {/* ─── Left Panel: Catalog Master (65%) ─── */}
        <div className="flex-1 flex flex-col gap-5 min-h-[500px] lg:min-h-0 bg-white rounded-[2rem] border border-border-light/50 p-4 lg:p-4 sm:p-6 shadow-sm lg:overflow-hidden">
          
          {/* Header Actions */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
            {/* Elegant Input Search with floating style */}
            <div className="relative w-full md:max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-premium-gold transition-colors" size={16} />
              <input
                ref={searchInputRef}
                className="w-full bg-light-bg border border-border-light rounded-2xl pl-11 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-premium-gold/20 focus:border-premium-gold text-xs font-semibold transition-all shadow-inner"
                placeholder="Search products or scan barcode (F2)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {search ? (
                  <button onClick={() => setSearch('')} className="text-text-muted hover:text-text-primary transition-colors">
                    <X size={14} />
                  </button>
                ) : (
                  <span className="px-1.5 py-0.5 border border-border-light rounded text-[8px] font-black text-text-muted uppercase bg-white">F2</span>
                )}
              </div>
            </div>

            {/* Grid/List Toggle & Categories Pills */}
            <div className="flex items-center gap-3 max-w-full">
              {/* View Toggle */}
              <div className="bg-light-bg border border-border-light/60 p-1 rounded-xl flex items-center gap-1 shrink-0 shadow-inner">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-charcoal shadow-sm' : 'text-text-muted hover:text-charcoal'}`}
                  title="Grid View [F4]"
                >
                  <LayoutGrid size={14} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-charcoal shadow-sm' : 'text-text-muted hover:text-charcoal'}`}
                  title="List View [F4]"
                >
                  <ListFilter size={14} />
                </button>
              </div>

              {/* Dynamic Categories Scroll */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 max-w-[320px] md:max-w-[400px] no-scrollbar">
                <button 
                  onClick={() => setSelectedCategory('All')}
                  className={`h-12 px-4 sm:px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${selectedCategory === 'All' ? 'bg-charcoal text-white border-charcoal shadow-lg shadow-charcoal/5' : 'bg-light-bg text-text-muted border-border-light hover:bg-white hover:border-text-muted/30'}`}
                >
                  All
                </button>
                {categories?.map(cat => (
                  <button 
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`h-12 px-4 sm:px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${selectedCategory === cat.slug ? 'bg-charcoal text-white border-charcoal shadow-lg shadow-charcoal/5' : 'bg-light-bg text-text-muted border-border-light hover:bg-white hover:border-text-muted/30'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Grid / List container */}
          <div className="flex-1 overflow-y-auto no-scrollbar pt-1 pr-1">
            {isLoadingProducts ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 opacity-60">
                <Loader2 className="animate-spin text-premium-gold" size={32} />
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Synergy Catalog Syncing...</span>
              </div>
            ) : productsData?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-40">
                <div className="w-16 h-16 rounded-full bg-light-bg flex items-center justify-center border border-border-light mb-4">
                  <Package size={28} />
                </div>
                <p className="font-bold text-xs uppercase tracking-widest">No matching assets found</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {productsData.map(product => {
                  const hasStockAlert = product.variants?.some(v => v.stock > 0 && v.stock < 5);
                  const isOutOfStock = product.variants?.every(v => v.stock <= 0);
                  
                  return (
                    <div 
                      key={product._id} 
                      onClick={() => handleProductClick(product)} 
                      className="bg-white rounded-[1.5rem] border border-border-light/60 overflow-hidden group hover:border-premium-gold hover:shadow-xl hover:shadow-premium-gold/5 transition-all duration-300 cursor-pointer flex flex-col h-full relative"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden bg-[#F5F5F7] shrink-0">
                        <SafeImage 
                          src={getValidImage(product.laptopImage, product.mobileImage, product.thumbnail, product.images?.[0], product.variants?.[0]?.laptopImage, product.variants?.[0]?.images?.[0])} 
                          width={200} quality={70}
                          alt="" 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        
                        {/* Elegant overlay indicators */}
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                          {isOutOfStock ? (
                            <div className="bg-charcoal text-white text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-md">Sold Out</div>
                          ) : hasStockAlert ? (
                            <div className="bg-red-500 text-white text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-md animate-pulse">Low Stock</div>
                          ) : null}
                        </div>
                        
                        <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm text-[7px] font-black px-2 py-1 rounded border border-border-light shadow-sm text-charcoal uppercase tracking-wider z-10">
                          {product.sku?.split('-')[0] || 'ASSET'}
                        </div>

                        {/* Hover Overlay action */}
                        <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                          <div className="bg-white text-charcoal px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 transform translate-y-3 group-hover:translate-y-0 transition-all shadow-xl">
                            <Plus size={12} className="text-premium-gold" /> Add To Bill
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 flex-1 flex flex-col justify-between bg-white relative z-10">
                        <div>
                          <h3 className="text-xs font-black text-charcoal line-clamp-1 leading-tight group-hover:text-premium-gold transition-colors">{product.name}</h3>
                          <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mt-1">
                            {product.availableStock || 0} Pcs • {product.variants?.length || 0} Options
                          </p>
                        </div>
                        
                        <div className="mt-3 pt-2.5 border-t border-border-light/60 flex items-end justify-between">
                          <span className="text-[10px] font-bold text-text-muted line-through">₹{product.sellingPrice}</span>
                          <span className="text-sm font-black text-charcoal">
                            ₹{product.discountedPrice || product.sellingPrice}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // List View Mode
              <div className="flex flex-col gap-2.5">
                {productsData.map(product => {
                  const isOutOfStock = product.variants?.every(v => v.stock <= 0);
                  return (
                    <div 
                      key={product._id} 
                      onClick={() => handleProductClick(product)} 
                      className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-border-light/50 hover:border-premium-gold hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-14 rounded-xl overflow-hidden shrink-0 border border-border-light/50 bg-[#F5F5F7] relative">
                        <SafeImage src={getValidImage(product.laptopImage, product.mobileImage, product.thumbnail, product.images?.[0], product.variants?.[0]?.laptopImage, product.variants?.[0]?.images?.[0])} width={200} quality={70} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        {isOutOfStock && <div className="absolute inset-0 bg-charcoal/60 flex items-center justify-center"><span className="text-[6px] font-black text-white uppercase tracking-widest">OUT</span></div>}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h3 className="text-xs font-black text-charcoal truncate group-hover:text-premium-gold transition-colors">{product.name}</h3>
                        <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mt-1">
                          SKU: {product.sku} • {product.availableStock || 0} Pcs • {product.variants?.length} Variants
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] font-bold text-text-muted line-through">₹{product.sellingPrice}</span>
                        <span className="block text-sm font-black text-charcoal leading-none mt-1">₹{product.discountedPrice || product.sellingPrice}</span>
                      </div>
                      <div onClick={(e) => { e.stopPropagation(); handleProductClick(product); }} className="w-8 h-8 bg-light-bg rounded-xl flex items-center justify-center text-text-muted group-hover:bg-premium-gold group-hover:text-charcoal group-hover:shadow-lg group-hover:shadow-premium-gold/20 transition-all shrink-0 ml-2 border border-border-light/60 cursor-pointer">
                        <Plus size={14} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Smart Recommendations Removed */}
        </div>

        {/* ─── Right Panel: Fine SaaS Cart Sidebar (35%) ─── */}
        <div className="w-[360px] xl:w-[400px] flex flex-col bg-[#FAF9F6] rounded-[2rem] overflow-hidden shadow-2xl shrink-0 border border-[#ECEAE2] relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
          
          {/* Cart Title Header */}
          <div className="p-5 bg-[#F5F3EB] border-b border-[#ECEAE2] flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-premium-gold rounded-xl flex items-center justify-center shadow-lg shadow-premium-gold/15">
                <ShoppingCart className="text-charcoal" size={18} />
              </div>
              <div>
                <span className="font-black text-charcoal text-sm tracking-tight">Active Bill Invoice</span>
                <p className="text-[7px] font-black text-[#8C6D1F] uppercase tracking-[0.2em] mt-1">Ready for Checkout</p>
              </div>
            </div>
            
            {/* Action Group */}
            <div className="flex gap-2">
              <button 
                onClick={holdBill} 
                disabled={items.length === 0}
                className="p-2 bg-[#EFECE3] text-charcoal/60 hover:text-amber-600 hover:bg-[#E5DFD0] rounded-xl transition-all border border-[#ECEAE2] disabled:opacity-20" 
                title="Hold / Park Current Bill"
              >
                <History size={14} />
              </button>
              <button 
                onClick={() => setItems([])} 
                disabled={items.length === 0}
                className="p-2 bg-[#EFECE3] text-charcoal/60 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-[#ECEAE2] disabled:opacity-20" 
                title="Wipe Cart Clean"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Multi-Session Cart Tab Switcher (SaaS Premium Model) */}
          <div className="px-5 py-2.5 bg-[#F3EFE6] border-b border-[#ECEAE2] flex gap-1.5 relative z-10 select-none">
            {cartSessions.map((sess, idx) => {
              const count = sess.items.reduce((acc, i) => acc + i.quantity, 0);
              const isSelected = activeTab === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${isSelected ? 'bg-premium-gold border-premium-gold text-charcoal shadow-lg shadow-premium-gold/15 scale-[1.02]' : 'bg-white/40 border-[#ECEAE2] text-charcoal/50 hover:text-charcoal hover:bg-white/70'}`}
                >
                  <span>Patron {idx + 1}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${isSelected ? 'bg-charcoal text-white' : 'bg-premium-gold text-charcoal'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Cart items space */}
          <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-3 relative z-10">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-charcoal/10 p-4 sm:p-6">
                <div className="w-14 h-14 border-2 border-dashed border-charcoal/15 rounded-2xl flex items-center justify-center mb-4 text-[#8C6D1F]/50">
                  <ShoppingCart size={20} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-charcoal/40 text-center">Cart is empty</p>
                <p className="text-[8px] font-black text-charcoal/30 mt-1 text-center max-w-[180px]">Add items from catalog to start composing invoice</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {items.map(item => (
                  <motion.div 
                    key={item.key}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    className="flex gap-3 bg-white p-3 rounded-2xl border border-[#EBE8DF] hover:bg-[#FDFDFB] hover:shadow-md hover:scale-[1.01] transition-all group relative overflow-hidden shadow-sm"
                  >
                    <div className="w-12 h-14 rounded-lg bg-[#FAF9F6] shrink-0 overflow-hidden border border-[#ECEAE2] relative">
                      <SafeImage src={item.image} width={150} quality={70} alt="" className="w-full h-full object-cover rounded-md" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="text-charcoal font-black text-xs truncate leading-tight">{item.productName}</p>
                        {!item.comboSelections || item.comboSelections.length === 0 ? (
                          <p className="text-charcoal/50 text-[8px] uppercase font-black tracking-widest mt-1">
                            {item.size} / {item.color} • ₹{item.price}
                          </p>
                        ) : (
                          <div className="mt-1 space-y-0.5 bg-premium-gold/5 p-1.5 rounded-lg border border-premium-gold/10">
                            {item.comboSelections.map((sel, idx) => (
                              <p key={idx} className="text-[7px] font-black text-charcoal/70 uppercase leading-tight">
                                <span className="text-premium-gold">•</span> {sel.productName}: {sel.size}/{sel.color}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2.5">
                        {/* Advanced mini-counter */}
                        <div className="flex items-center gap-1.5 bg-[#F3EFE6] p-0.5 rounded-lg border border-[#ECEAE2] shadow-inner">
                          <button 
                            onClick={() => updateQty(item.key, -1)} 
                            className="w-12 h-12 flex items-center justify-center text-charcoal/40 hover:text-charcoal hover:bg-[#E5DFD0] rounded-lg transition-all active:scale-95"
                          >
                            <Minus size={18} />
                          </button>
                          <span className="w-8 text-center text-xs font-black text-charcoal">{item.quantity}</span>
                          <button 
                            onClick={() => updateQty(item.key, 1)} 
                            className="w-12 h-12 flex items-center justify-center text-charcoal/40 hover:text-charcoal hover:bg-[#E5DFD0] rounded-lg transition-all active:scale-95"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                        
                        <p className="text-[#8C6D1F] font-black text-[11px]">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Delete trigger */}
                    <button 
                      onClick={() => removeItem(item.key)} 
                      className="absolute top-1 right-1 p-3 text-charcoal/30 hover:text-red-500 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Cart Pricing breakdowns */}
          <div className="p-5 bg-[#F3EFE6] border-t border-[#ECEAE2] space-y-4 relative z-10">
            {/* Boutique Valued Services Removed */}

            {/* Active Store Promotions Removed */}

            <div className="space-y-2 bg-white p-4 rounded-2xl border border-[#EBE8DF] shadow-sm">
              <div className="flex justify-between text-charcoal/60 text-[9px] font-black uppercase tracking-widest">
                <span>Subtotal Value</span><span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-charcoal/60 text-[9px] font-black uppercase tracking-widest">
                <span>Tax Breakdown (5%)</span><span>₹{tax.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 text-[9px] font-black uppercase tracking-widest animate-pulse">
                  <span>Loyalty Discount</span><span>−₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="h-px bg-[#ECEAE2] my-2.5" />
              <div className="flex justify-between items-end">
                <span className="text-charcoal/60 text-[10px] font-black uppercase tracking-[0.2em]">Net Payable</span>
                <span className="text-2xl font-black text-charcoal leading-none tracking-tight">₹{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Glowing checkout button */}
            <button 
              disabled={items.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full h-14 bg-charcoal hover:bg-black text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] transition-all group disabled:opacity-20 disabled:grayscale disabled:scale-100 text-xs uppercase tracking-[0.15em] relative overflow-hidden"
            >
              <span className="absolute top-0 left-[-100%] w-[50%] h-full bg-white/20 skew-x-[-20deg] group-hover:left-[120%] transition-all duration-1000" />
              Process Checkout [F9]
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-white/80" />
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
              className="absolute inset-0 bg-charcoal/70 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.25)] flex flex-col md:flex-row h-[420px] border border-border-light"
            >
              {/* Product preview artwork */}
              <div className="w-full md:w-5/12 bg-[#F5F5F7] relative hidden md:block">
                <SafeImage src={selectedProduct.images?.[0]} width={300} quality={80} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-5 left-5 right-5">
                   <h3 className="text-white font-black text-base leading-tight line-clamp-2">{selectedProduct.name}</h3>
                   <p className="text-premium-gold font-black text-[9px] uppercase tracking-widest mt-1.5">{selectedProduct.sku}</p>
                </div>
              </div>
              
              {/* Selector details form */}
              <div className="w-full md:w-7/12 p-4 sm:p-6 flex flex-col h-full bg-white relative">
                <button onClick={() => { setSelectedProduct(null); setSelectedComboItems({}); }} className="absolute top-5 right-5 p-1.5 bg-light-bg rounded-xl hover:bg-border-light text-text-muted transition-colors"><X size={16} /></button>
                
                <h4 className="text-charcoal font-black text-xs uppercase tracking-widest text-text-muted mb-4">
                  {selectedProduct.productNature === 'combo' ? 'Bundle Configuration' : 'Aesthetic Configurations'}
                </h4>
                
                <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-5">
                  {selectedProduct.productNature === 'combo' ? (
                    <div className="space-y-6">
                      {selectedProduct.comboSlots?.map((slot, sIdx) => (
                        <div key={slot.id || sIdx} className="p-4 bg-light-bg/30 rounded-2xl border border-border-light">
                          <p className="text-[10px] font-black text-premium-gold uppercase tracking-widest mb-3">{slot.name}</p>
                          <div className="space-y-3">
                            {slot.products?.map(p => (
                              <div key={p._id} className="space-y-2">
                                <p className="text-[9px] font-bold text-charcoal">{p.name}</p>
                                <div className="flex flex-wrap gap-2">
                                  {p.syncedVariants?.map(v => (
                                    <button
                                      key={v.id}
                                      onClick={() => setSelectedComboItems({ ...selectedComboItems, [slot.id]: { productName: p.name, ...v } })}
                                      className={`h-12 px-5 rounded-xl text-[9px] font-black uppercase transition-all border ${selectedComboItems[slot.id]?.id === v.id ? 'bg-charcoal text-white border-charcoal shadow-md' : 'bg-white text-text-muted border-border-light hover:bg-light-bg'}`}
                                    >
                                      {v.size} / {v.color}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                        <button 
                          onClick={() => {
                            const slotsCount = selectedProduct.comboSlots?.length || 0;
                            const selectedCount = Object.keys(selectedComboItems).length;
                            if (selectedCount < slotsCount) return toast.error('Please configure all bundle tiers');
                            
                            addToCart(selectedProduct, { 
                              size: 'Bundle', 
                              color: 'Mixed', 
                              stock: 999,
                              comboSelections: Object.values(selectedComboItems)
                            });
                            setSelectedComboItems({});
                          }}
                          className="w-full h-14 bg-charcoal text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-premium-gold hover:text-charcoal transition-all"
                        >
                        Confirm Bundle Selection
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Colors selectors */}
                      <div>
                        <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-2.5">Colorways</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[...new Set(selectedProduct.variants.map(v => v.color))].map(c => (
                            <button 
                              key={c}
                              onClick={() => setSelectedColor(c)}
                              className={`h-12 px-5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${selectedColor === c ? 'bg-charcoal text-white border-charcoal shadow-md shadow-charcoal/15' : 'bg-light-bg text-text-muted border-border-light hover:bg-white hover:border-text-muted/30'}`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Sizes selectors */}
                      <div>
                        <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-2.5">Fitted Sizes</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {selectedProduct.variants.filter(v => v.color === selectedColor).map((v, i) => (
                              <button 
                                key={i}
                                disabled={v.stock <= 0}
                                onClick={() => addToCart(selectedProduct, v)}
                                className={`relative h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 border-2 transition-all ${v.stock > 0 ? 'border-border-light hover:border-premium-gold bg-white hover:shadow-sm' : 'border-border-light bg-light-bg opacity-30 cursor-not-allowed'}`}
                              >
                              <span className="text-sm font-black text-charcoal">{v.size}</span>
                              <span className="text-[7px] font-bold text-text-muted uppercase tracking-wide">{v.stock > 0 ? `${v.stock} pcs` : 'Out of Stock'}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Advanced Checkout Modal ─── */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-charcoal/70 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              className="relative w-full max-w-3xl bg-white rounded-[2rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.3)] flex flex-col md:flex-row h-[550px] border border-border-light"
            >
              {/* Left Column: Transaction Summaries */}
              <div className="w-full md:w-5/12 bg-charcoal p-7 flex flex-col justify-between relative overflow-hidden shrink-0 border-r border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                
                <div>
                   <h2 className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] mb-5">Checkout Cart Items</h2>
                   <div className="space-y-3 max-h-[280px] overflow-y-auto no-scrollbar pr-1">
                     {items.map(i => (
                       <div key={i.key} className="flex justify-between text-[11px] font-medium py-1.5 border-b border-white/5 last:border-0">
                         <span className="text-white/60 truncate max-w-[140px]">{i.productName} <span className="text-premium-gold font-bold">x{i.quantity}</span></span>
                         <span className="text-white">₹{(i.price * i.quantity).toLocaleString()}</span>
                       </div>
                     ))}
                   </div>
                </div>
                
                <div className="pt-5 border-t border-white/5 relative z-10">
                   <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1.5">Net Grand Total</p>
                   <p className="text-3xl font-black text-premium-gold tracking-tight">₹{total.toLocaleString()}</p>
                </div>
              </div>

              {/* Right Column: Checkout input fields */}
              <div className="flex-1 p-7 overflow-y-auto no-scrollbar flex flex-col justify-between bg-white">
                <div className="flex justify-between items-center mb-5 shrink-0">
                  <h3 className="text-md font-black text-charcoal tracking-tight uppercase">Billing Information</h3>
                  <button onClick={() => setIsCheckoutOpen(false)} className="p-1.5 bg-light-bg rounded-xl hover:bg-border-light text-text-muted transition-colors"><X size={16} /></button>
                </div>

                <div className="flex-1 space-y-4 pr-1">
                  {/* Customer Lookup Info */}
                  <div className="space-y-2 bg-light-bg/40 p-3.5 rounded-2xl border border-border-light/40">
                    <label className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] block">Loyalty Member Link (Optional)</label>
                    <div className="relative group">
                       <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-premium-gold transition-colors" size={14} />
                       <input 
                         className="w-full bg-white border border-border-light rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-premium-gold/20 focus:border-premium-gold text-xs font-black transition-all"
                         placeholder="10-digit mobile (Optional)..."
                         value={customer.phone}
                         onChange={(e) => {
                           const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                           setCustomer({...customer, phone: val});
                           if (val.length === 10) lookupCustomer(val);
                         }}
                       />
                       {loadingCustomer && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-premium-gold animate-spin" size={12} />}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <input 
                         className="w-full bg-white border border-border-light rounded-xl px-3 py-2 focus:outline-none focus:border-premium-gold text-xs font-bold"
                         placeholder="Customer Name (Optional)"
                         value={customer.name}
                         onChange={(e) => setCustomer({...customer, name: e.target.value})}
                      />
                      <input 
                         className="w-full bg-white border border-border-light rounded-xl px-3 py-2 focus:outline-none focus:border-premium-gold text-xs font-bold"
                         placeholder="Email ID (Optional)"
                         value={customer.email}
                         onChange={(e) => setCustomer({...customer, email: e.target.value})}
                      />
                    </div>

                    {customer.name && customer.phone.length === 10 && (
                      <div className="mt-2.5 p-2.5 bg-premium-gold/5 border border-premium-gold/15 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-premium-gold/10 text-premium-gold rounded-lg flex items-center justify-center">
                            <Sparkles size={10} />
                          </div>
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-premium-gold">PATRON REWARDS</span>
                            <p className="text-[9px] font-black text-charcoal/80 leading-none mt-0.5">
                              {customer.wallet?.balance > 0 ? `Credit Balance: ₹${customer.wallet.balance}` : 'Standard Tier Member'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[7px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest">Active Partner Link</span>
                      </div>
                    )}
                  </div>

                  {/* Sales Assistant selection */}
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] block">Sales Facilitator</label>
                    <div className="relative group">
                       <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-premium-gold transition-colors" size={14} />
                       <select 
                         className="w-full bg-light-bg/40 border border-border-light rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-premium-gold/20 focus:border-premium-gold text-xs font-bold transition-all appearance-none cursor-pointer"
                         value={salesStaffId}
                         onChange={(e) => setSalesStaffId(e.target.value)}
                       >
                         <option value="">-- Assisting Staff Member --</option>
                         {staffList?.map(staff => (
                           <option key={staff._id} value={staff._id}>{staff.name}</option>
                         ))}
                       </select>
                    </div>
                  </div>

                  {/* Manual discount details */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em]">Aesthetic Discounts</label>
                      <div className="flex gap-1">
                        {[5, 10, 15].map(pct => (
                          <button 
                            key={pct} 
                            onClick={() => setDiscount(Math.round(subtotal * (pct/100)))} 
                            className="px-2 py-0.5 rounded text-[7px] font-black bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors border border-emerald-100"
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative group">
                       <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-premium-gold transition-colors" size={14} />
                       <input 
                         type="number"
                         className="w-full bg-light-bg/40 border border-border-light rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-premium-gold/20 focus:border-premium-gold text-xs font-bold transition-all"
                         placeholder="Custom discount amount (₹)"
                         value={discount || ''}
                         onChange={(e) => setDiscount(Math.min(subtotal, Number(e.target.value)))}
                       />
                    </div>
                  </div>

                  {/* Dynamic payment pathways selectors */}
                  <div className="space-y-1.5 shrink-0">
                    <label className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] block">Settlement Channel</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'cash', icon: Banknote, label: 'Cash', color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
                        { id: 'gpay', icon: Smartphone, label: 'UPI/GPay', color: 'text-blue-500 bg-blue-50 border-blue-100' },
                        { id: 'card', icon: CreditCard, label: 'Card Swipe', color: 'text-indigo-500 bg-indigo-50 border-indigo-100' },
                        { id: 'split', icon: Wallet, label: 'Split Pay', color: 'text-orange-500 bg-orange-50 border-orange-100' }
                      ].map(m => {
                        const isSelected = paymentMethod === m.id;
                        return (
                          <button 
                            key={m.id}
                            onClick={() => setPaymentMethod(m.id)}
                            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${isSelected ? 'border-premium-gold bg-premium-gold/10 ring-2 ring-premium-gold/15 shadow-sm' : 'border-border-light/60 hover:border-text-muted/30 bg-white'}`}
                          >
                            <m.icon size={16} className={isSelected ? 'text-premium-gold animate-bounce' : m.color.split(' ')[0]} />
                            <span className="text-[7px] font-black uppercase tracking-wider text-charcoal">{m.label.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>

                    {paymentMethod === 'split' && (
                      <div className="grid grid-cols-2 gap-2 mt-2 p-2.5 bg-orange-50/50 rounded-xl border border-orange-100">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-text-muted">₹</span>
                          <input type="number" placeholder="Cash Portion" className="w-full bg-white border border-border-light rounded-lg pl-7 pr-2 py-1.5 text-[10px] font-bold focus:ring-2 focus:ring-premium-gold/20 focus:outline-none" value={splitAmounts.cash} onChange={e => setSplitAmounts({...splitAmounts, cash: e.target.value})} />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-text-muted">₹</span>
                          <input type="number" placeholder="UPI Portion" className="w-full bg-white border border-border-light rounded-lg pl-7 pr-2 py-1.5 text-[10px] font-bold focus:ring-2 focus:ring-premium-gold/20 focus:outline-none" value={splitAmounts.upi} onChange={e => setSplitAmounts({...splitAmounts, upi: e.target.value})} />
                        </div>
                        <div className="col-span-2 text-right pt-0.5">
                          <span className={`text-[8px] font-black tracking-widest uppercase ${(Number(splitAmounts.cash)||0) + (Number(splitAmounts.upi)||0) === total ? 'text-emerald-600' : 'text-red-500 animate-pulse'}`}>
                            Unsettled: ₹{(total - ((Number(splitAmounts.cash)||0) + (Number(splitAmounts.upi)||0))).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={createBillMutation.isLoading}
                  className="w-full h-14 bg-charcoal hover:bg-black text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all text-xs uppercase tracking-widest relative mt-5 shrink-0 group"
                >
                  {createBillMutation.isLoading ? <Loader2 className="animate-spin text-premium-gold" size={16} /> : 'Process Settlement & Generate Receipt'}
                  <CheckCircle2 className="w-4 h-4 text-premium-gold" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Parked Sales Recovery List Modal ─── */}
      <AnimatePresence>
        {showHeldBills && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHeldBills(false)} className="absolute inset-0 bg-charcoal/70 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.98 }} 
              className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] border border-border-light"
            >
              <div className="p-5 border-b border-border-light flex items-center justify-between bg-[#F9F9FA]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center border border-orange-200">
                    <History size={16} />
                  </div>
                  <div>
                    <h3 className="font-black text-charcoal tracking-tight text-sm">Parked Cart Sales</h3>
                    <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mt-0.5">{heldBills.length} Inactive Invoices</p>
                  </div>
                </div>
                <button onClick={() => setShowHeldBills(false)} className="p-1.5 bg-white rounded-xl hover:bg-border-light text-text-muted transition-colors border border-border-light"><X size={16} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
                {heldBills.length === 0 ? (
                  <div className="py-10 text-center text-text-muted opacity-40">
                    <History size={36} className="mx-auto mb-3" />
                    <p className="font-bold text-xs uppercase tracking-wider">No parked bills found</p>
                  </div>
                ) : (
                  heldBills.map(bill => (
                    <div key={bill.id} className="bg-[#F9F9FA] border border-border-light/60 p-3.5 rounded-xl flex items-center justify-between group hover:border-premium-gold transition-all">
                      <div>
                        <p className="text-xs font-black text-charcoal">{bill.customer?.name || 'Standard Walk-In'}</p>
                        <p className="text-[8px] font-bold text-text-muted uppercase tracking-wide mt-1">
                          Parked: {new Date(bill.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {bill.items.length} items listed
                        </p>
                      </div>
                      <button 
                        onClick={() => resumeBill(bill.id)} 
                        className="bg-white border border-border-light/60 px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm hover:border-premium-gold hover:bg-premium-gold hover:text-charcoal transition-all"
                      >
                        Restore
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Add Custom Bespoke Item Modal (SaaS Premium) ─── */}
      <AnimatePresence>
        {showCustomItemModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCustomItemModal(false)} className="absolute inset-0 bg-charcoal/80 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.98, y: 20 }} 
              className="relative w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-border-light p-4 md:p-8 gap-6"
            >
              <div className="flex items-center justify-between border-b border-border-light pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-premium-gold/15 text-premium-gold rounded-2xl flex items-center justify-center border border-premium-gold/20 shadow-inner">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-charcoal tracking-tight text-base uppercase">Bespoke Custom Item</h3>
                    <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mt-0.5">Charge for Non-Standard Patrons</p>
                  </div>
                </div>
                <button onClick={() => setShowCustomItemModal(false)} className="p-1.5 bg-light-bg rounded-xl hover:bg-border-light text-text-muted transition-colors"><X size={16} /></button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Custom Item Name</label>
                  <input 
                    className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-6 py-5 font-black text-xs placeholder-text-muted/60" 
                    placeholder="e.g. Silk Saree Alteration & Stone Work" 
                    value={customItemDetails.name} 
                    onChange={e => setCustomItemDetails({...customItemDetails, name: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Unit Charge Price (₹)</label>
                  <input 
                    type="number" 
                    className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-6 py-5 font-black text-xs" 
                    placeholder="e.g. 1500" 
                    value={customItemDetails.price} 
                    onChange={e => setCustomItemDetails({...customItemDetails, price: e.target.value})} 
                  />
                </div>
              </div>

              <button 
                onClick={() => {
                  const priceNum = Number(customItemDetails.price);
                  if (!customItemDetails.name || !customItemDetails.price) {
                    return toast.error('Both name and price are required');
                  }
                  if (isNaN(priceNum) || priceNum <= 0) {
                    return toast.error('Price must be a valid positive number');
                  }
                  addCustomService(customItemDetails.name, priceNum);
                  setShowCustomItemModal(false);
                  setCustomItemDetails({ name: '', price: '' });
                }}
                className="w-full h-14 bg-charcoal text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Custom Charge
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Mobile Sticky Floating Action Button ─── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-charcoal z-[45] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        <div className="flex justify-between items-center mb-3 px-2">
           <div className="flex flex-col text-white">
             <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{items.length} Items Listed</span>
             <span className="text-xl font-black text-premium-gold font-mono">₹{total.toLocaleString()}</span>
           </div>
           <div className="flex flex-col text-white/60 text-[10px] uppercase font-black tracking-widest text-right">
              <span>{user?.name || 'Staff'}</span>
              <span>Pos Active</span>
           </div>
        </div>
        <button 
          onClick={() => {
            if (items.length === 0) return toast.error('Cart is empty. Add items first.');
            setIsCheckoutOpen(true);
          }}
          className="w-full h-14 btn-gold rounded-2xl font-black tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          PROCESS CHECKOUT <ArrowRight size={18} />
        </button>
      </div>

      {/* ─── Platform Operator Guide Modal (SaaS Premium) ─── */}
      <AnimatePresence>
        {showShortcutsHelp && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowShortcutsHelp(false)} className="absolute inset-0 bg-charcoal/80 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.98, y: 20 }} 
              className="relative w-full max-w-lg bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col border border-border-light p-4 md:p-8 gap-6"
            >
              <div className="flex items-center justify-between border-b border-border-light pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-premium-gold/15 text-premium-gold rounded-2xl flex items-center justify-center border border-premium-gold/20 shadow-inner">
                    <Command size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-charcoal tracking-tight text-base uppercase">Operator Manual</h3>
                    <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mt-0.5">Magizhchi POS Intelligent Core</p>
                  </div>
                </div>
                <button onClick={() => setShowShortcutsHelp(false)} className="p-1.5 bg-light-bg rounded-xl hover:bg-border-light text-text-muted transition-colors"><X size={16} /></button>
              </div>

              <div className="space-y-4 text-xs font-semibold text-text-primary overflow-y-auto no-scrollbar max-h-[50vh] pr-1">
                {/* Section 1 */}
                <div className="space-y-2.5">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-text-muted">Master Hotkeys</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-2.5 bg-light-bg/50 border border-border-light/40 rounded-xl">
                      <span className="text-[10px] font-bold">Focus Search Field</span>
                      <kbd className="bg-white border border-border-light px-2 py-0.5 rounded text-[8px] font-black text-charcoal shadow-sm">F2</kbd>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-light-bg/50 border border-border-light/40 rounded-xl">
                      <span className="text-[10px] font-bold">Toggle Catalog Layout</span>
                      <kbd className="bg-white border border-border-light px-2 py-0.5 rounded text-[8px] font-black text-charcoal shadow-sm">F4</kbd>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-light-bg/50 border border-border-light/40 rounded-xl col-span-2">
                      <span className="text-[10px] font-bold">Initiate Complete Transaction</span>
                      <kbd className="bg-white border border-border-light px-2 py-0.5 rounded text-[8px] font-black text-charcoal shadow-sm">F9</kbd>
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="space-y-2.5 pt-2 border-t border-border-light/60">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-text-muted">SaaS Pro Features</span>
                  <div className="space-y-2">
                    <div className="p-3 bg-premium-gold/5 border border-premium-gold/15 rounded-xl">
                      <p className="text-[10px] font-black text-premium-gold uppercase tracking-wider mb-1">Multi-Session Billing Tabs</p>
                      <p className="text-[9px] text-charcoal/70 leading-normal">Operators can work with up to 3 separate patrons concurrently. Tap Patron Tabs above the cart to switch instantly without losing draft invoice line items.</p>
                    </div>
                    <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-1">AI Smart Recommendations</p>
                      <p className="text-[9px] text-charcoal/70 leading-normal">Dynamic pairings appear at the bottom of the catalog. Click the + icon on recommendations to add matches with an automatic styling validation score.</p>
                    </div>
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider mb-1">Bespoke Custom Services</p>
                      <p className="text-[9px] text-charcoal/70 leading-normal">Easily add Alterations, Custom Tailoring, or Designer Gift Boxes directly to any active cart session via single-click service buttons below the catalog items.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-charcoal text-white/50 text-[8px] font-black uppercase tracking-[0.25em] text-center p-3 rounded-2xl border border-white/5 mt-2">
                Magizhchi Security · Command Node: POS-GUIDE
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
