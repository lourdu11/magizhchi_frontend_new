import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Save, X, Loader2, Tag, Ruler, ImageIcon, Layout, Sparkles, ChevronRight, Info } from 'lucide-react';
import { categoryService, adminService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveAssetURL } from '../../utils/assetResolver';

const EMPTY = { name: '', description: '', image: '', sizeChart: '', displayOrder: 0 };

export default function AdminCategories() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [isUploading, setIsUploading] = useState(false);
  const qc = useQueryClient();

  const { data: cats, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories().then(r => r.data.data?.categories || r.data.data || []),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? categoryService.updateCategory(editing, data) : categoryService.createCategory(data),
    onSuccess: () => { qc.invalidateQueries(['categories']); toast.success(editing ? 'Category updated' : 'Category created'); resetForm(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => categoryService.deleteCategory(id),
    onSuccess: () => { qc.invalidateQueries(['categories']); toast.success('Category deleted'); },
  });

  const resetForm = () => { setForm(EMPTY); setEditing(null); setShowForm(false); };
  const startEdit = (cat) => { setForm({ name: cat.name, description: cat.description || '', image: cat.image || '', sizeChart: cat.sizeChart || '', displayOrder: cat.displayOrder || 0 }); setEditing(cat._id); setShowForm(true); };

  const handleUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await adminService.uploadImage(fd);
      setForm(prev => ({ ...prev, [field]: res.data.url }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <Helmet><title>Taxonomy Command — Admin</title></Helmet>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[3rem] border border-border-light shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-charcoal tracking-tight uppercase">Category Architect</h1>
          <p className="text-text-muted text-sm font-medium">Define your store taxonomy & size guides</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-premium-gold text-charcoal px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-premium-gold/20">
          <Plus size={16} /> New Taxonomy
        </button>
      </div>

      {/* Logic Alert */}
      <div className="bg-gold-soft/20 border border-premium-gold/20 p-6 rounded-[2.5rem] flex items-start gap-4">
         <div className="p-3 bg-white rounded-2xl shadow-sm text-premium-gold"><Info size={20} /></div>
         <div>
            <h4 className="text-sm font-black text-charcoal uppercase tracking-tight">Pro Tip: Category-Wide Sizing</h4>
            <p className="text-xs text-text-muted font-medium leading-relaxed mt-1">
               Setting a <b>Size Chart</b> here will automatically apply it to all products in this category unless overridden at the individual product level.
            </p>
         </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-[3.5rem] border border-border-light p-10 shadow-xl max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h3 className="text-xl font-black text-charcoal uppercase tracking-tight">{editing ? 'Edit Taxonomy' : 'Initialize Taxonomy'}</h3>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Configuration {editing || 'NEW'}</p>
               </div>
               <button onClick={resetForm} className="p-4 hover:bg-light-bg rounded-full transition-colors text-text-muted"><X size={24} /></button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-10">
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-8">
                   <label className="block space-y-2">
                     <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Category Designation</span>
                     <input required className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold text-sm transition-all" placeholder="e.g. Premium Shirts" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                   </label>
                   <label className="block space-y-2">
                     <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Display Priority</span>
                     <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-black text-sm" value={form.displayOrder} onChange={e => setForm({...form, displayOrder: Number(e.target.value)})} />
                   </label>
                   <label className="block space-y-2">
                     <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Narrative Description</span>
                     <textarea rows="4" className="w-full bg-light-bg border-none rounded-[2rem] px-6 py-6 focus:ring-2 focus:ring-premium-gold/30 font-medium text-sm resize-none transition-all" placeholder="Describe the essence of this category..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                   </label>
                </div>

                <div className="space-y-10">
                   <div className="space-y-4">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Visual Identity & Size Guide</span>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-3">
                            <div className="relative group aspect-square bg-light-bg rounded-[2rem] overflow-hidden border border-border-light cursor-pointer">
                               {form.image ? <img src={resolveAssetURL(form.image)} className="w-full h-full object-cover" onError={(e) => { e.target.src = '/placeholder.jpg'; }} /> : <div className="w-full h-full flex flex-col items-center justify-center text-text-muted gap-2"><ImageIcon size={32} /><span className="text-[9px] font-black uppercase">Cover Photo</span></div>}
                               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleUpload(e, 'image')} />
                               <div className="absolute inset-0 bg-charcoal/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><Plus className="text-white" /></div>
                            </div>
                            <input 
                               className="w-full bg-light-bg border-none rounded-xl px-4 py-2.5 text-[10px] font-bold focus:ring-2 focus:ring-premium-gold/30" 
                               placeholder="Or paste URL..." 
                               value={form.image} 
                               onChange={e => setForm({...form, image: e.target.value})} 
                            />
                         </div>

                         <div className="space-y-3">
                            <div className="relative group aspect-square bg-light-bg rounded-[2rem] overflow-hidden border border-border-light cursor-pointer">
                               {form.sizeChart ? <img src={resolveAssetURL(form.sizeChart)} className="w-full h-full object-cover" onError={(e) => { e.target.src = '/placeholder.jpg'; }} /> : <div className="w-full h-full flex flex-col items-center justify-center text-text-muted gap-2"><Ruler size={32} /><span className="text-[9px] font-black uppercase">Size Chart</span></div>}
                               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleUpload(e, 'sizeChart')} />
                               <div className="absolute inset-0 bg-charcoal/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><Plus className="text-white" /></div>
                            </div>
                            <input 
                               className="w-full bg-light-bg border-none rounded-xl px-4 py-2.5 text-[10px] font-bold focus:ring-2 focus:ring-premium-gold/30" 
                               placeholder="Or paste URL..." 
                               value={form.sizeChart} 
                               onChange={e => setForm({...form, sizeChart: e.target.value})} 
                            />
                         </div>
                      </div>
                      <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest text-center italic">Click to upload or paste external link</p>
                   </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="submit" disabled={saveMutation.isLoading || isUploading} className="bg-charcoal text-white px-12 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-charcoal/20 hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-3">
                  {saveMutation.isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> {editing ? 'Publish Updates' : 'Publish Taxonomy'}</>}
                </button>
                <button type="button" onClick={resetForm} className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-charcoal transition-colors px-8">Discard</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading && <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-premium-gold" size={40} /></div>}
        {cats?.length === 0 && <div className="col-span-full py-24 text-center text-text-muted font-bold uppercase tracking-widest">Empty Taxonomy.</div>}
        {cats?.map(cat => (
          <div key={cat._id} className="bg-white rounded-[3rem] border border-border-light overflow-hidden shadow-sm group hover:shadow-2xl transition-all hover:-translate-y-1">
            <div className="h-56 bg-light-bg relative overflow-hidden">
              {cat.image ? (
                <img src={resolveAssetURL(cat.image)} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={(e) => { e.target.src = '/placeholder.jpg'; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Tag size={48} className="text-border-light" /></div>
              )}
              <div className="absolute top-6 right-6 flex flex-col gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                <button onClick={() => startEdit(cat)} className="p-4 bg-white rounded-2xl shadow-xl text-charcoal hover:bg-premium-gold hover:text-charcoal transition-all"><Edit size={18} /></button>
                <button onClick={() => { if (window.confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate(cat._id); }} className="p-4 bg-white rounded-2xl shadow-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
              </div>
              <div className="absolute bottom-6 left-6 flex items-center gap-2">
                 <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-charcoal shadow-sm border border-white/20">Order: {cat.displayOrder || 0}</span>
                 {cat.sizeChart && <span className="bg-premium-gold text-charcoal px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm"><Ruler size={10} className="inline mr-1" /> Chart Active</span>}
              </div>
            </div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-black text-charcoal tracking-tight group-hover:text-premium-gold transition-colors">{cat.name}</h4>
                <ChevronRight size={18} className="text-border-light group-hover:text-premium-gold transition-all" />
              </div>
              {cat.description ? <p className="text-xs text-text-muted font-medium line-clamp-2 leading-relaxed">{cat.description}</p> : <p className="text-xs italic text-text-muted">No description provided</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
