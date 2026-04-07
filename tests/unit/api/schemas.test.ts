/**
 * Unit Tests for API Validation Schemas
 *
 * Tests for lib/api/schemas.ts
 *
 * RED Phase: These tests will FAIL because the schema module doesn't exist yet.
 *
 * Test Coverage:
 * - createLicenseSchema: validates license creation payloads
 * - validateLicenseSchema: validates license validation payloads
 * - updateLicenseSchema: validates license update payloads
 * - Domain count validation by tier (basic/pro/agency)
 * - Zod schema validation errors
 */

import { describe, it, expect } from 'vitest';
// RED: Module doesn't exist yet - this import should fail
import {
  createLicenseSchema,
  validateLicenseSchema,
  updateLicenseSchema,
} from '@/lib/api/schemas';

describe('createLicenseSchema', () => {
  describe('Valid inputs', () => {
    it('should validate basic tier with 1 domain', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        tier: 'basic',
        domains: ['example.com'],
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tier).toBe('basic');
        expect(result.data.domains).toEqual(['example.com']);
        expect(result.data.expiresInDays).toBe(365); // Default value
      }
    });

    it('should validate pro tier with 1 domain', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        tier: 'pro',
        domains: ['example.com'],
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tier).toBe('pro');
        expect(result.data.domains).toEqual(['example.com']);
      }
    });

    it('should validate agency tier with multiple domains', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        tier: 'agency',
        domains: ['example.com', 'test.com', 'demo.org'],
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tier).toBe('agency');
        expect(result.data.domains).toHaveLength(3);
      }
    });

    it('should validate with custom expiresInDays', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        tier: 'basic',
        domains: ['example.com'],
        expiresInDays: 180,
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expiresInDays).toBe(180);
      }
    });

    it('should apply default expiresInDays of 365 when not provided', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        tier: 'pro',
        domains: ['example.com'],
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expiresInDays).toBe(365);
      }
    });

    it('should validate agency tier with 1 domain', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        tier: 'agency',
        domains: ['example.com'],
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });

  describe('Invalid inputs - missing or invalid required fields', () => {
    it('should reject when tier is missing', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        domains: ['example.com'],
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toBeDefined();
        expect(result.error.issues.some(issue => issue.path.includes('tier'))).toBe(true);
      }
    });

    it('should reject invalid tier value', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        tier: 'enterprise',
        domains: ['example.com'],
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('tier'))).toBe(true);
      }
    });

    it('should reject when domains is missing', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        tier: 'basic',
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('domains'))).toBe(true);
      }
    });

    it('should reject empty domains array', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        tier: 'basic',
        domains: [],
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('domains'))).toBe(true);
      }
    });
  });

  describe('Invalid inputs - domain validation', () => {
    it('should reject invalid domain format', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        tier: 'basic',
        domains: ['invalid domain with spaces'],
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject domain without TLD', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        tier: 'basic',
        domains: ['localhost'],
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject array with mix of valid and invalid domains', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        tier: 'agency',
        domains: ['example.com', 'invalid domain', 'test.org'],
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('Invalid inputs - tier domain count restrictions', () => {
    it('should reject basic tier with multiple domains', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        tier: 'basic',
        domains: ['example.com', 'test.com'],
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject pro tier with multiple domains', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        tier: 'pro',
        domains: ['example.com', 'test.com'],
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('Invalid inputs - expiresInDays validation', () => {
    it('should reject negative expiresInDays', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        tier: 'basic',
        domains: ['example.com'],
        expiresInDays: -30,
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('expiresInDays'))).toBe(true);
      }
    });

    it('should reject zero expiresInDays', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        tier: 'basic',
        domains: ['example.com'],
        expiresInDays: 0,
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject non-integer expiresInDays', () => {
      // FAIL REASON: createLicenseSchema doesn't exist yet
      const input = {
        tier: 'basic',
        domains: ['example.com'],
        expiresInDays: 30.5,
      };

      const result = createLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });
});

describe('validateLicenseSchema', () => {
  describe('Valid inputs', () => {
    it('should validate with valid license key and domain', () => {
      // FAIL REASON: validateLicenseSchema doesn't exist yet
      const input = {
        licenseKey: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
        domain: 'example.com',
      };

      const result = validateLicenseSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.licenseKey).toBe('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4');
        expect(result.data.domain).toBe('example.com');
      }
    });

    it('should validate with different valid license key', () => {
      // FAIL REASON: validateLicenseSchema doesn't exist yet
      const input = {
        licenseKey: '0123456789abcdef0123456789abcdef',
        domain: 'test.org',
      };

      const result = validateLicenseSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should validate with subdomain', () => {
      // FAIL REASON: validateLicenseSchema doesn't exist yet
      const input = {
        licenseKey: 'fedcba9876543210fedcba9876543210',
        domain: 'api.example.com',
      };

      const result = validateLicenseSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });

  describe('Invalid inputs - missing fields', () => {
    it('should reject when licenseKey is missing', () => {
      // FAIL REASON: validateLicenseSchema doesn't exist yet
      const input = {
        domain: 'example.com',
      };

      const result = validateLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('licenseKey'))).toBe(true);
      }
    });

    it('should reject when domain is missing', () => {
      // FAIL REASON: validateLicenseSchema doesn't exist yet
      const input = {
        licenseKey: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
      };

      const result = validateLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('domain'))).toBe(true);
      }
    });

    it('should reject empty domain string', () => {
      // FAIL REASON: validateLicenseSchema doesn't exist yet
      const input = {
        licenseKey: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
        domain: '',
      };

      const result = validateLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('Invalid inputs - license key format', () => {
    it('should reject license key that is too short', () => {
      // FAIL REASON: validateLicenseSchema doesn't exist yet
      const input = {
        licenseKey: 'a1b2c3d4e5f6',
        domain: 'example.com',
      };

      const result = validateLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('licenseKey'))).toBe(true);
      }
    });

    it('should reject license key that is too long', () => {
      // FAIL REASON: validateLicenseSchema doesn't exist yet
      const input = {
        licenseKey: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4extra',
        domain: 'example.com',
      };

      const result = validateLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject license key with non-hexadecimal characters', () => {
      // FAIL REASON: validateLicenseSchema doesn't exist yet
      const input = {
        licenseKey: 'g1h2i3j4k5l6g1h2i3j4k5l6g1h2i3j4', // contains g-l
        domain: 'example.com',
      };

      const result = validateLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject license key with uppercase characters', () => {
      // FAIL REASON: validateLicenseSchema doesn't exist yet
      const input = {
        licenseKey: 'A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4',
        domain: 'example.com',
      };

      const result = validateLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject license key with special characters', () => {
      // FAIL REASON: validateLicenseSchema doesn't exist yet
      const input = {
        licenseKey: 'a1b2-c3d4-e5f6-a1b2-c3d4-e5f6-a1b2', // contains dashes
        domain: 'example.com',
      };

      const result = validateLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });
});

describe('updateLicenseSchema', () => {
  describe('Valid inputs', () => {
    it('should validate when updating domains only', () => {
      // FAIL REASON: updateLicenseSchema doesn't exist yet
      const input = {
        domains: ['example.com', 'test.com'],
      };

      const result = updateLicenseSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.domains).toEqual(['example.com', 'test.com']);
      }
    });

    it('should validate when updating status only', () => {
      // FAIL REASON: updateLicenseSchema doesn't exist yet
      const input = {
        status: 'cancelled',
      };

      const result = updateLicenseSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('cancelled');
      }
    });

    it('should validate when updating expiresAt only', () => {
      // FAIL REASON: updateLicenseSchema doesn't exist yet
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const input = {
        expiresAt: futureDate.toISOString(),
      };

      const result = updateLicenseSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expiresAt).toBe(futureDate.toISOString());
      }
    });

    it('should validate when updating multiple fields', () => {
      // FAIL REASON: updateLicenseSchema doesn't exist yet
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const input = {
        domains: ['newdomain.com'],
        status: 'active',
        expiresAt: futureDate.toISOString(),
      };

      const result = updateLicenseSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should validate all valid status values', () => {
      // FAIL REASON: updateLicenseSchema doesn't exist yet
      const statuses = ['active', 'cancelled', 'expired'];

      statuses.forEach(status => {
        const input = { status };
        const result = updateLicenseSchema.safeParse(input);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Invalid inputs - empty or invalid structure', () => {
    it('should reject empty object (no fields provided)', () => {
      // FAIL REASON: updateLicenseSchema doesn't exist yet
      const input = {};

      const result = updateLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject empty domains array', () => {
      // FAIL REASON: updateLicenseSchema doesn't exist yet
      const input = {
        domains: [],
      };

      const result = updateLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('domains'))).toBe(true);
      }
    });

    it('should reject invalid domain format in array', () => {
      // FAIL REASON: updateLicenseSchema doesn't exist yet
      const input = {
        domains: ['valid.com', 'invalid domain'],
      };

      const result = updateLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('Invalid inputs - status validation', () => {
    it('should reject invalid status value', () => {
      // FAIL REASON: updateLicenseSchema doesn't exist yet
      const input = {
        status: 'suspended',
      };

      const result = updateLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('status'))).toBe(true);
      }
    });

    it('should reject empty string status', () => {
      // FAIL REASON: updateLicenseSchema doesn't exist yet
      const input = {
        status: '',
      };

      const result = updateLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('Invalid inputs - expiresAt validation', () => {
    it('should reject invalid date format', () => {
      // FAIL REASON: updateLicenseSchema doesn't exist yet
      const input = {
        expiresAt: '2024-13-45', // Invalid date
      };

      const result = updateLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject non-ISO date string', () => {
      // FAIL REASON: updateLicenseSchema doesn't exist yet
      const input = {
        expiresAt: '12/31/2024', // Non-ISO format
      };

      const result = updateLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject past expiration date', () => {
      // FAIL REASON: updateLicenseSchema doesn't exist yet
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      const input = {
        expiresAt: pastDate.toISOString(),
      };

      const result = updateLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('expiresAt'))).toBe(true);
      }
    });

    it('should reject date that is exactly now (must be future)', () => {
      // FAIL REASON: updateLicenseSchema doesn't exist yet
      const now = new Date();

      const input = {
        expiresAt: now.toISOString(),
      };

      const result = updateLicenseSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });
});
