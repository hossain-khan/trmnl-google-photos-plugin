/**
 * Security Validator Service
 *
 * Provides security validation functions for JSON API responses
 * to prevent XSS, injection attacks, and data integrity issues.
 */

/**
 * Security limits for data validation
 */
export const SECURITY_LIMITS = {
  MAX_PHOTO_COUNT: 50000, // Maximum reasonable number of photos in an album
  MIN_PHOTO_COUNT: 0, // Minimum photo count
  MAX_CAPTION_LENGTH: 5000, // Maximum caption length (prevent DoS)
  MAX_ALBUM_NAME_LENGTH: 500, // Maximum album name length
};

/**
 * Validate and sanitize a photo URL from Google Photos API
 *
 * @param url - The photo URL to validate
 * @returns True if URL is valid and safe, false otherwise
 */
export function isValidPhotoUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Must be HTTPS
  if (!url.startsWith('https://')) {
    return false;
  }

  // Parse URL to validate hostname properly (prevents subdomain attacks)
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }

  // Must be from Google's CDN (lh3.googleusercontent.com or lh4, lh5, etc.)
  // Use exact hostname matching to prevent attacks like lh3.googleusercontent.com.malicious.com
  const hostname = parsedUrl.hostname.toLowerCase();
  const isGoogleCDN = /^lh[0-9]+\.googleusercontent\.com$/.test(hostname);

  if (!isGoogleCDN) {
    return false;
  }

  // Reject data: URIs, javascript: URIs, etc. in the full URL
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('data:') || lowerUrl.includes('javascript:')) {
    return false;
  }

  return true;
}

/**
 * Sanitize a caption for safe JSON output
 *
 * Note: JSON.stringify() automatically handles escaping for quotes, backslashes,
 * and control characters. This function provides additional validation.
 *
 * @param caption - The caption to sanitize
 * @returns Sanitized caption or null if invalid
 */
export function sanitizeCaption(caption: string | null | undefined): string | null {
  // Google Photos API doesn't currently expose captions for shared albums
  // This function is for future compatibility
  if (!caption || typeof caption !== 'string') {
    return null;
  }

  // Trim whitespace
  const trimmed = caption.trim();

  if (trimmed === '') {
    return null;
  }

  // Reject excessively long captions (DoS prevention)
  if (trimmed.length > SECURITY_LIMITS.MAX_CAPTION_LENGTH) {
    console.warn(
      `Caption exceeds maximum length: ${trimmed.length} > ${SECURITY_LIMITS.MAX_CAPTION_LENGTH}`
    );
    return null;
  }

  // JSON.stringify will handle escaping for:
  // - Quotes (")
  // - Backslashes (\)
  // - Control characters (\n, \r, \t, etc.)
  // - Unicode characters

  return trimmed;
}

/**
 * Sanitize an album name for safe JSON output
 *
 * @param albumName - The album name to sanitize
 * @returns Sanitized album name or default value
 */
export function sanitizeAlbumName(albumName: string | null | undefined): string {
  const defaultName = 'Google Photos Album';

  if (!albumName || typeof albumName !== 'string') {
    return defaultName;
  }

  const trimmed = albumName.trim();

  if (trimmed === '' || trimmed.length > SECURITY_LIMITS.MAX_ALBUM_NAME_LENGTH) {
    return defaultName;
  }

  return trimmed;
}

/**
 * Validate photo count metadata
 *
 * @param count - The photo count to validate
 * @returns Validated count (clamped to safe range)
 */
export function validatePhotoCount(count: number | null | undefined): number {
  if (typeof count !== 'number' || isNaN(count)) {
    return 0;
  }

  // Clamp to valid range
  if (count < SECURITY_LIMITS.MIN_PHOTO_COUNT) {
    console.warn(`Photo count below minimum: ${count}`);
    return SECURITY_LIMITS.MIN_PHOTO_COUNT;
  }

  if (count > SECURITY_LIMITS.MAX_PHOTO_COUNT) {
    console.warn(`Photo count exceeds maximum: ${count} > ${SECURITY_LIMITS.MAX_PHOTO_COUNT}`);
    return SECURITY_LIMITS.MAX_PHOTO_COUNT;
  }

  return Math.floor(count); // Ensure integer
}

/**
 * Validate ISO 8601 timestamp
 *
 * @param timestamp - The timestamp to validate
 * @returns Valid ISO 8601 timestamp or current time
 */
export function validateTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp || typeof timestamp !== 'string') {
    return new Date().toISOString();
  }

  // Try to parse as date
  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    console.warn(`Invalid timestamp format: ${timestamp}`);
    return new Date().toISOString();
  }

  return date.toISOString();
}

/**
 * Validate complete PhotoData object for security issues
 *
 * @param photoData - The photo data to validate
 * @returns True if all fields are valid, false otherwise
 */
export function validatePhotoData(photoData: any): boolean {
  // Type guard - ensure photoData is an object
  if (!photoData || typeof photoData !== 'object') {
    console.error('Invalid photo data: not an object');
    return false;
  }

  // Validate photo URL (required)
  const photoUrl = photoData.photo_url as unknown;
  if (!isValidPhotoUrl(typeof photoUrl === 'string' ? photoUrl : null)) {
    console.error('Invalid photo URL detected in response');
    return false;
  }

  // Validate thumbnail URL if present
  const thumbnailUrl = photoData.thumbnail_url as unknown;
  if (thumbnailUrl && !isValidPhotoUrl(typeof thumbnailUrl === 'string' ? thumbnailUrl : null)) {
    console.error('Invalid thumbnail URL detected in response');
    return false;
  }

  // Validate photo count is within acceptable range (before clamping)
  const rawCount = photoData.photo_count as unknown;
  if (
    typeof rawCount === 'number' &&
    (rawCount < SECURITY_LIMITS.MIN_PHOTO_COUNT || rawCount > SECURITY_LIMITS.MAX_PHOTO_COUNT)
  ) {
    console.error(`Invalid photo count in response: ${rawCount}`);
    return false;
  }

  return true;
}
