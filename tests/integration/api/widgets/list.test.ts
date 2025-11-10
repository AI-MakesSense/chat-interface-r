/**
 * Integration Tests for GET /api/widgets - List Widgets (Paginated)
 *
 * RED Phase: These tests will FAIL because app/api/widgets/route.ts GET handler doesn't exist yet
 *
 * Endpoint: GET /api/widgets
 * Authentication: Required (JWT in auth_token cookie)
 * Query Params: { licenseId?: string, includeDeleted?: boolean, page?: number, limit?: number }
 *
 * Test Coverage:
 * - Success scenarios: Empty list, all widgets, filtered by license, pagination
 * - Deleted widget filtering: Exclude by default, include when requested
 * - Pagination: Page/limit parameters, metadata
 * - Authentication: Missing JWT
 * - Authorization: License ownership verification
 * - Ordering: Newest first (createdAt DESC)
 *
 * Total Tests: 15
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { GET } from '@/app/api/widgets/route';
import { signJWT } from '@/lib/auth/jwt';
import { db } from '@/lib/db/client';
import { users, licenses, widgets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createDefaultConfig } from '@/lib/config/defaults';
import { generateLicenseKey } from '@/lib/license/generate';

describe.sequential('GET /api/widgets - Integration Tests', () => {
  let testUser: any;
  let otherUser: any;
  let license1: any;
  let license2: any;
  let otherUserLicense: any;
  let authToken: string;
  let otherUserToken: string;
  let testRunId: string;

  beforeAll(async () => {
    testRunId = `widget-list-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Create test users
    [testUser] = await db.insert(users).values({
      email: `list-test-user-${testRunId}@example.com`,
      passwordHash: 'hash',
      name: 'List Test User',
    }).returning();

    [otherUser] = await db.insert(users).values({
      email: `list-other-user-${testRunId}@example.com`,
      passwordHash: 'hash',
      name: 'Other User',
    }).returning();

    // Create licenses
    [license1] = await db.insert(licenses).values({
      userId: testUser.id,
      licenseKey: generateLicenseKey(),
      tier: 'pro',
      domains: ['license1.com'],
      domainLimit: 1,
      widgetLimit: 3,
      brandingEnabled: false,
      status: 'active',
    }).returning();

    [license2] = await db.insert(licenses).values({
      userId: testUser.id,
      licenseKey: generateLicenseKey(),
      tier: 'agency',
      domains: ['license2.com'],
      domainLimit: -1,
      widgetLimit: -1,
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
    // License 1: 2 active widgets
    await db.insert(widgets).values([
      {
        licenseId: license1.id,
        name: 'Widget 1 Active',
        status: 'active',
        config: createDefaultConfig('pro'),
        version: 1,
      },
      {
        licenseId: license1.id,
        name: 'Widget 2 Active',
        status: 'active',
        config: createDefaultConfig('pro'),
        version: 1,
      },
    ]);

    // License 2: 1 active, 1 deleted
    await db.insert(widgets).values([
      {
        licenseId: license2.id,
        name: 'Widget 3 Active',
        status: 'active',
        config: createDefaultConfig('agency'),
        version: 1,
      },
      {
        licenseId: license2.id,
        name: 'Widget 4 Deleted',
        status: 'deleted',
        config: createDefaultConfig('agency'),
        version: 1,
      },
    ]);

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
  // SUCCESS SCENARIOS - BASIC LISTING
  // =========================================================================

  it('should return empty array for user with no widgets', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${otherUserToken}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widgets).toEqual([]);
    expect(data.pagination.total).toBe(0);
  });

  it('should return all user widgets across multiple licenses', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widgets).toBeDefined();
    expect(data.widgets.length).toBe(3); // 2 from license1 + 1 active from license2
    expect(data.widgets.every((w: any) => w.status === 'active')).toBe(true);
  });

  it('should include license info with each widget', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widgets[0].license).toBeDefined();
    expect(data.widgets[0].license.id).toBeDefined();
    expect(data.widgets[0].license.tier).toBeDefined();
    expect(data.widgets[0].license.domains).toBeDefined();
  });

  it('should order widgets by createdAt DESC (newest first)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    const timestamps = data.widgets.map((w: any) => new Date(w.createdAt).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i - 1]).toBeGreaterThanOrEqual(timestamps[i]);
    }
  });

  // =========================================================================
  // LICENSE FILTERING
  // =========================================================================

  it('should filter widgets by licenseId when provided', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets?licenseId=${license1.id}`, {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widgets.length).toBe(2);
    expect(data.widgets.every((w: any) => w.licenseId === license1.id)).toBe(true);
  });

  it('should reject licenseId filter for license owned by different user (403)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets?licenseId=${license1.id}`, {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${otherUserToken}`, // Different user
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  // =========================================================================
  // DELETED WIDGET HANDLING
  // =========================================================================

  it('should exclude deleted widgets by default', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widgets.every((w: any) => w.status !== 'deleted')).toBe(true);
    expect(data.widgets.length).toBe(3); // Deleted widget from license2 not included
  });

  it('should include deleted widgets when includeDeleted=true', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets?includeDeleted=true', {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widgets.length).toBe(4); // Now includes deleted widget
    const deletedWidgets = data.widgets.filter((w: any) => w.status === 'deleted');
    expect(deletedWidgets.length).toBe(1);
    expect(deletedWidgets[0].name).toBe('Widget 4 Deleted');
  });

  // =========================================================================
  // PAGINATION
  // =========================================================================

  it('should paginate results correctly (page 1, default limit 20)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets?page=1&limit=20', {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widgets.length).toBeLessThanOrEqual(20);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(20);
    expect(data.pagination.total).toBe(3);
    expect(data.pagination.totalPages).toBe(1);
  });

  it('should respect custom limit parameter', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets?page=1&limit=2', {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widgets.length).toBe(2);
    expect(data.pagination.limit).toBe(2);
    expect(data.pagination.total).toBe(3);
    expect(data.pagination.totalPages).toBe(2);
  });

  it('should return correct page 2 results', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets?page=2&limit=2', {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widgets.length).toBe(1); // Only 1 widget on page 2
    expect(data.pagination.page).toBe(2);
  });

  it('should return correct pagination metadata', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets?page=1&limit=10', {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 3,
      totalPages: 1,
    });
  });

  // =========================================================================
  // AUTHENTICATION FAILURES
  // =========================================================================

  it('should reject request without authentication (401)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'GET',
      headers: {},
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  it('should handle invalid page parameter gracefully (default to page 1)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets?page=invalid', {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.page).toBe(1);
  });

  it('should handle page beyond total pages (return empty array)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets?page=999&limit=10', {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widgets).toEqual([]);
    expect(data.pagination.page).toBe(999);
    expect(data.pagination.total).toBe(3);
  });
});
