import { resolveAssetURL, getPlaceholder } from '../../utils/assetResolver';

/**
 * SafeImage Component
 * Automatically resolves asset URLs, handles HTTPS upgrades,
 * and provides a fallback placeholder if the image fails to load.
 */
export default function SafeImage({ src, alt, className, width, ...props }) {
  const resolvedSrc = resolveAssetURL(src, width);

  return (
    <img
      src={resolvedSrc}
      alt={alt || 'Magizhchi Garments Asset'}
      className={className}
      width={width}
      height={props.height}
      loading={props.loading || "lazy"}
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
