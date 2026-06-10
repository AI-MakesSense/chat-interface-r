/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: jest.fn(),
}));

jest.mock('@/lib/db/queries', () => ({
  getWidgetByKeyWithUser: jest.fn(),
  getWidgetById: jest.fn(),
  getUserById: jest.fn(),
  getLicenseByKey: jest.fn(),
}));

// Mock the SSRF guard: the relay now validates the webhook URL before fetch.
// Default behaviour echoes back a URL so the happy paths still reach fetch.
jest.mock('@/lib/security/url-guard', () => ({
  assertPublicWebhookUrl: jest.fn((raw: string) => Promise.resolve(new URL(raw))),
}));

const { NextRequest } = require('next/server');
const { POST } = require('@/app/api/chat-relay/route');
const rateLimit = require('@/lib/security/rate-limit');
const dbQueries = require('@/lib/db/queries');
const urlGuard = require('@/lib/security/url-guard');

describe('Chat Relay Security Hardening', () => {
  const widgetKey = 'ABCD1234EFGH5678';
  const webhookUrl = 'https://n8n.example.com/webhook/widget';

  const createRequest = (
    body: Record<string, unknown>,
    headers: Record<string, string> = {}
  ) =>
    new NextRequest('https://chat-interface-r.vercel.app/api/chat-relay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });

  beforeEach(() => {
    jest.clearAllMocks();
    urlGuard.assertPublicWebhookUrl.mockImplementation((raw: string) =>
      Promise.resolve(new URL(raw))
    );
    rateLimit.checkRateLimit.mockReturnValue({ allowed: true, remaining: 100 });
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue({
      id: 'widget-1',
      widgetKey,
      status: 'active',
      allowedDomains: ['example.com'],
      config: {
        connection: {
          provider: 'n8n',
          webhookUrl,
        },
      },
      user: {
        id: 'user-1',
        tier: 'pro',
        subscriptionStatus: 'active',
      },
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ message: 'ok' }),
    } as Response);
  });

  it('blocks requests missing both origin and referer', async () => {
    const response = await POST(
      createRequest({
        licenseKey: widgetKey,
        message: 'hello',
      })
    );

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toMatch(/Origin or referer/i);
  });

  it('blocks requests from unauthorized domains', async () => {
    const response = await POST(
      createRequest(
        {
          licenseKey: widgetKey,
          message: 'hello',
        },
        { origin: 'https://evil.example.org' }
      )
    );

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toMatch(/Domain not authorized/i);
  });

  it('blocks canceled subscriptions outside grace period', async () => {
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue({
      id: 'widget-1',
      widgetKey,
      status: 'active',
      allowedDomains: ['example.com'],
      config: {
        connection: {
          provider: 'n8n',
          webhookUrl,
        },
      },
      user: {
        id: 'user-1',
        tier: 'pro',
        subscriptionStatus: 'canceled',
        currentPeriodEnd: new Date(Date.now() - 60_000).toISOString(),
      },
    });

    const response = await POST(
      createRequest(
        {
          licenseKey: widgetKey,
          message: 'hello',
        },
        { origin: 'https://example.com' }
      )
    );

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toMatch(/Subscription is not active/i);
  });

  it('returns 429 when rate limited', async () => {
    rateLimit.checkRateLimit.mockImplementation((namespace: string) => {
      if (namespace === 'chat-relay:ip') {
        return { allowed: false, retryAfter: 30, remaining: 0 };
      }
      return { allowed: true, remaining: 100 };
    });

    const response = await POST(
      createRequest(
        {
          licenseKey: widgetKey,
          message: 'hello',
        },
        { origin: 'https://example.com' }
      )
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('30');
  });

  it('allows authorized n8n relay requests', async () => {
    const response = await POST(
      createRequest(
        {
          licenseKey: widgetKey,
          message: 'hello',
          widgetId: 'widget-1',
        },
        { origin: 'https://example.com' }
      )
    );

    expect(response.status).toBe(200);
    // The relay now validates the URL and fetches the resulting URL object.
    expect(urlGuard.assertPublicWebhookUrl).toHaveBeenCalledWith(webhookUrl);
    const [fetchUrl, fetchInit] = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchUrl.toString()).toBe(webhookUrl);
    expect((fetchInit as RequestInit).method).toBe('POST');
  });

  // TG-002: proves the SSRF guard is actually invoked by the relay. When the
  // guard rejects, the relay must NOT fetch and must return 502.
  it('invokes the SSRF guard and returns 502 when it rejects the webhook', async () => {
    urlGuard.assertPublicWebhookUrl.mockRejectedValue(
      new Error('Webhook URL resolves to a private address')
    );

    const response = await POST(
      createRequest(
        { licenseKey: widgetKey, message: 'hello', widgetId: 'widget-1' },
        { origin: 'https://example.com' }
      )
    );

    expect(urlGuard.assertPublicWebhookUrl).toHaveBeenCalledWith(webhookUrl);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.error).toMatch(/security policy/i);
  });

  // Timeout: AbortSignal.timeout fires a TimeoutError-named error → 504.
  it('returns 504 when the upstream fetch times out', async () => {
    const timeoutErr = new Error('The operation was aborted due to timeout');
    timeoutErr.name = 'TimeoutError';
    (global.fetch as jest.Mock).mockRejectedValue(timeoutErr);

    const response = await POST(
      createRequest(
        { licenseKey: widgetKey, message: 'hello', widgetId: 'widget-1' },
        { origin: 'https://example.com' }
      )
    );

    expect(response.status).toBe(504);
    const data = await response.json();
    expect(data.error).toMatch(/timed out/i);
  });

  // Redirect SSRF: with redirect:'manual' a webhook that 3xx-bounces to a
  // private IP must be rejected (502), and the relay must NOT issue a second
  // fetch to the Location. Covers both runtime representations:
  //   - Node/undici: visible 3xx status (e.g. 302), type 'basic'
  //   - spec fetch (edge): opaque redirect, type 'opaqueredirect', status 0
  it.each([
    { label: 'visible 302 (node/undici)', status: 302, type: 'basic' },
    { label: 'opaque redirect (edge)', status: 0, type: 'opaqueredirect' },
  ])('rejects a webhook redirect — $label — with 502 and no second fetch', async ({ status, type }) => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status,
      type,
      headers: { get: () => 'http://169.254.169.254/' },
      text: async () => '',
    } as unknown as Response);

    const response = await POST(
      createRequest(
        { licenseKey: widgetKey, message: 'hello', widgetId: 'widget-1' },
        { origin: 'https://example.com' }
      )
    );

    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.error).toMatch(/security policy/i);
    // The Location must NOT be followed — exactly one fetch was issued.
    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);
  });

  // Allowlist proof: an arbitrary top-level key the embedder injects must NOT
  // appear in the payload forwarded to n8n.
  it('does not forward arbitrary client-injected top-level keys to n8n', async () => {
    const response = await POST(
      createRequest(
        {
          licenseKey: widgetKey,
          message: 'hello',
          widgetId: 'widget-1',
          evilInjected: 'pwned',
          __proto__hack: { admin: true },
        },
        { origin: 'https://example.com' }
      )
    );

    expect(response.status).toBe(200);
    const [, fetchInit] = (global.fetch as jest.Mock).mock.calls[0];
    const sentPayload = JSON.parse((fetchInit as RequestInit).body as string);
    expect(sentPayload).not.toHaveProperty('evilInjected');
    expect(sentPayload).not.toHaveProperty('__proto__hack');
    // Legitimate fields are preserved.
    expect(sentPayload.message).toBe('hello');
    expect(sentPayload.chatInput).toBe('hello');
    expect(sentPayload.widgetId).toBe('widget-1');
    expect(sentPayload.metadata.tier).toBe('pro');
  });
});
