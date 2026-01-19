# Caption Extraction Implementation

## Overview

This document describes the implementation of caption extraction for Google Photos shared albums in the TRMNL plugin.

## Problem Statement

The `google-photos-album-image-url-fetch@3.2.0` library only extracts basic photo metadata (uid, url, dimensions, timestamps) but doesn't provide caption/description data from Google Photos shared albums.

## Solution

We implemented a caption extraction service that:
1. Uses the same HTTP client (`gaxios`) as the base library
2. Parses the same AF_initDataCallback data structure
3. Extracts caption data from nested arrays in the photo metadata
4. Falls back gracefully to the original library if extraction fails

## Implementation Details

### Key Files

1. **`src/services/caption-extractor.ts`** - New caption extraction service
   - `fetchPhotosWithCaptions()` - Main function that fetches and parses photo data with captions
   - `parsePhotoDataWithCaptions()` - Parses AF_initDataCallback structure to extract captions
   - `fetchCaptionFromPhotoPage()` - Fallback method to fetch captions from individual photo pages (requires full share URL)

2. **`src/services/photo-fetcher.ts`** - Enhanced to use caption extraction
   - Try caption extraction first
   - Fall back to original library if extraction fails
   - Update `convertToPhotoData()` to use caption from photo object

3. **`src/types.ts`** - Updated GooglePhoto interface
   - Added optional `caption?: string` field

### Technical Approach

#### Why gaxios instead of axios?

During testing, we discovered that `gaxios` (used by google-photos-album-image-url-fetch) properly handles Google Photos redirects and returns the full album page with AF_initDataCallback data, while `axios` was getting a smaller landing page without photo data.

**Test Results:**
- `axios`: 31KB response, no AF_initDataCallback with photo data
- `gaxios`: 1.1MB response, full AF_initDataCallback with 10 photos

#### AF_initDataCallback Structure

Google Photos uses AF_initDataCallback to pass data to the frontend. The photo data structure is:

```javascript
data.data[1] = [ // Array of photos
  [ // Each photo is an array
    uid,              // [0] Photo UID (string)
    [url, w, h, ...], // [1] Image details array
    imageUpdateDate,  // [2] Timestamp
    ...,              // [3-5] Other metadata
    albumAddDate,     // [5] Timestamp
    [...],            // [6] Unknown array
    [...],            // [7] Unknown nested arrays
    number,           // [8] Number value
    {...}             // [9] Object with metadata
  ]
]
```

#### Caption Detection Heuristic

The caption extraction looks for text strings in photo array indices 6 and beyond:

1. Check if element is a string
2. Verify length is reasonable (0-1000 characters)
3. Filter out UIDs (starts with "AF1") and URLs (starts with "http")
4. Check nested arrays for caption strings

This heuristic approach works because captions are typically:
- Human-readable text
- Shorter than 1000 characters
- Don't look like UIDs or URLs

### Dependencies Added

- **gaxios** (^6.7.1) - HTTP client that properly handles Google Photos redirects
- **json5** (^2.2.3) - Parser for AF_initDataCallback JavaScript data structures

## Testing

### Test Files Created

1. **`scripts/test-caption-unit.js`** - Unit tests for caption extraction
   - Validates backward compatibility
   - Tests photo data structure
   - Verifies caption field is optional

2. **Investigation Scripts** (for debugging/exploration):
   - `scripts/test-caption-extraction.js` - Test caption extraction with both methods
   - `scripts/investigate-photo-structure.js` - Deep dive into AF_initDataCallback structure
   - `scripts/test-gaxios-fetch.js` - Test gaxios vs axios behavior
   - `scripts/debug-library-fetch.js` - Debug what HTML the library fetches

### Test Results

- ✓ All 110 existing tests pass
- ✓ 5 new caption extraction tests pass
- ✓ Backward compatible with albums without captions
- ✓ Falls back gracefully to original library

## Known Limitations

1. **Caption Availability**: Not all shared albums have caption data in AF_initDataCallback
   - Depends on whether photos have descriptions in Google Photos
   - Depends on Google's internal data structure format

2. **Heuristic Detection**: Caption detection is pattern-based
   - May miss captions in unexpected formats
   - May incorrectly identify non-caption text as captions (low risk)

3. **Test Album**: The demo album (https://photos.app.goo.gl/FB8ErkX2wJAQkJzV8) doesn't have captions
   - Implementation is ready but can't be fully validated without a captioned album
   - Structure analysis shows where captions would appear

4. **Short URLs**: Individual photo page caption fetching requires full share URLs
   - Short URLs (photos.app.goo.gl) don't directly expose album ID
   - Fallback method won't work with short URLs

## Future Improvements

1. **Find Test Album with Captions**: Locate or create a shared album with photo captions for full validation
2. **Refine Heuristics**: Improve caption detection based on real-world caption data
3. **Index Optimization**: Once we see real captions, optimize which array indices to check
4. **Performance**: Consider caching parsed AF_initDataCallback data

## Usage Example

```typescript
import { fetchRandomPhoto } from './services/photo-fetcher';

// Fetch a random photo with caption
const photoData = await fetchRandomPhoto(albumUrl, kv);

// photoData.caption will be:
// - string if caption found
// - null if no caption available
// - null if caption extraction failed (falls back to original library)
```

## Conclusion

The caption extraction is implemented and tested, with graceful fallbacks to ensure backward compatibility. While we couldn't fully validate with a captioned album, the implementation is ready to extract captions when they're present in the AF_initDataCallback data structure.

The key discovery was that using `gaxios` (the same HTTP client as the base library) is essential for getting the full album data with AF_initDataCallback structures.
