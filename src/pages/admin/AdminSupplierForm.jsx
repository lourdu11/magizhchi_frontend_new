import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
   ArrowLeft, 
   Save, 
   X, 
   UserPlus, 
   Plus, 
   Loader2, 
   CheckCircle2,
   Truck,
   Phone,
   MapPin,
   CreditCard,
   ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { purchaseService } from '../../services';

export default function AdminSupplierForm() {
   const { id } = useParams();
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const isEditing = !!id;

   const [formData, setFormData] = useState(() => {
      if (!isEditing) {
         try {
            const saved = localStorage.getItem('supplier_draft');
            if (saved) {
               const parsed = JSON.parse(saved);
               if (parsed && typeof parsed === 'object') return parsed;
            }
         } catch (e) {
            console.error(e);
         }
      }
      return {
         name: '',
         phone: '',
         email: '',
         gstin: '',
         address: '',
         openingBalance: ''
      };
   });

   // Fetch data if editing
   const { data: supplierData, isLoading: isLoadingSupplier } = useQuery({
      queryKey: ['admin-supplier', id],
      queryFn: () => purchaseService.getSuppliers({ showDeleted: true }).then(r => {
         const list = r.data?.data || r.data || [];
         return list.find(s => s._id === id);
      }),
      enabled: isEditing
   });

   useEffect(() => {
      if (supplierData) {
         setFormData({
            name: supplierData.name || '',
            phone: supplierData.phone || '',
            email: supplierData.email || '',
            gstin: supplierData.gstin || '',
            address: supplierData.address || '',
            openingBalance: supplierData.openingBalance || '0'
         });
      }
   }, [supplierData]);

   // Save draft to localStorage reactively on changes (only for onboarding)
   useEffect(() => {
      if (!isEditing) {
         localStorage.setItem('supplier_draft', JSON.stringify(formData));
      }
   }, [formData, isEditing]);

   const mutation = useMutation({
      mutationFn: (data) => isEditing ? purchaseService.updateSupplier(id, data) : purchaseService.createSupplier(data),
      onSuccess: () => {
         if (!isEditing) {
            localStorage.removeItem('supplier_draft');
         }
         queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
         queryClient.invalidateQueries({ queryKey: ['admin-suppliers-stats'] });
         toast.success(isEditing ? 'Partner details updated' : 'Trade Partner onboarded successfully');
         navigate('/admin/procurement');
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to save partner details')
   });

   const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.name || !formData.phone) return toast.error('Name and Phone are required');
      if (formData.phone.length !== 10) return toast.error('Phone must be 10 digits');
      
      const dataToSubmit = {
         ...formData,
         openingBalance: Number(formData.openingBalance) || 0
      };
      mutation.mutate(dataToSubmit);
   };

   const handleCancel = () => {
      if (!isEditing) {
         if (window.confirm('Discard all unsaved supplier changes and close?')) {
            localStorage.removeItem('supplier_draft');
            navigate(-1);
         }
      } else {
         navigate(-1);
      }
   };

   if (isEditing && isLoadingSupplier) {
      return (
         <div className="min-h-dvh bg-light-bg flex items-center justify-center">
            <Loader2 className="animate-spin text-premium-gold" size={48} />
         </div>
      );
   }

   return (
      <div className="min-h-dvh bg-[#F8F9FA] pb-20">
         <Helmet><title>{isEditing ? 'Edit Trade Partner' : 'Onboard Trade Partner'} — Magizhchi</title></Helmet>
         
         {/* Top Navigation */}
         <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-border-light px-4 md:px-8 py-4 sm:py-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <button onClick={handleCancel} className="p-3 hover:bg-light-bg rounded-2xl text-text-muted transition-all">
                     <ArrowLeft size={20} />
                  </button>
                  <div>
                     <h1 className="text-2xl font-black text-charcoal tracking-tighter uppercase">{isEditing ? 'Update Partner' : 'New Trade Partner'}</h1>
                     <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Procurement & Supply Chain Registry</p>
                  </div>
               </div>
               
               <div className="flex items-center flex-wrap gap-4">
                  <button onClick={handleCancel} className="px-4 sm:px-6 py-3 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-charcoal transition-all">
                     Cancel
                  </button>
                  <button 
                     onClick={handleSubmit}
                     disabled={mutation.isPending}
                     className="px-4 md:px-8 py-4 bg-charcoal text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-2"
                  >
                     {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                     {isEditing ? 'Save Changes' : 'Authorize Partner'}
                  </button>
               </div>
            </div>
         </div>

         <main className="max-w-5xl mx-auto px-4 md:px-8 mt-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               
               {/* Left: Info Card */}
               <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-border-light relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 md:p-8 text-premium-gold/10 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={120} strokeWidth={1} />
                     </div>
                     
                     <div className="w-16 h-16 bg-premium-gold/10 text-premium-gold rounded-3xl flex items-center justify-center mb-8">
                        <UserPlus size={32} />
                     </div>
                     
                     <h3 className="text-xl font-black text-charcoal uppercase tracking-tight mb-4">Partner Security</h3>
                     <p className="text-sm text-text-muted font-medium leading-relaxed">
                        Magizhchi maintains a secure registry of trade partners. All procurement activity, payments, and ledger entries are cryptographically linked to the Partner ID.
                     </p>
                     
                     <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-3 text-[10px] font-black text-charcoal uppercase tracking-widest">
                           <div className="w-2 h-2 rounded-full bg-green-500" />
                           Identity Verified
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-black text-charcoal uppercase tracking-widest text-opacity-50">
                           <div className="w-2 h-2 rounded-full bg-border-dark" />
                           Compliance Checked
                        </div>
                     </div>
                  </div>

                  <div className="bg-charcoal rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                     <div className="absolute -bottom-10 -right-10 text-white/5">
                        <CreditCard size={200} />
                     </div>
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Ledger Note</h4>
                     <p className="text-sm font-bold leading-relaxed">
                        "Opening Balance" will be added to the initial outstanding amount. Use this for existing dues.
                     </p>
                  </div>
               </div>

               {/* Right: Form */}
               <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white rounded-[4rem] p-12 shadow-sm border border-border-light">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        
                        <div className="space-y-6">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 flex items-center gap-2">
                                 <Truck size={12} className="text-premium-gold" /> Business Trade Name <span className="text-red-500">*</span>
                              </label>
                              <input 
                                 type="text"
                                 placeholder="e.g. Sri Textiles Hub"
                                 className="w-full bg-light-bg/50 border-2 border-transparent focus:border-premium-gold focus:bg-white rounded-[1.5rem] px-4 md:px-8 py-5 font-black text-charcoal transition-all outline-none"
                                 value={formData.name}
                                 onChange={e => setFormData({...formData, name: e.target.value})}
                              />
                           </div>

                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 flex items-center gap-2">
                                 <Phone size={12} className="text-premium-gold" /> Primary Contact <span className="text-red-500">*</span>
                              </label>
                              <input 
                                 type="text"
                                 placeholder="10-digit mobile number"
                                 className="w-full bg-light-bg/50 border-2 border-transparent focus:border-premium-gold focus:bg-white rounded-[1.5rem] px-4 md:px-8 py-5 font-black text-charcoal transition-all outline-none"
                                 value={formData.phone}
                                 onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                              />
                           </div>

                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 flex items-center gap-2">
                                 <CheckCircle2 size={12} className="text-premium-gold" /> GSTIN Number
                              </label>
                              <input 
                                 type="text"
                                 placeholder="33AABBC..."
                                 className="w-full bg-light-bg/50 border-2 border-transparent focus:border-premium-gold focus:bg-white rounded-[1.5rem] px-4 md:px-8 py-5 font-black text-charcoal uppercase tracking-widest transition-all outline-none"
                                 value={formData.gstin}
                                 onChange={e => setFormData({...formData, gstin: e.target.value})}
                              />
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 flex items-center gap-2">
                                 <CreditCard size={12} className="text-premium-gold" /> Opening Balance (₹)
                              </label>
                              <input 
                                 type="number"
                                 placeholder="0.00"
                                 className="w-full bg-light-bg/50 border-2 border-transparent focus:border-premium-gold focus:bg-white rounded-[1.5rem] px-4 md:px-8 py-5 font-black text-charcoal transition-all outline-none"
                                 value={formData.openingBalance}
                                 onChange={e => setFormData({...formData, openingBalance: e.target.value})}
                              />
                           </div>

                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 flex items-center gap-2">
                                 <MapPin size={12} className="text-premium-gold" /> Registered Office Address
                              </label>
                              <textarea 
                                 rows={5}
                                 placeholder="Complete physical address for logistics..."
                                 className="w-full bg-light-bg/50 border-2 border-transparent focus:border-premium-gold focus:bg-white rounded-[2rem] px-4 md:px-8 py-4 sm:py-6 font-bold text-charcoal transition-all outline-none resize-none"
                                 value={formData.address}
                                 onChange={e => setFormData({...formData, address: e.target.value})}
                              />
                           </div>
                        </div>

                     </div>
                  </div>

                  <div className="flex items-center justify-between p-10 bg-white border border-border-light rounded-[3rem] shadow-sm">
                     <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-light-bg rounded-2xl flex items-center justify-center text-text-muted"><ShieldCheck size={24} /></div>
                        <div>
                           <p className="text-sm font-black text-charcoal uppercase tracking-tight">Enterprise Compliance</p>
                           <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Linked to Audit Logs</p>
                        </div>
                     </div>
                     <button 
                        onClick={handleSubmit}
                        disabled={mutation.isPending}
                        className="px-12 py-5 bg-charcoal text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center gap-3 disabled:opacity-50"
                     >
                        {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isEditing ? 'Confirm Updates' : 'Authorize & Save'}
                     </button>
                  </div>
               </div>

            </div>
         </main>
      </div>
   );
}
