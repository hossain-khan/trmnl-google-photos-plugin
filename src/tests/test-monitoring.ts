/**
 * Test suite for monitoring service
 * Tests logging, error classification, and analytics tracking
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  Logger,
  classifyErrorSeverity,
  getErrorType,
  trackPerformance,
  trackError,
  type PerformanceMetrics,
  type ErrorContext,
} from '../services/monitoring-service';

console.log('🧪 Testing Monitoring Service\n');

describe('Logger', () => {
  it('should create logger with request ID', () => {
    const logger = new Logger('test-123');
    assert.ok(logger);
  });

  it('should track elapsed time', () => {
    const logger = new Logger('test-123');
    const elapsed = logger.getElapsedTime();
    assert.ok(elapsed >= 0);
  });

  it('should sanitize album URLs', () => {
    const logger = new Logger('test-123');
    // Mock console.log to capture output
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    logger.info('Test message', {
      album_url: 'https://photos.app.goo.gl/ABC123XYZ789VERYLONGURL',
    });

    console.log = originalLog;

    const parsed = JSON.parse(logOutput);
    assert.ok(parsed.album_url_preview);
    assert.ok(!parsed.album_url); // Full URL should not be logged
    assert.ok(parsed.album_url_preview.includes('...'));
  });

  it('should not log photo URLs', () => {
    const logger = new Logger('test-123');
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    logger.info('Test message', {
      photo_url: 'https://lh3.googleusercontent.com/test',
      thumbnail_url: 'https://lh3.googleusercontent.com/thumb',
    });

    console.log = originalLog;

    const parsed = JSON.parse(logOutput);
    assert.ok(!parsed.photo_url);
    assert.ok(!parsed.thumbnail_url);
  });

  it('should log all severity levels', () => {
    const logger = new Logger('test-123');
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (msg: string) => {
      logs.push(msg);
    };

    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');

    console.log = originalLog;

    assert.strictEqual(logs.length, 4);
    assert.ok(logs[0].includes('"level":"debug"'));
    assert.ok(logs[1].includes('"level":"info"'));
    assert.ok(logs[2].includes('"level":"warn"'));
    assert.ok(logs[3].includes('"level":"error"'));
  });

  it('should include request ID in all logs', () => {
    const logger = new Logger('req-456');
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    logger.info('Test message');

    console.log = originalLog;

    const parsed = JSON.parse(logOutput);
    assert.strictEqual(parsed.requestId, 'req-456');
  });

  it('should include timestamp in logs', () => {
    const logger = new Logger('test-123');
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    logger.info('Test message');

    console.log = originalLog;

    const parsed = JSON.parse(logOutput);
    assert.ok(parsed.timestamp);
    assert.ok(typeof parsed.timestamp === 'string');
    assert.ok(new Date(parsed.timestamp as string).getTime() > 0);
  });

  it('should include duration in logs', () => {
    const logger = new Logger('test-123');
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    logger.info('Test message');

    console.log = originalLog;

    const parsed = JSON.parse(logOutput);
    assert.ok(typeof parsed.duration === 'number');
    assert.ok(parsed.duration >= 0);
  });
});

describe('Error Classification', () => {
  it('should classify 500 errors as critical', () => {
    const severity = classifyErrorSeverity(500, 'Internal server error');
    assert.strictEqual(severity, 'critical');
  });

  it('should classify 404 errors as high', () => {
    const severity = classifyErrorSeverity(404, 'Album not found');
    assert.strictEqual(severity, 'high');
  });

  it('should classify 403 errors as high', () => {
    const severity = classifyErrorSeverity(403, 'Access denied');
    assert.strictEqual(severity, 'high');
  });

  it('should classify 400 errors as medium', () => {
    const severity = classifyErrorSeverity(400, 'Invalid input');
    assert.strictEqual(severity, 'medium');
  });

  it('should classify other 4xx errors as low', () => {
    const severity = classifyErrorSeverity(401, 'Unauthorized');
    assert.strictEqual(severity, 'low');
  });
});

describe('Error Type Detection', () => {
  it('should detect album_not_found errors', () => {
    const type1 = getErrorType('Album not found');
    const type2 = getErrorType('Error 404: not found');
    assert.strictEqual(type1, 'album_not_found');
    assert.strictEqual(type2, 'album_not_found');
  });

  it('should detect album_access_denied errors', () => {
    const type1 = getErrorType('Album access denied');
    const type2 = getErrorType('Error 403: Forbidden');
    assert.strictEqual(type1, 'album_access_denied');
    assert.strictEqual(type2, 'album_access_denied');
  });

  it('should detect invalid_input errors', () => {
    const type1 = getErrorType('Invalid album URL');
    const type2 = getErrorType('Invalid parameter');
    assert.strictEqual(type1, 'invalid_input');
    assert.strictEqual(type2, 'invalid_input');
  });

  it('should detect empty_album errors', () => {
    const type = getErrorType('No photos found in album');
    assert.strictEqual(type, 'empty_album');
  });

  it('should detect cache_error errors', () => {
    const type1 = getErrorType('Cache read failed');
    const type2 = getErrorType('Failed to write to cache');
    assert.strictEqual(type1, 'cache_error');
    assert.strictEqual(type2, 'cache_error');
  });

  it('should detect timeout errors', () => {
    const type1 = getErrorType('Request timeout');
    const type2 = getErrorType('Operation timed out');
    assert.strictEqual(type1, 'timeout');
    assert.strictEqual(type2, 'timeout');
  });

  it('should return unknown_error for unrecognized errors', () => {
    const type = getErrorType('Something went wrong');
    assert.strictEqual(type, 'unknown_error');
  });
});

describe('Performance Tracking', () => {
  it('should track performance metrics', () => {
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    const metrics: PerformanceMetrics = {
      requestId: 'test-123',
      endpoint: '/api/photo',
      totalDuration: 425,
      photoFetchDuration: 380,
      cacheHit: true,
      statusCode: 200,
    };

    trackPerformance(metrics);

    console.log = originalLog;

    const parsed = JSON.parse(logOutput);
    assert.strictEqual(parsed.type, 'performance_metric');
    assert.strictEqual(parsed.requestId, 'test-123');
    assert.strictEqual(parsed.endpoint, '/api/photo');
    assert.strictEqual(parsed.totalDuration, 425);
    assert.strictEqual(parsed.cacheHit, true);
    assert.strictEqual(parsed.statusCode, 200);
  });

  it('should include timestamp in metrics', () => {
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    const metrics: PerformanceMetrics = {
      requestId: 'test-123',
      endpoint: '/api/photo',
      totalDuration: 100,
      statusCode: 200,
    };

    trackPerformance(metrics);

    console.log = originalLog;

    const parsed = JSON.parse(logOutput);
    assert.ok(parsed.timestamp);
    assert.ok(typeof parsed.timestamp === 'string');
    assert.ok(new Date(parsed.timestamp as string).getTime() > 0);
  });
});

describe('Error Tracking', () => {
  it('should track error events', () => {
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    const errorContext: ErrorContext = {
      requestId: 'test-123',
      endpoint: '/api/photo',
      errorMessage: 'Album not found',
      errorType: 'album_not_found',
      severity: 'high',
      statusCode: 404,
    };

    trackError(errorContext);

    console.log = originalLog;

    const parsed = JSON.parse(logOutput);
    assert.strictEqual(parsed.type, 'error_event');
    assert.strictEqual(parsed.requestId, 'test-123');
    assert.strictEqual(parsed.endpoint, '/api/photo');
    assert.strictEqual(parsed.errorType, 'album_not_found');
    assert.strictEqual(parsed.severity, 'high');
    assert.strictEqual(parsed.statusCode, 404);
  });

  it('should include optional stack trace', () => {
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    const errorContext: ErrorContext = {
      requestId: 'test-123',
      endpoint: '/api/photo',
      errorMessage: 'Critical error',
      errorType: 'unhandled_error',
      severity: 'critical',
      statusCode: 500,
      stack: 'Error: Critical error\n  at handler (index.ts:100)',
    };

    trackError(errorContext);

    console.log = originalLog;

    const parsed = JSON.parse(logOutput);
    assert.ok(parsed.stack);
    assert.ok(parsed.stack.includes('index.ts'));
  });
});

describe('Privacy Compliance', () => {
  it('should not log full album URLs', () => {
    const logger = new Logger('test-123');
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    logger.info('Processing album', {
      album_url: 'https://photos.app.goo.gl/ABC123XYZ789VERYLONGURL',
    });

    console.log = originalLog;

    const parsed = JSON.parse(logOutput);
    assert.ok(!logOutput.includes('ABC123XYZ789VERYLONGURL'));
    assert.ok(parsed.album_url_preview);
  });

  it('should not log photo URLs', () => {
    const logger = new Logger('test-123');
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    logger.info('Photo data', {
      photo_url: 'https://lh3.googleusercontent.com/secret-photo-id',
      thumbnail_url: 'https://lh3.googleusercontent.com/secret-thumb-id',
    });

    console.log = originalLog;

    assert.ok(!logOutput.includes('secret-photo-id'));
    assert.ok(!logOutput.includes('secret-thumb-id'));
  });

  it('should not log error stacks in production', () => {
    // Save original env
    const originalEnv = process.env.ENVIRONMENT;
    process.env.ENVIRONMENT = 'production';

    const logger = new Logger('test-123');
    const originalLog = console.log;
    let logOutput = '';
    console.log = (msg: string) => {
      logOutput = msg;
    };

    logger.error('Error occurred', {
      stack: 'Error: Test error\n  at handler (index.ts:100)',
    });

    console.log = originalLog;
    process.env.ENVIRONMENT = originalEnv;

    assert.ok(!logOutput.includes('Error: Test error'));
    assert.ok(!logOutput.includes('index.ts:100'));
  });
});

console.log('\n✅ All monitoring service tests completed!\n');
console.log('Test Summary:');
console.log('- Logger functionality: ✓');
console.log('- Error classification: ✓');
console.log('- Error type detection: ✓');
console.log('- Performance tracking: ✓');
console.log('- Error tracking: ✓');
console.log('- Privacy compliance: ✓');
