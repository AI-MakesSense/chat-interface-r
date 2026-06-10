/**
 * @jest-environment node
 *
 * Display Widget Configuration API Integration Tests
 *
 * Endpoint: GET /api/w/[widgetKey]/config (v2)
 * Purpose: Verify display widgets serve their translated config
 *          (kind=display, no webhookUrl, with relayEndpoint, display section preserved)
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '@/lib/db/client';
import { users, widgets } from '@/lib/db/schema';
import { GET } from '@/app/api/w/[widgetKey]/config/route';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// widgetKey must be exactly 16 alphanumeric chars (route validates /^[A-Za-z0-9]{16}$/)
function makeWidgetKey(): string {
  return crypto.randomBytes(8).toString('hex'); // 16 hex chars
}

describe('GET /api/w/[widgetKey]/config for display widgets', () => {
  let testUser: any;
  let displayWidget: any;
  const TEST_EMAIL = 'display-widget-test@test.com';
  const TEST_WIDGET_NAME = 'Display Integration Test Widget';
  const widgetKey = makeWidgetKey();

  beforeAll(async () => {
    // Clean up any leftover data from previous runs
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, TEST_EMAIL));

    if (existingUser.length > 0) {
      await db.delete(widgets).where(eq(widgets.userId, existingUser[0].id)).execute();
      await db.delete(users).where(eq(users.email, TEST_EMAIL)).execute();
    }

    // Create test user with active subscription so the route passes auth checks
    const [user] = await db
      .insert(users)
      .values({
        email: TEST_EMAIL,
        passwordHash: 'not-used',
        name: 'Display Widget Tester',
        emailVerified: true,
        tier: 'pro',
        subscriptionStatus: 'active',
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      })
      .returning();
    testUser = user;

    // Insert display widget directly — no licenseId needed (v2.0 schema)
    const [w] = await db
      .insert(widgets)
      .values({
        userId: testUser.id,
        widgetKey,
        name: TEST_WIDGET_NAME,
        status: 'active',
        kind: 'display',
        widgetType: 'n8n',
        embedType: 'inline',
        // allowedDomains is empty — route treats empty list as "allow all"
        allowedDomains: [],
        config: {
          branding: {
            companyName: 'Acme Corp',
            logoUrl: null,
            brandingEnabled: true,
          },
          theme: {
            colorScheme: 'light',
            radius: 'medium',
            density: 'normal',
            color: {
              accent: '#0066FF',
              surface: '#FFFFFF',
              text: '#111111',
              subText: '#666666',
              border: '#E5E7EB',
            },
          },
          display: {
            position: 'right',
            defaultOpen: true,
            header: {
              title: 'Required documents',
              showCount: true,
            },
            emptyMessage: 'No documents available.',
          },
          connection: {
            provider: 'n8n',
            webhookUrl: 'https://n8n.example.com/webhook/abc123-secret',
            triggerMessage: 'List required documents.',
            captureContext: true,
            customContext: {},
          },
        },
      })
      .returning();
    displayWidget = w;
  });

  afterAll(async () => {
    if (displayWidget?.id) {
      await db.delete(widgets).where(eq(widgets.id, displayWidget.id)).execute();
    }
    if (testUser?.id) {
      await db.delete(users).where(eq(users.id, testUser.id)).execute();
    }
  });

  it('returns 200 for a valid display widget key', async () => {
    const req = new Request(`http://localhost/w/${widgetKey}/config`, {
      headers: { Origin: 'https://example.com' },
    });
    const res = await GET(req as any, {
      params: Promise.resolve({ widgetKey }),
    } as any);

    expect(res.status).toBe(200);
  });

  it('returns config with kind=display', async () => {
    const req = new Request(`http://localhost/w/${widgetKey}/config`, {
      headers: { Origin: 'https://example.com' },
    });
    const res = await GET(req as any, {
      params: Promise.resolve({ widgetKey }),
    } as any);

    const body = await res.json();
    expect(body.kind).toBe('display');
  });

  it('strips webhookUrl from the served config (server-only secret)', async () => {
    const req = new Request(`http://localhost/w/${widgetKey}/config`, {
      headers: { Origin: 'https://example.com' },
    });
    const res = await GET(req as any, {
      params: Promise.resolve({ widgetKey }),
    } as any);

    const body = await res.json();
    // webhookUrl must not be exposed to the client
    expect(body.connection?.webhookUrl).toBeUndefined();
  });

  it('exposes relayEndpoint derived from the request URL', async () => {
    const req = new Request(`http://localhost/w/${widgetKey}/config`, {
      headers: { Origin: 'https://example.com' },
    });
    const res = await GET(req as any, {
      params: Promise.resolve({ widgetKey }),
    } as any);

    const body = await res.json();
    expect(body.connection.relayEndpoint).toBeDefined();
    expect(body.connection.relayEndpoint).toContain('/api/chat-relay');
  });

  it('preserves triggerMessage in the connection block', async () => {
    const req = new Request(`http://localhost/w/${widgetKey}/config`, {
      headers: { Origin: 'https://example.com' },
    });
    const res = await GET(req as any, {
      params: Promise.resolve({ widgetKey }),
    } as any);

    const body = await res.json();
    expect(body.connection.triggerMessage).toBe('List required documents.');
  });

  it('preserves the display section (position, header title, emptyMessage)', async () => {
    const req = new Request(`http://localhost/w/${widgetKey}/config`, {
      headers: { Origin: 'https://example.com' },
    });
    const res = await GET(req as any, {
      params: Promise.resolve({ widgetKey }),
    } as any);

    const body = await res.json();
    expect(body.display).toBeDefined();
    expect(body.display.position).toBe('right');
    expect(body.display.header.title).toBe('Required documents');
    expect(body.display.emptyMessage).toBe('No documents available.');
  });

  it('returns 404 for a malformed widgetKey', async () => {
    // Resolver returns 404 (not 400) for malformed keys by design — this avoids
    // leaking valid-key syntax to probing clients.
    const badKey = 'not-valid!';
    const req = new Request(`http://localhost/w/${badKey}/config`, {
      headers: { Origin: 'https://example.com' },
    });
    const res = await GET(req as any, {
      params: Promise.resolve({ widgetKey: badKey }),
    } as any);

    expect(res.status).toBe(404);
  });

  it('returns 404 for an unknown widgetKey', async () => {
    const unknownKey = 'a1b2c3d4e5f6a1b2'; // valid format but does not exist
    const req = new Request(`http://localhost/w/${unknownKey}/config`, {
      headers: { Origin: 'https://example.com' },
    });
    const res = await GET(req as any, {
      params: Promise.resolve({ widgetKey: unknownKey }),
    } as any);

    expect(res.status).toBe(404);
  });

  it('returns 403 when Origin header is absent', async () => {
    const req = new Request(`http://localhost/w/${widgetKey}/config`);
    const res = await GET(req as any, {
      params: Promise.resolve({ widgetKey }),
    } as any);

    expect(res.status).toBe(403);
  });
});
