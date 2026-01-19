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
 * Convert Google Photo to PhotoData format for templates
 *
 * @param photo - Google Photo object
 * @param albumUrl - Original album URL
 * @param totalPhotos - Total number of photos in album
 * @param analyzeImage - Whether to analyze image brightness (default: false for performance)
 * @returns PhotoData object for template rendering
 */
export async function convertToPhotoData(
  photo: GooglePhoto,
  albumUrl: string,
  totalPhotos: number,
  analyzeImage: boolean = false
): Promise<PhotoData> {
  // Validate and sanitize all fields before creating PhotoData
  const photoUrl = optimizePhotoUrl(photo.url);
  const thumbnailUrl = optimizePhotoUrl(photo.url, 400, 300);
  const caption = sanitizeCaption(null); // Google Photos API doesn't expose captions
  const albumName = sanitizeAlbumName('Google Photos Shared Album');
  const photoCount = validatePhotoCount(totalPhotos);
  const timestamp = validateTimestamp(new Date().toISOString());

  // Analyze image brightness if requested (adds ~100-200ms latency)
  let backgroundShade = undefined;
  if (analyzeImage) {
    backgroundShade = await analyzeImageBrightness(thumbnailUrl);
  }

  const photoData: PhotoData = {
    photo_url: photoUrl,
    thumbnail_url: thumbnailUrl,
    caption: caption,
    timestamp: timestamp,
    album_name: albumName,
    photo_count: photoCount,
    background_shade: backgroundShade,
    metadata: {
      uid: photo.uid,
      original_width: photo.width,
      original_height: photo.height,
      image_update_date: validateTimestamp(new Date(photo.imageUpdateDate).toISOString()),
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
 * @param analyzeImage - Whether to analyze image brightness for background selection (default: false)
 * @returns PhotoData object ready for template rendering
 * @throws Error if fetching or processing fails
 */
export async function fetchRandomPhoto(
  albumUrl: string,
  kv?: KVNamespace,
  analyzeImage: boolean = false
): Promise<PhotoData> {
  // Fetch all photos from the album (may use cache)
  const photos = await fetchAlbumPhotos(albumUrl, kv);

  // Select a random photo
  const selectedPhoto = selectRandomPhoto(photos);

  // Convert to PhotoData format (with optional image analysis)
  return await convertToPhotoData(selectedPhoto, albumUrl, photos.length, analyzeImage);
}

/**
 * Analyze image brightness and return recommended TRMNL background shade
 * Uses lightweight sampling of thumbnail to determine if image is predominantly light or dark
 *
 * Maps average brightness (0-255) to TRMNL Framework v2 background shades (17 levels)
 * to create seamless visual continuity between image and background on e-ink displays.
 *
 * @param thumbnailUrl - URL of thumbnail image (smaller = faster)
 * @returns TRMNL background class (e.g., 'bg--gray-40')
 * @see https://usetrmnl.com/framework/background - TRMNL Framework background shades
 */
export async function analyzeImageBrightness(thumbnailUrl: string): Promise<string> {
  const startTime = performance.now();
  console.log('[Image Analysis] Starting brightness analysis...');

  try {
    // Fetch small thumbnail for analysis
    const fetchStart = performance.now();
    const response = await fetch(thumbnailUrl);
    if (!response.ok) {
      console.log('[Image Analysis] Fetch failed, no background applied');
      return ''; // No background on fetch error
    }
    const fetchTime = performance.now() - fetchStart;
    console.log(`[Image Analysis] Thumbnail fetched in ${fetchTime.toFixed(2)}ms`);

    const imageData = await response.arrayBuffer();
    const blob = new Blob([imageData]);

    // Create an ImageBitmap for pixel analysis (lightweight, supported in Workers)
    const bitmapStart = performance.now();
    const imageBitmap = await createImageBitmap(blob);
    const bitmapTime = performance.now() - bitmapStart;
    console.log(
      `[Image Analysis] ImageBitmap created in ${bitmapTime.toFixed(2)}ms (${imageBitmap.width}x${imageBitmap.height})`
    );

    // Create OffscreenCanvas for pixel sampling
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('[Image Analysis] Canvas context failed, no background applied');
      return ''; // No background on canvas error
    }

    // Draw image to canvas
    ctx.drawImage(imageBitmap, 0, 0);

    // Sample pixels (every 10th pixel to keep it lightweight)
    const samplingStart = performance.now();
    const imageDataPixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageDataPixels.data;
    let totalBrightness = 0;
    let sampleCount = 0;

    for (let i = 0; i < pixels.length; i += 40) {
      // RGBA: i=R, i+1=G, i+2=B, i+3=A (skip every 10 pixels)
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      // Calculate relative luminance (perceptual brightness)
      // Formula: 0.299*R + 0.587*G + 0.114*B
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      totalBrightness += brightness;
      sampleCount++;
    }

    const avgBrightness = totalBrightness / sampleCount; // 0-255 range
    const samplingTime = performance.now() - samplingStart;
    console.log(
      `[Image Analysis] Sampled ${sampleCount} pixels in ${samplingTime.toFixed(2)}ms (avg brightness: ${avgBrightness.toFixed(1)})`
    );

    // Map brightness to TRMNL background shade (17 levels: black + 14 grays + white)
    // Uses full palette from https://usetrmnl.com/framework/background
    let backgroundShade = '';
    if (avgBrightness < 15) {
      backgroundShade = 'bg--black'; // Pure black (0-15)
    } else if (avgBrightness < 30) {
      backgroundShade = 'bg--gray-10'; // Very dark (15-30)
    } else if (avgBrightness < 45) {
      backgroundShade = 'bg--gray-15'; // Dark (30-45)
    } else if (avgBrightness < 60) {
      backgroundShade = 'bg--gray-20'; // Dark (45-60)
    } else if (avgBrightness < 75) {
      backgroundShade = 'bg--gray-25'; // Dark-medium (60-75)
    } else if (avgBrightness < 90) {
      backgroundShade = 'bg--gray-30'; // Dark-medium (75-90)
    } else if (avgBrightness < 105) {
      backgroundShade = 'bg--gray-35'; // Medium-dark (90-105)
    } else if (avgBrightness < 120) {
      backgroundShade = 'bg--gray-40'; // Medium-dark (105-120)
    } else if (avgBrightness < 135) {
      backgroundShade = 'bg--gray-45'; // Medium (120-135)
    } else if (avgBrightness < 150) {
      backgroundShade = 'bg--gray-50'; // Medium (135-150)
    } else if (avgBrightness < 165) {
      backgroundShade = 'bg--gray-55'; // Medium-light (150-165)
    } else if (avgBrightness < 180) {
      backgroundShade = 'bg--gray-60'; // Medium-light (165-180)
    } else if (avgBrightness < 195) {
      backgroundShade = 'bg--gray-65'; // Light (180-195)
    } else if (avgBrightness < 210) {
      backgroundShade = 'bg--gray-70'; // Light (195-210)
    } else if (avgBrightness < 225) {
      backgroundShade = 'bg--gray-75'; // Very light (210-225)
    } else if (avgBrightness < 240) {
      backgroundShade = 'bg--gray-75'; // Very light (225-240)
    } else {
      backgroundShade = 'bg--white'; // Pure white (240-255)
    }

    const totalTime = performance.now() - startTime;
    console.log(
      `[Image Analysis] Complete in ${totalTime.toFixed(2)}ms - Selected: ${backgroundShade}`
    );

    return backgroundShade;
  } catch (error) {
    const totalTime = performance.now() - startTime;
    console.error(`[Image Analysis] Failed after ${totalTime.toFixed(2)}ms:`, error);
    return ''; // No background on error
  }
}
