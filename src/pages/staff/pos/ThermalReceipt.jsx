import { memo } from 'react';
import { usePOS } from './POSContext';

const ThermalReceipt = memo(() => {
  const { state } = usePOS();
  const { lastBill } = state;

  const billObj = lastBill ? (lastBill.bill || lastBill) : {
    billNumber: 'MAG-TEST-0001',
    createdAt: new Date().toISOString(),
    date: new Date().toISOString(),
    customerDetails: { name: 'Test Patron', phone: '9876543210' },
    paymentMethod: 'cash',
    items: [
      { productName: 'Classic Fit Cotton Denim', price: 999, quantity: 1, variantName: '32 / Blue', size: '32', color: 'Blue' },
      { productName: 'Premium Linen White Shirt', price: 1200, quantity: 2, variantName: 'L / White', size: 'L', color: 'White' }
    ],
    discount: 0
  };
  
  // Detect if prices are in paise (saved database bills store prices in paise/cents)
  const isPaise = !!billObj.pricing || (billObj.items && billObj.items.some(i => Number(i.price) > 5000));
  
  const rawItems = billObj.items || [];
  const items = isPaise 
    ? rawItems.map(i => ({ ...i, price: Number(i.price) / 100 }))
    : rawItems;
    
  const discount = isPaise
    ? (Number(billObj.discount || billObj.pricing?.discount || 0) / 100)
    : Number(billObj.discount || 0);

  const { 
    billNumber, 
    createdAt, 
    date, 
    customerDetails, 
    paymentMethod,
    paymentSplit
  } = billObj;

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
    <div id="thermal-receipt" className="w-[80mm] p-2 font-mono text-black bg-white select-none leading-tight">
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            background: white;
            color: black;
            font-family: monospace;
          }
        }
      `}</style>
      
      {/* Header Info */}
      <div className="text-center space-y-0.5">
        {/* Official Crop-fitted Logo with high-contrast sharp scaling & bold brand header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '4px' }}>
          <img 
            src="/receipt_logo.png" 
            alt="MAGIZHCHI" 
            style={{ 
              width: '75px',
              height: '75px',
              objectFit: 'contain',
              display: 'block',
              imageRendering: 'pixelated',
              imageRendering: 'crisp-edges',
              WebkitImageRendering: 'optimize-contrast',
              printColorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact'
            }}
          />
          <h1 className="text-[18px] font-black uppercase tracking-wider mt-1.5 font-mono text-black">மகிழ்ச்சி GARMENTS</h1>
        </div>
        
        <p className="text-[13px] font-bold uppercase leading-none mt-1">Old Bus Stand,Thanjavur - 613006</p>
        <p className="text-[12px] leading-none mt-0.5">Ph :73588 85452,Cell :</p>
        <p className="text-[12px] font-bold leading-none mt-0.5">GST: 33EZWPD8703E1Z8</p>
        
        <div className="text-[14px] border-t border-b border-dashed border-black py-0.5 my-1.5 uppercase font-bold tracking-widest">
          Cash Bill
        </div>
      </div>

      {/* Bill Meta Data */}
      <div className="text-[12.5px] space-y-0.5">
        <div className="flex justify-between">
          <span className="font-bold">To: {customerDetails?.name || 'Cash Sales'}</span>
          <span>Date : {formattedDate}/{formattedTime}</span>
        </div>
        <div className="text-center font-bold text-[14px] py-1">
          Bill : {billNumber ? (billNumber.split('-').pop()?.replace('MAG', '') || billNumber) : String(Math.floor(1000 + Math.random() * 9000))}
        </div>
      </div>

      {/* Items Table */}
      <div className="text-[12.5px] mt-1.5">
        <div className="border-t border-b border-dashed border-black py-1 flex justify-between font-bold">
          <span className="w-1/2 text-left">Item(s)</span>
          <span className="w-12 text-center">Qty</span>
          <span className="w-16 text-right">Rate</span>
          <span className="w-16 text-right">Total</span>
        </div>
        
        <div className="pt-1 space-y-0.5">
          {items?.map((item, idx) => {
            const itemTotal = item.price * item.quantity;
            const sizeStr = item.size && item.size !== 'Free Size' ? ` (${item.size})` : '';
            const colorStr = item.color && item.color !== 'Default' ? ` - ${item.color}` : '';
            const displayName = `${item.productName || item.name}${sizeStr}${colorStr}`;
            return (
              <div key={idx} className="flex justify-between text-[12px] leading-tight font-mono py-0.5">
                <span className="w-1/2 text-left truncate uppercase font-bold">{displayName}</span>
                <span className="w-12 text-center font-bold">{item.quantity}</span>
                <span className="w-16 text-right">{Number(item.price).toFixed(2)}</span>
                <span className="w-16 text-right font-bold">{itemTotal.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totals Section */}
      <div className="border-t border-dashed border-black mt-1.5 pt-1 text-[12.5px] space-y-0.5 font-bold">
        {/* Quantity Total summary row */}
        <div className="flex justify-between">
          <span>{totalQty}  Item(s)     Total   {totalQty}   :</span>
          <span>{subtotal.toFixed(2)}</span>
        </div>

        {/* Discount Row (If active) */}
        {discount > 0 && (
          <div className="flex justify-between text-gray-800">
            <span>                 Discount {((discount / subtotal) * 100).toFixed(0)} % :</span>
            <span>{discount.toFixed(2)}</span>
          </div>
        )}

        {/* Round Off Row */}
        <div className="flex justify-between text-gray-700 font-normal">
          <span>R.Off</span>
          <span>0.00</span>
        </div>

        {/* Net Amount Row with dashed borders */}
        <div className="border-t border-b border-dashed border-black py-0.5 flex justify-between items-center my-1 text-[15.5px] font-black uppercase tracking-wider">
          <span>Amount</span>
          <span>{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Composition Scheme / Legal Declarations */}
      <div className="text-center text-[11.5px] space-y-0.5 mt-2.5 pt-1 leading-tight font-mono">
        <p className="font-black text-[12.5px] uppercase tracking-wider">Composition Supplier</p>
        <p>Goods Once Sold, Can't Be Taken Back</p>
        <p className="font-bold">No Exchange And Refund</p>
        <p className="font-bold">*Composition Scheme Under GST Act</p>
        <p className="text-[13px] font-black italic mt-2 uppercase tracking-wide">
          Thank You ! Visit Again
        </p>
      </div>

      {/* SaaS POS Branding (Tiny) */}
      <div className="text-center text-[9px] text-gray-400 mt-4 leading-none">
        Powered by Magizhchi SaaS ERP
      </div>
    </div>
  );
});

ThermalReceipt.displayName = 'ThermalReceipt';

export default ThermalReceipt;
