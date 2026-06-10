/**
 * @jest-environment node
 *
 * Unit tests for lib/widget/resolve-widget.ts
 *
 * All DB access is mocked — this is a pure unit test.
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

jest.mock('@/lib/db/queries', () => ({
  getWidgetByKeyWithUser: jest.fn(),
}));

// Import AFTER mocks are registered
const dbQueries = require('@/lib/db/queries');
const {
  resolveAuthorizedWidget,
  isDomainAllowed,
  isSubscriptionActive,
} = require('@/lib/widget/resolve-widget');

// ── Helpers ──────────────────────────────────────────────────────────────────

const VALID_KEY = 'ABCD1234EFGH5678'; // exactly 16 alphanumeric chars

function makeWidget(overrides: Record<string, any> = {}) {
  return {
    id: 'widget-1',
    widgetKey: VALID_KEY,
    name: 'Test Widget',
    status: 'active',
    allowedDomains: ['example.com'],
    config: {},
    user: {
      id: 'user-1',
      tier: 'pro',
      subscriptionStatus: 'active',
    },
    ...overrides,
  };
}

// ── resolveAuthorizedWidget ───────────────────────────────────────────────────

describe('resolveAuthorizedWidget', () => {
  const savedNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = savedNodeEnv;
  });

  it('resolves an active widget for an allowed domain', async () => {
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue(makeWidget());

    const result = await resolveAuthorizedWidget(VALID_KEY, 'example.com', 'api.myapp.com');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.widget.widgetKey).toBe(VALID_KEY);
      expect(result.user.tier).toBe('pro');
    }
  });

  it('returns 404 for a key that does not match the 16-char alphanumeric pattern', async () => {
    const result = await resolveAuthorizedWidget('short', 'example.com', 'host');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
      expect(result.error).toBe('Widget not found');
    }
    // DB was never called
    expect(dbQueries.getWidgetByKeyWithUser).not.toHaveBeenCalled();
  });

  it('returns 404 for a valid-pattern key that resolves to nothing in the DB', async () => {
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue(null);

    const result = await resolveAuthorizedWidget(VALID_KEY, 'example.com', 'host');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
      expect(result.error).toBe('Widget not found');
    }
  });

  it('returns 403 for a paused widget', async () => {
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue(makeWidget({ status: 'paused' }));

    const result = await resolveAuthorizedWidget(VALID_KEY, 'example.com', 'host');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.error).toBe('Widget is not active');
    }
  });

  it('returns 403 when subscription is canceled and past period end', async () => {
    const pastDate = new Date(Date.now() - 1000).toISOString();
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue(
      makeWidget({
        user: {
          id: 'user-1',
          tier: 'pro',
          subscriptionStatus: 'canceled',
          currentPeriodEnd: pastDate,
        },
      })
    );

    const result = await resolveAuthorizedWidget(VALID_KEY, 'example.com', 'host');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.error).toBe('Subscription is not active');
    }
  });

  it('returns 403 when origin/referer is missing (requestDomain is null)', async () => {
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue(makeWidget());

    const result = await resolveAuthorizedWidget(VALID_KEY, null, 'api.myapp.com');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.error).toBe('Origin or referer header is required');
    }
  });

  it('returns 403 when domain is not in the allowedDomains list (non-agency)', async () => {
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue(
      makeWidget({ allowedDomains: ['example.com'] })
    );

    const result = await resolveAuthorizedWidget(VALID_KEY, 'evil.com', 'api.myapp.com');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.error).toBe('Domain not authorized for this widget');
    }
  });

  it('agency tier bypasses domain restriction', async () => {
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue(
      makeWidget({
        allowedDomains: ['example.com'],
        user: { id: 'user-1', tier: 'agency', subscriptionStatus: 'active' },
      })
    );

    // 'evil.com' is not in allowedDomains, but agency bypasses
    const result = await resolveAuthorizedWidget(VALID_KEY, 'evil.com', 'api.myapp.com');

    expect(result.ok).toBe(true);
  });

  it('empty allowedDomains allows any domain', async () => {
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue(
      makeWidget({ allowedDomains: [] })
    );

    const result = await resolveAuthorizedWidget(VALID_KEY, 'any-domain.io', 'api.myapp.com');

    expect(result.ok).toBe(true);
  });

  it('allows localhost in development (NODE_ENV !== production)', async () => {
    process.env.NODE_ENV = 'development';
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue(
      makeWidget({ allowedDomains: ['example.com'] })
    );

    const result = await resolveAuthorizedWidget(VALID_KEY, 'localhost', 'api.myapp.com');

    expect(result.ok).toBe(true);
  });

  it('rejects localhost in production (NODE_ENV === production)', async () => {
    process.env.NODE_ENV = 'production';
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue(
      makeWidget({ allowedDomains: ['example.com'] })
    );

    const result = await resolveAuthorizedWidget(VALID_KEY, 'localhost', 'api.myapp.com');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
    }
  });
});

// ── isDomainAllowed ───────────────────────────────────────────────────────────

describe('isDomainAllowed', () => {
  const savedNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = savedNodeEnv;
  });

  it('allows any domain for agency tier regardless of list', () => {
    expect(isDomainAllowed('evil.com', ['example.com'], 'agency', 'api.myapp.com')).toBe(true);
  });

  it('allows any domain when allowedDomains is empty', () => {
    expect(isDomainAllowed('any.io', [], 'pro', 'api.myapp.com')).toBe(true);
  });

  it('allows exact domain match', () => {
    expect(isDomainAllowed('example.com', ['example.com'], 'pro', 'other.host')).toBe(true);
  });

  it('allows subdomain match', () => {
    expect(isDomainAllowed('sub.example.com', ['example.com'], 'pro', 'other.host')).toBe(true);
  });

  it('rejects non-matching domain', () => {
    expect(isDomainAllowed('evil.com', ['example.com'], 'pro', 'other.host')).toBe(false);
  });

  it('allows first-party request (origin === host)', () => {
    // request is from the same host as the server — first-party bypass
    expect(isDomainAllowed('myapp.com', ['example.com'], 'pro', 'myapp.com')).toBe(true);
  });
});

// ── isSubscriptionActive ─────────────────────────────────────────────────────

describe('isSubscriptionActive', () => {
  it('returns true for active status', () => {
    expect(isSubscriptionActive({ subscriptionStatus: 'active' })).toBe(true);
  });

  it('returns true for past_due status', () => {
    expect(isSubscriptionActive({ subscriptionStatus: 'past_due' })).toBe(true);
  });

  it('returns true for canceled status within period end', () => {
    const future = new Date(Date.now() + 86400_000).toISOString();
    expect(isSubscriptionActive({ subscriptionStatus: 'canceled', currentPeriodEnd: future })).toBe(true);
  });

  it('returns false for canceled status past period end', () => {
    const past = new Date(Date.now() - 86400_000).toISOString();
    expect(isSubscriptionActive({ subscriptionStatus: 'canceled', currentPeriodEnd: past })).toBe(false);
  });

  it('defaults to active when subscriptionStatus is absent', () => {
    expect(isSubscriptionActive({})).toBe(true);
  });

  it('returns false for unknown status', () => {
    expect(isSubscriptionActive({ subscriptionStatus: 'unknown_status' })).toBe(false);
  });
});
