/**
 * Unit Tests for Widget Rate Limiting
 *
 * Purpose: Test rate limiting for widget serving (IP-based and license-based)
 * Module: lib/widget/rate-limit.ts
 *
 * Test Coverage:
 * - checkRateLimit: Check if request is within rate limits (10/sec per IP, 100/min per license)
 * - resetRateLimiter: Clear rate limit state
 *
 * Note: These tests FAIL in RED phase - implementation required for GREEN phase
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkRateLimit, resetRateLimiter } from '@/lib/widget/rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Reset rate limiter before each test
    resetRateLimiter();
    // Use fake timers for consistent testing
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('IP Rate Limiting (10 requests/second)', () => {
    // Must allow IP within limit
    it('should allow IP within limit (10/sec)', () => {
      const ip = '192.168.1.1';

      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(ip, 'ip');
        expect(result.allowed).toBe(true);
      }
    });

    // Must block IP exceeding limit
    it('should block IP exceeding limit', () => {
      const ip = '192.168.1.1';

      // Allow 10 requests
      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(ip, 'ip');
        expect(result.allowed).toBe(true);
      }

      // 11th request should be blocked
      const result = checkRateLimit(ip, 'ip');
      expect(result.allowed).toBe(false);
    });

    // Must return retry-after for blocked IP
    it('should return retry-after for blocked IP', () => {
      const ip = '192.168.1.1';

      // Exhaust limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit(ip, 'ip');
      }

      // Check blocked request
      const result = checkRateLimit(ip, 'ip');
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    // Must reset limit after time window
    it('should reset IP limit after 1 second window', () => {
      const ip = '192.168.1.1';

      // Exhaust limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit(ip, 'ip');
      }

      // Verify blocked
      let result = checkRateLimit(ip, 'ip');
      expect(result.allowed).toBe(false);

      // Advance time by 1 second
      vi.advanceTimersByTime(1000);

      // Should allow again
      result = checkRateLimit(ip, 'ip');
      expect(result.allowed).toBe(true);
    });

    // Must handle multiple IPs independently
    it('should track different IPs independently', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // Exhaust limit for IP1
      for (let i = 0; i < 10; i++) {
        checkRateLimit(ip1, 'ip');
      }

      // IP1 should be blocked
      let result = checkRateLimit(ip1, 'ip');
      expect(result.allowed).toBe(false);

      // IP2 should still be allowed
      result = checkRateLimit(ip2, 'ip');
      expect(result.allowed).toBe(true);
    });

    // Must handle rate limit boundary
    it('should allow exactly 10 requests per second', () => {
      const ip = '192.168.1.1';
      const results = [];

      for (let i = 0; i < 10; i++) {
        results.push(checkRateLimit(ip, 'ip'));
      }

      results.forEach((result, index) => {
        expect(result.allowed).toBe(true);
      });
    });

    // 11th request should be blocked
    it('should block 11th request in same second', () => {
      const ip = '192.168.1.1';

      for (let i = 0; i < 10; i++) {
        checkRateLimit(ip, 'ip');
      }

      const result = checkRateLimit(ip, 'ip');
      expect(result.allowed).toBe(false);
    });
  });

  describe('License Rate Limiting (100 requests/minute)', () => {
    // Must allow license within limit
    it('should allow license within limit (100/min)', () => {
      const licenseKey = 'license-abc123';

      for (let i = 0; i < 100; i++) {
        const result = checkRateLimit(licenseKey, 'license');
        expect(result.allowed).toBe(true);
      }
    });

    // Must block license exceeding limit
    it('should block license exceeding limit', () => {
      const licenseKey = 'license-abc123';

      // Allow 100 requests
      for (let i = 0; i < 100; i++) {
        checkRateLimit(licenseKey, 'license');
      }

      // 101st request should be blocked
      const result = checkRateLimit(licenseKey, 'license');
      expect(result.allowed).toBe(false);
    });

    // Must return retry-after for blocked license
    it('should return retry-after for blocked license', () => {
      const licenseKey = 'license-abc123';

      // Exhaust limit
      for (let i = 0; i < 100; i++) {
        checkRateLimit(licenseKey, 'license');
      }

      // Check blocked request
      const result = checkRateLimit(licenseKey, 'license');
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    // Must reset limit after 1 minute window
    it('should reset license limit after 1 minute window', () => {
      const licenseKey = 'license-abc123';

      // Exhaust limit
      for (let i = 0; i < 100; i++) {
        checkRateLimit(licenseKey, 'license');
      }

      // Verify blocked
      let result = checkRateLimit(licenseKey, 'license');
      expect(result.allowed).toBe(false);

      // Advance time by 1 minute
      vi.advanceTimersByTime(60000);

      // Should allow again
      result = checkRateLimit(licenseKey, 'license');
      expect(result.allowed).toBe(true);
    });

    // Must handle different licenses independently
    it('should track different licenses independently', () => {
      const license1 = 'license-abc123';
      const license2 = 'license-xyz789';

      // Exhaust limit for license1
      for (let i = 0; i < 100; i++) {
        checkRateLimit(license1, 'license');
      }

      // license1 should be blocked
      let result = checkRateLimit(license1, 'license');
      expect(result.allowed).toBe(false);

      // license2 should still be allowed
      result = checkRateLimit(license2, 'license');
      expect(result.allowed).toBe(true);
    });

    // Must allow exactly 100 requests per minute
    it('should allow exactly 100 requests per minute', () => {
      const licenseKey = 'license-abc123';
      const results = [];

      for (let i = 0; i < 100; i++) {
        results.push(checkRateLimit(licenseKey, 'license'));
      }

      results.forEach(result => {
        expect(result.allowed).toBe(true);
      });
    });

    // 101st request should be blocked
    it('should block 101st request in same minute', () => {
      const licenseKey = 'license-abc123';

      for (let i = 0; i < 100; i++) {
        checkRateLimit(licenseKey, 'license');
      }

      const result = checkRateLimit(licenseKey, 'license');
      expect(result.allowed).toBe(false);
    });
  });

  describe('IP vs License Independence', () => {
    // IP and license limits should be independent
    it('should not confuse IP limits with license limits', () => {
      const ip = '192.168.1.1';
      const license = 'license-abc123';

      // Exhaust IP limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit(ip, 'ip');
      }

      // IP should be blocked
      let result = checkRateLimit(ip, 'ip');
      expect(result.allowed).toBe(false);

      // But same value as license identifier should not be blocked
      result = checkRateLimit(license, 'license');
      expect(result.allowed).toBe(true);
    });

    // License limit should not affect IP limit
    it('should maintain independent counters for IP and license', () => {
      const identifier = 'test-identifier';

      // Exhaust IP limit for this identifier
      for (let i = 0; i < 10; i++) {
        checkRateLimit(identifier, 'ip');
      }

      // IP limit should be hit
      let result = checkRateLimit(identifier, 'ip');
      expect(result.allowed).toBe(false);

      // But license limit should not be affected
      result = checkRateLimit(identifier, 'license');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Return Type', () => {
    // Must return object with allowed property
    it('should return object with allowed boolean', () => {
      const result = checkRateLimit('192.168.1.1', 'ip');
      expect(typeof result).toBe('object');
      expect(typeof result.allowed).toBe('boolean');
    });

    // Must include retryAfter only when blocked
    it('should return retryAfter only when blocked', () => {
      const ip = '192.168.1.1';

      // First request should not have retryAfter
      let result = checkRateLimit(ip, 'ip');
      expect(result.retryAfter).toBeUndefined();

      // Exhaust limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit(ip, 'ip');
      }

      // Blocked request should have retryAfter
      result = checkRateLimit(ip, 'ip');
      expect(result.retryAfter).toBeDefined();
      expect(typeof result.retryAfter).toBe('number');
    });

    // retryAfter must be positive number
    it('should have positive number for retryAfter', () => {
      const ip = '192.168.1.1';

      // Exhaust limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit(ip, 'ip');
      }

      // Check retryAfter
      const result = checkRateLimit(ip, 'ip');
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('Time Window Management', () => {
    // Must handle time progression correctly
    it('should handle progressive time advancement', () => {
      const ip = '192.168.1.1';

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip, 'ip');
      }

      // Advance time by 500ms (still in window)
      vi.advanceTimersByTime(500);

      // Make 5 more requests (total 10, within limit)
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(ip, 'ip');
        expect(result.allowed).toBe(true);
      }

      // 11th request should be blocked
      let result = checkRateLimit(ip, 'ip');
      expect(result.allowed).toBe(false);

      // Advance time beyond 1 second
      vi.advanceTimersByTime(600);

      // Should reset
      result = checkRateLimit(ip, 'ip');
      expect(result.allowed).toBe(true);
    });

    // Must handle multiple windows
    it('should handle requests across multiple windows', () => {
      const ip = '192.168.1.1';

      // First window: 10 requests
      for (let i = 0; i < 10; i++) {
        checkRateLimit(ip, 'ip');
      }

      // Advance to next window
      vi.advanceTimersByTime(1000);

      // Second window: should allow 10 more
      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(ip, 'ip');
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    // Must handle empty identifier
    it('should handle requests with identifier', () => {
      const result = checkRateLimit('', 'ip');
      expect(result.allowed).toBeDefined();
    });

    // Must handle very long identifier
    it('should handle long identifiers', () => {
      const longId = 'x'.repeat(1000);
      const result = checkRateLimit(longId, 'ip');
      expect(result.allowed).toBe(true);
    });

    // Must handle special characters in identifier
    it('should handle special characters in identifier', () => {
      const specialId = '192.168.1.1:8080@!#$%';
      const result = checkRateLimit(specialId, 'ip');
      expect(result.allowed).toBeDefined();
    });

    // Must handle rapid successive calls
    it('should handle rapid successive calls correctly', () => {
      const ip = '192.168.1.1';

      // Make requests rapidly
      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(ip, 'ip');
        expect(result.allowed).toBe(true);
      }

      const result = checkRateLimit(ip, 'ip');
      expect(result.allowed).toBe(false);
    });
  });

  describe('Reset Behavior', () => {
    // Must clear all rate limit data
    it('should clear all rate limit data on reset', () => {
      const ip = '192.168.1.1';

      // Exhaust limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit(ip, 'ip');
      }

      // Verify blocked
      let result = checkRateLimit(ip, 'ip');
      expect(result.allowed).toBe(false);

      // Reset
      resetRateLimiter();

      // Should allow again
      result = checkRateLimit(ip, 'ip');
      expect(result.allowed).toBe(true);
    });

    // Must reset for all identifiers
    it('should reset limits for all identifiers', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';
      const license = 'license-abc123';

      // Exhaust limits
      for (let i = 0; i < 10; i++) {
        checkRateLimit(ip1, 'ip');
        checkRateLimit(ip2, 'ip');
        checkRateLimit(license, 'license');
      }

      // All should be blocked
      let result = checkRateLimit(ip1, 'ip');
      expect(result.allowed).toBe(false);

      result = checkRateLimit(ip2, 'ip');
      expect(result.allowed).toBe(false);

      // Reset
      resetRateLimiter();

      // All should be allowed
      result = checkRateLimit(ip1, 'ip');
      expect(result.allowed).toBe(true);

      result = checkRateLimit(ip2, 'ip');
      expect(result.allowed).toBe(true);

      result = checkRateLimit(license, 'license');
      expect(result.allowed).toBe(true);
    });

    // Reset should allow new requests immediately
    it('should allow new requests immediately after reset', () => {
      const ip = '192.168.1.1';

      // Make request
      checkRateLimit(ip, 'ip');

      // Reset
      resetRateLimiter();

      // Should allow new request
      const result = checkRateLimit(ip, 'ip');
      expect(result.allowed).toBe(true);
    });
  });
});

describe('resetRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Must be callable
  it('should be callable without errors', () => {
    expect(() => {
      resetRateLimiter();
    }).not.toThrow();
  });

  // Must clear state
  it('should clear rate limit state', () => {
    const ip = '192.168.1.1';

    // Exhaust limit
    for (let i = 0; i < 10; i++) {
      checkRateLimit(ip, 'ip');
    }

    // Clear
    resetRateLimiter();

    // Should allow new requests
    const result = checkRateLimit(ip, 'ip');
    expect(result.allowed).toBe(true);
  });

  // Should not return value
  it('should be void function', () => {
    const result = resetRateLimiter();
    expect(result).toBeUndefined();
  });
});
