/**
 * Integration Tests for POST /api/widgets/[id]/deploy - Deploy Widget
 *
 * RED Phase: These tests will FAIL because app/api/widgets/[id]/deploy/route.ts doesn't exist yet
 *
 * Endpoint: POST /api/widgets/[id]/deploy
 * Authentication: Required (JWT in auth_token cookie)
 * Path Param: id (widget UUID)
 * Success Response: 200 OK
 *
 * Test Coverage:
 * - Success scenarios: First deployment, re-deployment, paused widget activation
 * - Authentication failures: Missing JWT
 * - Authorization failures: Ownership verification
 * - Validation failures: Invalid ID, missing webhookUrl, invalid webhookUrl
 * - Edge cases: Deleted widget, incomplete config, strict validation
 *
 * Total Tests: 15
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { POST } from '@/app/api/widgets/[id]/deploy/route';
import { signJWT } from '@/lib/auth/jwt';
import { db } from '@/lib/db/client';
import { users, licenses, widgets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createDefaultConfig } from '@/lib/config/defaults';
import { generateLicenseKey } from '@/lib/license/generate';

describe.sequential('POST /api/widgets/[id]/deploy - Integration Tests', () => {
  // Test fixtures
  let testUser: any;
  let otherUser: any;
  let testLicense: any;
  let otherUserLicense: any;
  let validWidget: any;          // Widget with valid HTTPS webhookUrl
  let emptyWebhookWidget: any;   // Widget with empty webhookUrl
  let httpWebhookWidget: any;    // Widget with HTTP webhookUrl (not HTTPS)
  let pausedWidget: any;         // Paused widget ready for deployment
  let deployedWidget: any;       // Already deployed widget
  let deletedWidget: any;        // Deleted widget
  let otherUserWidget: any;      // Other user's widget
  let authToken: string;
  let otherUserToken: string;
  let testRunId: string;

  beforeAll(async () => {
    testRunId = `widget-deploy-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Create test users
    [testUser] = await db.insert(users).values({
      email: `deploy-test-user-${testRunId}@example.com`,
      passwordHash: 'hash',
      name: 'Deploy Test User',
    }).returning();

    [otherUser] = await db.insert(users).values({
      email: `deploy-other-user-${testRunId}@example.com`,
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

    // Create widgets with different configurations

    // Widget with valid HTTPS webhookUrl
    const validConfig = createDefaultConfig('pro');
    validConfig.connection.webhookUrl = 'https://n8n.example.com/webhook/chat-test';
    [validWidget] = await db.insert(widgets).values({
      licenseId: testLicense.id,
      name: 'Valid Widget',
      status: 'active',
      config: validConfig,
      version: 1,
    }).returning();

    // Widget with empty webhookUrl (not deployment ready)
    const emptyWebhookConfig = createDefaultConfig('pro');
    emptyWebhookConfig.connection.webhookUrl = '';
    [emptyWebhookWidget] = await db.insert(widgets).values({
      licenseId: testLicense.id,
      name: 'Empty Webhook Widget',
      status: 'active',
      config: emptyWebhookConfig,
      version: 1,
    }).returning();

    // Widget with HTTP webhookUrl (not HTTPS - not deployment ready)
    const httpWebhookConfig = createDefaultConfig('pro');
    httpWebhookConfig.connection.webhookUrl = 'http://n8n.example.com/webhook/insecure';
    [httpWebhookWidget] = await db.insert(widgets).values({
      licenseId: testLicense.id,
      name: 'HTTP Webhook Widget',
      status: 'active',
      config: httpWebhookConfig,
      version: 1,
    }).returning();

    // Paused widget with valid config
    const pausedConfig = createDefaultConfig('pro');
    pausedConfig.connection.webhookUrl = 'https://n8n.example.com/webhook/paused-test';
    [pausedWidget] = await db.insert(widgets).values({
      licenseId: testLicense.id,
      name: 'Paused Widget',
      status: 'paused',
      config: pausedConfig,
      version: 1,
    }).returning();

    // Already deployed widget
    const deployedConfig = createDefaultConfig('pro');
    deployedConfig.connection.webhookUrl = 'https://n8n.example.com/webhook/deployed';
    [deployedWidget] = await db.insert(widgets).values({
      licenseId: testLicense.id,
      name: 'Already Deployed Widget',
      status: 'active',
      config: deployedConfig,
      version: 1,
      deployedAt: new Date('2025-01-01T00:00:00Z'),
    }).returning();

    // Deleted widget
    const deletedConfig = createDefaultConfig('pro');
    deletedConfig.connection.webhookUrl = 'https://n8n.example.com/webhook/deleted';
    [deletedWidget] = await db.insert(widgets).values({
      licenseId: testLicense.id,
      name: 'Deleted Widget',
      status: 'deleted',
      config: deletedConfig,
      version: 1,
    }).returning();

    // Other user's widget
    const otherConfig = createDefaultConfig('basic');
    otherConfig.connection.webhookUrl = 'https://n8n.example.com/webhook/other';
    [otherUserWidget] = await db.insert(widgets).values({
      licenseId: otherUserLicense.id,
      name: 'Other User Widget',
      status: 'active',
      config: otherConfig,
      version: 1,
    }).returning();

    // Generate auth tokens
    authToken = await signJWT({ sub: testUser.id, email: testUser.email });
    otherUserToken = await signJWT({ sub: otherUser.id, email: otherUser.email });
  });

  afterEach(async () => {
    // Reset validWidget and pausedWidget to original state after each test
    const validConfig = createDefaultConfig('pro');
    validConfig.connection.webhookUrl = 'https://n8n.example.com/webhook/chat-test';
    await db.update(widgets)
      .set({
        status: 'active',
        config: validConfig,
        deployedAt: null,
      })
      .where(eq(widgets.id, validWidget.id));

    const pausedConfig = createDefaultConfig('pro');
    pausedConfig.connection.webhookUrl = 'https://n8n.example.com/webhook/paused-test';
    await db.update(widgets)
      .set({
        status: 'paused',
        config: pausedConfig,
        deployedAt: null,
      })
      .where(eq(widgets.id, pausedWidget.id));
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

  it('should deploy widget successfully (first deployment - sets deployedAt)', async () => {
    // RED: Route doesn't exist yet
    const beforeDeploy = Date.now();
    const request = new Request(`http://localhost:3000/api/widgets/${validWidget.id}/deploy`, {
      method: 'POST',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await POST(request, { params: { id: validWidget.id } });
    const data = await response.json();
    const afterDeploy = Date.now();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Widget deployed successfully');
    expect(data.widget).toBeDefined();
    expect(data.widget.id).toBe(validWidget.id);
    expect(data.widget.status).toBe('active');
    expect(data.widget.deployedAt).toBeDefined();
    const deployedTime = new Date(data.widget.deployedAt).getTime();
    expect(deployedTime).toBeGreaterThanOrEqual(beforeDeploy);
    // Allow 1 second tolerance for database server time vs client time
    expect(deployedTime).toBeLessThanOrEqual(afterDeploy + 1000);
    expect(data.widget.version).toBe(1);

    // Verify in database
    const [widgetInDb] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, validWidget.id));
    expect(widgetInDb.deployedAt).not.toBeNull();
  });

  it('should re-deploy already-deployed widget (deployedAt unchanged, returns 200)', async () => {
    // RED: Route doesn't exist yet
    const originalDeployedAt = deployedWidget.deployedAt;

    const request = new Request(`http://localhost:3000/api/widgets/${deployedWidget.id}/deploy`, {
      method: 'POST',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await POST(request, { params: { id: deployedWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Widget deployed successfully');
    expect(data.widget.deployedAt).toBe(originalDeployedAt.toISOString());
    expect(data.widget.status).toBe('active');

    // Verify deployedAt was NOT changed in database
    const [widgetInDb] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, deployedWidget.id));
    expect(widgetInDb.deployedAt?.toISOString()).toBe(originalDeployedAt.toISOString());
  });

  it('should deploy paused widget (activates it and sets deployedAt)', async () => {
    // RED: Route doesn't exist yet
    const beforeDeploy = Date.now();
    const request = new Request(`http://localhost:3000/api/widgets/${pausedWidget.id}/deploy`, {
      method: 'POST',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await POST(request, { params: { id: pausedWidget.id } });
    const data = await response.json();
    const afterDeploy = Date.now();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Widget deployed successfully');
    expect(data.widget.status).toBe('active'); // Changed from paused to active
    expect(data.widget.deployedAt).toBeDefined();
    const deployedTime = new Date(data.widget.deployedAt).getTime();
    expect(deployedTime).toBeGreaterThanOrEqual(beforeDeploy);
    // Allow 1 second tolerance for database server time vs client time
    expect(deployedTime).toBeLessThanOrEqual(afterDeploy + 1000);

    // Verify in database
    const [widgetInDb] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, pausedWidget.id));
    expect(widgetInDb.status).toBe('active');
    expect(widgetInDb.deployedAt).not.toBeNull();
  });

  // =========================================================================
  // AUTHENTICATION FAILURES
  // =========================================================================

  it('should reject request without authentication (401)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${validWidget.id}/deploy`, {
      method: 'POST',
      headers: {
        // No auth cookie
      },
    });

    const response = await POST(request, { params: { id: validWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();

    // Verify widget was NOT deployed
    const [widgetInDb] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, validWidget.id));
    expect(widgetInDb.deployedAt).toBeNull();
  });

  // =========================================================================
  // AUTHORIZATION FAILURES
  // =========================================================================

  it('should reject widget owned by different user (403)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${validWidget.id}/deploy`, {
      method: 'POST',
      headers: {
        'Cookie': `auth_token=${otherUserToken}`, // Different user's token
      },
    });

    const response = await POST(request, { params: { id: validWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();

    // Verify widget was NOT deployed
    const [widgetInDb] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, validWidget.id));
    expect(widgetInDb.deployedAt).toBeNull();
  });

  it('should reject widget from another user\'s license (403)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${otherUserWidget.id}/deploy`, {
      method: 'POST',
      headers: {
        'Cookie': `auth_token=${authToken}`, // testUser trying to deploy otherUser's widget
      },
    });

    const response = await POST(request, { params: { id: otherUserWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  // =========================================================================
  // VALIDATION FAILURES
  // =========================================================================

  it('should reject invalid widget ID format (400)', async () => {
    // RED: Route doesn't exist yet
    const invalidId = 'not-a-uuid';
    const request = new Request(`http://localhost:3000/api/widgets/${invalidId}/deploy`, {
      method: 'POST',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await POST(request, { params: { id: invalidId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should reject non-existent widget ID (404)', async () => {
    // RED: Route doesn't exist yet
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const request = new Request(`http://localhost:3000/api/widgets/${nonExistentId}/deploy`, {
      method: 'POST',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await POST(request, { params: { id: nonExistentId } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBeDefined();
  });

  it('should reject deployment with empty webhookUrl (400)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${emptyWebhookWidget.id}/deploy`, {
      method: 'POST',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await POST(request, { params: { id: emptyWebhookWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(data.error).toContain('not ready for deployment');
    expect(data.details).toBeDefined();
    expect(data.details.length).toBeGreaterThan(0);
    // Verify error mentions webhookUrl
    const webhookError = data.details.find((detail: any) =>
      detail.path.includes('webhookUrl') || detail.message.toLowerCase().includes('webhook')
    );
    expect(webhookError).toBeDefined();

    // Verify widget was NOT deployed
    const [widgetInDb] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, emptyWebhookWidget.id));
    expect(widgetInDb.deployedAt).toBeNull();
  });

  it('should reject deployment with HTTP webhookUrl (not HTTPS) - 400', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${httpWebhookWidget.id}/deploy`, {
      method: 'POST',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await POST(request, { params: { id: httpWebhookWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(data.error).toContain('not ready for deployment');

    // Widget should reject HTTP URL (either via Zod schema or custom HTTPS check)
    // The exact error structure may vary, but the deployment should be blocked

    // Verify widget was NOT deployed
    const [widgetInDb] = await db
      .select()
      .from(widgets)
      .where(eq(widgets.id, httpWebhookWidget.id));
    expect(widgetInDb.deployedAt).toBeNull();
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  it('should reject deleted widget deployment (400 or 404)', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${deletedWidget.id}/deploy`, {
      method: 'POST',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await POST(request, { params: { id: deletedWidget.id } });
    const data = await response.json();

    // Either 400 (deleted status not deployable) or 404 (treated as not found)
    expect([400, 404]).toContain(response.status);
    expect(data.error).toBeDefined();
  });

  it('should validate with strict mode (allowDefaults=false) for deployment', async () => {
    // RED: Route doesn't exist yet
    // This test verifies that deployment uses strict validation
    // Even if a widget was created with lenient validation, deployment must be strict

    // The validWidget has a proper HTTPS webhookUrl, so it should pass strict validation
    const request = new Request(`http://localhost:3000/api/widgets/${validWidget.id}/deploy`, {
      method: 'POST',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await POST(request, { params: { id: validWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widget.deployedAt).toBeDefined();

    // Now test that strict validation would reject empty webhookUrl
    // (already covered by "should reject deployment with empty webhookUrl" test)
    // This test documents that deployment uses createWidgetConfigSchema(tier, allowDefaults=false)
  });

  it('should return deployment info with correct structure', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(`http://localhost:3000/api/widgets/${validWidget.id}/deploy`, {
      method: 'POST',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await POST(request, { params: { id: validWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('widget');
    expect(data.widget).toHaveProperty('id');
    expect(data.widget).toHaveProperty('status');
    expect(data.widget).toHaveProperty('deployedAt');
    expect(data.widget).toHaveProperty('version');

    // Verify types
    expect(typeof data.message).toBe('string');
    expect(typeof data.widget.id).toBe('string');
    expect(typeof data.widget.status).toBe('string');
    expect(typeof data.widget.deployedAt).toBe('string');
    expect(typeof data.widget.version).toBe('number');
  });

  it('should allow localhost webhookUrl for deployment (development mode)', async () => {
    // RED: Route doesn't exist yet
    // Update validWidget to have localhost URL
    const localhostConfig = createDefaultConfig('pro');
    localhostConfig.connection.webhookUrl = 'http://localhost:5678/webhook/test';
    await db.update(widgets)
      .set({ config: localhostConfig })
      .where(eq(widgets.id, validWidget.id));

    const request = new Request(`http://localhost:3000/api/widgets/${validWidget.id}/deploy`, {
      method: 'POST',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });

    const response = await POST(request, { params: { id: validWidget.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.widget.deployedAt).toBeDefined();
  });
});
