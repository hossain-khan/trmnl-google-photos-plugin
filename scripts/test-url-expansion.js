#!/usr/bin/env node

/**
 * Test URL expansion from short URLs to full share URLs
 */

import axios from 'axios';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function expandShortUrl(shortUrl) {
  console.log(`\n🔍 Expanding short URL: ${shortUrl}`);
  
  try {
    // Follow redirects manually to capture all URL transformations
    let currentUrl = shortUrl;
    let redirectCount = 0;
    const maxRedirects = 10;
    
    while (redirectCount < maxRedirects) {
      console.log(`  [${redirectCount}] Requesting: ${currentUrl}`);
      
      const response = await axios.get(currentUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        maxRedirects: 0, // Handle redirects manually
        validateStatus: (status) => status < 400 || status === 301 || status === 302 || status === 307 || status === 308
      });
      
      // Check for redirect
      if ([301, 302, 307, 308].includes(response.status)) {
        const location = response.headers.location;
        if (location) {
          console.log(`  ↳ Redirects to: ${location}`);
          currentUrl = location.startsWith('http') ? location : `https://photos.google.com${location}`;
          redirectCount++;
          continue;
        }
      }
      
      // No more redirects - check final URL
      console.log(`  ✓ Final URL: ${response.request?.res?.responseUrl || currentUrl}`);
      
      // Check if we got a full share URL
      const shareMatch = currentUrl.match(/photos\.google\.com\/share\/([A-Za-z0-9_-]+)/);
      if (shareMatch) {
        console.log(`  ✓ Album ID extracted: ${shareMatch[1]}`);
        return {
          fullUrl: currentUrl,
          albumId: shareMatch[1]
        };
      }
      
      // Check response URL from axios
      if (response.request?.res?.responseUrl) {
        const respShareMatch = response.request.res.responseUrl.match(/photos\.google\.com\/share\/([A-Za-z0-9_-]+)/);
        if (respShareMatch) {
          console.log(`  ✓ Album ID extracted from response: ${respShareMatch[1]}`);
          return {
            fullUrl: response.request.res.responseUrl,
            albumId: respShareMatch[1]
          };
        }
      }
      
      break;
    }
    
    console.log('  ⚠️  Could not extract full share URL');
    return null;
    
  } catch (error) {
    if (error.response) {
      console.log(`  Response status: ${error.response.status}`);
      if (error.response.headers.location) {
        console.log(`  Redirect location: ${error.response.headers.location}`);
      }
    }
    console.error(`  ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Alternative approach: parse the HTML response for the full URL
 */
async function extractAlbumFromHtml(shortUrl) {
  console.log(`\n🔍 Extracting album ID from HTML: ${shortUrl}`);
  
  try {
    const response = await axios.get(shortUrl, {
      headers: {
        'User-Agent': USER_AGENT,
      },
      maxRedirects: 5,
    });
    
    // Look for patterns in HTML that might contain the full album URL
    const html = response.data;
    
    // Pattern 1: Look for data-desktop-link attribute
    const desktopLinkMatch = html.match(/data-desktop-link="([^"]+)"/);
    if (desktopLinkMatch) {
      console.log(`  ✓ Found in data-desktop-link: ${desktopLinkMatch[1]}`);
    }
    
    // Pattern 2: Look for meta redirect
    const metaMatch = html.match(/<meta[^>]+url=([^>]+)>/i);
    if (metaMatch) {
      console.log(`  ✓ Found in meta redirect: ${metaMatch[1]}`);
    }
    
    // Pattern 3: Look in window data
    const windowMatch = html.match(/window\['_?ddl[^']*'\]\s*=\s*['"]([^'"]+)['"]/);
    if (windowMatch) {
      console.log(`  ✓ Found in window data: ${windowMatch[1]}`);
    }
    
    // Pattern 4: Look for AF_initDataCallback with album ID
    const afMatch = html.match(/"\/share\/([A-Za-z0-9_-]+)"/);
    if (afMatch) {
      console.log(`  ✓ Found album ID in script: ${afMatch[1]}`);
      return {
        fullUrl: `https://photos.google.com/share/${afMatch[1]}`,
        albumId: afMatch[1]
      };
    }
    
    console.log('  ⚠️  Could not extract album ID from HTML');
    return null;
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Main test
 */
async function main() {
  console.log('📷 Google Photos URL Expansion Test\n');
  
  const testUrls = [
    'https://photos.app.goo.gl/FB8ErkX2wJAQkJzV8',
  ];
  
  for (const url of testUrls) {
    console.log('\n' + '='.repeat(70));
    console.log(`Testing URL: ${url}`);
    
    // Try redirect following
    const redirectResult = await expandShortUrl(url);
    if (redirectResult) {
      console.log(`\n✅ Success via redirects:`);
      console.log(`   Full URL: ${redirectResult.fullUrl}`);
      console.log(`   Album ID: ${redirectResult.albumId}`);
    }
    
    // Try HTML parsing
    const htmlResult = await extractAlbumFromHtml(url);
    if (htmlResult) {
      console.log(`\n✅ Success via HTML parsing:`);
      console.log(`   Full URL: ${htmlResult.fullUrl}`);
      console.log(`   Album ID: ${htmlResult.albumId}`);
    }
    
    if (!redirectResult && !htmlResult) {
      console.log(`\n❌ Could not expand URL`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Test completed');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
