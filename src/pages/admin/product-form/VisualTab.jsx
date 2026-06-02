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
  const [multiUploadingFiles, setMultiUploadingFiles] = useState([]);
  const fileInputRef = useRef(null);

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

      // ONE upload → auto-fill ALL device slots unless targeting specific
      if (target === 'all') {
        setField('laptopImage', url);
        setField('tabletImage', url);
        setField('mobileImage', url);
        // Also set as primary product image if not set
        if (!formData.images?.length) {
          setField('images', [url]);
        }
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

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return toast.error('Enter URL');
    const url = urlInput.trim();
    const currentImages = formData.images || [];
    if (currentImages.includes(url)) {
      toast.error('This URL is already in the showcase gallery!');
      return;
    }
    setField('images', [...currentImages, url]);
    setUrlInput('');
    toast.success('✅ URL added to showcase gallery!');
  };

  const handleMultiDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleMultiUpload(e.dataTransfer.files);
    }
  };

  const handleMultiUpload = async (files) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    
    // Show loading state
    setMultiUploadingFiles(prev => [...prev, ...fileArray]);
    
    let successCount = 0;
    const newUrls = [];
    
    for (const file of fileArray) {
      try {
        const fd = new FormData();
        fd.append('image', file);
        const res = await adminService.uploadImage(fd);
        const url = res.data?.url || res.data?.data?.url;
        if (url) {
          newUrls.push(url);
          successCount++;
        }
      } catch (err) {
        console.error('Failed to upload file:', file.name, err);
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setMultiUploadingFiles(prev => prev.filter(f => f.name !== file.name));
      }
    }
    
    if (newUrls.length > 0) {
      const currentImages = formData.images || [];
      const merged = [...currentImages];
      newUrls.forEach(url => {
        if (!merged.includes(url)) {
          merged.push(url);
        }
      });
      setField('images', merged);
      toast.success(`Successfully uploaded ${successCount} showcase image(s)!`);
    }
  };

  const handleMove = (index, direction) => {
    const currentImages = [...(formData.images || [])];
    if (direction === 'left' && index > 0) {
      const temp = currentImages[index];
      currentImages[index] = currentImages[index - 1];
      currentImages[index - 1] = temp;
    } else if (direction === 'right' && index < currentImages.length - 1) {
      const temp = currentImages[index];
      currentImages[index] = currentImages[index + 1];
      currentImages[index + 1] = temp;
    }
    setField('images', currentImages);
  };

  const handleMakeMain = (index) => {
    const currentImages = [...(formData.images || [])];
    const mainImg = currentImages[index];
    currentImages.splice(index, 1);
    currentImages.unshift(mainImg);
    setField('images', currentImages);
    toast.success('Main image updated!');
  };

  const handleRemoveImage = async (index, url) => {
    if (!window.confirm('Are you sure you want to remove this showcase image?')) return;
    const currentImages = [...(formData.images || [])];
    currentImages.splice(index, 1);
    setField('images', currentImages);
    
    if (url && url.includes('res.cloudinary.com')) {
      try {
        await adminService.deleteMedia(url);
        toast.success('Permanently deleted from Cloudinary');
      } catch (err) {
        console.error('Failed to delete asset from Cloudinary:', err);
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
      <SectionHeader title="Visual Identity" subtitle="Manage showcase gallery and device-specific layouts" />

      {/* ── SHOWCASE GALLERY UPLOADER ───────────────────────────── */}
      <div className="p-8 bg-white rounded-[2.5rem] border-2 border-border-light shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-premium-gold/10 flex items-center justify-center">
            <ImageIcon size={20} className="text-premium-gold" />
          </div>
          <div>
            <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">Showcase Gallery Upload</h3>
            <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
              Upload multiple lifestyle photos and color angles into the Showcase Gallery
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Upload + Controls */}
          <div className="space-y-6">

            {/* Upload mode switcher */}
            <div className="flex gap-1 p-1 bg-light-bg rounded-2xl border border-border-light">
              {[
                { id: 'file', label: '📁 Upload Files', icon: Upload },
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
              <div 
                className="border-2 border-dashed border-border-light rounded-[2rem] p-10 text-center bg-light-bg/20 hover:bg-premium-gold/5 hover:border-premium-gold transition-all cursor-pointer relative"
                onDragOver={e => e.preventDefault()}
                onDrop={handleMultiDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={e => handleMultiUpload(e.target.files)} 
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white border border-border-light flex items-center justify-center shadow-sm">
                    <Upload size={18} className="text-charcoal" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-charcoal uppercase tracking-widest">Drag & Drop Multiple Files here</p>
                    <p className="text-[8px] font-bold text-text-muted uppercase tracking-wider mt-1">or click to browse your computer</p>
                  </div>
                </div>
              </div>
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
                    onClick={handleUrlAdd}
                    className="px-5 py-3 bg-charcoal text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all whitespace-nowrap"
                  >
                    Add URL
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

          {/* Right: Live Previews & Specific Uploads */}
          <div className="space-y-6">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Live Preview & Specific Uploads</p>
            {devices.map(dev => (
              <div key={dev.key} className="space-y-2 p-4 bg-light-bg/20 border border-border-light rounded-3xl">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-charcoal uppercase tracking-wider">{dev.label}</span>
                  <div className="flex items-center gap-2">
                    {formData[dev.key] && (
                      <>
                        <button
                          type="button"
                          onClick={() => setFullPreview({ src: formData[dev.key], label: dev.label })}
                          className="text-[8px] font-black text-premium-gold uppercase tracking-widest flex items-center gap-1 hover:underline mr-2"
                        >
                          <Eye size={10} /> Full View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setField(dev.key, '');
                            toast.success(`Cleared ${dev.label} image`);
                          }}
                          className="text-[8px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 hover:underline"
                        >
                          Clear
                        </button>
                      </>
                    )}
                  </div>
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
                
                {/* Specific Upload Button */}
                <div className="mt-2.5">
                  <label className="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-border-light hover:border-premium-gold hover:bg-premium-gold/5 bg-white text-text-muted hover:text-charcoal rounded-xl text-[8px] font-black uppercase tracking-widest cursor-pointer transition-all">
                    <Upload size={10} /> Upload for {dev.label}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleUpload(e.target.files[0], dev.key)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SHOWCASE GALLERY (MULTI-IMAGE) ────────────────────── */}
      <div className="p-8 bg-white rounded-[2.5rem] border border-border-light shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-premium-gold/10 flex items-center justify-center">
            <ImageIcon size={18} className="text-premium-gold" />
          </div>
          <div>
            <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">Showcase Gallery</h3>
            <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
              View, reorder, and configure your product showcase gallery below
            </p>
          </div>
        </div>

        {/* Uploading Progress Indicators */}
        {multiUploadingFiles.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
            {multiUploadingFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-border-light shadow-sm">
                <Loader2 size={16} className="animate-spin text-premium-gold shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-black text-charcoal truncate uppercase">{file.name}</p>
                  <p className="text-[7px] font-bold text-text-muted uppercase">Uploading...</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gallery Thumbnails List */}
        {formData.images?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {formData.images.map((img, i) => (
              <div
                key={i}
                className="group relative aspect-[3/4] rounded-3xl overflow-hidden border border-border-light bg-light-bg transition-all hover:shadow-xl hover:border-premium-gold/50 flex flex-col"
              >
                {/* Floating Absolute Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(i, img)}
                  className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-white/90 hover:bg-red-500 hover:text-white text-red-500 flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100"
                  title="Remove Image"
                >
                  <X size={14} />
                </button>

                {/* Image */}
                <div className="relative flex-1 bg-white overflow-hidden cursor-pointer" onClick={() => setFullPreview({ src: img, label: `Showcase Image ${i + 1}` })}>
                  <img src={img} alt={`gallery-${i}`} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {i === 0 && (
                    <span className="absolute top-3 left-3 bg-premium-gold text-charcoal text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm z-10">Main Image</span>
                  )}
                </div>

                {/* Control Panel */}
                <div className="p-2.5 bg-white border-t border-border-light flex items-center justify-between gap-1.5">
                  <div className="flex gap-1">
                    {/* Left Reorder */}
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => handleMove(i, 'left')}
                      className="p-1.5 bg-light-bg rounded-lg hover:bg-premium-gold/10 hover:text-premium-gold transition-all disabled:opacity-30 disabled:hover:bg-light-bg disabled:hover:text-text-muted"
                      title="Move Left"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    {/* Right Reorder */}
                    <button
                      type="button"
                      disabled={i === formData.images.length - 1}
                      onClick={() => handleMove(i, 'right')}
                      className="p-1.5 bg-light-bg rounded-lg hover:bg-premium-gold/10 hover:text-premium-gold transition-all disabled:opacity-30 disabled:hover:bg-light-bg disabled:hover:text-text-muted"
                      title="Move Right"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Make Main Button */}
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMakeMain(i)}
                        className="px-2 py-1 bg-premium-gold/10 text-premium-gold rounded-lg text-[7px] font-black uppercase hover:bg-premium-gold hover:text-charcoal transition-all"
                      >
                        Set Main
                      </button>
                    )}
                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i, img)}
                      className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                      title="Delete Image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border-light rounded-3xl bg-light-bg/10">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">No Showcase Images Uploaded</p>
            <p className="text-[8px] font-bold text-text-muted uppercase mt-1">Upload files above to populate the product's image display</p>
          </div>
        )}
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
