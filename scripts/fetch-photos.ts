#!/usr/bin/env node

/**
 * Google Photos Album Fetcher
 * 
 * This script fetches photos from a Google Photos shared album
 * and updates the api/photo.json file with a random photo.
 * 
 * Features:
 * - Parse Google Photos shared album URL
 * - Fetch album metadata via google-photos-album-image-url-fetch
 * - Extract photo URLs and metadata
 * - Select random photo
 * - Optimize image URL for e-ink display
 * - Update api/photo.json
 * 
 * Usage:
 *   tsx scripts/fetch-photos.ts <album-url>
 * 
 * Environment Variables:
 *   - SHARED_ALBUM_URL: Google Photos shared album URL (optional if passed as arg)
 * 
 * Example:
 *   tsx scripts/fetch-photos.ts https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5
 */

import * as GooglePhotosAlbum from 'google-photos-album-image-url-fetch';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';

// Configuration
const EINK_WIDTH = 800;   // Default TRMNL width
const EINK_HEIGHT = 480;  // Default TRMNL height
const API_OUTPUT_FILE = resolve(process.cwd(), 'api/photo.json');

interface ValidationResult {
  valid: boolean;
  url?: string;
  error?: string;
}

interface Photo {
  uid: string;
  url: string;
  width: number;
  height: number;
  imageUpdateDate: number;
  albumAddDate: number;
}

interface PhotoMetadata {
  uid: string;
  original_width: number;
  original_height: number;
  image_update_date: string;
  album_add_date: string;
}

interface OutputData {
  photo_url: string;
  thumbnail_url: string;
  caption: null;
  timestamp: string;
  album_name: string;
  photo_count: number;
  metadata: PhotoMetadata;
}

/**
 * Parse and validate Google Photos album URL
 */
function validateAlbumUrl(url: string | undefined): ValidationResult {
  if (!url) {
    return { valid: false, error: 'URL is required' };
  }
  
  // Support both short and full URLs
  const shortUrlPattern = /^https:\/\/photos\.app\.goo\.gl\/[A-Za-z0-9_-]+$/;
  const fullUrlPattern = /^https:\/\/photos\.google\.com\/share\/[A-Za-z0-9_-]+/;
  
  if (shortUrlPattern.test(url) || fullUrlPattern.test(url)) {
    return { valid: true, url };
  }
  
  return { 
    valid: false, 
    error: 'Invalid Google Photos URL. Expected format: https://photos.app.goo.gl/... or https://photos.google.com/share/...' 
  };
}

/**
 * Optimize image URL for e-ink display
 */
function optimizeForEink(baseUrl: string, originalWidth: number, originalHeight: number): string {
  // Calculate aspect ratio
  const aspectRatio = originalWidth / originalHeight;
  const einkAspectRatio = EINK_WIDTH / EINK_HEIGHT;
  
  let targetWidth: number;
  let targetHeight: number;
  
  // Fit image within e-ink display bounds while maintaining aspect ratio
  if (aspectRatio > einkAspectRatio) {
    // Image is wider - constrain by width
    targetWidth = EINK_WIDTH;
    targetHeight = Math.round(EINK_WIDTH / aspectRatio);
  } else {
    // Image is taller - constrain by height
    targetHeight = EINK_HEIGHT;
    targetWidth = Math.round(EINK_HEIGHT * aspectRatio);
  }
  
  return `${baseUrl}=w${targetWidth}-h${targetHeight}`;
}

/**
 * Select random photo from album
 */
function selectRandomPhoto(photos: Photo[]): Photo | null {
  if (!photos || photos.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * photos.length);
  return photos[randomIndex];
}

/**
 * Extract album name from URL (if possible)
 */
function extractAlbumName(url: string): string {
  // For now, just use a generic name
  // In future, could parse album title from HTML
  return 'Google Photos Shared Album';
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('📷 Google Photos Album Fetcher\n');
  
  // Get album URL from args or environment
  const albumUrl = process.argv[2] || process.env.SHARED_ALBUM_URL;
  
  if (!albumUrl) {
    console.error('❌ Error: No album URL provided');
    console.error('\nUsage: tsx scripts/fetch-photos.ts <album-url>');
    console.error('   Or: SHARED_ALBUM_URL=<url> tsx scripts/fetch-photos.ts');
    console.error('\nExample: tsx scripts/fetch-photos.ts https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5');
    process.exit(1);
  }
  
  // Validate URL
  console.log('🔍 Validating album URL...');
  const validation = validateAlbumUrl(albumUrl);
  if (!validation.valid) {
    console.error(`❌ ${validation.error}`);
    process.exit(1);
  }
  console.log(`✓ URL is valid: ${albumUrl}\n`);
  
  try {
    // Fetch photos from album
    console.log('📡 Fetching photos from album...');
    const photos = await GooglePhotosAlbum.fetchImageUrls(albumUrl) as Photo[];
    
    if (!photos || photos.length === 0) {
      console.error('❌ No photos found in album');
      console.error('   - Ensure the album is publicly shared');
      console.error('   - Check that the album contains photos (not videos)');
      process.exit(1);
    }
    
    console.log(`✓ Found ${photos.length} photos in album\n`);
    
    // Select random photo
    console.log('🎲 Selecting random photo...');
    const selectedPhoto = selectRandomPhoto(photos);
    
    if (!selectedPhoto) {
      console.error('❌ Failed to select a photo');
      process.exit(1);
    }
    
    console.log(`✓ Selected photo: ${selectedPhoto.uid}`);
    console.log(`  Original size: ${selectedPhoto.width}x${selectedPhoto.height}px\n`);
    
    // Optimize for e-ink
    console.log('🖼️  Optimizing image for e-ink display...');
    const optimizedUrl = optimizeForEink(
      selectedPhoto.url,
      selectedPhoto.width,
      selectedPhoto.height
    );
    console.log(`✓ Optimized for ${EINK_WIDTH}x${EINK_HEIGHT}px display\n`);
    
    // Prepare output data
    const outputData: OutputData = {
      photo_url: optimizedUrl,
      thumbnail_url: `${selectedPhoto.url}=w400-h300`, // Smaller preview
      caption: null, // Google Photos doesn't expose captions via shared albums
      timestamp: new Date().toISOString(),
      album_name: extractAlbumName(albumUrl),
      photo_count: photos.length,
      metadata: {
        uid: selectedPhoto.uid,
        original_width: selectedPhoto.width,
        original_height: selectedPhoto.height,
        image_update_date: new Date(selectedPhoto.imageUpdateDate).toISOString(),
        album_add_date: new Date(selectedPhoto.albumAddDate).toISOString()
      }
    };
    
    // Save to api/photo.json
    console.log('💾 Saving to api/photo.json...');
    await writeFile(
      API_OUTPUT_FILE,
      JSON.stringify(outputData, null, 2),
      'utf8'
    );
    console.log(`✓ Saved to: ${API_OUTPUT_FILE}\n`);
    
    // Display summary
    console.log('=' .repeat(70));
    console.log('✅ SUCCESS');
    console.log('='.repeat(70));
    console.log(`Album URL: ${albumUrl}`);
    console.log(`Total photos: ${photos.length}`);
    console.log(`Selected photo: ${selectedPhoto.uid}`);
    console.log(`Optimized URL: ${optimizedUrl.substring(0, 80)}...`);
    console.log(`Output file: ${API_OUTPUT_FILE}`);
    console.log('='.repeat(70));
    
    // Show first 5 photos for reference
    if (photos.length > 1) {
      console.log('\n📋 Album contains these photos:');
      photos.slice(0, 5).forEach((photo, idx) => {
        const date = new Date(photo.albumAddDate).toLocaleDateString();
        console.log(`  ${idx + 1}. ${photo.uid} (${photo.width}x${photo.height}px, added ${date})`);
      });
      if (photos.length > 5) {
        console.log(`  ... and ${photos.length - 5} more`);
      }
    }
    
    console.log('\n✅ Photo fetching completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error fetching photos:');
    
    if (error instanceof Error) {
      console.error(error.message);
      
      // Type guard for axios error
      if ('response' in error && error.response) {
        const axiosError = error as { response: { status: number } };
        console.error(`   Status: ${axiosError.response.status}`);
        if (axiosError.response.status === 404) {
          console.error('   The album may have been deleted or made private');
        }
      }
    } else {
      console.error('An unknown error occurred');
    }
    
    console.error('\nTroubleshooting:');
    console.error('1. Ensure the album URL is correct');
    console.error('2. Verify the album is publicly shared (link sharing enabled)');
    console.error('3. Check your internet connection');
    console.error('4. Try accessing the album in a browser first');
    
    process.exit(1);
  }
}

// Run main function
main();
