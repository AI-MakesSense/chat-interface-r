/**
 * Integration Tests for Schema v2.0 - License Simplification
 *
 * Tests that verify the actual database schema changes work correctly:
 * - User subscription fields persist correctly
 * - Widget new fields (widgetKey, embedType, userId, allowedDomains) work
 * - Relationships between users and widgets function properly
 * - Migration from license-based to user-based widgets
 *
 * These tests require a database connection and will create/delete test data.
 *
 * Total: 30 tests
 */

import { db } from '@/lib/db/client';
import { users, licenses, widgets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Generate a widget key (16-char alphanumeric)
 */
function generateWidgetKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  const bytes = randomBytes(16);
  for (let i = 0; i < 16; i++) {
    key += chars[bytes[i] % chars.length];
  }
  return key;
}

/**
 * Generate a license key (32-char hex)
 */
function generateLicenseKey(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Create a minimal valid widget config
 */
function createMinimalConfig() {
  return {
    branding: { companyName: 'Test' },
    connection: { webhookUrl: 'https://example.com/webhook' },
  };
}

// =============================================================================
// Test Suite
// =============================================================================

describe.sequential('Schema v2.0 Integration Tests', () => {
  const testRunId = Math.random().toString(36).substring(7);
  let testUser: any;
  let testLicense: any;

  beforeAll(async () => {
    // Create test user with subscription fields
    [testUser] = await db.insert(users).values({
      email: `schema-v2-test-${testRunId}@example.com`,
      passwordHash: 'test-hash',
      name: 'Schema V2 Test User',
      tier: 'pro',
      subscriptionStatus: 'active',
    }).returning();

    // Create legacy license for backward compatibility tests
    [testLicense] = await db.insert(licenses).values({
      userId: testUser.id,
      licenseKey: generateLicenseKey(),
      tier: 'pro',
      domains: ['example.com'],
      domainLimit: 1,
      widgetLimit: 3,
      brandingEnabled: false,
      status: 'active',
    }).returning();
  });

  afterAll(async () => {
    // Cleanup - CASCADE will handle widgets
    if (testLicense) {
      await db.delete(licenses).where(eq(licenses.id, testLicense.id));
    }
    if (testUser) {
      await db.delete(users).where(eq(users.id, testUser.id));
    }
  });

  // ==========================================================================
  // A. User Subscription Fields Tests (8 tests)
  // ==========================================================================

  describe('User Subscription Fields', () => {
    it('should create user with tier field', async () => {
      const [user] = await db.insert(users).values({
        email: `tier-test-${testRunId}@example.com`,
        passwordHash: 'test-hash',
        tier: 'agency',
      }).returning();

      expect(user.tier).toBe('agency');

      // Cleanup
      await db.delete(users).where(eq(users.id, user.id));
    });

    it('should default tier to "free" when not specified', async () => {
      const [user] = await db.insert(users).values({
        email: `default-tier-${testRunId}@example.com`,
        passwordHash: 'test-hash',
      }).returning();

      expect(user.tier).toBe('free');

      // Cleanup
      await db.delete(users).where(eq(users.id, user.id));
    });

    it('should store stripeCustomerId', async () => {
      const stripeId = 'cus_test123456789';
      const [user] = await db.insert(users).values({
        email: `stripe-test-${testRunId}@example.com`,
        passwordHash: 'test-hash',
        stripeCustomerId: stripeId,
      }).returning();

      expect(user.stripeCustomerId).toBe(stripeId);

      // Cleanup
      await db.delete(users).where(eq(users.id, user.id));
    });

    it('should store stripeSubscriptionId', async () => {
      const subId = 'sub_test123456789';
      const [user] = await db.insert(users).values({
        email: `sub-test-${testRunId}@example.com`,
        passwordHash: 'test-hash',
        stripeSubscriptionId: subId,
      }).returning();

      expect(user.stripeSubscriptionId).toBe(subId);

      // Cleanup
      await db.delete(users).where(eq(users.id, user.id));
    });

    it('should default subscriptionStatus to "active"', async () => {
      const [user] = await db.insert(users).values({
        email: `status-default-${testRunId}@example.com`,
        passwordHash: 'test-hash',
      }).returning();

      expect(user.subscriptionStatus).toBe('active');

      // Cleanup
      await db.delete(users).where(eq(users.id, user.id));
    });

    it('should store currentPeriodEnd timestamp', async () => {
      const periodEnd = new Date('2025-12-31');
      const [user] = await db.insert(users).values({
        email: `period-test-${testRunId}@example.com`,
        passwordHash: 'test-hash',
        currentPeriodEnd: periodEnd,
      }).returning();

      expect(user.currentPeriodEnd).toBeInstanceOf(Date);
      expect(user.currentPeriodEnd?.toISOString().slice(0, 10)).toBe('2025-12-31');

      // Cleanup
      await db.delete(users).where(eq(users.id, user.id));
    });

    it('should update tier from free to pro', async () => {
      const [user] = await db.insert(users).values({
        email: `upgrade-test-${testRunId}@example.com`,
        passwordHash: 'test-hash',
        tier: 'free',
      }).returning();

      const [updated] = await db.update(users)
        .set({ tier: 'pro' })
        .where(eq(users.id, user.id))
        .returning();

      expect(updated.tier).toBe('pro');

      // Cleanup
      await db.delete(users).where(eq(users.id, user.id));
    });

    it('should allow null for optional stripe fields', async () => {
      const [user] = await db.insert(users).values({
        email: `null-stripe-${testRunId}@example.com`,
        passwordHash: 'test-hash',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      }).returning();

      expect(user.stripeCustomerId).toBeNull();
      expect(user.stripeSubscriptionId).toBeNull();

      // Cleanup
      await db.delete(users).where(eq(users.id, user.id));
    });
  });

  // ==========================================================================
  // B. Widget Key Tests (7 tests)
  // ==========================================================================

  describe('Widget Key Field', () => {
    it('should create widget with widgetKey', async () => {
      const widgetKey = generateWidgetKey();
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        userId: testUser.id,
        widgetKey,
        name: 'Widget Key Test',
        config: createMinimalConfig(),
      }).returning();

      expect(widget.widgetKey).toBe(widgetKey);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should enforce unique widgetKey constraint', async () => {
      const widgetKey = generateWidgetKey();

      // Create first widget
      const [widget1] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        userId: testUser.id,
        widgetKey,
        name: 'Unique Key Test 1',
        config: createMinimalConfig(),
      }).returning();

      // Try to create second widget with same key - should fail
      await expect(
        db.insert(widgets).values({
          licenseId: testLicense.id,
          userId: testUser.id,
          widgetKey, // Same key!
          name: 'Unique Key Test 2',
          config: createMinimalConfig(),
        })
      ).rejects.toThrow();

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget1.id));
    });

    it('should allow null widgetKey (for legacy widgets)', async () => {
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Null Key Test',
        widgetKey: null,
        config: createMinimalConfig(),
      }).returning();

      expect(widget.widgetKey).toBeNull();

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should find widget by widgetKey', async () => {
      const widgetKey = generateWidgetKey();
      await db.insert(widgets).values({
        licenseId: testLicense.id,
        userId: testUser.id,
        widgetKey,
        name: 'Find By Key Test',
        config: createMinimalConfig(),
      });

      const [found] = await db.select()
        .from(widgets)
        .where(eq(widgets.widgetKey, widgetKey));

      expect(found).toBeDefined();
      expect(found.widgetKey).toBe(widgetKey);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.widgetKey, widgetKey));
    });

    it('should handle 16-character key correctly', async () => {
      const widgetKey = 'AbCdEfGh12345678'; // Exactly 16 chars
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        userId: testUser.id,
        widgetKey,
        name: '16 Char Key Test',
        config: createMinimalConfig(),
      }).returning();

      expect(widget.widgetKey?.length).toBe(16);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should reject key longer than 16 characters', async () => {
      const longKey = 'ThisKeyIsTooLong!'; // 17 chars

      await expect(
        db.insert(widgets).values({
          licenseId: testLicense.id,
          userId: testUser.id,
          widgetKey: longKey,
          name: 'Long Key Test',
          config: createMinimalConfig(),
        })
      ).rejects.toThrow();
    });

    it('should use widgetKey index for fast lookups', async () => {
      // Create multiple widgets
      const keys: string[] = [];
      for (let i = 0; i < 5; i++) {
        const key = generateWidgetKey();
        keys.push(key);
        await db.insert(widgets).values({
          licenseId: testLicense.id,
          userId: testUser.id,
          widgetKey: key,
          name: `Index Test ${i}`,
          config: createMinimalConfig(),
        });
      }

      // Query should use index
      const startTime = Date.now();
      const [found] = await db.select()
        .from(widgets)
        .where(eq(widgets.widgetKey, keys[2]));
      const queryTime = Date.now() - startTime;

      expect(found).toBeDefined();
      expect(queryTime).toBeLessThan(100); // Should be fast with index

      // Cleanup
      for (const key of keys) {
        await db.delete(widgets).where(eq(widgets.widgetKey, key));
      }
    });
  });

  // ==========================================================================
  // C. Embed Type Tests (6 tests)
  // ==========================================================================

  describe('Embed Type Field', () => {
    it('should default embedType to "popup"', async () => {
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Default Embed Test',
        config: createMinimalConfig(),
      }).returning();

      expect(widget.embedType).toBe('popup');

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should accept "inline" embed type', async () => {
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        userId: testUser.id,
        widgetKey: generateWidgetKey(),
        name: 'Inline Embed Test',
        embedType: 'inline',
        config: createMinimalConfig(),
      }).returning();

      expect(widget.embedType).toBe('inline');

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should accept "fullpage" embed type', async () => {
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        userId: testUser.id,
        widgetKey: generateWidgetKey(),
        name: 'Fullpage Embed Test',
        embedType: 'fullpage',
        config: createMinimalConfig(),
      }).returning();

      expect(widget.embedType).toBe('fullpage');

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should accept "portal" embed type', async () => {
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        userId: testUser.id,
        widgetKey: generateWidgetKey(),
        name: 'Portal Embed Test',
        embedType: 'portal',
        config: createMinimalConfig(),
      }).returning();

      expect(widget.embedType).toBe('portal');

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should query widgets by embedType', async () => {
      // Create widgets with different embed types
      const [popup] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        userId: testUser.id,
        widgetKey: generateWidgetKey(),
        name: 'Query Popup',
        embedType: 'popup',
        config: createMinimalConfig(),
      }).returning();

      const [inline] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        userId: testUser.id,
        widgetKey: generateWidgetKey(),
        name: 'Query Inline',
        embedType: 'inline',
        config: createMinimalConfig(),
      }).returning();

      // Query only popup widgets
      const popups = await db.select()
        .from(widgets)
        .where(and(
          eq(widgets.userId, testUser.id),
          eq(widgets.embedType, 'popup')
        ));

      expect(popups.some(w => w.id === popup.id)).toBe(true);
      expect(popups.some(w => w.id === inline.id)).toBe(false);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, popup.id));
      await db.delete(widgets).where(eq(widgets.id, inline.id));
    });

    it('should update embedType', async () => {
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        userId: testUser.id,
        widgetKey: generateWidgetKey(),
        name: 'Update Embed Test',
        embedType: 'popup',
        config: createMinimalConfig(),
      }).returning();

      expect(widget.embedType).toBe('popup');

      const [updated] = await db.update(widgets)
        .set({ embedType: 'fullpage' })
        .where(eq(widgets.id, widget.id))
        .returning();

      expect(updated.embedType).toBe('fullpage');

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });
  });

  // ==========================================================================
  // D. User-Widget Relationship Tests (5 tests)
  // ==========================================================================

  describe('User-Widget Direct Relationship', () => {
    it('should create widget with userId', async () => {
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        userId: testUser.id,
        widgetKey: generateWidgetKey(),
        name: 'User ID Test',
        config: createMinimalConfig(),
      }).returning();

      expect(widget.userId).toBe(testUser.id);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should allow null userId (for legacy widgets)', async () => {
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        userId: null,
        name: 'Null User Test',
        config: createMinimalConfig(),
      }).returning();

      expect(widget.userId).toBeNull();

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should find all widgets for a user', async () => {
      // Create multiple widgets for test user
      const widgetIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const [widget] = await db.insert(widgets).values({
          licenseId: testLicense.id,
          userId: testUser.id,
          widgetKey: generateWidgetKey(),
          name: `User Widgets ${i}`,
          config: createMinimalConfig(),
        }).returning();
        widgetIds.push(widget.id);
      }

      // Query widgets by userId
      const userWidgets = await db.select()
        .from(widgets)
        .where(eq(widgets.userId, testUser.id));

      expect(userWidgets.length).toBeGreaterThanOrEqual(3);

      // Cleanup
      for (const id of widgetIds) {
        await db.delete(widgets).where(eq(widgets.id, id));
      }
    });

    it('should cascade delete widgets when user is deleted', async () => {
      // Create a temporary user
      const [tempUser] = await db.insert(users).values({
        email: `cascade-test-${testRunId}@example.com`,
        passwordHash: 'test-hash',
      }).returning();

      // Create a license for the temp user
      const [tempLicense] = await db.insert(licenses).values({
        userId: tempUser.id,
        licenseKey: generateLicenseKey(),
        tier: 'basic',
        domains: [],
        domainLimit: 1,
        widgetLimit: 1,
        brandingEnabled: true,
        status: 'active',
      }).returning();

      // Create widget linked to temp user
      const [widget] = await db.insert(widgets).values({
        licenseId: tempLicense.id,
        userId: tempUser.id,
        widgetKey: generateWidgetKey(),
        name: 'Cascade Test Widget',
        config: createMinimalConfig(),
      }).returning();

      const widgetId = widget.id;

      // Delete the user (should cascade)
      await db.delete(users).where(eq(users.id, tempUser.id));

      // Widget should be deleted
      const [foundWidget] = await db.select()
        .from(widgets)
        .where(eq(widgets.id, widgetId));

      expect(foundWidget).toBeUndefined();
    });

    it('should support both userId and licenseId during migration', async () => {
      // Widget with both relationships (migration period)
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        userId: testUser.id,
        widgetKey: generateWidgetKey(),
        name: 'Dual Relationship Test',
        config: createMinimalConfig(),
      }).returning();

      expect(widget.licenseId).toBe(testLicense.id);
      expect(widget.userId).toBe(testUser.id);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });
  });

  // ==========================================================================
  // E. Allowed Domains Tests (4 tests)
  // ==========================================================================

  describe('Allowed Domains Field', () => {
    it('should store array of domains', async () => {
      const domains = ['example.com', 'test.example.com'];
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        userId: testUser.id,
        widgetKey: generateWidgetKey(),
        name: 'Domains Test',
        allowedDomains: domains,
        config: createMinimalConfig(),
      }).returning();

      expect(widget.allowedDomains).toEqual(domains);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should allow null for unlimited domains', async () => {
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        userId: testUser.id,
        widgetKey: generateWidgetKey(),
        name: 'Null Domains Test',
        allowedDomains: null,
        config: createMinimalConfig(),
      }).returning();

      expect(widget.allowedDomains).toBeNull();

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should allow empty array', async () => {
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        userId: testUser.id,
        widgetKey: generateWidgetKey(),
        name: 'Empty Domains Test',
        allowedDomains: [],
        config: createMinimalConfig(),
      }).returning();

      expect(widget.allowedDomains).toEqual([]);

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });

    it('should support wildcard domains', async () => {
      const domains = ['*.example.com', 'localhost'];
      const [widget] = await db.insert(widgets).values({
        licenseId: testLicense.id,
        userId: testUser.id,
        widgetKey: generateWidgetKey(),
        name: 'Wildcard Domains Test',
        allowedDomains: domains,
        config: createMinimalConfig(),
      }).returning();

      expect(widget.allowedDomains).toContain('*.example.com');

      // Cleanup
      await db.delete(widgets).where(eq(widgets.id, widget.id));
    });
  });
});
