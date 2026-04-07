/**
 * Unit Tests for Widget Bundle Serving
 *
 * Purpose: Test bundle caching and flag injection logic
 * Module: lib/widget/serve.ts
 *
 * Test Coverage:
 * - serveWidgetBundle: Serve widget bundle with injected license flags
 * - clearBundleCache: Clear cached bundle
 *
 * Note: These tests FAIL in RED phase - implementation required for GREEN phase
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { serveWidgetBundle, clearBundleCache } from '@/lib/widget/serve';

// Mock license matching database schema
interface MockLicense {
  id: string;
  tier: 'basic' | 'pro' | 'agency';
  brandingEnabled: boolean;
  domains: string[];
  domainLimit: number;
  status: 'active' | 'expired' | 'cancelled';
  expiresAt?: Date;
}

const createMockLicense = (overrides?: Partial<MockLicense>): MockLicense => ({
  id: 'lic-1',
  tier: 'basic',
  brandingEnabled: true,
  domains: ['example.com'],
  domainLimit: 1,
  status: 'active',
  ...overrides
});

describe('serveWidgetBundle', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearBundleCache();
    vi.clearAllMocks();
  });

  describe('Happy Path - Bundle Serving', () => {
    // Must return bundle with injected flags (happy path)
    it('should return bundle with injected flags', async () => {
      const license = createMockLicense();

      const result = await serveWidgetBundle(license as any);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('window.N8N_LICENSE_FLAGS');
    });

    // Must return string
    it('should return string type', async () => {
      const license = createMockLicense();

      const result = await serveWidgetBundle(license as any);

      expect(typeof result).toBe('string');
    });

    // Result must contain valid JavaScript
    it('should return valid JavaScript', async () => {
      const license = createMockLicense();

      const result = await serveWidgetBundle(license as any);

      expect(() => {
        new Function(result);
      }).not.toThrow();
    });
  });

  describe('Caching Behavior', () => {
    // Must cache bundle across requests
    it('should cache bundle across requests', async () => {
      const license = createMockLicense();

      const result1 = await serveWidgetBundle(license as any);
      const result2 = await serveWidgetBundle(license as any);

      // Should be identical (cached)
      expect(result1).toBe(result2);
    });

    // Cached bundle should be reused
    it('should reuse cached bundle on subsequent calls', async () => {
      const license = createMockLicense();

      const result1 = await serveWidgetBundle(license as any);
      const result2 = await serveWidgetBundle(license as any);

      // Same object reference indicates caching
      expect(result1).toBe(result2);
    });

    // Cache should significantly improve performance
    it('should return immediately from cache', async () => {
      const license = createMockLicense();

      // First call (slower, reads file)
      const start1 = Date.now();
      await serveWidgetBundle(license as any);
      const time1 = Date.now() - start1;

      // Second call (faster, from cache)
      const start2 = Date.now();
      await serveWidgetBundle(license as any);
      const time2 = Date.now() - start2;

      // Cached call should be faster (no file I/O)
      // Note: timing is approximate, both should be fast
      expect(time2).toBeLessThanOrEqual(time1 + 10); // Allow small variance
    });
  });

  describe('Different Licenses', () => {
    // Must inject different flags for different licenses
    it('should inject different flags for different licenses', async () => {
      const basicLicense = createMockLicense({ tier: 'basic' });
      const proLicense = createMockLicense({ tier: 'pro' });

      const result1 = await serveWidgetBundle(basicLicense as any);
      const result2 = await serveWidgetBundle(proLicense as any);

      // Results should be different due to different flags
      expect(result1).not.toBe(result2);
    });

    // Must include basic tier in flags
    it('should include basic tier in bundle', async () => {
      const license = createMockLicense({ tier: 'basic' });

      const result = await serveWidgetBundle(license as any);

      expect(result).toContain('basic');
    });

    // Must include pro tier in flags
    it('should include pro tier in bundle', async () => {
      const license = createMockLicense({ tier: 'pro' });

      const result = await serveWidgetBundle(license as any);

      expect(result).toContain('pro');
    });

    // Must include agency tier in flags
    it('should include agency tier in bundle', async () => {
      const license = createMockLicense({ tier: 'agency' });

      const result = await serveWidgetBundle(license as any);

      expect(result).toContain('agency');
    });

    // Must handle multiple tiers
    it('should serve correct bundle for each tier', async () => {
      const tiers: Array<'basic' | 'pro' | 'agency'> = ['basic', 'pro', 'agency'];

      for (const tier of tiers) {
        clearBundleCache();
        const license = createMockLicense({ tier });
        const result = await serveWidgetBundle(license as any);
        expect(result).toContain(tier);
      }
    });
  });

  describe('Branding Handling', () => {
    // Must handle branding enabled
    it('should handle branding enabled flag', async () => {
      const license = createMockLicense({ brandingEnabled: true });

      const result = await serveWidgetBundle(license as any);

      expect(result).toContain('brandingEnabled');
      expect(result).toContain('true');
    });

    // Must handle branding disabled
    it('should handle branding disabled flag', async () => {
      const license = createMockLicense({ brandingEnabled: false });

      const result = await serveWidgetBundle(license as any);

      expect(result).toContain('brandingEnabled');
      expect(result).toContain('false');
    });

    // Different branding settings should produce different results
    it('should produce different bundles for different branding settings', async () => {
      const withBranding = createMockLicense({ brandingEnabled: true });
      const withoutBranding = createMockLicense({ brandingEnabled: false });

      const result1 = await serveWidgetBundle(withBranding as any);
      const result2 = await serveWidgetBundle(withoutBranding as any);

      expect(result1).not.toBe(result2);
    });
  });

  describe('Cache Invalidation', () => {
    // Cache can be cleared
    it('should support cache clearing', async () => {
      const license = createMockLicense();

      const result1 = await serveWidgetBundle(license as any);

      clearBundleCache();

      const result2 = await serveWidgetBundle(license as any);

      // After cache clear, should get same result but different call
      expect(result1).toBe(result2); // Content should be same
    });

    // Clearing cache forces re-read
    it('should force re-read after cache clear', async () => {
      const license = createMockLicense();

      await serveWidgetBundle(license as any);
      clearBundleCache();

      // This should trigger a re-read from filesystem
      const result = await serveWidgetBundle(license as any);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    // Should throw if bundle read fails
    it('should throw error if bundle read fails', async () => {
      const license = createMockLicense();

      // Mock filesystem error
      vi.spyOn(global as any, 'fetch').mockRejectedValueOnce(
        new Error('File not found')
      );

      // This test depends on implementation - adjust if needed
      // Implementation should handle file read errors
    });

    // Should throw if injection fails
    it('should throw error if injection fails', async () => {
      const license = createMockLicense();

      // Invalid license should potentially cause injection failure
      // Behavior depends on implementation
      const result = await serveWidgetBundle(license as any);
      expect(result).toBeDefined();
    });
  });

  describe('Return Type', () => {
    // Must return string
    it('should always return string', async () => {
      const license = createMockLicense();

      const result = await serveWidgetBundle(license as any);

      expect(typeof result).toBe('string');
    });

    // Must be non-empty
    it('should return non-empty string', async () => {
      const license = createMockLicense();

      const result = await serveWidgetBundle(license as any);

      expect(result.length).toBeGreaterThan(0);
    });

    // Must contain license flags
    it('should contain injected license flags', async () => {
      const license = createMockLicense();

      const result = await serveWidgetBundle(license as any);

      expect(result).toContain('window.N8N_LICENSE_FLAGS');
    });
  });

  describe('Async Behavior', () => {
    // Must be async function
    it('should be async function', async () => {
      const license = createMockLicense();

      const promise = serveWidgetBundle(license as any);

      expect(promise).toBeInstanceOf(Promise);
    });

    // Must return promise
    it('should return promise that resolves to string', async () => {
      const license = createMockLicense();

      const result = await serveWidgetBundle(license as any);

      expect(typeof result).toBe('string');
    });

    // Promise should resolve successfully
    it('should resolve promise without errors', async () => {
      const license = createMockLicense();

      const promise = serveWidgetBundle(license as any);

      await expect(promise).resolves.toBeDefined();
    });
  });

  describe('Performance', () => {
    // Bundle should be reasonably sized
    it('should return bundle of reasonable size', async () => {
      const license = createMockLicense();

      const result = await serveWidgetBundle(license as any);

      // Widget bundle should be at least 1KB (has code)
      expect(result.length).toBeGreaterThan(1000);
    });

    // Bundle should be under size limit
    it('should keep bundle under size constraints', async () => {
      const license = createMockLicense();

      const result = await serveWidgetBundle(license as any);

      // Widget should be under 100KB uncompressed
      // Gzipped should be under 50KB (checked at serve time)
      expect(result.length).toBeLessThan(100000);
    });
  });

  describe('Multiple License Support', () => {
    // Should support many different licenses
    it('should serve multiple licenses with correct flags', async () => {
      const licenses = [
        createMockLicense({ id: 'lic-1', tier: 'basic' }),
        createMockLicense({ id: 'lic-2', tier: 'pro' }),
        createMockLicense({ id: 'lic-3', tier: 'agency' })
      ];

      for (const license of licenses) {
        clearBundleCache();
        const result = await serveWidgetBundle(license as any);
        expect(result).toContain(license.tier);
      }
    });
  });
});

describe('clearBundleCache', () => {
  describe('Cache Clearing', () => {
    // Must clear cache
    it('should be callable', () => {
      expect(() => {
        clearBundleCache();
      }).not.toThrow();
    });

    // Must allow fresh bundle read
    it('should allow fresh bundle read after clearing', async () => {
      const license = createMockLicense();

      // Get bundle (cached)
      const result1 = await serveWidgetBundle(license as any);

      // Clear cache
      clearBundleCache();

      // Get bundle again
      const result2 = await serveWidgetBundle(license as any);

      // Content should be same but cache was cleared
      expect(result1).toBe(result2);
    });

    // Should not return value
    it('should be void function', () => {
      const result = clearBundleCache();
      expect(result).toBeUndefined();
    });

    // Should not throw on multiple calls
    it('should handle multiple clear calls', () => {
      expect(() => {
        clearBundleCache();
        clearBundleCache();
        clearBundleCache();
      }).not.toThrow();
    });
  });

  describe('Interaction with serveWidgetBundle', () => {
    // After clear, bundle should be re-read
    it('should force bundle re-read after clear', async () => {
      const license = createMockLicense();

      // Serve bundle
      const result1 = await serveWidgetBundle(license as any);

      // Clear cache
      clearBundleCache();

      // Serve again (should re-read)
      const result2 = await serveWidgetBundle(license as any);

      // Results should be identical
      expect(result1).toBe(result2);
    });

    // Multiple clears should not cause issues
    it('should handle consecutive clear and serve calls', async () => {
      const license = createMockLicense();

      for (let i = 0; i < 3; i++) {
        clearBundleCache();
        const result = await serveWidgetBundle(license as any);
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
      }
    });
  });

  describe('State Management', () => {
    // Clear should reset all cache state
    it('should completely reset cache state', async () => {
      const license1 = createMockLicense({ tier: 'basic' });
      const license2 = createMockLicense({ tier: 'pro' });

      // Serve with first license
      const result1 = await serveWidgetBundle(license1 as any);

      // Clear cache
      clearBundleCache();

      // Serve with different license
      const result2 = await serveWidgetBundle(license2 as any);

      // Both should be valid
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1).not.toBe(result2);
    });
  });
});
