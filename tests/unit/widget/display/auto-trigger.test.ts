/**
 * @jest-environment jsdom
 */
import { resolveTriggerMessage, buildDisplayPayload } from '@/widget/src/services/messaging/display-payload';

describe('resolveTriggerMessage', () => {
  afterEach(() => {
    (window as any).ChatWidgetConfig = undefined;
  });

  it('prefers window.ChatWidgetConfig.message when set', () => {
    (window as any).ChatWidgetConfig = { message: 'from window' };
    expect(resolveTriggerMessage('from config')).toBe('from window');
  });

  it('falls back to configDefault when window value is missing', () => {
    expect(resolveTriggerMessage('from config')).toBe('from config');
  });

  it('returns empty string when neither is set', () => {
    expect(resolveTriggerMessage(undefined)).toBe('');
  });

  it('ignores window.ChatWidgetConfig.message that is not a string', () => {
    (window as any).ChatWidgetConfig = { message: 42 };
    expect(resolveTriggerMessage('from config')).toBe('from config');
  });

  it('ignores empty-string window.ChatWidgetConfig.message and falls back to configDefault', () => {
    (window as any).ChatWidgetConfig = { message: '' };
    expect(resolveTriggerMessage('from config')).toBe('from config');
  });
});

describe('buildDisplayPayload', () => {
  it('builds the same shape as chat: widgetId, licenseKey, message, chatInput, sessionId, context, customContext, metadata', () => {
    const payload = buildDisplayPayload({
      widgetId: 'w1',
      licenseKey: 'k1',
      message: 'List docs',
      sessionId: 's1',
      context: { pageUrl: 'https://x', pagePath: '/', pageTitle: 't', queryParams: {}, domain: 'x' },
      customContext: { region: 'us' },
      tier: 'basic',
    });
    expect(payload).toEqual({
      widgetId: 'w1',
      licenseKey: 'k1',
      message: 'List docs',
      chatInput: 'List docs',
      sessionId: 's1',
      context: { pageUrl: 'https://x', pagePath: '/', pageTitle: 't', queryParams: {}, domain: 'x' },
      customContext: { region: 'us' },
      metadata: { tier: 'basic' },
    });
  });

  it('keeps chatInput in sync with message (n8n compatibility)', () => {
    const p = buildDisplayPayload({
      widgetId: 'w', licenseKey: 'k', message: 'same', sessionId: 's',
      context: {}, customContext: {}, tier: 'pro',
    });
    expect(p.chatInput).toBe(p.message);
  });
});
