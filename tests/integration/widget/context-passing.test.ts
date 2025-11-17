/**
 * Widget Context Passing Tests
 *
 * Tests that the widget correctly captures and sends page context
 * (URL, query params, title, domain) to the chat relay endpoint.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Widget initialization timeout
 *
 * Reason: JSDOM + IIFE execution requires brief async delay
 * for widget to fully initialize DOM elements
 */
const WIDGET_INIT_TIMEOUT = 100;

/**
 * Message send timeout
 *
 * Reason: Fetch spy needs time to capture the network call
 * after button click triggers async sendMessage()
 */
const MESSAGE_SEND_TIMEOUT = 100;

/**
 * Test relay metadata used across all tests
 */
const TEST_RELAY_URL = 'https://app.localhost/api/chat-relay';
const TEST_WIDGET_ID = 'widget-test-id';
const TEST_LICENSE_KEY = 'license-test-key';

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Setup JSDOM environment with navigator fix
 *
 * This helper applies the Object.defineProperty fix for the
 * read-only navigator global property issue.
 */
function setupNavigatorFix(window: Window & typeof globalThis) {
  Object.defineProperty(global, 'navigator', {
    value: window.navigator,
    writable: true,
    configurable: true,
  });
}

/**
 * Build a runtime config payload compatible with the widget bundle.
 * Accepts either full runtime config overrides or legacy UI config overrides.
 */
function buildRuntimeConfig(overrides: any = {}) {
  const uiOverrides = overrides.uiConfig ?? overrides;
  const relayOverrides = overrides.relay ?? {};

  return {
    uiConfig: {
      branding: {
        companyName: 'Test Company',
        welcomeText: 'Need help?',
        firstMessage: 'Hello! Ask me anything.',
        ...(uiOverrides.branding || {}),
      },
      style: {
        theme: 'light',
        primaryColor: '#00bfff',
        backgroundColor: '#ffffff',
        textColor: '#111111',
        position: 'bottom-right',
        cornerRadius: 12,
        fontFamily: 'Inter',
        fontSize: 14,
        ...(uiOverrides.style || {}),
      },
      features: {
        fileAttachmentsEnabled: false,
        allowedExtensions: [],
        maxFileSizeKB: 5120,
        ...(uiOverrides.features || {}),
      },
      connection: {
        captureContext: true,
        ...(uiOverrides.connection || {}),
      },
      license: {
        brandingEnabled: true,
        ...(uiOverrides.license || {}),
      },
    },
    relay: {
      relayUrl: relayOverrides.relayUrl || TEST_RELAY_URL,
      widgetId: relayOverrides.widgetId || TEST_WIDGET_ID,
      licenseKey: relayOverrides.licenseKey || TEST_LICENSE_KEY,
    },
  };
}

/**
 * Initialize widget with given config
 *
 * IMPORTANT: Config must be set BEFORE import because the widget
 * uses an IIFE pattern that runs synchronously on module import.
 *
 * @param config - Partial widget configuration
 * @returns Promise that resolves after widget initialization
 */
async function initializeWidget(config: any): Promise<void> {
  // Set config BEFORE import (widget IIFE runs on import)
  const runtimeConfig =
    config && config.uiConfig && config.relay ? config : buildRuntimeConfig(config);
  (global.window as any).ChatWidgetConfig = runtimeConfig;

  // Load widget code (IIFE runs immediately)
  await import('../../../widget/src/index');

  // Wait for widget to initialize
  await new Promise(resolve => setTimeout(resolve, WIDGET_INIT_TIMEOUT));
}

/**
 * Send a message through the widget
 *
 * Opens the chat (if not open), types message, clicks send button,
 * and waits for fetch to complete.
 *
 * @param text - Message text to send
 */
async function sendMessage(text: string): Promise<void> {
  const document = global.document;

  // Click bubble to open chat
  const bubble = document.querySelector('#n8n-chat-bubble') as HTMLButtonElement;
  expect(bubble).toBeTruthy();
  bubble?.click();

  // Wait for chat to open
  await new Promise(resolve => setTimeout(resolve, WIDGET_INIT_TIMEOUT));

  // Find input and send button
  const input = document.querySelector('#n8n-chat-input') as HTMLInputElement;
  const sendBtn = document.querySelector('#n8n-chat-send') as HTMLButtonElement;

  expect(input).toBeTruthy();
  expect(sendBtn).toBeTruthy();

  // Type and send message
  input.value = text;
  sendBtn.click();

  // Wait for fetch to be called
  await new Promise(resolve => setTimeout(resolve, MESSAGE_SEND_TIMEOUT));
}

/**
 * Extract the last payload sent to the webhook
 *
 * @param fetchSpy - Vitest mock spy for fetch
 * @returns Parsed JSON payload from the last fetch call
 */
function getLastPayload(fetchSpy: any): any {
  const fetchCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
  return JSON.parse(fetchCall[1].body);
}

/**
 * Reset DOM environment with new URL and title
 *
 * Used by tests that need to test different URL scenarios.
 * Recreates JSDOM, resets globals, and applies navigator fix.
 *
 * @param url - Full URL for the new environment
 * @param title - Page title
 * @returns Object with new dom, window, and document references
 */
function resetDomEnvironment(url: string, title: string) {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <head><title>${title}</title></head>
      <body></body>
    </html>
  `, { url });

  const window = dom.window as any;
  const document = window.document;

  global.window = window;
  global.document = document;

  // Apply navigator fix
  setupNavigatorFix(window);

  return { dom, window, document };
}

// ============================================================
// TEST SUITE
// ============================================================

describe('Widget Context Passing', () => {
  let dom: JSDOM;
  let window: Window & typeof globalThis;
  let document: Document;
  let fetchSpy: any;

  beforeEach(() => {
    // Reset module cache to prevent interference between tests
    // (widget IIFE must re-run for each test)
    vi.resetModules();

    // Setup JSDOM environment with default test URL
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Page - Product Listing</title>
        </head>
        <body>
          <div id="app"></div>
        </body>
      </html>
    `, {
      url: 'http://example.com/products?category=widgets&utm_source=google&utm_campaign=summer',
      pretendToBeVisual: true,
    });

    window = dom.window as any;
    document = window.document;

    // Setup global mocks
    global.window = window as any;
    global.document = document as any;

    // Apply navigator fix for read-only property
    setupNavigatorFix(window);

    // Mock fetch
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'Test response' }),
    });
    global.fetch = fetchSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should capture full page context by default', async () => {
    // Initialize widget with captureContext explicitly enabled
    await initializeWidget({
      branding: {
        companyName: 'Test Company',
      },
      connection: {
        captureContext: true, // Explicitly enabled
      },
    });

    // Send message through the widget
    await sendMessage('Test message');

    // Verify fetch was called
    expect(fetchSpy).toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalledWith(
      TEST_RELAY_URL,
      expect.objectContaining({
        method: 'POST',
      })
    );

    // Get the payload sent to N8n
    const payload = getLastPayload(fetchSpy);

    expect(payload.widgetId).toBe(TEST_WIDGET_ID);
    expect(payload.licenseKey).toBe(TEST_LICENSE_KEY);

    // Verify context is included
    expect(payload).toHaveProperty('context');
    expect(payload.context).toMatchObject({
      pageUrl: 'http://example.com/products?category=widgets&utm_source=google&utm_campaign=summer',
      pagePath: '/products',
      pageTitle: 'Test Page - Product Listing',
      domain: 'example.com',
      queryParams: {
        category: 'widgets',
        utm_source: 'google',
        utm_campaign: 'summer',
      },
    });
  });

  it('should capture context when captureContext is undefined (default behavior)', async () => {
    // Initialize widget with captureContext not specified (defaults to true)
    await initializeWidget({
      branding: {
        companyName: 'Test Company',
      },
      connection: {
        // captureContext not specified - should default to true
      },
    });

    await sendMessage('Test message');

    const payload = getLastPayload(fetchSpy);

    // Should still include context
    expect(payload).toHaveProperty('context');
    expect(payload.context).toHaveProperty('pageUrl');
  });

  it('should NOT capture context when captureContext is false', async () => {
    // Initialize widget with captureContext explicitly disabled
    await initializeWidget({
      branding: {
        companyName: 'Test Company',
      },
      connection: {
        captureContext: false, // Explicitly disabled
      },
    });

    await sendMessage('Test message');

    const payload = getLastPayload(fetchSpy);

    // Should NOT include context
    expect(payload).not.toHaveProperty('context');
    expect(payload).toHaveProperty('message', 'Test message');
    expect(payload).toHaveProperty('sessionId');
  });

  it('should handle URLs without query parameters', async () => {
    // Reset DOM environment with simple URL (no query params)
    const env = resetDomEnvironment('http://example.com/about', 'Simple Page');
    dom = env.dom;
    window = env.window;
    document = env.document;

    await initializeWidget({
      branding: { companyName: 'Test Company' },
      connection: {
      },
    });

    await sendMessage('Test');

    const payload = getLastPayload(fetchSpy);

    expect(payload.context).toMatchObject({
      pageUrl: 'http://example.com/about',
      pagePath: '/about',
      pageTitle: 'Simple Page',
      domain: 'example.com',
      queryParams: {}, // Empty object for no params
    });
  });

  it('should include custom context when provided', async () => {
    await initializeWidget({
      branding: { companyName: 'Test Company' },
      connection: {
        customContext: {
          userId: '12345',
          tier: 'premium',
          experimentVariant: 'B',
        },
      },
    });

    await sendMessage('Test');

    const payload = getLastPayload(fetchSpy);

    // Should include both context and customContext
    expect(payload).toHaveProperty('context');
    expect(payload).toHaveProperty('customContext');
    expect(payload.customContext).toEqual({
      userId: '12345',
      tier: 'premium',
      experimentVariant: 'B',
    });
  });

  it('should handle special characters in query parameters', async () => {
    // Reset DOM environment with URL-encoded query params
    const env = resetDomEnvironment(
      'http://example.com/search?q=hello%20world&filter=price%3E100',
      'Test'
    );
    dom = env.dom;
    window = env.window;
    document = env.document;

    await initializeWidget({
      branding: { companyName: 'Test Company' },
      connection: {
      },
    });

    await sendMessage('Test');

    const payload = getLastPayload(fetchSpy);

    // URL encoding should be handled correctly
    expect(payload.context.queryParams).toMatchObject({
      q: 'hello world',
      filter: 'price>100',
    });
  });

  it('should not include sensitive fields (userAgent, referrer)', async () => {
    await initializeWidget({
      branding: { companyName: 'Test Company' },
      connection: {
      },
    });

    await sendMessage('Test');

    const payload = getLastPayload(fetchSpy);

    // Privacy-sensitive fields should NOT be included
    expect(payload.context).not.toHaveProperty('userAgent');
    expect(payload.context).not.toHaveProperty('referrer');
  });
});
