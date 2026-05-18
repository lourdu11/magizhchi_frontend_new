import { LazyLoadImage } from 'react-lazy-load-image-component';
import { resolveAssetURL, getPlaceholder } from '../../utils/assetResolver';

/**
 * SafeImage Component
 * Automatically resolves asset URLs, handles HTTPS upgrades,
 * and provides a fallback placeholder if the image fails to load.
 */
export default function SafeImage({ src, alt, className, width, height, quality, gravity, crop, aspect, ...props }) {
  const resolvedSrc = resolveAssetURL(src, width, quality, { gravity, crop, aspect });

  return (
    <LazyLoadImage
      src={resolvedSrc}
      alt={alt || 'Magizhchi Garments Asset'}
      className={className}
      width={width}
      height={height}
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
