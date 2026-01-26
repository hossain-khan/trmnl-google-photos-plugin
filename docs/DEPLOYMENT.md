# Deployment Guide for TRMNL Google Photos Worker

This guide covers deploying the Cloudflare Worker to production.

## Prerequisites

Before deploying, ensure you have:

1. ✅ Cloudflare account (free tier is sufficient)
2. ✅ Wrangler CLI installed (`npm install -D wrangler`)
3. ✅ All dependencies installed (`npm install`)
4. ✅ Worker code tested locally (`x`)
5. ✅ Discord webhook URL (if using alerting) - **KEEP SECRET!**

## Step 1: Login to Cloudflare

Run the login command to authenticate:

```bash
npm run cf:login
```

This will:

1. Open a browser window
2. Ask you to log into Cloudflare
3. Request permission to use Wrangler
4. Save authentication credentials locally

## Step 2: Configure Secrets (IMPORTANT!)

### Set Discord Webhook URL (Required for Alerting)

The Discord webhook URL **must be stored as an encrypted secret**, NOT in plain text.

#### Option A: Using Cloudflare Dashboard (Recommended if CLI issues)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages**
3. Click on your worker: `trmnl-google-photos`
4. Go to **Settings** tab
5. Scroll down to **Variables and Secrets** section
6. Click **Add variable**
7. Set:
   - **Type**: Select **Secret** (not "Variable")
   - **Variable name**: `DISCORD_WEBHOOK_URL`
   - **Value**: Paste your Discord webhook URL
8. Click **Save**
9. **Deploy** the worker for changes to take effect

#### Option B: Using Wrangler CLI

```bash
# Set webhook URL as encrypted secret
npx wrangler secret put DISCORD_WEBHOOK_URL
# Paste your webhook URL when prompted (input is hidden)
```

**⚠️ SECURITY WARNING:**

- ❌ **NEVER** commit webhook URLs to git
- ❌ **NEVER** store webhook URLs in `wrangler.toml`
- ✅ **ALWAYS** use encrypted secrets (Dashboard or CLI)
- ✅ **ROTATE** webhook URLs if accidentally exposed

See [docs/SECURITY.md](./SECURITY.md) for detailed secrets management guide.

### Verify Secrets

**Via Dashboard:**

1. Go to Workers & Pages → `trmnl-google-photos` → Settings
2. Check **Variables and Secrets** section
3. You should see `DISCORD_WEBHOOK_URL` listed as **Secret** type

**Via CLI:**

```bash
npx wrangler secret list
```

Expected output:

```
📝 DISCORD_WEBHOOK_URL (set)
```

## Step 3: Configure Account ID (Optional)

Wrangler will automatically detect your account ID. However, if you want to explicitly set it:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Copy your Account ID from the right sidebar
3. Add it to `wrangler.toml`:

```toml
account_id = "your-account-id-here"
```

## Step 4: Deploy to Production

Deploy the worker:

```bash
npm run deploy
```

This will:

- Build and bundle your TypeScript code
- Upload to Cloudflare Workers
- Deploy to: `https://trmnl-google-photos.gohk.xyz`
- Secrets are automatically available (encrypted at rest)

### Expected Output

```
⛅️ wrangler 4.x.x
-------------------
Your worker has access to the following bindings:
- KV Namespaces:
  - PHOTOS_CACHE: 737dfeaef9a142689b8896ed818fb615
- Vars:
  - ENVIRONMENT: "production"
- Secrets:
  - DISCORD_WEBHOOK_URL (encrypted)
Total Upload: XX.XX KiB / gzip: XX.XX KiB
Uploaded trmnl-google-photos (X.XX sec)
Published trmnl-google-photos (X.XX sec)
  https://trmnl-google-photos.gohk.xyz
Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Step 5: Verify Deployment

Test the deployed worker:

```bash
# Test root endpoint
curl https://trmnl-google-photos.gohk.xyz/

# Test health endpoint
curl https://trmnl-google-photos.gohk.xyz/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "trmnl-google-photos-plugin",
  "version": "1.1.0",
  "environment": "production",
  "timestamp": "2026-01-18T19:00:00.000Z",
  "message": "TRMNL Google Photos Plugin is running"
}
```

## Deploy to Development Environment

For testing changes before production:

```bash
npm run deploy:dev
```

This deploys to a development worker subdomain with a separate KV namespace for testing.

## Troubleshooting

### "Not logged in" error

Run `npm run cf:login` to authenticate.

### "Account ID not found" error

Add your account ID to `wrangler.toml` (see Step 2).

### Subdomain already taken

If subdomain is taken, you can:

1. Choose a different worker name in `wrangler.toml`:

   ```toml
   name = "your-unique-worker-name"
   ```

2. Or use a custom domain (requires Cloudflare zone)

### TypeScript compilation errors

Run type checking locally first:

```bash
npx tsc --noEmit
```

## Monitoring and Logs

### View Real-time Logs

```bash
wrangler tail
```

### View Logs in Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Workers & Pages
3. Click on your worker
4. View logs and analytics

## Rollback

If you need to rollback to a previous version:

1. Go to Cloudflare Dashboard > Workers & Pages
2. Click on your worker
3. Go to "Deployments" tab
4. Click "Rollback" on the desired version

## CI/CD Integration

For automated deployments via GitHub Actions, see `.github/workflows/deploy-worker.yml` (to be created in future).

## Next Steps

After successful deployment:

1. ✅ Verify endpoints are accessible via HTTPS
2. ✅ Test health check returns 200 OK
3. ✅ Confirm environment variables are set correctly
4. ✅ Test `/api/photo` endpoint with demo album
5. ✅ Verify KV caching is working (check logs for cache hits)
6. ✅ Monitor performance metrics in Cloudflare dashboard

## Resources

- [Cloudflare Workers Dashboard](https://dash.cloudflare.com/)
- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
