import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { resolveAssetURL, getPlaceholder } from '../../utils/assetResolver';

/**
 * SafeImage Component
 * Automatically resolves asset URLs, handles HTTPS upgrades,
 * and provides a fallback placeholder if the image fails to load.
 */
export default function SafeImage({ src, alt, className, width, quality, ...props }) {
  const resolvedSrc = resolveAssetURL(src, width, quality);

  return (
    <LazyLoadImage
      src={resolvedSrc}
      alt={alt || 'Magizhchi Garments Asset'}
      className={className}
      effect="blur"
      threshold={300}
      wrapperClassName={className}
      onError={(e) => {
        if (e.target.src !== getPlaceholder()) {
          e.target.src = getPlaceholder();
        }
      }}
      {...props}
    />
  );
}
