import { useEffect, useRef, useState } from 'react';
import { X, Camera, SwitchCamera, Zap } from 'lucide-react';

const CameraScanner = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // back camera
  const hasScannedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    hasScannedRef.current = false;

    let scanner = null;

    const startScanner = async () => {
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
            // Prevent duplicate scans
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;

            // Vibrate on success
            if (navigator.vibrate) navigator.vibrate(200);

            onScan(decodedText);
            
            // Stop scanner after successful scan
            setTimeout(() => {
              stopScanner();
              onClose();
            }, 300);
          },
          () => {} // ignore scan failures (continuous scanning)
        );

        setError('');
      } catch (err) {
        console.error('Camera scanner error:', err);
        if (err?.toString().includes('NotAllowedError')) {
          setError('Camera permission denied. Please allow camera access.');
        } else if (err?.toString().includes('NotFoundError')) {
          setError('No camera found on this device.');
        } else {
          setError('Camera could not be started. Try again.');
        }
      }
    };

    const stopScanner = async () => {
      try {
        if (html5QrCodeRef.current?.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current?.clear();
      } catch (e) {
        // Ignore cleanup errors
      }
    };

    // Small delay to let DOM render
    const timer = setTimeout(startScanner, 200);

    return () => {
      clearTimeout(timer);
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
    onClose();
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-premium-gold" />
          <span className="text-white text-sm font-bold">Barcode Scanner</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleCamera}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="Switch Camera"
          >
            <SwitchCamera size={18} />
          </button>
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
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
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-premium-gold rounded-tl-lg" 
                 style={{ borderTopWidth: '3px', borderLeftWidth: '3px' }} />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-premium-gold rounded-tr-lg"
                 style={{ borderTopWidth: '3px', borderRightWidth: '3px' }} />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-premium-gold rounded-bl-lg"
                 style={{ borderBottomWidth: '3px', borderLeftWidth: '3px' }} />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-premium-gold rounded-br-lg"
                 style={{ borderBottomWidth: '3px', borderRightWidth: '3px' }} />
            
            {/* Scanning line animation */}
            <div className="absolute left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-premium-gold to-transparent animate-scan" />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="bg-charcoal rounded-2xl p-6 mx-6 text-center max-w-sm">
              <Camera size={40} className="mx-auto mb-3 text-red-400" />
              <p className="text-white text-sm font-bold mb-2">Camera Error</p>
              <p className="text-gray-400 text-xs mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-premium-gold text-black font-bold rounded-xl text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Instruction */}
      <div className="px-4 py-4 bg-black/80 backdrop-blur-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Zap size={14} className="text-premium-gold" />
          <span className="text-white text-xs font-bold">Point camera at barcode</span>
        </div>
        <p className="text-gray-500 text-[10px]">Auto-detects EAN-8, EAN-13, UPC, Code128</p>
      </div>

      {/* Scanning animation CSS */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 10%; opacity: 0.3; }
          50% { top: 85%; opacity: 1; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        #camera-scanner-region video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #camera-scanner-region {
          position: relative;
        }
        /* Hide the default html5-qrcode UI elements */
        #camera-scanner-region > div:not(:first-child) {
          display: none !important;
        }
        #camera-scanner-region img {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default CameraScanner;
