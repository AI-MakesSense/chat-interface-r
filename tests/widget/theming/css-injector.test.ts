/**
 * Unit Tests for CSS Injector
 *
 * Tests for widget/src/theming/css-injector.ts
 *
 * Test Coverage:
 * - generateCSSVariables() generates CSS custom properties
 * - injectStyles() injects styles into document
 * - Style reuse and cleanup
 * - CSS variable formatting
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateCSSVariables, injectStyles } from '@/widget/src/theming/css-injector';
import { WidgetConfig } from '@/widget/src/types';

describe('CSS Injector', () => {
  const defaultConfig: WidgetConfig = {
    branding: {
      companyName: 'Support',
      welcomeText: 'How can we help?',
      firstMessage: 'Hello!',
    },
    style: {
      theme: 'light',
      primaryColor: '#00bfff',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      position: 'bottom-right',
      cornerRadius: 8,
      fontFamily: 'system-ui, sans-serif',
      fontSize: 14,
    },
    features: {
      fileAttachmentsEnabled: false,
      allowedExtensions: [],
      maxFileSizeKB: 5120,
    },
    connection: { webhookUrl: 'https://example.com/webhook' },
  };

  beforeEach(() => {
    // Clean up any existing style elements
    const existingStyles = document.querySelectorAll('[data-widget-id="n8n-chat-widget-styles"]');
    existingStyles.forEach((el) => el.remove());
  });

  afterEach(() => {
    // Clean up after tests
    const existingStyles = document.querySelectorAll('[data-widget-id="n8n-chat-widget-styles"]');
    existingStyles.forEach((el) => el.remove());
  });

  // ============================================================
  // generateCSSVariables Tests
  // ============================================================

  describe('generateCSSVariables()', () => {
    test('should generate CSS variables for all config values', () => {
      // generateCSSVariables should produce CSS with all variables
      const css = generateCSSVariables(defaultConfig);

      expect(css).toContain('--cw-primary-color');
      expect(css).toContain('--cw-bg-color');
      expect(css).toContain('--cw-text-color');
      expect(css).toContain('--cw-font-family');
      expect(css).toContain('--cw-font-size');
      expect(css).toContain('--cw-corner-radius');
    });

    test('should map primaryColor correctly', () => {
      // generateCSSVariables should map style.primaryColor to CSS variable
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, primaryColor: '#ff0000' },
      };

      const css = generateCSSVariables(config);

      expect(css).toContain('--cw-primary-color: #ff0000');
    });

    test('should map backgroundColor correctly', () => {
      // generateCSSVariables should map style.backgroundColor to CSS variable
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, backgroundColor: '#f0f0f0' },
      };

      const css = generateCSSVariables(config);

      expect(css).toContain('--cw-bg-color: #f0f0f0');
    });

    test('should map textColor correctly', () => {
      // generateCSSVariables should map style.textColor to CSS variable
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, textColor: '#333333' },
      };

      const css = generateCSSVariables(config);

      expect(css).toContain('--cw-text-color: #333333');
    });

    test('should map fontFamily correctly', () => {
      // generateCSSVariables should map style.fontFamily to CSS variable
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, fontFamily: 'Georgia, serif' },
      };

      const css = generateCSSVariables(config);

      expect(css).toContain('--cw-font-family: Georgia, serif');
    });

    test('should format fontSize with px units', () => {
      // generateCSSVariables should add px to font size numbers
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, fontSize: 16 },
      };

      const css = generateCSSVariables(config);

      expect(css).toContain('--cw-font-size: 16px');
    });

    test('should format cornerRadius with px units', () => {
      // generateCSSVariables should add px to corner radius
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, cornerRadius: 12 },
      };

      const css = generateCSSVariables(config);

      expect(css).toContain('--cw-corner-radius: 12px');
    });

    test('should generate valid CSS', () => {
      // generateCSSVariables should produce syntactically valid CSS
      const css = generateCSSVariables(defaultConfig);

      expect(css).toContain(':root');
      expect(css).toContain('{');
      expect(css).toContain('}');
    });

    test('should handle custom colors', () => {
      // generateCSSVariables should work with any valid hex colors
      const config: WidgetConfig = {
        ...defaultConfig,
        style: {
          ...defaultConfig.style,
          primaryColor: '#123abc',
          backgroundColor: '#fafafa',
          textColor: '#666',
        },
      };

      const css = generateCSSVariables(config);

      expect(css).toContain('--cw-primary-color: #123abc');
      expect(css).toContain('--cw-bg-color: #fafafa');
      expect(css).toContain('--cw-text-color: #666');
    });

    test('should handle various font families', () => {
      // generateCSSVariables should work with different font families
      const configs = [
        'Arial, sans-serif',
        '"Courier New", monospace',
        'Helvetica, Arial, sans-serif',
        'system-ui',
      ];

      for (const fontFamily of configs) {
        const config: WidgetConfig = {
          ...defaultConfig,
          style: { ...defaultConfig.style, fontFamily },
        };

        const css = generateCSSVariables(config);
        expect(css).toContain(`--cw-font-family: ${fontFamily}`);
      }
    });
  });

  // ============================================================
  // injectStyles Tests
  // ============================================================

  describe('injectStyles()', () => {
    test('should create style element in document.head', () => {
      // injectStyles should add <style> tag to document.head
      injectStyles(defaultConfig);

      const styleElements = document.querySelectorAll('[data-widget-id="n8n-chat-widget-styles"]');
      expect(styleElements.length).toBeGreaterThan(0);

      const injected = Array.from(styleElements).find(
        (el) => el.parentElement === document.head
      );
      expect(injected).toBeDefined();
    });

    test('should create style element as style tag', () => {
      // injectStyles should create a <style> element
      injectStyles(defaultConfig);

      const styleElements = document.querySelectorAll('[data-widget-id="n8n-chat-widget-styles"]');
      expect(styleElements.length).toBeGreaterThan(0);

      const styleElement = styleElements[0];
      expect(styleElement.tagName.toLowerCase()).toBe('style');
    });

    test('should reuse existing style element', () => {
      // injectStyles should update existing style if already injected
      injectStyles(defaultConfig);

      const firstCount = document.querySelectorAll(
        '[data-widget-id="n8n-chat-widget-styles"]'
      ).length;

      injectStyles(defaultConfig);

      const secondCount = document.querySelectorAll(
        '[data-widget-id="n8n-chat-widget-styles"]'
      ).length;

      expect(secondCount).toBe(firstCount);
    });

    test('should include CSS variables in styles', () => {
      // injectStyles should include generated CSS variables
      injectStyles(defaultConfig);

      const styleElements = document.querySelectorAll('[data-widget-id="n8n-chat-widget-styles"]');
      const styleContent = Array.from(styleElements)
        .map((el) => el.textContent)
        .join('');

      expect(styleContent).toContain('--cw-primary-color');
    });

    test('should include base CSS', () => {
      // injectStyles should include base widget styles
      injectStyles(defaultConfig);

      const styleElements = document.querySelectorAll('[data-widget-id="n8n-chat-widget-styles"]');
      const styleContent = Array.from(styleElements)
        .map((el) => el.textContent)
        .join('');

      // Should have some CSS selectors and rules
      expect(styleContent.length).toBeGreaterThan(100);
    });

    test('should use unique ID for style element', () => {
      // injectStyles should mark injected styles with unique ID
      injectStyles(defaultConfig);

      const styleElements = document.querySelectorAll('[data-widget-id="n8n-chat-widget-styles"]');
      expect(styleElements.length).toBeGreaterThan(0);

      const styleElement = styleElements[0] as HTMLElement;
      expect(styleElement.getAttribute('data-widget-id')).toBe('n8n-chat-widget-styles');
    });

    test('should inject styles with custom colors', () => {
      // injectStyles should use provided color config
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, primaryColor: '#ff0000', backgroundColor: '#000000' },
      };

      injectStyles(config);

      const styleElements = document.querySelectorAll('[data-widget-id="n8n-chat-widget-styles"]');
      const styleContent = Array.from(styleElements)
        .map((el) => el.textContent)
        .join('');

      expect(styleContent).toContain('#ff0000');
      expect(styleContent).toContain('#000000');
    });

    test('should handle multiple injectStyles calls', () => {
      // injectStyles should work correctly when called multiple times
      injectStyles(defaultConfig);
      injectStyles(defaultConfig);
      injectStyles(defaultConfig);

      const styleElements = document.querySelectorAll('[data-widget-id="n8n-chat-widget-styles"]');

      // Should only have one injected style element
      expect(styleElements.length).toBe(1);
    });

    test('should update existing styles on config change', () => {
      // injectStyles should update when called with new config
      const config1: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, primaryColor: '#ff0000' },
      };

      injectStyles(config1);

      let styleContent = document.querySelector('[data-widget-id="n8n-chat-widget-styles"]')
        ?.textContent;
      expect(styleContent).toContain('#ff0000');

      const config2: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, primaryColor: '#00ff00' },
      };

      injectStyles(config2);

      styleContent = document.querySelector('[data-widget-id="n8n-chat-widget-styles"]')
        ?.textContent;
      expect(styleContent).toContain('--cw-primary-color: #00ff00');
    });
  });

  // ============================================================
  // Integration Tests
  // ============================================================

  describe('integration', () => {
    test('should generate and inject valid styles', () => {
      // Full flow: generate variables and inject to document
      const css = generateCSSVariables(defaultConfig);
      expect(css).toBeTruthy();
      expect(css.length).toBeGreaterThan(0);

      injectStyles(defaultConfig);

      const styleElement = document.querySelector(
        '[data-widget-id="n8n-chat-widget-styles"]'
      ) as HTMLStyleElement;
      expect(styleElement).toBeDefined();
      expect(styleElement.textContent).toBeTruthy();
    });

    test('should handle full theme configuration', () => {
      // Full theme config should be properly injected
      const config: WidgetConfig = {
        ...defaultConfig,
        style: {
          theme: 'dark',
          primaryColor: '#ff6b6b',
          backgroundColor: '#1a1a1a',
          textColor: '#ffffff',
          position: 'bottom-left',
          cornerRadius: 16,
          fontFamily: '"Inter", sans-serif',
          fontSize: 15,
        },
      };

      injectStyles(config);

      const styleContent = document.querySelector(
        '[data-widget-id="n8n-chat-widget-styles"]'
      )?.textContent;

      expect(styleContent).toContain('--cw-primary-color: #ff6b6b');
      expect(styleContent).toContain('--cw-bg-color: #1a1a1a');
      expect(styleContent).toContain('--cw-text-color: #ffffff');
      expect(styleContent).toContain('--cw-corner-radius: 16px');
      expect(styleContent).toContain('--cw-font-size: 15px');
    });
  });
});
