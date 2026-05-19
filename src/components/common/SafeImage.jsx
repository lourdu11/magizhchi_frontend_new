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
    const widths = [180, 240, 320, 400, 480, 640, 768, 960, 1100, 1280, 1500, 1920];
    const srcSetList = widths.map(w => {
      const targetQuality = quality || (w <= 400 ? 55 : (w <= 960 ? 60 : 70));
      // Scale height/aspect accordingly if options present
      return `${resolveAssetURL(src, w, targetQuality, { gravity, crop, aspect, height })} ${w}w`;
    });

    // Smart default sizes based on target width
    let defaultSizes = '(max-width: 640px) 100vw, 100vw'; // Default for large banners
    const numWidth = width ? parseInt(width, 10) : null;
    if (numWidth && numWidth <= 500) {
      // For grid cards (Category Spotlight, Product Grid columns)
      defaultSizes = `(max-width: 640px) 50vw, (max-width: 1024px) 25vw, ${numWidth}px`;
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
