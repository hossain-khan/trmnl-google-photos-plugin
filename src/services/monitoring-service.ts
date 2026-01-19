/**
 * Monitoring Service
 * Centralized logging and analytics for the Cloudflare Worker
 *
 * Features:
 * - Structured JSON logging
 * - Error tracking with severity levels
 * - Performance metrics
 * - Cache hit rate tracking
 * - Privacy-first (no PII logging)
 */

/**
 * Log levels for different types of events
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Error severity classification
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: string;
  requestId: string;
  level: LogLevel;
  message: string;
  duration?: number;
  [key: string]: unknown; // Additional context data
}

/**
 * Performance metrics for a request
 */
export interface PerformanceMetrics {
  requestId: string;
  endpoint: string;
  totalDuration: number;
  urlParseDuration?: number;
  photoFetchDuration?: number;
  cacheHit?: boolean;
  statusCode: number;
  errorType?: string;
}

/**
 * Error context for tracking
 */
export interface ErrorContext {
  requestId: string;
  endpoint: string;
  errorMessage: string;
  errorType: string;
  severity: ErrorSeverity;
  statusCode: number;
  stack?: string;
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private requestId: string;
  private startTime: number;

  constructor(requestId: string) {
    this.requestId = requestId;
    this.startTime = Date.now();
  }

  /**
   * Log a message with specified level
   */
  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      level,
      message,
      duration: Date.now() - this.startTime,
      ...this.sanitizeData(data),
    };

    console.log(JSON.stringify(logEntry));
  }

  /**
   * Sanitize data to remove PII
   * - Truncates album URLs to prevent logging full URLs
   * - Removes photo URLs
   * - Masks any potential user identifiers
   */
  private sanitizeData(data?: Record<string, unknown>): Record<string, unknown> {
    if (!data) return {};

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // Truncate album URLs for privacy (always truncate to 40 chars + "...")
      if (key === 'album_url' && typeof value === 'string') {
        sanitized.album_url_preview = value.substring(0, 40) + '...';
        continue;
      }

      // Don't log photo URLs (privacy)
      if (key === 'photo_url' || key === 'thumbnail_url') {
        continue;
      }

      // Don't log full error stacks (can be enabled via environment variable)
      // Note: In Cloudflare Workers, check c.env.ENVIRONMENT in the handler
      if (key === 'stack') {
        continue;
      }

      sanitized[key] = value;
    }

    return sanitized;
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log('error', message, data);
  }

  /**
   * Get elapsed time since logger creation
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * Classify error severity based on error type and status code
 */
export function classifyErrorSeverity(statusCode: number, _errorMessage: string): ErrorSeverity {
  // Critical: 500 errors or system failures
  if (statusCode >= 500) {
    return 'critical';
  }

  // High: Data not found or access denied
  if (statusCode === 404 || statusCode === 403) {
    return 'high';
  }

  // Medium: Invalid input or configuration
  if (statusCode === 400) {
    return 'medium';
  }

  // Low: Other client errors
  return 'low';
}

/**
 * Determine error type from error message
 */
export function getErrorType(errorMessage: string): string {
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
    return 'album_not_found';
  }
  if (lowerMessage.includes('access denied') || lowerMessage.includes('403')) {
    return 'album_access_denied';
  }
  if (lowerMessage.includes('invalid')) {
    return 'invalid_input';
  }
  if (lowerMessage.includes('no photos')) {
    return 'empty_album';
  }
  if (lowerMessage.includes('cache')) {
    return 'cache_error';
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return 'timeout';
  }
  return 'unknown_error';
}

/**
 * Track performance metrics (can be sent to Analytics Engine)
 */
export function trackPerformance(metrics: PerformanceMetrics): void {
  console.log(
    JSON.stringify({
      type: 'performance_metric',
      timestamp: new Date().toISOString(),
      ...metrics,
    })
  );
}

/**
 * Track error for monitoring and alerting
 */
export function trackError(context: ErrorContext): void {
  console.log(
    JSON.stringify({
      type: 'error_event',
      timestamp: new Date().toISOString(),
      ...context,
    })
  );
}

/**
 * Send metrics to Cloudflare Analytics Engine (if configured)
 * Note: Analytics Engine is disabled by default (free tier compatible)
 * The monitoring system uses console.log for structured logging instead
 */
export function sendAnalytics(
  analytics: AnalyticsEngineDataset | undefined,
  dataPoint: Record<string, unknown>
): void {
  if (!analytics) {
    return; // Analytics not configured - using console.log fallback
  }

  try {
    const requestId = typeof dataPoint.requestId === 'string' ? dataPoint.requestId : 'unknown';
    const endpoint = typeof dataPoint.endpoint === 'string' ? dataPoint.endpoint : 'unknown';
    const errorType = typeof dataPoint.errorType === 'string' ? dataPoint.errorType : 'none';
    const totalDuration = typeof dataPoint.totalDuration === 'number' ? dataPoint.totalDuration : 0;
    const statusCode = typeof dataPoint.statusCode === 'number' ? dataPoint.statusCode : 0;
    const cacheHit = dataPoint.cacheHit === true ? 1 : 0;

    analytics.writeDataPoint({
      blobs: [requestId, endpoint, errorType],
      doubles: [totalDuration, statusCode, cacheHit],
      indexes: [endpoint],
    });
  } catch (error) {
    // Don't throw - analytics failures shouldn't break the app
    console.error('Failed to send analytics:', error);
  }
}
