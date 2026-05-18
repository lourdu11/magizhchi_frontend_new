/**
 * Centralized Asset URL Resolver
 * Handles environment-safe URL construction for all images and static assets.
 */

const VITE_API_URL = import.meta.env.VITE_API_URL || 'https://magizhchi-backend-28sx.onrender.com/api/v1';
const API_BASE = VITE_API_URL;
const PLACEHOLDER = 'https://placehold.co/600x800/1A1A1A/D4AF37?text=Magizhchi+Garments';

/**
 * Resolves a full URL for any asset path.
 */
export const resolveAssetURL = (path, width = null, quality = 80, options = {}) => {
  if (!path) return PLACEHOLDER;

  // 1. If it's already a full URL (HTTPS), return as is
  if (typeof path === 'string' && path.startsWith('http')) {
    let resolved = path;
    if (!path.includes('localhost') && !path.includes('127.0.0.1')) {
      resolved = path.replace('http://', 'https://');
    }
    
    // Cloudinary Optimizations & Smart Cropping
    if (resolved.includes('res.cloudinary.com') && resolved.includes('/upload/')) {
      const { gravity, crop, aspect } = options;
      let transforms = `f_auto,q_${quality}`;
      
      if (width) transforms += `,w_${width}`;
      if (crop) transforms += `,c_${crop}`;
      if (gravity) transforms += `,g_${gravity}`;
      if (aspect) transforms += `,ar_${aspect}`;
      
      resolved = resolved.replace('/upload/', `/upload/${transforms}/`);
    }
    return resolved;
  }

  // 2. Handle relative paths or filenames
  const cleanPath = typeof path === 'string' ? path.trim() : '';
  if (!cleanPath) return PLACEHOLDER;

  // ImageKit Base for Magizhchi
  const IK_BASE = 'https://ik.imagekit.io/Lourdu/magizhchi_garments';

  // If it's a relative path starting with /uploads or just a filename
  // Map local paths to ImageKit CDN for optimization
  if (cleanPath.startsWith('/uploads/')) {
    return `${IK_BASE}${cleanPath}`;
  }

  if (cleanPath.startsWith('uploads/')) {
    return `${IK_BASE}/${cleanPath}`;
  }

  // Default: assume it's a filename in uploads and route through IK
  return `${IK_BASE}/uploads/${cleanPath}`;
};

export const getPlaceholder = () => PLACEHOLDER;
