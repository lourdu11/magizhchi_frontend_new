import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, X, Loader2, ImageIcon, Plus, ChevronLeft, Info, Eye, EyeOff } from 'lucide-react';
import { categoryService, adminService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const EMPTY = { 
  name: '', description: '', image: '', tabletImage: '', mobileImage: '', 
  fit: 'cover', position: 'center', scale: 1, gravity: 'auto',
  isActive: true
};

const BannerPreview = ({ src, aspect, fit, pos, scale, label }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (src) { setLoading(true); setError(false); }
  }, [src]);

  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] bg-neutral-100 border border-neutral-200 shadow-inner group transition-all duration-300" style={{ aspectRatio: aspect }}>
      {loading && src && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 z-10">
          <Loader2 className="animate-spin text-neutral-300" size={24} />
        </div>
      )}
      {!src || error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 bg-neutral-50">
          <ImageIcon size={32} strokeWidth={1.5} />
          <span className="text-[10px] font-bold mt-2 uppercase tracking-widest">{error ? 'Load Failed' : `No ${label} Image`}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={`${label} Preview`}
          className={`w-full h-full block transition-all duration-700 ${loading ? 'opacity-0 scale-105 blur-sm' : 'opacity-100 scale-100 blur-0'}`}
          style={{
            objectFit: fit || 'cover',
            objectPosition: pos || 'center',
            transform: `scale(${scale || 1})`
          }}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          decoding="async"
        />
      )}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-neutral-200 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
        {label} VIEW
      </div>
    </div>
  );
};

export default function AdminCategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(() => {
    if (!id) {
      try {
        const saved = localStorage.getItem('category_draft');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return EMPTY;
  });
  const [isUploading, setIsUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState('laptop');

  const getField = (mode) => {
    if (mode === 'mobile') return 'mobileImage';
    if (mode === 'tablet') return 'tabletImage';
    return 'image';
  };

  const { data: category, isLoading: isFetching } = useQuery({
    queryKey: ['category', id],
    queryFn: () => categoryService.getCategory(id).then(r => r.data.data.category),
    enabled: !!id
  });

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        description: category.description || '',
        image: category.image || '',
        tabletImage: category.tabletImage || '',
        mobileImage: category.mobileImage || '',
        fit: category.fit || 'cover',
        position: category.position || 'center',
        scale: category.scale || 1,
        gravity: category.gravity || 'auto',
        isActive: category.isActive !== undefined ? category.isActive : true
      });
    }
  }, [category]);

  // Save draft to localStorage reactively on changes (only for new categories)
  useEffect(() => {
    if (!id) {
      localStorage.setItem('category_draft', JSON.stringify(form));
    }
  }, [form, id]);

  const saveMutation = useMutation({
    mutationFn: (data) => id ? categoryService.updateCategory(id, data) : categoryService.createCategory(data),
    onSuccess: () => { 
      if (!id) {
        localStorage.removeItem('category_draft');
      }
      qc.invalidateQueries(['categories']); 
      toast.success(id ? 'Taxonomy updated' : 'Taxonomy created'); 
      navigate('/admin/categories');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const handleUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await adminService.uploadImage(fd);
      const url = res.data?.url || res.data?.data?.url;
      if (url) {
        setForm(prev => ({ ...prev, [field]: url }));
        toast.success('Asset uploaded successfully');
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  if (id && isFetching) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-premium-gold" size={40} />
        <p className="text-xs font-black text-text-muted uppercase tracking-widest">Hydrating Configuration...</p>
      </div>
    );
  }

  const handleCancel = () => {
    if (!id) {
      if (window.confirm('Discard all unsaved category changes and close?')) {
        localStorage.removeItem('category_draft');
        navigate('/admin/categories');
      }
    } else {
      navigate('/admin/categories');
    }
  };

  return (
    <div className="pb-20">
      <Helmet><title>{id ? 'Edit Taxonomy' : 'New Taxonomy'} — Admin</title></Helmet>

      {/* Header */}
      <div className="flex items-center gap-6 mb-10">
        <button onClick={handleCancel} className="p-4 bg-white border border-border-light rounded-2xl hover:bg-light-bg transition-all shadow-sm">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-charcoal tracking-tight uppercase">
            {id ? 'Refine Taxonomy' : 'Architect Taxonomy'}
          </h1>
          <p className="text-text-muted text-sm font-medium">
            {id ? `Modifying configuration for ${form.name}` : 'Initialize a new category for your store'}
          </p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3.5rem] border border-border-light p-10 shadow-xl max-w-6xl">
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-10">
          <div className="grid lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <label className="block space-y-2">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Category Designation</span>
                <input required className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold text-sm transition-all" placeholder="e.g. Premium Shirts" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </label>

              <label className="block space-y-2">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Status Control</span>
                <div className="flex bg-light-bg p-1.5 rounded-2xl gap-1">
                  <button
                    type="button"
                    onClick={() => setForm({...form, isActive: true})}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${form.isActive ? 'bg-white text-charcoal shadow-sm' : 'text-text-muted hover:text-charcoal'}`}
                  >
                    <Eye size={14} /> Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({...form, isActive: false})}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!form.isActive ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-text-muted hover:text-charcoal'}`}
                  >
                    <EyeOff size={14} /> Inactive
                  </button>
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Narrative Description</span>
                <textarea rows="6" className="w-full bg-light-bg border-none rounded-[2rem] px-6 py-6 focus:ring-2 focus:ring-premium-gold/30 font-medium text-sm resize-none transition-all" placeholder="Describe the essence of this category..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </label>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Visual Identity</span>
                <div className="flex bg-light-bg p-1 rounded-xl gap-1">
                  {['laptop', 'tablet', 'mobile'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPreviewMode(m)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${previewMode === m ? 'bg-white text-charcoal shadow-sm' : 'text-text-muted hover:text-charcoal'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <BannerPreview 
                    src={form[getField(previewMode)]} 
                    aspect={previewMode === 'laptop' ? '16 / 9' : previewMode === 'tablet' ? '4 / 3' : '1 / 1'} 
                    fit={form.fit} 
                    pos={form.position} 
                    scale={form.scale}
                    label={previewMode.toUpperCase()}
                  />
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-[2rem] z-20">
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleUpload(e, getField(previewMode))} disabled={isUploading} />
                    {isUploading ? <Loader2 className="animate-spin text-white" /> : <Plus className="text-white" />}
                  </label>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <select className="bg-light-bg border-none rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer" value={form.fit} onChange={e => setForm({...form, fit: e.target.value})}>
                    <option value="cover">COVER</option>
                    <option value="contain">CONTAIN</option>
                  </select>
                  <select className="bg-light-bg border-none rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer" value={form.position} onChange={e => setForm({...form, position: e.target.value})}>
                    <option value="top">TOP</option>
                    <option value="center">CENTER</option>
                    <option value="bottom">BOTTOM</option>
                  </select>
                  <select className="bg-light-bg border-none rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer" value={form.gravity} onChange={e => setForm({...form, gravity: e.target.value})}>
                    <option value="auto">AI AUTO</option>
                    <option value="faces">FACES</option>
                    <option value="center">CENTER</option>
                  </select>
                  <select className="bg-light-bg border-none rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer" value={form.scale} onChange={e => setForm({...form, scale: parseFloat(e.target.value)})}>
                    <option value="1">100%</option>
                    <option value="1.1">110%</option>
                    <option value="1.2">120%</option>
                    <option value="1.5">150%</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">{previewMode.toUpperCase()} Asset URL</span>
                  <input 
                    className="w-full bg-light-bg border-none rounded-xl px-4 py-3 text-[10px] font-bold focus:ring-1 focus:ring-premium-gold/30" 
                    placeholder="https://..." 
                    value={form[getField(previewMode)]} 
                    onChange={e => setForm({...form, [getField(previewMode)]: e.target.value})} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-border-light">
            <button type="submit" disabled={saveMutation.isPending || isUploading} className="bg-charcoal text-white px-12 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-charcoal/20 hover:bg-premium-gold hover:text-charcoal transition-all flex items-center justify-center gap-3">
              {saveMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> {id ? 'Publish Updates' : 'Initialize Taxonomy'}</>}
            </button>
            <button type="button" onClick={handleCancel} className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-charcoal transition-colors px-8 py-5">Discard Changes</button>
          </div>
        </form>
      </motion.div>

      <div className="mt-10 bg-gold-soft/10 border border-premium-gold/10 p-6 rounded-[2.5rem] flex items-start gap-4 max-w-6xl">
        <div className="p-3 bg-white rounded-2xl shadow-sm text-premium-gold"><Info size={20} /></div>
        <div>
          <h4 className="text-sm font-black text-charcoal uppercase tracking-tight">Pro Tip: Visual Ratios</h4>
          <p className="text-xs text-text-muted font-medium leading-relaxed mt-1">
            Laptop view uses a 16:9 ratio, Tablet uses 4:3, and Mobile uses 1:1. Ensure your assets are optimized for these focal points. Use the AI Auto scaling to focus on faces automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
