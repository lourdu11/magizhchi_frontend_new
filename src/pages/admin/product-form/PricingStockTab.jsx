import { useProductForm } from './FormContext';
import { SectionHeader, InputField, StockSummaryBox } from './Common';
import { IndianRupee, Tag, Percent, AlertTriangle, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PricingStockTab() {
  const { state, dispatch } = useProductForm();
  const { formData } = state;

  const setField = (field, value) => dispatch({ type: 'SET_FIELD', field, value });
  const setFormData = (payload) => dispatch({ type: 'SET_FORM_DATA', payload });

  return (
    <div className="space-y-12">
      <SectionHeader title="Finance & Inventory" subtitle="Costing, pricing and stock thresholds" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <InputField 
          type="number" 
          label="Procurement Cost (₹)" 
          value={formData.costPrice} 
          onChange={v => setField('costPrice', v)} 
          icon={IndianRupee} 
        />
        <InputField 
          type="number" 
          label="Selling Price (₹)" 
          value={formData.sellingPrice} 
          onChange={v => {
            const sp = Number(v);
            const amt = Math.round((sp * formData.discountPercentage) / 100);
            setFormData({
              sellingPrice: sp,
              discountAmount: amt,
              discountedPrice: sp - amt
            });
          }} 
          icon={IndianRupee} 
        />
        
        <div className="grid grid-cols-2 gap-6">
          <InputField 
            type="number" 
            label="Discount %" 
            value={formData.discountPercentage} 
            onChange={v => {
              const p = Number(v);
              const amt = Math.round((formData.sellingPrice * p) / 100);
              setFormData({ 
                discountPercentage: p, 
                discountAmount: amt,
                discountedPrice: formData.sellingPrice - amt
              });
            }} 
            icon={Percent} 
          />
          <InputField 
            type="number" 
            label="Off Price (₹)" 
            value={formData.discountAmount} 
            onChange={v => {
              const amt = Number(v);
              const p = formData.sellingPrice > 0 ? (amt / formData.sellingPrice) * 100 : 0;
              setFormData({ 
                discountAmount: amt, 
                discountPercentage: Number(p.toFixed(2)),
                discountedPrice: formData.sellingPrice - amt
              });
            }} 
            icon={Tag} 
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Net Price (Auto)</label>
            <div className="w-full bg-charcoal text-premium-gold rounded-2xl px-6 py-5 font-black text-lg shadow-inner">
              ₹{Number(formData.discountedPrice || (formData.sellingPrice - formData.discountAmount)).toLocaleString()}
            </div>
          </div>
          <InputField 
            type="number" 
            label="Low Stock Alert" 
            value={formData.lowStockThreshold} 
            onChange={v => setField('lowStockThreshold', v)} 
            icon={AlertTriangle} 
          />
        </div>
      </div>

      {/* Multi-Buy Promotion (Buy X for Y) */}
      <div className="pt-12 border-t border-border-light space-y-6">
        <SectionHeader title="Multi-Buy Promotion" subtitle="Set special discounts for bulk purchases (e.g., Buy 2 for Rs.1,599)" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Card Toggle */}
          <button
            type="button"
            onClick={() => setField('multiBuyEnabled', !formData.multiBuyEnabled)}
            className={`p-8 rounded-[2.5rem] border-2 text-left flex flex-col gap-4 group transition-all relative overflow-hidden ${
              formData.multiBuyEnabled
                ? 'border-charcoal bg-white shadow-xl'
                : 'border-border-light bg-light-bg/30 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 ${
              formData.multiBuyEnabled ? 'text-premium-gold bg-charcoal' : 'text-text-muted bg-white'
            }`}>
              <Tag size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-charcoal uppercase tracking-wider">Enable Promo</h4>
              <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-1">Activate Multi-Buy Pricing Rule</p>
            </div>
            {formData.multiBuyEnabled && (
              <div className="absolute top-6 right-6 w-3 h-3 bg-premium-gold rounded-full" />
            )}
          </button>

          {/* Conditional Inputs */}
          {formData.multiBuyEnabled ? (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="md:col-span-2 grid grid-cols-2 gap-6 bg-light-bg/20 p-8 rounded-[2.5rem] border border-border-light"
            >
              <InputField 
                type="number" 
                label="Trigger Quantity" 
                placeholder="2"
                value={formData.multiBuyQuantity} 
                onChange={v => setField('multiBuyQuantity', Number(v) || 0)} 
                icon={Percent} 
              />
              <InputField 
                type="number" 
                label="Promo Price (₹)" 
                placeholder="1599"
                value={formData.multiBuyPrice} 
                onChange={v => setField('multiBuyPrice', Number(v) || 0)} 
                icon={IndianRupee} 
              />
            </motion.div>
          ) : (
            <div className="md:col-span-2 p-8 rounded-[2.5rem] border border-dashed border-border-light flex flex-col justify-center text-center min-h-[140px]">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Promotion Inactive</p>
              <p className="text-[9px] text-text-muted/60 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                Enable multi-buy to specify pricing rules for customers purchasing multiples of this product.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-border-light">
        <StockSummaryBox label="Available Stock" value={formData.availableStock || 0} color="border-green-500" />
        <StockSummaryBox label="In Hand" value={formData.totalStock || 0} color="border-charcoal opacity-50" />
        <StockSummaryBox label="Reserved" value={formData.reservedStock || 0} color="border-blue-500 opacity-50" />
      </div>
    </div>
  );
}
