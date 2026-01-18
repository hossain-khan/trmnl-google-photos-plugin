import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { parseAlbumUrl } from '../lib/url-parser.js';
import { fetchRandomPhoto } from './services/photo-fetcher';
import {
  renderTemplate,
  renderErrorTemplate,
  preloadTemplate,
  LAYOUTS,
  getDefaultLayout,
} from './services/template-renderer';
import { TEMPLATES } from './templates';
import type { TRMNLRequest, TemplateContext } from './types';

// Type definitions for Cloudflare Workers environment
type Bindings = {
  ENVIRONMENT?: string;
  PHOTOS_CACHE?: KVNamespace; // Optional KV namespace for caching album data
  // Add other bindings here when needed (Analytics, etc.)
};

// Create Hono app with type safety
const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for GitHub Pages and TRMNL platform
app.use('/*', cors({
  origin: [
    'https://hossain-khan.github.io',
    'https://usetrmnl.com',
    'http://localhost:8787',
    'http://localhost:3000'
  ],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400, // 24 hours
}));

// Preload all templates on Worker initialization
Object.entries(TEMPLATES).forEach(([layout, content]) => {
  preloadTemplate(layout, content);
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
 * POST /markup - Main TRMNL endpoint
 * 
 * Receives requests from TRMNL devices, fetches a random photo from the
 * configured Google Photos shared album, and returns rendered HTML.
 * 
 * Request body structure:
 * {
 *   trmnl: {
 *     plugin_settings: {
 *       instance_name: "My Photos",
 *       shared_album_url: "https://photos.app.goo.gl/..."
 *     },
 *     screen: {
 *       width: 800,
 *       height: 480,
 *       bit_depth: 1
 *     },
 *     layout: "full"
 *   }
 * }
 * 
 * Response:
 * - 200: HTML markup for the photo display
 * - 400: Invalid request (missing URL, invalid format)
 * - 500: Server error (photo fetch failed, rendering failed)
 */
app.post('/markup', async (c) => {
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
    log('info', 'Request received');

    // Parse request body
    const body = await c.req.json<TRMNLRequest>();

    // Extract configuration
    const {
      plugin_settings: { instance_name, shared_album_url },
      screen,
      layout: requestedLayout,
    } = body.trmnl;

    log('info', 'Request parsed', {
      instance_name,
      album_url: shared_album_url?.substring(0, 50) + '...',
      screen,
      layout: requestedLayout,
    });

    // Validate album URL
    if (!shared_album_url || shared_album_url.trim() === '') {
      log('warn', 'No album URL provided');
      const html = await renderErrorTemplate(
        'No album URL configured. Please add your Google Photos shared album link in the plugin settings.',
        instance_name,
        requestedLayout || LAYOUTS.FULL
      );
      log('info', 'Returned error template for missing URL', { duration: Date.now() - startTime });
      return c.html(html);
    }

    // Parse and validate album URL
    const parseStartTime = Date.now();
    const urlValidation = parseAlbumUrl(shared_album_url);
    const parseDuration = Date.now() - parseStartTime;
    
    log('debug', 'URL parsing completed', { parseDuration, valid: urlValidation.valid });
    
    if (!urlValidation.valid || !urlValidation.url) {
      log('warn', 'Invalid album URL', { error: urlValidation.error });
      const html = await renderErrorTemplate(
        `Invalid album URL: ${urlValidation.error}`,
        instance_name,
        requestedLayout || LAYOUTS.FULL
      );
      log('info', 'Returned error template for invalid URL', { duration: Date.now() - startTime });
      return c.html(html, 400);
    }

    // Determine layout (use requested layout or default based on screen size)
    const layout =
      requestedLayout || getDefaultLayout(screen?.width, screen?.height);

    log('debug', 'Layout selected', { layout, requested: requestedLayout });

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
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch photos';
      
      log('error', 'Photo fetch failed', { error: errorMessage, fetchDuration });
      
      const html = await renderErrorTemplate(
        `Failed to fetch photos: ${errorMessage}`,
        instance_name,
        layout
      );
      log('info', 'Returned error template for fetch failure', { duration: Date.now() - startTime });
      return c.html(html, 500);
    }

    // Create template context
    const context: TemplateContext = {
      photo: photoData,
      trmnl: body.trmnl,
    };

    // Render template
    const renderStartTime = Date.now();
    try {
      const html = await renderTemplate(layout, context);
      const renderDuration = Date.now() - renderStartTime;
      const totalDuration = Date.now() - startTime;
      
      log('info', 'Markup rendered successfully', {
        renderDuration,
        totalDuration,
        htmlSize: html.length,
        layout,
      });

      return c.html(html);
    } catch (error) {
      const renderDuration = Date.now() - renderStartTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to render template';
      
      log('error', 'Template rendering failed', { error: errorMessage, renderDuration });
      
      const html = await renderErrorTemplate(
        `Failed to render template: ${errorMessage}`,
        instance_name,
        layout
      );
      log('info', 'Returned error template for render failure', { duration: Date.now() - startTime });
      return c.html(html, 500);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const totalDuration = Date.now() - startTime;
    
    log('error', 'Unhandled error in markup endpoint', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      totalDuration,
    });

    // Return minimal error HTML
    return c.html(
      `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
        <h2 style="font-size: 24px; margin-bottom: 10px;">Server Error</h2>
        <p style="font-size: 16px; color: #666;">${errorMessage}</p>
        <p style="font-size: 12px; color: #999; margin-top: 10px;">Request ID: ${requestId}</p>
      </div>
    `,
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
      availableEndpoints: ['/', '/health', 'POST /markup'],
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
