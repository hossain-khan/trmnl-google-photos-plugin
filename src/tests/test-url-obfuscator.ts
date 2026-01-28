/**
 * Test suite for URL obfuscator utility
 * Validates that PII is properly obfuscated in logs
 */

import { test } from 'node:test';
import assert from 'node:assert';
import {
  obfuscateUrl,
  obfuscateAlbumId,
  obfuscateCacheKey,
  obfuscatePhotoUid,
} from '../lib/url-obfuscator';

console.log('🧪 Testing URL Obfuscator Utility\n');

// Test obfuscateUrl function
test('obfuscateUrl - should obfuscate Google Photos album URLs', () => {
  const url = 'https://photos.app.goo.gl/ABC123XYZ789';
  const obfuscated = obfuscateUrl(url);

  assert.ok(obfuscated.includes('https://photos.app.goo.gl'), 'Should preserve domain');
  assert.ok(obfuscated.includes('...***'), 'Should include obfuscation marker');
  assert.ok(!obfuscated.includes('ABC123XYZ789'), 'Should not include full ID');
  assert.ok(obfuscated.length <= 50, 'Should be reasonably short');

  console.log(`  ✓ Album URL: ${url}`);
  console.log(`    Obfuscated: ${obfuscated}`);
});

test('obfuscateUrl - should obfuscate Google Photos photo URLs', () => {
  const url =
    'https://lh3.googleusercontent.com/pw/AP1GczMVeryLongPhotoIdHere1234567890abcdef=w1040-h780';
  const obfuscated = obfuscateUrl(url);

  assert.ok(obfuscated.includes('https://lh3.googleusercontent.com'), 'Should preserve domain');
  assert.ok(obfuscated.includes('...***'), 'Should include obfuscation marker');
  assert.ok(!obfuscated.includes('AP1GczMVeryLongPhotoIdHere'), 'Should not include full photo ID');

  console.log(`  ✓ Photo URL obfuscated`);
  console.log(`    Obfuscated: ${obfuscated}`);
});

test('obfuscateUrl - should handle null/undefined URLs', () => {
  assert.strictEqual(obfuscateUrl(null), '[no-url]');
  assert.strictEqual(obfuscateUrl(undefined), '[no-url]');
  assert.strictEqual(obfuscateUrl(''), '[no-url]');

  console.log('  ✓ Handles null/undefined/empty URLs');
});

test('obfuscateUrl - should handle invalid URLs gracefully', () => {
  const invalidUrl = 'not-a-valid-url-at-all';
  const obfuscated = obfuscateUrl(invalidUrl);

  assert.ok(obfuscated.includes('...***'), 'Should include obfuscation marker');
  assert.ok(obfuscated.length < invalidUrl.length, 'Should be shorter than original');

  console.log('  ✓ Handles invalid URLs gracefully');
});

test('obfuscateUrl - should respect maxLength parameter', () => {
  const url = 'https://photos.app.goo.gl/ABC123XYZ789';
  const obfuscated = obfuscateUrl(url, 30);

  assert.ok(obfuscated.length <= 35, 'Should respect maxLength (with some buffer)');

  console.log(`  ✓ Respects maxLength parameter: ${obfuscated}`);
});

// Test obfuscateAlbumId function
test('obfuscateAlbumId - should obfuscate album IDs', () => {
  const albumId = 'AF1QipN1234567890abcdef';
  const obfuscated = obfuscateAlbumId(albumId);

  assert.ok(obfuscated.startsWith('AF1Q'), 'Should show first 4 chars');
  assert.ok(obfuscated.includes('...***'), 'Should include obfuscation marker');
  assert.ok(!obfuscated.includes('1234567890abcdef'), 'Should not include rest of ID');

  console.log(`  ✓ Album ID: ${albumId}`);
  console.log(`    Obfuscated: ${obfuscated}`);
});

test('obfuscateAlbumId - should handle short album IDs', () => {
  const shortId = 'AB12';
  const obfuscated = obfuscateAlbumId(shortId);

  assert.ok(obfuscated.includes('...***'), 'Should include obfuscation marker');
  assert.ok(obfuscated.length < shortId.length + 10, 'Should be reasonably short');

  console.log('  ✓ Handles short album IDs');
});

test('obfuscateAlbumId - should handle null/undefined', () => {
  assert.strictEqual(obfuscateAlbumId(null), '[no-id]');
  assert.strictEqual(obfuscateAlbumId(undefined), '[no-id]');
  assert.strictEqual(obfuscateAlbumId(''), '[no-id]');

  console.log('  ✓ Handles null/undefined/empty IDs');
});

// Test obfuscateCacheKey function
test('obfuscateCacheKey - should obfuscate album cache keys', () => {
  const key = 'album:AF1QipN1234567890abcdef';
  const obfuscated = obfuscateCacheKey(key);

  assert.ok(obfuscated.startsWith('album:'), 'Should preserve prefix');
  assert.ok(obfuscated.includes('...***'), 'Should include obfuscation marker');
  assert.ok(!obfuscated.includes('1234567890abcdef'), 'Should not include full ID');

  console.log(`  ✓ Cache key: ${key}`);
  console.log(`    Obfuscated: ${obfuscated}`);
});

test('obfuscateCacheKey - should handle non-album cache keys', () => {
  const key = 'some-other-key-12345678';
  const obfuscated = obfuscateCacheKey(key);

  assert.ok(obfuscated.includes('...***'), 'Should include obfuscation marker');
  assert.ok(obfuscated.length < key.length, 'Should be shorter than original');

  console.log('  ✓ Handles non-album cache keys');
});

test('obfuscateCacheKey - should handle null/undefined', () => {
  assert.strictEqual(obfuscateCacheKey(null), '[no-key]');
  assert.strictEqual(obfuscateCacheKey(undefined), '[no-key]');

  console.log('  ✓ Handles null/undefined keys');
});

// Test obfuscatePhotoUid function
test('obfuscatePhotoUid - should obfuscate photo UIDs', () => {
  const uid = 'AF1QipMabcdef1234567890';
  const obfuscated = obfuscatePhotoUid(uid);

  assert.ok(obfuscated.startsWith('AF1Q'), 'Should show first 4 chars');
  assert.ok(obfuscated.includes('...***'), 'Should include obfuscation marker');
  assert.ok(!obfuscated.includes('abcdef1234567890'), 'Should not include rest of UID');

  console.log(`  ✓ Photo UID: ${uid}`);
  console.log(`    Obfuscated: ${obfuscated}`);
});

test('obfuscatePhotoUid - should handle null/undefined', () => {
  assert.strictEqual(obfuscatePhotoUid(null), '[no-uid]');
  assert.strictEqual(obfuscatePhotoUid(undefined), '[no-uid]');

  console.log('  ✓ Handles null/undefined UIDs');
});

console.log('\n✅ All URL obfuscator tests completed!\n');
