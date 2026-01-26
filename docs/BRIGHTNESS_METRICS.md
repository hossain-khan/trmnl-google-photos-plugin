# Brightness Analysis Metrics Guide

**Version**: 1.0  
**Last Updated**: January 26, 2026  
**Status**: Production Ready

---

## Overview

Brightness analysis metrics track the performance and reliability of the adaptive background feature, which analyzes photos to determine optimal e-ink display backgrounds.

All metrics are logged as structured JSON events to Cloudflare Worker logs for querying and analysis.

---

## Metric Structure

Each brightness analysis attempt generates a `brightness_metric` event:

```json
{
  "type": "brightness_metric",
  "timestamp": "2026-01-26T14:32:15.123Z",
  "requestId": "abc123def456",
  "status": "success",
  "duration": 850,
  "edgeBrightnessScore": 75.5,
  "brightnessScore": 82.3
}
```

### Metric Fields

| Field                 | Type   | Description                                     | Present When         |
| --------------------- | ------ | ----------------------------------------------- | -------------------- |
| `type`                | string | Always `"brightness_metric"`                    | Always               |
| `timestamp`           | string | ISO 8601 timestamp                              | Always               |
| `requestId`           | string | Correlation ID for main request                 | Always               |
| `status`              | string | `success`, `timeout`, `error`, `skipped`        | Always               |
| `duration`            | number | Time taken in milliseconds                      | All except `skipped` |
| `edgeBrightnessScore` | number | Edge brightness (0-100)                         | `success` only       |
| `brightnessScore`     | number | Overall brightness (0-100)                      | `success` only       |
| `errorType`           | string | Error type (e.g., `AbortError`, `NetworkError`) | `timeout` or `error` |
| `errorMessage`        | string | Error description                               | `timeout` or `error` |
| `apiStatus`           | number | HTTP status code from Image Insights API        | API errors only      |

### Status Values

- **`success`**: Analysis completed successfully with brightness scores
- **`timeout`**: Request exceeded 2000ms timeout (network or server delay)
- **`error`**: API error (HTTP error, network failure, etc.)
- **`skipped`**: User disabled adaptive background (`adaptive_background=false`)

---

## Accessing Metrics

### Cloudflare Dashboard (Free Tier)

1. **Navigate to Logs**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Workers & Pages → `trmnl-google-photos` → Logs

2. **Filter by Type**:
   - Search: `"type":"brightness_metric"`
   - This shows all brightness analysis events

3. **Filter by Status**:
   - Timeouts: `"status":"timeout"`
   - Errors: `"status":"error"`
   - Success: `"status":"success"`
   - Skipped: `"status":"skipped"`

### Log Retention

- **Free Tier**: Last 24 hours of logs
- **Paid Tier**: Extended retention with Analytics Engine

---

## Analysis Queries

### 1. Find All Timeouts

**Search Pattern**:

```
"type":"brightness_metric" AND "status":"timeout"
```

**Example Result**:

```json
{
  "type": "brightness_metric",
  "timestamp": "2026-01-26T05:52:03.421Z",
  "requestId": "9c406e425e9ddc9a",
  "status": "timeout",
  "duration": 2000,
  "errorType": "AbortError",
  "errorMessage": "Request timeout after 2000ms"
}
```

### 2. Find Slow Requests (>1500ms)

**Search Pattern**:

```
"type":"brightness_metric" AND "duration"
```

Then manually filter results where `duration > 1500`.

**Why 1500ms?**: Indicates potential network issues even if not timing out.

### 3. Calculate Timeout Rate

**Manual Process**:

1. Count total attempts: `"type":"brightness_metric"` (exclude `"status":"skipped"`)
2. Count timeouts: `"type":"brightness_metric" AND "status":"timeout"`
3. Calculate: `timeout_rate = timeouts / total_attempts * 100`

**Target**: <5% timeout rate for healthy operation

### 4. Find API Errors

**Search Pattern**:

```
"type":"brightness_metric" AND "apiStatus"
```

**Common API Status Codes**:

- `429`: Rate limiting (too many requests)
- `500`: Server error
- `503`: Service unavailable
- `504`: Gateway timeout

### 5. Performance Distribution

**Search Pattern**:

```
"type":"brightness_metric" AND "status":"success"
```

**Analyze Duration Field**:

- **Fast**: <800ms (optimal network conditions)
- **Normal**: 800-1200ms (expected range)
- **Slow**: 1200-1800ms (elevated latency)
- **Very Slow**: 1800-2000ms (near timeout)

---

## Common Scenarios

### Scenario 1: Intermittent Timeouts

**Symptoms**:

- Timeout rate: 5-15%
- Durations vary widely (500ms to 2000ms)

**Likely Causes**:

- Geographic latency (Cloudflare edge to Image Insights API)
- Network congestion
- Image Insights API under load

**Action**:

1. Check if timeouts correlate with specific times of day
2. Review Image Insights API server logs for matching timestamps
3. Consider increasing timeout from 2000ms to 3000ms if persistent

### Scenario 2: High Error Rate

**Symptoms**:

- Multiple API errors with HTTP status codes
- `apiStatus: 429` (rate limiting)

**Likely Causes**:

- Image Insights API rate limiting
- Server capacity issues

**Action**:

1. Check Image Insights API rate limit configuration
2. Review server capacity (CPU, memory, concurrent requests)
3. Consider implementing exponential backoff

### Scenario 3: Consistently Slow

**Symptoms**:

- All successful requests: 1500-1900ms
- No timeouts, but near timeout threshold

**Likely Causes**:

- Geographic distance between Cloudflare and Image Insights API
- Consistently slow network path

**Action**:

1. Deploy Image Insights API closer to Cloudflare edge
2. Use CDN or edge deployment for Image Insights API
3. Increase timeout to 3000ms for reliability

---

## Alerting Thresholds

Recommended thresholds for monitoring:

| Metric             | Warning | Critical | Action                                    |
| ------------------ | ------- | -------- | ----------------------------------------- |
| **Timeout Rate**   | >5%     | >15%     | Investigate network/server latency        |
| **Error Rate**     | >2%     | >10%     | Check Image Insights API health           |
| **Avg Duration**   | >1500ms | >1800ms  | Optimize network path or increase timeout |
| **API 5xx Errors** | >1%     | >5%      | Check Image Insights API server health    |

---

## Example Analysis Session

### Step 1: Check Overall Health

**Query**: `"type":"brightness_metric"`

**Count Results**:

- Total: 100 events
- Success: 85
- Timeout: 10
- Error: 3
- Skipped: 2

**Analysis**: Timeout rate = 10/98 = 10.2% (warning threshold crossed)

### Step 2: Identify Pattern

**Query**: `"type":"brightness_metric" AND "status":"timeout"`

**Check Timestamps**:

- 05:00-06:00 UTC: 8 timeouts
- 14:00-15:00 UTC: 2 timeouts

**Analysis**: Timeouts concentrated in early morning UTC (5-6am) - potential server backup/maintenance window

### Step 3: Review Durations

**Query**: `"type":"brightness_metric" AND "status":"success"`

**Review Duration Field**:

- Min: 650ms
- Max: 1950ms
- Common: 900-1200ms

**Analysis**: Wide variance suggests network latency fluctuations. Most requests healthy, but some near timeout.

### Step 4: Recommendation

**Action**:

1. Monitor for 48 hours to confirm time-based pattern
2. If pattern persists, increase timeout from 2000ms to 2500ms
3. Check Image Insights API server for scheduled maintenance at 5am UTC

---

## Querying Tips

### Export Logs for Analysis

1. **View Logs in Dashboard**: Copy relevant log entries
2. **Save to File**: Paste into `brightness-logs.json`
3. **Use jq for Analysis**:

```bash
# Count by status
cat brightness-logs.json | jq -r 'select(.type=="brightness_metric") | .status' | sort | uniq -c

# Average duration for successful requests
cat brightness-logs.json | jq -r 'select(.type=="brightness_metric" and .status=="success") | .duration' | awk '{sum+=$1; count++} END {print "Average:", sum/count "ms"}'

# Find slowest requests
cat brightness-logs.json | jq -r 'select(.type=="brightness_metric" and .status=="success") | "\(.duration)ms - \(.timestamp) - \(.requestId)"' | sort -n -r | head -10
```

### Time-Based Analysis

Group logs by hour to identify patterns:

```bash
# Count timeouts by hour
cat brightness-logs.json | jq -r 'select(.type=="brightness_metric" and .status=="timeout") | .timestamp' | cut -d'T' -f2 | cut -d':' -f1 | sort | uniq -c
```

---

## Next Steps: Phase 2 (Future)

Phase 2 would add automated alerting (requires additional setup):

1. **KV-Based Tracking**: Store last 100 brightness events in KV
2. **Sliding Window Calculation**: Calculate timeout rate on each request
3. **Webhook Alerts**: Send Discord/Slack notification when threshold crossed
4. **Rate Limiting**: Max 1 alert per hour to avoid spam

This would provide **proactive** monitoring instead of **reactive** log analysis.

---

## Related Documentation

- [Monitoring Guide](./MONITORING.md) - Overall monitoring architecture
- [API Documentation](./API_DOCUMENTATION.md) - Adaptive background parameter
- [Testing Adaptive Background](./TESTING_ADAPTIVE_BACKGROUND.md) - Testing guide

---

## Changelog

- **2026-01-26**: Initial version with structured metrics tracking
- **2026-01-26**: Added timeout threshold increase from 1s to 2s (see brightness timeout analysis)
