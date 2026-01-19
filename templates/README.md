# TRMNL Templates

This directory contains the Liquid templates for the Google Photos TRMNL plugin.

## Template Files

### Main Templates
These templates are uploaded to TRMNL's Markup Editor and used in production:

- **`full.liquid`** - Full-screen layout (entire TRMNL display)
- **`half_horizontal.liquid`** - Half-size horizontal layout (wide format)
- **`half_vertical.liquid`** - Half-size vertical layout (tall format)
- **`quadrant.liquid`** - Quarter-size layout (compact display)
- **`shared.liquid`** - Shared assets and variables (Google Photos icon, data structure documentation)

### Preview Templates (`preview/`)
Mirror versions of main templates with hardcoded sample data for local testing:

- **`preview/full.liquid`** - Full layout with placeholder data
- **`preview/half_horizontal.liquid`** - Half horizontal with placeholder data
- **`preview/half_vertical.liquid`** - Half vertical with placeholder data
- **`preview/quadrant.liquid`** - Quadrant with placeholder data

**Note**: Preview templates use `https://picsum.photos/800/480?grayscale` for images and hardcoded text. They mirror the structure of main templates but don't require API calls.

## Template Data Structure

Templates receive JSON data from the backend API (`/api/photo`):

```json
{
  "photo_url": "https://lh3.googleusercontent.com/...=w1040-h780",
  "thumbnail_url": "https://lh3.googleusercontent.com/...=w400-h300",
  "caption": "Photo caption/description",
  "timestamp": "2026-01-19T14:00:00Z",
  "album_name": "My Google Photos Album",
  "photo_count": 142,
  "metadata": {
    "uid": "unique-photo-id",
    "original_width": 4032,
    "original_height": 3024,
    "image_update_date": "2026-01-15T10:30:00Z",
    "album_add_date": "2026-01-10T08:00:00Z"
  }
}
```

## Usage in TRMNL

1. **Upload to Markup Editor**: Copy the contents of main template files to TRMNL's Markup Editor
2. **Include Shared Assets**: Ensure `shared.liquid` is included for Google Photos icon
3. **Configure Plugin Settings**: User provides Google Photos shared album URL
4. **API Response**: Worker returns JSON, TRMNL merges into template
5. **Display**: Rendered content sent to e-ink device

## TRMNL Framework v2

Templates use TRMNL Framework v2 responsive utilities:

- **Size breakpoints**: `sm:` (600px+), `md:` (800px+), `lg:` (1024px+)
- **Bit-depth variants**: `1bit:`, `2bit:`, `4bit:`, `8bit:`
- **Orientation**: `portrait:` for portrait-specific styles

## Development

**Synchronization Rule**: When modifying main templates, update corresponding preview templates to maintain structural consistency.

**Testing**:
- Main templates: Test via TRMNL Markup Editor with actual API
- Preview templates: Test locally in `index.html` (no API required)

## Architecture

- **Backend**: Cloudflare Worker returns JSON (stateless polling strategy)
- **Rendering**: TRMNL platform merges JSON into templates
- **Display**: Optimized for e-ink devices (800×480 TRMNL OG, 1040×780 TRMNL X)

For more details, see [API Documentation](../docs/API_DOCUMENTATION.md) and [Architecture](../docs/ARCHITECTURE.md).
