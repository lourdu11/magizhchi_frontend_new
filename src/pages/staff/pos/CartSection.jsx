import { memo } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, User, CreditCard, Smartphone, Banknote, X } from 'lucide-react';
import { usePOS } from './POSContext';
import { toast } from 'react-hot-toast';
import { getCloudinaryUrl } from '../../../utils/imageOptimizer';

const CartSection = memo(({ onComplete }) => {
  const { state, dispatch } = usePOS();
  const { activeTab, cartSessions, isMobileCartOpen } = state;
  const currentSession = cartSessions[activeTab];
  const { items, customer, discount, paymentMethod, salesStaffId } = currentSession;

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discount);

  const updateQty = (id, delta) => {
    dispatch({
      type: 'SET_ITEMS',
      payload: (prev) => prev.map(item => 
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    });
  };

  const removeItem = (id) => {
    dispatch({
      type: 'SET_ITEMS',
      payload: (prev) => prev.filter(item => item.id !== id)
    });
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      return toast.error('Cart is empty');
    }
    
    // Trigger direct checkout!
    onComplete();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileCartOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-[60]"
          onClick={() => dispatch({ type: 'TOGGLE_MOBILE_CART' })}
        />
      )}

      <div className={`
        fixed inset-y-0 right-0 z-[70] w-full max-w-[450px] bg-white shadow-2xl transition-transform duration-500 md:translate-x-0 md:static md:z-10 md:shadow-[-20px_0_60px_rgba(0,0,0,0.03)] md:flex
        ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex-1 flex flex-col min-h-0 h-full">
          
          {/* Cart Header */}
          <div className="p-6 space-y-4 border-b border-border-light bg-[#FAF9F5] relative">
            <button 
              onClick={() => dispatch({ type: 'TOGGLE_MOBILE_CART' })}
              className="md:hidden absolute top-6 right-6 p-2 bg-light-bg rounded-full text-text-muted hover:text-charcoal transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-charcoal rounded-xl flex items-center justify-center text-white shadow-lg">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h2 className="text-xs font-black text-charcoal uppercase tracking-tight">Active Bill</h2>
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{items.length} items</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (window.confirm('Clear all items from active cart?')) {
                    dispatch({ type: 'SET_ITEMS', payload: [] });
                  }
                }} 
                className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all mr-12 md:mr-0"
                title="Clear Cart"
              >
                 <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale py-12">
                <div className="w-20 h-20 bg-light-bg rounded-[2rem] flex items-center justify-center mb-4">
                   <ShoppingCart size={32} className="text-text-muted" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Items in Cart</p>
                <p className="text-[9px] font-bold text-text-muted mt-2">Add clothing garments to start billing</p>
              </div>
            ) : (
              items.map((item, idx) => (
                <div key={item.id || idx} className="flex gap-4 group bg-light-bg/30 p-3 rounded-2xl border border-transparent hover:border-border-light hover:bg-white transition-all">
                  <div className="w-14 h-14 bg-white rounded-xl overflow-hidden shrink-0 border border-border-light">
                    <img src={getCloudinaryUrl(item.image, { width: 100 })} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-[11px] font-black text-charcoal uppercase tracking-tight line-clamp-1">{item.name}</h4>
                      <button onClick={() => removeItem(item.id)} className="text-text-muted hover:text-red-500 transition-colors p-3 -m-3 min-w-[44px] min-h-[44px] flex items-center justify-center"><X size={18} /></button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[8px] font-black bg-charcoal text-white px-2 py-0.5 rounded uppercase tracking-tighter">{item.variantName}</span>
                       <span className="text-[9px] font-bold text-text-muted/60 tracking-widest">{item.sku}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center bg-white border border-border-light rounded-xl overflow-hidden">
                        <button onClick={() => updateQty(item.id, -1)} className="px-3 py-2 hover:bg-light-bg hover:text-premium-gold min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 transition-transform"><Minus size={16} /></button>
                        <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="px-3 py-2 hover:bg-light-bg hover:text-premium-gold min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 transition-transform"><Plus size={16} /></button>
                      </div>
                      <span className="text-[11px] font-black text-charcoal">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer & Transaction Configurations */}
          <div className="p-6 bg-white border-t border-border-light space-y-4">
             {/* Customer details inline */}
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Customer Name</label>
                   <input 
                      type="text"
                      placeholder="Guest Customer"
                      className="w-full bg-light-bg/50 border border-border-light rounded-xl px-3 py-2 text-xs font-bold focus:border-premium-gold focus:bg-white outline-none transition-all"
                      value={customer.name}
                      onChange={(e) => dispatch({ type: 'UPDATE_SESSION', payload: { customer: { ...customer, name: e.target.value } } })}
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Phone Number</label>
                   <input 
                      type="text"
                      placeholder="10-digit number"
                      className="w-full bg-light-bg/50 border border-border-light rounded-xl px-3 py-2 text-xs font-bold focus:border-premium-gold focus:bg-white outline-none transition-all"
                      value={customer.phone}
                      onChange={(e) => dispatch({ type: 'UPDATE_SESSION', payload: { customer: { ...customer, phone: e.target.value } } })}
                   />
                </div>
             </div>

             {/* Merchant Discount Box */}
             <div className="grid grid-cols-2 gap-3 items-center">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Merchant Discount (₹)</label>
                   <input 
                      type="number"
                      placeholder="₹0"
                      className="w-full bg-light-bg/50 border border-border-light rounded-xl px-3 py-2 text-xs font-bold focus:border-premium-gold focus:bg-white outline-none transition-all"
                      value={discount || ''}
                      onChange={(e) => dispatch({ type: 'UPDATE_SESSION', payload: { discount: Number(e.target.value) } })}
                   />
                </div>
                
                {/* Pay Split or quick buttons can fit here */}
                <div className="h-full pt-4 flex items-center justify-end">
                   <span className="text-[10px] font-black uppercase text-premium-gold tracking-widest">
                      Inclusive of GST
                   </span>
                </div>
             </div>

             {/* Direct Payment Method Selectors */}
             <div className="space-y-2">
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                   <button 
                      onClick={() => dispatch({ type: 'UPDATE_SESSION', payload: { paymentMethod: 'cash' } })}
                      className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1.5 transition-all ${paymentMethod === 'cash' ? 'bg-charcoal text-white border-charcoal shadow-md shadow-charcoal/10' : 'bg-white hover:bg-light-bg text-text-muted border-border-light'}`}
                   >
                      <Banknote size={14} />
                      <span>Cash</span>
                   </button>
                   <button 
                      onClick={() => dispatch({ type: 'UPDATE_SESSION', payload: { paymentMethod: 'upi' } })}
                      className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1.5 transition-all ${paymentMethod === 'upi' ? 'bg-charcoal text-white border-charcoal shadow-md shadow-charcoal/10' : 'bg-white hover:bg-light-bg text-text-muted border-border-light'}`}
                   >
                      <Smartphone size={14} />
                      <span>UPI / App</span>
                   </button>
                   <button 
                      onClick={() => dispatch({ type: 'UPDATE_SESSION', payload: { paymentMethod: 'card' } })}
                      className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1.5 transition-all ${paymentMethod === 'card' ? 'bg-charcoal text-white border-charcoal shadow-md shadow-charcoal/10' : 'bg-white hover:bg-light-bg text-text-muted border-border-light'}`}
                   >
                      <CreditCard size={14} />
                      <span>Card</span>
                   </button>
                </div>
             </div>
          </div>

          {/* Grand Summary & Print Trigger Box */}
          <div className="p-6 bg-charcoal text-white rounded-t-[2.5rem] space-y-4 shadow-2xl mt-auto">
            <div className="space-y-1.5">
               <div className="flex justify-between text-[9px] font-bold text-white/40 uppercase tracking-widest">
                  <span>Subtotal ({items.length} items)</span>
                  <span>₹{subtotal.toLocaleString()}</span>
               </div>
               {discount > 0 && (
                 <div className="flex justify-between text-[9px] font-black text-premium-gold uppercase tracking-widest">
                    <span>Discount Applied</span>
                    <span>- ₹{discount.toLocaleString()}</span>
                 </div>
               )}
               <div className="flex justify-between items-end pt-3 border-t border-white/10">
                  <span className="text-[10px] font-black text-premium-gold uppercase tracking-[0.25em]">Grand Net</span>
                  <span className="text-2xl font-black text-white">₹{total.toLocaleString()}</span>
               </div>
            </div>

            <button 
              onClick={handleCheckout}
              className="w-full h-14 bg-premium-gold text-charcoal hover:bg-[#D4AF37] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-premium-gold/10 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              Generate & Print Invoice
            </button>
          </div>
        </div>
      </div>
    </>
  );
});

export default CartSection;
