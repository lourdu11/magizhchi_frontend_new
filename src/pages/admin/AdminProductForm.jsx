import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
   Tag, IndianRupee, Layers, ImageIcon, Loader2, X, Save, Sparkles, Layout, Globe, Truck
} from 'lucide-react';
import { adminService, productService, categoryService, purchaseService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

import { FormProvider, useProductForm } from './product-form/FormContext';
import { FormSkeleton } from '../../components/common/Skeletons';
import GeneralInfoTab from './product-form/GeneralInfoTab';
import PricingStockTab from './product-form/PricingStockTab';
import VisualTab from './product-form/VisualTab';
import VariantsTab from './product-form/VariantsTab';
import ProcurementTab from './product-form/ProcurementTab';
import ChannelsTab from './product-form/ChannelsTab';
import ComboTab from './product-form/ComboTab';

export default function AdminProductForm() {
   const { id } = useParams();
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   
   const [searchParams, setSearchParams] = useSearchParams();
   const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general');

   useEffect(() => {
      const tab = searchParams.get('tab');
      if (tab && tab !== activeTab) {
         setActiveTab(tab);
      }
   }, [searchParams]);

   const handleTabChange = (tabId) => {
      setActiveTab(tabId);
      setSearchParams({ tab: tabId });
   };

   // --- Fetch Initial Data for Edit ---
   const { data: initialProduct, isLoading: isProductLoading } = useQuery({
      queryKey: ['admin-product', id],
      queryFn: () => adminService.getAdminProductById(id).then(res => res.data.data.product),
      enabled: !!id
   });

   const { data: categoriesRaw } = useQuery({
      queryKey: ['categories'],
      queryFn: () => categoryService.getCategories().then(r => r.data.data?.categories || r.data.categories || r.data.data || r.data),
   });
   const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];

   const { data: suppliersData } = useQuery({
      queryKey: ['admin-suppliers'],
      queryFn: () => purchaseService.getSuppliers().then(r => r.data),
   });
   const suppliers = suppliersData?.data || suppliersData || [];

    const saveMutation = useMutation({
      mutationFn: (data) => {
         const cleanedData = { ...data };
         if (cleanedData.variants) {
            cleanedData.variants = cleanedData.variants.map(v => {
               if (v._id && String(v._id).startsWith('temp-')) {
                  const { _id, ...rest } = v;
                  return rest;
               }
               return v;
            });
         }

         if (id) {
            return productService.updateProduct(id, cleanedData);
         }
         
         const hasProcurement = cleanedData.initialProcurement?.supplierId && 
                               cleanedData.initialProcurement?.billNumber;
                               
         if (hasProcurement) {
            const { initialProcurement, ...productData } = cleanedData;
            
            // Map variants to procurement items if items array is empty
            if ((!initialProcurement.items || initialProcurement.items.length === 0) && cleanedData.variants?.length > 0) {
               initialProcurement.items = cleanedData.variants.map(v => ({
                  productName: productData.name,
                  sku: v.sku,
                  size: v.size,
                  color: v.color,
                  quantity: Number(v.available) || 0,
                  costPrice: Number(productData.costPrice) || 0,
                  sellingPrice: Number(v.price) || Number(productData.sellingPrice) || 0
               })).filter(item => item.quantity > 0);
            }

            return productService.createProductWithProcurement({
               productData,
               procurementData: initialProcurement
            });
         }
         
         return productService.createProduct(cleanedData);
      },
      onSuccess: () => {
         if (!id) {
            localStorage.removeItem('product_draft');
         }
         queryClient.invalidateQueries(['admin-products']);
         queryClient.invalidateQueries(['admin-purchases']);
         queryClient.invalidateQueries(['admin-suppliers']);
         toast.success(id ? 'Profile Updated' : 'Master Profile & Inventory Recorded');
         navigate('/admin/profiles');
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
   });

   if (id && isProductLoading) {
      return <FormSkeleton />;
   }

   const TABS = [
      { id: 'general', label: 'General Info', icon: Tag },
      { id: 'pricing_stock', label: 'Price & Stock', icon: IndianRupee },
      ...(initialProduct?.productNature === 'combo' ? [{ id: 'combo', label: 'Combo Design', icon: Layers }] : []),
      { id: 'visual', label: 'Visual Identity', icon: ImageIcon },
      ...(initialProduct?.productNature === 'standalone' ? [{ id: 'variants', label: 'Variant Manager', icon: Layers }] : []),
      { id: 'procurement', label: 'Logistics Entry', icon: Truck },
      { id: 'channels', label: 'Sales Channels', icon: Globe }
   ];

   return (
      <FormProvider initialData={initialProduct}>
         <FormContent 
            id={id}
            activeTab={activeTab}
            handleTabChange={handleTabChange}
            TABS={TABS}
            categories={categories}
            suppliers={suppliers}
            saveMutation={saveMutation}
            navigate={navigate}
         />
      </FormProvider>
   );
}

// Separate component to consume FormContext
function FormContent({ id, activeTab, handleTabChange, TABS, categories, suppliers, saveMutation, navigate }) {
   const { state, clearDraft } = useProductForm();
   const { formData } = state;

   // Update TABS dynamically based on current form state (if nature changes)
   const dynamicTabs = [
      { id: 'general', label: 'General Info', icon: Tag },
      { id: 'pricing_stock', label: 'Price & Stock', icon: IndianRupee },
      ...(formData.productNature === 'combo' ? [{ id: 'combo', label: 'Combo Design', icon: Layers }] : []),
      { id: 'visual', label: 'Visual Identity', icon: ImageIcon },
      ...(formData.productNature === 'standalone' ? [{ id: 'variants', label: 'Variant Manager', icon: Layers }] : []),
      { id: 'procurement', label: 'Logistics Entry', icon: Truck },
      { id: 'channels', label: 'Sales Channels', icon: Globe }
   ];

   const handleCancelEntry = () => {
      if (!id) {
         if (window.confirm('Discard all unsaved changes and close the new product form?')) {
            clearDraft();
            navigate('/admin/profiles');
         }
      } else {
         navigate('/admin/profiles');
      }
   };

   const handleDiscardDraft = () => {
      if (window.confirm('Are you sure you want to discard this draft? All entered data will be permanently cleared.')) {
         clearDraft();
         navigate('/admin/profiles');
      }
   };

   return (
      <div className="space-y-6 pb-20">
         <Helmet><title>{id ? 'Edit Master Profile' : 'New Master Profile'} — Admin</title></Helmet>

         {activeTab === 'combo' ? (
            <ComboTab 
               onCommit={() => saveMutation.mutate(formData)}
               onCancel={() => handleTabChange('general')}
            />
         ) : (
            <>
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-border-light pb-8">
                  <div>
                     <div className="flex items-center flex-wrap gap-4">
                        <h1 className="text-3xl font-black text-charcoal tracking-tighter uppercase leading-none">{id ? 'Edit Master Profile' : 'New Master Profile'}</h1>
                        <span className="px-3 py-1 bg-charcoal text-white rounded-full text-[8px] font-black uppercase tracking-widest">{id ? 'ID: ' + id.slice(-8) : 'DRAFT'}</span>
                     </div>
                     <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                        <Layout size={14} className="text-premium-gold" /> Comprehensive Product Configuration
                     </p>
                  </div>
                  <button onClick={handleCancelEntry} className="px-4 md:px-4 md:px-8 py-4 bg-white border border-border-light text-charcoal rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-red-50 hover:text-red-500 transition-all flex items-center gap-2">
                     <X size={16} /> Cancel Entry
                  </button>
               </div>

               <div className="bg-white rounded-[4rem] shadow-2xl shadow-charcoal/5 border border-border-light overflow-hidden flex flex-col lg:flex-row">
                  <div className="w-full lg:w-80 bg-light-bg/30 border-r border-border-light p-4 md:p-4 md:p-8 space-y-2">
                     {dynamicTabs.map(tab => (
                        <button
                           key={tab.id}
                           onClick={() => handleTabChange(tab.id)}
                           className={`w-full flex items-center gap-4 px-4 md:px-4 md:px-8 py-5 rounded-[2rem] transition-all relative group ${activeTab === tab.id ? 'bg-charcoal text-white shadow-xl shadow-charcoal/20' : 'text-text-muted hover:bg-white'}`}
                        >
                           <tab.icon size={18} className={activeTab === tab.id ? 'text-premium-gold' : 'group-hover:scale-110 transition-transform'} />
                           <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                           {activeTab === tab.id && <motion.div layoutId="tab-active" className="absolute right-4 w-1.5 h-1.5 bg-premium-gold rounded-full" />}
                        </button>
                     ))}
                  </div>

                  <div className="flex-1 p-12 lg:p-20 bg-white min-h-[85vh] pb-40">
                     <div className="max-w-4xl">
                        {activeTab === 'general' && <GeneralInfoTab categories={categories} />}
                        {activeTab === 'pricing_stock' && <PricingStockTab />}
                        {activeTab === 'visual' && <VisualTab />}
                        {activeTab === 'variants' && <VariantsTab />}
                        {activeTab === 'procurement' && <ProcurementTab suppliers={suppliers} setActiveTab={handleTabChange} />}
                        {activeTab === 'channels' && <ChannelsTab />}
                     </div>
                  </div>
               </div>

               <div className="fixed bottom-0 left-0 right-0 lg:left-64 p-4 md:p-4 md:p-8 bg-white/80 backdrop-blur-xl border-t border-border-light flex items-center justify-between z-[50] shadow-2xl">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Configuration Progress</span>
                     <div className="w-64 h-2 bg-light-bg rounded-full overflow-hidden">
                        <div className="h-full bg-premium-gold transition-all duration-500" style={{ width: '85%' }} />
                     </div>
                  </div>
                  <div className="flex gap-6">
                     <button onClick={handleDiscardDraft} className="px-10 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-charcoal transition-colors">Discard Draft</button>
                     <button 
                        onClick={() => saveMutation.mutate(formData)} 
                        disabled={saveMutation.isPending} 
                        className="px-20 py-5 bg-charcoal text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-charcoal/20 hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-3 disabled:opacity-50"
                     >
                        {saveMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> {id ? 'Push Updates Globally' : 'Commit Master Profile'}</>}
                     </button>
                  </div>
               </div>
            </>
         )}
      </div>
   );
}
