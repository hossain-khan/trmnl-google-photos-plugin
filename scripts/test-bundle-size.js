#!/usr/bin/env node

/**
 * Bundle Size Checker
 * 
 * Checks if the Cloudflare Worker bundle stays within the 1MB limit
 * 
 * Cloudflare Workers Limits:
 * - Free tier: 1MB compressed bundle size
 * - Paid tier: 10MB compressed bundle size
 * - Recommended: Stay well under limit for fast cold starts
 * 
 * Usage:
 *   node scripts/test-bundle-size.js
 */

import { readFileSync, statSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('📦 Bundle Size Checker\n');

// Cloudflare Workers limits (in bytes)
const LIMITS = {
  free: 1 * 1024 * 1024, // 1MB
  paid: 10 * 1024 * 1024, // 10MB
  recommended: 0.5 * 1024 * 1024, // 500KB (for fast cold starts)
};

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculate percentage of limit
 */
function calculatePercentage(size, limit) {
  return ((size / limit) * 100).toFixed(1);
}

/**
 * Check bundle size by building the worker
 */
function checkBundleSize() {
  console.log('🔨 Building worker bundle...\n');
  
  try {
    // Run wrangler deploy --dry-run to get bundle info
    // Note: This requires wrangler CLI to be installed
    const result = execSync('npx wrangler deploy --dry-run --outdir=.wrangler-output 2>&1', {
      cwd: projectRoot,
      encoding: 'utf-8',
    });

    console.log('Build output:');
    console.log(result);

    // Look for bundle file in .wrangler-output directory
    const bundlePaths = [
      '.wrangler-output/index.js',
      '.wrangler/deploy/index.js',
      'dist/index.js',
    ];

    let bundleSize = 0;
    let bundlePath = null;

    for (const path of bundlePaths) {
      const fullPath = join(projectRoot, path);
      if (existsSync(fullPath)) {
        bundlePath = fullPath;
        const stats = statSync(fullPath);
        bundleSize = stats.size;
        break;
      }
    }

    if (!bundlePath) {
      console.log('⚠️  Could not find bundle file. Estimating from source...');
      return estimateBundleSize();
    }

    return {
      size: bundleSize,
      path: bundlePath,
      method: 'actual',
    };

  } catch (error) {
    console.log('⚠️  Could not build bundle with wrangler. Estimating from source...');
    console.log(`   Error: ${error.message}`);
    return estimateBundleSize();
  }
}

/**
 * Estimate bundle size from source files and node_modules
 */
function estimateBundleSize() {
  console.log('📊 Estimating bundle size from source files...\n');
  
  let totalSize = 0;
  const files = [];

  // Source files
  const sourceFiles = [
    'src/index.ts',
    'src/types.ts',
    'src/templates.ts',
    'src/services/photo-fetcher.ts',
    'src/services/template-renderer.ts',
    'src/services/cache-service.ts',
    'lib/url-parser.js',
  ];

  sourceFiles.forEach(file => {
    const fullPath = join(projectRoot, file);
    if (existsSync(fullPath)) {
      const stats = statSync(fullPath);
      totalSize += stats.size;
      files.push({ file, size: stats.size });
    }
  });

  // Estimate dependency sizes (rough approximation)
  // These are bundled and tree-shaken, so actual size is smaller
  const dependencies = {
    hono: 50 * 1024, // ~50KB
    zod: 50 * 1024, // ~50KB (tree-shaken)
    'google-photos-album-image-url-fetch': 30 * 1024, // ~30KB
  };

  let dependencySize = 0;
  Object.entries(dependencies).forEach(([name, size]) => {
    dependencySize += size;
    files.push({ file: `node_modules/${name}`, size, estimated: true });
  });

  // Compressed size is typically 30-40% of uncompressed
  const estimatedCompressed = (totalSize + dependencySize) * 0.35;

  return {
    size: Math.round(estimatedCompressed),
    uncompressed: totalSize + dependencySize,
    files,
    method: 'estimated',
  };
}

/**
 * Display bundle size analysis
 */
function displayAnalysis(bundleInfo) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 Bundle Size Analysis\n');
  
  if (bundleInfo.method === 'actual') {
    console.log(`Bundle path:          ${bundleInfo.path}`);
    console.log(`Bundle size:          ${formatBytes(bundleInfo.size)}`);
  } else {
    console.log(`Method:               Estimated (compressed)`);
    console.log(`Uncompressed:         ${formatBytes(bundleInfo.uncompressed)}`);
    console.log(`Estimated compressed: ${formatBytes(bundleInfo.size)}`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📏 Limits:\n');

  const checks = [
    {
      name: 'Free tier (1MB)',
      limit: LIMITS.free,
      pass: bundleInfo.size < LIMITS.free,
    },
    {
      name: 'Recommended (500KB)',
      limit: LIMITS.recommended,
      pass: bundleInfo.size < LIMITS.recommended,
    },
    {
      name: 'Paid tier (10MB)',
      limit: LIMITS.paid,
      pass: bundleInfo.size < LIMITS.paid,
    },
  ];

  checks.forEach(check => {
    const icon = check.pass ? '✅' : '❌';
    const percentage = calculatePercentage(bundleInfo.size, check.limit);
    const bar = '█'.repeat(Math.min(20, Math.round(percentage / 5)));
    
    console.log(`${icon} ${check.name}`);
    console.log(`   ${formatBytes(bundleInfo.size)} / ${formatBytes(check.limit)} (${percentage}%)`);
    console.log(`   ${bar}`);
    console.log('');
  });

  // File breakdown if available
  if (bundleInfo.files && bundleInfo.files.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 File Breakdown:\n');
    
    // Sort by size (largest first)
    const sortedFiles = [...bundleInfo.files].sort((a, b) => b.size - a.size);
    
    sortedFiles.forEach(({ file, size, estimated }) => {
      const sizeStr = formatBytes(size).padEnd(10);
      const estMarker = estimated ? '(est)' : '';
      console.log(`  ${sizeStr} ${file} ${estMarker}`);
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Provide optimization recommendations
 */
function provideRecommendations(bundleInfo) {
  console.log('\n💡 Optimization Recommendations:\n');

  if (bundleInfo.size > LIMITS.free) {
    console.log('🚨 CRITICAL: Bundle exceeds free tier limit (1MB)');
    console.log('   - Remove unused dependencies');
    console.log('   - Enable tree-shaking');
    console.log('   - Consider code splitting');
    console.log('   - Minimize template sizes');
  } else if (bundleInfo.size > LIMITS.recommended) {
    console.log('⚠️  Bundle larger than recommended (500KB)');
    console.log('   - Cold starts may be slower');
    console.log('   - Consider lazy loading templates');
    console.log('   - Review dependency sizes');
  } else {
    console.log('✅ Bundle size is optimal!');
    console.log('   - Fast cold starts expected');
    console.log('   - Well within free tier limits');
  }

  console.log('\n📚 Resources:');
  console.log('   - Cloudflare Workers Limits: https://developers.cloudflare.com/workers/platform/limits/');
  console.log('   - Bundle size optimization: https://developers.cloudflare.com/workers/platform/limits/#worker-size');
}

/**
 * Main function
 */
function main() {
  try {
    const bundleInfo = checkBundleSize();
    displayAnalysis(bundleInfo);
    provideRecommendations(bundleInfo);

    // Exit with error if over free tier limit
    if (bundleInfo.size > LIMITS.free) {
      console.log('\n❌ Bundle size check FAILED');
      process.exit(1);
    }

    console.log('\n✅ Bundle size check PASSED');
    process.exit(0);

  } catch (error) {
    console.error('❌ Bundle size check failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the check
main();
