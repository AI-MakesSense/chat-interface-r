/**
 * Configuration Helper Functions
 *
 * Shared utilities for widget configuration manipulation.
 * Used by both widget creation and update API routes.
 */

/**
 * Deep merge two objects recursively
 * Used to merge user config with defaults while preserving nested structure
 */
export function deepMerge(target: any, source: any): any {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      // Recursively merge nested objects
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      // Direct assignment for primitives and arrays
      output[key] = source[key];
    }
  }

  return output;
}

/**
 * Strip legacy config properties that conflict with new structure
 *
 * Removes old nested objects like:
 * - theme.mode (old) vs themeMode (new)
 * - theme.colors (old) vs color system (new)
 * - behavior, advancedStyling, etc.
 */
export function stripLegacyConfigProperties(config: any): any {
  const cleaned = { ...config };

  // Remove legacy nested theme object if it exists
  // The new structure uses flat properties like themeMode, not nested theme.mode
  if (cleaned.theme && typeof cleaned.theme === 'object') {
    delete cleaned.theme;
  }

  // Remove other legacy nested structures
  delete cleaned.behavior;
  delete cleaned.advancedStyling;

  return cleaned;
}

/**
 * Sanitize configuration to ensure it passes validation
 * Handles legacy data, invalid formats, and tier restrictions
 */
export function sanitizeConfig(config: any, tier: string): any {
  const sanitized = JSON.parse(JSON.stringify(config)); // Deep clone

  // Helper to fix hex colors
  const fixColor = (color: any, defaultColor: string = '#000000') => {
    if (!color || typeof color !== 'string') return defaultColor;
    // Fix 3-digit hex
    if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
      return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    }
    // Return if valid 6-digit hex
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color;
    return defaultColor;
  };

  // Helper to fix URLs
  const fixUrl = (url: any) => {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('http://')) return url.replace('http://', 'https://');
    if (url.startsWith('https://') || url.includes('localhost')) return url;
    return null;
  };

  // 1. Tier Restrictions (Basic/Free)
  if (tier === 'basic' || tier === 'free') {
    if (sanitized.advancedStyling) sanitized.advancedStyling.enabled = false;
    if (sanitized.features) {
      sanitized.features.emailTranscript = false;
      sanitized.features.ratingPrompt = false;
    }
    if (sanitized.branding) sanitized.branding.brandingEnabled = true;
  }

  // 2. Data Integrity - Branding
  if (sanitized.branding) {
    if (!sanitized.branding.companyName) sanitized.branding.companyName = 'My Company';
    if (!sanitized.branding.welcomeText) sanitized.branding.welcomeText = 'How can we help?';
    if (!sanitized.branding.firstMessage) sanitized.branding.firstMessage = 'Hello! How can I assist you today?';

    // Fix launcher icon
    if (sanitized.branding.launcherIcon === 'custom') {
      const validUrl = fixUrl(sanitized.branding.customLauncherIconUrl);
      if (!validUrl) {
        sanitized.branding.launcherIcon = 'chat'; // Revert to default if URL invalid
        sanitized.branding.customLauncherIconUrl = null;
      } else {
        sanitized.branding.customLauncherIconUrl = validUrl;
      }
    } else {
      // Ensure it's null if not custom, to avoid validation errors
      sanitized.branding.customLauncherIconUrl = null;
    }

    sanitized.branding.logoUrl = fixUrl(sanitized.branding.logoUrl);
  }

  // 3. Data Integrity - Colors (Recursive fix for all color fields)
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

  // 4. Theme Mode
  if (sanitized.themeMode && !['light', 'dark'].includes(sanitized.themeMode)) {
    delete sanitized.themeMode; // Let it fall back to default
  }

  return sanitized;
}
