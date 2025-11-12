/**
 * RED Tests for Network Error Handler
 *
 * Tests for widget/src/utils/network-error-handler.ts
 *
 * WHY THESE TESTS WILL FAIL:
 * - Production module does not exist yet (widget/src/utils/network-error-handler.ts)
 * - classifyError and getUserMessage functions are not implemented
 * - NetworkError interface is not defined yet
 * - This is the RED phase of TDD - tests are written BEFORE production code
 *
 * Test Coverage:
 * 1. Classify fetch errors correctly (network, timeout, abort, CORS)
 * 2. Map HTTP status codes to error types and user messages
 *
 * Module Purpose:
 * - Classifies JavaScript/fetch errors into typed NetworkError categories
 * - Maps HTTP status codes to error types
 * - Determines if errors are retryable
 * - Provides user-friendly error messages
 * - Centralizes error handling logic for consistency
 */

import { describe, it, expect } from 'vitest';
// @ts-expect-error - Module does not exist yet (RED phase)
import {
  NetworkError,
  classifyError,
  getUserMessage,
} from '@/widget/src/utils/network-error-handler';

describe('NetworkErrorHandler - RED Tests', () => {
  // ============================================================
  // Test 1: Classify fetch errors correctly
  // ============================================================

  it('should classify network errors (fetch failures)', () => {
    // ARRANGE
    const fetchError = new TypeError('Failed to fetch');

    // ACT
    const result = classifyError(fetchError);

    // ASSERT
    expect(result.type).toBe('network');
    expect(result.retryable).toBe(true);
    expect(result.message).toContain('network');
    expect(result.originalError).toBe(fetchError);
  });

  it('should classify timeout errors', () => {
    // ARRANGE
    const timeoutError = new DOMException('The operation was aborted', 'TimeoutError');

    // ACT
    const result = classifyError(timeoutError);

    // ASSERT
    expect(result.type).toBe('timeout');
    expect(result.retryable).toBe(true);
    expect(result.message).toContain('timeout');
    expect(result.originalError).toBe(timeoutError);
  });

  it('should classify abort errors', () => {
    // ARRANGE
    const abortError = new DOMException('The user aborted a request', 'AbortError');

    // ACT
    const result = classifyError(abortError);

    // ASSERT
    expect(result.type).toBe('abort');
    expect(result.retryable).toBe(false);
    expect(result.message).toContain('cancelled');
    expect(result.originalError).toBe(abortError);
  });

  it('should classify CORS errors', () => {
    // ARRANGE
    // CORS errors often manifest as "Failed to fetch" with no response
    // We need to distinguish them by checking for CORS-specific error messages
    const corsError = new TypeError('NetworkError when attempting to fetch resource.');

    // ACT
    const result = classifyError(corsError);

    // ASSERT
    // CORS errors should be classified as 'cors' type
    // Note: Real CORS detection might require additional context
    expect(result.type).toMatch(/network|cors/);
    expect(result.retryable).toBe(false); // CORS errors are not retryable
  });

  it('should classify parse errors (invalid JSON)', () => {
    // ARRANGE
    const parseError = new SyntaxError('Unexpected token < in JSON at position 0');

    // ACT
    const result = classifyError(parseError);

    // ASSERT
    expect(result.type).toBe('parse');
    expect(result.retryable).toBe(false);
    expect(result.message).toContain('parse');
    expect(result.originalError).toBe(parseError);
  });

  // ============================================================
  // Test 2: Map HTTP status codes to error types and messages
  // ============================================================

  it('should classify 4xx client errors as non-retryable', () => {
    // ARRANGE
    const mockResponse400 = new Response(null, { status: 400, statusText: 'Bad Request' });
    const mockResponse401 = new Response(null, { status: 401, statusText: 'Unauthorized' });
    const mockResponse404 = new Response(null, { status: 404, statusText: 'Not Found' });
    const mockResponse429 = new Response(null, {
      status: 429,
      statusText: 'Too Many Requests',
    });

    // ACT
    const result400 = classifyError(mockResponse400);
    const result401 = classifyError(mockResponse401);
    const result404 = classifyError(mockResponse404);
    const result429 = classifyError(mockResponse429);

    // ASSERT
    // 4xx errors (except 429) should be non-retryable
    expect(result400.type).toBe('http');
    expect(result400.statusCode).toBe(400);
    expect(result400.retryable).toBe(false);

    expect(result401.type).toBe('http');
    expect(result401.statusCode).toBe(401);
    expect(result401.retryable).toBe(false);

    expect(result404.type).toBe('http');
    expect(result404.statusCode).toBe(404);
    expect(result404.retryable).toBe(false);

    // 429 (rate limit) should be retryable
    expect(result429.type).toBe('http');
    expect(result429.statusCode).toBe(429);
    expect(result429.retryable).toBe(true);
  });

  it('should classify 5xx server errors as retryable', () => {
    // ARRANGE
    const mockResponse500 = new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
    const mockResponse502 = new Response(null, { status: 502, statusText: 'Bad Gateway' });
    const mockResponse503 = new Response(null, {
      status: 503,
      statusText: 'Service Unavailable',
    });
    const mockResponse504 = new Response(null, { status: 504, statusText: 'Gateway Timeout' });

    // ACT
    const result500 = classifyError(mockResponse500);
    const result502 = classifyError(mockResponse502);
    const result503 = classifyError(mockResponse503);
    const result504 = classifyError(mockResponse504);

    // ASSERT
    // All 5xx errors should be retryable
    expect(result500.type).toBe('http');
    expect(result500.statusCode).toBe(500);
    expect(result500.retryable).toBe(true);

    expect(result502.type).toBe('http');
    expect(result502.statusCode).toBe(502);
    expect(result502.retryable).toBe(true);

    expect(result503.type).toBe('http');
    expect(result503.statusCode).toBe(503);
    expect(result503.retryable).toBe(true);

    expect(result504.type).toBe('http');
    expect(result504.statusCode).toBe(504);
    expect(result504.retryable).toBe(true);
  });

  it('should provide user-friendly error messages', () => {
    // ARRANGE
    const networkError: NetworkError = {
      type: 'network',
      message: 'Network request failed',
      retryable: true,
    };

    const timeoutError: NetworkError = {
      type: 'timeout',
      message: 'Request timeout after 30000ms',
      retryable: true,
    };

    const httpError: NetworkError = {
      type: 'http',
      message: 'Internal server error',
      statusCode: 500,
      retryable: true,
    };

    const corsError: NetworkError = {
      type: 'cors',
      message: 'CORS policy blocked the request',
      retryable: false,
    };

    const parseError: NetworkError = {
      type: 'parse',
      message: 'Failed to parse JSON response',
      retryable: false,
    };

    // ACT
    const networkMessage = getUserMessage(networkError);
    const timeoutMessage = getUserMessage(timeoutError);
    const httpMessage = getUserMessage(httpError);
    const corsMessage = getUserMessage(corsError);
    const parseMessage = getUserMessage(parseError);

    // ASSERT
    // Messages should be user-friendly, not technical
    expect(networkMessage).toMatch(
      /connection|network|unable to connect|check your internet/i
    );
    expect(timeoutMessage).toMatch(/timeout|slow|taking too long/i);
    expect(httpMessage).toMatch(/server|try again|temporarily unavailable/i);
    expect(corsMessage).toMatch(/configuration|contact|not accessible/i);
    expect(parseMessage).toMatch(/response|format|unexpected/i);

    // Messages should not contain raw error codes or technical jargon
    expect(networkMessage).not.toMatch(/TypeError|fetch/);
    expect(httpMessage).not.toMatch(/500|5xx/);
  });

  it('should handle unknown errors gracefully', () => {
    // ARRANGE
    const unknownError = new Error('Something unexpected happened');
    const stringError = 'Just a string error';
    const nullError = null;

    // ACT
    const result1 = classifyError(unknownError);
    const result2 = classifyError(stringError);
    const result3 = classifyError(nullError);

    // ASSERT
    // Unknown errors should be classified as 'network' (safest fallback)
    expect(result1.type).toBe('network');
    expect(result1.retryable).toBe(true); // Default to retryable for unknown errors

    expect(result2.type).toBe('network');
    expect(result2.retryable).toBe(true);

    expect(result3.type).toBe('network');
    expect(result3.retryable).toBe(true);

    // Should provide generic user message
    const message1 = getUserMessage(result1);
    expect(message1).toMatch(/error|something went wrong|try again/i);
  });
});
