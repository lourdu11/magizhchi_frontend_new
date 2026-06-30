import React from 'react';
import { Package, Layers, Plus, ShoppingCart, RotateCcw, Trash2, Edit3, Archive, Globe } from 'lucide-react';
import SafeImage from '../common/SafeImage';

export default function ProductListItem({ product, onEdit, onDelete, onRestore, onPurge, onQuickStock }) {
  return (
    <div className={`bg-white p-4 rounded-3xl border border-border-light shadow-sm group hover:shadow-lg transition-all flex flex-col md:flex-row items-center gap-6 ${(product.isDeleted || product.isArchived) ? 'opacity-75 grayscale-[0.5]' : ''}`}>
      
      {/* ── IMAGE SECTION ── */}
      <div className="w-full md:w-32 h-32 rounded-2xl bg-light-bg relative overflow-hidden shrink-0">
        <SafeImage src={product.images?.[0] || product.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute top-2 left-2">
           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shadow-sm border ${product.productNature === 'combo' ? 'bg-premium-gold text-charcoal border-premium-gold/50' : 'bg-charcoal text-white border-charcoal/50'}`}>
              {product.productNature === 'combo' ? 'Bundle' : (product.category?.name || 'General')}
           </span>
        </div>
      </div>

      {/* ── DETAILS SECTION ── */}
      <div className="flex-1 min-w-0 w-full flex flex-col sm:flex-row justify-between gap-6">
        
        {/* Basic Info */}
        <div className="flex-1">
          <h4 className="text-lg sm:text-xl font-black text-charcoal tracking-tight group-hover:text-premium-gold transition-colors truncate">
            {product.name}
          </h4>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
            {product.sku || 'REF-N/A'}
          </p>
          
          <div className="flex items-center flex-wrap gap-2 mt-3">
            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${product.isOnlineProduct ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-light-bg text-text-muted border border-border-light'}`}>
               <Globe size={12} /> {product.isOnlineProduct ? 'Web Active' : 'Web Off'}
            </span>
            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${product.isBillingProduct ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-light-bg text-text-muted border border-border-light'}`}>
               <ShoppingCart size={12} /> {product.isBillingProduct ? 'POS Active' : 'POS Off'}
            </span>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:min-w-[120px] bg-light-bg sm:bg-transparent p-3 sm:p-0 rounded-2xl sm:rounded-none">
          <div className="text-left sm:text-right">
             <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5">Net Amount</p>
             <span className="text-xl font-black text-charcoal leading-none">₹{product.discountPercentage > 0 ? product.discountedPrice : product.sellingPrice}</span>
             {product.discountPercentage > 0 && (
                <div className="flex items-center gap-1 mt-1">
                   <span className="text-[9px] text-text-muted font-bold line-through">₹{product.sellingPrice}</span>
                   <span className="text-[7px] text-red-500 font-black uppercase tracking-widest bg-red-50 px-1 py-0.5 rounded">-{product.discountPercentage}%</span>
                </div>
             )}
          </div>
          <div className="h-8 w-px bg-border-light sm:hidden" />
          <div className="text-right flex flex-col items-end">
             <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Live Stock</span>
             <div className="flex items-center gap-1.5 bg-white sm:bg-light-bg px-2 py-1 rounded-lg border border-border-light">
                <span className={`w-2 h-2 rounded-full ${(product.liveStock?.availableStock ?? product.availableStock) > product.lowStockThreshold ? 'bg-green-500' : (product.liveStock?.availableStock ?? product.availableStock) > 0 ? 'bg-orange-500' : 'bg-red-500'}`} />
                <span className="text-sm font-black text-charcoal leading-none">{product.liveStock?.availableStock ?? product.availableStock} <span className="text-[9px] text-text-muted">PCS</span></span>
             </div>
          </div>
        </div>
      </div>

      {/* ── ACTIONS SECTION ── */}
      <div className="flex items-center justify-end gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-none border-border-light">
        <button 
           onClick={() => onQuickStock(product)}
           className="p-3 bg-light-bg text-charcoal rounded-xl hover:bg-charcoal hover:text-white transition-all shadow-sm"
           title="Quick Stock Entry"
        >
           <Plus size={16} />
        </button>
        
        {(product.isDeleted || product.isArchived) ? (
           <>
              <button onClick={onRestore} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm" title="Restore Product">
                 <RotateCcw size={16} />
              </button>
              <button onClick={onPurge} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm" title="PERMANENT DELETE">
                 <Trash2 size={16} />
              </button>
           </>
        ) : (
           <>
              <button onClick={onEdit} className="p-3 bg-light-bg text-charcoal rounded-xl hover:bg-premium-gold hover:text-charcoal transition-all shadow-sm" title="Edit Profile">
                 <Edit3 size={16} />
              </button>
              <button onClick={onDelete} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Archive Profile">
                 <Archive size={16} />
              </button>
           </>
        )}
      </div>

    </div>
  );
}
