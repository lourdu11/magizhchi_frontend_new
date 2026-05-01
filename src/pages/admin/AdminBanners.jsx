import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Plus, Trash2, ExternalLink, Loader2, Save, X, ToggleLeft, ToggleRight, Edit3, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { adminService, bannerService } from '../../services';
import SafeImage from '../../components/common/SafeImage';

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
    title: '', subtitle: '', desktopImage: '', mobileImage: '', link: '/', displayOrder: 0, isActive: true
  });

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
    setFormData({ title: '', subtitle: '', desktopImage: '', mobileImage: '', link: '/', displayOrder: 0, isActive: true });
  };

  const handleEdit = (banner) => {
    setFormData({ ...banner });
    setEditingId(banner._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = async (e, type = 'desktop') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fd = new FormData();
    fd.append('image', file);

    try {
      const res = await adminService.uploadImage(fd);
      if (res.data.success) {
        setFormData(prev => ({ 
          ...prev, 
          [type === 'desktop' ? 'desktopImage' : 'mobileImage']: res.data.url 
        }));
        toast.success('Image uploaded to Cloudinary');
      }
    } catch (err) {
      toast.error('Upload failed');
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block">Desktop Image</span>
                  <div className="relative group aspect-[21/9] bg-light-bg rounded-2xl overflow-hidden border border-border-light">
                    {formData.desktopImage ? (
                      <SafeImage src={formData.desktopImage} alt="Desktop Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted/30"><ImageIcon size={32} /></div>
                    )}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'desktop')} disabled={isUploading} />
                      {isUploading ? <Loader2 className="animate-spin text-white" /> : <Upload className="text-white" />}
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block">Mobile Image</span>
                  <div className="relative group aspect-[1/1] bg-light-bg rounded-2xl overflow-hidden border border-border-light">
                    {formData.mobileImage ? (
                      <SafeImage src={formData.mobileImage} alt="Mobile Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted/30"><ImageIcon size={32} /></div>
                    )}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'mobile')} disabled={isUploading} />
                      {isUploading ? <Loader2 className="animate-spin text-white" /> : <Upload className="text-white" />}
                    </label>
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
      </div>
    </div>
  );
}
