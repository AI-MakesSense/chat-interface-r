/**
 * Default Config Generators - RED Tests
 *
 * Purpose: Test default configuration generators for widget configs
 * Module: Phase 3 Module 1D - Default Config Generators
 *
 * Test Coverage:
 * - Main function tests (10 tests)
 * - Basic tier defaults (8 tests)
 * - Pro tier defaults (8 tests)
 * - Agency tier defaults (8 tests)
 * - Immutability tests (3 tests)
 * - Field validation tests (5 tests)
 *
 * Total Expected: 42 tests (all should FAIL - RED state)
 */

import { describe, it, expect } from 'vitest';
import {
  createDefaultConfig,
  createDefaultBranding,
  createDefaultTheme,
  createDefaultBehavior,
  createDefaultConnection,
  createDefaultFeatures,
} from '@/lib/config/defaults';
import { createWidgetConfigSchema } from '@/lib/validation/widget-schema';
import type { WidgetConfig, BrandingConfig, ThemeConfig, BehaviorConfig, ConnectionConfig, FeaturesConfig } from '@/lib/types/widget-config';

// =============================================================================
// 1. Main Function Tests (10 tests)
// =============================================================================

describe('createDefaultConfig - Main Function', () => {

  it('should return a valid WidgetConfig for Basic tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('basic');

    expect(config).toBeDefined();
    expect(config.branding).toBeDefined();
    expect(config.theme).toBeDefined();
    expect(config.advancedStyling).toBeDefined();
    expect(config.behavior).toBeDefined();
    expect(config.connection).toBeDefined();
    expect(config.features).toBeDefined();
  });

  it('should return a valid WidgetConfig for Pro tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('pro');

    expect(config).toBeDefined();
    expect(config.branding).toBeDefined();
    expect(config.theme).toBeDefined();
    expect(config.advancedStyling).toBeDefined();
    expect(config.behavior).toBeDefined();
    expect(config.connection).toBeDefined();
    expect(config.features).toBeDefined();
  });

  it('should return a valid WidgetConfig for Agency tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('agency');

    expect(config).toBeDefined();
    expect(config.branding).toBeDefined();
    expect(config.theme).toBeDefined();
    expect(config.advancedStyling).toBeDefined();
    expect(config.behavior).toBeDefined();
    expect(config.connection).toBeDefined();
    expect(config.features).toBeDefined();
  });

  it('should validate against Basic tier Zod schema', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('basic');
    const schema = createWidgetConfigSchema('basic', true);

    const result = schema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should validate against Pro tier Zod schema', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('pro');
    const schema = createWidgetConfigSchema('pro', false);

    const result = schema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should validate against Agency tier Zod schema', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('agency');
    const schema = createWidgetConfigSchema('agency', false);

    const result = schema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should return different configs for different tiers', () => {
    // RED: Function doesn't exist yet
    const basicConfig = createDefaultConfig('basic');
    const proConfig = createDefaultConfig('pro');
    const agencyConfig = createDefaultConfig('agency');

    // Basic must have branding enabled
    expect(basicConfig.branding.brandingEnabled).toBe(true);
    expect(proConfig.branding.brandingEnabled).toBe(false);
    expect(agencyConfig.branding.brandingEnabled).toBe(false);

    // Basic cannot have advanced styling
    expect(basicConfig.advancedStyling.enabled).toBe(false);
    expect(proConfig.advancedStyling.enabled).toBe(true);
    expect(agencyConfig.advancedStyling.enabled).toBe(true);
  });

  it('should throw error for invalid tier', () => {
    // RED: Function doesn't exist yet
    // @ts-expect-error Testing invalid tier
    expect(() => createDefaultConfig('invalid')).toThrow();
  });

  it('should throw error for undefined tier', () => {
    // RED: Function doesn't exist yet
    // @ts-expect-error Testing undefined tier
    expect(() => createDefaultConfig(undefined)).toThrow();
  });

  it('should throw error for null tier', () => {
    // RED: Function doesn't exist yet
    // @ts-expect-error Testing null tier
    expect(() => createDefaultConfig(null)).toThrow();
  });
});

// =============================================================================
// 2. Basic Tier Tests (8 tests)
// =============================================================================

describe('createDefaultConfig - Basic Tier', () => {

  it('should enable branding for Basic tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('basic');

    expect(config.branding.brandingEnabled).toBe(true);
  });

  it('should disable advanced styling for Basic tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('basic');

    expect(config.advancedStyling.enabled).toBe(false);
  });

  it('should disable email transcript for Basic tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('basic');

    expect(config.features.emailTranscript).toBe(false);
  });

  it('should disable rating prompt for Basic tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('basic');

    expect(config.features.ratingPrompt).toBe(false);
  });

  it('should have all required branding fields for Basic tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('basic');

    expect(config.branding.companyName).toBeDefined();
    expect(config.branding.welcomeText).toBeDefined();
    expect(config.branding.responseTimeText).toBeDefined();
    expect(config.branding.firstMessage).toBeDefined();
    expect(config.branding.inputPlaceholder).toBeDefined();
    expect(config.branding.launcherIcon).toBeDefined();
  });

  it('should validate successfully against Basic tier schema', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('basic');
    const schema = createWidgetConfigSchema('basic', true);

    const result = schema.safeParse(config);
    expect(result.success).toBe(true);
    if (!result.success) {
      console.error('Validation errors:', result.error.errors);
    }
  });

  it('should have sensible default values for Basic tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('basic');

    expect(config.branding.companyName).toBe('My Company');
    expect(config.branding.welcomeText).toBe('Welcome! How can we help you today?');
    expect(config.branding.firstMessage).toBe('Hello! How can I assist you today?');
    expect(config.branding.inputPlaceholder).toBe('Type your message...');
    expect(config.branding.launcherIcon).toBe('chat');
    expect(config.theme.mode).toBe('light');
    expect(config.behavior.autoOpen).toBe(false);
  });

  it('should have empty webhook URL for Basic tier (user must configure)', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('basic');

    expect(config.connection.webhookUrl).toBe('');
  });
});

// =============================================================================
// 3. Pro Tier Tests (8 tests)
// =============================================================================

describe('createDefaultConfig - Pro Tier', () => {

  it('should disable branding by default for Pro tier (white-label ready)', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('pro');

    expect(config.branding.brandingEnabled).toBe(false);
  });

  it('should enable advanced styling for Pro tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('pro');

    expect(config.advancedStyling.enabled).toBe(true);
  });

  it('should enable email transcript for Pro tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('pro');

    expect(config.features.emailTranscript).toBe(true);
  });

  it('should enable rating prompt for Pro tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('pro');

    expect(config.features.ratingPrompt).toBe(true);
  });

  it('should have all required fields for Pro tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('pro');

    expect(config.branding).toBeDefined();
    expect(config.theme).toBeDefined();
    expect(config.advancedStyling).toBeDefined();
    expect(config.behavior).toBeDefined();
    expect(config.connection).toBeDefined();
    expect(config.features).toBeDefined();
  });

  it('should validate successfully against Pro tier schema', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('pro');
    const schema = createWidgetConfigSchema('pro', false);

    const result = schema.safeParse(config);
    expect(result.success).toBe(true);
    if (!result.success) {
      console.error('Validation errors:', result.error.errors);
    }
  });

  it('should have professional default values for Pro tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('pro');

    expect(config.theme.colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(config.theme.cornerRadius).toBeGreaterThan(0);
    expect(config.behavior.enableTypingIndicator).toBe(true);
    expect(config.behavior.persistMessages).toBe(true);
  });

  it('should have advanced styling with message and markdown defaults for Pro tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('pro');

    expect(config.advancedStyling.messages).toBeDefined();
    expect(config.advancedStyling.markdown).toBeDefined();
    expect(config.advancedStyling.messages.userMessageBackground).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(config.advancedStyling.messages.botMessageBackground).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(config.advancedStyling.markdown.codeBlockBackground).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

// =============================================================================
// 4. Agency Tier Tests (8 tests)
// =============================================================================

describe('createDefaultConfig - Agency Tier', () => {

  it('should disable branding for Agency tier (white-label)', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('agency');

    expect(config.branding.brandingEnabled).toBe(false);
  });

  it('should enable advanced styling with premium defaults for Agency tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('agency');

    expect(config.advancedStyling.enabled).toBe(true);
    expect(config.advancedStyling.messages).toBeDefined();
    expect(config.advancedStyling.markdown).toBeDefined();
  });

  it('should enable all features for Agency tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('agency');

    expect(config.features.emailTranscript).toBe(true);
    expect(config.features.ratingPrompt).toBe(true);
    expect(config.features.printTranscript).toBe(true);
  });

  it('should have all required fields for Agency tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('agency');

    expect(config.branding).toBeDefined();
    expect(config.theme).toBeDefined();
    expect(config.advancedStyling).toBeDefined();
    expect(config.behavior).toBeDefined();
    expect(config.connection).toBeDefined();
    expect(config.features).toBeDefined();
  });

  it('should validate successfully against Agency tier schema', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('agency');
    const schema = createWidgetConfigSchema('agency', false);

    const result = schema.safeParse(config);
    expect(result.success).toBe(true);
    if (!result.success) {
      console.error('Validation errors:', result.error.errors);
    }
  });

  it('should have premium default values for Agency tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('agency');

    expect(config.theme.colors).toBeDefined();
    expect(config.theme.colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(config.theme.darkOverride).toBeDefined();
    expect(config.behavior.enableTypingIndicator).toBe(true);
  });

  it('should have maximum customization options for Agency tier', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('agency');

    // Advanced styling should be enabled with all sub-configs
    expect(config.advancedStyling.enabled).toBe(true);
    expect(config.advancedStyling.messages.showAvatar).toBeDefined();
    expect(config.advancedStyling.messages.messageSpacing).toBeGreaterThanOrEqual(0);
    expect(config.advancedStyling.messages.bubblePadding).toBeGreaterThanOrEqual(5);
  });

  it('should have empty webhook URL for Agency tier (user must configure)', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('agency');

    expect(config.connection.webhookUrl).toBe('');
  });
});

// =============================================================================
// 5. Immutability Tests (3 tests)
// =============================================================================

describe('createDefaultConfig - Immutability', () => {

  it('should return a new object each time (not shared reference)', () => {
    // RED: Function doesn't exist yet
    const config1 = createDefaultConfig('basic');
    const config2 = createDefaultConfig('basic');

    expect(config1).not.toBe(config2);
    expect(config1.branding).not.toBe(config2.branding);
    expect(config1.theme).not.toBe(config2.theme);
  });

  it('should not affect subsequent calls when modifying returned config', () => {
    // RED: Function doesn't exist yet
    const config1 = createDefaultConfig('pro');
    config1.branding.companyName = 'Modified Company';
    config1.theme.colors.primary = '#FF0000';

    const config2 = createDefaultConfig('pro');

    expect(config2.branding.companyName).not.toBe('Modified Company');
    expect(config2.branding.companyName).toBe('My Company');
    expect(config2.theme.colors.primary).not.toBe('#FF0000');
  });

  it('should have deep immutability (nested objects are also cloned)', () => {
    // RED: Function doesn't exist yet
    const config1 = createDefaultConfig('agency');
    const config2 = createDefaultConfig('agency');

    // Modify nested object
    config1.theme.colors.primary = '#000000';
    config1.advancedStyling.messages.userMessageBackground = '#111111';

    // config2 should not be affected
    expect(config2.theme.colors.primary).not.toBe('#000000');
    expect(config2.advancedStyling.messages.userMessageBackground).not.toBe('#111111');
  });
});

// =============================================================================
// 6. Field Validation Tests (5 tests)
// =============================================================================

describe('createDefaultConfig - Field Validation', () => {

  it('should have all hex colors in valid format', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('pro');
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

    // Theme colors
    expect(config.theme.colors.primary).toMatch(hexColorRegex);
    expect(config.theme.colors.secondary).toMatch(hexColorRegex);
    expect(config.theme.colors.background).toMatch(hexColorRegex);
    expect(config.theme.colors.userMessage).toMatch(hexColorRegex);
    expect(config.theme.colors.botMessage).toMatch(hexColorRegex);
    expect(config.theme.colors.text).toMatch(hexColorRegex);
    expect(config.theme.colors.textSecondary).toMatch(hexColorRegex);
    expect(config.theme.colors.border).toMatch(hexColorRegex);
    expect(config.theme.colors.inputBackground).toMatch(hexColorRegex);
    expect(config.theme.colors.inputText).toMatch(hexColorRegex);

    // Advanced styling colors (if enabled)
    if (config.advancedStyling.enabled) {
      expect(config.advancedStyling.messages.userMessageBackground).toMatch(hexColorRegex);
      expect(config.advancedStyling.messages.userMessageText).toMatch(hexColorRegex);
      expect(config.advancedStyling.messages.botMessageBackground).toMatch(hexColorRegex);
      expect(config.advancedStyling.messages.botMessageText).toMatch(hexColorRegex);
      expect(config.advancedStyling.markdown.codeBlockBackground).toMatch(hexColorRegex);
      expect(config.advancedStyling.markdown.codeBlockText).toMatch(hexColorRegex);
      expect(config.advancedStyling.markdown.codeBlockBorder).toMatch(hexColorRegex);
      expect(config.advancedStyling.markdown.inlineCodeBackground).toMatch(hexColorRegex);
      expect(config.advancedStyling.markdown.inlineCodeText).toMatch(hexColorRegex);
      expect(config.advancedStyling.markdown.linkColor).toMatch(hexColorRegex);
      expect(config.advancedStyling.markdown.linkHoverColor).toMatch(hexColorRegex);
      expect(config.advancedStyling.markdown.tableHeaderBackground).toMatch(hexColorRegex);
      expect(config.advancedStyling.markdown.tableBorderColor).toMatch(hexColorRegex);
    }
  });

  it('should have all string lengths within limits', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('basic');

    expect(config.branding.companyName.length).toBeLessThanOrEqual(100);
    expect(config.branding.welcomeText.length).toBeLessThanOrEqual(200);
    expect(config.branding.responseTimeText.length).toBeLessThanOrEqual(100);
    expect(config.branding.firstMessage.length).toBeLessThanOrEqual(500);
    expect(config.branding.inputPlaceholder.length).toBeLessThanOrEqual(100);
    expect(config.theme.typography.fontFamily.length).toBeLessThanOrEqual(100);
  });

  it('should have all number ranges within bounds', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('pro');

    // Theme numbers
    expect(config.theme.cornerRadius).toBeGreaterThanOrEqual(0);
    expect(config.theme.cornerRadius).toBeLessThanOrEqual(20);
    expect(config.theme.position.offsetX).toBeGreaterThanOrEqual(0);
    expect(config.theme.position.offsetX).toBeLessThanOrEqual(500);
    expect(config.theme.position.offsetY).toBeGreaterThanOrEqual(0);
    expect(config.theme.position.offsetY).toBeLessThanOrEqual(500);
    expect(config.theme.typography.fontSize).toBeGreaterThanOrEqual(12);
    expect(config.theme.typography.fontSize).toBeLessThanOrEqual(20);

    // Behavior numbers
    expect(config.behavior.autoOpenDelay).toBeGreaterThanOrEqual(0);
    expect(config.behavior.autoOpenDelay).toBeLessThanOrEqual(60);

    // Connection numbers
    expect(config.connection.timeoutSeconds).toBeGreaterThanOrEqual(10);
    expect(config.connection.timeoutSeconds).toBeLessThanOrEqual(60);

    // Features numbers
    expect(config.features.attachments.maxFileSizeMB).toBeGreaterThanOrEqual(1);
    expect(config.features.attachments.maxFileSizeMB).toBeLessThanOrEqual(50);

    // Advanced styling numbers (if enabled)
    if (config.advancedStyling.enabled) {
      expect(config.advancedStyling.messages.messageSpacing).toBeGreaterThanOrEqual(0);
      expect(config.advancedStyling.messages.messageSpacing).toBeLessThanOrEqual(50);
      expect(config.advancedStyling.messages.bubblePadding).toBeGreaterThanOrEqual(5);
      expect(config.advancedStyling.messages.bubblePadding).toBeLessThanOrEqual(30);
    }
  });

  it('should have all required fields present', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('agency');

    // Branding required fields
    expect(config.branding.companyName).toBeDefined();
    expect(config.branding.welcomeText).toBeDefined();
    expect(config.branding.responseTimeText).toBeDefined();
    expect(config.branding.firstMessage).toBeDefined();
    expect(config.branding.inputPlaceholder).toBeDefined();
    expect(config.branding.launcherIcon).toBeDefined();
    expect(config.branding.brandingEnabled).toBeDefined();

    // Theme required fields
    expect(config.theme.mode).toBeDefined();
    expect(config.theme.colors).toBeDefined();
    expect(config.theme.darkOverride).toBeDefined();
    expect(config.theme.position).toBeDefined();
    expect(config.theme.size).toBeDefined();
    expect(config.theme.typography).toBeDefined();
    expect(config.theme.cornerRadius).toBeDefined();

    // Advanced styling required fields
    expect(config.advancedStyling.enabled).toBeDefined();
    expect(config.advancedStyling.messages).toBeDefined();
    expect(config.advancedStyling.markdown).toBeDefined();

    // Behavior required fields
    expect(config.behavior.autoOpen).toBeDefined();
    expect(config.behavior.autoOpenDelay).toBeDefined();
    expect(config.behavior.showCloseButton).toBeDefined();
    expect(config.behavior.persistMessages).toBeDefined();
    expect(config.behavior.enableSoundNotifications).toBeDefined();
    expect(config.behavior.enableTypingIndicator).toBeDefined();

    // Connection required fields
    expect(config.connection.webhookUrl).toBeDefined();
    expect(config.connection.route).toBeDefined();
    expect(config.connection.timeoutSeconds).toBeDefined();

    // Features required fields
    expect(config.features.attachments).toBeDefined();
    expect(config.features.emailTranscript).toBeDefined();
    expect(config.features.printTranscript).toBeDefined();
    expect(config.features.ratingPrompt).toBeDefined();
  });

  it('should not have any unexpected fields', () => {
    // RED: Function doesn't exist yet
    const config = createDefaultConfig('basic');

    // Check top-level keys
    const topLevelKeys = Object.keys(config);
    const expectedKeys = ['branding', 'theme', 'advancedStyling', 'behavior', 'connection', 'features'];
    expect(topLevelKeys.sort()).toEqual(expectedKeys.sort());

    // Check branding keys
    const brandingKeys = Object.keys(config.branding);
    const expectedBrandingKeys = [
      'companyName', 'welcomeText', 'logoUrl', 'responseTimeText',
      'firstMessage', 'inputPlaceholder', 'launcherIcon', 'customLauncherIconUrl', 'brandingEnabled'
    ];
    expect(brandingKeys.sort()).toEqual(expectedBrandingKeys.sort());
  });
});

// =============================================================================
// 7. Helper Function Tests (Optional - if implemented)
// =============================================================================

describe('createDefaultBranding', () => {

  it('should return valid BrandingConfig for Basic tier', () => {
    // RED: Function doesn't exist yet
    const branding = createDefaultBranding('basic');

    expect(branding).toBeDefined();
    expect(branding.brandingEnabled).toBe(true);
    expect(branding.companyName).toBe('My Company');
  });

  it('should return valid BrandingConfig for Pro tier', () => {
    // RED: Function doesn't exist yet
    const branding = createDefaultBranding('pro');

    expect(branding).toBeDefined();
    expect(branding.brandingEnabled).toBe(false);
  });
});

describe('createDefaultTheme', () => {

  it('should return valid ThemeConfig', () => {
    // RED: Function doesn't exist yet
    const theme = createDefaultTheme('basic');

    expect(theme).toBeDefined();
    expect(theme.mode).toBe('light');
    expect(theme.colors).toBeDefined();
    expect(theme.position).toBeDefined();
  });
});

describe('createDefaultBehavior', () => {

  it('should return valid BehaviorConfig', () => {
    // RED: Function doesn't exist yet
    const behavior = createDefaultBehavior('basic');

    expect(behavior).toBeDefined();
    expect(behavior.autoOpen).toBe(false);
    expect(behavior.persistMessages).toBe(true);
  });
});

describe('createDefaultConnection', () => {

  it('should return valid ConnectionConfig', () => {
    // RED: Function doesn't exist yet
    const connection = createDefaultConnection();

    expect(connection).toBeDefined();
    expect(connection.webhookUrl).toBe('');
    expect(connection.timeoutSeconds).toBe(30);
  });
});

describe('createDefaultFeatures', () => {

  it('should return valid FeaturesConfig for Basic tier', () => {
    // RED: Function doesn't exist yet
    const features = createDefaultFeatures('basic');

    expect(features).toBeDefined();
    expect(features.emailTranscript).toBe(false);
    expect(features.ratingPrompt).toBe(false);
  });

  it('should return valid FeaturesConfig for Pro tier', () => {
    // RED: Function doesn't exist yet
    const features = createDefaultFeatures('pro');

    expect(features).toBeDefined();
    expect(features.emailTranscript).toBe(true);
    expect(features.ratingPrompt).toBe(true);
  });
});
