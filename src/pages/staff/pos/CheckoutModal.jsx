import { memo, useState, useEffect } from 'react';
import { X, CreditCard, Wallet, Banknote, Printer, ArrowRight, CheckCircle2, Smartphone, User, Phone, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePOS } from './POSContext';

const CheckoutModal = memo(({ onComplete }) => {
  const { state, dispatch } = usePOS();
  const { isCheckoutOpen, activeTab, cartSessions } = state;
  const session = cartSessions[activeTab];
  const { items, customer, discount, paymentSplit } = session;

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal - discount;

  const [localSplit, setLocalSplit] = useState(paymentSplit);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isCheckoutOpen) {
       setLocalSplit({ cash: total, upi: 0, card: 0 });
    }
  }, [isCheckoutOpen, total]);

  if (!isCheckoutOpen) return null;

  const handleQuickCash = (amount) => {
     setLocalSplit({ ...localSplit, cash: amount });
  };

  const handleFinish = async () => {
     setIsProcessing(true);
     await onComplete({ paymentSplit: localSplit });
     setIsProcessing(false);
  };

  const totalPaid = localSplit.cash + localSplit.upi + localSplit.card;
  const balance = Math.max(0, totalPaid - total);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-charcoal/80 backdrop-blur-xl"
          onClick={() => dispatch({ type: 'TOGGLE_CHECKOUT' })}
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white w-full admin-modal-container max-w-5xl h-[95vh] md:h-[85vh] rounded-t-[3rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
        >
           {/* Left: Summary & Split Payment */}
           <div className="flex-1 p-6 md:p-12 overflow-y-auto border-r border-border-light bg-[#FAFBFC]">
              <div className="flex items-center justify-between mb-12">
                 <div>
                    <h2 className="text-3xl font-black text-charcoal uppercase tracking-tighter">Enterprise Checkout</h2>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-green-500"></span> Session: Tab {activeTab + 1} • {items.length} Items
                    </p>
                 </div>
                 <button onClick={() => dispatch({ type: 'TOGGLE_CHECKOUT' })} className="p-4 bg-white rounded-2xl border border-border-light hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">
                    <X size={20} />
                 </button>
              </div>

              <div className="space-y-12">
                 {/* Split Payment Section */}
                 <div className="grid grid-cols-1 gap-10">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                          <Banknote size={12} /> Cash Payment Method
                       </label>
                       <div className="relative group">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-charcoal/20 group-focus-within:text-premium-gold transition-colors font-black text-xl">₹</div>
                          <input 
                             type="number"
                             className="w-full bg-white border-2 border-border-light rounded-[2rem] pl-12 pr-48 py-6 text-2xl font-black focus:border-premium-gold focus:ring-4 focus:ring-premium-gold/5 transition-all outline-none shadow-sm"
                             value={localSplit.cash}
                             onChange={(e) => setLocalSplit({...localSplit, cash: Number(e.target.value)})}
                          />
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2">
                             {[500, 1000, 2000].map(amt => (
                                <button key={amt} onClick={() => handleQuickCash(amt)} className="px-4 py-2.5 bg-light-bg rounded-xl text-[10px] font-black hover:bg-premium-gold transition-all shadow-sm border border-border-light active:scale-95">₹{amt}</button>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                             <Smartphone size={12} /> UPI / Online Transfer
                          </label>
                          <div className="relative group">
                             <div className="absolute left-6 top-1/2 -translate-y-1/2 text-charcoal/20 font-black text-xl">₹</div>
                             <input 
                                type="number"
                                className="w-full bg-white border-2 border-border-light rounded-[2rem] pl-12 pr-6 py-6 text-2xl font-black focus:border-premium-gold transition-all outline-none shadow-sm"
                                value={localSplit.upi}
                                onChange={(e) => setLocalSplit({...localSplit, upi: Number(e.target.value)})}
                             />
                          </div>
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                             <CreditCard size={12} /> Card Payment
                          </label>
                          <div className="relative group">
                             <div className="absolute left-6 top-1/2 -translate-y-1/2 text-charcoal/20 font-black text-xl">₹</div>
                             <input 
                                type="number"
                                className="w-full bg-white border-2 border-border-light rounded-[2rem] pl-12 pr-6 py-6 text-2xl font-black focus:border-premium-gold transition-all outline-none shadow-sm"
                                value={localSplit.card}
                                onChange={(e) => setLocalSplit({...localSplit, card: Number(e.target.value)})}
                             />
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Customer Enrichment */}
                 <div className="p-10 bg-white rounded-[3rem] border-2 border-border-light shadow-sm">
                    <h3 className="text-[10px] font-black text-charcoal uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                       <User size={12} className="text-premium-gold" /> Loyalty & Customer Profile
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <p className="text-[8px] font-black text-text-muted uppercase tracking-widest ml-1">Mobile Number</p>
                          <div className="relative">
                             <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                             <input 
                                className="w-full bg-light-bg/50 border-none rounded-xl pl-12 pr-4 py-4 text-xs font-bold focus:ring-2 focus:ring-premium-gold/20 outline-none"
                                placeholder="99999 00000"
                                value={customer.phone}
                                onChange={(e) => dispatch({ type: 'UPDATE_SESSION', payload: { customer: { ...customer, phone: e.target.value } } })}
                             />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <p className="text-[8px] font-black text-text-muted uppercase tracking-widest ml-1">Full Name</p>
                          <div className="relative">
                             <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                             <input 
                                className="w-full bg-light-bg/50 border-none rounded-xl pl-12 pr-4 py-4 text-xs font-bold focus:ring-2 focus:ring-premium-gold/20 outline-none"
                                placeholder="Search or Enter Name"
                                value={customer.name}
                                onChange={(e) => dispatch({ type: 'UPDATE_SESSION', payload: { customer: { ...customer, name: e.target.value } } })}
                             />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Right: Review & Pay (Premium Sidebar) */}
           <div className="w-full md:w-[400px] bg-charcoal p-12 flex flex-col justify-between text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <ShoppingCart size={120} />
              </div>

              <div className="space-y-10 relative z-10">
                 <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h3 className="text-sm font-black text-premium-gold uppercase tracking-[0.3em]">Bill Summary</h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full">
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                       <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Secure Link</span>
                    </div>
                 </div>
                 
                 <div className="space-y-5">
                    <div className="flex justify-between text-[11px] font-bold text-white/40 uppercase tracking-widest">
                       <span>Total Items Cost</span>
                       <span>₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-white/40 uppercase tracking-widest">
                       <span>GST (Inclusive)</span>
                       <span>₹{(subtotal * 0.05).toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                       <div className="flex justify-between text-[11px] font-black text-premium-gold uppercase tracking-widest">
                          <span>Merchant Discount</span>
                          <span>- ₹{discount.toLocaleString()}</span>
                       </div>
                    )}
                    
                    <div className="h-px bg-white/10 my-6"></div>
                    
                    <div className="flex justify-between items-end">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-premium-gold uppercase tracking-[0.3em] mb-1">Grand Total</span>
                          <span className="text-5xl font-black tracking-tighter">₹{total.toLocaleString()}</span>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                       <span className="text-white/40">Total Collected</span>
                       <span className={`transition-colors ${totalPaid >= total ? 'text-green-400' : 'text-red-400'}`}>₹{totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                       <span className="text-white/40">Balance / Change</span>
                       <span className={balance > 0 ? 'text-premium-gold' : 'text-white/20'}>₹{balance.toLocaleString()}</span>
                    </div>
                    {totalPaid < total && (
                       <div className="text-[8px] font-black text-red-500 uppercase tracking-widest animate-bounce">
                          Missing ₹{(total - totalPaid).toLocaleString()} to complete
                       </div>
                    )}
                 </div>
              </div>

              <div className="space-y-6 relative z-10">
                 <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block ml-1">Assigned Sales Executive</label>
                    <select 
                       className="w-full bg-charcoal border border-white/20 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-premium-gold transition-all"
                       value={session.salesStaffId}
                       onChange={(e) => dispatch({ type: 'UPDATE_SESSION', payload: { salesStaffId: e.target.value } })}
                    >
                       <option value="">Select Staff...</option>
                       {state.staffMembers?.map(s => (
                          <option key={s._id} value={s._id}>{s.name} ({s.role})</option>
                       ))}
                    </select>
                    {!session.salesStaffId && (
                       <p className="text-[8px] font-black text-red-400 uppercase tracking-widest animate-pulse">
                          ⚠️ Required for Commission Tracking
                       </p>
                    )}
                 </div>

                 <button 
                    onClick={handleFinish}
                    disabled={isProcessing || totalPaid < total || !session.salesStaffId}
                    className="w-full h-24 bg-premium-gold text-charcoal rounded-[2.5rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-premium-gold/20 flex flex-col items-center justify-center gap-1 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale transition-all group"
                 >
                    {isProcessing ? 'Processing Transaction...' : (
                       <>
                          <div className="flex items-center gap-3">
                             Confirm & Print <Printer size={22} className="group-hover:rotate-12 transition-transform" />
                          </div>
                          <span className="text-[8px] font-bold opacity-60">Professional Invoice Generation</span>
                       </>
                    )}
                 </button>
                 <div className="flex items-center justify-center gap-4 text-white/20 text-[8px] font-black uppercase tracking-[0.4em]">
                    <CheckCircle2 size={10} /> Secure Billing Active
                 </div>
               </div>
            </div>
         </motion.div>
      </div>
   </AnimatePresence>
  );
});

export default CheckoutModal;
