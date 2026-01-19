#!/usr/bin/env node

/**
 * Deep investigation of AF_initDataCallback structure to find caption data
 */

import axios from 'axios';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function investigateAfInitData(albumUrl) {
  console.log(`\n🔍 Investigating AF_initDataCallback structure for: ${albumUrl}`);
  
  try {
    const response = await axios.get(albumUrl, {
      headers: {
        'User-Agent': USER_AGENT,
      },
      maxRedirects: 5,
    });
    
    const html = response.data;
    
    // Extract all AF_initDataCallback structures
    const re = /AF_initDataCallback\(([\s\S]*?)\);<\/script>/g;
    const matches = [...html.matchAll(re)];
    
    console.log(`\n✓ Found ${matches.length} AF_initDataCallback structures\n`);
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i][1];
      
      try {
        // Try to parse as JSON5
        const { parse } = await import('json5');
        const data = parse(match);
        
        console.log(`\n${'='.repeat(70)}`);
        console.log(`Structure #${i + 1}:`);
        console.log(`Length: ${match.length} characters`);
        
        // Check if this contains photo data
        if (data && data.data && Array.isArray(data.data)) {
          console.log(`✓ Contains data array with ${data.data.length} elements`);
          
          // Look at the structure
          if (data.data[1] && Array.isArray(data.data[1])) {
            console.log(`✓ Found photo array with ${data.data[1].length} photos`);
            
            // Look at first photo structure in detail
            if (data.data[1][0]) {
              const photo = data.data[1][0];
              console.log(`\n📸 First photo structure:`);
              console.log(`   Type: ${Array.isArray(photo) ? 'Array' : typeof photo}`);
              if (Array.isArray(photo)) {
                console.log(`   Length: ${photo.length} elements`);
                console.log(`\n   Structure breakdown:`);
                photo.forEach((elem, idx) => {
                  const type = Array.isArray(elem) ? `Array[${elem.length}]` : typeof elem;
                  let preview = '';
                  if (typeof elem === 'string') {
                    preview = `: "${elem.substring(0, 50)}${elem.length > 50 ? '...' : ''}"`;
                  } else if (typeof elem === 'number') {
                    preview = `: ${elem}`;
                  } else if (Array.isArray(elem) && elem.length > 0) {
                    // Show array contents briefly
                    const firstElem = elem[0];
                    if (typeof firstElem === 'string') {
                      preview = `: [${elem.length} items, first: "${firstElem.substring(0, 30)}"]`;
                    } else if (typeof firstElem === 'number') {
                      preview = `: [${elem.length} numbers]`;
                    } else {
                      preview = `: [${elem.length} items]`;
                    }
                  }
                  console.log(`   [${idx}] ${type}${preview}`);
                });
                
                // Look for caption-like strings
                console.log(`\n   🔍 Searching for caption data...`);
                for (let j = 0; j < photo.length; j++) {
                  const elem = photo[j];
                  if (typeof elem === 'string' && elem.length > 10 && elem.length < 500) {
                    // This might be a caption
                    if (!elem.startsWith('http') && !elem.startsWith('AF1')) {
                      console.log(`   [${j}] Possible caption: "${elem}"`);
                    }
                  }
                  // Check nested arrays
                  if (Array.isArray(elem)) {
                    for (let k = 0; k < elem.length; k++) {
                      const nested = elem[k];
                      if (typeof nested === 'string' && nested.length > 10 && nested.length < 500) {
                        if (!nested.startsWith('http') && !nested.startsWith('AF1')) {
                          console.log(`   [${j}][${k}] Possible nested caption: "${nested}"`);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } else {
          console.log(`⚠️  Does not contain expected photo data structure`);
        }
        
      } catch (parseError) {
        console.log(`⚠️  Could not parse structure #${i + 1}: ${parseError.message}`);
      }
    }
    
    console.log(`\n${'='.repeat(70)}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log('📷 Deep AF_initDataCallback Investigation\n');
  
  const albumUrl = process.argv[2] || 'https://photos.app.goo.gl/FB8ErkX2wJAQkJzV8';
  
  await investigateAfInitData(albumUrl);
  
  console.log('\n✅ Investigation completed');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
