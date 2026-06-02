import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, Upload, RefreshCw, Maximize, Crop } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const getCroppedImg = async (imageSrc, pixelCrop, targetWidth, targetHeight) => {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Canvas is empty'));
      else resolve(blob);
    }, 'image/jpeg', 0.95);
  });
};

const getStretchedImg = async (imageSrc, targetWidth, targetHeight) => {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  canvas.width = targetWidth;
  canvas.height = targetHeight;
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Canvas empty'));
      else resolve(blob);
    }, 'image/jpeg', 0.95);
  });
};

export default function AdminSingleImageResizer({ 
  isOpen, 
  onClose, 
  file, 
  onSave, 
  targetWidth: initialWidth = 2000, 
  targetHeight: initialHeight = 2500,
  defaultMode = 'crop',
  title = "Smart Image Resizer"
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resizeMode, setResizeMode] = useState(defaultMode);

  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [cropAspect, setCropAspect] = useState(initialWidth / initialHeight);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Read file into data URL
  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result);
      reader.readAsDataURL(file);
    }
  }, [file]);

  // Reset state when modal is opened with a new file or configuration
  useEffect(() => {
    if (isOpen && file) {
      setResizeMode(defaultMode);
      setWidth(initialWidth);
      setHeight(initialHeight);
      setCropAspect(initialWidth / initialHeight);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [isOpen, file, initialWidth, initialHeight, defaultMode]);

  const onCropComplete = useCallback((croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleGenerate = async () => {
    if (resizeMode === 'crop' && !croppedAreaPixels) {
      alert("Please ensure the crop area is selected.");
      return;
    }
    if (!imageSrc) return;
    
    setIsProcessing(true);
    try {
      let finalBlob;
      if (resizeMode === 'original') {
        finalBlob = file;
      } else if (resizeMode === 'stretch') {
        finalBlob = await getStretchedImg(imageSrc, width, height);
      } else {
        // For freeform crop (cropAspect === null), use exact cropped area size to prevent stretching
        const cropWidth = cropAspect === null ? croppedAreaPixels.width : width;
        const cropHeight = cropAspect === null ? croppedAreaPixels.height : height;
        finalBlob = await getCroppedImg(imageSrc, croppedAreaPixels, cropWidth, cropHeight);
      }

      // Compress — keep ultra-high quality for Flipkart-style crisp zoom
      const compressionOptions = {
        maxSizeMB: 15,          // Allow up to 15MB to preserve massive resolution
        maxWidthOrHeight: 6000, // Allow up to 6000px resolution
        useWebWorker: false,    
        fileType: 'image/webp',
        initialQuality: 1,      // 100% Quality WebP
      };
      
      const compressedBlob = await imageCompression(new File([finalBlob], 'image.webp', { type: 'image/webp' }), compressionOptions);

      onSave(compressedBlob);
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const currentAspect = cropAspect || (width / height);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-charcoal rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/20">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Upload size={20} className="text-premium-gold" />
              {title}
            </h2>
            <p className="text-sm text-gray-400 mt-1">Perfectly resize your image for the website.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-[500px]">
          
          {/* Left Panel: Controls */}
          <div className="w-full md:w-80 bg-black/40 p-6 flex flex-col gap-6 border-r border-white/10 overflow-y-auto">
            
            {/* Mode Selection */}
            <div className="space-y-2">
              <h3 className="text-white font-medium text-sm">Resize Mode</h3>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  type="button"
                  onClick={() => setResizeMode('crop')}
                  className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-1 border ${resizeMode === 'crop' ? 'bg-premium-gold border-premium-gold text-black shadow-lg' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Crop size={16} />
                  <span>Smart Crop</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setResizeMode('stretch')}
                  className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-1 border ${resizeMode === 'stretch' ? 'bg-premium-gold border-premium-gold text-black shadow-lg' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Maximize size={16} />
                  <span>Force Fit</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setResizeMode('original')}
                  className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-1 border ${resizeMode === 'original' ? 'bg-premium-gold border-premium-gold text-black shadow-lg' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Upload size={16} />
                  <span>Use Original</span>
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                {resizeMode === 'crop' 
                  ? "Select a portion of the image. Keeps aspect ratio sharp without stretching." 
                  : resizeMode === 'stretch'
                  ? "Stretches the image to fill the box without cutting anything, but might distort shapes."
                  : "Uploads your original photo exactly as it is (no cropping or stretching), only compressed for fast loading."}
              </p>
            </div>

            {/* Aspect Ratio Options (Only show in crop mode) */}
            {resizeMode === 'crop' && (
              <div className="space-y-2 pt-4 border-t border-white/10">
                <h3 className="text-white font-medium text-sm">Crop Aspect Ratio</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setCropAspect(initialWidth / initialHeight);
                      setWidth(initialWidth);
                      setHeight(initialHeight);
                    }}
                    className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all border ${cropAspect === (initialWidth / initialHeight) ? 'bg-premium-gold border-premium-gold text-black shadow-lg' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    Default ({initialWidth}:{initialHeight})
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setCropAspect(1);
                      setWidth(2000);
                      setHeight(2000);
                    }}
                    className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all border ${cropAspect === 1 ? 'bg-premium-gold border-premium-gold text-black shadow-lg' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    Square (1:1)
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setCropAspect(4/5);
                      setWidth(2000);
                      setHeight(2500);
                    }}
                    className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all border ${cropAspect === 4/5 ? 'bg-premium-gold border-premium-gold text-black shadow-lg' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    Portrait (4:5)
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setCropAspect(16/9);
                      setWidth(2560);
                      setHeight(1440);
                    }}
                    className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all border ${cropAspect === 16/9 ? 'bg-premium-gold border-premium-gold text-black shadow-lg' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    Landscape (16:9)
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setCropAspect(null);
                    }}
                    className={`col-span-2 py-2 px-1 rounded-lg text-[10px] font-bold transition-all border ${cropAspect === null ? 'bg-premium-gold border-premium-gold text-black shadow-lg' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    Freeform / Custom Crop
                  </button>
                </div>
              </div>
            )}

            {/* Dimension Settings */}
            {resizeMode !== 'original' && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-white font-medium mb-2 pb-2">Target Dimensions</h3>
                
                {cropAspect === null ? (
                  <div className="bg-black/20 p-4 rounded-xl space-y-2 border border-white/5">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Freeform Resolution</p>
                    <p className="text-sm font-black text-premium-gold font-mono">
                      {croppedAreaPixels ? `${croppedAreaPixels.width} × ${croppedAreaPixels.height} px` : 'Calculating...'}
                    </p>
                    <p className="text-[9px] text-gray-500 leading-relaxed">
                      Saves the cropped area at its exact original pixel resolution with zero stretching.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Width (px)</label>
                      <input 
                        type="number" 
                        value={width}
                        onChange={(e) => {
                          const newW = parseInt(e.target.value) || 1;
                          setWidth(newW);
                          if (cropAspect) {
                            setHeight(Math.round(newW / cropAspect));
                          }
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-premium-gold"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Height (px)</label>
                      <input 
                        type="number" 
                        value={height}
                        onChange={(e) => {
                          const newH = parseInt(e.target.value) || 1;
                          setHeight(newH);
                          if (cropAspect) {
                            setWidth(Math.round(newH * cropAspect));
                          }
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-premium-gold"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-white/10">
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-xs text-blue-200 leading-relaxed">
                {resizeMode === 'crop' 
                  ? "Drag the image to adjust the crop. The highlighted area is exactly what will be shown." 
                  : resizeMode === 'stretch'
                  ? "The image will be forcefully stretched to perfectly fill the required dimensions."
                  : "The image will be uploaded with its original dimensions and ratio, optimized for size."}
              </div>
            </div>
          </div>

          {/* Right Panel: Cropper / Preview */}
          <div className="flex-1 relative bg-black/90 min-h-[300px] flex items-center justify-center p-8">
            {imageSrc ? (
              resizeMode === 'original' ? (
                <div className="relative max-w-full max-h-full flex items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10">
                  <img 
                    src={imageSrc} 
                    alt="Original Preview" 
                    className="max-h-[60vh] max-w-full object-contain rounded-lg"
                  />
                  <div className="absolute bottom-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-widest pointer-events-none">
                    Original File Mode (No Crop)
                  </div>
                </div>
              ) : resizeMode === 'stretch' ? (
                <div 
                  className="relative overflow-hidden bg-white/5 border-2 border-premium-gold/50 border-dashed"
                  style={{ 
                    aspectRatio: currentAspect, 
                    width: '100%', 
                    maxHeight: '100%',
                    maxWidth: currentAspect > 1 ? '100%' : `calc(100vh * ${currentAspect})`
                  }}
                >
                  <img 
                    src={imageSrc} 
                    alt="Preview" 
                    className="absolute inset-0 w-full h-full"
                    style={{ objectFit: 'fill' }} 
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white font-bold text-lg bg-black/50 px-4 py-2 rounded-xl">Stretched Preview</span>
                  </div>
                </div>
              ) : (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={cropAspect || undefined}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  objectFit="contain"
                />
              )
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin text-premium-gold"><RefreshCw size={24} /></div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-medium text-white hover:bg-white/10 transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          
          <button 
            type="button"
            onClick={handleGenerate}
            disabled={isProcessing}
            className="px-8 py-2.5 bg-premium-gold text-black font-bold rounded-xl hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <><RefreshCw size={18} className="animate-spin" /> Processing...</>
            ) : (
              <><Check size={18} /> Save perfectly sized image</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
