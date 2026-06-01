import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Plus, Trash2, ExternalLink, Loader2, Save, X, ToggleLeft, ToggleRight, Edit3, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { adminService, bannerService } from '../../services';
import SafeImage from '../../components/common/SafeImage';
import AdminImageResizer from '../../components/admin/AdminImageResizer';

const BannerPreview = ({ src, aspect, fit, pos, scale, label }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Reset states when src changes
  useState(() => {
    if (src) { setLoading(true); setError(false); }
  }, [src]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-neutral-100 border border-neutral-200 shadow-inner group transition-all duration-300" style={{ aspectRatio: aspect }}>
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
      <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border border-neutral-200 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
        {aspect} PREVIEW
      </div>
    </div>
  );
};

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
  const [useCommonImage, setUseCommonImage] = useState(false);
  const [resizerFile, setResizerFile] = useState(null);
  const [isResizerOpen, setIsResizerOpen] = useState(false);

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
    setUseCommonImage(false);
  };

  const handleEdit = (banner) => {
    setFormData({ 
      ...banner,
      desktopFit: banner.desktopFit || 'cover',
      desktopPos: banner.desktopPos || 'center',
      mobileFit: banner.mobileFit || 'cover',
      mobilePos: banner.mobilePos || 'center'
    });
    setUseCommonImage(banner.desktopImage === banner.mobileImage);
    setEditingId(banner._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = (e, type = 'desktop') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResizerFile(file);
    setIsResizerOpen(true);
    e.target.value = null;
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
          mobileImage: mobileUrl
        }));
        setUseCommonImage(false);
        toast.success('Perfectly cropped images uploaded successfully!');
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
              
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Asset Configuration</span>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="hidden" checked={useCommonImage} onChange={e => {
                    setUseCommonImage(e.target.checked);
                    if(e.target.checked && formData.desktopImage) setFormData({...formData, mobileImage: formData.desktopImage});
                  }} />
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${useCommonImage ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useCommonImage ? 'left-4.5' : 'left-0.5'}`} />
                  </div>
                  <span className="text-[9px] font-black text-charcoal uppercase tracking-widest">Mirror Desktop</span>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Desktop Asset */}
                <div className="bg-light-bg/40 p-4 rounded-3xl border border-border-light/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-charcoal uppercase tracking-widest">Desktop View (21:9)</span>
                    <div className="flex gap-2">
                       <select className="text-[9px] font-black bg-white border-none rounded-lg px-2 py-1 outline-none" value={formData.desktopFit} onChange={e => setFormData({...formData, desktopFit: e.target.value})}>
                          <option value="cover">COVER</option>
                          <option value="contain">CONTAIN</option>
                       </select>
                       <select className="text-[9px] font-black bg-white border-none rounded-lg px-2 py-1 outline-none" value={formData.desktopPos} onChange={e => setFormData({...formData, desktopPos: e.target.value})}>
                          <option value="top">TOP</option>
                          <option value="center">CENTER</option>
                          <option value="bottom">BOTTOM</option>
                       </select>
                       <select className="text-[9px] font-black bg-white border-none rounded-lg px-2 py-1 outline-none" value={formData.desktopGravity} onChange={e => setFormData({...formData, desktopGravity: e.target.value})} title="AI Focus Area">
                          <option value="auto">AI AUTO</option>
                          <option value="faces">FACES</option>
                          <option value="center">CENTER</option>
                          <option value="north">TOP</option>
                          <option value="south">BOTTOM</option>
                       </select>
                       <select className="text-[9px] font-black bg-white border-none rounded-lg px-2 py-1 outline-none" value={formData.desktopScale} onChange={e => setFormData({...formData, desktopScale: parseFloat(e.target.value)})}>
                          <option value="1">100%</option>
                          <option value="1.1">110%</option>
                          <option value="1.2">120%</option>
                          <option value="1.5">150%</option>
                       </select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                     <div className="relative group">
                       <BannerPreview 
                          src={formData.desktopImage} 
                          aspect="21 / 9" 
                          fit={formData.desktopFit} 
                          pos={formData.desktopPos} 
                          scale={formData.desktopScale}
                          label="Desktop"
                       />
                       <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-xl z-20">
                         <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'desktop')} disabled={isUploading} />
                         {isUploading ? <Loader2 className="animate-spin text-white" /> : <Upload className="text-white" />}
                       </label>
                     </div>
                     <div className="space-y-3">
                        <div className="space-y-1.5">
                           <p className="text-[8px] font-black text-text-muted uppercase tracking-widest ml-1">Direct URL (Desktop)</p>
                           <input 
                              className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-[10px] font-bold focus:ring-1 focus:ring-premium-gold/30 transition-all" 
                              placeholder="https://images.unsplash.com/..." 
                              value={formData.desktopImage} 
                              onChange={e => {
                                const val = e.target.value;
                                setFormData(prev => {
                                  const next = { ...prev, desktopImage: val };
                                  if(useCommonImage) next.mobileImage = val;
                                  return next;
                                });
                              }} 
                           />
                        </div>
                        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                          <p className="text-[9px] font-bold text-text-muted leading-relaxed uppercase tracking-tighter">Recommended Strategy</p>
                          <p className="text-[8px] font-medium text-neutral-400 mt-1">Wide Hero: 1920x820px. Use "FACES" focus for portraits.</p>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Mobile Asset */}
                {!useCommonImage && (
                   <div className="bg-light-bg/40 p-4 rounded-3xl border border-border-light/50 space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-charcoal uppercase tracking-widest">Mobile View (4:5)</span>
                       <div className="flex gap-2">
                          <select className="text-[9px] font-black bg-white border border-neutral-200 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-neutral-50 transition-colors" value={formData.mobileFit} onChange={e => setFormData({...formData, mobileFit: e.target.value})}>
                             <option value="cover">COVER</option>
                             <option value="contain">CONTAIN</option>
                          </select>
                          <select className="text-[9px] font-black bg-white border border-neutral-200 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-neutral-50 transition-colors" value={formData.mobilePos} onChange={e => setFormData({...formData, mobilePos: e.target.value})}>
                             <option value="top">TOP</option>
                             <option value="center">CENTER</option>
                             <option value="bottom">BOTTOM</option>
                          </select>
                          <select className="text-[9px] font-black bg-white border border-neutral-200 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-neutral-50 transition-colors" value={formData.mobileGravity} onChange={e => setFormData({...formData, mobileGravity: e.target.value})} title="AI Focus Area">
                             <option value="auto">AI AUTO</option>
                             <option value="faces">FACES</option>
                             <option value="center">CENTER</option>
                             <option value="north">TOP</option>
                             <option value="south">BOTTOM</option>
                          </select>
                          <select className="text-[9px] font-black bg-white border border-neutral-200 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-neutral-50 transition-colors" value={formData.mobileScale} onChange={e => setFormData({...formData, mobileScale: parseFloat(e.target.value)})}>
                             <option value="1">100%</option>
                             <option value="1.1">110%</option>
                             <option value="1.2">120%</option>
                             <option value="1.5">150%</option>
                          </select>
                       </div>
                     </div>
                     <div className="grid md:grid-cols-2 gap-4">
                        <div className="relative group">
                          <BannerPreview 
                             src={formData.mobileImage} 
                             aspect="4 / 5" 
                             fit={formData.mobileFit} 
                             pos={formData.mobilePos} 
                             scale={formData.mobileScale}
                             label="Mobile"
                          />
                          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-xl z-20">
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'mobile')} disabled={isUploading} />
                            {isUploading ? <Loader2 className="animate-spin text-white" /> : <Upload className="text-white" />}
                          </label>
                        </div>
                        <div className="space-y-3">
                           <div className="space-y-1.5">
                              <p className="text-[8px] font-black text-text-muted uppercase tracking-widest ml-1">Direct URL (Mobile)</p>
                              <input 
                                 className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-[10px] font-bold focus:ring-1 focus:ring-premium-gold/30 transition-all" 
                                 placeholder="https://images.unsplash.com/..." 
                                 value={formData.mobileImage} 
                                 onChange={e => setFormData({...formData, mobileImage: e.target.value})} 
                              />
                           </div>
                           <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                              <p className="text-[9px] font-bold text-text-muted leading-relaxed uppercase tracking-tighter">Mobile Optimization</p>
                              <p className="text-[8px] font-medium text-neutral-400 mt-1">Use vertical shots (4:5). 1080x1350px recommended.</p>
                           </div>
                        </div>
                     </div>
                   </div>
                )}
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

