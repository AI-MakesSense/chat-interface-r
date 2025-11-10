/**
 * Integration Tests for POST /api/widgets - Create Widget
 *
 * RED Phase: These tests will FAIL because app/api/widgets/route.ts doesn't exist yet
 *
 * Endpoint: POST /api/widgets
 * Authentication: Required (JWT in auth_token cookie)
 * Request Body: { licenseId: string, name: string, config?: Partial<WidgetConfig> }
 *
 * Test Coverage:
 * - Success scenarios: Create with/without config, all tiers, widget limits
 * - Authentication failures: Missing JWT
 * - Validation failures: Invalid licenseId, name validation
 * - Authorization failures: License ownership
 * - Business logic: Widget limits by tier (Basic: 1, Pro: 3, Agency: unlimited)
 *
 * Total Tests: 20
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { POST } from '@/app/api/widgets/route';
import { signJWT } from '@/lib/auth/jwt';
import { db } from '@/lib/db/client';
import { users, licenses, widgets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createDefaultConfig } from '@/lib/config/defaults';
import { generateLicenseKey } from '@/lib/license/generate';

describe.sequential('POST /api/widgets - Integration Tests', () => {
  let testUser: any;
  let otherUser: any;
  let basicLicense: any;
  let proLicense: any;
  let agencyLicense: any;
  let authToken: string;
  let otherUserToken: string;
  let testRunId: string;

  beforeAll(async () => {
    testRunId = `widget-create-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Create test user
    [testUser] = await db.insert(users).values({
      email: `widget-test-user-${testRunId}@example.com`,
      passwordHash: 'hash',
      name: 'Widget Test User',
    }).returning();

    // Create other user (for authorization tests)
    [otherUser] = await db.insert(users).values({
      email: `other-user-${testRunId}@example.com`,
      passwordHash: 'hash',
      name: 'Other User',
    }).returning();

    // Create licenses for each tier
    [basicLicense] = await db.insert(licenses).values({
      userId: testUser.id,
      licenseKey: generateLicenseKey(),
      tier: 'basic',
      domains: ['basic.com'],
      domainLimit: 1,
      widgetLimit: 1,
      brandingEnabled: true,
      status: 'active',
    }).returning();

    [proLicense] = await db.insert(licenses).values({
      userId: testUser.id,
      licenseKey: generateLicenseKey(),
      tier: 'pro',
      domains: ['pro.com'],
      domainLimit: 1,
      widgetLimit: 3,
      brandingEnabled: false,
      status: 'active',
    }).returning();

    [agencyLicense] = await db.insert(licenses).values({
      userId: testUser.id,
      licenseKey: generateLicenseKey(),
      tier: 'agency',
      domains: ['agency1.com', 'agency2.com'],
      domainLimit: -1,
      widgetLimit: -1, // unlimited
      brandingEnabled: false,
      status: 'active',
    }).returning();

    // Generate auth tokens
    authToken = await signJWT({ sub: testUser.id, email: testUser.email });
    otherUserToken = await signJWT({ sub: otherUser.id, email: otherUser.email });
  });

  afterEach(async () => {
    // Clean up widgets after each test to prevent isolation issues
    await db.delete(widgets).where(eq(widgets.licenseId, basicLicense.id));
    await db.delete(widgets).where(eq(widgets.licenseId, proLicense.id));
    await db.delete(widgets).where(eq(widgets.licenseId, agencyLicense.id));
  });

  afterAll(async () => {
    // Cleanup (cascade deletes widgets)
    await db.delete(licenses).where(eq(licenses.userId, testUser.id));
    await db.delete(licenses).where(eq(licenses.userId, otherUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
    await db.delete(users).where(eq(users.id, otherUser.id));
  });

  // =========================================================================
  // SUCCESS SCENARIOS
  // =========================================================================

  it('should create widget with default config when config not provided', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        licenseId: basicLicense.id,
        name: 'Test Widget Default Config',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.widget).toBeDefined();
    expect(data.widget.name).toBe('Test Widget Default Config');
    expect(data.widget.licenseId).toBe(basicLicense.id);
    expect(data.widget.status).toBe('active');
    expect(data.widget.version).toBe(1);
    expect(data.widget.deployedAt).toBeNull();
    expect(data.widget.config).toEqual(createDefaultConfig('basic'));
  });

  it('should create widget with custom config merged with defaults', async () => {
    // RED: Route doesn't exist yet
    const customConfig = {
      branding: {
        companyName: 'Custom Company',
        welcomeText: 'Custom welcome!',
      },
      theme: {
        colors: {
          primary: '#FF0000',
        },
      },
    };

    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        licenseId: proLicense.id,
        name: 'Custom Config Widget',
        config: customConfig,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.widget.config.branding.companyName).toBe('Custom Company');
    expect(data.widget.config.branding.welcomeText).toBe('Custom welcome!');
    expect(data.widget.config.theme.colors.primary).toBe('#FF0000');
    // Verify defaults were merged in
    expect(data.widget.config.connection.webhookUrl).toBe('');
    expect(data.widget.config.behavior).toBeDefined();
  });

  it('should create widget for Basic tier (limit 1)', async () => {
    // RED: Route doesn't exist yet
    // Clean up any existing widgets from previous tests
    await db.delete(widgets).where(eq(widgets.licenseId, basicLicense.id));

    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        licenseId: basicLicense.id,
        name: 'Basic Widget',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.widget.licenseId).toBe(basicLicense.id);
    expect(data.widget.config.branding.brandingEnabled).toBe(true);
  });

  it('should create widget for Pro tier (limit 3)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        licenseId: proLicense.id,
        name: 'Pro Widget 1',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.widget.licenseId).toBe(proLicense.id);
    expect(data.widget.config.branding.brandingEnabled).toBe(false);
  });

  it('should create multiple widgets for Pro tier up to limit', async () => {
    // RED: Route doesn't exist yet
    // Create widgets 2 and 3
    for (let i = 2; i <= 3; i++) {
      const request = new Request('http://localhost:3000/api/widgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth_token=${authToken}`,
        },
        body: JSON.stringify({
          licenseId: proLicense.id,
          name: `Pro Widget ${i}`,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    }
  });

  it('should create widget for Agency tier (unlimited)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        licenseId: agencyLicense.id,
        name: 'Agency Widget 1',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });

  it('should create unlimited widgets for Agency tier (test with 10+)', async () => {
    // RED: Route doesn't exist yet
    // Create 10 more widgets to test unlimited
    for (let i = 2; i <= 11; i++) {
      const request = new Request('http://localhost:3000/api/widgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth_token=${authToken}`,
        },
        body: JSON.stringify({
          licenseId: agencyLicense.id,
          name: `Agency Widget ${i}`,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    }
  });

  it('should set correct defaults: status=active, version=1, deployedAt=null', async () => {
    // RED: Route doesn't exist yet
    // Clean up first
    await db.delete(widgets).where(eq(widgets.licenseId, basicLicense.id));

    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        licenseId: basicLicense.id,
        name: 'Defaults Test Widget',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.widget.status).toBe('active');
    expect(data.widget.version).toBe(1);
    expect(data.widget.deployedAt).toBeNull();
    expect(data.widget.createdAt).toBeDefined();
    expect(data.widget.updatedAt).toBeDefined();
  });

  // =========================================================================
  // AUTHENTICATION FAILURES
  // =========================================================================

  it('should reject request without authentication (401)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No auth cookie
      },
      body: JSON.stringify({
        licenseId: basicLicense.id,
        name: 'Unauthorized Widget',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });

  // =========================================================================
  // VALIDATION FAILURES
  // =========================================================================

  it('should reject invalid licenseId format (400)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        licenseId: 'not-a-uuid',
        name: 'Invalid License Widget',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should reject non-existent licenseId (404)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        licenseId: '00000000-0000-0000-0000-000000000000',
        name: 'Non-existent License Widget',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBeDefined();
  });

  it('should reject empty widget name (400)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        licenseId: basicLicense.id,
        name: '',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should reject widget name > 100 characters (400)', async () => {
    // RED: Route doesn't exist yet
    const longName = 'a'.repeat(101);
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        licenseId: basicLicense.id,
        name: longName,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should reject invalid config structure (400)', async () => {
    // RED: Route doesn't exist yet
    const invalidConfig = {
      branding: {
        companyName: 123, // Should be string
      },
    };

    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        licenseId: proLicense.id,
        name: 'Invalid Config Widget',
        config: invalidConfig,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  // =========================================================================
  // AUTHORIZATION FAILURES
  // =========================================================================

  it('should reject license owned by different user (403)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${otherUserToken}`, // Different user's token
      },
      body: JSON.stringify({
        licenseId: basicLicense.id, // Belongs to testUser
        name: 'Unauthorized License Widget',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  // =========================================================================
  // WIDGET LIMIT ENFORCEMENT
  // =========================================================================

  it('should reject when Basic tier limit exceeded (already has 1) - 403', async () => {
    // RED: Route doesn't exist yet
    // Create 1 widget to reach Basic tier limit (widgetLimit: 1)
    await db.insert(widgets).values({
      licenseId: basicLicense.id,
      name: 'First Widget',
      config: createDefaultConfig('basic'),
      status: 'active',
      version: 1,
    });

    // Now attempt to create a second widget (should fail with 403)
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        licenseId: basicLicense.id,
        name: 'Over Limit Widget',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('limit');
  });

  it('should reject when Pro tier limit exceeded (already has 3) - 403', async () => {
    // RED: Route doesn't exist yet
    // Create 3 widgets to reach Pro tier limit (widgetLimit: 3)
    await db.insert(widgets).values([
      {
        licenseId: proLicense.id,
        name: 'Pro Widget 1',
        config: createDefaultConfig('pro'),
        status: 'active',
        version: 1,
      },
      {
        licenseId: proLicense.id,
        name: 'Pro Widget 2',
        config: createDefaultConfig('pro'),
        status: 'active',
        version: 1,
      },
      {
        licenseId: proLicense.id,
        name: 'Pro Widget 3',
        config: createDefaultConfig('pro'),
        status: 'active',
        version: 1,
      },
    ]);

    // Now attempt to create a 4th widget (should fail with 403)
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        licenseId: proLicense.id,
        name: 'Over Pro Limit Widget',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('limit');
  });

  // =========================================================================
  // CONFIG MERGING VERIFICATION
  // =========================================================================

  it('should properly merge partial config with defaults', async () => {
    // RED: Route doesn't exist yet
    // Clean up agency widgets first to avoid confusion
    await db.delete(widgets).where(eq(widgets.licenseId, agencyLicense.id));

    const partialConfig = {
      branding: {
        companyName: 'Partial Test',
      },
      // Other sections omitted - should be filled with defaults
    };

    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        licenseId: agencyLicense.id,
        name: 'Merge Test Widget',
        config: partialConfig,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.widget.config.branding.companyName).toBe('Partial Test');
    // Verify unspecified fields have defaults
    expect(data.widget.config.theme).toBeDefined();
    expect(data.widget.config.behavior).toBeDefined();
    expect(data.widget.config.connection).toBeDefined();
    expect(data.widget.config.features).toBeDefined();
  });

  it('should create widget with id, createdAt, and updatedAt timestamps', async () => {
    // RED: Route doesn't exist yet
    const request = new Request('http://localhost:3000/api/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        licenseId: agencyLicense.id,
        name: 'Timestamp Test Widget',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.widget.id).toBeDefined();
    expect(data.widget.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/); // UUID format
    expect(data.widget.createdAt).toBeDefined();
    expect(data.widget.updatedAt).toBeDefined();
    expect(new Date(data.widget.createdAt).getTime()).toBeLessThanOrEqual(Date.now());
  });
});
