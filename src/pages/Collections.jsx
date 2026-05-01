import { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars

import { Grid2X2, List, ChevronDown, X, SlidersHorizontal, Search, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { productService, categoryService } from '../services';
import ProductCard from '../components/product/ProductCard';


const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: '-salesCount', label: 'Best Sellers' },
  { value: '-ratings.average', label: 'Top Rated' },
];

const SIZES = ['S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40'];
const PRICE_RANGES = [
  { label: 'Under Rs.500', min: 0, max: 500 },
  { label: 'Rs.500 – Rs.1000', min: 500, max: 1000 },
  { label: 'Rs.1000 – Rs.2000', min: 1000, max: 2000 },
  { label: 'Rs.2000 – Rs.5000', min: 2000, max: 5000 },
  { label: 'Above Rs.5000', min: 5000, max: 99999 },
];



function FilterPanel({ categoriesData, category, selectedSizes, minPrice, maxPrice, toggleSize, updateParams, clearFilters, hasFilters }) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wide mb-3">Categories</h3>
        <ul className="space-y-2">
          <li>
            <a href="/collections" className={`text-sm transition-colors hover:text-premium-gold ${!category ? 'text-premium-gold font-semibold' : 'text-text-secondary'}`}>
              All Products
            </a>
          </li>
          {categoriesData?.map(cat => (
            <li key={cat._id}>
              <a href={`/collections/${cat.slug}`}
                className={`text-sm transition-colors hover:text-premium-gold ${category === cat.slug ? 'text-premium-gold font-semibold' : 'text-text-secondary'}`}>
                {cat.name}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wide mb-3">Price Range</h3>
        <div className="space-y-2">
          {PRICE_RANGES.map(range => {
            const isChecked = minPrice !== '' && maxPrice !== '' && 
                            Number(minPrice) === range.min && 
                            Number(maxPrice) === range.max;
            return (
              <label key={range.label} className="flex items-center gap-3 cursor-pointer group py-1">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isChecked ? 'border-premium-gold bg-premium-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'border-border-dark group-hover:border-premium-gold'}`}>
                  {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-primary-black" />}
                </div>

                <input type="radio" name="price"
                  checked={isChecked}
                  onChange={() => updateParams({ minPrice: range.min, maxPrice: range.max })}
                  className="hidden"
                />
                <span className={`text-sm transition-colors ${isChecked ? 'text-premium-gold font-black' : 'text-text-secondary font-medium group-hover:text-charcoal'}`}>
                  {range.label}
                </span>
              </label>
            );
          })}
          <label className="flex items-center gap-3 cursor-pointer group py-1">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${(!minPrice && !maxPrice) ? 'border-premium-gold bg-premium-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'border-border-dark group-hover:border-premium-gold'}`}>
              {(!minPrice && !maxPrice) && <div className="w-1.5 h-1.5 rounded-full bg-primary-black" />}
            </div>
            <input type="radio" name="price" checked={!minPrice && !maxPrice}
              onChange={() => updateParams({ minPrice: '', maxPrice: '' })}
              className="hidden"
            />
            <span className={`text-sm transition-colors ${(!minPrice && !maxPrice) ? 'text-premium-gold font-black' : 'text-text-secondary font-medium group-hover:text-charcoal'}`}>
              All Prices
            </span>
          </label>
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wide mb-3">Sizes</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map(size => (
            <button key={size} onClick={() => toggleSize(size)}
              className={`px-3 py-1.5 text-xs font-semibold border rounded transition-all duration-150 ${selectedSizes.includes(size) ? 'bg-primary-black text-white border-primary-black' : 'border-border-dark text-text-secondary hover:border-primary-black'}`}>
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Clear */}
      {hasFilters && (
        <button onClick={clearFilters} className="w-full py-2 text-sm text-stock-out border border-stock-out/30 rounded-lg hover:bg-stock-out/5 transition-colors">
          Clear All Filters
        </button>
      )}
    </div>
  );
}

export default function Collections() {

  const [searchParams, setSearchParams] = useSearchParams();
  const { category } = useParams();
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || '-createdAt';
  const selectedSizes = searchParams.get('size')?.split(',').filter(Boolean) || [];
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const initialSearch = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(initialSearch);

  // Sync local search input with URL search param
  useEffect(() => {
    setSearchInput(searchParams.get('search') || '');
  }, [searchParams]);

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (searchParams.get('search') || '')) {
        updateParams({ search: searchInput });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateParams = (updates) => {
    const p = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') p.set(key, value); 
      else p.delete(key);
    });

    // Only reset to page 1 if we are NOT explicitly changing the page
    if (!updates.page) {
      p.set('page', '1');
    }

    // If searching, navigate to global collections (remove category slug)
    if (updates.search && category) {
      navigate(`/collections?${p.toString()}`);
    } else {
      setSearchParams(p);
    }
  };



  const toggleSize = (size) => {
    const current = new Set(selectedSizes);
    current.has(size) ? current.delete(size) : current.add(size);
    updateParams({ size: [...current].join(',') });
  };


  const clearFilters = () => {
    setSearchParams({ page: '1', sort });
    setSearchInput('');
  };

  const hasFilters = selectedSizes.length > 0 || minPrice || maxPrice || searchInput;

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'list', category, Object.fromEntries(searchParams)],
    queryFn: () => productService.getProducts({
      category, page, sort, limit: 20,
      size: selectedSizes.join(',') || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      search: searchParams.get('search') || undefined,
      isFeatured: searchParams.get('isFeatured') || undefined,
      isBestSeller: searchParams.get('isBestSeller') || undefined,
      isNewArrival: searchParams.get('isNewArrival') || undefined,
    }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories().then(r => r.data.data.categories),
  });

  const products = data?.data || [];
  const pagination = data?.pagination;



  return (
    <>
      <Helmet>
        <title>{category ? `${category.charAt(0).toUpperCase() + category.slice(1)} — Magizhchi Garments` : 'All Collections — Magizhchi Garments'}</title>
        <meta name="description" content="Browse our premium men's clothing collection. Filter by size, price, category." />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Page Header */}
        <div className="bg-cream-bg border-b border-border-light py-10">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h1 className="section-title text-4xl md:text-5xl mb-2">
                  {searchInput ? 'Search Results' : (category ? category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ') : 'Our Collections')}
                </h1>
                <p className="text-text-muted text-sm font-medium tracking-wide uppercase">
                  Explore {pagination?.total || 0} premium garments crafted for excellence
                </p>
              </div>

              {/* Collections Search Bar */}
              <div className="w-full md:w-[400px] relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="text-text-muted group-focus-within:text-premium-gold transition-colors" size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Search in collections..."
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-border-light rounded-2xl text-sm font-bold text-charcoal focus:border-premium-gold focus:ring-4 focus:ring-premium-gold/5 transition-all outline-none shadow-sm"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <div className="absolute inset-y-2 right-2">
                   <button 
                     type="button"
                     onClick={() => updateParams({ search: searchInput })}
                     className="h-full px-4 bg-charcoal text-premium-gold rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-premium-gold hover:text-charcoal transition-all active:scale-95"
                   >
                     Search
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container-custom py-8">
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-24">
                  <FilterPanel
                    categoriesData={categoriesData}
                    category={category}
                    selectedSizes={selectedSizes}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    toggleSize={toggleSize}
                    updateParams={updateParams}
                    clearFilters={clearFilters}
                    hasFilters={hasFilters}
                  />

              </div>
            </aside>


            {/* Products Area */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <button onClick={() => setIsFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 btn-outline py-2 text-sm">
                  <SlidersHorizontal size={16} />
                  Filters {hasFilters && <span className="badge-gold text-[10px]">{selectedSizes.length + (minPrice ? 1 : 0)}</span>}
                </button>

                <div className="flex items-center gap-3 ml-auto">
                  {/* Sort */}
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={e => updateParams({ sort: e.target.value })}
                      className="appearance-none pr-8 pl-3 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:border-premium-gold cursor-pointer"
                    >

                      {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>

                  {/* View toggle */}
                  <div className="hidden md:flex border border-border-light rounded-lg overflow-hidden">
                    <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary-black text-white' : 'hover:bg-light-bg text-text-muted'}`}>
                      <Grid2X2 size={16} />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary-black text-white' : 'hover:bg-light-bg text-text-muted'}`}>
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {isLoading ? (
                <div className="h-60 flex items-center justify-center">
                  <Loader2 className="animate-spin text-premium-gold" size={40} />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-24">
                  <p className="text-5xl mb-4">🛍️</p>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">No products found</h3>
                  <p className="text-text-muted mb-6">Try adjusting your filters</p>
                  <button onClick={clearFilters} className="btn-outline">Clear Filters</button>
                </div>
              ) : (
                <div className={`grid gap-4 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'}`}>
                  {products.map(product => <ProductCard key={product._id} product={product} />)}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {page > 1 && (
                    <button onClick={() => updateParams({ page: page - 1 })} className="btn-ghost border border-border-light px-4 py-2">Prev</button>
                  )}
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, pagination.pages - 4)) + i;
                    return (
                      <button key={p} onClick={() => updateParams({ page: p })}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${p === page ? 'bg-primary-black text-white' : 'border border-border-light hover:border-premium-gold'}`}>
                        {p}
                      </button>
                    );
                  })}
                  {page < pagination.pages && (
                    <button onClick={() => updateParams({ page: page + 1 })} className="btn-ghost border border-border-light px-4 py-2">Next</button>
                  )}

                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {isFilterOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsFilterOpen(false)} />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.3 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto lg:hidden">
                <div className="flex items-center justify-between p-4 border-b border-border-light sticky top-0 bg-white">
                  <h3 className="font-semibold text-text-primary">Filters</h3>
                  <button onClick={() => setIsFilterOpen(false)}><X size={20} /></button>
                </div>
                <div className="p-4">
                  <FilterPanel
                    categoriesData={categoriesData}
                    category={category}
                    selectedSizes={selectedSizes}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    toggleSize={toggleSize}
                    updateParams={updateParams}
                    clearFilters={clearFilters}
                    hasFilters={hasFilters}
                  />

                </div>

                <div className="p-4 border-t border-border-light sticky bottom-0 bg-white">
                  <button onClick={() => setIsFilterOpen(false)} className="btn-primary w-full">Apply Filters</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
