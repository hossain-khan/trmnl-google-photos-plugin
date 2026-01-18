# TRMNL Google Photos Shared Album Plugin - Copilot Instructions

> **Repository**: [hossain-khan/trmnl-google-photos-plugin](https://github.com/hossain-khan/trmnl-google-photos-plugin)  
> **Author**: Hossain Khan  
> **Last Updated**: January 2026

## Project Overview

This is a TRMNL plugin that displays random photos from Google Photos shared albums without requiring OAuth authentication. Users simply paste their shared album link, and photos are automatically fetched and displayed on their TRMNL e-ink devices. The plugin leverages the TRMNL Framework v2 to create responsive, adaptive layouts that work across all TRMNL devices.

### Key Goals

1. **Simplicity**: Match Apple Photos plugin UX (paste link → photos display)
2. **No Authentication**: Avoid OAuth or Google account linking
3. **Reliability**: 99%+ uptime for photo fetching
4. **Performance**: Photo refresh in <3 seconds

### Current Status

**Phase 1: Project Setup** ✅ **Complete** (January 2026)
- Project structure created with all necessary directories
- Four Liquid templates built and tested
- Comprehensive documentation written
- Settings and configuration files ready
- URL parser implemented and tested (42 test cases)
- Photo fetcher proven with library integration

**Phase 2: Backend Development** 🚧 **In Progress** (40% Complete)
- ✅ Google Photos API reverse engineering (Issue 1)
- ✅ URL parser implementation (Issue 3)
- 🚧 Next.js backend infrastructure (Issue 2 - Next)
- 📋 Album metadata fetcher (Issue 4)
- 📋 S3 caching layer (Issue 5)
- 📋 Settings page UI (Issue 6)
- 📋 Preview page (Issue 7)

See `docs/PHASE_1_COMPLETE.md` and `docs/FOLLOW_UP_TASKS.md` for detailed status and next steps.

## Getting Started

For developers working on this project:

1. **Understand the Project**: Read this file completely for comprehensive context
2. **Review Documentation**: 
   - `README.md` - Project overview and status
   - `docs/PRD_Full_Technical.md` - Complete technical requirements
   - `docs/PHASE_1_COMPLETE.md` - What's been completed
   - `docs/FOLLOW_UP_TASKS.md` - What needs to be done
3. **Test Templates**: Open `index.html` in a browser to preview layouts
4. **Modify Data**: Edit `data.json` to test with different photo data
5. **Phase 2 Work**: Start with Issue 1 (Google Photos API research) from `docs/FOLLOW_UP_TASKS.md`

## Project Structure

```
trmnl-google-photos-plugin/
├── .github/                      # GitHub configuration
│   ├── workflows/               # GitHub Actions
│   │   └── pages.yml           # Deploy to GitHub Pages
│   └── copilot-instructions.md  # This file
├── assets/                       # Design assets
│   ├── icon/                    # Plugin icons (placeholder)
│   └── demo/                    # Demo screenshots (placeholder)
├── docs/                         # Documentation
│   ├── NEW_RECIPE_GUIDE.md      # Guide for creating TRMNL recipes
│   ├── PRD_Full_Technical.md    # Full Product Requirements Document
│   ├── PRD_TRMNL_Google_Photos_Plugin.md  # Original PRD
│   ├── PHASE_1_COMPLETE.md      # Phase 1 completion summary
│   └── FOLLOW_UP_TASKS.md       # Phase 2-4 task breakdown
├── templates/                    # Liquid templates for layouts
│   ├── full.liquid              # Full-screen layout
│   ├── half_horizontal.liquid   # Half-size horizontal layout
│   ├── half_vertical.liquid     # Half-size vertical layout
│   └── quadrant.liquid          # Quarter-size layout
├── scripts/                      # Build and automation scripts
│   └── fetch-photos.js          # Photo fetching script (placeholder for Phase 2)
├── data.json                     # Sample photo data for templates
├── index.html                    # Preview/testing page
├── settings.yml                  # Plugin settings configuration
├── LICENSE                       # MIT License
└── .gitignore                    # Git ignore patterns
```

## Key Files

- **templates/*.liquid**: Four layout templates that adapt to different display sizes and orientations
- **lib/url-parser.js**: URL parser and validator for Google Photos shared albums
- **scripts/fetch-photos.js**: Photo fetching implementation using `google-photos-album-image-url-fetch`
- **settings.yml**: TRMNL plugin configuration (webhook strategy, refresh frequency)
- **data.json**: Sample data for testing templates locally
- **index.html**: Preview/testing page
- **docs/PHASE_1_COMPLETE.md**: Summary of completed Phase 1 work
- **docs/FOLLOW_UP_TASKS.md**: Detailed breakdown of Phase 2-4 tasks

## TRMNL Framework v2

### Device Specifications

| Device | Width | Height | Bit Depth | Display Type |
|--------|-------|--------|-----------|--------------|
| TRMNL OG | 800px | 480px | 1-bit | Monochrome (2 shades) |
| TRMNL OG V2 | 800px | 480px | 2-bit | Grayscale (4 shades) |
| TRMNL V2 | 1024px | 758px | 4-bit | Grayscale (16 shades) |
| Kindle 2024 | 600px | 800px | 4-bit | Grayscale (16 shades) |

### Responsive System

The framework uses a **mobile-first** approach with three responsive dimensions:

#### 1. Size-Based Breakpoints (Progressive)

- `sm:` - 600px+ (Kindle 2024)
- `md:` - 800px+ (TRMNL OG, OG V2)
- `lg:` - 1024px+ (TRMNL V2)

**Usage**: `md:value--large lg:value--xlarge` (applies at breakpoint and above)

#### 2. Bit-Depth Variants (Specific)

- `1bit:` - Monochrome (2 shades) - TRMNL OG
- `2bit:` - Grayscale (4 shades) - TRMNL OG V2
- `4bit:` - Grayscale (16 shades) - TRMNL V2, Kindle

**Usage**: `1bit:bg--black 2bit:bg--gray-45 4bit:bg--gray-75` (each targets only that bit-depth)

#### 3. Orientation-Based (Specific)

- `portrait:` - Portrait orientation only (landscape is default)

**Usage**: `flex--row portrait:flex--col`

#### 4. Combined Modifiers

Pattern: `size:orientation:bit-depth:utility`

Example: `md:portrait:4bit:flex--col` (medium+ screens, portrait, 4-bit display)

### Core Utilities

#### Layout

- **Flexbox**: `flex flex--row`, `flex--col`, `flex--center-y`, `flex--center-x`, `flex--between`, `gap--small`, `gap--medium`
- **Grid**: `grid grid--cols-2`, `grid--cols-3`, `gap--xsmall`
- **Sizing**: `w--40`, `w--52`, `min-w--40`, `h--36`
- **Spacing**: `p--2`, `mb--xsmall`, `mb--small`, `my--24`

#### Typography

- **Title**: `title title--small`, `title--large`, `title--xlarge` (for headings, names)
- **Value**: `value value--small`, `value--xlarge`, `value--xxlarge`, `value--xxxlarge` (for numbers, symbols)
- **Label**: `label label--small`, `label--inverted` (for categories, badges)
- **Description**: `description` (for body text)

#### Visual

- **Background**: `bg--white`, `bg--gray-50`
- **Border**: `outline`, `rounded`, `rounded--large`
- **Alignment**: `text--center`, `text--left`

#### Modulations

- **data-value-fit**: Automatically resizes text to fit container
  - `data-value-fit="true"` - Enable fitting
  - `data-value-fit-max-height="120"` - Set maximum height
- **data-clamp**: Truncate text to specific lines
  - `data-clamp="1"` - Show 1 line, truncate rest

## Layout System

### Four Layout Types

The plugin provides four layouts for different display configurations:

#### 1. Full Layout (`full.liquid`)

**Use Case**: Full-screen display (entire TRMNL screen)

**Key Features**:
- Large photo display area (90% of screen height)
- Optional caption below photo (truncated to 2 lines)
- Photo count badge in title bar
- Error state for unconfigured plugin

**Layout Structure**:
```liquid
<div class="flex flex--col gap--small h--full">
  <div class="flex flex--center-x flex--center-y" style="flex: 1;">
    <img src="{{ photo.photo_url }}" class="image image--contain">
  </div>
  {% if photo.caption %}
  <div class="description" data-clamp="2">{{ photo.caption }}</div>
  {% endif %}
</div>
```

**Critical Learnings**:
- Use `flex: 1` to make photo area fill available space
- `image--contain` ensures photo fits without cropping
- `data-clamp="2"` prevents long captions from taking too much space
- Always provide error state for unconfigured albums

#### 2. Half Horizontal Layout (`half_horizontal.liquid`)

**Use Case**: Half-size horizontal display (abundant horizontal space, minimal vertical)

**Key Features**:
- Flex row layout with photo on left, caption on right
- Vertical centering: `flex--center-y`
- Portrait mode fallback: `portrait:flex--col`
- Photo count badge in caption area

**Layout Structure**:
```liquid
<div class="flex flex--row gap--medium portrait:flex--col flex--center-y">
  <div class="flex flex--center-x flex--center-y" style="flex: 1;">
    <img src="{{ photo.photo_url }}" class="image image--contain">
  </div>
  <div class="flex flex--col gap--xsmall" style="max-width: 200px;">
    <span class="description" data-clamp="4">{{ photo.caption }}</span>
  </div>
</div>
```

**Critical Learnings**:
- Horizontal layouts benefit from side-by-side photo + caption
- Limit caption width to prevent it from dominating the layout
- Use `portrait:flex--col` for graceful degradation on portrait screens

#### 3. Half Vertical Layout (`half_vertical.liquid`)

**Use Case**: Half-size vertical display

**Key Features**:
- Maximizes photo display area (85% of height)
- Compact caption below (2 lines max)
- Minimal padding to maximize space

**Critical Learnings**:
- Vertical layouts should prioritize photo over caption
- Reduce padding (`p--2`) for more photo space
- Keep caption concise with `data-clamp="2"`

#### 4. Quadrant Layout (`quadrant.liquid`)

**Use Case**: Quarter-size display (most compact)

**Key Features**:
- Photo only, no caption
- Minimal padding (`p--1`)
- Photo fills entire space
- Simplified title bar

**Critical Learnings**:
- Smallest layout drops caption entirely
- Focus on clean photo display
- Every pixel counts in quadrant layouts

## Design Patterns & Best Practices

### 1. Photo Display Pattern

Standard pattern for displaying photos across layouts:

```liquid
<div class="flex flex--center-x flex--center-y" style="flex: 1;">
  <img src="{{ photo.photo_url }}" 
       alt="{{ photo.caption }}" 
       class="image image--contain"
       style="max-width: 100%; max-height: 100%; object-fit: contain;">
</div>
```

**Key Points**:
- Always use `flex--center-x flex--center-y` to center photos
- `image--contain` ensures photo fits without cropping
- `object-fit: contain` maintains aspect ratio
- Use `flex: 1` on parent to fill available space
- Always provide alt text for accessibility

### 2. Caption Handling

For captions that may be very long:

```liquid
{% if photo.caption %}
<div class="text--center">
  <span class="description" data-clamp="2">{{ photo.caption }}</span>
</div>
{% endif %}
```

**Why**:
- `data-clamp="2"` truncates to 2 lines, preventing layout overflow
- Always wrap in conditional to handle missing captions
- Use `description` class for appropriate font sizing
- Center captions for better visual balance

### 3. Error States

Always provide helpful error states for unconfigured plugins:

```liquid
{% if photo.photo_url %}
  <!-- Display photo -->
{% else %}
  <div class="flex flex--col flex--center-x flex--center-y gap--medium h--full">
    <div class="value value--large text--center">📷</div>
    <div class="title title--medium text--center">No Photos Available</div>
    <div class="description text--center">
      Please configure your Google Photos shared album URL in the plugin settings.
    </div>
  </div>
{% endif %}
```

**Why**:
- Users need clear guidance when plugin isn't configured
- Emoji provides visual feedback (📷)
- Instructions should be actionable
- Error state should be visually distinct but not alarming

### 4. Responsive Sizing Strategy

**Image sizing**:
- Use percentage-based sizing: `max-width: 100%; max-height: 100%`
- Let container control size via `flex: 1`
- Always use `object-fit: contain` to prevent cropping

**Text sizing**:
- Use framework classes: `description`, `title`, `value`
- Use `data-clamp` to prevent overflow
- Adjust font size for compact layouts (quadrant uses smaller sizes)

### 5. Layout Padding Strategy

- **Full layout**: `p--2` (standard padding for breathing room)
- **Half layouts**: `p--2` (same as full)
- **Quadrant layout**: `p--1` (minimal padding to maximize space)

Use consistent padding unless space constraints require reduction.

## Common Issues & Solutions

### Issue 1: Photo Not Displaying

**Problem**: Photo doesn't appear or shows broken image icon

**Solution**:
- Check `photo.photo_url` is valid and accessible
- Ensure URL is HTTPS (TRMNL requires secure connections)
- Test image URL in browser first
- Add error state fallback for failed loads

### Issue 2: Caption Overflowing

**Problem**: Long captions push photo out of view

**Solution**:
- Use `data-clamp="2"` or `data-clamp="4"` to limit lines
- Set `max-width` on caption container (e.g., `style="max-width: 200px"`)
- Wrap caption in conditional to handle missing captions

### Issue 3: Photo Aspect Ratio Issues

**Problem**: Photo appears stretched or cropped incorrectly

**Solution**:
- Always use `object-fit: contain` to maintain aspect ratio
- Use `image--contain` class from TRMNL framework
- Center photo with `flex--center-x flex--center-y`
- Let container size control photo size via `flex: 1`

### Issue 4: Layout Looks Different on Different Devices

**Problem**: Layout breaks on certain TRMNL screen sizes

**Solution**:
- Test all four device sizes (see Device Specifications above)
- Use responsive breakpoints: `md:`, `lg:` for size-specific adjustments
- Use `portrait:` prefix for portrait-specific styles
- Keep layouts simple - complexity increases breakage risk

### Issue 5: Empty State Not Showing

**Problem**: No feedback when plugin unconfigured

**Solution**:
- Always check `{% if photo.photo_url %}` before displaying photo
- Provide clear else block with instructions
- Include visual indicator (emoji) for better UX
- Center error state content for visual balance

## Data Structure

### Photo Data Format

```json
{
  "photo_url": "https://lh3.googleusercontent.com/...",
  "thumbnail_url": "https://lh3.googleusercontent.com/.../w400-h300",
  "caption": "Beautiful sunset at the beach",
  "timestamp": "2026-01-18T14:00:00Z",
  "album_name": "Summer Vacation 2026",
  "photo_count": 142
}
```

**Field Descriptions**:
- `photo_url` (required): Full-resolution photo URL (optimized for e-ink)
- `thumbnail_url` (optional): Lower resolution version (not currently used)
- `caption` (optional): Photo caption/description from Google Photos
- `timestamp` (optional): When photo was taken or last updated
- `album_name` (optional): Name of the source album
- `photo_count` (optional): Total photos in album (for display in title bar)

### Accessing Data in Templates

```liquid
<!-- Photo URL -->
{{ photo.photo_url }}

<!-- Caption (with fallback) -->
{{ photo.caption | default: "No caption" }}

<!-- Photo count -->
{% if photo.photo_count > 0 %}
  {{ photo.photo_count }} photos
{% endif %}

<!-- Plugin settings -->
{{ trmnl.plugin_settings.instance_name }}
{{ trmnl.plugin_settings.shared_album_url }}
```

## Testing Strategy

### Test Scenarios

Critical scenarios to test:

1. **Happy Path**:
   - Valid shared album URL with multiple photos
   - Photos display correctly in all four layouts
   - Captions truncate properly
   - Photo count shows in title bar

2. **Edge Cases**:
   - Empty album (0 photos)
   - Album with 1 photo only
   - Very long captions (100+ characters)
   - Photos with various aspect ratios (square, landscape, portrait)
   - Album URL that becomes invalid

3. **Error States**:
   - No album URL configured (initial state)
   - Invalid album URL format
   - Album link sharing disabled
   - Album deleted by owner
   - Network errors fetching photos

### Manual Testing Checklist

- [ ] Test on TRMNL simulator for all device sizes
- [ ] Verify each layout (full, half_horizontal, half_vertical, quadrant)
- [ ] Test with photos of different aspect ratios
- [ ] Verify caption truncation with long text
- [ ] Check error states display properly
- [ ] Verify title bar shows correct instance name
- [ ] Test portrait mode rendering (if applicable)
- [ ] Check photo centering and sizing

### Device Testing

Test across all TRMNL devices:
- **Kindle 2024**: 600x800px (portrait), 4-bit
- **TRMNL OG**: 800x480px (landscape), 1-bit
- **TRMNL OG V2**: 800x480px (landscape), 2-bit
- **TRMNL V2**: 1024x758px (landscape), 4-bit

## Code Style Guidelines

1. **Use semantic class names**: `title`, `value`, `label`, `description`
2. **Follow mobile-first responsive**: Base styles first, then `md:`, then `lg:`
3. **Always provide error states**: Users need feedback when plugin unconfigured
4. **Center photos**: Use `flex--center-x flex--center-y` for all photo displays
5. **Truncate captions**: Use `data-clamp` to prevent overflow
6. **Test all layouts**: Changes should work across all four layout types
7. **Add conditional rendering**: Check for data existence before displaying
8. **Use framework utilities**: Prefer TRMNL classes over custom CSS
9. **Test with real photos**: Use actual Google Photos URLs, not placeholders

## Development Notes

**About This Document**: These copilot instructions were specifically created for the Google Photos Shared Album plugin. The structure and patterns are inspired by TRMNL best practices and adapted from the TRMNL Elements plugin template, but all content has been tailored to this project's unique requirements:
- Photo display and image handling patterns
- Google Photos API integration approach
- Four layout template system
- Error state handling for unconfigured albums
- Phase-based implementation strategy

**Key Differences from Other TRMNL Plugins**:
- Uses reverse-engineered Google Photos API (no OAuth)
- Image-centric layouts vs data/text layouts
- Focuses on responsive photo display
- Handles various aspect ratios and resolutions

## Implementation Phases

### Phase 1: Project Setup ✅ (Completed)
- [x] Created directory structure
- [x] Added settings.yml configuration
- [x] Built four Liquid templates
- [x] Created preview page (index.html)
- [x] Set up GitHub Pages deployment
- [x] Updated README and copilot-instructions
- [x] Documented all follow-up tasks

**Completion Date**: January 18, 2026  
**See**: `docs/PHASE_1_COMPLETE.md` for detailed completion summary

### Phase 2: Backend Development 🚧 (Next)

**Week 1: Research & Reverse Engineering**
- [ ] Analyze Google Photos shared album URL formats
- [ ] Use browser DevTools to discover API endpoints
- [ ] Build proof-of-concept photo fetcher script
- [ ] Document API request/response structure
- [ ] Test with multiple shared albums

**Week 2: Core Backend**
- [ ] Set up Next.js 15 project with TypeScript
- [ ] Create DynamoDB schema for user data
- [ ] Build URL parser with regex validation
- [ ] Implement album metadata fetcher
- [ ] Add S3 caching layer (24hr TTL)
- [ ] Error handling and retry logic

**Week 3: Web Interface**
- [ ] Build settings page UI (Next.js route)
- [ ] Create preview page with random photo display
- [ ] Add form validation for album URLs
- [ ] Implement photo refresh endpoint
- [ ] Mobile-responsive design

### Phase 3: TRMNL Integration 📋 (Planned)

**Week 4: Integration & Jobs**
- [ ] Implement `/markup` POST endpoint for TRMNL
- [ ] Add webhook handlers (install/uninstall)
- [ ] Set up Hatchet workflow for daily refresh
- [ ] Random photo selection logic
- [ ] Render HTML for e-ink display

**Week 5: Monitoring & Polish**
- [ ] Add Sentry error tracking
- [ ] CloudWatch logging and alarms
- [ ] Rate limiting implementation
- [ ] Analytics tracking (render count)
- [ ] Documentation and user guides

### Phase 4: Launch 📋 (Planned)

**Week 6-7: Testing**
- [ ] Alpha testing with internal users
- [ ] Security audit and CodeQL checks
- [ ] Load testing (1000+ concurrent users)
- [ ] Cross-device testing (all TRMNL devices)
- [ ] Bug fixes and optimization

**Week 8: Beta & GA**
- [ ] Beta launch to 100 users
- [ ] Gather feedback and iterate
- [ ] Final polish and fixes
- [ ] TRMNL marketplace submission
- [ ] Public announcement

## Workflow

Planned workflow (Phase 2+):
1. **User Setup**: User pastes shared album URL in settings page
2. **Album Crawl**: Backend fetches album metadata, caches in S3
3. **Daily Refresh**: Cron job updates album metadata every 24 hours
4. **TRMNL Request**: Device requests `/markup` endpoint
5. **Random Selection**: Backend selects random photo from cache
6. **HTML Rendering**: Server-side renders HTML for e-ink
7. **Display**: Photo appears on device

## Technical Stack

### Planned (Phase 2+)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: AWS DynamoDB (user data)
- **Storage**: AWS S3 (album metadata cache)
- **Jobs**: Hatchet (background refresh)
- **Monitoring**: Sentry + CloudWatch
- **Deployment**: Vercel

## Future Considerations

- Support for private albums (requires OAuth - deferred to v2.0)
- Video thumbnail support (photos only in v1.0)
- Multiple albums per user (single album in v1.0)
- Photo filters (date range, tags) - deferred
- Custom refresh schedules (fixed 1hr in v1.0)
- Photo upload functionality - out of scope
- Real-time sync (<1hr latency acceptable for v1.0)
