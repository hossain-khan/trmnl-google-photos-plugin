import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { parseAlbumUrl } from './lib/url-parser';
import { fetchRandomPhoto } from './services/photo-fetcher';
import { version } from '../package.json';
import {
  Logger,
  trackPerformance,
  trackError,
  trackBrightnessMetrics,
  sendAnalytics,
  classifyErrorSeverity,
  getErrorType,
  type PerformanceMetrics,
  type ErrorContext,
  type BrightnessMetrics,
} from './services/monitoring-service';
import { checkAndAlert } from './services/alerting-service';
import type { AlertStats } from './services/alerting-service';
import { version } from '../package.json';
// Direct import for test endpoint
import { sendDiscordAlert } from './services/alerting-service';

// Type definitions for Cloudflare Workers environment
type Bindings = {
  ENVIRONMENT?: string;
  DISCORD_WEBHOOK_URL?: string; // Discord webhook for alerting
  PHOTOS_CACHE?: KVNamespace; // Optional KV namespace for caching album data
  ANALYTICS?: AnalyticsEngineDataset; // Optional Analytics Engine (disabled on free tier)
};

// Constants
const CACHE_HIT_THRESHOLD_MS = 500; // Cache hits typically respond in <500ms

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
    exposeHeaders: ['X-Cache-Status', 'X-Response-Time', 'X-Request-ID'], // Expose custom headers
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
    version,
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
    version,
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
 *   "album_name": "Google Photos Album",
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
  const logger = new Logger(requestId);

  let statusCode = 200;
  let errorType: string | undefined;
  let cacheHit = false;

  try {
    logger.info('GET /api/photo request received');

    // Extract album_url from query parameters
    const album_url = c.req.query('album_url');
    const enable_caching = c.req.query('enable_caching');
    const adaptive_background = c.req.query('adaptive_background');

    // Demo Data: If album_url is empty, 'demo', or '0', return demo photo data
    // This allows the plugin to display a preview in the TRMNL marketplace without requiring
    // users to configure their own Google Photos album URL first.
    // Reference: https://help.usetrmnl.com/en/articles/12772238-demo-data-for-publishing-plugins
    if (
      !album_url ||
      album_url.trim() === '' ||
      album_url.toLowerCase() === 'demo' ||
      album_url === '0'
    ) {
      logger.info('Demo mode: Returning TRMNL demo photo data');

      // Return demo photo data from the demo album
      const demoPhotoData = {
        photo_url:
          'https://hossain-khan.github.io/trmnl-google-photos-plugin/assets/images/google-photos-demo-picture-small.jpg',
        thumbnail_url:
          'https://hossain-khan.github.io/trmnl-google-photos-plugin/assets/images/google-photos-demo-picture-thumb.jpg',
        caption: null,
        timestamp: '2024-06-25T12:00:00.000Z',
        image_update_date: '2024-06-25T12:00:00.000Z',
        album_name: 'TRMNL Demo Album - Google Photos',
        photo_count: 142,
        relative_date: '1 year ago',
        aspect_ratio: '4:3',
        megapixels: 12,
      };

      // Add response headers
      c.header('X-Request-ID', requestId);
      c.header('X-Response-Time', `${Date.now() - startTime}ms`);
      c.header('X-Cache-Status', 'demo');

      return c.json(demoPhotoData);
    }

    logger.info('Album URL provided');

    // Parse and validate album URL
    const parseStartTime = Date.now();
    const urlValidation = parseAlbumUrl(album_url);
    const parseDuration = Date.now() - parseStartTime;

    logger.debug('URL parsing completed', {
      parseDuration,
      valid: urlValidation.valid,
    });

    if (!urlValidation.valid || !urlValidation.url) {
      statusCode = 400;
      errorType = 'invalid_url';
      logger.warn('Invalid album URL format', { error: urlValidation.error });

      // Track error
      const errorContext: ErrorContext = {
        requestId,
        endpoint: '/api/photo',
        errorMessage: `Invalid album URL: ${urlValidation.error}`,
        errorType,
        severity: classifyErrorSeverity(statusCode, urlValidation.error || ''),
        statusCode,
      };
      trackError(errorContext);

      return c.json(
        {
          error: 'Bad Request',
          message: `Invalid album URL: ${urlValidation.error}`,
          validFormats: ['https://photos.app.goo.gl/...', 'https://photos.google.com/share/...'],
        },
        400
      );
    }

    // Determine if caching should be used based on user preference
    // enable_caching can be: 'true', 'false', '1', '0', or undefined (defaults to true)
    const useCaching = enable_caching !== 'false' && enable_caching !== '0';
    const kvNamespace = useCaching ? c.env.PHOTOS_CACHE : undefined;

    // Determine if adaptive background should be analyzed
    // adaptive_background can be: 'true', 'false', '1', '0', or undefined (defaults to false)
    const analyzeImage = adaptive_background === 'true' || adaptive_background === '1';

    logger.info('Request preferences', {
      enable_caching,
      useCaching,
      kvConfigured: !!c.env.PHOTOS_CACHE,
      adaptive_background,
      analyzeImage,
      alertingEnabled: !!c.env.DISCORD_WEBHOOK_URL,
    });

    // Track skipped brightness analysis (user preference)
    if (!analyzeImage) {
      const skipMetrics: BrightnessMetrics = {
        requestId,
        status: 'skipped',
      };
      trackBrightnessMetrics(skipMetrics);

      // Check and alert (will track skipped event but not trigger alerts)
      await checkAndAlert(c.env.PHOTOS_CACHE, c.env.DISCORD_WEBHOOK_URL, skipMetrics);
    }

    // Fetch random photo from album (with optional caching and brightness analysis)
    let photoData;
    const fetchStartTime = Date.now();
    try {
      photoData = await fetchRandomPhoto(
        urlValidation.url,
        kvNamespace,
        analyzeImage,
        requestId,
        c.env.DISCORD_WEBHOOK_URL
      );
      const fetchDuration = Date.now() - fetchStartTime;
      cacheHit = fetchDuration < CACHE_HIT_THRESHOLD_MS; // Likely cached if <500ms

      logger.info('Photo fetched successfully', {
        uid: photoData.metadata?.uid,
        count: photoData.photo_count,
        fetchDuration,
        cached: cacheHit,
        brightnessAnalyzed: analyzeImage,
        edgeBrightnessScore: photoData.edge_brightness_score,
      });
    } catch (error) {
      const fetchDuration = Date.now() - fetchStartTime;
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch photos';
      errorType = getErrorType(errorMessage);

      logger.error('Photo fetch failed', {
        error: errorMessage,
        errorType,
        fetchDuration,
      });

      // Return appropriate status code based on error
      statusCode = errorMessage.includes('not found') ? 404 : 500;

      // Track error
      const errorContext: ErrorContext = {
        requestId,
        endpoint: '/api/photo',
        errorMessage,
        errorType,
        severity: classifyErrorSeverity(statusCode, errorMessage),
        statusCode,
        stack: error instanceof Error ? error.stack : undefined,
      };
      trackError(errorContext);

      return c.json(
        {
          error: statusCode === 404 ? 'Not Found' : 'Internal Server Error',
          message: errorMessage,
          timestamp: new Date().toISOString(),
        },
        statusCode as 404 | 500
      );
    }

    // Return JSON response (flat structure for TRMNL templates)
    const response: Record<string, unknown> = {
      photo_url: photoData.photo_url,
      thumbnail_url: photoData.thumbnail_url,
      edge_brightness_score: photoData.edge_brightness_score, // Raw brightness data (undefined if disabled)
      brightness_score: photoData.brightness_score, // Raw brightness data (undefined if disabled)
      caption: photoData.caption,
      timestamp: photoData.timestamp,
      image_update_date: photoData.image_update_date,
      album_name: photoData.album_name,
      photo_count: photoData.photo_count,
      relative_date: photoData.relative_date,
      aspect_ratio: photoData.aspect_ratio,
      megapixels: photoData.megapixels,
    };

    const totalDuration = Date.now() - startTime;
    logger.info('JSON response sent successfully', {
      totalDuration,
      responseSize: JSON.stringify(response).length,
    });

    // Track performance metrics
    const metrics: PerformanceMetrics = {
      requestId,
      endpoint: '/api/photo',
      totalDuration,
      photoFetchDuration: Date.now() - fetchStartTime,
      cacheHit,
      statusCode,
    };
    trackPerformance(metrics);

    // Send to Analytics Engine (if configured - disabled by default on free tier)
    sendAnalytics(c.env.ANALYTICS, metrics as unknown as Record<string, unknown>);

    // Add custom headers for debugging and monitoring
    c.header('X-Cache-Status', cacheHit ? 'HIT' : 'MISS');
    c.header('X-Response-Time', `${totalDuration}ms`);
    c.header('X-Request-ID', requestId);

    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const totalDuration = Date.now() - startTime;
    statusCode = 500;
    errorType = 'unhandled_error';

    logger.error('Unhandled error in /api/photo endpoint', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      totalDuration,
    });

    // Track critical error
    const errorContext: ErrorContext = {
      requestId,
      endpoint: '/api/photo',
      errorMessage,
      errorType,
      severity: 'critical',
      statusCode,
      stack: error instanceof Error ? error.stack : undefined,
    };
    trackError(errorContext);

    // Send to Analytics Engine (if configured - disabled by default on free tier)
    sendAnalytics(c.env.ANALYTICS, {
      requestId,
      endpoint: '/api/photo',
      totalDuration,
      statusCode,
      errorType,
      cacheHit,
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
 * GET /api/test/discord - Test Discord Notification Endpoint
 *
 * Allows manual triggering of Discord alerts for testing purposes.
 * Accepts query params to customize the alert payload.
 *
 * Example:
 * GET /api/test/discord?timeoutRate=0.25&totalAttempts=20&timeouts=5&errors=2&success=13
 */
app.get('/api/test/discord', async (c) => {
  const webhookUrl = c.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return c.json({ error: 'DISCORD_WEBHOOK_URL not configured in environment.' }, 400);
  }

  // Parse query params with defaults
  const timeoutRate = parseFloat(c.req.query('timeoutRate') ?? '0.25');
  const totalAttempts = parseInt(c.req.query('totalAttempts') ?? '20', 10);
  const timeouts = parseInt(c.req.query('timeouts') ?? '5', 10);
  const errors = parseInt(c.req.query('errors') ?? '2', 10);
  const success = parseInt(c.req.query('success') ?? '13', 10);
  const avgDuration = parseInt(c.req.query('avgDuration') ?? '950', 10);
  const windowStart = new Date(Date.now() - 3600000).toISOString();
  const windowEnd = new Date().toISOString();

  const stats: AlertStats = {
    totalAttempts,
    timeouts,
    errors,
    success,
    timeoutRate,
    avgDuration,
    windowStart,
    windowEnd,
  };

  try {
    await sendDiscordAlert(webhookUrl, stats);
    return c.json({
      status: 'ok',
      message: 'Discord alert sent successfully.',
      stats,
      webhookUrl: webhookUrl ? 'configured' : 'missing',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to send Discord alert',
        details: error instanceof Error ? error.message : String(error),
        stats,
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
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
