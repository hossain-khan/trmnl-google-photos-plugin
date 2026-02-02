/**
 * Tests for Smart Photo Selection with Duplicate Prevention
 *
 * Run with: tsx --test src/tests/test-smart-photo-selection.ts
 *
 * Tests the privacy-preserving history tracking and duplicate prevention
 * features of the photo selection algorithm.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { selectRandomPhoto } from '../services/photo-fetcher';
import { hashAlbumUrl } from '../lib/album-hasher';
import type { GooglePhoto } from '../types';

console.log('🧪 Testing Smart Photo Selection with Duplicate Prevention\n');

/**
 * Create mock photos for testing
 */
function createMockPhotos(count: number): GooglePhoto[] {
  return Array.from({ length: count }, (_, i) => ({
    url: `https://lh3.googleusercontent.com/photo${i}`,
    uid: `uid${i}`,
    width: 1920,
    height: 1080,
    imageUpdateDate: Date.now(),
    albumAddDate: Date.now(),
  }));
}

/**
 * Create a mock KV namespace for testing
 */
function createMockKV(): KVNamespace & {
  storage: Map<string, { value: string; expiration: number }>;
} {
  const storage = new Map<string, { value: string; expiration: number }>();

  return {
    storage,
    get(key: string): Promise<string | null> {
      const item = storage.get(key);
      if (!item) return Promise.resolve(null);
      if (item.expiration < Date.now()) {
        storage.delete(key);
        return Promise.resolve(null);
      }
      return Promise.resolve(item.value);
    },
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
      const expiration = options?.expirationTtl
        ? Date.now() + options.expirationTtl * 1000
        : Date.now() + 86400000;
      storage.set(key, { value, expiration });
      return Promise.resolve();
    },
    delete(): Promise<void> {
      return Promise.resolve();
    },
    list(): Promise<{ keys: { name: string }[] }> {
      return Promise.resolve({ keys: Array.from(storage.keys()).map((name) => ({ name })) });
    },
    getWithMetadata(): Promise<{ value: string | null; metadata: null }> {
      return Promise.resolve({ value: null, metadata: null });
    },
  } as unknown as KVNamespace & { storage: Map<string, { value: string; expiration: number }> };
}

describe('Smart Photo Selection', (): void => {
  describe('Duplicate Prevention', (): void => {
    it('should not return duplicate photo in consecutive calls', async (): Promise<void> => {
      const mockPhotos = createMockPhotos(30);
      const mockKV = createMockKV();
      const albumUrl = 'https://photos.app.goo.gl/test123';

      const first = await selectRandomPhoto(mockPhotos, albumUrl, mockKV);
      const second = await selectRandomPhoto(mockPhotos, albumUrl, mockKV);

      assert.notStrictEqual(first.uid, second.uid, 'Consecutive photos should be different');
    });

    it('should exhaust all photos before repeating (album size 10)', async (): Promise<void> => {
      const smallAlbum = createMockPhotos(10);
      const mockKV = createMockKV();
      const albumUrl = 'https://photos.app.goo.gl/small';
      const selectedUids = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const photo = await selectRandomPhoto(smallAlbum, albumUrl, mockKV);
        selectedUids.add(photo.uid);
      }

      assert.strictEqual(selectedUids.size, 10, 'All 10 photos should be unique');
    });

    it('should handle large album (30 photos, history 20)', async (): Promise<void> => {
      const mockPhotos = createMockPhotos(30);
      const mockKV = createMockKV();
      const albumUrl = 'https://photos.app.goo.gl/large';
      const selectedIndexes: number[] = [];

      for (let i = 0; i < 25; i++) {
        const photo = await selectRandomPhoto(mockPhotos, albumUrl, mockKV);
        const index = mockPhotos.findIndex((p) => p.uid === photo.uid);
        selectedIndexes.push(index);
      }

      const last20 = selectedIndexes.slice(-20);
      assert.strictEqual(new Set(last20).size, 20, 'Last 20 selections should all be unique');
    });
  });

  describe('Fallback Behavior', (): void => {
    it('should fallback to simple random when KV unavailable', async (): Promise<void> => {
      const mockPhotos = createMockPhotos(30);
      const albumUrl = 'https://photos.app.goo.gl/test';

      const photo = await selectRandomPhoto(mockPhotos, albumUrl, undefined);

      assert.ok(
        mockPhotos.some((p) => p.uid === photo.uid),
        'Should return a valid photo'
      );
    });

    it('should fallback to simple random when albumUrl is undefined', async (): Promise<void> => {
      const mockPhotos = createMockPhotos(30);
      const mockKV = createMockKV();

      const photo = await selectRandomPhoto(mockPhotos, undefined, mockKV);

      assert.ok(
        mockPhotos.some((p) => p.uid === photo.uid),
        'Should return a valid photo'
      );
    });

    it('should handle single photo album gracefully', async (): Promise<void> => {
      const singlePhoto = createMockPhotos(1);
      const mockKV = createMockKV();
      const albumUrl = 'https://photos.app.goo.gl/single';

      const first = await selectRandomPhoto(singlePhoto, albumUrl, mockKV);
      const second = await selectRandomPhoto(singlePhoto, albumUrl, mockKV);

      assert.strictEqual(first.uid, second.uid, 'Same photo is acceptable for single-photo album');
    });

    it('should handle empty photos array with error', async (): Promise<void> => {
      const emptyPhotos: GooglePhoto[] = [];
      const mockKV = createMockKV();
      const albumUrl = 'https://photos.app.goo.gl/empty';

      await assert.rejects(
        async () => await selectRandomPhoto(emptyPhotos, albumUrl, mockKV),
        { message: 'No photos available to select from' },
        'Should throw error for empty album'
      );
    });
  });

  describe('Privacy Preservation', (): void => {
    it('should store privacy-preserving hash, not URL', async (): Promise<void> => {
      const mockPhotos = createMockPhotos(10);
      const mockKV = createMockKV();
      const albumUrl = 'https://photos.app.goo.gl/secret123';

      await selectRandomPhoto(mockPhotos, albumUrl, mockKV);

      const keys = Array.from(mockKV.storage.keys());
      const hasPlaintextUrl = keys.some((k) => k.includes('secret123') || k.includes(albumUrl));

      assert.strictEqual(hasPlaintextUrl, false, 'Album URL should not be stored in plaintext');
    });

    it('should use SHA-256 hash for KV key', async (): Promise<void> => {
      const mockPhotos = createMockPhotos(10);
      const mockKV = createMockKV();
      const albumUrl = 'https://photos.app.goo.gl/test';

      const hash = await hashAlbumUrl(albumUrl);
      await selectRandomPhoto(mockPhotos, albumUrl, mockKV);

      const expectedKey = `photo-history:${hash}`;
      const keys = Array.from(mockKV.storage.keys());

      assert.ok(keys.includes(expectedKey), 'Key should be photo-history:hash');
    });

    it('should use different keys for different albums', async (): Promise<void> => {
      const mockPhotos = createMockPhotos(10);
      const mockKV = createMockKV();
      const albumUrl1 = 'https://photos.app.goo.gl/album1';
      const albumUrl2 = 'https://photos.app.goo.gl/album2';

      await selectRandomPhoto(mockPhotos, albumUrl1, mockKV);
      await selectRandomPhoto(mockPhotos, albumUrl2, mockKV);

      const keys = Array.from(mockKV.storage.keys());
      assert.strictEqual(keys.length, 2, 'Should have 2 separate history entries');
    });
  });

  describe('TTL and Expiration', (): void => {
    it('should respect 1-week TTL for history', async (): Promise<void> => {
      const mockPhotos = createMockPhotos(10);
      const mockKV = createMockKV();
      const albumUrl = 'https://photos.app.goo.gl/ttl-test';

      await selectRandomPhoto(mockPhotos, albumUrl, mockKV);

      const hash = await hashAlbumUrl(albumUrl);
      const key = `photo-history:${hash}`;
      const stored = mockKV.storage.get(key);

      assert.ok(stored, 'History should be stored');

      const oneWeek = 604800 * 1000;
      const expectedExpiration = Date.now() + oneWeek;
      const tolerance = 5000;

      assert.ok(
        stored.expiration > expectedExpiration - tolerance,
        'Expiration should be approximately 1 week from now'
      );
      assert.ok(
        stored.expiration < expectedExpiration + tolerance,
        'Expiration should be approximately 1 week from now'
      );
    });
  });

  describe('History Management', (): void => {
    it('should limit history to adaptive window size', async (): Promise<void> => {
      const mockPhotos = createMockPhotos(30);
      const mockKV = createMockKV();
      const albumUrl = 'https://photos.app.goo.gl/window-test';

      for (let i = 0; i < 25; i++) {
        await selectRandomPhoto(mockPhotos, albumUrl, mockKV);
      }

      const hash = await hashAlbumUrl(albumUrl);
      const key = `photo-history:${hash}`;
      const stored = mockKV.storage.get(key);

      assert.ok(stored, 'History should be stored');
      const history = JSON.parse(stored.value);

      assert.ok(history.length <= 20, 'History should be capped at 20');
    });

    it('should use smaller window for small albums', async (): Promise<void> => {
      const smallAlbum = createMockPhotos(5);
      const mockKV = createMockKV();
      const albumUrl = 'https://photos.app.goo.gl/small-window';

      for (let i = 0; i < 10; i++) {
        await selectRandomPhoto(smallAlbum, albumUrl, mockKV);
      }

      const hash = await hashAlbumUrl(albumUrl);
      const key = `photo-history:${hash}`;
      const stored = mockKV.storage.get(key);

      assert.ok(stored, 'History should be stored');
      const history = JSON.parse(stored.value);

      assert.ok(history.length <= 4, 'History should be capped at 4 for 5-photo album');
    });

    it('should handle album that shrinks (invalid indexes in history)', async (): Promise<void> => {
      const largeAlbum = createMockPhotos(30);
      const mockKV = createMockKV();
      const albumUrl = 'https://photos.app.goo.gl/shrinking';

      for (let i = 0; i < 5; i++) {
        await selectRandomPhoto(largeAlbum, albumUrl, mockKV);
      }

      const smallerAlbum = createMockPhotos(10);

      const photo = await selectRandomPhoto(smallerAlbum, albumUrl, mockKV);
      assert.ok(
        smallerAlbum.some((p) => p.uid === photo.uid),
        'Should return valid photo from smaller album'
      );
    });

    it('should recover from corrupted history JSON', async (): Promise<void> => {
      const mockPhotos = createMockPhotos(10);
      const mockKV = createMockKV();
      const albumUrl = 'https://photos.app.goo.gl/corrupted';

      const hash = await hashAlbumUrl(albumUrl);
      const key = `photo-history:${hash}`;
      mockKV.storage.set(key, {
        value: 'not-valid-json{{{',
        expiration: Date.now() + 86400000,
      });

      const photo = await selectRandomPhoto(mockPhotos, albumUrl, mockKV);
      assert.ok(
        mockPhotos.some((p) => p.uid === photo.uid),
        'Should return valid photo after recovery'
      );
    });

    it('should handle history with non-number values', async (): Promise<void> => {
      const mockPhotos = createMockPhotos(10);
      const mockKV = createMockKV();
      const albumUrl = 'https://photos.app.goo.gl/bad-history';

      const hash = await hashAlbumUrl(albumUrl);
      const key = `photo-history:${hash}`;
      mockKV.storage.set(key, {
        value: JSON.stringify(['string', { object: true }, null, 1, 2]),
        expiration: Date.now() + 86400000,
      });

      const photo = await selectRandomPhoto(mockPhotos, albumUrl, mockKV);
      assert.ok(
        mockPhotos.some((p) => p.uid === photo.uid),
        'Should return valid photo'
      );
    });
  });

  describe('Regression Tests', (): void => {
    it('should maintain existing behavior when called without optional params', async (): Promise<void> => {
      const mockPhotos = createMockPhotos(30);

      const photo = await selectRandomPhoto(mockPhotos);

      assert.ok(
        mockPhotos.some((p) => p.uid === photo.uid),
        'Should return valid photo'
      );
      assert.ok(photo.uid.startsWith('uid'), 'Should have correct UID format');
    });

    it('should not throw for valid inputs', async (): Promise<void> => {
      const mockPhotos = createMockPhotos(100);
      const mockKV = createMockKV();
      const albumUrl = 'https://photos.app.goo.gl/perf';

      for (let i = 0; i < 50; i++) {
        const photo = await selectRandomPhoto(mockPhotos, albumUrl, mockKV);
        assert.ok(photo, 'Should return photo');
      }
    });

    it('should maintain performance (no significant slowdown)', async (): Promise<void> => {
      const mockPhotos = createMockPhotos(100);
      const iterations = 100;

      const start = Date.now();
      for (let i = 0; i < iterations; i++) {
        await selectRandomPhoto(mockPhotos, undefined, undefined);
      }
      const duration = Date.now() - start;

      assert.ok(duration < 500, '100 selections should complete in <500ms');
    });
  });
});

console.log('\n✅ All smart photo selection tests completed!\n');
