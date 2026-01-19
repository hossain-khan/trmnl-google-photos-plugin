#!/usr/bin/env node

/**
 * Test script for caption fetching from Google Photos
 * 
 * This script tests scraping captions from individual photo pages
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as GooglePhotosAlbum from 'google-photos-album-image-url-fetch';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Try to extract caption from photo page HTML
 */
async function fetchPhotoCaption(photoUrl, albumUrl) {
  console.log(`\n🔍 Attempting to fetch caption from: ${photoUrl}`);
  
  try {
    const response = await axios.get(photoUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 400
    });

    const $ = cheerio.load(response.data);
    
    // Strategy 1: Look for meta tags with captions
    const ogDescription = $('meta[property="og:description"]').attr('content');
    if (ogDescription && ogDescription.trim() && ogDescription !== 'Google Photos') {
      console.log(`✓ Found caption in og:description: "${ogDescription}"`);
      return ogDescription;
    }

    // Strategy 2: Look for description meta tag
    const metaDescription = $('meta[name="description"]').attr('content');
    if (metaDescription && metaDescription.trim() && metaDescription !== 'Google Photos') {
      console.log(`✓ Found caption in meta description: "${metaDescription}"`);
      return metaDescription;
    }

    // Strategy 3: Look in script tags with AF_initDataCallback
    const scripts = $('script').toArray();
    for (const script of scripts) {
      const scriptContent = $(script).html();
      if (scriptContent && scriptContent.includes('AF_initDataCallback')) {
        // Look for text patterns that might be captions
        // This is a heuristic approach - captions are often in JSON structures
        const captionMatch = scriptContent.match(/"description":"([^"]+)"/);
        if (captionMatch && captionMatch[1]) {
          const caption = captionMatch[1].replace(/\\n/g, ' ').replace(/\\"/g, '"');
          console.log(`✓ Found caption in script data: "${caption}"`);
          return caption;
        }
      }
    }

    console.log('⚠️  No caption found in photo page');
    return null;

  } catch (error) {
    console.error(`❌ Error fetching photo page: ${error.message}`);
    return null;
  }
}

/**
 * Construct photo page URL from album data
 */
function constructPhotoPageUrl(albumUrl, photoUid) {
  // Extract album components
  // Short URL format: https://photos.app.goo.gl/{shortcode}
  // Full URL format: https://photos.google.com/share/{albumId}
  
  // Try to extract from album URL
  const shortMatch = albumUrl.match(/photos\.app\.goo\.gl\/([A-Za-z0-9_-]+)/);
  const fullMatch = albumUrl.match(/photos\.google\.com\/share\/([A-Za-z0-9_-]+)/);
  
  if (shortMatch) {
    // For short URLs, we need the full share URL format
    // Format: https://photos.google.com/share/{albumUID}/photo/{photoUID}
    // But we don't have the full album UID from short URL
    console.log('⚠️  Cannot construct photo URL from short album URL');
    console.log('   Need full share URL format to access individual photo pages');
    return null;
  }
  
  if (fullMatch) {
    const albumId = fullMatch[1];
    // Format: https://photos.google.com/share/{albumId}/photo/{photoUid}
    return `https://photos.google.com/share/${albumId}/photo/${photoUid}`;
  }
  
  return null;
}

/**
 * Main test function
 */
async function testCaptionFetching() {
  console.log('📷 Google Photos Caption Fetcher Test\n');
  
  const albumUrl = process.argv[2] || 'https://photos.app.goo.gl/FB8ErkX2wJAQkJzV8';
  
  console.log(`Testing with album: ${albumUrl}\n`);
  
  // Fetch photos from album
  console.log('📡 Fetching photos from album...');
  const photos = await GooglePhotosAlbum.fetchImageUrls(albumUrl);
  
  if (!photos || photos.length === 0) {
    console.error('❌ No photos found in album');
    process.exit(1);
  }
  
  console.log(`✓ Found ${photos.length} photos in album\n`);
  
  // Test with first 3 photos
  const testPhotos = photos.slice(0, 3);
  
  for (const photo of testPhotos) {
    console.log('\n' + '='.repeat(70));
    console.log(`Photo UID: ${photo.uid}`);
    console.log(`Image URL: ${photo.url.substring(0, 80)}...`);
    console.log(`Size: ${photo.width}x${photo.height}px`);
    
    const photoPageUrl = constructPhotoPageUrl(albumUrl, photo.uid);
    if (photoPageUrl) {
      const caption = await fetchPhotoCaption(photoPageUrl, albumUrl);
      if (caption) {
        console.log(`\n✅ Caption: "${caption}"`);
      } else {
        console.log(`\n⚠️  No caption found for this photo`);
      }
    } else {
      console.log('\n⚠️  Could not construct photo page URL');
      console.log('   Individual photo pages require full share URL format');
    }
    
    // Wait a bit between requests to be nice to Google's servers
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Summary:');
  console.log(`Total photos tested: ${testPhotos.length}`);
  console.log('\nNote: Caption extraction from individual photo pages requires:');
  console.log('1. Full share URL format (not short goo.gl URLs)');
  console.log('2. Photo UID to construct individual photo URLs');
  console.log('3. Web scraping of photo page HTML');
  console.log('\nLimitations:');
  console.log('- Short URLs (photos.app.goo.gl) cannot be used to construct photo page URLs');
  console.log('- May require authentication for private albums');
  console.log('- Caption availability depends on photo metadata');
}

// Run the test
testCaptionFetching()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
