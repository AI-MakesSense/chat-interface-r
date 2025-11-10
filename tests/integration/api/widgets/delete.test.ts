/**
 * Integration Tests for DELETE /api/widgets/[id] - Delete Widget
 *
 * RED Phase: These tests will FAIL because DELETE handler doesn't exist yet
 *
 * Endpoint: DELETE /api/widgets/[id]
 * Authentication: Required (JWT in auth_token cookie)
 * Path Param: id (widget UUID)
 * Success Response: 204 No Content
 *
 * Test Coverage:
 * - Success scenarios: Soft delete, timestamp update, idempotency
 * - Authentication failures: Missing JWT
 * - Authorization failures: Ownership verification
 * - Validation failures: Invalid/non-existent ID
 * - Edge cases: Soft delete verification, list exclusion, count exclusion
 *
 * Total Tests: 12
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { DELETE } from '@/app/api/widgets/[id]/route';
import { GET } from '@/app/api/widgets/route'; // For list verification
import { signJWT } from '@/lib/auth/jwt';
import { db } from '@/lib/db/client';
import { users, licenses, widgets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createDefaultConfig } from '@/lib/config/defaults';
import { generateLicenseKey } from '@/lib/license/generate';
import { getActiveWidgetCount } from '@/lib/db/queries';

describe.sequential('DELETE /api/widgets/[id] - Integration Tests', () => {
  // Test fixtures
  let testUser: any;
  let otherUser: any;
  let testLicense: any;
  let otherUserLicense: any;
  let testWidget: any;
  let deletedWidget: any;
  let otherUserWidget: any;
  let authToken: string;
  let otherUserToken: string;
  let testRunId: string;

  beforeAll(async () => {
    testRunId = `widget-delete-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Create test users
    [testUser] = await db.insert(users).values({
      email: `delete-test-user-${testRunId}@example.com`,
      passwordHash: 'hash',
      name: 'Delete Test User',
    }).returning();

    [otherUser] = await db.insert(users).values({
      email: `delete-other-user-${testRunId}@example.com`,
      passwordHash: 'hash',
      name: 'Other User',
    }).returning();

    // Create licenses
    [testLicense] = await db.insert(licenses).values({
      userId: testUser.id,
      licenseKey: generateLicenseKey(),
      tier: 'pro',
      domains: ['test.com'],
      domainLimit: 1,
      widgetLimit: 3,
      brandingEnabled: false,
      status: 'active',
    }).returning();

    [otherUserLicense] = await db.insert(licenses).values({
      userId: otherUser.id,
      licenseKey: generateLicenseKey(),
      tier: 'basic',
      domains: ['other.com'],
      domainLimit: 1,
      widgetLimit: 1,
      brandingEnabled: true,
      status: 'active',
    }).returning();

    // Create test widgets
    [testWidget] = await db.insert(widgets).values({
      licenseId: testLicense.id,
      name: 'Test Widget For Deletion',
      status: 'active',
      config: createDefaultConfig('pro'),
      version: 1,
    }).returning();

    // Create already-deleted widget for idempotency test
    [deletedWidget] = await db.insert(widgets).values({
      licenseId: testLicense.id,
      name: 'Already Deleted Widget',
      status: 'deleted',
      config: createDefaultConfig('pro'),
      version: 1,
    }).returning();

    [otherUserWidget] = await db.insert(widgets).values({
      licenseId: otherUserLicense.id,
      name: 'Other User Widget',
      status: 'active',
      config: createDefaultConfig('basic'),
      version: 1,
    }).returning();

    // Generate auth tokens
    authToken = await signJWT({ sub: testUser.id, email: testUser.email });
    otherUserToken = await signJWT({ sub: otherUser.id, email: otherUser.email });
  });

  afterEach(async () => {
    // Reset testWidget to active state after each test (for idempotency test)
    await db.update(widgets)
      .set({
        status: 'active',
      })
      .where(eq(widgets.id, testWidget.id));
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(licenses).where(eq(licenses.userId, testUser.id));
    await db.delete(licenses).where(eq(licenses.userId, otherUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
    await db.delete(users).where(eq(users.id, otherUser.id));
  });

  // =========================================================================
  // SUCCESS SCENARIOS
  // =========================================================================

  it('should delete widget successfully (204 No Content)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await DELETE(request, { params: { id: testWidget.id } });

    expect(response.status).toBe(204);
    // No response body for 204
    const text = await response.text();
    expect(text).toBe('');

    // Verify widget status changed to 'deleted'
    const [widgetInDb] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, testWidget.id));
    expect(widgetInDb.status).toBe('deleted');
  });

  it('should update updatedAt timestamp on delete', async () => {
    // RED: Route doesn't exist yet
    // Get current timestamp first
    const [beforeDelete] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, testWidget.id))
      .limit(1);

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await DELETE(request, { params: { id: testWidget.id } });
    expect(response.status).toBe(204);

    // Verify updatedAt was updated
    const [afterDelete] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, testWidget.id));
    expect(new Date(afterDelete.updatedAt).getTime()).toBeGreaterThan(
      new Date(beforeDelete.updatedAt).getTime()
    );
  });

  it('should be idempotent (deleting already-deleted widget returns 204)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${deletedWidget.id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await DELETE(request, { params: { id: deletedWidget.id } });

    expect(response.status).toBe(204);

    // Verify status is still deleted
    const [widgetInDb] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, deletedWidget.id));
    expect(widgetInDb.status).toBe('deleted');
  });

  // =========================================================================
  // AUTHENTICATION FAILURES
  // =========================================================================

  it('should reject request without authentication (401)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'DELETE',
      headers: {},
    });

    const response = await DELETE(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();

    // Verify widget was NOT deleted
    const [widgetInDb] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, testWidget.id));
    expect(widgetInDb.status).toBe('active');
  });

  // =========================================================================
  // AUTHORIZATION FAILURES
  // =========================================================================

  it('should reject widget owned by different user (403)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': `auth_token=${otherUserToken}`, // Different user's token
      },
    });

    const response = await DELETE(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();

    // Verify widget was NOT deleted
    const [widgetInDb] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, testWidget.id));
    expect(widgetInDb.status).toBe('active');
  });

  it('should reject widget from another user\'s license (403)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${otherUserWidget.id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': `auth_token=${authToken}`, // testUser trying to delete otherUser's widget
      },
    });

    const response = await DELETE(request, { params: { id: otherUserWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();

    // Verify widget was NOT deleted
    const [widgetInDb] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, otherUserWidget.id));
    expect(widgetInDb.status).toBe('active');
  });

  // =========================================================================
  // VALIDATION FAILURES
  // =========================================================================

  it('should reject invalid widget ID format (400)', async () => {
    // RED: Route doesn't exist yet
    const invalidId = 'not-a-uuid';
    const request = new Request(`http://localhost:3000/api/widgets/${invalidId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await DELETE(request, { params: { id: invalidId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should reject non-existent widget ID (404)', async () => {
    // RED: Route doesn't exist yet
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const request = new Request(`http://localhost:3000/api/widgets/${nonExistentId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await DELETE(request, { params: { id: nonExistentId } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBeDefined();
  });

  // =========================================================================
  // EDGE CASES - SOFT DELETE VERIFICATION
  // =========================================================================

  it('should NOT actually delete from database (soft delete)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await DELETE(request, { params: { id: testWidget.id } });
    expect(response.status).toBe(204);

    // Verify widget still exists in database
    const [widgetInDb] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, testWidget.id));
    expect(widgetInDb).toBeDefined();
    expect(widgetInDb.id).toBe(testWidget.id);
    expect(widgetInDb.name).toBe('Test Widget For Deletion');
    expect(widgetInDb.status).toBe('deleted');
    // All other fields should be preserved
    expect(widgetInDb.config).toBeDefined();
    expect(widgetInDb.version).toBe(1);
  });

  it('should exclude deleted widget from GET /api/widgets list', async () => {
    // RED: Route doesn't exist yet
    // First, delete the widget
    const deleteRequest = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });
    const deleteResponse = await DELETE(deleteRequest, { params: { id: testWidget.id } });
    expect(deleteResponse.status).toBe(204);

    // Then, verify it doesn't appear in list
    const listRequest = new Request('http://localhost:3000/api/widgets', {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });
    const listResponse = await GET(listRequest);
    const data = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(data.widgets.every((w: any) => w.id !== testWidget.id)).toBe(true);
    expect(data.widgets.every((w: any) => w.status === 'active')).toBe(true);
  });

  it('should exclude deleted widget from active widget count', async () => {
    // RED: Route doesn't exist yet
    // Get count before delete
    const countBefore = await getActiveWidgetCount(testLicense.id);

    // Delete the widget
    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });
    const response = await DELETE(request, { params: { id: testWidget.id } });
    expect(response.status).toBe(204);

    // Get count after delete
    const countAfter = await getActiveWidgetCount(testLicense.id);

    // Count should decrease by 1
    expect(countAfter).toBe(countBefore - 1);
  });

  // =========================================================================
  // EDGE CASES - IMMUTABLE FIELDS
  // =========================================================================

  it('should NOT change other widget fields (name, config, version, etc.)', async () => {
    // RED: Route doesn't exist yet
    const [beforeDelete] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, testWidget.id))
      .limit(1);

    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await DELETE(request, { params: { id: testWidget.id } });
    expect(response.status).toBe(204);

    const [afterDelete] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, testWidget.id));

    // Verify only status and updatedAt changed
    expect(afterDelete.id).toBe(beforeDelete.id);
    expect(afterDelete.licenseId).toBe(beforeDelete.licenseId);
    expect(afterDelete.name).toBe(beforeDelete.name);
    expect(afterDelete.version).toBe(beforeDelete.version);
    expect(JSON.stringify(afterDelete.config)).toBe(JSON.stringify(beforeDelete.config));
    expect(afterDelete.createdAt.toISOString()).toBe(beforeDelete.createdAt.toISOString());
    // Only these should change:
    expect(afterDelete.status).toBe('deleted');
    expect(afterDelete.status).not.toBe(beforeDelete.status);
  });
});
