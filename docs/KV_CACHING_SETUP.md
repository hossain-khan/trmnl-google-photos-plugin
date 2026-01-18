# KV Caching Setup Guide

This document explains how to set up and use Cloudflare KV caching for the TRMNL Google Photos Plugin.

## Overview

KV caching is **optional** and improves performance by caching album photo lists for 1 hour. This reduces the number of API calls to Google Photos and speeds up response times from ~2-3 seconds to <500ms for cached albums.

## Benefits

- **80%+ reduction** in Google Photos API calls
- **Response time <500ms** for cached albums (vs 2-3s without cache)
- **Shared cache** - Same album cached once for all users
- **Automatic expiration** - Data refreshes every hour
- **Graceful fallback** - App works without cache if KV unavailable

## Setup Instructions

### 1. Create KV Namespaces

You need two namespaces: one for production and one for preview (development).

```bash
# Login to Cloudflare (if not already logged in)
wrangler login

# Create production namespace
wrangler kv:namespace create "PHOTOS_CACHE"

# Create preview namespace for development
wrangler kv:namespace create "PHOTOS_CACHE" --preview
```

The commands will output namespace IDs like:

```
✅ Created namespace with title "trmnl-google-photos-PHOTOS_CACHE"
📋 ID: abc123def456ghi789
```

### 2. Update wrangler.toml

Edit `wrangler.toml` and replace the placeholder IDs with your actual namespace IDs:

```toml
[[kv_namespaces]]
binding = "PHOTOS_CACHE"
id = "abc123def456ghi789"           # Replace with your production namespace ID
preview_id = "xyz789abc123def456"   # Replace with your preview namespace ID
```

### 3. Deploy

Deploy the worker with KV bindings:

```bash
wrangler deploy
```

The worker will now use KV caching automatically when the `PHOTOS_CACHE` binding is available.

## Cache Behavior

### Cache Key Structure

Cache keys use the format: `album:{albumId}`

Examples:
- `album:ABC123XYZ` (for short URLs)
- `album:AF1QipO4_Y5pseqWDPSlY7AAo0wmg76xW4gX0kOz8-p_` (for full URLs)

### Cache Entry Structure

```json
{
  "album_id": "ABC123XYZ",
  "fetched_at": "2026-01-18T10:30:00Z",
  "photo_count": 142,
  "photos": [
    {
      "uid": "AF1QipO4_Y5pseqWDPSlY7AAo0wmg76xW4gX0kOz8-p_",
      "url": "https://lh3.googleusercontent.com/...",
      "width": 4032,
      "height": 3024,
      "imageUpdateDate": 1705579200000,
      "albumAddDate": 1705579200000
    }
  ]
}
```

### TTL (Time To Live)

- **Cache duration**: 1 hour (3600 seconds)
- **Automatic expiration**: Cloudflare KV automatically removes entries after TTL
- **Manual refresh**: Not needed - cache expires and refetches automatically

### Cache Flow

```
┌─────────────────────┐
│ TRMNL Request       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Parse Album URL     │
│ Extract Album ID    │
└──────────┬──────────┘
           │
           ▼
    ┌──────────────┐
    │ Check KV     │  ←── Cache Key: album:{albumId}
    │ Cache        │
    └──────┬───────┘
           │
     ┌─────┴──────┐
     │            │
  Cache Hit    Cache Miss
     │            │
     ▼            ▼
┌─────────┐  ┌──────────────┐
│ Return  │  │ Fetch from   │
│ Cached  │  │ Google API   │
│ Photos  │  └──────┬───────┘
└─────────┘         │
                    ▼
              ┌──────────────┐
              │ Store in KV  │
              │ (1hr TTL)    │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │ Return Photos│
              └──────────────┘
```

## Monitoring Cache Performance

### Check Cache Logs

Cache hits and misses are logged to the console:

```
Cache HIT for album:ABC123XYZ (142 photos)
Cache MISS for album:ABC123XYZ
Cache STORED for album:ABC123XYZ (142 photos, TTL: 3600s)
```

### Expected Cache Hit Rate

- **First request**: Cache miss (fetches from API)
- **Subsequent requests (within 1 hour)**: Cache hit (instant)
- **After 1 hour**: Cache miss (refetches and recaches)

With typical TRMNL refresh patterns (every 15-60 minutes), you should see:
- **80-90% cache hit rate** for popular albums
- **Response time <500ms** for cache hits
- **Response time 2-3s** for cache misses

## Cloudflare Free Tier Limits

The Cloudflare Workers free tier includes:

- **100,000 reads/day** - More than enough for thousands of users
- **1,000 writes/day** - Sufficient for caching new albums
- **1 GB storage** - Can store millions of photo metadata entries

**Estimated capacity on free tier:**
- ~50,000 TRMNL requests per day (with 90% cache hit rate)
- ~1,000 unique albums cached per day
- Unlimited cached album storage (within 1 GB limit)

## Troubleshooting

### KV Not Working

If caching isn't working, check:

1. **KV namespaces created**: Run `wrangler kv:namespace list`
2. **IDs in wrangler.toml**: Verify IDs match the output from create commands
3. **Worker deployed**: Run `wrangler deploy` to apply changes
4. **Logs**: Check worker logs for cache-related messages

### Cache Not Being Used

If you see all cache misses:

1. **Verify KV binding**: Check `wrangler.toml` has correct `[[kv_namespaces]]` section
2. **Check logs**: Look for "KV cache not configured" messages
3. **Redeploy**: Run `wrangler deploy` to ensure bindings are active

### High Cache Miss Rate

If cache miss rate is high (>30%):

1. **TTL too short**: Current 1-hour TTL is optimal for TRMNL's 15-60 min refresh
2. **Unique albums**: Each user's album is separate cache entry
3. **Album URL variations**: Ensure same album URL format is used consistently

## Disabling Cache

To disable caching (e.g., for testing or debugging):

1. Comment out the `[[kv_namespaces]]` section in `wrangler.toml`:

```toml
# [[kv_namespaces]]
# binding = "PHOTOS_CACHE"
# id = "your-namespace-id"
# preview_id = "your-preview-id"
```

2. Redeploy: `wrangler deploy`

The worker will continue to function normally without caching - all requests will fetch from Google Photos API.

## Cost Optimization

### Free Tier Strategy

To stay within free tier limits:

1. **Use 1-hour TTL** (already configured) - Balances freshness vs API calls
2. **Monitor usage**: Check Cloudflare dashboard for KV read/write counts
3. **Upgrade if needed**: Paid tier ($5/month) includes 10M reads, 1M writes

### Paid Tier Benefits

If you exceed free tier limits, paid tier ($5/month) includes:

- **10M KV reads/month** - Supports 300k+ requests/day
- **1M KV writes/month** - Supports 30k+ unique albums/day
- **Unlimited storage** (still subject to 1 GB limit per key)

## Security Considerations

### No User Data Stored

Cache contains only:
- Album photo metadata (URLs, dimensions, timestamps)
- No user information
- No private data

### Shared Cache

Multiple users with the same shared album URL will share the same cache entry. This is:
- **Efficient**: Reduces redundant API calls
- **Privacy-safe**: Only publicly shared album URLs are cached
- **GDPR compliant**: No personal data stored

### Cache Invalidation

Cache automatically expires after 1 hour. To force invalidation:

```bash
# Delete specific album cache
wrangler kv:key delete --binding=PHOTOS_CACHE "album:ABC123XYZ"

# Delete all cache entries (nuclear option)
wrangler kv:key list --binding=PHOTOS_CACHE | jq -r '.[] | .name' | xargs -I {} wrangler kv:key delete --binding=PHOTOS_CACHE "{}"
```

## Success Metrics

Track these metrics to validate caching effectiveness:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Cache Hit Rate | >80% | Count "Cache HIT" vs "Cache MISS" logs |
| Cache Hit Response Time | <500ms | Measure time from request to response |
| Cache Miss Response Time | <3s | Measure time for API fetch + cache store |
| Google Photos API Reduction | >80% | Compare API calls before/after caching |
| KV Read Usage | <100k/day (free tier) | Cloudflare dashboard |
| KV Write Usage | <1k/day (free tier) | Cloudflare dashboard |

## Next Steps

After setting up KV caching:

1. ✅ Deploy worker with KV bindings
2. ✅ Test with a real album URL
3. ✅ Check logs for cache hits/misses
4. ✅ Monitor Cloudflare dashboard for usage
5. ✅ Adjust TTL if needed (in `cache-service.ts`)

## Questions?

See:
- [Cloudflare KV Documentation](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Wrangler KV Commands](https://developers.cloudflare.com/workers/wrangler/commands/#kv)
- Project Issues: [GitHub Issues](https://github.com/hossain-khan/trmnl-google-photos-plugin/issues)
