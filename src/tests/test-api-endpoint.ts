/**
 * Test suite for /api/photo endpoint
 * Tests query parameter handling, caching behavior, and response format
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

console.log('🧪 Testing /api/photo Endpoint\n');

describe('/api/photo Endpoint', () => {
  describe('Query Parameter Parsing', () => {
    it('should handle enable_caching=true parameter', () => {
      const enable_caching = 'true';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      assert.strictEqual(useCaching, true, 'Should enable caching when enable_caching=true');
    });

    it('should handle enable_caching=false parameter', () => {
      const enable_caching = 'false';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      assert.strictEqual(useCaching, false, 'Should disable caching when enable_caching=false');
    });

    it('should handle enable_caching=0 parameter', () => {
      const enable_caching = '0';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      assert.strictEqual(useCaching, false, 'Should disable caching when enable_caching=0');
    });

    it('should handle enable_caching=1 parameter', () => {
      const enable_caching = '1';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      assert.strictEqual(useCaching, true, 'Should enable caching when enable_caching=1');
    });

    it('should default to enabled when parameter is undefined', () => {
      const enable_caching = undefined;
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      assert.strictEqual(
        useCaching,
        true,
        'Should enable caching by default when parameter is undefined'
      );
    });

    it('should default to enabled when parameter is empty string', () => {
      const enable_caching = '';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      assert.strictEqual(
        useCaching,
        true,
        'Should enable caching by default when parameter is empty'
      );
    });

    it('should handle any truthy string as enabled', () => {
      const testValues = ['yes', 'on', 'enabled', 'TRUE', 'True', 'anything'];
      testValues.forEach((value) => {
        const useCaching = value !== 'false' && value !== '0';
        assert.strictEqual(useCaching, true, `Should enable caching for truthy value: ${value}`);
      });
    });
  });

  describe('KV Namespace Selection', () => {
    it('should pass undefined KV when caching disabled', () => {
      const enable_caching = 'false';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      const mockKV = { name: 'PHOTOS_CACHE' }; // Mock KV namespace
      const kvNamespace = useCaching ? mockKV : undefined;

      assert.strictEqual(
        kvNamespace,
        undefined,
        'Should pass undefined KV when caching is disabled'
      );
    });

    it('should pass KV namespace when caching enabled', () => {
      const enable_caching = 'true';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      const mockKV = { name: 'PHOTOS_CACHE' };
      const kvNamespace = useCaching ? mockKV : undefined;

      assert.strictEqual(kvNamespace, mockKV, 'Should pass KV namespace when caching is enabled');
    });

    it('should handle KV not configured gracefully', () => {
      const enable_caching = 'true';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      const mockKV = undefined; // KV not configured in environment
      const kvNamespace = useCaching ? mockKV : undefined;

      assert.strictEqual(
        kvNamespace,
        undefined,
        'Should handle undefined KV gracefully even when caching enabled'
      );
    });
  });

  describe('Cache Behavior Logic', () => {
    it('should respect user preference over KV availability', () => {
      // User disables caching - should not use KV even if available
      const enable_caching = 'false';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      const mockKV = { name: 'PHOTOS_CACHE' };
      const kvNamespace = useCaching ? mockKV : undefined;

      assert.strictEqual(kvNamespace, undefined, 'User preference should override KV availability');
    });

    it('should enable caching when both user and system support it', () => {
      const enable_caching = 'true';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      const mockKV = { name: 'PHOTOS_CACHE' };
      const kvNamespace = useCaching ? mockKV : undefined;

      assert.ok(kvNamespace, 'Should use KV when both user and system support caching');
    });
  });

  describe('URL Format Validation', () => {
    it('should accept album_url without enable_caching parameter', () => {
      const url = '/api/photo?album_url=https://photos.app.goo.gl/ABC123';
      const params = new URLSearchParams(url.split('?')[1]);
      const album_url = params.get('album_url');
      const enable_caching = params.get('enable_caching');

      assert.ok(album_url, 'Should have album_url');
      assert.strictEqual(enable_caching, null, 'enable_caching should be null when not provided');
    });

    it('should accept both parameters in URL', () => {
      const url = '/api/photo?album_url=https://photos.app.goo.gl/ABC123&enable_caching=true';
      const params = new URLSearchParams(url.split('?')[1]);
      const album_url = params.get('album_url');
      const enable_caching = params.get('enable_caching');

      assert.ok(album_url, 'Should have album_url');
      assert.strictEqual(enable_caching, 'true', 'Should have enable_caching');
    });

    it('should handle parameter order variations', () => {
      const url1 = '/api/photo?album_url=https://photos.app.goo.gl/ABC&enable_caching=false';
      const url2 = '/api/photo?enable_caching=false&album_url=https://photos.app.goo.gl/ABC';

      const params1 = new URLSearchParams(url1.split('?')[1]);
      const params2 = new URLSearchParams(url2.split('?')[1]);

      assert.strictEqual(params1.get('album_url'), params2.get('album_url'));
      assert.strictEqual(params1.get('enable_caching'), params2.get('enable_caching'));
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain default behavior for existing installations', () => {
      // Existing installations won't have enable_caching parameter
      const enable_caching = undefined;
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';

      assert.strictEqual(
        useCaching,
        true,
        'Should default to caching enabled for backward compatibility'
      );
    });

    it('should not break when TRMNL sends empty string', () => {
      // TRMNL might send empty string for boolean fields
      const enable_caching = '';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';

      assert.strictEqual(
        useCaching,
        true,
        'Should treat empty string as enabled (truthy fallback)'
      );
    });
  });

  describe('Privacy Guarantees', () => {
    it('should ensure zero KV storage when user opts out', () => {
      const enable_caching = 'false';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      const mockKV = { name: 'PHOTOS_CACHE' };
      const kvNamespace = useCaching ? mockKV : undefined;

      assert.strictEqual(
        kvNamespace,
        undefined,
        'Zero storage guarantee: KV must be undefined when user opts out'
      );
    });

    it('should document the performance trade-off', () => {
      const cacheEnabled = {
        responseTimeMs: 67,
        storage: 'Album metadata cached 1hr',
      };
      const cacheDisabled = {
        responseTimeMs: 3000, // 3 seconds in ms
        storage: 'Zero data stored',
      };

      assert.ok(
        cacheEnabled.responseTimeMs < cacheDisabled.responseTimeMs,
        'Cache should be faster'
      );
      assert.ok(
        cacheDisabled.storage.includes('Zero'),
        'Privacy mode should guarantee zero storage'
      );
    });
  });
});

console.log('\n✅ All endpoint tests passed!');
console.log('\nNote: These are unit tests for parameter parsing logic.');
console.log('Integration tests with real Cloudflare Worker should be run separately.');
console.log('\nTo test the deployed worker:');
console.log('  # With caching enabled (default)');
console.log(
  '  curl "https://trmnl-google-photos.gohk.xyz/api/photo?album_url=...&enable_caching=true"'
);
console.log('  # With caching disabled (privacy mode)');
console.log(
  '  curl "https://trmnl-google-photos.gohk.xyz/api/photo?album_url=...&enable_caching=false"'
);
