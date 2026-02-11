# Brightness Analysis Alerting Guide

**Version**: 1.0  
**Last Updated**: January 26, 2026  
**Status**: Production Ready (Phase 2)

---

## Overview

The alerting system monitors brightness analysis metrics and automatically sends Discord notifications when timeout rates exceed acceptable thresholds. This enables proactive monitoring without manual log analysis.

**Key Features:**

- ✅ **Automatic Monitoring**: Tracks last 100 brightness attempts in KV
- ✅ **Smart Thresholds**: Alerts when timeout rate > 10%
- ✅ **Rate Limiting**: Max 1 alert per hour to avoid spam
- ✅ **Free Tier Compatible**: Uses existing PHOTOS_CACHE KV namespace
- ✅ **Discord Integration**: Rich embed notifications with statistics

---

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Brightness Analysis Request                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  Brightness Service  │
              │  (analyzes photo)    │
              └──────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │   Track Metrics      │
              │   (monitoring.ts)    │
              └──────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │   Alerting Service   │
              │   (checks threshold) │
              └──────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │ Store    │   │ Calculate│   │ Discord  │
   │ Event in │   │ Timeout  │   │ Alert    │
   │ KV       │   │ Rate     │   │ (if >10%)│
   └──────────┘   └──────────┘   └──────────┘
```

### Sliding Window Tracking

1. **Event Storage**: Each brightness attempt (success/timeout/error) stored in KV
2. **Window Size**: Last 100 events tracked
3. **Automatic Cleanup**: Events older than 100 are removed
4. **TTL**: KV data expires after 24 hours

### Alert Logic

```typescript
if (timeout_rate > 10% && last_alert > 1_hour_ago && samples >= 20) {
  send_discord_alert();
  update_cooldown();
}
```

**Conditions:**

1. Timeout rate must exceed 10%
2. At least 20 samples collected (avoid false alarms)
3. Cooldown period (1 hour) must have expired

---

## Configuration

### Thresholds

| Setting               | Value      | Purpose                              |
| --------------------- | ---------- | ------------------------------------ |
| **Timeout Threshold** | 10%        | Alert when timeout rate exceeds this |
| **Cooldown Period**   | 1 hour     | Minimum time between alerts          |
| **Sliding Window**    | 100 events | Number of recent events tracked      |
| **Minimum Samples**   | 20 events  | Minimum data before alerting         |

### Environment Variables

**⚠️ SECURITY WARNING:** The Discord webhook URL **MUST** be stored as an encrypted secret, NOT as a plain text environment variable in `wrangler.toml`. See the [Security Policy](./SECURITY.md) for detailed setup instructions.

**Setup Method 1: Cloudflare Dashboard (Recommended)**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → `trmnl-google-photos`
3. Go to **Settings** → **Variables and Secrets**
4. Click **Add variable** → Select **Secret** type
5. Variable name: `DISCORD_WEBHOOK_URL`
6. Value: Paste your Discord webhook URL
7. Click **Save**

**Setup Method 2: Wrangler CLI**

```bash
npx wrangler secret put DISCORD_WEBHOOK_URL
# Paste your webhook URL when prompted (input is hidden)
```

**KV Namespace:**

- Uses existing `PHOTOS_CACHE` binding (no additional KV needed)
- Stores alerting data alongside photo cache

---

## Discord Webhook Setup

### 1. Create Discord Webhook

1. **Open Discord Server Settings**
2. **Integrations** → **Webhooks** → **New Webhook**
3. **Choose Channel** (e.g., `#alerts` or `#monitoring`)
4. **Copy Webhook URL** (keep it secret!)
5. **Store as encrypted secret** (see below)

**⚠️ SECURITY:** Never commit webhook URLs to git or store in `wrangler.toml` as plain text.

**Option A: Cloudflare Dashboard (Easier)**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Workers & Pages → `trmnl-google-photos` → Settings
3. Variables and Secrets → Add variable
4. Select **Secret** type (NOT "Variable")
5. Name: `DISCORD_WEBHOOK_URL`
6. Value: Paste your webhook URL
7. Click Save

**Option B: Wrangler CLI**

```bash
npx wrangler secret put DISCORD_WEBHOOK_URL
# Paste your webhook URL when prompted
```

For detailed security guidance, see [SECURITY.md](./SECURITY.md#-secrets-management).

### 2. Deploy to Cloudflare

```bash
# Deploy with new configuration
npm run deploy

# Or use GitHub Actions workflow
# Actions → Deploy to Cloudflare → Run workflow
```

### 3. Verify Configuration

Check Cloudflare logs after deployment:

```
"Request preferences" log should show:
{
  "alertingEnabled": true
}
```

---

## Alert Format

### Discord Embed Example

When an alert is triggered, you'll receive a rich embed in Discord:

```
⚠️ Brightness Analysis Alert
High timeout rate detected in TRMNL Google Photos Plugin

📊 Timeout Rate: 12.5% (10/80 requests)
✅ Success Rate: 65/80 requests
❌ Errors: 5 API errors
⏱️ Avg Duration: 950ms (successful requests)
🎯 Threshold: 10% (crossed)
📅 Time Window: Last 80 requests

TRMNL Google Photos Plugin
2026-01-26T15:30:00.000Z
```

### Alert Fields Explained

- **Timeout Rate**: Percentage and count of timed out requests
- **Success Rate**: Number of successful analyses
- **Errors**: API errors (HTTP errors, network failures)
- **Avg Duration**: Average time for successful requests
- **Threshold**: Alert threshold (10%) - shown as crossed
- **Time Window**: How many recent requests analyzed

---

## KV Data Structure

### Stored Events

**Key**: `brightness:events`  
**Value**: Array of last 100 events  
**TTL**: 24 hours

```json
[
  {
    "timestamp": "2026-01-26T14:30:15.123Z",
    "status": "success",
    "duration": 850
  },
  {
    "timestamp": "2026-01-26T14:31:22.456Z",
    "status": "timeout",
    "duration": 2000
  },
  {
    "timestamp": "2026-01-26T14:32:10.789Z",
    "status": "error",
    "duration": 150
  }
]
```

### Last Alert Timestamp

**Key**: `brightness:last_alert`  
**Value**: ISO 8601 timestamp  
**TTL**: 24 hours

```
"2026-01-26T14:30:00.000Z"
```

---

## Testing the Alerting System

### Manual Test (Simulate High Timeout Rate)

To test the alerting system without waiting for real timeouts:

1. **Temporarily Lower Threshold** (for testing only):

```typescript
// In alerting-service.ts
const ALERT_CONFIG = {
  TIMEOUT_THRESHOLD: 0.01, // 1% for testing (normally 10%)
  MIN_SAMPLES: 5, // Lower minimum for faster testing
  // ... rest of config
};
```

2. **Make Multiple Requests**:

```bash
# Make 10 requests with adaptive background enabled
for i in {1..10}; do
  curl "https://trmnl-google-photos.gohk.xyz/api/photo?album_url=https://photos.app.goo.gl/ENK6C44K85QgVHPH8&adaptive_background=true"
  sleep 2
done
```

3. **Check Discord** for alert notification

4. **Restore Production Config**:

```typescript
const ALERT_CONFIG = {
  TIMEOUT_THRESHOLD: 0.1, // 10% production threshold
  MIN_SAMPLES: 20,
  // ... rest of config
};
```

### Monitor KV Data

Check stored events in Cloudflare Dashboard:

1. **Navigate to KV**:
   - Dashboard → Workers & Pages → KV
   - Select `PHOTOS_CACHE` namespace

2. **View Alerting Keys**:
   - `brightness:events` - Recent brightness attempts
   - `brightness:last_alert` - Last alert timestamp

---

## Monitoring & Troubleshooting

### Check if Alerting is Enabled

**Search Cloudflare Logs**:

```
"alertingEnabled"
```

**Expected Result**:

```json
{
  "alertingEnabled": true,
  "enable_caching": "true",
  "adaptive_background": "true"
}
```

### Alert Not Triggering

**Possible Causes:**

1. **Threshold Not Crossed**:
   - Timeout rate < 10%
   - Check: `"type":"brightness_metric" AND "status":"timeout"`

2. **Insufficient Samples**:
   - Less than 20 brightness attempts recorded
   - Check: `"type":"brightness_metric"` (count total)

3. **Cooldown Period Active**:
   - Alert sent less than 1 hour ago
   - Check: KV key `brightness:last_alert`

4. **Webhook URL Missing**:
   - `DISCORD_WEBHOOK_URL` secret not configured
   - Check: `"alertingEnabled": false` in logs

5. **KV Not Configured**:
   - `PHOTOS_CACHE` KV namespace not bound
   - Check: `"kvConfigured": false` in logs

### View Alert Logs

**Search Cloudflare Logs**:

```
"[Alerting]"
```

**Log Examples:**

**Alert Sent**:

```
[Alerting] Discord alert sent - Timeout rate: 12.5% (10/80)
```

**Cooldown Active**:

```
[Alerting] In cooldown period - 45 minutes remaining until next alert
```

**Event Tracked**:

```
[Alerting] Brightness event tracked - Window size: 85 events
```

---

## Adjusting Alert Thresholds

### Increase Threshold (Less Sensitive)

If you're getting too many alerts, increase the threshold:

```typescript
// In alerting-service.ts
const ALERT_CONFIG = {
  TIMEOUT_THRESHOLD: 0.15, // 15% (was 10%)
  // ... rest of config
};
```

### Decrease Cooldown (More Frequent)

If you want alerts more frequently:

```typescript
const ALERT_CONFIG = {
  COOLDOWN_PERIOD_MS: 1800000, // 30 minutes (was 1 hour)
  // ... rest of config
};
```

### Increase Sample Size (More Accurate)

For more accurate statistics before alerting:

```typescript
const ALERT_CONFIG = {
  SLIDING_WINDOW_SIZE: 200, // Track last 200 events (was 100)
  MIN_SAMPLES: 50, // Need 50 samples (was 20)
  // ... rest of config
};
```

**Remember**: Redeploy after making changes:

```bash
npm run deploy
```

---

## Cost Analysis (Free Tier)

### KV Operations Per Request

**With Adaptive Background Enabled**:

- 1 read: Get stored events (`brightness:events`)
- 1 write: Store updated events
- 1 read: Check last alert timestamp (if threshold crossed)
- 1 write: Update last alert timestamp (if alert sent)

**Average**: 2 KV operations per brightness request

### Free Tier Limits

- **KV Reads**: 100,000/day (Free tier)
- **KV Writes**: 1,000/day (Free tier)
- **Worker Requests**: 100,000/day (Free tier)

### Usage Estimation

**Scenario**: 1000 requests/day with adaptive background enabled

- **KV Reads**: ~2,000/day (2% of limit)
- **KV Writes**: ~1,000/day (100% of limit - at limit!)
- **Discord Webhooks**: ~24/day max (1 per hour)

**Recommendation**: Monitor KV write usage if you have high traffic. Consider:

1. Reducing sliding window size (fewer writes)
2. Increasing cooldown period (fewer alert checks)
3. Upgrading to Workers Paid plan ($5/mo) for 1M writes/day

---

## Disabling Alerts (Keep Metrics)

To disable alerting but keep metrics tracking:

1. **Delete the Discord Webhook Secret**:

**Via Cloudflare Dashboard:**
- Workers & Pages → `trmnl-google-photos` → Settings
- Variables and Secrets → Find `DISCORD_WEBHOOK_URL`
- Click Delete

**Via Wrangler CLI:**

```bash
npx wrangler secret delete DISCORD_WEBHOOK_URL
```

2. **Redeploy**:

```bash
npm run deploy
```

3. **Verify**:

Logs should show:

```json
{
  "alertingEnabled": false
}
```

Metrics will still be tracked in Cloudflare logs, but no Discord alerts will be sent.

---

## Related Documentation

- [Brightness Metrics Guide](./BRIGHTNESS_METRICS.md) - Metrics structure and querying
- [Monitoring Guide](./MONITORING.md) - Overall monitoring architecture
- [API Documentation](./API_DOCUMENTATION.md) - Adaptive background parameter

---

## Changelog

- **2026-01-26**: Initial Phase 2 implementation with Discord webhook alerting
- **2026-01-26**: Added sliding window tracking with KV storage
- **2026-01-26**: Rate limiting and smart threshold detection
