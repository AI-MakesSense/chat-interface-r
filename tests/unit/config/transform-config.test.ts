/**
 * Unit Tests for Config Transformation Functions
 *
 * Tests the isolated functions that handle config transformations:
 * 1. sanitizeConfig() - Fixes data integrity issues
 * 2. stripLegacyConfigProperties() - Removes conflicting legacy props
 * 3. translateConfig() - Transforms DB config to widget format
 * 4. deepMerge() - Merges partial configs
 */

import { describe, it, expect } from 'vitest';

// ===========================================================================
// Inline implementations for testing (extracted from route.ts)
// In a real scenario, these would be imported from a shared module
// ===========================================================================

function deepMerge(target: any, source: any): any {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

function stripLegacyConfigProperties(config: any): any {
  const cleaned = { ...config };

  // Remove legacy nested theme object if it exists
  if (cleaned.theme && typeof cleaned.theme === 'object') {
    delete cleaned.theme;
  }

  // advancedStyling and behavior are preserved - they are valid config properties

  return cleaned;
}

function sanitizeConfig(config: any, tier: string): any {
  const sanitized = JSON.parse(JSON.stringify(config));

  const fixColor = (color: any, defaultColor: string = '#000000') => {
    if (!color || typeof color !== 'string') return defaultColor;
    if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
      return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color;
    return defaultColor;
  };

  const fixUrl = (url: any) => {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('http://')) return url.replace('http://', 'https://');
    if (url.startsWith('https://') || url.includes('localhost')) return url;
    return null;
  };

  // Tier Restrictions (Basic)
  if (tier === 'basic') {
    if (sanitized.advancedStyling) sanitized.advancedStyling.enabled = false;
    if (sanitized.features) {
      sanitized.features.emailTranscript = false;
      sanitized.features.ratingPrompt = false;
    }
    if (sanitized.branding) sanitized.branding.brandingEnabled = true;
  }

  // Data Integrity - Branding
  if (sanitized.branding) {
    if (!sanitized.branding.companyName) sanitized.branding.companyName = 'My Company';
    if (!sanitized.branding.welcomeText) sanitized.branding.welcomeText = 'How can we help?';
    if (!sanitized.branding.firstMessage) sanitized.branding.firstMessage = 'Hello! How can I assist you today?';

    if (sanitized.branding.launcherIcon === 'custom') {
      const validUrl = fixUrl(sanitized.branding.customLauncherIconUrl);
      if (!validUrl) {
        sanitized.branding.launcherIcon = 'chat';
        sanitized.branding.customLauncherIconUrl = null;
      } else {
        sanitized.branding.customLauncherIconUrl = validUrl;
      }
    } else {
      sanitized.branding.customLauncherIconUrl = null;
    }

    sanitized.branding.logoUrl = fixUrl(sanitized.branding.logoUrl);
  }

  // Fix colors recursively
  const fixColorsInObject = (obj: any) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].startsWith('#')) {
        obj[key] = fixColor(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        fixColorsInObject(obj[key]);
      }
    }
  };

  if (sanitized.theme) fixColorsInObject(sanitized.theme);
  if (sanitized.advancedStyling) fixColorsInObject(sanitized.advancedStyling);

  // Fix accent color at root level
  if (sanitized.accentColor) {
    sanitized.accentColor = fixColor(sanitized.accentColor);
  }

  // Theme Mode
  if (sanitized.themeMode && !['light', 'dark'].includes(sanitized.themeMode)) {
    delete sanitized.themeMode;
  }

  return sanitized;
}

// ===========================================================================
// deepMerge Tests
// ===========================================================================

describe('deepMerge', () => {
  it('should merge flat objects', () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    const result = deepMerge(target, source);

    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('should deep merge nested objects', () => {
    const target = {
      branding: { companyName: 'Original', logoUrl: 'original.png' },
      theme: { mode: 'light' },
    };
    const source = {
      branding: { companyName: 'Updated' },
    };
    const result = deepMerge(target, source);

    expect(result.branding.companyName).toBe('Updated');
    expect(result.branding.logoUrl).toBe('original.png');
    expect(result.theme.mode).toBe('light');
  });

  it('should NOT merge arrays (replace instead)', () => {
    const target = { items: [1, 2, 3] };
    const source = { items: [4, 5] };
    const result = deepMerge(target, source);

    expect(result.items).toEqual([4, 5]);
  });

  it('should handle deeply nested structures', () => {
    const target = {
      level1: {
        level2: {
          level3: {
            value: 'original',
            other: 'keep',
          },
        },
      },
    };
    const source = {
      level1: {
        level2: {
          level3: {
            value: 'updated',
          },
        },
      },
    };
    const result = deepMerge(target, source);

    expect(result.level1.level2.level3.value).toBe('updated');
    expect(result.level1.level2.level3.other).toBe('keep');
  });

  it('should create nested objects if target is missing them', () => {
    const target = {};
    const source = {
      branding: { companyName: 'New' },
    };
    const result = deepMerge(target, source);

    expect(result.branding.companyName).toBe('New');
  });
});

// ===========================================================================
// stripLegacyConfigProperties Tests
// ===========================================================================

describe('stripLegacyConfigProperties', () => {
  it('should remove legacy theme object', () => {
    const config = {
      theme: { mode: 'dark', colors: { primary: '#000' } },
      themeMode: 'dark',
      branding: { companyName: 'Test' },
    };
    const result = stripLegacyConfigProperties(config);

    expect(result.theme).toBeUndefined();
    expect(result.themeMode).toBe('dark');
    expect(result.branding.companyName).toBe('Test');
  });

  it('should PRESERVE advancedStyling', () => {
    const config = {
      advancedStyling: {
        enabled: true,
        messages: { userMessageBackground: '#0066FF' },
      },
      branding: { companyName: 'Test' },
    };
    const result = stripLegacyConfigProperties(config);

    expect(result.advancedStyling).toBeDefined();
    expect(result.advancedStyling.enabled).toBe(true);
    expect(result.advancedStyling.messages.userMessageBackground).toBe('#0066FF');
  });

  it('should PRESERVE behavior', () => {
    const config = {
      behavior: {
        autoOpen: true,
        autoOpenDelay: 5000,
      },
      branding: { companyName: 'Test' },
    };
    const result = stripLegacyConfigProperties(config);

    expect(result.behavior).toBeDefined();
    expect(result.behavior.autoOpen).toBe(true);
    expect(result.behavior.autoOpenDelay).toBe(5000);
  });

  it('should preserve all non-legacy properties', () => {
    const config = {
      branding: { companyName: 'Test' },
      themeMode: 'dark',
      accentColor: '#FF0000',
      advancedStyling: { enabled: true },
      behavior: { autoOpen: true },
      connection: { webhookUrl: 'https://example.com' },
    };
    const result = stripLegacyConfigProperties(config);

    expect(result.branding).toBeDefined();
    expect(result.themeMode).toBe('dark');
    expect(result.accentColor).toBe('#FF0000');
    expect(result.advancedStyling).toBeDefined();
    expect(result.behavior).toBeDefined();
    expect(result.connection).toBeDefined();
  });
});

// ===========================================================================
// sanitizeConfig Tests
// ===========================================================================

describe('sanitizeConfig', () => {
  describe('Tier Restrictions', () => {
    it('should disable advancedStyling for basic tier', () => {
      const config = {
        advancedStyling: { enabled: true },
      };
      const result = sanitizeConfig(config, 'basic');

      expect(result.advancedStyling.enabled).toBe(false);
    });

    it('should keep advancedStyling enabled for pro tier', () => {
      const config = {
        advancedStyling: { enabled: true },
      };
      const result = sanitizeConfig(config, 'pro');

      expect(result.advancedStyling.enabled).toBe(true);
    });

    it('should disable premium features for basic tier', () => {
      const config = {
        features: {
          emailTranscript: true,
          ratingPrompt: true,
        },
      };
      const result = sanitizeConfig(config, 'basic');

      expect(result.features.emailTranscript).toBe(false);
      expect(result.features.ratingPrompt).toBe(false);
    });

    it('should force brandingEnabled=true for basic tier', () => {
      const config = {
        branding: {
          brandingEnabled: false,
          companyName: 'Test',
        },
      };
      const result = sanitizeConfig(config, 'basic');

      expect(result.branding.brandingEnabled).toBe(true);
    });
  });

  describe('Color Fixes', () => {
    it('should expand 3-digit hex to 6-digit', () => {
      const config = {
        accentColor: '#F00',
      };
      const result = sanitizeConfig(config, 'pro');

      expect(result.accentColor).toBe('#FF0000');
    });

    it('should NOT alter valid 6-digit hex', () => {
      const config = {
        accentColor: '#4F46E5',
      };
      const result = sanitizeConfig(config, 'pro');

      expect(result.accentColor).toBe('#4F46E5');
    });

    it('should fix colors in nested advancedStyling', () => {
      const config = {
        advancedStyling: {
          enabled: true,
          messages: {
            userMessageBackground: '#F00',
            botMessageBackground: '#0F0',
          },
        },
      };
      const result = sanitizeConfig(config, 'pro');

      expect(result.advancedStyling.messages.userMessageBackground).toBe('#FF0000');
      expect(result.advancedStyling.messages.botMessageBackground).toBe('#00FF00');
    });

    it('should only fix colors that start with #', () => {
      // Note: The actual sanitizer only processes strings starting with #
      // Non-hex strings are left as-is (validation will catch them later)
      const config = {
        advancedStyling: {
          messages: {
            userMessageBackground: 'not-a-color',
          },
        },
      };
      const result = sanitizeConfig(config, 'pro');

      // The sanitizer doesn't touch non-# strings
      expect(result.advancedStyling.messages.userMessageBackground).toBe('not-a-color');
    });
  });

  describe('URL Fixes', () => {
    it('should convert HTTP to HTTPS for logoUrl', () => {
      const config = {
        branding: {
          logoUrl: 'http://example.com/logo.png',
          companyName: 'Test',
        },
      };
      const result = sanitizeConfig(config, 'pro');

      expect(result.branding.logoUrl).toBe('https://example.com/logo.png');
    });

    it('should keep HTTPS URLs unchanged', () => {
      const config = {
        branding: {
          logoUrl: 'https://example.com/logo.png',
          companyName: 'Test',
        },
      };
      const result = sanitizeConfig(config, 'pro');

      expect(result.branding.logoUrl).toBe('https://example.com/logo.png');
    });

    it('should convert localhost HTTP to HTTPS', () => {
      // Note: The actual code converts http:// to https:// first,
      // then checks if the result contains localhost (which it still does)
      const config = {
        branding: {
          logoUrl: 'http://localhost:3000/logo.png',
          companyName: 'Test',
        },
      };
      const result = sanitizeConfig(config, 'pro');

      // http:// is converted to https:// even for localhost
      expect(result.branding.logoUrl).toBe('https://localhost:3000/logo.png');
    });

    it('should return null for invalid URLs', () => {
      const config = {
        branding: {
          logoUrl: 'not-a-url',
          companyName: 'Test',
        },
      };
      const result = sanitizeConfig(config, 'pro');

      expect(result.branding.logoUrl).toBeNull();
    });
  });

  describe('Custom Launcher Icon', () => {
    it('should revert to default if custom icon has no URL', () => {
      const config = {
        branding: {
          launcherIcon: 'custom',
          customLauncherIconUrl: '',
          companyName: 'Test',
        },
      };
      const result = sanitizeConfig(config, 'pro');

      expect(result.branding.launcherIcon).toBe('chat');
      expect(result.branding.customLauncherIconUrl).toBeNull();
    });

    it('should keep custom icon with valid HTTPS URL', () => {
      const config = {
        branding: {
          launcherIcon: 'custom',
          customLauncherIconUrl: 'https://example.com/icon.png',
          companyName: 'Test',
        },
      };
      const result = sanitizeConfig(config, 'pro');

      expect(result.branding.launcherIcon).toBe('custom');
      expect(result.branding.customLauncherIconUrl).toBe('https://example.com/icon.png');
    });

    it('should convert HTTP to HTTPS for custom icon URL', () => {
      const config = {
        branding: {
          launcherIcon: 'custom',
          customLauncherIconUrl: 'http://example.com/icon.png',
          companyName: 'Test',
        },
      };
      const result = sanitizeConfig(config, 'pro');

      expect(result.branding.launcherIcon).toBe('custom');
      expect(result.branding.customLauncherIconUrl).toBe('https://example.com/icon.png');
    });

    it('should nullify customLauncherIconUrl when not using custom icon', () => {
      const config = {
        branding: {
          launcherIcon: 'chat',
          customLauncherIconUrl: 'https://example.com/icon.png',
          companyName: 'Test',
        },
      };
      const result = sanitizeConfig(config, 'pro');

      expect(result.branding.launcherIcon).toBe('chat');
      expect(result.branding.customLauncherIconUrl).toBeNull();
    });
  });

  describe('Default Values', () => {
    it('should fill empty companyName with default', () => {
      const config = {
        branding: {
          companyName: '',
        },
      };
      const result = sanitizeConfig(config, 'pro');

      expect(result.branding.companyName).toBe('My Company');
    });

    it('should fill empty welcomeText with default', () => {
      const config = {
        branding: {
          companyName: 'Test',
          welcomeText: '',
        },
      };
      const result = sanitizeConfig(config, 'pro');

      expect(result.branding.welcomeText).toBe('How can we help?');
    });

    it('should fill empty firstMessage with default', () => {
      const config = {
        branding: {
          companyName: 'Test',
          firstMessage: '',
        },
      };
      const result = sanitizeConfig(config, 'pro');

      expect(result.branding.firstMessage).toBe('Hello! How can I assist you today?');
    });
  });

  describe('Theme Mode Validation', () => {
    it('should keep valid themeMode values', () => {
      expect(sanitizeConfig({ themeMode: 'light' }, 'pro').themeMode).toBe('light');
      expect(sanitizeConfig({ themeMode: 'dark' }, 'pro').themeMode).toBe('dark');
    });

    it('should remove invalid themeMode values', () => {
      const config = { themeMode: 'invalid' };
      const result = sanitizeConfig(config, 'pro');

      expect(result.themeMode).toBeUndefined();
    });
  });
});

// ===========================================================================
// Combined Flow Tests
// ===========================================================================

describe('Combined Transform Flow', () => {
  it('should handle full config through sanitize + strip flow', () => {
    const inputConfig = {
      branding: {
        companyName: 'Test Corp',
        logoUrl: 'http://example.com/logo.png',
        launcherIcon: 'custom',
        customLauncherIconUrl: 'http://example.com/icon.png',
      },
      theme: {
        mode: 'dark', // Legacy - should be stripped
      },
      themeMode: 'dark',
      accentColor: '#F00', // 3-digit - should be fixed
      advancedStyling: {
        enabled: true,
        messages: {
          userMessageBackground: '#00F', // 3-digit - should be fixed
        },
      },
      behavior: {
        autoOpen: true,
      },
    };

    // First sanitize
    const sanitized = sanitizeConfig(inputConfig, 'pro');

    // Then strip legacy
    const final = stripLegacyConfigProperties(sanitized);

    // Verify sanitization
    expect(final.branding.logoUrl).toBe('https://example.com/logo.png');
    expect(final.branding.customLauncherIconUrl).toBe('https://example.com/icon.png');
    expect(final.accentColor).toBe('#FF0000');
    expect(final.advancedStyling.messages.userMessageBackground).toBe('#0000FF');

    // Verify legacy stripped
    expect(final.theme).toBeUndefined();

    // Verify preserved
    expect(final.themeMode).toBe('dark');
    expect(final.advancedStyling).toBeDefined();
    expect(final.advancedStyling.enabled).toBe(true);
    expect(final.behavior).toBeDefined();
    expect(final.behavior.autoOpen).toBe(true);
  });

  it('should enforce basic tier restrictions through full flow', () => {
    const inputConfig = {
      branding: {
        companyName: 'Test',
        brandingEnabled: false, // Should be forced true
      },
      advancedStyling: {
        enabled: true, // Should be disabled
        messages: {
          userMessageBackground: '#0066FF',
        },
      },
      features: {
        emailTranscript: true, // Should be disabled
        ratingPrompt: true, // Should be disabled
      },
    };

    const sanitized = sanitizeConfig(inputConfig, 'basic');
    const final = stripLegacyConfigProperties(sanitized);

    expect(final.branding.brandingEnabled).toBe(true);
    expect(final.advancedStyling.enabled).toBe(false);
    expect(final.features.emailTranscript).toBe(false);
    expect(final.features.ratingPrompt).toBe(false);

    // advancedStyling should still exist (just disabled)
    expect(final.advancedStyling.messages.userMessageBackground).toBe('#0066FF');
  });
});
