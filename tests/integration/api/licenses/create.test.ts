/**
 * Integration Tests for Create License API Route
 *
 * Tests for app/api/licenses/route.ts POST handler
 *
 * RED Phase: These tests will FAIL because the route handler doesn't exist yet.
 *
 * Test Coverage:
 * - Valid scenarios: Basic/Pro/Agency tier creation, custom expiration, multiple domains
 * - Invalid scenarios: Missing auth, schema validation, domain limits, negative expiresInDays
 * - Edge cases: Unique key generation, domain normalization, expiration calculation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/licenses/route';
import { NextRequest } from 'next/server';
import * as dbClient from '@/lib/db/client';
import * as authMiddleware from '@/lib/auth/middleware';
import * as licenseGenerate from '@/lib/license/generate';
import * as licenseDomain from '@/lib/license/domain';

// Mock the database client
vi.mock('@/lib/db/client', () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));

// Mock authentication middleware
vi.mock('@/lib/auth/middleware', () => ({
  requireAuth: vi.fn(),
}));

// Mock license generation
vi.mock('@/lib/license/generate', () => ({
  generateLicenseKey: vi.fn(),
}));

// Mock domain normalization
vi.mock('@/lib/license/domain', () => ({
  normalizeDomain: vi.fn((domain: string) => domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '')),
  isValidDomain: vi.fn((domain: string) => domain.length > 0 && domain.includes('.') && !domain.startsWith('.') && !domain.endsWith('.')),
}));

// Helper function to create a mock POST request
function createLicenseRequest(body: any, authToken?: string): NextRequest {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['cookie'] = `auth_token=${authToken}`;
  }

  return new NextRequest('http://localhost:3000/api/licenses', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('POST /api/licenses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid Scenarios', () => {
    it('should create a Basic tier license', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const licenseData = {
        tier: 'basic',
        domains: ['example.com'],
      };

      const mockUserId = 'user-123';
      const mockLicenseKey = 'a1b2c3d4e5f617a8196071127334f5e6';

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
      } as any);

      vi.spyOn(licenseGenerate, 'generateLicenseKey').mockReturnValue(mockLicenseKey);

      const mockDbInsert = vi.spyOn(dbClient.db, 'insert');
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 'license-123',
          userId: mockUserId,
          licenseKey: mockLicenseKey,
          tier: 'basic',
          domains: ['example.com'],
          domainLimit: 1,
          brandingEnabled: true,
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      } as any);

      const request = createLicenseRequest(licenseData, 'valid-token');

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.license).toBeDefined();
      expect(data.license.tier).toBe('basic');
      expect(data.license.domains).toEqual(['example.com']);
      expect(data.license.domainLimit).toBe(1);
      expect(data.license.brandingEnabled).toBe(true);
      expect(data.license.licenseKey).toBe(mockLicenseKey);
    });

    it('should create a Pro tier license', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const licenseData = {
        tier: 'pro',
        domains: ['mydomain.com'],
      };

      const mockUserId = 'user-456';
      const mockLicenseKey = 'b2c3d4e5f617a81960711273345e6171';

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'pro@example.com',
      } as any);

      vi.spyOn(licenseGenerate, 'generateLicenseKey').mockReturnValue(mockLicenseKey);

      const mockDbInsert = vi.spyOn(dbClient.db, 'insert');
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 'license-456',
          userId: mockUserId,
          licenseKey: mockLicenseKey,
          tier: 'pro',
          domains: ['mydomain.com'],
          domainLimit: 1,
          brandingEnabled: false,
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      } as any);

      const request = createLicenseRequest(licenseData, 'valid-token');

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.license).toBeDefined();
      expect(data.license.tier).toBe('pro');
      expect(data.license.brandingEnabled).toBe(false);
    });

    it('should create an Agency tier license with multiple domains', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const licenseData = {
        tier: 'agency',
        domains: ['client1.com', 'client2.com', 'client3.com'],
      };

      const mockUserId = 'user-789';
      const mockLicenseKey = 'c3d4e5f617a8196071127334f5e61718';

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'agency@example.com',
      } as any);

      vi.spyOn(licenseGenerate, 'generateLicenseKey').mockReturnValue(mockLicenseKey);

      const mockDbInsert = vi.spyOn(dbClient.db, 'insert');
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 'license-789',
          userId: mockUserId,
          licenseKey: mockLicenseKey,
          tier: 'agency',
          domains: ['client1.com', 'client2.com', 'client3.com'],
          domainLimit: -1,
          brandingEnabled: false,
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      } as any);

      const request = createLicenseRequest(licenseData, 'valid-token');

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.license).toBeDefined();
      expect(data.license.tier).toBe('agency');
      expect(data.license.domains).toEqual(['client1.com', 'client2.com', 'client3.com']);
      expect(data.license.domainLimit).toBe(-1); // Unlimited
    });

    it('should create license with custom expiresInDays', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const licenseData = {
        tier: 'basic',
        domains: ['custom-expire.com'],
        expiresInDays: 30,
      };

      const mockUserId = 'user-999';
      const mockLicenseKey = 'd4e5f617a81960711273345e617188a';

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'custom@example.com',
      } as any);

      vi.spyOn(licenseGenerate, 'generateLicenseKey').mockReturnValue(mockLicenseKey);

      const expectedExpirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const mockDbInsert = vi.spyOn(dbClient.db, 'insert');
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 'license-999',
          userId: mockUserId,
          licenseKey: mockLicenseKey,
          tier: 'basic',
          domains: ['custom-expire.com'],
          domainLimit: 1,
          brandingEnabled: true,
          status: 'active',
          expiresAt: expectedExpirationDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      } as any);

      const request = createLicenseRequest(licenseData, 'valid-token');

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.license.expiresAt).toBeDefined();
    });

    it('should create license with default expiration (365 days)', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const licenseData = {
        tier: 'basic',
        domains: ['default-expire.com'],
      };

      const mockUserId = 'user-default';
      const mockLicenseKey = 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0';

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'default@example.com',
      } as any);

      vi.spyOn(licenseGenerate, 'generateLicenseKey').mockReturnValue(mockLicenseKey);

      const mockDbInsert = vi.spyOn(dbClient.db, 'insert');
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 'license-default',
          userId: mockUserId,
          licenseKey: mockLicenseKey,
          tier: 'basic',
          domains: ['default-expire.com'],
          domainLimit: 1,
          brandingEnabled: true,
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      } as any);

      const request = createLicenseRequest(licenseData, 'valid-token');

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.license.expiresAt).toBeDefined();
    });

    it('should generate unique license keys', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const licenseData = {
        tier: 'basic',
        domains: ['unique-key.com'],
      };

      const mockUserId = 'user-unique';

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'unique@example.com',
      } as any);

      const generateSpy = vi.spyOn(licenseGenerate, 'generateLicenseKey');
      generateSpy.mockReturnValueOnce('unique-key-1-23456789012345678901');
      generateSpy.mockReturnValueOnce('unique-key-2-23456789012345678901');

      const mockDbInsert = vi.spyOn(dbClient.db, 'insert');
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn()
          .mockResolvedValueOnce([{ id: 'lic-1', licenseKey: 'unique-key-1-23456789012345678901' }])
          .mockResolvedValueOnce([{ id: 'lic-2', licenseKey: 'unique-key-2-23456789012345678901' }]),
      } as any);

      const request1 = createLicenseRequest(licenseData, 'valid-token');
      const request2 = createLicenseRequest(licenseData, 'valid-token');

      // Act
      const response1 = await POST(request1);
      const response2 = await POST(request2);
      const data1 = await response1.json();
      const data2 = await response2.json();

      // Assert
      expect(data1.license.licenseKey).not.toBe(data2.license.licenseKey);
      expect(generateSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Invalid Scenarios', () => {
    it('should reject request without authentication token', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const licenseData = {
        tier: 'basic',
        domains: ['example.com'],
      };

      vi.spyOn(authMiddleware, 'requireAuth').mockRejectedValue(
        new Error('Authentication required')
      );

      const request = createLicenseRequest(licenseData); // No token

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should reject invalid request body (schema validation fails)', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const invalidData = {
        tier: 'invalid-tier', // Not 'basic', 'pro', or 'agency'
        domains: ['example.com'],
      };

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
      } as any);

      const request = createLicenseRequest(invalidData, 'valid-token');

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject empty domains array', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const invalidData = {
        tier: 'basic',
        domains: [], // Empty array
      };

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
      } as any);

      const request = createLicenseRequest(invalidData, 'valid-token');

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject Basic tier with more than 1 domain', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const invalidData = {
        tier: 'basic',
        domains: ['domain1.com', 'domain2.com'], // Basic allows only 1
      };

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
      } as any);

      const request = createLicenseRequest(invalidData, 'valid-token');

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject Pro tier with more than 1 domain', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const invalidData = {
        tier: 'pro',
        domains: ['domain1.com', 'domain2.com', 'domain3.com'],
      };

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
      } as any);

      const request = createLicenseRequest(invalidData, 'valid-token');

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject negative expiresInDays', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const invalidData = {
        tier: 'basic',
        domains: ['example.com'],
        expiresInDays: -30,
      };

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
      } as any);

      const request = createLicenseRequest(invalidData, 'valid-token');

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('Edge Cases', () => {
    it('should normalize domains before storing', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const licenseData = {
        tier: 'basic',
        domains: ['HTTPS://WWW.Example.COM'],
      };

      const mockUserId = 'user-normalize';
      const mockLicenseKey = 'f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1';

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'normalize@example.com',
      } as any);

      vi.spyOn(licenseGenerate, 'generateLicenseKey').mockReturnValue(mockLicenseKey);

      const normalizeSpy = vi.spyOn(licenseDomain, 'normalizeDomain');

      const mockDbInsert = vi.spyOn(dbClient.db, 'insert');
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 'license-normalize',
          userId: mockUserId,
          licenseKey: mockLicenseKey,
          tier: 'basic',
          domains: ['example.com'], // Normalized
          domainLimit: 1,
          brandingEnabled: true,
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      } as any);

      const request = createLicenseRequest(licenseData, 'valid-token');

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(normalizeSpy).toHaveBeenCalled();
      expect(data.license.domains).toContain('example.com');
    });

    it('should calculate expiration date correctly', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const licenseData = {
        tier: 'basic',
        domains: ['expire-calc.com'],
        expiresInDays: 90,
      };

      const mockUserId = 'user-expire-calc';
      const mockLicenseKey = 'g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2';

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'expire@example.com',
      } as any);

      vi.spyOn(licenseGenerate, 'generateLicenseKey').mockReturnValue(mockLicenseKey);

      const now = Date.now();
      const expectedExpiration = new Date(now + 90 * 24 * 60 * 60 * 1000);

      const mockDbInsert = vi.spyOn(dbClient.db, 'insert');
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 'license-expire-calc',
          userId: mockUserId,
          licenseKey: mockLicenseKey,
          tier: 'basic',
          domains: ['expire-calc.com'],
          domainLimit: 1,
          brandingEnabled: true,
          status: 'active',
          expiresAt: expectedExpiration,
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      } as any);

      const request = createLicenseRequest(licenseData, 'valid-token');

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.license.expiresAt).toBeDefined();
      // Verify expiration is approximately 90 days from now (allow 1-second tolerance)
      const returnedExpiration = new Date(data.license.expiresAt).getTime();
      expect(Math.abs(returnedExpiration - expectedExpiration.getTime())).toBeLessThan(1000);
    });
  });
});
