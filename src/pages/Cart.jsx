import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars

import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import { cartService, adminService } from '../services';
import { useAuthStore, useCartStore } from '../store';

// Fallback shipping constants (overridden by store settings)
const DEFAULT_SHIPPING_THRESHOLD = 999;
const DEFAULT_SHIPPING_CHARGE = 50;

export default function Cart() {
  const { isAuthenticated } = useAuthStore();
  const { setItemCount } = useCartStore();
  const queryClient = useQueryClient();
  const [localItems, setLocalItems] = useState([]);

  const { data: storeSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => adminService.getPublicSettings().then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
  const shippingThreshold = Number(storeSettings?.shipping?.freeShippingThreshold ?? DEFAULT_SHIPPING_THRESHOLD);
  const shippingCharge = Number(storeSettings?.shipping?.flatRateTN ?? DEFAULT_SHIPPING_CHARGE);

  // Load guest cart from local storage
  useEffect(() => {
    if (!isAuthenticated) {
      const items = JSON.parse(localStorage.getItem('magizhchi-guest-cart') || '[]');
      setLocalItems(items);
      setItemCount(items.length);
    }
  }, [isAuthenticated, setItemCount]);

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart().then(r => r.data.data.cart),
    enabled: isAuthenticated,
  });

  const { mutate: updateItem } = useMutation({
    mutationFn: ({ itemId, quantity }) => {
      if (!isAuthenticated) {
        const newItems = localItems.map(item => 
          item._id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
        );
        localStorage.setItem('magizhchi-guest-cart', JSON.stringify(newItems));
        setLocalItems(newItems);
        return Promise.resolve();
      }
      return cartService.updateCartItem(itemId, quantity);
    },
    onSuccess: () => {
      if (isAuthenticated) queryClient.invalidateQueries(['cart']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const { mutate: removeItem } = useMutation({
    mutationFn: (itemId) => {
      if (!isAuthenticated) {
        const newItems = localItems.filter(item => item._id !== itemId);
        localStorage.setItem('magizhchi-guest-cart', JSON.stringify(newItems));
        setLocalItems(newItems);
        setItemCount(newItems.length);
        return Promise.resolve();
      }
      return cartService.removeFromCart(itemId);
    },
    onSuccess: () => { 
      if (isAuthenticated) queryClient.invalidateQueries(['cart']); 
      toast.success('Removed from cart'); 
    },
  });

  const items = isAuthenticated ? (cart?.items || []) : localItems;
  const subtotal = items.reduce((sum, item) => {
    const price = item.productId?.discountedPrice || item.productId?.sellingPrice || 0;
    return sum + price * item.quantity;
  }, 0);
  const shipping = subtotal >= shippingThreshold ? 0 : shippingCharge;
  const total = subtotal + shipping;

  return (
    <>
      <Helmet><title>Cart — Magizhchi Garments</title></Helmet>
      <div className="min-h-screen bg-cream-bg py-8">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h1 className="section-title">Shopping Cart <span className="text-text-muted text-xl font-sans font-normal">({items.length} items)</span></h1>
            {!isAuthenticated && <span className="bg-premium-gold/10 text-premium-gold text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-premium-gold/20">Guest Mode</span>}
          </div>

          {isLoading && isAuthenticated ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl">
              <ShoppingBag size={64} className="text-border-dark mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-text-primary mb-2">Your cart is empty</h2>
              <p className="text-text-muted mb-6">Add some products to get started</p>
              <Link to="/collections" className="btn-primary">Start Shopping</Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-3">
                {items.map((item, i) => {
                  const product = item.productId;
                  const price = product?.discountedPrice || product?.sellingPrice || 0;
                  if (!product) return null;
                  return (
                    <motion.div key={item._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-xl p-4 flex gap-4 border border-border-light hover:shadow-card transition-shadow">
                      <Link to={`/product/${product.slug}`} className="shrink-0">
                        <img src={product.images?.[0] || '/placeholder.jpg'} alt={product.name}
                          className="w-20 h-24 object-cover rounded-lg bg-light-bg" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${product.slug}`} className="font-semibold text-text-primary text-sm hover:text-premium-gold transition-colors line-clamp-2">
                          {product.name}
                        </Link>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-text-muted border border-border-light rounded px-2 py-0.5">{item.variant?.size}</span>
                          <span className="text-xs text-text-muted border border-border-light rounded px-2 py-0.5">{item.variant?.color}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-border-dark rounded-lg overflow-hidden">
                            <button onClick={() => updateItem({ itemId: item._id, quantity: item.quantity - 1 })}
                              className="px-3 py-1.5 hover:bg-light-bg transition-colors text-base">−</button>
                            <span className="px-3 py-1.5 text-sm font-semibold border-x border-border-dark">{item.quantity}</span>
                            <button onClick={() => updateItem({ itemId: item._id, quantity: item.quantity + 1 })}
                              className="px-3 py-1.5 hover:bg-light-bg transition-colors text-base">+</button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-premium-gold">Rs.{(price * item.quantity).toLocaleString('en-IN')}</span>
                            <button onClick={() => removeItem(item._id)} className="text-text-muted hover:text-stock-out transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-border-light p-5 sticky top-24">
                  <h3 className="font-semibold text-text-primary text-base mb-4">Order Summary</h3>


                  {/* Pricing */}
                  <div className="space-y-3 text-sm border-t border-border-light pt-4">
                    <div className="flex justify-between text-text-secondary">
                      <span>Subtotal ({items.length} items)</span>
                      <span>Rs.{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Shipping</span>
                      <span className={shipping === 0 ? 'text-stock-in font-semibold' : ''}>
                        {shipping === 0 ? 'FREE' : `Rs.${shipping}`}
                      </span>
                    </div>
                    {shipping > 0 && (
                      <p className="text-xs text-stock-in">Add Rs.{(shippingThreshold - subtotal).toLocaleString('en-IN')} more for free shipping</p>
                    )}
                    <div className="border-t border-border-light pt-3 flex justify-between font-bold text-text-primary text-base">
                      <span>Total</span>
                      <span className="text-premium-gold">Rs.{total.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-xs text-text-muted">Incl. GST (5%)</p>
                  </div>

                  <Link to="/checkout" className="btn-primary w-full mt-5 flex items-center justify-center gap-2 py-3.5">
                    Proceed to Checkout <ArrowRight size={16} />
                  </Link>
                  <Link to="/collections" className="text-center text-sm text-text-muted hover:text-text-primary transition-colors mt-3 block">
                    ← Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
