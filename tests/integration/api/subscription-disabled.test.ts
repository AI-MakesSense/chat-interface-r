/**
 * @jest-environment node
 *
 * Subscription routes — BILLING_ENABLED=false (default) gate tests
 *
 * Verifies that POST /api/account/subscription/upgrade and
 * POST /api/account/subscription/cancel both return 501 when billing is
 * disabled, and that no db.update call (tier mutation) occurs.
 *
 * Pattern: mock all DB / auth dependencies BEFORE importing route modules
 * (jest.mock is hoisted to the top of the file). The feature-flag module is
 * NOT mocked — we exercise the real flag logic with the env var unset (the
 * CI/test environment never sets BILLING_ENABLED, so parseBooleanFlag returns
 * false by default).
 */

import { describe, it, expect, jest } from '@jest/globals';

// ── Mock dependencies before any route import ───────────────────────────────

jest.mock('@/lib/auth/guard', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/db/queries', () => ({
  getUserById: jest.fn(),
}));

// Mock the DB client so drizzle is never initialised (no DATABASE_URL needed).
// The routes no longer call db directly but mock it anyway for safety.
jest.mock('@/lib/db/client', () => ({
  db: {
    update: jest.fn(),
  },
}));

// ── Import route handlers AFTER mocks are registered ────────────────────────
// Use require() so jest.mock hoisting works correctly.
const { NextRequest } = require('next/server');
const upgradeRoute = require('@/app/api/account/subscription/upgrade/route');
const cancelRoute = require('@/app/api/account/subscription/cancel/route');
const dbClient = require('@/lib/db/client');

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePostRequest(path: string): typeof NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST',
    body: JSON.stringify({ tier: 'pro' }),
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('subscription routes with billing disabled (BILLING_ENABLED unset)', () => {
  it('POST /upgrade returns 501 with billing-disabled message', async () => {
    const req = makePostRequest('/api/account/subscription/upgrade');
    const res = await upgradeRoute.POST(req);

    expect(res.status).toBe(501);

    const body = await res.json();
    expect(body.error).toMatch(/billing is not enabled/i);
  });

  it('POST /cancel returns 501 with billing-disabled message', async () => {
    const req = makePostRequest('/api/account/subscription/cancel');
    const res = await cancelRoute.POST(req);

    expect(res.status).toBe(501);

    const body = await res.json();
    expect(body.error).toMatch(/billing is not enabled/i);
  });

  it('db.update is never called on upgrade (no tier mutation without payment)', async () => {
    // Reset and spy on db.update to confirm no tier mutation occurs
    const updateSpy = dbClient.db.update as jest.Mock;
    updateSpy.mockClear();

    const req = makePostRequest('/api/account/subscription/upgrade');
    await upgradeRoute.POST(req);

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('db.update is never called on cancel (no status mutation without Stripe)', async () => {
    const updateSpy = dbClient.db.update as jest.Mock;
    updateSpy.mockClear();

    const req = makePostRequest('/api/account/subscription/cancel');
    await cancelRoute.POST(req);

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('requireAuth is NOT called for upgrade when billing is disabled (501 fires first)', async () => {
    const requireAuth = require('@/lib/auth/guard').requireAuth as jest.Mock;
    requireAuth.mockClear();

    const req = makePostRequest('/api/account/subscription/upgrade');
    await upgradeRoute.POST(req);

    expect(requireAuth).not.toHaveBeenCalled();
  });

  it('requireAuth is NOT called for cancel when billing is disabled (501 fires first)', async () => {
    const requireAuth = require('@/lib/auth/guard').requireAuth as jest.Mock;
    requireAuth.mockClear();

    const req = makePostRequest('/api/account/subscription/cancel');
    await cancelRoute.POST(req);

    expect(requireAuth).not.toHaveBeenCalled();
  });
});
