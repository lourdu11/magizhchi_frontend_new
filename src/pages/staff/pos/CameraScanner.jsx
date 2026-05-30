import { useEffect, useRef, useState } from 'react';
import { X, Camera, SwitchCamera, Zap, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const CameraScanner = ({ isOpen, onClose, onScan }) => {
  const html5QrCodeRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const hasScannedRef = useRef(false);

  // ── Check camera & start scanner when opened ──
  useEffect(() => {
    if (!isOpen) {
      setCameraReady(false);
      return;
    }

    hasScannedRef.current = false;
    let scanner = null;
    let cancelled = false;

    const initCamera = async () => {
      // Step 1: Request camera permission first
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        // Permission granted - stop test stream
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        // Permission denied or no camera
        if (!cancelled) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            toast.error(
              '📷 Camera blocked! Tap 🔒 lock icon in address bar → Camera → Allow → Refresh page',
              { duration: 6000, style: { maxWidth: '400px' } }
            );
          } else if (err.name === 'NotFoundError') {
            toast.error('📷 No camera found on this device', { duration: 4000 });
          } else {
            toast.error('📷 Camera error. Check permissions and try again.', { duration: 4000 });
          }
          onClose();
        }
        return;
      }

      if (cancelled) return;
      setCameraReady(true);

      // Step 2: Wait for DOM then start barcode scanner
      await new Promise(r => setTimeout(r, 400));
      if (cancelled) return;

      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        scanner = new Html5Qrcode('camera-scanner-region');
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode },
          {
            fps: 15,
            qrbox: { width: 280, height: 150 },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (decodedText) => {
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;
            if (navigator.vibrate) navigator.vibrate(200);
            onScan(decodedText);
            setTimeout(() => { stopScanner(); onClose(); }, 300);
          },
          () => {}
        );
      } catch (err) {
        if (!cancelled) {
          toast.error('Scanner could not start. Try again.', { duration: 3000 });
          onClose();
        }
      }
    };

    const stopScanner = async () => {
      try {
        if (html5QrCodeRef.current?.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current?.clear();
      } catch (e) {}
    };

    initCamera();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [isOpen, facingMode]);

  const handleClose = async () => {
    try {
      if (html5QrCodeRef.current?.isScanning) {
        await html5QrCodeRef.current.stop();
      }
      html5QrCodeRef.current?.clear();
    } catch (e) {}
    setCameraReady(false);
    onClose();
  };

  const toggleCamera = async () => {
    try {
      if (html5QrCodeRef.current?.isScanning) {
        await html5QrCodeRef.current.stop();
      }
      html5QrCodeRef.current?.clear();
    } catch (e) {}
    setCameraReady(false);
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Don't render anything if not open or camera not ready
  if (!isOpen) return null;

  // Show loading spinner while camera is initializing
  if (!cameraReady) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-charcoal rounded-2xl p-8 text-center">
          <div className="w-10 h-10 border-[3px] border-premium-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white text-sm font-bold">Opening Camera...</p>
          <p className="text-gray-400 text-xs mt-1">Tap "Allow" if prompted</p>
          <button onClick={handleClose} className="mt-4 px-5 py-2 bg-gray-700 text-white rounded-xl text-xs font-bold">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm safe-area-top">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-white text-sm font-bold">📷 Camera Active</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleCamera}
            className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-90"
          >
            <SwitchCamera size={18} />
          </button>
          <button
            onClick={handleClose}
            className="p-2.5 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors active:scale-90"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div id="camera-scanner-region" className="w-full h-full" />
        
        {/* Scanning Guide Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-[280px] h-[150px]">
            <div className="absolute top-0 left-0 w-8 h-8 border-premium-gold rounded-tl-lg" 
                 style={{ borderTopWidth: '3px', borderLeftWidth: '3px' }} />
            <div className="absolute top-0 right-0 w-8 h-8 border-premium-gold rounded-tr-lg"
                 style={{ borderTopWidth: '3px', borderRightWidth: '3px' }} />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-premium-gold rounded-bl-lg"
                 style={{ borderBottomWidth: '3px', borderLeftWidth: '3px' }} />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-premium-gold rounded-br-lg"
                 style={{ borderBottomWidth: '3px', borderRightWidth: '3px' }} />
            <div className="absolute left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-premium-gold to-transparent animate-scan" />
          </div>
        </div>
      </div>

      {/* Bottom Instruction */}
      <div className="px-4 py-4 bg-black/80 backdrop-blur-sm text-center safe-area-bottom">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Zap size={14} className="text-premium-gold" />
          <span className="text-white text-xs font-bold">Point camera at barcode</span>
        </div>
        <p className="text-gray-500 text-[10px]">EAN-8 · EAN-13 · UPC · Code128</p>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 10%; opacity: 0.3; }
          50% { top: 85%; opacity: 1; }
        }
        .animate-scan { animation: scan 2s ease-in-out infinite; }
        #camera-scanner-region video {
          width: 100% !important; height: 100% !important; object-fit: cover !important;
        }
        #camera-scanner-region { position: relative; }
        #camera-scanner-region > div:not(:first-child) { display: none !important; }
        #camera-scanner-region img { display: none !important; }
      `}</style>
    </div>
  );
};

export default CameraScanner;
