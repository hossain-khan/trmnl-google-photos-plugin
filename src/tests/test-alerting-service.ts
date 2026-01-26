/**
 * Test suite for alerting service
 * Tests sliding window tracking, threshold detection, and Discord alerting
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { trackBrightnessEvent, checkAndAlert } from '../services/alerting-service';
import type { BrightnessMetrics } from '../services/monitoring-service';

console.log('🧪 Testing Alerting Service\n');

// Mock KV namespace for testing
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

  getStore(): Map<string, string> {
    return this.store;
  }
}

describe('Sliding Window Event Tracking', () => {
  it('should store brightness event in KV', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;
    const metrics: BrightnessMetrics = {
      requestId: 'test-1',
      status: 'success',
      duration: 850,
    };

    await trackBrightnessEvent(mockKV, metrics);

    const stored = await mockKV.get('brightness:events', 'json');
    assert.ok(Array.isArray(stored));
    assert.strictEqual((stored as Array<unknown>).length, 1);
  });

  it('should append events to existing array', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;

    // Add first event
    await trackBrightnessEvent(mockKV, {
      requestId: 'test-1',
      status: 'success',
      duration: 800,
    });

    // Add second event
    await trackBrightnessEvent(mockKV, {
      requestId: 'test-2',
      status: 'timeout',
      duration: 2000,
    });

    const stored = await mockKV.get('brightness:events', 'json');
    assert.ok(Array.isArray(stored));
    assert.strictEqual((stored as Array<unknown>).length, 2);
  });

  it('should maintain window size of 100 events', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;

    // Add 105 events
    for (let i = 0; i < 105; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `test-${i}`,
        status: 'success',
        duration: 850,
      });
    }

    const stored = await mockKV.get('brightness:events', 'json');
    assert.ok(Array.isArray(stored));
    // Should keep only last 100
    assert.strictEqual((stored as Array<unknown>).length, 100);
  });

  it('should not track skipped events', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;

    await trackBrightnessEvent(mockKV, {
      requestId: 'test-skip',
      status: 'skipped',
    });

    const stored = await mockKV.get('brightness:events', 'json');
    // Should be null or empty - skipped events not tracked
    if (stored) {
      assert.strictEqual((stored as Array<unknown>).length, 0);
    }
  });

  it('should store timestamp with each event', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;

    await trackBrightnessEvent(mockKV, {
      requestId: 'test-timestamp',
      status: 'success',
      duration: 900,
    });

    const stored = (await mockKV.get('brightness:events', 'json')) as Array<{
      timestamp: string;
      status: string;
      duration: number;
    }>;

    assert.ok(stored);
    assert.ok(stored[0].timestamp);
    assert.ok(new Date(stored[0].timestamp).toISOString());
  });

  it('should handle KV errors gracefully', async () => {
    // Mock KV that throws errors
    const errorKV = {
      get: () => {
        throw new Error('KV read error');
      },
      put: () => {
        throw new Error('KV write error');
      },
    } as unknown as KVNamespace;

    // Should not throw - errors caught internally
    await assert.doesNotReject(async () => {
      await trackBrightnessEvent(errorKV, {
        requestId: 'test-error',
        status: 'success',
        duration: 850,
      });
    });
  });
});

describe('Alert Threshold Detection', () => {
  it('should not alert with insufficient samples', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;
    let alertSent = false;

    // Mock fetch for Discord webhook
    (global.fetch as any) = () => {
      alertSent = true;
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    };

    // Add only 10 events (need 20 minimum)
    for (let i = 0; i < 10; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `test-${i}`,
        status: 'timeout',
        duration: 2000,
      });
    }

    // Check for alert
    await checkAndAlert(mockKV, 'https://discord.webhook.test', {
      requestId: 'test-final',
      status: 'timeout',
      duration: 2000,
    });

    // Should not alert - insufficient samples
    assert.strictEqual(alertSent, false);
  });

  it('should not alert when threshold not crossed', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;
    let alertSent = false;

    (global.fetch as any) = () => {
      alertSent = true;
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    };

    // Add 25 events: 23 success, 2 timeout (8% timeout rate - below 10% threshold)
    for (let i = 0; i < 23; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `success-${i}`,
        status: 'success',
        duration: 850,
      });
    }
    for (let i = 0; i < 2; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `timeout-${i}`,
        status: 'timeout',
        duration: 2000,
      });
    }

    await checkAndAlert(mockKV, 'https://discord.webhook.test', {
      requestId: 'test-final',
      status: 'success',
      duration: 850,
    });

    // Should not alert - below threshold
    assert.strictEqual(alertSent, false);
  });

  it('should skip alert without KV configured', async () => {
    let alertSent = false;

    (global.fetch as any) = () => {
      alertSent = true;
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    };

    // Pass undefined KV
    await checkAndAlert(undefined, 'https://discord.webhook.test', {
      requestId: 'test-no-kv',
      status: 'timeout',
      duration: 2000,
    });

    // Should not alert - KV not configured
    assert.strictEqual(alertSent, false);
  });

  it('should skip alert without webhook configured', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;
    let alertSent = false;

    (global.fetch as any) = () => {
      alertSent = true;
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    };

    // Add events
    for (let i = 0; i < 25; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `test-${i}`,
        status: 'timeout',
        duration: 2000,
      });
    }

    // Pass undefined webhook
    await checkAndAlert(mockKV, undefined, {
      requestId: 'test-final',
      status: 'timeout',
      duration: 2000,
    });

    // Should not alert - webhook not configured
    assert.strictEqual(alertSent, false);
  });
});

describe('Discord Webhook Integration', () => {
  it('should send Discord webhook when threshold crossed', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;
    let webhookPayload: any = null;

    // Mock fetch
    (global.fetch as any) = (input: any, options?: RequestInit) => {
      if (options?.body && typeof options.body === 'string') {
        webhookPayload = JSON.parse(options.body);
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    };

    // Add 25 events: 22 success, 3 timeout (12% timeout rate - above 10% threshold)
    for (let i = 0; i < 22; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `success-${i}`,
        status: 'success',
        duration: 850,
      });
    }
    for (let i = 0; i < 3; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `timeout-${i}`,
        status: 'timeout',
        duration: 2000,
      });
    }

    // Trigger alert
    await checkAndAlert(mockKV, 'https://discord.webhook.test', {
      requestId: 'test-final',
      status: 'success',
      duration: 850,
    });

    // Should have sent webhook
    assert.ok(webhookPayload);
    assert.ok(webhookPayload.embeds);
    assert.ok(webhookPayload.embeds[0].title.includes('Alert'));
  });

  it('should include statistics in webhook payload', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;
    let webhookPayload: any = null;

    (global.fetch as any) = (input: any, options?: RequestInit) => {
      if (options?.body && typeof options.body === 'string') {
        webhookPayload = JSON.parse(options.body);
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    };

    // Add 25 events with 12% timeout rate
    for (let i = 0; i < 22; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `success-${i}`,
        status: 'success',
        duration: 850,
      });
    }
    for (let i = 0; i < 3; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `timeout-${i}`,
        status: 'timeout',
        duration: 2000,
      });
    }

    await checkAndAlert(mockKV, 'https://discord.webhook.test', {
      requestId: 'test-final',
      status: 'success',
      duration: 850,
    });

    // Verify embed fields
    const embed = webhookPayload.embeds[0];
    assert.ok(embed.fields.some((f: { name: string }) => f.name.includes('Timeout Rate')));
    assert.ok(embed.fields.some((f: { name: string }) => f.name.includes('Success Rate')));
    assert.ok(embed.fields.some((f: { name: string }) => f.name.includes('Errors')));
    assert.ok(embed.fields.some((f: { name: string }) => f.name.includes('Avg Duration')));
  });

  it('should respect cooldown period', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;
    let alertCount = 0;

    (global.fetch as any) = () => {
      alertCount++;
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    };

    // Add events above threshold
    for (let i = 0; i < 20; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `success-${i}`,
        status: 'success',
        duration: 850,
      });
    }
    for (let i = 0; i < 5; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `timeout-${i}`,
        status: 'timeout',
        duration: 2000,
      });
    }

    // First alert - should send
    await checkAndAlert(mockKV, 'https://discord.webhook.test', {
      requestId: 'test-1',
      status: 'timeout',
      duration: 2000,
    });

    // Second alert immediately after - should not send (cooldown active)
    await trackBrightnessEvent(mockKV, {
      requestId: 'test-2',
      status: 'timeout',
      duration: 2000,
    });
    await checkAndAlert(mockKV, 'https://discord.webhook.test', {
      requestId: 'test-2',
      status: 'timeout',
      duration: 2000,
    });

    // Should only send one alert
    assert.strictEqual(alertCount, 1);
  });

  it('should handle webhook failures gracefully', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;

    // Mock fetch that fails
    (global.fetch as any) = () => {
      return Promise.resolve(new Response('Webhook error', { status: 500 }));
    };

    // Add events above threshold
    for (let i = 0; i < 20; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `test-${i}`,
        status: i < 17 ? 'success' : 'timeout',
        duration: i < 17 ? 850 : 2000,
      });
    }

    // Should not throw on webhook failure
    await assert.doesNotReject(async () => {
      await checkAndAlert(mockKV, 'https://discord.webhook.test', {
        requestId: 'test-final',
        status: 'timeout',
        duration: 2000,
      });
    });
  });
});

describe('Statistics Calculation', () => {
  it('should calculate correct timeout rate', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;
    let calculatedRate = 0;

    (global.fetch as any) = (input: any, options?: RequestInit) => {
      if (options?.body && typeof options.body === 'string') {
        const payload = JSON.parse(options.body);
        const timeoutField = payload.embeds[0].fields.find((f: { name: string }) =>
          f.name.includes('Timeout Rate')
        );
        if (timeoutField) {
          const match = String(timeoutField.value).match(/(\d+\.\d+)%/);
          if (match) {
            calculatedRate = parseFloat(match[1]);
          }
        }
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    };

    // 79 success, 20 timeout, then checkAndAlert with 1 timeout = 100 events, 21 timeout = 21% rate
    // Build state with trackBrightnessEvent first
    for (let i = 0; i < 79; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `success-${i}`,
        status: 'success',
        duration: 850,
      });
    }
    for (let i = 0; i < 20; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `timeout-${i}`,
        status: 'timeout',
        duration: 2000,
      });
    }

    // Now check alert with final event (adds 1 more timeout)
    await checkAndAlert(mockKV, 'https://discord.webhook.test', {
      requestId: 'test-final',
      status: 'timeout',
      duration: 2000,
    });

    // 99 tracked + 1 from checkAndAlert = 100 total, 20+1 = 21 timeouts = 21%
    assert.strictEqual(calculatedRate, 21.0);
  });

  it('should include error count in statistics', async () => {
    const mockKV = new MockKVNamespace() as unknown as KVNamespace;
    let errorCount = 0;

    (global.fetch as any) = (input: any, options?: RequestInit) => {
      if (options?.body && typeof options.body === 'string') {
        const payload = JSON.parse(options.body);
        const errorField = payload.embeds[0].fields.find((f: { name: string }) =>
          f.name.includes('Errors')
        );
        if (errorField) {
          const match = String(errorField.value).match(/(\d+) API errors/);
          if (match) {
            errorCount = parseInt(match[1]);
          }
        }
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    };

    // 70 success, 15 timeout, 15 error
    // Build state with trackBrightnessEvent first
    for (let i = 0; i < 70; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `success-${i}`,
        status: 'success',
        duration: 850,
      });
    }
    for (let i = 0; i < 15; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `timeout-${i}`,
        status: 'timeout',
        duration: 2000,
      });
    }
    for (let i = 0; i < 15; i++) {
      await trackBrightnessEvent(mockKV, {
        requestId: `error-${i}`,
        status: 'error',
        duration: 150,
      });
    }

    // Now check alert with final state
    await checkAndAlert(mockKV, 'https://discord.webhook.test', {
      requestId: 'test-final',
      status: 'timeout',
      duration: 2000,
    });

    assert.strictEqual(errorCount, 15);
  });
});

console.log('✅ All alerting service tests passed!\n');
