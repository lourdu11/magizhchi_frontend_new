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

  // Auto-generate responsive srcset and sizes when dealing with CDN assets
  let srcSetProps = {};
  if (src && typeof src === 'string' && (src.includes('ik.imagekit.io') || src.includes('res.cloudinary.com'))) {
    const widths = [375, 640, 768, 1024, 1280, 1536, 1920];
    const srcSetList = widths.map(w => {
      // Scale height/aspect accordingly if options present
      return `${resolveAssetURL(src, w, quality || 80, { gravity, crop, aspect })} ${w}w`;
    });
    srcSetProps = {
      srcSet: srcSetList.join(', '),
      sizes: props.sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
    };
  }

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
        {...srcSetProps}
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
      {...srcSetProps}
      {...props}
    />
  );
}
