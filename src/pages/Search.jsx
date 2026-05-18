import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, X, Loader2, ArrowRight } from 'lucide-react';
import { useState } from 'react';

import { productService } from '../services';
import ProductCard from '../components/product/ProductCard';
import { Helmet } from 'react-helmet-async';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [localQ, setLocalQ] = useState(q);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', q],
    queryFn: () => productService.searchProducts(q).then(r => r.data.data),
    enabled: q.length > 1,
    placeholderData: (prev) => prev,
  });

  const products = data?.products || data || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (localQ.trim()) setSearchParams({ q: localQ.trim() });
  };

  return (
    <div className="container-custom py-12">
      <Helmet>
        <title>{q ? `"${q}" — Search` : 'Search'} — Magizhchi</title>
      </Helmet>

      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mb-10">
        <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
        <input
          className="w-full bg-white border-2 border-border-light rounded-2xl pl-14 pr-14 py-4 text-lg focus:outline-none focus:border-premium-gold transition-colors shadow-sm"
          placeholder="Search products, categories..."
          value={localQ}
          onChange={e => setLocalQ(e.target.value)}
          autoFocus
        />
        {localQ && (
          <button type="button" onClick={() => { setLocalQ(''); setSearchParams({}); }} className="absolute right-14 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        )}
        <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-charcoal text-white rounded-xl hover:bg-premium-gold hover:text-charcoal transition-all">
          <ArrowRight size={18} />
        </button>
      </form>

      {/* No query state */}
      {!q && (
        <div className="text-center py-16">
          <SearchIcon size={56} className="mx-auto text-border-light mb-4" />
          <p className="text-text-muted text-lg">Start typing to search for products</p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['Shirts', 'T-Shirts', 'Jeans', 'Trousers', 'Formals'].map(s => (
              <button key={s} onClick={() => { setLocalQ(s); setSearchParams({ q: s }); }} className="px-4 py-2 bg-light-bg border border-border-light rounded-full text-sm font-semibold text-text-muted hover:text-text-primary hover:border-premium-gold transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {q && (isLoading || isFetching) && (
        <div className="flex flex-col items-center justify-center py-16 w-full">
          {/* Luxury Gold Spinner */}
          <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-charcoal/5" />
            <div className="absolute inset-0 rounded-full border-4 border-t-premium-gold border-r-premium-gold animate-spin" style={{ animationDuration: '0.8s' }} />
            <div className="absolute w-12 h-12 bg-black rounded-full border border-premium-gold/20 flex items-center justify-center shadow-lg overflow-hidden animate-pulse">
              <img 
                src="/receipt_logo.jpg" 
                alt="Magizhchi" 
                className="w-full h-full object-cover scale-[1.02]" 
              />
            </div>
          </div>
          <h3 className="text-lg font-bold text-charcoal tracking-wide mb-1 animate-pulse">
            Searching Magizhchi Catalog...
          </h3>
          <p className="text-xs text-text-muted font-bold tracking-widest uppercase animate-pulse">
            Finding the best match for you
          </p>
        </div>
      )}

      {/* Results */}
      {q && !isLoading && (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-text-muted">
              {products.length > 0
                ? <><strong className="text-text-primary">{products.length}</strong> result{products.length !== 1 ? 's' : ''} for <strong className="text-text-primary">"{q}"</strong></>
                : <>No results for <strong className="text-text-primary">"{q}"</strong></>
              }
            </p>
          </div>

          {products.length === 0 && (
            <div className="py-16 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-text-primary mb-2">No products found</h3>
              <p className="text-text-muted mb-6">Try different keywords or browse our collections</p>
              <Link to="/collections" className="btn-primary">Browse All Products</Link>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </>
      )}
    </div>
  );
}
