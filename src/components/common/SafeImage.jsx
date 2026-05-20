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
    const widths = [320, 480, 768, 1024, 1440];
    const baseQuality = quality ? parseInt(quality, 10) : 65;
    const numWidth = width ? parseInt(width, 10) : null;
    const numHeight = height ? parseInt(height, 10) : null;
    const srcSetList = widths.map(w => {
      // Intelligently scale down image compression quality for smaller mobile size viewports
      const targetQuality = w <= 240 ? Math.min(baseQuality, 45) : (w <= 480 ? Math.min(baseQuality, 50) : (w <= 960 ? Math.min(baseQuality, 60) : baseQuality));
      // Proportionally scale height to maintain matching aspect ratio across all candidates
      const scaledHeight = numHeight && numWidth ? Math.round((numHeight / numWidth) * w) : undefined;
      return `${resolveAssetURL(src, w, targetQuality, { gravity, crop, aspect, height: scaledHeight })} ${w}w`;
    });

    // Smart default sizes based on target width
    let defaultSizes = '(max-width: 640px) 100vw, 100vw'; // Default for large banners

    if (numWidth && numWidth <= 500) {
      // Grid cards (Category Spotlight, Product Grid columns) are rendered in 2-column on mobile and 4-column on desktop.
      // On large desktop viewports, columns are constrained by the max container bounds (260px width per card).
      defaultSizes = `(max-width: 640px) 50vw, (max-width: 1024px) 25vw, ${Math.min(numWidth, 260)}px`;
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
