/**
 * Photo Fetcher Service
 * Handles fetching photos from Google Photos shared albums
 * Includes optional KV caching for performance optimization
 *
 * ====================================================================================
 * SUPPORTED TRMNL DEVICE PROFILES (as of January 2026)
 * ====================================================================================
 *
 * The TRMNL ecosystem supports 26+ e-ink devices with different screen sizes,
 * resolutions, and color capabilities. This service optimizes photos for these devices
 * using Google Photos URL parameters (=wWIDTH-hHEIGHT).
 *
 * RESPONSIVE BREAKPOINTS (CSS Logical Dimensions):
 * ----------------------
 * - sm: (600px+)  - Small devices (Kindle 2024 in portrait: 800×480 logical)
 * - md: (800px+)  - Medium devices (TRMNL OG/OG V2: 800×480, most BYOD)
 * - lg: (1024px+) - Large devices (TRMNL X: 1040×780, Kindle Scribe, Kobo, etc.)
 *
 * BIT-DEPTH CAPABILITIES:
 * ----------------------
 * - 1-bit:  Monochrome (2 shades) - TRMNL OG, Waveshare, Inky Impression
 * - 2-bit:  Grayscale (4 shades) - TRMNL OG V2, Seeed, Waveshare 4.26"
 * - 4-bit:  Grayscale (16 shades) - TRMNL X, M5PaperS3, Kobo Aura HD, Kobo Glo, Onyx Boox
 * - 8-bit:  Grayscale (256 shades) - All Kindle devices, Kobo Libra/Aura One, Palma
 * - 24-bit: Full color (16.7M colors) - Tidbyt (64×32px LCD, not e-ink)
 *
 * OFFICIAL TRMNL DEVICES (3 devices):
 * ----------------------
 * 1. TRMNL X (v2)           - 1872×1404px (scale: 1.8), 4-bit, landscape, 1040×780 logical [PRIMARY]
 * 2. TRMNL OG (og_png)      - 800×480px, 1-bit (monochrome), landscape
 * 3. TRMNL OG V2 (og_plus)  - 800×480px, 2-bit (4 shades), landscape
 *
 * KINDLE DEVICES (6 devices):
 * ----------------------
 * 4. Amazon Kindle 2024        - 1400×840px (scale: 1.75), 8-bit, portrait (800×480 logical)
 * 5. Amazon Kindle 7           - 800×600px, 8-bit, portrait (800×600 logical)
 * 6. Amazon Kindle PW 6th Gen  - 1024×768px (scale: 1.28), 8-bit, portrait (800×600 logical)
 * 7. Amazon Kindle PW 7th Gen  - 1448×1072px (scale: 1.6), 8-bit, portrait (905×670 logical)
 * 8. Amazon Kindle Oasis 2     - 1680×1264px (scale: 2.1), 8-bit, portrait (800×602 logical)
 * 9. Amazon Kindle Scribe      - 2480×1860px (scale: 2.5), 8-bit, portrait (992×744 logical) [HIGHEST]
 *
 * BYOD (Bring Your Own Device) - 17+ devices:
 * ----------------------
 * 10. Inkplate 10              - 1200×820px (scale: 1.5), 3-bit, landscape (800×547 logical)
 * 11. Inky Impression 7.3      - 800×480px, 1-bit (color-7a), landscape
 * 12. Inky Impression 13.3     - 1600×1200px (scale: 2.0), 1-bit (color-6a), landscape (800×600 logical)
 * 13. Kobo Libra 2             - 1680×1264px (scale: 2.1), 8-bit, portrait (800×602 logical)
 * 14. Kobo Aura One            - 1872×1404px (scale: 1.8), 8-bit, portrait (1040×780 logical)
 * 15. Kobo Aura HD             - 1440×1080px (scale: 1.8), 4-bit, portrait (800×600 logical)
 * 16. Kobo Glo                 - 1024×768px (scale: 1.3), 4-bit, portrait (788×591 logical)
 * 17. M5PaperS3                - 960×540px, 4-bit, landscape
 * 18. Onyx Boox Go 7           - 1880×1264px (scale: 1.8), 4-bit, portrait (1044×702 logical)
 * 19. Palma                    - 1648×824px (scale: 2.06), 8-bit, landscape (800×400 logical)
 * 20. Seeed E1001 Monochrome   - 800×480px, 2-bit, landscape
 * 21. Seeed E1002 (2-bit)      - 800×480px, 2-bit (color-6a), landscape
 * 22. Waveshare 4.26" (2-bit)  - 800×480px, 2-bit, landscape
 * 23. Waveshare 7.5" B/W       - 800×480px, 1-bit (monochrome), landscape
 * 24. Waveshare 7.5" B/W/R     - 800×480px, 1-bit (color-3bwr), landscape
 * 25. Waveshare 7.5" B/W/R/Y   - 800×480px, 1-bit (color-4bwry), landscape
 * 26. Generic 16:9 Display     - 1920×1080px (scale: 2.4), 8-bit, landscape (800×450 logical)
 * 27. Tidbyt                   - 64×32px, 24-bit full color LCD (not e-ink), landscape
 *
 * ====================================================================================
 * PHOTO OPTIMIZATION STRATEGY:
 * ====================================================================================
 * Default dimensions: 1040×780 (TRMNL X logical size / lg: breakpoint)
 * ----------------------
 * This default targets the primary TRMNL device (TRMNL X) to ensure:
 * 1. Sharp display on the flagship 1040×780 logical screen
 * 2. Optimal quality for 4-bit grayscale (16 shades) rendering
 * 3. Efficient bandwidth usage (not over-optimizing for 2480×1860 Kindle Scribe)
 * 4. Graceful downscaling on md: devices (800×480) via browser/framework
 * 5. Balance between image quality and CDN performance
 *
 * The lg: breakpoint (1024px+) is a key threshold in TRMNL Framework v2. TRMNL X's
 * logical width of 1040px places it firmly in the lg: category, making this an
 * optimal default for responsive layouts that scale: sm: → md: → lg:
 *
 * DEVICE-SPECIFIC OPTIMIZATION EXAMPLES:
 * ----------------------
 * optimizePhotoUrl(url, 800, 480)   // md: TRMNL OG/OG V2 (800×480 logical)
 * optimizePhotoUrl(url, 1040, 780)  // lg: TRMNL X (1040×780 logical) [DEFAULT]
 * optimizePhotoUrl(url, 800, 602)   // lg: Kindle Oasis 2, Kobo Libra 2 (portrait)
 * optimizePhotoUrl(url, 992, 744)   // lg: Kindle Scribe (portrait, highest res)
 * optimizePhotoUrl(url, 1044, 702)  // lg: Onyx Boox Go 7 (portrait)
 *
 * GOOGLE PHOTOS URL PARAMETERS:
 * ----------------------
 * The =wWIDTH-hHEIGHT parameter instructs Google Photos CDN to:
 * - Resize image to fit within specified dimensions (maintains aspect ratio)
 * - Serve optimized file size for e-ink display bandwidth constraints
 * - Cache resized version for subsequent requests (global CDN caching)
 * - No cropping - full image preserved at target size
 *
 * REFERENCE:
 * ----------------------
 * - TRMNL Framework: https://usetrmnl.com/framework/responsive
 * - Device Models API: https://usetrmnl.com/api/models (source of this data)
 * - Breakpoint Guide: https://usetrmnl.com/framework/responsive#size-based-responsive
 * ====================================================================================
 */

import * as GooglePhotosAlbum from 'google-photos-album-image-url-fetch';
import type { GooglePhoto, PhotoData } from '../types';
import { getCachedAlbum, setCachedAlbum } from './cache-service';
import { extractAlbumId } from '../lib/url-parser';
import {
  isValidPhotoUrl,
  sanitizeCaption,
  sanitizeAlbumName,
  validatePhotoCount,
  validateTimestamp,
  validatePhotoData,
} from './security-validator';

/**
 * Fetch photos from a Google Photos shared album
 *
 * @param albumUrl - The shared album URL
 * @param kv - Optional Cloudflare KV namespace for caching
 * @returns Array of photos from the album
 * @throws Error if fetching fails or album is inaccessible
 */
export async function fetchAlbumPhotos(albumUrl: string, kv?: KVNamespace): Promise<GooglePhoto[]> {
  const albumId = extractAlbumId(albumUrl);

  // Validate album ID extraction
  if (!albumId) {
    throw new Error('Invalid album URL: Could not extract album ID');
  }

  // Try to get from cache first (if KV is configured)
  if (kv) {
    const cached = await getCachedAlbum(kv, albumId);
    if (cached && cached.photos) {
      console.log(`Using cached photos for album ${albumId} (${cached.photo_count} photos)`);
      return cached.photos;
    }
  }

  // Cache miss or not configured - fetch from Google Photos API
  console.log(`Fetching photos from Google Photos API for album ${albumId}`);

  try {
    const photos = await GooglePhotosAlbum.fetchImageUrls(albumUrl);

    if (!photos || photos.length === 0) {
      throw new Error(
        'No photos found in album. Ensure the album is publicly shared and contains photos (not videos).'
      );
    }

    // Store in cache for future requests (if KV is configured)
    if (kv) {
      await setCachedAlbum(kv, albumId, photos);
    }

    return photos;
  } catch (error) {
    // Enhance error message for common issues
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        throw new Error('Album not found. The album may have been deleted or made private.');
      }
      if (error.message.includes('403') || error.message.includes('forbidden')) {
        throw new Error('Album access denied. Ensure the album has link sharing enabled.');
      }
      throw error;
    }
    throw new Error('Failed to fetch album photos');
  }
}

/**
 * Select a random photo from an array of photos
 *
 * @param photos - Array of photos to choose from
 * @returns A randomly selected photo
 */
export function selectRandomPhoto(photos: GooglePhoto[]): GooglePhoto {
  if (!photos || photos.length === 0) {
    throw new Error('No photos available to select from');
  }

  const randomIndex = Math.floor(Math.random() * photos.length);
  return photos[randomIndex];
}

/**
 * Optimize photo URL for e-ink display
 * Appends Google Photos URL parameters to resize the image for optimal display
 * across TRMNL devices.
 *
 * DEFAULT DIMENSIONS: 1040×780 (TRMNL X logical size / lg: breakpoint)
 * ---------------------------------------------------------
 * This default targets TRMNL X, the flagship device with the largest logical screen:
 * 1. Physical: 1872×1404px, Logical: 1040×780px (CSS dimensions)
 * 2. Sharp display on 4-bit grayscale (16 shades) without pixelation
 * 3. Efficient bandwidth for e-ink refresh constraints
 * 4. Graceful downscaling on md: devices (800×480) via TRMNL Framework
 * 5. Optimal for lg: breakpoint (1024px+ width threshold)
 *
 * The lg: breakpoint (1024px+) is critical in TRMNL Framework v2. TRMNL X's logical
 * width of 1040px makes it the primary lg: device, ensuring layouts scale properly
 * across the responsive hierarchy: sm: (600px+) → md: (800px+) → lg: (1024px+)
 *
 * DEVICE-SPECIFIC OPTIMIZATION EXAMPLES:
 * ---------------------------------------------------------
 * optimizePhotoUrl(url, 800, 480)   // md: TRMNL OG/OG V2 (800×480 logical)
 * optimizePhotoUrl(url, 1040, 780)  // lg: TRMNL X (1040×780 logical) [DEFAULT]
 * optimizePhotoUrl(url, 800, 602)   // lg: Kindle Oasis 2 (800×602 logical, portrait)
 * optimizePhotoUrl(url, 992, 744)   // lg: Kindle Scribe (992×744 logical, highest)
 * optimizePhotoUrl(url, 1044, 702)  // lg: Onyx Boox Go 7 (1044×702 logical, portrait)
 *
 * GOOGLE PHOTOS URL PARAMETERS:
 * ---------------------------------------------------------
 * The =wWIDTH-hHEIGHT parameter instructs Google Photos CDN to:
 * - Resize image to fit within specified dimensions (maintains aspect ratio)
 * - Serve optimized file size for e-ink bandwidth constraints
 * - Cache resized version globally for subsequent requests
 * - No cropping - full image preserved at target size
 *
 * @param baseUrl - The original photo URL from Google Photos CDN
 * @param width - Target width in pixels (default: 1040 for TRMNL X logical width)
 * @param height - Target height in pixels (default: 780 for TRMNL X logical height)
 * @returns Optimized photo URL with size parameters (e.g., =w1040-h780)
 * @throws Error if baseUrl is not from Google Photos CDN (googleusercontent.com)
 *
 * @example
 * // Default optimization for TRMNL X (lg:)
 * const url = optimizePhotoUrl('https://lh3.googleusercontent.com/...');
 * // Returns: 'https://lh3.googleusercontent.com/...=w1040-h780'
 *
 * @example
 * // Custom optimization for TRMNL OG (md:)
 * const url = optimizePhotoUrl('https://lh3.googleusercontent.com/...', 800, 480);
 * // Returns: 'https://lh3.googleusercontent.com/...=w800-h480'
 */
export function optimizePhotoUrl(
  baseUrl: string,
  width: number = 1040, // TRMNL X logical width (lg: breakpoint)
  height: number = 780 // TRMNL X logical height (lg: breakpoint)
): string {
  // Validate photo URL before optimization
  if (!isValidPhotoUrl(baseUrl)) {
    throw new Error(
      'Invalid photo URL: URL must be from Google Photos CDN (googleusercontent.com)'
    );
  }

  // Google Photos URL parameters for resizing
  // Format: =wWIDTH-hHEIGHT (e.g., =w1024-h758)
  return `${baseUrl}=w${width}-h${height}`;
}

/**
 * Calculate greatest common divisor using Euclidean algorithm
 * Helper function for simplifying aspect ratios
 *
 * @param a - First number
 * @param b - Second number
 * @returns Greatest common divisor
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Calculate aspect ratio from image dimensions
 * Returns standard width:height format, approximating to common ratios when close
 *
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns Aspect ratio in width:height format (e.g., "16:9", "4:3", "1:1")
 *
 * @example
 * calculateAspectRatio(1920, 1080) // Returns "16:9"
 * calculateAspectRatio(1080, 1920) // Returns "9:16" (portrait)
 * calculateAspectRatio(1000, 1000) // Returns "1:1" (square)
 * calculateAspectRatio(5694, 4075) // Returns "3:2" (approx 1.397 ≈ 1.5)
 */
export function calculateAspectRatio(width: number, height: number): string {
  const ratio = width / height;

  // Common aspect ratios ordered by popularity
  // Format: [width, height, decimal ratio, tolerance]
  const commonRatios: Array<[number, number, number]> = [
    [1, 1, 1.0], // Square
    [4, 3, 4 / 3], // Standard (1.333...)
    [3, 2, 1.5], // Classic photography
    [16, 10, 1.6], // 16:10 displays
    [5, 3, 5 / 3], // European standard (1.666...)
    [16, 9, 16 / 9], // Widescreen (1.777...)
    [2, 1, 2.0], // Ultrawide
    [21, 9, 21 / 9], // Cinematic (2.333...)
    [3, 1, 3.0], // Panoramic
  ];

  // Tolerance for matching (5% difference)
  const tolerance = 0.05;

  // Check portrait orientation first
  if (ratio < 1) {
    // For portrait, check inverted ratios
    const invertedRatio = 1 / ratio;
    for (const [w, h, commonRatio] of commonRatios) {
      if (Math.abs(invertedRatio - commonRatio) / commonRatio <= tolerance) {
        return `${h}:${w}`; // Swap for portrait
      }
    }
  } else {
    // For landscape/square, check normal ratios
    for (const [w, h, commonRatio] of commonRatios) {
      if (Math.abs(ratio - commonRatio) / commonRatio <= tolerance) {
        return `${w}:${h}`;
      }
    }
  }

  // Fallback: use GCD simplification for uncommon ratios
  const divisor = gcd(width, height);
  const simplifiedWidth = width / divisor;
  const simplifiedHeight = height / divisor;

  // If simplified ratio is too large (both > 100), use decimal approximation
  if (simplifiedWidth > 100 || simplifiedHeight > 100) {
    // Find best simple fraction approximation
    const maxDenominator = 20;
    let bestNum = Math.round(ratio);
    let bestDen = 1;
    let bestError = Math.abs(ratio - bestNum);

    for (let den = 2; den <= maxDenominator; den++) {
      const num = Math.round(ratio * den);
      const error = Math.abs(ratio - num / den);
      if (error < bestError) {
        bestNum = num;
        bestDen = den;
        bestError = error;
      }
    }

    return `${bestNum}:${bestDen}`;
  }

  return `${simplifiedWidth}:${simplifiedHeight}`;
}

/**
 * Calculate megapixels from image dimensions
 * Rounds to nearest 0.5 MP for cleaner display
 *
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns Megapixels rounded to nearest 0.5 (e.g., 12, 12.5, 13)
 *
 * @example
 * calculateMegapixels(3024, 4032) // = 12.2 → 12 MP
 * calculateMegapixels(1920, 1080) // = 2.1 → 2 MP
 * calculateMegapixels(4000, 3000) // = 12 → 12 MP
 */
export function calculateMegapixels(width: number, height: number): number {
  const megapixels = (width * height) / 1_000_000;
  // Round to nearest 0.5
  return Math.round(megapixels * 2) / 2;
}

/**
 * Convert ISO timestamp to relative date format
 * Examples: "2 years ago", "3 months ago", "5 days ago", "Just now"
 *
 * @param isoDate - ISO 8601 timestamp string
 * @returns Relative date string
 */
export function formatRelativeDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) {
      return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
    } else if (diffMonths > 0) {
      return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
    } else if (diffDays > 0) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffMinutes > 0) {
      return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    } else {
      return 'Just now';
    }
  } catch {
    // Fallback to extracting just the year if parsing fails
    const yearMatch = isoDate.match(/^\d{4}/);
    return yearMatch ? yearMatch[0] : 'Unknown';
  }
}

/**
 * Convert Google Photo to PhotoData format for templates
 *
 * @param photo - Google Photo object
 * @param albumUrl - Original album URL
 * @param totalPhotos - Total number of photos in album
 * @returns PhotoData object for template rendering
 */
export function convertToPhotoData(
  photo: GooglePhoto,
  albumUrl: string,
  totalPhotos: number
): PhotoData {
  // Validate and sanitize all fields before creating PhotoData
  const photoUrl = optimizePhotoUrl(photo.url);
  const thumbnailUrl = optimizePhotoUrl(photo.url, 400, 300);
  const caption = sanitizeCaption(null); // Google Photos API doesn't expose captions
  const albumName = sanitizeAlbumName('Google Photos Album');
  const photoCount = validatePhotoCount(totalPhotos);
  const timestamp = validateTimestamp(new Date().toISOString());
  const imageUpdateDate = validateTimestamp(new Date(photo.imageUpdateDate).toISOString());
  const relativeDate = formatRelativeDate(imageUpdateDate);
  const aspectRatio = calculateAspectRatio(photo.width, photo.height);
  const megapixels = calculateMegapixels(photo.width, photo.height);

  const photoData: PhotoData = {
    photo_url: photoUrl,
    thumbnail_url: thumbnailUrl,
    caption: caption,
    timestamp: timestamp,
    image_update_date: imageUpdateDate,
    album_name: albumName,
    photo_count: photoCount,
    relative_date: relativeDate,
    aspect_ratio: aspectRatio,
    megapixels: megapixels,
    metadata: {
      uid: photo.uid,
      original_width: photo.width,
      original_height: photo.height,
      image_update_date: imageUpdateDate,
      album_add_date: validateTimestamp(new Date(photo.albumAddDate).toISOString()),
    },
  };

  // Final security validation
  if (!validatePhotoData(photoData)) {
    throw new Error('Security validation failed: Photo data contains invalid or unsafe values');
  }

  return photoData;
}

/**
 * Main function to fetch a random photo from an album
 *
 * @param albumUrl - The shared album URL
 * @param kv - Optional Cloudflare KV namespace for caching
 * @returns PhotoData object ready for template rendering
 * @throws Error if fetching or processing fails
 */
export async function fetchRandomPhoto(albumUrl: string, kv?: KVNamespace): Promise<PhotoData> {
  // Fetch all photos from the album (may use cache)
  const photos = await fetchAlbumPhotos(albumUrl, kv);

  // Select a random photo
  const selectedPhoto = selectRandomPhoto(photos);

  // Convert to PhotoData format
  return convertToPhotoData(selectedPhoto, albumUrl, photos.length);
}
