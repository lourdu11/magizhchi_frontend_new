import { useState, useEffect } from 'react';
import { useProductForm } from './FormContext';
import { SectionHeader, InputField, SelectField } from './Common';
import { ImageIcon, Loader2, X, Upload, Plus } from 'lucide-react';
import SafeImage from '../../../components/common/SafeImage';
import { adminService } from '../../../services';
import { toast } from 'react-hot-toast';

const BannerPreview = ({ src, aspect, fit, pos, scale, bgStyle, label, onZoomIn, onZoomOut }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (src) { setLoading(true); setError(false); }
  }, [src]);

  return (
    <div className={`relative w-full overflow-hidden rounded-[2.5rem] ${bgStyle === 'solid' ? 'bg-white' : 'bg-light-bg'} border border-border-light shadow-inner group transition-all duration-300`} style={{ aspectRatio: aspect }}>
      {loading && src && (
        <div className="absolute inset-0 flex items-center justify-center bg-light-bg z-10">
          <Loader2 className="animate-spin text-premium-gold" size={24} />
        </div>
      )}
      {!src || error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted bg-light-bg">
          <ImageIcon size={32} strokeWidth={1.5} className="opacity-20" />
          <span className="text-[10px] font-black mt-2 uppercase tracking-widest">{error ? 'Load Failed' : `No ${label} Image`}</span>
        </div>
      ) : (
        <>
          {/* 🌌 Dynamic Glassmorphic Ambient Glow Preview */}
          {bgStyle !== 'solid' && (
            <div 
              className="absolute inset-0 filter blur-3xl opacity-95 scale-115 pointer-events-none select-none transition-all duration-700"
              style={{
                backgroundImage: `url(${src})`,
                backgroundSize: 'cover',
                backgroundPosition: pos || 'center'
              }}
            />
          )}

          <img
            src={src}
            alt={`${label} Preview`}
            className={`w-full h-full block relative z-10 transition-all duration-700 ${loading ? 'opacity-0 scale-105 blur-sm' : 'opacity-100 scale-100 blur-0'}`}
            style={{
              objectFit: fit || 'cover',
              objectPosition: pos || 'center',
              transform: `scale(${scale || 1})`
            }}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        </>
      )}
      <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-border-light pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
        {label} VIEW
      </div>

      {src && !error && (
        <div className="absolute bottom-6 right-6 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onZoomOut();
            }}
            className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-sm border border-border-light/50 hover:bg-premium-gold hover:text-charcoal text-charcoal flex items-center justify-center font-black transition-all shadow-lg active:scale-90"
            title="Zoom Out"
          >
            −
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onZoomIn();
            }}
            className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-sm border border-border-light/50 hover:bg-premium-gold hover:text-charcoal text-charcoal flex items-center justify-center font-black transition-all shadow-lg active:scale-90"
            title="Zoom In"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
};

export default function VisualTab() {
  const { state, dispatch } = useProductForm();
  const { formData, isUploading, previewMode } = state;

  const setField = (field, value) => dispatch({ type: 'SET_FIELD', field, value });
  const setUploading = (value) => dispatch({ type: 'SET_UPLOADING', value });
  const setPreviewMode = (value) => dispatch({ type: 'SET_PREVIEW_MODE', value });

  const getField = (mode) => {
    if (mode === 'mobile') return 'mobileImage';
    if (mode === 'tablet') return 'tabletImage';
    return 'laptopImage';
  };

  const handleFileUpload = async (e, targetField) => {
    const file = e.target.files[0];
    if(!file) return;
    setUploading(true);
    try {
      // FIX H2: Optimize image client-side before upload
      const { optimizeImage } = await import('../../../utils/imageOptimizer');
      const optimizedFile = await optimizeImage(file);
      
      const fd = new FormData();
      fd.append('image', optimizedFile);
      
      const res = await adminService.uploadImage(fd);
      const url = res.data?.url || res.data?.data?.url;
      if(url) {
        if (targetField === 'gallery') {
          setField('images', [...(formData.images || []), url]);
        } else {
          setField(targetField, url);
        }
      }
    } catch(e) { 
      console.error(e);
      toast.error('Upload failed'); 
    } finally { 
      setUploading(false); 
    }
  };

  return (
    <div className="space-y-12">
      <SectionHeader title="Visual Identity" subtitle="Multi-device asset configuration" />
      
      <div className="flex bg-light-bg p-2 rounded-[2rem] gap-2 w-fit mx-auto lg:mx-0">
        {['laptop', 'tablet', 'mobile'].map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setPreviewMode(m)}
            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${previewMode === m ? 'bg-charcoal text-white shadow-xl shadow-charcoal/20' : 'text-text-muted hover:text-charcoal'}`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div className="space-y-8">
          <BannerPreview 
            src={formData[getField(previewMode)]} 
            aspect={previewMode === 'laptop' ? '16 / 9' : previewMode === 'tablet' ? '4 / 3' : '1 / 1'} 
            fit={previewMode === 'mobile' ? (formData.cardFit || 'cover') : (formData.detailFit || 'contain')} 
            pos={formData.position} 
            scale={formData.scale}
            bgStyle={formData.bgStyle || 'ambient'}
            label={previewMode.toUpperCase()}
            onZoomIn={() => {
              const currentScale = Number(formData.scale || 1);
              const newScale = Math.round((currentScale + 0.1) * 10) / 10;
              setField('scale', Math.min(10, newScale));
            }}
            onZoomOut={() => {
              const currentScale = Number(formData.scale || 1);
              const newScale = Math.round((currentScale - 0.1) * 10) / 10;
              setField('scale', Math.max(0.1, newScale));
            }}
          />
          
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            <SelectField label="Card Fit" value={formData.cardFit || 'cover'} options={['cover', 'contain']} onChange={v => setField('cardFit', v)} />
            <SelectField label="Detail Fit" value={formData.detailFit || 'contain'} options={['cover', 'contain']} onChange={v => setField('detailFit', v)} />
            <SelectField label="Position" value={formData.position} options={['top', 'center', 'bottom']} onChange={v => setField('position', v)} />
            <SelectField label="AI Gravity" value={formData.gravity} options={['auto', 'faces', 'center']} onChange={v => setField('gravity', v)} />
            <SelectField 
              label="BG Style" 
              value={formData.bgStyle || 'ambient'} 
              options={[
                { value: 'ambient', label: 'Ambient' },
                { value: 'solid', label: 'Flipkart' }
              ]} 
              onChange={v => setField('bgStyle', v)} 
            />
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Scale</label>
              <div className="flex items-center bg-light-bg/50 border border-border-light/20 rounded-2xl p-1 justify-between h-[56px] focus-within:ring-4 focus-within:ring-premium-gold/10 transition-all">
                <button 
                  type="button"
                  onClick={() => {
                    const currentScale = Number(formData.scale || 1);
                    const newScale = Math.round((currentScale - 0.1) * 10) / 10;
                    setField('scale', Math.max(0.1, newScale));
                  }} 
                  className="w-10 h-10 rounded-xl bg-white hover:bg-premium-gold hover:text-charcoal text-charcoal flex items-center justify-center font-black transition-all shadow-sm active:scale-95 border border-border-light/50 shrink-0"
                  title="Zoom Out"
                >
                  −
                </button>
                
                <div className="flex-1 text-center select-none">
                  <span className="font-black text-xs text-charcoal">
                    {(formData.scale || 1).toFixed(1)}x
                  </span>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    const currentScale = Number(formData.scale || 1);
                    const newScale = Math.round((currentScale + 0.1) * 10) / 10;
                    setField('scale', Math.min(10, newScale));
                  }} 
                  className="w-10 h-10 rounded-xl bg-white hover:bg-premium-gold hover:text-charcoal text-charcoal flex items-center justify-center font-black transition-all shadow-sm active:scale-95 border border-border-light/50 shrink-0"
                  title="Zoom In"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="p-10 bg-light-bg/50 rounded-[3rem] border border-border-light space-y-6">
            <h4 className="text-[10px] font-black text-charcoal uppercase tracking-[0.3em] flex items-center gap-2"><ImageIcon size={14} className="text-premium-gold" /> Device Asset</h4>
            <InputField 
              label={`${previewMode.toUpperCase()} Asset URL`} 
              value={formData[getField(previewMode)]} 
              onChange={v => setField(getField(previewMode), v)} 
              placeholder="https://..."
            />
            <div className="relative h-20">
              <input type="file" className="hidden" id="device-asset-upload" onChange={(e) => handleFileUpload(e, getField(previewMode))} />
              <label htmlFor="device-asset-upload" className="w-full h-full border-2 border-dashed border-border-light rounded-[1.5rem] flex items-center justify-center gap-4 cursor-pointer hover:border-premium-gold transition-all group">
                {isUploading ? <Loader2 className="animate-spin text-premium-gold" /> : <Upload className="group-hover:scale-110 transition-transform" />}
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Upload High-Res Asset</span>
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <SectionHeader title="Gallery Stack" subtitle="Additional lifestyle scenes" />
            <div className="grid grid-cols-4 gap-4">
              {formData.images?.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-border-light group">
                  <SafeImage src={img} className="w-full h-full object-cover" />
                  <button onClick={() => setField('images', formData.images.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                </div>
              ))}
              <label className="aspect-square bg-light-bg border-2 border-dashed border-border-light rounded-2xl flex items-center justify-center cursor-pointer hover:border-premium-gold transition-all">
                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'gallery')} />
                <Plus size={20} className="text-text-muted" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
