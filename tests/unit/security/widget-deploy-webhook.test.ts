/**
 * @jest-environment node
 *
 * Deploy-time webhook validation (Task 13, Step 2/3).
 *
 * Asserts the deploy route:
 *  - rejects a private-IP webhook via the SSRF guard (TG-004)
 *  - rejects the display sentinel ('https://example.com/webhook') as a placeholder
 *  - deploys a real, public https webhook
 *
 * DB / auth are mocked at the module level (no DB access). The config schema is
 * mocked to a passthrough so the test focuses on the webhook checks rather than
 * full deployment-readiness validation. The SSRF guard uses its REAL placeholder
 * check (isPlaceholderWebhook is pure) but a mocked assertPublicWebhookUrl so no
 * network/DNS is touched.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('@/lib/db/queries', () => ({
  getWidgetById: jest.fn(),
  getUserById: jest.fn(),
  deployWidget: jest.fn(),
}));

jest.mock('@/lib/auth/guard', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/validation/widget-schema', () => ({
  // Passthrough schema — deployment-readiness is exercised elsewhere.
  getWidgetConfigSchemaForKind: () => ({ parse: (v: unknown) => v }),
  normalizeTier: (t: string) => t,
}));

// Keep the REAL isPlaceholderWebhook (pure), mock only the async network guard.
jest.mock('@/lib/security/url-guard', () => {
  const actual = jest.requireActual('@/lib/security/url-guard') as Record<string, unknown>;
  return {
    ...actual,
    assertPublicWebhookUrl: jest.fn((raw: string) => Promise.resolve(new URL(raw))),
  };
});

const { NextRequest } = require('next/server');
const { POST } = require('@/app/api/widgets/[id]/deploy/route');
const dbQueries = require('@/lib/db/queries');
const authGuard = require('@/lib/auth/guard');
const urlGuard = require('@/lib/security/url-guard');

const WIDGET_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = 'user-aaa-bbb-ccc';

function buildWidget(webhookUrl: string) {
  return {
    id: WIDGET_ID,
    userId: USER_ID,
    kind: 'chat',
    status: 'active',
    config: {
      connection: { provider: 'n8n', webhookUrl },
    },
  };
}

function makeRequest() {
  return new NextRequest(`https://app.test/api/widgets/${WIDGET_ID}/deploy`, {
    method: 'POST',
  });
}

const params = { params: Promise.resolve({ id: WIDGET_ID }) };

describe('Widget deploy — webhook validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authGuard.requireAuth.mockResolvedValue({ sub: USER_ID });
    dbQueries.getUserById.mockResolvedValue({ id: USER_ID, tier: 'pro' });
    dbQueries.deployWidget.mockResolvedValue({
      id: WIDGET_ID,
      status: 'active',
      deployedAt: new Date(),
      version: 2,
    });
    urlGuard.assertPublicWebhookUrl.mockImplementation((raw: string) =>
      Promise.resolve(new URL(raw))
    );
  });

  // TG-004: private-IP webhook rejected at deploy.
  it('rejects a private-IP webhook with 400 (TG-004)', async () => {
    dbQueries.getWidgetById.mockResolvedValue(buildWidget('https://10.0.0.5/hook'));
    urlGuard.assertPublicWebhookUrl.mockRejectedValue(
      new Error('Webhook URL resolves to a private address')
    );

    const res = await POST(makeRequest(), params);
    expect(res.status).toBe(400);
    expect(dbQueries.deployWidget).not.toHaveBeenCalled();
    const data = await res.json();
    expect(JSON.stringify(data)).toMatch(/private address/i);
  });

  // Sentinel rejected at deploy (but the guard is NOT even consulted — placeholder
  // check short-circuits first with a configure-your-webhook message).
  it('rejects the example.com placeholder sentinel at deploy with 400', async () => {
    dbQueries.getWidgetById.mockResolvedValue(
      buildWidget('https://example.com/webhook')
    );

    const res = await POST(makeRequest(), params);
    expect(res.status).toBe(400);
    expect(dbQueries.deployWidget).not.toHaveBeenCalled();
    expect(urlGuard.assertPublicWebhookUrl).not.toHaveBeenCalled();
    const data = await res.json();
    expect(JSON.stringify(data)).toMatch(/configure your webhook/i);
  });

  it('deploys a real public https webhook', async () => {
    dbQueries.getWidgetById.mockResolvedValue(
      buildWidget('https://n8n.mycompany.com/webhook/abc')
    );

    const res = await POST(makeRequest(), params);
    expect(res.status).toBe(200);
    expect(urlGuard.assertPublicWebhookUrl).toHaveBeenCalledWith(
      'https://n8n.mycompany.com/webhook/abc'
    );
    expect(dbQueries.deployWidget).toHaveBeenCalledWith(WIDGET_ID);
  });
});
