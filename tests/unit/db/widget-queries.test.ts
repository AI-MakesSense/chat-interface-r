/**
 * Unit Tests for Widget Database Query Functions
 *
 * Tests for Phase 3 Module 2 Day 1: Core Widget Database Queries
 *
 * RED Phase: These tests will FAIL because:
 * - Query functions don't exist yet (import errors)
 * - Functions: getWidgetById, getWidgetWithLicense, createWidget, updateWidget, deleteWidget
 *
 * Test Coverage:
 * A. getWidgetById Tests (5 tests)
 * B. getWidgetWithLicense Tests (6 tests)
 * C. createWidget Tests (8 tests)
 * D. updateWidget Tests (8 tests)
 * E. deleteWidget Tests (5 tests)
 *
 * Total: 32 tests
 *
 * Expected Failure:
 * ❌ Cannot find module '@/lib/db/queries' or its corresponding type declarations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db/client';
import { users, licenses, widgets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createDefaultConfig } from '@/lib/config/defaults';

// FAIL REASON: These imports will fail because functions don't exist yet
import {
  getWidgetById,
  getWidgetWithLicense,
  createWidget,
  updateWidget,
  deleteWidget,
} from '@/lib/db/queries';

describe.sequential('Widget Database Queries - Unit Tests', () => {
  let testUser: any;
  let testLicense: any;
  const testRunId = Math.random().toString(36).substring(7);

  beforeAll(async () => {
    // Create test user
    [testUser] = await db.insert(users).values({
      email: `test-widgets-queries-${testRunId}@example.com`,
      passwordHash: 'dummy-hash',
      name: 'Test User',
    }).returning();

    // Create test license (Basic tier)
    [testLicense] = await db.insert(licenses).values({
      userId: testUser.id,
      licenseKey: `TEST-KEY-QUERIES-${testRunId}`,
      tier: 'basic',
      domains: ['example.com'],
      domainLimit: 1,
      widgetLimit: 1,
      brandingEnabled: true,
      status: 'active',
    }).returning();
  });

  afterAll(async () => {
    // Cleanup (CASCADE will handle widgets)
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  // ==========================================================================
  // A. getWidgetById Tests (5 tests)
  // ==========================================================================

  describe('getWidgetById', () => {
    it('should return widget when found', async () => {
      // FAIL REASON: getWidgetById function doesn't exist yet

      // Create a test widget
      const testConfig = createDefaultConfig('basic');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Test Widget',
        status: 'active',
        config: testConfig,
      }).returning();

      // Call getWidgetById
      const result = await getWidgetById(createdWidget.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(createdWidget.id);
      expect(result?.name).toBe('Test Widget');
      expect(result?.status).toBe('active');
      expect(result?.licenseId).toBe(testLicense.id);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
    });

    it('should return null when widget does not exist', async () => {
      // FAIL REASON: getWidgetById function doesn't exist yet

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const result = await getWidgetById(nonExistentId);

      expect(result).toBeNull();
    });

    it('should return widget with correct structure', async () => {
      // FAIL REASON: getWidgetById function doesn't exist yet

      // Create a test widget
      const testConfig = createDefaultConfig('basic');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Structure Test Widget',
        status: 'active',
        config: testConfig,
      }).returning();

      // Call getWidgetById
      const result = await getWidgetById(createdWidget.id);

      // Verify all expected fields are present
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('licenseId');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('config');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('deployedAt');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');

      // Verify types
      expect(typeof result?.id).toBe('string');
      expect(typeof result?.name).toBe('string');
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
    });

    it('should return soft-deleted widgets (status=deleted)', async () => {
      // FAIL REASON: getWidgetById function doesn't exist yet

      // Create and soft-delete a widget
      const testConfig = createDefaultConfig('basic');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Deleted Widget',
        status: 'deleted', // Soft-deleted
        config: testConfig,
      }).returning();

      // Call getWidgetById - should still return deleted widgets
      const result = await getWidgetById(createdWidget.id);

      expect(result).not.toBeNull();
      expect(result?.status).toBe('deleted');
      expect(result?.id).toBe(createdWidget.id);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
    });

    it('should handle invalid UUID format', async () => {
      // FAIL REASON: getWidgetById function doesn't exist yet

      const invalidId = 'not-a-valid-uuid';

      // Should either return null or throw an error
      // Implementation should handle gracefully
      await expect(async () => {
        const result = await getWidgetById(invalidId);
        // If it doesn't throw, it should return null
        if (result !== null && result !== undefined) {
          throw new Error('Expected null or error for invalid UUID');
        }
      }).rejects.toThrow();
    });
  });

  // ==========================================================================
  // B. getWidgetWithLicense Tests (6 tests)
  // ==========================================================================

  describe('getWidgetWithLicense', () => {
    it('should return widget with license data when found', async () => {
      // FAIL REASON: getWidgetWithLicense function doesn't exist yet

      // Create a test widget
      const testConfig = createDefaultConfig('basic');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Widget with License',
        status: 'active',
        config: testConfig,
      }).returning();

      // Call getWidgetWithLicense
      const result = await getWidgetWithLicense(createdWidget.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(createdWidget.id);
      expect(result?.license).toBeDefined();
      expect(result?.license.id).toBe(testLicense.id);
      expect(result?.license.userId).toBe(testUser.id);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
    });

    it('should return null when widget does not exist', async () => {
      // FAIL REASON: getWidgetWithLicense function doesn't exist yet

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const result = await getWidgetWithLicense(nonExistentId);

      expect(result).toBeNull();
    });

    it('should include license tier, status, and domains', async () => {
      // FAIL REASON: getWidgetWithLicense function doesn't exist yet

      // Create a test widget
      const testConfig = createDefaultConfig('basic');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'License Details Test',
        status: 'active',
        config: testConfig,
      }).returning();

      // Call getWidgetWithLicense
      const result = await getWidgetWithLicense(createdWidget.id);

      expect(result).not.toBeNull();
      expect(result?.license.tier).toBe('basic');
      expect(result?.license.status).toBe('active');
      expect(result?.license.domains).toEqual(['example.com']);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
    });

    it('should work with basic tier license', async () => {
      // FAIL REASON: getWidgetWithLicense function doesn't exist yet

      // testLicense is already Basic tier
      const testConfig = createDefaultConfig('basic');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Basic Tier Widget',
        status: 'active',
        config: testConfig,
      }).returning();

      const result = await getWidgetWithLicense(createdWidget.id);

      expect(result).not.toBeNull();
      expect(result?.license.tier).toBe('basic');
      expect(result?.license.widgetLimit).toBe(1);
      expect(result?.license.brandingEnabled).toBe(true);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
    });

    it('should work with pro tier license', async () => {
      // FAIL REASON: getWidgetWithLicense function doesn't exist yet

      // Create Pro tier license
      const [proLicense] = await db.insert(licenses).values({
        userId: testUser.id,
        licenseKey: `TEST-KEY-PRO-${testRunId}`,
        tier: 'pro',
        domains: ['pro.example.com'],
        domainLimit: 1,
        widgetLimit: 3,
        brandingEnabled: false,
        status: 'active',
      }).returning();

      const testConfig = createDefaultConfig('pro');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: proLicense.id,
        name: 'Pro Tier Widget',
        status: 'active',
        config: testConfig,
      }).returning();

      const result = await getWidgetWithLicense(createdWidget.id);

      expect(result).not.toBeNull();
      expect(result?.license.tier).toBe('pro');
      expect(result?.license.widgetLimit).toBe(3);
      expect(result?.license.brandingEnabled).toBe(false);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
      await db.delete(licenses).where(eq(licenses.id, proLicense.id));
    });

    it('should work with agency tier license', async () => {
      // FAIL REASON: getWidgetWithLicense function doesn't exist yet

      // Create Agency tier license
      const [agencyLicense] = await db.insert(licenses).values({
        userId: testUser.id,
        licenseKey: `TEST-KEY-AGENCY-${testRunId}`,
        tier: 'agency',
        domains: ['agency1.com', 'agency2.com'],
        domainLimit: -1, // Unlimited
        widgetLimit: -1, // Unlimited
        brandingEnabled: false,
        status: 'active',
      }).returning();

      const testConfig = createDefaultConfig('agency');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: agencyLicense.id,
        name: 'Agency Tier Widget',
        status: 'active',
        config: testConfig,
      }).returning();

      const result = await getWidgetWithLicense(createdWidget.id);

      expect(result).not.toBeNull();
      expect(result?.license.tier).toBe('agency');
      expect(result?.license.widgetLimit).toBe(-1); // Unlimited
      expect(result?.license.brandingEnabled).toBe(false);
      expect(result?.license.domains).toEqual(['agency1.com', 'agency2.com']);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
      await db.delete(licenses).where(eq(licenses.id, agencyLicense.id));
    });
  });

  // ==========================================================================
  // C. createWidget Tests (8 tests)
  // ==========================================================================

  describe('createWidget', () => {
    it('should create widget with valid data', async () => {
      // FAIL REASON: createWidget function doesn't exist yet

      const testConfig = createDefaultConfig('basic');
      const widgetData = {
        licenseId: testLicense.id,
        name: 'New Widget',
        config: testConfig,
      };

      const result = await createWidget(widgetData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('New Widget');
      expect(result.licenseId).toBe(testLicense.id);
      expect(result.config).toEqual(testConfig);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, result.id));
    });

    it('should auto-generate UUID id', async () => {
      // FAIL REASON: createWidget function doesn't exist yet

      const testConfig = createDefaultConfig('basic');
      const widgetData = {
        licenseId: testLicense.id,
        name: 'UUID Test Widget',
        config: testConfig,
      };

      const result = await createWidget(widgetData);

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      // UUID format: 8-4-4-4-12 hexadecimal characters
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, result.id));
    });

    it('should set default status=active', async () => {
      // FAIL REASON: createWidget function doesn't exist yet

      const testConfig = createDefaultConfig('basic');
      const widgetData = {
        licenseId: testLicense.id,
        name: 'Status Default Test',
        config: testConfig,
      };

      const result = await createWidget(widgetData);

      expect(result.status).toBe('active');

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, result.id));
    });

    it('should set default version=1', async () => {
      // FAIL REASON: createWidget function doesn't exist yet

      const testConfig = createDefaultConfig('basic');
      const widgetData = {
        licenseId: testLicense.id,
        name: 'Version Default Test',
        config: testConfig,
      };

      const result = await createWidget(widgetData);

      expect(result.version).toBe(1);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, result.id));
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      // FAIL REASON: createWidget function doesn't exist yet

      const beforeCreate = Date.now();
      const testConfig = createDefaultConfig('basic');
      const widgetData = {
        licenseId: testLicense.id,
        name: 'Timestamp Test',
        config: testConfig,
      };

      const result = await createWidget(widgetData);
      const afterCreate = Date.now();

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate);
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterCreate + 1000);
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate);
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate + 1000);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, result.id));
    });

    it('should store config as JSONB', async () => {
      // FAIL REASON: createWidget function doesn't exist yet

      const testConfig = createDefaultConfig('basic');
      // Modify config to test JSONB storage
      testConfig.branding.companyName = 'JSONB Test Company';
      testConfig.theme.colors.primary = '#FF5733';

      const widgetData = {
        licenseId: testLicense.id,
        name: 'JSONB Test Widget',
        config: testConfig,
      };

      const result = await createWidget(widgetData);

      expect(result.config).toEqual(testConfig);
      expect(result.config.branding.companyName).toBe('JSONB Test Company');
      expect(result.config.theme.colors.primary).toBe('#FF5733');

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, result.id));
    });

    it('should fail if licenseId does not exist (foreign key violation)', async () => {
      // FAIL REASON: createWidget function doesn't exist yet

      const testConfig = createDefaultConfig('basic');
      const invalidLicenseId = '00000000-0000-0000-0000-000000000000';
      const widgetData = {
        licenseId: invalidLicenseId,
        name: 'Invalid License Widget',
        config: testConfig,
      };

      await expect(createWidget(widgetData)).rejects.toThrow();
    });

    it('should fail if required fields are missing', async () => {
      // FAIL REASON: createWidget function doesn't exist yet

      // Missing config field
      const incompleteData = {
        licenseId: testLicense.id,
        name: 'Incomplete Widget',
      } as any;

      await expect(createWidget(incompleteData)).rejects.toThrow();
    });
  });

  // ==========================================================================
  // D. updateWidget Tests (8 tests)
  // ==========================================================================

  describe('updateWidget', () => {
    it('should update widget name successfully', async () => {
      // FAIL REASON: updateWidget function doesn't exist yet

      const testConfig = createDefaultConfig('basic');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Original Name',
        config: testConfig,
      }).returning();

      const result = await updateWidget(createdWidget.id, {
        name: 'Updated Name',
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Name');
      expect(result?.id).toBe(createdWidget.id);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
    });

    it('should update widget config successfully', async () => {
      // FAIL REASON: updateWidget function doesn't exist yet

      const testConfig = createDefaultConfig('basic');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Config Update Test',
        config: testConfig,
      }).returning();

      const updatedConfig = createDefaultConfig('basic');
      updatedConfig.branding.companyName = 'Updated Company';

      const result = await updateWidget(createdWidget.id, {
        config: updatedConfig,
      });

      expect(result).not.toBeNull();
      expect(result?.config.branding.companyName).toBe('Updated Company');

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
    });

    it('should update widget status successfully', async () => {
      // FAIL REASON: updateWidget function doesn't exist yet

      const testConfig = createDefaultConfig('basic');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Status Update Test',
        status: 'active',
        config: testConfig,
      }).returning();

      const result = await updateWidget(createdWidget.id, {
        status: 'paused',
      });

      expect(result).not.toBeNull();
      expect(result?.status).toBe('paused');

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
    });

    it('should update multiple fields at once', async () => {
      // FAIL REASON: updateWidget function doesn't exist yet

      const testConfig = createDefaultConfig('basic');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Multi Update Test',
        status: 'active',
        config: testConfig,
      }).returning();

      const updatedConfig = createDefaultConfig('basic');
      updatedConfig.branding.companyName = 'Multi Update Company';

      const result = await updateWidget(createdWidget.id, {
        name: 'Multi Updated Name',
        status: 'paused',
        config: updatedConfig,
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Multi Updated Name');
      expect(result?.status).toBe('paused');
      expect(result?.config.branding.companyName).toBe('Multi Update Company');

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
    });

    it('should update updatedAt timestamp', async () => {
      // FAIL REASON: updateWidget function doesn't exist yet

      const testConfig = createDefaultConfig('basic');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Timestamp Update Test',
        config: testConfig,
      }).returning();

      const originalUpdatedAt = createdWidget.updatedAt.getTime();

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await updateWidget(createdWidget.id, {
        name: 'Updated Name',
      });

      expect(result).not.toBeNull();
      expect(result?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
    });

    it('should return null if widget does not exist', async () => {
      // FAIL REASON: updateWidget function doesn't exist yet

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const result = await updateWidget(nonExistentId, {
        name: 'Updated Name',
      });

      expect(result).toBeNull();
    });

    it('should NOT update createdAt', async () => {
      // FAIL REASON: updateWidget function doesn't exist yet

      const testConfig = createDefaultConfig('basic');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'CreatedAt Test',
        config: testConfig,
      }).returning();

      const originalCreatedAt = createdWidget.createdAt.getTime();

      const result = await updateWidget(createdWidget.id, {
        name: 'Updated Name',
      });

      expect(result).not.toBeNull();
      expect(result?.createdAt.getTime()).toBe(originalCreatedAt);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
    });

    it('should preserve fields not in update data', async () => {
      // FAIL REASON: updateWidget function doesn't exist yet

      const testConfig = createDefaultConfig('basic');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Preserve Fields Test',
        status: 'active',
        config: testConfig,
      }).returning();

      // Update only name, other fields should remain unchanged
      const result = await updateWidget(createdWidget.id, {
        name: 'Updated Name Only',
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Name Only');
      expect(result?.status).toBe('active'); // Preserved
      expect(result?.config).toEqual(testConfig); // Preserved
      expect(result?.version).toBe(1); // Preserved

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
    });
  });

  // ==========================================================================
  // E. deleteWidget Tests (5 tests)
  // ==========================================================================

  describe('deleteWidget', () => {
    it('should set status to deleted', async () => {
      // FAIL REASON: deleteWidget function doesn't exist yet

      const testConfig = createDefaultConfig('basic');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Delete Test Widget',
        status: 'active',
        config: testConfig,
      }).returning();

      const result = await deleteWidget(createdWidget.id);

      expect(result).not.toBeNull();
      expect(result?.status).toBe('deleted');
      expect(result?.id).toBe(createdWidget.id);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
    });

    it('should update updatedAt timestamp', async () => {
      // FAIL REASON: deleteWidget function doesn't exist yet

      const testConfig = createDefaultConfig('basic');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Delete Timestamp Test',
        config: testConfig,
      }).returning();

      const originalUpdatedAt = createdWidget.updatedAt.getTime();

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await deleteWidget(createdWidget.id);

      expect(result).not.toBeNull();
      expect(result?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
    });

    it('should return updated widget', async () => {
      // FAIL REASON: deleteWidget function doesn't exist yet

      const testConfig = createDefaultConfig('basic');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Delete Return Test',
        config: testConfig,
      }).returning();

      const result = await deleteWidget(createdWidget.id);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status');
      expect(result?.status).toBe('deleted');

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
    });

    it('should return null if widget does not exist', async () => {
      // FAIL REASON: deleteWidget function doesn't exist yet

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const result = await deleteWidget(nonExistentId);

      expect(result).toBeNull();
    });

    it('should preserve all other data (name, config, etc)', async () => {
      // FAIL REASON: deleteWidget function doesn't exist yet

      const testConfig = createDefaultConfig('basic');
      const [createdWidget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Delete Preserve Test',
        status: 'active',
        config: testConfig,
        version: 1,
      }).returning();

      const result = await deleteWidget(createdWidget.id);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Delete Preserve Test');
      expect(result?.config).toEqual(testConfig);
      expect(result?.version).toBe(1);
      expect(result?.licenseId).toBe(testLicense.id);
      // Only status should change
      expect(result?.status).toBe('deleted');

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, createdWidget.id));
    });
  });
});
