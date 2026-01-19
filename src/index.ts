import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { parseAlbumUrl } from '../lib/url-parser';
import { fetchRandomPhoto } from './services/photo-fetcher';

// Type definitions for Cloudflare Workers environment
type Bindings = {
  ENVIRONMENT?: string;
  PHOTOS_CACHE?: KVNamespace; // Optional KV namespace for caching album data
  // Add other bindings here when needed (Analytics, etc.)
};

// Create Hono app with type safety
const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for GitHub Pages and TRMNL platform
app.use(
  '/*',
  cors({
    origin: [
      'https://hossain-khan.github.io',
      'https://usetrmnl.com',
      'http://localhost:8787',
      'http://localhost:3000',
    ],
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400, // 24 hours
  })
);

// Add security headers middleware
app.use('/*', async (c, next) => {
  await next();

  // Security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
});

/**
 * Health check endpoint - returns basic service status
 * Used to verify the worker is running and accessible
 */
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'trmnl-google-photos-plugin',
    version: '0.1.0',
    environment: c.env.ENVIRONMENT || 'production',
    timestamp: new Date().toISOString(),
    message: 'TRMNL Google Photos Plugin is running',
  });
});

/**
 * Health check endpoint (alternative path)
 * Same as / but with explicit /health path for monitoring
 */
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'trmnl-google-photos-plugin',
    version: '0.1.0',
    environment: c.env.ENVIRONMENT || 'production',
    timestamp: new Date().toISOString(),
    uptime: 'N/A', // Workers are stateless, no persistent uptime
  });
});

/**
 * GET /api/photo - TRMNL Polling Endpoint (JSON API)
 *
 * Returns random photo data as JSON for TRMNL's Polling strategy.
 * TRMNL platform will merge this JSON into Liquid templates stored in Markup Editor.
 *
 * Query Parameters:
 * - album_url: Google Photos shared album URL (required)
 *
 * Example:
 * GET /api/photo?album_url=https://photos.app.goo.gl/...
 *
 * Response (200 OK):
 * {
 *   "photo_url": "https://lh3.googleusercontent.com/...",
 *   "caption": null,
 *   "album_name": "Google Photos Shared Album",
 *   "photo_count": 142,
 *   "timestamp": "2026-01-18T20:00:00.000Z"
 * }
 *
 * Error Responses:
 * - 400: Missing or invalid album_url parameter
 * - 404: Album not found or inaccessible
 * - 500: Server error during photo fetch
 */
app.get('/api/photo', async (c) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID().substring(0, 8);

  // Structured logging function
  const log = (level: string, message: string, data?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId,
      level,
      message,
      duration: Date.now() - startTime,
      ...data,
    };
    console.log(JSON.stringify(logEntry));
  };

  try {
    log('info', 'GET /api/photo request received');

    // Extract album_url from query parameters
    const album_url = c.req.query('album_url');

    // Validate album URL parameter
    if (!album_url || album_url.trim() === '') {
      log('warn', 'Missing album_url parameter');
      return c.json(
        {
          error: 'Bad Request',
          message: 'Missing required parameter: album_url',
          example: '/api/photo?album_url=https://photos.app.goo.gl/...',
        },
        400
      );
    }

    log('info', 'Album URL provided', {
      album_url_preview: album_url.substring(0, 50) + '...',
    });

    // Parse and validate album URL
    const parseStartTime = Date.now();
    const urlValidation = parseAlbumUrl(album_url);
    const parseDuration = Date.now() - parseStartTime;

    log('debug', 'URL parsing completed', {
      parseDuration,
      valid: urlValidation.valid,
    });

    if (!urlValidation.valid || !urlValidation.url) {
      log('warn', 'Invalid album URL format', { error: urlValidation.error });
      return c.json(
        {
          error: 'Bad Request',
          message: `Invalid album URL: ${urlValidation.error}`,
          validFormats: ['https://photos.app.goo.gl/...', 'https://photos.google.com/share/...'],
        },
        400
      );
    }

    // Fetch random photo from album (with optional caching)
    let photoData;
    const fetchStartTime = Date.now();
    try {
      photoData = await fetchRandomPhoto(urlValidation.url, c.env.PHOTOS_CACHE);
      const fetchDuration = Date.now() - fetchStartTime;

      log('info', 'Photo fetched successfully', {
        uid: photoData.metadata?.uid,
        count: photoData.photo_count,
        fetchDuration,
        cached: fetchDuration < 500, // Likely cached if <500ms
      });
    } catch (error) {
      const fetchDuration = Date.now() - fetchStartTime;
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch photos';

      log('error', 'Photo fetch failed', {
        error: errorMessage,
        fetchDuration,
      });

      // Return appropriate status code based on error
      const statusCode = errorMessage.includes('not found') ? 404 : 500;

      return c.json(
        {
          error: statusCode === 404 ? 'Not Found' : 'Internal Server Error',
          message: errorMessage,
          timestamp: new Date().toISOString(),
        },
        statusCode
      );
    }

    // Return JSON response (flat structure for TRMNL templates)
    // TRMNL templates access these directly: {{ photo_url }}, {{ caption }}
    const response = {
      photo_url: photoData.photo_url,
      thumbnail_url: photoData.thumbnail_url,
      caption: photoData.caption,
      timestamp: photoData.timestamp,
      album_name: photoData.album_name,
      photo_count: photoData.photo_count,
    };

    const totalDuration = Date.now() - startTime;
    log('info', 'JSON response sent successfully', {
      totalDuration,
      responseSize: JSON.stringify(response).length,
    });

    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const totalDuration = Date.now() - startTime;

    log('error', 'Unhandled error in /api/photo endpoint', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      totalDuration,
    });

    return c.json(
      {
        error: 'Internal Server Error',
        message: errorMessage,
        requestId,
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

/**
 * POST /markup - DEPRECATED
 *
 * This endpoint has been replaced by GET /api/photo (Polling strategy).
 * TRMNL now renders templates on their platform, not in the Worker.
 *
 * Please use GET /api/photo?album_url=... instead.
 */
app.post('/markup', (c) => {
  return c.json(
    {
      error: 'Endpoint Deprecated',
      message: 'POST /markup has been replaced by GET /api/photo',
      migration: {
        old: 'POST /markup with JSON body',
        new: 'GET /api/photo?album_url=...',
        reason: 'TRMNL Polling strategy - templates rendered on TRMNL platform',
      },
      documentation: 'https://github.com/hossain-khan/trmnl-google-photos-plugin',
    },
    410 // Gone
  );
});

/**
 * 404 handler for all other routes
 */
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      message: 'The requested endpoint does not exist',
      availableEndpoints: [
        'GET /',
        'GET /health',
        'GET /api/photo?album_url=...',
        'POST /markup (deprecated - use GET /api/photo)',
      ],
    },
    404
  );
});

/**
 * Global error handler
 */
app.onError((err, c) => {
  console.error('Worker error:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message,
      timestamp: new Date().toISOString(),
    },
    500
  );
});

// Export the app as the default fetch handler for Cloudflare Workers
export default app;
