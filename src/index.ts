import { Hono } from 'hono';

// Type definitions for Cloudflare Workers environment
type Bindings = {
  ENVIRONMENT?: string;
  // Add other bindings here when needed (KV, Analytics, etc.)
};

// Create Hono app with type safety
const app = new Hono<{ Bindings: Bindings }>();

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
 * 404 handler for all other routes
 */
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      message: 'The requested endpoint does not exist',
      availableEndpoints: ['/', '/health'],
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
