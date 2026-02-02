/**
 * Tests for Album URL Hasher
 *
 * Run with: tsx --test src/tests/test-album-hasher.ts
 *
 * Tests SHA-256 hashing of album URLs for privacy-preserving history tracking.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { hashAlbumUrl } from '../lib/album-hasher';

console.log('🧪 Testing Album URL Hasher\n');

describe('hashAlbumUrl', (): void => {
  it('should produce deterministic hash - same URL always produces same hash', async (): Promise<void> => {
    const url = 'https://photos.app.goo.gl/ABC123';

    const hash1 = await hashAlbumUrl(url);
    const hash2 = await hashAlbumUrl(url);
    const hash3 = await hashAlbumUrl(url);

    assert.strictEqual(hash1, hash2, 'First and second hash should be identical');
    assert.strictEqual(hash2, hash3, 'Second and third hash should be identical');
  });

  it('should produce different hashes for different URLs', async (): Promise<void> => {
    const url1 = 'https://photos.app.goo.gl/ABC123';
    const url2 = 'https://photos.app.goo.gl/XYZ789';
    const url3 = 'https://photos.app.goo.gl/ABC124';

    const hash1 = await hashAlbumUrl(url1);
    const hash2 = await hashAlbumUrl(url2);
    const hash3 = await hashAlbumUrl(url3);

    assert.notStrictEqual(hash1, hash2, 'Different URLs should have different hashes');
    assert.notStrictEqual(
      hash1,
      hash3,
      'Even slightly different URLs should have different hashes'
    );
    assert.notStrictEqual(hash2, hash3, 'All URLs should have unique hashes');
  });

  it('should produce 64-character hash (SHA-256)', async (): Promise<void> => {
    const url = 'https://photos.app.goo.gl/TEST';
    const hash = await hashAlbumUrl(url);

    assert.strictEqual(
      hash.length,
      64,
      'SHA-256 hash should be 64 characters (256 bits / 4 bits per hex char)'
    );
  });

  it('should contain only hexadecimal characters [0-9a-f]', async (): Promise<void> => {
    const url = 'https://photos.app.goo.gl/HexTest';
    const hash = await hashAlbumUrl(url);

    const hexRegex = /^[0-9a-f]+$/;
    assert.ok(hexRegex.test(hash), 'Hash should contain only hex characters [0-9a-f]');
  });

  it('should handle special characters in URLs', async (): Promise<void> => {
    const testUrls = [
      'https://photos.app.goo.gl/ABC-123_456',
      'https://photos.google.com/share/AF1QipO4_Y5pseqWDPSlY7?key=value',
      'https://example.com/path?query=value&special=!@#$%^&*()',
      'https://example.com/unicode/日本語/한국어/中文',
    ];

    for (const url of testUrls) {
      const hash = await hashAlbumUrl(url);

      assert.strictEqual(hash.length, 64);
      assert.ok(/^[0-9a-f]+$/.test(hash));
    }
  });

  it('should handle very long URLs (>1000 characters)', async (): Promise<void> => {
    const baseUrl = 'https://photos.google.com/share/';
    const longPath = 'A'.repeat(1000);
    const veryLongUrl = baseUrl + longPath;

    assert.ok(veryLongUrl.length > 1000, 'Test URL should be >1000 characters');

    const hash = await hashAlbumUrl(veryLongUrl);

    assert.strictEqual(hash.length, 64, 'Hash of long URL should still be 64 characters');
    assert.ok(/^[0-9a-f]+$/.test(hash), 'Hash of long URL should be valid hex');
  });

  it('should handle empty string', async (): Promise<void> => {
    const hash = await hashAlbumUrl('');

    // SHA-256 of empty string is a known constant
    const emptyStringHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    assert.strictEqual(
      hash,
      emptyStringHash,
      'Hash of empty string should match known SHA-256 value'
    );
    assert.strictEqual(hash.length, 64, 'Even empty string should produce 64-char hash');
  });

  it('should be case-sensitive', async (): Promise<void> => {
    const lowerUrl = 'https://photos.app.goo.gl/abc123';
    const upperUrl = 'https://photos.app.goo.gl/ABC123';

    const lowerHash = await hashAlbumUrl(lowerUrl);
    const upperHash = await hashAlbumUrl(upperUrl);

    assert.notStrictEqual(lowerHash, upperHash, 'Case-different URLs should have different hashes');
  });

  it('should work with real Google Photos URL formats', async (): Promise<void> => {
    const realUrls = [
      'https://photos.app.goo.gl/ENK6C44K85QgVHPH8',
      'https://photos.google.com/share/AF1QipO4_Y5pseqWDPSlY7AAo0wmg76xW4gX0kOz8-p_',
      'https://photos.google.com/u/0/album/AF1QipO4_Y5pseqWDPSlY7AAo0wmg76xW4gX0kOz8-p_',
    ];

    const hashes = new Set<string>();

    for (const url of realUrls) {
      const hash = await hashAlbumUrl(url);
      hashes.add(hash);

      assert.strictEqual(hash.length, 64);
      assert.ok(/^[0-9a-f]+$/.test(hash));
    }

    // All hashes should be unique
    assert.strictEqual(hashes.size, realUrls.length, 'All URLs should produce unique hashes');
  });
});

console.log('\n✅ All album hasher tests completed!\n');
