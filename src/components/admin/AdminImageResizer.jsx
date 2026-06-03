import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, Monitor, Smartphone, Upload, RefreshCw } from 'lucide-react';
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

  if (!ctx) {
    return null;
  }

  // Set to desired dimensions
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Draw the cropped image perfectly scaled into the target dimensions
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
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.9);
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
    }, 'image/jpeg', 0.9);
  });
};

export default function AdminImageResizer({ isOpen, onClose, file, onSave }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [activeTab, setActiveTab] = useState('desktop'); // 'desktop' or 'mobile'
  const [isProcessing, setIsProcessing] = useState(false);
  const [resizeMode, setResizeMode] = useState('crop'); // 'crop' or 'stretch'

  // Desktop Dimensions
  const [desktopWidth, setDesktopWidth] = useState(1920);
  const [desktopHeight, setDesktopHeight] = useState(800);
  const [desktopCrop, setDesktopCrop] = useState({ x: 0, y: 0 });
  const [desktopZoom, setDesktopZoom] = useState(1);
  const [desktopCroppedAreaPixels, setDesktopCroppedAreaPixels] = useState(null);

  // Mobile Dimensions
  const [mobileWidth, setMobileWidth] = useState(480);
  const [mobileHeight, setMobileHeight] = useState(600);
  const [mobileCrop, setMobileCrop] = useState({ x: 0, y: 0 });
  const [mobileZoom, setMobileZoom] = useState(1);
  const [mobileCroppedAreaPixels, setMobileCroppedAreaPixels] = useState(null);

  // Load image when file prop changes
  React.useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result);
      reader.readAsDataURL(file);
    }
  }, [file]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    if (activeTab === 'desktop') {
      setDesktopCroppedAreaPixels(croppedAreaPixels);
    } else {
      setMobileCroppedAreaPixels(croppedAreaPixels);
    }
  }, [activeTab]);

  const handleGenerate = async () => {
    if (resizeMode === 'crop' && (!desktopCroppedAreaPixels || !mobileCroppedAreaPixels)) {
      alert("Please ensure both desktop and mobile crops are selected.");
      return;
    }
    if (!imageSrc) return;
    
    setIsProcessing(true);
    try {
      let desktopBlob, mobileBlob;
      if (resizeMode === 'stretch') {
        desktopBlob = await getStretchedImg(imageSrc, desktopWidth, desktopHeight);
        mobileBlob = await getStretchedImg(imageSrc, mobileWidth, mobileHeight);
      } else {
        desktopBlob = await getCroppedImg(imageSrc, desktopCroppedAreaPixels, desktopWidth, desktopHeight);
        mobileBlob = await getCroppedImg(imageSrc, mobileCroppedAreaPixels, mobileWidth, mobileHeight);
      }

      // 2. Compress the blobs
      const compressionOptions = {
        maxSizeMB: 1,
        useWebWorker: false, // Disabled to prevent CSP blob worker crash
        fileType: 'image/webp'
      };
      
      const compressedDesktop = await imageCompression(new File([desktopBlob], 'desktop_banner.webp', { type: 'image/webp' }), compressionOptions);
      const compressedMobile = await imageCompression(new File([mobileBlob], 'mobile_banner.webp', { type: 'image/webp' }), compressionOptions);

      onSave({
        desktopFile: compressedDesktop,
        mobileFile: compressedMobile
      });
      onClose();
    } catch (error) {
      console.error('Error generating images:', error);
      alert('Failed to generate images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const currentCrop = activeTab === 'desktop' ? desktopCrop : mobileCrop;
  const currentZoom = activeTab === 'desktop' ? desktopZoom : mobileZoom;
  const setCrop = activeTab === 'desktop' ? setDesktopCrop : setMobileCrop;
  const setZoom = activeTab === 'desktop' ? setDesktopZoom : setMobileZoom;
  const currentAspect = activeTab === 'desktop' ? desktopWidth / desktopHeight : mobileWidth / mobileHeight;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-charcoal rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-black/20">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Upload size={20} className="text-premium-gold" />
              Smart Image Resizer
            </h2>
            <p className="text-sm text-gray-400 mt-1">Select exactly what part of the image should show on each device.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-[500px]">
          
          {/* Left Panel: Controls */}
          <div className="w-full md:w-80 bg-black/40 p-4 sm:p-6 flex flex-col gap-6 border-r border-white/10 overflow-y-auto">
            
            {/* Mode Selection */}
            <div className="space-y-2">
              <h3 className="text-white font-medium text-sm">Resize Mode</h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setResizeMode('crop')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all ${resizeMode === 'crop' ? 'bg-premium-gold text-black' : 'bg-black/40 text-gray-400 hover:text-white'}`}
                >
                  Smart Crop (Preserve)
                </button>
                <button 
                  onClick={() => setResizeMode('stretch')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all ${resizeMode === 'stretch' ? 'bg-premium-gold text-black' : 'bg-black/40 text-gray-400 hover:text-white'}`}
                >
                  Force Fit (Stretch)
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
              <button 
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'desktop' ? 'bg-premium-gold text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                <Monitor size={16} /> Desktop
              </button>
              <button 
                onClick={() => setActiveTab('mobile')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'mobile' ? 'bg-premium-gold text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                <Smartphone size={16} /> Mobile
              </button>
            </div>

            {/* Dimension Settings */}
            <div className="space-y-4">
              <h3 className="text-white font-medium mb-2 border-b border-white/10 pb-2">Target Dimensions</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Width (px)</label>
                  <input 
                    type="number" 
                    value={activeTab === 'desktop' ? desktopWidth : mobileWidth}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      if (activeTab === 'desktop') setDesktopWidth(val);
                      else setMobileWidth(val);
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-premium-gold"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Height (px)</label>
                  <input 
                    type="number" 
                    value={activeTab === 'desktop' ? desktopHeight : mobileHeight}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      if (activeTab === 'desktop') setDesktopHeight(val);
                      else setMobileHeight(val);
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-premium-gold"
                  />
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-white/10">
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-xs text-blue-200 leading-relaxed">
                Drag the image to adjust the crop. The highlighted area is exactly what your customers will see on {activeTab === 'desktop' ? 'Laptops' : 'Phones'}.
              </div>
            </div>
          </div>

          {/* Right Panel: Cropper */}
          <div className="flex-1 relative bg-black/90 min-h-[300px] flex items-center justify-center p-4 md:p-8">
            {imageSrc ? (
              resizeMode === 'stretch' ? (
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
                  crop={currentCrop}
                  zoom={currentZoom}
                  aspect={currentAspect}
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
            onClick={onClose}
            className="px-4 sm:px-6 py-2.5 rounded-xl font-medium text-white hover:bg-white/10 transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          
          {activeTab === 'desktop' ? (
            <button 
              onClick={() => setActiveTab('mobile')}
              className="px-4 sm:px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              Next: Mobile View <Smartphone size={18} />
            </button>
          ) : (
            <button 
              onClick={handleGenerate}
              disabled={isProcessing}
              className="px-4 md:px-8 py-2.5 bg-premium-gold text-black font-bold rounded-xl hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <><RefreshCw size={18} className="animate-spin" /> Processing...</>
              ) : (
                <><Check size={18} /> Save perfectly sized images</>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
