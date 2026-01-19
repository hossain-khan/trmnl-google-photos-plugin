/**
 * Photo Fetcher Service
 * Handles fetching photos from Google Photos shared albums
 * Includes optional KV caching for performance optimization
 */

import * as GooglePhotosAlbum from 'google-photos-album-image-url-fetch';
import type { GooglePhoto, PhotoData } from '../types';
import { getCachedAlbum, setCachedAlbum, extractAlbumId } from './cache-service';

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
 * Appends Google Photos URL parameters to resize the image
 *
 * @param baseUrl - The original photo URL
 * @param width - Target width (default 800)
 * @param height - Target height (default 480)
 * @returns Optimized photo URL
 */
export function optimizePhotoUrl(
  baseUrl: string,
  width: number = 800,
  height: number = 480
): string {
  // Google Photos URL parameters for resizing
  return `${baseUrl}=w${width}-h${height}`;
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
  return {
    photo_url: optimizePhotoUrl(photo.url),
    thumbnail_url: optimizePhotoUrl(photo.url, 400, 300),
    caption: null, // Google Photos shared albums don't expose captions
    timestamp: new Date().toISOString(),
    album_name: 'Google Photos Shared Album',
    photo_count: totalPhotos,
    metadata: {
      uid: photo.uid,
      original_width: photo.width,
      original_height: photo.height,
      image_update_date: new Date(photo.imageUpdateDate).toISOString(),
      album_add_date: new Date(photo.albumAddDate).toISOString(),
    },
  };
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
