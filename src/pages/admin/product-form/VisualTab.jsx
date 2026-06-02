import { useState, useRef, useCallback } from 'react';
import { useProductForm } from './FormContext';
import { SectionHeader } from './Common';
import {
  ImageIcon, Loader2, X, Upload, Plus, Move,
  Maximize2, AlignCenter, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, RotateCcw, Check, Eye,
  Link2, Copy, ExternalLink
} from 'lucide-react';
import SafeImage from '../../../components/common/SafeImage';
import AdminSingleImageResizer from '../../../components/admin/AdminSingleImageResizer';
import { adminService } from '../../../services';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { LivePreview, PositionPicker, FitSelector, ScaleControl, DropZone } from '../../../components/admin/AdminVisualManager';


// ── Main VisualTab ──────────────────────────────────────────────
export default function VisualTab() {
  const { state, dispatch } = useProductForm();
  const { formData, isUploading } = state;
  const [activeDevice, setActiveDevice] = useState('all');
  const [fullPreview, setFullPreview] = useState(null);
  const [uploadTab, setUploadTab] = useState('file'); // 'file' | 'url'
  const [urlInput, setUrlInput] = useState('');
  const [lastUploadedUrl, setLastUploadedUrl] = useState('');
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [lastGalleryUrl, setLastGalleryUrl] = useState('');

  const setField = (field, value) => dispatch({ type: 'SET_FIELD', field, value });
  const setUploading = (v) => dispatch({ type: 'SET_UPLOADING', value: v });
    const [resizerState, setResizerState] = useState({ isOpen: false, file: null, target: null });

  // ── Core: Smart single-upload handler ──────────────────────────
  const handleUpload = (file, target = 'all') => {
    if (!file) return;
    setResizerState({ isOpen: true, file, target });
  };

  const handleResizerSave = async (blob) => {
    const target = resizerState.target;
    setResizerState({ isOpen: false, file: null, target: null });
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append('image', blob, 'product.webp');
      const res = await adminService.uploadImage(fd);
      const url = res.data?.url || res.data?.data?.url;
      if (!url) throw new Error('No URL returned from upload');


      // Show the Cloudinary URL
      setLastUploadedUrl(url);

      if (target === 'gallery') {
        const currentImages = Array.isArray(formData.images) ? formData.images : [];
        if (currentImages.includes(url)) {
          toast.error('Image is already in the gallery!');
          return;
        }
        setLastGalleryUrl(url);
        setField('images', [...currentImages, url]);
        toast.success('Gallery image added!');
        return;
      }

      // ONE upload → auto-fill ALL device slots unless targeting specific
      if (target === 'all') {
        setField('laptopImage', url);
        setField('tabletImage', url);
        setField('mobileImage', url);
        
        let currentImages = Array.isArray(formData.images) ? [...formData.images] : [];
        currentImages = currentImages.filter(img => img !== url);
        setField('images', [url, ...currentImages]);
        
        toast.success('✅ Image uploaded! Auto-applied to all device sizes.', { duration: 4000 });
      } else {
        setField(target, url);
        toast.success(`${target.replace('Image', '')} image updated!`);
      }
    } catch (e) {
      console.error(e);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleMoveImage = (index, direction) => {
    const currentImages = [...(formData.images || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentImages.length) return;
    
    // Swap
    const temp = currentImages[index];
    currentImages[index] = currentImages[targetIndex];
    currentImages[targetIndex] = temp;
    
    setField('images', currentImages);
    toast.success('Image reordered!');
  };

  const handleSetMainImage = (url) => {
    if (!url) return;
    const currentImages = [...(formData.images || [])];
    const index = currentImages.indexOf(url);
    if (index > -1) {
      currentImages.splice(index, 1);
      currentImages.unshift(url);
      setField('images', currentImages);
    }
    
    setField('laptopImage', url);
    setField('tabletImage', url);
    setField('mobileImage', url);
    toast.success('✅ Set as Main cover image!');
  };

  const handleRemoveGalleryImage = async (e, index, url) => {
    e.stopPropagation();
    const currentImages = (formData.images || []).filter((_, idx) => idx !== index);
    setField('images', currentImages);
    
    const nextMaster = currentImages[0] || '';
    if (formData.laptopImage === url) setField('laptopImage', nextMaster);
    if (formData.tabletImage === url) setField('tabletImage', nextMaster);
    if (formData.mobileImage === url) setField('mobileImage', nextMaster);

    toast.success('Image removed from gallery');
    
    if (url && url.includes('res.cloudinary.com')) {
      try {
        await adminService.deleteMedia(url);
      } catch (err) {
        console.error('Failed to delete Cloudinary asset', err);
      }
    }
  };



  const masterImage = formData.laptopImage || formData.mobileImage || formData.images?.[0];
  const fit = formData.detailFit || 'contain';
  const position = formData.position || 'center';
  const scale = formData.scale || 1;
  const bgStyle = formData.bgStyle || 'ambient';

  const devices = [
    { key: 'laptopImage', label: 'Desktop', aspect: '16/9' },
    { key: 'tabletImage', label: 'Tablet', aspect: '4/3' },
    { key: 'mobileImage', label: 'Mobile', aspect: '1/1' },
  ];

  return (
    <div className="space-y-10">
      <SectionHeader title="Visual Identity" subtitle="Upload once — auto-fits all device sizes" />

      {/* ── MASTER UPLOAD ZONE ─────────────────────────────────── */}
      <div className="p-8 bg-white rounded-[2.5rem] border-2 border-border-light shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-premium-gold/10 flex items-center justify-center">
            <ImageIcon size={20} className="text-premium-gold" />
          </div>
          <div>
            <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">Master Image Upload</h3>
            <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
              Upload once → automatically applied to all device sizes
            </p>
          </div>
          {masterImage && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-100">
              <Check size={10} /> Image Set
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Upload + Controls */}
          <div className="space-y-6">

            {/* Upload mode switcher */}
            <div className="flex gap-1 p-1 bg-light-bg rounded-2xl border border-border-light">
              {[
                { id: 'file', label: '📁 Upload File', icon: Upload },
                { id: 'url', label: '🔗 Paste URL', icon: Link2 },
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
                onFile={(file) => handleUpload(file, 'all')}
                loading={isUploading}
                hasImage={!!masterImage}
                label="Recommended: 1200×1200px or larger · JPG, PNG, WebP"
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
                    placeholder="Paste Cloudinary / image URL here..."
                    className="flex-1 bg-white border-2 border-border-light rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-premium-gold transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!urlInput.trim()) return toast.error('Please enter a URL');
                      const url = urlInput.trim();
                      setField('laptopImage', url);
                      setField('tabletImage', url);
                      setField('mobileImage', url);
                      
                      let currentImages = Array.isArray(formData.images) ? [...formData.images] : [];
                      currentImages = currentImages.filter(img => img !== url);
                      setField('images', [url, ...currentImages]);
                      
                      setLastUploadedUrl(url);
                      setUrlInput('');
                      toast.success('✅ URL applied to all device sizes!');
                    }}
                    className="px-5 py-3 bg-charcoal text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-[8px] text-text-muted font-bold pl-1">Paste any public image URL — Cloudinary, S3, or direct link</p>
              </div>
            )}

            {/* Uploaded URL display */}
            {lastUploadedUrl && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                  <Check size={10} /> Cloudinary URL
                </p>
                <div className="flex gap-2 items-center">
                  <p className="text-[9px] text-emerald-700 font-mono truncate flex-1">{lastUploadedUrl}</p>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(lastUploadedUrl); toast.success('URL copied!'); }}
                    className="shrink-0 p-2 bg-white border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all"
                    title="Copy URL"
                  >
                    <Copy size={12} className="text-emerald-600" />
                  </button>
                  <a
                    href={lastUploadedUrl}
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


            {/* Image Controls */}
            {masterImage && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 p-6 bg-light-bg rounded-3xl border border-border-light">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                  <Move size={12} className="text-premium-gold" /> Image Display Controls
                </p>

                <FitSelector value={fit} onChange={v => setField('detailFit', v)} />
                <PositionPicker value={position} onChange={v => setField('position', v)} />
                <ScaleControl value={scale} onChange={v => setField('scale', v)} />

                {/* BG Style */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Background Style</p>
                  <div className="flex gap-2">
                    {[
                      { val: 'ambient', label: 'Glow Effect' },
                      { val: 'solid', label: 'White BG' },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setField('bgStyle', opt.val)}
                        className={`flex-1 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${bgStyle === opt.val ? 'bg-charcoal text-white border-charcoal' : 'bg-white border-border-light text-text-muted hover:border-premium-gold'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset */}
                <button
                  type="button"
                  onClick={() => { setField('detailFit', 'contain'); setField('position', 'center'); setField('scale', 1); setField('bgStyle', 'ambient'); toast.success('Display settings reset'); }}
                  className="w-full py-2.5 rounded-xl border border-border-light text-[9px] font-black text-text-muted uppercase tracking-widest hover:border-red-300 hover:text-red-500 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={11} /> Reset to Default
                </button>
              </motion.div>
            )}
          </div>

          {/* Right: Live Previews */}
          <div className="space-y-4">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Live Preview — All Devices</p>
            {devices.map(dev => (
              <div key={dev.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-charcoal uppercase tracking-wider">{dev.label}</span>
                  {formData[dev.key] && (
                    <button
                      type="button"
                      onClick={() => setFullPreview({ src: formData[dev.key], label: dev.label })}
                      className="text-[8px] font-black text-premium-gold uppercase tracking-widest flex items-center gap-1 hover:underline"
                    >
                      <Eye size={10} /> Full View
                    </button>
                  )}
                </div>
                <LivePreview
                  src={formData[dev.key]}
                  fit={dev.key === 'mobileImage' ? (formData.cardFit || 'contain') : fit}
                  position={position}
                  scale={scale}
                  bgStyle={bgStyle}
                  label={dev.label}
                  aspect={dev.aspect}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRODUCT GALLERY ──────────────────────────────────────── */}
      <div className="p-8 bg-white rounded-[2.5rem] border border-border-light shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-premium-gold/10 flex items-center justify-center">
              <ImageIcon size={18} className="text-premium-gold" />
            </div>
            <div>
              <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">Product Gallery</h3>
              <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                Upload secondary angles & alternate colors (Duplicates auto-merged)
              </p>
            </div>
          </div>
          
          <div className="flex-1 max-w-sm flex gap-2">
            <input 
              type="url" 
              value={galleryUrlInput} 
              onChange={e => setGalleryUrlInput(e.target.value)}
              placeholder="Paste image URL here..."
              className="flex-1 bg-light-bg border border-border-light rounded-xl px-4 py-2 text-[10px] font-bold focus:outline-none focus:border-premium-gold transition-all"
            />
            <button 
              type="button" 
              onClick={() => {
                const url = galleryUrlInput.trim();
                if (!url) return toast.error('Enter URL');
                const currentImages = Array.isArray(formData.images) ? formData.images : [];
                if (currentImages.includes(url)) {
                  return toast.error('This image is already in the gallery');
                }
                setField('images', [...currentImages, url]);
                setLastGalleryUrl(url);
                setGalleryUrlInput('');
                toast.success('✅ URL added to gallery!');
              }}
              className="px-4 py-2 bg-charcoal text-white rounded-xl text-[9px] font-black uppercase hover:bg-premium-gold hover:text-charcoal transition-all"
            >
              Add URL
            </button>
          </div>
        </div>

        {lastGalleryUrl && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
             <div className="flex items-center gap-2 overflow-hidden mr-4">
               <Check size={12} className="text-emerald-600 shrink-0" />
               <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest shrink-0">Added URL:</span>
               <span className="text-[9px] font-mono text-emerald-700 truncate">{lastGalleryUrl}</span>
             </div>
             <div className="flex gap-1 shrink-0">
               <button type="button" onClick={() => { navigator.clipboard.writeText(lastGalleryUrl); toast.success('URL copied!'); }} className="p-1.5 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all text-emerald-600"><Copy size={12} /></button>
               <a href={lastGalleryUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all text-emerald-600"><ExternalLink size={12} /></a>
             </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {(formData.images || []).map((img, i) => (
            <div
              key={i}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-border-light group bg-light-bg cursor-pointer flex flex-col"
              onClick={() => setFullPreview({ src: img, label: `Gallery Image ${i + 1}` })}
            >
              <img src={img} alt={`gallery-${i}`} className="w-full h-full object-contain" />
              
              {/* Overlay with options */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex items-center justify-between">
                  {i === 0 ? (
                    <span className="bg-premium-gold text-charcoal text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Main</span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleSetMainImage(img); }}
                      className="bg-white/90 hover:bg-white text-charcoal text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow"
                    >
                      Make Main
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={e => handleRemoveGalleryImage(e, i, img)}
                    className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>

                {/* Move order buttons */}
                <div className="flex gap-1.5 justify-center w-full bg-black/20 backdrop-blur-sm rounded-lg p-1" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => handleMoveImage(i, -1)}
                    className={`p-1 rounded-md text-white ${i === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20'}`}
                    title="Move Left"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <span className="text-[8px] font-black text-white/70 uppercase tracking-widest flex items-center">
                    {i + 1}
                  </span>
                  <button
                    type="button"
                    disabled={i === (formData.images || []).length - 1}
                    onClick={() => handleMoveImage(i, 1)}
                    className={`p-1 rounded-md text-white ${i === (formData.images || []).length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20'}`}
                    title="Move Right"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
              
              {i === 0 && (
                <div className="absolute bottom-2 left-2 bg-premium-gold text-charcoal text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider group-hover:opacity-0 transition-opacity">Main</div>
              )}
            </div>
          ))}

          {/* Add gallery image file slot */}
          <label className="aspect-[4/5] bg-light-bg border-2 border-dashed border-border-light rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-premium-gold hover:bg-premium-gold/5 transition-all group">
            <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e.target.files[0], 'gallery')} />
            {isUploading ? (
              <Loader2 size={20} className="animate-spin text-premium-gold" />
            ) : (
              <>
                <Plus size={20} className="text-text-muted group-hover:text-premium-gold transition-colors" />
                <span className="text-[8px] font-black text-text-muted uppercase tracking-wider mt-1.5">Add Gallery File</span>
              </>
            )}
          </label>
        </div>
      </div>


      {/* ── FULL SCREEN PREVIEW MODAL ───────────────────────────── */}
      <AnimatePresence>
        {fullPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setFullPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center gap-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-white font-black text-sm uppercase tracking-widest">{fullPreview.label}</span>
                <button
                  onClick={() => setFullPreview(null)}
                  className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="w-full max-h-[80vh] rounded-3xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center p-4">
                <img
                  src={fullPreview.src}
                  alt={fullPreview.label}
                  className="max-w-full max-h-[75vh] object-contain rounded-2xl"
                />
              </div>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Click outside to close</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── IMAGE RESIZER MODAL ─────────────────────────────────── */}
      <AdminSingleImageResizer 
        isOpen={resizerState.isOpen}
        onClose={() => setResizerState({ isOpen: false, file: null, target: null })}
        file={resizerState.file}
        onSave={handleResizerSave}
        targetWidth={2000}
        targetHeight={2500}
        title="Product Image Resizer"
      />
    </div>
  );
}
