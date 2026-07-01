// WhatsApp Marketing Suite - Guided Workflow
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Send, Users, MessageSquare, History, Search, Filter, 
  CheckCircle, XCircle, Clock, Plus, Trash2, Edit2, 
  ChevronRight, RefreshCcw, Download, Image as ImageIcon, 
  FileText, Link as LinkIcon, Save, Zap, Upload, Eye, Loader2,
  Share2, ArrowRight, ShieldCheck, Globe, Store, BarChart2,
  TrendingUp, Calendar, Heart, Award, Ghost, X, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { broadcastService, adminService } from '../../services';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuthStore } from '../../store';
import AdminSingleImageResizer from '../../components/admin/AdminSingleImageResizer';

const BroadcastCenter = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
    const [resizerState, setResizerState] = useState({ isOpen: false, file: null });
  
  // Customers State
  const [customers, setCustomers] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [filters, setFilters] = useState({ search: '', segment: 'all' });
  const [customPhone, setCustomPhone] = useState('');
  const [customName, setCustomName] = useState('');
  const [saveToDb, setSaveToDb] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState({ ready: false, initializing: false, qr: null });
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  
  // Message State
  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: '',
    mediaUrl: '',
    mediaType: 'none'
  });
  
  // Templates & History
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null); // For detail view
  const [broadcastDetails, setBroadcastDetails] = useState(null);
  const [historySearch, setHistorySearch] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [broadcastUrlInput, setBroadcastUrlInput] = useState('');

  // Auto-refresh history if campaigns are processing
  useEffect(() => {
    const hasActive = history.some(h => h.status === 'processing');
    if (hasActive) {
      const interval = setInterval(fetchHistory, 5000);
      return () => clearInterval(interval);
    }
  }, [history]);

  const fetchWhatsappStatus = async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    try {
      const { data } = await adminService.getHealth();
      if (data.success && data.data?.whatsapp) {
        setWhatsappStatus(data.data.whatsapp);
      }
    } catch (err) {
      if (err?.response?.status === 401) return;
      console.error('WhatsApp status check failed', err);
    }
  };

  useEffect(() => {
    fetchWhatsappStatus();
    if (currentStep === 5) {
      const interval = setInterval(fetchWhatsappStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCustomers();
    fetchTemplates();
    fetchHistory();
  }, [filters.segment]);

  const fetchCustomers = async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    try {
      const res = await broadcastService.getCustomers(filters);
      if (res.data.success) {
        setCustomers(res.data.users);
      }
    } catch (err) {
      if (err?.response?.status === 401) return;
      toast.error('Failed to load customers');
    }
  };

  const fetchTemplates = async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    try {
      const res = await broadcastService.getTemplates();
      if (res.data.success) setTemplates(res.data.templates);
    } catch (err) {}
  };

  const handleDisconnectWhatsapp = async () => {
    if (!window.confirm('Are you sure you want to disconnect WhatsApp and wipe the current phone number session?')) {
      return;
    }
    setDisconnecting(true);
    try {
      const res = await broadcastService.disconnectWhatsApp();
      if (res.data.success) {
        toast.success('WhatsApp disconnected successfully! Generating fresh QR code...');
        setWhatsappStatus({ ready: false, initializing: true, qr: null });
        setTimeout(fetchWhatsappStatus, 2500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disconnect WhatsApp');
    } finally {
      setDisconnecting(false);
    }
  };

  const fetchHistory = async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    try {
      const { data } = await broadcastService.getHistory();
      if (data.success) setHistory(data.broadcasts);
    } catch (err) { 
      if (err?.response?.status === 401) return;
      console.error('History failed'); 
    }
  };

  const fetchDetails = async (broadcast) => {
    setSelectedBroadcast(broadcast);
    setLoadingDetails(true);
    try {
      const { data } = await broadcastService.getDetails(broadcast._id);
      if (data.success) {
        setBroadcastDetails(data.logs);
      }
    } catch (err) { toast.error('Could not load details'); }
    finally { setLoadingDetails(false); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    try {
      const { data } = await adminService.uploadImage(formData);
      if (data.success) {
        setBroadcastData(prev => ({ ...prev, mediaUrl: data.url, mediaType: 'image' }));
        toast.success('Image attached');
      }
    } catch (err) { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastData.message || selectedRecipients.length === 0) {
      toast.error('Details missing'); return;
    }
    setLoading(true);
    try {
      const res = await broadcastService.sendBroadcast({
        ...broadcastData,
        recipients: selectedRecipients.map(r => ({ id: r.id, name: r.name, phone: r.phone, type: r.type }))
      });
      if (res.data.success) {
        toast.success('Campaign Transmitted!');
        setCurrentStep(4); // Success step
        fetchHistory();
      }
    } catch (err) { 
        const errorMsg = err.response?.data?.message || 'Transmission failed';
        toast.error(errorMsg); 
    }
    finally { setLoading(false); }
  };

  const selectSegment = (segId) => {
    setFilters({ ...filters, segment: segId });
    setSelectedRecipients([]); // Reset when switching segments for safety
  };

  const toggleRecipient = (customer) => {
    const isSelected = selectedRecipients.some(r => r.phone === customer.phone);
    if (isSelected) {
      setSelectedRecipients(selectedRecipients.filter(r => r.phone !== customer.phone));
    } else {
      setSelectedRecipients([...selectedRecipients, customer]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRecipients.length === customers.length) setSelectedRecipients([]);
    else {
      // Merge unique ones
      const newSelections = [...selectedRecipients];
      customers.forEach(c => {
        if (!newSelections.some(s => s.phone === c.phone)) newSelections.push(c);
      });
      setSelectedRecipients(newSelections);
    }
  };

  const handleAddCustomRecipient = async () => {
    if (!customPhone) {
      toast.error('Please enter valid 10-digit mobile numbers');
      return;
    }
    
    const rawNumbers = customPhone.split(/[,\s\n]+/).filter(Boolean);
    const validNumbers = [];
    
    rawNumbers.forEach(num => {
      const cleaned = num.replace(/\D/g, '');
      if (cleaned.length >= 10) {
        validNumbers.push(cleaned.slice(-10));
      }
    });

    if (validNumbers.length === 0) {
      toast.error('Please enter valid 10-digit mobile numbers');
      return;
    }

    const newAdded = [];
    let duplicateCount = 0;

    for (const phone of validNumbers) {
      const fullPhone = `91${phone}`;
      
      if (selectedRecipients.some(r => r.phone === fullPhone) || newAdded.some(r => r.phone === fullPhone)) {
        duplicateCount++;
        continue;
      }

      const singleName = validNumbers.length === 1 && customName.trim() ? customName.trim() : `Guest +91${phone}`;

      const newRecipient = {
        id: `custom_${Date.now()}_${phone}`,
        name: singleName,
        phone: fullPhone,
        type: 'manual',
        totalSpent: 0,
        billCount: 0,
        lastPurchase: null
      };
      
      newAdded.push(newRecipient);
    }

    if (newAdded.length > 0) {
      setSelectedRecipients(prev => [...prev, ...newAdded]);
      setCustomers(prev => [...newAdded, ...prev]);
      setCustomPhone('');
      setCustomName('');
      setSaveToDb(false);
      toast.success(`${newAdded.length} direct number(s) added successfully!`);
    }

    if (duplicateCount > 0) {
      toast.error(`${duplicateCount} number(s) were skipped (already in list).`);
    }
  };

  const segments = [
    { id: 'all', label: 'All Customers', icon: Globe, color: 'blue', desc: 'Everyone in your database' },
    { id: 'big_spenders', label: 'High Value', icon: TrendingUp, color: 'green', desc: 'Spent over ₹5,000' },
    { id: 'regular_customers', label: 'Loyalists', icon: Award, color: 'orange', desc: '3+ purchases made' },
    { id: 'inactive', label: 'Win Back', icon: Ghost, color: 'red', desc: 'Inactive for 30+ days' },
    { id: 'offline_only', label: 'POS Only', icon: Store, color: 'indigo', desc: 'Walk-in customers' }
  ];

  return (
    <div className="min-h-dvh bg-[#FAFAFA] font-sans pb-20">
      {/* 🧭 Guided Progress Bar */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center flex-wrap gap-4">
            <div className="w-10 h-10 bg-[#1A73E8] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <Zap size={20} fill="currentColor" />
            </div>
            <h1 className="text-xl font-black text-[#202124] tracking-tighter uppercase">Broadcast magic</h1>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[
              { num: 1, label: 'Audience' },
              { num: 2, label: 'Compose' },
              { num: 3, label: 'Review' }
            ].map((s) => (
              <div key={s.num} className="flex items-center flex-wrap gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${currentStep >= s.num ? 'bg-[#1A73E8] text-white' : 'bg-[#F1F3F4] text-[#5F6368]'}`}>
                  {currentStep > s.num ? <CheckCircle size={14} /> : s.num}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${currentStep >= s.num ? 'text-[#202124]' : 'text-[#BDC1C6]'}`}>{s.label}</span>
                {s.num < 3 && <div className="w-12 h-[2px] bg-[#F1F3F4]" />}
              </div>
            ))}
          </div>

          <div className="flex items-center flex-wrap gap-3">
              <button 
                onClick={() => setCurrentStep(5)} // WhatsApp Link Manager
                className={`p-3 rounded-xl transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-wider ${currentStep === 5 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-[#F1F3F4] text-[#5F6368] hover:bg-emerald-50 hover:text-emerald-700'}`}
                title="Link WhatsApp Phone / Scan QR"
              >
                <LinkIcon size={14} />
                <span>Link Phone</span>
              </button>
              <button 
                onClick={() => setCurrentStep(0)} // History
                className={`p-3 rounded-xl transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-wider ${currentStep === 0 ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'bg-[#F1F3F4] text-[#5F6368] hover:bg-[#E8F0FE] hover:text-[#1A73E8]'}`}
                title="History"
              >
                <History size={14} />
                <span>History</span>
              </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-4 sm:p-6 mt-8">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: SELECT AUDIENCE */}
          {currentStep === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-black text-[#202124] tracking-tighter uppercase mb-2">Who are we reaching?</h2>
                <p className="text-[#5F6368] font-medium">Select a segment or pick individual customers below</p>
              </div>

              {/* Segment Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {segments.map((seg) => (
                  <button
                    key={seg.id}
                    onClick={() => selectSegment(seg.id)}
                    className={`
                      p-4 sm:p-4 sm:p-6 rounded-[2rem] border-2 text-left transition-all relative group
                      ${filters.segment === seg.id ? 'bg-white border-[#1A73E8] shadow-xl shadow-blue-50 -translate-y-1' : 'bg-white border-transparent hover:border-[#DADCE0] shadow-sm'}
                    `}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-${seg.color}-50 text-${seg.color}-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                      <seg.icon size={20} />
                    </div>
                    <h4 className="text-[10px] font-black text-[#202124] uppercase tracking-widest mb-1">{seg.label}</h4>
                    <p className="text-[9px] text-[#5F6368] font-bold leading-tight">{seg.desc}</p>
                    {filters.segment === seg.id && (
                      <div className="absolute top-4 right-4 text-[#1A73E8]">
                        <CheckCircle size={16} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Manual Recipient Card (Direct Number Entry) */}
              <div className="bg-white rounded-[2.5rem] border border-[#DADCE0] shadow-sm p-4 md:p-4 md:p-8 flex flex-col gap-6 mt-10">
                <div className="flex items-center flex-wrap gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A73E8] flex items-center justify-center">
                    <Plus size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#202124] uppercase tracking-wider">Direct Message Recipient (தனி நபர் / மொபைல் எண்)</h3>
                    <p className="text-[9px] text-[#5F6368] uppercase font-bold tracking-widest mt-0.5">Send a broadcast directly to a custom/manual phone number</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-end w-full">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div>
                      <label className="text-[9px] font-black text-[#5F6368] uppercase tracking-[0.2em] mb-2 block">Direct Phone Numbers (மொபைல் எண்கள்)</label>
                      <textarea 
                        placeholder="Paste numbers separated by commas (e.g. 9876543210, 9123456789)"
                        rows={2}
                        className="w-full bg-[#F8F9FA] px-4 sm:px-4 sm:px-6 py-3 rounded-2xl border border-[#DADCE0] outline-none font-bold focus:ring-4 focus:ring-blue-100 text-sm resize-none"
                        value={customPhone}
                        onChange={(e) => setCustomPhone(e.target.value.replace(/[^0-9,\s\n+]/g, ''))}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-[#5F6368] uppercase tracking-[0.2em] mb-2 block">Recipient Name (பெயர் - Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Lourdu Custom"
                        className="w-full bg-[#F8F9FA] px-4 sm:px-4 sm:px-6 py-3 rounded-2xl border border-[#DADCE0] outline-none font-bold focus:ring-4 focus:ring-blue-100 text-sm"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleAddCustomRecipient}
                    className="w-full md:w-auto bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent px-4 md:px-4 md:px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Plus size={16} /> Add Direct Numbers
                  </button>
                </div>

                {/* Direct Recipients List (Highly Visible Badges with delete triggers) */}
                {selectedRecipients.filter(r => r.type === 'manual').length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mt-4 p-5 bg-blue-50/30 rounded-3xl border border-blue-100">
                    <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest w-full mb-1">Direct Recipients Added ({selectedRecipients.filter(r => r.type === 'manual').length}):</span>
                    {selectedRecipients.filter(r => r.type === 'manual').map(mr => (
                      <div key={mr.phone} className="bg-white px-4 py-2 rounded-xl border border-blue-200 flex items-center gap-3 shadow-sm">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-[#202124]">{mr.name}</span>
                          <span className="text-[10px] font-bold text-blue-600">+{mr.phone}</span>
                        </div>
                        <button 
                          onClick={() => setSelectedRecipients(selectedRecipients.filter(r => r.phone !== mr.phone))}
                          className="w-5 h-5 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center text-xs font-bold leading-none border-none cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Table List */}
              <div className="bg-white rounded-[2.5rem] border border-[#DADCE0] shadow-sm overflow-hidden mt-10">
                <div className="p-4 md:p-4 md:p-8 border-b flex flex-col md:flex-row gap-6 justify-between items-center bg-[#F8F9FA]">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5F6368]" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by name or number..."
                            className="w-full bg-white pl-12 pr-6 py-3.5 rounded-2xl border border-[#DADCE0] outline-none font-bold"
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                        />
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={toggleSelectAll} className="text-[10px] font-black text-[#1A73E8] uppercase tracking-widest hover:underline">
                            {selectedRecipients.length === customers.length ? 'Deselect All' : `Select All (${customers.length})`}
                        </button>
                        <button 
                            disabled={selectedRecipients.length === 0}
                            onClick={() => setCurrentStep(2)}
                            className="bg-[#1A73E8] text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-100 flex items-center gap-2 hover:bg-[#185ABC] disabled:opacity-50 transition-all"
                        >
                            Next Step <ArrowRight size={14} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full ">
                        <thead className="bg-[#F8F9FA] sticky top-0 z-10">
                            <tr className="text-[9px] font-black text-[#5F6368] uppercase tracking-[0.2em] border-b">
                                <th className="px-4 md:px-4 md:px-8 py-4 w-12"></th>
                                <th className="px-4 md:px-4 md:px-8 py-4">Customer</th>
                                <th className="px-4 md:px-4 md:px-8 py-4">History</th>
                                <th className="px-4 md:px-4 md:px-8 py-4">Value</th>
                                <th className="px-4 md:px-4 md:px-8 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F3F4]">
                            {customers.map((c) => (
                                <tr 
                                    key={c.phone} 
                                    onClick={() => toggleRecipient(c)}
                                    className={`group hover:bg-[#F8F9FA] transition-colors cursor-pointer ${selectedRecipients.some(r => r.phone === c.phone) ? 'bg-blue-50/30' : ''}`}
                                >
                                    <td className="px-4 md:px-4 md:px-8 py-5">
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedRecipients.some(r => r.phone === c.phone) ? 'bg-[#1A73E8] border-[#1A73E8]' : 'border-[#DADCE0]'}`}>
                                            {selectedRecipients.some(r => r.phone === c.phone) && <CheckCircle size={12} className="text-white" />}
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-4 md:px-8 py-5">
                                        <div className="flex items-center flex-wrap gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black text-white ${c.type === 'online' ? 'bg-[#1A73E8]' : 'bg-[#F4B400]'}`}>
                                                {c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#202124] text-sm">{c.name}</p>
                                                <p className="text-[10px] text-[#5F6368] font-bold">+{c.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-4 md:px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={12} className="text-[#BDC1C6]" />
                                            <span className="text-[10px] font-black text-[#5F6368] uppercase">
                                              Last: {c.lastPurchase ? format(new Date(c.lastPurchase), 'MMM dd') : 'Never'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-4 md:px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-[#202124]">₹{Math.round(c.totalSpent).toLocaleString()}</span>
                                            <span className="text-[9px] text-[#5F6368] font-bold uppercase">{c.billCount} Bills</span>
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-4 md:px-8 py-5 text-right">
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${c.type === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-700'}`}>
                                            {c.type}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: COMPOSE MESSAGE */}
          {currentStep === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10"
            >
              <div className="lg:col-span-7 space-y-8">
                  <div className="text-left mb-8">
                    <button onClick={() => setCurrentStep(1)} className="text-[10px] font-black text-[#1A73E8] uppercase tracking-widest mb-4 flex items-center gap-1 hover:underline">
                        <ChevronRight size={14} className="rotate-180" /> Back to Audience
                    </button>
                    <h2 className="text-3xl font-black text-[#202124] tracking-tighter uppercase">What's the message?</h2>
                  </div>

                  <div className="bg-charcoal rounded-[2.5rem] border border-white/10 p-5 md:p-10 shadow-2xl shadow-black/20 space-y-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-premium-gold/5 blur-[80px] rounded-full pointer-events-none -mr-40 -mt-40" />
                      
                      <div className="relative z-10">
                          <label className="text-[10px] font-black text-premium-gold uppercase tracking-[0.2em] mb-3 block">Internal Title</label>
                          <input 
                            type="text" 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-6 py-4 focus:ring-1 focus:ring-premium-gold focus:border-premium-gold outline-none font-bold text-white placeholder-white/30 transition-all"
                            placeholder="e.g., Festival Offer 2026"
                            value={broadcastData.title}
                            onChange={(e) => setBroadcastData({...broadcastData, title: e.target.value})}
                          />
                      </div>

                      <div className="relative z-10">
                          <div className="flex justify-between items-end mb-3">
                            <label className="text-[10px] font-black text-premium-gold uppercase tracking-[0.2em]">Message Body</label>
                            <button 
                                onClick={() => setBroadcastData({...broadcastData, message: broadcastData.message + ' {{name}}'})}
                                className="text-[9px] font-black text-charcoal bg-premium-gold px-4 py-1.5 rounded-full hover:scale-105 transition-all shadow-md"
                            >
                                + Insert {"{{name}}"}
                            </button>
                          </div>
                          <textarea 
                            rows={8}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-6 py-4 focus:ring-1 focus:ring-premium-gold focus:border-premium-gold outline-none font-medium text-lg leading-relaxed text-white placeholder-white/30 transition-all custom-scrollbar"
                            placeholder="Type your magic here..."
                            value={broadcastData.message}
                            onChange={(e) => setBroadcastData({...broadcastData, message: e.target.value})}
                          />
                      </div>

                      <div className="relative z-10 p-4 md:p-8 bg-white/5 rounded-[2rem] border-2 border-dashed border-white/20 space-y-6 hover:border-premium-gold/50 transition-colors">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center flex-wrap gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-premium-gold/20 flex items-center justify-center">
                                      <ImageIcon size={20} className="text-premium-gold" />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Promotional Image</span>
                              </div>
                              <div className="flex gap-2 w-full md:w-auto">
                                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                                  <button onClick={() => fileInputRef.current.click()} className="bg-white/10 px-4 sm:px-6 py-3 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-white flex-1 md:flex-none hover:bg-white/20 transition-all">
                                      {uploading ? <Loader2 size={14} className="animate-spin inline" /> : 'Upload File'}
                                  </button>
                              </div>
                          </div>
                          
                          <div className="flex gap-2">
                             <input 
                                type="url" 
                                placeholder="Or paste Cloudinary / S3 URL..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold focus:outline-none focus:border-premium-gold text-white placeholder-white/30"
                                value={broadcastUrlInput}
                                onChange={e => setBroadcastUrlInput(e.target.value)}
                             />
                             <button 
                                onClick={() => {
                                   if(!broadcastUrlInput.trim()) return;
                                   setBroadcastData(prev => ({ ...prev, mediaUrl: broadcastUrlInput.trim(), mediaType: 'image' }));
                                   setBroadcastUrlInput('');
                                   toast.success('URL applied!');
                                }}
                                className="bg-white text-charcoal px-4 sm:px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
                             >
                                Apply
                             </button>
                          </div>

                          {broadcastData.mediaUrl && (
                              <div className="relative group rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                                  <img src={broadcastData.mediaUrl} className="w-full h-56 object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <button onClick={() => setBroadcastData({...broadcastData, mediaUrl: '', mediaType: 'none'})} className="bg-red-500 text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-transform">
                                          <Trash2 size={20} />
                                      </button>
                                  </div>
                                  <div className="absolute bottom-3 left-3 bg-black/80 px-3 py-1.5 rounded-lg border border-white/20 text-[8px] font-mono text-white/70 truncate max-w-[80%] backdrop-blur-sm">
                                      {broadcastData.mediaUrl}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-8">
                      <button 
                        onClick={() => setCurrentStep(3)}
                        disabled={!broadcastData.message || !broadcastData.title}
                        className="bg-gradient-to-r from-premium-gold to-amber-500 text-charcoal px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-premium-gold/20 flex items-center gap-2 disabled:opacity-50 hover:from-charcoal hover:to-charcoal hover:text-premium-gold transition-all duration-500"
                      >
                        Preview & Launch <ArrowRight size={14} />
                      </button>
                  </div>
              </div>

              {/* Suggestions Sidepanel */}
              <div className="lg:col-span-5 space-y-6 pt-24">
                  <h3 className="text-[10px] font-black text-[#5F6368] uppercase tracking-widest mb-4">Magic Templates</h3>
                  {templates.length === 0 ? (
                      <div className="bg-white p-4 md:p-4 md:p-8 rounded-[2rem] border border-[#DADCE0] text-center italic text-[#BDC1C6] text-sm">
                          No templates found. Go to 'Creative' tab to build some!
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {templates.slice(0, 3).map(t => (
                              <button 
                                key={t._id}
                                onClick={() => setBroadcastData({...broadcastData, message: t.content, title: t.name})}
                                className="w-full p-4 sm:p-4 sm:p-6 bg-white border border-[#DADCE0] rounded-[1.5rem] text-left hover:border-[#1A73E8] hover:bg-blue-50 transition-all group"
                              >
                                  <h4 className="font-black text-[#202124] text-xs uppercase tracking-tight group-hover:text-[#1A73E8]">{t.name}</h4>
                                  <p className="text-[10px] text-[#5F6368] font-medium line-clamp-2 mt-2">{t.content}</p>
                              </button>
                          ))}
                      </div>
                  )}
              </div>
            </motion.div>
          )}

          {/* STEP 3: PREVIEW & LAUNCH */}
          {currentStep === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto space-y-10"
            >
              <div className="text-center">
                <h2 className="text-4xl font-black text-[#202124] tracking-tighter uppercase mb-2">Ready for liftoff?</h2>
                <p className="text-[#5F6368] font-medium">Final check before transmitting to {selectedRecipients.length} customers</p>
              </div>

              {/* Phone Mockup */}
              <div className="bg-[#121212] rounded-[3.5rem] p-5 md:p-10 shadow-2xl relative border-[12px] border-[#202124] max-w-sm mx-auto">
                    <div className="flex justify-between items-center mb-10 px-4 text-white/50 text-xs">
                        <span>9:41</span>
                        <div className="w-20 h-6 bg-black rounded-full" />
                        <div className="flex gap-2"><div className="w-4 h-4 bg-white/20 rounded-full" /></div>
                    </div>

                    <div className="bg-[#262626] rounded-2xl rounded-tl-none p-5 border border-white/5 shadow-xl">
                        {broadcastData.mediaUrl && <img src={broadcastData.mediaUrl} className="w-full h-32 object-cover rounded-xl mb-4" />}
                        <p className="text-white text-[14px] leading-relaxed whitespace-pre-wrap font-medium">
                            {broadcastData.message.replace('{{name}}', 'Lourdu')}
                        </p>
                        <div className="text-right mt-2"><span className="text-[10px] text-white/40">10:45 AM</span></div>
                    </div>
              </div>

              <div className="bg-white rounded-[3rem] border border-[#DADCE0] p-5 md:p-10 shadow-sm space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                      <div>
                          <p className="text-[10px] font-black text-[#5F6368] uppercase tracking-widest mb-1">Target</p>
                          <p className="text-2xl font-black text-[#202124] tracking-tighter">{selectedRecipients.length} People</p>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-[#5F6368] uppercase tracking-widest mb-1">Method</p>
                          <p className="text-2xl font-black text-[#1A73E8] tracking-tighter flex items-center gap-2"><Zap size={20} fill="currentColor" /> Direct WhatsApp</p>
                      </div>
                  </div>

                  <div className="pt-8 border-t">
                      <button 
                        onClick={handleSendBroadcast}
                        disabled={loading || selectedRecipients.length === 0}
                        className={`
                            w-full py-4 sm:py-4 sm:py-6 rounded-[2rem] font-black uppercase tracking-[0.4em] text-sm transition-all shadow-xl flex items-center justify-center gap-4
                            ${(loading || selectedRecipients.length === 0) ? 'bg-[#F1F3F4] text-[#BDC1C6]' : 'bg-[#1A73E8] text-white shadow-blue-200 hover:bg-[#185ABC] hover:-translate-y-1'}
                        `}
                      >
                        {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                        {loading ? 'Transmitting...' : selectedRecipients.length === 0 ? 'Select Recipients' : 'Ignite Campaign Now'}
                      </button>
                      <button onClick={() => setCurrentStep(2)} className="w-full py-4 text-[10px] font-black text-[#5F6368] uppercase tracking-widest mt-4 hover:underline">
                          Need more edits?
                      </button>
                  </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS / TRANSMISSION PROGRESS */}
          {currentStep === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-12 py-20"
            >
              <div className="w-32 h-32 bg-[#E6F4EA] rounded-full flex items-center justify-center mx-auto text-[#34A853]">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>
                      <CheckCircle size={64} />
                  </motion.div>
              </div>
              <div className="space-y-4">
                  <h2 className="text-4xl font-black text-[#202124] tracking-tighter uppercase">Campaign Transmitted!</h2>
                  <p className="text-lg text-[#5F6368] font-medium max-w-lg mx-auto">
                      Your message is now being beamed to {selectedRecipients.length} customers. 
                      You can monitor the real-time progress in the history tab.
                  </p>
              </div>
              <div className="flex justify-center gap-6">
                  <button onClick={() => setCurrentStep(0)} className="bg-white border border-[#DADCE0] px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F1F3F4] transition-all">
                      View Live Stats
                  </button>
                  <button onClick={() => { setCurrentStep(1); setBroadcastData({title:'', message:'', mediaUrl:'', mediaType:'none'}); setSelectedRecipients([]); }} className="bg-[#1A73E8] text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-[#185ABC] transition-all">
                      Launch Another
                  </button>
              </div>
            </motion.div>
          )}

          {/* TAB 0: HISTORY & ANALYTICS */}
          {currentStep === 0 && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                      <h2 className="text-3xl font-black text-[#202124] tracking-tighter uppercase">Campaign History</h2>
                      <p className="text-[10px] font-black text-[#5F6368] uppercase tracking-[0.2em] mt-1">Transmission logs & analytics</p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button 
                          onClick={fetchHistory}
                          className="p-3 bg-white border border-[#DADCE0] rounded-2xl text-[#5F6368] hover:text-[#1A73E8] hover:border-[#1A73E8] transition-all"
                          title="Sync Status"
                        >
                          <RefreshCcw size={16} className={history.some(h => h.status === 'processing') ? 'animate-spin' : ''} />
                        </button>
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BDC1C6]" size={16} />
                            <input 
                              type="text" 
                              placeholder="Search campaigns..." 
                              className="w-full bg-white pl-12 pr-6 py-3 rounded-2xl border border-[#DADCE0] text-xs font-bold outline-none focus:border-[#1A73E8]"
                              value={historySearch}
                              onChange={(e) => setHistorySearch(e.target.value)}
                            />
                        </div>
                        <button onClick={() => setCurrentStep(1)} className="bg-[#1A73E8] text-white px-4 md:px-4 md:px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 whitespace-nowrap shadow-lg shadow-blue-100">
                            <Plus size={16} /> New Campaign
                        </button>
                    </div>
                </div>

                <div className="grid gap-6">
                    {history.filter(h => h.title.toLowerCase().includes(historySearch.toLowerCase())).map(item => (
                        <div key={item._id} className="bg-white p-4 md:p-4 md:p-8 rounded-[2.5rem] border border-[#DADCE0] shadow-sm hover:border-[#1A73E8] transition-all group cursor-pointer relative overflow-hidden" onClick={() => fetchDetails(item)}>
                            {item.status === 'processing' && (
                              <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-1000" style={{ width: `${(item.stats.sent / item.totalRecipients) * 100}%` }} />
                            )}
                            <div className="flex flex-wrap items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                                        item.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                                        item.status === 'failed' ? 'bg-red-50 text-red-600' : 
                                        'bg-blue-50 text-blue-600'
                                    }`}>
                                        {item.status === 'completed' ? <CheckCircle size={24} /> : 
                                         item.status === 'failed' ? <XCircle size={24} /> : 
                                         <Loader2 size={24} className="animate-spin" />}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-[#5F6368] uppercase tracking-widest">
                                          {item.createdAt ? format(new Date(item.createdAt), 'MMM dd, yyyy • hh:mm a') : 'Unknown Date'}
                                        </p>
                                        <h3 className="text-xl font-black text-[#202124] tracking-tighter mt-1">{item.title || 'Untitled Campaign'}</h3>
                                    </div>
                                </div>
                                <div className="flex gap-12 text-center">
                                    <div>
                                        <p className="text-[9px] font-black text-[#5F6368] uppercase tracking-widest mb-1">Delivered</p>
                                        <p className="text-xl font-black text-[#202124]">{(item.stats.sent || 0) + (item.stats.delivered || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-[#5F6368] uppercase tracking-widest mb-1">Target</p>
                                        <p className="text-xl font-black text-[#202124]">{item.totalRecipients}</p>
                                    </div>
                                    {item.stats.failed > 0 && (
                                      <div>
                                          <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Failed</p>
                                          <p className="text-xl font-black text-red-500">{item.stats.failed}</p>
                                      </div>
                                    )}
                                </div>
                                <ChevronRight className="text-[#DADCE0] group-hover:text-[#1A73E8] group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
          )}

          {/* STEP 5: WHATSAPP LINK & QR SCAN MANAGER */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-[#202124] tracking-tighter uppercase mb-2">WhatsApp Connection Center</h2>
                <p className="text-[#5F6368] font-bold uppercase text-[9px] tracking-widest">Manage your sending number and link phone lines</p>
              </div>

              {whatsappStatus.ready ? (
                /* Connected State Card */
                <div className="bg-white rounded-[2.5rem] border border-[#DADCE0] shadow-xl p-5 md:p-10 flex flex-col items-center text-center gap-6 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500" />
                  
                  <div className="w-20 h-20 rounded-[2rem] bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-50 animate-pulse">
                    <ShieldCheck size={40} />
                  </div>

                  <div>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">CONNECTED / வெற்றிகரமாக இணைக்கப்பட்டது</span>
                    <h3 className="text-2xl font-black text-[#202124] tracking-tighter mt-4">WhatsApp is Live & Active!</h3>
                    <p className="text-xs text-[#5F6368] font-bold max-w-md mx-auto mt-2 leading-relaxed">
                      All marketing campaigns, POS transaction billing receipts, and staff performance notifications are currently running from your active connected phone number!
                    </p>
                  </div>

                  <div className="w-full bg-[#F8F9FA] rounded-3xl p-4 sm:p-4 sm:p-6 border border-[#DADCE0] flex flex-col gap-3 text-left">
                    <div className="flex justify-between items-center text-xs font-bold border-b border-[#DADCE0]/60 pb-3">
                      <span className="text-[#5F6368]">Integration Engine</span>
                      <span className="text-[#202124]">Baileys (WebSockets)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-[#5F6368]">Session Auth Cache</span>
                      <span className="text-emerald-600">Secure MongoDB (Cloud Sync)</span>
                    </div>
                  </div>

                  <button
                    onClick={handleDisconnectWhatsapp}
                    disabled={disconnecting}
                    className="mt-4 bg-black text-white hover:bg-red-600 hover:text-white border border-transparent px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md flex items-center gap-2"
                  >
                    {disconnecting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Disconnecting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} /> Disconnect WhatsApp Session / மாற்று எண் மாற்றுக
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Disconnected / Scanning QR Code State Card */
                <div className="bg-white rounded-[2.5rem] border border-[#DADCE0] shadow-xl p-5 md:p-10 flex flex-col md:flex-row gap-10 items-center">
                  
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center flex-wrap gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                        <AlertCircle size={18} />
                      </div>
                      <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">DISCONNECTED / வாட்ஸ்அப் இணைக்கப்படவில்லை</span>
                    </div>

                    <h3 className="text-2xl font-black text-[#202124] tracking-tighter uppercase">Link a Phone Number to Start Sending!</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">1</div>
                        <p className="text-xs text-[#5F6368] font-bold leading-relaxed">
                          Open <span className="text-[#202124]">WhatsApp</span> on your mobile phone.
                        </p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">2</div>
                        <p className="text-xs text-[#5F6368] font-bold leading-relaxed">
                          Tap <span className="text-[#202124]">Menu</span> (Settings) &gt; <span className="text-[#202124]">Linked Devices</span> (இணைக்கப்பட்ட சாதனங்கள்).
                        </p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">3</div>
                        <p className="text-xs text-[#5F6368] font-bold leading-relaxed">
                          Tap <span className="text-[#202124]">Link a Device</span> and point your phone camera to scan the QR Code on the right!
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3">
                      <AlertCircle size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-blue-800 leading-normal">
                        NOTE: You can scan ANY phone number (your personal number, store business number, staff number). The session will instantly save to our secure MongoDB, allowing continuous sending!
                      </p>
                    </div>
                  </div>

                  <div className="w-full md:w-80 flex flex-col items-center justify-center shrink-0 border-l border-[#DADCE0]/50 pl-0 md:pl-10">
                    {whatsappStatus.qr ? (
                      <div className="space-y-4 text-center">
                        <div className="p-4 bg-white rounded-3xl border border-[#DADCE0] shadow-md inline-block">
                          <img 
                            src={whatsappStatus.qr} 
                            className="w-60 h-60 object-contain rounded-2xl" 
                            alt="WhatsApp QR Scan Code"
                          />
                        </div>
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest animate-pulse flex items-center justify-center gap-1.5">
                          <RefreshCcw size={12} className="animate-spin" /> QR Code Refreshes Live
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Loader2 size={40} className="animate-spin text-[#1A73E8] mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#5F6368] max-w-[180px]">
                          Generating New Live QR Code...
                        </p>
                        <p className="text-[8px] text-[#BDC1C6] font-bold uppercase mt-1">Please wait a moment</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* DETAIL MODAL OVERLAY */}
      <AnimatePresence>
        {selectedBroadcast && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end p-0 md:p-4 sm:p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedBroadcast(null)} className="absolute inset-0 bg-[#202124]/80 backdrop-blur-md" />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              className="relative w-full max-w-2xl h-full bg-[#FAFAFA] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
                <div className="p-5 md:p-10 bg-white border-b border-[#DADCE0]">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedBroadcast.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                      {selectedBroadcast.status}
                    </div>
                    <button onClick={() => setSelectedBroadcast(null)} className="text-[#5F6368] hover:text-[#202124] transition-colors"><X size={24} /></button>
                  </div>
                  <h2 className="text-3xl font-black text-[#202124] tracking-tighter uppercase">{selectedBroadcast.title}</h2>
                  
                  {/* WhatsApp Style Preview */}
                  <div className="mt-6 bg-[#E7FFDB] p-4 sm:p-4 sm:p-6 rounded-2xl rounded-tl-none border border-[#D0EBC1] relative shadow-sm max-w-[90%]">
                      <div className="absolute -left-2 top-0 w-4 h-4 bg-[#E7FFDB] rotate-45 border-l border-t border-[#D0EBC1]" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
                      <p className="text-[#202124] text-sm whitespace-pre-wrap leading-relaxed">{selectedBroadcast.message}</p>
                      <div className="flex justify-end items-center gap-1 mt-2">
                          <p className="text-[9px] text-[#5F6368] uppercase font-bold">{format(new Date(selectedBroadcast.createdAt), 'hh:mm a')}</p>
                          <CheckCircle size={10} className="text-[#34A853]" />
                      </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 md:p-10 custom-scrollbar">
                  {loadingDetails ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-50">
                      <Loader2 size={40} className="animate-spin text-[#1A73E8] mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#5F6368]">Decrypting Logs...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-[#5F6368] uppercase tracking-[0.3em] mb-6">Transmission Ledger</h4>
                      {broadcastDetails?.map((log, i) => (
                        <div key={i} className="bg-white p-4 sm:p-4 sm:p-6 rounded-3xl border border-[#DADCE0] flex items-center justify-between group hover:border-[#1A73E8] transition-all">
                          <div className="flex items-center flex-wrap gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${['sent', 'delivered'].includes(log.status) ? 'bg-emerald-50 text-emerald-600' : log.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                              {['sent', 'delivered'].includes(log.status) ? <CheckCircle size={18} /> : log.status === 'failed' ? <AlertCircle size={18} /> : <Clock size={18} />}
                            </div>
                            <div>
                              <p className="text-sm font-black text-[#202124] uppercase tracking-tight">{log.customerName}</p>
                              <p className="text-[10px] font-bold text-[#5F6368]">+{log.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${['sent', 'delivered'].includes(log.status) ? 'text-emerald-600' : log.status === 'failed' ? 'text-red-600' : 'text-gray-400'}`}>
                              {log.status}
                            </p>
                            <p className="text-[9px] font-bold text-[#BDC1C6] mt-1">
                                {log.sentAt ? format(new Date(log.sentAt), 'hh:mm:ss a') : 'Pending'}
                            </p>
                            {log.error && <p className="text-[8px] font-bold text-red-400 mt-1 max-w-[150px] truncate">{log.error}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;500;600;700;800;900&display=swap');
        .font-sans { font-family: 'Outfit', sans-serif; }
      `}} />
    </div>
  );
};

export default BroadcastCenter;
