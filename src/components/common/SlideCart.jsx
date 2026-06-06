import { useCartStore } from '../../store';
import { X, ArrowRight, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cartService } from '../../services';
import SafeImage from './SafeImage';

export default function SlideCart() {
  const { isCartOpen, setCartOpen } = useCartStore();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart().then(r => r.data.data),
    enabled: isCartOpen
  });

  const cart = data?.cart;
  const items = cart?.items || [];
  const subtotal = data?.subtotal || 0;
  
  // Calculate free shipping progress (e.g. Free shipping above ₹2000)
  const freeShippingThreshold = 2000;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  if (!isCartOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] animate-fade-in" 
        onClick={() => setCartOpen(false)} 
      />
      
      <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[100] shadow-2xl flex flex-col transform transition-transform duration-500 translate-x-0">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-light-bg">
          <h2 className="text-xl font-black text-charcoal flex items-center gap-2">
            Your Cart <span className="text-premium-gold text-sm">({items.length})</span>
          </h2>
          <button 
            onClick={() => setCartOpen(false)}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-charcoal" />
          </button>
        </div>

        {/* Free Shipping Bar */}
        <div className="p-4 bg-charcoal text-white text-center">
          {amountToFreeShipping > 0 ? (
            <p className="text-xs font-bold mb-2">
              You're <span className="text-premium-gold">₹{amountToFreeShipping.toLocaleString('en-IN')}</span> away from Free Shipping!
            </p>
          ) : (
            <p className="text-xs font-bold text-premium-gold mb-2">Congratulations! You get Free Shipping.</p>
          )}
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-premium-gold rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col gap-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="w-20 h-24 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2 py-2">
                    <div className="w-2/3 h-4 bg-gray-200 rounded" />
                    <div className="w-1/3 h-3 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-400">
              <p className="font-bold text-lg">Your cart is empty</p>
              <button 
                onClick={() => { setCartOpen(false); navigate('/collections'); }}
                className="btn-outline px-6 py-2"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item._id} className="flex gap-4 group">
                <SafeImage 
                  src={item.product.images?.[0] || item.product.image} 
                  className="w-20 h-24 object-cover rounded-xl border border-gray-100" 
                />
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-bold text-sm text-charcoal leading-tight line-clamp-2">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Size: {item.size} | Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-premium-gold text-sm">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-light-bg space-y-4">
            <div className="flex justify-between items-center text-sm font-bold text-charcoal">
              <span>Subtotal</span>
              <span>₹{(subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            <button 
              onClick={() => { setCartOpen(false); navigate('/cart'); }}
              className="btn-gold w-full flex items-center justify-center gap-2"
            >
              Go to Cart <ArrowRight size={18} />
            </button>
          </div>
        )}

      </div>
    </>
  );
}
