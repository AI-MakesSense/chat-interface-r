/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('@/lib/db/queries', () => ({
  getWidgetByKeyWithUser: jest.fn(),
}));

const { NextRequest } = require('next/server');
const { GET } = require('@/app/api/w/[widgetKey]/config/route');
const dbQueries = require('@/lib/db/queries');

describe('Public Config Security Hardening', () => {
  const widgetKey = 'ABCD1234EFGH5678';

  beforeEach(() => {
    jest.clearAllMocks();

    dbQueries.getWidgetByKeyWithUser.mockResolvedValue({
      id: 'widget-1',
      widgetKey,
      name: 'Support Widget',
      status: 'active',
      allowedDomains: ['example.com'],
      config: {
        n8nWebhookUrl: 'https://secret-n8n.internal/webhook/abc',
        connection: { webhookUrl: 'https://secret-n8n.internal/webhook/xyz' },
        branding: { companyName: 'ACME' },
      },
      user: {
        id: 'user-1',
        tier: 'pro',
        subscriptionStatus: 'active',
      },
    });
  });

  it('does not expose webhookUrl in public config payload', async () => {
    const request = new NextRequest(
      `https://chat-interface-r.vercel.app/api/w/${widgetKey}/config`,
      {
        method: 'GET',
        headers: {
          origin: 'https://example.com',
          host: 'chat-interface-r.vercel.app',
        },
      }
    );

    const response = await GET(request, {
      params: Promise.resolve({ widgetKey }),
    });

    expect(response.status).toBe(200);
    const config = await response.json();
    expect(config.connection?.relayEndpoint).toContain('/api/chat-relay');
    expect(config.connection?.webhookUrl).toBeUndefined();
  });

  it('fails closed when origin context is missing', async () => {
    const request = new NextRequest(
      `https://chat-interface-r.vercel.app/api/w/${widgetKey}/config`,
      { method: 'GET' }
    );

    const response = await GET(request, {
      params: Promise.resolve({ widgetKey }),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toMatch(/Origin or referer/i);
  });
});
