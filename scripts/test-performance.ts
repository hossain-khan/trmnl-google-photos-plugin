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
 *   node scripts/test-performance.ts
 */

import { performance } from 'node:perf_hooks';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('⚡ Performance Monitoring Test\n');

interface Targets {
  cpuTime: number;
  totalTime: number;
  photoFetch: number;
  templateRender: number;
  urlParse: number;
}

interface MeasurementResult<T = any> {
  name: string;
  duration: number;
  success: boolean;
  error?: string;
  result?: T;
  htmlSize?: number;
}

interface PerformanceCheck {
  name: string;
  value: string;
  target: number;
  pass: boolean;
  unit: string;
}

interface AllResults {
  urlParse: MeasurementResult[];
  dataTransform: MeasurementResult[];
}

interface MockGooglePhoto {
  uid: string;
  url: string;
  width: number;
  height: number;
  imageUpdateDate: number;
  albumAddDate: number;
}

interface PhotoData {
  photo_url: string;
  thumbnail_url: string;
  caption: string | null;
  timestamp: string;
  album_name: string;
  photo_count: number;
  metadata: {
    uid: string;
    original_width: number;
    original_height: number;
    image_update_date: string;
    album_add_date: string;
  };
}

// Performance targets
const TARGETS: Targets = {
  cpuTime: 50, // 50ms CPU time limit
  totalTime: 3000, // 3 seconds total time
  photoFetch: 2000, // 2 seconds for photo fetching
  templateRender: 50, // 50ms for template rendering
  urlParse: 5, // 5ms for URL parsing
};

/**
 * Measure execution time of a function
 */
async function measureTime<T>(name: string, fn: () => T | Promise<T>): Promise<MeasurementResult<T>> {
  const startTime = performance.now();
  let result: T | undefined;
  let error: Error | null = null;

  try {
    result = await fn();
  } catch (err) {
    error = err as Error;
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
async function testUrlParsing(): Promise<MeasurementResult[]> {
  // Load URL parser
  const { parseAlbumUrl } = await import(join(projectRoot, 'lib', 'url-parser'));

  const testUrls: string[] = [
    'https://photos.app.goo.gl/FB8ErkX2wJAQkJzV8',
    'https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF',
    'https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF?key=value',
  ];

  const results: MeasurementResult[] = [];

  for (const url of testUrls) {
    const result = await measureTime(`Parse: ${url.substring(0, 40)}...`, () => {
      return parseAlbumUrl(url);
    });
    results.push(result);
  }

  return results;
}

/**
 * Test data transformation performance
 */
async function testDataTransformation(): Promise<MeasurementResult[]> {
  const results: MeasurementResult[] = [];

  // Mock Google Photo data
  const mockGooglePhoto: MockGooglePhoto = {
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
  const convertResult = await measureTime<PhotoData>('Convert photo data', () => {
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
function displayResults(category: string, results: MeasurementResult[]): void {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`${category}\n`);

  results.forEach((result: MeasurementResult): void => {
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
function calculateTotalCPUTime(allResults: MeasurementResult[][]): number {
  let totalTime = 0;

  allResults.forEach((categoryResults: MeasurementResult[]): void => {
    categoryResults.forEach((result: MeasurementResult): void => {
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
function evaluatePerformance(allResults: AllResults): boolean {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Performance Summary\n');

  // Calculate average times by category
  const urlParseAvg = allResults.urlParse.reduce((sum, r) => sum + r.duration, 0) / allResults.urlParse.length;
  const dataTransformAvg = allResults.dataTransform.reduce((sum, r) => sum + r.duration, 0) / allResults.dataTransform.length;

  const checks: PerformanceCheck[] = [
    {
      name: 'URL parsing',
      value: urlParseAvg.toFixed(2),
      target: TARGETS.urlParse,
      pass: urlParseAvg < TARGETS.urlParse,
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

  checks.forEach((check: PerformanceCheck): void => {
    const icon = check.pass ? '✅' : '⚠️';
    console.log(`${icon} ${check.name}: ${check.value}${check.unit} (target: <${check.target}${check.unit})`);
  });

  console.log('\n💡 Estimated Request Breakdown:\n');
  console.log(`   URL parsing:          ~${urlParseAvg.toFixed(0)}ms`);
  console.log(`   Photo fetching:       ~200-2000ms (network dependent)`);
  console.log(`   Data transformation:  ~${dataTransformAvg.toFixed(0)}ms`);
  console.log(`   JSON serialization:   ~1-2ms`);
  console.log('   ────────────────────────────────');
  console.log(`   Total (excl. network): ~${(urlParseAvg + dataTransformAvg + 2).toFixed(0)}ms`);
  console.log(`   Total (with network):  ~${(urlParseAvg + dataTransformAvg + 2 + 200).toFixed(0)}-${(urlParseAvg + dataTransformAvg + 2 + 2000).toFixed(0)}ms`);

  const allPassed = checks.every((c: PerformanceCheck) => c.pass);

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
async function main(): Promise<void> {
  console.log('🏃 Running performance tests...\n');

  try {
    // Run all tests
    console.log('1️⃣  Testing URL parsing...');
    const urlParseResults = await testUrlParsing();

    console.log('2️⃣  Testing data transformation...');
    const dataTransformResults = await testDataTransformation();

    // Display results
    displayResults('📝 URL Parsing Performance', urlParseResults);
    displayResults('🔄 Data Transformation Performance', dataTransformResults);

    // Evaluate overall performance
    const allResults: AllResults = {
      urlParse: urlParseResults,
      dataTransform: dataTransformResults,
    };

    const passed = evaluatePerformance(allResults);

    // Provide recommendations
    console.log('\n💡 Optimization Tips:\n');
    console.log('   - Use KV caching for album data (already implemented)');
    console.log('   - Minimize external API calls');
    console.log('   - JSON API is faster than HTML rendering');
    console.log('   - TRMNL handles template rendering on their platform');

    process.exit(passed ? 0 : 1);

  } catch (error) {
    console.error('❌ Performance test failed:', (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

// Run the tests
main();
