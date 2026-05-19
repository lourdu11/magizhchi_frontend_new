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
  height,
  quality, 
  gravity, 
  crop, 
  aspect, 
  loading, 
  fetchPriority, 
  fetchpriority, 
  priority, 
  sizes,
  ...props 
}) {
  const resolvedSrc = resolveAssetURL(src, width, quality, { gravity, crop, aspect, height });

  const isPriority = priority || loading === 'eager' || fetchPriority === 'high' || fetchpriority === 'high';

  // Auto-generate responsive srcset and sizes when dealing with CDN assets
  let srcSetProps = {};
  const isSmall = width && parseInt(width, 10) <= 150;
  if (!isSmall && src && typeof src === 'string' && (src.includes('ik.imagekit.io') || src.includes('res.cloudinary.com') || src.includes('images.unsplash.com'))) {
    const widths = [375, 640, 768, 1024, 1280, 1536, 1920];
    const srcSetList = widths.map(w => {
      // Scale height/aspect accordingly if options present
      return `${resolveAssetURL(src, w, quality || 70, { gravity, crop, aspect, height })} ${w}w`;
    });

    // Smart default sizes based on target width
    let defaultSizes = '(max-width: 640px) 100vw, 100vw'; // Default for large banners
    const numWidth = width ? parseInt(width, 10) : null;
    if (numWidth && numWidth <= 500) {
      // For grid cards, product thumbnails, etc.
      defaultSizes = `(max-width: 640px) 50vw, (max-width: 1024px) 33vw, ${numWidth}px`;
    }

    srcSetProps = {
      srcSet: srcSetList.join(', '),
      sizes: sizes || defaultSizes
    };
  }

  if (isPriority) {
    return (
      <img
        src={resolvedSrc}
        alt={alt || 'Magizhchi Garments Asset'}
        className={className}
        width={width}
        height={height}
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
    <img
      src={resolvedSrc}
      alt={alt || 'Magizhchi Garments Asset'}
      className={className}
      width={width}
      height={height}
      loading="lazy"
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
