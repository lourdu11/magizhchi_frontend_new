import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, Camera, Loader2, ChevronLeft, ShieldCheck, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { productService, reviewService } from '../services';

export default function WriteReview() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getProduct(slug).then(r => r.data.data.product),
  });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setSelectedFiles(files);
  };

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      let imageUrls = [];
      if (selectedFiles.length > 0) {
        setUploading(true);
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('images', file));
        const uploadRes = await reviewService.uploadImages(formData);
        imageUrls = uploadRes.data.urls;
      }
      return reviewService.createReview({ ...data, productId: product._id, images: imageUrls });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['product-reviews', product._id]);
      queryClient.invalidateQueries(['product', slug]);
      toast.success('Review submitted for approval!');
      navigate(`/product/${slug}`);
    },
    onError: (err) => {
      setUploading(false);
      toast.error(err.response?.data?.message || 'Error submitting review');
    }
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-light-bg"><Loader2 className="animate-spin text-premium-gold" size={48} /></div>;

  return (
    <div className="min-h-screen bg-light-bg py-12 px-4 md:py-20">
      <div className="max-w-3xl mx-auto">
        {/* Navigation & Header */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-charcoal transition-colors mb-8 group"
        >
          <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back to Product</span>
        </button>

        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-border-light">
          {/* Product Quick Info Header */}
          <div className="p-8 md:p-10 bg-charcoal text-white flex flex-col md:flex-row items-center gap-8 border-b border-white/10">
            <div className="w-24 h-24 bg-white rounded-2xl p-2 flex-shrink-0">
              <img src={product?.images?.[0] || '/placeholder.jpg'} alt={product?.name} className="w-full h-full object-contain" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-black tracking-tight uppercase mb-2">{product.name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-1 text-premium-gold text-sm font-bold">
                  {(product?.ratings?.average || 0).toFixed(1)} <Star size={14} fill="currentColor" />
                </div>
                <div className="w-px h-4 bg-white/20" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{product?.ratings?.count || 0} Ratings</span>
              </div>
            </div>
          </div>

          {/* Review Form Area */}
          <div className="p-8 md:p-16 space-y-12">
            {/* Rating Selection */}
            <div className="text-center space-y-6">
              <h2 className="text-sm font-black text-charcoal uppercase tracking-[0.3em]">How would you rate it?</h2>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button 
                    key={num}
                    onClick={() => setRating(num)}
                    className="relative group transition-all hover:scale-110"
                  >
                    <Star 
                      size={48} 
                      fill={num <= rating ? '#16a34a' : 'none'} 
                      stroke={num <= rating ? '#16a34a' : '#E5E7EB'} 
                      strokeWidth={1.5}
                      className="md:w-16 md:h-16 transition-colors duration-300"
                    />
                    <motion.div 
                      initial={false}
                      animate={num === rating ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-600 rounded-full"
                    />
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Terrible'}
              </p>
            </div>

            {/* Inputs Section */}
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4">Review Title</label>
                <input 
                  className="w-full bg-light-bg border-2 border-transparent focus:border-green-600 rounded-2xl px-8 py-5 text-charcoal font-black text-sm placeholder:text-text-muted/40 transition-all uppercase tracking-widest outline-none"
                  placeholder="Summarize your experience..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4">Detailed Feedback</label>
                <textarea 
                  className="w-full bg-light-bg border-2 border-transparent focus:border-green-600 rounded-[2.5rem] p-8 text-charcoal placeholder:text-text-muted/40 focus:ring-0 font-medium resize-none transition-all outline-none"
                  rows="6"
                  placeholder="What did you like or dislike? How was the quality?"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
              </div>

              {/* Photo Upload Area */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4">Add Photos (Optional)</label>
                <div className="p-10 bg-light-bg rounded-[3rem] border-2 border-dashed border-border-light hover:border-green-600/30 transition-all group relative overflow-hidden text-center">
                  <input 
                    type="file" 
                    id="review-images" 
                    multiple 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="review-images" className="cursor-pointer flex flex-col items-center gap-4 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center text-text-muted group-hover:text-green-600 transition-all group-hover:scale-110">
                      <Camera size={32} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-charcoal uppercase tracking-widest mb-1">
                        {selectedFiles.length > 0 ? `${selectedFiles.length} Photos Selected` : 'Click to Upload Photos'}
                      </p>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-60">Max 5 images allowed</p>
                    </div>
                  </label>

                  {selectedFiles.length > 0 && (
                    <div className="flex justify-center gap-3 mt-8 flex-wrap">
                      {selectedFiles.map((file, i) => (
                        <motion.div 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }} 
                          key={i} 
                          className="w-20 h-20 rounded-2xl border-2 border-white overflow-hidden shadow-lg"
                        >
                          <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Rules & Submit */}
            <div className="pt-8 border-t border-border-light flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-3 text-text-muted">
                <ShieldCheck size={20} className="text-green-600" />
                <span className="text-[10px] font-bold uppercase tracking-widest max-w-[200px]">Your review will be verified for authenticity.</span>
              </div>

              <button 
                onClick={() => submitMutation.mutate({ rating, comment, title })}
                disabled={submitMutation.isPending || uploading || !comment.trim()}
                className="w-full md:w-auto min-w-[240px] bg-charcoal text-white py-6 px-12 rounded-full font-black tracking-[0.3em] uppercase text-[10px] hover:bg-green-600 transition-all flex items-center justify-center gap-4 shadow-2xl disabled:opacity-50 hover:scale-105 active:scale-95"
              >
                {submitMutation.isPending || uploading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    {uploading ? 'UPLOADING...' : 'POSTING...'}
                  </>
                ) : (
                  <>
                    SUBMIT REVIEW
                    <CheckCircle size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
