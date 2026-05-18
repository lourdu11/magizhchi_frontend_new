import { useProductForm } from './FormContext';
import { SectionHeader, InputField } from './Common';
import { Truck, Plus, Upload, CheckCircle2, Info } from 'lucide-react';
import { adminService } from '../../../services';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ProcurementTab({ suppliers, setActiveTab }) {
  const { state, dispatch } = useProductForm();
  const { formData } = state;
  const navigate = useNavigate();

  const setNestedField = (parent, field, value) => dispatch({ type: 'SET_NESTED_FIELD', parent, field, value });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await adminService.uploadImage(fd);
      const url = res.data?.url || res.data?.data?.url;
      if(url) setNestedField('initialProcurement', 'billImage', url);
    } catch(e) { toast.error('Upload failed'); }
  };

  return (
    <div className="space-y-12">
      <SectionHeader title="Logistics Entry" subtitle="Supply chain & procurement documentation" />
      
      <div className="p-10 bg-light-bg/30 rounded-[3rem] border border-border-light space-y-10">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black text-charcoal uppercase tracking-[0.3em] ml-2 flex items-center gap-2"><Truck size={14} className="text-premium-gold" /> Logistics Detail</h4>
          <button type="button" onClick={() => navigate('/admin/procurement/suppliers/new')} className="text-[9px] font-black text-premium-gold uppercase tracking-widest hover:underline flex items-center gap-1"><Plus size={12} /> New Partner</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Supplier Partner</label>
            <select 
              className="w-full bg-white border border-border-light rounded-2xl px-6 py-4 font-black text-xs uppercase outline-none focus:ring-4 focus:ring-premium-gold/10 transition-all shadow-sm"
              value={formData.initialProcurement.supplierId} 
              onChange={e => setNestedField('initialProcurement', 'supplierId', e.target.value)}
            >
              <option value="">Select Partner...</option>
              {suppliers.map(s => <option key={s._id} value={s._id}>{s.name} ({s.supplierId})</option>)}
            </select>
          </div>
          <InputField 
            label="Supplier Bill #" 
            value={formData.initialProcurement.billNumber} 
            onChange={v => setNestedField('initialProcurement', 'billNumber', v)} 
            placeholder="e.g. TAX/2024/99" 
          />
          <InputField 
            type="date" 
            label="Transaction Date" 
            value={formData.initialProcurement.billDate} 
            onChange={v => setNestedField('initialProcurement', 'billDate', v)} 
          />
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Attach Bill</label>
            <div className="relative h-[54px]">
              <input type="file" className="hidden" id="procurement-bill-upload" onChange={handleFileUpload} />
              <label htmlFor="procurement-bill-upload" className={`w-full h-full border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all ${formData.initialProcurement.billImage ? 'border-premium-gold bg-premium-gold/5 text-premium-gold' : 'border-border-light text-text-muted hover:border-premium-gold'}`}>
                {formData.initialProcurement.billImage ? <CheckCircle2 size={16} /> : <Upload size={16} />}
                <span className="text-[9px] font-black uppercase tracking-widest">{formData.initialProcurement.billImage ? 'Uploaded' : 'Upload PDF/Img'}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="p-10 bg-premium-gold/5 rounded-[3rem] border border-premium-gold/20">
        <div className="flex gap-6 items-start">
          <div className="w-12 h-12 bg-premium-gold rounded-2xl flex items-center justify-center text-charcoal shrink-0">
            <Info size={24} />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-charcoal uppercase tracking-[0.2em]">Procurement Protocol</h4>
            <p className="text-xs text-charcoal/70 font-medium mt-2 leading-relaxed">Opening stock counts should be entered in the <span className="font-black underline cursor-pointer" onClick={() => setActiveTab('variants')}>Variant Orchestration</span> tab. This logistics section is reserved for supply chain documentation and partner linking.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
