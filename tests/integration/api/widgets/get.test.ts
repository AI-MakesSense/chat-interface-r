/**
 * Integration Tests for GET /api/widgets/[id] - Get Single Widget
 *
 * RED Phase: These tests will FAIL because app/api/widgets/[id]/route.ts doesn't exist yet
 *
 * Endpoint: GET /api/widgets/[id]
 * Authentication: Required (JWT in auth_token cookie)
 * Path Param: id (widget UUID)
 *
 * Test Coverage:
 * - Success scenarios: Get widget with full config, license info, deleted widget
 * - Authentication: Missing JWT
 * - Validation: Invalid UUID format
 * - Not found: Non-existent widget ID
 * - Authorization: Widget owned by different user
 *
 * Total Tests: 10
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GET } from '@/app/api/widgets/[id]/route';
import { signJWT } from '@/lib/auth/jwt';
import { db } from '@/lib/db/client';
import { users, licenses, widgets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createDefaultConfig } from '@/lib/config/defaults';
import { generateLicenseKey } from '@/lib/license/generate';

describe.sequential('GET /api/widgets/[id] - Integration Tests', () => {
  let testUser: any;
  let otherUser: any;
  let testLicense: any;
  let otherUserLicense: any;
  let activeWidget: any;
  let deletedWidget: any;
  let otherUserWidget: any;
  let authToken: string;
  let otherUserToken: string;
  let testRunId: string;

  beforeAll(async () => {
    testRunId = `widget-get-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Create test users
    [testUser] = await db.insert(users).values({
      email: `get-test-user-${testRunId}@example.com`,
      passwordHash: 'hash',
      name: 'Get Test User',
    }).returning();

    [otherUser] = await db.insert(users).values({
      email: `get-other-user-${testRunId}@example.com`,
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
    [activeWidget] = await db.insert(widgets).values({
      licenseId: testLicense.id,
      name: 'Active Test Widget',
      status: 'active',
      config: createDefaultConfig('pro'),
      version: 1,
    }).returning();

    [deletedWidget] = await db.insert(widgets).values({
      licenseId: testLicense.id,
      name: 'Deleted Test Widget',
      status: 'deleted',
      config: createDefaultConfig('pro'),
      version: 2,
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

  it('should return widget with full config for owner', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${activeWidget.id}`, {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    // Mock route params
    const response = await GET(request, { params: { id: activeWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widget).toBeDefined();
    expect(data.widget.id).toBe(activeWidget.id);
    expect(data.widget.name).toBe('Active Test Widget');
    expect(data.widget.status).toBe('active');
    expect(data.widget.version).toBe(1);
    expect(data.widget.config).toBeDefined();
    expect(data.widget.config.branding).toBeDefined();
    expect(data.widget.config.theme).toBeDefined();
    expect(data.widget.config.behavior).toBeDefined();
  });

  it('should return widget with license info attached', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${activeWidget.id}`, {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request, { params: { id: activeWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widget.license).toBeDefined();
    expect(data.widget.license.id).toBe(testLicense.id);
    expect(data.widget.license.tier).toBe('pro');
    expect(data.widget.license.domains).toEqual(['test.com']);
    expect(data.widget.license.widgetLimit).toBe(3);
  });

  it('should return deleted widget (owner can view)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${deletedWidget.id}`, {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request, { params: { id: deletedWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widget.id).toBe(deletedWidget.id);
    expect(data.widget.status).toBe('deleted');
    expect(data.widget.name).toBe('Deleted Test Widget');
  });

  it('should include all widget fields in response', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${activeWidget.id}`, {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request, { params: { id: activeWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widget).toHaveProperty('id');
    expect(data.widget).toHaveProperty('licenseId');
    expect(data.widget).toHaveProperty('name');
    expect(data.widget).toHaveProperty('status');
    expect(data.widget).toHaveProperty('config');
    expect(data.widget).toHaveProperty('version');
    expect(data.widget).toHaveProperty('deployedAt');
    expect(data.widget).toHaveProperty('createdAt');
    expect(data.widget).toHaveProperty('updatedAt');
  });

  // =========================================================================
  // AUTHENTICATION FAILURES
  // =========================================================================

  it('should reject request without authentication (401)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${activeWidget.id}`, {
      method: 'GET',
      headers: {},
    });

    const response = await GET(request, { params: { id: activeWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });

  // =========================================================================
  // VALIDATION FAILURES
  // =========================================================================

  it('should reject invalid widget ID format (400)', async () => {
    // RED: Route doesn't exist yet
    const invalidId = 'not-a-uuid';
    const request = new Request(`http://localhost:3000/api/widgets/${invalidId}`, {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request, { params: { id: invalidId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  // =========================================================================
  // NOT FOUND
  // =========================================================================

  it('should return 404 for non-existent widget ID', async () => {
    // RED: Route doesn't exist yet
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const request = new Request(`http://localhost:3000/api/widgets/${nonExistentId}`, {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request, { params: { id: nonExistentId } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBeDefined();
  });

  // =========================================================================
  // AUTHORIZATION FAILURES
  // =========================================================================

  it('should reject widget owned by different user (403)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${activeWidget.id}`, {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${otherUserToken}`, // Different user's token
      },
    });

    const response = await GET(request, { params: { id: activeWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  it('should handle empty widget ID gracefully (400)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets/', {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request, { params: { id: '' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should verify widget config structure is complete', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${activeWidget.id}`, {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request, { params: { id: activeWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    // Verify all config sections are present
    expect(data.widget.config).toHaveProperty('branding');
    expect(data.widget.config).toHaveProperty('theme');
    expect(data.widget.config).toHaveProperty('advancedStyling');
    expect(data.widget.config).toHaveProperty('behavior');
    expect(data.widget.config).toHaveProperty('connection');
    expect(data.widget.config).toHaveProperty('features');
  });
});
