import { useEffect, useRef, useState } from 'react';
import { X, Camera, SwitchCamera, Zap, RefreshCw } from 'lucide-react';

const CameraScanner = ({ isOpen, onClose, onScan }) => {
  const html5QrCodeRef = useRef(null);
  const [error, setError] = useState('');
  const [permissionState, setPermissionState] = useState('checking'); // checking, granted, denied, prompt
  const [facingMode, setFacingMode] = useState('environment');
  const hasScannedRef = useRef(false);

  // ── Step 1: Explicitly request camera permission via getUserMedia ──
  const requestCameraPermission = async () => {
    setError('');
    setPermissionState('checking');
    
    try {
      // This forces the browser to show the "Allow Camera?" popup
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Permission granted! Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop());
      setPermissionState('granted');
      return true;
    } catch (err) {
      console.error('Camera permission error:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setError('denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionState('denied');
        setError('notfound');
      } else if (err.name === 'NotReadableError') {
        setPermissionState('denied');
        setError('inuse');
      } else {
        setPermissionState('denied');
        setError('unknown');
      }
      return false;
    }
  };

  // ── Step 2: Start barcode scanner after permission is granted ──
  useEffect(() => {
    if (!isOpen || permissionState !== 'granted') return;
    hasScannedRef.current = false;

    let scanner = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        
        // Clean up any previous instance
        if (html5QrCodeRef.current?.isScanning) {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        }

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
            
            setTimeout(() => {
              stopScanner();
              onClose();
            }, 300);
          },
          () => {}
        );
      } catch (err) {
        console.error('Scanner start error:', err);
        setError('scanner_fail');
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

    const timer = setTimeout(startScanner, 300);
    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, permissionState, facingMode]);

  // ── Auto-request permission when modal opens ──
  useEffect(() => {
    if (isOpen) {
      requestCameraPermission();
    } else {
      setPermissionState('checking');
      setError('');
    }
  }, [isOpen]);

  const handleClose = async () => {
    try {
      if (html5QrCodeRef.current?.isScanning) {
        await html5QrCodeRef.current.stop();
      }
      html5QrCodeRef.current?.clear();
    } catch (e) {}
    onClose();
  };

  const toggleCamera = async () => {
    try {
      if (html5QrCodeRef.current?.isScanning) {
        await html5QrCodeRef.current.stop();
      }
      html5QrCodeRef.current?.clear();
    } catch (e) {}
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleRetry = () => {
    requestCameraPermission();
  };

  if (!isOpen) return null;

  // ── Error messages ──
  const errorMessages = {
    denied: {
      title: 'Camera Permission Blocked',
      desc: 'Your browser blocked camera access. Follow these steps:',
      steps: [
        '1. Tap the 🔒 lock icon in the address bar',
        '2. Find "Camera" → Change to "Allow"',
        '3. Refresh the page and try again',
      ],
      altDesc: 'Or go to Chrome Settings → Site Settings → Camera → Allow for this site',
    },
    notfound: {
      title: 'No Camera Found',
      desc: 'This device does not have a camera.',
      steps: [],
      altDesc: 'Try using a device with a camera (phone/tablet)',
    },
    inuse: {
      title: 'Camera In Use',
      desc: 'Another app is using the camera. Close it and try again.',
      steps: [],
      altDesc: '',
    },
    scanner_fail: {
      title: 'Scanner Error',
      desc: 'Could not start barcode scanner.',
      steps: [],
      altDesc: 'Try refreshing the page',
    },
    unknown: {
      title: 'Camera Error',
      desc: 'Something went wrong. Please try again.',
      steps: [],
      altDesc: '',
    },
  };

  const errInfo = error ? errorMessages[error] : null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-premium-gold" />
          <span className="text-white text-sm font-bold">Barcode Scanner</span>
        </div>
        <div className="flex items-center gap-3">
          {permissionState === 'granted' && (
            <button
              onClick={toggleCamera}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Switch Camera"
            >
              <SwitchCamera size={18} />
            </button>
          )}
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
        {permissionState === 'granted' && (
          <>
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
          </>
        )}

        {/* Loading State */}
        {permissionState === 'checking' && !error && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-3 border-premium-gold border-t-transparent rounded-full animate-spin" 
                 style={{ borderWidth: '3px' }} />
            <p className="text-white text-sm font-bold">Requesting Camera Access...</p>
            <p className="text-gray-400 text-xs">Please tap "Allow" when prompted</p>
          </div>
        )}

        {/* Error / Permission Denied Display */}
        {errInfo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90">
            <div className="bg-charcoal rounded-2xl p-6 mx-4 text-center max-w-sm">
              <Camera size={40} className="mx-auto mb-3 text-red-400" />
              <p className="text-white text-base font-bold mb-2">{errInfo.title}</p>
              <p className="text-gray-400 text-xs mb-3">{errInfo.desc}</p>
              
              {errInfo.steps.length > 0 && (
                <div className="bg-black/40 rounded-xl p-4 mb-3 text-left">
                  {errInfo.steps.map((step, i) => (
                    <p key={i} className="text-yellow-300 text-xs font-bold mb-1">{step}</p>
                  ))}
                </div>
              )}

              {errInfo.altDesc && (
                <p className="text-gray-500 text-[10px] mb-4 italic">{errInfo.altDesc}</p>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-5 py-2.5 bg-premium-gold text-black font-bold rounded-xl text-sm"
                >
                  <RefreshCw size={14} />
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 bg-gray-700 text-white font-bold rounded-xl text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Instruction */}
      {permissionState === 'granted' && (
        <div className="px-4 py-4 bg-black/80 backdrop-blur-sm text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Zap size={14} className="text-premium-gold" />
            <span className="text-white text-xs font-bold">Point camera at barcode</span>
          </div>
          <p className="text-gray-500 text-[10px]">Auto-detects EAN-8, EAN-13, UPC, Code128</p>
        </div>
      )}

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
