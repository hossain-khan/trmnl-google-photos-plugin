#!/usr/bin/env node

/**
 * Google Photos Shared Album URL Parser & Validator
 * 
 * This module provides utilities for parsing and validating Google Photos
 * shared album URLs. It supports multiple URL formats and extracts album IDs.
 * 
 * Supported URL Formats:
 * 1. Short URLs: https://photos.app.goo.gl/{shortcode}
 * 2. Full URLs: https://photos.google.com/share/{albumId}
 * 3. Full URLs with params: https://photos.google.com/share/{albumId}?key=value
 * 
 * @module lib/url-parser
 */

import { z } from 'zod';

/**
 * Regular expression patterns for Google Photos shared album URLs
 */
const URL_PATTERNS = {
  // Short URL format: https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5
  SHORT_URL: /^https:\/\/photos\.app\.goo\.gl\/[A-Za-z0-9_-]+$/,
  
  // Full URL format: https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF...
  FULL_URL: /^https:\/\/photos\.google\.com\/share\/[A-Za-z0-9_-]+/,
  
  // Album ID extraction patterns
  ALBUM_ID_SHORT: /https:\/\/photos\.app\.goo\.gl\/([A-Za-z0-9_-]+)/,
  ALBUM_ID_FULL: /https:\/\/photos\.google\.com\/share\/([A-Za-z0-9_-]+)/,
};

/**
 * Error messages for validation failures
 */
const ERROR_MESSAGES = {
  REQUIRED: 'Album URL is required. Please provide a Google Photos shared album link.',
  INVALID_FORMAT: 'Invalid Google Photos URL format. Please provide a valid shared album link (e.g., https://photos.app.goo.gl/... or https://photos.google.com/share/...)',
  INVALID_DOMAIN: 'URL must be from Google Photos (photos.app.goo.gl or photos.google.com)',
  MALFORMED: 'Malformed URL. Please check the URL and try again.',
  ALBUM_ID_MISSING: 'Could not extract album ID from URL',
};

/**
 * Zod schema for Google Photos shared album URL validation
 */
export const AlbumUrlSchema = z.string()
  .min(1, ERROR_MESSAGES.REQUIRED)
  .url(ERROR_MESSAGES.MALFORMED)
  .refine((url) => {
    // Check if URL is from Google Photos domains
    return url.includes('photos.app.goo.gl') || url.includes('photos.google.com');
  }, ERROR_MESSAGES.INVALID_DOMAIN)
  .refine((url) => {
    // Check if URL matches one of the known patterns
    return URL_PATTERNS.SHORT_URL.test(url) || URL_PATTERNS.FULL_URL.test(url);
  }, ERROR_MESSAGES.INVALID_FORMAT);

/**
 * Parse and validate a Google Photos shared album URL
 * 
 * @param {string} url - The album URL to parse
 * @returns {Object} Parsed result with validation status
 * @returns {boolean} result.valid - Whether the URL is valid
 * @returns {string} [result.url] - The validated URL (if valid)
 * @returns {string} [result.albumId] - Extracted album ID (if valid)
 * @returns {string} [result.urlType] - Type of URL ('short' or 'full')
 * @returns {string} [result.error] - Error message (if invalid)
 * @returns {Array<string>} [result.errors] - Detailed validation errors (if invalid)
 * 
 * @example
 * // Valid short URL
 * const result = parseAlbumUrl('https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5');
 * // { valid: true, url: '...', albumId: 'QKGRYqfdS15bj8Kr5', urlType: 'short' }
 * 
 * @example
 * // Invalid URL
 * const result = parseAlbumUrl('https://invalid-url.com');
 * // { valid: false, error: '...', errors: [...] }
 */
export function parseAlbumUrl(url) {
  // Handle null, undefined, or non-string inputs
  if (url === null || url === undefined) {
    return {
      valid: false,
      error: ERROR_MESSAGES.REQUIRED,
      errors: [ERROR_MESSAGES.REQUIRED]
    };
  }

  // Convert to string if needed and trim whitespace
  const urlString = String(url).trim();

  // Validate using Zod schema
  const validation = AlbumUrlSchema.safeParse(urlString);

  if (!validation.success) {
    const errors = validation.error.issues.map(issue => issue.message);
    return {
      valid: false,
      error: errors[0], // Return first error as primary message
      errors: errors
    };
  }

  // Extract album ID and determine URL type
  const albumId = extractAlbumId(urlString);
  if (!albumId) {
    return {
      valid: false,
      error: ERROR_MESSAGES.ALBUM_ID_MISSING,
      errors: [ERROR_MESSAGES.ALBUM_ID_MISSING]
    };
  }

  const urlType = URL_PATTERNS.SHORT_URL.test(urlString) ? 'short' : 'full';

  return {
    valid: true,
    url: urlString,
    albumId: albumId,
    urlType: urlType
  };
}

/**
 * Extract album ID from a Google Photos URL
 * 
 * @param {string} url - The album URL
 * @returns {string|null} The extracted album ID, or null if not found
 * 
 * @example
 * extractAlbumId('https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5')
 * // Returns: 'QKGRYqfdS15bj8Kr5'
 * 
 * @example
 * extractAlbumId('https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF')
 * // Returns: 'AF1QipMZNuJ5JH6n3yF'
 */
export function extractAlbumId(url) {
  if (!url) return null;

  // Try short URL pattern first
  const shortMatch = url.match(URL_PATTERNS.ALBUM_ID_SHORT);
  if (shortMatch && shortMatch[1]) {
    return shortMatch[1];
  }

  // Try full URL pattern
  const fullMatch = url.match(URL_PATTERNS.ALBUM_ID_FULL);
  if (fullMatch && fullMatch[1]) {
    return fullMatch[1];
  }

  return null;
}

/**
 * Check if a URL is a valid Google Photos shared album URL
 * 
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid, false otherwise
 * 
 * @example
 * isValidAlbumUrl('https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5')
 * // Returns: true
 * 
 * @example
 * isValidAlbumUrl('https://invalid-url.com')
 * // Returns: false
 */
export function isValidAlbumUrl(url) {
  const result = parseAlbumUrl(url);
  return result.valid;
}

/**
 * Normalize a Google Photos URL (remove query parameters, trailing slashes, etc.)
 * 
 * @param {string} url - The URL to normalize
 * @returns {string|null} The normalized URL, or null if invalid
 * 
 * @example
 * normalizeAlbumUrl('https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF?key=value')
 * // Returns: 'https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF'
 */
export function normalizeAlbumUrl(url) {
  const result = parseAlbumUrl(url);
  if (!result.valid) return null;

  // For short URLs, return as-is
  if (result.urlType === 'short') {
    return result.url;
  }

  // For full URLs, remove query params and trailing slash
  const baseUrl = result.url.split('?')[0].replace(/\/$/, '');
  return baseUrl;
}

/**
 * Get a user-friendly error message for an invalid URL
 * 
 * @param {string} url - The invalid URL
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(url) {
  const result = parseAlbumUrl(url);
  return result.error || 'Unknown error';
}
