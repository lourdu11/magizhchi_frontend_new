import { resolveAssetURL, getPlaceholder } from '../../utils/assetResolver';

/**
 * SafeImage Component
 * Automatically resolves asset URLs, handles HTTPS upgrades,
 * and provides a fallback placeholder if the image fails to load.
 */
export default function SafeImage({ src, alt, className, ...props }) {
  const resolvedSrc = resolveAssetURL(src);

  return (
    <img
      src={resolvedSrc}
      alt={alt || ''}
      className={className}
      loading="lazy"
      onError={(e) => {
        if (e.target.src !== getPlaceholder()) {
          e.target.src = getPlaceholder();
        }
      }}
      {...props}
    />
  );
}
