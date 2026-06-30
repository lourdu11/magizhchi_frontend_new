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
    setResizerState({ isOpen: false, file: null, target: null });
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append('image', blob, 'product.webp');
      const res = await adminService.uploadImage(fd);
      const url = res.data?.url || res.data?.data?.url;
      if (!url) throw new Error('No URL returned from upload');

      const currentImages = formData.images || [];
      setField('images', [...currentImages, url]);
      toast.success('✅ Image cropped and added to gallery!');
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
    // Launch resizer with URL instead of applying immediately
    setResizerState({ isOpen: true, file: url, target: 'gallery' });
    setUrlInput('');
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
    
    // If only 1 file is selected, open the crop/resize modal
    if (fileArray.length === 1) {
      setResizerState({ isOpen: true, file: fileArray[0], target: 'gallery' });
      return;
    }
    
    // Show loading state for multiple files
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



  const masterImage = formData.images?.[0] || formData.laptopImage || formData.mobileImage;
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
      <SectionHeader title="Visual Identity" subtitle="Manage all product images and device layouts in one place" />

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* ── LEFT: UPLOAD & GALLERY ───────────────────────────── */}
        <div className="lg:col-span-7 space-y-6 p-4 md:p-4 md:p-8 bg-white rounded-[2.5rem] border-2 border-border-light shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-premium-gold/10 flex items-center justify-center">
              <ImageIcon size={20} className="text-premium-gold" />
            </div>
            <div>
              <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">Product Gallery</h3>
              <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                Upload all product images. The main image applies to device previews.
              </p>
            </div>
          </div>

          {/* Upload Switcher */}
          <div className="flex gap-1 p-1 bg-light-bg rounded-2xl border border-border-light w-full max-w-sm">
            {[
              { id: 'file', label: '📁 Upload Files' },
              { id: 'url', label: '🔗 Paste URL' },
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

          {/* File Upload Dropzone */}
          {uploadTab === 'file' && (
            <div 
              className="border-2 border-dashed border-border-light rounded-[2rem] p-5 md:p-10 text-center bg-light-bg/20 hover:bg-premium-gold/5 hover:border-premium-gold transition-all cursor-pointer relative"
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
                  <p className="text-[10px] font-black text-charcoal uppercase tracking-widest">Drag & Drop Images Here</p>
                  <p className="text-[8px] font-bold text-text-muted uppercase tracking-wider mt-1">or click to browse your computer</p>
                </div>
              </div>
            </div>
          )}

          {/* URL Upload */}
          {uploadTab === 'url' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="Paste public image URL here..."
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
            </div>
          )}

          {/* Upload Progress */}
          {multiUploadingFiles.length > 0 && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
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

          <div className="h-px w-full bg-border-light my-6" />

          {/* Gallery Thumbnails */}
          {formData.images?.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {formData.images.map((img, i) => (
                <div
                  key={i}
                  className={`group relative aspect-[3/4] rounded-2xl overflow-hidden border-2 bg-light-bg transition-all hover:shadow-xl flex flex-col ${i === 0 ? 'border-premium-gold' : 'border-border-light hover:border-premium-gold/50'}`}
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i, img)}
                    className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-white/90 hover:bg-red-500 hover:text-white text-red-500 flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                  <div 
                    className="relative flex-1 bg-white overflow-hidden cursor-pointer" 
                    onClick={() => {
                      if (i !== 0) handleMakeMain(i);
                    }}
                  >
                    <img src={img} alt={`gallery-${i}`} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" />
                    <button 
                       type="button"
                       onClick={(e) => { e.stopPropagation(); setFullPreview({ src: img, label: `Image ${i + 1}` }); }}
                       className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center z-10"
                    >
                       <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    {i === 0 && (
                      <span className="absolute top-2 left-2 bg-premium-gold text-charcoal text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm z-10 pointer-events-none">Main</span>
                    )}
                  </div>
                  <div className="p-2 bg-white border-t border-border-light flex items-center justify-between gap-1">
                    <div className="flex gap-1">
                      <button type="button" disabled={i === 0} onClick={() => handleMove(i, 'left')} className="p-1 bg-light-bg rounded hover:text-premium-gold disabled:opacity-30">
                        <ChevronLeft size={12} />
                      </button>
                      <button type="button" disabled={i === formData.images.length - 1} onClick={() => handleMove(i, 'right')} className="p-1 bg-light-bg rounded hover:text-premium-gold disabled:opacity-30">
                        <ChevronRight size={12} />
                      </button>
                    </div>
                    {i > 0 && (
                      <button type="button" onClick={() => handleMakeMain(i)} className="px-1.5 py-0.5 bg-premium-gold/10 text-premium-gold rounded text-[6px] font-black uppercase hover:bg-premium-gold hover:text-charcoal transition-all">
                        Set Main
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-border-light rounded-3xl bg-light-bg/10">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">No Images Uploaded</p>
            </div>
          )}

          {/* Image Controls (only show if we have images) */}
          {masterImage && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-4 sm:p-4 sm:p-6 bg-light-bg rounded-3xl border border-border-light space-y-5">
              <p className="text-[9px] font-black text-charcoal uppercase tracking-[0.2em] flex items-center gap-2">
                <Move size={12} className="text-premium-gold" /> Device Display Controls
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FitSelector value={fit} onChange={v => setField('detailFit', v)} />
                <PositionPicker value={position} onChange={v => setField('position', v)} />
              </div>
              <ScaleControl value={scale} onChange={v => setField('scale', v)} />
              <div className="space-y-2">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Background Style</p>
                <div className="flex gap-2">
                  {[{ val: 'ambient', label: 'Glow Effect' }, { val: 'solid', label: 'White BG' }].map(opt => (
                    <button key={opt.val} type="button" onClick={() => setField('bgStyle', opt.val)} className={`flex-1 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${bgStyle === opt.val ? 'bg-charcoal text-white border-charcoal' : 'bg-white border-border-light text-text-muted hover:border-premium-gold'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── RIGHT: LIVE PREVIEWS ───────────────────────────── */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-4 md:p-4 md:p-8 bg-white rounded-[2.5rem] border border-border-light shadow-sm space-y-6 sticky top-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">Live Previews</h3>
                <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                  How it looks on devices
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {devices.map(dev => {
                // Ensure the "Main" image (images[0]) strictly overrides any specific device images from the database
                const src = formData.images?.[0] || formData[dev.key] || masterImage;
                
                return (
                  <div key={dev.key} className="space-y-2 p-4 bg-light-bg/20 border border-border-light rounded-3xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-charcoal uppercase tracking-wider">{dev.label}</span>
                      {src && (
                        <button
                          type="button"
                          onClick={() => setFullPreview({ src, label: dev.label })}
                          className="text-[8px] font-black text-premium-gold uppercase tracking-widest flex items-center gap-1 hover:underline"
                        >
                          <Eye size={10} /> Full View
                        </button>
                      )}
                    </div>
                    <LivePreview
                      src={src}
                      fit={dev.key === 'mobileImage' ? (formData.cardFit || 'contain') : fit}
                      position={position}
                      scale={scale}
                      bgStyle={bgStyle}
                      label={dev.label}
                      aspect={dev.aspect}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── FULL SCREEN PREVIEW MODAL ───────────────────────────── */}
      <AnimatePresence>
        {fullPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-4 sm:p-6"
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
