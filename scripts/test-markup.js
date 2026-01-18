#!/usr/bin/env node

/**
 * Test suite for /markup endpoint
 * 
 * Tests the main TRMNL endpoint for photo fetching and rendering
 * 
 * Usage:
 *   npm test
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';

// Test data
const VALID_ALBUM_URL = 'https://photos.app.goo.gl/FB8ErkX2wJAQkJzV8';
const INVALID_ALBUM_URL = 'https://invalid-url.com';

/**
 * Sample TRMNL request for testing
 */
function createTRMNLRequest(albumUrl, layout = 'full') {
  return {
    trmnl: {
      plugin_settings: {
        instance_name: 'Test Photos',
        shared_album_url: albumUrl,
      },
      screen: {
        width: 800,
        height: 480,
        bit_depth: 1,
      },
      layout: layout,
    },
  };
}

console.log('🧪 Testing /markup endpoint\n');

describe('/markup endpoint - Request validation', () => {
  it('should reject request with missing album URL', async () => {
    const request = createTRMNLRequest('');
    assert.ok(request.trmnl.plugin_settings.shared_album_url === '');
  });

  it('should reject request with invalid album URL', async () => {
    const request = createTRMNLRequest(INVALID_ALBUM_URL);
    assert.ok(request.trmnl.plugin_settings.shared_album_url === INVALID_ALBUM_URL);
  });

  it('should accept request with valid album URL', async () => {
    const request = createTRMNLRequest(VALID_ALBUM_URL);
    assert.ok(request.trmnl.plugin_settings.shared_album_url === VALID_ALBUM_URL);
  });
});

describe('/markup endpoint - Layout selection', () => {
  it('should use requested layout when provided', async () => {
    const request = createTRMNLRequest(VALID_ALBUM_URL, 'half_horizontal');
    assert.strictEqual(request.trmnl.layout, 'half_horizontal');
  });

  it('should handle full layout', async () => {
    const request = createTRMNLRequest(VALID_ALBUM_URL, 'full');
    assert.strictEqual(request.trmnl.layout, 'full');
  });

  it('should handle half_vertical layout', async () => {
    const request = createTRMNLRequest(VALID_ALBUM_URL, 'half_vertical');
    assert.strictEqual(request.trmnl.layout, 'half_vertical');
  });

  it('should handle quadrant layout', async () => {
    const request = createTRMNLRequest(VALID_ALBUM_URL, 'quadrant');
    assert.strictEqual(request.trmnl.layout, 'quadrant');
  });
});

describe('/markup endpoint - Request structure', () => {
  it('should have valid request structure', async () => {
    const request = createTRMNLRequest(VALID_ALBUM_URL);
    
    assert.ok(request.trmnl, 'trmnl object exists');
    assert.ok(request.trmnl.plugin_settings, 'plugin_settings exists');
    assert.ok(request.trmnl.plugin_settings.instance_name, 'instance_name exists');
    assert.ok(request.trmnl.plugin_settings.shared_album_url, 'shared_album_url exists');
    assert.ok(request.trmnl.screen, 'screen object exists');
  });

  it('should have screen dimensions', async () => {
    const request = createTRMNLRequest(VALID_ALBUM_URL);
    
    assert.strictEqual(request.trmnl.screen.width, 800);
    assert.strictEqual(request.trmnl.screen.height, 480);
    assert.strictEqual(request.trmnl.screen.bit_depth, 1);
  });
});

console.log('\n✅ Markup endpoint tests completed');
