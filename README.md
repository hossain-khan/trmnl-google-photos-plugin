# 📷 Google Photos Shared Album for TRMNL

<img src="assets/icon/google-photos-icon.png" align="right" alt="Google Photos Icon" width="60"/>

Display random photos from your Google Photos shared albums on TRMNL e-ink displays — **no OAuth, minimal caching, privacy-focused**. Just paste your shared album link and enjoy your memories!

> "Your photos deserve to be displayed, not buried in the cloud."

## 🔐 Privacy First

This plugin is built with privacy at its core:

- ✅ **No OAuth** - No Google account connection required
- ✅ **No Personal Data** - We never store your photos or account information
- ✅ **Temporary Caching Only** - Album metadata cached for 1 hour to improve performance (80% faster!)
- ✅ **No Tracking** - Fully stateless, GDPR compliant
- ✅ **Public Albums Only** - Only accesses albums you've explicitly shared
- ✅ **Direct Access** - Photos load directly from Google's servers to your device

**What's cached?** Only album metadata (photo URLs, captions) for 1 hour. Your actual photos stay on Google's servers and are never stored by us.

Your photos stay private. We simply help your TRMNL display them.

## 📦 Installation

1. Visit [TRMNL Plugins](https://usetrmnl.com/plugins)
2. Search for "**Google Photos Shared Album**"
3. Click **Install**
4. Create a shared album in Google Photos (if you haven't already)
5. Copy the shared album link from Google Photos
6. Paste the link in the plugin settings
7. Add to your [Playlist](https://usetrmnl.com/playlists)

That's it! Your photos will automatically refresh every hour with a new random photo from your album.

## 💡 How to Create a Shared Album

1. Open [Google Photos](https://photos.google.com)
2. Select photos you want to display
3. Click **Share** → **Create shared album**
4. Copy the share link (looks like `photos.app.goo.gl/...`)
5. Paste this link in the TRMNL plugin settings

**Tip:** You can update your shared album anytime, and TRMNL will automatically show new photos!

## 🛠️ Developer Guide

This project is built with **TypeScript** for enhanced reliability and maintainability.

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn package manager

### Setup

```bash
# Clone the repository
git clone https://github.com/hossain-khan/trmnl-google-photos-plugin.git
cd trmnl-google-photos-plugin

# Install dependencies
npm install

# Run tests
npm test

# Check code formatting
npm run format:check

# Run linter
npm run lint

# Format code
npm run format

# Build and deploy
npm run deploy
```

### Tech Stack

- **TypeScript** - 100% TypeScript codebase with strict type checking
- **Cloudflare Workers** - Serverless backend (Hono framework)
- **Prettier** - Code formatting
- **ESLint** - Linting with TypeScript support
- **tsx** - TypeScript execution for scripts and tests
- **Zod** - Runtime validation

### Project Structure

```
trmnl-google-photos-plugin/
├── src/              # Cloudflare Worker source (TypeScript)
├── lib/              # Core libraries (TypeScript)
├── scripts/          # Utility scripts & tests (TypeScript)
├── templates/        # TRMNL Liquid templates
└── docs/             # Documentation
```

### Contributing

We follow strict TypeScript and code quality standards:

1. **TypeScript First** - All code must be in TypeScript
2. **Type Safety** - Strict type checking enabled (`strict: true`)
3. **No `any` Types** - Use proper types or generics
4. **Formatting** - Code must pass Prettier checks (`npm run format`)
5. **Linting** - Code must pass ESLint checks (`npm run lint`)
6. **Tests** - All tests must pass (`npm test`)

See [QUICKSTART.md](docs/QUICKSTART.md) for detailed development instructions.

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

- Inspired by the TRMNL Apple Photos plugin by [@zegl](https://github.com/zegl/trmnl-apple-photos)
- Built for the amazing [TRMNL](https://usetrmnl.com) community

---

**Questions?** Open an issue on [GitHub](https://github.com/hossain-khan/trmnl-google-photos-plugin/issues) or reach out to [@hossain-khan](https://github.com/hossain-khan).
