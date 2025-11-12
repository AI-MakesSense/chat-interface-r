/**
 * Unit Tests for Config Manager
 *
 * Tests for widget/src/core/config.ts
 *
 * Test Coverage:
 * - mergeConfig(): Merges user config with defaults
 * - validateConfig(): Validates configuration
 * - readConfigFromWindow(): Reads window.ChatWidgetConfig
 * - readLicenseFlagsFromWindow(): Reads window.__LICENSE_FLAGS__
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mergeConfig,
  validateConfig,
  readConfigFromWindow,
  readLicenseFlagsFromWindow,
} from '@/widget/src/core/config';
import { WidgetConfig } from '@/widget/src/types';

describe('Config Manager', () => {
  beforeEach(() => {
    // Clean up window globals before each test
    delete (window as any).ChatWidgetConfig;
    delete (window as any).__LICENSE_FLAGS__;
  });

  afterEach(() => {
    // Clean up after each test
    delete (window as any).ChatWidgetConfig;
    delete (window as any).__LICENSE_FLAGS__;
  });

  // ============================================================
  // mergeConfig Tests
  // ============================================================

  describe('mergeConfig()', () => {
    test('should use default values for missing fields', () => {
      // mergeConfig should apply defaults when user provides empty config
      const result = mergeConfig({});

      expect(result.branding.companyName).toBe('Support');
      expect(result.branding.welcomeText).toBe('How can we help?');
      expect(result.branding.firstMessage).toBe('Hello! How can I assist you today?');
      expect(result.style.theme).toBe('auto');
      expect(result.style.primaryColor).toBe('#00bfff');
    });

    test('should preserve user-provided branding values', () => {
      // mergeConfig should override defaults with user values
      const userConfig: WidgetConfig = {
        branding: {
          companyName: 'Acme Inc',
          welcomeText: 'Welcome to Acme',
          firstMessage: 'Hi there!',
        },
        connection: { webhookUrl: 'https://example.com/webhook' },
      };

      const result = mergeConfig(userConfig);

      expect(result.branding.companyName).toBe('Acme Inc');
      expect(result.branding.welcomeText).toBe('Welcome to Acme');
      expect(result.branding.firstMessage).toBe('Hi there!');
    });

    test('should preserve user-provided style values', () => {
      // mergeConfig should override defaults with user style values
      const userConfig: WidgetConfig = {
        style: {
          theme: 'dark',
          primaryColor: '#ff0000',
          position: 'bottom-left',
          cornerRadius: 16,
          fontFamily: 'Georgia, serif',
          fontSize: 16,
        },
        connection: { webhookUrl: 'https://example.com/webhook' },
      };

      const result = mergeConfig(userConfig);

      expect(result.style.theme).toBe('dark');
      expect(result.style.primaryColor).toBe('#ff0000');
      expect(result.style.position).toBe('bottom-left');
      expect(result.style.cornerRadius).toBe(16);
      expect(result.style.fontFamily).toBe('Georgia, serif');
      expect(result.style.fontSize).toBe(16);
    });

    test('should handle partial config - branding only', () => {
      // mergeConfig should merge partial branding and apply defaults to rest
      const userConfig: WidgetConfig = {
        branding: {
          companyName: 'Custom Company',
        },
        connection: { webhookUrl: 'https://example.com/webhook' },
      };

      const result = mergeConfig(userConfig);

      expect(result.branding.companyName).toBe('Custom Company');
      expect(result.branding.welcomeText).toBe('How can we help?'); // Default
      expect(result.style.primaryColor).toBe('#00bfff'); // Default
    });

    test('should handle partial config - style only', () => {
      // mergeConfig should merge partial style and apply defaults to rest
      const userConfig: WidgetConfig = {
        style: {
          theme: 'light',
          primaryColor: '#00ff00',
        },
        connection: { webhookUrl: 'https://example.com/webhook' },
      };

      const result = mergeConfig(userConfig);

      expect(result.style.theme).toBe('light');
      expect(result.style.primaryColor).toBe('#00ff00');
      expect(result.style.position).toBe('bottom-right'); // Default
      expect(result.branding.companyName).toBe('Support'); // Default
    });

    test('should merge nested objects correctly', () => {
      // mergeConfig should deep merge nested objects without losing data
      const userConfig: WidgetConfig = {
        branding: {
          companyName: 'MyBrand',
          // Missing welcomeText and firstMessage
        },
        style: {
          primaryColor: '#123456',
          // Missing other style fields
        },
        connection: { webhookUrl: 'https://example.com/webhook' },
      };

      const result = mergeConfig(userConfig);

      expect(result.branding.companyName).toBe('MyBrand');
      expect(result.branding.welcomeText).toBe('How can we help?');
      expect(result.branding.firstMessage).toBe('Hello! How can I assist you today?');
      expect(result.style.primaryColor).toBe('#123456');
      expect(result.style.theme).toBe('auto');
      expect(result.style.position).toBe('bottom-right');
    });

    test('should handle features configuration', () => {
      // mergeConfig should merge features config
      const userConfig: WidgetConfig = {
        features: {
          fileAttachmentsEnabled: true,
          allowedExtensions: ['.pdf', '.txt'],
          maxFileSizeKB: 10240,
        },
        connection: { webhookUrl: 'https://example.com/webhook' },
      };

      const result = mergeConfig(userConfig);

      expect(result.features.fileAttachmentsEnabled).toBe(true);
      expect(result.features.allowedExtensions).toEqual(['.pdf', '.txt']);
      expect(result.features.maxFileSizeKB).toBe(10240);
    });

    test('should preserve connection config as-is', () => {
      // mergeConfig should not override connection config
      const userConfig: WidgetConfig = {
        connection: {
          webhookUrl: 'https://custom.webhook.url/path',
          routeParam: 'flow=main',
          captureContext: false,
        },
      };

      const result = mergeConfig(userConfig);

      expect(result.connection.webhookUrl).toBe('https://custom.webhook.url/path');
      expect(result.connection.routeParam).toBe('flow=main');
      expect(result.connection.captureContext).toBe(false);
    });

    test('should return all required default fields', () => {
      // mergeConfig should return complete config with all required fields
      const result = mergeConfig({});

      // Verify all required top-level fields exist
      expect(result).toHaveProperty('branding');
      expect(result).toHaveProperty('style');
      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('connection');

      // Verify all branding fields
      expect(result.branding).toHaveProperty('companyName');
      expect(result.branding).toHaveProperty('welcomeText');
      expect(result.branding).toHaveProperty('firstMessage');

      // Verify all style fields
      expect(result.style).toHaveProperty('theme');
      expect(result.style).toHaveProperty('primaryColor');
      expect(result.style).toHaveProperty('backgroundColor');
      expect(result.style).toHaveProperty('textColor');
      expect(result.style).toHaveProperty('position');
      expect(result.style).toHaveProperty('cornerRadius');
      expect(result.style).toHaveProperty('fontFamily');
      expect(result.style).toHaveProperty('fontSize');
    });
  });

  // ============================================================
  // validateConfig Tests
  // ============================================================

  describe('validateConfig()', () => {
    test('should throw if webhookUrl is missing', () => {
      // validateConfig should require webhookUrl
      const invalidConfig: WidgetConfig = {
        connection: { webhookUrl: '' },
      };

      expect(() => validateConfig(invalidConfig)).toThrow();
    });

    test('should throw if webhookUrl is not HTTPS', () => {
      // validateConfig should require HTTPS URLs for security
      const invalidConfig: WidgetConfig = {
        connection: { webhookUrl: 'http://example.com/webhook' },
      };

      expect(() => validateConfig(invalidConfig)).toThrow();
    });

    test('should accept HTTPS webhookUrl', () => {
      // validateConfig should accept valid HTTPS URLs
      const validConfig: WidgetConfig = {
        connection: { webhookUrl: 'https://example.com/webhook' },
      };

      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    test('should throw if primaryColor is invalid hex', () => {
      // validateConfig should validate hex color format
      const invalidConfig: WidgetConfig = {
        style: { primaryColor: 'not-a-color' },
        connection: { webhookUrl: 'https://example.com/webhook' },
      };

      expect(() => validateConfig(invalidConfig)).toThrow();
    });

    test('should accept valid 6-digit hex color', () => {
      // validateConfig should accept standard hex colors
      const validConfig: WidgetConfig = {
        style: { primaryColor: '#00bfff' },
        connection: { webhookUrl: 'https://example.com/webhook' },
      };

      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    test('should accept valid 3-digit hex color', () => {
      // validateConfig should accept shorthand hex colors
      const validConfig: WidgetConfig = {
        style: { primaryColor: '#f00' },
        connection: { webhookUrl: 'https://example.com/webhook' },
      };

      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    test('should throw if theme is invalid', () => {
      // validateConfig should validate theme value
      const invalidConfig: WidgetConfig = {
        style: { theme: 'invalid' as any },
        connection: { webhookUrl: 'https://example.com/webhook' },
      };

      expect(() => validateConfig(invalidConfig)).toThrow();
    });

    test('should accept valid theme values', () => {
      // validateConfig should accept all valid theme values
      const themes: ('light' | 'dark' | 'auto')[] = ['light', 'dark', 'auto'];

      for (const theme of themes) {
        const validConfig: WidgetConfig = {
          style: { theme },
          connection: { webhookUrl: 'https://example.com/webhook' },
        };

        expect(() => validateConfig(validConfig)).not.toThrow();
      }
    });

    test('should throw if position is invalid', () => {
      // validateConfig should validate position value
      const invalidConfig: WidgetConfig = {
        style: { position: 'top-center' as any },
        connection: { webhookUrl: 'https://example.com/webhook' },
      };

      expect(() => validateConfig(invalidConfig)).toThrow();
    });

    test('should accept valid position values', () => {
      // validateConfig should accept all valid position values
      const positions: ('bottom-right' | 'bottom-left')[] = ['bottom-right', 'bottom-left'];

      for (const position of positions) {
        const validConfig: WidgetConfig = {
          style: { position },
          connection: { webhookUrl: 'https://example.com/webhook' },
        };

        expect(() => validateConfig(validConfig)).not.toThrow();
      }
    });

    test('should accept valid complete config', () => {
      // validateConfig should pass completely valid config
      const validConfig: WidgetConfig = {
        branding: {
          companyName: 'Acme Inc',
          welcomeText: 'Welcome',
          firstMessage: 'Hello',
        },
        style: {
          theme: 'auto',
          primaryColor: '#00bfff',
          position: 'bottom-right',
          cornerRadius: 8,
        },
        connection: { webhookUrl: 'https://example.com/webhook' },
      };

      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    test('should throw on multiple validation errors', () => {
      // validateConfig should fail if multiple fields are invalid
      const invalidConfig: WidgetConfig = {
        style: {
          theme: 'invalid' as any,
          primaryColor: 'not-hex',
          position: 'invalid' as any,
        },
        connection: { webhookUrl: 'http://not-https.com' },
      };

      expect(() => validateConfig(invalidConfig)).toThrow();
    });
  });

  // ============================================================
  // readConfigFromWindow Tests
  // ============================================================

  describe('readConfigFromWindow()', () => {
    test('should read config from window.ChatWidgetConfig', () => {
      // readConfigFromWindow should read user config from window
      const userConfig: WidgetConfig = {
        branding: { companyName: 'MyBrand' },
        connection: { webhookUrl: 'https://example.com/webhook' },
      };

      (window as any).ChatWidgetConfig = userConfig;

      const result = readConfigFromWindow();

      expect(result).toEqual(userConfig);
    });

    test('should return empty object if window.ChatWidgetConfig is undefined', () => {
      // readConfigFromWindow should handle missing config gracefully
      const result = readConfigFromWindow();

      expect(result).toEqual({});
    });

    test('should return empty object if window.ChatWidgetConfig is null', () => {
      // readConfigFromWindow should handle null config
      (window as any).ChatWidgetConfig = null;

      const result = readConfigFromWindow();

      expect(result).toEqual({});
    });

    test('should read partial config', () => {
      // readConfigFromWindow should read whatever config was provided
      const partialConfig: Partial<WidgetConfig> = {
        branding: { companyName: 'Test' },
      };

      (window as any).ChatWidgetConfig = partialConfig;

      const result = readConfigFromWindow();

      expect(result.branding?.companyName).toBe('Test');
    });

    test('should not modify window config when reading', () => {
      // readConfigFromWindow should read without side effects
      const originalConfig: WidgetConfig = {
        branding: { companyName: 'Original' },
        connection: { webhookUrl: 'https://example.com/webhook' },
      };

      (window as any).ChatWidgetConfig = originalConfig;

      readConfigFromWindow();

      expect((window as any).ChatWidgetConfig).toEqual(originalConfig);
    });
  });

  // ============================================================
  // readLicenseFlagsFromWindow Tests
  // ============================================================

  describe('readLicenseFlagsFromWindow()', () => {
    test('should read branding flag from window.__LICENSE_FLAGS__', () => {
      // readLicenseFlagsFromWindow should read license flags injected by server
      (window as any).__LICENSE_FLAGS__ = {
        branding: false,
      };

      const result = readLicenseFlagsFromWindow();

      expect(result.branding).toBe(false);
    });

    test('should default branding to true if missing', () => {
      // readLicenseFlagsFromWindow should default branding to true
      const result = readLicenseFlagsFromWindow();

      expect(result.branding).toBe(true);
    });

    test('should handle window.__LICENSE_FLAGS__ as undefined', () => {
      // readLicenseFlagsFromWindow should handle missing flags gracefully
      delete (window as any).__LICENSE_FLAGS__;

      const result = readLicenseFlagsFromWindow();

      expect(result.branding).toBe(true);
    });

    test('should handle window.__LICENSE_FLAGS__ as null', () => {
      // readLicenseFlagsFromWindow should handle null flags
      (window as any).__LICENSE_FLAGS__ = null;

      const result = readLicenseFlagsFromWindow();

      expect(result.branding).toBe(true);
    });

    test('should preserve explicit false branding flag', () => {
      // readLicenseFlagsFromWindow should preserve false values
      (window as any).__LICENSE_FLAGS__ = {
        branding: false,
      };

      const result = readLicenseFlagsFromWindow();

      expect(result.branding).toBe(false);
    });

    test('should preserve explicit true branding flag', () => {
      // readLicenseFlagsFromWindow should preserve true values
      (window as any).__LICENSE_FLAGS__ = {
        branding: true,
      };

      const result = readLicenseFlagsFromWindow();

      expect(result.branding).toBe(true);
    });
  });
});
