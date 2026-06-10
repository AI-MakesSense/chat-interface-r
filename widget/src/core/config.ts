/**
 * Configuration Manager
 *
 * Purpose: Manages widget configuration with defaults, validation, and window reading
 * Responsibility: Config merging, validation, and environment integration
 * Assumptions: Config structure follows WidgetConfig interface
 */

import { WidgetConfig } from '../types';

// NOTE: These literals MUST mirror lib/widget-config/schema.ts defaults.
// The runtime cannot import the Zod schema (bundle size — type-only imports only;
// never import runtime VALUES from lib/widget-config into widget/src).
// Defaults correctness is guarded by tests/widget/config-defaults-parity.test.ts.
//
// Overlapping fields and their canonical equivalents:
//   branding.companyName        ← brandingSchema   default 'My Company'
//   branding.welcomeText        ← brandingSchema   default 'Welcome! How can we help you today?'
//   branding.firstMessage       ← brandingSchema   default 'Hello! How can I assist you today?'
//   style.position              ← positionSchema   default 'bottom-right'
//   style.fontSize              ← typographySchema default 14
//   features.fileAttachmentsEnabled ← attachmentsSchema default false
//   features.allowedExtensions  ← attachmentsSchema default []
//   features.maxFileSizeKB      ← attachmentsSchema default maxFileSizeMB(10) * 1024 = 10240
//
// Non-overlapping / translated-shape fields (kept local, no canonical equivalent):
//   style.theme        — widget receives a boolean themeMode, canonical is theme.mode enum
//   style.primaryColor — widget fallback only; server sends theme.color.accent.primary.
//     Intentionally '#00bfff' (NOT canonical accent '#0ea5e9'): legacy renderers
//     (ui-builder, header, message-list, normal/portal-renderer) read this value
//     directly as a background color, not as an accent token, so changing it would
//     recolor misconfigured/window-only embeds that never receive a server payload.
//   style.backgroundColor, textColor, cornerRadius, fontFamily — legacy style fields
//   connection.captureContext — kept local; canonical connection is server-side only

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: WidgetConfig = {
  branding: {
    companyName: 'My Company',
    welcomeText: 'Welcome! How can we help you today?',
    firstMessage: 'Hello! How can I assist you today?',
  },
  style: {
    theme: 'auto',
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
    maxFileSizeKB: 10240,
  },
  connection: {
    captureContext: true,
  },
};

/**
 * Deep merges user config with default config
 * @param userConfig - Partial user configuration
 * @returns Complete merged configuration
 */
export function mergeConfig(userConfig: Partial<WidgetConfig>): WidgetConfig {
  return {
    branding: {
      ...DEFAULT_CONFIG.branding,
      ...(userConfig.branding || {}),
    },
    style: {
      ...DEFAULT_CONFIG.style,
      ...(userConfig.style || {}),
    },
    features: {
      ...DEFAULT_CONFIG.features,
      ...(userConfig.features || {}),
    },
    connection: {
      ...DEFAULT_CONFIG.connection,
      ...(userConfig.connection || {}),
    },
  };
}

/**
 * Validates widget configuration
 * @param config - Configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateConfig(config: Partial<WidgetConfig>): void {
  // Check style configuration
  if (config.style) {
    // Validate primary color
    if (config.style.primaryColor !== undefined) {
      const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
      if (!hexRegex.test(config.style.primaryColor)) {
        throw new Error('primaryColor must be a valid hex color');
      }
    }

    // Validate theme
    if (config.style.theme !== undefined) {
      const validThemes = ['light', 'dark', 'auto'];
      if (!validThemes.includes(config.style.theme)) {
        throw new Error('theme must be "light", "dark", or "auto"');
      }
    }

    // Validate position
    if (config.style.position !== undefined) {
      const validPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
      if (!validPositions.includes(config.style.position)) {
        throw new Error('position must be one of: bottom-right, bottom-left, top-right, top-left');
      }
    }
  }
}

/**
 * Reads configuration from window.ChatWidgetConfig
 * @returns User configuration or empty object
 */
export function readConfigFromWindow(): Partial<WidgetConfig> {
  if (typeof window === 'undefined') {
    return {};
  }

  const runtimeConfig = (window as any).ChatWidgetConfig;

  if (!runtimeConfig || typeof runtimeConfig !== 'object') {
    return {};
  }

  if (runtimeConfig.uiConfig) {
    return runtimeConfig.uiConfig;
  }

  return runtimeConfig;
}

/**
 * Reads license flags from window.__LICENSE_FLAGS__
 * @returns License flags or default values
 */
export function readLicenseFlagsFromWindow(): { branding: boolean } {
  if (typeof window === 'undefined') {
    return { branding: true };
  }

  const flags = (window as any).__LICENSE_FLAGS__;

  if (!flags || typeof flags !== 'object') {
    return { branding: true };
  }

  return {
    branding: flags.branding !== undefined ? flags.branding : true,
  };
}
