/**
 * URL Obfuscator Utility
 * Provides functions to obfuscate URLs and sensitive data in logs to protect PII
 *
 * Privacy-first logging:
 * - Obfuscates Google Photos album URLs to prevent reconstruction
 * - Obfuscates photo URLs from Google CDN
 * - Preserves just enough information for debugging without exposing full URLs
 */

/**
 * Obfuscate a URL by showing only the protocol, domain, and a truncated path
 * This prevents logging full URLs which could be PII
 *
 * @param url - The URL to obfuscate
 * @param maxLength - Maximum length of the obfuscated URL (default: 40)
 * @returns Obfuscated URL string
 *
 * @example
 * obfuscateUrl('https://photos.app.goo.gl/ABC123XYZ789')
 * // Returns: 'https://photos.app.goo.gl/ABC1...***'
 *
 * @example
 * obfuscateUrl('https://lh3.googleusercontent.com/very-long-photo-id-12345')
 * // Returns: 'https://lh3.googleusercontent.com/ve...***'
 */
export function obfuscateUrl(url: string | undefined | null, maxLength: number = 40): string {
  if (!url || typeof url !== 'string') {
    return '[no-url]';
  }

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const protocol = urlObj.protocol;

    // Calculate how much path we can show
    const prefixLength = `${protocol}//${domain}/`.length;
    const remainingLength = maxLength - prefixLength - 6; // Reserve 6 chars for '...***'

    if (remainingLength <= 0) {
      // URL is too short, just show domain
      return `${protocol}//${domain}/...***`;
    }

    // Get the path and truncate if needed
    const path = urlObj.pathname.substring(1); // Remove leading slash
    if (path.length <= remainingLength) {
      // Path fits, show first few chars and mask rest
      return `${protocol}//${domain}/${path.substring(0, 4)}...***`;
    }

    // Truncate path
    const truncatedPath = path.substring(0, remainingLength);
    return `${protocol}//${domain}/${truncatedPath}...***`;
  } catch {
    // If URL parsing fails, do simple string truncation
    if (url.length <= maxLength) {
      return url.substring(0, Math.max(0, url.length - 8)) + '...***';
    }
    return url.substring(0, maxLength - 6) + '...***';
  }
}

/**
 * Obfuscate an album ID by showing only the first few characters
 * Album IDs can be used to reconstruct URLs, so we obfuscate them
 *
 * @param albumId - The album ID to obfuscate
 * @returns Obfuscated album ID
 *
 * @example
 * obfuscateAlbumId('AF1QipN1234567890abcdef')
 * // Returns: 'AF1Q...***'
 */
export function obfuscateAlbumId(albumId: string | undefined | null): string {
  if (!albumId || typeof albumId !== 'string') {
    return '[no-id]';
  }

  if (albumId.length <= 8) {
    return albumId.substring(0, 2) + '...***';
  }

  return albumId.substring(0, 4) + '...***';
}

/**
 * Obfuscate a cache key that may contain sensitive information
 *
 * @param key - The cache key to obfuscate
 * @returns Obfuscated cache key
 *
 * @example
 * obfuscateCacheKey('album:AF1QipN1234567890abcdef')
 * // Returns: 'album:AF1Q...***'
 */
export function obfuscateCacheKey(key: string | undefined | null): string {
  if (!key || typeof key !== 'string') {
    return '[no-key]';
  }

  // Check if it's an album key format (album:ID)
  if (key.startsWith('album:')) {
    const albumId = key.substring(6);
    return `album:${obfuscateAlbumId(albumId)}`;
  }

  // For other keys, show first 10 chars
  if (key.length <= 10) {
    return key;
  }

  return key.substring(0, 10) + '...***';
}

/**
 * Obfuscate a photo UID by showing only the first few characters
 *
 * @param uid - The photo UID to obfuscate
 * @returns Obfuscated UID
 *
 * @example
 * obfuscatePhotoUid('AF1QipMabcdef1234567890')
 * // Returns: 'AF1Q...***'
 */
export function obfuscatePhotoUid(uid: string | undefined | null): string {
  if (!uid || typeof uid !== 'string') {
    return '[no-uid]';
  }

  if (uid.length <= 8) {
    return uid.substring(0, 2) + '...***';
  }

  return uid.substring(0, 4) + '...***';
}
