import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Truck, RefreshCw, Shield, Heart, ShoppingBag, ChevronLeft, ChevronRight, Check, Loader2, MessageCircle, ThumbsUp, ThumbsDown, CheckCircle, Camera } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import { productService, cartService, wishlistService, reviewService, authService } from '../services';
import api from '../services/api';
import { useAuthStore, useWishlistStore } from '../store';
import SafeImage from '../components/common/SafeImage';

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, setAuth } = useAuthStore();
  const { productIds, toggleId } = useWishlistStore();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details');
  const [isAddingWishlist, setIsAddingWishlist] = useState(false);
  const [isAddingCart, setIsAddingCart] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getProduct(slug).then(r => r.data.data.product),
  });

  const product = data;

  const sizes = product ? [...new Set(product.variants.map(v => v.size).filter(Boolean))] : [];
  const colors = product ? [...new Set(product.variants.map(v => v.color).filter(Boolean))] : [];

  // Auto-select if only one option
  useEffect(() => {
    if (sizes.length === 1 && !selectedSize) setSelectedSize(sizes[0]);
    if (colors.length === 1 && !selectedColor) setSelectedColor(colors[0]);
  }, [sizes, colors]);

  const currentVariant = product?.variants.find(
    v => v.size === selectedSize && v.color === selectedColor
  );

  // variant.stock from API is already: totalStock - onlineSold - offlineSold - reservedStock + returned - damaged
  const availableStock = currentVariant ? Math.max(0, currentVariant.stock || 0) : 0;
  const isOutOfStock = selectedSize && selectedColor && availableStock <= 0;

  // Sync image with color selection
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    const variantWithImage = product.variants.find(v => v.color === color && v.images?.length > 0);
    if (variantWithImage) {
      const imgIdx = product.images.findIndex(img => img === variantWithImage.images[0]);
      if (imgIdx > -1) setSelectedImage(imgIdx);
    }
  };

  // Sync size with color (reset color if not available in new size)
  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    if (selectedColor) {
      const exists = product.variants.some(v => v.size === size && v.color === selectedColor);
      if (!exists) setSelectedColor(null);
    }
  };

  const isWishlisted = product ? productIds.includes(product._id) : false;

  const handleAddToCart = async () => {
    if (!selectedSize) return toast.error('Please select a size');
    if (!selectedColor) return toast.error('Please select a color');
    if (isOutOfStock) return toast.error('This variant is out of stock');

    setIsAddingCart(true);
    try {
      if (!isAuthenticated) {
        const res = await authService.quickGuest();
        setAuth(res.data.data.user, res.data.data.accessToken);
      }
      await cartService.addToCart({ productId: product._id, size: selectedSize, color: selectedColor, quantity });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart!');
      navigate('/cart');
    } catch (err) {
      console.error('Cart Error:', err);
      toast.error(err.response?.data?.message || err.message || 'Error adding to cart');
    } finally {
      setIsAddingCart(false);
    }
  };

  const handleWishlist = async () => {
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
      queryClient.invalidateQueries(['wishlist']);
    } catch (err) {
      console.error('Wishlist Error:', err);
      toast.error(err.response?.data?.message || err.message || 'Error updating wishlist');
    } finally {
      setIsAddingWishlist(false);
    }
  };

  if (isLoading) return <div className="container-custom py-24 flex justify-center"><div className="w-12 h-12 border-4 border-premium-gold/20 border-t-premium-gold rounded-full animate-spin" /></div>;
  if (!product) return <div className="container-custom py-24 text-center"><h2 className="text-4xl font-black mb-8">Product Not Found</h2><Link to="/collections" className="btn-primary">Continue Shopping</Link></div>;

  const images = product.images?.length > 0 ? product.images : ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop'];
  const price = product.discountedPrice || product.sellingPrice;
  const hasDiscount = product.discountPercentage > 0;

  return (
    <div className="bg-white min-h-screen pb-24 md:pb-0">
      <Helmet><title>{product.name} — Magizhchi</title></Helmet>

      {/* Breadcrumb */}
      <div className="hidden md:block py-6 border-b border-border-light">
        <div className="container-custom flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
          <Link to="/" className="hover:text-premium-gold">Home</Link>
          <ChevronRight size={10} />
          <Link to="/collections" className="hover:text-premium-gold">Collections</Link>
          <ChevronRight size={10} />
          <span className="text-charcoal">{product.name}</span>
        </div>
      </div>

      <div className="container-custom py-8 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          
          {/* ── Image Gallery ── */}
          <div className="space-y-6">
            <div className="relative aspect-[4/5] rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden bg-light-bg border border-border-light group shadow-xl shadow-black/5">
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full"
              >
                <SafeImage 
                  src={images[selectedImage]} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              
              {/* Image Nav Dots */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`h-1.5 rounded-full transition-all ${i === selectedImage ? 'w-8 bg-premium-gold' : 'w-2 bg-white/40 hover:bg-white/60'}`} />
                ))}
              </div>
            </div>
            
            <div className="hidden md:flex gap-4">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`w-24 aspect-square rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-premium-gold scale-95 shadow-lg shadow-premium-gold/20' : 'border-transparent hover:border-border-light'}`}>
                  <SafeImage src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* ── Product Details ── */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-charcoal text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full">{product.brand || 'Magizhchi'}</span>
                {product.isNewArrival && <span className="px-3 py-1 bg-premium-gold/10 text-premium-gold text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-premium-gold/20">New Season</span>}
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-charcoal tracking-tight leading-[0.95] mb-4">{product.name}</h1>
              
              {/* Flipkart Style Star Box */}
              <div className="flex items-center gap-4 mb-6">
                {product.ratings?.count > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="bg-green-600 text-white px-2 py-0.5 rounded flex items-center gap-1 text-sm font-bold">
                      {product.ratings.average} <Star size={12} fill="white" />
                    </div>
                    <span className="text-xs font-black text-text-muted uppercase tracking-widest">{product.ratings.count} Ratings & Reviews</span>
                  </div>
                ) : (
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">No ratings yet</span>
                )}
              </div>

              <div className="flex items-center gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black text-charcoal tracking-tighter">Rs.{price.toLocaleString('en-IN')}</span>
                  {hasDiscount && <span className="text-xl text-text-muted line-through font-bold">Rs.{product.sellingPrice.toLocaleString('en-IN')}</span>}
                </div>
                {hasDiscount && (
                  <span className="bg-premium-gold text-charcoal text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
                    SAVE {product.discountPercentage}%
                  </span>
                )}
              </div>
            </div>

            {/* Colors */}
            {colors.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center justify-between">
                  Select Color <span>{selectedColor || 'Required'}</span>
                </p>
                <div className="flex gap-3 flex-wrap">
                  {colors.map(color => {
                    // Check if this color is available at all
                    const totalColorStock = product.variants
                      .filter(v => v.color === color)
                      .reduce((sum, v) => sum + v.stock, 0);
                    
                    // Check if available for the SPECIFIC selected size
                    const variant = product.variants.find(v => v.color === color && v.size === selectedSize);
                    const isAvailableForSize = selectedSize ? (variant && variant.stock > 0) : totalColorStock > 0;

                    return (
                      <button 
                        key={color} 
                        type="button"
                        onClick={() => handleColorSelect(color)} 
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest border-2 transition-all flex flex-col items-center ${selectedColor === color ? 'bg-charcoal text-white border-charcoal shadow-xl' : !isAvailableForSize ? 'bg-light-bg text-text-muted border-transparent opacity-50' : 'bg-white text-charcoal border-border-light hover:border-premium-gold'}`}
                      >
                        <span>{color.toUpperCase()}</span>
                        <span className="text-[8px] opacity-60 uppercase">{!isAvailableForSize ? 'Sold Out' : 'In Stock'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center justify-between">
                  Select Size <span>{selectedSize || 'Required'}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  {sizes.map(size => {
                    // Check total size stock
                    const totalSizeStock = product.variants
                      .filter(v => v.size === size)
                      .reduce((sum, v) => sum + v.stock, 0);

                    // Check if available for the SPECIFIC selected color
                    const variant = product.variants.find(v => v.size === size && v.color === selectedColor);
                    const isAvailableForColor = selectedColor ? (variant && variant.stock > 0) : totalSizeStock > 0;
                    
                    return (
                      <button 
                        key={size} 
                        type="button"
                        onClick={() => handleSizeSelect(size)} 
                        className={`min-w-[80px] h-12 px-4 rounded-2xl text-sm font-black border-2 transition-all flex flex-col items-center justify-center relative ${selectedSize === size ? 'bg-charcoal text-white border-charcoal shadow-lg' : !isAvailableForColor ? 'bg-light-bg text-text-muted border-transparent opacity-50' : 'bg-white text-charcoal border-border-light hover:border-premium-gold'}`}
                      >
                        <span>{size}</span>
                        <span className="text-[8px] opacity-60">{!isAvailableForColor ? 'OUT' : 'AVAILABLE'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-6 border-t border-border-light space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center bg-light-bg rounded-2xl p-1.5 border border-border-light">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl hover:bg-white flex items-center justify-center transition-all">−</button>
                  <span className="w-12 text-center font-black text-sm">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 rounded-xl hover:bg-white flex items-center justify-center transition-all">+</button>
                </div>
                  <button onClick={handleWishlist} disabled={isAddingWishlist} 
                    className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${isWishlisted ? 'bg-premium-gold border-premium-gold text-white' : 'border-border-light hover:bg-red-50 hover:border-red-100 hover:text-red-500'}`}>
                    {isAddingWishlist ? <div className="w-5 h-5 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" /> : <Heart size={20} className={isWishlisted ? 'fill-white' : ''} />}
                  </button>
              </div>

              <button onClick={handleAddToCart} disabled={isAddingCart || isOutOfStock} className="w-full btn-gold py-5 rounded-[2rem] flex items-center justify-center gap-3">
                {isAddingCart ? <div className="w-5 h-5 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" /> : <><ShoppingBag size={20} /> {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO BAG'}</>}
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              {[
                { icon: Truck, text: 'Fast Delivery' },
                { icon: Shield, text: 'Secure Checkout' },
                { icon: RefreshCw, text: '7-Day Return' },
                { icon: Check, text: 'Premium Quality' }
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-light-bg rounded-2xl">
                  <f.icon size={16} className="text-premium-gold" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-charcoal">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs / Info ── */}
        <div className="mt-24 max-w-5xl">
          <div className="flex gap-10 border-b border-border-light mb-10 overflow-x-auto no-scrollbar">
            {['details', 'reviews', 'shipping', 'care'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-[11px] font-black uppercase tracking-[0.3em] transition-all border-b-2 -mb-px ${activeTab === tab ? 'border-premium-gold text-charcoal' : 'border-transparent text-text-muted'}`}>
                {tab} {tab === 'reviews' && product.ratings?.count > 0 && `(${product.ratings.count})`}
              </button>
            ))}
          </div>
          
          <div className="text-text-secondary leading-relaxed font-medium min-h-[400px]">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <p>{product.description || 'Elevate your wardrobe with this premium piece from Magizhchi. Crafted with attention to detail and a focus on contemporary style.'}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                  {Object.entries(product.specifications || {}).filter(([,v]) => v && typeof v === 'string').map(([k, v]) => (
                    <div key={k} className="flex justify-between items-end border-b border-dashed border-border-light pb-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{k.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-charcoal font-bold">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && <ReviewSection productId={product._id} slug={slug} averageRating={product.ratings?.average} totalCount={product.ratings?.count} />}

            {activeTab === 'shipping' && <p>Complimentary shipping on all orders above Rs.999. Orders are processed within 24 hours and delivered within 3-5 business days across Tamil Nadu.</p>}
            {activeTab === 'care' && <p>Dry clean recommended for the first wash. Machine wash cold with similar colors. Do not bleach. Tumble dry low or hang dry in shade. Iron on medium heat.</p>}
          </div>
        </div>
      </div>

      {/* ── Mobile Floating Action Bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 glass z-50 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[10px] font-black text-text-muted truncate uppercase tracking-widest">{product.name}</p>
          <p className="font-black text-charcoal tracking-tight">Rs.{price.toLocaleString('en-IN')}</p>
        </div>
        <button onClick={handleAddToCart} disabled={isAddingCart || isOutOfStock} className="flex-[1.5] btn-gold py-4 rounded-2xl flex items-center justify-center gap-2">
          {isAddingCart ? <div className="w-4 h-4 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" /> : <><ShoppingBag size={16} /> ADD</>}
        </button>
      </div>
    </div>
  );
}

function ReviewSection({ productId, slug, averageRating = 0, totalCount = 0 }) {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'helpful'
  const queryClient = useQueryClient();
  const { isAuthenticated, user: loggedInUser } = useAuthStore();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['product-reviews', productId, sortBy],
    queryFn: () => reviewService.getProductReviews(productId, { sort: sortBy === 'helpful' ? '-likes' : '-createdAt' }).then(r => r.data.data),
    enabled: !!productId,
  });

  const { data: stats } = useQuery({
    queryKey: ['review-stats', productId],
    queryFn: () => reviewService.getReviewStats(productId).then(r => r.data.data),
    enabled: !!productId,
  });

  const voteMutation = useMutation({
    mutationFn: ({ id, type }) => type === 'like' ? reviewService.likeReview(id) : reviewService.dislikeReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['product-reviews', productId]);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Login to vote')
  });

  const allCustomerImages = reviews?.flatMap(r => r.images || []).filter(Boolean) || [];
  const currentTotalReviews = stats?.totalReviews || totalCount || 0;
  const formattedAvg = parseFloat(stats?.averageRating || averageRating || 0).toFixed(1);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-premium-gold" size={40} /></div>;

  return (
    <div className="space-y-12 md:space-y-16" id="reviews-section">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-charcoal p-8 md:p-16 rounded-[3rem] md:rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10">
          {currentTotalReviews > 0 ? (
            <>
              <div className="flex items-baseline gap-2">
                <h3 className="text-6xl md:text-8xl font-black tracking-tighter">{formattedAvg}</h3>
                <span className="text-premium-gold text-xl md:text-2xl font-black">/ 5</span>
              </div>
              <div className="mt-2 md:mt-4 space-y-1">
                <div className="flex gap-1 text-premium-gold">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={16} fill={star <= Math.round(formattedAvg) ? "currentColor" : "none"} strokeWidth={2.5} className="md:w-5 md:h-5" />
                  ))}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">{currentTotalReviews} Verified Ratings</p>
              </div>
            </>
          ) : (
            <div>
              <h3 className="text-3xl md:text-4xl font-black tracking-tight uppercase">No Reviews Yet</h3>
              <p className="text-white/40 text-xs font-bold mt-2 uppercase tracking-widest">Be the first to share your experience!</p>
            </div>
          )}
        </div>

        <button 
          onClick={() => navigate(`/product/${slug}/write-review`)}
          className="w-full md:w-auto relative z-10 px-8 md:px-12 py-5 md:py-6 bg-premium-gold text-charcoal font-black rounded-[2rem] md:rounded-[2.5rem] text-[10px] md:text-xs uppercase tracking-[0.3em] hover:bg-white transition-all shadow-xl hover:scale-105 active:scale-95"
        >
          WRITE A REVIEW
        </button>

        {/* Decorative background element */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl group-hover:bg-premium-gold/10 transition-colors" />
      </div>

      {/* Ratings Breakdown & Gallery Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white p-10 rounded-[3rem] border border-border-light shadow-xl">
        <div className="space-y-6">
          <h4 className="text-sm font-black text-charcoal uppercase tracking-[0.2em]">Rating Breakdown</h4>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(num => {
              const count = stats?.breakdown?.[num] || 0;
              const totalForStats = currentTotalReviews || 1;
              const percentage = (count / totalForStats) * 100;
              return (
                <div key={num} className="flex items-center gap-4 group">
                  <span className="text-[10px] font-black text-charcoal w-4">{num}</span>
                  <Star size={12} fill={num >= 4 ? "#16a34a" : num >= 3 ? "#f59e0b" : "#dc2626"} className="opacity-40" />
                  <div className="flex-1 h-2 bg-light-bg rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1 }} className={`h-full ${num >= 4 ? 'bg-green-600' : num >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  </div>
                  <span className="text-[10px] font-black text-text-muted w-10 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {allCustomerImages.length > 0 && (
          <div className="space-y-6">
            <h4 className="text-sm font-black text-charcoal uppercase tracking-[0.2em]">Images from Customers ({allCustomerImages.length})</h4>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
              {allCustomerImages.map((img, i) => (
                <SafeImage key={i} src={img} alt="customer" className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-[2rem] border-2 border-border-light flex-shrink-0 hover:border-premium-gold transition-all cursor-pointer shadow-lg" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Flipkart Model Review List */}
      <div className="grid gap-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-light pb-6 gap-4">
          <h4 className="text-xl font-black text-charcoal tracking-tight uppercase">Customer Reviews ({reviews?.length || 0})</h4>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 bg-light-bg rounded-lg px-3 py-1 border border-border-light">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Sort:</span>
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-black text-charcoal uppercase tracking-widest focus:ring-0 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="helpful">Most Helpful</option>
                </select>
             </div>
             <div className="bg-green-600 text-white px-3 py-1 rounded-lg flex items-center gap-1 text-sm font-black">
                {formattedAvg} <Star size={14} fill="white" />
              </div>
          </div>
        </div>

        {reviews?.length === 0 ? (
          <div className="text-center py-20 bg-light-bg/20 rounded-[4rem] border border-dashed border-border-light">
            <MessageCircle className="mx-auto text-text-muted/20 mb-4" size={48} />
            <p className="text-text-muted font-bold italic">No reviews found yet. Be the first to share your experience!</p>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review._id} className="p-6 md:p-10 bg-white rounded-[3rem] border border-border-light hover:shadow-2xl transition-all space-y-6">
              {/* Card Header */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-light-bg flex items-center justify-center text-charcoal font-bold text-lg border border-border-light">
                    {review.userId?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-charcoal uppercase tracking-widest">{review.userId?.name || 'Anonymous'}</span>
                      {review.isVerifiedPurchase && (
                        <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                          <CheckCircle size={10} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Certified</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} fill={s <= review.rating ? '#16a34a' : 'none'} stroke={s <= review.rating ? '#16a34a' : '#E5E7EB'} />)}
                      </div>
                      <span className="text-[10px] text-text-muted font-bold">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-light-bg p-2 rounded-2xl md:bg-transparent md:p-0">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2 md:ml-0">Helpful?</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => voteMutation.mutate({ id: review._id, type: 'like' })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                        review.likedBy?.includes(loggedInUser?._id) 
                          ? 'bg-blue-50 border-blue-200 text-blue-600' 
                          : 'bg-white border-border-light text-text-muted hover:border-blue-500 hover:text-blue-500'
                      }`}
                    >
                      <ThumbsUp size={14} fill={review.likedBy?.includes(loggedInUser?._id) ? "currentColor" : "none"} />
                      <span className="text-xs font-black">{review.likes || 0}</span>
                    </button>
                    <button 
                      onClick={() => voteMutation.mutate({ id: review._id, type: 'dislike' })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                        review.dislikedBy?.includes(loggedInUser?._id) 
                          ? 'bg-red-50 border-red-200 text-red-600' 
                          : 'bg-white border-border-light text-text-muted hover:border-red-500 hover:text-red-500'
                      }`}
                    >
                      <ThumbsDown size={14} fill={review.dislikedBy?.includes(loggedInUser?._id) ? "currentColor" : "none"} />
                      <span className="text-xs font-black">{review.dislikes || 0}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Title & Comment */}
              <div>
                <h5 className="font-black text-charcoal text-lg tracking-tight uppercase mb-2">{review.title}</h5>
                <p className="text-text-secondary font-medium leading-relaxed">
                  {review.comment}
                </p>
              </div>

              {/* Review Images */}
              {review.images?.length > 0 && (
                <div className="flex gap-3 pt-2">
                  {review.images.map((img, i) => (
                    <SafeImage key={i} src={img} alt="review" className="w-20 h-20 object-cover rounded-2xl border border-border-light shadow-md" />
                  ))}
                </div>
              )}

              {/* Admin Reply */}
              {review.adminReply?.message && (
                <div className="mt-8 p-6 bg-light-bg rounded-[2rem] border-l-4 border-premium-gold relative">
                  <p className="text-[9px] font-black text-premium-gold uppercase tracking-[0.2em] mb-2">Magizhchi Official Team Response</p>
                  <p className="text-sm text-charcoal font-bold leading-relaxed">{review.adminReply.message}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
