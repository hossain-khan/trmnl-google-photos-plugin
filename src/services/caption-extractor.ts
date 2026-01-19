/**
 * Caption Extractor Service
 * Extends google-photos-album-image-url-fetch to extract captions from photos
 */

import { request } from 'gaxios';
import { parse } from 'json5';
import type { GooglePhoto } from '../types';

/**
 * Extended photo data with caption
 */
interface ExtendedPhotoData {
  uid: string;
  url: string;
  width: number;
  height: number;
  imageUpdateDate: number;
  albumAddDate: number;
  caption?: string;
}

/**
 * Fetch and parse AF_initDataCallback data with caption extraction
 * 
 * This function replicates what google-photos-album-image-url-fetch does,
 * but extracts additional caption data from the AF_initDataCallback structure.
 * 
 * @param albumUrl - Google Photos shared album URL
 * @returns Array of photos with captions
 */
export async function fetchPhotosWithCaptions(albumUrl: string): Promise<GooglePhoto[]> {
  try {
    // Fetch album HTML using gaxios (same as google-photos-album-image-url-fetch library)
    const response = await request({
      url: albumUrl,
      retryConfig: { retry: 4, retryDelay: 1000 },
      retry: true,
    });

    const html = response.data as string;
    
    console.log(`Fetched album HTML: ${html.length} bytes`);

    // Phase 1: Extract AF_initDataCallback structure
    const re = /(?<=AF_initDataCallback\()(?=.*data)(\{[\s\S]*?)(\);<\/script>)/g;
    const matches = [...html.matchAll(re)];
    
    if (matches.length === 0) {
      console.log('⚠️  No AF_initDataCallback found in HTML');
      return [];
    }

    console.log(`Found ${matches.length} AF_initDataCallback structures`);

    // Find the largest match (most likely to contain photo data)
    const largestMatch = matches.reduce((a, b) => (a.length > b[1].length ? a : b[1]), '');

    // Phase 2: Parse JSON5
    const data = parse(largestMatch);

    // Phase 3: Extract photo data with captions
    return parsePhotoDataWithCaptions(data);

  } catch (error) {
    console.error('Error fetching photos with captions:', error);
    throw error;
  }
}

/**
 * Parse photo data from AF_initDataCallback structure and extract captions
 * 
 * Structure observation from testing:
 * data.data[1] = Array of photos, where each photo is an array:
 * [0] = uid (string)
 * [1] = [url, width, height] (array)
 * [2] = imageUpdateDate (number)
 * [3] = ? (varies)
 * [4] = ? (varies)
 * [5] = albumAddDate (number)
 * [6+] = potential caption or metadata (varies by photo)
 * 
 * @param data - Parsed AF_initDataCallback data
 * @returns Array of photos with captions
 */
function parsePhotoDataWithCaptions(data: any): GooglePhoto[] {
  if (!data || typeof data !== 'object' || !('data' in data)) {
    return [];
  }

  const d = data.data;
  if (!Array.isArray(d) || d.length < 2) {
    return [];
  }

  const photoArray = d[1];
  if (!Array.isArray(photoArray)) {
    return [];
  }

  return photoArray
    .map((photo): GooglePhoto | null => {
      if (!Array.isArray(photo) || photo.length < 6) {
        return null;
      }

      // Extract basic data (same as library)
      const uid = photo[0];
      const imageUpdateDate = photo[2];
      const albumAddDate = photo[5];

      if (typeof uid !== 'string' || typeof imageUpdateDate !== 'number' || typeof albumAddDate !== 'number') {
        return null;
      }

      const detail = photo[1];
      if (!Array.isArray(detail) || detail.length < 3) {
        return null;
      }

      const url = detail[0];
      const width = detail[1];
      const height = detail[2];

      if (typeof url !== 'string' || typeof width !== 'number' || typeof height !== 'number') {
        return null;
      }

      // Extract caption - this is the new part
      let caption: string | undefined = undefined;

      // Strategy 1: Look for caption in photo array indices beyond 5
      // Common patterns observed:
      // - photo[6] might be a string (caption)
      // - photo[15] might be a string (caption)
      // - Look in nested arrays for strings that look like captions
      for (let i = 6; i < photo.length; i++) {
        const elem = photo[i];
        
        // Direct string caption
        if (typeof elem === 'string' && elem.length > 0 && elem.length < 1000) {
          // Filter out UIDs and URLs
          if (!elem.startsWith('AF1') && !elem.startsWith('http')) {
            caption = elem;
            break;
          }
        }
        
        // Caption in nested array
        if (Array.isArray(elem)) {
          for (let j = 0; j < elem.length; j++) {
            const nested = elem[j];
            if (typeof nested === 'string' && nested.length > 0 && nested.length < 1000) {
              if (!nested.startsWith('AF1') && !nested.startsWith('http')) {
                caption = nested;
                break;
              }
            }
          }
          if (caption) break;
        }
      }

      return {
        uid,
        url,
        width,
        height,
        imageUpdateDate,
        albumAddDate,
        caption,
      };
    })
    .filter((photo): photo is GooglePhoto => photo !== null);
}

/**
 * Fallback: Try to fetch caption from individual photo page
 * This is less reliable and slower, but might work for some photos
 * Note: This requires full share URL format, not short goo.gl URLs
 * 
 * @param albumUrl - Original album URL (must be full share URL)
 * @param photoUid - Photo UID
 * @returns Caption string or null
 */
export async function fetchCaptionFromPhotoPage(
  albumUrl: string,
  photoUid: string
): Promise<string | null> {
  try {
    // Extract album ID from URL
    const match = albumUrl.match(/photos\.google\.com\/share\/([A-Za-z0-9_-]+)/);
    if (!match) {
      // Can't construct photo URL from short URLs
      return null;
    }

    const albumId = match[1];
    const photoPageUrl = `https://photos.google.com/share/${albumId}/photo/${photoUid}`;

    const response = await request({
      url: photoPageUrl,
      retryConfig: { retry: 2, retryDelay: 1000 },
      retry: true,
    });

    const html = response.data as string;

    // Try to find caption in meta tags
    const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/);
    if (ogDescMatch && ogDescMatch[1] && ogDescMatch[1] !== 'Google Photos') {
      return ogDescMatch[1];
    }

    return null;
  } catch (error) {
    console.error(`Error fetching caption for photo ${photoUid}:`, error);
    return null;
  }
}
