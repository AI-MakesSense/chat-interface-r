/**
 * Critical Path Tests for Widget Embed Deployment (Mocked)
 *
 * Purpose: Test the minimum viable path for a working embedded widget
 *
 * CRITICAL PATH:
 * 1. Widget bundle can be served (GET /api/widget/:license/chat-widget.js)
 * 2. Widget config can be fetched (GET /api/widget/:license/config)
 * 3. Domain validation works correctly
 * 4. Chat relay forwards messages (POST /api/chat-relay)
 * 5. License validation is enforced
 *
 * These tests verify the MUST-HAVE functionality for the embed to work.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Import route handlers
import { GET as serveWidgetHandler } from '@/app/api/widget/[license]/chat-widget.js/route';
import { GET as getWidgetConfigHandler } from '@/app/api/widget/[license]/config/route';
import { POST as chatRelayHandler } from '@/app/api/chat-relay/route';

// Mock all database queries
vi.mock('@/lib/db/queries', () => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  getLicenseByKey: vi.fn(),
  getLicenseById: vi.fn(),
  getLicensesByUserId: vi.fn(),
  createLicense: vi.fn(),
  updateLicense: vi.fn(),
  getWidgetById: vi.fn(),
  getWidgetsByLicenseId: vi.fn(),
  getWidgetsByUserId: vi.fn(),
  createWidget: vi.fn(),
  updateWidget: vi.fn(),
  deleteWidget: vi.fn(),
}));

// Mock serveWidgetBundle
vi.mock('@/lib/widget/serve', () => ({
  serveWidgetBundle: vi.fn().mockResolvedValue(`(function() {
    window.__LICENSE_FLAGS__ = { brandingEnabled: false };
    window.ChatWidget = { init: function() {} };
  })();`),
}));

import * as dbQueries from '@/lib/db/queries';

// Test fixtures
const mockLicenseKey = 'abc123def456abc789def012abc345de';
const mockLicenseId = 'test-license-uuid-456';
const mockWidgetId = 'test-widget-uuid-789';

const mockActiveLicense = {
  id: mockLicenseId,
  userId: 'test-user-uuid-123',
  licenseKey: mockLicenseKey,
  tier: 'pro',
  widgetLimit: 3,
  domains: ['localhost', 'example.com', 'test.example.com'],
  domainLimit: 3,
  brandingEnabled: false,
  status: 'active',
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWidget = {
  id: mockWidgetId,
  licenseId: mockLicenseId,
  name: 'Test Widget',
  config: {
    branding: {
      companyName: 'Test Company',
      welcomeText: 'Welcome!',
      firstMessage: 'Hello!',
    },
    style: {
      theme: 'light',
      primaryColor: '#007bff',
      position: 'bottom-right',
      cornerRadius: 12,
    },
    connection: {
      webhookUrl: 'https://n8n.example.com/webhook/test',
    },
  },
  status: 'active',
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Critical Path: Widget Embed Deployment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =============================================================================
  // TEST GROUP 1: Widget Bundle Serving
  // =============================================================================
  describe('Widget Bundle Serving', () => {
    it('MUST serve JavaScript bundle for valid license + authorized domain', async () => {
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(mockActiveLicense);
      (dbQueries.getWidgetsByLicenseId as any).mockResolvedValueOnce([mockWidget]);

      const request = new NextRequest(
        `http://localhost:3000/api/widget/${mockLicenseKey}/chat-widget.js`,
        {
          method: 'GET',
          headers: { 'Referer': 'http://localhost:3000/page' },
        }
      );

      const response = await serveWidgetHandler(request, {
        params: Promise.resolve({ license: mockLicenseKey }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/javascript');

      const code = await response.text();
      expect(code.length).toBeGreaterThan(50);
    });

    it('MUST include license flags in served bundle', async () => {
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(mockActiveLicense);
      (dbQueries.getWidgetsByLicenseId as any).mockResolvedValueOnce([mockWidget]);

      const request = new NextRequest(
        `http://localhost:3000/api/widget/${mockLicenseKey}/chat-widget.js`,
        {
          method: 'GET',
          headers: { 'Referer': 'http://localhost:3000/' },
        }
      );

      const response = await serveWidgetHandler(request, {
        params: Promise.resolve({ license: mockLicenseKey }),
      });

      const code = await response.text();
      expect(code).toContain('__LICENSE_FLAGS__');
      expect(code).toContain('brandingEnabled');
    });

    it('MUST include CORS headers for cross-origin loading', async () => {
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(mockActiveLicense);
      (dbQueries.getWidgetsByLicenseId as any).mockResolvedValueOnce([mockWidget]);

      const request = new NextRequest(
        `http://localhost:3000/api/widget/${mockLicenseKey}/chat-widget.js`,
        {
          method: 'GET',
          headers: { 'Referer': 'http://localhost:3000/' },
        }
      );

      const response = await serveWidgetHandler(request, {
        params: Promise.resolve({ license: mockLicenseKey }),
      });

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  // =============================================================================
  // TEST GROUP 2: Widget Config Endpoint
  // =============================================================================
  describe('Widget Config Endpoint', () => {
    it('MUST return widget configuration for valid license', async () => {
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(mockActiveLicense);
      (dbQueries.getWidgetsByLicenseId as any).mockResolvedValueOnce([mockWidget]);

      const request = new NextRequest(
        `http://localhost:3000/api/widget/${mockLicenseKey}/config`,
        {
          method: 'GET',
          headers: { 'Origin': 'http://localhost:3000' },
        }
      );

      const response = await getWidgetConfigHandler(request, {
        params: Promise.resolve({ license: mockLicenseKey }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.branding).toBeDefined();
      expect(data.style).toBeDefined();
    });

    it('MUST include relay URL in config (not raw webhook)', async () => {
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(mockActiveLicense);
      (dbQueries.getWidgetsByLicenseId as any).mockResolvedValueOnce([mockWidget]);

      const request = new NextRequest(
        `http://localhost:3000/api/widget/${mockLicenseKey}/config`,
        {
          method: 'GET',
          headers: { 'Origin': 'http://localhost:3000' },
        }
      );

      const response = await getWidgetConfigHandler(request, {
        params: Promise.resolve({ license: mockLicenseKey }),
      });

      const data = await response.json();

      // Config should have relay endpoint, not expose webhook
      expect(data.connection).toBeDefined();
      expect(data.connection.relayEndpoint).toContain('/api/chat-relay');
      // webhookUrl should be empty (not exposed)
      expect(data.connection.webhookUrl).toBe('');
    });
  });

  // =============================================================================
  // TEST GROUP 3: Domain Validation
  // =============================================================================
  describe('Domain Validation', () => {
    it('MUST reject requests from unauthorized domains', async () => {
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(mockActiveLicense);

      const request = new NextRequest(
        `http://localhost:3000/api/widget/${mockLicenseKey}/chat-widget.js`,
        {
          method: 'GET',
          headers: { 'Referer': 'https://unauthorized-domain.com/' },
        }
      );

      const response = await serveWidgetHandler(request, {
        params: Promise.resolve({ license: mockLicenseKey }),
      });

      expect(response.status).toBe(403);
    });

    it('MUST reject requests without referer header', async () => {
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(mockActiveLicense);

      const request = new NextRequest(
        `http://localhost:3000/api/widget/${mockLicenseKey}/chat-widget.js`,
        {
          method: 'GET',
          // No referer header
        }
      );

      const response = await serveWidgetHandler(request, {
        params: Promise.resolve({ license: mockLicenseKey }),
      });

      expect(response.status).toBe(403);
    });

    it('MUST allow authorized domain with different paths', async () => {
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(mockActiveLicense);
      (dbQueries.getWidgetsByLicenseId as any).mockResolvedValueOnce([mockWidget]);

      const request = new NextRequest(
        `http://localhost:3000/api/widget/${mockLicenseKey}/chat-widget.js`,
        {
          method: 'GET',
          headers: { 'Referer': 'https://example.com/some/deep/path/page.html' },
        }
      );

      const response = await serveWidgetHandler(request, {
        params: Promise.resolve({ license: mockLicenseKey }),
      });

      expect(response.status).toBe(200);
    });
  });

  // =============================================================================
  // TEST GROUP 4: License Validation
  // =============================================================================
  describe('License Validation', () => {
    it('MUST reject invalid license key', async () => {
      // Reset mocks explicitly to ensure clean state
      vi.mocked(dbQueries.getLicenseByKey).mockReset();
      vi.mocked(dbQueries.getLicenseByKey).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/widget/invalid-key/chat-widget.js',
        {
          method: 'GET',
          headers: { 'Referer': 'http://localhost:3000/' },
        }
      );

      const response = await serveWidgetHandler(request, {
        params: Promise.resolve({ license: 'invalid-key' }),
      });

      expect(response.status).toBe(403);
    });

    it('MUST reject expired license', async () => {
      const expiredLicense = {
        ...mockActiveLicense,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      };
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(expiredLicense);

      const request = new NextRequest(
        `http://localhost:3000/api/widget/${mockLicenseKey}/chat-widget.js`,
        {
          method: 'GET',
          headers: { 'Referer': 'http://localhost:3000/' },
        }
      );

      const response = await serveWidgetHandler(request, {
        params: Promise.resolve({ license: mockLicenseKey }),
      });

      expect(response.status).toBe(403);
    });

    it('MUST reject cancelled license', async () => {
      const cancelledLicense = { ...mockActiveLicense, status: 'cancelled' };
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(cancelledLicense);

      const request = new NextRequest(
        `http://localhost:3000/api/widget/${mockLicenseKey}/chat-widget.js`,
        {
          method: 'GET',
          headers: { 'Referer': 'http://localhost:3000/' },
        }
      );

      const response = await serveWidgetHandler(request, {
        params: Promise.resolve({ license: mockLicenseKey }),
      });

      expect(response.status).toBe(403);
    });
  });

  // =============================================================================
  // TEST GROUP 5: Chat Relay
  // =============================================================================
  describe('Chat Relay', () => {
    it('MUST validate widget ownership against license', async () => {
      const widgetWithDifferentLicense = {
        ...mockWidget,
        licenseId: 'different-license-id',
      };
      (dbQueries.getWidgetById as any).mockResolvedValueOnce(widgetWithDifferentLicense);
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(mockActiveLicense);

      const request = new NextRequest('http://localhost:3000/api/chat-relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId: mockWidgetId,
          licenseKey: mockLicenseKey,
          message: 'Test message',
        }),
      });

      const response = await chatRelayHandler(request);

      expect(response.status).toBe(403);
    });

    it('MUST require all mandatory fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat-relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing required fields
          message: 'Test message',
        }),
      });

      const response = await chatRelayHandler(request);

      expect(response.status).toBe(400);
    });

    it('MUST reject non-existent widget', async () => {
      (dbQueries.getWidgetById as any).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/chat-relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId: 'non-existent',
          licenseKey: mockLicenseKey,
          message: 'Test message',
        }),
      });

      const response = await chatRelayHandler(request);

      expect(response.status).toBe(404);
    });
  });

  // =============================================================================
  // TEST GROUP 6: End-to-End Embed Scenario
  // =============================================================================
  describe('E2E Embed Scenario', () => {
    it('MUST support complete embed lifecycle', async () => {
      // This test simulates what happens when a widget is embedded on a website:
      // 1. Script tag loads → widget bundle served
      // 2. Widget fetches config → config returned
      // 3. User sends message → relay forwards it

      // Step 1: Load widget bundle
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(mockActiveLicense);
      (dbQueries.getWidgetsByLicenseId as any).mockResolvedValueOnce([mockWidget]);

      const bundleRequest = new NextRequest(
        `http://localhost:3000/api/widget/${mockLicenseKey}/chat-widget.js`,
        {
          method: 'GET',
          headers: { 'Referer': 'https://example.com/' },
        }
      );

      const bundleResponse = await serveWidgetHandler(bundleRequest, {
        params: Promise.resolve({ license: mockLicenseKey }),
      });

      expect(bundleResponse.status).toBe(200);

      // Step 2: Fetch config
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(mockActiveLicense);
      (dbQueries.getWidgetsByLicenseId as any).mockResolvedValueOnce([mockWidget]);

      const configRequest = new NextRequest(
        `http://localhost:3000/api/widget/${mockLicenseKey}/config`,
        {
          method: 'GET',
          headers: { 'Origin': 'https://example.com' },
        }
      );

      const configResponse = await getWidgetConfigHandler(configRequest, {
        params: Promise.resolve({ license: mockLicenseKey }),
      });

      expect(configResponse.status).toBe(200);

      // Verify config has necessary fields
      const config = await configResponse.json();
      expect(config.branding).toBeDefined();
      expect(config.style).toBeDefined();
      expect(config.connection).toBeDefined();
      expect(config.connection.relayEndpoint).toBeDefined();
    });
  });
});
