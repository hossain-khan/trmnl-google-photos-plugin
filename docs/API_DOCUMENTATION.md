# API Documentation

Complete API reference for the TRMNL Google Photos Plugin Cloudflare Worker.

## Base URL

- **Development**: `http://localhost:8787`
- **Production**: `https://trmnl-google-photos.gohk.xyz`

## Authentication

No authentication required. The worker is designed to work with publicly shared Google Photos albums only.

## Endpoints

### 1. GET `/` - Service Information

Returns basic information about the service.

**Request:**

```http
GET / HTTP/1.1
Host: trmnl-google-photos.gohk.xyz
```

**Response (200 OK):**

```json
{
  "status": "ok",
  "service": "trmnl-google-photos-plugin",
  "version": "1.1.0",
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
Host: trmnl-google-photos.gohk.xyz
```

**Response (200 OK):**

```json
{
  "status": "healthy",
  "service": "trmnl-google-photos-plugin",
  "version": "1.1.0",
  "environment": "production",
  "timestamp": "2026-01-18T20:48:00.000Z",
  "uptime": "N/A"
}
```

**Use Case**: Monitoring systems, uptime checks

---

### 3. GET `/api/photo` - TRMNL JSON API (Polling Strategy)

**Primary endpoint** for TRMNL devices. Fetches a random photo from a Google Photos shared album and returns JSON data.

#### Request

**Headers:**

```http
GET /api/photo?album_url=https://photos.app.goo.gl/ENK6C44K85QgVHPH8 HTTP/1.1
Host: trmnl-google-photos.gohk.xyz
```

**Query Parameters:**

| Parameter             | Type   | Required | Description                                                                                       |
| --------------------- | ------ | -------- | ------------------------------------------------------------------------------------------------- |
| `album_url`           | string | Yes\*    | Google Photos shared album URL. Use 'demo', '0', or empty string for demo mode                    |
| `enable_caching`      | string | No       | Enable/disable caching: 'true'/'false'/'1'/'0' (default true)                                     |
| `adaptive_background` | string | No       | Enable adaptive background color: 'true'/'false'/'1'/'0' (default false, adds ~100-200ms latency) |

**\*Note**: `album_url` is technically required, but you can pass `demo`, `0`, or leave it empty to get demo photo data (useful for plugin marketplace previews).

**Supported Album URL Formats:**

- Short URL: `https://photos.app.goo.gl/{shortcode}`
- Full URL: `https://photos.google.com/share/{albumId}`
- Full URL with params: `https://photos.google.com/share/{albumId}?key=value`

**Demo Mode:**

For testing or marketplace previews without configuring a Google Photos album, you can use demo mode by passing:

- `album_url=demo` - Returns demo photo data
- `album_url=0` - Returns demo photo data
- `album_url=` (empty string) - Returns demo photo data

Demo mode returns a static response with a sample photo from the project's GitHub Pages:

```json
{
  "photo_url": "https://hossain-khan.github.io/trmnl-google-photos-plugin/assets/images/google-photos-demo-picture-small.jpg",
  "thumbnail_url": "https://hossain-khan.github.io/trmnl-google-photos-plugin/assets/images/google-photos-demo-picture-thumb.jpg",
  "caption": null,
  "timestamp": "2024-06-25T12:00:00.000Z",
  "image_update_date": "2024-06-25T12:00:00.000Z",
  "album_name": "TRMNL Demo Album - Google Photos",
  "photo_count": 142,
  "relative_date": "1 year ago",
  "aspect_ratio": "4:3",
  "megapixels": 12
}
```

This feature allows the plugin to display properly in the TRMNL marketplace before users configure their own albums.

#### Response

**Success (200 OK):**

Returns JSON with photo data that TRMNL merges into Liquid templates.

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "photo_url": "https://lh3.googleusercontent.com/...=w800-h480",
  "thumbnail_url": "https://lh3.googleusercontent.com/...=w400-h300",
  "caption": null,
  "timestamp": "2026-01-19T09:00:00.000Z",
  "image_update_date": "2023-01-07T18:13:24.232Z",
  "album_name": "Google Photos Shared Album",
  "photo_count": 142,
  "relative_date": "4 months ago",
  "aspect_ratio": "4:3",
  "megapixels": 12.5
}
```

**Response Fields:**

| Field                   | Type           | Description                                                                  |
| ----------------------- | -------------- | ---------------------------------------------------------------------------- |
| `photo_url`             | string         | Full-resolution photo URL (optimized)                                        |
| `thumbnail_url`         | string         | Lower resolution version                                                     |
| `caption`               | string \| null | Photo caption (always `null` - not available from shared albums)             |
| `timestamp`             | string         | ISO 8601 timestamp                                                           |
| `image_update_date`     | string         | ISO 8601 timestamp when photo was last updated/taken                         |
| `album_name`            | string         | Album name (always "Google Photos Shared Album" - actual name not available) |
| `photo_count`           | number         | Total photos in album                                                        |
| `relative_date`         | string         | Human-readable relative date (e.g., "4 months ago")                          |
| `aspect_ratio`          | string         | Photo aspect ratio (e.g., "4:3", "16:9")                                     |
| `megapixels`            | number         | Photo megapixels (calculated from width × height)                            |
| `edge_brightness_score` | number \| null | Edge brightness score 0-100 (only when `adaptive_background=true`)           |
| `brightness_score`      | number \| null | Overall brightness score 0-100 (only when `adaptive_background=true`)        |

**Error: Missing URL (400 Bad Request):**

Returns when album_url parameter is missing.

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Bad Request",
  "message": "Missing required parameter: album_url",
  "example": "/api/photo?album_url=https://photos.app.goo.gl/..."
}
```

**Error: Invalid URL (400 Bad Request):**

Returns when URL format is invalid.

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Bad Request",
  "message": "Invalid album URL: Must be a Google Photos URL",
  "validFormats": [
    "https://photos.app.goo.gl/...",
    "https://photos.google.com/share/..."
  ]
}
```

**Error: Photo Fetch Failed (404/500):**

Returns when photo fetching fails.

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "Not Found",
  "message": "Album not found. The album may have been deleted or made private.",
  "timestamp": "2026-01-19T09:00:00.000Z"
}
```

#### Response Headers

**Standard Headers:**

```http
Content-Type: application/json
Access-Control-Allow-Origin: https://hossain-khan.github.io, https://usetrmnl.com
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Max-Age: 86400
```

**Custom Monitoring Headers:**

```http
X-Cache-Status: HIT
X-Response-Time: 67ms
X-Request-ID: a1b2c3d4
```

| Header            | Description                                         | Example    |
| ----------------- | --------------------------------------------------- | ---------- |
| `X-Cache-Status`  | Cache status: `HIT` (cached) or `MISS` (not cached) | `HIT`      |
| `X-Response-Time` | Total server processing time                        | `67ms`     |
| `X-Request-ID`    | Unique request identifier for debugging and tracing | `a1b2c3d4` |

**Use Cases:**

- **X-Cache-Status**: Monitor cache hit rate (target: >80%)
- **X-Response-Time**: Track API performance and identify slow requests
- **X-Request-ID**: Correlate client requests with server logs for debugging

#### Adaptive Background Feature

The optional `adaptive_background` parameter enables intelligent background color selection based on photo brightness analysis.

**How It Works:**

1. Photo thumbnail (400×300px) is analyzed for brightness using [Image Insights API](https://image-insights.gohk.uk/)
2. Two brightness scores (0-100) are returned: `edge_brightness_score` (edges) and `brightness_score` (overall)
3. Templates map `edge_brightness_score` to one of 16 TRMNL background shades (bg--black to bg--white)
4. Result cached with album data for subsequent requests

**Template Layer Mapping:**

The API returns raw brightness scores, and TRMNL templates handle the mapping:

```liquid
{% render "map_brightness_to_background", edge_score: edge_brightness_score %}
<div class="layout {% if bg_class %}{{ bg_class }}{% endif %}">
```

This separation allows:

- Service layer focuses on data collection
- Template layer controls presentation logic
- Different layouts can use different mapping strategies

**Privacy-First Design:**

- Zero image storage - never saved to disk or database
- In-memory processing only - immediately discarded after analysis
- Stateless architecture - no tracking, sessions, or user data retention
- Open source: [Image Insights API](https://github.com/hossain-khan/image-insights-api)

**Performance Impact:**

- Adds ~100-200ms latency (brightness analysis time)
- 1-second timeout with graceful fallback (no brightness scores if analysis fails)
- Analysis uses 400×300 thumbnail (6× smaller than full photo)
- Default: OFF (opt-in via query parameter or custom field)

**Example Request:**

```bash
curl "https://trmnl-google-photos.gohk.xyz/api/photo?album_url=https://photos.app.goo.gl/...&adaptive_background=true"
```

**Example Response with Brightness Scores:**

```json
{
  "photo_url": "https://lh3.googleusercontent.com/...=w1040-h780",
  "edge_brightness_score": 75,
  "brightness_score": 82,
  ...
}
```

**TRMNL Background Palette** (16 levels):

`bg--black`, `bg--gray-10`, `bg--gray-15`, `bg--gray-20`, `bg--gray-25`, `bg--gray-30`, `bg--gray-35`, `bg--gray-40`, `bg--gray-45`, `bg--gray-50`, `bg--gray-55`, `bg--gray-60`, `bg--gray-65`, `bg--gray-70`, `bg--gray-75`, `bg--white`

#### Performance Characteristics

| Metric                                      | Value      |
| ------------------------------------------- | ---------- |
| Response Time (cached)                      | 67ms       |
| Response Time (uncached)                    | 1-2s       |
| Response Time (adaptive_background enabled) | +100-200ms |
| JSON Size                                   | 300-500B   |
| CPU Time                                    | <50ms      |

#### Error Codes

| Code | Meaning               | Cause                              |
| ---- | --------------------- | ---------------------------------- |
| 200  | Success               | Photo data returned successfully   |
| 400  | Bad Request           | Missing or invalid album URL       |
| 404  | Not Found             | Album not found or inaccessible    |
| 500  | Internal Server Error | Photo fetch failed or server error |

#### Common Error Messages

**User-Friendly Error Messages:**

1. **"Missing required parameter: album_url"**
   - Cause: `album_url` query parameter is missing
   - Action: Add album_url to request

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

### 4. GET `/api/test/discord` - Test Discord Notification Endpoint

Test endpoint for manually triggering Discord alert notifications. Useful for verifying Discord webhook configuration and alert formatting without waiting for real errors to occur.

**Access Control**: Controlled by `ENABLE_TEST_API` environment variable (default: `"false"` in wrangler.toml - disabled by default for security).

#### Request

**Headers:**

```http
GET /api/test/discord?timeoutRate=0.25&totalAttempts=20&timeouts=5&errors=2&success=13 HTTP/1.1
Host: trmnl-google-photos.gohk.xyz
```

**Query Parameters:**

All parameters are optional and provide default values for testing.

| Parameter       | Type  | Default | Range             | Description                              |
| --------------- | ----- | ------- | ----------------- | ---------------------------------------- |
| `timeoutRate`   | float | 0.25    | 0.0 - 1.0         | Timeout rate percentage (as decimal)     |
| `totalAttempts` | int   | 20      | 1 - 1000          | Total API requests in the window         |
| `timeouts`      | int   | 5       | 0 - totalAttempts | Number of timeout failures               |
| `errors`        | int   | 2       | 0 - totalAttempts | Number of error responses                |
| `success`       | int   | 13      | 0 - totalAttempts | Number of successful requests            |
| `avgDuration`   | int   | 950     | 0 - 10000         | Average request duration in milliseconds |

**Requirements:**

- `DISCORD_WEBHOOK_URL` environment variable must be configured
- `ENABLE_TEST_API` must be set to `"true"` (controlled via wrangler.toml)

#### Response

**Success (200 OK):**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "ok",
  "message": "Discord alert sent successfully.",
  "stats": {
    "totalAttempts": 20,
    "timeouts": 5,
    "errors": 2,
    "success": 13,
    "timeoutRate": 0.25,
    "avgDuration": 950,
    "windowStart": "2026-01-26T17:26:00.000Z",
    "windowEnd": "2026-01-26T18:26:00.000Z"
  },
  "webhookUrl": "configured",
  "timestamp": "2026-01-26T18:26:00.000Z"
}
```

**Error: Test API Disabled (403 Forbidden):**

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "success": false,
  "error": "Forbidden: Test API is disabled."
}
```

**Error: Missing Webhook (400 Bad Request):**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "DISCORD_WEBHOOK_URL not configured in environment."
}
```

**Error: Discord Webhook Failed (500 Internal Server Error):**

```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "Failed to send Discord alert",
  "details": "Discord webhook request failed",
  "stats": { ... },
  "timestamp": "2026-01-26T18:26:00.000Z"
}
```

#### Use Cases

1. **Verify Discord Integration**: Test webhook configuration without triggering real errors
2. **Alert Format Testing**: Validate Discord embed format and message content
3. **Monitoring Integration**: Test monitoring system integration
4. **CI/CD Validation**: Automated testing in GitHub Actions (api-integration-test.yml)

#### Control

**Enable/Disable Test API:**

Set `ENABLE_TEST_API` in `wrangler.toml`:

```toml
[vars]
ENABLE_TEST_API = "true"   # Enable test API for development/testing
ENABLE_TEST_API = "false"  # Disable test API (default - returns 403)
```

**Security Note**: Test API is disabled by default (`"false"`) in production for security. Only enable when actively testing.

---

## Request Examples

### Example 1: Basic Request (JSON API)

```bash
curl "https://trmnl-google-photos.gohk.xyz/api/photo?album_url=https://photos.app.goo.gl/ENK6C44K85QgVHPH8"
```

**Response:**

```json
{
  "photo_url": "https://lh3.googleusercontent.com/...=w800-h480",
  "thumbnail_url": "https://lh3.googleusercontent.com/...=w400-h300",
  "caption": null,
  "timestamp": "2026-01-19T09:00:00.000Z",
  "image_update_date": "2023-01-07T18:13:24.232Z",
  "album_name": "Google Photos Shared Album",
  "photo_count": 142,
  "relative_date": "4 months ago",
  "aspect_ratio": "4:3",
  "megapixels": 12.5
}
```

### Example 2: With Adaptive Background

```bash
curl "https://trmnl-google-photos.gohk.xyz/api/photo?album_url=https://photos.app.goo.gl/ENK6C44K85QgVHPH8&adaptive_background=true"
```

**Response:**

```json
{
  "photo_url": "https://lh3.googleusercontent.com/...=w1040-h780",
  "thumbnail_url": "https://lh3.googleusercontent.com/...=w400-h300",
  "caption": null,
  "timestamp": "2026-01-24T09:00:00.000Z",
  "image_update_date": "2023-01-07T18:13:24.232Z",
  "album_name": "Google Photos Shared Album",
  "photo_count": 142,
  "relative_date": "1 year ago",
  "aspect_ratio": "4:3",
  "megapixels": 12.5,
  "edge_brightness_score": 75,
  "brightness_score": 82
}
```

### Example 3: With Different Album

```bash
curl "https://trmnl-google-photos.gohk.xyz/api/photo?album_url=https://photos.google.com/share/AF1QipMZN..."
```

### Example 4: Testing Locally

```bash
# Start local dev server first: npm run dev
curl "http://localhost:8787/api/photo?album_url=https://photos.app.goo.gl/ENK6C44K85QgVHPH8"
```

---

## TRMNL Integration

### How It Works

1. **TRMNL Polls Worker**: TRMNL platform makes GET request to `/api/photo`
2. **Worker Returns JSON**: Worker fetches random photo and returns JSON data
3. **TRMNL Renders Templates**: TRMNL merges JSON into Liquid templates (stored in Markup Editor)
4. **Display on Device**: TRMNL sends rendered HTML to e-ink device

### Template Access to JSON Data

Templates in TRMNL Markup Editor access JSON fields directly:

```liquid
<!-- Access photo URL -->
<img src="{{ photo_url }}" alt="{{ caption }}" class="image image--contain">

<!-- Display caption if available -->
{% if caption %}
<div class="description" data-clamp="2">{{ caption }}</div>
{% endif %}

<!-- Show album info -->
<div class="label">{{ photo_count }} photos in {{ album_name }}</div>
```

### Polling Configuration

In `settings.yml`:

```yaml
strategy: polling
polling_url: https://trmnl-google-photos.gohk.xyz/api/photo?album_url={{ shared_album_url }}&enable_caching={{ enable_caching }}&adaptive_background={{ adaptive_background }}
polling_verb: GET
refresh_frequency: 3600 # 1 hour
```

---

## Layouts

Templates are stored in TRMNL Markup Editor and render JSON data from the API. The worker supports four responsive layouts optimized for different screen sizes and orientations:

### 1. Full Layout (`full`)

**Best For**: Full-screen display, single large photo

**Characteristics**:

- Photo fills 90% of screen height
- Optional caption below (truncated to 2 lines)
- Photo count badge in title area
- Maximizes photo visibility

**Recommended Screens**: All devices, especially TRMNL X (1040x780)

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

| Device      | Width  | Height | Bit Depth | Display Type           |
| ----------- | ------ | ------ | --------- | ---------------------- |
| TRMNL OG    | 800px  | 480px  | 1-bit     | Monochrome (2 shades)  |
| TRMNL OG V2 | 800px  | 480px  | 2-bit     | Grayscale (4 shades)   |
| TRMNL X     | 1040px | 780px  | 4-bit     | Grayscale (16 shades)  |
| Kindle 2024 | 800px  | 480px  | 8-bit     | Grayscale (256 shades) |

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

### KV Cache

The worker uses Cloudflare KV for album data caching:

**Cache Key Format**: `album:{albumId}`

**Cache Behavior**:

- TTL: 3600 seconds (1 hour)
- Cache Hit: 67ms response time (average)
- Cache Miss: 1-2s response time (fetches from Google Photos)
- Shared: Multiple users share cache for same album

**Benefits**:

- 80%+ reduction in Google Photos API calls
- 20x faster response times for cached albums
- Lower API rate limit impact

**Configuration**: KV namespace configured in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "PHOTOS_CACHE"
id = "737dfeaef9a142689b8896ed818fb615"
```

See [README_CACHE.md](./README_CACHE.md) for detailed cache documentation.

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

The API provides detailed logging in Cloudflare Workers logs:

```bash
# View real-time logs
wrangler tail

# Or in Cloudflare Dashboard:
# Workers & Pages > Your Worker Name > Logs
```

Log entries include:

- Request ID (for tracing)
- Duration metrics (parse, fetch, total)
- Album URL (truncated for privacy)
- Error details (if any)
- Cache hit/miss status

---

## Support

For issues or questions:

- **GitHub Issues**: https://github.com/hossain-khan/trmnl-google-photos-plugin/issues
- **Documentation**: See `docs/` directory
- **Testing**: Run `npm test` for comprehensive test suite

---

**API Version**: 1.1.0  
**Last Updated**: January 19, 2026  
**Status**: Production Ready
