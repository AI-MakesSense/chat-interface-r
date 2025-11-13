/**
 * Widget Download API Integration Tests
 *
 * Endpoint: GET /api/widgets/[id]/download?type=website|portal
 * Purpose: Test downloadable package generation and delivery
 *
 * Test Coverage:
 * 1. Successful website package download
 * 2. Successful portal package download
 * 3. Default type (website) when not specified
 * 4. Authentication required
 * 5. Ownership verification
 * 6. Invalid widget ID (404)
 * 7. Inactive widget (400)
 * 8. Expired license (400)
 * 9. Invalid package type (400)
 * 10. Zip file structure validation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db/client';
import { users, licenses, widgets } from '@/lib/db/schema';
import { GET } from '@/app/api/widgets/[id]/download/route';
import { eq } from 'drizzle-orm';
import { signJWT } from '@/lib/auth/jwt';
import crypto from 'crypto';
import JSZip from 'jszip';

describe('GET /api/widgets/[id]/download - Download Widget Package', () => {
  let testUser: any;
  let otherUser: any;
  let activeLicense: any;
  let expiredLicense: any;
  let activeWidget: any;
  let inactiveWidget: any;
  let widgetWithExpiredLicense: any;
  let authToken: string;
  let otherUserToken: string;

  beforeAll(async () => {
    // Clean up test data
    await db.delete(widgets).where(eq(widgets.name, 'Download Test Widget')).execute();
    await db.delete(licenses).execute();
    await db.delete(users).where(eq(users.email, 'download-test@example.com')).execute();
    await db.delete(users).where(eq(users.email, 'other-user@example.com')).execute();

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        email: 'download-test@example.com',
        passwordHash: 'test-hash',
        name: 'Download Tester',
        emailVerified: true,
      })
      .returning();
    testUser = user;

    // Create other user (for ownership tests)
    const [other] = await db
      .insert(users)
      .values({
        email: 'other-user@example.com',
        passwordHash: 'test-hash',
        name: 'Other User',
        emailVerified: true,
      })
      .returning();
    otherUser = other;

    // Create active license
    const [license1] = await db
      .insert(licenses)
      .values({
        userId: testUser.id,
        licenseKey: crypto.randomBytes(16).toString('hex'),
        tier: 'pro',
        widgetLimit: 3,
        domains: ['example.com'],
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
        domains: ['expired.com'],
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
        name: 'Download Test Widget',
        status: 'active',
        config: {
          license: activeLicense.licenseKey,
          branding: {
            companyName: 'Test Company',
            logoUrl: 'https://example.com/logo.png',
            firstMessage: 'Welcome!',
          },
          style: {
            primaryColor: '#00bfff',
            theme: 'light',
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
        name: 'Download Test Widget - Inactive',
        status: 'paused',
        config: {
          license: activeLicense.licenseKey,
          branding: { companyName: 'Inactive Widget' },
        },
      })
      .returning();
    inactiveWidget = widget2;

    // Create widget with expired license
    const [widget3] = await db
      .insert(widgets)
      .values({
        licenseId: expiredLicense.id,
        name: 'Download Test Widget - Expired',
        status: 'active',
        config: {
          license: expiredLicense.licenseKey,
          branding: { companyName: 'Expired License Widget' },
        },
      })
      .returning();
    widgetWithExpiredLicense = widget3;

    // Generate auth tokens
    authToken = await signJWT({ sub: testUser.id, email: testUser.email });
    otherUserToken = await signJWT({ sub: otherUser.id, email: otherUser.email });
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await db.delete(widgets).where(eq(widgets.name, 'Download Test Widget')).execute();
      await db.delete(licenses).where(eq(licenses.userId, testUser.id)).execute();
      await db.delete(users).where(eq(users.id, testUser.id)).execute();
    }
    if (otherUser) {
      await db.delete(users).where(eq(users.id, otherUser.id)).execute();
    }
  });

  describe('Successful Downloads', () => {
    it('should download website package successfully', async () => {
      const url = new URL(`http://localhost/api/widgets/${activeWidget.id}/download?type=website`);
      const request = new Request(url, {
        headers: { Cookie: `auth-token=${authToken}` },
      });

      const response = await GET(request, { params: Promise.resolve({ id: activeWidget.id }) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/zip');
      expect(response.headers.get('Content-Disposition')).toContain('download-test-widget-website.zip');
    });

    it('should download portal package successfully', async () => {
      const url = new URL(`http://localhost/api/widgets/${activeWidget.id}/download?type=portal`);
      const request = new Request(url, {
        headers: { Cookie: `auth-token=${authToken}` },
      });

      const response = await GET(request, { params: Promise.resolve({ id: activeWidget.id }) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/zip');
      expect(response.headers.get('Content-Disposition')).toContain('download-test-widget-portal.zip');
    });

    it('should download extension package successfully', async () => {
      const url = new URL(`http://localhost/api/widgets/${activeWidget.id}/download?type=extension`);
      const request = new Request(url, {
        headers: { Cookie: `auth-token=${authToken}` },
      });

      const response = await GET(request, { params: Promise.resolve({ id: activeWidget.id }) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/zip');
      expect(response.headers.get('Content-Disposition')).toContain('download-test-widget-extension.zip');
    });

    it('should default to website package when type not specified', async () => {
      const url = new URL(`http://localhost/api/widgets/${activeWidget.id}/download`);
      const request = new Request(url, {
        headers: { Cookie: `auth-token=${authToken}` },
      });

      const response = await GET(request, { params: Promise.resolve({ id: activeWidget.id }) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Disposition')).toContain('website.zip');
    });

    it('should include proper cache control headers', async () => {
      const url = new URL(`http://localhost/api/widgets/${activeWidget.id}/download`);
      const request = new Request(url, {
        headers: { Cookie: `auth-token=${authToken}` },
      });

      const response = await GET(request, { params: Promise.resolve({ id: activeWidget.id }) });

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication', async () => {
      const url = new URL(`http://localhost/api/widgets/${activeWidget.id}/download`);
      const request = new Request(url);

      const response = await GET(request, { params: Promise.resolve({ id: activeWidget.id }) });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Authentication required');
    });

    it('should verify widget ownership', async () => {
      const url = new URL(`http://localhost/api/widgets/${activeWidget.id}/download`);
      const request = new Request(url, {
        headers: { Cookie: `auth-token=${otherUserToken}` },
      });

      const response = await GET(request, { params: Promise.resolve({ id: activeWidget.id }) });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('do not own');
    });
  });

  describe('Validation Errors', () => {
    it('should return 404 for non-existent widget', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const url = new URL(`http://localhost/api/widgets/${fakeId}/download`);
      const request = new Request(url, {
        headers: { Cookie: `auth-token=${authToken}` },
      });

      const response = await GET(request, { params: Promise.resolve({ id: fakeId }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Widget not found');
    });

    it('should reject inactive widget', async () => {
      const url = new URL(`http://localhost/api/widgets/${inactiveWidget.id}/download`);
      const request = new Request(url, {
        headers: { Cookie: `auth-token=${authToken}` },
      });

      const response = await GET(request, { params: Promise.resolve({ id: inactiveWidget.id }) });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('not active');
    });

    it('should reject widget with expired license', async () => {
      const url = new URL(`http://localhost/api/widgets/${widgetWithExpiredLicense.id}/download`);
      const request = new Request(url, {
        headers: { Cookie: `auth-token=${authToken}` },
      });

      const response = await GET(request, { params: Promise.resolve({ id: widgetWithExpiredLicense.id }) });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('License is not active');
    });

    it('should reject invalid package type', async () => {
      const url = new URL(`http://localhost/api/widgets/${activeWidget.id}/download?type=invalid`);
      const request = new Request(url, {
        headers: { Cookie: `auth-token=${authToken}` },
      });

      const response = await GET(request, { params: Promise.resolve({ id: activeWidget.id }) });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid package type');
    });
  });

  describe('Zip File Structure', () => {
    it('should contain valid zip with correct files for website package', async () => {
      const url = new URL(`http://localhost/api/widgets/${activeWidget.id}/download?type=website`);
      const request = new Request(url, {
        headers: { Cookie: `auth-token=${authToken}` },
      });

      const response = await GET(request, { params: Promise.resolve({ id: activeWidget.id }) });
      const zipBuffer = Buffer.from(await response.arrayBuffer());

      // Verify it's a valid zip
      const zip = await JSZip.loadAsync(zipBuffer);

      // Check files exist
      expect(zip.files['index.html']).toBeDefined();
      expect(zip.files['chat-widget.js']).toBeDefined();
      expect(zip.files['README.md']).toBeDefined();

      // Verify file count
      const fileNames = Object.keys(zip.files).filter(name => !name.endsWith('/'));
      expect(fileNames.length).toBe(3);
    });

    it('should contain valid zip with correct files for portal package', async () => {
      const url = new URL(`http://localhost/api/widgets/${activeWidget.id}/download?type=portal`);
      const request = new Request(url, {
        headers: { Cookie: `auth-token=${authToken}` },
      });

      const response = await GET(request, { params: Promise.resolve({ id: activeWidget.id }) });
      const zipBuffer = Buffer.from(await response.arrayBuffer());

      // Verify it's a valid zip
      const zip = await JSZip.loadAsync(zipBuffer);

      // Check files exist
      expect(zip.files['portal.html']).toBeDefined();
      expect(zip.files['chat-widget.js']).toBeDefined();
      expect(zip.files['README.md']).toBeDefined();

      // Verify file count
      const fileNames = Object.keys(zip.files).filter(name => !name.endsWith('/'));
      expect(fileNames.length).toBe(3);
    });

    it('should contain valid zip with correct files for extension package', async () => {
      const url = new URL(`http://localhost/api/widgets/${activeWidget.id}/download?type=extension`);
      const request = new Request(url, {
        headers: { Cookie: `auth-token=${authToken}` },
      });

      const response = await GET(request, { params: Promise.resolve({ id: activeWidget.id }) });
      const zipBuffer = Buffer.from(await response.arrayBuffer());

      // Verify it's a valid zip
      const zip = await JSZip.loadAsync(zipBuffer);

      // Check extension files exist
      expect(zip.files['manifest.json']).toBeDefined();
      expect(zip.files['sidepanel.html']).toBeDefined();
      expect(zip.files['background.js']).toBeDefined();
      expect(zip.files['chat-widget.js']).toBeDefined();
      expect(zip.files['README.md']).toBeDefined();
      expect(zip.files['icons/icon-16.png']).toBeDefined();
      expect(zip.files['icons/icon-48.png']).toBeDefined();
      expect(zip.files['icons/icon-128.png']).toBeDefined();

      // Verify file count (at least 8 files)
      const fileNames = Object.keys(zip.files).filter(name => !name.endsWith('/'));
      expect(fileNames.length).toBeGreaterThanOrEqual(8);
    });
  });
});
