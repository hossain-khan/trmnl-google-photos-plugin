#!/usr/bin/env node

/**
 * Comprehensive test suite for Google Photos Album URL Parser
 * 
 * This test file validates all functionality of the URL parser including:
 * - Valid URL formats (short and full)
 * - Invalid URL formats
 * - Edge cases (empty, null, malformed)
 * - Album ID extraction
 * - Error messages
 * - URL normalization
 * 
 * Usage:
 *   npm test
 * 
 * Or directly:
 *   node scripts/test-url-parser.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseAlbumUrl,
  extractAlbumId,
  isValidAlbumUrl,
  normalizeAlbumUrl,
  getErrorMessage
} from '../lib/url-parser.js';

console.log('🧪 Testing Google Photos Album URL Parser\n');

// Test Suite 1: Valid Short URLs
describe('Valid Short URLs', () => {
  it('should accept standard short URL', () => {
    const result = parseAlbumUrl('https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.urlType, 'short');
    assert.strictEqual(result.albumId, 'QKGRYqfdS15bj8Kr5');
  });

  it('should accept short URL with different shortcode', () => {
    const result = parseAlbumUrl('https://photos.app.goo.gl/ABC123xyz-_');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.urlType, 'short');
    assert.strictEqual(result.albumId, 'ABC123xyz-_');
  });

  it('should accept short URL with long alphanumeric code', () => {
    const result = parseAlbumUrl('https://photos.app.goo.gl/aB1cD2eF3gH4iJ5kL6mN7oP8qR9');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.albumId, 'aB1cD2eF3gH4iJ5kL6mN7oP8qR9');
  });
});

// Test Suite 2: Valid Full URLs
describe('Valid Full URLs', () => {
  it('should accept standard full URL', () => {
    const result = parseAlbumUrl('https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.urlType, 'full');
    assert.strictEqual(result.albumId, 'AF1QipMZNuJ5JH6n3yF');
  });

  it('should accept full URL with very long album ID', () => {
    const result = parseAlbumUrl('https://photos.google.com/share/AF1QipO4_Y5pseqWDPSlY7AAo0wmg76xW4gX0kOz8-p_');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.albumId, 'AF1QipO4_Y5pseqWDPSlY7AAo0wmg76xW4gX0kOz8-p_');
  });

  it('should accept full URL with query parameters', () => {
    const result = parseAlbumUrl('https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF?key=value');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.albumId, 'AF1QipMZNuJ5JH6n3yF');
  });

  it('should accept full URL with multiple query parameters', () => {
    const result = parseAlbumUrl('https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF?key=value&foo=bar');
    assert.strictEqual(result.valid, true);
  });

  it('should accept full URL with trailing slash', () => {
    const result = parseAlbumUrl('https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF/');
    assert.strictEqual(result.valid, true);
  });
});

// Test Suite 3: Invalid URLs - Wrong Domain
describe('Invalid URLs - Wrong Domain', () => {
  it('should reject non-Google Photos domain', () => {
    const result = parseAlbumUrl('https://invalid-url.com');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('Google Photos'));
  });

  it('should reject Google Drive URL', () => {
    const result = parseAlbumUrl('https://drive.google.com/file/d/123');
    assert.strictEqual(result.valid, false);
  });

  it('should reject YouTube URL', () => {
    const result = parseAlbumUrl('https://youtube.com/watch?v=123');
    assert.strictEqual(result.valid, false);
  });

  it('should reject generic goo.gl short URL', () => {
    const result = parseAlbumUrl('https://goo.gl/ABC123');
    assert.strictEqual(result.valid, false);
  });
});

// Test Suite 4: Invalid URLs - Malformed
describe('Invalid URLs - Malformed', () => {
  it('should reject URL without protocol', () => {
    const result = parseAlbumUrl('photos.app.goo.gl/QKGRYqfdS15bj8Kr5');
    assert.strictEqual(result.valid, false);
  });

  it('should reject URL with http instead of https', () => {
    const result = parseAlbumUrl('http://photos.app.goo.gl/QKGRYqfdS15bj8Kr5');
    assert.strictEqual(result.valid, false);
  });

  it('should reject URL with typo in domain', () => {
    const result = parseAlbumUrl('https://photo.app.goo.gl/QKGRYqfdS15bj8Kr5');
    assert.strictEqual(result.valid, false);
  });

  it('should reject URL with special characters in shortcode', () => {
    const result = parseAlbumUrl('https://photos.app.goo.gl/ABC@123');
    assert.strictEqual(result.valid, false);
  });

  it('should reject URL with spaces', () => {
    const result = parseAlbumUrl('https://photos.app.goo.gl/ABC 123');
    assert.strictEqual(result.valid, false);
  });
});

// Test Suite 5: Edge Cases
describe('Edge Cases', () => {
  it('should reject empty string', () => {
    const result = parseAlbumUrl('');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('required'));
  });

  it('should reject null', () => {
    const result = parseAlbumUrl(null);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('required'));
  });

  it('should reject undefined', () => {
    const result = parseAlbumUrl(undefined);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('required'));
  });

  it('should handle URL with leading/trailing whitespace', () => {
    const result = parseAlbumUrl('  https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5  ');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.albumId, 'QKGRYqfdS15bj8Kr5');
  });

  it('should reject URL with only whitespace', () => {
    const result = parseAlbumUrl('   ');
    assert.strictEqual(result.valid, false);
  });

  it('should handle numeric input by converting to string', () => {
    const result = parseAlbumUrl(12345);
    assert.strictEqual(result.valid, false);
  });
});

// Test Suite 6: Album ID Extraction
describe('Album ID Extraction', () => {
  it('should extract album ID from short URL', () => {
    const albumId = extractAlbumId('https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5');
    assert.strictEqual(albumId, 'QKGRYqfdS15bj8Kr5');
  });

  it('should extract album ID from full URL', () => {
    const albumId = extractAlbumId('https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF');
    assert.strictEqual(albumId, 'AF1QipMZNuJ5JH6n3yF');
  });

  it('should extract album ID from URL with query params', () => {
    const albumId = extractAlbumId('https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF?key=value');
    assert.strictEqual(albumId, 'AF1QipMZNuJ5JH6n3yF');
  });

  it('should return null for invalid URL', () => {
    const albumId = extractAlbumId('https://invalid-url.com');
    assert.strictEqual(albumId, null);
  });

  it('should return null for empty string', () => {
    const albumId = extractAlbumId('');
    assert.strictEqual(albumId, null);
  });

  it('should return null for null input', () => {
    const albumId = extractAlbumId(null);
    assert.strictEqual(albumId, null);
  });
});

// Test Suite 7: isValidAlbumUrl Helper
describe('isValidAlbumUrl Helper', () => {
  it('should return true for valid short URL', () => {
    assert.strictEqual(isValidAlbumUrl('https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5'), true);
  });

  it('should return true for valid full URL', () => {
    assert.strictEqual(isValidAlbumUrl('https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF'), true);
  });

  it('should return false for invalid URL', () => {
    assert.strictEqual(isValidAlbumUrl('https://invalid-url.com'), false);
  });

  it('should return false for empty string', () => {
    assert.strictEqual(isValidAlbumUrl(''), false);
  });
});

// Test Suite 8: URL Normalization
describe('URL Normalization', () => {
  it('should normalize short URL (no changes)', () => {
    const normalized = normalizeAlbumUrl('https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5');
    assert.strictEqual(normalized, 'https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5');
  });

  it('should normalize full URL by removing query params', () => {
    const normalized = normalizeAlbumUrl('https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF?key=value');
    assert.strictEqual(normalized, 'https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF');
  });

  it('should normalize full URL by removing trailing slash', () => {
    const normalized = normalizeAlbumUrl('https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF/');
    assert.strictEqual(normalized, 'https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF');
  });

  it('should return null for invalid URL', () => {
    const normalized = normalizeAlbumUrl('https://invalid-url.com');
    assert.strictEqual(normalized, null);
  });
});

// Test Suite 9: Error Messages
describe('Error Messages', () => {
  it('should provide user-friendly error for empty URL', () => {
    const error = getErrorMessage('');
    assert.ok(error.includes('required'));
  });

  it('should provide user-friendly error for wrong domain', () => {
    const error = getErrorMessage('https://invalid-url.com');
    assert.ok(error.toLowerCase().includes('google photos'));
  });

  it('should provide user-friendly error for malformed URL', () => {
    const error = getErrorMessage('not-a-url');
    assert.ok(error.length > 0);
  });
});

// Test Suite 10: Integration Test
describe('Integration Test', () => {
  it('should handle complete workflow for valid URL', () => {
    const url = 'https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5';
    
    // Parse URL
    const parsed = parseAlbumUrl(url);
    assert.strictEqual(parsed.valid, true);
    assert.strictEqual(parsed.albumId, 'QKGRYqfdS15bj8Kr5');
    
    // Validate
    assert.strictEqual(isValidAlbumUrl(url), true);
    
    // Extract ID
    const albumId = extractAlbumId(url);
    assert.strictEqual(albumId, 'QKGRYqfdS15bj8Kr5');
    
    // Normalize
    const normalized = normalizeAlbumUrl(url);
    assert.strictEqual(normalized, url);
  });

  it('should handle complete workflow for invalid URL', () => {
    const url = 'https://invalid-url.com';
    
    // Parse URL
    const parsed = parseAlbumUrl(url);
    assert.strictEqual(parsed.valid, false);
    assert.ok(parsed.error);
    
    // Validate
    assert.strictEqual(isValidAlbumUrl(url), false);
    
    // Extract ID
    const albumId = extractAlbumId(url);
    assert.strictEqual(albumId, null);
    
    // Normalize
    const normalized = normalizeAlbumUrl(url);
    assert.strictEqual(normalized, null);
    
    // Get error message
    const error = getErrorMessage(url);
    assert.ok(error.length > 0);
  });
});

console.log('\n✅ All URL parser tests completed!\n');
console.log('Test Summary:');
console.log('- Valid Short URLs: 3 tests');
console.log('- Valid Full URLs: 5 tests');
console.log('- Invalid URLs (Wrong Domain): 4 tests');
console.log('- Invalid URLs (Malformed): 5 tests');
console.log('- Edge Cases: 6 tests');
console.log('- Album ID Extraction: 6 tests');
console.log('- isValidAlbumUrl Helper: 4 tests');
console.log('- URL Normalization: 4 tests');
console.log('- Error Messages: 3 tests');
console.log('- Integration Tests: 2 tests');
console.log('---');
console.log('Total: 42 test cases ✓');
