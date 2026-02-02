/**
 * Album URL Hasher
 * Privacy-preserving utility for hashing album URLs
 *
 * Used for smart photo selection history tracking without storing plaintext URLs.
 * SHA-256 hash ensures:
 * - Deterministic: Same URL always produces same hash
 * - One-way: Cannot reverse hash to get original URL
 * - Unique: Different URLs produce different hashes
 */

/**
 * Generate SHA-256 hash of album URL for privacy-preserving history tracking
 *
 * @param albumUrl - The shared album URL
 * @returns SHA-256 hash (64-character hex string)
 *
 * @example
 * const hash = await hashAlbumUrl('https://photos.app.goo.gl/ABC123');
 * // Returns: '3a7bd3e2c5ea4c0b8f1d6e9a2c3b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c'
 */
export async function hashAlbumUrl(albumUrl: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(albumUrl);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
