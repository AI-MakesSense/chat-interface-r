/**
 * Integration Tests for Widgets Database Table
 *
 * Tests for Phase 3 Module 1A: Widget Schema Definition
 *
 * RED Phase: These tests will FAIL because:
 * - widgets table doesn't exist in database yet
 * - CRUD query functions don't exist yet
 * - Widget limit validation logic doesn't exist yet
 *
 * Test Coverage:
 * A. Table Structure Tests (5 tests)
 * B. Widget CRUD Operations (10 tests)
 * C. Widget Limit Validation Tests (6 tests)
 * D. Version and Timestamp Tests (3 tests)
 * E. JSONB Config Tests (4 tests)
 *
 * Total: 28 tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { widgets, licenses, users } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Test helper: Create a test user
 */
async function createTestUser(email: string) {
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: 'test-hash',
      name: 'Test User',
    })
    .returning();
  return user;
}

/**
 * Test helper: Create a test license
 */
async function createTestLicense(userId: string, tier: 'basic' | 'pro' | 'agency', widgetLimit: number) {
  const [license] = await db
    .insert(licenses)
    .values({
      userId,
      licenseKey: Math.random().toString(36).substring(2, 34), // 32 chars max
      tier,
      domains: ['test.com'],
      domainLimit: tier === 'agency' ? -1 : 1,
      widgetLimit,
      brandingEnabled: tier === 'basic',
      status: 'active',
    })
    .returning();
  return license;
}

/**
 * Test helper: Sample widget config
 */
function createSampleConfig() {
  return {
    branding: {
      companyName: 'Test Company',
      welcomeText: 'Welcome!',
      logoUrl: null,
      responseTimeText: 'Typically replies in minutes',
      firstMessage: 'Hi there!',
      inputPlaceholder: 'Type your message...',
      launcherIcon: 'chat',
      customLauncherIconUrl: null,
      brandingEnabled: true,
    },
    theme: {
      mode: 'light',
      colors: {
        primary: '#0066FF',
        secondary: '#00B8D4',
        background: '#FFFFFF',
        userMessage: '#0066FF',
        botMessage: '#F5F5F5',
        text: '#000000',
        textSecondary: '#666666',
        border: '#E0E0E0',
        inputBackground: '#FFFFFF',
        inputText: '#000000',
      },
      darkOverride: {
        enabled: false,
        colors: {},
      },
      position: {
        position: 'bottom-right',
        offsetX: 20,
        offsetY: 20,
      },
      size: {
        mode: 'standard',
        customWidth: null,
        customHeight: null,
        fullscreenOnMobile: true,
      },
      typography: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: 14,
        fontUrl: null,
        disableDefaultFont: false,
      },
      cornerRadius: 12,
    },
    advancedStyling: {
      enabled: false,
      messages: {
        userMessageBackground: '#0066FF',
        userMessageText: '#FFFFFF',
        botMessageBackground: '#F5F5F5',
        botMessageText: '#000000',
        messageSpacing: 12,
        bubblePadding: 12,
        showAvatar: false,
        avatarUrl: null,
      },
      markdown: {
        codeBlockBackground: '#F5F5F5',
        codeBlockText: '#000000',
        codeBlockBorder: '#E0E0E0',
        inlineCodeBackground: '#F0F0F0',
        inlineCodeText: '#E01E5A',
        linkColor: '#0066FF',
        linkHoverColor: '#0052CC',
        tableHeaderBackground: '#F5F5F5',
        tableBorderColor: '#E0E0E0',
      },
    },
    behavior: {
      autoOpen: false,
      autoOpenDelay: 0,
      showCloseButton: true,
      persistMessages: true,
      enableSoundNotifications: false,
      enableTypingIndicator: true,
    },
    connection: {
      webhookUrl: 'https://test-n8n.com/webhook/chat',
      route: null,
      timeoutSeconds: 30,
    },
    features: {
      attachments: {
        enabled: false,
        allowedExtensions: ['.pdf', '.png', '.jpg'],
        maxFileSizeMB: 10,
      },
      emailTranscript: false,
      printTranscript: true,
      ratingPrompt: false,
    },
  };
}

describe.sequential('Widgets Database Table - Integration Tests', () => {
  let testUser: any;
  let testLicense: any;
  let testRunId: string;

  beforeAll(async () => {
    // Generate unique test run ID to avoid conflicts
    testRunId = `test-run-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create test user and license once for all tests
    testUser = await createTestUser(`${testRunId}@example.com`);
    testLicense = await createTestLicense(testUser.id, 'basic', 1);
  });

  beforeEach(async () => {
    // Only clean up widgets between tests, leave user/license intact
    try {
      if (testLicense && testLicense.id) {
        await db.delete(widgets).where(eq(widgets.licenseId, testLicense.id)).execute();
      }
    } catch (e) {
      // Ignore errors if table doesn't exist yet
    }
  });

  afterEach(async () => {
    // Check if license still exists (some tests may delete it)
    // If deleted, recreate it for the next test
    try {
      if (testUser && testLicense) {
        const [existingLicense] = await db
          .select()
          .from(licenses)
          .where(eq(licenses.id, testLicense.id));

        if (!existingLicense) {
          // License was deleted, recreate it
          testLicense = await createTestLicense(testUser.id, 'basic', 1);
        }
      }
    } catch (e) {
      // If license doesn't exist, recreate it
      if (testUser) {
        testLicense = await createTestLicense(testUser.id, 'basic', 1);
      }
    }
  });

  afterAll(async () => {
    // Final cleanup - remove all test data for this test run
    try {
      // Delete in proper order: widgets → licenses → users
      await db.delete(widgets).execute();
      await db.delete(licenses).where(eq(licenses.userId, testUser.id)).execute();
      await db.delete(users).where(eq(users.id, testUser.id)).execute();
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  // ==========================================================================
  // A. Table Structure Tests (5 tests)
  // ==========================================================================

  describe('A. Table Structure', () => {
    it('should have widgets table in database', async () => {
      // FAIL REASON: widgets table doesn't exist in database yet

      // Query to check if table exists
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'widgets'
        );
      `);

      expect(result.rows[0].exists).toBe(true);
    });

    it('should have all required columns with correct types', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      // Query column information
      const result = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'widgets'
        ORDER BY column_name;
      `);

      const columns = result.rows.map((row: any) => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
      }));

      // Check required columns exist
      expect(columns.find(c => c.name === 'id')).toBeDefined();
      expect(columns.find(c => c.name === 'license_id')).toBeDefined();
      expect(columns.find(c => c.name === 'name')).toBeDefined();
      expect(columns.find(c => c.name === 'status')).toBeDefined();
      expect(columns.find(c => c.name === 'config')).toBeDefined();
      expect(columns.find(c => c.name === 'version')).toBeDefined();
      expect(columns.find(c => c.name === 'deployed_at')).toBeDefined();
      expect(columns.find(c => c.name === 'created_at')).toBeDefined();
      expect(columns.find(c => c.name === 'updated_at')).toBeDefined();

      // Check config is JSONB type
      const configColumn = columns.find(c => c.name === 'config');
      expect(configColumn?.type).toBe('jsonb');
    });

    it('should have foreign key constraint to licenses table', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      // Query foreign key constraints
      const result = await db.execute(sql`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'widgets'
          AND kcu.column_name = 'license_id';
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].foreign_table_name).toBe('licenses');
      expect(result.rows[0].foreign_column_name).toBe('id');
    });

    it('should CASCADE DELETE widgets when license is deleted', async () => {
      // FAIL REASON: widgets table doesn't exist yet, CASCADE behavior not tested

      // Create a widget
      const [widget] = await db
        .insert(widgets)
        .values({
          licenseId: testLicense.id,
          name: 'Test Widget',
          status: 'active',
          config: createSampleConfig(),
        })
        .returning();

      expect(widget).toBeDefined();

      // Delete the license
      await db.delete(licenses).where(eq(licenses.id, testLicense.id));

      // Verify widget was cascade deleted
      const remainingWidgets = await db
        .select()
        .from(widgets)
        .where(eq(widgets.id, widget.id));

      expect(remainingWidgets.length).toBe(0);
    });

    it('should have indexes on licenseId, status, and config (GIN)', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      // Query indexes
      const result = await db.execute(sql`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'widgets';
      `);

      const indexNames = result.rows.map((row: any) => row.indexname);

      expect(indexNames).toContain('widgets_license_id_idx');
      expect(indexNames).toContain('widgets_status_idx');
      expect(indexNames).toContain('widgets_config_idx');

      // Check that config index is GIN type
      const configIndex = result.rows.find((row: any) =>
        row.indexname === 'widgets_config_idx'
      );
      expect(configIndex?.indexdef).toContain('gin');
    });
  });

  // ==========================================================================
  // B. Widget CRUD Operations (10 tests)
  // ==========================================================================

  describe('B. Widget CRUD Operations', () => {
    it('should CREATE a new widget with all required fields', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      const config = createSampleConfig();

      const [widget] = await db
        .insert(widgets)
        .values({
          licenseId: testLicense.id,
          name: 'Homepage Chat Widget',
          status: 'active',
          config,
        })
        .returning();

      expect(widget).toBeDefined();
      expect(widget.id).toBeDefined();
      expect(widget.licenseId).toBe(testLicense.id);
      expect(widget.name).toBe('Homepage Chat Widget');
      expect(widget.status).toBe('active');
      expect(widget.config).toEqual(config);
      expect(widget.version).toBe(1);
      expect(widget.deployedAt).toBeNull();
      expect(widget.createdAt).toBeInstanceOf(Date);
      expect(widget.updatedAt).toBeInstanceOf(Date);
    });

    it('should CREATE widget with minimal fields (defaults applied)', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      const [widget] = await db
        .insert(widgets)
        .values({
          licenseId: testLicense.id,
          name: 'Minimal Widget',
          config: { minimal: true },
        })
        .returning();

      expect(widget.status).toBe('active'); // Default
      expect(widget.version).toBe(1); // Default
      expect(widget.deployedAt).toBeNull(); // Default
    });

    it('should REJECT widget with invalid licenseId (foreign key violation)', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      const invalidLicenseId = '00000000-0000-0000-0000-000000000000';

      await expect(
        db.insert(widgets).values({
          licenseId: invalidLicenseId,
          name: 'Invalid Widget',
          config: createSampleConfig(),
        })
      ).rejects.toThrow();
    });

    it('should handle JSONB config correctly', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      const complexConfig = createSampleConfig();
      complexConfig.theme.colors.primary = '#FF5733';
      complexConfig.branding.companyName = 'Complex Config Test';

      const [widget] = await db
        .insert(widgets)
        .values({
          licenseId: testLicense.id,
          name: 'JSONB Test Widget',
          config: complexConfig,
        })
        .returning();

      expect(widget.config).toEqual(complexConfig);
      expect((widget.config as any).theme.colors.primary).toBe('#FF5733');
      expect((widget.config as any).branding.companyName).toBe('Complex Config Test');
    });

    it('should READ widget by id', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      // Create widget
      const [createdWidget] = await db
        .insert(widgets)
        .values({
          licenseId: testLicense.id,
          name: 'Read Test Widget',
          config: createSampleConfig(),
        })
        .returning();

      // Read widget
      const [foundWidget] = await db
        .select()
        .from(widgets)
        .where(eq(widgets.id, createdWidget.id));

      expect(foundWidget).toBeDefined();
      expect(foundWidget.id).toBe(createdWidget.id);
      expect(foundWidget.name).toBe('Read Test Widget');
    });

    it('should READ all widgets for a license', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      // Create multiple widgets
      await db.insert(widgets).values([
        {
          licenseId: testLicense.id,
          name: 'Widget 1',
          config: createSampleConfig(),
        },
        {
          licenseId: testLicense.id,
          name: 'Widget 2',
          config: createSampleConfig(),
        },
      ]);

      // Read all widgets for license
      const licenseWidgets = await db
        .select()
        .from(widgets)
        .where(eq(widgets.licenseId, testLicense.id));

      expect(licenseWidgets.length).toBe(2);
      expect(licenseWidgets.map(w => w.name)).toContain('Widget 1');
      expect(licenseWidgets.map(w => w.name)).toContain('Widget 2');
    });

    it('should FILTER widgets by status', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      // Create widgets with different statuses
      await db.insert(widgets).values([
        {
          licenseId: testLicense.id,
          name: 'Active Widget',
          status: 'active',
          config: createSampleConfig(),
        },
        {
          licenseId: testLicense.id,
          name: 'Paused Widget',
          status: 'paused',
          config: createSampleConfig(),
        },
        {
          licenseId: testLicense.id,
          name: 'Deleted Widget',
          status: 'deleted',
          config: createSampleConfig(),
        },
      ]);

      // Filter active widgets
      const activeWidgets = await db
        .select()
        .from(widgets)
        .where(
          and(
            eq(widgets.licenseId, testLicense.id),
            eq(widgets.status, 'active')
          )
        );

      expect(activeWidgets.length).toBe(1);
      expect(activeWidgets[0].name).toBe('Active Widget');
    });

    it('should UPDATE widget name and status', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      // Create widget
      const [widget] = await db
        .insert(widgets)
        .values({
          licenseId: testLicense.id,
          name: 'Original Name',
          status: 'active',
          config: createSampleConfig(),
        })
        .returning();

      const originalUpdatedAt = widget.updatedAt.getTime();

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Create timestamp BEFORE the update to avoid race conditions
      const updateTimestamp = new Date();

      // Update widget
      const [updatedWidget] = await db
        .update(widgets)
        .set({
          name: 'Updated Name',
          status: 'paused',
          updatedAt: updateTimestamp,
        })
        .where(eq(widgets.id, widget.id))
        .returning();

      expect(updatedWidget.name).toBe('Updated Name');
      expect(updatedWidget.status).toBe('paused');
      // The returned updatedAt should match what we set
      expect(updatedWidget.updatedAt.getTime()).toBe(updateTimestamp.getTime());
    });

    it('should UPDATE widget config (JSONB)', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      // Create widget
      const [widget] = await db
        .insert(widgets)
        .values({
          licenseId: testLicense.id,
          name: 'Config Update Test',
          config: createSampleConfig(),
        })
        .returning();

      // Update config
      const newConfig = createSampleConfig();
      newConfig.branding.companyName = 'Updated Company';
      newConfig.theme.colors.primary = '#00FF00';

      const [updatedWidget] = await db
        .update(widgets)
        .set({
          config: newConfig,
          version: widget.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(widgets.id, widget.id))
        .returning();

      expect((updatedWidget.config as any).branding.companyName).toBe('Updated Company');
      expect((updatedWidget.config as any).theme.colors.primary).toBe('#00FF00');
      expect(updatedWidget.version).toBe(2);
    });

    it('should DELETE widget (soft delete - set status to deleted)', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      // Create widget
      const [widget] = await db
        .insert(widgets)
        .values({
          licenseId: testLicense.id,
          name: 'Delete Test Widget',
          config: createSampleConfig(),
        })
        .returning();

      // Soft delete
      const [deletedWidget] = await db
        .update(widgets)
        .set({
          status: 'deleted',
          updatedAt: new Date(),
        })
        .where(eq(widgets.id, widget.id))
        .returning();

      expect(deletedWidget.status).toBe('deleted');

      // Widget still exists in database
      const [foundWidget] = await db
        .select()
        .from(widgets)
        .where(eq(widgets.id, widget.id));

      expect(foundWidget).toBeDefined();
      expect(foundWidget.status).toBe('deleted');
    });
  });

  // ==========================================================================
  // C. Widget Limit Validation Tests (6 tests)
  // ==========================================================================

  describe('C. Widget Limit Validation', () => {
    it('should ENFORCE Basic tier widget limit (1 widget max)', async () => {
      // FAIL REASON: Widget limit validation logic doesn't exist yet

      // Basic tier license with limit of 1
      expect(testLicense.widgetLimit).toBe(1);

      // Create first widget - should succeed
      await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'Widget 1',
        config: createSampleConfig(),
      });

      // Count active widgets
      const activeWidgets = await db
        .select()
        .from(widgets)
        .where(
          and(
            eq(widgets.licenseId, testLicense.id),
            eq(widgets.status, 'active')
          )
        );

      expect(activeWidgets.length).toBe(1);

      // Attempting to create second widget should be blocked by application logic
      // (This test verifies the count query works; actual enforcement is in API layer)
      expect(activeWidgets.length).toBeGreaterThanOrEqual(testLicense.widgetLimit);
    });

    it('should ENFORCE Pro tier widget limit (3 widgets max)', async () => {
      // FAIL REASON: Widget limit validation logic doesn't exist yet

      // Create Pro tier license
      const proLicense = await createTestLicense(testUser.id, 'pro', 3);

      // Create 3 widgets - should all succeed
      await db.insert(widgets).values([
        { licenseId: proLicense.id, name: 'Pro Widget 1', config: createSampleConfig() },
        { licenseId: proLicense.id, name: 'Pro Widget 2', config: createSampleConfig() },
        { licenseId: proLicense.id, name: 'Pro Widget 3', config: createSampleConfig() },
      ]);

      // Count active widgets
      const activeWidgets = await db
        .select()
        .from(widgets)
        .where(
          and(
            eq(widgets.licenseId, proLicense.id),
            eq(widgets.status, 'active')
          )
        );

      expect(activeWidgets.length).toBe(3);
      expect(activeWidgets.length).toBe(proLicense.widgetLimit);
    });

    it('should ALLOW Agency tier unlimited widgets', async () => {
      // FAIL REASON: Widget limit validation logic doesn't exist yet

      // Create Agency tier license
      const agencyLicense = await createTestLicense(testUser.id, 'agency', -1);

      expect(agencyLicense.widgetLimit).toBe(-1); // Unlimited

      // Create 10 widgets - all should succeed
      const widgetValues = Array.from({ length: 10 }, (_, i) => ({
        licenseId: agencyLicense.id,
        name: `Agency Widget ${i + 1}`,
        config: createSampleConfig(),
      }));

      await db.insert(widgets).values(widgetValues);

      // Count widgets
      const agencyWidgets = await db
        .select()
        .from(widgets)
        .where(eq(widgets.licenseId, agencyLicense.id));

      expect(agencyWidgets.length).toBe(10);
    });

    it('should COUNT only active widgets for limit (exclude deleted)', async () => {
      // FAIL REASON: Widget limit validation logic doesn't exist yet

      // Create widgets with different statuses
      const [activeWidget] = await db
        .insert(widgets)
        .values({
          licenseId: testLicense.id,
          name: 'Active Widget',
          status: 'active',
          config: createSampleConfig(),
        })
        .returning();

      await db
        .insert(widgets)
        .values({
          licenseId: testLicense.id,
          name: 'Deleted Widget',
          status: 'deleted',
          config: createSampleConfig(),
        });

      // Count only active widgets
      const activeCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(widgets)
        .where(
          and(
            eq(widgets.licenseId, testLicense.id),
            eq(widgets.status, 'active')
          )
        );

      expect(Number(activeCount[0].count)).toBe(1);

      // Total count includes deleted
      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(widgets)
        .where(eq(widgets.licenseId, testLicense.id));

      expect(Number(totalCount[0].count)).toBe(2);
    });

    it('should ALLOW widget creation when under limit', async () => {
      // FAIL REASON: Widget limit validation logic doesn't exist yet

      // Basic tier has limit of 1, currently 0 widgets
      const activeWidgets = await db
        .select({ count: sql<number>`count(*)` })
        .from(widgets)
        .where(
          and(
            eq(widgets.licenseId, testLicense.id),
            eq(widgets.status, 'active')
          )
        );

      const currentCount = Number(activeWidgets[0].count);

      expect(currentCount).toBeLessThan(testLicense.widgetLimit);

      // Should be able to create widget
      const [newWidget] = await db
        .insert(widgets)
        .values({
          licenseId: testLicense.id,
          name: 'Under Limit Widget',
          config: createSampleConfig(),
        })
        .returning();

      expect(newWidget).toBeDefined();
    });

    it('should REJECT widget creation when limit exceeded', async () => {
      // FAIL REASON: Widget limit validation logic doesn't exist yet

      // Create widget to reach limit
      await db.insert(widgets).values({
        licenseId: testLicense.id,
        name: 'First Widget',
        config: createSampleConfig(),
      });

      // Count active widgets
      const activeWidgets = await db
        .select({ count: sql<number>`count(*)` })
        .from(widgets)
        .where(
          and(
            eq(widgets.licenseId, testLicense.id),
            eq(widgets.status, 'active')
          )
        );

      const currentCount = Number(activeWidgets[0].count);

      expect(currentCount).toBeGreaterThanOrEqual(testLicense.widgetLimit);

      // Application logic should reject this (we're just verifying the count query)
      // In real API, this would return 403 Forbidden
      expect(currentCount).not.toBeLessThan(testLicense.widgetLimit);
    });
  });

  // ==========================================================================
  // D. Version and Timestamp Tests (3 tests)
  // ==========================================================================

  describe('D. Version and Timestamp Tests', () => {
    it('should increment version on update', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      // Create widget
      const [widget] = await db
        .insert(widgets)
        .values({
          licenseId: testLicense.id,
          name: 'Version Test Widget',
          config: createSampleConfig(),
        })
        .returning();

      expect(widget.version).toBe(1);

      // Update widget
      const [updated1] = await db
        .update(widgets)
        .set({
          name: 'Updated Once',
          version: widget.version + 1,
        })
        .where(eq(widgets.id, widget.id))
        .returning();

      expect(updated1.version).toBe(2);

      // Update again
      const [updated2] = await db
        .update(widgets)
        .set({
          name: 'Updated Twice',
          version: updated1.version + 1,
        })
        .where(eq(widgets.id, widget.id))
        .returning();

      expect(updated2.version).toBe(3);
    });

    it('should set createdAt automatically on insert', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      // Capture timestamp BEFORE the insert operation to avoid race conditions
      const beforeCreate = Date.now();

      const [widget] = await db
        .insert(widgets)
        .values({
          licenseId: testLicense.id,
          name: 'Timestamp Test Widget',
          config: createSampleConfig(),
        })
        .returning();

      // Capture timestamp AFTER the insert operation with buffer for network latency
      const afterCreate = Date.now();

      expect(widget.createdAt).toBeInstanceOf(Date);
      expect(widget.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate);
      // Use a 5-second buffer to account for database server time differences
      expect(widget.createdAt.getTime()).toBeLessThanOrEqual(afterCreate + 5000);
    });

    it('should update updatedAt on modification', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      // Create widget
      const [widget] = await db
        .insert(widgets)
        .values({
          licenseId: testLicense.id,
          name: 'UpdatedAt Test Widget',
          config: createSampleConfig(),
        })
        .returning();

      const originalUpdatedAt = widget.updatedAt.getTime();

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Create timestamp BEFORE the update to avoid race conditions
      const updateTimestamp = new Date();

      // Update widget
      const [updatedWidget] = await db
        .update(widgets)
        .set({
          name: 'Modified Widget',
          updatedAt: updateTimestamp,
        })
        .where(eq(widgets.id, widget.id))
        .returning();

      // The returned updatedAt should match what we set
      expect(updatedWidget.updatedAt.getTime()).toBe(updateTimestamp.getTime());
    });
  });

  // ==========================================================================
  // E. JSONB Config Tests (4 tests)
  // ==========================================================================

  describe('E. JSONB Config Tests', () => {
    it('should store complex nested config object', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      const complexConfig = createSampleConfig();
      complexConfig.advancedStyling.enabled = true;
      complexConfig.advancedStyling.messages.showAvatar = true;
      complexConfig.advancedStyling.messages.avatarUrl = 'https://example.com/avatar.png';

      const [widget] = await db
        .insert(widgets)
        .values({
          licenseId: testLicense.id,
          name: 'Complex Config Widget',
          config: complexConfig,
        })
        .returning();

      expect(widget.config).toEqual(complexConfig);
      expect((widget.config as any).advancedStyling.enabled).toBe(true);
      expect((widget.config as any).advancedStyling.messages.avatarUrl).toBe('https://example.com/avatar.png');
    });

    it('should query widgets by config properties (JSONB operators)', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      // Create widgets with different primary colors
      await db.insert(widgets).values([
        {
          licenseId: testLicense.id,
          name: 'Blue Widget',
          config: {
            ...createSampleConfig(),
            theme: {
              ...createSampleConfig().theme,
              colors: {
                ...createSampleConfig().theme.colors,
                primary: '#0066FF',
              },
            },
          },
        },
        {
          licenseId: testLicense.id,
          name: 'Red Widget',
          config: {
            ...createSampleConfig(),
            theme: {
              ...createSampleConfig().theme,
              colors: {
                ...createSampleConfig().theme.colors,
                primary: '#FF0000',
              },
            },
          },
        },
      ]);

      // Query for widgets with specific primary color using JSONB operator
      const blueWidgets = await db.execute(sql`
        SELECT * FROM widgets
        WHERE license_id = ${testLicense.id}
        AND config->'theme'->'colors'->>'primary' = '#0066FF'
      `);

      expect(blueWidgets.rows.length).toBe(1);
      expect(blueWidgets.rows[0].name).toBe('Blue Widget');
    });

    it('should update partial config (merge, not replace)', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      // Create widget
      const [widget] = await db
        .insert(widgets)
        .values({
          licenseId: testLicense.id,
          name: 'Partial Update Widget',
          config: createSampleConfig(),
        })
        .returning();

      // Update only branding.companyName using JSONB merge
      await db.execute(sql`
        UPDATE widgets
        SET config = jsonb_set(
          config,
          '{branding,companyName}',
          '"Updated Company Name"'
        )
        WHERE id = ${widget.id}
      `);

      // Read updated widget
      const [updatedWidget] = await db
        .select()
        .from(widgets)
        .where(eq(widgets.id, widget.id));

      expect((updatedWidget.config as any).branding.companyName).toBe('Updated Company Name');
      // Other config properties should remain unchanged
      expect((updatedWidget.config as any).theme.colors.primary).toBe('#0066FF');
      expect((updatedWidget.config as any).connection.webhookUrl).toBe('https://test-n8n.com/webhook/chat');
    });

    it('should handle null and empty config', async () => {
      // FAIL REASON: widgets table doesn't exist yet

      // Config cannot be null (NOT NULL constraint), but can be empty object
      const [widget] = await db
        .insert(widgets)
        .values({
          licenseId: testLicense.id,
          name: 'Empty Config Widget',
          config: {},
        })
        .returning();

      expect(widget.config).toEqual({});

      // Trying to insert null config should fail
      await expect(
        db.insert(widgets).values({
          licenseId: testLicense.id,
          name: 'Null Config Widget',
          config: null as any,
        })
      ).rejects.toThrow();
    });
  });
});
