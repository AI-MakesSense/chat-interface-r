/**
 * Unit Tests for License-Related Widget Query Functions
 *
 * Tests for Phase 3 Module 2 Day 2: License-Related Widget Queries
 *
 * RED Phase: These tests will FAIL because:
 * - Query functions don't exist yet (import errors or runtime errors)
 * - Functions: getWidgetsByLicenseId, getWidgetsByUserId, getActiveWidgetCount, getLicenseWithWidgetCount
 *
 * Test Coverage:
 * A. getWidgetsByLicenseId Tests (7 tests)
 * B. getWidgetsByUserId Tests (9 tests)
 * C. getActiveWidgetCount Tests (6 tests)
 * D. getLicenseWithWidgetCount Tests (6 tests)
 *
 * Total: 28 comprehensive RED tests
 *
 * Expected Failure:
 * ❌ Functions not implemented yet in @/lib/db/queries
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db/client';
import { users, licenses, widgets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createDefaultConfig } from '@/lib/config/defaults';
import { generateLicenseKey } from '@/lib/license/generate';
import type { User, License, Widget } from '@/lib/db/schema';

// RED: These imports will fail because functions don't exist yet
import {
  getWidgetsByLicenseId,
  getWidgetsByUserId,
  getActiveWidgetCount,
  getLicenseWithWidgetCount,
} from '@/lib/db/queries';

describe.sequential('License-Related Widget Database Queries - Unit Tests', () => {
  // Test data storage
  let testRunId: string;
  let testUser1: User;
  let testUser2: User;
  let testLicense1: License; // Basic tier, belongs to testUser1
  let testLicense2: License; // Pro tier, belongs to testUser1
  let testLicense3: License; // Basic tier, belongs to testUser2 (for cross-user isolation)

  beforeAll(async () => {
    // Generate unique test run ID to prevent conflicts
    testRunId = `day2-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Create test user 1
    [testUser1] = await db.insert(users).values({
      email: `day2-user1-${testRunId}@example.com`,
      passwordHash: 'hash',
      name: 'Test User 1',
    }).returning();

    // Create test user 2 (for cross-user isolation tests)
    [testUser2] = await db.insert(users).values({
      email: `day2-user2-${testRunId}@example.com`,
      passwordHash: 'hash',
      name: 'Test User 2',
    }).returning();

    // Create test license 1 (Basic tier, user 1)
    [testLicense1] = await db.insert(licenses).values({
      userId: testUser1.id,
      licenseKey: generateLicenseKey(),
      tier: 'basic',
      domains: ['license1.example.com'],
      domainLimit: 1,
      widgetLimit: 1,
      brandingEnabled: true,
      status: 'active',
    }).returning();

    // Create test license 2 (Pro tier, user 1)
    [testLicense2] = await db.insert(licenses).values({
      userId: testUser1.id,
      licenseKey: generateLicenseKey(),
      tier: 'pro',
      domains: ['license2.example.com'],
      domainLimit: 1,
      widgetLimit: 3,
      brandingEnabled: false,
      status: 'active',
    }).returning();

    // Create test license 3 (Basic tier, user 2)
    [testLicense3] = await db.insert(licenses).values({
      userId: testUser2.id,
      licenseKey: generateLicenseKey(),
      tier: 'basic',
      domains: ['license3.example.com'],
      domainLimit: 1,
      widgetLimit: 1,
      brandingEnabled: true,
      status: 'active',
    }).returning();
  });

  afterAll(async () => {
    // Cleanup (CASCADE will handle widgets automatically)
    await db.delete(licenses).where(eq(licenses.userId, testUser1.id));
    await db.delete(licenses).where(eq(licenses.userId, testUser2.id));
    await db.delete(users).where(eq(users.id, testUser1.id));
    await db.delete(users).where(eq(users.id, testUser2.id));
  });

  // ==========================================================================
  // A. getWidgetsByLicenseId Tests (7 tests)
  // ==========================================================================

  describe('getWidgetsByLicenseId', () => {
    it('should return empty array for license with no widgets', async () => {
      // RED: Function not implemented yet

      const result = await getWidgetsByLicenseId(testLicense1.id);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should return all active widgets for a license', async () => {
      // RED: Function not implemented yet

      // Create test widgets
      const config = createDefaultConfig('basic');
      const [widget1] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Widget 1',
        status: 'active',
        config,
      }).returning();

      const [widget2] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Widget 2',
        status: 'active',
        config,
      }).returning();

      const result = await getWidgetsByLicenseId(testLicense1.id);

      expect(result).toHaveLength(2);
      expect(result.map(w => w.id).sort()).toEqual([widget1.id, widget2.id].sort());
      expect(result.every(w => w.status === 'active')).toBe(true);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
    });

    it('should exclude deleted widgets by default', async () => {
      // RED: Function not implemented yet

      // Create active and deleted widgets
      const config = createDefaultConfig('basic');
      const [activeWidget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Active Widget',
        status: 'active',
        config,
      }).returning();

      const [deletedWidget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Deleted Widget',
        status: 'deleted',
        config,
      }).returning();

      const result = await getWidgetsByLicenseId(testLicense1.id);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(activeWidget.id);
      expect(result[0].status).toBe('active');
      expect(result.find(w => w.id === deletedWidget.id)).toBeUndefined();

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
    });

    it('should include deleted widgets when includeDeleted=true', async () => {
      // RED: Function not implemented yet

      // Create active, paused, and deleted widgets
      const config = createDefaultConfig('basic');
      const [activeWidget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Active Widget',
        status: 'active',
        config,
      }).returning();

      const [pausedWidget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Paused Widget',
        status: 'paused',
        config,
      }).returning();

      const [deletedWidget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Deleted Widget',
        status: 'deleted',
        config,
      }).returning();

      const result = await getWidgetsByLicenseId(testLicense1.id, true);

      expect(result).toHaveLength(3);
      const ids = result.map(w => w.id).sort();
      expect(ids).toEqual([activeWidget.id, pausedWidget.id, deletedWidget.id].sort());
      expect(result.find(w => w.status === 'deleted')).toBeDefined();

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
    });

    it('should return widgets in correct order (newest first)', async () => {
      // RED: Function not implemented yet

      // Create widgets with slight delays to ensure different timestamps
      const config = createDefaultConfig('basic');

      const [widget1] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Widget 1 (oldest)',
        status: 'active',
        config,
      }).returning();

      await new Promise(resolve => setTimeout(resolve, 10));

      const [widget2] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Widget 2 (middle)',
        status: 'active',
        config,
      }).returning();

      await new Promise(resolve => setTimeout(resolve, 10));

      const [widget3] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Widget 3 (newest)',
        status: 'active',
        config,
      }).returning();

      const result = await getWidgetsByLicenseId(testLicense1.id);

      expect(result).toHaveLength(3);
      // Newest first (DESC order)
      expect(result[0].id).toBe(widget3.id);
      expect(result[1].id).toBe(widget2.id);
      expect(result[2].id).toBe(widget1.id);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
    });

    it('should only return widgets for specified license', async () => {
      // RED: Function not implemented yet

      // Create widgets for multiple licenses
      const config = createDefaultConfig('basic');
      const [widget1] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'License 1 Widget',
        status: 'active',
        config,
      }).returning();

      const [widget2] = await db.insert(widgets).values({
        licenseId: testLicense2.id,
        name: 'License 2 Widget',
        status: 'active',
        config,
      }).returning();

      const result = await getWidgetsByLicenseId(testLicense1.id);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(widget1.id);
      expect(result[0].licenseId).toBe(testLicense1.id);
      expect(result.find(w => w.id === widget2.id)).toBeUndefined();

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense2.id));
    });

    it('should include paused widgets in results', async () => {
      // RED: Function not implemented yet

      // Create active and paused widgets
      const config = createDefaultConfig('basic');
      const [activeWidget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Active Widget',
        status: 'active',
        config,
      }).returning();

      const [pausedWidget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Paused Widget',
        status: 'paused',
        config,
      }).returning();

      const result = await getWidgetsByLicenseId(testLicense1.id);

      expect(result).toHaveLength(2);
      expect(result.map(w => w.status).sort()).toEqual(['active', 'paused']);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
    });
  });

  // ==========================================================================
  // B. getWidgetsByUserId Tests (9 tests)
  // ==========================================================================

  describe('getWidgetsByUserId', () => {
    it('should return empty array for user with no widgets', async () => {
      // RED: Function not implemented yet

      const result = await getWidgetsByUserId(testUser1.id);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should return widgets from all user licenses', async () => {
      // RED: Function not implemented yet

      // Create widgets for both licenses of testUser1
      const config = createDefaultConfig('basic');
      const [widget1] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'License 1 Widget',
        status: 'active',
        config,
      }).returning();

      const [widget2] = await db.insert(widgets).values({
        licenseId: testLicense2.id,
        name: 'License 2 Widget',
        status: 'active',
        config,
      }).returning();

      const result = await getWidgetsByUserId(testUser1.id);

      expect(result).toHaveLength(2);
      const widgetIds = result.map(w => w.id).sort();
      expect(widgetIds).toEqual([widget1.id, widget2.id].sort());

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense2.id));
    });

    it('should return widgets with license information attached', async () => {
      // RED: Function not implemented yet

      // Create widget
      const config = createDefaultConfig('basic');
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Test Widget',
        status: 'active',
        config,
      }).returning();

      const result = await getWidgetsByUserId(testUser1.id);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('license');
      expect(result[0].license).toBeDefined();
      expect(result[0].license.id).toBe(testLicense1.id);
      expect(result[0].license.userId).toBe(testUser1.id);
      expect(result[0].license.tier).toBe('basic');

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should exclude widgets from other users licenses', async () => {
      // RED: Function not implemented yet

      // Create widgets for both users
      const config = createDefaultConfig('basic');
      const [widget1] = await db.insert(widgets).values({
        licenseId: testLicense1.id, // testUser1's license
        name: 'User 1 Widget',
        status: 'active',
        config,
      }).returning();

      const [widget2] = await db.insert(widgets).values({
        licenseId: testLicense3.id, // testUser2's license
        name: 'User 2 Widget',
        status: 'active',
        config,
      }).returning();

      const result = await getWidgetsByUserId(testUser1.id);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(widget1.id);
      expect(result[0].license.userId).toBe(testUser1.id);
      expect(result.find(w => w.id === widget2.id)).toBeUndefined();

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense3.id));
    });

    it('should exclude deleted widgets by default', async () => {
      // RED: Function not implemented yet

      // Create active and deleted widgets
      const config = createDefaultConfig('basic');
      const [activeWidget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Active Widget',
        status: 'active',
        config,
      }).returning();

      const [deletedWidget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Deleted Widget',
        status: 'deleted',
        config,
      }).returning();

      const result = await getWidgetsByUserId(testUser1.id);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(activeWidget.id);
      expect(result.find(w => w.id === deletedWidget.id)).toBeUndefined();

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
    });

    it('should include deleted widgets when includeDeleted=true', async () => {
      // RED: Function not implemented yet

      // Create active and deleted widgets
      const config = createDefaultConfig('basic');
      const [activeWidget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Active Widget',
        status: 'active',
        config,
      }).returning();

      const [deletedWidget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Deleted Widget',
        status: 'deleted',
        config,
      }).returning();

      const result = await getWidgetsByUserId(testUser1.id, true);

      expect(result).toHaveLength(2);
      const ids = result.map(w => w.id).sort();
      expect(ids).toEqual([activeWidget.id, deletedWidget.id].sort());
      expect(result.find(w => w.status === 'deleted')).toBeDefined();

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
    });

    it('should filter by licenseId when provided', async () => {
      // RED: Function not implemented yet

      // Create widgets for both licenses
      const config = createDefaultConfig('basic');
      const [widget1] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'License 1 Widget',
        status: 'active',
        config,
      }).returning();

      const [widget2] = await db.insert(widgets).values({
        licenseId: testLicense2.id,
        name: 'License 2 Widget',
        status: 'active',
        config,
      }).returning();

      // Filter to only testLicense1
      const result = await getWidgetsByUserId(testUser1.id, false, testLicense1.id);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(widget1.id);
      expect(result[0].licenseId).toBe(testLicense1.id);
      expect(result.find(w => w.id === widget2.id)).toBeUndefined();

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense2.id));
    });

    it('should return widgets in correct order (newest first)', async () => {
      // RED: Function not implemented yet

      // Create widgets with delays
      const config = createDefaultConfig('basic');

      const [widget1] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Oldest Widget',
        status: 'active',
        config,
      }).returning();

      await new Promise(resolve => setTimeout(resolve, 10));

      const [widget2] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'Newest Widget',
        status: 'active',
        config,
      }).returning();

      const result = await getWidgetsByUserId(testUser1.id);

      expect(result).toHaveLength(2);
      // Newest first (DESC order)
      expect(result[0].id).toBe(widget2.id);
      expect(result[1].id).toBe(widget1.id);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
    });

    it('should handle user with multiple licenses correctly', async () => {
      // RED: Function not implemented yet

      // testUser1 has 2 licenses, create widgets for both
      const config1 = createDefaultConfig('basic');
      const config2 = createDefaultConfig('pro');

      const [widget1] = await db.insert(widgets).values({
        licenseId: testLicense1.id, // Basic license
        name: 'Basic Widget',
        status: 'active',
        config: config1,
      }).returning();

      const [widget2] = await db.insert(widgets).values({
        licenseId: testLicense2.id, // Pro license
        name: 'Pro Widget',
        status: 'active',
        config: config2,
      }).returning();

      const result = await getWidgetsByUserId(testUser1.id);

      expect(result).toHaveLength(2);

      // Verify both widgets returned with correct license info
      const widget1Result = result.find(w => w.id === widget1.id);
      const widget2Result = result.find(w => w.id === widget2.id);

      expect(widget1Result).toBeDefined();
      expect(widget1Result?.license.tier).toBe('basic');

      expect(widget2Result).toBeDefined();
      expect(widget2Result?.license.tier).toBe('pro');

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense2.id));
    });
  });

  // ==========================================================================
  // C. getActiveWidgetCount Tests (6 tests)
  // ==========================================================================

  describe('getActiveWidgetCount', () => {
    it('should return 0 for license with no widgets', async () => {
      // RED: Function not implemented yet

      const count = await getActiveWidgetCount(testLicense1.id);

      expect(count).toBe(0);
      expect(typeof count).toBe('number');
    });

    it('should return correct count of active widgets', async () => {
      // RED: Function not implemented yet

      // Create 3 active widgets
      const config = createDefaultConfig('basic');
      const widgets1 = await db.insert(widgets).values([
        {
          licenseId: testLicense1.id,
          name: 'Widget 1',
          status: 'active',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Widget 2',
          status: 'active',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Widget 3',
          status: 'active',
          config,
        },
      ]).returning();

      const count = await getActiveWidgetCount(testLicense1.id);

      expect(count).toBe(3);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
    });

    it('should exclude soft-deleted widgets from count', async () => {
      // RED: Function not implemented yet

      // Create 2 active and 2 deleted widgets
      const config = createDefaultConfig('basic');
      await db.insert(widgets).values([
        {
          licenseId: testLicense1.id,
          name: 'Active 1',
          status: 'active',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Active 2',
          status: 'active',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Deleted 1',
          status: 'deleted',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Deleted 2',
          status: 'deleted',
          config,
        },
      ]).returning();

      const count = await getActiveWidgetCount(testLicense1.id);

      expect(count).toBe(2); // Only count active widgets

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
    });

    it('should include paused widgets in count', async () => {
      // RED: Function not implemented yet

      // Create active and paused widgets (both should count as non-deleted)
      const config = createDefaultConfig('basic');
      await db.insert(widgets).values([
        {
          licenseId: testLicense1.id,
          name: 'Active Widget',
          status: 'active',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Paused Widget',
          status: 'paused',
          config,
        },
      ]).returning();

      const count = await getActiveWidgetCount(testLicense1.id);

      expect(count).toBe(2); // Both active and paused count

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
    });

    it('should update count correctly after widget deletion', async () => {
      // RED: Function not implemented yet

      // Create 3 active widgets
      const config = createDefaultConfig('basic');
      const [widget1, widget2, widget3] = await db.insert(widgets).values([
        {
          licenseId: testLicense1.id,
          name: 'Widget 1',
          status: 'active',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Widget 2',
          status: 'active',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Widget 3',
          status: 'active',
          config,
        },
      ]).returning();

      const countBefore = await getActiveWidgetCount(testLicense1.id);
      expect(countBefore).toBe(3);

      // Soft-delete one widget
      await db.update(widgets)
        .set({ status: 'deleted' })
        .where(eq(widgets.id, widget1.id));

      const countAfter = await getActiveWidgetCount(testLicense1.id);
      expect(countAfter).toBe(2);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
    });

    it('should handle license with mixed statuses correctly', async () => {
      // RED: Function not implemented yet

      // Create widgets with all statuses
      const config = createDefaultConfig('basic');
      await db.insert(widgets).values([
        {
          licenseId: testLicense1.id,
          name: 'Active 1',
          status: 'active',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Active 2',
          status: 'active',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Paused 1',
          status: 'paused',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Deleted 1',
          status: 'deleted',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Deleted 2',
          status: 'deleted',
          config,
        },
      ]).returning();

      const count = await getActiveWidgetCount(testLicense1.id);

      expect(count).toBe(3); // 2 active + 1 paused (exclude 2 deleted)

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
    });
  });

  // ==========================================================================
  // D. getLicenseWithWidgetCount Tests (6 tests)
  // ==========================================================================

  describe('getLicenseWithWidgetCount', () => {
    it('should return null for non-existent license', async () => {
      // RED: Function not implemented yet

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const result = await getLicenseWithWidgetCount(nonExistentId);

      expect(result).toBeNull();
    });

    it('should return license with widgetCount=0 for new license', async () => {
      // RED: Function not implemented yet

      const result = await getLicenseWithWidgetCount(testLicense1.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(testLicense1.id);
      expect(result).toHaveProperty('widgetCount');
      expect(result?.widgetCount).toBe(0);
    });

    it('should return license with correct widget count', async () => {
      // RED: Function not implemented yet

      // Create 3 active widgets
      const config = createDefaultConfig('basic');
      await db.insert(widgets).values([
        {
          licenseId: testLicense1.id,
          name: 'Widget 1',
          status: 'active',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Widget 2',
          status: 'active',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Widget 3',
          status: 'active',
          config,
        },
      ]).returning();

      const result = await getLicenseWithWidgetCount(testLicense1.id);

      expect(result).not.toBeNull();
      expect(result?.widgetCount).toBe(3);
      expect(result?.id).toBe(testLicense1.id);
      expect(result?.tier).toBe('basic');

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
    });

    it('should exclude deleted widgets from count', async () => {
      // RED: Function not implemented yet

      // Create 2 active and 2 deleted widgets
      const config = createDefaultConfig('basic');
      await db.insert(widgets).values([
        {
          licenseId: testLicense1.id,
          name: 'Active 1',
          status: 'active',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Active 2',
          status: 'active',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Deleted 1',
          status: 'deleted',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Deleted 2',
          status: 'deleted',
          config,
        },
      ]).returning();

      const result = await getLicenseWithWidgetCount(testLicense1.id);

      expect(result).not.toBeNull();
      expect(result?.widgetCount).toBe(2); // Only active widgets

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
    });

    it('should update widgetCount after widget creation', async () => {
      // RED: Function not implemented yet

      const resultBefore = await getLicenseWithWidgetCount(testLicense1.id);
      expect(resultBefore?.widgetCount).toBe(0);

      // Create a widget
      const config = createDefaultConfig('basic');
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense1.id,
        name: 'New Widget',
        status: 'active',
        config,
      }).returning();

      const resultAfter = await getLicenseWithWidgetCount(testLicense1.id);
      expect(resultAfter?.widgetCount).toBe(1);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should update widgetCount after widget deletion', async () => {
      // RED: Function not implemented yet

      // Create 2 widgets
      const config = createDefaultConfig('basic');
      const [widget1, widget2] = await db.insert(widgets).values([
        {
          licenseId: testLicense1.id,
          name: 'Widget 1',
          status: 'active',
          config,
        },
        {
          licenseId: testLicense1.id,
          name: 'Widget 2',
          status: 'active',
          config,
        },
      ]).returning();

      const resultBefore = await getLicenseWithWidgetCount(testLicense1.id);
      expect(resultBefore?.widgetCount).toBe(2);

      // Soft-delete one widget
      await db.update(widgets)
        .set({ status: 'deleted' })
        .where(eq(widgets.id, widget1.id));

      const resultAfter = await getLicenseWithWidgetCount(testLicense1.id);
      expect(resultAfter?.widgetCount).toBe(1);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
    });
  });
});
