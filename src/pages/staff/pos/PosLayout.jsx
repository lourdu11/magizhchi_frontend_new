import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { LayoutGrid, ShoppingCart, ListFilter, Printer } from 'lucide-react';
import { POSProvider, usePOS } from './POSContext';
import ProductBrowser from './ProductBrowser';
import CartSection from './CartSection';
import CheckoutModal from './CheckoutModal';
import { productService, categoryService, adminService, billService, inventoryService } from '../../../services';
import { toast } from 'react-hot-toast';

import { useAuthStore } from '../../../store';
import BillHistory from './BillHistory';
import ThermalReceipt from './ThermalReceipt';
import { dbService } from '../../../utils/db';

function PosContent() {
  const queryClient = useQueryClient();
  const { state, dispatch } = usePOS();
  const { search, selectedCategory, activeTab, cartSessions, heldBills, activeView, staffMembers } = state;
  const currentUser = useAuthStore(state => state.user);
  
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 1. Auto-assign Sales Executive if not set
  useEffect(() => {
    if (currentUser && staffMembers?.length > 0) {
      const currentSession = cartSessions[activeTab];
      if (!currentSession.salesStaffId) {
        // Find if current user is in staff list (by email or name)
        const match = staffMembers.find(s => s.email === currentUser.email || s._id === currentUser._id);
        if (match) {
          dispatch({ type: 'UPDATE_SESSION', payload: { salesStaffId: match._id } });
        }
      }
    }
  }, [currentUser, staffMembers, activeTab, dispatch]);

  // 0. Print Styles (Forced Receipt Isolation with Masterclass Height-Collapse Engine)
  const printStyles = `
    #thermal-receipt { display: none !important; }
    @media print {
      /* Hide all elements globally */
      body * { 
        visibility: hidden !important; 
      }
      
      /* Make ONLY the receipt and its contents visible */
      #thermal-receipt, #thermal-receipt * { 
        visibility: visible !important; 
      }
      
      /* Force all page containers to occupy exactly 0px layout height to prevent paper roll bleed */
      html, body, #root, #root *, main, div, aside, header, nav {
        height: 0 !important;
        min-height: 0 !important;
        max-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        overflow: visible !important; /* Allow the receipt to overflow and draw naturally */
      }
      
      /* Release height and display constraints specifically for the receipt container */
      #thermal-receipt { 
        display: block !important; 
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 80mm !important;
        max-width: 80mm !important;
        height: auto !important;
        max-height: none !important;
        background: white !important;
        padding: 4px !important;
      }
      
      #thermal-receipt * {
        height: auto !important;
        max-height: none !important;
      }
    }
  `;

  // 1. Hotkey Management (SaaS High-Speed Billing)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showSuccessModal) {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.print();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowSuccessModal(false);
        }
        return;
      }
      if (e.key === 'F1') {
        e.preventDefault();
        document.getElementById('pos-search')?.focus();
      }
      if (e.key === 'F10') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_CHECKOUT' });
      }
      if (e.key === 'Escape') {
        if (state.isCheckoutOpen) dispatch({ type: 'TOGGLE_CHECKOUT' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, state.isCheckoutOpen, showSuccessModal]);

  // 2. Real-time Sync Logic
  useEffect(() => {
    const socket = adminService.getSocket?.() || null;
    if (socket) {
      const handleSync = () => queryClient.invalidateQueries({ queryKey: ['pos-inventory'] });
      socket.on('STOCK_UPDATED', handleSync);
      return () => socket.off('STOCK_UPDATED', handleSync);
    }
  }, [queryClient]);

  const { data: staff } = useQuery({
    queryKey: ['pos-staff'],
    queryFn: () => adminService.getStaff().then(r => r.data.data || []),
    onSuccess: (data) => dispatch({ type: 'SET_STAFF', payload: data })
  });

  const { data: categories } = useQuery({
    queryKey: ['pos-categories'],
    queryFn: () => categoryService.getCategories().then(r => r.data.data?.categories || []),
    staleTime: 300000 
  });

  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['pos-inventory', selectedCategory, search],
    queryFn: () => {
      const params = { limit: 1000, offlineEnabled: 'true' };
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (search) params.search = search;
      return inventoryService.getInventory(params).then(r => {
        const rawItems = r.data?.data || r.data?.data?.data || [];
        
        // --- BARCODE AUTO-ADD SECURITY FEATURE ---
        // If search exactly matches a SKU, add instantly
        if (search && rawItems.length === 1 && rawItems[0].sku?.toLowerCase() === search.toLowerCase()) {
           const match = rawItems[0];
           if (match.availableStock > 0) {
              dispatch({ type: 'SELECT_PRODUCT', payload: match });
              dispatch({ type: 'SET_SEARCH', payload: '' });
              toast.success(`Scanned: ${match.productName}`);
           }
        }

        const grouped = rawItems.reduce((acc, item) => {
          const key = item.productRef?._id || item.productRef || item.productName;
          if (!acc[key]) acc[key] = { ...item, variants: [item], totalStock: item.availableStock || 0 };
          else {
            acc[key].variants.push(item);
            acc[key].totalStock += (item.availableStock || 0);
          }
          return acc;
        }, {});
        return Object.values(grouped).map(p => ({ ...p, availableStock: p.totalStock }));
      });
    },
    keepPreviousData: true
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  // Monitor network status
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      toast.success('Internet connection restored!');
      syncOfflineBills();
    };
    const goOffline = () => {
      setIsOnline(false);
      toast.error('You are now working offline.');
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    
    // Auto-sync on load if online
    if (window.navigator.onLine) {
      syncOfflineBills();
    }

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [state.offlineBills]);

  // Synchronize offline bills
  const syncOfflineBills = async () => {
    try {
      const pendingBills = await dbService.getAll('offlineBills');
      if (!pendingBills || pendingBills.length === 0) return;

      setIsSyncing(true);
      const syncToastId = toast.loading('Syncing offline bills...');

      let successCount = 0;
      for (const bill of pendingBills) {
        try {
          const payload = {
            items: bill.items,
            customerDetails: bill.customerDetails,
            paymentMethod: bill.paymentMethod,
            discount: bill.discount,
            salesStaffId: bill.salesStaffId,
            idempotencyKey: bill.idempotencyKey
          };
          const res = await billService.createBill(payload);
          if (res.data.success) {
            await dbService.delete('offlineBills', bill.id);
            dispatch({ type: 'REMOVE_OFFLINE_BILL', payload: bill.id });
            successCount++;
          }
        } catch (err) {
          console.error('Failed to sync offline bill:', bill.billNumber, err.message);
        }
      }

      setIsSyncing(false);
      if (successCount > 0) {
        toast.success(`Successfully synced ${successCount} offline bills!`, { id: syncToastId });
        queryClient.invalidateQueries({ queryKey: ['pos-inventory'] });
      } else {
        toast.dismiss(syncToastId);
      }
    } catch (err) {
      setIsSyncing(false);
      console.error('Sync failed:', err.message);
    }
  };

  const handleCompleteTransaction = async (overrideData = {}) => {
    const session = state.cartSessions[state.activeTab];
    const { items, customer, discount, paymentMethod, salesStaffId } = { ...session, ...overrideData };
    if (items.length === 0) return toast.error('Cart is empty');

    // Automatically assign the logged-in user as the sales staff fallback
    const finalSalesStaffId = salesStaffId || currentUser?._id || currentUser?.id || '';

    const billNumber = `OFFLINE-${Date.now().toString().slice(-6)}`;
    const billData = {
      id: `offline-${Date.now()}`,
      billNumber,
      items: items.map(i => ({
        productId: i.productId, 
        inventoryId: i.inventoryId, 
        productName: i.name,
        price: i.price, 
        quantity: i.quantity, 
        size: i.variantName.split(' / ')[0], 
        color: i.variantName.split(' / ')[1],
        isCombo: i.isCombo,
        comboSelections: i.comboSelections
      })),
      customerDetails: customer, 
      paymentMethod, 
      discount, 
      salesStaffId: finalSalesStaffId,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString(),
      idempotencyKey: `POS-${Date.now()}`,
      isOfflinePending: true
    };

    if (isOnline) {
      try {
        const res = await billService.createBill(billData);
        if (res.data.success) {
          toast.success('Bill generated successfully!');
          
          const savedBill = res.data.data?.bill || res.data.data || billData;
          dispatch({ type: 'SET_LAST_BILL', payload: {
             ...savedBill,
             subtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
             total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0) - discount
          }});

          setShowSuccessModal(true);

          // AUTO-PRINT TRIGGER
          setTimeout(() => {
             try {
               window.print();
             } catch (err) {
               console.error('Silent print failed, manual retry ready:', err);
             }
          }, 300);

          dispatch({ type: 'SET_ITEMS', payload: [] });
          dispatch({ type: 'UPDATE_SESSION', payload: { customer: { name: '', phone: '', email: '' }, discount: 0, paymentSplit: { cash: 0, upi: 0, card: 0 } } });
          if (state.isCheckoutOpen) dispatch({ type: 'TOGGLE_CHECKOUT' });
          queryClient.invalidateQueries({ queryKey: ['pos-inventory'] });
        }
      } catch (err) {
        // Fallback to offline if server is unreachable or responds with network/500/timeout error
        const isNetworkOrServerError = !err.response || err.response.status >= 500;
        if (isNetworkOrServerError) {
          toast.warn('Server unreachable. Storing bill offline...');
          await saveBillOffline(billData, items, discount);
        } else {
          toast.error(err.response?.data?.message || 'Transaction failed');
        }
      }
    } else {
      // Offline mode
      toast.warn('No connection. Storing bill offline...');
      await saveBillOffline(billData, items, discount);
    }
  };

  const saveBillOffline = async (billData, items, discount) => {
    try {
      await dbService.put('offlineBills', billData);
      dispatch({ type: 'ADD_OFFLINE_BILL', payload: billData });
      
      // Save for printing BEFORE clearing cart
      dispatch({ type: 'SET_LAST_BILL', payload: {
         ...billData,
         subtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
         total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0) - discount
      }});

      setShowSuccessModal(true);

      // AUTO-PRINT TRIGGER
      setTimeout(() => {
         try {
           window.print();
         } catch (err) {
           console.error('Silent print failed, manual retry ready:', err);
         }
      }, 300);

      dispatch({ type: 'SET_ITEMS', payload: [] });
      dispatch({ type: 'UPDATE_SESSION', payload: { customer: { name: '', phone: '', email: '' }, discount: 0, paymentSplit: { cash: 0, upi: 0, card: 0 } } });
      if (state.isCheckoutOpen) dispatch({ type: 'TOGGLE_CHECKOUT' });
      
      toast.success('Offline Bill stored successfully & print triggered!');
    } catch (dbErr) {
      toast.error('Failed to store transaction locally: ' + dbErr.message);
    }
  };

  return (
    <div className="h-dvh flex flex-col bg-[#F8F9FA] overflow-hidden font-sans">
      <style>{printStyles}</style>
      <Helmet title="Magizhchi POS | Enterprise Billing" />
      
      <div className="flex-1 flex flex-col min-w-0 print:hidden">
        {/* Top Workspace Header (Admin Friendly & Simple) */}
        <div className="h-20 bg-white border-b border-border-light flex items-center px-8 justify-between">
           <div className="flex items-center gap-4">
              <div className="bg-premium-gold/10 p-3 rounded-2xl">
                 <ShoppingCart className="text-premium-gold" size={24} />
              </div>
              <div>
                 <h2 className="text-lg font-black text-charcoal uppercase tracking-tighter leading-none">Billing Station</h2>
                 <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mt-1">Single Session Workspace</p>
              </div>
           </div>

           {/* Real-time Connection & Sync Widget */}
           <div className="flex items-center gap-4">
              {/* 🖨️ Printer Setup Help Trigger */}
              <button 
                onClick={() => setIsHelpOpen(true)}
                className="px-5 py-2.5 bg-black hover:bg-white/5 border border-[#C5A85A]/30 text-premium-gold rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-md"
              >
                 <Printer size={13} />
                 <span>Printer Setup</span>
              </button>

              {state.offlineBills?.length > 0 && (
                 <button 
                   onClick={syncOfflineBills}
                   disabled={isSyncing || !isOnline}
                   className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center"
                 >
                    <span className="font-bold">{state.offlineBills.length} Pending Bills</span>
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    <span className="font-bold">Sync Now</span>
                 </button>
              )}

              <div className={`px-5 py-2.5 rounded-2xl flex items-center gap-3 border ${isOnline ? 'bg-green-500/5 border-green-500/10 text-green-600' : 'bg-red-500/5 border-red-500/10 text-red-500'}`}>
                 <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                 <span className="text-[9px] font-black uppercase tracking-widest font-bold">
                    {isOnline ? 'Online Mode' : 'Offline Mode'}
                 </span>
              </div>
           </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <ProductBrowser products={inventoryData} categories={categories} isLoading={isLoading} />
          <CartSection onComplete={handleCompleteTransaction} />
        </div>
      </div>

      <ThermalReceipt />

      {/* Premium Obsidian & Gold Printer Setup Guide Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:hidden">
          <div className="bg-[#1C1C1C] border border-[#C5A85A]/30 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in font-sans animate-duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#C5A85A]/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="bg-[#C5A85A]/10 p-2.5 rounded-xl border border-[#C5A85A]/20">
                  <Printer className="text-[#C5A85A]" size={20} />
                </div>
                <div>
                  <h3 className="text-md font-black text-white uppercase tracking-wider">Thermal Printer Setup Guide</h3>
                  <p className="text-[9px] text-[#C5A85A] uppercase tracking-[0.2em] font-bold">1-Click Instant Hardware Printing Setup</p>
                </div>
              </div>
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center text-sm font-bold active:scale-95 transition-all border-0"
              >
                ✕
              </button>
            </div>

            {/* Modal Content - Scrollable step-by-step list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-gray-300">
              
              {/* Introduction Card */}
              <div className="p-4 rounded-2xl bg-black/30 border border-[#C5A85A]/10 flex items-start gap-4">
                <span className="text-2xl">🔥</span>
                <div>
                  <h4 className="text-white font-bold uppercase text-[12px] tracking-wide mb-1">Goal / இலக்கு</h4>
                  <p className="text-xs text-gray-400">
                    `GENERATE & PRINT RECEIPT` button click பண்ணா: Print popup வரக்கூடாது, PDF open ஆகக்கூடாது. Shop billing machine மாதிரி instant-ஆ bill print ஆகி வரணும்!
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                
                {/* Step 1 */}
                <div className="p-4 rounded-xl bg-white/5 hover:bg-white/[0.07] transition-all border-l-4 border-[#C5A85A]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black text-[#C5A85A] uppercase tracking-widest">STEP 1</span>
                    <span className="text-xs bg-white/5 px-2.5 py-0.5 rounded-full text-gray-400">Hardware Connect</span>
                  </div>
                  <h5 className="text-white font-bold text-sm mb-1">Thermal Printer Connect பண்ணு 🔌</h5>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Thermal Printer USB கேபிளை computer-ல் connect செய்து, Printer-ஐ ON செய்யவும். (Epson, TVS, Rongta, XPrinter compatible).
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl bg-white/5 hover:bg-white/[0.07] transition-all border-l-4 border-[#C5A85A]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black text-[#C5A85A] uppercase tracking-widest">STEP 2 & 3</span>
                    <span className="text-xs bg-white/5 px-2.5 py-0.5 rounded-full text-gray-400">Driver & Default Settings</span>
                  </div>
                  <h5 className="text-white font-bold text-sm mb-1">Driver Install & Set Default Printer ⚡</h5>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">
                    Printer driver-ஐ install செய்து, Windows-ல் <b>Default Printer</b>-ஆக set செய்யவும்:
                  </p>
                  <ol className="list-decimal pl-5 text-xs text-gray-400 space-y-1.5">
                    <li>Windows Search-ல் <b>"Printers & scanners"</b> என்று டைப் செய்து open செய்யவும்.</li>
                    <li>உங்கள் Thermal Printer-ஐ select செய்து <b>"Set as default"</b> கிளிக் செய்யவும்.</li>
                  </ol>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl bg-white/5 hover:bg-white/[0.07] transition-all border-l-4 border-[#C5A85A]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black text-[#C5A85A] uppercase tracking-widest">STEP 4</span>
                    <span className="text-xs bg-white/5 px-2.5 py-0.5 rounded-full text-gray-400">Paper Size 80mm</span>
                  </div>
                  <h5 className="text-white font-bold text-sm mb-1">Paper Size 80mm Set பண்ணு 🖨️</h5>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">
                    Paper width-ஐ 80mm-ஆக set செய்ய வேண்டும்:
                  </p>
                  <ol className="list-decimal pl-5 text-xs text-gray-400 space-y-1.5">
                    <li>Control Panel open செய்து <b>"Devices and Printers"</b>-க்கு செல்லவும்.</li>
                    <li>உங்கள் Printer மீது Right Click செய்து <b>"Printing preferences"</b> select செய்யவும்.</li>
                    <li>Paper Size என்பதில் <b>"80mm"</b> அல்லது <b>"Receipt 80mm"</b>-ஐ select செய்து Save செய்யவும்.</li>
                  </ol>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-xl bg-black/40 border border-red-500/20 hover:border-red-500/30 transition-all border-l-4 border-red-500">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black text-red-400 uppercase tracking-widest">STEP 5 (Most Important)</span>
                    <span className="text-xs bg-red-500/10 px-2.5 py-0.5 rounded-full text-red-400 font-bold">Popup Bypass</span>
                  </div>
                  <h5 className="text-red-400 font-bold text-sm mb-1">Chrome Kiosk Printing Enable 🚀</h5>
                  <p className="text-xs text-gray-300 leading-relaxed mb-2 font-bold">
                    இதுதான் Print Dialog popup வரவிடாமல் bypass செய்யும்!
                  </p>
                  <ol className="list-decimal pl-5 text-xs text-gray-400 space-y-2">
                    <li>முதலில் அனைத்து Chrome window-களையும் <b>முழுமையாக Close</b> செய்யவும்.</li>
                    <li>Desktop-ல் உள்ள Google Chrome icon மீது <b>Right Click</b> செய்து <b>Properties</b>-ஐ கிளிக் செய்யவும்.</li>
                    <li>அதில் <b>Target</b> என்பதில் இறுதியில் ஒரு space விட்டு <b><code className="text-white bg-white/10 px-1.5 py-0.5 rounded font-mono">--kiosk-printing</code></b> என்பதை add செய்யவும்.</li>
                    <li className="italic text-amber-400 font-bold">
                      Target Final: <code className="text-white bg-black/60 px-1.5 py-0.5 rounded font-mono text-[10px]">"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --kiosk-printing</code>
                    </li>
                    <li><b>Apply</b> → <b>OK</b> கிளிக் செய்யவும்.</li>
                  </ol>
                </div>

                {/* Step 5 */}
                <div className="p-4 rounded-xl bg-white/5 hover:bg-white/[0.07] transition-all border-l-4 border-[#C5A85A]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black text-[#C5A85A] uppercase tracking-widest">STEP 6 & 7</span>
                    <span className="text-xs bg-white/5 px-2.5 py-0.5 rounded-full text-gray-400">Launch & Test</span>
                  </div>
                  <h5 className="text-white font-bold text-sm mb-1">Launch Chrome & Test 🎯</h5>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    இப்போது அந்த Desktop Chrome shortcut மூலம் browser-ஐ open செய்து உங்கள் POS website-ல் <b>"GENERATE & PRINT RECEIPT"</b> கிளிக் செய்யவும். எவ்வித print dialog-உம் இல்லாமல் direct-ஆக உங்கள் மெஷினில் instant bill பிரிண்ட் ஆகிவிடும்!
                  </p>
                </div>

              </div>

              {/* Troubleshooting Alert Banner */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-400/90 text-xs space-y-1">
                <p className="font-bold uppercase tracking-wider">⚠️ Common Problems / சந்தேகங்கள்:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-400">
                  <li><b className="text-gray-300">PDF-ஆக Save ஆகிறது:</b> உங்கள் Windows printers settings-ல் thermal printer-ஐ default printer-ஆக set செய்யவில்லை.</li>
                  <li><b className="text-gray-300">A4 size-ல் பிரிண்ட் ஆகிறது:</b> Printing Preferences-ல் Paper size 80mm-ஆக set செய்யப்படவில்லை.</li>
                  <li><b className="text-gray-300">இன்னும் Popup வருகிறது:</b> Chrome properties-ல் target change செய்த shortcut மூலம் நீங்கள் Chrome-ஐ open செய்யவில்லை.</li>
                </ul>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#C5A85A]/10 bg-black/40 flex justify-between items-center">
              <span className="text-[9px] text-[#C5A85A] uppercase font-bold tracking-widest">⚡ Powered by Magizhchi SaaS ERP</span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    toast.success('Triggering Printer Test...');
                    if (!state.lastBill) {
                      dispatch({
                        type: 'SET_LAST_BILL',
                        payload: {
                          billNumber: 'MAG-TEST-0001',
                          createdAt: new Date().toISOString(),
                          customerDetails: { name: 'Test Patron', phone: '9876543210' },
                          paymentMethod: 'cash',
                          items: [
                            { productName: 'Classic Fit Cotton Denim', size: '32', color: 'Blue', price: 999, quantity: 1, total: 999 },
                            { productName: 'Premium Linen White Shirt', size: 'L', color: 'White', price: 1200, quantity: 2, total: 2400 }
                          ],
                          pricing: { subtotal: 3399, gstAmount: 170, discount: 0, totalAmount: 3399 }
                        }
                      });
                    }
                    setTimeout(() => {
                      window.print();
                    }, 200);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#C5A85A] to-[#E5C77A] text-charcoal rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-[#C5A85A]/10 border-0"
                >
                  🖨️ Print Test Receipt
                </button>
                <button 
                  onClick={() => setIsHelpOpen(false)}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all border-0"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Success Modal (SaaS Premium confirmation modal) */}
      {showSuccessModal && state.lastBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md print:hidden">
          <div className="bg-[#1C1C1C] border border-[#C5A85A]/30 rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-fade-in animate-duration-300 font-sans">
            
            {/* Visual confirmation icon */}
            <div className="p-8 text-center bg-black/20 border-b border-[#C5A85A]/10">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full mx-auto flex items-center justify-center text-emerald-500 mb-4 animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Transaction Successful</h3>
              <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-black mt-1">Bill generated & stock reconciled</p>
            </div>

            {/* Summary info */}
            <div className="p-6 space-y-4 text-gray-300">
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-gray-400 uppercase tracking-wider">Bill Number</span>
                <span className="font-bold text-white text-sm">#{state.lastBill.billNumber ? state.lastBill.billNumber.split('-').pop() : 'OFFLINE'}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-gray-400 uppercase tracking-wider">Patron</span>
                <span className="font-bold text-white">{state.lastBill.customerDetails?.name || 'Cash Sales'}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-1">
                <span className="text-[#C5A85A] uppercase tracking-wider font-bold">Net Total Amount</span>
                <span className="font-black text-white text-lg">₹{(state.lastBill.total || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="p-6 border-t border-[#C5A85A]/10 bg-black/40 flex flex-col gap-3">
              <button 
                onClick={() => {
                  toast.success('Spooling receipt...');
                  window.print();
                }}
                className="w-full py-4 bg-gradient-to-r from-[#C5A85A] to-[#E5C77A] text-charcoal rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.01] active:scale-99 transition-all shadow-lg shadow-[#C5A85A]/15 border-0 flex items-center justify-center gap-2"
              >
                🖨️ Print Receipt (Enter)
              </button>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-99 transition-all border border-white/10"
              >
                🆕 New Transaction (Esc)
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default function PosLayout() {
  return (
    <POSProvider>
      <PosContent />
    </POSProvider>
  );
}
