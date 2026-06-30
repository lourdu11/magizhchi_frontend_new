import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ExternalLink, Loader2, Edit3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { bannerService } from '../../services';
import SafeImage from '../../components/common/SafeImage';

export default function AdminBanners() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => bannerService.getAllBanners().then(r => r.data.data),
    select: (data) => [...data].sort((a, b) => a.displayOrder - b.displayOrder),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => bannerService.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-banners']);
      toast.success('Banner deleted');
    },
  });

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
          onClick={() => navigate('/admin/banners/new')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Add Banner
        </button>
      </div>



      <div className="flex flex-col gap-4">
        {banners?.length === 0 && <div className="col-span-full py-20 text-center text-text-muted font-bold uppercase tracking-widest">No banners found. Start by adding a hero banner.</div>}
        {banners?.map(banner => (
          <div key={banner._id} className={`bg-white p-4 rounded-3xl border border-border-light shadow-sm group hover:shadow-lg transition-all flex flex-col md:flex-row items-center gap-6 ${!banner.isActive ? 'opacity-75 grayscale-[0.5]' : ''}`}>
            
            <div className="w-full md:w-80 aspect-[21/9] rounded-2xl bg-light-bg relative overflow-hidden shrink-0">
              <SafeImage src={banner.desktopImage} alt={banner.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute top-2 left-2 bg-charcoal/80 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full tracking-widest uppercase">
                Order: {banner.displayOrder}
              </div>
            </div>
            
            <div className="flex-1 min-w-0 w-full py-2">
              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div>
                  <h4 className="font-black text-charcoal text-lg sm:text-xl tracking-tight mb-1 group-hover:text-premium-gold transition-colors">{banner.title}</h4>
                  <p className="text-xs text-text-muted line-clamp-1 mb-4 font-medium">{banner.subtitle || 'No subtitle provided'}</p>
                  
                  <div className="flex items-center gap-4">
                    <p className="text-[10px] text-charcoal flex items-center gap-1.5 font-bold uppercase tracking-widest bg-light-bg px-3 py-1.5 rounded-xl border border-border-light"><ExternalLink size={12} className="text-premium-gold" /> {banner.link}</p>
                    <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border ${banner.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {banner.isActive ? 'Public' : 'Hidden'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-end md:self-auto mt-4 md:mt-0">
                  <button onClick={() => navigate(`/admin/banners/edit/${banner._id}`)} className="p-3 bg-light-bg text-charcoal rounded-xl hover:bg-premium-gold hover:text-charcoal transition-all shadow-sm">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => { if(window.confirm('Delete this banner?')) deleteMutation.mutate(banner._id); }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

