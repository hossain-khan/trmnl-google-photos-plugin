#!/usr/bin/env node

/**
 * Test caption extraction functionality
 * 
 * This script tests the caption extraction by directly importing the library
 * and creating a custom implementation based on the caption-extractor logic.
 */

import axios from 'axios';
import json5Pkg from 'json5';
const { parse } = json5Pkg;
import * as GooglePhotosAlbum from 'google-photos-album-image-url-fetch';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Fetch photos with caption extraction (inline implementation)
 */
async function fetchPhotosWithCaptions(albumUrl) {
  try {
    const response = await axios.get(albumUrl, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000,
      maxRedirects: 5,
    });

    const html = response.data;
    const finalUrl = response.request?.res?.responseUrl || albumUrl;
    console.log(`  Fetched from: ${finalUrl}`);
    
    const re = /(?<=AF_initDataCallback\()(?=.*data)(\{[\s\S]*?)(\);<\/script>)/g;
    const matches = [...html.matchAll(re)];
    
    if (matches.length === 0) {
      console.log('  ⚠️  No AF_initDataCallback found');
      return [];
    }

    console.log(`  ✓ Found ${matches.length} AF_initDataCallback structures`);
    const largestMatch = matches.reduce((a, b) => (a.length > b[1].length ? a : b[1]), '');
    console.log(`  ✓ Largest structure: ${largestMatch.length} characters`);
    
    const data = parse(largestMatch);

    return parsePhotoDataWithCaptions(data);
  } catch (error) {
    console.error('  Error:', error.message);
    throw error;
  }
}

/**
 * Parse photo data with caption extraction
 */
function parsePhotoDataWithCaptions(data) {
  if (!data || typeof data !== 'object' || !('data' in data)) {
    return [];
  }

  const d = data.data;
  if (!Array.isArray(d) || d.length < 2) {
    return [];
  }

  const photoArray = d[1];
  if (!Array.isArray(photoArray)) {
    return [];
  }

  return photoArray
    .map((photo) => {
      if (!Array.isArray(photo) || photo.length < 6) {
        return null;
      }

      const uid = photo[0];
      const imageUpdateDate = photo[2];
      const albumAddDate = photo[5];

      if (typeof uid !== 'string' || typeof imageUpdateDate !== 'number' || typeof albumAddDate !== 'number') {
        return null;
      }

      const detail = photo[1];
      if (!Array.isArray(detail) || detail.length < 3) {
        return null;
      }

      const url = detail[0];
      const width = detail[1];
      const height = detail[2];

      if (typeof url !== 'string' || typeof width !== 'number' || typeof height !== 'number') {
        return null;
      }

      // Extract caption
      let caption = undefined;
      
      for (let i = 6; i < photo.length; i++) {
        const elem = photo[i];
        
        if (typeof elem === 'string' && elem.length > 0 && elem.length < 1000) {
          if (!elem.startsWith('AF1') && !elem.startsWith('http')) {
            caption = elem;
            break;
          }
        }
        
        if (Array.isArray(elem)) {
          for (let j = 0; j < elem.length; j++) {
            const nested = elem[j];
            if (typeof nested === 'string' && nested.length > 0 && nested.length < 1000) {
              if (!nested.startsWith('AF1') && !nested.startsWith('http')) {
                caption = nested;
                break;
              }
            }
          }
          if (caption) break;
        }
      }

      return {
        uid,
        url,
        width,
        height,
        imageUpdateDate,
        albumAddDate,
        caption,
      };
    })
    .filter((photo) => photo !== null);
}

async function testCaptionExtraction() {
  console.log('📷 Caption Extraction Test\n');
  
  const albumUrl = process.argv[2] || 'https://photos.app.goo.gl/FB8ErkX2wJAQkJzV8';
  
  console.log(`Testing with album: ${albumUrl}\n`);
  
  console.log('='.repeat(70));
  console.log('Test 1: Original Library (No Captions)');
  console.log('='.repeat(70));
  
  try {
    const standardPhotos = await GooglePhotosAlbum.fetchImageUrls(albumUrl);
    console.log(`✓ Fetched ${standardPhotos.length} photos`);
    console.log(`\nFirst 3 photos (no captions):`);
    standardPhotos.slice(0, 3).forEach((photo, idx) => {
      console.log(`\n  Photo ${idx + 1}:`);
      console.log(`    UID: ${photo.uid}`);
      console.log(`    Size: ${photo.width}x${photo.height}px`);
      console.log(`    Caption: N/A (library doesn't extract)`);
    });
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('Test 2: Enhanced Library (With Captions)');
  console.log('='.repeat(70));
  
  try {
    const enhancedPhotos = await fetchPhotosWithCaptions(albumUrl);
    console.log(`✓ Fetched ${enhancedPhotos.length} photos`);
    
    let captionCount = 0;
    enhancedPhotos.forEach(photo => {
      if (photo.caption) captionCount++;
    });
    
    console.log(`✓ Found ${captionCount} photos with captions (${Math.round(captionCount / enhancedPhotos.length * 100)}%)`);
    
    console.log(`\nFirst 3 photos (with caption extraction):`);
    enhancedPhotos.slice(0, 3).forEach((photo, idx) => {
      console.log(`\n  Photo ${idx + 1}:`);
      console.log(`    UID: ${photo.uid}`);
      console.log(`    Size: ${photo.width}x${photo.height}px`);
      console.log(`    Caption: ${photo.caption ? `"${photo.caption}"` : '(no caption)'}`);
    });
    
    // Show all photos with captions
    const photosWithCaptions = enhancedPhotos.filter(p => p.caption);
    if (photosWithCaptions.length > 0) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`All Photos with Captions (${photosWithCaptions.length} total):`);
      console.log('='.repeat(70));
      photosWithCaptions.forEach((photo, idx) => {
        console.log(`\n  ${idx + 1}. ${photo.uid}`);
        console.log(`     "${photo.caption}"`);
      });
    } else {
      console.log(`\n⚠️  Note: No captions found in this album.`);
      console.log(`   This may be because:`);
      console.log(`   - The photos don't have captions/descriptions in Google Photos`);
      console.log(`   - The caption data isn't included in the shared album HTML`);
      console.log(`   - We need to adjust the parsing logic for this album format`);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Test completed');
  console.log('='.repeat(70));
}

// Run test
testCaptionExtraction()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
