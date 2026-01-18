# Google Photos Album URL Parser

This module provides utilities for parsing and validating Google Photos shared album URLs with comprehensive validation using Zod schemas.

## Overview

The URL parser handles two main formats of Google Photos shared album URLs:
1. **Short URLs**: `https://photos.app.goo.gl/{shortcode}`
2. **Full URLs**: `https://photos.google.com/share/{albumId}`

It provides validation, album ID extraction, and user-friendly error messages for invalid inputs.

## Installation

The parser is included in the project. Dependencies:

```bash
npm install zod
```

## API Reference

### `parseAlbumUrl(url)`

Parse and validate a Google Photos shared album URL.

**Parameters:**
- `url` (string): The album URL to parse

**Returns:**
- Object with validation result:
  - `valid` (boolean): Whether the URL is valid
  - `url` (string): The validated URL (if valid)
  - `albumId` (string): Extracted album ID (if valid)
  - `urlType` (string): Type of URL - 'short' or 'full' (if valid)
  - `error` (string): Error message (if invalid)
  - `errors` (Array<string>): Detailed validation errors (if invalid)

**Examples:**

```javascript
import { parseAlbumUrl } from './lib/url-parser.js';

// Valid short URL
const result1 = parseAlbumUrl('https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5');
console.log(result1);
// {
//   valid: true,
//   url: 'https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5',
//   albumId: 'QKGRYqfdS15bj8Kr5',
//   urlType: 'short'
// }

// Valid full URL with query params
const result2 = parseAlbumUrl('https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF?key=value');
console.log(result2);
// {
//   valid: true,
//   url: 'https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF?key=value',
//   albumId: 'AF1QipMZNuJ5JH6n3yF',
//   urlType: 'full'
// }

// Invalid URL
const result3 = parseAlbumUrl('https://invalid-url.com');
console.log(result3);
// {
//   valid: false,
//   error: 'URL must be from Google Photos (photos.app.goo.gl or photos.google.com)',
//   errors: ['URL must be from Google Photos (photos.app.goo.gl or photos.google.com)']
// }
```

### `extractAlbumId(url)`

Extract album ID from a Google Photos URL.

**Parameters:**
- `url` (string): The album URL

**Returns:**
- `string|null`: The extracted album ID, or null if not found

**Examples:**

```javascript
import { extractAlbumId } from './lib/url-parser.js';

extractAlbumId('https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5');
// Returns: 'QKGRYqfdS15bj8Kr5'

extractAlbumId('https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF');
// Returns: 'AF1QipMZNuJ5JH6n3yF'

extractAlbumId('https://invalid-url.com');
// Returns: null
```

### `isValidAlbumUrl(url)`

Check if a URL is a valid Google Photos shared album URL.

**Parameters:**
- `url` (string): The URL to validate

**Returns:**
- `boolean`: True if valid, false otherwise

**Examples:**

```javascript
import { isValidAlbumUrl } from './lib/url-parser.js';

isValidAlbumUrl('https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5');
// Returns: true

isValidAlbumUrl('https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF');
// Returns: true

isValidAlbumUrl('https://invalid-url.com');
// Returns: false
```

### `normalizeAlbumUrl(url)`

Normalize a Google Photos URL by removing query parameters and trailing slashes.

**Parameters:**
- `url` (string): The URL to normalize

**Returns:**
- `string|null`: The normalized URL, or null if invalid

**Examples:**

```javascript
import { normalizeAlbumUrl } from './lib/url-parser.js';

normalizeAlbumUrl('https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF?key=value');
// Returns: 'https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF'

normalizeAlbumUrl('https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF/');
// Returns: 'https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF'

normalizeAlbumUrl('https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5');
// Returns: 'https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5' (no changes for short URLs)
```

### `getErrorMessage(url)`

Get a user-friendly error message for an invalid URL.

**Parameters:**
- `url` (string): The invalid URL

**Returns:**
- `string`: User-friendly error message

**Examples:**

```javascript
import { getErrorMessage } from './lib/url-parser.js';

getErrorMessage('');
// Returns: 'Album URL is required. Please provide a Google Photos shared album link.'

getErrorMessage('https://invalid-url.com');
// Returns: 'URL must be from Google Photos (photos.app.goo.gl or photos.google.com)'
```

## Supported URL Formats

### Short URLs (photos.app.goo.gl)

Pattern: `https://photos.app.goo.gl/{shortcode}`

Examples:
- `https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5`
- `https://photos.app.goo.gl/ABC123xyz-_`

**Valid characters in shortcode**: A-Z, a-z, 0-9, hyphen (-), underscore (_)

### Full URLs (photos.google.com)

Pattern: `https://photos.google.com/share/{albumId}`

Examples:
- `https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF`
- `https://photos.google.com/share/AF1QipO4_Y5pseqWDPSlY7AAo0wmg76xW4gX0kOz8-p_`
- `https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF?key=value` (with query params)

**Valid characters in album ID**: A-Z, a-z, 0-9, hyphen (-), underscore (_)

## Error Messages

The parser provides clear, user-friendly error messages:

| Scenario | Error Message |
|----------|--------------|
| Empty/null URL | "Album URL is required. Please provide a Google Photos shared album link." |
| Wrong domain | "URL must be from Google Photos (photos.app.goo.gl or photos.google.com)" |
| Invalid format | "Invalid Google Photos URL format. Please provide a valid shared album link..." |
| Malformed URL | "Malformed URL. Please check the URL and try again." |
| Missing album ID | "Could not extract album ID from URL" |

## Validation Rules

1. **Required**: URL must not be empty or null
2. **Protocol**: Must use HTTPS (not HTTP)
3. **Domain**: Must be from `photos.app.goo.gl` or `photos.google.com`
4. **Format**: Must match one of the known URL patterns
5. **Album ID**: Must be extractable from the URL

## Edge Cases Handled

- ✅ Leading/trailing whitespace (automatically trimmed)
- ✅ Query parameters in full URLs
- ✅ Trailing slashes in full URLs
- ✅ Null or undefined inputs
- ✅ Non-string inputs (converted to string)
- ✅ Empty strings
- ✅ URLs from wrong domains (Google Drive, YouTube, etc.)
- ✅ HTTP URLs (must be HTTPS)
- ✅ Malformed URLs (missing protocol, typos, etc.)
- ✅ Special characters in album IDs

## Testing

The parser has 42 comprehensive test cases covering:

- Valid short URLs (3 tests)
- Valid full URLs (5 tests)
- Invalid URLs - wrong domain (4 tests)
- Invalid URLs - malformed (5 tests)
- Edge cases (6 tests)
- Album ID extraction (6 tests)
- Helper functions (4 tests)
- URL normalization (4 tests)
- Error messages (3 tests)
- Integration workflows (2 tests)

Run tests:

```bash
npm test
```

Or run URL parser tests specifically:

```bash
node scripts/test-url-parser.js
```

## Integration Example

Here's a complete example of how to use the parser in a settings form:

```javascript
import { parseAlbumUrl, getErrorMessage } from './lib/url-parser.js';

function handleAlbumUrlSubmit(userInput) {
  // Parse and validate the URL
  const result = parseAlbumUrl(userInput);
  
  if (!result.valid) {
    // Show error to user
    console.error('Invalid URL:', result.error);
    return { success: false, error: result.error };
  }
  
  // Use the validated data
  console.log('Album ID:', result.albumId);
  console.log('URL Type:', result.urlType);
  
  // Store or process the album
  return {
    success: true,
    albumId: result.albumId,
    url: result.url
  };
}

// Example usage
handleAlbumUrlSubmit('https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5');
// { success: true, albumId: 'QKGRYqfdS15bj8Kr5', url: '...' }

handleAlbumUrlSubmit('https://invalid-url.com');
// { success: false, error: 'URL must be from Google Photos...' }
```

## Performance

- ⚡ Fast validation using regex patterns
- 🎯 Minimal dependencies (only Zod for schema validation)
- 🔒 Safe input handling (null, undefined, whitespace)
- 📦 Small bundle size (~6KB)

## Future Enhancements

Potential improvements for future versions:

- [ ] Support for legacy URL formats (pre-2018)
- [ ] Async validation with actual album existence check
- [ ] Custom error message localization
- [ ] URL redirect resolution for shortened URLs
- [ ] TypeScript type definitions

## Related Documentation

- [GOOGLE_PHOTOS_API.md](./GOOGLE_PHOTOS_API.md) - API investigation and reverse engineering
- [PRD_Full_Technical.md](./PRD_Full_Technical.md) - Complete technical specifications
- [FOLLOW_UP_TASKS.md](./FOLLOW_UP_TASKS.md) - Implementation roadmap

---

**Last Updated**: January 18, 2026  
**Status**: ✅ Complete (Issue #3)
