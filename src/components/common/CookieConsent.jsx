import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck } from 'lucide-react';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md z-[9999]"
        >
          <div className="bg-white border border-neutral-200 shadow-2xl rounded-2xl p-6 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-sm font-bold text-neutral-900 mb-1">Cookie & Privacy Policy</h3>
                <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                  We use cookies to enhance your experience and analyze site traffic. By clicking "Accept", you agree to our use of cookies and data processing.
                </p>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={accept}
                    className="flex-1 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-widest py-3 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    Accept All
                  </button>
                  <a
                    href="/privacy-policy"
                    className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest hover:text-neutral-900 transition-colors"
                  >
                    Learn More
                  </a>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShow(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
