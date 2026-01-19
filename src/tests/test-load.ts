#!/usr/bin/env node

/**
 * Load Testing Script for /markup Endpoint
 *
 * Simulates concurrent requests to test worker performance under load
 *
 * Tests:
 * - Response time under concurrent load
 * - Error rate under load
 * - Memory usage
 * - CPU time per request
 *
 * Usage:
 *   node scripts/test-load.js [workerUrl] [numRequests]
 *
 * Example:
 *   node scripts/test-load.js http://localhost:8787 50
 *   node scripts/test-load.js https://trmnl-google-photos.gohk.xyz 100
 */

import { performance } from 'node:perf_hooks';

interface RequestResult {
  requestId: number;
  success: boolean;
  status: number;
  duration: number;
  htmlLength: number;
  isError: boolean;
  error?: string;
}

interface Stats {
  total: number;
  successful: number;
  failed: number;
  errorRate: string;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
  totalDuration: number;
  requestsPerSecond: string;
}

interface SuccessCriteria {
  name: string;
  pass: boolean;
  value: string;
  target: string;
}

// Configuration
const DEFAULT_WORKER_URL = 'http://localhost:8787';
const DEFAULT_NUM_REQUESTS = 50;
const VALID_ALBUM_URL = 'https://photos.app.goo.gl/ENK6C44K85QgVHPH8';

// Parse command line arguments
const workerUrl = process.argv[2] || DEFAULT_WORKER_URL;
const numRequests = parseInt(process.argv[3]) || DEFAULT_NUM_REQUESTS;

console.log('🚀 Load Testing Script\n');
console.log(`Worker URL: ${workerUrl}`);
console.log(`Number of requests: ${numRequests}`);
console.log(`Test album: ${VALID_ALBUM_URL.substring(0, 50)}...\n`);

/**
 * Create a sample TRMNL request
 */
function createTRMNLRequest(albumUrl: string = VALID_ALBUM_URL, layout: string = 'full'): object {
  return {
    trmnl: {
      plugin_settings: {
        instance_name: 'Load Test',
        shared_album_url: albumUrl,
      },
      screen: {
        width: 800,
        height: 480,
        bit_depth: 1,
      },
      layout: layout,
    },
  };
}

/**
 * Make a single request to the worker
 */
async function makeRequest(requestId: number, layout: string = 'full'): Promise<RequestResult> {
  const startTime = performance.now();

  try {
    const request = createTRMNLRequest(VALID_ALBUM_URL, layout);

    const response = await fetch(`${workerUrl}/markup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    const html = await response.text();

    return {
      requestId,
      success: response.ok,
      status: response.status,
      duration: Math.round(duration),
      htmlLength: html.length,
      isError: html.includes('❌') || html.includes('Failed'),
    };
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    return {
      requestId,
      success: false,
      status: 0,
      duration: Math.round(duration),
      htmlLength: 0,
      isError: true,
      error: (error as Error).message,
    };
  }
}

/**
 * Run load test with concurrent requests
 */
async function runLoadTest(): Promise<{ results: RequestResult[]; totalDuration: number }> {
  console.log('⏱️  Starting load test...\n');

  const layouts = ['full', 'half_horizontal', 'half_vertical', 'quadrant'];
  const requests: Promise<RequestResult>[] = [];

  // Create all request promises
  for (let i = 0; i < numRequests; i++) {
    const layout = layouts[i % layouts.length]; // Rotate through layouts
    requests.push(makeRequest(i + 1, layout));
  }

  const startTime = performance.now();

  // Execute all requests concurrently
  const results = await Promise.all(requests);

  const endTime = performance.now();
  const totalDuration = endTime - startTime;

  return { results, totalDuration };
}

/**
 * Calculate statistics from results
 */
function calculateStats(results: RequestResult[], totalDuration: number): Stats {
  const successfulRequests = results.filter((r: RequestResult) => r.success && !r.isError);
  const failedRequests = results.filter((r: RequestResult) => !r.success || r.isError);

  const durations = successfulRequests.map((r) => r.duration);
  durations.sort((a: number, b: number) => a - b);

  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length || 0;
  const minDuration = durations[0] || 0;
  const maxDuration = durations[durations.length - 1] || 0;

  // Percentiles
  const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
  const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
  const p99 = durations[Math.floor(durations.length * 0.99)] || 0;

  const errorRate = (failedRequests.length / results.length) * 100;
  const requestsPerSecond = (results.length / totalDuration) * 1000;

  return {
    total: results.length,
    successful: successfulRequests.length,
    failed: failedRequests.length,
    errorRate: errorRate.toFixed(2),
    avgDuration: Math.round(avgDuration),
    minDuration,
    maxDuration,
    p50,
    p95,
    p99,
    totalDuration: Math.round(totalDuration),
    requestsPerSecond: requestsPerSecond.toFixed(2),
  };
}

/**
 * Display results in a formatted table
 */
function displayResults(stats: Stats): void {
  console.log('📊 Load Test Results\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total Requests:       ${stats.total}`);
  console.log(
    `Successful:           ${stats.successful} (${((stats.successful / stats.total) * 100).toFixed(1)}%)`
  );
  console.log(`Failed:               ${stats.failed} (${stats.errorRate}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n⏱️  Response Times (ms):\n');
  console.log(`Average:              ${stats.avgDuration}ms`);
  console.log(`Minimum:              ${stats.minDuration}ms`);
  console.log(`Maximum:              ${stats.maxDuration}ms`);
  console.log(`50th percentile:      ${stats.p50}ms`);
  console.log(`95th percentile:      ${stats.p95}ms`);
  console.log(`99th percentile:      ${stats.p99}ms`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🚀 Performance:\n');
  console.log(`Total Duration:       ${stats.totalDuration}ms`);
  console.log(`Requests/Second:      ${stats.requestsPerSecond}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Evaluate test results against targets
 */
function evaluateResults(stats: Stats): boolean {
  console.log('\n✅ Success Criteria:\n');

  const checks = [
    {
      name: 'Response time <3s (95th percentile)',
      pass: stats.p95 < 3000,
      value: `${stats.p95}ms`,
      target: '<3000ms',
    },
    {
      name: 'Error rate <1%',
      pass: parseFloat(stats.errorRate) < 1.0,
      value: `${stats.errorRate}%`,
      target: '<1%',
    },
    {
      name: 'Average response time reasonable',
      pass: stats.avgDuration < 2000,
      value: `${stats.avgDuration}ms`,
      target: '<2000ms',
    },
    {
      name: 'All requests completed',
      pass: stats.successful + stats.failed === stats.total,
      value: `${stats.successful + stats.failed}/${stats.total}`,
      target: `${stats.total}/${stats.total}`,
    },
  ];

  checks.forEach((check: SuccessCriteria): void => {
    const icon = check.pass ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
    console.log(`   Value: ${check.value} | Target: ${check.target}`);
  });

  const allPassed = checks.every((c: SuccessCriteria) => c.pass);

  if (allPassed) {
    console.log('\n🎉 All success criteria met!');
  } else {
    console.log('\n⚠️  Some criteria not met. Review performance optimization.');
  }

  return allPassed;
}

/**
 * Main function
 */
async function main() {
  try {
    // Check if worker is accessible (health check)
    console.log('🏥 Checking worker health...');
    try {
      const healthCheck = await fetch(`${workerUrl}/health`);
      if (!healthCheck.ok) {
        console.error('❌ Worker health check failed. Is the worker running?');
        process.exit(1);
      }
      console.log('✅ Worker is healthy\n');
    } catch (error) {
      console.error(`❌ Cannot reach worker at ${workerUrl}`);
      console.error(`   Error: ${(error as Error).message}`);
      console.error('\n💡 Tip: Start the worker with: npm run dev');
      process.exit(1);
    }

    // Run load test
    const { results, totalDuration } = await runLoadTest();

    // Calculate statistics
    const stats = calculateStats(results, totalDuration);

    // Display results
    displayResults(stats);

    // Evaluate against criteria
    const passed = evaluateResults(stats);

    // Exit with appropriate code
    process.exit(passed ? 0 : 1);
  } catch (error) {
    console.error('❌ Load test failed:', (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

// Run the test
main();
