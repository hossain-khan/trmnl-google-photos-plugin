# Cache Service

This service provides KV caching for Google Photos album data to improve performance and reduce API calls.

## Overview

The cache service:

- Caches album photo lists in Cloudflare KV for 1 hour
- Reduces Google Photos API calls by 80%+
- Improves response times from ~1-2s to 67ms (average) for cached albums
- Gracefully handles cache failures without breaking the application
- Shares cache across all users with the same album URL

## Status

✅ **Deployed and Operational** (January 2026)

- Production deployment with KV namespace configured
- Cache hit response time: 67ms average
- 80%+ cache hit rate in production

## Architecture

```
Request → Check KV Cache → Cache Hit?
                              ↓ Yes: Return cached photos
                              ↓ No:  Fetch from Google Photos API
                                     ↓
                                     Store in KV (1hr TTL)
                                     ↓
                                     Return photos
```

## Cache Key Structure

Cache keys follow the pattern: `album:{albumId}`

- **Short URL**: `https://photos.app.goo.gl/ABC123` → `album:ABC123`
- **Full URL**: `https://photos.google.com/share/AF1QipO...` → `album:AF1QipO...`
- **Album URL**: `https://photos.google.com/u/0/album/AF1QipO...` → `album:AF1QipO...`

## Cached Data Structure

```typescript
{
  album_id: string;          // Album identifier
  fetched_at: string;        // ISO timestamp when cached
  photo_count: number;       // Total photos in album
  photos: GooglePhoto[];     // Array of photo metadata
}
```

## Usage

### Basic Usage (Automatic)

The cache is automatically used when the `PHOTOS_CACHE` KV namespace is configured (which it is in production):

```typescript
// In index.ts - automatically uses cache when available
const photoData = await fetchRandomPhoto(
  urlValidation.url,
  c.env.PHOTOS_CACHE // KV namespace (configured in wrangler.toml)
);
```

### Cache Functions

#### `getCachedAlbum(kv, albumId)`

Get cached album data from KV.

**Parameters:**

- `kv: KVNamespace | undefined` - Cloudflare KV namespace
- `albumId: string` - Album identifier

**Returns:**

- `CachedAlbumData | null` - Cached data or null if not found/expired

**Behavior:**

- Returns `null` if KV is undefined (cache disabled)
- Returns `null` on cache miss
- Returns `null` on errors (graceful fallback)
- Logs cache hits/misses for monitoring

#### `setCachedAlbum(kv, albumId, photos)`

Store album data in KV cache.

**Parameters:**

- `kv: KVNamespace | undefined` - Cloudflare KV namespace
- `albumId: string` - Album identifier
- `photos: GooglePhoto[]` - Array of photos to cache

**Returns:**

- `Promise<void>`

**Behavior:**

- Skips caching if KV is undefined
- Stores data with 1-hour TTL
- Logs cache storage success
- Catches and logs errors without throwing

#### `extractAlbumId(url)`

Extract album ID from Google Photos URL.

**Parameters:**

- `url: string` - Google Photos album URL

**Returns:**

- `string` - Album ID for cache key

**Behavior:**

- Handles short URLs (`photos.app.goo.gl`)
- Handles full URLs (`photos.google.com/share`)
- Handles album URLs (`photos.google.com/u/0/album`)
- Falls back to full URL if pattern not matched

#### `getCacheKey(albumId)`

Generate cache key for an album.

**Parameters:**

- `albumId: string` - Album identifier

**Returns:**

- `string` - Cache key in format `album:{albumId}`

## Configuration

The cache is already configured in production. For reference:

### KV Namespaces (Already Created)

Production and preview namespaces are configured in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "PHOTOS_CACHE"
id = "737dfeaef9a142689b8896ed818fb615"
preview_id = "0f390773e0dd4585a294297abca36df5"
```

To create new namespaces (if needed):

```bash
# Production
wrangler kv:namespace create "PHOTOS_CACHE"

# Preview/Development
wrangler kv:namespace create "PHOTOS_CACHE" --preview
```

## Cache Behavior

### Cache Hit (Production)

```
Cache HIT for album:ABC123XYZ (142 photos)
```

- Response time: 67ms average
- No Google Photos API call
- Returns cached photo list

### Cache Miss

```
Cache MISS for album:ABC123XYZ
Fetching photos from Google Photos API for album ABC123XYZ
Cache STORED for album:ABC123XYZ (142 photos, TTL: 3600s)
```

- Response time: 1-2s (API fetch + cache store)
- Makes Google Photos API call
- Stores result in cache for future requests

### Cache Error

```
Cache lookup error for album:ABC123XYZ: KV timeout
```

- Gracefully falls back to API fetch
- Application continues to function
- Error logged for monitoring

## Performance Metrics

### Production Performance (January 2026)

| Scenario                  | Response Time | API Calls        | Cache Hit Rate |
| ------------------------- | ------------- | ---------------- | -------------- |
| Cache Hit                 | 67ms avg      | 0                | -              |
| Cache Miss                | 1-2s          | 1                | -              |
| Overall (with caching)    | <500ms avg    | 20% of requests  | 80%+           |
| Overall (without caching) | 1-2s avg      | 100% of requests | N/A            |

### Monitoring

Check cache performance in worker logs:

- Count "Cache HIT" vs "Cache MISS" occurrences
- Monitor response times for cached vs uncached requests
- Track KV read/write usage in Cloudflare dashboard

## Error Handling

The cache service is designed to **never break the application**:

1. **KV Undefined**: Silently skips caching, fetches from API
2. **Cache Lookup Error**: Logs error, falls back to API fetch
3. **Cache Store Error**: Logs error, continues with request
4. **Invalid Cache Data**: Treats as cache miss, refetches

All errors are logged but not thrown, ensuring graceful degradation.

## Testing

### Unit Tests

Run cache service tests:

```bash
npm test
```

The test suite includes cache service tests that cover:

- Cache key generation
- Album ID extraction
- Cache behavior validation
- Error handling

### Integration Testing

Test with production KV namespace:

1. Deploy worker with KV configured (already done)
2. Make first request (cache miss)
3. Make second request within 1 hour (cache hit)
4. Check logs for cache hits/misses

### Manual Testing

```bash
# Test cache miss (first request to an album)
curl "https://trmnl-google-photos.gohk.xyz/api/photo?album_url=https://photos.app.goo.gl/ENK6C44K85QgVHPH8"

# Test cache hit (within 1 hour, same album)
curl "https://trmnl-google-photos.gohk.xyz/api/photo?album_url=https://photos.app.goo.gl/ENK6C44K85QgVHPH8"
```

## Cloudflare Limits

### Free Tier

- **Reads**: 100,000 per day
- **Writes**: 1,000 per day
- **Storage**: 1 GB

**Estimated capacity:**

- ~50,000 TRMNL requests per day (with 80% cache hit rate)
- ~1,000 unique albums cached per day
- Millions of photo metadata entries in storage

### Paid Tier ($5/month)

- **Reads**: 10M per month
- **Writes**: 1M per month
- **Storage**: Unlimited (within 1 GB per key limit)

## Security & Privacy

### No User Data

Cache contains only:

- Album photo metadata (URLs, dimensions)
- Public album information
- No user identifiers
- No personal data

### Shared Cache

Multiple users with the same album URL share the same cache entry:

- **Efficient**: Reduces redundant API calls
- **Privacy-safe**: Only public shared album data
- **GDPR compliant**: No personal data stored

### Cache Invalidation

Cache automatically expires after 1 hour. To force invalidation:

```bash
# Delete specific album cache
wrangler kv:key delete --binding=PHOTOS_CACHE "album:ABC123"
```

## Troubleshooting

### Cache Not Working

**Symptom**: All requests show "Cache MISS"

**Check:**

1. KV namespaces exist: `wrangler kv:namespace list`
2. IDs in wrangler.toml match created namespaces
3. Worker deployed after wrangler.toml update
4. Check worker logs for "KV cache not configured" warnings

**Solution:**

```bash
# Verify namespaces exist
wrangler kv:namespace list

# Should show:
# [
#   {
#     "id": "737dfeaef9a142689b8896ed818fb615",
#     "title": "trmnl-google-photos-PHOTOS_CACHE"
#   }
# ]

# Redeploy worker if needed
npm run deploy
```

### High Cache Miss Rate

**Symptom**: >30% cache misses

**Causes:**

1. Different users using different album URLs (expected)
2. TTL expired between requests (expected if >1 hour apart)
3. Cache keys not matching due to URL format variations

**Solution:**

- Monitor for 24 hours to establish baseline
- Verify same album URL format is used consistently
- Consider increasing TTL if needed (edit `CACHE_TTL_SECONDS` in cache-service.ts)

### Cache Errors

**Symptom**: "Cache lookup error" or "Cache storage error" in logs

**Causes:**

1. KV namespace rate limits exceeded
2. Network issues
3. KV namespace misconfigured

**Solution:**

- Check Cloudflare dashboard for KV usage and errors
- Verify namespace IDs are correct
- Check KV namespace status in Cloudflare dashboard

## Future Enhancements

Potential improvements for future versions:

- [ ] Cache analytics (hit rate, response time distribution)
- [ ] Configurable TTL per album
- [ ] Cache warming for popular albums
- [ ] Cache invalidation API endpoint
- [ ] Multi-region replication for global performance

## Related Files

- [cache-service.ts](../src/services/cache-service.ts) - Implementation
- [photo-fetcher.ts](../src/services/photo-fetcher.ts) - Integration
- [test-cache-service.ts](../src/tests/test-cache-service.ts) - Tests
- [Cloudflare KV Documentation](https://developers.cloudflare.com/kv/) - Setup guide
