// ─── Storage Polyfill for restricted environments (Safari Private Mode / In-App WebViews) ───
(function() {
  if (typeof window === 'undefined') return;

  const makeMemoryStorage = () => {
    const store = {};
    return {
      getItem: (key) => (key in store ? store[key] : null),
      setItem: (key, value) => { store[key] = String(value); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(key => delete store[key]); },
      key: (index) => Object.keys(store)[index] || null,
      get length() { return Object.keys(store).length; }
    };
  };

  const checkStorage = (type) => {
    try {
      const storage = window[type];
      if (!storage) return false;
      const testKey = `__test_${type}__`;
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  };

  const patchStorage = (type) => {
    if (checkStorage(type)) {
      // Native storage works, but we should wrap its methods to prevent QuotaExceededError/SecurityError at runtime
      try {
        const nativeStorage = window[type];
        const originalSetItem = nativeStorage.setItem.bind(nativeStorage);
        const originalGetItem = nativeStorage.getItem.bind(nativeStorage);
        const originalRemoveItem = nativeStorage.removeItem.bind(nativeStorage);
        const originalClear = nativeStorage.clear.bind(nativeStorage);

        const memoryBackup = makeMemoryStorage();

        nativeStorage.setItem = function(key, value) {
          try {
            originalSetItem(key, value);
          } catch (e) {
            console.warn(`[SafeStorage] Failed to write to native ${type}, falling back to memory:`, e);
            memoryBackup.setItem(key, value);
          }
        };

        nativeStorage.getItem = function(key) {
          try {
            const val = originalGetItem(key);
            if (val !== null) return val;
          } catch (e) {
            // ignore
          }
          return memoryBackup.getItem(key);
        };

        nativeStorage.removeItem = function(key) {
          try {
            originalRemoveItem(key);
          } catch (e) {
            // ignore
          }
          memoryBackup.removeItem(key);
        };

        nativeStorage.clear = function() {
          try {
            originalClear();
          } catch (e) {
            // ignore
          }
          memoryBackup.clear();
        };
      } catch (err) {
        console.warn(`[SafeStorage] Could not wrap native ${type} methods:`, err);
      }
    } else {
      // Native storage is blocked or broken, redefine window[type] with memory storage
      console.warn(`[SafeStorage] Native ${type} is blocked or throws errors. Overriding with memory fallback.`);
      const memStorage = makeMemoryStorage();
      try {
        Object.defineProperty(window, type, {
          value: memStorage,
          writable: true,
          configurable: true,
          enumerable: true
        });
      } catch (e) {
        // Fallback if property is not configurable: write directly to window (might fail in strict mode if read-only)
        try {
          window[type] = memStorage;
        } catch (err2) {
          console.error(`[SafeStorage] Failed to override window.${type}:`, err2);
        }
      }
    }
  };

  patchStorage('localStorage');
  patchStorage('sessionStorage');
})();
