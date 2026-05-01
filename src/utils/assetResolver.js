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
export const resolveAssetURL = (path) => {
  if (!path) return PLACEHOLDER;

  // 1. If it's already a full URL (HTTPS), return as is
  if (path.startsWith('http')) {
    // Only upgrade to HTTPS if it's NOT a local address
    if (!path.includes('localhost') && !path.includes('127.0.0.1')) {
      return path.replace('http://', 'https://');
    }
    return path;
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
