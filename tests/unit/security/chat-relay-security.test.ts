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

const { NextRequest } = require('next/server');
const { POST } = require('@/app/api/chat-relay/route');
const rateLimit = require('@/lib/security/rate-limit');
const dbQueries = require('@/lib/db/queries');

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
    expect(global.fetch).toHaveBeenCalledWith(
      webhookUrl,
      expect.objectContaining({
        method: 'POST',
      })
    );
  });
});
