/**
 * Centralized Asset URL Resolver
 * Handles environment-safe URL construction for all images and static assets.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';
const PLACEHOLDER = 'https://placehold.co/600x800/1A1A1A/D4AF37?text=Magizhchi+Garments';

/**
 * Resolves a full URL for any asset path.
 * Supports:
 * - Full URLs (Cloudinary/ImageKit)
 * - Relative paths (/uploads/...)
 * - Local dev paths
 */
export const resolveAssetURL = (path, width = null, quality = 80) => {
  if (!path) return PLACEHOLDER;

  // 1. If it's already a full URL (HTTPS), return as is
  if (path.startsWith('http')) {
    let resolved = path;
    // Only upgrade to HTTPS if it's NOT a local address
    if (!path.includes('localhost') && !path.includes('127.0.0.1')) {
      resolved = path.replace('http://', 'https://');
    }
    
    // Inject Cloudinary Optimizations
    if (resolved.includes('res.cloudinary.com') && resolved.includes('/upload/')) {
      const transformations = width ? `f_auto,q_${quality},w_${width}/` : `f_auto,q_${quality}/`;
      resolved = resolved.replace('/upload/', `/upload/${transformations}`);
    }
    
    // Inject ImageKit Optimizations
    if (resolved.includes('ik.imagekit.io')) {
      const ikTransform = width ? `tr=f-auto,q-${quality},w-${width}` : `tr=f-auto,q-${quality}`;
      if (!resolved.includes('tr=')) {
        const separator = resolved.includes('?') ? '&' : '?';
        resolved = `${resolved}${separator}${ikTransform}`;
      } else {
        // Replace existing tr if needed or just append quality/format
        if (!resolved.includes('f-auto')) {
          resolved = resolved.replace('tr=', 'tr=f-auto,');
        }
        if (quality && !resolved.includes('q-')) {
          resolved = resolved.replace('tr=', `tr=q-${quality},`);
        }
        if (width && !resolved.includes('w-')) {
          resolved = resolved.replace('tr=', `tr=w-${width},`);
        }
      }
    }
    
    return resolved;
  }

  // 2. If it's a relative upload path starting with /uploads
  // In production, these should be prefixed with the API URL if they are served by the backend
  // OR if using Cloudinary, the full URL is already handled in step 1.
  if (path.startsWith('/uploads')) {
    const baseUrl = API_BASE.replace('/v1', '');
    return `${baseUrl}${path}`;
  }

  // 3. If it's a raw filename from the database (e.g. "product-123.jpg")
  if (path && !path.includes('/') && !path.includes('.')) {
    return `/uploads/${path}`;
  }

  // 4. Default: assume it might be a relative path without leading slash
  if (path && !path.startsWith('http') && !path.startsWith('/')) {
    return `/uploads/${path}`;
  }

  // 5. Fallback to original path or placeholder
  return path || PLACEHOLDER;
};

export const getPlaceholder = () => PLACEHOLDER;
