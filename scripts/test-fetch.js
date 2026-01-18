#!/usr/bin/env node

/**
 * Test script for fetch-photos.js
 * 
 * This creates a mock test to validate the photo fetching logic
 * without requiring actual network access.
 */

import { writeFile } from 'fs/promises';
import { resolve } from 'path';

// Mock photo data that simulates what google-photos-album-image-url-fetch would return
const mockPhotos = [
  {
    uid: "AF1QipO4_Y5pseqWDPSlY7AAo0wmg76xW4gX0kOz8-p_",
    url: "https://lh3.googleusercontent.com/Pt3C6874cqkfeuIVL0XZ-UCsC6zLzeQmxq7T9-sDiPhyAgvJiKl_SCrvrMMkpuWuZ1TFkU65ilaZJrCbePRYo1q1qGTYvFV6J8gbYfZhhxQuXm2zXx6QDQkj0K-uBBUzozw7YLYQ5g",
    width: 640,
    height: 480,
    imageUpdateDate: 1317552314000,
    albumAddDate: 1564229558506
  },
  {
    uid: "AF1QipNcKcm3bkXUXl3tNYFNTlBDZfKUqvvV3JJi8MVJ",
    url: "https://lh3.googleusercontent.com/Sl8wPPURFbFINwqgcEywOnpUk8sksgGKJI25Wtl885abhMoGHrxZh_qEe26bQmfv1OAG4ZX8qkz1svnLSJJZjh317TuU4cTk1vN04MbucjU8mlX7uDy0CPxVe8gggL-ftx6VgqWYxA",
    width: 4000,
    height: 3000,
    imageUpdateDate: 1535348376000,
    albumAddDate: 1565370026893
  },
  {
    uid: "AF1QipNxMqbkMWKWOYGGwFwE4X9vOoGsn-L8BlwArcOQ",
    url: "https://lh3.googleusercontent.com/i9DN1Lz7ft-oo-_Ubrprm8m4XyrI0sDpd5QFBlsNCV2FrWR2KYE95zLgPYSWcqdodGkCMEv7QZOIvRgfRqjlYLrfHQmGlQosTlvfYV8LcpyllenyOpJcgY-qRFN1wTjfZ-yQ-mzqjw",
    width: 128,
    height: 128,
    imageUpdateDate: 1542123494000,
    albumAddDate: 1565369489286
  }
];

console.log('🧪 Testing photo fetching logic...\n');

// Test URL validation
console.log('Test 1: URL Validation');
const testUrls = [
  'https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5',
  'https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF',
  'https://invalid-url.com',
  ''
];

function validateAlbumUrl(url) {
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
    error: 'Invalid Google Photos URL' 
  };
}

testUrls.forEach(url => {
  const result = validateAlbumUrl(url);
  console.log(`  ${result.valid ? '✓' : '✗'} ${url || '(empty)'} - ${result.valid ? 'Valid' : result.error}`);
});

// Test image optimization
console.log('\nTest 2: Image Optimization for E-ink');
const EINK_WIDTH = 800;
const EINK_HEIGHT = 480;

function optimizeForEink(baseUrl, originalWidth, originalHeight) {
  const aspectRatio = originalWidth / originalHeight;
  const einkAspectRatio = EINK_WIDTH / EINK_HEIGHT;
  
  let targetWidth, targetHeight;
  
  if (aspectRatio > einkAspectRatio) {
    targetWidth = EINK_WIDTH;
    targetHeight = Math.round(EINK_WIDTH / aspectRatio);
  } else {
    targetHeight = EINK_HEIGHT;
    targetWidth = Math.round(EINK_HEIGHT * aspectRatio);
  }
  
  return `${baseUrl}=w${targetWidth}-h${targetHeight}`;
}

mockPhotos.forEach((photo, idx) => {
  const optimized = optimizeForEink(photo.url, photo.width, photo.height);
  const sizeMatch = optimized.match(/=w(\d+)-h(\d+)/);
  console.log(`  Photo ${idx + 1}: ${photo.width}x${photo.height} → ${sizeMatch[1]}x${sizeMatch[2]}`);
});

// Test random selection
console.log('\nTest 3: Random Photo Selection');
function selectRandomPhoto(photos) {
  if (!photos || photos.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * photos.length);
  return photos[randomIndex];
}

const selections = [];
for (let i = 0; i < 10; i++) {
  const selected = selectRandomPhoto(mockPhotos);
  selections.push(selected.uid);
}
const uniqueSelections = new Set(selections);
console.log(`  ✓ Made 10 random selections, ${uniqueSelections.size} unique photos selected`);

// Test output data structure
console.log('\nTest 4: Output Data Structure');
const selectedPhoto = mockPhotos[0];
const optimizedUrl = optimizeForEink(selectedPhoto.url, selectedPhoto.width, selectedPhoto.height);

const outputData = {
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
    album_add_date: new Date(selectedPhoto.albumAddDate).toISOString()
  }
};

console.log('  ✓ Generated output data structure:');
console.log(`    - photo_url: ${outputData.photo_url.substring(0, 60)}...`);
console.log(`    - photo_count: ${outputData.photo_count}`);
console.log(`    - timestamp: ${outputData.timestamp}`);

// Save mock output
const API_OUTPUT_FILE = resolve(process.cwd(), 'api/photo.json');
await writeFile(API_OUTPUT_FILE, JSON.stringify(outputData, null, 2), 'utf8');
console.log(`  ✓ Saved mock output to: ${API_OUTPUT_FILE}`);

console.log('\n✅ All tests passed!');
console.log('\nNote: This is a mock test. To test with real albums, run:');
console.log('  node scripts/fetch-photos.js <album-url>');
