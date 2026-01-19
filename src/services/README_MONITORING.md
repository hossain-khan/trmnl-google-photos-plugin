# Monitoring Service

Centralized logging and analytics for the TRMNL Google Photos Plugin.

## Overview

The monitoring service provides structured logging, performance tracking, and error classification for the Cloudflare Worker. It ensures privacy by automatically sanitizing sensitive data and provides detailed metrics for monitoring and debugging.

## Features

### 1. Structured JSON Logging

All logs are output as structured JSON for easy parsing:

```typescript
import { Logger } from './services/monitoring-service';

const logger = new Logger('request-123');
logger.info('Photo fetched', { count: 142, cached: true });
// Output: {"timestamp":"2026-01-19T10:30:00Z","requestId":"request-123","level":"info","message":"Photo fetched","duration":425,"count":142,"cached":true}
```

### 2. Privacy-First Logging

Automatically sanitizes sensitive data:

- ✅ Album URLs truncated to 40 characters + "..."
- ✅ Photo URLs never logged
- ✅ No user identifiers
- ✅ Error stacks excluded in production

### 3. Error Classification

Automatically classifies errors by severity:

```typescript
import { classifyErrorSeverity } from './services/monitoring-service';

const severity = classifyErrorSeverity(404, 'Album not found');
// Returns: 'high'
```

**Severity Levels**:

- `low`: Other 4xx errors
- `medium`: 400 Bad Request
- `high`: 403/404 errors
- `critical`: 500+ errors

### 4. Error Type Detection

Automatically detects error types from messages:

```typescript
import { getErrorType } from './services/monitoring-service';

const type = getErrorType('Album not found');
// Returns: 'album_not_found'
```

**Error Types**:

- `missing_parameter`
- `invalid_url`
- `album_not_found`
- `album_access_denied`
- `empty_album`
- `cache_error`
- `timeout`
- `unknown_error`

### 5. Performance Tracking

Track request performance metrics:

```typescript
import { trackPerformance, type PerformanceMetrics } from './services/monitoring-service';

const metrics: PerformanceMetrics = {
  requestId: 'req-123',
  endpoint: '/api/photo',
  totalDuration: 425,
  photoFetchDuration: 380,
  cacheHit: true,
  statusCode: 200,
};

trackPerformance(metrics);
```

### 6. Error Tracking

Track errors with context:

```typescript
import { trackError, type ErrorContext } from './services/monitoring-service';

const errorContext: ErrorContext = {
  requestId: 'req-123',
  endpoint: '/api/photo',
  errorMessage: 'Album not found',
  errorType: 'album_not_found',
  severity: 'high',
  statusCode: 404,
};

trackError(errorContext);
```

### 7. Analytics Engine Integration

Send metrics to Cloudflare Analytics Engine (optional):

```typescript
import { sendAnalytics } from './services/monitoring-service';

await sendAnalytics(c.env.ANALYTICS, {
  requestId: 'req-123',
  endpoint: '/api/photo',
  totalDuration: 425,
  statusCode: 200,
  cacheHit: true,
});
```

## Usage Example

Complete example from `/api/photo` endpoint:

```typescript
import {
  Logger,
  trackPerformance,
  trackError,
  classifyErrorSeverity,
  getErrorType,
} from './services/monitoring-service';

app.get('/api/photo', async (c) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID().substring(0, 8);
  const logger = new Logger(requestId);

  try {
    logger.info('Request received');

    // ... fetch photo logic ...

    const totalDuration = Date.now() - startTime;
    logger.info('Response sent', { totalDuration });

    // Track performance
    trackPerformance({
      requestId,
      endpoint: '/api/photo',
      totalDuration,
      cacheHit: true,
      statusCode: 200,
    });

    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorType = getErrorType(errorMessage);
    const statusCode = 500;

    logger.error('Request failed', { error: errorMessage, errorType });

    // Track error
    trackError({
      requestId,
      endpoint: '/api/photo',
      errorMessage,
      errorType,
      severity: classifyErrorSeverity(statusCode, errorMessage),
      statusCode,
    });

    return c.json({ error: 'Internal Server Error' }, 500);
  }
});
```

## Log Levels

Use appropriate log levels for different scenarios:

- `debug()`: Detailed debugging information (URL parsing steps, etc.)
- `info()`: Normal operations (request received, photo fetched)
- `warn()`: Warning conditions (missing parameters, invalid URLs)
- `error()`: Error conditions (photo fetch failed, critical errors)

## Privacy Compliance

The monitoring service is designed to be GDPR/CCPA compliant:

### What We Log

✅ Request timestamps and durations  
✅ Status codes and error types  
✅ Performance metrics  
✅ Cache hit/miss status  
✅ Truncated album URLs (first 40 chars)

### What We DON'T Log

❌ Full album URLs  
❌ Photo URLs  
❌ User identifiers  
❌ Personal information  
❌ Request bodies  
❌ Error stacks (production)

## Testing

The monitoring service has comprehensive test coverage:

```bash
npm run test
```

**Test Coverage**:

- Logger functionality (8 tests)
- Error classification (5 tests)
- Error type detection (7 tests)
- Performance tracking (2 tests)
- Error tracking (2 tests)
- Privacy compliance (3 tests)

**Total**: 27 tests, all passing ✅

## Performance

The monitoring service has minimal overhead:

- Logger creation: <1ms
- Log sanitization: <0.1ms per log
- Performance tracking: <0.1ms
- Error tracking: <0.1ms

**Total overhead per request**: <1ms

## Analytics Engine (Optional)

Cloudflare Analytics Engine provides advanced metrics and querying.

### Setup

1. Available on Workers Paid plan ($5/month)
2. Already configured in `wrangler.toml`
3. Access via `c.env.ANALYTICS` binding

### Data Points

Each request sends:

**Blobs** (string dimensions):

- Request ID
- Endpoint
- Error type

**Doubles** (numeric metrics):

- Total duration
- Status code
- Cache hit (1 or 0)

**Indexes** (queryable):

- Endpoint

### Example Queries

**Cache Hit Rate**:

```sql
SELECT
  SUM(double3) / COUNT(*) * 100 as cache_hit_rate_percent
FROM ANALYTICS
WHERE index1 = '/api/photo'
```

**Error Rate by Type**:

```sql
SELECT
  blob3 as error_type,
  COUNT(*) as error_count
FROM ANALYTICS
WHERE blob3 != 'none'
GROUP BY blob3
```

## Documentation

For complete monitoring documentation, see:

- [docs/MONITORING.md](../../docs/MONITORING.md) - Full monitoring guide
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - System architecture
- [docs/API_DOCUMENTATION.md](../../docs/API_DOCUMENTATION.md) - API reference

## Support

For issues or questions:

- GitHub Issues: https://github.com/hossain-khan/trmnl-google-photos-plugin/issues
- Test Suite: Run `npm test` to verify functionality

---

**Version**: 1.0  
**Last Updated**: January 19, 2026  
**Status**: Production Ready ✅
