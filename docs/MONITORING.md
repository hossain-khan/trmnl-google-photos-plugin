# Monitoring & Analytics Guide

Complete guide to monitoring and observability for the TRMNL Google Photos Plugin.

**Version**: 1.0  
**Last Updated**: January 19, 2026  
**Status**: Production Ready

---

## Overview

The plugin uses a comprehensive monitoring system built on:

- **Structured JSON Logging**: All requests logged in machine-readable format
- **Performance Tracking**: Response times, cache hit rates, endpoint metrics
- **Error Tracking**: Classified errors with severity levels
- **Privacy-First**: Zero PII logging (no album URLs, user data, or photo URLs)
- **Analytics Engine**: Optional Cloudflare Analytics for advanced metrics (Paid plan)

---

## Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Request Flow                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  Logger (per request)│
              │  - Request ID        │
              │  - Timestamps        │
              │  - PII Sanitization  │
              └──────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │ Console  │   │ Performance│  │ Analytics│
   │ Logs     │   │ Metrics    │  │ Engine   │
   │ (JSON)   │   │ (tracking) │  │ (optional)│
   └──────────┘   └──────────┘   └──────────┘
        │               │               │
        └───────────────┴───────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │ Cloudflare Dashboard │
            │ - Real-time Logs     │
            │ - Analytics Charts   │
            │ - Alerts (optional)  │
            └──────────────────────┘
```

---

## Structured Logging

All logs are output as structured JSON for easy parsing and analysis.

### Log Entry Format

```json
{
  "timestamp": "2026-01-19T10:30:45.123Z",
  "requestId": "a1b2c3d4",
  "level": "info",
  "message": "Photo fetched successfully",
  "duration": 425,
  "uid": "AF1QipMZN...",
  "count": 142,
  "fetchDuration": 380,
  "cached": true
}
```

### Log Levels

| Level   | Purpose                              | Examples                              |
| ------- | ------------------------------------ | ------------------------------------- |
| `debug` | Detailed debugging information       | URL parsing steps, validation details |
| `info`  | Normal operations                    | Request received, photo fetched       |
| `warn`  | Warning conditions                   | Missing parameters, invalid URLs      |
| `error` | Error conditions requiring attention | Photo fetch failed, cache errors      |

### Privacy Safeguards

The logging system **automatically sanitizes** sensitive data:

- ✅ **Album URLs**: Truncated to first 50 characters + "..."
- ✅ **Photo URLs**: Never logged
- ✅ **User Data**: No user identifiers logged
- ✅ **Error Stacks**: Only logged in development (not production)

**Example Sanitization**:

```typescript
// Input
{
  album_url: 'https://photos.app.goo.gl/ABC123XYZ...';
}

// Logged Output
{
  album_url_preview: 'https://photos.app.goo.gl/ABC123XYZ...';
}
```

---

## Performance Tracking

### Metrics Collected

The monitoring system tracks the following performance metrics:

| Metric                 | Description                     | Target    | Tracked How |
| ---------------------- | ------------------------------- | --------- | ----------- |
| **Total Duration**     | End-to-end request time         | <3s       | Per request |
| **URL Parse Duration** | Time to validate album URL      | <10ms     | Per request |
| **Photo Fetch Time**   | Time to fetch photos from API   | <2s       | Per request |
| **Cache Hit Rate**     | % of requests served from cache | >80%      | Aggregated  |
| **Response Size**      | JSON response size              | <5KB      | Per request |
| **Status Codes**       | HTTP status code distribution   | 95% = 200 | Aggregated  |

### Performance Log Example

```json
{
  "type": "performance_metric",
  "timestamp": "2026-01-19T10:30:45.123Z",
  "requestId": "a1b2c3d4",
  "endpoint": "/api/photo",
  "totalDuration": 425,
  "photoFetchDuration": 380,
  "cacheHit": true,
  "statusCode": 200
}
```

### Cache Hit Detection

Cache hits are automatically detected based on fetch duration:

- **Cache HIT**: `fetchDuration < 500ms`
- **Cache MISS**: `fetchDuration >= 500ms`

This heuristic works because:

- Cached responses: ~67ms (KV read)
- Uncached responses: ~1350ms (Google Photos API)

---

## Error Tracking

### Error Classification

Errors are automatically classified by **severity** and **type**:

#### Severity Levels

| Severity   | Status Codes | Description                    | Alert Priority |
| ---------- | ------------ | ------------------------------ | -------------- |
| `low`      | 4xx (other)  | Minor client errors            | Low            |
| `medium`   | 400          | Invalid input, configuration   | Medium         |
| `high`     | 403, 404     | Access denied, not found       | High           |
| `critical` | 500+         | Server errors, system failures | Critical       |

#### Error Types

Automatically detected error types:

| Error Type            | Trigger Keywords       | Common Causes            |
| --------------------- | ---------------------- | ------------------------ |
| `missing_parameter`   | Missing parameter      | No album_url provided    |
| `invalid_url`         | Invalid URL            | Malformed album URL      |
| `album_not_found`     | "not found", "404"     | Album deleted or private |
| `album_access_denied` | "access denied", "403" | Album sharing disabled   |
| `empty_album`         | "No photos"            | Album has 0 photos       |
| `cache_error`         | "cache", "Cache"       | KV read/write failure    |
| `timeout`             | "timeout", "Timeout"   | Slow Google Photos API   |
| `unhandled_error`     | All other errors       | Unexpected failures      |

### Error Log Example

```json
{
  "type": "error_event",
  "timestamp": "2026-01-19T10:30:45.123Z",
  "requestId": "a1b2c3d4",
  "endpoint": "/api/photo",
  "errorMessage": "Album not found. The album may have been deleted or made private.",
  "errorType": "album_not_found",
  "severity": "high",
  "statusCode": 404
}
```

---

## Cloudflare Analytics Engine (Optional)

### Setup

Analytics Engine is available on **Workers Paid plan** ($5/month).

#### 1. Enable in wrangler.toml

Already enabled in the configuration:

```toml
[[analytics_engine_datasets]]
binding = "ANALYTICS"
```

#### 2. Deploy Worker

```bash
npm run deploy
```

The Analytics Engine binding will be automatically available in production.

#### 3. Query Analytics

Use the Cloudflare API or Dashboard to query analytics data.

### Analytics Data Points

Each request sends the following data to Analytics Engine:

**Blobs** (string dimensions):

- Request ID
- Endpoint path
- Error type (or "none")

**Doubles** (numeric metrics):

- Total duration (ms)
- Status code
- Cache hit (1) or miss (0)

**Indexes** (queryable dimensions):

- Endpoint path

### Example Analytics Queries

**Cache Hit Rate** (Last 24 hours):

```sql
SELECT
  AVG(double1) as avg_duration_ms,
  SUM(double3) / COUNT(*) * 100 as cache_hit_rate_percent,
  COUNT(*) as total_requests
FROM ANALYTICS
WHERE timestamp > NOW() - INTERVAL '24' HOUR
  AND index1 = '/api/photo'
```

**Error Rate by Type**:

```sql
SELECT
  blob3 as error_type,
  COUNT(*) as error_count,
  AVG(double1) as avg_duration_ms
FROM ANALYTICS
WHERE timestamp > NOW() - INTERVAL '24' HOUR
  AND blob3 != 'none'
GROUP BY blob3
ORDER BY error_count DESC
```

**Performance Percentiles**:

```sql
SELECT
  APPROX_QUANTILE(double1, 0.50) as p50_ms,
  APPROX_QUANTILE(double1, 0.95) as p95_ms,
  APPROX_QUANTILE(double1, 0.99) as p99_ms
FROM ANALYTICS
WHERE timestamp > NOW() - INTERVAL '24' HOUR
  AND index1 = '/api/photo'
```

---

## Viewing Logs

### Real-Time Logs (Wrangler CLI)

Stream live logs during development:

```bash
wrangler tail
```

**Filter by log level**:

```bash
wrangler tail | grep '"level":"error"'
```

**Filter by endpoint**:

```bash
wrangler tail | grep '"/api/photo"'
```

### Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages**
3. Select your worker: `trmnl-google-photos`
4. Click **Logs** → **Real-time Logs**

**Features**:

- Live log streaming
- Log level filtering
- Search by request ID
- Time range selection
- Export logs (CSV/JSON)

### Log Retention

- **Free Tier**: No persistent log storage (real-time only)
- **Paid Tier**: 24-hour log retention
- **Analytics Engine**: 3 months (on Paid plan)

---

## Setting Up Alerts

### Cloudflare Workers Email Alerts (Paid Plan)

1. Go to Cloudflare Dashboard → Workers
2. Select your worker
3. Click **Settings** → **Triggers**
4. Configure **Health Checks**:
   - Endpoint: `https://trmnl-google-photos.gohk.xyz/health`
   - Frequency: Every 5 minutes
   - Alert on: 3 consecutive failures

### Third-Party Alert Systems

#### Option 1: Better Uptime (Free Tier)

1. Sign up at [betteruptime.com](https://betteruptime.com/)
2. Create HTTP monitor:
   - URL: `https://trmnl-google-photos.gohk.xyz/health`
   - Interval: 30 seconds
   - Expected status: 200
3. Configure alerts (Email/Slack/PagerDuty)

#### Option 2: UptimeRobot (Free Tier)

1. Sign up at [uptimerobot.com](https://uptimerobot.com/)
2. Add new monitor:
   - Type: HTTPS
   - URL: `https://trmnl-google-photos.gohk.xyz/health`
   - Interval: 5 minutes
3. Add alert contacts

#### Option 3: Sentry (Error Tracking)

For advanced error tracking:

1. Sign up at [sentry.io](https://sentry.io/)
2. Install Sentry SDK:
   ```bash
   npm install @sentry/browser
   ```
3. Initialize in worker (optional)

---

## Monitoring Dashboard

### Key Metrics to Monitor

#### 1. Availability

- **Target**: 99.9% uptime
- **Alert**: <99% over 1 hour
- **Monitor**: Health check endpoint

#### 2. Response Time

- **Target**: p95 <3s, p99 <5s
- **Alert**: p95 >5s over 10 minutes
- **Monitor**: Performance logs

#### 3. Error Rate

- **Target**: <1% of requests
- **Alert**: >5% over 5 minutes
- **Monitor**: Error logs by severity

#### 4. Cache Hit Rate

- **Target**: >80%
- **Alert**: <50% over 1 hour
- **Monitor**: Cache hit/miss logs

### Example Dashboard Queries

**Error Rate (Last Hour)**:

```bash
wrangler tail | grep '"level":"error"' | wc -l
```

**Average Response Time**:

```bash
wrangler tail | grep '"totalDuration"' | \
  jq -r '.totalDuration' | \
  awk '{sum+=$1; count++} END {print sum/count}'
```

**Cache Hit Rate**:

```bash
wrangler tail | grep '"cached"' | \
  grep -c '"cached":true'
```

---

## Troubleshooting

### Common Monitoring Issues

#### Issue 1: No Logs Appearing

**Symptoms**: No logs in dashboard or wrangler tail

**Solutions**:

1. Verify worker is deployed: `wrangler whoami`
2. Check worker is running: `curl https://trmnl-google-photos.gohk.xyz/health`
3. Restart wrangler tail: `wrangler tail --tail 100`

#### Issue 2: Analytics Engine Not Working

**Symptoms**: Analytics data not available in dashboard

**Solutions**:

1. Verify you're on Paid plan ($5/month required)
2. Check binding in wrangler.toml: `binding = "ANALYTICS"`
3. Redeploy worker: `npm run deploy`
4. Wait 5-10 minutes for data to appear

#### Issue 3: High Error Rate

**Symptoms**: Many error logs, high error rate

**Investigation Steps**:

1. Filter error logs: `wrangler tail | grep '"level":"error"'`
2. Check error types: Look for `errorType` in logs
3. Common causes:
   - `album_not_found`: Albums deleted or made private
   - `cache_error`: KV namespace issues
   - `timeout`: Google Photos API slow/down

**Solutions**:

- For `album_not_found`: Notify users to check album sharing
- For `cache_error`: Check KV namespace binding
- For `timeout`: Increase timeout or add retry logic

#### Issue 4: Slow Response Times

**Symptoms**: High p95/p99 latencies, >3s responses

**Investigation**:

1. Check cache hit rate: Should be >80%
2. Look for uncached requests: `"cached":false`
3. Monitor Google Photos API response times

**Solutions**:

- Low cache hit rate: Increase TTL in cache-service.ts
- Slow API: Add retry logic or fallback
- Cold starts: Deploy to multiple regions (Paid plan)

---

## Performance Baselines

### Expected Metrics (Production)

| Metric           | Cache HIT | Cache MISS | Target |
| ---------------- | --------- | ---------- | ------ |
| Total Duration   | ~67ms     | ~1350ms    | <3s    |
| URL Parse Time   | ~5ms      | ~5ms       | <10ms  |
| Photo Fetch Time | ~60ms     | ~1300ms    | <2s    |
| Response Size    | ~500B     | ~500B      | <5KB   |
| Error Rate       | <0.1%     | <1%        | <1%    |

### Performance Degradation Indicators

Monitor for these warning signs:

- ⚠️ Cache hit rate drops below 70%
- ⚠️ p95 latency exceeds 4 seconds
- ⚠️ Error rate exceeds 2%
- ⚠️ Photo fetch failures >5 per hour

---

## Security Considerations

### What We DO Log

✅ Request timestamps and durations  
✅ Status codes and error types  
✅ Performance metrics  
✅ Cache hit/miss status  
✅ Error severity and classification

### What We DON'T Log

❌ Full album URLs  
❌ Photo URLs  
❌ User identifiers  
❌ Personal information  
❌ Request bodies  
❌ Authentication tokens (none used)

### Compliance

- **GDPR**: Compliant (no PII logged)
- **CCPA**: Compliant (no personal data)
- **SOC 2**: Follows best practices
- **Data Retention**: 24 hours (logs), 3 months (analytics)

---

## Best Practices

### For Development

1. **Use wrangler tail for debugging**

   ```bash
   wrangler tail --format pretty
   ```

2. **Test error scenarios**
   - Invalid URLs
   - Missing parameters
   - Deleted albums

3. **Monitor cache behavior**
   - Check cache hit rates
   - Verify TTL settings

### For Production

1. **Set up health monitoring**
   - External uptime monitor (Better Uptime, UptimeRobot)
   - Check endpoint: `/health`
   - Alert on failures

2. **Review logs regularly**
   - Check error patterns weekly
   - Monitor performance trends
   - Investigate anomalies

3. **Track key metrics**
   - Availability >99.9%
   - p95 latency <3s
   - Error rate <1%
   - Cache hit rate >80%

4. **Respond to alerts promptly**
   - Critical: Within 15 minutes
   - High: Within 1 hour
   - Medium: Within 24 hours
   - Low: Weekly review

---

## Monitoring Checklist

Use this checklist to verify monitoring is working:

### Initial Setup

- [ ] Analytics Engine binding enabled in wrangler.toml
- [ ] Worker deployed with monitoring service
- [ ] Structured logging verified (check console output)
- [ ] No PII in logs (verify sanitization)

### Regular Monitoring

- [ ] Health endpoint returns 200 OK
- [ ] Error logs reviewed (weekly)
- [ ] Performance metrics within targets
- [ ] Cache hit rate >80%

### Incident Response

- [ ] Alert system configured
- [ ] On-call rotation defined
- [ ] Runbook for common issues
- [ ] Post-mortem process

---

## Additional Resources

- [Cloudflare Workers Analytics](https://developers.cloudflare.com/analytics/analytics-engine/)
- [Wrangler Tail Documentation](https://developers.cloudflare.com/workers/wrangler/commands/#tail)
- [Structured Logging Best Practices](https://developers.cloudflare.com/workers/observability/logging/)
- [Project Architecture](ARCHITECTURE.md)
- [API Documentation](API_DOCUMENTATION.md)

---

**Document Version**: 1.0  
**Last Updated**: January 19, 2026  
**Maintainer**: Hossain Khan  
**Status**: Production Ready ✅
