#!/usr/bin/env node

/**
 * Deep dive into photo data structure to find captions
 */

import { request } from 'gaxios';
import json5Pkg from 'json5';
const { parse } = json5Pkg;

async function investigatePhotoStructure(url) {
  console.log(`Investigating photo data structure: ${url}\n`);
  
  try {
    const response = await request({
      url: url,
      retryConfig: { retry: 4, retryDelay: 1000 },
      retry: true,
    });
    
    const html = response.data;
    const re = /(?<=AF_initDataCallback\()(?=.*data)(\{[\s\S]*?)(\);<\/script>)/g;
    const matches = [...html.matchAll(re)];
    
    const largestMatch = matches.reduce((a, b) => (a.length > b[1].length ? a : b[1]), '');
    const data = parse(largestMatch);
    
    if (data && data.data && data.data[1] && Array.isArray(data.data[1])) {
      const photos = data.data[1];
      console.log(`Found ${photos.length} photos\n`);
      
      // Examine each photo in detail
      photos.forEach((photo, idx) => {
        console.log(`${'='.repeat(70)}`);
        console.log(`Photo #${idx + 1}: ${photo[0]}`);
        console.log(`${'='.repeat(70)}`);
        
        // Show full structure
        for (let i = 0; i < photo.length; i++) {
          const elem = photo[i];
          
          if (elem === null || elem === undefined) {
            console.log(`  [${i}] null/undefined`);
          } else if (typeof elem === 'string') {
            console.log(`  [${i}] string (${elem.length} chars): "${elem}"`);
          } else if (typeof elem === 'number') {
            console.log(`  [${i}] number: ${elem}`);
          } else if (typeof elem === 'boolean') {
            console.log(`  [${i}] boolean: ${elem}`);
          } else if (Array.isArray(elem)) {
            console.log(`  [${i}] Array[${elem.length}]:`);
            // Show array contents
            elem.forEach((nested, j) => {
              if (typeof nested === 'string' && nested.length > 0 && nested.length < 500) {
                if (!nested.startsWith('http') && !nested.startsWith('AF1')) {
                  console.log(`      [${j}] STRING (potential caption): "${nested}"`);
                } else {
                  console.log(`      [${j}] string: ${nested.substring(0, 50)}...`);
                }
              } else if (typeof nested === 'number') {
                console.log(`      [${j}] number: ${nested}`);
              } else if (Array.isArray(nested)) {
                console.log(`      [${j}] Array[${nested.length}]`);
              } else if (typeof nested === 'object') {
                console.log(`      [${j}] object`);
              }
            });
          } else if (typeof elem === 'object') {
            console.log(`  [${i}] object: ${JSON.stringify(elem).substring(0, 100)}...`);
          }
        }
        
        console.log();
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

const url = process.argv[2] || 'https://photos.app.goo.gl/FB8ErkX2wJAQkJzV8';
investigatePhotoStructure(url)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
