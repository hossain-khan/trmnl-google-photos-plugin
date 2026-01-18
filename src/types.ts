/**
 * Type definitions for TRMNL Google Photos Plugin
 */

/**
 * TRMNL request body structure
 * Sent by TRMNL device when requesting markup
 */
export interface TRMNLRequest {
  trmnl: {
    plugin_settings: {
      instance_name: string;
      shared_album_url: string;
    };
    screen?: {
      width: number;
      height: number;
      bit_depth?: number;
    };
    layout?: string;
  };
}

/**
 * Photo data structure for templates
 */
export interface PhotoData {
  photo_url: string;
  thumbnail_url?: string;
  caption?: string | null;
  timestamp: string;
  album_name?: string;
  photo_count: number;
  metadata?: {
    uid: string;
    original_width: number;
    original_height: number;
    image_update_date?: string;
    album_add_date?: string;
  };
}

/**
 * Template rendering context
 */
export interface TemplateContext {
  photo: PhotoData;
  trmnl: TRMNLRequest['trmnl'];
}

/**
 * Photo fetcher result from google-photos-album-image-url-fetch
 */
export interface GooglePhoto {
  uid: string;
  url: string;
  width: number;
  height: number;
  imageUpdateDate: number;
  albumAddDate: number;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  details?: string;
}
