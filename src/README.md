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
├── index.ts          # Worker entry point with Hono app
└── (future files)    # Additional modules will be added here
```

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

### Testing Locally

```bash
# Test root endpoint
curl http://localhost:8787/

# Test health endpoint
curl http://localhost:8787/health

# Test 404 handler
curl http://localhost:8787/notfound
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

## Future Enhancements

- [ ] `/markup` endpoint for TRMNL integration
- [ ] Photo fetching and rendering
- [ ] LiquidJS template integration
- [ ] KV caching for performance
- [ ] Error tracking and monitoring
- [ ] Rate limiting

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
