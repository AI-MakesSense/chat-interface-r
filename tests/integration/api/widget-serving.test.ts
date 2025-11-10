/**
 * Widget Serving API Integration Tests
 *
 * Endpoint: GET /api/widget/:license/chat-widget.js
 * Purpose: Validates license and serves widget JavaScript with injected configuration
 *
 * Test Strategy (Lean TDD - 10 tests max):
 * 1. Happy path - valid license + valid domain
 * 2. Invalid license key - non-existent
 * 3. Expired license - past expiration date
 * 4. Inactive license - status not 'active'
 * 5. Domain mismatch - request domain not allowed
 * 6. Missing referer - can't validate domain
 * 7. HTTPS enforcement - ensures secure loading (except localhost)
 * 8. License flags injection - branding flags in widget code
 * 9. Content-Type header - application/javascript
 * 10. Widget code structure - IIFE format with config
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db/client';
import { users, licenses, widgets } from '@/lib/db/schema';
import { GET } from '@/app/api/widget/[license]/chat-widget.js/route';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

describe('GET /api/widget/:license/chat-widget.js - Widget Serving', () => {
  // Test data
  let testUser: any;
  let activeLicense: any;
  let expiredLicense: any;
  let cancelledLicense: any;
  let basicLicense: any; // with branding
  let proLicense: any; // white-label

  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(widgets).execute();
    await db.delete(licenses).execute();
    await db.delete(users).where(eq(users.email, 'widgetserve@test.com')).execute();

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        email: 'widgetserve@test.com',
        passwordHash: 'not-used-for-widget-serving',
        name: 'Widget Serve Tester',
        emailVerified: true,
      })
      .returning();
    testUser = user;

    // Create active license (Pro tier, white-label)
    const [active] = await db
      .insert(licenses)
      .values({
        userId: testUser.id,
        licenseKey: crypto.randomBytes(16).toString('hex'),
        tier: 'pro',
        widgetLimit: 3,
        domains: ['example.com', 'test.example.com'],
        domainLimit: 1,
        brandingEnabled: false, // white-label
        status: 'active',
        stripeSubscriptionId: 'sub_active123',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      })
      .returning();
    activeLicense = active;

    // Create expired license
    const [expired] = await db
      .insert(licenses)
      .values({
        userId: testUser.id,
        licenseKey: crypto.randomBytes(16).toString('hex'),
        tier: 'pro',
        widgetLimit: 3,
        domains: ['expired.com'],
        domainLimit: 1,
        brandingEnabled: false,
        status: 'active', // Status is active, but expiresAt is in the past
        stripeSubscriptionId: 'sub_expired123',
        expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      })
      .returning();
    expiredLicense = expired;

    // Create cancelled license
    const [cancelled] = await db
      .insert(licenses)
      .values({
        userId: testUser.id,
        licenseKey: crypto.randomBytes(16).toString('hex'),
        tier: 'basic',
        widgetLimit: 1,
        domains: ['cancelled.com'],
        domainLimit: 1,
        brandingEnabled: true,
        status: 'cancelled', // Explicitly cancelled
        stripeSubscriptionId: 'sub_cancelled123',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      })
      .returning();
    cancelledLicense = cancelled;

    // Create Basic tier license (with branding)
    const [basic] = await db
      .insert(licenses)
      .values({
        userId: testUser.id,
        licenseKey: crypto.randomBytes(16).toString('hex'),
        tier: 'basic',
        widgetLimit: 1,
        domains: ['basic.example.com'],
        domainLimit: 1,
        brandingEnabled: true, // Has branding
        status: 'active',
        stripeSubscriptionId: 'sub_basic123',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      })
      .returning();
    basicLicense = basic;

    // Create Pro tier license (white-label)
    const [pro] = await db
      .insert(licenses)
      .values({
        userId: testUser.id,
        licenseKey: crypto.randomBytes(16).toString('hex'),
        tier: 'pro',
        widgetLimit: 3,
        domains: ['pro.example.com'],
        domainLimit: 1,
        brandingEnabled: false, // White-label
        status: 'active',
        stripeSubscriptionId: 'sub_pro123',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      })
      .returning();
    proLicense = pro;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(widgets).execute();
    await db.delete(licenses).where(eq(licenses.userId, testUser.id)).execute();
    await db.delete(users).where(eq(users.id, testUser.id)).execute();
  });

  // =============================================================================
  // Test 1: Happy Path - Valid License + Valid Domain
  // =============================================================================
  it('should serve widget JavaScript for valid license and domain', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(
      `http://localhost:3000/api/widget/${activeLicense.licenseKey}/chat-widget.js`,
      {
        method: 'GET',
        headers: {
          'Referer': 'https://example.com/contact',
        },
      }
    );

    const response = await GET(request, { params: { license: activeLicense.licenseKey } });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/javascript');

    const widgetCode = await response.text();
    expect(widgetCode).toContain('(function()'); // IIFE pattern
    expect(widgetCode.length).toBeGreaterThan(100); // Not empty
  });

  // =============================================================================
  // Test 2: Invalid License Key
  // =============================================================================
  it('should return 404 for non-existent license key', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(
      'http://localhost:3000/api/widget/invalid-license-key-xyz/chat-widget.js',
      {
        method: 'GET',
        headers: {
          'Referer': 'https://example.com/',
        },
      }
    );

    const response = await GET(request, { params: { license: 'invalid-license-key-xyz' } });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('License not found');
  });

  // =============================================================================
  // Test 3: Expired License
  // =============================================================================
  it('should return 403 for expired license', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(
      `http://localhost:3000/api/widget/${expiredLicense.licenseKey}/chat-widget.js`,
      {
        method: 'GET',
        headers: {
          'Referer': 'https://expired.com/',
        },
      }
    );

    const response = await GET(request, { params: { license: expiredLicense.licenseKey } });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('expired');
  });

  // =============================================================================
  // Test 4: Inactive License (Cancelled)
  // =============================================================================
  it('should return 403 for cancelled license', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(
      `http://localhost:3000/api/widget/${cancelledLicense.licenseKey}/chat-widget.js`,
      {
        method: 'GET',
        headers: {
          'Referer': 'https://cancelled.com/',
        },
      }
    );

    const response = await GET(request, { params: { license: cancelledLicense.licenseKey } });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('not active');
  });

  // =============================================================================
  // Test 5: Domain Mismatch
  // =============================================================================
  it('should return 403 for domain not in allowed list', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(
      `http://localhost:3000/api/widget/${activeLicense.licenseKey}/chat-widget.js`,
      {
        method: 'GET',
        headers: {
          'Referer': 'https://unauthorized-domain.com/',
        },
      }
    );

    const response = await GET(request, { params: { license: activeLicense.licenseKey } });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('domain');
  });

  // =============================================================================
  // Test 6: Missing Referer Header
  // =============================================================================
  it('should return 403 when referer header is missing', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(
      `http://localhost:3000/api/widget/${activeLicense.licenseKey}/chat-widget.js`,
      {
        method: 'GET',
        // No referer header
      }
    );

    const response = await GET(request, { params: { license: activeLicense.licenseKey } });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('Referer');
  });

  // =============================================================================
  // Test 7: HTTPS Enforcement (Allow localhost for development)
  // =============================================================================
  it('should allow HTTP referer for localhost development', async () => {
    // RED: Route doesn't exist yet
    // Update activeLicense to allow localhost
    await db
      .update(licenses)
      .set({ domains: ['example.com', 'localhost'] })
      .where(eq(licenses.id, activeLicense.id)); // Use .id not .licenseKey

    const request = new Request(
      `http://localhost:3000/api/widget/${activeLicense.licenseKey}/chat-widget.js`,
      {
        method: 'GET',
        headers: {
          'Referer': 'http://localhost:3000/test-page',
        },
      }
    );

    const response = await GET(request, { params: { license: activeLicense.licenseKey } });

    // Should succeed for localhost even with HTTP
    expect(response.status).toBe(200);

    // Reset domains back
    await db
      .update(licenses)
      .set({ domains: ['example.com', 'test.example.com'] })
      .where(eq(licenses.id, activeLicense.id)); // Use .id not .licenseKey
  });

  // =============================================================================
  // Test 8: License Flags Injection - Branding
  // =============================================================================
  it('should inject brandingEnabled=true for Basic tier license', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(
      `http://localhost:3000/api/widget/${basicLicense.licenseKey}/chat-widget.js`,
      {
        method: 'GET',
        headers: {
          'Referer': 'https://basic.example.com/',
        },
      }
    );

    const response = await GET(request, { params: { license: basicLicense.licenseKey } });

    expect(response.status).toBe(200);
    const widgetCode = await response.text();

    // Check that branding flag is injected
    expect(widgetCode).toContain('brandingEnabled');
    expect(widgetCode).toContain('true');
  });

  // =============================================================================
  // Test 9: License Flags Injection - White Label
  // =============================================================================
  it('should inject brandingEnabled=false for Pro tier license', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(
      `http://localhost:3000/api/widget/${proLicense.licenseKey}/chat-widget.js`,
      {
        method: 'GET',
        headers: {
          'Referer': 'https://pro.example.com/',
        },
      }
    );

    const response = await GET(request, { params: { license: proLicense.licenseKey } });

    expect(response.status).toBe(200);
    const widgetCode = await response.text();

    // Check that branding flag is injected as false
    expect(widgetCode).toContain('brandingEnabled');
    expect(widgetCode).toContain('false');
  });

  // =============================================================================
  // Test 10: Widget Code Structure - IIFE with Config
  // =============================================================================
  it('should return valid JavaScript IIFE with config injection point', async () => {
    // RED: Route doesn't exist yet
    const request = new Request(
      `http://localhost:3000/api/widget/${activeLicense.licenseKey}/chat-widget.js`,
      {
        method: 'GET',
        headers: {
          'Referer': 'https://example.com/',
        },
      }
    );

    const response = await GET(request, { params: { license: activeLicense.licenseKey } });

    expect(response.status).toBe(200);
    const widgetCode = await response.text();

    // Verify IIFE structure
    expect(widgetCode).toMatch(/\(function\s*\(\)/); // IIFE opening
    expect(widgetCode).toMatch(/}\)\s*\(\)/); // IIFE closing and invocation

    // Verify config injection pattern exists
    expect(widgetCode).toContain('window.ChatWidgetConfig');
  });
});
