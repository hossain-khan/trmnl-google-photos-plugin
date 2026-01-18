# API Documentation

Complete API reference for the TRMNL Google Photos Plugin Cloudflare Worker.

## Base URL

- **Development**: `http://localhost:8787`
- **Production**: `https://trmnl-google-photos.your-worker.workers.dev`

## Authentication

No authentication required. The worker is designed to work with publicly shared Google Photos albums only.

## Endpoints

### 1. GET `/` - Service Information

Returns basic information about the service.

**Request:**
```http
GET / HTTP/1.1
Host: trmnl-google-photos.workers.dev
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "trmnl-google-photos-plugin",
  "version": "0.1.0",
  "environment": "production",
  "timestamp": "2026-01-18T20:48:00.000Z",
  "message": "TRMNL Google Photos Plugin is running"
}
```

**Use Case**: Health check, verify worker is accessible

---

### 2. GET `/health` - Health Check

Dedicated health check endpoint for monitoring.

**Request:**
```http
GET /health HTTP/1.1
Host: trmnl-google-photos.workers.dev
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "trmnl-google-photos-plugin",
  "version": "0.1.0",
  "environment": "production",
  "timestamp": "2026-01-18T20:48:00.000Z",
  "uptime": "N/A"
}
```

**Use Case**: Monitoring systems, uptime checks

---

### 3. POST `/markup` - TRMNL Photo Display

**Primary endpoint** for TRMNL devices. Fetches a random photo from a Google Photos shared album and returns rendered HTML.

#### Request

**Headers:**
```http
POST /markup HTTP/1.1
Host: trmnl-google-photos.workers.dev
Content-Type: application/json
```

**Body:**
```json
{
  "trmnl": {
    "plugin_settings": {
      "instance_name": "My Photos",
      "shared_album_url": "https://photos.app.goo.gl/FB8ErkX2wJAQkJzV8"
    },
    "screen": {
      "width": 800,
      "height": 480,
      "bit_depth": 1
    },
    "layout": "full"
  }
}
```

**Request Body Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `trmnl.plugin_settings.instance_name` | string | Yes | Display name for the plugin instance |
| `trmnl.plugin_settings.shared_album_url` | string | Yes | Google Photos shared album URL |
| `trmnl.screen.width` | number | No | Screen width in pixels (default: 800) |
| `trmnl.screen.height` | number | No | Screen height in pixels (default: 480) |
| `trmnl.screen.bit_depth` | number | No | Bit depth (1, 2, or 4) (default: 1) |
| `trmnl.layout` | string | No | Layout type: `full`, `half_horizontal`, `half_vertical`, `quadrant` |

**Supported Album URL Formats:**
- Short URL: `https://photos.app.goo.gl/{shortcode}`
- Full URL: `https://photos.google.com/share/{albumId}`
- Full URL with params: `https://photos.google.com/share/{albumId}?key=value`

#### Response

**Success (200 OK):**

Returns HTML markup optimized for e-ink display.

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

<div class="flex flex--col gap--small h--full">
  <div class="flex flex--center-x flex--center-y" style="flex: 1;">
    <img src="https://lh3.googleusercontent.com/...=w800-h480" 
         alt="" 
         class="image image--contain"
         style="max-width: 100%; max-height: 100%; object-fit: contain;">
  </div>
</div>
```

**Error: Missing URL (200 OK):**

Returns error template when album URL is not configured.

```html
<div class="flex flex--col flex--center-x flex--center-y gap--medium h--full">
  <div class="value value--large text--center">📷</div>
  <div class="title title--medium text--center">No Photos Available</div>
  <div class="description text--center">
    Please configure your Google Photos shared album URL in the plugin settings.
  </div>
</div>
```

**Error: Invalid URL (400 Bad Request):**

Returns when URL format is invalid.

```http
HTTP/1.1 400 Bad Request
Content-Type: text/html; charset=utf-8

<div class="flex flex--col flex--center-x flex--center-y">
  <div class="value value--large">❌</div>
  <div class="title title--medium">Error</div>
  <div class="description">Invalid album URL: Must be a Google Photos URL</div>
</div>
```

**Error: Photo Fetch Failed (500 Internal Server Error):**

Returns when photo fetching fails.

```http
HTTP/1.1 500 Internal Server Error
Content-Type: text/html; charset=utf-8

<div class="flex flex--col flex--center-x flex--center-y">
  <div class="value value--large">❌</div>
  <div class="title title--medium">Error</div>
  <div class="description">Failed to fetch photos: Album not found</div>
</div>
```

#### Response Headers

```http
Content-Type: text/html; charset=utf-8
Access-Control-Allow-Origin: https://usetrmnl.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Max-Age: 86400
```

#### Performance Characteristics

| Metric | Value |
|--------|-------|
| Response Time (cached) | 50-300ms |
| Response Time (uncached) | 200-2000ms |
| HTML Size | 1-5 KB |
| CPU Time | <50ms |

#### Error Codes

| Code | Meaning | Cause |
|------|---------|-------|
| 200 | Success | Photo rendered successfully or error template displayed |
| 400 | Bad Request | Invalid album URL format |
| 500 | Internal Server Error | Photo fetch failed, template rendering failed, or server error |

#### Common Error Messages

**User-Friendly Error Messages:**

1. **"No album URL configured"**
   - Cause: `shared_album_url` is empty or missing
   - Action: Add album URL in plugin settings

2. **"Invalid album URL: Must be a Google Photos URL"**
   - Cause: URL doesn't match Google Photos format
   - Action: Use a valid Google Photos shared album link

3. **"Album not found. The album may have been deleted or made private."**
   - Cause: HTTP 404 from Google Photos API
   - Action: Verify album exists and is shared

4. **"Album access denied. Ensure the album has link sharing enabled."**
   - Cause: HTTP 403 from Google Photos API
   - Action: Enable link sharing for the album

5. **"No photos found in album. Ensure the album is publicly shared and contains photos (not videos)."**
   - Cause: Album exists but has no photos
   - Action: Add photos to the album

6. **"Failed to fetch photos: [error details]"**
   - Cause: Network error or API issue
   - Action: Try again, check network connectivity

---

## Request Examples

### Example 1: Basic Request (Full Layout)

```bash
curl -X POST https://trmnl-google-photos.workers.dev/markup \
  -H "Content-Type: application/json" \
  -d '{
    "trmnl": {
      "plugin_settings": {
        "instance_name": "Family Photos",
        "shared_album_url": "https://photos.app.goo.gl/FB8ErkX2wJAQkJzV8"
      },
      "screen": {
        "width": 800,
        "height": 480,
        "bit_depth": 1
      },
      "layout": "full"
    }
  }'
```

### Example 2: Half Horizontal Layout

```bash
curl -X POST https://trmnl-google-photos.workers.dev/markup \
  -H "Content-Type: application/json" \
  -d '{
    "trmnl": {
      "plugin_settings": {
        "instance_name": "Vacation Photos",
        "shared_album_url": "https://photos.google.com/share/AF1QipMZN..."
      },
      "screen": {
        "width": 800,
        "height": 480,
        "bit_depth": 2
      },
      "layout": "half_horizontal"
    }
  }'
```

### Example 3: TRMNL V2 Device (High Resolution)

```bash
curl -X POST https://trmnl-google-photos.workers.dev/markup \
  -H "Content-Type: application/json" \
  -d '{
    "trmnl": {
      "plugin_settings": {
        "instance_name": "Art Gallery",
        "shared_album_url": "https://photos.app.goo.gl/..."
      },
      "screen": {
        "width": 1024,
        "height": 758,
        "bit_depth": 4
      },
      "layout": "full"
    }
  }'
```

---

## Layouts

The worker supports four responsive layouts optimized for different screen sizes and orientations:

### 1. Full Layout (`full`)

**Best For**: Full-screen display, single large photo

**Characteristics**:
- Photo fills 90% of screen height
- Optional caption below (truncated to 2 lines)
- Photo count badge in title area
- Maximizes photo visibility

**Recommended Screens**: All devices, especially TRMNL V2 (1024x758)

### 2. Half Horizontal Layout (`half_horizontal`)

**Best For**: Half-size horizontal display, landscape orientation

**Characteristics**:
- Photo on left, caption on right
- Side-by-side layout
- Vertical centering
- Portrait mode fallback (stacks vertically)

**Recommended Screens**: TRMNL OG (800x480) in landscape

### 3. Half Vertical Layout (`half_vertical`)

**Best For**: Half-size vertical display, portrait orientation

**Characteristics**:
- Photo on top (85% height)
- Caption below (compact, 2 lines)
- Minimal padding
- Optimized for tall screens

**Recommended Screens**: Kindle 2024 (600x800) in portrait

### 4. Quadrant Layout (`quadrant`)

**Best For**: Quarter-size display, compact view

**Characteristics**:
- Photo only, no caption
- Minimal padding
- Photo fills entire space
- Simplified title bar

**Recommended Screens**: Multi-plugin layouts

---

## Device Specifications

Supported TRMNL devices:

| Device | Width | Height | Bit Depth | Display Type |
|--------|-------|--------|-----------|--------------|
| TRMNL OG | 800px | 480px | 1-bit | Monochrome (2 shades) |
| TRMNL OG V2 | 800px | 480px | 2-bit | Grayscale (4 shades) |
| TRMNL V2 | 1024px | 758px | 4-bit | Grayscale (16 shades) |
| Kindle 2024 | 600px | 800px | 4-bit | Grayscale (16 shades) |

**Photo Optimization**:
- Photos are automatically optimized for e-ink displays
- URL parameter: `=w800-h480` (or appropriate dimensions)
- Maintains aspect ratio
- No cropping

---

## Rate Limits

**Cloudflare Workers Free Tier**:
- 100,000 requests per day
- 50ms CPU time per request
- 1MB bundle size limit

**Google Photos API**:
- No official rate limits documented
- May throttle aggressive requests
- Recommended: <100 requests/minute per album

**Best Practices**:
- Enable KV caching to reduce Google Photos API calls
- Cache hit reduces response time by 80%
- Shared cache across all users for same album

---

## Caching

### KV Cache (Optional)

When configured, the worker uses Cloudflare KV for album data caching:

**Cache Key Format**: `album:{albumId}`

**Cache Behavior**:
- TTL: 3600 seconds (1 hour)
- Cache Hit: 50-200ms response time
- Cache Miss: 200-2000ms response time (fetches from Google Photos)
- Shared: Multiple users share cache for same album

**Benefits**:
- 80%+ reduction in Google Photos API calls
- Faster response times
- Lower API rate limit impact

**Setup**: See `docs/KV_CACHING_SETUP.md`

---

## Monitoring & Logging

### Structured Logs

All requests generate structured JSON logs:

```json
{
  "timestamp": "2026-01-18T20:48:00.000Z",
  "requestId": "a1b2c3d4",
  "level": "info",
  "message": "Markup rendered successfully",
  "duration": 425,
  "renderDuration": 35,
  "totalDuration": 425,
  "htmlSize": 1247,
  "layout": "full"
}
```

**Log Levels**:
- `info`: Normal operations
- `debug`: Detailed debugging information
- `warn`: Warning conditions
- `error`: Error conditions

**Key Metrics Logged**:
- Request ID (for tracing)
- Duration (total, parse, fetch, render)
- Album URL (truncated)
- Layout used
- Error details (if any)
- Cache hit/miss status

### Accessing Logs

**Cloudflare Dashboard**:
1. Go to Workers & Pages
2. Select your worker
3. Click "Logs" → "Real-time Logs"

**Wrangler CLI**:
```bash
wrangler tail
```

---

## Security

### Authentication

- **None Required**: Public endpoint by design
- **Album Access**: Only publicly shared albums work
- **No User Data**: Fully stateless, no data storage

### Data Privacy

- **No Photo Storage**: Only URLs are cached (if KV enabled)
- **No User Tracking**: No analytics or user identification
- **Shared Cache**: Album data cached by album ID, not user
- **HTTPS Only**: All requests over secure connections

### URL Validation

- **Format Validation**: Zod schema validation
- **Domain Check**: Must be Google Photos domain
- **SSRF Prevention**: No arbitrary URL fetching

---

## Troubleshooting

### Common Issues

**Issue**: "Album not found"
- **Solution**: Verify album URL, ensure it's shared publicly

**Issue**: "Album access denied"
- **Solution**: Enable link sharing for the album in Google Photos

**Issue**: Slow response times
- **Solution**: Enable KV caching, wait for cache to warm up

**Issue**: "No photos found"
- **Solution**: Add photos to album (videos not supported)

### Debug Mode

To enable debug logging:

```json
{
  "trmnl": {
    "plugin_settings": {
      "instance_name": "Debug Test",
      "shared_album_url": "https://photos.app.goo.gl/...",
      "debug": true
    }
  }
}
```

---

## Support

For issues or questions:
- **GitHub Issues**: https://github.com/hossain-khan/trmnl-google-photos-plugin/issues
- **Documentation**: See `docs/` directory
- **Testing**: Run `npm test` for comprehensive test suite

---

**API Version**: 0.1.0  
**Last Updated**: January 18, 2026  
**Status**: Production Ready
