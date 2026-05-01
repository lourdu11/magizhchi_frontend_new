import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Loader2, X, Save, IndianRupee, User, Phone, FileText, CreditCard, CheckCircle2, AlertCircle, History, ExternalLink, Calendar, MapPin, Hash, Mail, Truck, Trash2, AlertTriangle } from 'lucide-react';
import { purchaseService } from '../../services';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function AdminSuppliers() {
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const [paymentData, setPaymentData] = useState({ amount: '', method: 'Cash', referenceId: '', note: '', date: new Date().toISOString().slice(0, 10) });
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', email: '', gstin: '', address: '', openingBalance: 0 });

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['admin-suppliers'],
    queryFn: () => purchaseService.getSuppliers().then(r => r.data.data),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: ({ id, data }) => purchaseService.recordPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentData({ amount: '', method: 'Cash', referenceId: '', note: '', date: new Date().toISOString().slice(0, 10) });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to record payment'),
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data) => purchaseService.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      toast.success('Supplier added successfully');
      setShowAddModal(false);
      setNewSupplier({ name: '', phone: '', email: '', gstin: '', address: '', openingBalance: 0 });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add supplier'),
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id) => purchaseService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      toast.success('Supplier removed successfully');
      setShowDeleteModal(false);
      setSupplierToDelete(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove supplier'),
  });

  const confirmDelete = (supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteModal(true);
  };

  const filteredSuppliers = suppliers?.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.phone?.includes(search) || 
    s.gstin?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const totals = filteredSuppliers.reduce((acc, s) => ({
    purchased: acc.purchased + (s.procuredVolume || 0),
    paid: acc.paid + (s.settledValue || 0),
    outstanding: acc.outstanding + (s.netPayables || 0)
  }), { purchased: 0, paid: 0, outstanding: 0 });

  return (
    <div className="space-y-6 pb-20">
      <Helmet><title>Financial Ledger — Admin</title></Helmet>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-border-light shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-charcoal tracking-tight uppercase">Supplier Ledger</h1>
          <p className="text-text-muted text-sm font-medium tracking-tight">Payables tracking & credit management</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-charcoal text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-xl shadow-charcoal/20">
          <Plus size={16} /> New Supplier
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Procured Volume', value: formatCurrency(totals.purchased), icon: IndianRupee, color: 'text-charcoal', bg: 'bg-light-bg' },
          { label: 'Settled Value', value: formatCurrency(totals.paid), icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Net Payables', value: formatCurrency(totals.outstanding), icon: AlertCircle, color: totals.outstanding > 0 ? 'text-red-600' : 'text-green-600', bg: totals.outstanding > 0 ? 'bg-red-50' : 'bg-green-50' }
        ].map((stat, i) => (
          <div key={i} className={`p-10 rounded-[3rem] border border-border-light bg-white shadow-sm flex items-center gap-8`}>
            <div className={`w-16 h-16 rounded-[1.5rem] ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-1">{stat.label}</p>
              <p className={`text-3xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        <input 
          className="w-full bg-white border border-border-light rounded-[1.5rem] pl-16 pr-6 py-5 focus:outline-none focus:ring-4 focus:ring-premium-gold/10 font-bold text-sm shadow-sm transition-all" 
          placeholder="Lookup supplier by name, phone or GST..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-[3.5rem] border border-border-light overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-light-bg/50 border-b border-border-light">
                {['Establishment', 'Tax ID', 'Procured', 'Settled', 'Payables', 'Control'].map(h => (
                  <th key={h} className="px-10 py-8 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light/40">
              {isLoading ? (
                <tr><td colSpan="6" className="py-32 text-center"><Loader2 className="animate-spin text-premium-gold mx-auto" size={48} /></td></tr>
              ) : filteredSuppliers.map(s => (
                <tr key={s._id} className="hover:bg-light-bg/20 transition-all group">
                  <td className="px-10 py-8">
                    <div className="font-black text-charcoal text-base tracking-tight">{s.name}</div>
                    <div className="text-[10px] text-text-muted font-bold flex items-center gap-1.5 mt-1 uppercase tracking-widest"><Phone size={12} /> {s.phone}</div>
                    {s.settledValue > 0 && s.procuredVolume === 0 && (
                      <div className="mt-2 flex items-center gap-1 text-[8px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        <AlertCircle size={10} /> Settlement exists without purchases
                      </div>
                    )}
                  </td>
                  <td className="px-10 py-8 text-[11px] font-black text-text-muted tracking-widest uppercase">{s.gstin || '—'}</td>
                  <td className="px-10 py-8 font-black text-charcoal text-sm">{formatCurrency(s.procuredVolume)}</td>
                  <td className="px-10 py-8 font-black text-green-600 text-sm">{formatCurrency(s.settledValue)}</td>
                  <td className="px-10 py-8">
                    <div className={`flex items-center gap-2 font-black text-sm ${s.netPayables > 0 ? 'text-red-600' : 'text-green-600'}`}>
                       {formatCurrency(s.netPayables)}
                       {s.netPayables > 0 && <AlertCircle size={14} className="animate-pulse" />}
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => { setSelectedSupplier(s); setShowPaymentModal(true); }}
                        className="p-4 bg-charcoal text-white rounded-2xl hover:bg-premium-gold hover:text-charcoal transition-all shadow-lg shadow-charcoal/10"
                        title="Record Payment"
                      >
                        <CreditCard size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedSupplier(s); setShowLedgerModal(true); }}
                        className="p-4 bg-light-bg text-charcoal rounded-2xl hover:bg-charcoal hover:text-white transition-all shadow-sm"
                        title="View Full Ledger & History"
                      >
                        <History size={18} />
                      </button>
                      <button 
                        onClick={() => navigate(`/admin/purchases?new=true&supplier=${s._id}`)}
                        className="p-4 bg-premium-gold/10 text-premium-gold rounded-2xl hover:bg-premium-gold hover:text-charcoal transition-all shadow-sm"
                        title="Quick New Purchase"
                      >
                        <Truck size={18} />
                      </button>
                      <button 
                        onClick={() => confirmDelete(s)}
                        disabled={deleteSupplierMutation.isPending}
                        className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Delete Supplier"
                      >
                        {deleteSupplierMutation.isPending && supplierToDelete?._id === s._id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ledger Modal */}
      <AnimatePresence>
        {showLedgerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" onClick={() => setShowLedgerModal(false)} />
             <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="relative bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl p-12 border border-border-light max-h-[85vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-10 flex-none">
                   <div>
                      <h2 className="text-3xl font-black text-charcoal uppercase tracking-tighter">Financial Ledger</h2>
                      <p className="text-xs text-text-muted font-bold uppercase tracking-[0.2em] mt-1">{selectedSupplier?.name} — Full Audit Trail</p>
                   </div>
                   <button onClick={() => setShowLedgerModal(false)} className="p-4 hover:bg-light-bg rounded-full text-text-muted"><X size={28} /></button>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-10 flex-none">
                   <div className="p-6 bg-light-bg rounded-[2rem]">
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Procured Volume</p>
                      <p className="text-xl font-black text-charcoal tracking-tight">{formatCurrency(selectedSupplier?.procuredVolume)}</p>
                   </div>
                   <div className="p-6 bg-green-50 rounded-[2rem]">
                      <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1">Settled Value</p>
                      <p className="text-xl font-black text-green-700 tracking-tight">{formatCurrency(selectedSupplier?.settledValue)}</p>
                   </div>
                   <div className="p-6 bg-red-50 rounded-[2rem]">
                      <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Net Payables</p>
                      <p className="text-xl font-black text-red-700 tracking-tight">{formatCurrency(selectedSupplier?.netPayables)}</p>
                   </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-6">
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] ml-2">Recent Settlements</h4>
                    {selectedSupplier?.payments?.length === 0 ? (
                      <div className="py-20 text-center text-xs font-bold text-text-muted uppercase tracking-widest opacity-30">No payments recorded yet.</div>
                    ) : (
                      selectedSupplier?.payments.map((p, i) => (
                        <div key={i} className="bg-white border border-border-light/60 p-6 rounded-[2rem] flex items-center justify-between group hover:border-premium-gold transition-all shadow-sm hover:shadow-lg">
                            <div className="flex items-center gap-6">
                              <div className="w-12 h-12 bg-light-bg rounded-2xl flex items-center justify-center text-text-muted group-hover:bg-premium-gold group-hover:text-charcoal transition-all">
                                  <CreditCard size={20} />
                              </div>
                              <div>
                                  <div className="text-sm font-black text-charcoal">{formatCurrency(p.amount)} <span className="text-[10px] text-text-muted font-bold tracking-widest ml-2 uppercase">({p.method})</span></div>
                                  <div className="text-[10px] text-text-muted font-bold flex items-center gap-1.5 mt-1 uppercase tracking-widest"><Calendar size={10} /> {new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-black text-charcoal uppercase tracking-widest">{p.referenceId || 'N/A'}</div>
                              <div className="text-[10px] text-text-muted italic mt-1 font-medium">{p.note || 'No notes provided'}</div>
                            </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-4 border-l border-border-light pl-6">
                      <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] ml-2">Recent Purchases</h4>
                      
                      {/* Opening Balance Entry */}
                      {selectedSupplier?.openingBalance > 0 && (
                        <div className="bg-premium-gold/5 border border-premium-gold/20 p-5 rounded-[1.5rem] flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-premium-gold text-charcoal rounded-xl flex items-center justify-center shadow-lg shadow-premium-gold/20">
                                <History size={16} />
                              </div>
                              <div>
                                <div className="text-xs font-black text-charcoal uppercase tracking-widest">Opening Balance <span className="text-[10px] text-premium-gold font-bold ml-2">CARRIED FORWARD</span></div>
                                <div className="text-[9px] text-text-muted font-black flex items-center gap-1.5 mt-0.5 uppercase tracking-[0.2em]">{formatCurrency(selectedSupplier.openingBalance)}</div>
                              </div>
                          </div>
                          <div className="px-3 py-1 bg-premium-gold/20 rounded-full text-[8px] font-black text-premium-gold uppercase tracking-tighter">Legacy</div>
                        </div>
                      )}

                      {!selectedSupplier?.purchases?.length && !selectedSupplier?.openingBalance ? (
                        <div className="py-20 text-center text-xs font-bold text-text-muted uppercase tracking-widest opacity-30">No purchase records yet.</div>
                      ) : (
                        selectedSupplier.purchases.map((p, i) => (
                          <div key={i} className="bg-light-bg/50 border border-border-light/40 p-5 rounded-[1.5rem] flex items-center justify-between group hover:border-premium-gold transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-text-muted">
                                  <Truck size={16} />
                                </div>
                                <div>
                                  <div className="text-xs font-black text-charcoal">{p.purchaseNumber} <span className="text-[10px] text-text-muted font-bold tracking-widest ml-2 uppercase">₹{p.pricing?.totalAmount?.toLocaleString()}</span></div>
                                  <div className="text-[9px] text-text-muted font-bold flex items-center gap-1.5 mt-0.5 uppercase tracking-widest"><Calendar size={8} /> {new Date(p.purchaseDate || p.createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <button onClick={() => navigate(`/admin/purchases?search=${p.purchaseNumber}`)} className="p-2 text-text-muted hover:text-premium-gold transition-colors">
                                <ExternalLink size={14} />
                            </button>
                          </div>
                        ))
                      )}
                  </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/40 backdrop-blur-md" onClick={() => setShowPaymentModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 border border-border-light">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black text-charcoal uppercase tracking-tight">Post Settlement</h2>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">To: {selectedSupplier?.name}</p>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="p-4 hover:bg-light-bg rounded-full transition-colors"><X size={24} /></button>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Amount (₹)</label>
                     <input type="number" className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-black text-xl" placeholder="0.00" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Payment Method</label>
                     <select className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold" value={paymentData.method} onChange={e => setPaymentData({...paymentData, method: e.target.value})}>
                        {['Cash', 'UPI', 'Bank', 'Cheque'].map(m => <option key={m} value={m}>{m}</option>)}
                     </select>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Value Date</label>
                     <input type="date" className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold" value={paymentData.date} onChange={e => setPaymentData({...paymentData, date: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Ref / Trans #</label>
                     <input className="w-full bg-light-bg border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-premium-gold/30 font-bold" placeholder="e.g. TXN998877" value={paymentData.referenceId} onChange={e => setPaymentData({...paymentData, referenceId: e.target.value})} />
                   </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Memorandum / Notes</label>
                  <textarea rows={3} className="w-full bg-light-bg border-none rounded-[2rem] px-6 py-6 focus:ring-2 focus:ring-premium-gold/30 font-bold resize-none" placeholder="Enter transaction details..." value={paymentData.note} onChange={e => setPaymentData({...paymentData, note: e.target.value})} />
                </div>
              </div>

              <button 
                onClick={() => recordPaymentMutation.mutate({ id: selectedSupplier._id, data: paymentData })}
                disabled={recordPaymentMutation.isPending}
                className="w-full mt-10 bg-charcoal text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center justify-center gap-3"
              >
                {recordPaymentMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> Commit Transaction</>}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Supplier Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/40 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl p-12 border border-border-light">
              <div className="flex items-center justify-between mb-12">
                <div>
                   <h2 className="text-3xl font-black text-charcoal uppercase tracking-tighter">Onboard Supplier</h2>
                   <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Establishing new trade relationship</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-4 hover:bg-light-bg rounded-full transition-colors text-text-muted"><X size={28} /></button>
              </div>

              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Trade Name</label>
                    <div className="relative">
                       <User className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                       <input className="w-full bg-light-bg border-none rounded-2xl pl-16 pr-6 py-5 focus:ring-2 focus:ring-premium-gold/30 font-black" placeholder="e.g. Sri Textiles" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Primary Contact</label>
                    <div className="relative">
                       <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                       <input className="w-full bg-light-bg border-none rounded-2xl pl-16 pr-6 py-5 focus:ring-2 focus:ring-premium-gold/30 font-black" placeholder="+91 000 000 0000" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">GSTIN Number</label>
                    <div className="relative">
                       <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                       <input className="w-full bg-light-bg border-none rounded-2xl pl-16 pr-6 py-5 focus:ring-2 focus:ring-premium-gold/30 font-black uppercase tracking-widest" placeholder="33AABBC..." value={newSupplier.gstin} onChange={e => setNewSupplier({...newSupplier, gstin: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Email ID</label>
                    <div className="relative">
                       <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                       <input className="w-full bg-light-bg border-none rounded-2xl pl-16 pr-6 py-5 focus:ring-2 focus:ring-premium-gold/30 font-black" placeholder="contact@supplier.com" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Opening Balance (₹)</label>
                    <div className="relative">
                       <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                       <input type="number" className="w-full bg-light-bg border-none rounded-2xl pl-16 pr-6 py-5 focus:ring-2 focus:ring-premium-gold/30 font-black" placeholder="0.00" value={newSupplier.openingBalance} onChange={e => setNewSupplier({...newSupplier, openingBalance: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Registered Address</label>
                    <div className="relative">
                       <MapPin className="absolute left-6 top-6 text-text-muted" size={18} />
                       <textarea rows={1} className="w-full bg-light-bg border-none rounded-2xl pl-16 pr-6 py-5 focus:ring-2 focus:ring-premium-gold/30 font-bold resize-none" placeholder="Complete address..." value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => createSupplierMutation.mutate(newSupplier)}
                disabled={createSupplierMutation.isPending}
                className="w-full mt-12 bg-charcoal text-white py-7 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center justify-center gap-3"
              >
                {createSupplierMutation.isPending ? <Loader2 size={24} className="animate-spin" /> : <><Plus size={24} /> Authorize Relationship</>}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" onClick={() => setShowDeleteModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 border border-red-100 overflow-hidden text-center">
               <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <AlertTriangle size={40} strokeWidth={2.5} className="animate-bounce" />
               </div>
               
               <h3 className="text-2xl font-black text-charcoal uppercase tracking-tighter mb-3">Terminate Partner?</h3>
               <p className="text-sm text-text-muted font-medium px-4 mb-8 leading-relaxed">
                  Are you sure you want to remove <span className="font-black text-charcoal">"{supplierToDelete?.name}"</span>? This action is permanent and cannot be reversed.
               </p>

               <div className="grid grid-cols-2 gap-4 mt-10">
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-text-muted hover:bg-light-bg transition-all"
                  >
                    Hold On
                  </button>
                  <button 
                    onClick={() => deleteSupplierMutation.mutate(supplierToDelete._id)}
                    disabled={deleteSupplierMutation.isPending}
                    className="py-5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                  >
                    {deleteSupplierMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Remove'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

