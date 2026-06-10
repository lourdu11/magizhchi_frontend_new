import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, Receipt, Printer, 
  Loader2, User, X, CreditCard, Wallet, Banknote, Smartphone,
  Package, LayoutGrid, ListFilter, Command, CheckCircle2, History, Shield, Sparkles, ArrowRight, Mail, Gift, Scissors, Edit
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
