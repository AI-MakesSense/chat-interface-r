/**
 * Widget Portal Mode Tests
 *
 * Tests for the portal mode rendering feature that displays
 * the widget in fullscreen without the bubble button.
 *
 * TDD Phase: RED
 * Expected: All tests should FAIL until implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Test will fail - Widget class doesn't have portal mode yet
describe('Widget Portal Mode', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    // Setup clean DOM for each test
    dom = new JSDOM('<!DOCTYPE html><html><body><div id="chat-portal"></div></body></html>');
    document = dom.window.document;
    window = dom.window as unknown as Window;

    // Mock global objects
    global.document = document;
    global.window = window as any;
    global.HTMLElement = window.HTMLElement;
  });

  afterEach(() => {
    // Cleanup
    dom.window.close();
  });

  describe('Mode Detection', () => {
    it('should detect portal mode from config', () => {
      // This will fail - Widget doesn't exist yet
      const { Widget } = require('../../../widget/src/core/widget');
      const config = { mode: 'portal', license: 'abc123' };
      const widget = new Widget(config);

      expect(widget.isPortalMode()).toBe(true);
    });

    it('should default to normal mode if not specified', () => {
      const { Widget } = require('../../../widget/src/core/widget');
      const config = { license: 'abc123' };
      const widget = new Widget(config);

      expect(widget.isPortalMode()).toBe(false);
    });

    it('should handle embedded mode separately', () => {
      const { Widget } = require('../../../widget/src/core/widget');
      const config = { mode: 'embedded', license: 'abc123' };
      const widget = new Widget(config);

      expect(widget.isEmbeddedMode()).toBe(true);
      expect(widget.isPortalMode()).toBe(false);
    });
  });

  describe('Portal Rendering', () => {
    it('should NOT render bubble button in portal mode', () => {
      const { Widget } = require('../../../widget/src/core/widget');
      const config = { mode: 'portal', license: 'abc123', webhookUrl: 'https://test.com' };
      const widget = new Widget(config);
      widget.render();

      const bubble = document.querySelector('.chat-bubble');
      expect(bubble).toBeNull();
    });

    it('should render chat window immediately in portal mode', () => {
      const { Widget } = require('../../../widget/src/core/widget');
      const config = { mode: 'portal', license: 'abc123', webhookUrl: 'https://test.com' };
      const widget = new Widget(config);
      widget.render();

      const chatWindow = document.querySelector('.chat-window');
      expect(chatWindow).toBeTruthy();
      expect(chatWindow?.classList.contains('visible')).toBe(true);
    });

    it('should apply fullscreen styles in portal mode', () => {
      const { Widget } = require('../../../widget/src/core/widget');
      const config = { mode: 'portal', license: 'abc123', webhookUrl: 'https://test.com' };
      const widget = new Widget(config);
      widget.render();

      const chatWindow = document.querySelector('.chat-window') as HTMLElement;
      expect(chatWindow).toBeTruthy();
      expect(chatWindow.style.width).toBe('100%');
      expect(chatWindow.style.height).toBe('100%');
      expect(chatWindow.style.position).toBe('fixed');
      expect(chatWindow.style.top).toBe('0');
      expect(chatWindow.style.left).toBe('0');
    });

    it('should NOT show minimize button in portal mode', () => {
      const { Widget } = require('../../../widget/src/core/widget');
      const config = { mode: 'portal', license: 'abc123', webhookUrl: 'https://test.com' };
      const widget = new Widget(config);
      widget.render();

      const minimizeBtn = document.querySelector('.minimize-btn');
      expect(minimizeBtn).toBeNull();
    });

    it('should auto-focus input field in portal mode', async () => {
      const { Widget } = require('../../../widget/src/core/widget');
      const config = { mode: 'portal', license: 'abc123', webhookUrl: 'https://test.com' };
      const widget = new Widget(config);
      widget.render();

      // Wait for auto-focus timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      const input = document.querySelector('.chat-input');
      expect(document.activeElement).toBe(input);
    });
  });

  describe('Portal Header Configuration', () => {
    it('should show header by default in portal mode', () => {
      const { Widget } = require('../../../widget/src/core/widget');
      const config = { mode: 'portal', license: 'abc123', webhookUrl: 'https://test.com' };
      const widget = new Widget(config);
      widget.render();

      const header = document.querySelector('.chat-header');
      expect(header).toBeTruthy();
    });

    it('should hide header if portal.showHeader = false', () => {
      const { Widget } = require('../../../widget/src/core/widget');
      const config = {
        mode: 'portal',
        license: 'abc123',
        webhookUrl: 'https://test.com',
        portal: { showHeader: false }
      };
      const widget = new Widget(config);
      widget.render();

      const header = document.querySelector('.chat-header');
      expect(header).toBeNull();
    });

    it('should show custom header title in portal mode', () => {
      const { Widget } = require('../../../widget/src/core/widget');
      const config = {
        mode: 'portal',
        license: 'abc123',
        webhookUrl: 'https://test.com',
        portal: { headerTitle: 'AI Support Chat' }
      };
      const widget = new Widget(config);
      widget.render();

      const header = document.querySelector('.chat-header');
      expect(header?.textContent).toContain('AI Support Chat');
    });
  });

  describe('Responsive Behavior', () => {
    it('should adjust layout for mobile in portal mode', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

      const { Widget } = require('../../../widget/src/core/widget');
      const config = { mode: 'portal', license: 'abc123', webhookUrl: 'https://test.com' };
      const widget = new Widget(config);
      widget.render();

      const chatWindow = document.querySelector('.chat-window');
      expect(chatWindow?.classList.contains('mobile')).toBe(true);
    });

    it('should handle landscape orientation', () => {
      // Mock landscape viewport
      Object.defineProperty(window, 'innerWidth', { value: 667, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 375, writable: true });

      const { Widget } = require('../../../widget/src/core/widget');
      const config = { mode: 'portal', license: 'abc123', webhookUrl: 'https://test.com' };
      const widget = new Widget(config);
      widget.render();

      const chatWindow = document.querySelector('.chat-window');
      expect(chatWindow?.classList.contains('landscape')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw error if license missing in portal mode', () => {
      const { Widget } = require('../../../widget/src/core/widget');
      const config = { mode: 'portal' };

      expect(() => new Widget(config)).toThrow('License required');
    });

    it('should show error message if webhook URL invalid', () => {
      const { Widget } = require('../../../widget/src/core/widget');
      const config = {
        mode: 'portal',
        license: 'abc123',
        webhookUrl: 'invalid-url'
      };

      // Should not throw, but log error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const widget = new Widget(config);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid webhook URL')
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
