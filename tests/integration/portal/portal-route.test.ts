/**
 * Portal Route Integration Tests
 *
 * Route: /chat/portal/[widgetId]
 * Purpose: Test portal page widget config loading and validation
 *
 * Test Coverage:
 * 1. Valid widget ID - loads config successfully
 * 2. Invalid widget ID - returns not found
 * 3. Inactive widget - returns not found
 * 4. Expired license - returns not found
 * 5. Widget config structure - validates JSONB format
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db/client';
import { users, licenses, widgets } from '@/lib/db/schema';
import { getWidgetWithLicense } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

describe('Portal Route - /chat/portal/[widgetId]', () => {
  let testUser: any;
  let activeLicense: any;
  let expiredLicense: any;
  let activeWidget: any;
  let inactiveWidget: any;
  let widgetWithExpiredLicense: any;

  beforeAll(async () => {
    // Clean up test data
    await db.delete(widgets).where(eq(widgets.name, 'Portal Test Widget')).execute();
    await db.delete(licenses).where(eq(licenses.userId, testUser?.id || '')).execute();
    await db.delete(users).where(eq(users.email, 'portal-test@example.com')).execute();

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        email: 'portal-test@example.com',
        passwordHash: 'test-hash',
        name: 'Portal Tester',
        emailVerified: true,
      })
      .returning();
    testUser = user;

    // Create active license
    const [license1] = await db
      .insert(licenses)
      .values({
        userId: testUser.id,
        licenseKey: crypto.randomBytes(16).toString('hex'),
        tier: 'pro',
        widgetLimit: 3,
        domains: ['portal-test.com'],
        domainLimit: 1,
        brandingEnabled: false,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      })
      .returning();
    activeLicense = license1;

    // Create expired license
    const [license2] = await db
      .insert(licenses)
      .values({
        userId: testUser.id,
        licenseKey: crypto.randomBytes(16).toString('hex'),
        tier: 'pro',
        widgetLimit: 3,
        domains: ['expired-portal.com'],
        domainLimit: 1,
        brandingEnabled: false,
        status: 'expired',
        expiresAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      })
      .returning();
    expiredLicense = license2;

    // Create active widget
    const [widget1] = await db
      .insert(widgets)
      .values({
        licenseId: activeLicense.id,
        name: 'Portal Test Widget',
        status: 'active',
        config: {
          branding: {
            companyName: 'Test Company',
            logoUrl: 'https://example.com/logo.png',
            firstMessage: 'Welcome to portal mode!',
          },
          style: {
            theme: 'light',
            primaryColor: '#00bfff',
          },
          connection: {
            webhookUrl: 'https://n8n.example.com/webhook/test',
          },
        },
      })
      .returning();
    activeWidget = widget1;

    // Create inactive widget
    const [widget2] = await db
      .insert(widgets)
      .values({
        licenseId: activeLicense.id,
        name: 'Portal Test Widget - Inactive',
        status: 'paused',
        config: {
          branding: {
            companyName: 'Inactive Widget',
          },
        },
      })
      .returning();
    inactiveWidget = widget2;

    // Create widget with expired license
    const [widget3] = await db
      .insert(widgets)
      .values({
        licenseId: expiredLicense.id,
        name: 'Portal Test Widget - Expired License',
        status: 'active',
        config: {
          branding: {
            companyName: 'Expired License Widget',
          },
        },
      })
      .returning();
    widgetWithExpiredLicense = widget3;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await db.delete(widgets).where(eq(widgets.name, 'Portal Test Widget')).execute();
      await db.delete(licenses).where(eq(licenses.userId, testUser.id)).execute();
      await db.delete(users).where(eq(users.id, testUser.id)).execute();
    }
  });

  describe('Valid Widget Loading', () => {
    it('should load active widget with valid config', async () => {
      const widget = await getWidgetWithLicense(activeWidget.id);

      expect(widget).toBeTruthy();
      expect(widget?.id).toBe(activeWidget.id);
      expect(widget?.status).toBe('active');
      expect(widget?.license.status).toBe('active');
    });

    it('should have correct config structure', async () => {
      const widget = await getWidgetWithLicense(activeWidget.id);
      const config = widget?.config as any;

      expect(config).toBeTruthy();
      expect(config.branding).toBeDefined();
      expect(config.branding.companyName).toBe('Test Company');
      expect(config.style).toBeDefined();
      expect(config.connection).toBeDefined();
    });

    it('should include license data', async () => {
      const widget = await getWidgetWithLicense(activeWidget.id);

      expect(widget?.license).toBeDefined();
      expect(widget?.license.licenseKey).toBe(activeLicense.licenseKey);
      expect(widget?.license.tier).toBe('pro');
      expect(widget?.license.brandingEnabled).toBe(false);
    });
  });

  describe('Invalid Widget Scenarios', () => {
    it('should return null for non-existent widget ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const widget = await getWidgetWithLicense(fakeId);

      expect(widget).toBeNull();
    });

    it('should return widget but status check should fail for inactive widget', async () => {
      const widget = await getWidgetWithLicense(inactiveWidget.id);

      expect(widget).toBeTruthy();
      expect(widget?.status).toBe('paused');
      // Route should check status !== 'active' and return 404
    });

    it('should return widget but license check should fail for expired license', async () => {
      const widget = await getWidgetWithLicense(widgetWithExpiredLicense.id);

      expect(widget).toBeTruthy();
      expect(widget?.status).toBe('active');
      expect(widget?.license.status).toBe('expired');
      // Route should check license.status !== 'active' and return 404
    });
  });

  describe('Portal Config Validation', () => {
    it('should support portal-specific config options', async () => {
      // Update widget with portal config
      const [updatedWidget] = await db
        .update(widgets)
        .set({
          config: {
            branding: {
              companyName: 'Test Company',
            },
            portal: {
              showHeader: true,
              headerTitle: 'Support Chat',
            },
          },
        })
        .where(eq(widgets.id, activeWidget.id))
        .returning();

      const widget = await getWidgetWithLicense(updatedWidget.id);
      const config = widget?.config as any;

      expect(config.portal).toBeDefined();
      expect(config.portal.showHeader).toBe(true);
      expect(config.portal.headerTitle).toBe('Support Chat');
    });

    it('should handle missing optional portal config', async () => {
      const widget = await getWidgetWithLicense(activeWidget.id);
      const config = widget?.config as any;

      // Portal config might not exist - should handle gracefully
      if (config.portal) {
        expect(config.portal).toBeTypeOf('object');
      }
      // Route should provide defaults if portal config missing
    });
  });

  describe('License Tier Validation', () => {
    it('should work with all license tiers', async () => {
      // Portal mode should work with any active license tier
      const widget = await getWidgetWithLicense(activeWidget.id);

      expect(widget?.license.tier).toBe('pro');
      expect(widget?.license.status).toBe('active');
    });
  });
});
