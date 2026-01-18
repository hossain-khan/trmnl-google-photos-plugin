import { Hono } from 'hono';
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

  try {
    // Parse request body
    const body = await c.req.json<TRMNLRequest>();

    // Extract configuration
    const {
      plugin_settings: { instance_name, shared_album_url },
      screen,
      layout: requestedLayout,
    } = body.trmnl;

    console.log('Markup request:', {
      instance_name,
      album_url: shared_album_url?.substring(0, 50) + '...',
      screen,
      layout: requestedLayout,
    });

    // Validate album URL
    if (!shared_album_url || shared_album_url.trim() === '') {
      console.warn('No album URL provided');
      const html = await renderErrorTemplate(
        'No album URL configured. Please add your Google Photos shared album link in the plugin settings.',
        instance_name,
        requestedLayout || LAYOUTS.FULL
      );
      return c.html(html);
    }

    // Parse and validate album URL
    const urlValidation = parseAlbumUrl(shared_album_url);
    if (!urlValidation.valid || !urlValidation.url) {
      console.warn('Invalid album URL:', urlValidation.error);
      const html = await renderErrorTemplate(
        `Invalid album URL: ${urlValidation.error}`,
        instance_name,
        requestedLayout || LAYOUTS.FULL
      );
      return c.html(html, 400);
    }

    // Determine layout (use requested layout or default based on screen size)
    const layout =
      requestedLayout || getDefaultLayout(screen?.width, screen?.height);

    console.log(`Using layout: ${layout}`);

    // Fetch random photo from album (with optional caching)
    let photoData;
    try {
      photoData = await fetchRandomPhoto(urlValidation.url, c.env.PHOTOS_CACHE);
      console.log('Photo fetched:', {
        uid: photoData.metadata?.uid,
        count: photoData.photo_count,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch photos';
      console.error('Photo fetch error:', errorMessage);
      
      const html = await renderErrorTemplate(
        `Failed to fetch photos: ${errorMessage}`,
        instance_name,
        layout
      );
      return c.html(html, 500);
    }

    // Create template context
    const context: TemplateContext = {
      photo: photoData,
      trmnl: body.trmnl,
    };

    // Render template
    try {
      const html = await renderTemplate(layout, context);
      
      const duration = Date.now() - startTime;
      console.log(`Markup rendered successfully in ${duration}ms`);

      return c.html(html);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to render template';
      console.error('Template rendering error:', errorMessage);
      
      const html = await renderErrorTemplate(
        `Failed to render template: ${errorMessage}`,
        instance_name,
        layout
      );
      return c.html(html, 500);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Markup endpoint error:', errorMessage, error);

    // Return minimal error HTML
    return c.html(
      `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
        <h2 style="font-size: 24px; margin-bottom: 10px;">Server Error</h2>
        <p style="font-size: 16px; color: #666;">${errorMessage}</p>
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
