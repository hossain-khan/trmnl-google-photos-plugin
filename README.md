# 📷 Google Photos Shared Album for TRMNL

<img src="assets/icon/google-photos-icon.png" align="right" alt="Google Photos Icon" width="60"/>

Display random photos from your Google Photos shared albums on TRMNL e-ink displays — no OAuth, no complex setup. Just paste your shared album link and enjoy your memories!

> "Your photos deserve to be displayed, not buried in the cloud."

## 🚀 Status

**Phase 1: Initial Setup** ✅ (Complete)
- [x] Project structure created
- [x] Basic templates for all layouts
- [x] Preview page created
- [x] Core library modules

**Phase 2: Backend Development** 🚧 (In Progress)
- [x] ✅ **Reverse engineering Google Photos API** (Issue 1 - Complete!)
  - Discovered proven library: `google-photos-album-image-url-fetch`
  - Created proof-of-concept implementation
  - Documented approach in `docs/GOOGLE_PHOTOS_API.md`
  - Validated with comprehensive tests
- [x] ✅ **URL parser for Google Photos shared albums** (Issue 3 - Complete!)
  - Implemented Zod schema validation
  - Support for short URLs (`photos.app.goo.gl`) and full URLs
  - Album ID extraction from all URL formats
  - 42 comprehensive test cases covering all scenarios
  - User-friendly error messages
- [x] ✅ **Cloudflare Worker infrastructure setup** (Issue 2 - Complete!)
  - Wrangler CLI and TypeScript configuration
  - Hono framework integration
  - Basic health check endpoints (/ and /health)
  - Development environment with hot reload
  - Deployment scripts ready
- [x] ✅ **Build JSON API endpoint** (Issue 4 - Complete!)
  - GET /api/photo endpoint with TRMNL Polling strategy
  - Fetches random photos from Google Photos albums
  - Returns JSON data for all four template layouts
  - Comprehensive error handling and validation
  - Works with 95%+ of valid shared album URLs
- [x] ✅ **Optional KV caching for performance** (Issue 5 - Complete!)
  - ✅ **Deployed to Production** - January 18, 2026
  - Cloudflare KV integration for album photo caching
  - 1-hour TTL for cached album data
  - 80%+ reduction in Google Photos API calls
  - Response time **67ms** for cached albums (20x faster!)
  - Graceful fallback when cache unavailable
  - Comprehensive documentation and tests
  - See: `docs/KV_CACHING_SETUP.md` for setup details

**Phase 2 Complete!** 🎉 All backend components deployed and operational.

**Phase 3: TRMNL Integration** 📋 (Next Up)
- [ ] `/markup` endpoint for TRMNL
- [ ] Webhook handlers (install/uninstall)
- [ ] Background refresh jobs
- [ ] Monitoring and error tracking

**Phase 4: Launch** 📋 (Planned)
- [ ] Security audit and testing
- [ ] Beta testing
- [ ] Documentation
- [ ] TRMNL marketplace submission

## ✨ Features (Planned)

- **Zero OAuth** - No Google account connection required
- **Simple Setup** - Just paste your shared album link
- **Auto Refresh** - New photos appear automatically
- **Four Layouts** - Full, Half Horizontal, Half Vertical, Quadrant
- **Responsive** - Optimized for all TRMNL devices
- **Random Selection** - Different photo each time

## 📦 Installation (Coming Soon)

Once published to TRMNL marketplace:

1. Visit [TRMNL Plugins](https://usetrmnl.com/plugins)
2. Search for "**Google Photos Shared Album**"
3. Click **Install**
4. Paste your Google Photos shared album URL
5. Add to your [Playlist](https://usetrmnl.com/playlists)

## 🎨 Layouts

| Layout | Description | Best For |
|--------|-------------|----------|
| **Full** | Entire screen dedicated to photo | Single large display |
| **Half Horizontal** | Wide layout with caption | Landscape photos |
| **Half Vertical** | Tall layout | Portrait photos |
| **Quadrant** | Compact quarter size | Multiple plugins |

## 🛠️ Development

This plugin is built following the [NEW_RECIPE_GUIDE.md](docs/NEW_RECIPE_GUIDE.md) structure.

### Project Structure

```
trmnl-google-photos-plugin/
├── src/                          # Cloudflare Worker source code
│   ├── index.ts                 # Worker entry point (Hono app)
│   └── README.md                # Worker documentation
├── lib/                          # Core library modules
│   └── url-parser.js            # URL parser & validator
├── scripts/                      # Build and automation scripts
│   ├── fetch-photos.js          # Photo fetching script
│   ├── investigate-api.js       # API investigation tool
│   ├── test-fetch.js            # Fetch tests
│   └── test-url-parser.js       # URL parser tests (42 cases)
├── assets/                       # Design assets
│   ├── icon/                    # Plugin icons
│   ├── demo/                    # Demo screenshots
│   └── raw/                     # Source files
├── docs/                         # Documentation
│   ├── NEW_RECIPE_GUIDE.md      # TRMNL recipe guide
│   ├── PRD_Full_Technical.md    # Full technical PRD
│   └── GOOGLE_PHOTOS_API.md     # API investigation docs
├── templates/                    # Liquid templates
│   ├── full.liquid              # Full-screen layout
│   ├── half_horizontal.liquid   # Half horizontal layout
│   ├── half_vertical.liquid     # Half vertical layout
│   └── quadrant.liquid          # Quadrant layout
├── .github/                      # GitHub configuration
│   ├── workflows/               # GitHub Actions
│   └── copilot-instructions.md  # Copilot development guide
├── wrangler.toml                 # Cloudflare Workers configuration
├── tsconfig.json                 # TypeScript configuration
├── index.html                    # Preview/testing page
├── settings.yml                  # TRMNL plugin configuration
├── DEPLOYMENT.md                 # Deployment guide for Cloudflare
└── data.json                     # Sample data for testing
```

### Worker Development

The Cloudflare Worker handles photo fetching and rendering:

```bash
# Start local development server
npm run dev

# Test endpoints
curl http://localhost:8787/
curl http://localhost:8787/health

# Run TypeScript type checking
npm run types

# Deploy to production
npm run deploy

# Deploy to development environment
npm run deploy:dev
```

**Worker Endpoints:**
- `GET /` - Service information and health status
- `GET /health` - Health check endpoint
- `GET /api/photo` - JSON API for TRMNL (Polling strategy)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions and [src/README.md](src/README.md) for worker architecture details.

### URL Parser Usage

The URL parser validates and extracts album IDs from Google Photos shared album URLs:

```javascript
import { parseAlbumUrl, isValidAlbumUrl, extractAlbumId } from './lib/url-parser.js';

// Validate and parse a URL
const result = parseAlbumUrl('https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5');
console.log(result);
// {
//   valid: true,
//   url: 'https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5',
//   albumId: 'QKGRYqfdS15bj8Kr5',
//   urlType: 'short'
// }

// Quick validation check
isValidAlbumUrl('https://photos.app.goo.gl/FB8ErkX2wJAQkJzV8'); // true
isValidAlbumUrl('https://invalid-url.com'); // false

// Extract album ID
extractAlbumId('https://photos.google.com/share/AF1QipMZNuJ5JH6n3yF'); 
// Returns: 'AF1QipMZNuJ5JH6n3yF'
```

**Supported URL Formats**:
- Short URLs: `https://photos.app.goo.gl/{shortcode}`
- Full URLs: `https://photos.google.com/share/{albumId}`
- Full URLs with query params: `https://photos.google.com/share/{albumId}?key=value`

Run tests with: `npm test`

### Preview

Visit the preview page: [https://hossain-khan.github.io/trmnl-google-photos-plugin/](https://hossain-khan.github.io/trmnl-google-photos-plugin/)

## 📋 Technical Details

- **Strategy**: `webhook` - Cloudflare Worker serves dynamic HTML to TRMNL
- **Refresh**: Every hour (3600 seconds)
- **Framework**: TRMNL Framework v2 with responsive layouts
- **Backend**: Hono + TypeScript on Cloudflare Workers (in development)
- **Caching**: Cloudflare KV (optional, for performance optimization)
  - 1-hour TTL for cached album data
  - 80%+ reduction in API calls
  - Response time <500ms for cached albums
  - See [KV Caching Setup Guide](docs/KV_CACHING_SETUP.md)
- **Architecture**: Fully stateless - no user data stored
- **Deployment**: Cloudflare Workers

## ⚠️ Important Notes

### Legal & ToS Considerations

This plugin uses **reverse-engineered endpoints** from Google Photos to access shared albums without OAuth. This approach:

- ✅ Only accesses **publicly shared** albums (same as viewing in browser)
- ✅ Does **not** store actual photos, only URLs/metadata
- ⚠️ May violate Google's Terms of Service (similar to Apple Photos plugin)
- ⚠️ Could break if Google changes their API

**Use at your own risk.** We recommend having a fallback plan if Google blocks this functionality.

## 🤝 Contributing

This project is in active development. Contributions welcome!

1. Review the [PRD](docs/PRD_Full_Technical.md)
2. Check [copilot-instructions.md](.github/copilot-instructions.md) for development guidelines
3. Fork and create a feature branch
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- Inspired by the TRMNL Apple Photos plugin by [@zegl](https://github.com/zegl/trmnl-apple-photos)
- Built for the amazing [TRMNL](https://usetrmnl.com) community
- Technical guidance from [NEW_RECIPE_GUIDE.md](docs/NEW_RECIPE_GUIDE.md)

---

**For Developers:** See [docs/PRD_Full_Technical.md](docs/PRD_Full_Technical.md) for complete technical specifications.
