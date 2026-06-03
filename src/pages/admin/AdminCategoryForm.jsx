import { useState, useEffect } from 'react';
import AdminSingleImageResizer from '../../components/admin/AdminSingleImageResizer';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, X, Loader2, ImageIcon, Plus, ChevronLeft, Info, Eye, EyeOff, Upload, Link2, Copy, ExternalLink, Check } from 'lucide-react';
import { categoryService, adminService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

import { LivePreview, DropZone, FitSelector, PositionPicker, ScaleControl } from '../../components/admin/AdminVisualManager';

const EMPTY = { 
  name: '', description: '', image: '', tabletImage: '', mobileImage: '', 
  fit: 'cover', position: 'center', scale: 1, gravity: 'auto',
  isActive: true
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
  const [resizerState, setResizerState] = useState({ isOpen: false, file: null, field: null });
  const [catUploadTab, setCatUploadTab] = useState('file');
  const [catUrlInput, setCatUrlInput] = useState('');
  const [catLastUrl, setCatLastUrl] = useState('');

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

  const handleUpload = (file, field = 'all') => {
    if (!file) return;
    setResizerState({ isOpen: true, file, field });
  };

  const handleResizerSave = async (blob) => {
    setResizerState({ isOpen: false, file: null, field: null });
    setIsUploading(true);
    const fd = new FormData();
    fd.append('image', blob, 'category.webp');
    try {
      const res = await adminService.uploadImage(fd);
      const url = res.data?.url || res.data?.data?.url;
      if (url) {
        setCatLastUrl(url);
        if (resizerState.field === 'all') {
          setForm(prev => ({ ...prev, image: url, tabletImage: url, mobileImage: url, fit: 'cover' }));
          toast.success('Perfectly sized image applied to all device sizes!');
        } else {
          setForm(prev => ({ ...prev, [resizerState.field]: url }));
          toast.success('Perfectly sized asset uploaded!');
        }
      }
    } catch (err) {
      toast.error('Upload failed: ' + (err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const applyUrl = (url) => {
    if (!url.trim()) return toast.error('Please enter a URL');
    setForm(prev => ({ ...prev, image: url.trim(), tabletImage: url.trim(), mobileImage: url.trim() }));
    setCatLastUrl(url.trim());
    setCatUrlInput('');
    toast.success('✅ URL applied to all devices!');
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3.5rem] border border-border-light p-5 md:p-10 shadow-xl max-w-6xl">
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-10">
          <div className="grid lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <label className="block space-y-2">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Category Designation</span>
                <input required className="w-full bg-light-bg border-none rounded-2xl px-4 sm:px-4 sm:px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold text-sm transition-all" placeholder="e.g. Premium Shirts" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
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
                <textarea rows="6" className="w-full bg-light-bg border-none rounded-[2rem] px-4 sm:px-4 sm:px-6 py-4 sm:py-4 sm:py-6 focus:ring-2 focus:ring-premium-gold/30 font-medium text-sm resize-none transition-all" placeholder="Describe the essence of this category..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </label>
            </div>

            {/* ── MASTER IMAGE UPLOAD ─────────────────────────────────── */}
            <div className="space-y-6">
              <div className="flex items-center flex-wrap gap-3">
                <div className="w-10 h-10 rounded-2xl bg-premium-gold/10 flex items-center justify-center">
                  <ImageIcon size={20} className="text-premium-gold" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Visual Identity</h3>
                  <p className="text-xs font-bold text-charcoal uppercase tracking-widest mt-0.5">
                    Master Image Upload
                  </p>
                </div>
                {form.image && (
                  <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-100">
                    <Check size={10} /> Image Set
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Upload mode switcher */}
                <div className="flex gap-1 p-1 bg-light-bg rounded-2xl border border-border-light">
                  {[
                    { id: 'file', label: '📁 Upload File' },
                    { id: 'url', label: '🔗 Paste URL' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCatUploadTab(tab.id)}
                      className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${catUploadTab === tab.id ? 'bg-charcoal text-white shadow-md' : 'text-text-muted hover:text-charcoal'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* File upload */}
                {catUploadTab === 'file' && (
                  <DropZone
                    onFile={(file) => handleUpload(file, 'all')}
                    loading={isUploading}
                    hasImage={!!form.image}
                    label="Recommended: 1080×1350px · JPG, PNG, WebP"
                  />
                )}

                {/* URL paste */}
                {catUploadTab === 'url' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={catUrlInput}
                        onChange={e => setCatUrlInput(e.target.value)}
                        placeholder="Paste image URL here..."
                        className="flex-1 bg-light-bg border border-border-light rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-premium-gold transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => applyUrl(catUrlInput)}
                        className="px-5 py-3 bg-charcoal text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all whitespace-nowrap"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}

                {/* Uploaded URL display */}
                {catLastUrl && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                    <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                      <Check size={10} /> Uploaded URL
                    </p>
                    <div className="flex gap-2 items-center">
                      <p className="text-[9px] text-emerald-700 font-mono truncate flex-1">{catLastUrl}</p>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(catLastUrl); toast.success('URL copied!'); }}
                        className="shrink-0 p-2 bg-white border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all"
                        title="Copy URL"
                      >
                        <Copy size={12} className="text-emerald-600" />
                      </button>
                      <a
                        href={catLastUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 p-2 bg-white border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all"
                        title="Open in browser"
                      >
                        <ExternalLink size={12} className="text-emerald-600" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Image Controls */}
                {form.image && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 p-4 sm:p-4 sm:p-6 bg-light-bg rounded-3xl border border-border-light">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                      Image Display Controls
                    </p>

                    <FitSelector value={form.fit} onChange={v => setForm({...form, fit: v})} />
                    <PositionPicker value={form.position} onChange={v => setForm({...form, position: v})} />
                    <ScaleControl value={form.scale} onChange={v => setForm({...form, scale: v})} />
                    
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">AI Auto Gravity</span>
                      <select className="w-full bg-white border border-border-light rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer" value={form.gravity} onChange={e => setForm({...form, gravity: e.target.value})}>
                        <option value="auto">AI AUTO</option>
                        <option value="faces">FACES</option>
                        <option value="center">CENTER</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* Live Previews */}
                <div className="space-y-4 pt-4 border-t border-border-light">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Live Preview — All Devices</p>
                  
                  {[
                    { key: 'image', label: 'Desktop', aspect: '16/9' },
                    { key: 'tabletImage', label: 'Tablet', aspect: '4/3' },
                    { key: 'mobileImage', label: 'Mobile', aspect: '1/1' },
                  ].map(dev => (
                    <div key={dev.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-charcoal uppercase tracking-wider">{dev.label}</span>
                      </div>
                      <LivePreview
                        src={form[dev.key]}
                        fit={form.fit}
                        position={form.position}
                        scale={form.scale}
                        label={dev.label}
                        aspect={dev.aspect}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-border-light">
            <button type="submit" disabled={saveMutation.isPending || isUploading} className="bg-charcoal text-white px-12 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-charcoal/20 hover:bg-premium-gold hover:text-charcoal transition-all flex items-center justify-center gap-3">
              {saveMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> {id ? 'Publish Updates' : 'Initialize Taxonomy'}</>}
            </button>
            <button type="button" onClick={handleCancel} className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-charcoal transition-colors px-4 md:px-4 md:px-8 py-5">Discard Changes</button>
          </div>
        </form>
      </motion.div>

      <div className="mt-10 bg-gold-soft/10 border border-premium-gold/10 p-4 sm:p-4 sm:p-6 rounded-[2.5rem] flex items-start gap-4 max-w-6xl">
        <div className="p-3 bg-white rounded-2xl shadow-sm text-premium-gold"><Info size={20} /></div>
        <div>
          <h4 className="text-sm font-black text-charcoal uppercase tracking-tight">Pro Tip: Visual Ratios</h4>
          <p className="text-xs text-text-muted font-medium leading-relaxed mt-1">
            Laptop view uses a 16:9 ratio, Tablet uses 4:3, and Mobile uses 1:1. Ensure your assets are optimized for these focal points. Use the AI Auto scaling to focus on faces automatically.
          </p>
        </div>
      </div>

      <AdminSingleImageResizer 
        isOpen={resizerState.isOpen}
        onClose={() => setResizerState({ isOpen: false, file: null, field: null })}
        file={resizerState.file}
        onSave={handleResizerSave}
        targetWidth={1080}
        targetHeight={1350}
        title="Category Image Resizer"
      />
    </div>
  );
}
