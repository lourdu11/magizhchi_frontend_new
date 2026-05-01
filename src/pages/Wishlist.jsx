import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, ShoppingCart, Trash2, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { wishlistService, cartService } from '../services';
import { useWishlistStore } from '../store';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';

export default function Wishlist() {
  const qc = useQueryClient();

  const { setWishlist } = useWishlistStore();
  
  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistService.getWishlist().then(r => r.data.data),
  });

  useEffect(() => {
    if (wishlist?.wishlist?.products) {
      setWishlist(wishlist.wishlist.products);
    }
  }, [wishlist, setWishlist]);

  const removeMutation = useMutation({
    mutationFn: (productId) => wishlistService.removeFromWishlist(productId),
    onSuccess: () => { qc.invalidateQueries(['wishlist']); toast.success('Removed from wishlist'); },
  });

  const addToCartMutation = useMutation({
    mutationFn: ({ productId, variant }) => cartService.addToCart({ productId, variant, quantity: 1 }),
    onSuccess: () => { qc.invalidateQueries(['cart']); toast.success('Added to cart!'); },
    onError: () => toast.error('Could not add to cart'),
  });

  if (isLoading) return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-premium-gold" size={48} />
    </div>
  );

  const items = wishlist?.wishlist?.products || [];

  return (
    <div className="container-custom py-12">
      <Helmet>
        <title>My Wishlist — Magizhchi</title>
      </Helmet>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <Heart className="text-premium-gold" size={28} /> My Wishlist
          </h1>
          <p className="text-text-muted text-sm mt-1">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
        </div>
        {items.length > 0 && (
          <Link to="/collections" className="text-sm font-bold text-premium-gold hover:underline flex items-center gap-1">
            Continue Shopping <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {items.length === 0 && (
        <div className="py-24 text-center">
          <Heart size={64} className="mx-auto text-border-light mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Your Wishlist is Empty</h2>
          <p className="text-text-muted mb-6">Save products you love by tapping the heart icon.</p>
          <Link to="/collections" className="btn-primary">Browse Products</Link>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => {
          const product = item.productId || item;
          if (!product?._id) return null;
          const price = product.discountedPrice || product.sellingPrice;
          const firstVariant = product.variants?.[0];

          return (
            <div key={product._id} className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm group hover:shadow-card-hover transition-shadow">
              {/* Image */}
              <div className="relative aspect-[4/5] bg-light-bg">
                <Link to={`/product/${product.slug}`}>
                  <img
                    src={product.images?.[0] || '/placeholder.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </Link>
                {product.discountPercentage > 0 && (
                  <span className="absolute top-3 left-3 bg-premium-gold text-charcoal text-[10px] font-bold px-2 py-0.5 rounded-full">
                    -{product.discountPercentage}%
                  </span>
                )}
                <button
                  onClick={() => removeMutation.mutate(product._id)}
                  className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md text-red-400 hover:text-red-600 hover:scale-110 transition-all"
                  title="Remove from wishlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Info */}
              <div className="p-4">
                <Link to={`/product/${product.slug}`}>
                  <h3 className="font-semibold text-text-primary text-sm leading-tight hover:text-premium-gold transition-colors line-clamp-2">{product.name}</h3>
                </Link>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-bold text-text-primary">Rs.{price?.toLocaleString('en-IN')}</span>
                  {product.discountPercentage > 0 && (
                    <span className="text-xs text-text-muted line-through">Rs.{product.sellingPrice?.toLocaleString('en-IN')}</span>
                  )}
                </div>

                <button
                  onClick={() => addToCartMutation.mutate({ productId: product._id, variant: { size: firstVariant?.size, color: firstVariant?.color } })}
                  disabled={addToCartMutation.isPending || !firstVariant}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-charcoal text-white py-2.5 rounded-xl text-sm font-bold hover:bg-premium-gold hover:text-charcoal transition-all active:scale-95 disabled:opacity-50"
                >
                  <ShoppingCart size={16} />
                  {!firstVariant ? 'Out of Stock' : 'Move to Cart'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
