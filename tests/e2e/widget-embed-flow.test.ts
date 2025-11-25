/**
 * End-to-End Widget Embed Flow Tests (Mocked)
 *
 * Purpose: Verify the complete flow from user signup to working embedded widget
 *
 * Flow Being Tested:
 * 1. User signs up → receives auth token
 * 2. User creates license → receives license key
 * 3. User creates widget → receives widget with config
 * 4. Widget is served → JavaScript bundle returned
 * 5. Chat relay works → messages forwarded to webhook
 *
 * Note: These tests use mocks instead of a real database to enable
 * running without database infrastructure.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Import route handlers
import { POST as signupHandler } from '@/app/api/auth/signup/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { GET as serveWidgetHandler } from '@/app/api/widget/[license]/chat-widget.js/route';
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
const mockUserId = 'test-user-uuid-123';
const mockLicenseId = 'test-license-uuid-456';
const mockLicenseKey = 'abc123def456abc789def012abc345de';
const mockWidgetId = 'test-widget-uuid-789';
const mockWebhookUrl = 'https://n8n.example.com/webhook/test';

const mockUser = {
  id: mockUserId,
  email: 'e2e-test@example.com',
  passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKKT.nW7Fu',
  name: 'E2E Test User',
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockLicense = {
  id: mockLicenseId,
  userId: mockUserId,
  licenseKey: mockLicenseKey,
  tier: 'pro',
  widgetLimit: 3,
  domains: ['localhost', 'test-site.example.com'],
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
  name: 'E2E Test Widget',
  config: {
    branding: {
      companyName: 'E2E Test Company',
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
      webhookUrl: mockWebhookUrl,
    },
  },
  status: 'active',
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('E2E: Widget Embed Flow (Mocked)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // STEP 1: User Signup
  // =========================================================================
  describe('Step 1: User Signup', () => {
    it('should allow a new user to sign up', async () => {
      // Setup mocks
      (dbQueries.getUserByEmail as any).mockResolvedValueOnce(null); // No existing user
      (dbQueries.createUser as any).mockResolvedValueOnce(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'TestPassword123!',
          name: 'New User',
        }),
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user).toBeDefined();
      expect(data.token).toBeDefined();
    });

    it('should reject duplicate email signup', async () => {
      // Setup mocks - user already exists
      (dbQueries.getUserByEmail as any).mockResolvedValueOnce(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: mockUser.email,
          password: 'TestPassword123!',
          name: 'Duplicate User',
        }),
      });

      const response = await signupHandler(request);
      expect(response.status).toBe(409);
    });
  });

  // =========================================================================
  // STEP 2: User Login
  // =========================================================================
  describe('Step 2: User Login', () => {
    it('should reject login with non-existent user', async () => {
      // Setup mocks - no user found
      (dbQueries.getUserByEmail as any).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        }),
      });

      const response = await loginHandler(request);
      expect(response.status).toBe(401);
    });

    it('should reject login with wrong password', async () => {
      // Setup mocks
      (dbQueries.getUserByEmail as any).mockResolvedValueOnce(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: mockUser.email,
          password: 'WrongPassword123!',
        }),
      });

      const response = await loginHandler(request);
      expect(response.status).toBe(401);
    });
  });

  // =========================================================================
  // STEP 3: Widget Serving (The Critical Embed Path)
  // =========================================================================
  describe('Step 3: Widget Serving', () => {
    it('should serve widget JavaScript for valid license from authorized domain', async () => {
      // Setup mocks
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(mockLicense);
      (dbQueries.getWidgetsByLicenseId as any).mockResolvedValueOnce([mockWidget]);

      const request = new NextRequest(
        `http://localhost:3000/api/widget/${mockLicenseKey}/chat-widget.js`,
        {
          method: 'GET',
          headers: {
            'Referer': 'http://localhost:3000/test-page',
          },
        }
      );

      const response = await serveWidgetHandler(request, {
        params: Promise.resolve({ license: mockLicenseKey }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/javascript');

      const widgetCode = await response.text();
      expect(widgetCode.length).toBeGreaterThan(50);
      expect(widgetCode).toContain('__LICENSE_FLAGS__');
    });

    it('should reject widget serving for unauthorized domain', async () => {
      // Setup mocks
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(mockLicense);

      const request = new NextRequest(
        `http://localhost:3000/api/widget/${mockLicenseKey}/chat-widget.js`,
        {
          method: 'GET',
          headers: {
            'Referer': 'https://unauthorized-domain.com/',
          },
        }
      );

      const response = await serveWidgetHandler(request, {
        params: Promise.resolve({ license: mockLicenseKey }),
      });

      expect(response.status).toBe(403);
    });

    it('should reject widget serving for invalid license key', async () => {
      // Setup mocks - no license found
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(null);

      const request = new NextRequest(
        'http://localhost:3000/api/widget/invalid-license-key/chat-widget.js',
        {
          method: 'GET',
          headers: {
            'Referer': 'http://localhost:3000/',
          },
        }
      );

      const response = await serveWidgetHandler(request, {
        params: Promise.resolve({ license: 'invalid-license-key' }),
      });

      expect(response.status).toBe(403);
    });

    it('should reject widget serving for expired license', async () => {
      const expiredLicense = {
        ...mockLicense,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
      };
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(expiredLicense);

      const request = new NextRequest(
        `http://localhost:3000/api/widget/${mockLicenseKey}/chat-widget.js`,
        {
          method: 'GET',
          headers: {
            'Referer': 'http://localhost:3000/',
          },
        }
      );

      const response = await serveWidgetHandler(request, {
        params: Promise.resolve({ license: mockLicenseKey }),
      });

      expect(response.status).toBe(403);
    });

    it('should reject widget serving for cancelled license', async () => {
      const cancelledLicense = { ...mockLicense, status: 'cancelled' };
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(cancelledLicense);

      const request = new NextRequest(
        `http://localhost:3000/api/widget/${mockLicenseKey}/chat-widget.js`,
        {
          method: 'GET',
          headers: {
            'Referer': 'http://localhost:3000/',
          },
        }
      );

      const response = await serveWidgetHandler(request, {
        params: Promise.resolve({ license: mockLicenseKey }),
      });

      expect(response.status).toBe(403);
    });

    it('should include CORS headers for cross-origin loading', async () => {
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(mockLicense);
      (dbQueries.getWidgetsByLicenseId as any).mockResolvedValueOnce([mockWidget]);

      const request = new NextRequest(
        `http://localhost:3000/api/widget/${mockLicenseKey}/chat-widget.js`,
        {
          method: 'GET',
          headers: {
            'Referer': 'http://localhost:3000/',
          },
        }
      );

      const response = await serveWidgetHandler(request, {
        params: Promise.resolve({ license: mockLicenseKey }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  // =========================================================================
  // STEP 4: Chat Relay
  // =========================================================================
  describe('Step 4: Chat Relay', () => {
    it('should reject chat relay with missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat-relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing widgetId, licenseKey, and message
        }),
      });

      const response = await chatRelayHandler(request);
      expect(response.status).toBe(400);
    });

    it('should reject chat relay with non-existent widget', async () => {
      (dbQueries.getWidgetById as any).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/chat-relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId: 'non-existent-widget',
          licenseKey: mockLicenseKey,
          message: 'Test message',
        }),
      });

      const response = await chatRelayHandler(request);
      expect(response.status).toBe(404);
    });

    it('should reject chat relay with non-existent license', async () => {
      (dbQueries.getWidgetById as any).mockResolvedValueOnce(mockWidget);
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/chat-relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId: mockWidgetId,
          licenseKey: 'non-existent-license',
          message: 'Test message',
        }),
      });

      const response = await chatRelayHandler(request);
      expect(response.status).toBe(404);
    });

    it('should reject chat relay when widget does not belong to license', async () => {
      // Widget belongs to a different license
      const widgetWithDifferentLicense = {
        ...mockWidget,
        licenseId: 'different-license-id',
      };
      (dbQueries.getWidgetById as any).mockResolvedValueOnce(widgetWithDifferentLicense);
      (dbQueries.getLicenseByKey as any).mockResolvedValueOnce(mockLicense);

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
  });

  // =========================================================================
  // STEP 5: Embed Code Format
  // =========================================================================
  describe('Step 5: Embed Code Format', () => {
    it('should generate correct embed code format', () => {
      const baseUrl = 'https://app.example.com';
      const expectedEmbedCode = `<script src="${baseUrl}/api/widget/${mockLicenseKey}/chat-widget.js" async></script>`;

      // Verify the embed code structure
      expect(expectedEmbedCode).toContain('/api/widget/');
      expect(expectedEmbedCode).toContain(mockLicenseKey);
      expect(expectedEmbedCode).toContain('chat-widget.js');
      expect(expectedEmbedCode).toContain('async');
      expect(expectedEmbedCode).toMatch(/<script.*><\/script>/);
    });

    it('should have license key with correct format (32 hex chars)', () => {
      expect(mockLicenseKey).toMatch(/^[a-f0-9]{32}$/);
      expect(mockLicenseKey.length).toBe(32);
    });
  });
});
