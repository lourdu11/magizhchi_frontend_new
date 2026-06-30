import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2, ImageIcon, ChevronLeft, Eye, EyeOff, ExternalLink, Check, Monitor, Smartphone, Copy } from 'lucide-react';
import { bannerService, adminService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

import AdminImageResizer from '../../components/admin/AdminImageResizer';
import { LivePreview, DropZone } from '../../components/admin/AdminVisualManager';

const EMPTY = { 
  title: '', subtitle: '', link: '/', displayOrder: 0, isActive: true,
  desktopImage: '', mobileImage: '', 
  desktopFit: 'cover', desktopPos: 'center', desktopScale: 1, desktopGravity: 'auto',
  mobileFit: 'cover', mobilePos: 'center', mobileScale: 1, mobileGravity: 'auto',
};

export default function AdminBannerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(EMPTY);
  const [isUploading, setIsUploading] = useState(false);
  
  const [resizerFile, setResizerFile] = useState(null);
  const [isResizerOpen, setIsResizerOpen] = useState(false);
  
  const [uploadTab, setUploadTab] = useState('file');
  const [urlInput, setUrlInput] = useState('');
  const [lastUrl, setLastUrl] = useState('');

  const { data: bannerData, isFetching } = useQuery({
    queryKey: ['admin-banner', id],
    queryFn: () => bannerService.getAllBanners().then(r => r.data.data.find(b => b._id === id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (bannerData) {
      setForm({
        ...bannerData,
        desktopFit: bannerData.desktopFit || 'cover',
        desktopPos: bannerData.desktopPos || 'center',
        mobileFit: bannerData.mobileFit || 'cover',
        mobilePos: bannerData.mobilePos || 'center'
      });
    }
  }, [bannerData]);

  const saveMutation = useMutation({
    mutationFn: (data) => id ? bannerService.updateBanner(id, data) : bannerService.createBanner(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-banners']);
      toast.success(id ? 'Banner updated' : 'Banner created'); 
      navigate('/admin/banners');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const handleUpload = (file) => {
    if (!file) return;
    setResizerFile(file);
    setIsResizerOpen(true);
  };

  const handleResizerSave = async ({ desktopFile, mobileFile }) => {
    setIsResizerOpen(false);
    setResizerFile(null);
    setIsUploading(true);
    try {
      const fdDesktop = new FormData();
      fdDesktop.append('image', desktopFile, 'banner_desktop.webp');
      const resDesktop = await adminService.uploadImage(fdDesktop);
      const desktopUrl = resDesktop.data?.url || resDesktop.data?.data?.url;

      const fdMobile = new FormData();
      fdMobile.append('image', mobileFile, 'banner_mobile.webp');
      const resMobile = await adminService.uploadImage(fdMobile);
      const mobileUrl = resMobile.data?.url || resMobile.data?.data?.url;

      if (desktopUrl && mobileUrl) {
        setForm(prev => ({
          ...prev,
          desktopImage: desktopUrl,
          mobileImage: mobileUrl,
          desktopFit: 'cover',
          mobileFit: 'cover'
        }));
        if(typeof resizerFile === 'string') {
          setLastUrl(resizerFile);
        }
        toast.success('Perfectly sized images applied to all device sizes!');
      }
    } catch (err) {
      toast.error('Upload failed: ' + (err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const applyUrl = (url) => {
    if (!url.trim()) return toast.error('Please enter a URL');
    handleUpload(url.trim());
    setUrlInput('');
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
    navigate('/admin/banners');
  };

  return (
    <div className="pb-20">
      <Helmet><title>{id ? 'Edit Banner' : 'New Banner'} — Admin</title></Helmet>

      {/* Header */}
      <div className="flex items-center gap-6 mb-10">
        <button onClick={handleCancel} className="p-4 bg-white border border-border-light rounded-2xl hover:bg-light-bg transition-all shadow-sm">
          <ChevronLeft size={24} className="text-charcoal" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-charcoal uppercase tracking-tighter">
            {id ? 'Refine Banner' : 'New Banner Configuration'}
          </h1>
          <p className="text-sm font-bold text-text-muted uppercase tracking-widest mt-1">
            {id ? 'Modifying existing banner' : 'Initializing new banner'}
          </p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 md:p-12 rounded-[3rem] border border-border-light shadow-2xl relative overflow-hidden">
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-10">
          
          <div className="grid lg:grid-cols-12 gap-10 md:gap-16">
            
            {/* ── LEFT COLUMN (TEXT FIELDS) ── */}
            <div className="lg:col-span-7 space-y-10">
              <label className="block space-y-2">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Banner Title</span>
                <input required autoFocus className="w-full bg-light-bg border border-transparent rounded-[2rem] px-6 py-5 text-xl font-black text-charcoal placeholder:text-text-muted/40 focus:outline-none focus:border-premium-gold transition-all" placeholder="e.g. Summer Collection" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </label>
              
              <label className="block space-y-2">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Subtitle / Caption</span>
                <textarea rows="3" className="w-full bg-light-bg border border-transparent rounded-[2rem] px-6 py-5 text-base font-medium text-charcoal placeholder:text-text-muted/40 focus:outline-none focus:border-premium-gold transition-all resize-none" placeholder="e.g. Discover the art of perfect tailoring." value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} />
              </label>

              <label className="block space-y-2">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Redirect Link</span>
                <input required className="w-full bg-light-bg border border-transparent rounded-[2rem] px-6 py-5 text-base font-bold text-charcoal placeholder:text-text-muted/40 focus:outline-none focus:border-premium-gold transition-all" placeholder="e.g. /collections/pants" value={form.link} onChange={e => setForm({...form, link: e.target.value})} />
              </label>
              
              <div className="grid grid-cols-2 gap-6">
                <label className="block space-y-2">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Display Order</span>
                  <input type="number" className="w-full bg-light-bg border border-transparent rounded-[2rem] px-6 py-5 text-lg font-black text-charcoal focus:outline-none focus:border-premium-gold transition-all" value={form.displayOrder} onChange={e => setForm({...form, displayOrder: e.target.value})} />
                </label>
                
                <div className="space-y-4">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Status Control</span>
                  <div className="flex bg-light-bg rounded-[2rem] p-2 border border-border-light relative overflow-hidden">
                    <div className={`absolute top-2 bottom-2 w-[calc(50%-8px)] rounded-[1.5rem] bg-white shadow-md transition-all duration-300 ${form.isActive ? 'translate-x-0' : 'translate-x-[calc(100%+16px)]'}`} />
                    <button type="button" onClick={() => setForm({...form, isActive: true})} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest z-10 transition-colors ${form.isActive ? 'text-charcoal' : 'text-text-muted hover:text-charcoal'}`}>
                      <Eye size={14} className="inline-block mr-1.5 -mt-0.5" /> Public
                    </button>
                    <button type="button" onClick={() => setForm({...form, isActive: false})} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest z-10 transition-colors ${!form.isActive ? 'text-charcoal' : 'text-text-muted hover:text-charcoal'}`}>
                      <EyeOff size={14} className="inline-block mr-1.5 -mt-0.5" /> Hidden
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN (UPLOADER) ── */}
            <div className="lg:col-span-5 space-y-8 bg-light-bg/30 p-6 sm:p-8 rounded-[2.5rem] border border-border-light/50">
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
                {(form.desktopImage || form.mobileImage) && (
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
                    hasImage={!!form.desktopImage}
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
                        onClick={() => applyUrl(urlInput)}
                        className="px-5 py-3 bg-charcoal text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all whitespace-nowrap"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}

                {/* Uploaded URL display */}
                {lastUrl && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                    <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                      <Check size={10} /> Uploaded URL
                    </p>
                    <div className="flex gap-2 items-center">
                      <p className="text-[9px] text-emerald-700 font-mono truncate flex-1">{lastUrl}</p>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(lastUrl); toast.success('URL copied!'); }}
                        className="shrink-0 p-2 bg-white border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all"
                        title="Copy URL"
                      >
                        <Copy size={12} className="text-emerald-600" />
                      </button>
                      <a
                        href={lastUrl}
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
              </div>
            </div>
          </div>

          {/* ── LIVE PREVIEWS (FULL WIDTH) ── */}
          <div className="space-y-6 pt-10 border-t border-border-light">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-charcoal/5 flex items-center justify-center">
                <Monitor size={14} className="text-charcoal" />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Cross-Device Validation</h3>
                <p className="text-xs font-bold text-charcoal uppercase tracking-widest mt-0.5">Live Preview Showcase</p>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="space-y-3 bg-light-bg/20 p-4 sm:p-4 sm:p-6 rounded-[2rem] border border-border-light/50">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-charcoal uppercase tracking-wider flex items-center gap-2"><Monitor size={12}/> Desktop (21:9)</span>
                </div>
                <LivePreview
                  src={form.desktopImage}
                  fit={form.desktopFit}
                  position={form.desktopPos}
                  scale={form.desktopScale}
                  label="Desktop"
                  aspect="21/9"
                />
              </div>

              <div className="space-y-3 bg-light-bg/20 p-4 sm:p-4 sm:p-6 rounded-[2rem] border border-border-light/50">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-charcoal uppercase tracking-wider flex items-center gap-2"><Monitor size={12}/> Tablet (16:9)</span>
                </div>
                <LivePreview
                  src={form.desktopImage}
                  fit={form.desktopFit}
                  position={form.desktopPos}
                  scale={form.desktopScale}
                  label="Tablet"
                  aspect="16/9"
                />
              </div>

              <div className="space-y-3 bg-light-bg/20 p-4 sm:p-4 sm:p-6 rounded-[2rem] border border-border-light/50">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-charcoal uppercase tracking-wider flex items-center gap-2"><Smartphone size={12}/> Mobile (4:5)</span>
                </div>
                <div className="max-w-xs mx-auto">
                  <LivePreview
                    src={form.mobileImage}
                    fit={form.mobileFit}
                    position={form.mobilePos}
                    scale={form.mobileScale}
                    label="Mobile"
                    aspect="4/5"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-border-light">
            <button type="submit" disabled={saveMutation.isPending || isUploading} className="bg-charcoal text-white px-12 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-charcoal/20 hover:bg-premium-gold hover:text-charcoal transition-all flex items-center justify-center gap-3">
              {saveMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> {id ? 'Publish Updates' : 'Initialize Banner'}</>}
            </button>
            <button type="button" onClick={handleCancel} className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-charcoal transition-colors px-4 md:px-8 py-5">Discard Changes</button>
          </div>
        </form>
      </motion.div>
      
      <AdminImageResizer
        isOpen={isResizerOpen}
        onClose={() => setIsResizerOpen(false)}
        file={resizerFile}
        onSave={handleResizerSave}
      />
    </div>
  );
}
