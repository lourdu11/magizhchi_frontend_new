import React from 'react';
import { Sparkles, User } from 'lucide-react';
import SafeImage from '../common/SafeImage';
import '../../print.css';

const InvoiceTemplate = React.forwardRef(({ order }, ref) => {
  if (!order) return null;

  const {
    orderNumber,
    createdAt,
    shippingAddress,
    items,
    pricing,
    paymentMethod
  } = order;

  // Normalize pricing for both online/offline structures
  const subtotal = pricing?.itemsTotal || pricing?.subtotal || 0;
  const shipping = pricing?.shippingFee || 0;
  const discount = pricing?.discount || 0;
  const total = pricing?.totalAmount || 0;
  const tax = pricing?.tax || pricing?.gstAmount || Math.round(subtotal * 0.05);

  return (
    <div 
      ref={ref} 
      id="bill-print"
      className="bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] overflow-hidden border border-white relative max-w-[800px] mx-auto"
    >
      {/* Header Section */}
      <div className="bg-[#121212] p-12 text-center text-white relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#D4AF37_0%,_transparent_70%)]" />
        <div className="w-16 h-16 bg-[#D4AF37] rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-[#D4AF37]/20">
          <Sparkles className="text-[#121212]" size={32} />
        </div>
        <h2 className="font-serif text-4xl font-black tracking-[0.4em] mb-2 uppercase">MAGIZHCHI</h2>
        <p className="text-[9px] text-[#D4AF37] font-black tracking-[0.6em] uppercase mb-8">Official Tax Invoice</p>
        
        <div className="inline-flex items-center gap-4 px-4 sm:px-6 py-2 bg-white/5 border border-white/10 rounded-full">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Order No.</span>
          <span className="text-sm font-black text-[#D4AF37]">#{orderNumber}</span>
        </div>
        
        <div className="mt-8 grid grid-cols-2 gap-4 text-left border-t border-white/5 pt-8">
          <div>
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Date & Time</p>
            <p className="text-[11px] font-bold text-white/80">{new Date(createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Channel</p>
            <p className="text-[11px] font-bold text-white/80">Online Store</p>
          </div>
        </div>
      </div>

      <div className="p-12 space-y-10">
        {/* Customer / Shipping Section */}
        <div className="p-4 sm:p-6 bg-[#F8F8F6]/50 rounded-[2rem] border border-[#EEEEEE] flex items-start justify-between">
          <div>
            <p className="text-[9px] font-black text-[#999999] uppercase tracking-[0.2em] mb-1">Deliver To</p>
            <p className="text-lg font-black text-[#121212]">{shippingAddress?.name || 'Customer'}</p>
            <p className="text-xs text-[#999999] font-bold mt-1 leading-relaxed">
              {shippingAddress?.addressLine1}<br />
              {shippingAddress?.city}, {shippingAddress?.state} - {shippingAddress?.pincode}<br />
              T: {shippingAddress?.phone}
            </p>
          </div>
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-[#D4AF37]">
            <User size={24} />
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2 border-b border-[#EEEEEE] pb-2">
            <h3 className="text-[10px] font-black text-[#999999] uppercase tracking-[0.4em]">Purchase Summary</h3>
            <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em]">{items?.length} Items</span>
          </div>
          <div className="space-y-4">
            {items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-[#EEEEEE] last:border-0 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-14 bg-[#F8F8F6] rounded-xl overflow-hidden border border-[#EEEEEE]">
                    <SafeImage src={item.productId?.images?.[0] || item.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#121212] tracking-tight">{item.productName}</p>
                    {item.isCombo ? (
                       <div className="mt-1 space-y-0.5">
                         {item.comboSelections?.map((sel, sIdx) => (
                           <p key={sIdx} className="text-[8px] text-[#999999] font-bold uppercase tracking-tight">
                             • {sel.productName} ({sel.size})
                           </p>
                         ))}
                       </div>
                    ) : (
                       <p className="text-[9px] text-[#999999] uppercase font-black tracking-widest mt-0.5">
                         {item.variant?.size || item.size} / {item.variant?.color || item.color} • ₹{item.price.toLocaleString()}
                       </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-[#999999] uppercase mb-1">x{item.quantity}</p>
                  <p className="text-sm font-black text-[#121212]">₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Section */}
        <div className="bg-[#121212] p-5 md:p-10 rounded-[2.5rem] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-bl-full" />
          <div className="space-y-3 relative z-10">
            <div className="flex justify-between text-[10px] font-black text-white/30 uppercase tracking-widest">
              <span>Subtotal Value</span><span>₹{subtotal.toLocaleString()}</span>
            </div>
            {shipping > 0 && (
              <div className="flex justify-between text-[10px] font-black text-white/30 uppercase tracking-widest">
                <span>Shipping Fee</span><span>₹{shipping.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-[10px] font-black text-white/30 uppercase tracking-widest">
              <span>GST (5%)</span><span>₹{tax.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                <span>Loyalty Discount</span><span>−₹{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="pt-6 border-t border-white/5 flex justify-between items-end">
              <div>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Total Payable</p>
                <p className="text-4xl font-black text-[#D4AF37] tracking-tighter">₹{total.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Payment Method</p>
                <p className="text-xs font-black uppercase tracking-widest text-white">{paymentMethod}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Terms */}
        <div className="text-center space-y-6 pt-4">
          <div className="flex items-center justify-center gap-4">
            <div className="h-px flex-1 bg-[#EEEEEE]" />
            <Sparkles size={16} className="text-[#D4AF37]/40" />
            <div className="h-px flex-1 bg-[#EEEEEE]" />
          </div>
          <p className="text-[9px] text-[#999999] leading-relaxed max-w-xs mx-auto italic">
            Thank you for choosing Magizhchi Garments. For exchanges, please present this invoice within 7 days.
          </p>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-[8px] font-black text-[#999999] uppercase tracking-widest mb-1">Website</p>
              <p className="text-[10px] font-bold text-[#121212]">magizhchi.com</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-[#999999] uppercase tracking-widest mb-1">Support</p>
              <p className="text-[10px] font-bold text-[#121212]">+91 98765 43210</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
