/**
 * @jest-environment node
 *
 * Widget API — Migrate-on-read + validate-on-write integration tests
 *
 * Tests the boundary pattern at:
 *   GET  /api/widgets/[id]       — migrate-on-read for chat widgets
 *   PATCH /api/widgets/[id]      — migrate-before-merge-before-write
 *   POST  /api/widgets           — canonical config stored (no stripped sections)
 *   GET  /api/w/[widgetKey]/config — migrateConfig → translateConfig from canonical paths
 *
 * Pattern: mock DB queries at the module level (same as public-config-security.test.ts),
 * then call the route handler functions directly.
 *
 * IMPORTANT: All mocks are set up BEFORE importing the route modules (jest.mock hoisting).
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ── Mock all DB / auth dependencies before importing routes ──────────────────

jest.mock('@/lib/db/queries', () => ({
  getWidgetById: jest.fn(),
  getWidgetWithLicense: jest.fn(),
  updateWidget: jest.fn(),
  deleteWidget: jest.fn(),
  getUserById: jest.fn(),
  getWidgetByKeyWithUser: jest.fn(),
  createWidget: jest.fn(),
  createWidgetV2: jest.fn(),
  getActiveWidgetCount: jest.fn(),
  getActiveWidgetCountForUser: jest.fn(),
  getWidgetsPaginated: jest.fn(),
  getWidgetsPaginatedV2: jest.fn(),
}));

jest.mock('@/lib/auth/guard', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/db/admin-queries', () => ({
  logActivity: jest.fn(),
}));

jest.mock('@/lib/db/client', () => ({
  db: {},
}));

// Import route handlers AFTER mocks are registered
const { NextRequest } = require('next/server');
const widgetIdRoute = require('@/app/api/widgets/[id]/route');
const widgetsRoute = require('@/app/api/widgets/route');
const widgetKeyConfigRoute = require('@/app/api/w/[widgetKey]/config/route');
const dbQueries = require('@/lib/db/queries');
const authGuard = require('@/lib/auth/guard');

// ── Helpers ──────────────────────────────────────────────────────────────────

const WIDGET_ID = '550e8400-e29b-41d4-a716-446655440000';
const WIDGET_KEY = 'ABCD1234EFGH5678'; // exactly 16 alphanumeric chars
const USER_ID = 'user-aaa-bbb-ccc';

/** A v1 "legacy" stored config that uses the old style.* shape */
const LEGACY_CONFIG = {
  style: {
    primaryColor: '#00BFFF',
    backgroundColor: '#FFFFFF',
    textColor: '#111827',
    position: 'bottom-left',
    theme: 'light',
  },
  branding: {
    companyName: 'Legacy Co',
    welcomeText: 'Welcome!',
  },
};

/** A minimal canonical (schemaVersion 2) config */
const CANONICAL_CONFIG = {
  schemaVersion: 2,
  kind: 'chat',
  branding: {
    companyName: 'Canonical Co',
    welcomeText: 'Hello!',
    logoUrl: null,
    responseTimeText: 'Typically replies within minutes',
    firstMessage: 'Hello! How can I assist you today?',
    inputPlaceholder: 'Type your message...',
    launcherIcon: 'chat',
    customLauncherIconUrl: null,
    brandingEnabled: true,
  },
  theme: {
    mode: 'light',
    colors: {
      primary: '#4F46E5',
      secondary: '#818CF8',
      background: '#FFFFFF',
      userMessage: '#4F46E5',
      botMessage: '#F3F4F6',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      inputBackground: '#FFFFFF',
      inputText: '#111827',
    },
    darkOverride: { enabled: false, colors: {} },
    position: { position: 'bottom-right', offsetX: 20, offsetY: 20 },
    size: { mode: 'standard', customWidth: null, customHeight: null, fullscreenOnMobile: false, inlineWidth: 400, inlineHeight: 600 },
    typography: { fontFamily: 'system-ui', fontSize: 14, fontUrl: null, disableDefaultFont: false, useCustomFont: false, customFontName: '', customFontCss: '' },
    cornerRadius: 12,
    radius: 'medium',
    density: 'normal',
  },
  advancedStyling: { enabled: false, messages: {}, markdown: {} },
  behavior: { autoOpen: false, autoOpenDelay: 0, showCloseButton: true, persistMessages: true, enableSoundNotifications: false, enableTypingIndicator: true },
  connection: { provider: 'n8n', webhookUrl: '', route: null, timeoutSeconds: 30, captureContext: true, workflowId: '', apiKey: '' },
  features: { attachments: { enabled: false, allowedExtensions: [], maxFileSizeMB: 10 }, emailTranscript: false, printTranscript: true, ratingPrompt: false, pdfLightbox: false },
  startScreen: { greeting: '', starterPrompts: [] },
  composer: { placeholder: 'Type your message...', disclaimer: '' },
  colorSystem: { useAccent: true, accentColor: '#0ea5e9', useTintedGrayscale: false, tintHue: 220, tintLevel: 10, shadeLevel: 10, useCustomSurfaceColors: false, surfaceBackgroundColor: '#ffffff', surfaceForegroundColor: '#f8fafc', useCustomTextColor: false, customTextColor: '#1e293b', useCustomIconColor: false, customIconColor: '#64748b', useCustomUserMessageColors: false, customUserMessageTextColor: '#ffffff', customUserMessageBackgroundColor: '#0ea5e9' },
  chatkit: { grayscaleHue: 220, grayscaleTint: 6, grayscaleShade: -1, accentPrimary: '#0f172a', accentLevel: 1, enableModelPicker: false },
  advanced: { customCss: '' },
};

function makeRequest(method: string, url: string, body?: unknown, headers: Record<string, string> = {}): typeof NextRequest {
  return new NextRequest(url, {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  // Default: authenticated user is pro tier
  authGuard.requireAuth.mockResolvedValue({ sub: USER_ID });
  dbQueries.getUserById.mockResolvedValue({ id: USER_ID, tier: 'pro', subscriptionStatus: 'active' });
  dbQueries.updateWidget.mockImplementation(async (_id: string, data: unknown) => ({ id: WIDGET_ID, ...data }));
  dbQueries.createWidgetV2.mockResolvedValue({
    id: WIDGET_ID,
    widgetKey: WIDGET_KEY,
    name: 'New Widget',
    kind: 'chat',
    embedType: 'popup',
    config: CANONICAL_CONFIG,
    version: 1,
  });
  dbQueries.getActiveWidgetCountForUser.mockResolvedValue(0);
});

// ── Test 1: GET /api/widgets/[id] with legacy config returns schemaVersion 2 ──

describe('GET /api/widgets/[id] — migrate-on-read', () => {
  it('returns schemaVersion 2 when stored config is legacy-shaped (style.*)', async () => {
    dbQueries.getWidgetById.mockResolvedValue({
      id: WIDGET_ID,
      userId: USER_ID,
      widgetKey: WIDGET_KEY,
      kind: 'chat',
      name: 'Legacy Widget',
      status: 'active',
      version: 1,
      config: LEGACY_CONFIG,
    });

    const req = makeRequest('GET', `http://localhost/api/widgets/${WIDGET_ID}`);
    const res = await widgetIdRoute.GET(req, { params: Promise.resolve({ id: WIDGET_ID }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    const config = body.widget.config;

    // schemaVersion 2 written on read
    expect(config.schemaVersion).toBe(2);
    // legacy style.primaryColor mapped to theme.colors.primary
    expect(config.theme?.colors?.primary).toBe('#00BFFF');
    // legacy branding.companyName preserved
    expect(config.branding?.companyName).toBe('Legacy Co');
  });
});

// ── Test 2: PATCH /api/widgets/[id] persists canonical shape ────────────────

describe('PATCH /api/widgets/[id] — validate-on-write', () => {
  it('stores canonical config (schemaVersion 2) when patching a canonical widget', async () => {
    dbQueries.getWidgetById.mockResolvedValue({
      id: WIDGET_ID,
      userId: USER_ID,
      widgetKey: WIDGET_KEY,
      kind: 'chat',
      name: 'My Widget',
      status: 'active',
      version: 3,
      config: CANONICAL_CONFIG,
    });

    const req = makeRequest('PATCH', `http://localhost/api/widgets/${WIDGET_ID}`, {
      config: { branding: { companyName: 'Updated Co' } },
    });
    const res = await widgetIdRoute.PATCH(req, { params: Promise.resolve({ id: WIDGET_ID }) });

    expect(res.status).toBe(200);

    // updateWidget was called with canonical config
    const [, updateData] = dbQueries.updateWidget.mock.calls[0] as [string, any];
    expect(updateData.config.schemaVersion).toBe(2);
    expect(updateData.config.branding.companyName).toBe('Updated Co');
    // version incremented
    expect(updateData.version).toBe(4);
  });
});

// ── Test 3: PATCH migrate-before-merge (legacy stored + canonical patch) ─────

describe('PATCH /api/widgets/[id] — migrate-before-merge', () => {
  it('migrates legacy stored config before merging, preserving migrated values not in patch', async () => {
    dbQueries.getWidgetById.mockResolvedValue({
      id: WIDGET_ID,
      userId: USER_ID,
      widgetKey: WIDGET_KEY,
      kind: 'chat',
      name: 'Legacy Widget',
      status: 'active',
      version: 1,
      config: {
        style: { primaryColor: '#00BFFF' },
        branding: { companyName: 'Keep Me' },
      },
    });

    const req = makeRequest('PATCH', `http://localhost/api/widgets/${WIDGET_ID}`, {
      config: { theme: { colors: { primary: '#112233' } } },
    });
    const res = await widgetIdRoute.PATCH(req, { params: Promise.resolve({ id: WIDGET_ID }) });

    expect(res.status).toBe(200);
    const [, updateData] = dbQueries.updateWidget.mock.calls[0] as [string, any];
    const stored = updateData.config;

    // schemaVersion 2
    expect(stored.schemaVersion).toBe(2);
    // The PATCH value wins: '#112233'
    expect(stored.theme?.colors?.primary).toBe('#112233');
    // Company name from migrated legacy config preserved
    expect(stored.branding?.companyName).toBe('Keep Me');
  });
});

// ── Test 4: POST /api/widgets stores canonical config (theme/behavior/advancedStyling intact) ──

describe('POST /api/widgets — canonical config on create', () => {
  it('stores theme, behavior, and advancedStyling sections (not stripped)', async () => {
    const req = makeRequest('POST', 'http://localhost/api/widgets', {
      name: 'Brand New Widget',
      kind: 'chat',
    });
    const res = await widgetsRoute.POST(req);

    expect(res.status).toBe(201);

    // createWidgetV2 was called with a canonical config
    const [createArgs] = dbQueries.createWidgetV2.mock.calls[0] as [any];
    const storedConfig = createArgs.config;

    expect(storedConfig.schemaVersion).toBe(2);
    expect(storedConfig.theme).toBeDefined();
    expect(storedConfig.behavior).toBeDefined();
    expect(storedConfig.advancedStyling).toBeDefined();
  });
});

// ── Test 5: Display-kind widget config passes through migrateConfig untouched ──

describe('GET /api/widgets/[id] — display widget config passthrough', () => {
  it('does not run migrateConfig on display-kind widgets (keys survive byte-identical)', async () => {
    const displayConfig = {
      kind: 'display',
      branding: { companyName: 'Acme', brandingEnabled: true, logoUrl: null },
      theme: {
        colorScheme: 'light',
        radius: 'medium',
        density: 'normal',
        color: { accent: '#0066FF', surface: '#FFFFFF', text: '#111111' },
      },
      display: { position: 'right', defaultOpen: false },
      connection: { provider: 'n8n', webhookUrl: 'https://n8n.example.com/wh', captureContext: true },
    };

    dbQueries.getWidgetById.mockResolvedValue({
      id: WIDGET_ID,
      userId: USER_ID,
      widgetKey: WIDGET_KEY,
      kind: 'display',
      name: 'Display Widget',
      status: 'active',
      version: 1,
      config: displayConfig,
    });

    const req = makeRequest('GET', `http://localhost/api/widgets/${WIDGET_ID}`);
    const res = await widgetIdRoute.GET(req, { params: Promise.resolve({ id: WIDGET_ID }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    const config = body.widget.config;

    // display-specific key preserved
    expect(config.display?.position).toBe('right');
    // theme preserved (display uses its own shape)
    expect(config.theme?.colorScheme).toBe('light');
    // No schemaVersion injection (migrateConfig not called for display)
    expect(config.schemaVersion).toBeUndefined();
  });
});

// ── Test 6: GET /api/w/[widgetKey]/config — translated from canonical paths ──

describe('GET /api/w/[widgetKey]/config — canonical translation', () => {
  beforeEach(() => {
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue({
      id: WIDGET_ID,
      widgetKey: WIDGET_KEY,
      name: 'Support Widget',
      status: 'active',
      kind: 'chat',
      allowedDomains: [],
      config: LEGACY_CONFIG, // stored as legacy — should be migrated before translation
      user: {
        id: USER_ID,
        tier: 'pro',
        subscriptionStatus: 'active',
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  });

  it('returns a config with branding.companyName from canonical path', async () => {
    const req = new NextRequest(`http://localhost/api/w/${WIDGET_KEY}/config`, {
      headers: { origin: 'https://example.com' },
    });
    const res = await widgetKeyConfigRoute.GET(req, { params: Promise.resolve({ widgetKey: WIDGET_KEY }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    // companyName migrated from legacy branding section
    expect(body.branding?.companyName).toBe('Legacy Co');
  });

  it('returns style.position derived from canonical theme.position.position', async () => {
    const req = new NextRequest(`http://localhost/api/w/${WIDGET_KEY}/config`, {
      headers: { origin: 'https://example.com' },
    });
    const res = await widgetKeyConfigRoute.GET(req, { params: Promise.resolve({ widgetKey: WIDGET_KEY }) });

    const body = await res.json();
    // LEGACY_CONFIG has style.position = 'bottom-left'; after migration it maps to
    // theme.position.position = 'bottom-left'. translateConfig reads canonical path.
    expect(body.style?.position).toBe('bottom-left');
  });

  it('does not expose webhookUrl in the translated config', async () => {
    const req = new NextRequest(`http://localhost/api/w/${WIDGET_KEY}/config`, {
      headers: { origin: 'https://example.com' },
    });
    const res = await widgetKeyConfigRoute.GET(req, { params: Promise.resolve({ widgetKey: WIDGET_KEY }) });

    const body = await res.json();
    expect(body.connection?.webhookUrl).toBeUndefined();
    expect(body.connection?.relayEndpoint).toContain('/api/chat-relay');
  });

  it('does not emit theme.color.accent for a legacy config that never had an accent flag', async () => {
    // LEGACY_CONFIG is style-only — old translate required BOTH useAccent && accentColor,
    // so this widget never rendered an accent. Migration must preserve that.
    const req = new NextRequest(`http://localhost/api/w/${WIDGET_KEY}/config`, {
      headers: { origin: 'https://example.com' },
    });
    const res = await widgetKeyConfigRoute.GET(req, { params: Promise.resolve({ widgetKey: WIDGET_KEY }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.theme?.color?.accent).toBeUndefined();
  });

  it('emits the full prompt text for legacy starter prompts with a prompt field', async () => {
    dbQueries.getWidgetByKeyWithUser.mockResolvedValue({
      id: WIDGET_ID,
      widgetKey: WIDGET_KEY,
      name: 'Prompt Widget',
      status: 'active',
      kind: 'chat',
      allowedDomains: [],
      config: {
        greeting: 'Hello',
        starterPrompts: [{ label: 'Short', icon: 'tag', prompt: 'Longer text' }],
      },
      user: {
        id: USER_ID,
        tier: 'pro',
        subscriptionStatus: 'active',
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    const req = new NextRequest(`http://localhost/api/w/${WIDGET_KEY}/config`, {
      headers: { origin: 'https://example.com' },
    });
    const res = await widgetKeyConfigRoute.GET(req, { params: Promise.resolve({ widgetKey: WIDGET_KEY }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.startScreen?.prompts).toHaveLength(1);
    expect(body.startScreen.prompts[0].label).toBe('Short');
    expect(body.startScreen.prompts[0].prompt).toBe('Longer text');
  });
});
