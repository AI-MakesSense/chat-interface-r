/**
 * MSW Request Handlers
 *
 * Mock API request handlers for testing.
 * Defines default responses for all API endpoints.
 *
 * Tests can override these handlers using server.use() for specific scenarios.
 */

import { http, HttpResponse } from 'msw';

/**
 * Mock user data
 */
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: false,
  createdAt: '2025-01-01T00:00:00.000Z',
};

/**
 * Mock license data
 */
const mockLicense = {
  id: 'license-123',
  userId: 'user-123',
  licenseKey: 'test-license-key-123',
  tier: 'pro' as const,
  status: 'active' as const,
  domains: ['example.com'],
  domainLimit: 1,
  brandingEnabled: false,
  widgetLimit: null,
  stripeSubscriptionId: 'sub_123',
  expiresAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

/**
 * Mock widget data
 */
const mockWidget = {
  id: 'widget-123',
  licenseId: 'license-123',
  name: 'Test Widget',
  config: {
    branding: {
      companyName: 'Test Company',
      welcomeText: 'Welcome!',
      firstMessage: 'Hello!',
    },
    style: {
      theme: 'light' as const,
      primaryColor: '#00bfff',
      position: 'bottom-right' as const,
      cornerRadius: 12,
    },
    connection: {
      webhookUrl: 'https://n8n.example.com/webhook/test',
    },
  },
  isDeployed: false,
  deployedAt: null,
  deployUrl: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

/**
 * API request handlers
 */
export const handlers = [
  // Authentication endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    // Add small delay to simulate network request and make loading state observable
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate failed login
    if (body.email === 'wrong@example.com') {
      return HttpResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Simulate successful login
    return HttpResponse.json(
      { user: mockUser },
      { status: 200 }
    );
  }),

  http.post('/api/auth/signup', async ({ request }) => {
    const body = await request.json() as { email: string; password: string; name?: string };

    // Add small delay to simulate network request and make loading state observable
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate email already exists
    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Simulate successful signup
    return HttpResponse.json(
      { user: { ...mockUser, email: body.email, name: body.name } },
      { status: 201 }
    );
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
  }),

  http.get('/api/auth/me', () => {
    // Simulate authenticated user
    return HttpResponse.json(
      { user: mockUser },
      { status: 200 }
    );
  }),

  // License endpoints
  http.get('/api/licenses', () => {
    return HttpResponse.json(
      { licenses: [mockLicense] },
      { status: 200 }
    );
  }),

  http.get('/api/licenses/:id', ({ params }) => {
    return HttpResponse.json(
      { license: mockLicense },
      { status: 200 }
    );
  }),

  http.put('/api/licenses/:id', async ({ request, params }) => {
    const body = await request.json() as { domains: string[] };

    return HttpResponse.json(
      { license: { ...mockLicense, domains: body.domains } },
      { status: 200 }
    );
  }),

  http.delete('/api/licenses/:id', () => {
    return HttpResponse.json(
      { message: 'License cancelled successfully' },
      { status: 200 }
    );
  }),

  // Widget endpoints
  http.get('/api/widgets', () => {
    return HttpResponse.json(
      { widgets: [mockWidget] },
      { status: 200 }
    );
  }),

  http.post('/api/widgets', async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json(
      { widget: { ...mockWidget, ...body } },
      { status: 201 }
    );
  }),

  http.get('/api/widgets/:id', ({ params }) => {
    return HttpResponse.json(
      { widget: mockWidget },
      { status: 200 }
    );
  }),

  http.put('/api/widgets/:id', async ({ request, params }) => {
    const body = await request.json();

    return HttpResponse.json(
      { widget: { ...mockWidget, ...body } },
      { status: 200 }
    );
  }),

  http.delete('/api/widgets/:id', () => {
    return HttpResponse.json(
      { message: 'Widget deleted successfully' },
      { status: 200 }
    );
  }),

  http.post('/api/widgets/:id/deploy', ({ params }) => {
    return HttpResponse.json(
      { deployUrl: `https://example.com/widget/${params.id}` },
      { status: 200 }
    );
  }),
];
