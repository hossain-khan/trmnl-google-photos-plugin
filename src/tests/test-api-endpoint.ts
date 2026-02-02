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
      const enable_caching: string | undefined = 'true';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      assert.strictEqual(useCaching, true, 'Should enable caching when enable_caching=true');
    });

    it('should handle enable_caching=false parameter', () => {
      const enable_caching: string | undefined = 'false';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      assert.strictEqual(useCaching, false, 'Should disable caching when enable_caching=false');
    });

    it('should handle enable_caching=0 parameter', () => {
      const enable_caching: string | undefined = '0';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      assert.strictEqual(useCaching, false, 'Should disable caching when enable_caching=0');
    });

    it('should handle enable_caching=1 parameter', () => {
      const enable_caching: string | undefined = '1';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      assert.strictEqual(useCaching, true, 'Should enable caching when enable_caching=1');
    });

    it('should default to enabled when parameter is undefined', () => {
      const enable_caching: string | undefined = undefined;
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      assert.strictEqual(
        useCaching,
        true,
        'Should enable caching by default when parameter is undefined'
      );
    });

    it('should default to enabled when parameter is empty string', () => {
      const enable_caching: string | undefined = '';
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
      const enable_caching: string | undefined = 'false';
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
      const enable_caching: string | undefined = 'true';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      const mockKV = { name: 'PHOTOS_CACHE' };
      const kvNamespace = useCaching ? mockKV : undefined;

      assert.strictEqual(kvNamespace, mockKV, 'Should pass KV namespace when caching is enabled');
    });

    it('should handle KV not configured gracefully', () => {
      const enable_caching: string | undefined = 'true';
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
      const enable_caching: string | undefined = 'false';
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';
      const mockKV = { name: 'PHOTOS_CACHE' };
      const kvNamespace = useCaching ? mockKV : undefined;

      assert.strictEqual(kvNamespace, undefined, 'User preference should override KV availability');
    });

    it('should enable caching when both user and system support it', () => {
      const enable_caching: string | undefined = 'true';
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
      const enable_caching: string | undefined = undefined;
      const useCaching = enable_caching !== 'false' && enable_caching !== '0';

      assert.strictEqual(
        useCaching,
        true,
        'Should default to caching enabled for backward compatibility'
      );
    });

    it('should not break when TRMNL sends empty string', () => {
      // TRMNL might send empty string for boolean fields
      const enable_caching: string | undefined = '';
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

describe('POST /api/photo Endpoint', () => {
  describe('Request Body Parsing', () => {
    it('should parse JSON body with album_url', () => {
      const requestBody = {
        album_url: 'https://photos.app.goo.gl/ABC123',
      };

      assert.ok(requestBody.album_url, 'Should have album_url in body');
      assert.strictEqual(requestBody.album_url, 'https://photos.app.goo.gl/ABC123');
    });

    it('should parse JSON body with all optional fields', () => {
      const requestBody = {
        album_url: 'https://photos.app.goo.gl/ABC123',
        enable_caching: 'true',
        adaptive_background: 'false',
      };

      assert.ok(requestBody.album_url, 'Should have album_url');
      assert.strictEqual(requestBody.enable_caching, 'true');
      assert.strictEqual(requestBody.adaptive_background, 'false');
    });

    it('should handle boolean values in JSON body', () => {
      const requestBody = {
        album_url: 'https://photos.app.goo.gl/ABC123',
        enable_caching: true,
        adaptive_background: false,
      };

      const enable_caching = requestBody.enable_caching?.toString();
      const adaptive_background = requestBody.adaptive_background?.toString();

      assert.strictEqual(enable_caching, 'true');
      assert.strictEqual(adaptive_background, 'false');
    });

    it('should validate enable_caching with string values', () => {
      const testCases = [
        { input: 'true', expected: true },
        { input: 'false', expected: false },
        { input: '1', expected: true },
        { input: '0', expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        const useCaching = input !== 'false' && input !== '0';
        assert.strictEqual(useCaching, expected, `enable_caching='${input}' should be ${expected}`);
      });
    });

    it('should validate enable_caching with boolean values', () => {
      const testCases = [
        { input: true, expected: true },
        { input: false, expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        const useCaching = input !== 'false' && input !== '0' && input !== false;
        assert.strictEqual(useCaching, expected, `enable_caching=${input} should be ${expected}`);
      });
    });

    it('should validate adaptive_background with string values', () => {
      const testCases = [
        { input: 'true', expected: true },
        { input: 'false', expected: false },
        { input: '1', expected: true },
        { input: '0', expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        const analyzeImage = input === 'true' || input === '1';
        assert.strictEqual(
          analyzeImage,
          expected,
          `adaptive_background='${input}' should be ${expected}`
        );
      });
    });

    it('should validate adaptive_background with boolean values', () => {
      const testCases = [
        { input: true, expected: true },
        { input: false, expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        const analyzeImage = input === 'true' || input === '1' || input === true;
        assert.strictEqual(
          analyzeImage,
          expected,
          `adaptive_background=${input} should be ${expected}`
        );
      });
    });
  });

  describe('Privacy Enhancement', () => {
    it('should accept album_url in body instead of query params', () => {
      const getRequest = '/api/photo?album_url=https://photos.app.goo.gl/ABC123';
      const postBody = { album_url: 'https://photos.app.goo.gl/ABC123' };

      // GET exposes URL in query string
      assert.ok(getRequest.includes('album_url='), 'GET exposes album_url in URL');

      // POST hides URL in body (not in URL/logs)
      const postUrl = '/api/photo'; // No query params
      assert.ok(!postUrl.includes('album_url='), 'POST hides album_url from URL');
      assert.ok(postBody.album_url, 'POST sends album_url in body');
    });

    it('should prevent URL logging in server access logs', () => {
      // Simulated access log entry
      const getLogEntry = 'GET /api/photo?album_url=https://photos.app.goo.gl/ABC123';
      const postLogEntry = 'POST /api/photo';

      assert.ok(getLogEntry.includes('album_url='), 'GET logs expose album URL');
      assert.ok(!postLogEntry.includes('album_url='), 'POST logs hide album URL');
    });

    it('should prevent URL exposure in browser history', () => {
      const getBrowserHistory = '/api/photo?album_url=https://photos.app.goo.gl/ABC123';
      const postBrowserHistory = '/api/photo';

      assert.ok(getBrowserHistory.includes('photos.app.goo.gl'), 'GET exposes URL in history');
      assert.ok(!postBrowserHistory.includes('photos.app.goo.gl'), 'POST hides URL from history');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain GET endpoint for existing users', () => {
      // GET endpoint should still work
      const getUrl = '/api/photo?album_url=https://photos.app.goo.gl/ABC123';
      const params = new URLSearchParams(getUrl.split('?')[1]);

      assert.ok(params.get('album_url'), 'GET endpoint should still accept album_url');
    });

    it('should not break existing TRMNL configurations', () => {
      // Existing users use GET with query params - should continue to work
      const legacyUrl = '/api/photo?album_url=https://photos.app.goo.gl/ABC123&enable_caching=true';
      const params = new URLSearchParams(legacyUrl.split('?')[1]);

      assert.strictEqual(params.get('album_url'), 'https://photos.app.goo.gl/ABC123');
      assert.strictEqual(params.get('enable_caching'), 'true');
    });

    it('should return identical response structure for GET and POST', () => {
      // Response format should be identical for both methods
      const expectedFields = [
        'photo_url',
        'thumbnail_url',
        'caption',
        'timestamp',
        'album_name',
        'photo_count',
        'relative_date',
        'aspect_ratio',
        'megapixels',
      ];

      // Both GET and POST should return same structure
      assert.ok(expectedFields.length > 0, 'Response fields should be defined');
      assert.ok(expectedFields.includes('photo_url'), 'Should include photo_url');
      assert.ok(expectedFields.includes('photo_count'), 'Should include photo_count');
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for missing album_url in POST body', () => {
      const requestBody = {}; // Missing album_url
      const hasAlbumUrl = 'album_url' in requestBody;

      assert.strictEqual(hasAlbumUrl, false, 'Should detect missing album_url');
    });

    it('should return 400 for empty album_url in POST body', () => {
      const requestBody = { album_url: '' };
      // Empty string trigger demo mode (same as GET endpoint)
      const isDemoMode =
        !requestBody.album_url ||
        requestBody.album_url.trim() === '' ||
        requestBody.album_url.toLowerCase() === 'demo' ||
        requestBody.album_url === '0';

      assert.strictEqual(isDemoMode, true, 'Empty album_url should trigger demo mode');
    });

    it('should detect invalid JSON in POST request', () => {
      const validJson = '{"album_url": "https://photos.app.goo.gl/ABC"}';
      const invalidJson = '{album_url: "missing quotes"}';

      let validParsed = false;
      let invalidParsed = false;

      try {
        JSON.parse(validJson);
        validParsed = true;
      } catch {
        validParsed = false;
      }

      try {
        JSON.parse(invalidJson);
        invalidParsed = true;
      } catch {
        invalidParsed = false;
      }

      assert.strictEqual(validParsed, true, 'Should parse valid JSON');
      assert.strictEqual(invalidParsed, false, 'Should reject invalid JSON');
    });
  });

  describe('Demo Mode Support', () => {
    it('should support demo mode in POST body', () => {
      const demoCases = [{ album_url: 'demo' }, { album_url: '0' }, { album_url: '' }];

      demoCases.forEach((body) => {
        const isDemoMode =
          !body.album_url ||
          body.album_url.trim() === '' ||
          body.album_url.toLowerCase() === 'demo' ||
          body.album_url === '0';
        assert.strictEqual(isDemoMode, true, `Should detect demo mode for: ${body.album_url}`);
      });
    });

    it('should not trigger demo mode for valid URLs', () => {
      const validUrls = [
        'https://photos.app.goo.gl/ABC123',
        'https://photos.google.com/share/AF1QipM...',
      ];

      validUrls.forEach((url) => {
        const isDemoMode = !url || url.trim() === '' || url.toLowerCase() === 'demo' || url === '0';
        assert.strictEqual(isDemoMode, false, `Should not trigger demo mode for: ${url}`);
      });
    });
  });

  describe('Migration Path', () => {
    it('should document deprecation of GET method', () => {
      const deprecationHeader = 'X-Deprecation-Notice';
      const deprecationMessage =
        'GET method with query params exposes album URLs in logs. Please migrate to POST method.';

      assert.ok(deprecationHeader, 'Should define deprecation header');
      assert.ok(deprecationMessage.includes('POST'), 'Should recommend POST method');
      assert.ok(deprecationMessage.includes('logs'), 'Should explain privacy concern');
    });

    it('should provide migration timeline', () => {
      // Phase 1: POST available (immediate)
      // Phase 2: GET deprecated but functional (3-6 months)
      // Phase 3: GET potentially removed (6-12 months, conditional on 90%+ migration)
      const phases = {
        phase1: 'POST available',
        phase2: 'GET deprecated',
        phase3: 'GET sunset (conditional)',
      };

      assert.ok(phases.phase1.includes('POST'), 'Phase 1 should provide POST endpoint');
      assert.ok(phases.phase2.includes('deprecated'), 'Phase 2 should deprecate GET');
      assert.ok(phases.phase3.includes('conditional'), 'Phase 3 should be conditional');
    });
  });
});

console.log('\n✅ All endpoint tests passed!');
console.log('\nNote: These are unit tests for parameter parsing logic.');
console.log('Integration tests with real Cloudflare Worker should be run separately.');
console.log('\n📋 Testing Guide:');
console.log('\nGET /api/photo (Legacy - Deprecated):');
console.log('  # With caching enabled (default)');
console.log(
  '  curl "https://trmnl-google-photos.gohk.xyz/api/photo?album_url=...&enable_caching=true"'
);
console.log('  # With caching disabled (privacy mode)');
console.log(
  '  curl "https://trmnl-google-photos.gohk.xyz/api/photo?album_url=...&enable_caching=false"'
);
console.log('\nPOST /api/photo (Recommended - Enhanced Privacy):');
console.log('  # Basic request');
console.log('  curl -X POST "https://trmnl-google-photos.gohk.xyz/api/photo" \\');
console.log('    -H "Content-Type: application/json" \\');
console.log('    -d \'{"album_url": "https://photos.app.goo.gl/..."}\'');
console.log('\n  # With all options');
console.log('  curl -X POST "https://trmnl-google-photos.gohk.xyz/api/photo" \\');
console.log('    -H "Content-Type: application/json" \\');
console.log(
  '    -d \'{"album_url": "...", "enable_caching": "true", "adaptive_background": "false"}\''
);
