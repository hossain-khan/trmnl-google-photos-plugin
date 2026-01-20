#!/usr/bin/env node

/**
 * Google Photos API Investigation Script
 *
 * This script investigates how Google Photos shared albums work by:
 * 1. Following redirects from short URLs (photos.app.goo.gl)
 * 2. Analyzing the HTML structure of shared album pages
 * 3. Extracting photo URLs and metadata from the page
 * 4. Documenting API endpoints and data structures
 *
 * Usage:
 *   tsx src/scripts/investigate-api.ts <album-url>
 *
 * Example:
 *   tsx src/scripts/investigate-api.ts https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5
 */

import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { writeFile } from 'fs/promises';

// Configuration
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface ApiEndpoint {
  type?: string;
  pattern?: string;
  found?: boolean;
  description: string;
}

interface MetaTags {
  [key: string]: string;
}

interface Metadata {
  title?: string;
  metaTags?: MetaTags;
  jsonLd?: unknown;
}

interface HTMLStructure {
  [key: string]: unknown;
}

interface Findings {
  timestamp: string;
  inputUrl: string;
  redirectedUrl: string | null;
  albumId: string | null;
  htmlStructure: HTMLStructure;
  photoUrls: string[];
  metadata: Metadata;
  apiEndpoints: ApiEndpoint[];
  rawResponse: string | null;
}

interface PhotoUrlAnalysis {
  url: string;
  parameters: RegExpMatchArray | null;
  notes: string;
}

/**
 * Main investigation function
 */
async function investigateAlbum(albumUrl: string): Promise<Findings> {
  console.log('📷 Google Photos API Investigation Tool\n');
  console.log(`Investigating album: ${albumUrl}\n`);

  const findings: Findings = {
    timestamp: new Date().toISOString(),
    inputUrl: albumUrl,
    redirectedUrl: null,
    albumId: null,
    htmlStructure: {},
    photoUrls: [],
    metadata: {},
    apiEndpoints: [],
    rawResponse: null,
  };

  try {
    // Step 1: Follow redirects and get the final URL
    console.log('🔍 Step 1: Following redirects...');
    const response: AxiosResponse<string> = await axios.get(albumUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 400,
    });

    // Get final URL after redirects
    // Type assertion needed because axios types response.request.res as any
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const resWithUrl = response.request.res as { responseUrl?: string } | undefined;
    findings.redirectedUrl = resWithUrl?.responseUrl ?? albumUrl;
    console.log(`✓ Final URL: ${findings.redirectedUrl}`);

    // Step 2: Extract album ID from URL
    console.log('\n🔍 Step 2: Extracting album ID...');
    const albumIdMatch = findings.redirectedUrl.match(/\/share\/([A-Za-z0-9_-]+)/);
    if (albumIdMatch) {
      findings.albumId = albumIdMatch[1];
      console.log(`✓ Album ID: ${findings.albumId}`);
    } else {
      console.log('⚠️  Could not extract album ID from URL');
    }

    // Step 3: Parse HTML and extract data
    console.log('\n🔍 Step 3: Parsing HTML structure...');
    const $ = cheerio.load(response.data);

    // Look for script tags that might contain data
    const scripts = $('script').toArray();
    console.log(`✓ Found ${scripts.length} script tags`);

    for (const script of scripts) {
      const scriptContent = $(script).html();

      // Look for common data patterns
      if (scriptContent && scriptContent.includes('AF_initDataCallback')) {
        console.log('✓ Found AF_initDataCallback data structure');
        findings.apiEndpoints.push({
          type: 'AF_initDataCallback',
          description: 'Google Photos uses AF_initDataCallback to pass data to the frontend',
        });

        // Try to extract photo URLs
        const urlPattern = /https:\/\/lh3\.googleusercontent\.com\/[a-zA-Z0-9_-]+/g;
        const urls = scriptContent.match(urlPattern);
        if (urls) {
          findings.photoUrls = [...new Set(urls)].slice(0, 20); // Dedupe and limit to first 20
          console.log(`✓ Extracted ${findings.photoUrls.length} unique photo URLs`);
        }
      }

      // Look for JSON-LD structured data
      if ($(script).attr('type') === 'application/ld+json') {
        console.log('✓ Found JSON-LD structured data');
        try {
          const htmlContent = $(script).html();
          const jsonData: unknown = htmlContent ? JSON.parse(htmlContent) : {};
          findings.metadata.jsonLd = jsonData;
        } catch {
          console.log('⚠️  Failed to parse JSON-LD data');
        }
      }
    }

    // Step 4: Extract metadata from HTML
    console.log('\n🔍 Step 4: Extracting metadata...');

    // Page title
    const title = $('title').text();
    if (title) {
      findings.metadata.title = title;
      console.log(`✓ Album title: ${title}`);
    }

    // Meta tags
    const metaTags = $('meta').toArray();
    findings.metadata.metaTags = {};
    for (const meta of metaTags) {
      const property = $(meta).attr('property') || $(meta).attr('name');
      const content = $(meta).attr('content');
      if (property && content) {
        findings.metadata.metaTags[property] = content;
        if (property.includes('image') || property.includes('photo')) {
          console.log(`✓ Meta tag: ${property} = ${content}`);
        }
      }
    }

    // Step 5: Look for API endpoints in network requests
    console.log('\n🔍 Step 5: Analyzing potential API endpoints...');

    // Check for common Google Photos API patterns
    const apiPatterns = [
      '/photos.google.com/share/',
      '/photosdata/',
      '/data/batchexecute',
      '/_/PhotosUi/data/',
    ];

    for (const pattern of apiPatterns) {
      if (response.data.includes(pattern)) {
        findings.apiEndpoints.push({
          pattern: pattern,
          found: true,
          description: 'Potential API endpoint found in page source',
        });
        console.log(`✓ Found potential endpoint pattern: ${pattern}`);
      }
    }

    // Step 6: Save raw HTML for manual inspection
    console.log('\n🔍 Step 6: Saving raw response...');
    const htmlFile = '/tmp/google-photos-response.html';
    await writeFile(htmlFile, response.data);
    console.log(`✓ Saved raw HTML to: ${htmlFile}`);

    // Save findings to JSON
    const findingsFile = '/tmp/google-photos-findings.json';
    await writeFile(findingsFile, JSON.stringify(findings, null, 2));
    console.log(`✓ Saved findings to: ${findingsFile}`);

    // Step 7: Display summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 INVESTIGATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`Album URL: ${albumUrl}`);
    console.log(`Redirected to: ${findings.redirectedUrl}`);
    console.log(`Album ID: ${findings.albumId || 'Not found'}`);
    console.log(`Photo URLs found: ${findings.photoUrls.length}`);
    console.log(`API endpoints discovered: ${findings.apiEndpoints.length}`);
    console.log(`\nNext Steps:`);
    console.log(`1. Review ${htmlFile} for data structures`);
    console.log(`2. Use Chrome DevTools to inspect network requests`);
    console.log(`3. Look for AF_initDataCallback or similar data injection`);
    console.log(`4. Refer to ARCHITECTURE.md for implementation details`);
    console.log('='.repeat(70));

    // Display sample photo URLs
    if (findings.photoUrls.length > 0) {
      console.log('\n📸 Sample Photo URLs (first 5):');
      findings.photoUrls.slice(0, 5).forEach((url, idx) => {
        console.log(`${idx + 1}. ${url.substring(0, 100)}...`);
      });
    }

    return findings;
  } catch (error) {
    console.error('\n❌ Error during investigation:');

    if (error instanceof Error) {
      console.error(error.message);

      // Type guard for axios error
      if ('response' in error && error.response) {
        const axiosError = error as { response: { status: number; headers: unknown } };
        console.error(`Status: ${axiosError.response.status}`);
        console.error(`Headers:`, axiosError.response.headers);
      }
    } else {
      console.error('An unknown error occurred');
    }

    throw error;
  }
}

/**
 * Extract photo metadata from Google Photos URLs
 */
function analyzePhotoUrl(url: string): PhotoUrlAnalysis {
  console.log(`\n🔬 Analyzing photo URL structure:`);
  console.log(`URL: ${url}`);

  // Google Photos URLs typically have parameters like =w2400-h1600
  const paramsMatch = url.match(/=([wh]\d+-?)+/g);
  if (paramsMatch) {
    console.log(`✓ Found size parameters: ${paramsMatch.join(', ')}`);
    console.log(`  This allows us to request different image sizes!`);
  }

  return {
    url: url,
    parameters: paramsMatch,
    notes: 'Google Photos URLs support size modifiers like =w800-h600',
  };
}

// Main execution
const albumUrl = process.argv[2];

if (!albumUrl) {
  console.error('❌ Error: Please provide a Google Photos shared album URL');
  console.error('Usage: tsx scripts/investigate-api.ts <album-url>');
  console.error(
    'Example: tsx scripts/investigate-api.ts https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5'
  );
  process.exit(1);
}

// Validate URL format
if (!albumUrl.includes('photos.app.goo.gl') && !albumUrl.includes('photos.google.com')) {
  console.error('❌ Error: URL must be a Google Photos shared album link');
  process.exit(1);
}

// Run investigation
investigateAlbum(albumUrl)
  .then((findings) => {
    console.log('\n✅ Investigation completed successfully!');

    // Analyze a sample photo URL if we found any
    if (findings.photoUrls.length > 0) {
      analyzePhotoUrl(findings.photoUrls[0]);
    }

    process.exit(0);
  })
  .catch((_error) => {
    console.error('\n❌ Investigation failed');
    process.exit(1);
  });
