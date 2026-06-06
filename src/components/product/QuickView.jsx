import { useEffect, useState } from 'react';
import { useUIStore, useCartStore } from '../../store';
import { X, ShoppingBag, Loader2 } from 'lucide-react';
import { cartService } from '../../services';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import SafeImage from '../common/SafeImage';

export default function QuickView() {
  const { quickViewProduct, setQuickViewProduct } = useUIStore();
  const { setCartOpen } = useCartStore();
  const [selectedSize, setSelectedSize] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (quickViewProduct) {
      document.body.style.overflow = 'hidden';
      // Auto-select first available size
      const availableSize = quickViewProduct.variants?.find(v => v.stock > 0 || v.available > 0 || v.qty > 0)?.size;
      if (availableSize) setSelectedSize(availableSize);
    } else {
      document.body.style.overflow = 'auto';
      setSelectedSize(null);
    }
  }, [quickViewProduct]);

  if (!quickViewProduct) return null;

  const handleClose = () => setQuickViewProduct(null);

  const price = quickViewProduct.discountedPrice > 0 ? quickViewProduct.discountedPrice : quickViewProduct.sellingPrice;

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    setIsAdding(true);
    try {
      await cartService.addToCart(quickViewProduct._id, 1, selectedSize);
      toast.success('Added to Cart');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      handleClose();
      setCartOpen(true);
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={handleClose} />
      
      <div className="relative w-full max-w-4xl bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-fade-scale-in max-h-[90dvh]">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white text-charcoal shadow-lg transition-colors"
        >
          <X size={20} />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-light-bg aspect-[4/5] md:aspect-auto">
          <SafeImage 
            src={quickViewProduct.images?.[0] || quickViewProduct.thumbnail || quickViewProduct.image} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content Section */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-premium-gold font-black uppercase tracking-widest text-[10px]">Quick View</span>
          </div>
          
          <h2 className="text-2xl md:text-4xl font-black text-charcoal mb-2 leading-tight">
            {quickViewProduct.name}
          </h2>
          
          <p className="text-xl md:text-2xl font-black text-charcoal mb-6">
            ₹{(price || 0).toLocaleString('en-IN')}
          </p>

          {quickViewProduct.variants && quickViewProduct.variants.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-bold text-text-muted mb-3 uppercase tracking-widest">Select Size</p>
              <div className="flex flex-wrap gap-2">
                {quickViewProduct.variants.map((v, i) => {
                  const stock = v.stock ?? v.available ?? v.qty ?? 0;
                  const isAvailable = stock > 0;
                  return (
                    <button
                      key={i}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSize(v.size)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all border-2 ${
                        !isAvailable 
                          ? 'opacity-30 border-gray-100 cursor-not-allowed text-gray-400' 
                          : selectedSize === v.size 
                            ? 'border-premium-gold bg-premium-gold text-charcoal' 
                            : 'border-border-light text-charcoal hover:border-premium-gold/50'
                      }`}
                    >
                      {v.size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3 mt-auto">
            <button 
              onClick={handleAddToCart}
              disabled={isAdding}
              className="btn-gold w-full flex items-center justify-center gap-2 py-4"
            >
              {isAdding ? <Loader2 size={18} className="animate-spin" /> : <><ShoppingBag size={18} /> Add to Cart</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
