/**
 * License Store Tests (RED Phase)
 *
 * Tests for license management state.
 * These tests should FAIL initially as they expose missing functionality or bugs.
 *
 * Test Coverage:
 * - fetchLicenses
 * - getLicense
 * - updateLicense (domains)
 * - deleteLicense
 * - selectLicense
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLicenseStore } from '@/stores/license-store';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

describe('License Store', () => {
  beforeEach(() => {
    // Clear store state before each test
    useLicenseStore.setState({
      licenses: [],
      selectedLicense: null,
      isLoading: false,
      error: null,
    });
  });

  describe('Initial State', () => {
    it('should fail - initial state should be empty', () => {
      // WHY THIS SHOULD FAIL: Verify default state is correct
      const state = useLicenseStore.getState();

      expect(state.licenses).toEqual([]);
      expect(state.selectedLicense).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchLicenses', () => {
    it('should fail - fetchLicenses should populate licenses array', async () => {
      // WHY THIS SHOULD FAIL: Need to verify fetching works
      const { fetchLicenses } = useLicenseStore.getState();

      await fetchLicenses();

      const state = useLicenseStore.getState();

      expect(state.licenses).toHaveLength(1);
      expect(state.licenses[0]).toMatchObject({
        id: 'license-123',
        tier: 'pro',
        status: 'active',
      });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should fail - fetchLicenses should set isLoading during request', async () => {
      // WHY THIS SHOULD FAIL: Need to verify loading state
      const { fetchLicenses } = useLicenseStore.getState();

      const promise = fetchLicenses();

      // Check loading state immediately
      expect(useLicenseStore.getState().isLoading).toBe(true);

      await promise;

      // Check loading state after completion
      expect(useLicenseStore.getState().isLoading).toBe(false);
    });

    it('should fail - fetchLicenses should handle API errors', async () => {
      // WHY THIS SHOULD FAIL: Need to verify error handling
      const { fetchLicenses } = useLicenseStore.getState();

      // Mock API error
      server.use(
        http.get('/api/licenses', () => {
          return HttpResponse.json(
            { error: 'Failed to fetch licenses' },
            { status: 500 }
          );
        })
      );

      await expect(fetchLicenses()).rejects.toThrow();

      const state = useLicenseStore.getState();

      expect(state.licenses).toEqual([]);
      expect(state.error).toBe('Failed to fetch licenses');
      expect(state.isLoading).toBe(false);
    });

    it('should fail - fetchLicenses should handle empty response', async () => {
      // WHY THIS SHOULD FAIL: Need to handle empty license list
      const { fetchLicenses } = useLicenseStore.getState();

      // Mock empty response
      server.use(
        http.get('/api/licenses', () => {
          return HttpResponse.json({ licenses: [] });
        })
      );

      await fetchLicenses();

      const state = useLicenseStore.getState();

      expect(state.licenses).toEqual([]);
      expect(state.error).toBeNull();
    });
  });

  describe('getLicense', () => {
    it('should fail - getLicense should return single license', async () => {
      // WHY THIS SHOULD FAIL: Need to verify single license fetch
      const { getLicense } = useLicenseStore.getState();

      const license = await getLicense('license-123');

      expect(license).toMatchObject({
        id: 'license-123',
        tier: 'pro',
        status: 'active',
      });

      const state = useLicenseStore.getState();
      expect(state.error).toBeNull();
    });

    it('should fail - getLicense should handle not found error', async () => {
      // WHY THIS SHOULD FAIL: Need to verify 404 handling
      const { getLicense } = useLicenseStore.getState();

      // Mock 404 response
      server.use(
        http.get('/api/licenses/:id', () => {
          return HttpResponse.json(
            { error: 'License not found' },
            { status: 404 }
          );
        })
      );

      await expect(getLicense('invalid-id')).rejects.toThrow();

      const state = useLicenseStore.getState();
      expect(state.error).toBe('License not found');
    });
  });

  describe('updateLicense', () => {
    it('should fail - updateLicense should update domains', async () => {
      // WHY THIS SHOULD FAIL: Need to verify domain updates
      const { fetchLicenses, updateLicense } = useLicenseStore.getState();

      // Fetch licenses first
      await fetchLicenses();

      // Update domains
      const updatedLicense = await updateLicense('license-123', {
        domains: ['newdomain.com', 'example.com'],
      });

      expect(updatedLicense.domains).toEqual(['newdomain.com', 'example.com']);

      // Verify store was updated
      const state = useLicenseStore.getState();
      const license = state.licenses.find((l) => l.id === 'license-123');

      expect(license?.domains).toEqual(['newdomain.com', 'example.com']);
      expect(state.error).toBeNull();
    });

    it('should fail - updateLicense should update selectedLicense if it matches', async () => {
      // WHY THIS SHOULD FAIL: Need to verify selected license updates
      const { selectLicense, updateLicense } = useLicenseStore.getState();

      // Select a license
      selectLicense({
        id: 'license-123',
        userId: 'user-123',
        licenseKey: 'test-key',
        tier: 'pro',
        status: 'active',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: false,
        widgetLimit: null,
        stripeSubscriptionId: 'sub_123',
        expiresAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });

      // Update license
      await updateLicense('license-123', {
        domains: ['updated.com'],
      });

      const state = useLicenseStore.getState();

      expect(state.selectedLicense?.domains).toEqual(['updated.com']);
    });

    it('should fail - updateLicense should handle validation errors', async () => {
      // WHY THIS SHOULD FAIL: Need to verify validation error handling
      const { updateLicense } = useLicenseStore.getState();

      // Mock validation error
      server.use(
        http.put('/api/licenses/:id', () => {
          return HttpResponse.json(
            { error: 'Domain limit exceeded' },
            { status: 400 }
          );
        })
      );

      await expect(
        updateLicense('license-123', {
          domains: ['domain1.com', 'domain2.com'],
        })
      ).rejects.toThrow();

      const state = useLicenseStore.getState();
      expect(state.error).toBe('Domain limit exceeded');
    });
  });

  describe('deleteLicense', () => {
    it('should fail - deleteLicense should remove license from store', async () => {
      // WHY THIS SHOULD FAIL: Need to verify deletion
      const { fetchLicenses, deleteLicense } = useLicenseStore.getState();

      // Fetch licenses first
      await fetchLicenses();
      expect(useLicenseStore.getState().licenses).toHaveLength(1);

      // Delete license
      await deleteLicense('license-123');

      const state = useLicenseStore.getState();

      expect(state.licenses).toHaveLength(0);
      expect(state.error).toBeNull();
    });

    it('should fail - deleteLicense should clear selectedLicense if it matches', async () => {
      // WHY THIS SHOULD FAIL: Need to verify selected license is cleared
      const { selectLicense, deleteLicense } = useLicenseStore.getState();

      // Select a license
      selectLicense({
        id: 'license-123',
        userId: 'user-123',
        licenseKey: 'test-key',
        tier: 'pro',
        status: 'active',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: false,
        widgetLimit: null,
        stripeSubscriptionId: 'sub_123',
        expiresAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });

      // Delete license
      await deleteLicense('license-123');

      const state = useLicenseStore.getState();

      expect(state.selectedLicense).toBeNull();
    });

    it('should fail - deleteLicense should not clear selectedLicense if different', async () => {
      // WHY THIS SHOULD FAIL: Need to verify other licenses remain selected
      const { selectLicense, deleteLicense } = useLicenseStore.getState();

      // Select a different license
      selectLicense({
        id: 'license-456',
        userId: 'user-123',
        licenseKey: 'test-key',
        tier: 'basic',
        status: 'active',
        domains: ['other.com'],
        domainLimit: 1,
        brandingEnabled: true,
        widgetLimit: null,
        stripeSubscriptionId: 'sub_456',
        expiresAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });

      // Delete different license
      await deleteLicense('license-123');

      const state = useLicenseStore.getState();

      expect(state.selectedLicense?.id).toBe('license-456');
    });

    it('should fail - deleteLicense should handle errors', async () => {
      // WHY THIS SHOULD FAIL: Need to verify error handling
      const { deleteLicense } = useLicenseStore.getState();

      // Mock error
      server.use(
        http.delete('/api/licenses/:id', () => {
          return HttpResponse.json(
            { error: 'Cannot cancel active subscription' },
            { status: 400 }
          );
        })
      );

      await expect(deleteLicense('license-123')).rejects.toThrow();

      const state = useLicenseStore.getState();
      expect(state.error).toBe('Cannot cancel active subscription');
    });
  });

  describe('selectLicense', () => {
    it('should fail - selectLicense should set selectedLicense', () => {
      // WHY THIS SHOULD FAIL: Need to verify selection
      const { selectLicense } = useLicenseStore.getState();

      const license = {
        id: 'license-123',
        userId: 'user-123',
        licenseKey: 'test-key',
        tier: 'pro' as const,
        status: 'active' as const,
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: false,
        widgetLimit: null,
        stripeSubscriptionId: 'sub_123',
        expiresAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      selectLicense(license);

      const state = useLicenseStore.getState();

      expect(state.selectedLicense).toEqual(license);
    });

    it('should fail - selectLicense with null should clear selection', () => {
      // WHY THIS SHOULD FAIL: Need to verify clearing selection
      const { selectLicense } = useLicenseStore.getState();

      // Select first
      selectLicense({
        id: 'license-123',
        userId: 'user-123',
        licenseKey: 'test-key',
        tier: 'pro',
        status: 'active',
        domains: ['example.com'],
        domainLimit: 1,
        brandingEnabled: false,
        widgetLimit: null,
        stripeSubscriptionId: 'sub_123',
        expiresAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });

      // Clear selection
      selectLicense(null);

      const state = useLicenseStore.getState();

      expect(state.selectedLicense).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    it('should fail - clearError should clear error state', () => {
      // WHY THIS SHOULD FAIL: Need to verify error clearing
      useLicenseStore.setState({ error: 'Test error' });

      const { clearError } = useLicenseStore.getState();
      clearError();

      const state = useLicenseStore.getState();
      expect(state.error).toBeNull();
    });
  });
});
