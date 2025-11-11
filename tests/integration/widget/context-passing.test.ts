/**
 * Widget Context Passing Tests
 *
 * Tests that the widget correctly captures and sends page context
 * (URL, query params, title, domain) to the N8n webhook.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Widget Context Passing', () => {
  let dom: JSDOM;
  let window: Window & typeof globalThis;
  let document: Document;
  let fetchSpy: any;

  beforeEach(() => {
    // Setup JSDOM environment
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
    global.navigator = window.navigator as any;

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
    // Load widget code
    const widgetCode = await import('../../../widget/src/index');

    // Configure widget
    (window as any).ChatWidgetConfig = {
      branding: {
        companyName: 'Test Company',
      },
      connection: {
        webhookUrl: 'https://test.n8n.cloud/webhook/test123',
        captureContext: true, // Explicitly enabled
      },
    };

    // Wait for widget to initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    // Find and click chat bubble
    const bubble = document.querySelector('#n8n-chat-bubble') as HTMLButtonElement;
    expect(bubble).toBeTruthy();
    bubble?.click();

    // Wait for chat to open
    await new Promise(resolve => setTimeout(resolve, 100));

    // Find input and send button
    const input = document.querySelector('#n8n-chat-input') as HTMLInputElement;
    const sendBtn = document.querySelector('#n8n-chat-send') as HTMLButtonElement;

    expect(input).toBeTruthy();
    expect(sendBtn).toBeTruthy();

    // Type and send message
    input.value = 'Test message';
    sendBtn.click();

    // Wait for fetch to be called
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify fetch was called
    expect(fetchSpy).toHaveBeenCalled();

    // Get the payload sent to N8n
    const fetchCall = fetchSpy.mock.calls[0];
    const payload = JSON.parse(fetchCall[1].body);

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
    const widgetCode = await import('../../../widget/src/index');

    (window as any).ChatWidgetConfig = {
      branding: {
        companyName: 'Test Company',
      },
      connection: {
        webhookUrl: 'https://test.n8n.cloud/webhook/test123',
        // captureContext not specified - should default to true
      },
    };

    await new Promise(resolve => setTimeout(resolve, 100));

    const bubble = document.querySelector('#n8n-chat-bubble') as HTMLButtonElement;
    bubble?.click();
    await new Promise(resolve => setTimeout(resolve, 100));

    const input = document.querySelector('#n8n-chat-input') as HTMLInputElement;
    const sendBtn = document.querySelector('#n8n-chat-send') as HTMLButtonElement;

    input.value = 'Test message';
    sendBtn.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    const payload = JSON.parse(fetchSpy.mock.calls[0][1].body);

    // Should still include context
    expect(payload).toHaveProperty('context');
    expect(payload.context).toHaveProperty('pageUrl');
  });

  it('should NOT capture context when captureContext is false', async () => {
    const widgetCode = await import('../../../widget/src/index');

    (window as any).ChatWidgetConfig = {
      branding: {
        companyName: 'Test Company',
      },
      connection: {
        webhookUrl: 'https://test.n8n.cloud/webhook/test123',
        captureContext: false, // Explicitly disabled
      },
    };

    await new Promise(resolve => setTimeout(resolve, 100));

    const bubble = document.querySelector('#n8n-chat-bubble') as HTMLButtonElement;
    bubble?.click();
    await new Promise(resolve => setTimeout(resolve, 100));

    const input = document.querySelector('#n8n-chat-input') as HTMLInputElement;
    const sendBtn = document.querySelector('#n8n-chat-send') as HTMLButtonElement;

    input.value = 'Test message';
    sendBtn.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    const payload = JSON.parse(fetchSpy.mock.calls[0][1].body);

    // Should NOT include context
    expect(payload).not.toHaveProperty('context');
    expect(payload).toHaveProperty('message', 'Test message');
    expect(payload).toHaveProperty('sessionId');
  });

  it('should handle URLs without query parameters', async () => {
    // Create new DOM with simple URL
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Simple Page</title></head>
        <body></body>
      </html>
    `, {
      url: 'http://example.com/about',
    });

    window = dom.window as any;
    document = window.document;
    global.window = window as any;
    global.document = document as any;

    const widgetCode = await import('../../../widget/src/index');

    (window as any).ChatWidgetConfig = {
      branding: { companyName: 'Test Company' },
      connection: {
        webhookUrl: 'https://test.n8n.cloud/webhook/test123',
      },
    };

    await new Promise(resolve => setTimeout(resolve, 100));

    const bubble = document.querySelector('#n8n-chat-bubble') as HTMLButtonElement;
    bubble?.click();
    await new Promise(resolve => setTimeout(resolve, 100));

    const input = document.querySelector('#n8n-chat-input') as HTMLInputElement;
    const sendBtn = document.querySelector('#n8n-chat-send') as HTMLButtonElement;

    input.value = 'Test';
    sendBtn.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    const payload = JSON.parse(fetchSpy.mock.calls[0][1].body);

    expect(payload.context).toMatchObject({
      pageUrl: 'http://example.com/about',
      pagePath: '/about',
      pageTitle: 'Simple Page',
      domain: 'example.com',
      queryParams: {}, // Empty object for no params
    });
  });

  it('should include custom context when provided', async () => {
    const widgetCode = await import('../../../widget/src/index');

    (window as any).ChatWidgetConfig = {
      branding: { companyName: 'Test Company' },
      connection: {
        webhookUrl: 'https://test.n8n.cloud/webhook/test123',
        customContext: {
          userId: '12345',
          tier: 'premium',
          experimentVariant: 'B',
        },
      },
    };

    await new Promise(resolve => setTimeout(resolve, 100));

    const bubble = document.querySelector('#n8n-chat-bubble') as HTMLButtonElement;
    bubble?.click();
    await new Promise(resolve => setTimeout(resolve, 100));

    const input = document.querySelector('#n8n-chat-input') as HTMLInputElement;
    const sendBtn = document.querySelector('#n8n-chat-send') as HTMLButtonElement;

    input.value = 'Test';
    sendBtn.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    const payload = JSON.parse(fetchSpy.mock.calls[0][1].body);

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
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body></body>
      </html>
    `, {
      url: 'http://example.com/search?q=hello%20world&filter=price%3E100',
    });

    window = dom.window as any;
    document = window.document;
    global.window = window as any;
    global.document = document as any;

    const widgetCode = await import('../../../widget/src/index');

    (window as any).ChatWidgetConfig = {
      branding: { companyName: 'Test Company' },
      connection: {
        webhookUrl: 'https://test.n8n.cloud/webhook/test123',
      },
    };

    await new Promise(resolve => setTimeout(resolve, 100));

    const bubble = document.querySelector('#n8n-chat-bubble') as HTMLButtonElement;
    bubble?.click();
    await new Promise(resolve => setTimeout(resolve, 100));

    const input = document.querySelector('#n8n-chat-input') as HTMLInputElement;
    const sendBtn = document.querySelector('#n8n-chat-send') as HTMLButtonElement;

    input.value = 'Test';
    sendBtn.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    const payload = JSON.parse(fetchSpy.mock.calls[0][1].body);

    // URL encoding should be handled correctly
    expect(payload.context.queryParams).toMatchObject({
      q: 'hello world',
      filter: 'price>100',
    });
  });

  it('should not include sensitive fields (userAgent, referrer)', async () => {
    const widgetCode = await import('../../../widget/src/index');

    (window as any).ChatWidgetConfig = {
      branding: { companyName: 'Test Company' },
      connection: {
        webhookUrl: 'https://test.n8n.cloud/webhook/test123',
      },
    };

    await new Promise(resolve => setTimeout(resolve, 100));

    const bubble = document.querySelector('#n8n-chat-bubble') as HTMLButtonElement;
    bubble?.click();
    await new Promise(resolve => setTimeout(resolve, 100));

    const input = document.querySelector('#n8n-chat-input') as HTMLInputElement;
    const sendBtn = document.querySelector('#n8n-chat-send') as HTMLButtonElement;

    input.value = 'Test';
    sendBtn.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    const payload = JSON.parse(fetchSpy.mock.calls[0][1].body);

    // Privacy-sensitive fields should NOT be included
    expect(payload.context).not.toHaveProperty('userAgent');
    expect(payload.context).not.toHaveProperty('referrer');
  });
});
