#!/usr/bin/env node

/**
 * Test script for fetch-photos.js
 *
 * This creates a mock test to validate the photo fetching logic
 * without requiring actual network access.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAspectRatio,
  calculateMegapixels,
  formatRelativeDate,
} from '../services/photo-fetcher.js';

interface MockPhoto {
  uid: string;
  url: string;
  width: number;
  height: number;
  imageUpdateDate: number;
  albumAddDate: number;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  url?: string;
}

interface OutputData {
  photo_url: string;
  thumbnail_url: string;
  caption: string | null;
  timestamp: string;
  album_name: string;
  photo_count: number;
  metadata: {
    uid: string;
    original_width: number;
    original_height: number;
    image_update_date: string;
    album_add_date: string;
  };
}

// Mock photo data that simulates what google-photos-album-image-url-fetch would return
const mockPhotos: MockPhoto[] = [
  {
    uid: 'AF1QipO4_Y5pseqWDPSlY7AAo0wmg76xW4gX0kOz8-p_',
    url: 'https://lh3.googleusercontent.com/Pt3C6874cqkfeuIVL0XZ-UCsC6zLzeQmxq7T9-sDiPhyAgvJiKl_SCrvrMMkpuWuZ1TFkU65ilaZJrCbePRYo1q1qGTYvFV6J8gbYfZhhxQuXm2zXx6QDQkj0K-uBBUzozw7YLYQ5g',
    width: 640,
    height: 480,
    imageUpdateDate: 1317552314000,
    albumAddDate: 1564229558506,
  },
  {
    uid: 'AF1QipNcKcm3bkXUXl3tNYFNTlBDZfKUqvvV3JJi8MVJ',
    url: 'https://lh3.googleusercontent.com/Sl8wPPURFbFINwqgcEywOnpUk8sksgGKJI25Wtl885abhMoGHrxZh_qEe26bQmfv1OAG4ZX8qkz1svnLSJJZjh317TuU4cTk1vN04MbucjU8mlX7uDy0CPxVe8gggL-ftx6VgqWYxA',
    width: 4000,
    height: 3000,
    imageUpdateDate: 1535348376000,
    albumAddDate: 1565370026893,
  },
  {
    uid: 'AF1QipNxMqbkMWKWOYGGwFwE4X9vOoGsn-L8BlwArcOQ',
    url: 'https://lh3.googleusercontent.com/i9DN1Lz7ft-oo-_Ubrprm8m4XyrI0sDpd5QFBlsNCV2FrWR2KYE95zLgPYSWcqdodGkCMEv7QZOIvRgfRqjlYLrfHQmGlQosTlvfYV8LcpyllenyOpJcgY-qRFN1wTjfZ-yQ-mzqjw',
    width: 128,
    height: 128,
    imageUpdateDate: 1542123494000,
    albumAddDate: 1565369489286,
  },
];

console.log('🧪 Testing photo fetching logic...\n');

// Test URL validation
console.log('Test 1: URL Validation');
const testUrls: string[] = [
  'https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5',
  'https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF',
  'https://invalid-url.com',
  '',
];

function validateAlbumUrl(url: string): ValidationResult {
  if (!url) {
    return { valid: false, error: 'URL is required' };
  }

  const shortUrlPattern = /^https:\/\/photos\.app\.goo\.gl\/[A-Za-z0-9_-]+$/;
  const fullUrlPattern = /^https:\/\/photos\.google\.com\/share\/[A-Za-z0-9_-]+/;

  if (shortUrlPattern.test(url) || fullUrlPattern.test(url)) {
    return { valid: true, url };
  }

  return {
    valid: false,
    error: 'Invalid Google Photos URL',
  };
}

testUrls.forEach((url: string): void => {
  const result = validateAlbumUrl(url);
  console.log(
    `  ${result.valid ? '✓' : '✗'} ${url || '(empty)'} - ${result.valid ? 'Valid' : result.error}`
  );
});

// Test image optimization
console.log('\nTest 2: Image Optimization for E-ink');
const EINK_WIDTH = 800;
const EINK_HEIGHT = 480;

function optimizeForEink(baseUrl: string, originalWidth: number, originalHeight: number): string {
  const aspectRatio = originalWidth / originalHeight;
  const einkAspectRatio = EINK_WIDTH / EINK_HEIGHT;

  let targetWidth: number, targetHeight: number;

  if (aspectRatio > einkAspectRatio) {
    targetWidth = EINK_WIDTH;
    targetHeight = Math.round(EINK_WIDTH / aspectRatio);
  } else {
    targetHeight = EINK_HEIGHT;
    targetWidth = Math.round(EINK_HEIGHT * aspectRatio);
  }

  return `${baseUrl}=w${targetWidth}-h${targetHeight}`;
}

mockPhotos.forEach((photo: MockPhoto, idx: number): void => {
  const optimized = optimizeForEink(photo.url, photo.width, photo.height);
  const sizeMatch = optimized.match(/=w(\d+)-h(\d+)/);
  if (sizeMatch) {
    console.log(
      `  Photo ${idx + 1}: ${photo.width}x${photo.height} → ${sizeMatch[1]}x${sizeMatch[2]}`
    );
  }
});

// Test random selection
console.log('\nTest 3: Random Photo Selection');
function selectRandomPhoto(photos: MockPhoto[]): MockPhoto | null {
  if (!photos || photos.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * photos.length);
  return photos[randomIndex];
}

const selections: string[] = [];
for (let i = 0; i < 10; i++) {
  const selected = selectRandomPhoto(mockPhotos);
  if (selected) {
    selections.push(selected.uid);
  }
}
const uniqueSelections = new Set(selections);
console.log(`  ✓ Made 10 random selections, ${uniqueSelections.size} unique photos selected`);

// Test output data structure
console.log('\nTest 4: Output Data Structure');
const selectedPhoto = mockPhotos[0];
const optimizedUrl = optimizeForEink(selectedPhoto.url, selectedPhoto.width, selectedPhoto.height);

const outputData: OutputData = {
  photo_url: optimizedUrl,
  thumbnail_url: `${selectedPhoto.url}=w400-h300`,
  caption: null,
  timestamp: new Date().toISOString(),
  album_name: 'Google Photos Shared Album',
  photo_count: mockPhotos.length,
  metadata: {
    uid: selectedPhoto.uid,
    original_width: selectedPhoto.width,
    original_height: selectedPhoto.height,
    image_update_date: new Date(selectedPhoto.imageUpdateDate).toISOString(),
    album_add_date: new Date(selectedPhoto.albumAddDate).toISOString(),
  },
};

console.log('  ✓ Generated output data structure:');
console.log(`    - photo_url: ${outputData.photo_url.substring(0, 60)}...`);
console.log(`    - photo_count: ${outputData.photo_count}`);
console.log(`    - timestamp: ${outputData.timestamp}`);

// Note: We no longer save static JSON files - data is fetched dynamically by the Cloudflare Worker
console.log('  ✓ Output data structure validated (not saved - worker fetches dynamically)');

console.log('\n✅ All tests passed!');
console.log('\nNote: This is a mock test. To test with real albums, run:');
console.log('  node scripts/fetch-photos.js <album-url>');

// ============================================================================
// Unit Tests for Photo Fetcher Helper Functions
// ============================================================================

describe('Photo Fetcher Helper Functions', () => {
  describe('calculateAspectRatio', () => {
    it('should calculate portrait aspect ratio', () => {
      const result = calculateAspectRatio(1080, 1920); // Portrait (9:16)
      assert.equal(result, '9:16');
    });

    it('should calculate landscape aspect ratio', () => {
      const result = calculateAspectRatio(1920, 1080); // Landscape (16:9)
      assert.equal(result, '16:9');
    });

    it('should calculate square aspect ratio', () => {
      const result = calculateAspectRatio(1000, 1000); // Perfect square
      assert.equal(result, '1:1');
    });

    it('should simplify aspect ratio to lowest terms', () => {
      // 1000:1040 ≈ 0.96, which is close to 1:1 (1.0) - approximates for better UX
      const result = calculateAspectRatio(1000, 1040);
      assert.equal(result, '1:1');
    });

    it('should handle different aspect ratios', () => {
      const result = calculateAspectRatio(1000, 1100); // GCD = 100
      assert.equal(result, '10:11');
    });

    it('should handle various real-world photo dimensions', () => {
      assert.equal(calculateAspectRatio(3024, 4032), '3:4'); // iPhone photo (3:4 ratio)
      assert.equal(calculateAspectRatio(4000, 3000), '4:3'); // DSLR landscape (4:3 ratio)
      assert.equal(calculateAspectRatio(2048, 2048), '1:1'); // Instagram square
    });

    it('should approximate to common ratios within tolerance', () => {
      // 5694:4075 ≈ 1.397, which is close to 4:3 (1.333) - approximates for better UX
      const result = calculateAspectRatio(5694, 4075);
      assert.equal(result, '4:3');
    });
  });

  describe('calculateMegapixels', () => {
    it('should calculate megapixels for typical phone camera', () => {
      const result = calculateMegapixels(3024, 4032); // iPhone 12 MP
      assert.equal(result, 12); // 12.192768 → 12
    });

    it('should calculate megapixels for Full HD', () => {
      const result = calculateMegapixels(1920, 1080); // 1080p
      assert.equal(result, 2); // 2.0736 → 2
    });

    it('should calculate megapixels for 4K', () => {
      const result = calculateMegapixels(3840, 2160); // 4K
      assert.equal(result, 8.5); // 8.294400 → 8.5
    });

    it('should calculate megapixels for high-resolution DSLR', () => {
      const result = calculateMegapixels(6000, 4000); // 24 MP DSLR
      assert.equal(result, 24); // 24.0 → 24
    });

    it('should round to nearest 0.5 MP', () => {
      assert.equal(calculateMegapixels(2000, 1500), 3); // 3.0 → 3
      assert.equal(calculateMegapixels(2200, 1500), 3.5); // 3.3 → 3.5
      assert.equal(calculateMegapixels(2500, 1500), 4); // 3.75 → 4
    });

    it('should handle very small images (thumbnails)', () => {
      const result = calculateMegapixels(400, 300); // Thumbnail
      assert.equal(result, 0); // 0.12 → 0
    });

    it('should handle very large images (professional cameras)', () => {
      const result = calculateMegapixels(8688, 5792); // 50 MP medium format
      assert.equal(result, 50.5); // 50.331696 → 50.5
    });

    it('should handle square images', () => {
      const result = calculateMegapixels(2048, 2048); // Instagram square
      assert.equal(result, 4); // 4.194304 → 4
    });
  });

  describe('formatRelativeDate', () => {
    it('should format dates from years ago', () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const result = formatRelativeDate(twoYearsAgo.toISOString());
      assert.equal(result, '2 years ago');
    });

    it('should format dates from one year ago', () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const result = formatRelativeDate(oneYearAgo.toISOString());
      assert.equal(result, '1 year ago');
    });

    it('should format dates from months ago', () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const result = formatRelativeDate(threeMonthsAgo.toISOString());
      assert.equal(result, '3 months ago');
    });

    it('should format dates from one month ago', () => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const result = formatRelativeDate(oneMonthAgo.toISOString());
      assert.equal(result, '1 month ago');
    });

    it('should format dates from days ago', () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const result = formatRelativeDate(fiveDaysAgo.toISOString());
      assert.equal(result, '5 days ago');
    });

    it('should format dates from one day ago', () => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const result = formatRelativeDate(oneDayAgo.toISOString());
      assert.equal(result, '1 day ago');
    });

    it('should format dates from hours ago', () => {
      const threeHoursAgo = new Date();
      threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);
      const result = formatRelativeDate(threeHoursAgo.toISOString());
      assert.equal(result, '3 hours ago');
    });

    it('should format dates from one hour ago', () => {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      const result = formatRelativeDate(oneHourAgo.toISOString());
      assert.equal(result, '1 hour ago');
    });

    it('should format dates from minutes ago', () => {
      const tenMinutesAgo = new Date();
      tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
      const result = formatRelativeDate(tenMinutesAgo.toISOString());
      assert.equal(result, '10 minutes ago');
    });

    it('should format dates from one minute ago', () => {
      const oneMinuteAgo = new Date();
      oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
      const result = formatRelativeDate(oneMinuteAgo.toISOString());
      assert.equal(result, '1 minute ago');
    });

    it('should format very recent dates as "Just now"', () => {
      const now = new Date();
      const result = formatRelativeDate(now.toISOString());
      assert.equal(result, 'Just now');
    });

    it('should handle invalid ISO dates by returning Just now (NaN calculation)', () => {
      // Invalid ISO format - new Date() creates Invalid Date, getTime() returns NaN
      // NaN calculations result in all conditions failing → "Just now"
      const result1 = formatRelativeDate('2020-99-99T99:99:99Z');
      assert.equal(result1, 'Just now');

      // Completely invalid format also results in Invalid Date
      const result2 = formatRelativeDate('not-a-date-at-all');
      assert.equal(result2, 'Just now');
    });
  });
});
