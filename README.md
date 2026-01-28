# 📷 Google Photos Shared Album for TRMNL

<img src="assets/icon/google-photos-icon.png" align="right" alt="Google Photos Icon" width="60"/>

Display random photos from your Google Photos shared albums on TRMNL e-ink displays — **no OAuth, minimal caching, privacy-focused**. Just paste your shared album link and enjoy your memories!

> "Your photos deserve to be displayed, not buried in the cloud."

## 🖼️ Gallery

See how your photos look across different TRMNL layouts:

<table>
  <tr>
    <td width="50%" align="center">
      <img src="https://hossain-khan.github.io/trmnl-google-photos-plugin/assets/demo/demo-full.png" alt="Full Layout" width="100%"/>
      <br/><strong>Full Layout</strong>
      <br/>Full-screen photo display
    </td>
    <td width="50%" align="center">
      <img src="https://hossain-khan.github.io/trmnl-google-photos-plugin/assets/demo/demo-half-horizontal.png" alt="Half Horizontal Layout" width="100%"/>
      <br/><strong>Half Horizontal</strong>
      <br/>Wide horizontal display
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <img src="https://hossain-khan.github.io/trmnl-google-photos-plugin/assets/demo/demo-half-vertical.png" alt="Half Vertical Layout" width="100%"/>
      <br/><strong>Half Vertical</strong>
      <br/>Tall vertical display
    </td>
    <td width="50%" align="center">
      <img src="https://hossain-khan.github.io/trmnl-google-photos-plugin/assets/demo/demo-quadrant.png" alt="Quadrant Layout" width="100%"/>
      <br/><strong>Quadrant</strong>
      <br/>Compact quarter display
    </td>
  </tr>
</table>

<p align="right">
  <a href="https://usetrmnl.com/recipes/227153" target="_blank">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/trmnl-brand/trmnl-badge-show-it-on-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="assets/trmnl-brand/trmnl-badge-show-it-on-light.svg">
      <img alt="Show it on TRMNL" src="assets/trmnl-brand/trmnl-badge-show-it-on-dark.svg" height="40">
    </picture>
  </a>
</p>

## 🔐 Privacy First

This plugin is built with privacy at its core:

- ✅ **No OAuth** - No Google account connection required
- ✅ **No Personal Data** - We never store your photos or account information
- ✅ **User-Controlled Caching** - You decide: enable 1-hour cache for 80% faster performance, or disable for fresh API calls every time
- ✅ **No Tracking** - Fully stateless, GDPR compliant
- ✅ **Public Albums Only** - Only accesses albums you've explicitly shared
- ✅ **Direct Access** - Photos load directly from Google's servers to your device

**What's cached (when enabled)?** Only album metadata (photo URLs) for 1 hour. Your actual photos stay on Google's servers and are never stored by us. You can disable caching entirely in the plugin settings if you prefer—though this will result in slower loading times (1-2 seconds vs 67ms).

Your photos stay private. We simply help your TRMNL display them.

## 🎨 Layout Variants

This plugin comes in two variants to suit different display preferences:

### Standard Layout (Main Plugin)

The main plugin offers traditional layouts with photo metadata:

- **Full Screen** - Photo with optional caption and metadata
- **Half Horizontal** - Side-by-side photo and info
- **Half Vertical** - Stacked photo and details
- **Quadrant** - Compact photo-only display

**Features**: Photo metadata, date stamps, album info, customizable titles

### Canvas/Fullbleed Layout (Alternative)

A minimalist variant for distraction-free photo viewing:

- Fullscreen, edge-to-edge photo display
- No captions or metadata overlays
- Adaptive background colors (optional) that match photo edges
- Clean, immersive presentation

**Location**: Templates available in `templates-fullbleed/` directory  
**Best For**: Users who want a pure photo experience without text overlays

Both variants use the same backend API but offer different visual presentations. Choose based on whether you prefer photo metadata or a clean canvas.

## 📦 Installation

1. Visit [TRMNL Recipes - Google Photos](https://usetrmnl.com/recipes/227153)
2. Click **Install** to add the recipe to your TRMNL account
3. Create a shared album in Google Photos (if you haven't already)
4. Copy the shared album link from Google Photos
5. Paste the link in the plugin settings
6. Add to your [Playlist](https://usetrmnl.com/playlists)

That's it! Your photos will automatically refresh every hour with a new random photo from your album.

> ℹ️ **Tip:** You can update your shared album anytime, and TRMNL will automatically show new photos!

## 📝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution and development instructions.

### Monitoring & Observability

The plugin includes comprehensive monitoring and analytics:

- **Structured JSON Logging** - All requests logged in machine-readable format
- **Performance Tracking** - Response times, cache hit rates (>80% target)
- **Error Classification** - Automatic severity levels (low/medium/high/critical)
- **Privacy-First** - No PII in logs (album URLs truncated, photo URLs excluded)
- **Analytics Engine** - Optional Cloudflare Analytics for advanced metrics

See [MONITORING.md](docs/MONITORING.md) for complete monitoring documentation.

**Key Metrics**:

- Cache hit rate: >80%
- p95 latency: <3s
- Error rate: <1%
- Availability: 99.9%

## ⚠️ Important Notes

### Legal & Privacy Considerations

This plugin uses **reverse-engineered endpoints** from Google Photos to access shared albums without OAuth. This approach:

- ✅ Only accesses albums **you've explicitly shared**
- ✅ Same access level as viewing the album in a browser
- ✅ Does **not** store actual photos, only temporary URLs
- ⚠️ May violate Google's Terms of Service
- ⚠️ Could stop working if Google changes their API

**Use at your own risk.** This plugin is similar to other community plugins (e.g., Apple Photos) that use reverse-engineered APIs.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- [`google-photos-album-image-url-fetch`](https://www.npmjs.com/package/google-photos-album-image-url-fetch) The core library that makes fetching Google Photos URLs possible (reverse-engineered API)
- Inspired by the TRMNL Apple Photos plugin by [@zegl](https://github.com/zegl/trmnl-apple-photos)
- Built for the amazing [TRMNL](https://usetrmnl.com) community

---

**Questions?** Open an issue on [GitHub](https://github.com/hossain-khan/trmnl-google-photos-plugin/issues) or reach out to [@hossain-khan](https://github.com/hossain-khan).
