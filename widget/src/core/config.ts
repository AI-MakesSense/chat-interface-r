/**
 * Configuration Manager
 *
 * Purpose: Manages widget configuration with defaults, validation, and window reading
 * Responsibility: Config merging, validation, and environment integration
 * Assumptions: Config structure follows WidgetConfig interface
 */

import { WidgetConfig } from '../types';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: WidgetConfig = {
  branding: {
    companyName: 'Support',
    welcomeText: 'How can we help?',
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
    maxFileSizeKB: 5120,
  },
  connection: {
    webhookUrl: '',
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
  // Check webhook URL
  if (config.connection) {
    if (!config.connection.webhookUrl) {
      throw new Error('webhookUrl is required');
    }

    if (!config.connection.webhookUrl.startsWith('https://')) {
      throw new Error('webhookUrl must use HTTPS');
    }
  }

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

  const config = (window as any).ChatWidgetConfig;

  if (!config || typeof config !== 'object') {
    return {};
  }

  return config;
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