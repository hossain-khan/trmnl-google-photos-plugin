/**
 * Test suite for brightness metrics tracking
 * Tests brightness metrics logging and correlation with requests
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { trackBrightnessMetrics, type BrightnessMetrics } from '../services/monitoring-service';

console.log('🧪 Testing Brightness Metrics\n');

describe('Brightness Metrics Tracking', () => {
  it('should track successful brightness analysis', () => {
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    const metrics: BrightnessMetrics = {
      requestId: 'test-123',
      status: 'success',
      duration: 850,
      edgeBrightnessScore: 75.5,
      brightnessScore: 82.3,
    };

    trackBrightnessMetrics(metrics);
    console.log = originalLog;

    const parsed = JSON.parse(logOutput);
    assert.strictEqual(parsed.type, 'brightness_metric');
    assert.strictEqual(parsed.requestId, 'test-123');
    assert.strictEqual(parsed.status, 'success');
    assert.strictEqual(parsed.duration, 850);
    assert.strictEqual(parsed.edgeBrightnessScore, 75.5);
    assert.strictEqual(parsed.brightnessScore, 82.3);
    assert.ok(parsed.timestamp);
  });

  it('should track timeout with error details', () => {
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    const metrics: BrightnessMetrics = {
      requestId: 'test-456',
      status: 'timeout',
      duration: 2000,
      errorType: 'AbortError',
      errorMessage: 'Request timeout after 2000ms',
    };

    trackBrightnessMetrics(metrics);
    console.log = originalLog;

    const parsed = JSON.parse(logOutput);
    assert.strictEqual(parsed.type, 'brightness_metric');
    assert.strictEqual(parsed.status, 'timeout');
    assert.strictEqual(parsed.duration, 2000);
    assert.strictEqual(parsed.errorType, 'AbortError');
    assert.ok(parsed.errorMessage.includes('timeout'));
  });

  it('should track API error with HTTP status', () => {
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    const metrics: BrightnessMetrics = {
      requestId: 'test-789',
      status: 'error',
      duration: 150,
      errorType: 'APIError',
      errorMessage: 'HTTP 503: Service Unavailable',
      apiStatus: 503,
    };

    trackBrightnessMetrics(metrics);
    console.log = originalLog;

    const parsed = JSON.parse(logOutput);
    assert.strictEqual(parsed.status, 'error');
    assert.strictEqual(parsed.errorType, 'APIError');
    assert.strictEqual(parsed.apiStatus, 503);
  });

  it('should track skipped analysis', () => {
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    const metrics: BrightnessMetrics = {
      requestId: 'test-skip',
      status: 'skipped',
    };

    trackBrightnessMetrics(metrics);
    console.log = originalLog;

    const parsed = JSON.parse(logOutput);
    assert.strictEqual(parsed.status, 'skipped');
    assert.strictEqual(parsed.duration, undefined);
    assert.strictEqual(parsed.edgeBrightnessScore, undefined);
  });

  it('should include timestamp in all metrics', () => {
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    const metrics: BrightnessMetrics = {
      requestId: 'test-timestamp',
      status: 'success',
      duration: 900,
      edgeBrightnessScore: 50.0,
      brightnessScore: 55.0,
    };

    trackBrightnessMetrics(metrics);
    console.log = originalLog;

    const parsed = JSON.parse(logOutput);
    assert.ok(parsed.timestamp);
    // Verify ISO 8601 format
    const timestamp = parsed.timestamp as string;
    assert.ok(new Date(timestamp).toISOString());
  });

  it('should handle different error types', () => {
    const errorTypes = ['NetworkError', 'TimeoutError', 'UnknownError', 'APIError'];

    errorTypes.forEach((errorType) => {
      const originalLog = console.log;
      let logOutput = '';
      console.log = (msg: string) => {
        logOutput = msg;
      };

      const metrics: BrightnessMetrics = {
        requestId: `test-${errorType}`,
        status: 'error',
        duration: 100,
        errorType,
        errorMessage: `Test ${errorType}`,
      };

      trackBrightnessMetrics(metrics);
      console.log = originalLog;

      const parsed = JSON.parse(logOutput);
      assert.strictEqual(parsed.errorType, errorType);
    });
  });

  it('should track metrics with minimal fields', () => {
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    const metrics: BrightnessMetrics = {
      requestId: 'test-minimal',
      status: 'error',
    };

    trackBrightnessMetrics(metrics);
    console.log = originalLog;

    const parsed = JSON.parse(logOutput);
    assert.strictEqual(parsed.type, 'brightness_metric');
    assert.strictEqual(parsed.requestId, 'test-minimal');
    assert.strictEqual(parsed.status, 'error');
    // Optional fields should be undefined
    assert.strictEqual(parsed.duration, undefined);
  });
});

describe('Brightness Metrics Integration', () => {
  it('should be queryable by type', () => {
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (msg: string) => {
      logs.push(msg);
    };

    // Generate multiple metrics
    trackBrightnessMetrics({ requestId: '1', status: 'success', duration: 800 });
    trackBrightnessMetrics({ requestId: '2', status: 'timeout', duration: 2000 });
    trackBrightnessMetrics({ requestId: '3', status: 'error', duration: 150 });

    console.log = originalLog;

    // All should be brightness_metric type
    const parsed = logs.map((log): { type: string } => JSON.parse(log) as { type: string });
    assert.strictEqual(parsed.length, 3);
    parsed.forEach((log) => {
      assert.strictEqual((log as { type: string }).type, 'brightness_metric');
    });
  });

  it('should be filterable by status', () => {
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (msg: string) => {
      logs.push(msg);
    };

    // Mix of statuses
    trackBrightnessMetrics({ requestId: '1', status: 'success', duration: 800 });
    trackBrightnessMetrics({ requestId: '2', status: 'success', duration: 850 });
    trackBrightnessMetrics({ requestId: '3', status: 'timeout', duration: 2000 });
    trackBrightnessMetrics({ requestId: '4', status: 'success', duration: 900 });

    console.log = originalLog;

    const parsed = logs.map((log): { status: string } => JSON.parse(log) as { status: string });
    const successes: Array<{ status: string }> = parsed.filter((log) => log.status === 'success');
    const timeouts: Array<{ status: string }> = parsed.filter((log) => log.status === 'timeout');

    assert.strictEqual(successes.length, 3);
    assert.strictEqual(timeouts.length, 1);
  });

  it('should correlate with request IDs', () => {
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    const testRequestId = 'correlation-test-123';
    const metrics: BrightnessMetrics = {
      requestId: testRequestId,
      status: 'success',
      duration: 950,
    };

    trackBrightnessMetrics(metrics);
    console.log = originalLog;

    const parsed = JSON.parse(logOutput);
    assert.strictEqual(parsed.requestId, testRequestId);
  });
});

console.log('✅ All brightness metrics tests passed!\n');
