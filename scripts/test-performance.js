#!/usr/bin/env node

/**
 * Performance Monitoring Test
 * 
 * Tests CPU time and execution time for various operations
 * Ensures the worker stays within Cloudflare's 50ms CPU limit (free tier)
 * 
 * Note: Cloudflare Workers CPU time limit:
 * - Free tier: 50ms per request
 * - Paid tier: 50ms per request (same limit, but with higher throughput)
 * - Wall time: ~30 seconds maximum (for long-running operations)
 * 
 * Usage:
 *   node scripts/test-performance.js
 */

import { performance } from 'node:perf_hooks';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('⚡ Performance Monitoring Test\n');

// Performance targets
const TARGETS = {
  cpuTime: 50, // 50ms CPU time limit
  totalTime: 3000, // 3 seconds total time
  photoFetch: 2000, // 2 seconds for photo fetching
  templateRender: 50, // 50ms for template rendering
  urlParse: 5, // 5ms for URL parsing
};

/**
 * Measure execution time of a function
 */
async function measureTime(name, fn) {
  const startTime = performance.now();
  let result;
  let error = null;

  try {
    result = await fn();
  } catch (err) {
    error = err;
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  return {
    name,
    duration: Math.round(duration * 100) / 100, // Round to 2 decimals
    success: error === null,
    error: error?.message,
    result,
  };
}

/**
 * Test URL parsing performance
 */
async function testUrlParsing() {
  // Load URL parser
  const { parseAlbumUrl } = await import(join(projectRoot, 'lib', 'url-parser.js'));

  const testUrls = [
    'https://photos.app.goo.gl/FB8ErkX2wJAQkJzV8',
    'https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF',
    'https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF?key=value',
  ];

  const results = [];

  for (const url of testUrls) {
    const result = await measureTime(`Parse: ${url.substring(0, 40)}...`, () => {
      return parseAlbumUrl(url);
    });
    results.push(result);
  }

  return results;
}

/**
 * Test template rendering performance
 */
async function testTemplateRendering() {
  console.log('   Loading LiquidJS...');
  const { Liquid } = await import('liquidjs');
  
  const liquid = new Liquid({
    cache: true,
    strictFilters: true,
    strictVariables: false,
  });

  // Load templates
  const layouts = ['full', 'half_horizontal', 'half_vertical', 'quadrant'];
  const results = [];

  // Mock photo data
  const mockContext = {
    photo: {
      photo_url: 'https://lh3.googleusercontent.com/example=w800-h480',
      thumbnail_url: 'https://lh3.googleusercontent.com/example=w400-h300',
      caption: null,
      timestamp: new Date().toISOString(),
      album_name: 'Test Album',
      photo_count: 10,
      metadata: {
        uid: 'test123',
        original_width: 800,
        original_height: 480,
        image_update_date: new Date().toISOString(),
        album_add_date: new Date().toISOString(),
      },
    },
    trmnl: {
      plugin_settings: {
        instance_name: 'Performance Test',
        shared_album_url: 'https://photos.app.goo.gl/test',
      },
      screen: {
        width: 800,
        height: 480,
        bit_depth: 1,
      },
      layout: 'full',
    },
  };

  for (const layout of layouts) {
    const templatePath = join(projectRoot, 'templates', `${layout}.liquid`);
    const templateContent = readFileSync(templatePath, 'utf-8');

    const result = await measureTime(`Render: ${layout}`, async () => {
      return await liquid.parseAndRender(templateContent, mockContext);
    });

    results.push({
      ...result,
      htmlSize: result.result?.length || 0,
    });
  }

  return results;
}

/**
 * Test data transformation performance
 */
async function testDataTransformation() {
  const results = [];

  // Mock Google Photo data
  const mockGooglePhoto = {
    uid: 'AF1QipO4_Y5pseqWDPSlY7AAo0wmg76xW4gX0kOz8-p_',
    url: 'https://lh3.googleusercontent.com/example',
    width: 4000,
    height: 3000,
    imageUpdateDate: Date.now(),
    albumAddDate: Date.now(),
  };

  // Test photo URL optimization
  const optimizeResult = await measureTime('Optimize photo URL', () => {
    const baseUrl = mockGooglePhoto.url;
    return `${baseUrl}=w800-h480`;
  });
  results.push(optimizeResult);

  // Test photo data conversion
  const convertResult = await measureTime('Convert photo data', () => {
    return {
      photo_url: `${mockGooglePhoto.url}=w800-h480`,
      thumbnail_url: `${mockGooglePhoto.url}=w400-h300`,
      caption: null,
      timestamp: new Date().toISOString(),
      album_name: 'Google Photos Shared Album',
      photo_count: 10,
      metadata: {
        uid: mockGooglePhoto.uid,
        original_width: mockGooglePhoto.width,
        original_height: mockGooglePhoto.height,
        image_update_date: new Date(mockGooglePhoto.imageUpdateDate).toISOString(),
        album_add_date: new Date(mockGooglePhoto.albumAddDate).toISOString(),
      },
    };
  });
  results.push(convertResult);

  // Test random selection
  const photos = Array(100).fill(null).map((_, i) => ({
    uid: `photo-${i}`,
    url: `https://example.com/photo-${i}`,
  }));

  const selectionResult = await measureTime('Random photo selection (100 photos)', () => {
    const randomIndex = Math.floor(Math.random() * photos.length);
    return photos[randomIndex];
  });
  results.push(selectionResult);

  return results;
}

/**
 * Display test results in a table
 */
function displayResults(category, results) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`${category}\n`);

  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const duration = `${result.duration}ms`.padEnd(10);
    const name = result.name.padEnd(40);
    
    console.log(`${icon} ${name} ${duration}`);
    
    if (result.htmlSize) {
      console.log(`   HTML size: ${result.htmlSize} bytes`);
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
}

/**
 * Calculate total CPU time estimate
 */
function calculateTotalCPUTime(allResults) {
  let totalTime = 0;

  allResults.forEach(categoryResults => {
    categoryResults.forEach(result => {
      if (result.success) {
        totalTime += result.duration;
      }
    });
  });

  return totalTime;
}

/**
 * Evaluate performance against targets
 */
function evaluatePerformance(allResults) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Performance Summary\n');

  // Calculate average times by category
  const urlParseAvg = allResults.urlParse.reduce((sum, r) => sum + r.duration, 0) / allResults.urlParse.length;
  const templateRenderAvg = allResults.templateRender.reduce((sum, r) => sum + r.duration, 0) / allResults.templateRender.length;
  const dataTransformAvg = allResults.dataTransform.reduce((sum, r) => sum + r.duration, 0) / allResults.dataTransform.length;

  const checks = [
    {
      name: 'URL parsing',
      value: urlParseAvg.toFixed(2),
      target: TARGETS.urlParse,
      pass: urlParseAvg < TARGETS.urlParse,
      unit: 'ms',
    },
    {
      name: 'Template rendering',
      value: templateRenderAvg.toFixed(2),
      target: TARGETS.templateRender,
      pass: templateRenderAvg < TARGETS.templateRender,
      unit: 'ms',
    },
    {
      name: 'Data transformation',
      value: dataTransformAvg.toFixed(2),
      target: 10, // 10ms target for data ops
      pass: dataTransformAvg < 10,
      unit: 'ms',
    },
  ];

  checks.forEach(check => {
    const icon = check.pass ? '✅' : '⚠️';
    console.log(`${icon} ${check.name}: ${check.value}${check.unit} (target: <${check.target}${check.unit})`);
  });

  console.log('\n💡 Estimated Request Breakdown:\n');
  console.log(`   URL parsing:          ~${urlParseAvg.toFixed(0)}ms`);
  console.log(`   Photo fetching:       ~200-2000ms (network dependent)`);
  console.log(`   Data transformation:  ~${dataTransformAvg.toFixed(0)}ms`);
  console.log(`   Template rendering:   ~${templateRenderAvg.toFixed(0)}ms`);
  console.log('   ────────────────────────────────');
  console.log(`   Total (excl. network): ~${(urlParseAvg + dataTransformAvg + templateRenderAvg).toFixed(0)}ms`);
  console.log(`   Total (with network):  ~${(urlParseAvg + dataTransformAvg + templateRenderAvg + 500).toFixed(0)}-${(urlParseAvg + dataTransformAvg + templateRenderAvg + 2000).toFixed(0)}ms`);

  const allPassed = checks.every(c => c.pass);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (allPassed) {
    console.log('✅ All performance targets met!');
  } else {
    console.log('⚠️  Some performance targets not met. Consider optimization.');
  }

  return allPassed;
}

/**
 * Main function
 */
async function main() {
  console.log('🏃 Running performance tests...\n');

  try {
    // Run all tests
    console.log('1️⃣  Testing URL parsing...');
    const urlParseResults = await testUrlParsing();

    console.log('2️⃣  Testing template rendering...');
    const templateRenderResults = await testTemplateRendering();

    console.log('3️⃣  Testing data transformation...');
    const dataTransformResults = await testDataTransformation();

    // Display results
    displayResults('📝 URL Parsing Performance', urlParseResults);
    displayResults('🎨 Template Rendering Performance', templateRenderResults);
    displayResults('🔄 Data Transformation Performance', dataTransformResults);

    // Evaluate overall performance
    const allResults = {
      urlParse: urlParseResults,
      templateRender: templateRenderResults,
      dataTransform: dataTransformResults,
    };

    const passed = evaluatePerformance(allResults);

    // Provide recommendations
    console.log('\n💡 Optimization Tips:\n');
    console.log('   - Enable template caching (already done)');
    console.log('   - Use KV caching for album data (optional)');
    console.log('   - Minimize external API calls');
    console.log('   - Keep templates simple and focused');

    process.exit(passed ? 0 : 1);

  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the tests
main();
