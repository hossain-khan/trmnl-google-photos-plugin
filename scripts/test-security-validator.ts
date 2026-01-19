#!/usr/bin/env node

/**
 * Security Validator Service Tests
 * 
 * Tests for security validation functions that protect the JSON API
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isValidPhotoUrl,
  sanitizeCaption,
  sanitizeAlbumName,
  validatePhotoCount,
  validateTimestamp,
  validatePhotoData,
  SECURITY_LIMITS,
} from '../src/services/security-validator';

console.log('🔒 Security Validator Service Tests\n');

// Test Suite 1: Photo URL Validation
describe('Photo URL Validation', (): void => {
  it('should accept valid Google Photos URLs (lh3)', (): void => {
    const url = 'https://lh3.googleusercontent.com/pw/AP1GczN...=w800-h480';
    assert.strictEqual(isValidPhotoUrl(url), true);
  });

  it('should accept Google Photos URLs with different hostnames (lh4, lh5)', (): void => {
    assert.strictEqual(isValidPhotoUrl('https://lh4.googleusercontent.com/photo'), true);
    assert.strictEqual(isValidPhotoUrl('https://lh5.googleusercontent.com/photo'), true);
  });

  it('should reject non-HTTPS URLs', (): void => {
    const url = 'http://lh3.googleusercontent.com/photo';
    assert.strictEqual(isValidPhotoUrl(url), false);
  });

  it('should reject non-Google Photos URLs', (): void => {
    const url = 'https://malicious.com/photo.jpg';
    assert.strictEqual(isValidPhotoUrl(url), false);
  });

  it('should reject data: URIs', (): void => {
    const url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...';
    assert.strictEqual(isValidPhotoUrl(url), false);
  });

  it('should reject javascript: URIs', (): void => {
    const url = 'javascript:alert("xss")';
    assert.strictEqual(isValidPhotoUrl(url), false);
  });

  it('should reject null/undefined URLs', (): void => {
    assert.strictEqual(isValidPhotoUrl(null), false);
    assert.strictEqual(isValidPhotoUrl(undefined), false);
  });

  it('should reject empty strings', (): void => {
    assert.strictEqual(isValidPhotoUrl(''), false);
  });
});

// Test Suite 2: Caption Sanitization
describe('Caption Sanitization', (): void => {
  it('should return null for empty captions', (): void => {
    assert.strictEqual(sanitizeCaption(''), null);
    assert.strictEqual(sanitizeCaption('   '), null);
  });

  it('should return null for null/undefined', (): void => {
    assert.strictEqual(sanitizeCaption(null), null);
    assert.strictEqual(sanitizeCaption(undefined), null);
  });

  it('should trim whitespace from captions', (): void => {
    const caption = '  Beautiful sunset  ';
    const result = sanitizeCaption(caption);
    assert.strictEqual(result, 'Beautiful sunset');
  });

  it('should accept captions with special characters', (): void => {
    const caption = 'Photo with "quotes" and \\backslashes';
    const result = sanitizeCaption(caption);
    assert.strictEqual(result, caption);
  });

  it('should accept captions with Unicode and emoji', (): void => {
    const caption = 'Beautiful sunset 🌅 with friends 👫';
    const result = sanitizeCaption(caption);
    assert.strictEqual(result, caption);
  });

  it('should reject excessively long captions', (): void => {
    const longCaption = 'a'.repeat(SECURITY_LIMITS.MAX_CAPTION_LENGTH + 1);
    const result = sanitizeCaption(longCaption);
    assert.strictEqual(result, null);
  });

  it('should accept maximum length captions', (): void => {
    const maxCaption = 'a'.repeat(SECURITY_LIMITS.MAX_CAPTION_LENGTH);
    const result = sanitizeCaption(maxCaption);
    assert.strictEqual(result, maxCaption);
  });
});

// Test Suite 3: Album Name Sanitization
describe('Album Name Sanitization', (): void => {
  it('should return default for empty album names', (): void => {
    const result = sanitizeAlbumName('');
    assert.strictEqual(result, 'Google Photos Shared Album');
  });

  it('should return default for null/undefined', (): void => {
    assert.strictEqual(sanitizeAlbumName(null), 'Google Photos Shared Album');
    assert.strictEqual(sanitizeAlbumName(undefined), 'Google Photos Shared Album');
  });

  it('should trim whitespace from album names', (): void => {
    const albumName = '  Summer Vacation 2026  ';
    const result = sanitizeAlbumName(albumName);
    assert.strictEqual(result, 'Summer Vacation 2026');
  });

  it('should accept album names with special characters', (): void => {
    const albumName = "Mom's Birthday 2026";
    const result = sanitizeAlbumName(albumName);
    assert.strictEqual(result, albumName);
  });

  it('should return default for excessively long album names', (): void => {
    const longName = 'a'.repeat(SECURITY_LIMITS.MAX_ALBUM_NAME_LENGTH + 1);
    const result = sanitizeAlbumName(longName);
    assert.strictEqual(result, 'Google Photos Shared Album');
  });
});

// Test Suite 4: Photo Count Validation
describe('Photo Count Validation', (): void => {
  it('should accept valid photo counts', (): void => {
    assert.strictEqual(validatePhotoCount(0), 0);
    assert.strictEqual(validatePhotoCount(142), 142);
    assert.strictEqual(validatePhotoCount(10000), 10000);
  });

  it('should return 0 for negative counts', (): void => {
    const result = validatePhotoCount(-1);
    assert.strictEqual(result, 0);
  });

  it('should clamp excessive counts', (): void => {
    const result = validatePhotoCount(100000);
    assert.strictEqual(result, SECURITY_LIMITS.MAX_PHOTO_COUNT);
  });

  it('should return 0 for null/undefined', (): void => {
    assert.strictEqual(validatePhotoCount(null), 0);
    assert.strictEqual(validatePhotoCount(undefined), 0);
  });

  it('should return 0 for NaN', (): void => {
    assert.strictEqual(validatePhotoCount(NaN), 0);
  });

  it('should floor decimal values', (): void => {
    assert.strictEqual(validatePhotoCount(142.7), 142);
  });
});

// Test Suite 5: Timestamp Validation
describe('Timestamp Validation', (): void => {
  it('should accept valid ISO 8601 timestamps', (): void => {
    const timestamp = '2026-01-18T20:00:00.000Z';
    const result = validateTimestamp(timestamp);
    assert.strictEqual(result, timestamp);
  });

  it('should convert valid dates to ISO format', (): void => {
    const timestamp = '2026-01-18T20:00:00Z';
    const result = validateTimestamp(timestamp);
    const date = new Date(result);
    assert.ok(!isNaN(date.getTime()));
  });

  it('should return current time for invalid timestamps', (): void => {
    const result = validateTimestamp('invalid-date');
    const date = new Date(result);
    assert.ok(!isNaN(date.getTime()));
  });

  it('should return current time for null/undefined', (): void => {
    const result1 = validateTimestamp(null);
    const result2 = validateTimestamp(undefined);
    assert.ok(!isNaN(new Date(result1).getTime()));
    assert.ok(!isNaN(new Date(result2).getTime()));
  });
});

// Test Suite 6: Complete PhotoData Validation
describe('Complete PhotoData Validation', (): void => {
  it('should accept valid photo data', (): void => {
    const photoData = {
      photo_url: 'https://lh3.googleusercontent.com/photo=w800-h480',
      thumbnail_url: 'https://lh3.googleusercontent.com/photo=w400-h300',
      caption: null,
      timestamp: '2026-01-18T20:00:00.000Z',
      album_name: 'Summer Vacation',
      photo_count: 142,
    };
    assert.strictEqual(validatePhotoData(photoData), true);
  });

  it('should reject photo data with invalid photo URL', (): void => {
    const photoData = {
      photo_url: 'https://malicious.com/photo.jpg',
      thumbnail_url: 'https://lh3.googleusercontent.com/photo=w400-h300',
      caption: null,
      timestamp: '2026-01-18T20:00:00.000Z',
      album_name: 'Summer Vacation',
      photo_count: 142,
    };
    assert.strictEqual(validatePhotoData(photoData), false);
  });

  it('should reject photo data with invalid thumbnail URL', (): void => {
    const photoData = {
      photo_url: 'https://lh3.googleusercontent.com/photo=w800-h480',
      thumbnail_url: 'https://malicious.com/thumbnail.jpg',
      caption: null,
      timestamp: '2026-01-18T20:00:00.000Z',
      album_name: 'Summer Vacation',
      photo_count: 142,
    };
    assert.strictEqual(validatePhotoData(photoData), false);
  });

  it('should reject photo data with negative photo count', (): void => {
    const photoData = {
      photo_url: 'https://lh3.googleusercontent.com/photo=w800-h480',
      thumbnail_url: 'https://lh3.googleusercontent.com/photo=w400-h300',
      caption: null,
      timestamp: '2026-01-18T20:00:00.000Z',
      album_name: 'Summer Vacation',
      photo_count: -1,
    };
    assert.strictEqual(validatePhotoData(photoData), false);
  });

  it('should reject photo data with excessive photo count', (): void => {
    const photoData = {
      photo_url: 'https://lh3.googleusercontent.com/photo=w800-h480',
      thumbnail_url: 'https://lh3.googleusercontent.com/photo=w400-h300',
      caption: null,
      timestamp: '2026-01-18T20:00:00.000Z',
      album_name: 'Summer Vacation',
      photo_count: 100000,
    };
    assert.strictEqual(validatePhotoData(photoData), false);
  });
});

console.log('\n✅ Security validator tests completed!\n');
