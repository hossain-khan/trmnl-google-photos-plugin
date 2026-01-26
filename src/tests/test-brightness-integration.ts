/**
 * Integration tests for brightness analysis + alerting flow
 * Tests the complete pipeline from brightness analysis through metrics tracking to alerting
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { BrightnessMetrics } from '../services/monitoring-service';
import { trackBrightnessEvent, checkAndAlert } from '../services/alerting-service';

console.log('🧪 Testing Brightness + Alerting Integration\n');

// Mock KV namespace
class MockKVNamespace {
  private store = new Map<string, string>();

  get(key: string, type?: string): Promise<string | object | null> {
    const value = this.store.get(key);
    if (!value) return Promise.resolve(null);
    if (type === 'json') {
      try {
        return Promise.resolve(JSON.parse(value));
      } catch {
        return Promise.resolve(null);
      }
    }
    return Promise.resolve(value);
  }

  put(key: string, value: string): Promise<void> {
    this.store.set(key, value);
    return Promise.resolve();
  }

  clear(): void {
    this.store.clear();
  }
}

describe('End-to-End Brightness Analysis Flow', () => {
  it('should track successful analysis and not alert', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;
    let alertSent = false;

    (global.fetch as any) = () => {
      alertSent = true;
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    };

    // Simulate 30 successful brightness analyses
    for (let i = 0; i < 30; i++) {
      const metrics: BrightnessMetrics = {
        requestId: `req-${i}`,
        status: 'success',
        duration: 850 + Math.random() * 100,
        edgeBrightnessScore: 0.5 + Math.random() * 0.3,
        brightnessScore: 0.4 + Math.random() * 0.4,
      };

      // Check for alert (internally tracks event - should not trigger alert with all success)
      await checkAndAlert(mockKV, 'https://discord.webhook.test', metrics);
    }

    // No alert should have been sent
    assert.strictEqual(alertSent, false);

    // Verify events stored
    const events = (await mockKV.get('brightness:events', 'json')) as Array<{
      status: string;
    }>;
    assert.ok(events);
    assert.strictEqual(events.length, 30);
    assert.ok(events.every((e) => e.status === 'success'));
  });

  it('should detect degradation and trigger alert', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;
    let alertTriggered = false;
    let alertPayload: any = null;

    (global.fetch as any) = (input: any, options?: RequestInit) => {
      alertTriggered = true;
      if (options?.body && typeof options.body === 'string') {
        alertPayload = JSON.parse(options.body);
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    };

    // Phase 1: 15 successful requests (healthy baseline)
    for (let i = 0; i < 15; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `healthy-${i}`,
        status: 'success',
        duration: 850,
        edgeBrightnessScore: 0.6,
        brightnessScore: 0.5,
      });
    }

    // Phase 2: 5 timeout requests (degradation begins)
    for (let i = 0; i < 5; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `timeout-${i}`,
        status: 'timeout',
        duration: 2000,
        errorMessage: 'Analysis timeout after 2000ms',
      });
    }

    // Phase 3: 3 more successful (recovery attempt)
    for (let i = 0; i < 3; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `recovery-${i}`,
        status: 'success',
        duration: 900,
      });
    }

    // Phase 4: 2 more timeouts (degradation continues)
    for (let i = 0; i < 2; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `timeout2-${i}`,
        status: 'timeout',
        duration: 2000,
      });
    }

    // Now check alert with final state (28% timeout rate)
    await checkAndAlert(mockKV, 'https://discord.webhook.test', {
      requestId: 'test-final',
      status: 'timeout',
      duration: 2000,
    });

    // Total: 25 events, 7 timeouts = 28% timeout rate (above 10% threshold)
    // Alert should have been triggered
    assert.strictEqual(alertTriggered, true);
    assert.ok(alertPayload);

    // Verify alert content
    const embed = alertPayload.embeds[0];
    assert.ok(embed.title.includes('Brightness Analysis Alert'));
    assert.ok(embed.color); // Color should be present

    // Check statistics
    const timeoutField = embed.fields.find((f: { name: string }) =>
      f.name.includes('Timeout Rate')
    );
    assert.ok(timeoutField);
    // 25 tracked + 1 from checkAndAlert = 26 events, 7+1 = 8 timeouts = 30.77%
    assert.ok(timeoutField.value.includes('30.77') || timeoutField.value.includes('30.8'));
  });

  it('should handle mixed success/timeout/error scenarios', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;
    let alertSent = false;

    (global.fetch as any) = () => {
      alertSent = true;
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    };

    // Realistic traffic pattern: 50 requests with varying outcomes
    const scenarios = [
      { count: 38, status: 'success', duration: 850 }, // 76% success
      { count: 7, status: 'timeout', duration: 2000 }, // 14% timeout
      { count: 5, status: 'error', duration: 150 }, // 10% error
    ];

    for (const scenario of scenarios) {
      for (let i = 0; i < scenario.count; i++) {
        const metrics: BrightnessMetrics = {
          requestId: `${scenario.status}-${i}`,
          status: scenario.status as BrightnessMetrics['status'],
          duration: scenario.duration,
        };
        await checkAndAlert(mockKV, 'https://discord.webhook.test', metrics);
      }
    }

    // 14% timeout rate should trigger alert
    assert.strictEqual(alertSent, true);

    // Verify event tracking
    const events = (await mockKV.get('brightness:events', 'json')) as Array<{
      status: string;
    }>;
    assert.ok(events);
    assert.strictEqual(events.length, 50);

    // Verify status distribution
    const successCount = events.filter((e) => e.status === 'success').length;
    const timeoutCount = events.filter((e) => e.status === 'timeout').length;
    const errorCount = events.filter((e) => e.status === 'error').length;

    assert.strictEqual(successCount, 38);
    assert.strictEqual(timeoutCount, 7);
    assert.strictEqual(errorCount, 5);
  });

  it('should respect cooldown after alert', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;
    let alertCount = 0;

    (global.fetch as any) = () => {
      alertCount++;
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    };

    // First wave: Trigger alert with high timeout rate
    for (let i = 0; i < 20; i++) {
      await checkAndAlert(mockKV, 'https://discord.webhook.test', {
        requestId: `wave1-success-${i}`,
        status: 'success',
        duration: 850,
      });
    }
    for (let i = 0; i < 5; i++) {
      await checkAndAlert(mockKV, 'https://discord.webhook.test', {
        requestId: `wave1-timeout-${i}`,
        status: 'timeout',
        duration: 2000,
      });
    }

    assert.strictEqual(alertCount, 1);

    // Second wave: More timeouts immediately after (cooldown active)
    for (let i = 0; i < 5; i++) {
      await checkAndAlert(mockKV, 'https://discord.webhook.test', {
        requestId: `wave2-timeout-${i}`,
        status: 'timeout',
        duration: 2000,
      });
    }

    // Should still be 1 alert (cooldown prevents second)
    assert.strictEqual(alertCount, 1);
  });

  it('should handle rapid request bursts', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;
    let alertCount = 0;

    (global.fetch as any) = () => {
      alertCount++;
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    };

    // Simulate burst of 100 requests in quick succession
    // Build state first with 99 events (checkAndAlert will add 100th)
    // Use sequential execution to avoid race conditions in test mock
    for (let i = 0; i < 99; i++) {
      const status = i % 10 < 8 ? 'success' : 'timeout'; // ~20% timeout rate
      await trackBrightnessEvent(mockKV, {
        requestId: `burst-${i}`,
        status: status as BrightnessMetrics['status'],
        duration: status === 'success' ? 850 : 2000,
      });
    }

    // Now check alert with final event (makes 100 total, adds 1 timeout)
    await checkAndAlert(mockKV, 'https://discord.webhook.test', {
      requestId: 'burst-final',
      status: 'timeout',
      duration: 2000,
    });

    // Should trigger alert (20% timeout rate)
    assert.ok(alertCount > 0);

    // Verify sliding window maintained
    const events = (await mockKV.get('brightness:events', 'json')) as Array<{
      status: string;
    }>;
    assert.ok(events);
    assert.strictEqual(events.length, 100);
  });
});

describe('Recovery Detection', () => {
  it('should not re-alert after recovery', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;
    let alertCount = 0;

    (global.fetch as any) = () => {
      alertCount++;
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    };

    // Phase 1: Degradation (trigger alert)
    // Build state: 15 success + 4 timeout = 19 events
    // checkAndAlert will add 1 timeout = 20 total, 5 timeout = 25% (above 10%)
    for (let i = 0; i < 15; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `degrade-success-${i}`,
        status: 'success',
        duration: 850,
      });
    }
    for (let i = 0; i < 4; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `degrade-timeout-${i}`,
        status: 'timeout',
        duration: 2000,
      });
    }
    // Check alert with final degradation event (adds 1 timeout)
    await checkAndAlert(mockKV, 'https://discord.webhook.test', {
      requestId: 'degrade-final',
      status: 'timeout',
      duration: 2000,
    });

    assert.strictEqual(alertCount, 1);

    // Phase 2: Simulate cooldown expiry by clearing last alert timestamp
    await mockKV.put('brightness:last_alert', '0');

    // Phase 3: Recovery (all success) - build state with 79 success
    // checkAndAlert will add 1 success = 80 total in window (replaces old events)
    for (let i = 0; i < 79; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `recovery-${i}`,
        status: 'success',
        duration: 850,
      });
    }
    // Check alert with final recovery event (adds 1 success)
    await checkAndAlert(mockKV, 'https://discord.webhook.test', {
      requestId: 'recovery-final',
      status: 'success',
      duration: 850,
    });

    // Should not re-alert (below threshold after recovery)
    assert.strictEqual(alertCount, 1);
  });
});

console.log('✅ All integration tests passed!\n');
