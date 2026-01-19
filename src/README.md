# TRMNL Google Photos Worker

This directory contains the Cloudflare Worker implementation for the TRMNL Google Photos Plugin.

## Architecture

- **Framework**: Hono (lightweight web framework for Cloudflare Workers)
- **Language**: TypeScript
- **Runtime**: Cloudflare Workers
- **Deployment**: `trmnl-google-photos.gohk.xyz`

## Project Structure

```
src/
├── index.ts                      # Main entry point (Hono app, JSON API endpoints)
├── types.ts                      # TypeScript type definitions
└── services/
    └── photo-fetcher.ts         # Photo fetching and optimization
```

## Main Components

### `index.ts`
Main Cloudflare Worker entry point with Hono framework:
- `GET /` - Health check endpoint
- `GET /health` - Health check endpoint (alternative)
- `GET /api/photo` - JSON API endpoint for TRMNL Polling strategy
- `POST /markup` - DEPRECATED (returns migration notice)

### `types.ts`
TypeScript interfaces for:
- Photo data format (JSON response)
- Google Photos API responses
- Worker environment bindings

### `services/photo-fetcher.ts`
Photo fetching service with:
- `fetchAlbumPhotos()` - Fetch all photos from shared album
- `selectRandomPhoto()` - Random photo selection
- `optimizePhotoUrl()` - URL optimization for e-ink
- `fetchRandomPhoto()` - Main entry point

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
- `GET /api/photo` - JSON API endpoint for TRMNL (Polling strategy)

### Testing Locally

```bash
# Test root endpoint
curl http://localhost:8787/

# Test health endpoint
curl http://localhost:8787/health

# Test /api/photo with valid album
curl "http://localhost:8787/api/photo?album_url=https://photos.app.goo.gl/FB8ErkX2wJAQkJzV8"      },
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

This deploys to: `https://trmnl-google-photos.gohk.xyz`

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

See [API_DOCUMENTATION.md](../docs/API_DOCUMENTATION.md) for complete API documentation.

## Dependencies

- **hono** - Web framework for Cloudflare Workers
- **google-photos-album-image-url-fetch** - Google Photos API client
- **zod** - Schema validation (used by url-parser)

## Performance

- **Response Time**: <1 second (typically 200-800ms)
- **Photo Fetch**: 200-800ms
- **JSON Serialization**: <10ms
- **Cold Start**: <1 second

## Error Handling

All errors return JSON with appropriate error messages:
- Empty URL → JSON error with instructions
- Invalid URL → JSON error with validation message
- Album not found → JSON error with 404 message
- Photo fetch failed → JSON error with error details

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
- [API Documentation](../docs/API_DOCUMENTATION.md)
