# Web Assets

Static web files for the Google Photos TRMNL Plugin demo page.

## Files

### `styles.css`
Main stylesheet for the demo page. Contains:
- Responsive design with mobile-first approach
- Media queries for breakpoints: 1024px (desktop), 768px (tablet), 600px (mobile)
- Component styles: demo-section, metadata-container, action-buttons, status-badge, etc.
- Animations: pulse, spin, fadeIn, zoomIn
- Lightbox and preview panel styles

### `script.js`
JavaScript functionality for the demo page. Contains:
- API integration and photo fetching
- Lightbox modal viewer
- Photo download with timestamped filenames
- Clipboard copy functionality
- Service health checking
- Event listeners for user interactions

## Usage

Both files are referenced in the main `index.html`:

```html
<link rel="stylesheet" href="assets/www/styles.css">
<script src="assets/www/script.js"></script>
```

## Development

When updating styles or JavaScript:
1. Edit the respective file in this directory
2. Changes will be reflected immediately in the demo page
3. No need to modify `index.html` for style or script changes
4. Commit changes separately for better git history

## Performance Notes

- CSS is served with TRMNL framework styles via CDN
- JavaScript uses Fetch API for all network requests
- Image optimization via Google Photos URL parameters (`=wWIDTH-hHEIGHT`)
- Responsive images load appropriately for device size
