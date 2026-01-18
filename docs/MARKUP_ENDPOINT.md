# `/markup` Endpoint Documentation

## Overview

The `/markup` endpoint is the main TRMNL integration point for the Google Photos Plugin. It receives requests from TRMNL devices, fetches a random photo from the configured Google Photos shared album, and returns rendered HTML markup for display on e-ink devices.

## Endpoint Details

- **URL**: `POST /markup`
- **Content-Type**: `application/json`
- **Response Type**: `text/html`
- **Average Response Time**: <1 second
- **Maximum Response Time**: 3 seconds

## Request Format

### Request Body

```json
{
  "trmnl": {
    "plugin_settings": {
      "instance_name": "My Photos",
      "shared_album_url": "https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5"
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

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `trmnl.plugin_settings.instance_name` | string | Yes | Display name shown in title bar |
| `trmnl.plugin_settings.shared_album_url` | string | Yes | Google Photos shared album URL |
| `trmnl.screen.width` | number | No | Screen width in pixels (for layout selection) |
| `trmnl.screen.height` | number | No | Screen height in pixels (for layout selection) |
| `trmnl.screen.bit_depth` | number | No | Display bit depth (1, 2, or 4) |
| `trmnl.layout` | string | No | Layout to use (full, half_horizontal, half_vertical, quadrant) |

### Supported Album URL Formats

1. **Short URLs**: `https://photos.app.goo.gl/{shortcode}`
   - Example: `https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5`

2. **Full URLs**: `https://photos.google.com/share/{albumId}`
   - Example: `https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF`

3. **URLs with Query Parameters**: `https://photos.google.com/share/{albumId}?key=value`
   - Query parameters are ignored

## Response Format

### Success Response (200 OK)

Returns HTML markup for the photo display:

```html
<div class="layout p--2">
  <div class="flex flex--col gap--small h--full">
    <div class="flex flex--center-x flex--center-y" style="flex: 1;">
      <img src="https://lh3.googleusercontent.com/...=w800-h480" 
           alt="" 
           class="image image--contain"
           style="max-width: 100%; max-height: 90%; object-fit: contain;">
    </div>
  </div>
</div>

<div class="title_bar">
  <span class="title">My Photos</span>
  <span class="description">5 photos</span>
</div>
```

### Error Response (400 Bad Request)

Returns HTML with error message:

```html
<div class="layout p--2">
  <div class="flex flex--col flex--center-x flex--center-y gap--medium h--full">
    <div class="value value--large text--center">📷</div>
    <div class="title title--medium text--center">No Photos Available</div>
    <div class="description text--center">
      Please configure your Google Photos shared album URL in the plugin settings.
    </div>
  </div>
</div>
```

**Returned for:**
- Missing album URL
- Invalid album URL format
- Album URL from non-Google Photos domain

### Error Response (500 Internal Server Error)

Returns HTML with error message:

```html
<div class="layout p--2">
  <div class="flex flex--col flex--center-x flex--center-y gap--medium h--full">
    <div class="value value--large text--center">📷</div>
    <div class="title title--medium text--center">No Photos Available</div>
    <div class="description text--center">
      Failed to fetch photos: [error message]
    </div>
  </div>
</div>
```

**Returned for:**
- Album not found (404)
- Album access denied (403)
- Network errors
- No photos in album
- Template rendering errors

## Layouts

The endpoint supports four layouts that adapt to different screen sizes and orientations:

### 1. Full Layout (`full`)
- **Use Case**: Full-screen display
- **Photo Size**: 90% of screen height
- **Features**: Large photo, optional caption (2 lines), photo count

### 2. Half Horizontal Layout (`half_horizontal`)
- **Use Case**: Half-width horizontal strip
- **Photo Size**: Left half of screen
- **Features**: Photo on left, caption on right, photo count

### 3. Half Vertical Layout (`half_vertical`)
- **Use Case**: Half-height vertical strip
- **Photo Size**: 85% of available height
- **Features**: Photo above, compact caption below (2 lines)

### 4. Quadrant Layout (`quadrant`)
- **Use Case**: Quarter-screen display
- **Photo Size**: Fills entire quadrant
- **Features**: Photo only, no caption, minimal padding

## Photo Optimization

Photos are automatically optimized for e-ink display:

1. **URL Parameter**: Appends `=w{width}-h{height}` to Google Photos URL
2. **Default Size**: 800x480 pixels (TRMNL OG dimensions)
3. **Aspect Ratio**: Maintained (no cropping)
4. **Format**: Google Photos serves WebP by default (efficient for e-ink)

Example optimized URL:
```
https://lh3.googleusercontent.com/pw/AP1GczNDFgTo_zGEG_Qe5oWmKiTwnFEU8nYN1ltFygISL16NHuwYTJco0IkO4wLh2RjRGGOb_eoeXxYkA3qI9E9qeiIwpJUEy8wUNJgzExAqMg0eTBEbxbYv=w800-h480
```

## Photo Selection

- **Algorithm**: Random selection from album photos
- **Seed**: Based on `Math.random()` (different photo on each request)
- **Duplicates**: No deduplication (same photo may appear multiple times)

## Error Handling

### URL Validation Errors

| Error | Response | HTTP Code |
|-------|----------|-----------|
| Empty URL | "No album URL configured" | 200 (renders error state) |
| Invalid format | "Invalid album URL: [reason]" | 400 |
| Wrong domain | "Invalid album URL: must be from Google Photos" | 400 |

### Photo Fetching Errors

| Error | Response | HTTP Code |
|-------|----------|-----------|
| Album not found | "Album not found. The album may have been deleted or made private." | 500 |
| Access denied | "Album access denied. Ensure the album has link sharing enabled." | 500 |
| No photos | "No photos found in album. Ensure the album is publicly shared and contains photos (not videos)." | 500 |
| Network error | "Failed to fetch album photos" | 500 |

### Template Rendering Errors

| Error | Response | HTTP Code |
|-------|----------|-----------|
| Invalid layout | "Invalid layout '[name]'. Valid layouts: full, half_horizontal, half_vertical, quadrant" | 500 |
| Template not found | "Template '[layout]' not found. Templates must be preloaded." | 500 |
| Rendering failed | "Failed to render template: [error]" | 500 |

## Performance Characteristics

- **Cold Start**: <1 second (Cloudflare Workers)
- **Warm Request**: <500ms
- **Photo Fetch**: 200-800ms (depends on Google Photos API)
- **Template Render**: <50ms
- **Total**: Typically <1 second, always <3 seconds

## Rate Limiting

- **No explicit rate limiting** (handled by Cloudflare Workers)
- **Google Photos API**: No known rate limits for public shared albums
- **TRMNL Refresh**: 1 hour (3600 seconds) by default

## Caching

- **Current Implementation**: No caching
- **Future Enhancement**: Cloudflare KV caching (1-hour TTL)
  - Would reduce Google Photos API calls
  - Would improve response time to <500ms

## Testing

### Using curl

```bash
# Test with valid album
curl -X POST http://localhost:8787/markup \
  -H "Content-Type: application/json" \
  -d '{
    "trmnl": {
      "plugin_settings": {
        "instance_name": "My Photos",
        "shared_album_url": "https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5"
      },
      "screen": {
        "width": 800,
        "height": 480,
        "bit_depth": 1
      },
      "layout": "full"
    }
  }'

# Test with empty URL (error case)
curl -X POST http://localhost:8787/markup \
  -H "Content-Type: application/json" \
  -d '{
    "trmnl": {
      "plugin_settings": {
        "instance_name": "My Photos",
        "shared_album_url": ""
      },
      "layout": "full"
    }
  }'
```

### Using JavaScript

```javascript
const response = await fetch('https://trmnl-google-photos.hk-c91.workers.dev/markup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    trmnl: {
      plugin_settings: {
        instance_name: 'My Photos',
        shared_album_url: 'https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5',
      },
      screen: {
        width: 800,
        height: 480,
        bit_depth: 1,
      },
      layout: 'full',
    },
  }),
});

const html = await response.text();
console.log(html);
```

## Troubleshooting

### "No Photos Available" Error

**Possible causes:**
1. Album URL not configured
2. Album URL is invalid
3. Album is private or deleted
4. Album has link sharing disabled
5. Album contains only videos (not photos)

**Solution:**
- Verify album URL is correct
- Check album is publicly shared
- Ensure "Link sharing" is enabled in Google Photos
- Verify album contains at least one photo

### Photo Not Loading

**Possible causes:**
1. Google Photos URL expired
2. Network connectivity issues
3. CORS restrictions (shouldn't happen with Google Photos)

**Solution:**
- Refresh the page
- Check browser console for errors
- Verify Google Photos URL in browser directly

### Slow Response Times (>3 seconds)

**Possible causes:**
1. Google Photos API is slow
2. Large album (many photos)
3. Network latency

**Solution:**
- Implement KV caching (planned)
- Use smaller albums (<1000 photos)
- Deploy to Cloudflare region closer to users

## Security Considerations

1. **No Authentication**: Endpoint is publicly accessible (by design)
2. **No User Data Storage**: Fully stateless, no PII stored
3. **Public Albums Only**: Works only with publicly shared albums
4. **URL Validation**: Strict validation prevents SSRF attacks
5. **Rate Limiting**: Handled by Cloudflare Workers infrastructure

## Future Enhancements

1. **KV Caching**: Cache album photo lists for 1 hour
2. **Photo Deduplication**: Track recently shown photos
3. **Custom Photo Size**: Support different screen sizes
4. **Video Thumbnails**: Extract thumbnails from videos
5. **Multiple Albums**: Support rotating between multiple albums
6. **Date Filtering**: Show photos from specific date ranges

## Related Documentation

- [Google Photos API Documentation](../docs/GOOGLE_PHOTOS_API.md)
- [URL Parser Documentation](../docs/URL_PARSER.md)
- [Template Documentation](../docs/NEW_RECIPE_GUIDE.md)
- [Deployment Guide](../DEPLOYMENT.md)
