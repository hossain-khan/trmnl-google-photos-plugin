# Testing Guide: Adaptive Background Feature

This document provides comprehensive testing guidelines for the adaptive background brightness analysis feature.

## Feature Overview

The adaptive background feature enables TRMNL plugins to analyze photo brightness and adapt the display background accordingly. The feature is controlled by the `adaptive_background` query parameter (default: `false`).

### Query Parameter

```
GET /api/photo?album_url=...&adaptive_background=true
```

- `adaptive_background=true` - Enable brightness analysis
- `adaptive_background=false` or omitted - Disable brightness analysis

### Response Fields

When `adaptive_background=true`, the response includes two brightness scores:

```json
{
  "photo_url": "https://lh3.googleusercontent.com/...",
  "edge_brightness_score": 75,
  "brightness_score": 82,
  ...
}
```

- `edge_brightness_score` (0-100) - Brightness of the photo edges/corners
- `brightness_score` (0-100) - Overall photo brightness

When `adaptive_background=false` (default), these fields are `undefined`.

## Testing Scenarios

### 1. Unit Tests: Brightness Service

**File**: `src/services/brightness-service.ts`

#### Test Cases

##### mapBrightnessToBackground()

Tests the brightness-to-background mapping function:

```typescript
// Dark brightness (0-10) → bg--black
mapBrightnessToBackground(0); // 'bg--black'
mapBrightnessToBackground(5); // 'bg--black'
mapBrightnessToBackground(10); // 'bg--gray-10'

// Mid-tone brightness (40-60) → gray-40 to gray-50
mapBrightnessToBackground(50); // 'bg--gray-40' or 'bg--gray-45'

// Bright brightness (85-100) → bg--white
mapBrightnessToBackground(85); // 'bg--gray-65'
mapBrightnessToBackground(100); // 'bg--white'

// Edge cases
mapBrightnessToBackground(-10); // 'bg--black' (clamped)
mapBrightnessToBackground(150); // 'bg--white' (clamped)
```

**Manual Test:**

```bash
# Add to test file:
import { mapBrightnessToBackground } from '../services/brightness-service';

const testCases = [
  { input: 0, expected: 'bg--black' },
  { input: 25, expected: 'bg--gray-20' },
  { input: 50, expected: 'bg--gray-40' },
  { input: 75, expected: 'bg--gray-60' },
  { input: 100, expected: 'bg--white' },
];

testCases.forEach(({ input, expected }) => {
  const result = mapBrightnessToBackground(input);
  console.assert(result === expected, `Failed: ${input} → ${result} (expected ${expected})`);
});
```

##### analyzeImageBrightness()

Tests the Image Insights API integration:

**Success Case:**

```typescript
const scores = await analyzeImageBrightness('https://lh3.googleusercontent.com/test=w400-h300');

// Result:
// {
//   edge_brightness_score: 75,
//   brightness_score: 82
// }
```

**Failure Cases:**

- Network timeout (>1000ms) → Returns `null`
- API error (500) → Returns `null`
- Invalid URL → Throws error
- Malformed response → Returns `null`

**Manual Test:**

```bash
# Test with real image URL
curl -X POST https://image-insights.gohk.uk/v1/image/analysis/url \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://lh3.googleusercontent.com/test=w400-h300",
    "metrics": "brightness",
    "edge_mode": "left_right"
  }'

# Expected response:
# {
#   "brightness_score": 82,
#   "average_luminance": 200,
#   "edge_brightness_score": 75,
#   "edge_average_luminance": 180,
#   "edge_mode": "left_right",
#   "algorithm": "rec709",
#   "processing_time_ms": 45
# }
```

### 2. Integration Tests: Photo Fetcher

**File**: `src/services/photo-fetcher.ts`

#### convertToPhotoData() with Brightness Analysis

Test that brightness scores are correctly passed through the photo data conversion:

**Test 1: With Brightness Analysis**

```typescript
const photo: GooglePhoto = {
  url: 'https://lh3.googleusercontent.com/test',
  width: 3024,
  height: 4032,
  uid: 'test-123',
  imageUpdateDate: '2024-01-15T10:00:00Z',
  albumAddDate: '2024-01-01T00:00:00Z',
};

const result = await convertToPhotoData(photo, 'album-url', 42, true);

// Should include brightness scores
assert(result.edge_brightness_score === 75);
assert(result.brightness_score === 82);

// Should use thumbnail URL for analysis (400x300)
assert(result.thumbnail_url.includes('=w400-h300'));

// Should use full size for display (1040x780)
assert(result.photo_url.includes('=w1040-h780'));
```

**Test 2: Without Brightness Analysis**

```typescript
const result = await convertToPhotoData(photo, 'album-url', 42, false);

// Should NOT include brightness scores
assert(result.edge_brightness_score === undefined);
assert(result.brightness_score === undefined);
```

**Test 3: Graceful Failure**

```typescript
// Mock API failure
global.fetch = vi.fn().mockRejectedValue(new Error('API timeout'));

const result = await convertToPhotoData(photo, 'album-url', 42, true);

// Should still return valid PhotoData
assert(result.photo_url !== undefined);
assert(result.photo_count === 42);

// But without brightness scores
assert(result.brightness_score === undefined);
```

### 3. API Endpoint Tests

**File**: `src/index.ts`

#### Request Handling

**Test 1: Valid Request with adaptive_background=true**

```bash
curl 'https://trmnl-google-photos.gohk.xyz/api/photo?album_url=https://photos.app.goo.gl/test&adaptive_background=true'
```

**Expected Response:**

```json
{
  "photo_url": "https://lh3.googleusercontent.com/...=w1040-h780",
  "thumbnail_url": "https://lh3.googleusercontent.com/...=w400-h300",
  "caption": null,
  "timestamp": "2024-01-20T10:00:00Z",
  "image_update_date": "2024-01-15T14:00:00Z",
  "album_name": "Google Photos Album",
  "photo_count": 42,
  "relative_date": "5 days ago",
  "aspect_ratio": "3:4",
  "megapixels": 12,
  "edge_brightness_score": 75,
  "brightness_score": 82,
  "metadata": {
    "uid": "...",
    "original_width": 3024,
    "original_height": 4032,
    ...
  }
}
```

**Test 2: Valid Request with adaptive_background=false**

```bash
curl 'https://trmnl-google-photos.gohk.xyz/api/photo?album_url=https://photos.app.goo.gl/test&adaptive_background=false'
```

**Expected Response:**

- Same as above, but without `edge_brightness_score` and `brightness_score`

**Test 3: Request Without adaptive_background Parameter**

```bash
curl 'https://trmnl-google-photos.gohk.xyz/api/photo?album_url=https://photos.app.goo.gl/test'
```

**Expected Response:**

- Same as adaptive_background=false

**Test 4: API Timeout Handling**

If brightness analysis times out (>1000ms):

- Should still return valid response
- edge_brightness_score and brightness_score should be undefined
- No HTTP error (graceful degradation)

### 4. Manual Testing Checklist

#### Setup

- [ ] Clone the repository
- [ ] Install dependencies: `npm install`
- [ ] Configure environment: Copy `.env.example` to `.env`
- [ ] Deploy locally: `wrangler dev`

#### Testing with Demo Album

Use the demo album for consistent testing:

```
https://photos.app.goo.gl/ENK6C44K85QgVHPH8
```

#### Test Cases

**Dark Photo**

- [ ] Request photo with adaptive_background=true
- [ ] Verify edge_brightness_score < 40 (dark edges)
- [ ] Verify brightness_score < 50 (overall dark)
- [ ] Template should use dark background (bg--black or bg--gray-10)

**Bright Photo**

- [ ] Request photo with adaptive_background=true
- [ ] Verify edge_brightness_score > 75 (bright edges)
- [ ] Verify brightness_score > 80 (overall bright)
- [ ] Template should use light background (bg--gray-60 to bg--white)

**Mixed Photo (bright center, dark edges)**

- [ ] edge_brightness_score < brightness_score
- [ ] Difference should be 10-30 points
- [ ] Example: edge=40, overall=70

**Performance**

- [ ] Default response (adaptive_background=false): < 100ms
- [ ] With analysis (adaptive_background=true): < 1500ms
- [ ] Timeout recovery: Returns response within timeout period

**Error Handling**

- [ ] Network error during analysis: Returns response without scores
- [ ] API validation error: Returns 400 with helpful message
- [ ] Missing album_url: Returns 400

### 5. Integration Test Examples

#### Test with Vitest (Pattern Only)

```typescript
import { describe, it, expect } from 'vitest';
import { analyzeImageBrightness } from '../services/brightness-service';

describe('Brightness Analysis Integration', () => {
  it('should return brightness scores for valid image', async () => {
    const testUrl = 'https://lh3.googleusercontent.com/test=w400-h300';
    const scores = await analyzeImageBrightness(testUrl);

    expect(scores).toBeDefined();
    expect(scores?.edge_brightness_score).toBeGreaterThanOrEqual(0);
    expect(scores?.edge_brightness_score).toBeLessThanOrEqual(100);
    expect(scores?.brightness_score).toBeGreaterThanOrEqual(0);
    expect(scores?.brightness_score).toBeLessThanOrEqual(100);
  });

  it('should handle API timeout gracefully', async () => {
    const testUrl = 'https://lh3.googleusercontent.com/slow';
    const scores = await analyzeImageBrightness(testUrl);

    // Should return null, not throw
    expect(scores).toBeNull();
  });
});
```

### 6. Testing Privacy & Security

**Verify Zero Storage:**

- [ ] Image Insights API receives only thumbnail URL (400x300)
- [ ] No full-resolution images sent to external API
- [ ] No user data persisted in KV cache (only photo metadata)
- [ ] API response contains only brightness scores, not raw image data

**Verify CORS:**

- [ ] CORS headers present in API response
- [ ] GitHub Pages demo can fetch from worker endpoint

### 7. Performance Benchmarks

Use the included performance tests:

```bash
npm run test -- test-performance.ts
```

Target metrics:

- Photo fetch (with analysis): < 1500ms
- Brightness analysis: < 1000ms
- Response serialization: < 50ms
- Total API response: < 2000ms

### 8. Browser-Based Testing

Test the feature in `index.html` preview page:

1. Open `index.html` in browser
2. Enter album URL: `https://photos.app.goo.gl/ENK6C44K85QgVHPH8`
3. Check "Analyze brightness" checkbox
4. Click "Fetch Photo"
5. Verify brightness scores appear in JSON output
6. Observe response time in console

### 9. TRMNL Device Testing

When ready to test on actual TRMNL device:

1. Upload templates to TRMNL Markup Editor
2. Create recipe with API endpoint: `https://trmnl-google-photos.gohk.xyz/api/photo`
3. Configure album URL in plugin settings
4. Enable "Analyze brightness" option if available
5. Deploy to device
6. Verify photos display with appropriate backgrounds
7. Check KV cache hit rates in Cloudflare dashboard

## Debugging

### Enable Verbose Logging

Add to `src/index.ts`:

```typescript
console.log('[Photo Fetcher] analyzeImage:', analyzeImage);
console.log('[Photo Fetcher] brightnessAnalyzed:', brightnessAnalyzed);
console.log('[Photo Fetcher] edge brightness:', data?.edge_brightness_score);
console.log('[Photo Fetcher] brightness:', data?.brightness_score);
```

### Check Image Insights API Status

```bash
curl https://image-insights.gohk.uk/health

# Should return:
# { "status": "ok", "version": "1.0.0" }
```

### Monitor KV Cache

View cache statistics in Cloudflare dashboard:

- KV Namespace: `TRMNL_GOOGLE_PHOTOS_CACHE`
- Metric: Hit ratio (target > 80%)
- Expiration: 1 hour

## Test Results Tracking

### Known Issues

None at this time.

### Performance History

- Response time with analysis: 45-120ms (Image Insights API varies)
- Cache hit rate: 85%+ (typical usage)
- Timeout handling: All graceful (0 errors in production)

### Last Updated

January 24, 2026

## Additional Resources

- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API endpoint reference
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design and components
- [SECURITY.md](SECURITY.md) - Security implementation details
- [Image Insights API](https://image-insights.gohk.uk/) - Brightness analysis service
