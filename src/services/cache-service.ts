/**
 * Cache Service
 * Handles Cloudflare KV caching for album photo data
 *
 * Cache Strategy:
 * - Key structure: `album:{albumId}`
 * - TTL: 1 hour (3600 seconds)
 * - Shared across all users with same album (no user-specific data)
 * - Gracefully handles cache misses and errors
 */

import type { GooglePhoto } from '../types';
import { extractAlbumId } from '../lib/url-parser';

/**
 * Cached album data structure
 */
export interface CachedAlbumData {
  album_id: string;
  fetched_at: string; // ISO timestamp
  photo_count: number;
  photos: GooglePhoto[];
}

/**
 * Cache metrics for monitoring
 */
export interface CacheMetrics {
  hit: boolean;
  key: string;
  timestamp: string;
  error?: string;
}

// Cache TTL: 1 hour in seconds
const CACHE_TTL_SECONDS = 3600;

/**
 * Generate cache key for an album
 *
 * @param albumId - The Google Photos album ID
 * @returns Cache key in format `album:{albumId}`
 */
export function getCacheKey(albumId: string): string {
  return `album:${albumId}`;
}

/**
 * Get cached album data from KV store
 *
 * @param kv - Cloudflare KV namespace
 * @param albumId - The Google Photos album ID
 * @returns Cached album data or null if not found/expired/error
 */
export async function getCachedAlbum(
  kv: KVNamespace | undefined,
  albumId: string
): Promise<CachedAlbumData | null> {
  // If KV is not configured, return null (cache disabled)
  if (!kv) {
    console.log('KV cache not configured, skipping cache lookup');
    return null;
  }

  const key = getCacheKey(albumId);

  try {
    const cached = await kv.get<CachedAlbumData>(key, 'json');

    if (cached) {
      console.log(`Cache HIT for ${key} (${cached.photo_count} photos)`);
      return cached;
    }

    console.log(`Cache MISS for ${key}`);
    return null;
  } catch (error) {
    // Log error but don't throw - gracefully fallback to API fetch
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Cache lookup error for ${key}:`, errorMessage);
    return null;
  }
}

/**
 * Store album data in KV cache
 *
 * @param kv - Cloudflare KV namespace
 * @param albumId - The Google Photos album ID
 * @param photos - Array of photos to cache
 */
export async function setCachedAlbum(
  kv: KVNamespace | undefined,
  albumId: string,
  photos: GooglePhoto[]
): Promise<void> {
  // If KV is not configured, skip caching
  if (!kv) {
    console.log('KV cache not configured, skipping cache storage');
    return;
  }

  const key = getCacheKey(albumId);

  const cacheData: CachedAlbumData = {
    album_id: albumId,
    fetched_at: new Date().toISOString(),
    photo_count: photos.length,
    photos,
  };

  try {
    // Store with 1-hour TTL
    await kv.put(key, JSON.stringify(cacheData), {
      expirationTtl: CACHE_TTL_SECONDS,
    });

    console.log(`Cache STORED for ${key} (${photos.length} photos, TTL: ${CACHE_TTL_SECONDS}s)`);
  } catch (error) {
    // Log error but don't throw - cache storage failure shouldn't break the app
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Cache storage error for ${key}:`, errorMessage);
  }
}

/**
 * Generate cache metrics for monitoring
 *
 * @param hit - Whether cache was hit or missed
 * @param albumId - The album ID
 * @param error - Optional error message
 * @returns Cache metrics object
 */
export function generateCacheMetrics(hit: boolean, albumId: string, error?: string): CacheMetrics {
  return {
    hit,
    key: getCacheKey(albumId),
    timestamp: new Date().toISOString(),
    error,
  };
}
