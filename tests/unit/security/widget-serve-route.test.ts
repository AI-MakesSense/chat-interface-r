/**
 * @jest-environment node
 *
 * Coverage for app/w/[widgetKey]/route.ts (the legacy widget-serve compat route).
 *
 * Post-Task-18 this route no longer serves an injected bundle. For n8n widgets it
 * serves an inline bootstrap that injects /widget/loader.js with the resolved
 * widgetKey baked in (a 302 would be invisible to the loader). It still runs all
 * authorization (status, subscription, domain) and rate limiting first. The
 * ChatKit branch (behind CHATKIT_SERVER_ENABLED) serves an iframe injector.
 *
 * This replaces the deleted widget-serve-fail-closed.test.ts.
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('@/lib/db/queries', () => ({
  getWidgetByKeyWithUser: jest.fn(),
}));

jest.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: jest.fn(),
}));

// Default: ChatKit server disabled (matches default env).
jest.mock('@/lib/feature-flags', () => ({
  CHATKIT_SERVER_ENABLED: false,
}));

const { NextRequest } = require('next/server');
const { GET } = require('@/app/w/[widgetKey]/route');
const dbQueries = require('@/lib/db/queries');
const rateLimit = require('@/lib/security/rate-limit');

const widgetKey = 'ABCD1234EFGH5678';

function makeRequest(headers: Record<string, string>) {
  return new NextRequest(`https://chat-interface-r.vercel.app/w/${widgetKey}.js`, {
    method: 'GET',
    headers,
  });
}

function n8nWidget(overrides: Record<string, any> = {}) {
  return {
    id: 'widget-1',
    widgetKey,
    name: 'Support Widget',
    status: 'active',
    widgetType: 'n8n',
    allowedDomains: ['example.com'],
    config: { branding: { companyName: 'ACME' } },
    user: { id: 'user-1', tier: 'pro', subscriptionStatus: 'active' },
    ...overrides,
  };
}

describe('Widget Serve Route (compat bootstrap)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Allow both IP and widget rate-limit checks by default.
    rateLimit.checkRateLimit.mockResolvedValue({ allowed: true });
  });

  it('serves an inline loader bootstrap containing the widgetKey for an authorized n8n widget', async () => {
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue(n8nWidget());

    const response = await GET(
      makeRequest({ origin: 'https://example.com', host: 'chat-interface-r.vercel.app' }),
      { params: Promise.resolve({ widgetKey: `${widgetKey}.js` }) }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/javascript');

    const body = await response.text();
    // The bootstrap injects the loader with the resolved key baked in.
    expect(body).toContain('/widget/loader.js');
    expect(body).toContain('data-widget-key');
    expect(body).toContain(widgetKey);
    // It must NOT be a redirect (which the loader cannot follow).
    expect(response.status).not.toBe(302);
  });

  it('returns 403 when the request domain is not authorized', async () => {
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue(n8nWidget({ allowedDomains: ['example.com'] }));

    const response = await GET(
      // evil.com is not in allowedDomains, not first-party, not localhost.
      makeRequest({ origin: 'https://evil.com', host: 'chat-interface-r.vercel.app' }),
      { params: Promise.resolve({ widgetKey: `${widgetKey}.js` }) }
    );

    expect(response.status).toBe(403);
    const body = await response.text();
    expect(body).not.toContain('/widget/loader.js');
  });

  it('returns 403 when the widget does not exist', async () => {
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue(null);

    const response = await GET(
      makeRequest({ origin: 'https://example.com', host: 'chat-interface-r.vercel.app' }),
      { params: Promise.resolve({ widgetKey: `${widgetKey}.js` }) }
    );

    expect(response.status).toBe(403);
  });

  it('returns 403 when the widget is not active', async () => {
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue(n8nWidget({ status: 'paused' }));

    const response = await GET(
      makeRequest({ origin: 'https://example.com', host: 'chat-interface-r.vercel.app' }),
      { params: Promise.resolve({ widgetKey: `${widgetKey}.js` }) }
    );

    expect(response.status).toBe(403);
  });

  it('returns 403 when the owner subscription is canceled and past the grace period', async () => {
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue(
      n8nWidget({
        user: {
          id: 'user-1',
          tier: 'pro',
          subscriptionStatus: 'canceled',
          currentPeriodEnd: new Date(Date.now() - 86_400_000).toISOString(),
        },
      })
    );

    const response = await GET(
      makeRequest({ origin: 'https://example.com', host: 'chat-interface-r.vercel.app' }),
      { params: Promise.resolve({ widgetKey: `${widgetKey}.js` }) }
    );

    expect(response.status).toBe(403);
  });

  it('rejects an invalid widgetKey format without a DB lookup', async () => {
    const response = await GET(
      makeRequest({ origin: 'https://example.com', host: 'chat-interface-r.vercel.app' }),
      { params: Promise.resolve({ widgetKey: 'not-a-valid-key' }) }
    );

    expect(response.status).toBe(403);
    expect(dbQueries.getWidgetByKeyWithUser).not.toHaveBeenCalled();
  });

  it('returns 429 when the IP rate limit is exceeded', async () => {
    rateLimit.checkRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 1 });
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue(n8nWidget());

    const response = await GET(
      makeRequest({ origin: 'https://example.com', host: 'chat-interface-r.vercel.app' }),
      { params: Promise.resolve({ widgetKey: `${widgetKey}.js` }) }
    );

    expect(response.status).toBe(429);
  });

  describe('localhost bypass is gated on NODE_ENV (F6)', () => {
    const savedNodeEnv = process.env.NODE_ENV;
    afterEach(() => {
      // @ts-expect-error NODE_ENV is normally readonly
      process.env.NODE_ENV = savedNodeEnv;
    });

    it('authorizes a localhost request in development', async () => {
      // @ts-expect-error NODE_ENV is normally readonly
      process.env.NODE_ENV = 'development';
      dbQueries.getWidgetByKeyWithUser.mockResolvedValue(
        n8nWidget({ allowedDomains: ['example.com'] })
      );

      const response = await GET(
        makeRequest({ origin: 'http://localhost:3000', host: 'localhost:3000' }),
        { params: Promise.resolve({ widgetKey: `${widgetKey}.js` }) }
      );

      expect(response.status).toBe(200);
    });

    it('rejects a localhost request in production', async () => {
      // @ts-expect-error NODE_ENV is normally readonly
      process.env.NODE_ENV = 'production';
      dbQueries.getWidgetByKeyWithUser.mockResolvedValue(
        n8nWidget({ allowedDomains: ['example.com'] })
      );

      const response = await GET(
        makeRequest({ origin: 'http://localhost:3000', host: 'chat-interface-r.vercel.app' }),
        { params: Promise.resolve({ widgetKey: `${widgetKey}.js` }) }
      );

      expect(response.status).toBe(403);
    });
  });

  it('serves the ChatKit iframe injector for a chatkit widget when the flag is enabled', async () => {
    jest.resetModules();
    jest.doMock('@/lib/feature-flags', () => ({ CHATKIT_SERVER_ENABLED: true }));
    jest.doMock('@/lib/security/rate-limit', () => ({
      checkRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
    }));
    jest.doMock('@/lib/db/queries', () => ({
      getWidgetByKeyWithUser: jest.fn().mockResolvedValue(
        n8nWidget({ widgetType: 'chatkit', allowedDomains: [], user: { id: 'u', tier: 'agency', subscriptionStatus: 'active' } })
      ),
    }));

    const { GET: GetWithChatkit } = require('@/app/w/[widgetKey]/route');
    const response = await GetWithChatkit(
      makeRequest({ origin: 'https://example.com', host: 'chat-interface-r.vercel.app' }),
      { params: Promise.resolve({ widgetKey: `${widgetKey}.js` }) }
    );

    expect(response.status).toBe(200);
    const body = await response.text();
    // ChatKit branch injects an iframe pointed at /chatkit/<key>, NOT the loader.
    expect(body).toContain('chatkit');
    expect(body).not.toContain('/widget/loader.js');

    jest.resetModules();
    jest.dontMock('@/lib/feature-flags');
    jest.dontMock('@/lib/security/rate-limit');
    jest.dontMock('@/lib/db/queries');
  });
});
