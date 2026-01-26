/**
 * Alerting Service
 * Monitors brightness analysis metrics and sends alerts when thresholds are crossed
 *
 * **Features:**
 * - KV-based sliding window tracking (last 100 brightness attempts)
 * - Discord webhook notifications
 * - Rate limiting (max 1 alert per hour)
 * - Automatic threshold detection
 * - Free tier compatible (uses existing PHOTOS_CACHE KV namespace)
 *
 * **Architecture:**
 * - Stores last 100 brightness events in KV under key: `brightness:events`
 * - Stores last alert timestamp in KV under key: `brightness:last_alert`
 * - Calculates timeout rate on each brightness analysis
 * - Sends Discord alert if rate crosses threshold and cooldown expired
 */

import type { BrightnessMetrics } from './monitoring-service';

/**
 * Alert configuration
 */
const ALERT_CONFIG = {
  TIMEOUT_THRESHOLD: 0.1, // 10% timeout rate triggers alert
  COOLDOWN_PERIOD_MS: 3600000, // 1 hour cooldown between alerts
  SLIDING_WINDOW_SIZE: 100, // Track last 100 brightness attempts
  MIN_SAMPLES: 20, // Need at least 20 samples before alerting
};

/**
 * KV keys for alerting data
 */
const KV_KEYS = {
  EVENTS: 'brightness:events', // Array of recent brightness events
  LAST_ALERT: 'brightness:last_alert', // Timestamp of last alert sent
};

/**
 * Simplified brightness event for KV storage
 */
interface StoredBrightnessEvent {
  timestamp: string;
  status: 'success' | 'timeout' | 'error';
  duration?: number;
}

/**
 * Alert statistics
 */
export interface AlertStats {
  totalAttempts: number;
  timeouts: number;
  errors: number;
  success: number;
  timeoutRate: number;
  avgDuration: number;
  windowStart: string;
  windowEnd: string;
}

/**
 * Track brightness event in sliding window
 * Stores event in KV and maintains last 100 events
 *
 * @param kv - Cloudflare KV namespace
 * @param metrics - Brightness metrics to track
 */
export async function trackBrightnessEvent(
  kv: KVNamespace,
  metrics: BrightnessMetrics
): Promise<void> {
  // Only track actual attempts (not skipped)
  if (metrics.status === 'skipped') {
    return;
  }

  try {
    // Create simplified event for storage
    const event: StoredBrightnessEvent = {
      timestamp: new Date().toISOString(),
      status: metrics.status,
      duration: metrics.duration,
    };

    // Get existing events
    const existingData = await kv.get(KV_KEYS.EVENTS, 'json');
    const events: StoredBrightnessEvent[] = Array.isArray(existingData) ? existingData : [];

    // Add new event and keep only last 100
    events.push(event);
    const recentEvents = events.slice(-ALERT_CONFIG.SLIDING_WINDOW_SIZE);

    // Store updated events (24 hour TTL)
    await kv.put(KV_KEYS.EVENTS, JSON.stringify(recentEvents), {
      expirationTtl: 86400, // 24 hours
    });
  } catch (error) {
    // Don't throw - alerting failures shouldn't break the app
    console.error('[Alerting] Failed to track brightness event:', error);
  }
}

/**
 * Calculate statistics from stored events
 *
 * @param events - Array of stored brightness events
 * @returns Alert statistics
 */
function calculateStats(events: StoredBrightnessEvent[]): AlertStats {
  const totalAttempts = events.length;
  const timeouts = events.filter((e) => e.status === 'timeout').length;
  const errors = events.filter((e) => e.status === 'error').length;
  const success = events.filter((e) => e.status === 'success').length;
  const timeoutRate = totalAttempts > 0 ? timeouts / totalAttempts : 0;

  // Calculate average duration for successful requests
  const successEvents = events.filter((e) => e.status === 'success' && e.duration);
  const avgDuration =
    successEvents.length > 0
      ? successEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / successEvents.length
      : 0;

  return {
    totalAttempts,
    timeouts,
    errors,
    success,
    timeoutRate,
    avgDuration,
    windowStart: events[0]?.timestamp || 'N/A',
    windowEnd: events[events.length - 1]?.timestamp || 'N/A',
  };
}

/**
 * Check if alert should be sent
 * Evaluates timeout rate against threshold and cooldown period
 *
 * @param kv - Cloudflare KV namespace
 * @returns True if alert should be sent
 */
async function shouldSendAlert(kv: KVNamespace): Promise<{
  shouldAlert: boolean;
  stats: AlertStats | null;
}> {
  try {
    // Get stored events
    const eventsData = await kv.get(KV_KEYS.EVENTS, 'json');
    const events: StoredBrightnessEvent[] = Array.isArray(eventsData) ? eventsData : [];

    // Need minimum samples before alerting
    if (events.length < ALERT_CONFIG.MIN_SAMPLES) {
      return { shouldAlert: false, stats: null };
    }

    // Calculate statistics
    const stats = calculateStats(events);

    // Check if timeout rate exceeds threshold
    if (stats.timeoutRate < ALERT_CONFIG.TIMEOUT_THRESHOLD) {
      return { shouldAlert: false, stats };
    }

    // Check cooldown period
    const lastAlertData = await kv.get(KV_KEYS.LAST_ALERT);
    if (lastAlertData) {
      const lastAlertTime = new Date(lastAlertData).getTime();
      const now = Date.now();
      const timeSinceLastAlert = now - lastAlertTime;

      if (timeSinceLastAlert < ALERT_CONFIG.COOLDOWN_PERIOD_MS) {
        // Still in cooldown period
        const remainingCooldown = Math.ceil(
          (ALERT_CONFIG.COOLDOWN_PERIOD_MS - timeSinceLastAlert) / 60000
        );
        console.log(
          `[Alerting] In cooldown period - ${remainingCooldown} minutes remaining until next alert`
        );
        return { shouldAlert: false, stats };
      }
    }

    // Should send alert: threshold crossed and cooldown expired
    return { shouldAlert: true, stats };
  } catch (error) {
    console.error('[Alerting] Failed to check alert conditions:', error);
    return { shouldAlert: false, stats: null };
  }
}

/**
 * Send Discord webhook notification
 *
 * @param webhookUrl - Discord webhook URL
 * @param stats - Alert statistics to include in notification
 */
export async function sendDiscordAlert(webhookUrl: string, stats: AlertStats): Promise<void> {
  try {
    const timeoutPercent = (stats.timeoutRate * 100).toFixed(1);
    const avgDurationMs = stats.avgDuration.toFixed(0);

    // Create Discord embed with alert details
    const payload = {
      embeds: [
        {
          title: '⚠️ Brightness Analysis Alert',
          description: `High timeout rate detected in TRMNL Google Photos Plugin`,
          color: 0xffa500, // Orange
          fields: [
            {
              name: '📊 Timeout Rate',
              value: `**${timeoutPercent}%** (${stats.timeouts}/${stats.totalAttempts} requests)`,
              inline: true,
            },
            {
              name: '✅ Success Rate',
              value: `${stats.success}/${stats.totalAttempts} requests`,
              inline: true,
            },
            {
              name: '❌ Errors',
              value: `${stats.errors} API errors`,
              inline: true,
            },
            {
              name: '⏱️ Avg Duration',
              value: `${avgDurationMs}ms (successful requests)`,
              inline: true,
            },
            {
              name: '🎯 Threshold',
              value: `${ALERT_CONFIG.TIMEOUT_THRESHOLD * 100}% (crossed)`,
              inline: true,
            },
            {
              name: '📅 Time Window',
              value: `Last ${stats.totalAttempts} requests`,
              inline: true,
            },
          ],
          footer: {
            text: 'TRMNL Google Photos Plugin',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // Send webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log(
      `[Alerting] Discord alert sent - Timeout rate: ${timeoutPercent}% (${stats.timeouts}/${stats.totalAttempts})`
    );
  } catch (error) {
    console.error('[Alerting] Failed to send Discord webhook:', error);
    throw error;
  }
}

/**
 * Update last alert timestamp in KV
 *
 * @param kv - Cloudflare KV namespace
 */
async function updateLastAlertTimestamp(kv: KVNamespace): Promise<void> {
  try {
    const now = new Date().toISOString();
    await kv.put(KV_KEYS.LAST_ALERT, now, {
      expirationTtl: 86400, // 24 hours
    });
  } catch (error) {
    console.error('[Alerting] Failed to update last alert timestamp:', error);
  }
}

/**
 * Check brightness metrics and send alert if needed
 * Main entry point for alerting system
 *
 * @param kv - Cloudflare KV namespace
 * @param webhookUrl - Discord webhook URL (optional)
 * @param metrics - Latest brightness metrics
 *
 * @example
 * await checkAndAlert(c.env.PHOTOS_CACHE, c.env.DISCORD_WEBHOOK_URL, metrics);
 */
export async function checkAndAlert(
  kv: KVNamespace | undefined,
  webhookUrl: string | undefined,
  metrics: BrightnessMetrics
): Promise<void> {
  // Skip if KV or webhook not configured
  if (!kv || !webhookUrl) {
    return;
  }

  try {
    // Track the event in sliding window
    await trackBrightnessEvent(kv, metrics);

    // Check if alert should be sent
    const { shouldAlert, stats } = await shouldSendAlert(kv);

    if (shouldAlert && stats) {
      // Send Discord alert
      await sendDiscordAlert(webhookUrl, stats);

      // Update last alert timestamp
      await updateLastAlertTimestamp(kv);

      console.log(
        `[Alerting] Alert sent and cooldown started (${ALERT_CONFIG.COOLDOWN_PERIOD_MS / 60000} minutes)`
      );
    }
  } catch (error) {
    // Don't throw - alerting failures shouldn't break the app
    console.error('[Alerting] Alert check failed:', error);
  }
}
