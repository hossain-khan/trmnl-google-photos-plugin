# TRMNL Google Photos Worker

This directory contains the Cloudflare Worker implementation for the TRMNL Google Photos Plugin.

## Architecture

- **Framework**: Hono (lightweight web framework for Cloudflare Workers)
- **Language**: TypeScript
- **Runtime**: Cloudflare Workers
- **Deployment**: `trmnl-google-photos.hk-c91.workers.dev`

## Project Structure

```
src/
├── index.ts                      # Main entry point (Hono app, endpoints)
├── types.ts                      # TypeScript type definitions
├── templates.ts                  # Inlined Liquid templates
└── services/
    ├── photo-fetcher.ts         # Photo fetching and optimization
    └── template-renderer.ts     # Template rendering with LiquidJS
```

## Main Components

### `index.ts`
Main Cloudflare Worker entry point with Hono framework:
- `GET /` - Health check endpoint
- `GET /health` - Health check endpoint (alternative)
- `POST /markup` - Main TRMNL endpoint for photo markup

### `types.ts`
TypeScript interfaces for:
- TRMNL request structure
- Photo data format
- Template context
- Google Photos API responses

### `templates.ts`
Four Liquid templates inlined as strings:
- `full` - Full-screen layout
- `half_horizontal` - Half-width horizontal layout
- `half_vertical` - Half-height vertical layout
- `quadrant` - Quarter-screen layout

### `services/photo-fetcher.ts`
Photo fetching service with:
- `fetchAlbumPhotos()` - Fetch all photos from shared album
- `selectRandomPhoto()` - Random photo selection
- `optimizePhotoUrl()` - URL optimization for e-ink
- `fetchRandomPhoto()` - Main entry point

### `services/template-renderer.ts`
Template rendering service with:
- `renderTemplate()` - Render Liquid template with context
- `renderErrorTemplate()` - Render error state
- `preloadTemplate()` - Preload template into cache
- `getDefaultLayout()` - Select default layout based on screen size

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)

### Local Development

Start the development server:

```bash
npm run dev
```

This will start the worker on `http://localhost:8787` with hot reload enabled.

### Available Endpoints

- `GET /` - Health check and service info
- `GET /health` - Alternative health check endpoint
- `POST /markup` - Main TRMNL endpoint (see [MARKUP_ENDPOINT.md](../docs/MARKUP_ENDPOINT.md))

### Testing Locally

```bash
# Test root endpoint
curl http://localhost:8787/

# Test health endpoint
curl http://localhost:8787/health

# Test /markup with valid album
curl -X POST http://localhost:8787/markup \
  -H "Content-Type: application/json" \
  -d '{
    "trmnl": {
      "plugin_settings": {
        "instance_name": "My Photos",
        "shared_album_url": "https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5"
      },
      "layout": "full"
    }
  }'
```

### Type Checking

```bash
npm run types        # Generate Cloudflare types
npx tsc --noEmit    # Type check without compiling
```

### Running Tests

```bash
npm test
```

## Deployment

### First-time Setup

1. Login to Cloudflare:
   ```bash
   npm run cf:login
   ```

2. Update `wrangler.toml` with your account ID (if needed)

### Deploy to Production

```bash
npm run deploy
```

This deploys to: `https://trmnl-google-photos.hk-c91.workers.dev`

### Deploy to Development Environment

```bash
npm run deploy:dev
```

This deploys to: `https://trmnl-google-photos-dev.hk-c91.workers.dev`

## Environment Variables

Configured in `wrangler.toml`:

- `ENVIRONMENT` - Environment name (production/development)

## Configuration Files

- `wrangler.toml` - Cloudflare Workers configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts

## API Documentation

See [MARKUP_ENDPOINT.md](../docs/MARKUP_ENDPOINT.md) for complete API documentation.

## Dependencies

- **hono** - Web framework for Cloudflare Workers
- **liquidjs** - Liquid template engine
- **google-photos-album-image-url-fetch** - Google Photos API client
- **zod** - Schema validation (used by url-parser)

## Performance

- **Response Time**: <1 second (typically 200-800ms)
- **Photo Fetch**: 200-800ms
- **Template Render**: <50ms
- **Cold Start**: <1 second

## Error Handling

All errors return HTML (not JSON) so TRMNL can display error messages:
- Empty URL → Error template with instructions
- Invalid URL → Error template with validation message
- Album not found → Error template with 404 message
- Photo fetch failed → Error template with error details

## Security

- No authentication (public endpoint)
- No user data storage
- Strict URL validation (prevents SSRF)
- Public albums only
- Rate limiting by Cloudflare Workers

## Future Enhancements

- [ ] Add KV caching for album photo lists
- [ ] Support multiple screen sizes
- [ ] Add photo deduplication
- [ ] Support video thumbnails
- [ ] Add analytics tracking

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [MARKUP Endpoint Documentation](../docs/MARKUP_ENDPOINT.md)
