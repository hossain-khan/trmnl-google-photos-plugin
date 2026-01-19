#!/usr/bin/env node

/**
 * Test axios redirect behavior
 */

import axios from 'axios';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testRedirects(url) {
  console.log(`Testing URL: ${url}\n`);
  
  try {
    // Test 1: With maxRedirects
    console.log('Test 1: Axios with maxRedirects=5');
    const response1 = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      maxRedirects: 5,
    });
    
    console.log(`  Status: ${response1.status}`);
    console.log(`  response.request.res.responseUrl: ${response1.request?.res?.responseUrl}`);
    console.log(`  response.config.url: ${response1.config.url}`);
    console.log(`  Has AF_initDataCallback: ${response1.data.includes('AF_initDataCallback({')}`);
    
    // Test 2: Manual redirect following
    console.log('\nTest 2: Manual redirect following');
    const response2 = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      maxRedirects: 0,
      validateStatus: (status) => status < 400 || status === 302,
    });
    
    console.log(`  Status: ${response2.status}`);
    if (response2.status === 302) {
      const location = response2.headers.location;
      console.log(`  Redirect to: ${location}`);
      
      // Follow the redirect
      const response3 = await axios.get(location, {
        headers: { 'User-Agent': USER_AGENT },
      });
      
      console.log(`  Final status: ${response3.status}`);
      console.log(`  Has AF_initDataCallback({): ${response3.data.includes('AF_initDataCallback({')}`);
      console.log(`  Content length: ${response3.data.length} bytes`);
      
      // Count AF_initDataCallback calls with data
      const re = /AF_initDataCallback\(\{[\s\S]*?data[\s\S]*?\}\);<\/script>/g;
      const matches = response3.data.match(re);
      console.log(`  AF_initDataCallback with data: ${matches ? matches.length : 0}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Headers:', error.response.headers);
    }
  }
}

const url = process.argv[2] || 'https://photos.app.goo.gl/FB8ErkX2wJAQkJzV8';
testRedirects(url)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
