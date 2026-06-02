import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { wishlistService, authService } from '../../services';
import { useAuthStore, useWishlistStore } from '../../store';
import { toast } from 'react-hot-toast';
import SafeImage from '../common/SafeImage';

export default function ProductCard({ product }) {
  const { isAuthenticated, setAuth } = useAuthStore();
  const { productIds, toggleId } = useWishlistStore();
  const [isAddingWishlist, setIsAddingWishlist] = useState(false);
  const [isAddingCart] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Guard: if product is missing, don't render
  if (!product || !product._id) return null;

  const sellingPrice = product.sellingPrice ?? 0;
  const discountedPrice = product.discountedPrice ?? 0;
  const price = discountedPrice > 0 ? discountedPrice : sellingPrice;
  const hasDiscount = (product.discountPercentage ?? 0) > 0 && sellingPrice > 0;
  
  const getVariantStock = (v) => {
    if (v.availableStock !== undefined) return v.availableStock;
    if (v.available !== undefined) return v.available;
    if (v.qty !== undefined) return v.qty;
    if (v.stock !== undefined) return v.stock;
    return 0;
  };

  // Combo products are available if they have slots, standalone products depend on variants stock
  const isOutOfStock = product.productNature === 'combo' 
    ? (!Array.isArray(product.comboSlots) || product.comboSlots.length === 0)
    : (!Array.isArray(product.variants) || product.variants.length === 0 || product.variants.every(v => getVariantStock(v) - (v.reservedStock || 0) <= 0));

  const isWishlisted = Array.isArray(productIds) && productIds.includes(product._id);

  const handleCart = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigate(`/product/${product.slug}`);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddingWishlist(true);
    try {
      if (!isAuthenticated) {
        const res = await authService.quickGuest();
        setAuth(res.data.data.user, res.data.data.accessToken);
      }

      if (isWishlisted) {
        await wishlistService.removeFromWishlist(product._id);
        toggleId(product._id, false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistService.addToWishlist(product._id);
        toggleId(product._id, true);
        toast.success('Added to wishlist');
      }
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating wishlist');
    } finally {
      setIsAddingWishlist(false);
    }
  };

  return (
    <div className="group relative">
      <Link to={`/product/${product.slug}`} aria-label={`View details for ${product.name}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[4/5] max-w-xs mx-auto rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white mb-4 border border-border-light group-hover:border-premium-gold/30 transition-all duration-500 shadow-sm group-hover:shadow-2xl group-hover:shadow-premium-gold/10 group-hover:scale-[1.03] transform will-change-transform">

          <SafeImage
            src={product.images?.[0] || product.thumbnail || product.laptopImage || product.tabletImage || product.mobileImage}
            alt={product.name}
            width={375}
            height={500}
            className="w-full h-full object-cover relative z-10 transition-transform duration-700 group-hover:scale-105"
            style={{ objectPosition: 'center' }}
            loading="lazy"
          />

          {/* Labels */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {isOutOfStock && (
              <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg shadow-red-500/20">Sold Out</span>
            )}
            {product.isNewArrival && !isOutOfStock && (
              <span className="bg-charcoal text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full">New</span>
            )}
            {hasDiscount && !isOutOfStock && (
              <span className="bg-premium-gold text-charcoal text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full">-{product.discountPercentage}%</span>
            )}
          </div>

          {/* Wishlist Button (Always Visible) */}
          <div className="absolute top-4 right-4 z-30">
            <button 
              onClick={handleWishlist} 
              disabled={isAddingWishlist}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl backdrop-blur-md flex items-center justify-center transition-all shadow-lg active:scale-90 ${isWishlisted ? 'bg-premium-gold text-white' : 'bg-white/70 text-charcoal hover:bg-premium-gold hover:text-white'}`}
            >
              {isAddingWishlist ? <div className="w-4 h-4 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" /> : <Heart size={18} className={`md:size-5 ${isWishlisted ? 'fill-white' : ''}`} />}
            </button>
          </div>


          {/* Buy Now Overlay (Desktop) */}
          {!isOutOfStock && (
            <div className="hidden md:block absolute bottom-6 left-6 right-6 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-30">
              <button 
                onClick={handleCart} 
                disabled={isAddingCart}
                aria-label={`Buy ${product.name} now`}
                className="w-full py-4 bg-gradient-to-r from-premium-gold to-amber-500 text-charcoal hover:from-charcoal hover:to-charcoal hover:text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all shadow-xl shadow-premium-gold/10"
              >
                {isAddingCart ? <div className="w-4 h-4 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" /> : <><ShoppingBag size={15} /> Buy Now</>}
              </button>
            </div>
          )}

          {/* Mobile Direct Action */}
          {!isOutOfStock && (
            <div className="md:hidden absolute bottom-3 right-3 z-30">
              <button 
                onClick={handleCart} 
                disabled={isAddingCart}
                aria-label={`Buy ${product.name} now`}
                className="w-10 h-10 bg-premium-gold text-charcoal rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              >
                {isAddingCart ? <div className="w-4 h-4 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" /> : <Plus size={20} />}
              </button>
            </div>
          )}
        </div>


        {/* Product Details */}
        <div className="px-2">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="text-sm md:text-lg font-black text-charcoal line-clamp-2 flex-1 tracking-tight leading-snug">{product.name}</h3>
            <div className="flex items-center gap-1 shrink-0 pt-1">
              <Star size={10} className="fill-premium-gold text-premium-gold" />
              <span className="text-[10px] font-bold text-text-muted">{product.ratings?.average || '4.8'}</span>
            </div>
          </div>
          
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-3">{product.brand || 'Magizhchi'}</p>
          
          <div className="flex items-center gap-3">
            <span className="text-base md:text-xl font-black text-charcoal tracking-tighter">Rs.{(price || 0).toLocaleString('en-IN')}</span>
            {hasDiscount && sellingPrice > 0 && (
              <span className="text-xs md:text-sm text-text-muted line-through font-medium">Rs.{sellingPrice.toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
