import { useProductForm } from './FormContext';
import { SectionHeader, InputField, StockSummaryBox } from './Common';
import { IndianRupee, Tag, Percent, AlertTriangle, DollarSign } from 'lucide-react';

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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-border-light">
        <StockSummaryBox label="Available Stock" value={formData.availableStock || 0} color="border-green-500" />
        <StockSummaryBox label="In Hand" value={formData.totalStock || 0} color="border-charcoal opacity-50" />
        <StockSummaryBox label="Reserved" value={formData.reservedStock || 0} color="border-blue-500 opacity-50" />
      </div>
    </div>
  );
}
