import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, CheckCircle, XCircle, MessageCircle, Loader2, Search, Filter, BarChart3, TrendingUp, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { reviewService } from '../../services';
import SafeImage from '../../components/common/SafeImage';

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState(null);
  const [adminReply, setAdminReply] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState('all');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => reviewService.getAllReviews().then(r => r.data.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reply }) => 
      reviewService.updateReviewStatus(id, { status, adminReply: reply }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-reviews']);
      toast.success('Review status updated');
      setReplyingTo(null);
      setAdminReply('');
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (id) => reviewService.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-reviews']);
      toast.success('Review deleted permanently');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error deleting review')
  });

  const stats = useMemo(() => {
    if (!reviews) return { total: 0, pending: 0, avg: 0 };
    const total = reviews.length;
    const pending = reviews.filter(r => r.status === 'pending').length;
    const avg = (reviews.reduce((acc, r) => acc + r.rating, 0) / total || 0).toFixed(1);
    return { total, pending, avg };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (!reviews) return [];
    return reviews.filter(r => {
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      const matchRating = filterRating === 'all' || r.rating === parseInt(filterRating);
      const matchSearch = r.productId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchRating && matchSearch;
    });
  }, [reviews, filterStatus, searchQuery, filterRating]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-premium-gold" size={40} /></div>;

  return (
    <div className="space-y-8">
      <Helmet><title>Product Reviews — Admin</title></Helmet>

      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-charcoal tracking-tight">Customer Reviews</h1>
          <p className="text-text-muted text-sm font-medium">Moderate and respond to product feedback</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl border border-border-light shadow-sm flex items-center gap-4 min-w-[140px]">
            <div className="w-10 h-10 bg-premium-gold/10 rounded-xl flex items-center justify-center text-premium-gold"><BarChart3 size={20} /></div>
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Avg Rating</p>
              <p className="text-xl font-black text-charcoal">{stats.avg}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-border-light shadow-sm flex items-center gap-4 min-w-[140px]">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><AlertCircle size={20} /></div>
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Pending</p>
              <p className="text-xl font-black text-charcoal">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-[2rem] border border-border-light shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            className="w-full pl-12 pr-4 py-3 bg-light-bg border-none rounded-xl text-sm focus:ring-2 focus:ring-premium-gold/30 font-medium"
            placeholder="Search by product or customer name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select 
            className="flex-1 md:w-40 bg-light-bg border-none rounded-xl text-xs font-black uppercase tracking-widest px-4 py-3 cursor-pointer"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select 
            className="flex-1 md:w-40 bg-light-bg border-none rounded-xl text-xs font-black uppercase tracking-widest px-4 py-3 cursor-pointer"
            value={filterRating}
            onChange={e => setFilterRating(e.target.value)}
          >
            <option value="all">All Ratings</option>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
          </select>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid gap-6">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-border-light">
            <MessageCircle className="mx-auto text-text-muted/20 mb-4" size={64} />
            <p className="text-xl font-black text-charcoal uppercase tracking-widest">No reviews found</p>
            <p className="text-text-muted font-medium mt-2">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          filteredReviews.map(review => (
            <div key={review._id} className="bg-white p-6 md:p-8 rounded-[3rem] border border-border-light shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
              <div className="relative z-10 space-y-6">
                {/* Product & Customer Info */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-border-light pb-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-light-bg rounded-2xl overflow-hidden p-1 flex-shrink-0">
                      <SafeImage src={review.productId?.images?.[0]} alt="product" className="w-full h-full object-contain" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-black text-charcoal uppercase tracking-tight text-sm line-clamp-1">{review.productId?.name}</h3>
                      <div className="flex gap-0.5 text-premium-gold">
                        {[1, 2, 3, 4, 5].map(n => <Star key={n} size={10} fill={n <= review.rating ? 'currentColor' : 'none'} strokeWidth={2.5} />)}
                      </div>
                      <span className="text-xs font-black text-charcoal tracking-widest uppercase block mt-1">by {review.userId?.name}</span>
                      {review.isVerifiedPurchase && (
                        <div className="flex items-center gap-1 bg-green-50 text-green-700 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-green-100 mt-1 w-fit">
                          <CheckCircle size={10} /> Verified Purchase
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-left md:text-right space-y-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      review.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 
                      review.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : 
                      'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {review.status}
                    </span>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                    <div className="flex items-center justify-end gap-3 pt-2">
                       <span className="text-[10px] font-black text-green-600 flex items-center gap-1">👍 {review.likes || 0}</span>
                       <span className="text-[10px] font-black text-red-600 flex items-center gap-1">👎 {review.dislikes || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-light-bg/50 p-6 rounded-3xl border border-border-light relative italic text-charcoal font-medium leading-relaxed">
                  <span className="absolute -top-3 left-6 text-4xl text-premium-gold/20 font-serif">“</span>
                  {review.comment}
                  <span className="absolute -bottom-6 right-6 text-4xl text-premium-gold/20 font-serif">”</span>
                </div>

                {/* Images in Review */}
                {review.images?.length > 0 && (
                  <div className="flex gap-2 pt-2">
                    {review.images.map((img, i) => (
                      <SafeImage key={i} src={img} alt="review" className="w-16 h-16 object-cover rounded-xl border border-border-light shadow-sm" />
                    ))}
                  </div>
                )}

                {review.adminReply?.message && (
                  <div className="bg-premium-gold/5 p-6 rounded-3xl border border-dashed border-premium-gold/30">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="text-premium-gold" size={14} />
                      <p className="text-[10px] font-black text-premium-gold uppercase tracking-[0.2em]">Magizhchi Team Response</p>
                    </div>
                    <p className="text-sm text-charcoal font-bold">{review.adminReply.message}</p>
                  </div>
                )}

                {/* Actions */}
                {replyingTo === review._id ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-6 bg-charcoal rounded-[2rem] space-y-4 shadow-xl">
                    <p className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Respond to Customer</p>
                    <textarea 
                      className="w-full bg-white/10 border-none rounded-2xl p-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-premium-gold font-medium resize-none"
                      rows="3"
                      placeholder="Type your response here..."
                      value={adminReply}
                      onChange={e => setAdminReply(e.target.value)}
                    />
                    <div className="flex gap-3">
                      <button 
                        onClick={() => updateStatusMutation.mutate({ id: review._id, status: 'approved', reply: adminReply })}
                        className="flex-1 bg-premium-gold text-charcoal font-black text-[10px] uppercase tracking-widest py-3 rounded-xl hover:scale-105 transition-all"
                      >
                        Approve & Send
                      </button>
                      <button onClick={() => setReplyingTo(null)} className="px-6 py-3 bg-white/5 text-white/60 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all">Cancel</button>
                    </div>
                  </motion.div>
                ) : (
                    <div className="flex flex-wrap items-center gap-3 pt-4">
                      {review.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => updateStatusMutation.mutate({ id: review._id, status: 'approved' })}
                            className="flex-1 md:flex-none px-6 py-3 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button 
                            onClick={() => updateStatusMutation.mutate({ id: review._id, status: 'rejected' })}
                            className="flex-1 md:flex-none px-6 py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </>
                      )}
                      {!review.adminReply?.message && (
                        <button 
                          onClick={() => setReplyingTo(review._id)}
                          className="w-full md:w-auto px-6 py-3 bg-charcoal text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-premium-gold hover:text-charcoal transition-all flex items-center justify-center gap-2"
                        >
                          <MessageCircle size={14} /> Official Response
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to PERMANENTLY DELETE this review? This will also remove its impact on the product rating.')) {
                            deleteReviewMutation.mutate(review._id);
                          }
                        }}
                        className="w-full md:w-auto px-6 py-3 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 md:ml-auto border border-red-100"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                )}
            </div>
          </div>
        ))
      )}
      </div>
    </div>
  );
}
