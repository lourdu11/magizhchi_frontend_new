import { LazyLoadImage } from 'react-lazy-load-image-component';
import { resolveAssetURL, getPlaceholder } from '../../utils/assetResolver';

/**
 * SafeImage Component
 * Automatically resolves asset URLs, handles HTTPS upgrades,
 * and provides a fallback placeholder if the image fails to load.
 */
export default function SafeImage({ 
  src, 
  alt, 
  className, 
  width, 
  quality, 
  gravity, 
  crop, 
  aspect, 
  loading, 
  fetchPriority, 
  fetchpriority, 
  priority, 
  ...props 
}) {
  const resolvedSrc = resolveAssetURL(src, width, quality, { gravity, crop, aspect });

  const isPriority = priority || loading === 'eager' || fetchPriority === 'high' || fetchpriority === 'high';

  if (isPriority) {
    return (
      <img
        src={resolvedSrc}
        alt={alt || 'Magizhchi Garments Asset'}
        className={className}
        loading="eager"
        fetchpriority={fetchPriority || fetchpriority || 'high'}
        decoding="async"
        onError={(e) => {
          if (e.target.src !== getPlaceholder()) {
            e.target.src = getPlaceholder();
          }
        }}
        {...props}
      />
    );
  }

  return (
    <LazyLoadImage
      src={resolvedSrc}
      alt={alt || 'Magizhchi Garments Asset'}
      className={className}
      effect="blur"
      threshold={300}
      wrapperClassName={className}
      style={{ display: 'block' }}
      onError={(e) => {
        if (e.target.src !== getPlaceholder()) {
          e.target.src = getPlaceholder();
        }
      }}
      {...props}
    />
  );
}
