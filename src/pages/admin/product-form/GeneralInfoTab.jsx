import { useProductForm } from './FormContext';
import { SectionHeader, InputField } from './Common';
import { useEffect, useRef, useState } from 'react';
import { Barcode, RefreshCw, Printer, CheckCircle } from 'lucide-react';
import JsBarcode from 'jsbarcode';

// ── EAN-13 Generator (Valid check digit) ─────────────────
function generateEAN13() {
  // Prefix 890 = India country code
  const prefix = '890';
  const mid = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const base = prefix + mid + rand; // 12 digits
  // Calculate check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return base + check;
}

// ── Barcode SVG renderer using JsBarcode ─────────────────
function BarcodePreview({ value, productName, price }) {
  const svgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!value || !svgRef.current) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: 'EAN13',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        fontOptions: 'bold',
        margin: 8,
        background: '#ffffff',
        lineColor: '#000000',
      });
      setLoaded(true);
    } catch (e) {
      console.error('JsBarcode render error:', e);
    }
  }, [value]);

  if (!value) return null;

  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      {/* Printable Label */}
      <div id="barcode-label-preview" className="flex flex-col items-center bg-white border border-border-light rounded-2xl p-4 shadow-sm" style={{ width: '200px' }}>
        <p className="text-[10px] font-black text-charcoal uppercase text-center leading-tight mb-1 line-clamp-1">{productName || 'Product Name'}</p>
        {price > 0 && <p className="text-sm font-black text-charcoal mb-2">₹{price}</p>}
        <svg ref={svgRef} />
      </div>
    </div>
  );
}

export default function GeneralInfoTab({ categories }) {
  const { state, dispatch } = useProductForm();
  const { formData } = state;

  const setField = (field, value) => dispatch({ type: 'SET_FIELD', field, value });

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <SectionHeader title="Product Identity" subtitle="Core identification and narrative" />
        <div className="flex bg-light-bg p-1.5 rounded-2xl border border-border-light/50">
          <button 
            onClick={() => setField('productNature', 'standalone')} 
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.productNature === 'standalone' ? 'bg-white text-charcoal shadow-sm border border-border-light/50' : 'text-text-muted hover:text-charcoal'}`}
          >
            Standalone
          </button>
          <button 
            onClick={() => setField('productNature', 'combo')} 
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.productNature === 'combo' ? 'bg-white text-charcoal shadow-sm border border-border-light/50' : 'text-text-muted hover:text-charcoal'}`}
          >
            Combo/Bundle
          </button>
        </div>
      </div>

      <div className="bg-light-bg/20 p-6 md:p-8 rounded-[2.5rem] border border-border-light/50 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <InputField 
            label="Product Name" 
            value={formData.name} 
            onChange={v => setField('name', v)} 
            placeholder="e.g. Cotton Polo T-Shirt" 
            required 
          />
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Category Master</label>
            <select 
              className="w-full bg-white border border-border-light shadow-sm rounded-2xl px-5 py-4 font-black text-xs text-charcoal uppercase appearance-none focus:ring-4 focus:ring-premium-gold/10 transition-all outline-none" 
              value={formData.category} 
              onChange={e => setField('category', e.target.value)}
            >
              <option value="">Select Category...</option>
              {categories?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <InputField 
            label="Base SKU (Optional)" 
            value={formData.sku} 
            onChange={v => setField('sku', v.toUpperCase())} 
            placeholder="REF-0001" 
          />
        </div>
      </div>

      {/* ── BARCODE MANAGEMENT SECTION ───────────────────── */}
      <div className="bg-light-bg/20 p-6 md:p-8 rounded-[2.5rem] border border-border-light/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-premium-gold/10 p-2.5 rounded-xl">
            <Barcode size={18} className="text-premium-gold" />
          </div>
          <div>
            <h4 className="text-sm font-black text-charcoal uppercase tracking-tight">Barcode Management</h4>
            <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-0.5">EAN-13 • Retsol LS Scanner Compatible</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Barcode Number (EAN-13)</label>
                <div className="flex gap-4">
                   <input
                     type="text"
                     className="flex-1 bg-white border border-border-light shadow-sm rounded-2xl px-5 py-4 font-black text-xs text-charcoal tracking-[0.2em] focus:ring-4 focus:ring-premium-gold/10 transition-all outline-none font-mono"
                     placeholder="Auto-generate or type..."
                     value={formData.barcode || ''}
                     onChange={e => setField('barcode', e.target.value)}
                     maxLength={13}
                   />
                   <button
                     type="button"
                     onClick={() => {
                       const code = generateEAN13();
                       setField('barcode', code);
                     }}
                     className="flex justify-center items-center gap-2 px-6 py-4 bg-premium-gold text-charcoal rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-premium-gold/80 active:scale-95 transition-all shadow-md whitespace-nowrap"
                   >
                     <RefreshCw size={14} />
                     Auto-Generate
                   </button>
                </div>
              </div>

              {formData.barcode?.length === 13 && (
                <div className="text-[9px] font-black text-green-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <CheckCircle size={12} />
                  Valid EAN-13 — Ready to print & scan!
                </div>
              )}
              {formData.barcode && formData.barcode.length !== 13 && (
                <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest ml-1">
                  ⚠️ EAN-13 needs exactly 13 digits ({formData.barcode.length}/13)
                </div>
              )}
           </div>

           <div className="flex flex-col items-center justify-center">
              <BarcodePreview
                value={formData.barcode?.length === 13 ? formData.barcode : null}
                productName={formData.name}
                price={formData.sellingPrice}
              />
              {formData.barcode?.length === 13 && (
                <button
                  type="button"
                  onClick={() => {
                    const label = document.getElementById('barcode-label-preview');
                    if (!label) return;
                    const printWin = window.open('', '_blank', 'width=300,height=250');
                    printWin.document.write(`
                      <html><head><title>Barcode Label</title>
                      <style>
                        body { margin: 0; padding: 8px; font-family: sans-serif; }
                        @media print { body { margin: 0; } }
                      </style></head>
                      <body>${label.outerHTML}<script>window.onload=()=>window.print()<\/script></body></html>
                    `);
                    printWin.document.close();
                  }}
                  className="flex items-center gap-2 mt-4 px-6 py-3.5 bg-charcoal text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-charcoal/80 active:scale-95 transition-all shadow-md"
                >
                  <Printer size={14} />
                  Print Label
                </button>
              )}
           </div>
        </div>
      </div>

      <div className="bg-light-bg/20 p-6 md:p-8 rounded-[2.5rem] border border-border-light/50 space-y-4">
        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Product Description</label>
        <textarea 
          rows={6} 
          className="w-full bg-white border border-border-light shadow-sm rounded-3xl p-6 text-sm font-medium text-charcoal focus:ring-4 focus:ring-premium-gold/10 transition-all resize-none outline-none" 
          placeholder="Engaging story or details..." 
          value={formData.description} 
          onChange={e => setField('description', e.target.value)} 
        />
      </div>

      <div className="bg-light-bg/20 p-6 md:p-8 rounded-[2.5rem] border border-border-light/50">
        <div className="flex flex-wrap gap-8">
          <label className="flex items-center flex-wrap gap-4 cursor-pointer group">
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded-md border-border-light text-premium-gold focus:ring-premium-gold cursor-pointer" 
              checked={formData.isFeatured} 
              onChange={e => setField('isFeatured', e.target.checked)} 
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-charcoal group-hover:text-premium-gold transition-colors">Featured Product</span>
          </label>
          <label className="flex items-center flex-wrap gap-4 cursor-pointer group">
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded-md border-border-light text-premium-gold focus:ring-premium-gold cursor-pointer" 
              checked={formData.isTrending} 
              onChange={e => setField('isTrending', e.target.checked)} 
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-charcoal group-hover:text-premium-gold transition-colors">Popular Product</span>
          </label>
          <label className="flex items-center flex-wrap gap-4 cursor-pointer group">
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded-md border-border-light text-premium-gold focus:ring-premium-gold cursor-pointer" 
              checked={formData.isActive} 
              onChange={e => setField('isActive', e.target.checked)} 
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-charcoal group-hover:text-premium-gold transition-colors">Profile Active</span>
          </label>
        </div>
      </div>
    </div>
  );
}
