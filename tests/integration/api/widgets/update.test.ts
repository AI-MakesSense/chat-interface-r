/**
 * Integration Tests for PATCH /api/widgets/[id] - Update Widget
 *
 * RED Phase: These tests will FAIL because app/api/widgets/[id]/route.ts PATCH handler doesn't exist yet
 *
 * Endpoint: PATCH /api/widgets/[id]
 * Authentication: Required (JWT in auth_token cookie)
 * Path Param: id (widget UUID)
 * Request Body: { name?: string, config?: Partial<WidgetConfig>, status?: 'active' | 'paused' }
 *
 * Test Coverage:
 * - Success scenarios: Update name, config, status, multiple fields
 * - Version management: Increment on config change, not on name/status
 * - Config merging: Deep merge partial configs
 * - Authentication: Missing JWT
 * - Authorization: Widget ownership
 * - Validation: Name length, invalid status, invalid config
 * - Edge cases: Empty update, deleted status rejection
 *
 * Total Tests: 18
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PATCH } from '@/app/api/widgets/[id]/route';
import { signJWT } from '@/lib/auth/jwt';
import { db } from '@/lib/db/client';
import { users, licenses, widgets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createDefaultConfig } from '@/lib/config/defaults';
import { generateLicenseKey } from '@/lib/license/generate';

describe.sequential('PATCH /api/widgets/[id] - Integration Tests', () => {
  let testUser: any;
  let otherUser: any;
  let testLicense: any;
  let otherUserLicense: any;
  let testWidget: any;
  let otherUserWidget: any;
  let authToken: string;
  let otherUserToken: string;
  let testRunId: string;

  beforeAll(async () => {
    testRunId = `widget-update-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Create test users
    [testUser] = await db.insert(users).values({
      email: `update-test-user-${testRunId}@example.com`,
      passwordHash: 'hash',
      name: 'Update Test User',
    }).returning();

    [otherUser] = await db.insert(users).values({
      email: `update-other-user-${testRunId}@example.com`,
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
      name: 'Original Widget Name',
      status: 'active',
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

  afterAll(async () => {
    // Cleanup
    await db.delete(licenses).where(eq(licenses.userId, testUser.id));
    await db.delete(licenses).where(eq(licenses.userId, otherUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
    await db.delete(users).where(eq(users.id, otherUser.id));
  });

  // =========================================================================
  // SUCCESS SCENARIOS - INDIVIDUAL FIELD UPDATES
  // =========================================================================

  it('should update widget name successfully', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        name: 'Updated Widget Name',
      }),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widget.name).toBe('Updated Widget Name');
    expect(data.widget.version).toBe(1); // Version NOT incremented for name change
  });

  it('should update widget config with partial merge', async () => {
    // RED: Route doesn't exist yet
    const partialConfig = {
      branding: {
        companyName: 'Updated Company',
        welcomeText: 'Updated Welcome',
      },
    };

    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        config: partialConfig,
      }),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widget.config.branding.companyName).toBe('Updated Company');
    expect(data.widget.config.branding.welcomeText).toBe('Updated Welcome');
    // Verify other branding fields preserved
    expect(data.widget.config.branding.logoUrl).toBeDefined();
    expect(data.widget.config.branding.firstMessage).toBeDefined();
    // Verify other config sections preserved
    expect(data.widget.config.theme).toBeDefined();
    expect(data.widget.config.behavior).toBeDefined();
  });

  it('should update widget status to paused', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        status: 'paused',
      }),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widget.status).toBe('paused');
    expect(data.widget.version).toBe(2); // Version from previous config update
  });

  it('should update widget status to active', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        status: 'active',
      }),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widget.status).toBe('active');
  });

  it('should update multiple fields at once (name + config + status)', async () => {
    // RED: Route doesn't exist yet
    const updates = {
      name: 'Multi-Update Widget',
      config: {
        theme: {
          colors: {
            primary: '#00FF00',
          },
        },
      },
      status: 'paused',
    };

    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify(updates),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widget.name).toBe('Multi-Update Widget');
    expect(data.widget.config.theme.colors.primary).toBe('#00FF00');
    expect(data.widget.status).toBe('paused');
  });

  // =========================================================================
  // VERSION MANAGEMENT
  // =========================================================================

  it('should increment version when config changes', async () => {
    // RED: Route doesn't exist yet
    // Get current version first
    const [currentWidget] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, testWidget.id))
      .limit(1);

    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        config: {
          branding: {
            companyName: 'Version Test Company',
          },
        },
      }),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widget.version).toBe(currentWidget.version + 1);
  });

  it('should NOT increment version when only name changes', async () => {
    // RED: Route doesn't exist yet
    const [currentWidget] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, testWidget.id))
      .limit(1);

    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        name: 'Name Only Change',
      }),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widget.version).toBe(currentWidget.version); // No increment
  });

  it('should NOT increment version when only status changes', async () => {
    // RED: Route doesn't exist yet
    const [currentWidget] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, testWidget.id))
      .limit(1);

    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        status: 'active',
      }),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widget.version).toBe(currentWidget.version); // No increment
  });

  // =========================================================================
  // DEEP CONFIG MERGING
  // =========================================================================

  it('should deep merge config preserving non-updated nested fields', async () => {
    // RED: Route doesn't exist yet
    // First, get the current config
    const [currentWidget] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, testWidget.id))
      .limit(1);

    const originalPrimaryColor = currentWidget.config.theme.colors.primary;

    // Update only secondary color
    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        config: {
          theme: {
            colors: {
              secondary: '#FF00FF',
            },
          },
        },
      }),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widget.config.theme.colors.secondary).toBe('#FF00FF');
    // Primary color should be preserved
    expect(data.widget.config.theme.colors.primary).toBe(originalPrimaryColor);
    // All other colors should be preserved
    expect(data.widget.config.theme.colors.background).toBeDefined();
  });

  // =========================================================================
  // TIMESTAMP UPDATES
  // =========================================================================

  it('should update updatedAt timestamp', async () => {
    // RED: Route doesn't exist yet
    const [beforeUpdate] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, testWidget.id))
      .limit(1);

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        name: 'Timestamp Update Test',
      }),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(new Date(data.widget.updatedAt).getTime()).toBeGreaterThan(
      new Date(beforeUpdate.updatedAt).getTime()
    );
  });

  it('should NOT change createdAt or id', async () => {
    // RED: Route doesn't exist yet
    const [beforeUpdate] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, testWidget.id))
      .limit(1);

    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        name: 'Immutable Fields Test',
      }),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widget.id).toBe(beforeUpdate.id);
    expect(data.widget.createdAt).toBe(beforeUpdate.createdAt.toISOString());
  });

  // =========================================================================
  // AUTHENTICATION FAILURES
  // =========================================================================

  it('should reject request without authentication (401)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Unauthorized Update',
      }),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });

  // =========================================================================
  // AUTHORIZATION FAILURES
  // =========================================================================

  it('should reject widget owned by different user (403)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${otherUserToken}`,
      },
      body: JSON.stringify({
        name: 'Unauthorized Update Attempt',
      }),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  // =========================================================================
  // VALIDATION FAILURES
  // =========================================================================

  it('should reject invalid widget ID (404)', async () => {
    // RED: Route doesn't exist yet
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const request = new Request(`http://localhost:3000/api/widgets/${nonExistentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        name: 'Update Non-Existent',
      }),
    });

    const response = await PATCH(request, { params: { id: nonExistentId } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBeDefined();
  });

  it('should reject empty widget name (400)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        name: '',
      }),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should reject widget name > 100 characters (400)', async () => {
    // RED: Route doesn't exist yet
    const longName = 'a'.repeat(101);
    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        name: longName,
      }),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should reject invalid status value (400)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        status: 'invalid-status',
      }),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should reject status=deleted (use DELETE endpoint instead) - 400', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        status: 'deleted',
      }),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('DELETE');
  });

  it('should reject invalid config structure (400)', async () => {
    // RED: Route doesn't exist yet
    const invalidConfig = {
      branding: {
        companyName: 12345, // Should be string
      },
    };

    const request = new Request(`http://localhost:3000/api/widgets/${testWidget.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        config: invalidConfig,
      }),
    });

    const response = await PATCH(request, { params: { id: testWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
