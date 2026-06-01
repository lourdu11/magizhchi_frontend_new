import React, { useState, useRef, useCallback } from 'react';
import {
  ImageIcon, Loader2, X, Upload, Plus, Move,
  Maximize2, AlignCenter, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, RotateCcw, Check, Eye,
  Link2, Copy, ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ── Position quick-select grid ──────────────────────────────────
const POSITIONS = [
  ['top left', 'top center', 'top right'],
  ['center left', 'center', 'center right'],
  ['bottom left', 'bottom center', 'bottom right'],
];

const POS_MAP = {
  'top left': 'top left', 'top center': 'top', 'top right': 'top right',
  'center left': 'left', 'center': 'center', 'center right': 'right',
  'bottom left': 'bottom left', 'bottom center': 'bottom', 'bottom right': 'bottom right',
};

// ── Shared Subcomponents ───────────────────────────────────────

export function LivePreview({ src, fit, position, scale, label, aspect, bgStyle }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);

  // Reset states when src changes
  React.useEffect(() => {
    if (src) { setLoading(true); setErr(false); }
  }, [src]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border border-border-light shadow-inner transition-all duration-300 ${bgStyle === 'solid' ? 'bg-white' : 'bg-light-bg'} group`}
      style={{ aspectRatio: aspect }}
    >
      {loading && src && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 backdrop-blur-sm">
          <Loader2 className="animate-spin text-premium-gold" size={24} />
        </div>
      )}
      {!src || err ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted">
          <ImageIcon size={36} strokeWidth={1} className="opacity-20 mb-2" />
          <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{err ? 'Load Failed' : `No Image`}</span>
        </div>
      ) : (
        <>
          <img
            src={src}
            alt={label}
            className={`absolute inset-0 w-full h-full transition-all duration-500 z-10 ${loading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
            style={{
              objectFit: fit || 'contain',
              objectPosition: position || 'center',
              transform: `scale(${scale || 1})`,
              transformOrigin: position || 'center',
              padding: (fit || 'contain') === 'contain' ? '12px' : '0'
            }}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setErr(true); }}
            decoding="async"
          />
        </>
      )}
      <div className="absolute top-3 left-3 z-20 bg-charcoal/80 backdrop-blur-md text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        {label} VIEW
      </div>
    </div>
  );
}

export function PositionPicker({ value, onChange }) {
  const current = Object.entries(POS_MAP).find(([, v]) => v === value)?.[0] || 'center';
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Image Position</p>
      <div className="inline-grid grid-cols-3 gap-1.5 p-2 bg-white rounded-2xl border border-border-light shadow-sm">
        {POSITIONS.map((row, ri) =>
          row.map((pos, ci) => (
            <button
              key={pos}
              type="button"
              onClick={() => onChange(POS_MAP[pos])}
              title={pos}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
                ${current === pos
                  ? 'bg-charcoal text-white shadow-md'
                  : 'bg-light-bg text-text-muted hover:bg-premium-gold/10 hover:text-premium-gold border border-border-light/50'
                }`}
            >
              {ri === 0 && ci === 1 && <ChevronUp size={12} />}
              {ri === 2 && ci === 1 && <ChevronDown size={12} />}
              {ri === 1 && ci === 0 && <ChevronLeft size={12} />}
              {ri === 1 && ci === 2 && <ChevronRight size={12} />}
              {ri === 1 && ci === 1 && <AlignCenter size={12} />}
              {(ri === 0 && ci === 0) && <span className="text-[7px] font-black">↖</span>}
              {(ri === 0 && ci === 2) && <span className="text-[7px] font-black">↗</span>}
              {(ri === 2 && ci === 0) && <span className="text-[7px] font-black">↙</span>}
              {(ri === 2 && ci === 2) && <span className="text-[7px] font-black">↘</span>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function FitSelector({ value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Image Fit</p>
      <div className="flex gap-2">
        {[
          { val: 'contain', label: 'Contain', desc: 'Show entire image' },
          { val: 'cover', label: 'Cover', desc: 'Fill without gaps' },
        ].map(opt => (
          <button
            key={opt.val}
            type="button"
            onClick={() => onChange(opt.val)}
            className={`flex-1 p-3 rounded-2xl border text-left transition-all ${value === opt.val ? 'bg-charcoal text-white border-charcoal shadow-lg' : 'bg-white border-border-light hover:border-premium-gold shadow-sm'}`}
          >
            <p className="text-[10px] font-black uppercase tracking-wider">{opt.label}</p>
            <p className={`text-[8px] mt-0.5 ${value === opt.val ? 'text-white/60' : 'text-text-muted'}`}>{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ScaleControl({ value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Scale / Zoom</p>
        <span className="text-[9px] font-black text-charcoal bg-white px-2 py-0.5 rounded-lg border border-border-light">{Number(value || 1).toFixed(1)}×</span>
      </div>
      <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-border-light shadow-sm">
        <button
          type="button"
          onClick={() => onChange(Math.max(0.5, Math.round((Number(value || 1) - 0.1) * 10) / 10))}
          className="w-8 h-8 rounded-xl bg-light-bg text-charcoal font-black flex items-center justify-center hover:bg-premium-gold hover:text-charcoal transition-all"
        >−</button>
        <div className="flex-1 h-1.5 bg-light-bg rounded-full relative overflow-hidden">
          <div
            className="h-full bg-charcoal rounded-full transition-all"
            style={{ width: `${((Number(value || 1) - 0.5) / 1.5) * 100}%` }}
          />
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(2, Math.round((Number(value || 1) + 0.1) * 10) / 10))}
          className="w-8 h-8 rounded-xl bg-light-bg text-charcoal font-black flex items-center justify-center hover:bg-premium-gold hover:text-charcoal transition-all"
        >+</button>
      </div>
    </div>
  );
}

export function DropZone({ onFile, loading, hasImage, label }) {
  const [dragOver, setDragOver] = useState(false);
  const ref = useRef();

  const handle = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return toast.error('Please drop an image file');
    onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); handle(e.dataTransfer.files[0]); }}
      onClick={() => ref.current?.click()}
      className={`relative h-full min-h-[140px] border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all p-4
        ${dragOver ? 'border-premium-gold bg-premium-gold/5 scale-[1.02]' : hasImage ? 'border-emerald-400 bg-emerald-50/30' : 'border-border-light bg-light-bg hover:border-premium-gold hover:bg-premium-gold/5 shadow-sm'}`}
    >
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => handle(e.target.files[0])} />
      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-premium-gold" size={28} />
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Processing...</p>
        </div>
      ) : hasImage ? (
        <div className="flex flex-col items-center gap-2 text-emerald-600">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <Check size={20} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest mt-1">Uploaded! Click to replace</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-text-muted">
          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center border border-border-light/50 mb-1 group-hover:scale-110 transition-transform">
            <Upload size={20} className="text-charcoal" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-charcoal">Drop image or click</p>
          <p className="text-[8px] font-bold opacity-60 text-center">{label}</p>
        </div>
      )}
    </div>
  );
}

// ── AdminVisualManager ─────────────────────────────────────────

export default function AdminVisualManager({
  imageUrl,
  fit = 'contain',
  position = 'center',
  scale = 1,
  bgStyle = 'ambient',
  gravity = 'auto',
  aspectRatio = '16 / 9',
  label = 'Desktop',
  recommendedText = 'Recommended: 1200×1200px or larger · JPG, PNG, WebP',
  isUploading = false,
  onUpdate, // function(updates)
  onFileSelect, // function(file) -> parent handles upload and then calls onUpdate({ image: url })
  showDisplayControls = true,
}) {
  const [uploadTab, setUploadTab] = useState('file');
  const [urlInput, setUrlInput] = useState('');

  const handleUrlApply = () => {
    if (!urlInput.trim()) return toast.error('Please enter a URL');
    onUpdate({ imageUrl: urlInput.trim() });
    setUrlInput('');
    toast.success('URL applied!');
  };

  return (
    <div className="bg-light-bg/40 p-5 rounded-[2.5rem] border border-border-light/50 space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-charcoal uppercase tracking-widest">{label} View ({aspectRatio.replace(/\s/g, '')})</span>
        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-border-light shadow-sm">
           <ImageIcon size={12} className="text-premium-gold" />
           <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">Visual Identity</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Preview */}
        <div className="relative group">
          <LivePreview 
            src={imageUrl} 
            aspect={aspectRatio} 
            fit={fit} 
            position={position} 
            scale={scale}
            label={label}
            bgStyle={bgStyle}
          />
        </div>

        {/* Right: Controls & Upload */}
        <div className="space-y-5">
          {/* Upload Mode Switcher */}
          <div className="flex gap-1 p-1 bg-white rounded-2xl border border-border-light shadow-sm">
            {[
              { id: 'file', label: '📁 Upload' },
              { id: 'url', label: '🔗 URL' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setUploadTab(tab.id)}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${uploadTab === tab.id ? 'bg-charcoal text-white shadow-md' : 'text-text-muted hover:text-charcoal hover:bg-light-bg'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* File Upload Zone */}
          {uploadTab === 'file' && (
            <DropZone
              onFile={onFileSelect}
              loading={isUploading}
              hasImage={!!imageUrl}
              label={recommendedText}
            />
          )}

          {/* URL Input */}
          {uploadTab === 'url' && (
            <div className="space-y-3 bg-white p-4 rounded-3xl border border-border-light shadow-sm">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="Paste Cloudinary / image URL..."
                  className="flex-1 bg-light-bg border border-border-light rounded-xl px-4 py-3 text-[10px] font-bold focus:outline-none focus:border-premium-gold transition-all"
                />
                <button
                  type="button"
                  onClick={handleUrlApply}
                  className="px-5 py-3 bg-charcoal text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all whitespace-nowrap shadow-md"
                >
                  Apply
                </button>
              </div>
              <p className="text-[8px] text-text-muted font-bold pl-1 uppercase tracking-widest">Paste any public image URL</p>
            </div>
          )}

          {/* Uploaded URL Display */}
          {imageUrl && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2">
              <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                <Check size={10} /> Active Asset URL
              </p>
              <div className="flex gap-2 items-center bg-white p-2 rounded-xl border border-emerald-100">
                <p className="text-[9px] text-emerald-700 font-mono truncate flex-1">{imageUrl}</p>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(imageUrl); toast.success('URL copied!'); }}
                  className="shrink-0 p-1.5 bg-light-bg rounded-lg hover:bg-emerald-100 transition-all text-emerald-600"
                  title="Copy URL"
                >
                  <Copy size={12} />
                </button>
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1.5 bg-light-bg rounded-lg hover:bg-emerald-100 transition-all text-emerald-600"
                  title="Open in browser"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Display Controls */}
      {showDisplayControls && imageUrl && (
        <div className="pt-6 border-t border-border-light/50 grid md:grid-cols-2 gap-6">
           <div className="space-y-4">
              <FitSelector value={fit} onChange={v => onUpdate({ fit: v })} />
              <ScaleControl value={scale} onChange={v => onUpdate({ scale: v })} />
           </div>
           <div className="space-y-4">
              <PositionPicker value={position} onChange={v => onUpdate({ position: v })} />
              
              <div className="space-y-2">
                 <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Gravity / AI Focus</p>
                 <select 
                    className="w-full bg-white border border-border-light rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-premium-gold shadow-sm cursor-pointer" 
                    value={gravity} 
                    onChange={e => onUpdate({ gravity: e.target.value })}
                 >
                    <option value="auto">AI AUTO</option>
                    <option value="faces">FACES</option>
                    <option value="center">CENTER</option>
                    <option value="north">TOP</option>
                    <option value="south">BOTTOM</option>
                 </select>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
