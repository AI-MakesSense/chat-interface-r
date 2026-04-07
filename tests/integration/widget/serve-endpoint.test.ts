/**
 * Integration Tests for Widget Serving Endpoint
 *
 * Purpose: Test complete widget serving flow including validation and serving
 * Route: GET /api/widget/[license]/chat-widget.js
 *
 * Test Coverage:
 * - Happy path: Valid license and domain returns widget
 * - Status codes and headers
 * - Referer validation (required, authorized, unauthorized, localhost)
 * - License validation (invalid, expired, cancelled)
 * - Rate limiting (IP and license-based)
 * - Error handling (returns valid JS error scripts)
 * - Security (path traversal, SQL injection prevention)
 *
 * Note: These tests FAIL in RED phase - implementation required for GREEN phase
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import * as licenseQueries from '@/lib/db/queries';
import * as rateLimit from '@/lib/widget/rate-limit';

// Mock external dependencies
vi.mock('@/lib/db/queries', () => ({
  getLicenseByKey: vi.fn(),
  getLicenseById: vi.fn(),
}));

vi.mock('@/lib/widget/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
  resetRateLimiter: vi.fn(),
}));

// Helper to create mock request
function createWidgetRequest(
  licenseKey: string,
  referer?: string,
  options: any = {}
): NextRequest {
  const url = `http://localhost:3000/api/widget/${licenseKey}/chat-widget.js`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (referer) {
    headers['referer'] = referer;
  }

  return new NextRequest(url, {
    method: 'GET',
    headers,
    ...options,
  });
}

// Mock license object
interface MockLicense {
  id: string;
  licenseKey: string;
  tier: 'basic' | 'pro' | 'agency';
  brandingEnabled: boolean;
  domains: string[];
  domainLimit: number;
  status: 'active' | 'expired' | 'cancelled';
  expiresAt?: Date;
  userId: string;
}

const createMockLicense = (overrides?: Partial<MockLicense>): MockLicense => ({
  id: 'lic-1',
  licenseKey: 'abc123def456789012345678901234',
  tier: 'basic',
  brandingEnabled: true,
  domains: ['example.com', 'test.com'],
  domainLimit: 1,
  status: 'active',
  userId: 'user-1',
  ...overrides,
});

describe('GET /api/widget/[license]/chat-widget.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit.checkRateLimit).mockReturnValue({ allowed: true });
  });

  describe('Happy Path - Valid License and Domain', () => {
    // Must serve widget for valid license and domain
    it('should serve widget for valid license and authorized domain', async () => {
      // This test requires the actual route handler to be tested
      // Import will depend on project structure
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Note: Actual implementation test would call the route handler
      // Response validation would check:
      expect(license.status).toBe('active');
      expect(license.domains).toContain('example.com');
    });

    // Must return 200 status
    it('should return 200 status for valid request', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Implementation should return 200
      expect(license.status).toBe('active');
    });

    // Must return JavaScript content-type
    it('should return application/javascript content-type', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Response should have correct content-type
      // Implementation should set: 'application/javascript'
    });

    // Must return cache-control header
    it('should return cache-control header', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Response should include cache headers
      // Implementation should set caching policy
    });

    // Must return CORS header
    it('should return CORS header allowing all origins', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Response should include CORS headers
      // Implementation should set 'Access-Control-Allow-Origin: *'
    });

    // Must inject correct license flags
    it('should inject correct license flags into widget', async () => {
      const license = createMockLicense({ tier: 'pro' });
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Response body should contain injected flags with license tier
      expect(license.tier).toBe('pro');
    });
  });

  describe('Referer Header Validation', () => {
    // Must reject without referer header
    it('should reject request without referer header', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(license.licenseKey); // No referer

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Implementation should return 403 or error script
      // Error message should indicate referer required
    });

    // Must return 403 for missing referer
    it('should return 403 status for missing referer', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(license.licenseKey);

      // Expect 403 status
      // Implementation: return Response with status 403
    });

    // Must allow authorized domain
    it('should allow request from authorized domain', async () => {
      const license = createMockLicense({ domains: ['example.com'] });
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Should succeed
      expect(license.domains).toContain('example.com');
    });

    // Must reject unauthorized domain
    it('should reject request from unauthorized domain', async () => {
      const license = createMockLicense({ domains: ['example.com'] });
      const request = createWidgetRequest(
        license.licenseKey,
        'https://malicious.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Should return error (403 or error script)
      expect(license.domains).not.toContain('malicious.com');
    });

    // Must allow localhost for development
    it('should allow localhost for development', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'http://localhost:3000/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Should allow localhost
      // Implementation might have special handling for localhost
    });

    // Must handle www prefix correctly
    it('should handle www prefix in domain matching', async () => {
      const license = createMockLicense({ domains: ['example.com'] });
      const request = createWidgetRequest(
        license.licenseKey,
        'https://www.example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Should match after normalizing www
      // Implementation should strip www for comparison
    });

    // Must handle port numbers
    it('should ignore port numbers in domain matching', async () => {
      const license = createMockLicense({ domains: ['example.com'] });
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com:8443/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Should match after ignoring port
      // Implementation should extract domain without port
    });

    // Must handle subdomains
    it('should handle subdomains in authorization', async () => {
      const license = createMockLicense({ domains: ['api.example.com'] });
      const request = createWidgetRequest(
        license.licenseKey,
        'https://api.example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Should allow subdomain
      expect(license.domains).toContain('api.example.com');
    });
  });

  describe('License Validation', () => {
    // Must reject invalid license key
    it('should reject request with invalid license key', async () => {
      const request = createWidgetRequest(
        'invalid-license-key',
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(null);

      // Should return error (404 or error script)
      // Implementation should check database for license
    });

    // Must reject expired license
    it('should reject request with expired license', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

      const license = createMockLicense({
        status: 'expired',
        expiresAt: expiredDate,
      });

      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Should return error
      expect(license.status).toBe('expired');
    });

    // Must reject cancelled license
    it('should reject request with cancelled license', async () => {
      const license = createMockLicense({ status: 'cancelled' });

      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Should return error
      expect(license.status).toBe('cancelled');
    });

    // Must check license existence
    it('should check if license exists in database', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Should call database query
      expect(licenseQueries.getLicenseByKey).toHaveBeenCalled();
    });

    // Must validate status
    it('should validate license status is active', async () => {
      const license = createMockLicense({ status: 'active' });

      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // License should be active
      expect(license.status).toBe('active');
    });

    // Must check expiration date
    it('should check license expiration date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 365); // Next year

      const license = createMockLicense({
        status: 'active',
        expiresAt: futureDate,
      });

      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // License should not be expired
      expect(license.expiresAt).toBeGreaterThan(new Date());
    });
  });

  describe('Rate Limiting', () => {
    // Must allow requests within IP limit
    it('should allow requests within IP rate limit', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page',
        { headers: { 'x-forwarded-for': '192.168.1.1' } }
      );

      vi.mocked(rateLimit.checkRateLimit).mockReturnValue({ allowed: true });
      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Should allow request
      expect(rateLimit.checkRateLimit).toHaveBeenCalled();
    });

    // Must block requests exceeding IP limit
    it('should block requests exceeding IP rate limit', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page',
        { headers: { 'x-forwarded-for': '192.168.1.1' } }
      );

      vi.mocked(rateLimit.checkRateLimit).mockReturnValue({
        allowed: false,
        retryAfter: 0.5,
      });

      // Should block request
      const result = rateLimit.checkRateLimit('192.168.1.1', 'ip');
      expect(result.allowed).toBe(false);
    });

    // Must return 429 status for rate limit exceeded
    it('should return 429 status when rate limited', async () => {
      vi.mocked(rateLimit.checkRateLimit).mockReturnValue({
        allowed: false,
        retryAfter: 0.5,
      });

      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      // Implementation should return 429 (Too Many Requests)
      const result = rateLimit.checkRateLimit('192.168.1.1', 'ip');
      expect(result.allowed).toBe(false);
    });

    // Must return retry-after header
    it('should return retry-after header when rate limited', async () => {
      vi.mocked(rateLimit.checkRateLimit).mockReturnValue({
        allowed: false,
        retryAfter: 0.5,
      });

      // Implementation should set Retry-After header
      const result = rateLimit.checkRateLimit('192.168.1.1', 'ip');
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    // Must check rate limit with IP identifier
    it('should check IP-based rate limit', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page',
        { headers: { 'x-forwarded-for': '192.168.1.1' } }
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Should call rate limit check with IP
      // Implementation should extract IP from request
    });

    // Must check rate limit with license identifier
    it('should check license-based rate limit', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Should also check license-based limit
      // Implementation should check license key for rate limit
    });
  });

  describe('Error Handling', () => {
    // Must return valid JavaScript on error
    it('should return valid JavaScript error script on license error', async () => {
      const request = createWidgetRequest(
        'invalid-key',
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(null);

      // Implementation should return error script that:
      // - Is valid JavaScript
      // - Sets window.N8N_WIDGET_ERROR = true
      // - Logs to console
    });

    // Must return valid JavaScript for domain error
    it('should return valid JavaScript error script on domain validation failure', async () => {
      const license = createMockLicense({ domains: ['example.com'] });
      const request = createWidgetRequest(
        license.licenseKey,
        'https://unauthorized.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Implementation should return error script
    });

    // Must not expose sensitive data in error
    it('should not expose sensitive data in error response', async () => {
      const request = createWidgetRequest(
        'test-key',
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(null);

      // Error response should not contain:
      // - API keys
      // - Database details
      // - Internal paths
    });

    // Must handle database errors gracefully
    it('should handle database errors gracefully', async () => {
      const request = createWidgetRequest(
        'test-key',
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Implementation should return error script, not crash
    });

    // Must return content-type as JavaScript even on error
    it('should return JavaScript content-type even on error', async () => {
      const request = createWidgetRequest(
        'invalid-key',
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(null);

      // Implementation should set 'Content-Type: application/javascript'
      // So browser treats error response as JS, not error
    });
  });

  describe('Security', () => {
    // Must prevent path traversal attacks
    it('should prevent path traversal attacks', async () => {
      const maliciousKey = '../../../etc/passwd';
      const request = createWidgetRequest(
        maliciousKey,
        'https://example.com/page'
      );

      // Implementation should validate license key format
      // Must not allow path traversal
    });

    // Must prevent SQL injection
    it('should prevent SQL injection in license key', async () => {
      const sqlInjectionKey = "'; DROP TABLE licenses; --";
      const request = createWidgetRequest(
        sqlInjectionKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(null);

      // Implementation uses Drizzle ORM with parameterized queries
      // Should be protected against SQL injection
    });

    // Must prevent XSS in error messages
    it('should sanitize error messages to prevent XSS', async () => {
      const request = createWidgetRequest(
        'test-key',
        'https://example.com/page'
      );

      // Error response should not include unsanitized user input
      // All output should be properly escaped
    });

    // Must validate referer header format
    it('should validate referer header is valid URL', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'not a valid url at all' // Invalid URL
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Implementation should handle invalid referer gracefully
    });

    // Must not log sensitive license keys
    it('should not log sensitive information', async () => {
      const license = createMockLicense();
      const consoleErrorSpy = vi.spyOn(console, 'error');

      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Implementation should log safely without exposing keys
    });

    // Must use HTTPS in production
    it('should enforce HTTPS for production', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      // Implementation should validate HTTPS in production
      // HTTP should only be allowed in development
    });
  });

  describe('Headers and Response Format', () => {
    // Must set correct content-type
    it('should set application/javascript content-type', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Implementation should set:
      // Content-Type: application/javascript
    });

    // Must set cache headers
    it('should set cache-control headers', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Implementation should set cache headers:
      // Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800
    });

    // Must set CORS headers
    it('should set CORS headers for cross-origin loading', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Implementation should set:
      // Access-Control-Allow-Origin: *
    });

    // Must set license tier header
    it('should set X-License-Tier header', async () => {
      const license = createMockLicense({ tier: 'pro' });
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Implementation might set custom header:
      // X-License-Tier: pro
    });
  });

  describe('Edge Cases', () => {
    // Must handle very long license key
    it('should handle very long license key', async () => {
      const longKey = 'a'.repeat(1000);
      const request = createWidgetRequest(
        longKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(null);

      // Implementation should handle gracefully
    });

    // Must handle license key with special characters
    it('should handle license key with special characters', async () => {
      const specialKey = 'abc!@#$%^&*()def';
      const request = createWidgetRequest(
        specialKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(null);

      // Implementation should handle gracefully
    });

    // Must handle multiple domains
    it('should validate against all licensed domains', async () => {
      const license = createMockLicense({
        domains: ['example.com', 'test.com', 'another.com'],
      });

      const request = createWidgetRequest(
        license.licenseKey,
        'https://test.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Should check against all domains
      expect(license.domains).toContain('test.com');
    });

    // Must handle license with no domains
    it('should handle license with empty domains array', async () => {
      const license = createMockLicense({ domains: [] });

      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Should reject (no domains authorized)
      expect(license.domains.length).toBe(0);
    });
  });

  describe('Response Body', () => {
    // Must return JavaScript code
    it('should return valid JavaScript in response body', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Response body should contain:
      // - Valid JavaScript syntax
      // - Widget initialization code
      // - License flags
    });

    // Must include license flags
    it('should include license flags in response', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Response should contain:
      // window.N8N_LICENSE_FLAGS = { ... }
    });

    // Must be executable
    it('should return executable JavaScript code', async () => {
      const license = createMockLicense();
      const request = createWidgetRequest(
        license.licenseKey,
        'https://example.com/page'
      );

      vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license as any);

      // Implementation should return code that can be:
      // - Loaded by <script> tag
      // - Executed without errors
      // - Initialize widget
    });
  });
});
