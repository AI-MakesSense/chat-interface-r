/**
 * Unit Tests for Widget Validation Schemas
 *
 * Tests for Phase 3 Module 1C: Zod Validation Schemas
 *
 * RED Phase: These tests will FAIL because:
 * - lib/validation/widget-schema.ts doesn't exist yet
 * - All Zod schemas haven't been implemented yet
 * - Tier-aware validation logic doesn't exist yet
 *
 * Test Coverage:
 * 1. Branding Schema Tests (15 tests)
 * 2. Theme Schema Tests (20 tests)
 * 3. Advanced Styling Tests (12 tests)
 * 4. Behavior Schema Tests (10 tests)
 * 5. Connection Schema Tests (8 tests)
 * 6. Features Schema Tests (10 tests)
 * 7. Complete WidgetConfig Tests (15 tests)
 *
 * Total: 90 tests
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// These imports will FAIL - schemas don't exist yet (RED phase)
import {
  brandingSchema,
  themeSchema,
  advancedStylingSchema,
  behaviorSchema,
  connectionSchema,
  featuresSchema,
  widgetConfigBaseSchema,
  createWidgetConfigSchema,
  type LicenseTier,
} from '@/lib/validation/widget-schema';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Helper: Create valid branding config
 */
function createValidBrandingConfig() {
  return {
    companyName: 'Test Company',
    welcomeText: 'Welcome! How can we help you today?',
    logoUrl: 'https://example.com/logo.png',
    responseTimeText: 'Typically replies in minutes',
    firstMessage: 'Hi there! I\'m here to help.',
    inputPlaceholder: 'Type your message...',
    launcherIcon: 'chat' as const,
    customLauncherIconUrl: null,
    brandingEnabled: true,
  };
}

/**
 * Helper: Create valid theme colors
 */
function createValidThemeColors() {
  return {
    primary: '#0066FF',
    secondary: '#00B8D4',
    background: '#FFFFFF',
    userMessage: '#0066FF',
    botMessage: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
    inputBackground: '#FFFFFF',
    inputText: '#000000',
  };
}

/**
 * Helper: Create valid theme config
 */
function createValidThemeConfig() {
  return {
    mode: 'light' as const,
    colors: createValidThemeColors(),
    darkOverride: {
      enabled: false,
      colors: {},
    },
    position: {
      position: 'bottom-right' as const,
      offsetX: 20,
      offsetY: 20,
    },
    size: {
      mode: 'standard' as const,
      customWidth: null,
      customHeight: null,
      fullscreenOnMobile: true,
    },
    typography: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: 14,
      fontUrl: null,
      disableDefaultFont: false,
    },
    cornerRadius: 12,
  };
}

/**
 * Helper: Create valid advanced styling config
 */
function createValidAdvancedStylingConfig() {
  return {
    enabled: false,
    messages: {
      userMessageBackground: '#0066FF',
      userMessageText: '#FFFFFF',
      botMessageBackground: '#F5F5F5',
      botMessageText: '#000000',
      messageSpacing: 12,
      bubblePadding: 12,
      showAvatar: false,
      avatarUrl: null,
    },
    markdown: {
      codeBlockBackground: '#F5F5F5',
      codeBlockText: '#000000',
      codeBlockBorder: '#E0E0E0',
      inlineCodeBackground: '#F0F0F0',
      inlineCodeText: '#E01E5A',
      linkColor: '#0066FF',
      linkHoverColor: '#0052CC',
      tableHeaderBackground: '#F5F5F5',
      tableBorderColor: '#E0E0E0',
    },
  };
}

/**
 * Helper: Create valid behavior config
 */
function createValidBehaviorConfig() {
  return {
    autoOpen: false,
    autoOpenDelay: 0,
    showCloseButton: true,
    persistMessages: true,
    enableSoundNotifications: false,
    enableTypingIndicator: true,
  };
}

/**
 * Helper: Create valid connection config
 */
function createValidConnectionConfig() {
  return {
    webhookUrl: 'https://n8n.example.com/webhook/chat',
    route: null,
    timeoutSeconds: 30,
  };
}

/**
 * Helper: Create valid features config
 */
function createValidFeaturesConfig() {
  return {
    attachments: {
      enabled: false,
      allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg'],
      maxFileSizeMB: 10,
    },
    emailTranscript: false,
    printTranscript: true,
    ratingPrompt: false,
  };
}

/**
 * Helper: Create complete valid widget config
 */
function createValidWidgetConfig() {
  return {
    branding: createValidBrandingConfig(),
    theme: createValidThemeConfig(),
    advancedStyling: createValidAdvancedStylingConfig(),
    behavior: createValidBehaviorConfig(),
    connection: createValidConnectionConfig(),
    features: createValidFeaturesConfig(),
  };
}

// =============================================================================
// 1. BRANDING SCHEMA TESTS (15 tests)
// =============================================================================

describe('Branding Schema Validation', () => {
  describe('Valid branding config', () => {
    it('should validate complete valid branding config', () => {
      // FAIL REASON: brandingSchema doesn't exist yet
      const validConfig = createValidBrandingConfig();
      const result = brandingSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should allow null logoUrl', () => {
      // FAIL REASON: brandingSchema doesn't exist yet
      const config = { ...createValidBrandingConfig(), logoUrl: null };
      const result = brandingSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should allow all launcher icon types', () => {
      // FAIL REASON: brandingSchema doesn't exist yet
      const iconTypes = ['chat', 'support', 'bot', 'custom'] as const;

      iconTypes.forEach((icon) => {
        const config = { ...createValidBrandingConfig(), launcherIcon: icon };
        const result = brandingSchema.safeParse(config);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Invalid companyName', () => {
    it('should reject empty companyName', () => {
      // FAIL REASON: brandingSchema doesn't exist yet
      const config = { ...createValidBrandingConfig(), companyName: '' };
      const result = brandingSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('companyName');
      }
    });

    it('should reject companyName exceeding 100 characters', () => {
      // FAIL REASON: brandingSchema doesn't exist yet
      const config = {
        ...createValidBrandingConfig(),
        companyName: 'a'.repeat(101),
      };
      const result = brandingSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('companyName');
      }
    });
  });

  describe('Invalid welcomeText', () => {
    it('should reject empty welcomeText', () => {
      // FAIL REASON: brandingSchema doesn't exist yet
      const config = { ...createValidBrandingConfig(), welcomeText: '' };
      const result = brandingSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('welcomeText');
      }
    });

    it('should reject welcomeText exceeding 200 characters', () => {
      // FAIL REASON: brandingSchema doesn't exist yet
      const config = {
        ...createValidBrandingConfig(),
        welcomeText: 'a'.repeat(201),
      };
      const result = brandingSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('welcomeText');
      }
    });
  });

  describe('Invalid logoUrl', () => {
    it('should reject HTTP logoUrl (HTTPS required)', () => {
      // FAIL REASON: brandingSchema doesn't exist yet
      const config = {
        ...createValidBrandingConfig(),
        logoUrl: 'http://example.com/logo.png',
      };
      const result = brandingSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('logoUrl');
      }
    });

    it('should allow localhost URLs for logoUrl', () => {
      // FAIL REASON: brandingSchema doesn't exist yet
      const config = {
        ...createValidBrandingConfig(),
        logoUrl: 'http://localhost:3000/logo.png',
      };
      const result = brandingSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject malformed logoUrl', () => {
      // FAIL REASON: brandingSchema doesn't exist yet
      const config = {
        ...createValidBrandingConfig(),
        logoUrl: 'not-a-url',
      };
      const result = brandingSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('logoUrl');
      }
    });
  });

  describe('Launcher icon validation', () => {
    it('should reject invalid launcherIcon type', () => {
      // FAIL REASON: brandingSchema doesn't exist yet
      const config = {
        ...createValidBrandingConfig(),
        launcherIcon: 'invalid' as any,
      };
      const result = brandingSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('launcherIcon');
      }
    });

    it('should require customLauncherIconUrl when launcherIcon is custom', () => {
      // FAIL REASON: brandingSchema doesn't exist yet
      // NOTE: This validation happens in createWidgetConfigSchema, not brandingSchema
      const config = {
        ...createValidBrandingConfig(),
        launcherIcon: 'custom' as const,
        customLauncherIconUrl: null,
      };

      // Base schema should pass, but tier-aware validation should fail
      const baseResult = brandingSchema.safeParse(config);
      expect(baseResult.success).toBe(true);
    });

    it('should allow null customLauncherIconUrl when launcherIcon is not custom', () => {
      // FAIL REASON: brandingSchema doesn't exist yet
      const config = {
        ...createValidBrandingConfig(),
        launcherIcon: 'chat' as const,
        customLauncherIconUrl: null,
      };
      const result = brandingSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe('BrandingEnabled validation', () => {
    it('should accept brandingEnabled as true', () => {
      // FAIL REASON: brandingSchema doesn't exist yet
      const config = { ...createValidBrandingConfig(), brandingEnabled: true };
      const result = brandingSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept brandingEnabled as false', () => {
      // FAIL REASON: brandingSchema doesn't exist yet
      const config = { ...createValidBrandingConfig(), brandingEnabled: false };
      const result = brandingSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });
});

// =============================================================================
// 2. THEME SCHEMA TESTS (20 tests)
// =============================================================================

describe('Theme Schema Validation', () => {
  describe('Valid theme config', () => {
    it('should validate complete valid theme config', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const validConfig = createValidThemeConfig();
      const result = themeSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should accept light mode', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = { ...createValidThemeConfig(), mode: 'light' as const };
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept dark mode', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = { ...createValidThemeConfig(), mode: 'dark' as const };
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept auto mode', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = { ...createValidThemeConfig(), mode: 'auto' as const };
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid hex colors', () => {
    it('should reject color without # prefix', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = createValidThemeConfig();
      config.colors.primary = '0066FF'; // Missing #
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('primary');
      }
    });

    it('should reject color with wrong length (too short)', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = createValidThemeConfig();
      config.colors.primary = '#06F'; // Too short
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject color with wrong length (too long)', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = createValidThemeConfig();
      config.colors.primary = '#0066FFAA'; // Too long
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject color with invalid characters', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = createValidThemeConfig();
      config.colors.primary = '#00GGFF'; // Invalid G
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should accept uppercase hex colors', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = createValidThemeConfig();
      config.colors.primary = '#AABBCC';
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept lowercase hex colors', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = createValidThemeConfig();
      config.colors.primary = '#aabbcc';
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe('Position validation', () => {
    it('should accept all valid positions', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const positions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const;

      positions.forEach((position) => {
        const config = createValidThemeConfig();
        config.position.position = position;
        const result = themeSchema.safeParse(config);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid position', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = createValidThemeConfig();
      config.position.position = 'center' as any;
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject negative offsetX', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = createValidThemeConfig();
      config.position.offsetX = -10;
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject offsetX exceeding 500', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = createValidThemeConfig();
      config.position.offsetX = 501;
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('Size mode validation', () => {
    it('should accept all valid size modes', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const modes = ['compact', 'standard', 'expanded'] as const;

      modes.forEach((mode) => {
        const config = createValidThemeConfig();
        config.size.mode = mode;
        const result = themeSchema.safeParse(config);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid size mode', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = createValidThemeConfig();
      config.size.mode = 'large' as any;
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should allow null customWidth when not in custom mode', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = createValidThemeConfig();
      config.size.mode = 'standard';
      config.size.customWidth = null;
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe('Typography validation', () => {
    it('should reject fontSize below 12', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = createValidThemeConfig();
      config.typography.fontSize = 11;
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('fontSize');
      }
    });

    it('should accept fontSize of 12', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = createValidThemeConfig();
      config.typography.fontSize = 12;
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept fontSize of 20', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = createValidThemeConfig();
      config.typography.fontSize = 20;
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject fontSize above 20', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = createValidThemeConfig();
      config.typography.fontSize = 21;
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('fontSize');
      }
    });
  });

  describe('Corner radius validation', () => {
    it('should reject negative cornerRadius', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = { ...createValidThemeConfig(), cornerRadius: -1 };
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should accept cornerRadius of 0', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = { ...createValidThemeConfig(), cornerRadius: 0 };
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept cornerRadius of 20', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = { ...createValidThemeConfig(), cornerRadius: 20 };
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject cornerRadius above 20', () => {
      // FAIL REASON: themeSchema doesn't exist yet
      const config = { ...createValidThemeConfig(), cornerRadius: 21 };
      const result = themeSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// 3. ADVANCED STYLING TESTS (12 tests)
// =============================================================================

describe('Advanced Styling Schema Validation', () => {
  describe('Valid advanced styling', () => {
    it('should validate complete valid advanced styling config', () => {
      // FAIL REASON: advancedStylingSchema doesn't exist yet
      const validConfig = createValidAdvancedStylingConfig();
      const result = advancedStylingSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should validate when enabled is true with all fields', () => {
      // FAIL REASON: advancedStylingSchema doesn't exist yet
      const config = createValidAdvancedStylingConfig();
      config.enabled = true;
      const result = advancedStylingSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should validate when enabled is false', () => {
      // FAIL REASON: advancedStylingSchema doesn't exist yet
      const config = createValidAdvancedStylingConfig();
      config.enabled = false;
      const result = advancedStylingSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe('Message styling validation', () => {
    it('should reject invalid hex color in userMessageBackground', () => {
      // FAIL REASON: advancedStylingSchema doesn't exist yet
      const config = createValidAdvancedStylingConfig();
      config.messages.userMessageBackground = 'blue'; // Invalid hex
      const result = advancedStylingSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject invalid hex color in botMessageText', () => {
      // FAIL REASON: advancedStylingSchema doesn't exist yet
      const config = createValidAdvancedStylingConfig();
      config.messages.botMessageText = '#FFF'; // Too short
      const result = advancedStylingSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject negative messageSpacing', () => {
      // FAIL REASON: advancedStylingSchema doesn't exist yet
      const config = createValidAdvancedStylingConfig();
      config.messages.messageSpacing = -5;
      const result = advancedStylingSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject messageSpacing exceeding 50', () => {
      // FAIL REASON: advancedStylingSchema doesn't exist yet
      const config = createValidAdvancedStylingConfig();
      config.messages.messageSpacing = 51;
      const result = advancedStylingSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject bubblePadding below 5', () => {
      // FAIL REASON: advancedStylingSchema doesn't exist yet
      const config = createValidAdvancedStylingConfig();
      config.messages.bubblePadding = 4;
      const result = advancedStylingSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject bubblePadding above 30', () => {
      // FAIL REASON: advancedStylingSchema doesn't exist yet
      const config = createValidAdvancedStylingConfig();
      config.messages.bubblePadding = 31;
      const result = advancedStylingSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('Avatar URL validation', () => {
    it('should allow null avatarUrl when showAvatar is false', () => {
      // FAIL REASON: advancedStylingSchema doesn't exist yet
      const config = createValidAdvancedStylingConfig();
      config.messages.showAvatar = false;
      config.messages.avatarUrl = null;
      const result = advancedStylingSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should allow HTTPS avatarUrl', () => {
      // FAIL REASON: advancedStylingSchema doesn't exist yet
      const config = createValidAdvancedStylingConfig();
      config.messages.avatarUrl = 'https://example.com/avatar.png';
      const result = advancedStylingSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject HTTP avatarUrl', () => {
      // FAIL REASON: advancedStylingSchema doesn't exist yet
      const config = createValidAdvancedStylingConfig();
      config.messages.avatarUrl = 'http://example.com/avatar.png';
      const result = advancedStylingSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('Markdown styling validation', () => {
    it('should reject invalid hex colors in markdown config', () => {
      // FAIL REASON: advancedStylingSchema doesn't exist yet
      const config = createValidAdvancedStylingConfig();
      config.markdown.linkColor = 'rgb(0,0,255)'; // Invalid format
      const result = advancedStylingSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// 4. BEHAVIOR SCHEMA TESTS (10 tests)
// =============================================================================

describe('Behavior Schema Validation', () => {
  describe('Valid behavior config', () => {
    it('should validate complete valid behavior config', () => {
      // FAIL REASON: behaviorSchema doesn't exist yet
      const validConfig = createValidBehaviorConfig();
      const result = behaviorSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('AutoOpen delay validation', () => {
    it('should accept autoOpenDelay of 0 when autoOpen is false', () => {
      // FAIL REASON: behaviorSchema doesn't exist yet
      const config = createValidBehaviorConfig();
      config.autoOpen = false;
      config.autoOpenDelay = 0;
      const result = behaviorSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept autoOpenDelay of 5 when autoOpen is true', () => {
      // FAIL REASON: behaviorSchema doesn't exist yet
      const config = createValidBehaviorConfig();
      config.autoOpen = true;
      config.autoOpenDelay = 5;
      const result = behaviorSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject negative autoOpenDelay', () => {
      // FAIL REASON: behaviorSchema doesn't exist yet
      const config = createValidBehaviorConfig();
      config.autoOpenDelay = -1;
      const result = behaviorSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject autoOpenDelay exceeding 60', () => {
      // FAIL REASON: behaviorSchema doesn't exist yet
      const config = createValidBehaviorConfig();
      config.autoOpenDelay = 61;
      const result = behaviorSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should accept autoOpenDelay of 60', () => {
      // FAIL REASON: behaviorSchema doesn't exist yet
      const config = createValidBehaviorConfig();
      config.autoOpenDelay = 60;
      const result = behaviorSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe('Boolean field validation', () => {
    it('should accept all boolean fields as true', () => {
      // FAIL REASON: behaviorSchema doesn't exist yet
      const config = {
        autoOpen: true,
        autoOpenDelay: 5,
        showCloseButton: true,
        persistMessages: true,
        enableSoundNotifications: true,
        enableTypingIndicator: true,
      };
      const result = behaviorSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept all boolean fields as false', () => {
      // FAIL REASON: behaviorSchema doesn't exist yet
      const config = {
        autoOpen: false,
        autoOpenDelay: 0,
        showCloseButton: false,
        persistMessages: false,
        enableSoundNotifications: false,
        enableTypingIndicator: false,
      };
      const result = behaviorSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject non-boolean values for boolean fields', () => {
      // FAIL REASON: behaviorSchema doesn't exist yet
      const config = createValidBehaviorConfig();
      (config as any).autoOpen = 'true'; // String instead of boolean
      const result = behaviorSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should accept minimum valid values', () => {
      // FAIL REASON: behaviorSchema doesn't exist yet
      const config = {
        autoOpen: false,
        autoOpenDelay: 0,
        showCloseButton: true,
        persistMessages: false,
        enableSoundNotifications: false,
        enableTypingIndicator: false,
      };
      const result = behaviorSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept maximum valid values', () => {
      // FAIL REASON: behaviorSchema doesn't exist yet
      const config = {
        autoOpen: true,
        autoOpenDelay: 60,
        showCloseButton: true,
        persistMessages: true,
        enableSoundNotifications: true,
        enableTypingIndicator: true,
      };
      const result = behaviorSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });
});

// =============================================================================
// 5. CONNECTION SCHEMA TESTS (8 tests)
// =============================================================================

describe('Connection Schema Validation', () => {
  describe('Valid connection config', () => {
    it('should validate complete valid connection config', () => {
      // FAIL REASON: connectionSchema doesn't exist yet
      const validConfig = createValidConnectionConfig();
      const result = connectionSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('WebhookUrl validation', () => {
    it('should accept HTTPS webhookUrl', () => {
      // FAIL REASON: connectionSchema doesn't exist yet
      const config = {
        ...createValidConnectionConfig(),
        webhookUrl: 'https://n8n.example.com/webhook/chat',
      };
      const result = connectionSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject HTTP webhookUrl', () => {
      // FAIL REASON: connectionSchema doesn't exist yet
      const config = {
        ...createValidConnectionConfig(),
        webhookUrl: 'http://n8n.example.com/webhook/chat',
      };
      const result = connectionSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('webhookUrl');
      }
    });

    it('should allow localhost webhookUrl for testing', () => {
      // FAIL REASON: connectionSchema doesn't exist yet
      const config = {
        ...createValidConnectionConfig(),
        webhookUrl: 'http://localhost:5678/webhook/chat',
      };
      const result = connectionSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject empty webhookUrl', () => {
      // FAIL REASON: connectionSchema doesn't exist yet
      const config = {
        ...createValidConnectionConfig(),
        webhookUrl: '',
      };
      const result = connectionSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject malformed webhookUrl', () => {
      // FAIL REASON: connectionSchema doesn't exist yet
      const config = {
        ...createValidConnectionConfig(),
        webhookUrl: 'not-a-valid-url',
      };
      const result = connectionSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('TimeoutSeconds validation', () => {
    it('should reject timeoutSeconds below 10', () => {
      // FAIL REASON: connectionSchema doesn't exist yet
      const config = { ...createValidConnectionConfig(), timeoutSeconds: 9 };
      const result = connectionSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should accept timeoutSeconds of 10', () => {
      // FAIL REASON: connectionSchema doesn't exist yet
      const config = { ...createValidConnectionConfig(), timeoutSeconds: 10 };
      const result = connectionSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject timeoutSeconds above 60', () => {
      // FAIL REASON: connectionSchema doesn't exist yet
      const config = { ...createValidConnectionConfig(), timeoutSeconds: 61 };
      const result = connectionSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// 6. FEATURES SCHEMA TESTS (10 tests)
// =============================================================================

describe('Features Schema Validation', () => {
  describe('Valid features config', () => {
    it('should validate complete valid features config', () => {
      // FAIL REASON: featuresSchema doesn't exist yet
      const validConfig = createValidFeaturesConfig();
      const result = featuresSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('File attachments validation', () => {
    it('should accept attachments enabled with valid extensions', () => {
      // FAIL REASON: featuresSchema doesn't exist yet
      const config = createValidFeaturesConfig();
      config.attachments.enabled = true;
      config.attachments.allowedExtensions = ['.pdf', '.png', '.jpg'];
      const result = featuresSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept attachments disabled with empty extensions', () => {
      // FAIL REASON: featuresSchema doesn't exist yet
      const config = createValidFeaturesConfig();
      config.attachments.enabled = false;
      config.attachments.allowedExtensions = [];
      const result = featuresSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject invalid extension format (missing dot)', () => {
      // FAIL REASON: featuresSchema doesn't exist yet
      const config = createValidFeaturesConfig();
      config.attachments.allowedExtensions = ['pdf', '.png']; // Missing dot
      const result = featuresSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject too many extensions (over 20)', () => {
      // FAIL REASON: featuresSchema doesn't exist yet
      const config = createValidFeaturesConfig();
      config.attachments.allowedExtensions = Array(21).fill('.pdf');
      const result = featuresSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject maxFileSizeMB below 1', () => {
      // FAIL REASON: featuresSchema doesn't exist yet
      const config = createValidFeaturesConfig();
      config.attachments.maxFileSizeMB = 0;
      const result = featuresSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should accept maxFileSizeMB of 1', () => {
      // FAIL REASON: featuresSchema doesn't exist yet
      const config = createValidFeaturesConfig();
      config.attachments.maxFileSizeMB = 1;
      const result = featuresSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept maxFileSizeMB of 50', () => {
      // FAIL REASON: featuresSchema doesn't exist yet
      const config = createValidFeaturesConfig();
      config.attachments.maxFileSizeMB = 50;
      const result = featuresSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject maxFileSizeMB above 50', () => {
      // FAIL REASON: featuresSchema doesn't exist yet
      const config = createValidFeaturesConfig();
      config.attachments.maxFileSizeMB = 51;
      const result = featuresSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('Boolean features validation', () => {
    it('should accept emailTranscript as true', () => {
      // FAIL REASON: featuresSchema doesn't exist yet
      const config = { ...createValidFeaturesConfig(), emailTranscript: true };
      const result = featuresSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept ratingPrompt as true', () => {
      // FAIL REASON: featuresSchema doesn't exist yet
      const config = { ...createValidFeaturesConfig(), ratingPrompt: true };
      const result = featuresSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });
});

// =============================================================================
// 7. COMPLETE WIDGET CONFIG TESTS (15 tests)
// =============================================================================

describe('Complete Widget Config Validation', () => {
  describe('Base schema validation', () => {
    it('should validate complete valid widget config', () => {
      // FAIL REASON: widgetConfigBaseSchema doesn't exist yet
      const validConfig = createValidWidgetConfig();
      const result = widgetConfigBaseSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject config missing branding section', () => {
      // FAIL REASON: widgetConfigBaseSchema doesn't exist yet
      const config: any = createValidWidgetConfig();
      delete config.branding;
      const result = widgetConfigBaseSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject config missing theme section', () => {
      // FAIL REASON: widgetConfigBaseSchema doesn't exist yet
      const config: any = createValidWidgetConfig();
      delete config.theme;
      const result = widgetConfigBaseSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject config missing connection section', () => {
      // FAIL REASON: widgetConfigBaseSchema doesn't exist yet
      const config: any = createValidWidgetConfig();
      delete config.connection;
      const result = widgetConfigBaseSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('Tier-aware validation - Basic tier', () => {
    it('should accept valid Basic tier config with branding enabled', () => {
      // FAIL REASON: createWidgetConfigSchema doesn't exist yet
      const config = createValidWidgetConfig();
      config.branding.brandingEnabled = true;
      config.advancedStyling.enabled = false;
      config.features.emailTranscript = false;
      config.features.ratingPrompt = false;

      const schema = createWidgetConfigSchema('basic', true);
      const result = schema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject Basic tier config with branding disabled when required', () => {
      // FAIL REASON: createWidgetConfigSchema doesn't exist yet
      const config = createValidWidgetConfig();
      config.branding.brandingEnabled = false; // Not allowed for Basic tier

      const schema = createWidgetConfigSchema('basic', true);
      const result = schema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('brandingEnabled');
        expect(result.error.issues[0].message).toContain('Basic tier');
      }
    });

    it('should reject Basic tier config with advanced styling enabled', () => {
      // FAIL REASON: createWidgetConfigSchema doesn't exist yet
      const config = createValidWidgetConfig();
      config.advancedStyling.enabled = true; // Not allowed for Basic tier

      const schema = createWidgetConfigSchema('basic', true);
      const result = schema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const advancedStylingIssue = result.error.issues.find((issue) =>
          issue.path.includes('enabled')
        );
        expect(advancedStylingIssue).toBeDefined();
        expect(advancedStylingIssue?.message).toContain('Pro and Agency');
      }
    });

    it('should reject Basic tier config with emailTranscript enabled', () => {
      // FAIL REASON: createWidgetConfigSchema doesn't exist yet
      const config = createValidWidgetConfig();
      config.features.emailTranscript = true; // Not allowed for Basic tier

      const schema = createWidgetConfigSchema('basic', true);
      const result = schema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailIssue = result.error.issues.find((issue) =>
          issue.path.includes('emailTranscript')
        );
        expect(emailIssue).toBeDefined();
        expect(emailIssue?.message).toContain('Pro and Agency');
      }
    });

    it('should reject Basic tier config with ratingPrompt enabled', () => {
      // FAIL REASON: createWidgetConfigSchema doesn't exist yet
      const config = createValidWidgetConfig();
      config.features.ratingPrompt = true; // Not allowed for Basic tier

      const schema = createWidgetConfigSchema('basic', true);
      const result = schema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const ratingIssue = result.error.issues.find((issue) =>
          issue.path.includes('ratingPrompt')
        );
        expect(ratingIssue).toBeDefined();
        expect(ratingIssue?.message).toContain('Pro and Agency');
      }
    });
  });

  describe('Tier-aware validation - Pro tier', () => {
    it('should accept Pro tier config with branding disabled', () => {
      // FAIL REASON: createWidgetConfigSchema doesn't exist yet
      const config = createValidWidgetConfig();
      config.branding.brandingEnabled = false; // Allowed for Pro tier

      const schema = createWidgetConfigSchema('pro', false);
      const result = schema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept Pro tier config with advanced styling enabled', () => {
      // FAIL REASON: createWidgetConfigSchema doesn't exist yet
      const config = createValidWidgetConfig();
      config.advancedStyling.enabled = true; // Allowed for Pro tier

      const schema = createWidgetConfigSchema('pro', false);
      const result = schema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept Pro tier config with emailTranscript enabled', () => {
      // FAIL REASON: createWidgetConfigSchema doesn't exist yet
      const config = createValidWidgetConfig();
      config.features.emailTranscript = true; // Allowed for Pro tier

      const schema = createWidgetConfigSchema('pro', false);
      const result = schema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept Pro tier config with ratingPrompt enabled', () => {
      // FAIL REASON: createWidgetConfigSchema doesn't exist yet
      const config = createValidWidgetConfig();
      config.features.ratingPrompt = true; // Allowed for Pro tier

      const schema = createWidgetConfigSchema('pro', false);
      const result = schema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject Pro tier config with invalid theme colors', () => {
      // FAIL REASON: createWidgetConfigSchema doesn't exist yet
      const config = createValidWidgetConfig();
      config.theme.colors.primary = 'invalid-color';

      const schema = createWidgetConfigSchema('pro', false);
      const result = schema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('Tier-aware validation - Agency tier', () => {
    it('should accept Agency tier config with all features enabled', () => {
      // FAIL REASON: createWidgetConfigSchema doesn't exist yet
      const config = createValidWidgetConfig();
      config.branding.brandingEnabled = false;
      config.advancedStyling.enabled = true;
      config.features.emailTranscript = true;
      config.features.ratingPrompt = true;

      const schema = createWidgetConfigSchema('agency', false);
      const result = schema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe('Conditional validation rules', () => {
    it('should reject custom launcherIcon without customLauncherIconUrl', () => {
      // FAIL REASON: createWidgetConfigSchema doesn't exist yet
      const config = createValidWidgetConfig();
      config.branding.launcherIcon = 'custom';
      config.branding.customLauncherIconUrl = null;

      const schema = createWidgetConfigSchema('pro', false);
      const result = schema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const customIconIssue = result.error.issues.find((issue) =>
          issue.path.includes('customLauncherIconUrl')
        );
        expect(customIconIssue).toBeDefined();
        expect(customIconIssue?.message).toContain('custom');
      }
    });

    it('should accept custom launcherIcon with valid customLauncherIconUrl', () => {
      // FAIL REASON: createWidgetConfigSchema doesn't exist yet
      const config = createValidWidgetConfig();
      config.branding.launcherIcon = 'custom';
      config.branding.customLauncherIconUrl = 'https://example.com/icon.png';

      const schema = createWidgetConfigSchema('pro', false);
      const result = schema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject showAvatar without avatarUrl when advanced styling enabled', () => {
      // FAIL REASON: createWidgetConfigSchema doesn't exist yet
      const config = createValidWidgetConfig();
      config.advancedStyling.enabled = true;
      config.advancedStyling.messages.showAvatar = true;
      config.advancedStyling.messages.avatarUrl = null;

      const schema = createWidgetConfigSchema('pro', false);
      const result = schema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const avatarIssue = result.error.issues.find((issue) =>
          issue.path.includes('avatarUrl')
        );
        expect(avatarIssue).toBeDefined();
      }
    });
  });
});
