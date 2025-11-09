/**
 * RED Tests for Module 3: License Validation
 *
 * Purpose: Test-driven development for validateLicense() function
 * Status: RED (implementation does not exist yet)
 *
 * Expected to fail with: "Cannot find module '@/lib/license/validate'"
 *
 * Test Coverage:
 * - Valid license scenarios (8 tests)
 * - Invalid license scenarios (12 tests)
 * - Edge cases (12 tests)
 *
 * Total: 32 comprehensive test cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { normalizeDomain } from '@/lib/license/domain';

// This import SHOULD FAIL - the module doesn't exist yet (RED state)
// Expected error: Cannot find module '@/lib/license/validate'
import { validateLicense, type ValidationResult } from '@/lib/license/validate';

// Mock the database client
vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
  },
}));

import * as dbClient from '@/lib/db/client';
import { licenses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('validateLicense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Valid license scenarios', () => {
    it('should validate license with exact domain match (Basic tier)', async () => {
      // This test should fail until validateLicense() is implemented

      // Mock database response
      const mockLicense = {
        id: 'license-id-1',
        userId: 'user-id-1',
        licenseKey: 'abc123def456',
        tier: 'basic',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mock
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      // Test
      const result = await validateLicense('abc123def456', 'example.com');

      // Assertions
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.license).toBeDefined();
      expect(result.license?.id).toBe('license-id-1');
      expect(result.license?.userId).toBe('user-id-1');
      expect(result.license?.tier).toBe('basic');
    });

    it('should validate license with domain in allowedDomains array (Pro tier)', async () => {
      const mockLicense = {
        id: 'license-id-2',
        userId: 'user-id-2',
        licenseKey: 'pro123key456',
        tier: 'pro',
        domains: ['example.com', 'subdomain.example.com'],
        domainLimit: 1,
        brandingEnabled: false,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('pro123key456', 'subdomain.example.com');

      expect(result.valid).toBe(true);
      expect(result.license?.tier).toBe('pro');
    });

    it('should validate license for any domain (Agency tier - unlimited)', async () => {
      const mockLicense = {
        id: 'license-id-3',
        userId: 'user-id-3',
        licenseKey: 'agency999',
        tier: 'agency',
        domains: ['client1.com', 'client2.com', 'client3.com'], // Multiple domains allowed
        domainLimit: -1, // Unlimited
        brandingEnabled: false,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('agency999', 'anydomain.com');

      // Agency tier should allow any domain (unlimited domains)
      expect(result.valid).toBe(true);
      expect(result.license?.tier).toBe('agency');
    });

    it('should normalize domain with HTTPS protocol before validation', async () => {
      const mockLicense = {
        id: 'license-id-4',
        userId: 'user-id-4',
        licenseKey: 'test123',
        tier: 'basic',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      // Pass domain with HTTPS protocol
      const result = await validateLicense('test123', 'https://example.com');

      expect(result.valid).toBe(true);
    });

    it('should normalize domain with WWW prefix before validation', async () => {
      const mockLicense = {
        id: 'license-id-5',
        userId: 'user-id-5',
        licenseKey: 'www-test',
        tier: 'pro',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: false,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      // Pass domain with WWW prefix
      const result = await validateLicense('www-test', 'WWW.EXAMPLE.COM');

      expect(result.valid).toBe(true);
    });

    it('should perform case-insensitive domain matching', async () => {
      const mockLicense = {
        id: 'license-id-6',
        userId: 'user-id-6',
        licenseKey: 'case-test',
        tier: 'basic',
        domains: ['Example.COM'], // Mixed case in database
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      // Pass lowercase domain
      const result = await validateLicense('case-test', 'example.com');

      expect(result.valid).toBe(true);
    });

    it('should normalize domain with port number before validation', async () => {
      const mockLicense = {
        id: 'license-id-7',
        userId: 'user-id-7',
        licenseKey: 'port-test',
        tier: 'basic',
        domains: ['localhost'], // Stored without port
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      // Pass domain with port
      const result = await validateLicense('port-test', 'localhost:3000');

      expect(result.valid).toBe(true);
    });

    it('should return license details in response for valid license', async () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const mockLicense = {
        id: 'license-id-8',
        userId: 'user-id-8',
        licenseKey: 'details-test',
        tier: 'pro',
        domains: ['test.com'],
        domainLimit: 1,
        brandingEnabled: false,
        status: 'active',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('details-test', 'test.com');

      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.license).toEqual({
        id: 'license-id-8',
        userId: 'user-id-8',
        tier: 'pro',
        expiresAt: futureDate,
      });
    });
  });

  describe('Invalid license scenarios', () => {
    it('should reject when license key does not exist in database', async () => {
      // Mock empty result
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]), // Empty array
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('nonexistent-key', 'example.com');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('License not found');
      expect(result.license).toBeUndefined();
    });

    it('should reject when license status is "cancelled"', async () => {
      const mockLicense = {
        id: 'license-id-9',
        userId: 'user-id-9',
        licenseKey: 'cancelled-key',
        tier: 'basic',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: true,
        status: 'cancelled', // Cancelled status
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('cancelled-key', 'example.com');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('License is not active');
      expect(result.license).toBeUndefined();
    });

    it('should reject when license status is "expired"', async () => {
      const mockLicense = {
        id: 'license-id-10',
        userId: 'user-id-10',
        licenseKey: 'expired-status-key',
        tier: 'pro',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: false,
        status: 'expired', // Expired status
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('expired-status-key', 'example.com');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('License is not active');
      expect(result.license).toBeUndefined();
    });

    it('should reject when license expiration date is in the past', async () => {
      const mockLicense = {
        id: 'license-id-11',
        userId: 'user-id-11',
        licenseKey: 'expired-date-key',
        tier: 'basic',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date('2020-01-01'), // Past date
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('expired-date-key', 'example.com');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('License has expired');
      expect(result.license).toBeUndefined();
    });

    it('should reject when domain does not match (Basic tier)', async () => {
      const mockLicense = {
        id: 'license-id-12',
        userId: 'user-id-12',
        licenseKey: 'domain-mismatch',
        tier: 'basic',
        domains: ['authorized.com'],
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('domain-mismatch', 'unauthorized.com');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Domain not authorized');
      expect(result.license).toBeUndefined();
    });

    it('should reject when domain is not in allowedDomains array (Pro tier)', async () => {
      const mockLicense = {
        id: 'license-id-13',
        userId: 'user-id-13',
        licenseKey: 'pro-domain-mismatch',
        tier: 'pro',
        domains: ['allowed1.com', 'allowed2.com'],
        domainLimit: 1,
        brandingEnabled: false,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('pro-domain-mismatch', 'notallowed.com');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Domain not authorized');
      expect(result.license).toBeUndefined();
    });

    it('should reject when domain is empty for Basic tier', async () => {
      const mockLicense = {
        id: 'license-id-14',
        userId: 'user-id-14',
        licenseKey: 'empty-domain-test',
        tier: 'basic',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('empty-domain-test', '');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Domain not authorized');
      expect(result.license).toBeUndefined();
    });

    it('should reject when domain is whitespace-only for Pro tier', async () => {
      const mockLicense = {
        id: 'license-id-15',
        userId: 'user-id-15',
        licenseKey: 'whitespace-domain-test',
        tier: 'pro',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: false,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('whitespace-domain-test', '   ');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Domain not authorized');
      expect(result.license).toBeUndefined();
    });

    it('should reject subdomain when only root domain is authorized', async () => {
      const mockLicense = {
        id: 'license-id-16',
        userId: 'user-id-16',
        licenseKey: 'root-only-key',
        tier: 'basic',
        domains: ['example.com'], // Only root domain authorized
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('root-only-key', 'subdomain.example.com');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Domain not authorized');
      expect(result.license).toBeUndefined();
    });

    it('should reject root domain when only subdomain is authorized', async () => {
      const mockLicense = {
        id: 'license-id-17',
        userId: 'user-id-17',
        licenseKey: 'subdomain-only-key',
        tier: 'pro',
        domains: ['subdomain.example.com'], // Only subdomain authorized
        domainLimit: 1,
        brandingEnabled: false,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('subdomain-only-key', 'example.com');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Domain not authorized');
      expect(result.license).toBeUndefined();
    });

    it('should reject when allowedDomains array is empty (Basic tier)', async () => {
      const mockLicense = {
        id: 'license-id-18',
        userId: 'user-id-18',
        licenseKey: 'empty-domains-array',
        tier: 'basic',
        domains: [], // Empty domains array
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('empty-domains-array', 'example.com');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Domain not authorized');
      expect(result.license).toBeUndefined();
    });

    it('should reject when status is null or undefined', async () => {
      const mockLicense = {
        id: 'license-id-19',
        userId: 'user-id-19',
        licenseKey: 'null-status-key',
        tier: 'basic',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: true,
        status: null as any, // Null status (should be treated as inactive)
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('null-status-key', 'example.com');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('License is not active');
      expect(result.license).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty license key', async () => {
      // Mock empty result for empty key
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('', 'example.com');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('License not found');
      expect(result.license).toBeUndefined();
    });

    it('should handle license key with special characters', async () => {
      const mockLicense = {
        id: 'license-id-20',
        userId: 'user-id-20',
        licenseKey: 'abc-123_def.456',
        tier: 'basic',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('abc-123_def.456', 'example.com');

      expect(result.valid).toBe(true);
    });

    it('should handle domain with path and query parameters', async () => {
      const mockLicense = {
        id: 'license-id-21',
        userId: 'user-id-21',
        licenseKey: 'path-query-key',
        tier: 'basic',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      // Pass domain with path and query params (should be normalized)
      const result = await validateLicense('path-query-key', 'https://example.com/path?query=value');

      expect(result.valid).toBe(true);
    });

    it('should handle very long license key', async () => {
      const longKey = 'a'.repeat(100);

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense(longKey, 'example.com');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('License not found');
    });

    it('should handle license expiring exactly now (boundary case)', async () => {
      const mockLicense = {
        id: 'license-id-22',
        userId: 'user-id-22',
        licenseKey: 'expiring-now',
        tier: 'basic',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date(), // Expires right now
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('expiring-now', 'example.com');

      // Should be expired (expiresAt <= now)
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('License has expired');
    });

    it('should handle license with null expiresAt (never expires)', async () => {
      const mockLicense = {
        id: 'license-id-23',
        userId: 'user-id-23',
        licenseKey: 'no-expiry',
        tier: 'agency',
        domains: ['example.com'],
        domainLimit: -1,
        brandingEnabled: false,
        status: 'active',
        expiresAt: null as any, // No expiration date
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('no-expiry', 'example.com');

      // Should be valid (no expiration means it never expires)
      expect(result.valid).toBe(true);
    });

    it('should handle multiple domains in allowedDomains array', async () => {
      const mockLicense = {
        id: 'license-id-24',
        userId: 'user-id-24',
        licenseKey: 'multi-domain',
        tier: 'agency',
        domains: ['site1.com', 'site2.com', 'site3.com', 'site4.com'],
        domainLimit: -1,
        brandingEnabled: false,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('multi-domain', 'site3.com');

      expect(result.valid).toBe(true);
    });

    it('should handle domain with international characters (IDN)', async () => {
      const mockLicense = {
        id: 'license-id-25',
        userId: 'user-id-25',
        licenseKey: 'idn-test',
        tier: 'basic',
        domains: ['münchen.de'],
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('idn-test', 'münchen.de');

      expect(result.valid).toBe(true);
    });

    it('should handle database query error gracefully', async () => {
      // Mock database error
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Database connection failed')),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      await expect(validateLicense('error-key', 'example.com')).rejects.toThrow('Database connection failed');
    });

    it('should handle database returning multiple licenses for same key (should not happen)', async () => {
      // Mock multiple results (edge case - should not happen with unique constraint)
      const mockLicense1 = {
        id: 'license-id-26',
        userId: 'user-id-26',
        licenseKey: 'duplicate-key',
        tier: 'basic',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLicense2 = {
        ...mockLicense1,
        id: 'license-id-27',
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense1, mockLicense2]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('duplicate-key', 'example.com');

      // Should use the first license found
      expect(result.valid).toBe(true);
      expect(result.license?.id).toBe('license-id-26');
    });

    it('should handle tier field with unexpected value', async () => {
      const mockLicense = {
        id: 'license-id-28',
        userId: 'user-id-28',
        licenseKey: 'unknown-tier',
        tier: 'unknown' as any, // Unexpected tier value
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('unknown-tier', 'example.com');

      // Should still validate domain restrictions (treat as basic tier)
      expect(result.valid).toBe(true);
    });

    it('should handle concurrent validation requests for same license', async () => {
      const mockLicense = {
        id: 'license-id-29',
        userId: 'user-id-29',
        licenseKey: 'concurrent-test',
        tier: 'basic',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      // Run multiple validations concurrently
      const results = await Promise.all([
        validateLicense('concurrent-test', 'example.com'),
        validateLicense('concurrent-test', 'example.com'),
        validateLicense('concurrent-test', 'example.com'),
      ]);

      // All should succeed
      results.forEach(result => {
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('ValidationResult type structure', () => {
    it('should return ValidationResult with correct structure for valid license', async () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const mockLicense = {
        id: 'license-id-30',
        userId: 'user-id-30',
        licenseKey: 'type-test',
        tier: 'pro',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: false,
        status: 'active',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockLicense]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('type-test', 'example.com');

      // Verify structure
      expect(result).toHaveProperty('valid');
      expect(result.valid).toBe(true);
      expect(result).toHaveProperty('license');
      expect(result.license).toMatchObject({
        id: 'license-id-30',
        userId: 'user-id-30',
        tier: 'pro',
        expiresAt: futureDate,
      });
      expect(result).not.toHaveProperty('reason');
    });

    it('should return ValidationResult with correct structure for invalid license', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });
      vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);

      const result = await validateLicense('invalid', 'example.com');

      // Verify structure
      expect(result).toHaveProperty('valid');
      expect(result.valid).toBe(false);
      expect(result).toHaveProperty('reason');
      expect(result.reason).toBe('License not found');
      expect(result).not.toHaveProperty('license');
    });
  });
});
