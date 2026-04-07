/**
 * MSW Request Handlers
 *
 * Mock API request handlers for testing.
 * Defines default responses for all API endpoints.
 *
 * Tests can override these handlers using server.use() for specific scenarios.
 */

import { rest } from 'msw';

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
  rest.post('/api/auth/login', async (req, res, ctx) => {
    const body = await req.json() as { email: string; password: string };

    // Add small delay to simulate network request and make loading state observable
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate failed login
    if (body.email === 'wrong@example.com') {
      return res(
        ctx.status(401),
        ctx.json({ error: 'Invalid credentials' })
      );
    }

    // Simulate successful login
    return res(
      ctx.status(200),
      ctx.json({ user: mockUser })
    );
  }),

  rest.post('/api/auth/signup', async (req, res, ctx) => {
    const body = await req.json() as { email: string; password: string; name?: string };

    // Add small delay to simulate network request and make loading state observable
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate email already exists
    if (body.email === 'existing@example.com') {
      return res(
        ctx.status(409),
        ctx.json({ error: 'Email already exists' })
      );
    }

    // Simulate successful signup
    return res(
      ctx.status(201),
      ctx.json({ user: { ...mockUser, email: body.email, name: body.name } })
    );

  }),

  rest.post('/api/auth/logout', () => {
    return res(
      ctx.status(200),
      ctx.json({ message: 'Logged out successfully' })
    );
  }),

  rest.get('/api/auth/me', () => {
    // Simulate authenticated user
    return res(ctx.json(
      { user: mockUser },
      { status: 200 }
    );
  }),

  // License endpoints
  rest.get('/api/licenses', () => {
    return res(ctx.json(
      { licenses: [mockLicense] },
      { status: 200 }
    );
  }),

  rest.get('/api/licenses/:id', ({ params }) => {
    return res(ctx.json(
      { license: mockLicense },
      { status: 200 }
    );
  }),

  rest.put('/api/licenses/:id', async ({ request, params }) => {
    const body = await request.json() as { domains: string[] };

    return res(ctx.json(
      { license: { ...mockLicense, domains: body.domains } },
      { status: 200 }
    );
  }),

  rest.delete('/api/licenses/:id', () => {
    return res(ctx.json(
      { message: 'License cancelled successfully' },
      { status: 200 }
    );
  }),

  // Widget endpoints
  rest.get('/api/widgets', () => {
    return res(ctx.json(
      { widgets: [mockWidget] },
      { status: 200 }
    );
  }),

  rest.post('/api/widgets', async ({ request }) => {
    const body = await request.json();

    return res(ctx.json(
      { widget: { ...mockWidget, ...body } },
      { status: 201 }
    );
  }),

  rest.get('/api/widgets/:id', ({ params }) => {
    return res(ctx.json(
      { widget: mockWidget },
      { status: 200 }
    );
  }),

  rest.put('/api/widgets/:id', async ({ request, params }) => {
    const body = await request.json();

    return res(ctx.json(
      { widget: { ...mockWidget, ...body } },
      { status: 200 }
    );
  }),

  rest.delete('/api/widgets/:id', () => {
    return res(ctx.json(
      { message: 'Widget deleted successfully' },
      { status: 200 }
    );
  }),

  rest.post('/api/widgets/:id/deploy', ({ params }) => {
    return res(ctx.json(
      { deployUrl: `https://example.com/widget/${params.id}` },
      { status: 200 }
    );
  }),
];
