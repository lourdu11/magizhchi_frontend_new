import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, MapPin, Download, ArrowRight, Loader2, Clock } from 'lucide-react';
import { orderService, publicService } from '../services';
import { Helmet } from 'react-helmet-async';
import { useAuthStore } from '../store';

export default function OrderConfirmation() {
  const { id } = useParams();
  const { isAuthenticated } = useAuthStore();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      try {
        const response = await publicService.getOrderDetails(id);
        return response.data.data?.order || response.data.data;
      } catch (err) {
        if (isAuthenticated) {
          const response = await orderService.getOrder(id);
          return response.data.data?.order || response.data.data;
        }
        throw err;
      }
    },
    enabled: !!id,
    retry: 1
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-premium-gold" size={48} />
    </div>
  );

  if (!order) return (
    <div className="container-custom py-20 text-center">
      <Package size={48} className="mx-auto text-border-light mb-4" />
      <p className="text-text-muted">Order not found.</p>
      <Link to="/" className="btn-primary mt-4 inline-block">Back to Home</Link>
    </div>
  );

  const statusSteps = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];
  const currentStep = statusSteps.indexOf(order.orderStatus);

  return (
    <div className="container-custom py-12 max-w-3xl mx-auto">
      <Helmet><title>Order Confirmed — Magizhchi</title></Helmet>

      {/* Success Header */}
      <div className="text-center mb-10">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-once">
          <CheckCircle size={52} className="text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Order Confirmed!</h1>
        <p className="text-text-muted">Thank you for your purchase. Your order has been placed successfully.</p>
      </div>

      {/* Order Number Card */}
      <div className="bg-dark-gradient rounded-2xl p-6 text-center mb-6">
        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Your Order Number</p>
        <p className="text-premium-gold text-3xl font-bold tracking-wider">#{order.orderNumber}</p>
        {order.estimatedDeliveryDate && (
          <p className="text-white/70 text-sm mt-2 flex items-center justify-center gap-2">
            <Clock size={14} /> Estimated delivery by {new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Screenshot Reminder */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
          <Package size={20} className="text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-900">Pro Tip!</p>
          <p className="text-xs text-amber-800">Please take a <strong>screenshot</strong> of this page for your records.</p>
        </div>
      </div>

      {/* Order Timeline */}
      <div className="bg-white rounded-2xl border border-border-light p-6 mb-6">
        <h3 className="font-bold text-text-primary mb-5">Order Status</h3>
        <div className="flex items-start justify-between relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border-light z-0" />
          <div className="absolute top-5 left-0 h-0.5 bg-premium-gold z-0 transition-all duration-700" style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }} />
          {statusSteps.map((step, i) => (
            <div key={step} className="flex flex-col items-center gap-2 z-10 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${i <= currentStep ? 'bg-premium-gold text-charcoal' : 'bg-white border-2 border-border-light text-text-muted'}`}>
                {i < currentStep ? '✓' : i + 1}
              </div>
              <p className="text-[10px] font-bold text-center text-text-muted uppercase leading-tight">{step.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Items Summary */}
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden mb-6">
        <div className="px-6 py-4 bg-light-bg border-b border-border-light">
          <h3 className="font-bold text-text-primary">Items Ordered</h3>
        </div>
        <div className="p-5 space-y-4">
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <img src={item.productImage || '/placeholder.jpg'} alt="" className="w-16 h-16 rounded-xl object-cover bg-light-bg shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-text-primary">{item.productName}</p>
                <p className="text-xs text-text-muted">{item.variant?.size} · {item.variant?.color} · Qty: {item.quantity}</p>
              </div>
              <p className="font-bold text-premium-gold">Rs.{item.total?.toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 bg-light-bg border-t border-border-light space-y-2">
          <div className="flex justify-between text-sm text-text-muted"><span>Subtotal</span><span>Rs.{order.pricing?.subtotal?.toLocaleString('en-IN')}</span></div>
          {order.pricing?.discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>−Rs.{order.pricing?.discount?.toLocaleString('en-IN')}</span></div>}
          <div className="flex justify-between text-sm text-text-muted"><span>Shipping</span><span>{order.pricing?.shippingCharges === 0 ? 'FREE' : `Rs.${order.pricing?.shippingCharges}`}</span></div>
          <div className="flex justify-between font-bold text-base text-text-primary pt-2 border-t border-border-light"><span>Total Paid</span><span className="text-premium-gold">Rs.{order.pricing?.totalAmount?.toLocaleString('en-IN')}</span></div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-2xl border border-border-light p-6 mb-8">
        <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2"><MapPin size={16} className="text-premium-gold" /> Shipping To</h3>
        <p className="font-semibold text-text-primary">{order.shippingAddress?.name}</p>
        <p className="text-sm text-text-muted">{order.shippingAddress?.addressLine1}{order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress?.addressLine2}` : ''}</p>
        <p className="text-sm text-text-muted">{order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}</p>
        <p className="text-sm text-text-muted">{order.shippingAddress?.phone}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {order.invoiceUrl && (
          <a href={order.invoiceUrl} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-white border-2 border-border-light rounded-xl font-bold text-text-primary hover:border-premium-gold transition-colors">
            <Download size={18} /> Download Invoice
          </a>
        )}
        <Link to={isAuthenticated ? "/dashboard" : "/track-order"} className="flex-1 flex items-center justify-center gap-2 btn-dark py-3">
          <Package size={18} /> Track Order <ArrowRight size={16} />
        </Link>
        <Link to="/collections" className="flex-1 flex items-center justify-center gap-2 py-3 px-6 border-2 border-border-light rounded-xl font-bold text-text-muted hover:text-text-primary transition-colors">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
