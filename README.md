# 📷 Google Photos Shared Album for TRMNL

<img src="assets/icon/icon.png" align="right" alt="Google Photos Icon" width="120"/>

Display random photos from your Google Photos shared albums on TRMNL e-ink displays — no OAuth, no complex setup. Just paste your shared album link and enjoy your memories!

> "Your photos deserve to be displayed, not buried in the cloud."

## 🚀 Status

**Phase 1: Initial Setup** ✅ (Complete)
- [x] Project structure created
- [x] Basic templates for all layouts
- [x] GitHub Pages deployment configured
- [x] Preview page created

**Phase 2: Backend Development** 🚧 (In Progress)
- [x] ✅ **Reverse engineering Google Photos API** (Issue 1 - Complete!)
  - Discovered proven library: `google-photos-album-image-url-fetch`
  - Created proof-of-concept implementation
  - Documented approach in `docs/GOOGLE_PHOTOS_API.md`
  - Validated with comprehensive tests
- [ ] URL parser for Google Photos shared albums
- [ ] DynamoDB schema and S3 caching
- [ ] Settings page UI (Next.js)
- [ ] Preview functionality

**Phase 3: TRMNL Integration** 📋 (Planned)
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
├── api/                          # API endpoints (GitHub Pages)
│   └── photo.json               # Current photo data
├── assets/                       # Design assets
│   ├── icon/                    # Plugin icons
│   ├── demo/                    # Demo screenshots
│   └── raw/                     # Source files
├── docs/                         # Documentation
│   ├── NEW_RECIPE_GUIDE.md      # TRMNL recipe guide
│   └── PRD_Full_Technical.md    # Full technical PRD
├── templates/                    # Liquid templates
│   ├── full.liquid              # Full-screen layout
│   ├── half_horizontal.liquid   # Half horizontal layout
│   ├── half_vertical.liquid     # Half vertical layout
│   └── quadrant.liquid          # Quadrant layout
├── .github/                      # GitHub configuration
│   ├── workflows/               # GitHub Actions
│   └── copilot-instructions.md  # Copilot development guide
├── index.html                    # Preview/testing page
├── settings.yml                  # TRMNL plugin configuration
└── data.json                     # Sample data for testing
```

### Preview

Visit the preview page: [https://hossain-khan.github.io/trmnl-google-photos-plugin/](https://hossain-khan.github.io/trmnl-google-photos-plugin/)

## 📋 Technical Details

- **Strategy**: `merge_tag` - Fetches data from GitHub Pages endpoint
- **Refresh**: Every hour (3600 seconds)
- **Framework**: TRMNL Framework v2 with responsive layouts
- **Backend**: Next.js 15 + TypeScript (planned)
- **Storage**: DynamoDB + S3 (planned)
- **Deployment**: Vercel + GitHub Pages

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
