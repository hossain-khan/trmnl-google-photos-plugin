#!/usr/bin/env node

/**
 * Debug what HTML the library actually fetches
 */

import axios from 'axios';
import * as GooglePhotosAlbum from 'google-photos-album-image-url-fetch';
import { writeFile } from 'fs/promises';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function debugLibraryFetch(albumUrl) {
  console.log('📷 Debugging Library Fetch\n');
  console.log(`Album URL: ${albumUrl}\n`);
  
  // First, test what the library returns
  console.log('='.repeat(70));
  console.log('Step 1: Using google-photos-album-image-url-fetch library');
  console.log('='.repeat(70));
  
  const photos = await GooglePhotosAlbum.fetchImageUrls(albumUrl);
  console.log(`✓ Library successfully fetched ${photos.length} photos\n`);
  
  // Now let's see what HTML we get with the same User-Agent
  console.log('='.repeat(70));
  console.log('Step 2: Fetching HTML with axios (same as library uses gaxios)');
  console.log('='.repeat(70));
  
  try {
    const response = await axios.get(albumUrl, {
      headers: {
        'User-Agent': USER_AGENT,
      },
      maxRedirects: 5,
      validateStatus: () => true, // Accept any status
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Final URL: ${response.request?.res?.responseUrl || albumUrl}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`Content-Length: ${response.data.length} bytes\n`);
    
    // Save HTML for inspection
    const htmlFile = '/tmp/album-fetch-debug.html';
    await writeFile(htmlFile, response.data);
    console.log(`✓ Saved HTML to: ${htmlFile}\n`);
    
    // Check for AF_initDataCallback
    const afMatch = response.data.match(/AF_initDataCallback/g);
    if (afMatch) {
      console.log(`✓ Found ${afMatch.length} AF_initDataCallback occurrences`);
    } else {
      console.log(`⚠️  No AF_initDataCallback found in HTML`);
    }
    
    // Check for data patterns
    const dataPatterns = [
      { name: 'Script tags', regex: /<script[^>]*>/g },
      { name: 'Photo UIDs (AF1Qip...)', regex: /AF1Qip[A-Za-z0-9_-]+/g },
      { name: 'lh3.googleusercontent URLs', regex: /https:\/\/lh3\.googleusercontent\.com\/[^\s"'<>]+/g },
    ];
    
    console.log('\nData patterns found:');
    dataPatterns.forEach(({ name, regex }) => {
      const matches = response.data.match(regex);
      if (matches) {
        console.log(`  ✓ ${name}: ${matches.length} matches`);
        if (name === 'Photo UIDs (AF1Qip...)') {
          console.log(`    Examples: ${matches.slice(0, 3).join(', ')}`);
        }
      } else {
        console.log(`  ✗ ${name}: none found`);
      }
    });
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Debug completed');
}

const albumUrl = process.argv[2] || 'https://photos.app.goo.gl/FB8ErkX2wJAQkJzV8';
debugLibraryFetch(albumUrl)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
