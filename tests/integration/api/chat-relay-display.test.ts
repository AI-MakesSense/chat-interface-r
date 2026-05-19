/**
 * @jest-environment node
 *
 * Chat-Relay endpoint accepting display-widget payloads
 *
 * Verifies that POST /api/chat-relay handles a payload originating from a
 * display widget identically to one from a chat widget. The relay should
 * forward to the configured n8n webhook and return whatever JSON n8n responds.
 *
 * DATABASE NOTE: DATABASE_URL is not set in this dev environment.
 * A DB-connection failure in beforeAll is acceptable; an assertion failure
 * inside a test case is not.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db/client';
import { users, widgets } from '@/lib/db/schema';
import { POST } from '@/app/api/chat-relay/route';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// widgetKey must be exactly 16 alphanumeric chars — chat-relay route checks
// /^[A-Za-z0-9]{16}$/ to decide whether it is a v2 widgetKey or legacy licenseKey.
function makeWidgetKey(): string {
  return crypto.randomBytes(8).toString('hex'); // 16 hex chars
}

describe('POST /api/chat-relay for display widgets', () => {
  let testUser: any;
  let displayWidget: any;
  let fetchSpy: ReturnType<typeof jest.spyOn>;
  const N8N_URL = 'https://n8n.example.com/webhook/display-relay-test';
  const widgetKey = makeWidgetKey();
  const TEST_EMAIL = 'display-relay-test@test.com';
  const TEST_WIDGET_NAME = 'Display Relay Integration Test';
  const ALLOWED_DOMAIN = 'allowed.example.com';

  beforeAll(async () => {
    // Clean up any leftover data from a previous aborted run
    const existingUser = await db.select().from(users).where(eq(users.email, TEST_EMAIL));
    if (existingUser.length > 0) {
      await db.delete(widgets).where(eq(widgets.userId, existingUser[0].id)).execute();
      await db.delete(users).where(eq(users.email, TEST_EMAIL)).execute();
    }

    // Insert a test user with an active subscription so isSubscriptionActive() passes
    const [user] = await db
      .insert(users)
      .values({
        email: TEST_EMAIL,
        passwordHash: 'not-used',
        name: 'Display Relay Tester',
        emailVerified: true,
        tier: 'pro',
        subscriptionStatus: 'active',
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      })
      .returning();
    testUser = user;

    // Insert a display-kind widget.  The widgetKey is supplied so that the
    // chat-relay route picks it up via getWidgetByKeyWithUser(licenseKey).
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
        allowedDomains: [ALLOWED_DOMAIN],
        config: {
          connection: {
            provider: 'n8n',
            webhookUrl: N8N_URL,
            triggerMessage: 'List required documents.',
            captureContext: true,
            customContext: {},
          },
          display: {
            position: 'right',
            defaultOpen: true,
            header: { title: 'Required documents', showCount: true },
            emptyMessage: 'No documents available.',
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

  beforeEach(() => {
    // Spy on global.fetch so n8n is never actually contacted
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : (url as Request).url;
      if (urlStr === N8N_URL) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ documents: [{ title: 'A', url: 'https://x/a.pdf' }] }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }
      return Promise.reject(new Error(`Unexpected fetch to: ${urlStr}`));
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('returns 200 and the n8n JSON unchanged for a display widget relay request', async () => {
    const req = new NextRequest('http://localhost/api/chat-relay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: `https://${ALLOWED_DOMAIN}`,
      },
      body: JSON.stringify({
        licenseKey: widgetKey,
        message: 'List required documents.',
        chatInput: 'List required documents.',
        sessionId: 'session-123',
        context: {
          pageUrl: `https://${ALLOWED_DOMAIN}/`,
          pagePath: '/',
          pageTitle: 'X',
          queryParams: {},
          domain: ALLOWED_DOMAIN,
        },
        customContext: { region: 'us' },
        metadata: { tier: 'pro' },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ documents: [{ title: 'A', url: 'https://x/a.pdf' }] });
  });

  it('calls the n8n webhook exactly once with the correct URL', async () => {
    const req = new NextRequest('http://localhost/api/chat-relay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: `https://${ALLOWED_DOMAIN}`,
      },
      body: JSON.stringify({
        licenseKey: widgetKey,
        message: 'go',
        sessionId: 'sess-abc',
      }),
    });

    await POST(req);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const calledUrl = (fetchSpy.mock.calls[0] as any[])[0];
    expect(calledUrl).toBe(N8N_URL);
  });

  it('forwards customContext to n8n in the webhook payload', async () => {
    const req = new NextRequest('http://localhost/api/chat-relay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: `https://${ALLOWED_DOMAIN}`,
      },
      body: JSON.stringify({
        licenseKey: widgetKey,
        message: 'go',
        sessionId: 'sess-456',
        context: {
          pageUrl: `https://${ALLOWED_DOMAIN}/x`,
          pagePath: '/x',
          pageTitle: '',
          queryParams: { state: 'CO' },
          domain: ALLOWED_DOMAIN,
        },
        customContext: { state: 'CO', applicationId: 'APP-123' },
        metadata: { tier: 'pro' },
      }),
    });

    await POST(req);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const calledInit = (fetchSpy.mock.calls[0] as any[])[1] as RequestInit;
    const forwardedBody = JSON.parse(calledInit.body as string);
    expect(forwardedBody.customContext).toEqual({ state: 'CO', applicationId: 'APP-123' });
  });
});
