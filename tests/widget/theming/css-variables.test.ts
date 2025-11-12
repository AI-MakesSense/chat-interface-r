/**
 * Unit Tests for CSS Variables Generator
 *
 * Tests for widget/src/theming/css-variables.ts
 *
 * Test Coverage:
 * - createCSSVariables() creates CSS variable object
 * - Mapping of config values to CSS variables
 * - Variable naming conventions
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { createCSSVariables } from '@/widget/src/theming/css-variables';
import { WidgetConfig } from '@/widget/src/types';

describe('CSS Variables Generator', () => {
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

  // ============================================================
  // createCSSVariables Tests
  // ============================================================

  describe('createCSSVariables()', () => {
    test('should map primaryColor to --cw-primary-color', () => {
      // createCSSVariables should map config.style.primaryColor to --cw-primary-color
      const variables = createCSSVariables(defaultConfig);

      expect(variables['--cw-primary-color']).toBe('#00bfff');
    });

    test('should map backgroundColor to --cw-bg-color', () => {
      // createCSSVariables should map config.style.backgroundColor to --cw-bg-color
      const variables = createCSSVariables(defaultConfig);

      expect(variables['--cw-bg-color']).toBe('#ffffff');
    });

    test('should map textColor to --cw-text-color', () => {
      // createCSSVariables should map config.style.textColor to --cw-text-color
      const variables = createCSSVariables(defaultConfig);

      expect(variables['--cw-text-color']).toBe('#000000');
    });

    test('should map fontFamily to --cw-font-family', () => {
      // createCSSVariables should map config.style.fontFamily to --cw-font-family
      const variables = createCSSVariables(defaultConfig);

      expect(variables['--cw-font-family']).toBe('system-ui, sans-serif');
    });

    test('should map fontSize to --cw-font-size with px', () => {
      // createCSSVariables should add px unit to fontSize
      const variables = createCSSVariables(defaultConfig);

      expect(variables['--cw-font-size']).toBe('14px');
    });

    test('should map cornerRadius to --cw-corner-radius with px', () => {
      // createCSSVariables should add px unit to cornerRadius
      const variables = createCSSVariables(defaultConfig);

      expect(variables['--cw-corner-radius']).toBe('8px');
    });

    test('should return object with all CSS variables', () => {
      // createCSSVariables should return object with all variable keys
      const variables = createCSSVariables(defaultConfig);

      expect(variables).toHaveProperty('--cw-primary-color');
      expect(variables).toHaveProperty('--cw-bg-color');
      expect(variables).toHaveProperty('--cw-text-color');
      expect(variables).toHaveProperty('--cw-font-family');
      expect(variables).toHaveProperty('--cw-font-size');
      expect(variables).toHaveProperty('--cw-corner-radius');
    });

    test('should handle custom primary color', () => {
      // createCSSVariables should work with any valid primary color
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, primaryColor: '#ff0000' },
      };

      const variables = createCSSVariables(config);

      expect(variables['--cw-primary-color']).toBe('#ff0000');
    });

    test('should handle custom background color', () => {
      // createCSSVariables should work with any valid background color
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, backgroundColor: '#f0f0f0' },
      };

      const variables = createCSSVariables(config);

      expect(variables['--cw-bg-color']).toBe('#f0f0f0');
    });

    test('should handle custom text color', () => {
      // createCSSVariables should work with any valid text color
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, textColor: '#666666' },
      };

      const variables = createCSSVariables(config);

      expect(variables['--cw-text-color']).toBe('#666666');
    });

    test('should handle custom font family', () => {
      // createCSSVariables should work with various font families
      const fontFamilies = [
        'Arial, sans-serif',
        'Georgia, serif',
        '"Courier New", monospace',
        '"Open Sans", sans-serif',
      ];

      for (const fontFamily of fontFamilies) {
        const config: WidgetConfig = {
          ...defaultConfig,
          style: { ...defaultConfig.style, fontFamily },
        };

        const variables = createCSSVariables(config);

        expect(variables['--cw-font-family']).toBe(fontFamily);
      }
    });

    test('should handle various font sizes', () => {
      // createCSSVariables should format different font sizes
      const fontSizes = [12, 14, 16, 18, 20];

      for (const fontSize of fontSizes) {
        const config: WidgetConfig = {
          ...defaultConfig,
          style: { ...defaultConfig.style, fontSize },
        };

        const variables = createCSSVariables(config);

        expect(variables['--cw-font-size']).toBe(`${fontSize}px`);
      }
    });

    test('should handle various corner radius values', () => {
      // createCSSVariables should format different corner radius values
      const radiusValues = [4, 8, 12, 16, 20, 24];

      for (const radius of radiusValues) {
        const config: WidgetConfig = {
          ...defaultConfig,
          style: { ...defaultConfig.style, cornerRadius: radius },
        };

        const variables = createCSSVariables(config);

        expect(variables['--cw-corner-radius']).toBe(`${radius}px`);
      }
    });

    test('should handle 3-digit hex colors', () => {
      // createCSSVariables should work with shorthand hex colors
      const config: WidgetConfig = {
        ...defaultConfig,
        style: {
          ...defaultConfig.style,
          primaryColor: '#f00',
          backgroundColor: '#0f0',
          textColor: '#00f',
        },
      };

      const variables = createCSSVariables(config);

      expect(variables['--cw-primary-color']).toBe('#f00');
      expect(variables['--cw-bg-color']).toBe('#0f0');
      expect(variables['--cw-text-color']).toBe('#00f');
    });

    test('should preserve font family quotes', () => {
      // createCSSVariables should preserve quoted font names
      const config: WidgetConfig = {
        ...defaultConfig,
        style: {
          ...defaultConfig.style,
          fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
        },
      };

      const variables = createCSSVariables(config);

      expect(variables['--cw-font-family']).toBe('"Segoe UI", "Helvetica Neue", sans-serif');
    });

    test('should return consistent object structure', () => {
      // createCSSVariables should always return same structure
      const variables1 = createCSSVariables(defaultConfig);
      const variables2 = createCSSVariables(defaultConfig);

      expect(Object.keys(variables1).sort()).toEqual(Object.keys(variables2).sort());
    });

    test('should use correct CSS variable naming convention', () => {
      // All variables should use --cw- prefix for consistency
      const variables = createCSSVariables(defaultConfig);

      const keys = Object.keys(variables);
      for (const key of keys) {
        expect(key).toMatch(/^--cw-/);
      }
    });

    test('should handle all required style properties', () => {
      // createCSSVariables should include variables for all required properties
      const variables = createCSSVariables(defaultConfig);

      const requiredVars = [
        '--cw-primary-color',
        '--cw-bg-color',
        '--cw-text-color',
        '--cw-font-family',
        '--cw-font-size',
        '--cw-corner-radius',
      ];

      for (const varName of requiredVars) {
        expect(variables).toHaveProperty(varName);
        expect(variables[varName as keyof typeof variables]).toBeTruthy();
      }
    });

    test('should return plain object', () => {
      // createCSSVariables should return plain JavaScript object
      const variables = createCSSVariables(defaultConfig);

      expect(typeof variables).toBe('object');
      expect(Object.getPrototypeOf(variables)).toBe(Object.prototype);
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('edge cases', () => {
    test('should handle uppercase hex colors', () => {
      // createCSSVariables should preserve color case as provided
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, primaryColor: '#FFFFFF' },
      };

      const variables = createCSSVariables(config);

      expect(variables['--cw-primary-color']).toBe('#FFFFFF');
    });

    test('should handle mixed case hex colors', () => {
      // createCSSVariables should preserve color case
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, primaryColor: '#AaBbCc' },
      };

      const variables = createCSSVariables(config);

      expect(variables['--cw-primary-color']).toBe('#AaBbCc');
    });

    test('should handle large font sizes', () => {
      // createCSSVariables should handle any font size number
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, fontSize: 48 },
      };

      const variables = createCSSVariables(config);

      expect(variables['--cw-font-size']).toBe('48px');
    });

    test('should handle small font sizes', () => {
      // createCSSVariables should handle small font sizes
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, fontSize: 10 },
      };

      const variables = createCSSVariables(config);

      expect(variables['--cw-font-size']).toBe('10px');
    });

    test('should handle large corner radius', () => {
      // createCSSVariables should handle any corner radius
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, cornerRadius: 32 },
      };

      const variables = createCSSVariables(config);

      expect(variables['--cw-corner-radius']).toBe('32px');
    });

    test('should handle zero corner radius', () => {
      // createCSSVariables should handle zero radius (no rounding)
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, cornerRadius: 0 },
      };

      const variables = createCSSVariables(config);

      expect(variables['--cw-corner-radius']).toBe('0px');
    });

    test('should handle font family with fallbacks', () => {
      // createCSSVariables should preserve complete font stack
      const config: WidgetConfig = {
        ...defaultConfig,
        style: {
          ...defaultConfig.style,
          fontFamily: '"Trebuchet MS", "Lucida Grande", sans-serif',
        },
      };

      const variables = createCSSVariables(config);

      expect(variables['--cw-font-family']).toBe('"Trebuchet MS", "Lucida Grande", sans-serif');
    });
  });
});
