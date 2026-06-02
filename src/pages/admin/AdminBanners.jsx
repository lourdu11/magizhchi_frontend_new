import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Plus, Trash2, ExternalLink, Loader2, Save, X, ToggleLeft, ToggleRight, Edit3, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { adminService, bannerService } from '../../services';
import SafeImage from '../../components/common/SafeImage';
import AdminImageResizer from '../../components/admin/AdminImageResizer';

import { LivePreview, DropZone, FitSelector, PositionPicker, ScaleControl } from '../../components/admin/AdminVisualManager';

export default function AdminBanners() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => bannerService.getAllBanners().then(r => r.data.data),
    select: (data) => [...data].sort((a, b) => a.displayOrder - b.displayOrder),
  });

  const [formData, setFormData] = useState({
    title: '', subtitle: '', 
    desktopImage: '', mobileImage: '', 
    desktopFit: 'cover', desktopPos: 'center', desktopScale: 1, desktopGravity: 'auto',
    mobileFit: 'cover', mobilePos: 'center', mobileScale: 1, mobileGravity: 'auto',
    link: '/', displayOrder: 0, isActive: true
  });
  const [resizerFile, setResizerFile] = useState(null);
  const [isResizerOpen, setIsResizerOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState('file');
  const [urlInput, setUrlInput] = useState('');

  const upsertMutation = useMutation({
    mutationFn: (data) => editingId ? bannerService.updateBanner(editingId, data) : bannerService.createBanner(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-banners']);
      toast.success(editingId ? 'Banner updated' : 'Banner created');
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => bannerService.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-banners']);
      toast.success('Banner deleted');
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ 
      title: '', subtitle: '', 
      desktopImage: '', mobileImage: '', 
      desktopFit: 'cover', desktopPos: 'center', desktopScale: 1, desktopGravity: 'auto',
      mobileFit: 'cover', mobilePos: 'center', mobileScale: 1, mobileGravity: 'auto',
      link: '/', displayOrder: 0, isActive: true 
    });
  };

  const handleEdit = (banner) => {
    setFormData({ 
      ...banner,
      desktopFit: banner.desktopFit || 'cover',
      desktopPos: banner.desktopPos || 'center',
      mobileFit: banner.mobileFit || 'cover',
      mobilePos: banner.mobilePos || 'center'
    });
    setEditingId(banner._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpload = (file) => {
    if (!file) return;
    setResizerFile(file);
    setIsResizerOpen(true);
  };

  const handleResizerSave = async ({ desktopFile, mobileFile }) => {
    setIsUploading(true);
    try {
      const fdDesktop = new FormData();
      fdDesktop.append('image', desktopFile);
      const resDesktop = await adminService.uploadImage(fdDesktop);
      const desktopUrl = resDesktop.data?.url || resDesktop.data?.data?.url;

      const fdMobile = new FormData();
      fdMobile.append('image', mobileFile);
      const resMobile = await adminService.uploadImage(fdMobile);
      const mobileUrl = resMobile.data?.url || resMobile.data?.data?.url;

      if (desktopUrl && mobileUrl) {
        setFormData(prev => ({
          ...prev,
          desktopImage: desktopUrl,
          mobileImage: mobileUrl,
          desktopFit: 'cover',
          mobileFit: 'cover'
        }));
        toast.success('Perfectly sized images uploaded! Fit set to COVER automatically.');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      toast.error('Upload failed: ' + (err.message));
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-premium-gold" size={40} /></div>;

  return (
    <div className="space-y-6">
      <Helmet><title>Manage Banners — Admin</title></Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Homepage Banners</h1>
          <p className="text-text-muted text-sm">Manage sliders and promotional carousels</p>
        </div>
        <button 
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add Banner</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-border-light shadow-2xl">
          <h3 className="text-xl font-black text-charcoal mb-6 uppercase tracking-tight">
            {editingId ? 'Refine Banner' : 'New Creation'}
          </h3>
          <form onSubmit={(e) => { e.preventDefault(); upsertMutation.mutate(formData); }} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <label className="block">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Banner Title</span>
                <input required className="w-full bg-light-bg border-none rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-premium-gold/30 font-bold" placeholder="e.g. Summer Collection" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </label>
              <label className="block">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Subtitle / Caption</span>
                <textarea rows="2" className="w-full bg-light-bg border-none rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-premium-gold/30 font-medium resize-none" placeholder="e.g. Discover the art of perfect tailoring." value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} />
              </label>
              
              {/* ── MASTER IMAGE UPLOAD ─────────────────────────────────── */}
              <div className="col-span-1 md:col-span-2 space-y-6 pt-4 border-t border-border-light">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-premium-gold/10 flex items-center justify-center">
                    <ImageIcon size={20} className="text-premium-gold" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Visual Identity</h3>
                    <p className="text-xs font-bold text-charcoal uppercase tracking-widest mt-0.5">
                      Master Image Upload
                    </p>
                  </div>
                  {(formData.desktopImage || formData.mobileImage) && (
                    <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-100">
                      <Check size={10} /> Image Set
                    </div>
                  )}
                </div>

                <div className="grid lg:grid-cols-2 gap-8 items-start">
                  {/* Left: Upload Controls */}
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
                          onClick={() => setUploadTab(tab.id)}
                          className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${uploadTab === tab.id ? 'bg-charcoal text-white shadow-md' : 'text-text-muted hover:text-charcoal'}`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* File upload */}
                    {uploadTab === 'file' && (
                      <DropZone
                        onFile={handleUpload}
                        loading={isUploading}
                        hasImage={!!formData.desktopImage}
                        label="Recommended: High-res Landscape · JPG, PNG, WebP"
                      />
                    )}

                    {/* URL paste */}
                    {uploadTab === 'url' && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={urlInput}
                            onChange={e => setUrlInput(e.target.value)}
                            placeholder="Paste image URL here..."
                            className="flex-1 bg-light-bg border border-border-light rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-premium-gold transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!urlInput.trim()) return toast.error('Enter URL');
                              setFormData(prev => ({...prev, desktopImage: urlInput.trim(), mobileImage: urlInput.trim()}));
                              setUrlInput('');
                              toast.success('URL applied to all views!');
                            }}
                            className="px-5 py-3 bg-charcoal text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all whitespace-nowrap"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Image Controls */}
                    {(formData.desktopImage || formData.mobileImage) && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 p-6 bg-light-bg rounded-3xl border border-border-light">
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Desktop Controls (21:9)</p>
                        <FitSelector value={formData.desktopFit} onChange={v => setFormData({...formData, desktopFit: v})} />
                        <PositionPicker value={formData.desktopPos} onChange={v => setFormData({...formData, desktopPos: v})} />
                        <ScaleControl value={formData.desktopScale} onChange={v => setFormData({...formData, desktopScale: v})} />
                        
                        <div className="h-px bg-border-light my-4"></div>
                        
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Mobile Controls (4:5)</p>
                        <FitSelector value={formData.mobileFit} onChange={v => setFormData({...formData, mobileFit: v})} />
                        <PositionPicker value={formData.mobilePos} onChange={v => setFormData({...formData, mobilePos: v})} />
                        <ScaleControl value={formData.mobileScale} onChange={v => setFormData({...formData, mobileScale: v})} />
                      </motion.div>
                    )}
                  </div>

                  {/* Right: Live Previews */}
                  <div className="space-y-6">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Live Preview</p>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-charcoal uppercase tracking-wider">Desktop View (21:9)</span>
                      </div>
                      <LivePreview
                        src={formData.desktopImage}
                        fit={formData.desktopFit}
                        position={formData.desktopPos}
                        scale={formData.desktopScale}
                        label="Desktop"
                        aspect="21/9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-charcoal uppercase tracking-wider">Mobile View (4:5)</span>
                      </div>
                      <div className="max-w-[200px] mx-auto">
                        <LivePreview
                          src={formData.mobileImage}
                          fit={formData.mobileFit}
                          position={formData.mobilePos}
                          scale={formData.mobileScale}
                          label="Mobile"
                          aspect="4/5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Redirect Link</span>
                <input required className="w-full bg-light-bg border-none rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-premium-gold/30 font-bold" placeholder="/collections/new-arrivals" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
              </label>
              
              <div className="grid grid-cols-2 gap-6">
                <label className="block">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Display Order</span>
                  <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-premium-gold/30 font-black" value={formData.displayOrder} onChange={e => setFormData({...formData, displayOrder: e.target.value})} />
                </label>
                <div className="flex flex-col justify-end pb-1">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Visibility</span>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-12 h-7 rounded-full relative transition-colors ${formData.isActive ? 'bg-premium-gold' : 'bg-gray-300'}`}>
                      <input type="checkbox" className="hidden" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${formData.isActive ? 'left-6' : 'left-1'}`} />
                    </div>
                    <span className="text-xs font-black text-charcoal uppercase tracking-widest">{formData.isActive ? 'Public' : 'Hidden'}</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="submit" disabled={upsertMutation.isPending || isUploading} className="flex-1 bg-charcoal text-white rounded-2xl py-4 font-black tracking-[0.2em] uppercase text-xs shadow-xl shadow-charcoal/20 hover:bg-premium-gold transition-all flex items-center justify-center gap-3">
                  {upsertMutation.isPending ? <Loader2 className="animate-spin" /> : <><Save size={18} /> {editingId ? 'Push Updates' : 'Publish Banner'}</>}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {banners?.length === 0 && <div className="col-span-full py-20 text-center text-text-muted italic">No banners found. Start by adding a hero banner.</div>}
        {banners?.map(banner => (
          <div key={banner._id} className="bg-white rounded-[2.5rem] border border-border-light overflow-hidden shadow-sm group hover:shadow-xl transition-all duration-500">
            <div className="aspect-[21/9] relative bg-light-bg overflow-hidden">
              <SafeImage src={banner.desktopImage} alt={banner.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button onClick={() => handleEdit(banner)} className="p-4 bg-white text-charcoal rounded-2xl hover:bg-premium-gold hover:text-white transition-all shadow-xl"><Edit3 size={20} /></button>
                <button onClick={() => { if(window.confirm('Delete this banner?')) deleteMutation.mutate(banner._id); }} className="p-4 bg-white text-stock-out rounded-2xl hover:bg-stock-out hover:text-white transition-all shadow-xl"><Trash2 size={20} /></button>
              </div>
              <div className="absolute top-6 left-6 bg-charcoal/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full tracking-widest uppercase">
                Order: {banner.displayOrder}
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-black text-charcoal text-lg tracking-tight mb-1">{banner.title}</h4>
                  <p className="text-xs text-text-muted line-clamp-1 mb-3 font-medium">{banner.subtitle || 'No subtitle provided'}</p>
                  <p className="text-[10px] text-text-muted flex items-center gap-1 font-bold uppercase tracking-widest"><ExternalLink size={10} /> {banner.link}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {banner.isActive ? 'Public' : 'Private'}
                </div>
              </div>
            </div>
          </div>
        ))}
        <AdminImageResizer
          isOpen={isResizerOpen}
          onClose={() => setIsResizerOpen(false)}
          file={resizerFile}
          onSave={handleResizerSave}
        />
      </div>
    </div>
  );
}

