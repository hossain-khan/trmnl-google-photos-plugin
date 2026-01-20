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
      /**
       * Device model identifier (e.g., 'v2', 'og_png', 'amazon_kindle_2024')
       * @experimental This property is likely not supported yet by TRMNL platform.
       * @see https://discord.com/channels/1281055965508141100/1284987869546549268/1462580151970959534
       * @see https://usetrmnl.com/api/models - Device model reference
       */
      device_model_id?: string;
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
  image_update_date?: string;
  album_name?: string;
  photo_count: number;
  relative_date?: string;
  aspect_ratio?: string;
  megapixels?: number;
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
