import { useProductForm } from './FormContext';
import { SectionHeader, InputField } from './Common';

export default function GeneralInfoTab({ categories }) {
  const { state, dispatch } = useProductForm();
  const { formData } = state;

  const setField = (field, value) => dispatch({ type: 'SET_FIELD', field, value });

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <SectionHeader title="Product Identity" subtitle="Core identification and narrative" />
        <div className="flex bg-light-bg p-1 rounded-2xl">
          <button 
            onClick={() => setField('productNature', 'standalone')} 
            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.productNature === 'standalone' ? 'bg-white text-charcoal shadow-sm' : 'text-text-muted hover:text-charcoal'}`}
          >
            Standalone
          </button>
          <button 
            onClick={() => setField('productNature', 'combo')} 
            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.productNature === 'combo' ? 'bg-white text-charcoal shadow-sm' : 'text-text-muted hover:text-charcoal'}`}
          >
            Combo/Bundle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
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
            className="w-full bg-light-bg/50 border-none rounded-2xl px-6 py-5 font-black text-xs uppercase focus:ring-4 focus:ring-premium-gold/10 transition-all outline-none" 
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

      <div className="space-y-4">
        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Product Description</label>
        <textarea 
          rows={6} 
          className="w-full bg-light-bg/50 border-none rounded-[2.5rem] p-8 text-sm font-medium focus:ring-4 focus:ring-premium-gold/10 transition-all resize-none outline-none" 
          placeholder="Engaging story or details..." 
          value={formData.description} 
          onChange={e => setField('description', e.target.value)} 
        />
      </div>

      <div className="flex flex-wrap gap-8">
        <div className="flex items-center gap-4">
          <input 
            type="checkbox" 
            className="w-6 h-6 rounded-lg border-border-light text-premium-gold focus:ring-premium-gold" 
            checked={formData.isFeatured} 
            onChange={e => setField('isFeatured', e.target.checked)} 
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-charcoal">Featured Product</span>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="checkbox" 
            className="w-6 h-6 rounded-lg border-border-light text-premium-gold focus:ring-premium-gold" 
            checked={formData.isTrending} 
            onChange={e => setField('isTrending', e.target.checked)} 
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-charcoal">Popular Product</span>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="checkbox" 
            className="w-6 h-6 rounded-lg border-border-light text-premium-gold focus:ring-premium-gold" 
            checked={formData.isActive} 
            onChange={e => setField('isActive', e.target.checked)} 
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-charcoal">Profile Active</span>
        </div>
      </div>
    </div>
  );
}
