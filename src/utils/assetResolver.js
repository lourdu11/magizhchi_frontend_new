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
export const resolveAssetURL = (path, width = null, quality = 70, options = {}) => {
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
    
    // ImageKit Optimizations & Dynamic Resizing
    if (resolved.includes('ik.imagekit.io')) {
      try {
        const urlObj = new URL(resolved);
        const { gravity, crop, aspect, height } = options;
        let transformParts = [];
        if (width) transformParts.push(`w-${width}`);
        if (height) transformParts.push(`h-${height}`);
        transformParts.push(`q-${quality}`);
        transformParts.push(`f-auto`); // WebP/AVIF auto fallback
        
        if (transformParts.length > 0) {
          urlObj.searchParams.set('tr', transformParts.join(','));
        }
        resolved = urlObj.toString().replace(/%2C/g, ',');
      } catch (err) {
        // Fallback if URL parsing fails
        resolved = resolved + (resolved.includes('?') ? '&' : '?') + `tr=w-${width || 800},q-${quality},f-auto`;
      }
    }

    // Unsplash Optimizations & Dynamic Resizing
    if (resolved.includes('images.unsplash.com')) {
      try {
        const urlObj = new URL(resolved);
        if (width) urlObj.searchParams.set('w', width.toString());
        const { height } = options;
        if (height) urlObj.searchParams.set('h', height.toString());
        urlObj.searchParams.set('q', (quality || 60).toString());
        urlObj.searchParams.set('auto', 'format');
        urlObj.searchParams.set('fit', 'crop');
        resolved = urlObj.toString();
      } catch (err) {
        // Fallback
      }
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
  let resolvedLocal = '';
  if (cleanPath.startsWith('/uploads/')) {
    resolvedLocal = `${IK_BASE}${cleanPath}`;
  } else if (cleanPath.startsWith('uploads/')) {
    resolvedLocal = `${IK_BASE}/${cleanPath}`;
  } else {
    resolvedLocal = `${IK_BASE}/uploads/${cleanPath}`;
  }

  // Apply ImageKit transformations for resolved local path
  try {
    const urlObj = new URL(resolvedLocal);
    const { gravity, crop, aspect, height } = options;
    let transformParts = [];
    if (width) transformParts.push(`w-${width}`);
    if (height) transformParts.push(`h-${height}`);
    transformParts.push(`q-${quality}`);
    transformParts.push(`f-auto`);
    
    if (transformParts.length > 0) {
      urlObj.searchParams.set('tr', transformParts.join(','));
    }
    resolvedLocal = urlObj.toString().replace(/%2C/g, ',');
  } catch (err) {
    resolvedLocal = resolvedLocal + (resolvedLocal.includes('?') ? '&' : '?') + `tr=w-${width || 800},q-${quality},f-auto`;
  }

  return resolvedLocal;
};

export const getPlaceholder = () => PLACEHOLDER;
