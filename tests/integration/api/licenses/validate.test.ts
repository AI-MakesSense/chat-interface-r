/**
 * Integration Tests for Validate License API Route
 *
 * Tests for app/api/licenses/validate/route.ts POST handler
 *
 * RED Phase: These tests will FAIL because the route handler doesn't exist yet.
 *
 * Test Coverage:
 * - Valid scenarios: Valid license for exact domain, Agency tier (any domain), domain normalization
 * - Invalid scenarios: Invalid key format, license not found, expired, domain not authorized, invalid body
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/licenses/validate/route';
import { NextRequest } from 'next/server';
import * as licenseValidate from '@/lib/license/validate';

// Mock the license validation module
vi.mock('@/lib/license/validate', () => ({
  validateLicense: vi.fn(),
}));

// Helper function to create a mock POST request
function createValidateRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/licenses/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/licenses/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid Scenarios', () => {
    it('should validate license for exact domain', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const validationData = {
        licenseKey: 'a1b2c3d4e5f617a8196071127334f5e6',
        domain: 'example.com',
      };

      const mockLicense = {
        id: 'license-123',
        userId: 'user-123',
        licenseKey: validationData.licenseKey,
        tier: 'basic',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(licenseValidate, 'validateLicense').mockResolvedValue({
        valid: true,
        license: mockLicense,
      });

      const request = createValidateRequest(validationData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.license).toBeDefined();
      expect(data.license.licenseKey).toBe(validationData.licenseKey);
      expect(data.license.domains).toContain('example.com');
    });

    it('should validate Agency tier license for any domain', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const validationData = {
        licenseKey: 'b2c3d4e5f617a81960711273345e6171',
        domain: 'anydomain.com',
      };

      const mockLicense = {
        id: 'license-agency',
        userId: 'user-agency',
        licenseKey: validationData.licenseKey,
        tier: 'agency',
        domains: ['client1.com', 'client2.com'],
        domainLimit: -1, // Unlimited
        brandingEnabled: false,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(licenseValidate, 'validateLicense').mockResolvedValue({
        valid: true,
        license: mockLicense,
      });

      const request = createValidateRequest(validationData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.license.tier).toBe('agency');
      expect(data.license.domainLimit).toBe(-1);
    });

    it('should normalize domain before validation', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const validationData = {
        licenseKey: 'c3d4e5f6778899a0b1c2d3e4f5061728',
        domain: 'HTTPS://WWW.Example.COM',
      };

      const mockLicense = {
        id: 'license-normalize',
        userId: 'user-normalize',
        licenseKey: validationData.licenseKey,
        tier: 'basic',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: true,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validateSpy = vi.spyOn(licenseValidate, 'validateLicense');
      validateSpy.mockResolvedValue({
        valid: true,
        license: mockLicense,
      });

      const request = createValidateRequest(validationData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(validateSpy).toHaveBeenCalled();
      // Verify validateLicense was called with original domain (normalization happens inside validateLicense)
      const callArgs = validateSpy.mock.calls[0];
      expect(callArgs[1]).toBe('HTTPS://WWW.Example.COM');
    });
  });

  describe('Invalid Scenarios', () => {
    it('should reject invalid license key format', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const invalidData = {
        licenseKey: 'invalid-short', // Not 32 chars
        domain: 'example.com',
      };

      const request = createValidateRequest(invalidData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject non-hexadecimal license key', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const invalidData = {
        licenseKey: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ', // Not hex
        domain: 'example.com',
      };

      const request = createValidateRequest(invalidData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return invalid for license not found', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const validationData = {
        licenseKey: 'd4e5f617a81960711273345e617188a9',
        domain: 'example.com',
      };

      vi.spyOn(licenseValidate, 'validateLicense').mockResolvedValue({
        valid: false,
        reason: 'License not found',
      });

      const request = createValidateRequest(validationData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
      expect(data.reason).toBe('License not found');
      expect(data.license).toBeUndefined();
    });

    it('should return invalid for expired license', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const validationData = {
        licenseKey: 'e5f617a81960711273345e617188a90b',
        domain: 'example.com',
      };

      vi.spyOn(licenseValidate, 'validateLicense').mockResolvedValue({
        valid: false,
        reason: 'License expired',
      });

      const request = createValidateRequest(validationData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
      expect(data.reason).toBe('License expired');
    });

    it('should return invalid for domain not authorized', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const validationData = {
        licenseKey: 'f617a81960711273345e617188a90b1c',
        domain: 'unauthorized-domain.com',
      };

      vi.spyOn(licenseValidate, 'validateLicense').mockResolvedValue({
        valid: false,
        reason: 'Domain not authorized',
      });

      const request = createValidateRequest(validationData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
      expect(data.reason).toBe('Domain not authorized');
    });

    it('should reject missing license key', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const invalidData = {
        domain: 'example.com',
        // Missing licenseKey
      };

      const request = createValidateRequest(invalidData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject missing domain', async () => {
      // FAIL REASON: POST route handler does not exist yet

      // Arrange
      const invalidData = {
        licenseKey: '778899a0b1c2d3e4f506172839405162',
        // Missing domain
      };

      const request = createValidateRequest(invalidData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });
});
