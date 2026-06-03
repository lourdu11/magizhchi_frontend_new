import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Save, X, Loader2, Tag, Ruler, ImageIcon, Layout, Sparkles, ChevronRight, Info, Search, Eye, EyeOff, Link2, Monitor, Tablet, Smartphone } from 'lucide-react';
import { categoryService, adminService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveAssetURL } from '../../utils/assetResolver';



export default function AdminCategories() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: cats, isLoading } = useQuery({
    queryKey: ['admin-categories-all'],
    queryFn: () => categoryService.getCategories({ all: true }).then(r => {
      const payload = r.data.data;
      return payload?.categories || payload || [];
    }),
    staleTime: 0,
    refetchOnMount: true,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => categoryService.createCategory(data),
    onSuccess: () => { qc.invalidateQueries(['categories']); toast.success('Category created'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => categoryService.deleteCategory(id),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['categories'] }); 
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-inventory'] });
      toast.success('Category deleted and products unlinked'); 
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete category'),
  });

  const startEdit = (cat) => { 
     navigate(`/admin/categories/edit/${cat._id}`);
  };

  return (
    <div className="space-y-10 pb-20">
      <Helmet><title>Taxonomy Command — Admin</title></Helmet>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-4 md:p-4 md:p-8 rounded-[3rem] border border-border-light shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-charcoal tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-charcoal to-neutral-400">Taxonomy Master</h1>
          <p className="text-text-muted text-sm font-medium">Architect your store structure and navigation</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-premium-gold transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search Taxonomies..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-light-bg border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-premium-gold/20 w-full sm:w-64 transition-all"
            />
          </div>
          <button onClick={() => navigate('/admin/categories/new')} className="bg-charcoal text-white px-4 md:px-4 md:px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-2 shadow-xl shadow-charcoal/10 whitespace-nowrap">
            <Plus size={16} /> New Taxonomy
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Categories', value: cats?.length || 0, icon: Tag },
          { label: 'Active', value: cats?.filter(c => c.isActive).length || 0, icon: Eye, color: 'text-green-500' },
          { label: 'Draft/Inactive', value: cats?.filter(c => !c.isActive).length || 0, icon: EyeOff, color: 'text-amber-500' },
          { label: 'Top Level', value: cats?.filter(c => !c.parentCategory).length || 0, icon: Layout },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 sm:p-4 sm:p-6 rounded-[2rem] border border-border-light shadow-sm flex items-center gap-4">
            <div className={`p-4 rounded-2xl bg-light-bg ${stat.color || 'text-charcoal'}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-xl font-black text-charcoal">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>



      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading && <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-premium-gold" size={40} /></div>}
        {cats?.length === 0 && <div className="col-span-full py-24 text-center text-text-muted font-bold uppercase tracking-widest">Empty Taxonomy.</div>}
        {cats?.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(cat => (
          <div key={cat._id} className={`bg-white rounded-[3rem] border border-border-light overflow-hidden shadow-sm group hover:shadow-2xl transition-all hover:-translate-y-1 ${!cat.isActive ? 'opacity-75 grayscale-[0.5]' : ''}`}>
            <div className="h-56 bg-light-bg relative overflow-hidden">
              {cat.image ? (
                <img src={resolveAssetURL(cat.image)} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={(e) => { e.target.src = '/placeholder.jpg'; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Tag size={48} className="text-border-light" /></div>
              )}
              <div className="absolute top-6 right-6 flex flex-col gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                <button onClick={() => startEdit(cat)} className="p-4 bg-white rounded-2xl shadow-xl text-charcoal hover:bg-premium-gold hover:text-charcoal transition-all"><Edit size={18} /></button>
                <button 
                  disabled={deleteMutation.isPending}
                  onClick={() => { if (window.confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate(cat._id); }} 
                  className="p-4 bg-white rounded-2xl shadow-xl text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                >
                  {deleteMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>
              </div>
              <div className="absolute bottom-6 left-6 flex items-center gap-2">
                 <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border ${cat.isActive ? 'bg-green-500 text-white border-green-400' : 'bg-amber-500 text-white border-amber-400'}`}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                 </span>
              </div>
            </div>
            <div className="p-4 md:p-4 md:p-8 pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col">
                  <h4 className="text-lg font-black text-charcoal tracking-tight group-hover:text-premium-gold transition-colors">{cat.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[9px] font-black text-text-muted uppercase tracking-widest bg-light-bg px-2 py-0.5 rounded-md">
                      <Sparkles size={10} className="text-premium-gold" /> {cat.productCount || 0} Products
                    </span>
                    <div className="flex items-center gap-1.5 border-l border-border-light pl-3">
                      <Monitor size={12} className={cat.image ? 'text-green-500' : 'text-border-light'} />
                      <Tablet size={12} className={cat.tabletImage ? 'text-green-500' : 'text-border-light'} />
                      <Smartphone size={12} className={cat.mobileImage ? 'text-green-500' : 'text-border-light'} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                   <button 
                     onClick={() => navigate(`/admin/products?category=${cat._id}`)}
                     title="View Products"
                     className="p-2 hover:bg-light-bg rounded-xl text-text-muted hover:text-charcoal transition-all"
                   >
                      <Link2 size={16} />
                   </button>
                   <ChevronRight size={18} className="text-border-light group-hover:text-premium-gold transition-all" />
                </div>
              </div>
              {cat.description ? <p className="text-xs text-text-muted font-medium line-clamp-2 leading-relaxed">{cat.description}</p> : <p className="text-xs italic text-text-muted">No description provided</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
