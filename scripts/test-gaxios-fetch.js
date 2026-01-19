#!/usr/bin/env node

/**
 * Test using gaxios (same as the library)
 */

import { request } from 'gaxios';
import json5Pkg from 'json5';
const { parse } = json5Pkg;

async function testGaxios(url) {
  console.log(`Testing with gaxios: ${url}\n`);
  
  try {
    const response = await request({
      url: url,
      retryConfig: { retry: 4, retryDelay: 1000 },
      retry: true,
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Final URL: ${response.config.url}`);
    console.log(`Content length: ${response.data.length} bytes`);
    
    // Check for AF_initDataCallback with data
    const re = /(?<=AF_initDataCallback\()(?=.*data)(\{[\s\S]*?)(\);<\/script>)/g;
    const matches = [...response.data.matchAll(re)];
    
    console.log(`\nAF_initDataCallback structures found: ${matches.length}`);
    
    if (matches.length > 0) {
      const largestMatch = matches.reduce((a, b) => (a.length > b[1].length ? a : b[1]), '');
      console.log(`Largest structure size: ${largestMatch.length} characters`);
      
      try {
        const data = parse(largestMatch);
        console.log(`\n✓ Successfully parsed JSON5 data`);
        
        if (data && data.data && Array.isArray(data.data)) {
          console.log(`  data.data length: ${data.data.length}`);
          if (data.data[1] && Array.isArray(data.data[1])) {
            console.log(`  Photo array length: ${data.data[1].length} photos`);
            
            // Examine first photo structure
            if (data.data[1][0]) {
              const photo = data.data[1][0];
              console.log(`\n  First photo structure:`);
              console.log(`    Array length: ${photo.length}`);
              console.log(`    [0] uid: ${photo[0]}`);
              console.log(`    [1] [url, width, height]: ${Array.isArray(photo[1])}`);
              console.log(`    [2] imageUpdateDate: ${photo[2]}`);
              console.log(`    [5] albumAddDate: ${photo[5]}`);
              
              // Look for caption-like data
              console.log(`\n    Looking for caption data in indices 6+:`);
              for (let i = 6; i < Math.min(photo.length, 20); i++) {
                const elem = photo[i];
                const type = Array.isArray(elem) ? `Array[${elem.length}]` : typeof elem;
                let preview = '';
                if (typeof elem === 'string' && elem.length > 0 && elem.length < 200) {
                  preview = `: "${elem.substring(0, 60)}${elem.length > 60 ? '...' : ''}"`;
                }
                console.log(`    [${i}] ${type}${preview}`);
              }
            }
          }
        }
      } catch (parseError) {
        console.error(`Failed to parse: ${parseError.message}`);
      }
    } else {
      console.log(`\n⚠️  No photo data found in AF_initDataCallback`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

const url = process.argv[2] || 'https://photos.app.goo.gl/FB8ErkX2wJAQkJzV8';
testGaxios(url)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
