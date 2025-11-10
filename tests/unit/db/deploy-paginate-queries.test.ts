/**
 * Unit Tests for Deployment & Pagination Query Functions
 *
 * Tests for Phase 3 Module 2 Day 3: Deployment & Pagination Query Functions
 *
 * RED Phase: These tests will FAIL because:
 * - Query functions don't exist yet (import errors or runtime errors)
 * - Functions: deployWidget, getWidgetsPaginated, getUserLicensesWithWidgetCounts
 *
 * Test Coverage:
 * A. deployWidget Tests (8 tests)
 * B. getWidgetsPaginated Tests (12 tests)
 * C. getUserLicensesWithWidgetCounts Tests (6 tests)
 *
 * Total: 26 comprehensive RED tests
 *
 * Expected Failure:
 * ❌ Functions not implemented yet in @/lib/db/queries
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import { users, licenses, widgets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createDefaultConfig } from '@/lib/config/defaults';
import { generateLicenseKey } from '@/lib/license/generate';
import type { User, License, Widget } from '@/lib/db/schema';

// RED: These imports will fail because functions don't exist yet
import {
  deployWidget,
  getWidgetsPaginated,
  getUserLicensesWithWidgetCounts,
} from '@/lib/db/queries';

describe.sequential('Deployment & Pagination Database Queries - Unit Tests', () => {
  // Test data storage
  let testRunId: string;
  let testUser: User;
  let testLicense1: License; // Basic tier
  let testLicense2: License; // Pro tier

  beforeAll(async () => {
    // Generate unique test run ID to prevent conflicts
    testRunId = `day3-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Create test user
    [testUser] = await db.insert(users).values({
      email: `day3-user-${testRunId}@example.com`,
      passwordHash: 'hash',
      name: 'Test User',
    }).returning();

    // Create test license 1 (Basic tier)
    [testLicense1] = await db.insert(licenses).values({
      userId: testUser.id,
      licenseKey: generateLicenseKey(),
      tier: 'basic',
      domains: ['test1.com'],
      domainLimit: 1,
      widgetLimit: 1,
      brandingEnabled: true,
      status: 'active',
    }).returning();

    // Create test license 2 (Pro tier)
    [testLicense2] = await db.insert(licenses).values({
      userId: testUser.id,
      licenseKey: generateLicenseKey(),
      tier: 'pro',
      domains: ['test2.com'],
      domainLimit: 1,
      widgetLimit: 3,
      brandingEnabled: false,
      status: 'active',
    }).returning();
  });

  afterAll(async () => {
    // Cleanup (CASCADE will handle widgets automatically)
    await db.delete(licenses).where(eq(licenses.userId, testUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  // ==========================================================================
  // A. deployWidget Tests (8 tests)
  // ==========================================================================

  describe('deployWidget', () => {
    it('should return null for non-existent widget ID', async () => {
      // RED: Function not implemented yet

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const result = await deployWidget(nonExistentId);

      expect(result).toBeNull();
    });

    it('should set deployedAt timestamp when deploying widget', async () => {
      // RED: Function not implemented yet

      // Create widget first
      const config = createDefaultConfig('basic');
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Test Widget',
        status: 'active',
        config,
        deployedAt: null, // Not deployed yet
      }).returning();

      // Deploy it
      const deployed = await deployWidget(widget.id);

      // Verify deployedAt is recent (within last 5 seconds)
      expect(deployed).not.toBeNull();
      expect(deployed!.deployedAt).not.toBeNull();
      const deployedTime = deployed!.deployedAt!.getTime();
      const now = Date.now();
      expect(deployedTime).toBeGreaterThan(now - 5000); // Within 5 seconds
      expect(deployedTime).toBeLessThanOrEqual(now);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should set status to active when deploying', async () => {
      // RED: Function not implemented yet

      // Create paused widget
      const config = createDefaultConfig('basic');
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Paused Widget',
        status: 'paused',
        config,
        deployedAt: null,
      }).returning();

      // Deploy it
      const deployed = await deployWidget(widget.id);

      expect(deployed).not.toBeNull();
      expect(deployed!.status).toBe('active');

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should update updatedAt timestamp', async () => {
      // RED: Function not implemented yet

      // Create widget
      const config = createDefaultConfig('basic');
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Update Test Widget',
        status: 'active',
        config,
        deployedAt: null,
      }).returning();

      const originalUpdatedAt = widget.updatedAt.getTime();

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Deploy it
      const deployed = await deployWidget(widget.id);

      expect(deployed).not.toBeNull();
      expect(deployed!.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should work for widget that was never deployed (deployedAt was null)', async () => {
      // RED: Function not implemented yet

      // Create widget that was never deployed
      const config = createDefaultConfig('basic');
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Never Deployed Widget',
        status: 'active',
        config,
        deployedAt: null,
      }).returning();

      expect(widget.deployedAt).toBeNull();

      // Deploy it
      const deployed = await deployWidget(widget.id);

      expect(deployed).not.toBeNull();
      expect(deployed!.deployedAt).not.toBeNull();
      expect(deployed!.deployedAt).toBeInstanceOf(Date);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should work for widget being re-deployed (updates deployedAt)', async () => {
      // RED: Function not implemented yet

      // Create widget that was previously deployed
      const oldDeployDate = new Date('2024-01-01T00:00:00Z');
      const config = createDefaultConfig('basic');
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Re-deploy Widget',
        status: 'active',
        config,
        deployedAt: oldDeployDate,
      }).returning();

      expect(widget.deployedAt!.getTime()).toBe(oldDeployDate.getTime());

      // Re-deploy it
      const deployed = await deployWidget(widget.id);

      expect(deployed).not.toBeNull();
      expect(deployed!.deployedAt).not.toBeNull();
      expect(deployed!.deployedAt!.getTime()).toBeGreaterThan(oldDeployDate.getTime());

      // Should be recent (within 5 seconds)
      const now = Date.now();
      expect(deployed!.deployedAt!.getTime()).toBeGreaterThan(now - 5000);
      expect(deployed!.deployedAt!.getTime()).toBeLessThanOrEqual(now);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should work for paused widget (changes status to active)', async () => {
      // RED: Function not implemented yet

      // Create paused widget that was previously deployed
      const oldDeployDate = new Date('2024-01-01T00:00:00Z');
      const config = createDefaultConfig('basic');
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Paused Re-deploy Widget',
        status: 'paused',
        config,
        deployedAt: oldDeployDate,
      }).returning();

      expect(widget.status).toBe('paused');

      // Deploy it (should activate)
      const deployed = await deployWidget(widget.id);

      expect(deployed).not.toBeNull();
      expect(deployed!.status).toBe('active');
      expect(deployed!.deployedAt!.getTime()).toBeGreaterThan(oldDeployDate.getTime());

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should preserve other widget fields (name, config, version)', async () => {
      // RED: Function not implemented yet

      // Create widget with specific data
      const config = createDefaultConfig('basic');
      config.branding.companyName = 'Test Company';
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Preserve Test Widget',
        status: 'paused',
        config,
        version: 3,
        deployedAt: null,
      }).returning();

      // Deploy it
      const deployed = await deployWidget(widget.id);

      expect(deployed).not.toBeNull();
      expect(deployed!.name).toBe('Preserve Test Widget');
      expect(deployed!.config.branding.companyName).toBe('Test Company');
      expect(deployed!.version).toBe(3);
      expect(deployed!.licenseId).toBe(testLicense1.id);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });
  });

  // ==========================================================================
  // B. getWidgetsPaginated Tests (12 tests)
  // ==========================================================================

  describe('getWidgetsPaginated', () => {
    // Helper function to create test widgets
    async function createTestWidgets(count: number, licenseId: string): Promise<Widget[]> {
      const config = createDefaultConfig('basic');
      const createdWidgets: Widget[] = [];

      for (let i = 0; i < count; i++) {
        const [widget] = await db.insert(widgets).values({
          licenseId,
          name: `Widget ${i + 1}`,
          status: 'active',
          config,
        }).returning();
        createdWidgets.push(widget);
        // Small delay to ensure different timestamps
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 5));
        }
      }

      return createdWidgets;
    }

    // Cleanup helper
    async function cleanupTestWidgets() {
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense2.id));
    }

    it('should return empty result for user with no widgets', async () => {
      // RED: Function not implemented yet

      // Create a temporary user with no widgets
      const [tempUser] = await db.insert(users).values({
        email: `temp-${testRunId}@example.com`,
        passwordHash: 'hash',
        name: 'Temp User',
      }).returning();

      const result = await getWidgetsPaginated(tempUser.id);

      expect(result).toBeDefined();
      expect(result.widgets).toEqual([]);
      expect(result.total).toBe(0);
      expect(Array.isArray(result.widgets)).toBe(true);

      // Cleanup
      await db.delete(users).where(eq(users.id, tempUser.id));
    });

    it('should return first page of widgets (page=1, limit=20)', async () => {
      // RED: Function not implemented yet

      // Create 25 widgets to test pagination
      await createTestWidgets(25, testLicense1.id);

      const result = await getWidgetsPaginated(testUser.id, { page: 1, limit: 20 });

      expect(result.total).toBe(25);
      expect(result.widgets.length).toBe(20);
      expect(Array.isArray(result.widgets)).toBe(true);

      // Each widget should have license attached
      expect(result.widgets[0]).toHaveProperty('license');
      expect(result.widgets[0].license.id).toBe(testLicense1.id);

      // Cleanup
      await cleanupTestWidgets();
    });

    it('should return second page of widgets correctly', async () => {
      // RED: Function not implemented yet

      // Create 25 widgets
      await createTestWidgets(25, testLicense1.id);

      // Get page 2
      const result = await getWidgetsPaginated(testUser.id, { page: 2, limit: 20 });

      expect(result.total).toBe(25);
      expect(result.widgets.length).toBe(5); // Remaining 5 widgets
      expect(Array.isArray(result.widgets)).toBe(true);

      // Cleanup
      await cleanupTestWidgets();
    });

    it('should respect custom limit parameter', async () => {
      // RED: Function not implemented yet

      // Create 15 widgets
      await createTestWidgets(15, testLicense1.id);

      const result = await getWidgetsPaginated(testUser.id, { page: 1, limit: 10 });

      expect(result.total).toBe(15);
      expect(result.widgets.length).toBe(10);

      // Cleanup
      await cleanupTestWidgets();
    });

    it('should enforce max limit of 100 (limit=200 should become 100)', async () => {
      // RED: Function not implemented yet

      // Create 150 widgets
      await createTestWidgets(150, testLicense1.id);

      // Request with limit=200 (should be capped at 100)
      const result = await getWidgetsPaginated(testUser.id, { page: 1, limit: 200 });

      expect(result.total).toBe(150);
      expect(result.widgets.length).toBe(100); // Should be capped at 100
      expect(result.widgets.length).not.toBe(150);

      // Cleanup
      await cleanupTestWidgets();
    });

    it('should return correct total count', async () => {
      // RED: Function not implemented yet

      // Create 37 widgets across both licenses
      await createTestWidgets(20, testLicense1.id);
      await createTestWidgets(17, testLicense2.id);

      const result = await getWidgetsPaginated(testUser.id, { page: 1, limit: 20 });

      expect(result.total).toBe(37);
      expect(result.widgets.length).toBe(20);

      // Cleanup
      await cleanupTestWidgets();
    });

    it('should filter by licenseId when provided', async () => {
      // RED: Function not implemented yet

      // Create widgets for both licenses
      await createTestWidgets(10, testLicense1.id);
      await createTestWidgets(5, testLicense2.id);

      // Filter by license1
      const result = await getWidgetsPaginated(testUser.id, {
        page: 1,
        limit: 20,
        licenseId: testLicense1.id,
      });

      expect(result.total).toBe(10);
      expect(result.widgets.length).toBe(10);
      expect(result.widgets.every(w => w.licenseId === testLicense1.id)).toBe(true);

      // Cleanup
      await cleanupTestWidgets();
    });

    it('should exclude deleted widgets by default', async () => {
      // RED: Function not implemented yet

      // Create active and deleted widgets
      const config = createDefaultConfig('basic');
      await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Active Widget 1',
        status: 'active',
        config,
      });

      await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Active Widget 2',
        status: 'active',
        config,
      });

      await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Deleted Widget',
        status: 'deleted',
        config,
      });

      const result = await getWidgetsPaginated(testUser.id, { page: 1, limit: 20 });

      expect(result.total).toBe(2);
      expect(result.widgets.length).toBe(2);
      expect(result.widgets.every(w => w.status !== 'deleted')).toBe(true);

      // Cleanup
      await cleanupTestWidgets();
    });

    it('should include deleted widgets when includeDeleted=true', async () => {
      // RED: Function not implemented yet

      // Create active, paused, and deleted widgets
      const config = createDefaultConfig('basic');
      await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Active Widget',
        status: 'active',
        config,
      });

      await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Paused Widget',
        status: 'paused',
        config,
      });

      await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Deleted Widget',
        status: 'deleted',
        config,
      });

      const result = await getWidgetsPaginated(testUser.id, {
        page: 1,
        limit: 20,
        includeDeleted: true,
      });

      expect(result.total).toBe(3);
      expect(result.widgets.length).toBe(3);
      expect(result.widgets.find(w => w.status === 'deleted')).toBeDefined();

      // Cleanup
      await cleanupTestWidgets();
    });

    it('should order widgets by createdAt DESC (newest first)', async () => {
      // RED: Function not implemented yet

      // Create widgets with delays to ensure different timestamps
      const widgets = await createTestWidgets(5, testLicense1.id);

      const result = await getWidgetsPaginated(testUser.id, { page: 1, limit: 20 });

      expect(result.widgets.length).toBe(5);

      // Verify DESC order (newest first)
      // The last created widget should be first
      expect(result.widgets[0].id).toBe(widgets[4].id);
      expect(result.widgets[4].id).toBe(widgets[0].id);

      // Verify timestamps are in descending order
      for (let i = 0; i < result.widgets.length - 1; i++) {
        expect(result.widgets[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          result.widgets[i + 1].createdAt.getTime()
        );
      }

      // Cleanup
      await cleanupTestWidgets();
    });

    it('should handle last page with fewer items than limit', async () => {
      // RED: Function not implemented yet

      // Create 23 widgets
      await createTestWidgets(23, testLicense1.id);

      // Get page 3 with limit 10 (should have 3 items)
      const result = await getWidgetsPaginated(testUser.id, { page: 3, limit: 10 });

      expect(result.total).toBe(23);
      expect(result.widgets.length).toBe(3);

      // Cleanup
      await cleanupTestWidgets();
    });

    it('should return widgets with license information attached', async () => {
      // RED: Function not implemented yet

      // Create widgets for both licenses
      await createTestWidgets(3, testLicense1.id);
      await createTestWidgets(2, testLicense2.id);

      const result = await getWidgetsPaginated(testUser.id, { page: 1, limit: 20 });

      expect(result.total).toBe(5);
      expect(result.widgets.length).toBe(5);

      // Verify each widget has license attached
      result.widgets.forEach(widget => {
        expect(widget).toHaveProperty('license');
        expect(widget.license).toBeDefined();
        expect(widget.license).toHaveProperty('id');
        expect(widget.license).toHaveProperty('tier');
        expect(widget.license).toHaveProperty('status');
        expect(widget.license).toHaveProperty('domains');
        expect(widget.license.userId).toBe(testUser.id);
      });

      // Cleanup
      await cleanupTestWidgets();
    });
  });

  // ==========================================================================
  // C. getUserLicensesWithWidgetCounts Tests (6 tests)
  // ==========================================================================

  describe('getUserLicensesWithWidgetCounts', () => {
    // Cleanup helper
    async function cleanupTestWidgets() {
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense2.id));
    }

    it('should return empty array for user with no licenses', async () => {
      // RED: Function not implemented yet

      // Create a temporary user with no licenses
      const [tempUser] = await db.insert(users).values({
        email: `temp-no-licenses-${testRunId}@example.com`,
        passwordHash: 'hash',
        name: 'Temp User No Licenses',
      }).returning();

      const result = await getUserLicensesWithWidgetCounts(tempUser.id);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);

      // Cleanup
      await db.delete(users).where(eq(users.id, tempUser.id));
    });

    it('should return licenses with widgetCount=0 for new licenses', async () => {
      // RED: Function not implemented yet

      const result = await getUserLicensesWithWidgetCounts(testUser.id);

      expect(result.length).toBe(2); // testLicense1 and testLicense2
      expect(result[0]).toHaveProperty('widgetCount');
      expect(result[1]).toHaveProperty('widgetCount');
      expect(result[0].widgetCount).toBe(0);
      expect(result[1].widgetCount).toBe(0);
    });

    it('should return correct widgetCount for each license', async () => {
      // RED: Function not implemented yet

      // Create widgets for both licenses
      const config = createDefaultConfig('basic');

      // License 1: 3 widgets
      await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Widget 1',
        status: 'active',
        config,
      });
      await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Widget 2',
        status: 'active',
        config,
      });
      await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Widget 3',
        status: 'active',
        config,
      });

      // License 2: 2 widgets
      await db.insert(widgets).values({
        licenseId: testLicense2.id,
        name: 'Widget A',
        status: 'active',
        config,
      });
      await db.insert(widgets).values({
        licenseId: testLicense2.id,
        name: 'Widget B',
        status: 'active',
        config,
      });

      const result = await getUserLicensesWithWidgetCounts(testUser.id);

      expect(result.length).toBe(2);

      // Find each license in result
      const license1Result = result.find(l => l.id === testLicense1.id);
      const license2Result = result.find(l => l.id === testLicense2.id);

      expect(license1Result).toBeDefined();
      expect(license2Result).toBeDefined();
      expect(license1Result!.widgetCount).toBe(3);
      expect(license2Result!.widgetCount).toBe(2);

      // Cleanup
      await cleanupTestWidgets();
    });

    it('should exclude deleted widgets from counts', async () => {
      // RED: Function not implemented yet

      // Create active and deleted widgets
      const config = createDefaultConfig('basic');

      // License 1: 2 active + 1 deleted
      await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Active Widget 1',
        status: 'active',
        config,
      });
      await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Active Widget 2',
        status: 'active',
        config,
      });
      await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Deleted Widget',
        status: 'deleted',
        config,
      });

      const result = await getUserLicensesWithWidgetCounts(testUser.id);

      const license1Result = result.find(l => l.id === testLicense1.id);
      expect(license1Result).toBeDefined();
      expect(license1Result!.widgetCount).toBe(2); // Only active widgets

      // Cleanup
      await cleanupTestWidgets();
    });

    it('should handle user with multiple licenses correctly', async () => {
      // RED: Function not implemented yet

      // Create 3rd license for the same user
      const [testLicense3] = await db.insert(licenses).values({
        userId: testUser.id,
        licenseKey: generateLicenseKey(),
        tier: 'agency',
        domains: ['test3.com'],
        domainLimit: -1,
        widgetLimit: -1,
        brandingEnabled: false,
        status: 'active',
      }).returning();

      // Create widgets for all 3 licenses
      const config = createDefaultConfig('basic');
      await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'L1 Widget',
        status: 'active',
        config,
      });
      await db.insert(widgets).values({
        licenseId: testLicense2.id,
        name: 'L2 Widget 1',
        status: 'active',
        config,
      });
      await db.insert(widgets).values({
        licenseId: testLicense2.id,
        name: 'L2 Widget 2',
        status: 'active',
        config,
      });
      await db.insert(widgets).values({
        licenseId: testLicense3.id,
        name: 'L3 Widget 1',
        status: 'active',
        config,
      });
      await db.insert(widgets).values({
        licenseId: testLicense3.id,
        name: 'L3 Widget 2',
        status: 'active',
        config,
      });
      await db.insert(widgets).values({
        licenseId: testLicense3.id,
        name: 'L3 Widget 3',
        status: 'active',
        config,
      });

      const result = await getUserLicensesWithWidgetCounts(testUser.id);

      expect(result.length).toBe(3);

      const license1Result = result.find(l => l.id === testLicense1.id);
      const license2Result = result.find(l => l.id === testLicense2.id);
      const license3Result = result.find(l => l.id === testLicense3.id);

      expect(license1Result!.widgetCount).toBe(1);
      expect(license2Result!.widgetCount).toBe(2);
      expect(license3Result!.widgetCount).toBe(3);

      // Cleanup
      await cleanupTestWidgets();
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense3.id));
      await db.delete(licenses).where(eq(licenses.id, testLicense3.id));
    });

    it('should update counts correctly after widget creation', async () => {
      // RED: Function not implemented yet

      // Initial state: no widgets
      let result = await getUserLicensesWithWidgetCounts(testUser.id);
      let license1Result = result.find(l => l.id === testLicense1.id);
      expect(license1Result!.widgetCount).toBe(0);

      // Create a widget
      const config = createDefaultConfig('basic');
      await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'New Widget',
        status: 'active',
        config,
      });

      // Check again
      result = await getUserLicensesWithWidgetCounts(testUser.id);
      license1Result = result.find(l => l.id === testLicense1.id);
      expect(license1Result!.widgetCount).toBe(1);

      // Create another widget
      await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Another Widget',
        status: 'active',
        config,
      });

      // Check again
      result = await getUserLicensesWithWidgetCounts(testUser.id);
      license1Result = result.find(l => l.id === testLicense1.id);
      expect(license1Result!.widgetCount).toBe(2);

      // Cleanup
      await cleanupTestWidgets();
    });
  });
});
