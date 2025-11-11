/**
 * Unit Tests for License Flag Injection
 *
 * Purpose: Test flag creation and injection into widget bundle
 * Module: lib/widget/inject.ts
 *
 * Test Coverage:
 * - createFlagsJSON: Create JSON flags for different license tiers
 * - injectLicenseFlags: Inject flags into widget bundle
 *
 * Note: These tests FAIL in RED phase - implementation required for GREEN phase
 */

import { describe, it, expect } from 'vitest';
import { createFlagsJSON, injectLicenseFlags } from '@/lib/widget/inject';

// Mock license type matching database schema
interface MockLicense {
  id: string;
  tier: 'basic' | 'pro' | 'agency';
  brandingEnabled: boolean;
  domains: string[];
  domainLimit: number;
  status: 'active' | 'expired' | 'cancelled';
  expiresAt?: Date;
}

describe('createFlagsJSON', () => {
  describe('Basic Tier', () => {
    // Must create valid JSON for basic tier
    it('should create valid JSON for basic tier', () => {
      const license: MockLicense = {
        id: 'lic-1',
        tier: 'basic',
        brandingEnabled: true,
        domains: ['example.com'],
        domainLimit: 1,
        status: 'active'
      };

      const flags = createFlagsJSON(license as any);
      expect(() => JSON.parse(flags)).not.toThrow();
    });

    // Must include tier in flags
    it('should include tier: basic in flags', () => {
      const license: MockLicense = {
        id: 'lic-1',
        tier: 'basic',
        brandingEnabled: true,
        domains: ['example.com'],
        domainLimit: 1,
        status: 'active'
      };

      const flags = createFlagsJSON(license as any);
      const parsed = JSON.parse(flags);
      expect(parsed.tier).toBe('basic');
    });

    // Must include branding enabled flag
    it('should include brandingEnabled flag', () => {
      const license: MockLicense = {
        id: 'lic-1',
        tier: 'basic',
        brandingEnabled: true,
        domains: ['example.com'],
        domainLimit: 1,
        status: 'active'
      };

      const flags = createFlagsJSON(license as any);
      const parsed = JSON.parse(flags);
      expect(parsed.brandingEnabled).toBe(true);
    });

    // Must include domain limit
    it('should include domainLimit in flags', () => {
      const license: MockLicense = {
        id: 'lic-1',
        tier: 'basic',
        brandingEnabled: true,
        domains: ['example.com'],
        domainLimit: 1,
        status: 'active'
      };

      const flags = createFlagsJSON(license as any);
      const parsed = JSON.parse(flags);
      expect(parsed.domainLimit).toBe(1);
    });
  });

  describe('Pro Tier', () => {
    // Must create valid JSON for pro tier
    it('should create valid JSON for pro tier', () => {
      const license: MockLicense = {
        id: 'lic-2',
        tier: 'pro',
        brandingEnabled: false,
        domains: ['example.com'],
        domainLimit: 1,
        status: 'active'
      };

      const flags = createFlagsJSON(license as any);
      expect(() => JSON.parse(flags)).not.toThrow();
    });

    // Must include tier: pro
    it('should include tier: pro in flags', () => {
      const license: MockLicense = {
        id: 'lic-2',
        tier: 'pro',
        brandingEnabled: false,
        domains: ['example.com'],
        domainLimit: 1,
        status: 'active'
      };

      const flags = createFlagsJSON(license as any);
      const parsed = JSON.parse(flags);
      expect(parsed.tier).toBe('pro');
    });

    // Pro tier should have white-label (branding disabled)
    it('should have brandingEnabled false for white-label pro', () => {
      const license: MockLicense = {
        id: 'lic-2',
        tier: 'pro',
        brandingEnabled: false,
        domains: ['example.com'],
        domainLimit: 1,
        status: 'active'
      };

      const flags = createFlagsJSON(license as any);
      const parsed = JSON.parse(flags);
      expect(parsed.brandingEnabled).toBe(false);
    });
  });

  describe('Agency Tier', () => {
    // Must create valid JSON for agency tier
    it('should create valid JSON for agency tier', () => {
      const license: MockLicense = {
        id: 'lic-3',
        tier: 'agency',
        brandingEnabled: false,
        domains: ['example.com', 'test.com', 'another.com'],
        domainLimit: 999,
        status: 'active'
      };

      const flags = createFlagsJSON(license as any);
      expect(() => JSON.parse(flags)).not.toThrow();
    });

    // Must include tier: agency
    it('should include tier: agency in flags', () => {
      const license: MockLicense = {
        id: 'lic-3',
        tier: 'agency',
        brandingEnabled: false,
        domains: ['example.com'],
        domainLimit: 999,
        status: 'active'
      };

      const flags = createFlagsJSON(license as any);
      const parsed = JSON.parse(flags);
      expect(parsed.tier).toBe('agency');
    });

    // Agency should support unlimited domains
    it('should have high domain limit for agency tier', () => {
      const license: MockLicense = {
        id: 'lic-3',
        tier: 'agency',
        brandingEnabled: false,
        domains: ['example.com'],
        domainLimit: 999,
        status: 'active'
      };

      const flags = createFlagsJSON(license as any);
      const parsed = JSON.parse(flags);
      expect(parsed.domainLimit).toBeGreaterThan(100);
    });
  });

  describe('Branding Flag Variations', () => {
    // Must respect branding enabled flag
    it('should reflect brandingEnabled true', () => {
      const license: MockLicense = {
        id: 'lic-1',
        tier: 'basic',
        brandingEnabled: true,
        domains: ['example.com'],
        domainLimit: 1,
        status: 'active'
      };

      const flags = createFlagsJSON(license as any);
      const parsed = JSON.parse(flags);
      expect(parsed.brandingEnabled).toBe(true);
    });

    // Must reflect branding disabled flag
    it('should reflect brandingEnabled false', () => {
      const license: MockLicense = {
        id: 'lic-1',
        tier: 'basic',
        brandingEnabled: false,
        domains: ['example.com'],
        domainLimit: 1,
        status: 'active'
      };

      const flags = createFlagsJSON(license as any);
      const parsed = JSON.parse(flags);
      expect(parsed.brandingEnabled).toBe(false);
    });
  });

  describe('Return Type', () => {
    // Must return valid JSON string
    it('should return valid JSON string', () => {
      const license: MockLicense = {
        id: 'lic-1',
        tier: 'basic',
        brandingEnabled: true,
        domains: ['example.com'],
        domainLimit: 1,
        status: 'active'
      };

      const flags = createFlagsJSON(license as any);
      expect(typeof flags).toBe('string');
      expect(() => JSON.parse(flags)).not.toThrow();
    });

    // Must be parseable
    it('should produce parseable JSON', () => {
      const license: MockLicense = {
        id: 'lic-1',
        tier: 'basic',
        brandingEnabled: true,
        domains: ['example.com'],
        domainLimit: 1,
        status: 'active'
      };

      const flags = createFlagsJSON(license as any);
      const parsed = JSON.parse(flags);
      expect(typeof parsed).toBe('object');
    });
  });
});

describe('injectLicenseFlags', () => {
  const mockBundle = `
(function() {
  console.log('Widget loaded');
  // __START_LICENSE_FLAGS__
  // __END_LICENSE_FLAGS__
  console.log('Widget initialized');
})();
`;

  const createMockLicense = (overrides?: Partial<MockLicense>): MockLicense => ({
    id: 'lic-1',
    tier: 'basic',
    brandingEnabled: true,
    domains: ['example.com'],
    domainLimit: 1,
    status: 'active',
    ...overrides
  });

  describe('Happy Path - Successful Injection', () => {
    // Must inject flags into bundle (happy path)
    it('should inject flags into bundle with markers', () => {
      const license = createMockLicense();
      const result = injectLicenseFlags(mockBundle, license as any);

      expect(result).toContain('window.N8N_LICENSE_FLAGS');
      expect(result).toContain('Widget loaded');
      expect(result).toContain('Widget initialized');
    });

    // Must preserve bundle content outside markers
    it('should preserve bundle content outside markers', () => {
      const license = createMockLicense();
      const result = injectLicenseFlags(mockBundle, license as any);

      expect(result).toContain('Widget loaded');
      expect(result).toContain('Widget initialized');
      expect(result).toContain('console.log');
    });

    // Must replace placeholder with real flags
    it('should replace placeholder with real license flags', () => {
      const license = createMockLicense();
      const result = injectLicenseFlags(mockBundle, license as any);

      expect(result).not.toContain('__START_LICENSE_FLAGS__');
      expect(result).not.toContain('__END_LICENSE_FLAGS__');
      expect(result).toContain('tier');
      expect(result).toContain('basic');
    });

    // Injected flags should be valid JavaScript
    it('should inject valid JavaScript flags', () => {
      const license = createMockLicense();
      const result = injectLicenseFlags(mockBundle, license as any);

      expect(() => new Function(result)).not.toThrow();
    });
  });

  describe('Different License Tiers', () => {
    // Must inject flags for basic tier
    it('should inject flags for basic tier license', () => {
      const license = createMockLicense({ tier: 'basic' });
      const result = injectLicenseFlags(mockBundle, license as any);

      expect(result).toContain('basic');
    });

    // Must inject flags for pro tier
    it('should inject flags for pro tier license', () => {
      const license = createMockLicense({ tier: 'pro' });
      const result = injectLicenseFlags(mockBundle, license as any);

      expect(result).toContain('pro');
    });

    // Must inject flags for agency tier
    it('should inject flags for agency tier license', () => {
      const license = createMockLicense({ tier: 'agency' });
      const result = injectLicenseFlags(mockBundle, license as any);

      expect(result).toContain('agency');
    });

    // Different tiers should produce different results
    it('should produce different output for different tiers', () => {
      const basicLicense = createMockLicense({ tier: 'basic' });
      const proLicense = createMockLicense({ tier: 'pro' });

      const basicResult = injectLicenseFlags(mockBundle, basicLicense as any);
      const proResult = injectLicenseFlags(mockBundle, proLicense as any);

      expect(basicResult).not.toBe(proResult);
    });
  });

  describe('Branding Variations', () => {
    // Must inject with branding enabled
    it('should inject flags with branding enabled', () => {
      const license = createMockLicense({ brandingEnabled: true });
      const result = injectLicenseFlags(mockBundle, license as any);

      expect(result).toContain('brandingEnabled');
      expect(result).toContain('true');
    });

    // Must inject with branding disabled
    it('should inject flags with branding disabled', () => {
      const license = createMockLicense({ brandingEnabled: false });
      const result = injectLicenseFlags(mockBundle, license as any);

      expect(result).toContain('brandingEnabled');
      expect(result).toContain('false');
    });
  });

  describe('Minified Bundle Handling', () => {
    // Must handle minified bundle
    it('should handle minified bundle without newlines', () => {
      const minifiedBundle = `(function(){console.log('Widget');// __START_LICENSE_FLAGS__ // __END_LICENSE_FLAGS__ console.log('Done');})();`;
      const license = createMockLicense();

      const result = injectLicenseFlags(minifiedBundle, license as any);
      expect(result).toContain('window.N8N_LICENSE_FLAGS');
    });

    // Must handle bundle with line breaks
    it('should handle bundle with various formatting', () => {
      const formattedBundle = `
      (function() {
        // __START_LICENSE_FLAGS__
        // __END_LICENSE_FLAGS__
      })();
      `;

      const license = createMockLicense();
      const result = injectLicenseFlags(formattedBundle, license as any);

      expect(result).toContain('window.N8N_LICENSE_FLAGS');
    });
  });

  describe('Error Cases - Missing Markers', () => {
    // Must throw when start marker missing
    it('should throw error when start marker is missing', () => {
      const bundleWithoutStart = `
      (function() {
        console.log('Widget');
        // __END_LICENSE_FLAGS__
      })();
      `;
      const license = createMockLicense();

      expect(() => {
        injectLicenseFlags(bundleWithoutStart, license as any);
      }).toThrow();
    });

    // Must throw when end marker missing
    it('should throw error when end marker is missing', () => {
      const bundleWithoutEnd = `
      (function() {
        console.log('Widget');
        // __START_LICENSE_FLAGS__
      })();
      `;
      const license = createMockLicense();

      expect(() => {
        injectLicenseFlags(bundleWithoutEnd, license as any);
      }).toThrow();
    });

    // Must throw when both markers missing
    it('should throw error when both markers are missing', () => {
      const bundleWithoutMarkers = `
      (function() {
        console.log('Widget');
      })();
      `;
      const license = createMockLicense();

      expect(() => {
        injectLicenseFlags(bundleWithoutMarkers, license as any);
      }).toThrow();
    });

    // Must throw with meaningful message
    it('should throw error with meaningful message', () => {
      const bundleWithoutMarkers = `console.log('test');`;
      const license = createMockLicense();

      expect(() => {
        injectLicenseFlags(bundleWithoutMarkers, license as any);
      }).toThrow(/marker|flag/i);
    });
  });

  describe('Empty/Minimal Bundle Handling', () => {
    // Must handle empty bundle content between markers
    it('should handle empty bundle content between markers', () => {
      const emptyBundle = `// __START_LICENSE_FLAGS__\n// __END_LICENSE_FLAGS__`;
      const license = createMockLicense();

      const result = injectLicenseFlags(emptyBundle, license as any);
      expect(result).toContain('window.N8N_LICENSE_FLAGS');
    });

    // Must return result containing flags
    it('should return bundle with injected flags', () => {
      const license = createMockLicense();
      const result = injectLicenseFlags(mockBundle, license as any);

      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('window.N8N_LICENSE_FLAGS');
    });
  });

  describe('Injected Flags Validation', () => {
    // Injected flags must match license data
    it('should inject flags that match license tier', () => {
      const license = createMockLicense({ tier: 'pro' });
      const result = injectLicenseFlags(mockBundle, license as any);

      expect(result).toContain('pro');
    });

    // Injected flags must include domain limit
    it('should inject domainLimit from license', () => {
      const license = createMockLicense({ domainLimit: 5 });
      const result = injectLicenseFlags(mockBundle, license as any);

      expect(result).toContain('domainLimit');
      expect(result).toContain('5');
    });

    // Injected flags must be executable JavaScript
    it('should produce executable JavaScript with injected flags', () => {
      const license = createMockLicense();
      const result = injectLicenseFlags(mockBundle, license as any);

      expect(() => {
        new Function(result);
      }).not.toThrow();
    });
  });

  describe('Return Type and Structure', () => {
    // Must return string
    it('should return string', () => {
      const license = createMockLicense();
      const result = injectLicenseFlags(mockBundle, license as any);

      expect(typeof result).toBe('string');
    });

    // Result must be longer than original markers
    it('should return result longer than original markers section', () => {
      const license = createMockLicense();
      const result = injectLicenseFlags(mockBundle, license as any);

      expect(result.length).toBeGreaterThan(mockBundle.length - 50);
    });

    // Must contain flag assignment
    it('should contain window.N8N_LICENSE_FLAGS assignment', () => {
      const license = createMockLicense();
      const result = injectLicenseFlags(mockBundle, license as any);

      expect(result).toMatch(/window\.N8N_LICENSE_FLAGS\s*=/);
    });
  });

  describe('Edge Cases', () => {
    // Must handle bundle with multiple sets of markers
    it('should handle bundle with markers (only replaces first occurrence)', () => {
      const bundleWithMultiple = `
      // __START_LICENSE_FLAGS__
      // __END_LICENSE_FLAGS__
      some content
      // __START_LICENSE_FLAGS__
      // __END_LICENSE_FLAGS__
      `;
      const license = createMockLicense();

      const result = injectLicenseFlags(bundleWithMultiple, license as any);
      expect(result).toContain('window.N8N_LICENSE_FLAGS');
    });

    // Must handle whitespace in markers
    it('should handle whitespace variations in markers', () => {
      const bundleWithWhitespace = `
      //   __START_LICENSE_FLAGS__
      //   __END_LICENSE_FLAGS__
      `;
      const license = createMockLicense();

      const result = injectLicenseFlags(bundleWithWhitespace, license as any);
      expect(result).toContain('window.N8N_LICENSE_FLAGS');
    });
  });
});
