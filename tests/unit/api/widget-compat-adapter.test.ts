/**
 * @jest-environment node
 *
 * Coverage for app/api/widget/[license]/chat-widget.js/route.ts (legacy compat adapter).
 *
 * The legacy embed URL carries only a license key, not a widget identity. Since
 * schema v2 dropped widgets.licenseId, the adapter can only resolve a widget
 * safely when the license owner has EXACTLY ONE active widget. With 2+ active
 * widgets the adapter must fail closed (JS-comment 404 + warn) instead of
 * silently serving the wrong widget.
 *
 * Every 404 test reads the response body: the 404 is produced by a per-request
 * factory (jsUnavailable()), and consuming the body in each test regression-tests
 * that no shared one-shot Response is reused across requests.
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

jest.mock('@/lib/db/queries', () => ({
  getLicenseByKey: jest.fn(),
  getActiveWidgetsForUser: jest.fn(),
}));

const { NextRequest } = require('next/server');
const { GET } = require('@/app/api/widget/[license]/chat-widget.js/route');
const dbQueries = require('@/lib/db/queries');

const LICENSE_KEY = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

function buildRequest(licenseKey: string) {
  return new NextRequest(
    `https://app.example.com/api/widget/${licenseKey}/chat-widget.js`,
    { method: 'GET' }
  );
}

function callRoute(licenseKey: string) {
  return GET(buildRequest(licenseKey), {
    params: Promise.resolve({ license: licenseKey }),
  });
}

function activeLicense(overrides: Record<string, any> = {}) {
  return {
    id: 'license-1',
    userId: 'user-1',
    licenseKey: LICENSE_KEY,
    status: 'active',
    ...overrides,
  };
}

function widget(overrides: Record<string, any> = {}) {
  return {
    id: 'w1',
    userId: 'user-1',
    widgetKey: 'AAAAAAAAAAAAAAAA',
    status: 'active',
    ...overrides,
  };
}

describe('Legacy Widget Compat Adapter (GET /api/widget/[license]/chat-widget.js)', () => {
  let warnSpy: any;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns JS-comment 404 when the user has more than one active widget (ambiguous legacy embed)', async () => {
    dbQueries.getLicenseByKey.mockResolvedValue(activeLicense());
    dbQueries.getActiveWidgetsForUser.mockResolvedValue([
      widget({ id: 'w1', widgetKey: 'AAAAAAAAAAAAAAAA' }),
      widget({ id: 'w2', widgetKey: 'BBBBBBBBBBBBBBBB' }),
    ]);

    const res = await callRoute(LICENSE_KEY);

    expect(res.status).toBe(404);
    expect(await res.text()).toContain('widget unavailable');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain('ambiguous');
  });

  it('serves the bootstrap when the user has exactly one active widget', async () => {
    dbQueries.getLicenseByKey.mockResolvedValue(activeLicense());
    dbQueries.getActiveWidgetsForUser.mockResolvedValue([
      widget({ id: 'w1', widgetKey: 'AAAAAAAAAAAAAAAA' }),
    ]);

    const res = await callRoute(LICENSE_KEY);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/javascript');

    const body = await res.text();
    expect(body).toContain('AAAAAAAAAAAAAAAA');
    expect(body).toContain('/widget/loader.js');
    expect(body).toContain('data-widget-key');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('returns 404 without a warn when the user has zero active widgets', async () => {
    dbQueries.getLicenseByKey.mockResolvedValue(activeLicense());
    dbQueries.getActiveWidgetsForUser.mockResolvedValue([]);

    const res = await callRoute(LICENSE_KEY);

    expect(res.status).toBe(404);
    expect(await res.text()).toContain('widget unavailable');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('returns 404 when the license is not active', async () => {
    dbQueries.getLicenseByKey.mockResolvedValue(activeLicense({ status: 'cancelled' }));

    const res = await callRoute(LICENSE_KEY);

    expect(res.status).toBe(404);
    expect(await res.text()).toContain('widget unavailable');
    expect(dbQueries.getActiveWidgetsForUser).not.toHaveBeenCalled();
  });

  it('returns 404 when the license does not exist', async () => {
    dbQueries.getLicenseByKey.mockResolvedValue(null);

    const res = await callRoute('nonexistent-license-key');

    expect(res.status).toBe(404);
    expect(await res.text()).toContain('widget unavailable');
    expect(dbQueries.getActiveWidgetsForUser).not.toHaveBeenCalled();
  });

  it('returns 404 when the single active widget has no widgetKey', async () => {
    dbQueries.getLicenseByKey.mockResolvedValue(activeLicense());
    dbQueries.getActiveWidgetsForUser.mockResolvedValue([widget({ widgetKey: null })]);

    const res = await callRoute(LICENSE_KEY);

    expect(res.status).toBe(404);
    expect(await res.text()).toContain('widget unavailable');
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
