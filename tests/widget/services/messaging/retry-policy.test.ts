/**
 * RED Tests for Retry Policy
 *
 * Tests for widget/src/services/messaging/retry-policy.ts
 *
 * WHY THESE TESTS WILL FAIL:
 * - Production module does not exist yet (widget/src/services/messaging/retry-policy.ts)
 * - RetryPolicy class is not implemented
 * - NetworkError types are not defined yet
 * - This is the RED phase of TDD - tests are written BEFORE production code
 *
 * Test Coverage:
 * 1. Return true for retryable errors (network, timeout, 5xx) at attempt 0
 * 2. Return false for non-retryable errors (4xx, CORS, parse)
 * 3. Calculate exponential backoff with jitter
 * 4. Stop retrying after max attempts
 *
 * Module Purpose:
 * - Determines if network errors should be retried
 * - Calculates exponential backoff delays with jitter
 * - Enforces max retry attempts limit
 * - Supports reset for new request cycles
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
// @ts-expect-error - Module does not exist yet (RED phase)
import { RetryPolicy, RetryConfig } from '@/widget/src/services/messaging/retry-policy';
// @ts-expect-error - Module does not exist yet (RED phase)
import { NetworkError } from '@/widget/src/utils/network-error-handler';

describe('RetryPolicy - RED Tests', () => {
  let retryPolicy: RetryPolicy;
  let defaultConfig: RetryConfig;

  beforeEach(() => {
    // Default retry configuration
    defaultConfig = {
      maxAttempts: 3, // Total attempts: initial + 2 retries
      baseDelayMs: 1000, // 1 second base delay
      maxDelayMs: 10000, // 10 seconds max delay
      jitterPercent: 25, // ±25% jitter
    };

    retryPolicy = new RetryPolicy(defaultConfig);
    vi.clearAllMocks();
  });

  // ============================================================
  // Test 1: Return true for retryable errors (network, timeout, 5xx)
  // ============================================================

  it('should return true for retryable errors at attempt 0', () => {
    // ARRANGE
    const networkError: NetworkError = {
      type: 'network',
      message: 'Failed to fetch',
      retryable: true,
    };

    const timeoutError: NetworkError = {
      type: 'timeout',
      message: 'Request timeout',
      retryable: true,
    };

    const serverError: NetworkError = {
      type: 'http',
      message: 'Internal server error',
      statusCode: 500,
      retryable: true,
    };

    const serviceUnavailableError: NetworkError = {
      type: 'http',
      message: 'Service unavailable',
      statusCode: 503,
      retryable: true,
    };

    // ACT & ASSERT
    // Attempt 0 (first retry) should allow retries
    expect(retryPolicy.shouldRetry(0, networkError)).toBe(true);
    expect(retryPolicy.shouldRetry(0, timeoutError)).toBe(true);
    expect(retryPolicy.shouldRetry(0, serverError)).toBe(true);
    expect(retryPolicy.shouldRetry(0, serviceUnavailableError)).toBe(true);

    // Attempt 1 (second retry) should still allow retries
    expect(retryPolicy.shouldRetry(1, networkError)).toBe(true);
    expect(retryPolicy.shouldRetry(1, timeoutError)).toBe(true);
  });

  // ============================================================
  // Test 2: Return false for non-retryable errors (4xx, CORS, parse)
  // ============================================================

  it('should return false for non-retryable errors', () => {
    // ARRANGE
    const badRequestError: NetworkError = {
      type: 'http',
      message: 'Bad request',
      statusCode: 400,
      retryable: false,
    };

    const unauthorizedError: NetworkError = {
      type: 'http',
      message: 'Unauthorized',
      statusCode: 401,
      retryable: false,
    };

    const notFoundError: NetworkError = {
      type: 'http',
      message: 'Not found',
      statusCode: 404,
      retryable: false,
    };

    const corsError: NetworkError = {
      type: 'cors',
      message: 'CORS error',
      retryable: false,
    };

    const parseError: NetworkError = {
      type: 'parse',
      message: 'JSON parse error',
      retryable: false,
    };

    const abortError: NetworkError = {
      type: 'abort',
      message: 'Request aborted',
      retryable: false,
    };

    // ACT & ASSERT
    // Non-retryable errors should always return false, regardless of attempt count
    expect(retryPolicy.shouldRetry(0, badRequestError)).toBe(false);
    expect(retryPolicy.shouldRetry(0, unauthorizedError)).toBe(false);
    expect(retryPolicy.shouldRetry(0, notFoundError)).toBe(false);
    expect(retryPolicy.shouldRetry(0, corsError)).toBe(false);
    expect(retryPolicy.shouldRetry(0, parseError)).toBe(false);
    expect(retryPolicy.shouldRetry(0, abortError)).toBe(false);

    // Should still be false at higher attempt counts
    expect(retryPolicy.shouldRetry(1, badRequestError)).toBe(false);
    expect(retryPolicy.shouldRetry(2, corsError)).toBe(false);
  });

  // ============================================================
  // Test 3: Calculate exponential backoff with jitter
  // ============================================================

  it('should calculate exponential backoff with jitter', () => {
    // ARRANGE
    // Exponential backoff formula: baseDelay * (2 ^ attempt)
    // With jitter: result ± (jitterPercent * result)
    //
    // Expected delays (before jitter):
    // Attempt 0: 1000ms * (2^0) = 1000ms
    // Attempt 1: 1000ms * (2^1) = 2000ms
    // Attempt 2: 1000ms * (2^2) = 4000ms
    // Attempt 3: 1000ms * (2^3) = 8000ms
    //
    // With 25% jitter, acceptable ranges:
    // Attempt 0: 750-1250ms
    // Attempt 1: 1500-2500ms
    // Attempt 2: 3000-5000ms
    // Attempt 3: 6000-10000ms (capped at maxDelayMs)

    // ACT
    const delay0 = retryPolicy.getRetryDelay(0);
    const delay1 = retryPolicy.getRetryDelay(1);
    const delay2 = retryPolicy.getRetryDelay(2);
    const delay3 = retryPolicy.getRetryDelay(3);

    // ASSERT
    // Attempt 0: 1000ms ± 25% = 750-1250ms
    expect(delay0).toBeGreaterThanOrEqual(750);
    expect(delay0).toBeLessThanOrEqual(1250);

    // Attempt 1: 2000ms ± 25% = 1500-2500ms
    expect(delay1).toBeGreaterThanOrEqual(1500);
    expect(delay1).toBeLessThanOrEqual(2500);

    // Attempt 2: 4000ms ± 25% = 3000-5000ms
    expect(delay2).toBeGreaterThanOrEqual(3000);
    expect(delay2).toBeLessThanOrEqual(5000);

    // Attempt 3: 8000ms ± 25% = 6000-10000ms (capped at 10000ms)
    expect(delay3).toBeGreaterThanOrEqual(6000);
    expect(delay3).toBeLessThanOrEqual(10000);

    // Verify delays are increasing (exponential)
    expect(delay1).toBeGreaterThan(delay0);
    expect(delay2).toBeGreaterThan(delay1);
    expect(delay3).toBeGreaterThan(delay2);

    // Verify max delay cap is enforced
    const delay10 = retryPolicy.getRetryDelay(10); // Very high attempt
    expect(delay10).toBeLessThanOrEqual(defaultConfig.maxDelayMs);
  });

  // ============================================================
  // Test 4: Stop retrying after max attempts
  // ============================================================

  it('should stop retrying after max attempts', () => {
    // ARRANGE
    const networkError: NetworkError = {
      type: 'network',
      message: 'Failed to fetch',
      retryable: true,
    };

    // ACT & ASSERT
    // maxAttempts = 3 means: initial attempt + 2 retries
    // Attempts 0 and 1 should allow retries
    expect(retryPolicy.shouldRetry(0, networkError)).toBe(true);
    expect(retryPolicy.shouldRetry(1, networkError)).toBe(true);

    // Attempt 2 should NOT allow retry (reached max)
    expect(retryPolicy.shouldRetry(2, networkError)).toBe(false);

    // Higher attempts should also return false
    expect(retryPolicy.shouldRetry(3, networkError)).toBe(false);
    expect(retryPolicy.shouldRetry(10, networkError)).toBe(false);
  });

  // ============================================================
  // Additional Test: Reset functionality
  // ============================================================

  it('should reset retry state for new request cycle', () => {
    // ARRANGE
    const networkError: NetworkError = {
      type: 'network',
      message: 'Failed to fetch',
      retryable: true,
    };

    // First request cycle
    expect(retryPolicy.shouldRetry(0, networkError)).toBe(true);
    expect(retryPolicy.shouldRetry(1, networkError)).toBe(true);
    expect(retryPolicy.shouldRetry(2, networkError)).toBe(false); // Max reached

    // ACT
    retryPolicy.reset();

    // ASSERT
    // After reset, should allow retries again from attempt 0
    expect(retryPolicy.shouldRetry(0, networkError)).toBe(true);
    expect(retryPolicy.shouldRetry(1, networkError)).toBe(true);
    expect(retryPolicy.shouldRetry(2, networkError)).toBe(false); // Max reached again
  });

  // ============================================================
  // Additional Test: Custom retry configuration
  // ============================================================

  it('should support custom retry configuration', () => {
    // ARRANGE
    const customConfig: RetryConfig = {
      maxAttempts: 5, // More retries
      baseDelayMs: 500, // Shorter base delay
      maxDelayMs: 5000, // Lower max delay
      jitterPercent: 10, // Less jitter
    };

    const customPolicy = new RetryPolicy(customConfig);

    const networkError: NetworkError = {
      type: 'network',
      message: 'Failed to fetch',
      retryable: true,
    };

    // ACT & ASSERT
    // Should allow retries up to attempt 4 (5 total attempts)
    expect(customPolicy.shouldRetry(0, networkError)).toBe(true);
    expect(customPolicy.shouldRetry(1, networkError)).toBe(true);
    expect(customPolicy.shouldRetry(2, networkError)).toBe(true);
    expect(customPolicy.shouldRetry(3, networkError)).toBe(true);
    expect(customPolicy.shouldRetry(4, networkError)).toBe(false); // Max reached

    // Verify custom delays with 10% jitter
    // Attempt 0: 500ms ± 10% = 450-550ms
    const delay0 = customPolicy.getRetryDelay(0);
    expect(delay0).toBeGreaterThanOrEqual(450);
    expect(delay0).toBeLessThanOrEqual(550);

    // Verify max delay cap (5000ms)
    const delay10 = customPolicy.getRetryDelay(10);
    expect(delay10).toBeLessThanOrEqual(5000);
  });
});
