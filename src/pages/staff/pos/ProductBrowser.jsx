import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Search, LayoutGrid, ListFilter, X, ChevronRight, Scan, Camera } from 'lucide-react';
import CameraScanner from './CameraScanner';
import { usePOS } from './POSContext';
import SafeImage from '../../../components/common/SafeImage';
import { resolveAssetURL } from '../../../utils/assetResolver';
import { PosProductSkeleton } from '../../../components/common/Skeletons';
import { ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { adminService } from '../../../services';

const ProductBrowser = memo(({ products, categories, isLoading }) => {
  const { state, dispatch } = usePOS();
  const { search, selectedCategory, viewMode } = state;
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const queryClient = useQueryClient();
  const searchRef = useRef(null);

  // Auto-focus search on mount so scanner works immediately
  useEffect(() => {
    const timer = setTimeout(() => {
      searchRef.current?.focus();
      setScannerReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Refocus search whenever overlay closes (product added)
  useEffect(() => {
    if (!selectedProduct) {
      setTimeout(() => {
        searchRef.current?.focus();
      }, 150);
    }
  }, [selectedProduct]);

  // Click anywhere on POS → refocus search (so scanner always captured)
  const handlePageClick = useCallback((e) => {
    const tag = e.target.tagName;
    if (tag !== 'INPUT' && tag !== 'BUTTON' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
      searchRef.current?.focus();
    }
  }, []);

  // ── LIVE STOCK SOCKET LISTENER ──
  useEffect(() => {
    const socket = adminService.getSocket?.();
    if (socket) {
      socket.on('STOCK_UPDATED', () => {
        // Invalidate both POS and Admin queries to ensure parity
        queryClient.invalidateQueries(['pos-products']);
        queryClient.invalidateQueries(['admin-products']);
        queryClient.invalidateQueries(['pos-variants']);
      });
      return () => socket.off('STOCK_UPDATED');
    }
  }, [queryClient]);

  // ── DYNAMIC VARIANT FETCH ──
  const { data: variantData, isLoading: isVariantsLoading } = useQuery({
    queryKey: ['pos-variants', selectedProduct?.productRef?._id || selectedProduct?.productRef || selectedProduct?._id],
    queryFn: async () => {
      const productId = selectedProduct.productRef?._id || selectedProduct.productRef || selectedProduct._id;
      try {
        const res = await api.get(`/products/pos/${productId}/variants`);
        return res.data.data;
      } catch (err) {
        return { variants: selectedProduct.variants || [] };
      }
    },
    enabled: !!selectedProduct,
    staleTime: 0, // Always fetch fresh for POS
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white border-r border-border-light relative" onClick={handlePageClick}>
      {/* Header / Search */}
      <div className="p-4 md:p-8 space-y-8 border-b border-border-light">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Magizhchi POS</h1>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-1">Terminal 01 • Active Session</p>
          </div>
          <div className="flex items-center gap-3">
             {/* Scanner Ready Indicator */}
             <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${
               scannerReady
                 ? 'bg-green-50 border-green-200 text-green-600'
                 : 'bg-gray-50 border-gray-200 text-gray-400'
             }`}>
               <div className={`w-2 h-2 rounded-full ${
                 scannerReady ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
               }`} />
               <Scan size={12} />
               <span>{scannerReady ? 'Scanner Ready' : 'Loading...'}</span>
             </div>
             <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: viewMode === 'grid' ? 'list' : 'grid' })} className="p-4 bg-light-bg rounded-2xl text-charcoal hover:bg-premium-gold/20 transition-all">
                {viewMode === 'grid' ? <LayoutGrid size={20} /> : <ListFilter size={20} />}
             </button>
          </div>
        </div>

        <div className="relative group flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-premium-gold transition-colors" size={20} />
            <input 
              ref={searchRef}
              id="pos-search"
              type="text"
              placeholder="🔫 Scan Barcode or Search Products (F1)..."
              className="w-full bg-light-bg/50 border-none rounded-[2rem] pl-16 pr-8 py-4 sm:py-6 text-sm font-bold focus:ring-4 focus:ring-premium-gold/10 transition-all outline-none"
              value={search}
              onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
              onFocus={() => setScannerReady(true)}
            />
          </div>
          <button
            onClick={() => setShowCameraScanner(true)}
            className="flex items-center gap-2 px-5 py-[18px] bg-charcoal text-white rounded-2xl hover:bg-premium-gold hover:text-black transition-all font-bold text-xs whitespace-nowrap shadow-lg hover:shadow-xl active:scale-95"
            title="Open Camera Scanner"
          >
            <Camera size={18} />
            <span className="hidden sm:inline">📷 Scan</span>
          </button>
        </div>

        {/* Camera Barcode Scanner */}
        <CameraScanner
          isOpen={showCameraScanner}
          onClose={() => setShowCameraScanner(false)}
          onScan={(barcode) => {
            dispatch({ type: 'SET_SEARCH', payload: barcode });
            setShowCameraScanner(false);
          }}
        />

        {/* Categories */}
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => dispatch({ type: 'SET_CATEGORY', payload: 'All' })}
            className={`px-4 md:px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === 'All' ? 'bg-charcoal text-white shadow-xl shadow-charcoal/20' : 'bg-light-bg text-text-muted hover:text-charcoal'}`}
          >
            All Items
          </button>
          {categories?.map(cat => (
            <button 
              key={cat._id}
              onClick={() => dispatch({ type: 'SET_CATEGORY', payload: cat.name })}
              className={`px-4 md:px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat.name ? 'bg-charcoal text-white shadow-xl shadow-charcoal/20' : 'bg-light-bg text-text-muted hover:text-charcoal'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-light-bg/20">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => <PosProductSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {products?.map(p => (
              <ProductCard key={p._id} product={p} onSelect={() => setSelectedProduct(p)} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Floating Cart Button */}
      <div className="md:hidden fixed bottom-20 right-6 z-40">
        <button 
          onClick={() => dispatch({ type: 'TOGGLE_MOBILE_CART' })}
          className="bg-charcoal text-white p-4 rounded-3xl shadow-2xl flex items-center gap-3 border border-white/10 active:scale-95 transition-all"
        >
          <div className="relative">
             <ShoppingBag size={24} className="text-premium-gold" />
             {state.cartSessions[state.activeTab].items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-charcoal text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                   {state.cartSessions[state.activeTab].items.length}
                </span>
             )}
          </div>
          <div className="text-left pr-2">
             <p className="text-[7px] font-black uppercase tracking-widest text-white/40">View Cart</p>
             <p className="text-xs font-black">₹{state.cartSessions[state.activeTab].items.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}</p>
          </div>
        </button>
      </div>

      {/* Variant Selector Overlay */}
      {selectedProduct && (
        <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8">
           <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-4 md:p-8 border-b border-border-light flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-light-bg rounded-2xl overflow-hidden border border-border-light">
                       <SafeImage src={selectedProduct.laptopImage || selectedProduct.mobileImage || selectedProduct.thumbnail || selectedProduct.images?.[0] || selectedProduct.variants?.[0]?.images?.[0] || selectedProduct.variants?.[0]?.laptopImage} className="w-full h-full object-cover" />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-charcoal uppercase leading-none">{selectedProduct.productName || selectedProduct.name}</h2>
                       <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1.5">{selectedProduct.category?.name || selectedProduct.category || 'Collection'}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedProduct(null)} className="p-3 bg-light-bg rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
                    <X size={20} />
                 </button>
              </div>

              <div className="p-4 md:p-8 space-y-6">
                 <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Select Variant</p>
                 <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                    {isVariantsLoading ? (
                      <div className="flex flex-col items-center py-12 gap-4">
                        <ShoppingBag className="text-premium-gold animate-bounce" size={40} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Fetching Live Stock...</p>
                      </div>
                    ) : (
                      variantData?.variants?.map((v, idx) => (
                        <button 
                          key={v._id || idx} 
                          onClick={() => {
                            // Allow variant selection even if stock is 0
                            dispatch({ 
                              type: 'SELECT_PRODUCT', 
                              payload: { ...v, fallbackImage: selectedProduct.laptopImage || selectedProduct.thumbnail || selectedProduct.images?.[0] } 
                            });
                            setSelectedProduct(null);
                          }}
                          className={`flex items-center justify-between p-4 sm:p-6 bg-light-bg/50 rounded-2xl border-2 border-transparent hover:border-premium-gold hover:bg-white transition-all group ${v.availableStock <= 0 ? 'opacity-70' : ''}`}
                        >
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white rounded-xl overflow-hidden flex items-center justify-center text-xs font-black text-charcoal border border-border-light uppercase shrink-0">
                              {(v.laptopImage || v.images?.[0] || selectedProduct.laptopImage || selectedProduct.thumbnail || selectedProduct.images?.[0]) ? (
                                <SafeImage 
                                  src={v.laptopImage || v.images?.[0] || selectedProduct.laptopImage || selectedProduct.thumbnail || selectedProduct.images?.[0]} 
                                  fallbackSrc={selectedProduct.laptopImage || selectedProduct.thumbnail || selectedProduct.images?.[0]}
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                v.size
                              )}
                           </div>
                           <div className="text-left">
                              <p className="text-xs font-black text-charcoal uppercase">{v.color || 'Standard Color'}</p>
                              <p className="text-[10px] font-bold text-text-muted/60 mt-0.5">Size: {v.size} | SKU: {v.sku}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="flex flex-col items-end">
                              <span className="text-sm font-black text-charcoal">₹{v.sellingPrice}</span>
                              <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${v.availableStock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                 {v.availableStock > 0 ? `${v.availableStock} in stock` : 'Out of Stock'}
                              </span>
                           </div>
                           <ChevronRight size={16} className="text-text-muted group-hover:text-premium-gold group-hover:translate-x-1 transition-all" />
                        </div>
                      </button>
                    ))
                   )}
                  </div>
               </div>
           </div>
        </div>
      )}
    </div>
  );
});

const ProductCard = memo(({ product, onSelect }) => {
  return (
    <button 
      onClick={() => {
        const available = product.liveStock?.availableStock ?? product.availableStock;
        if (available <= 0) {
          return toast.error('Product is out of stock');
        }
        if (product.variants?.length > 1 || product.productNature === 'combo') {
          onSelect();
        } else {
          // If it's a single variant, we still need to make sure we have the correct inventory info
          // Fetching variants is safer even for single-variant products to get latest stock
          onSelect();
        }
      }}
      className={`bg-white p-4 rounded-[2rem] border border-border-light hover:border-premium-gold hover:shadow-2xl hover:shadow-premium-gold/10 transition-all text-left flex flex-col group relative overflow-hidden ${(product.liveStock?.availableStock ?? product.availableStock) <= 0 ? 'opacity-60 grayscale' : ''}`}
    >
      <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-light-bg relative">
        <SafeImage 
          src={product.thumbnail || product.images?.[0] || product.laptopImage || product.tabletImage || product.mobileImage || product.variants?.[0]?.images?.[0] || product.variants?.[0]?.laptopImage} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
           {product.variants?.length > 1 && (
             <div className="bg-charcoal text-white text-[7px] font-black uppercase px-2 py-1 rounded-md shadow-lg">
                {product.variants.length} Variants
             </div>
           )}
           <div className={`text-[7px] font-black uppercase px-2 py-1 rounded-md shadow-lg ${(product.liveStock?.availableStock ?? product.availableStock) > 0 ? 'bg-premium-gold text-charcoal' : 'bg-red-500 text-white'}`}>
              {(product.liveStock?.availableStock ?? product.availableStock) > 0 ? `${product.liveStock?.availableStock ?? product.availableStock} Stock` : 'Out of Stock'}
           </div>
        </div>
      </div>
      <div className="px-1">
        <h3 className="text-[11px] font-black text-charcoal uppercase tracking-tight line-clamp-1">{product.productName || product.name}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-black text-charcoal">₹{product.discountedPrice?.toLocaleString() || product.sellingPrice?.toLocaleString()}</span>
          <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter bg-light-bg px-2 py-1 rounded-lg">{product.category?.name || product.category || 'Item'}</span>
        </div>
      </div>
    </button>
  );
});

export default ProductBrowser;
