import { useState, useEffect } from 'react';
import { useProductForm } from './FormContext';
import { SectionHeader, InputField } from './Common';
import { Trash2, Layers, Sparkles, X, Plus, PlusCircle, Upload, ImageIcon, Loader2, Edit3, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminService } from '../../../services';
import SafeImage from '../../../components/common/SafeImage';
import { resolveAssetURL } from '../../../utils/assetResolver';

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '30', '32', '34', '36', '38', '40', 'FREE'];

export default function VariantsTab() {
  const { state, dispatch } = useProductForm();
  const { formData } = state;

  const setField = (field, value) => dispatch({ type: 'SET_FIELD', field, value });

  return (
    <div className="space-y-12">
      <SectionHeader title="Variant Orchestration" subtitle="Multi-selection & initial stock inflow" />
      <VariantManagerSection 
        productName={formData.name} 
        variants={formData.variants} 
        basePrice={formData.sellingPrice}
        onUpdate={(v) => setField('variants', v)} 
      />
    </div>
  );
}

function VariantManagerSection({ productName, variants, basePrice, onUpdate }) {
  const [multiMode, setMultiMode] = useState(true);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [initialQty, setInitialQty] = useState(0);
  const [colorInput, setColorInput] = useState('');
  const [newV, setNewV] = useState({ size: '', color: '', sku: '', available: 0, image: '' });
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ size: '', color: '', sku: '', available: 0, image: '' });
  const [activeVariants, setActiveVariants] = useState([]);
  const [uploadingVariantId, setUploadingVariantId] = useState(null);

  const handleSaveEdit = (variantId) => {
    if (!editValues.color || !editValues.size) {
      toast.error('Color and Size are mandatory');
      return;
    }
    
    // Check for duplicate color/size (excluding itself)
    const exists = activeVariants.find(v => v._id !== variantId && v.color.toLowerCase() === editValues.color.toLowerCase() && v.size === editValues.size);
    if (exists) {
      toast.error('A variant with this color and size combination already exists');
      return;
    }

    onUpdate(variants.map(v => {
      if (v._id === variantId) {
        const update = {
          ...v,
          color: editValues.color,
          size: editValues.size,
          sku: editValues.sku,
          available: editValues.available,
          totalStock: editValues.available
        };
        if (editValues.image) {
          update.thumbnail = editValues.image;
          update.images = [editValues.image];
        }
        return update;
      }
      return v;
    }));
    
    setEditingId(null);
    toast.success('Variant specifications updated');
  };

  const handleVariantImageUpload = async (e, variantId) => {
    const file = e.target.files[0];
    if(!file) return;
    setUploadingVariantId(variantId);
    try {
      const { optimizeImage } = await import('../../../utils/imageOptimizer');
      const optimizedFile = await optimizeImage(file);
      
      const fd = new FormData();
      fd.append('image', optimizedFile);
      
      const res = await adminService.uploadImage(fd);
      const url = res.data?.url || res.data?.data?.url;
      if(url) {
        onUpdate(variants.map(v => v._id === variantId ? { 
          ...v, 
          thumbnail: url,
          images: [url]
        } : v));
        toast.success('Variant image uploaded successfully');
      }
    } catch(e) { 
      console.error(e);
      toast.error('Upload failed'); 
    } finally {
      setUploadingVariantId(null); 
    }
  };

  useEffect(() => {
    setActiveVariants((variants || []).filter(v => !v.isDeleted));
  }, [variants]);

  const addColor = () => {
    const val = colorInput.trim();
    if (!val) return;
    if (!colors.includes(val)) setColors([...colors, val]);
    setColorInput('');
  };

  const toggleSize = (s) => {
    if (sizes.includes(s)) setSizes(sizes.filter(x => x !== s));
    else setSizes([...sizes, s]);
  };

  const generateCombinations = () => {
    if (colors.length === 0 || sizes.length === 0) {
      toast.error('Select at least one color and one size');
      return;
    }
    
    const newVariants = [];
    colors.forEach(c => {
      sizes.forEach(s => {
        const exists = activeVariants.find(v => v.color === c && v.size === s);
        if (!exists) {
          newVariants.push({
            _id: `temp-${Date.now()}-${Math.random()}`,
            color: c,
            size: s,
            sku: '',
            available: Number(initialQty) || 0,
            totalStock: Number(initialQty) || 0,
            price: basePrice || 0,
            isDeleted: false
          });
        }
      });
    });

    if (newVariants.length > 0) {
      onUpdate([...(variants || []), ...newVariants]);
      toast.success(`Generated ${newVariants.length} variants`);
    } else {
      toast.error('All combinations already exist');
    }
  };

  const handleAdd = () => {
    if (!newV.size || !newV.color) return toast.error('Size and Color are mandatory');
    onUpdate([...(variants || []), { ...newV, _id: `temp-${Date.now()}`, isDeleted: false, price: basePrice, totalStock: Number(newV.available) }]);
    setNewV({ size: '', color: '', sku: '', available: 0 });
  };

  const handleRemove = (id) => {
    onUpdate(variants.map(v => v._id === id ? { ...v, isDeleted: true } : v));
  };

  return (
    <div className="space-y-10">
      <div className="flex bg-light-bg p-1 rounded-2xl w-fit">
        <button type="button" onClick={() => setMultiMode(true)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${multiMode ? 'bg-white text-charcoal shadow-sm' : 'text-text-muted hover:text-charcoal'}`}>Multi-Select Mode</button>
        <button type="button" onClick={() => setMultiMode(false)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!multiMode ? 'bg-white text-charcoal shadow-sm' : 'text-text-muted hover:text-charcoal'}`}>Individual Add</button>
      </div>

      {multiMode ? (
        <div className="p-10 bg-light-bg/30 rounded-[3rem] border border-border-light space-y-10 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Color Palette</label>
                {colors.length > 0 && <button onClick={() => setColors([])} className="text-[8px] font-black text-red-500 uppercase tracking-widest hover:underline">Clear All</button>}
              </div>
              <div className="flex flex-wrap gap-2 p-6 bg-white rounded-3xl border border-border-light min-h-[80px] shadow-inner">
                {colors.map(c => (
                  <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={c} className="px-4 py-2 bg-charcoal text-white rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 group">
                    {c} <X size={12} className="cursor-pointer hover:text-premium-gold transition-colors" onClick={() => setColors(colors.filter(x => x !== c))} />
                  </motion.span>
                ))}
                <div className="flex-1 flex items-center gap-2 min-w-[150px]">
                  <input 
                    className="w-full bg-transparent border-none outline-none text-[11px] font-black uppercase placeholder:text-text-muted/40" 
                    placeholder="Add Color (e.g. Red)..." 
                    value={colorInput} 
                    onChange={e => setColorInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addColor())}
                  />
                  <button onClick={addColor} className="p-2 bg-light-bg hover:bg-premium-gold/10 text-charcoal rounded-lg transition-all"><Plus size={14} /></button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Size Matrix (Select Multiple)</label>
                {sizes.length > 0 && <button onClick={() => setSizes([])} className="text-[8px] font-black text-red-500 uppercase tracking-widest hover:underline">Deselect All</button>}
              </div>
              <div className="grid grid-cols-5 gap-3 p-6 bg-white rounded-3xl border border-border-light shadow-inner">
                {COMMON_SIZES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    className={`py-3 rounded-xl text-[10px] font-black transition-all border-2 ${sizes.includes(s) ? 'bg-premium-gold border-premium-gold text-charcoal shadow-lg shadow-premium-gold/20 scale-105' : 'bg-white border-border-light text-text-muted hover:border-premium-gold/30'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-end gap-8 pt-6 border-t border-border-light/40">
            <div className="w-full md:w-64">
              <InputField type="number" label="Arrival Opening Stock" value={initialQty} onChange={v => setInitialQty(v)} placeholder="0" />
            </div>
            <button type="button" onClick={generateCombinations} className="flex-1 h-[68px] bg-charcoal text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-charcoal/20 hover:bg-premium-gold hover:text-charcoal transition-all flex items-center justify-center gap-4 group">
              <Sparkles size={20} className="group-hover:rotate-12 transition-transform" /> 
              Generate Variant Blueprint
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end bg-light-bg/30 p-10 rounded-[3rem] border border-border-light text-left shadow-inner">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Size Option</label>
            <select className="w-full bg-white border border-border-light rounded-2xl px-6 py-5 font-black text-xs uppercase outline-none focus:ring-4 focus:ring-premium-gold/10 transition-all shadow-sm" value={newV.size} onChange={e => setNewV({...newV, size: e.target.value})}>
              <option value="">Select Size...</option>
              {COMMON_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              <option value="CUSTOM">Custom...</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Color Shade</label>
            <input className="w-full bg-white border border-border-light rounded-2xl px-6 py-5 font-black text-xs uppercase outline-none focus:ring-4 focus:ring-premium-gold/10 transition-all shadow-sm" placeholder="e.g. Slate Gray" value={newV.color} onChange={e => setNewV({...newV, color: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Initial Qty</label>
            <input type="number" className="w-full bg-white border border-border-light rounded-2xl px-6 py-5 font-black text-xs uppercase outline-none focus:ring-4 focus:ring-premium-gold/10 transition-all shadow-sm" placeholder="0" value={newV.available} onChange={e => setNewV({...newV, available: Number(e.target.value)})} />
          </div>
          <button type="button" onClick={handleAdd} className="h-[68px] bg-charcoal text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-premium-gold hover:text-charcoal transition-all">Add To Catalog</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        {activeVariants.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-border-light opacity-50">
            <Layers size={40} className="mx-auto mb-4 text-text-muted" />
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">No variants defined in this profile yet</p>
          </div>
        ) : (
          activeVariants.map((v, idx) => (
            <motion.div 
              layout 
              key={v._id || idx} 
              className="bg-white p-8 rounded-[2.5rem] border border-border-light shadow-sm hover:border-premium-gold hover:shadow-xl transition-all group relative min-h-[180px] flex flex-col justify-between"
            >
              {editingId === v._id ? (
                <div className="space-y-4 w-full">
                  <div className="flex justify-between items-center pb-3 border-b border-border-light/50">
                    <span className="text-[8px] font-black text-premium-gold uppercase tracking-widest">Edit Variant Profile</span>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => handleSaveEdit(v._id)} 
                        className="p-2 bg-charcoal text-white hover:bg-premium-gold hover:text-charcoal rounded-xl transition-all shadow-sm flex items-center justify-center"
                        title="Save Changes"
                      >
                        <Save size={14} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setEditingId(null)} 
                        className="p-2 bg-light-bg text-text-muted hover:text-charcoal rounded-xl transition-all flex items-center justify-center"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[7px] font-black text-text-muted uppercase tracking-widest ml-1">Color Shade</span>
                      <input 
                        type="text" 
                        className="w-full bg-light-bg border border-transparent focus:border-premium-gold rounded-xl px-3 py-2 text-[10px] font-black uppercase outline-none transition-all"
                        value={editValues.color}
                        onChange={e => setEditValues({ ...editValues, color: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[7px] font-black text-text-muted uppercase tracking-widest ml-1">Size Option</span>
                      <input 
                        type="text" 
                        className="w-full bg-light-bg border border-transparent focus:border-premium-gold rounded-xl px-3 py-2 text-[10px] font-black uppercase outline-none transition-all"
                        value={editValues.size}
                        onChange={e => setEditValues({ ...editValues, size: e.target.value.toUpperCase() })}
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[7px] font-black text-text-muted uppercase tracking-widest ml-1">SKU Code</span>
                      <input 
                        type="text" 
                        placeholder="AUTO"
                        className="w-full bg-light-bg border border-transparent focus:border-premium-gold rounded-xl px-3 py-2 text-[10px] font-black uppercase outline-none transition-all placeholder:text-text-muted/30"
                        value={editValues.sku}
                        onChange={e => setEditValues({ ...editValues, sku: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[7px] font-black text-text-muted uppercase tracking-widest ml-1">Opening Stock</span>
                      <input 
                        type="number" 
                        className="w-full bg-light-bg border border-transparent focus:border-premium-gold rounded-xl px-3 py-2 text-[10px] font-black outline-none transition-all"
                        value={editValues.available}
                        onChange={e => setEditValues({ ...editValues, available: Number(e.target.value) })}
                      />
                    </div>
                    
                    <div className="space-y-1 col-span-2">
                      <span className="text-[7px] font-black text-text-muted uppercase tracking-widest ml-1">Image URL (Optional)</span>
                      <input 
                        type="url" 
                        placeholder="Paste Cloudinary/S3 URL..."
                        className="w-full bg-light-bg border border-transparent focus:border-premium-gold rounded-xl px-3 py-2 text-[10px] font-black outline-none transition-all placeholder:text-text-muted/30"
                        value={editValues.image}
                        onChange={e => setEditValues({ ...editValues, image: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-black text-charcoal uppercase tracking-tight truncate">{v.color}</h5>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Size Identity: <span className="text-charcoal">{v.size}</span></p>
                    </div>
                    
                    {/* 📸 Variant Specific Image Uploader */}
                    <div className="relative w-14 h-14 bg-light-bg rounded-2xl border border-border-light overflow-hidden group/img shrink-0 shadow-inner flex items-center justify-center">
                      {uploadingVariantId === v._id ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-10">
                          <Loader2 className="animate-spin text-premium-gold" size={16} />
                        </div>
                      ) : v.thumbnail || v.images?.[0] ? (
                        <div className="relative w-full h-full">
                          <SafeImage src={resolveAssetURL(v.thumbnail || v.images?.[0])} className="w-full h-full object-cover" />
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                            <Upload size={14} />
                            <input type="file" className="hidden" onChange={(e) => handleVariantImageUpload(e, v._id)} />
                          </label>
                        </div>
                      ) : (
                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-premium-gold/5 transition-all text-text-muted hover:text-premium-gold">
                          <ImageIcon size={16} className="opacity-40 group-hover/img:opacity-100" />
                          <span className="text-[6px] font-black uppercase tracking-widest mt-1">Add Image</span>
                          <input type="file" className="hidden" onChange={(e) => handleVariantImageUpload(e, v._id)} />
                        </label>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        type="button" 
                        onClick={() => {
                          setEditingId(v._id);
                          setEditValues({
                            size: v.size || '',
                            color: v.color || '',
                            sku: v.sku || '',
                            available: v.available || 0,
                            image: v.thumbnail || v.images?.[0] || ''
                          });
                        }} 
                        className="p-2 text-text-muted hover:text-premium-gold transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
                        title="Edit specifications"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button type="button" onClick={() => handleRemove(v._id)} className="p-2 text-text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-border-light/50 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">SKU Code</span>
                      <span className="text-[9px] font-black text-premium-gold uppercase">{v.sku || 'AUTO'}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Opening Stock</p>
                      <p className="text-2xl font-black text-charcoal">{v.available || 0}</p>
                      {v._id?.startsWith('temp-') && <span className="text-[7px] font-black text-premium-gold uppercase">New</span>}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
