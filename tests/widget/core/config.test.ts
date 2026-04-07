import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  mergeConfig,
  validateConfig,
  readConfigFromWindow,
  readLicenseFlagsFromWindow,
} from '@/widget/src/core/config';
import type { WidgetConfig } from '@/widget/src/types';

describe('widget/src/core/config', () => {
  beforeEach(() => {
    delete (window as any).ChatWidgetConfig;
    delete (window as any).__LICENSE_FLAGS__;
  });

  afterEach(() => {
    delete (window as any).ChatWidgetConfig;
    delete (window as any).__LICENSE_FLAGS__;
  });

  describe('mergeConfig', () => {
    test('applies defaults when user config is empty', () => {
      const result = mergeConfig({});
      expect(result.branding.companyName).toBe('Support');
      expect(result.style.theme).toBe('auto');
      expect(result.features.fileAttachmentsEnabled).toBe(false);
      expect(result.connection?.captureContext).toBe(true);
    });

    test('overrides defaults with user branding + style', () => {
      const userConfig: WidgetConfig = {
        branding: {
          companyName: 'Acme Inc',
          welcomeText: 'Hello there',
          firstMessage: 'Ask me anything',
        },
        style: {
          theme: 'dark',
          primaryColor: '#ff00ff',
          backgroundColor: '#111111',
          textColor: '#ffffff',
          position: 'top-left',
          cornerRadius: 20,
          fontFamily: 'Inter',
          fontSize: 15,
        },
        features: {
          fileAttachmentsEnabled: true,
          allowedExtensions: ['.pdf'],
          maxFileSizeKB: 4096,
        },
        connection: {
          captureContext: false,
        },
      };

      const result = mergeConfig(userConfig);
      expect(result.branding.companyName).toBe('Acme Inc');
      expect(result.style.theme).toBe('dark');
      expect(result.features.fileAttachmentsEnabled).toBe(true);
      expect(result.connection?.captureContext).toBe(false);
    });
  });

  describe('validateConfig', () => {
    test('throws when primaryColor is invalid hex', () => {
      expect(() =>
        validateConfig({
          style: { primaryColor: 'blue' } as WidgetConfig['style'],
        })
      ).toThrow(/hex/i);
    });

    test('throws when theme is invalid', () => {
      expect(() =>
        validateConfig({
          style: { theme: 'neon' as any },
        })
      ).toThrow(/theme/i);
    });

    test('throws when position is invalid', () => {
      expect(() =>
        validateConfig({
          style: { position: 'middle' as any },
        })
      ).toThrow(/position/i);
    });
  });

  describe('readConfigFromWindow', () => {
    test('returns empty object when window config missing', () => {
      const config = readConfigFromWindow();
      expect(config).toEqual({});
    });

    test('returns uiConfig when runtime wrapper provided', () => {
      const runtimeConfig = {
        uiConfig: {
          branding: { companyName: 'Runtime' },
          style: { theme: 'dark', primaryColor: '#000000', backgroundColor: '#ffffff', textColor: '#000000', position: 'bottom-right', cornerRadius: 12, fontFamily: 'Inter', fontSize: 14 },
          features: { fileAttachmentsEnabled: false, allowedExtensions: [], maxFileSizeKB: 5120 },
          connection: { captureContext: true },
        },
        relay: {
          widgetId: 'widget-123',
          licenseKey: 'license-123',
          relayUrl: '/api/chat-relay',
        },
      };

      (window as any).ChatWidgetConfig = runtimeConfig;
      const result = readConfigFromWindow();
      expect(result).toEqual(runtimeConfig.uiConfig);
    });
  });

  describe('readLicenseFlagsFromWindow', () => {
    test('uses defaults when flags missing', () => {
      const flags = readLicenseFlagsFromWindow();
      expect(flags.branding).toBe(true);
    });

    test('reads branding flag from window', () => {
      (window as any).__LICENSE_FLAGS__ = { branding: false };
      const flags = readLicenseFlagsFromWindow();
      expect(flags.branding).toBe(false);
    });
  });
});
