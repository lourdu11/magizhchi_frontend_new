import { memo, forwardRef } from 'react';
import { usePOS } from './POSContext';

const ThermalReceipt = memo(forwardRef(({ bill: propBill }, ref) => {
  let state = null;
  try {
    const posContext = usePOS();
    state = posContext?.state;
  } catch (e) {
    // POS Context not active, ignore
  }
  const lastBill = state?.lastBill;

  const billObj = propBill || lastBill ? (propBill || lastBill.bill || lastBill) : {
    billNumber: 'MAG-TEST-0001',
    createdAt: new Date().toISOString(),
    customerDetails: { name: 'Test Patron', phone: '9876543210' },
    paymentMethod: 'cash',
    items: [
      { productName: 'Classic Fit Cotton Denim', price: 999, quantity: 1, size: '32', color: 'Blue' },
      { productName: 'Premium Linen White Shirt', price: 1200, quantity: 2, size: 'L', color: 'White' }
    ],
    discount: 0
  };
  
  // Normalize items
  const rawItems = billObj.items || [];
  
  // Detect if prices are in paise (saved database POS bills store prices in paise/cents)
  const isSavedBill = !!billObj.billNumber && (
    (billObj.pricing?.subtotal > 5000) || 
    (rawItems.length > 0 && Number(rawItems[0].price) > 5000)
  );

  const items = rawItems.map(i => {
    const rawPrice = Number(i.price || 0);
    const rawTotal = Number(i.total || (i.price * i.quantity));
    
    return {
      ...i,
      size: i.size || i.variant?.size,
      color: i.color || i.variant?.color,
      price: isSavedBill ? rawPrice / 100 : rawPrice,
      total: isSavedBill ? rawTotal / 100 : rawTotal
    };
  });
     
  const discount = isSavedBill
    ? (Number(billObj.discount || billObj.pricing?.discount || billObj.pricing?.couponDiscount || 0) / 100)
    : Number(billObj.discount || billObj.pricing?.discount || billObj.pricing?.couponDiscount || 0);

  const billNumber = billObj.billNumber || billObj.orderNumber || '875282';
  const createdAt = billObj.createdAt || billObj.date;
  const date = billObj.date || billObj.createdAt;
  const paymentMethod = billObj.paymentMethod;

  const customerDetails = (billObj.customerDetails && billObj.customerDetails.name) 
    ? billObj.customerDetails 
    : {
        name: billObj.shippingAddress?.name || billObj.guestDetails?.name || billObj.customerDetails?.name || 'Cash Sales',
        phone: billObj.shippingAddress?.phone || billObj.guestDetails?.phone || billObj.customerDetails?.phone || ''
      };

  // Calculate prices
  const subtotal = items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const total = subtotal - discount;

  // Count items and quantities
  const totalItemsCount = items?.length || 0;
  const totalQty = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Formatted date and time matching the thermal printer style
  const billDateObj = date || createdAt ? new Date(date || createdAt) : new Date();
  const formattedDate = billDateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }).replace(/\//g, '.');
  
  const formattedTime = billDateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div 
      ref={ref}
      id="thermal-receipt" 
      className="p-3 font-mono text-black bg-white select-none leading-relaxed tracking-tight mx-auto"
      style={{
        width: '100%',
        maxWidth: '80mm',
        boxSizing: 'border-box',
        fontSize: '12px'
      }}
    >
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            background: white;
            color: black;
            font-family: monospace !important;
          }
          #thermal-receipt {
            visibility: visible !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 8px !important;
            margin: 0 !important;
            background: white !important;
            box-sizing: border-box !important;
          }
          #thermal-receipt * {
            visibility: visible !important;
          }
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>
      
      {/* Header Info */}
      <div className="text-center flex flex-col items-center">
        {/* Official Crop-fitted Logo with high-contrast sharp scaling & bold brand header */}
        <div className="flex flex-col items-center mb-3">
          <img 
            src="/receipt_logo.png" 
            alt="MAGIZHCHI" 
            className="block"
            style={{ 
              width: '85px',
              height: '85px',
              objectFit: 'contain',
              imageRendering: 'crisp-edges',
              WebkitImageRendering: 'optimize-contrast',
              printColorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact'
            }}
          />
          <h1 className="text-[17px] font-black uppercase tracking-wider mt-2 font-mono text-black text-center w-full">
            மகிழ்ச்சி GARMENTS
          </h1>
        </div>
        
        <p className="text-[12px] font-bold uppercase leading-tight text-center w-full">
          Old Bus Stand, Thanjavur - 613006
        </p>
        <p className="text-[11px] leading-tight mt-1 text-center w-full">
          Ph: 73588 85452, Cell:
        </p>
        <p className="text-[11px] font-bold leading-tight mt-0.5 text-center w-full">
          GST: 33EZWPD8703E1Z8
        </p>
        
        <div className="text-[13px] border-t border-b border-dashed border-black w-full py-1 my-2 uppercase font-black tracking-widest text-center">
          CASH BILL
        </div>
      </div>

      {/* Bill Meta Data */}
      <div className="text-[11px] space-y-1 my-2">
        <div className="flex justify-between w-full">
          <span className="font-bold">
            Bill No: {billNumber || '875282'}
          </span>
          <span>Date: {formattedDate}</span>
        </div>
        <div className="flex justify-between w-full">
          <span>Time: {formattedTime}</span>
          <span className="font-bold uppercase">POS TERMINAL</span>
        </div>
        
        <div className="border-t border-dotted border-black/40 my-1 w-full"></div>
        
        {customerDetails?.name ? (
          <div className="w-full">
            <div className="flex justify-between w-full">
              <span className="font-bold">Customer: {customerDetails.name}</span>
            </div>
            {customerDetails.phone && (
              <div className="flex justify-between w-full mt-0.5">
                <span>Phone: {customerDetails.phone}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-between w-full">
            <span className="font-bold">Customer: Cash Sales</span>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="text-[11px] mt-3">
        {/* Table Header */}
        <div className="border-t border-b border-dashed border-black py-1 flex justify-between font-bold w-full">
          <span className="w-[45%] text-left">Item(s)</span>
          <span className="w-[15%] text-center">Qty</span>
          <span className="w-[20%] text-right">Rate</span>
          <span className="w-[20%] text-right">Total</span>
        </div>
        
        {/* Table Body */}
        <div className="pt-1.5 space-y-1.5 w-full">
          {items?.map((item, idx) => {
            const itemTotal = item.price * item.quantity;
            const sizeStr = item.size && item.size !== 'Free Size' ? ` (${item.size})` : '';
            const colorStr = item.color && item.color !== 'Default' ? ` - ${item.color}` : '';
            const displayName = `${item.productName || item.name}${sizeStr}${colorStr}`;
            return (
              <div key={idx} className="flex justify-between leading-snug w-full items-start font-mono">
                <span className="w-[45%] text-left uppercase font-bold text-[11px] break-words pr-1">
                  {displayName}
                </span>
                <span className="w-[15%] text-center font-bold">{item.quantity}</span>
                <span className="w-[20%] text-right">{Number(item.price).toFixed(2)}</span>
                <span className="w-[20%] text-right font-bold">{itemTotal.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totals Section */}
      <div className="border-t border-dashed border-black mt-3 pt-1 text-[11px] space-y-1 font-bold w-full">
        {/* Total Summary Row */}
        <div className="flex justify-between w-full">
          <span>Total Qty: {totalQty} Item(s)</span>
          <span>{subtotal.toFixed(2)}</span>
        </div>

        {/* Discount Row (If active) */}
        {discount > 0 && (
          <div className="flex justify-between w-full text-black">
            <span>Discount ({((discount / subtotal) * 100).toFixed(0)}%):</span>
            <span>-{discount.toFixed(2)}</span>
          </div>
        )}

        {/* Round Off Row */}
        <div className="flex justify-between w-full font-normal">
          <span>R.Off:</span>
          <span>0.00</span>
        </div>

        {/* Net Amount Row with extra spacing and bold display */}
        <div className="border-t-2 border-b-2 border-double border-black py-2 mt-2 mb-2 flex justify-between items-center w-full text-[15px] font-black uppercase tracking-wider">
          <span>GRAND TOTAL</span>
          <span>Rs. {total.toFixed(2)}</span>
        </div>
      </div>

      {/* Instagram Profile Addition */}
      <div className="text-center text-[11px] font-bold my-3 py-1 bg-black/5 rounded border border-dashed border-black/20 w-full flex flex-col items-center justify-center">
        <span className="tracking-wide">📸 Instagram: @magizhchi_garments_official</span>
        <span className="text-[8px] text-gray-500 font-normal mt-0.5 select-all">
          https://www.instagram.com/magizhchi_garments_official/
        </span>
      </div>

      {/* Composition Scheme / Legal Declarations */}
      <div className="text-center text-[10.5px] space-y-1 mt-3 leading-tight w-full flex flex-col items-center">
        <p className="font-black text-[11.5px] uppercase tracking-wider">
          COMPOSITION SUPPLIER
        </p>
        <p className="w-full text-center">Goods Once Sold, Can't Be Taken Back</p>
        <p className="font-bold w-full text-center">No Exchange And Refund</p>
        <p className="font-bold w-full text-center">*Composition Scheme Under GST Act</p>
        <p className="text-[12.5px] font-black italic mt-3 uppercase tracking-wider w-full text-center">
          THANK YOU ! VISIT AGAIN
        </p>
      </div>

      {/* SaaS POS Branding (Tiny) */}
      <div className="text-center text-[8px] text-gray-400 mt-5 leading-none w-full">
        Powered by Magizhchi SaaS ERP
      </div>
    </div>
  );
}));

ThermalReceipt.displayName = 'ThermalReceipt';

export default ThermalReceipt;
