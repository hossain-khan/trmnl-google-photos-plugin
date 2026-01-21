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
  <a href="#-installation">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/trmnl-brand/trmnl-badge-works-with-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="assets/trmnl-brand/trmnl-badge-works-with-light.svg">
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

## 📦 Installation

1. Visit [TRMNL Recipes](https://usetrmnl.com/recipes)
2. Search for "**Google Photos**"
3. Click **Install**
4. Create a shared album in Google Photos (if you haven't already)
5. Copy the shared album link from Google Photos
6. Paste the link in the plugin settings
7. Add to your [Playlist](https://usetrmnl.com/playlists)

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

## 🎯 Generic Template for TRMNL Plugins

This repository includes a **generic `copilot-instructions.md` template** that can be used as a starting point for any TRMNL plugin project. The template includes:

- ✅ Comprehensive TRMNL Framework v2 documentation
- ✅ Device specifications and responsive breakpoints
- ✅ Common design patterns and best practices
- ✅ Layout system guidelines (full, half, quadrant)
- ✅ Error handling patterns
- ✅ Testing strategies
- ✅ Code style guidelines
- ✅ Quick reference for framework classes

### Using the Template

1. **Copy** `copilot-instructions.md` to your new TRMNL plugin project
2. **Replace** placeholder text with your project-specific information
3. **Customize** sections to match your plugin's unique requirements
4. **Remove** sections that don't apply to your project
5. **Add** project-specific patterns and conventions

For detailed step-by-step instructions, see [TEMPLATE_USAGE.md](TEMPLATE_USAGE.md).

The template emphasizes using TRMNL Framework utilities extensively and follows best practices from the [TRMNL Plugin Guides](https://help.usetrmnl.com/en/collections/7820559-plugin-guides).

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- [`google-photos-album-image-url-fetch`](https://www.npmjs.com/package/google-photos-album-image-url-fetch) The core library that makes fetching Google Photos URLs possible (reverse-engineered API)
- Inspired by the TRMNL Apple Photos plugin by [@zegl](https://github.com/zegl/trmnl-apple-photos)
- Built for the amazing [TRMNL](https://usetrmnl.com) community

---

**Questions?** Open an issue on [GitHub](https://github.com/hossain-khan/trmnl-google-photos-plugin/issues) or reach out to [@hossain-khan](https://github.com/hossain-khan).
