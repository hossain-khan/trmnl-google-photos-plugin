# Quick Start Guide - Cloudflare Worker

Get the TRMNL Google Photos worker running in 5 minutes.

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The worker will start on `http://localhost:8787`

### 3. Test It

```bash
# In another terminal
curl http://localhost:8787/

# Expected output:
# {
#   "status": "ok",
#   "service": "trmnl-google-photos-plugin",
#   "version": "0.1.0",
#   "environment": "production",
#   "timestamp": "2026-01-18T19:00:00.000Z",
#   "message": "TRMNL Google Photos Plugin is running"
# }
```

## 🌐 Deploy to Cloudflare

### First Time Setup

1. Login to Cloudflare:
   ```bash
   npm run cf:login
   ```

2. Deploy:
   ```bash
   npm run deploy
   ```

3. Your worker is live at:
   ```
   https://trmnl-google-photos.gohk.xyz
   ```

## 📚 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server |
| `npm run deploy` | Deploy to production |
| `npm run deploy:dev` | Deploy to development environment |
| `npm run types` | Generate TypeScript types |
| `npm run cf:login` | Login to Cloudflare |
| `npm test` | Run all tests |

## 🔍 Endpoints

- `GET /` - Service info and health check
- `GET /health` - Alternative health check

## 📖 Next Steps

- Read [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions
- Read [src/README.md](src/README.md) for worker architecture
- See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system architecture
- See [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for API reference

## 🐛 Troubleshooting

**Worker won't start?**
- Make sure all dependencies are installed: `npm install`
- Check Node.js version: `node --version` (should be 18+)

**Can't deploy?**
- Make sure you're logged in: `npm run cf:login`
- Check your Cloudflare account has Workers enabled

**TypeScript errors?**
- Run `npm run types` to generate type definitions
- Check `tsconfig.json` is present

## 💡 Tips

- Hot reload is enabled - edit `src/index.ts` and see changes instantly
- Use `wrangler tail` to see real-time logs
- Press `Ctrl+C` to stop the dev server

Happy coding! 🎉
