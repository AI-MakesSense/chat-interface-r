/**
 * Default Widget Configuration Generators
 *
 * Purpose: Generates default widget configurations based on license tier.
 * Responsibilities:
 * - Create tier-specific default configurations
 * - Ensure deep immutability (new objects on each call)
 * - Validate against tier-based restrictions
 * Assumptions:
 * - All defaults validate against Zod schemas
 * - Returns new objects for immutability
 * - Empty webhookUrl requires user configuration
 *
 * External Boundaries:
 * - Used by widget creation UI to initialize new widgets
 * - Used by API routes to provide default values
 */

import type {
  WidgetConfig,
  BrandingConfig,
  ThemeConfig,
  BehaviorConfig,
  ConnectionConfig,
  FeaturesConfig,
  AdvancedStylingConfig,
} from '@/lib/types/widget-config';

// =============================================================================
// Default Constants
// =============================================================================

const DEFAULT_BRANDING_BASE = {
  companyName: 'My Company',
  welcomeText: 'Welcome! How can we help you today?',
  logoUrl: null,
  responseTimeText: 'Typically replies within minutes',
  firstMessage: 'Hello! How can I assist you today?',
  inputPlaceholder: 'Type your message...',
  launcherIcon: 'chat' as const,
  customLauncherIconUrl: null,
};

const DEFAULT_THEME_COLORS = {
  primary: '#4F46E5',      // Indigo
  secondary: '#818CF8',    // Light indigo
  background: '#FFFFFF',   // White
  userMessage: '#4F46E5',  // Indigo
  botMessage: '#F3F4F6',   // Gray
  text: '#111827',         // Dark gray
  textSecondary: '#6B7280', // Medium gray
  border: '#E5E7EB',       // Light gray
  inputBackground: '#FFFFFF', // White
  inputText: '#111827',    // Dark gray
};

const DEFAULT_THEME_DARK_OVERRIDE = {
  enabled: false,
  colors: {},
};

const DEFAULT_POSITION = {
  position: 'bottom-right' as const,
  offsetX: 20,
  offsetY: 20,
};

const DEFAULT_SIZE = {
  mode: 'standard' as const,
  customWidth: null,
  customHeight: null,
  fullscreenOnMobile: false,
};

const DEFAULT_TYPOGRAPHY = {
  fontFamily: 'system-ui',
  fontSize: 14,
  fontUrl: null,
  disableDefaultFont: false,
};

const DEFAULT_BEHAVIOR = {
  autoOpen: false,
  autoOpenDelay: 0,
  showCloseButton: true,
  persistMessages: true,
  enableSoundNotifications: false,
  enableTypingIndicator: true,
};

const DEFAULT_CONNECTION = {
  webhookUrl: '', // User must configure
  route: null,
  timeoutSeconds: 30,
};

const DEFAULT_MESSAGE_STYLING = {
  userMessageBackground: '#4F46E5',
  userMessageText: '#FFFFFF',
  botMessageBackground: '#F3F4F6',
  botMessageText: '#111827',
  messageSpacing: 12,
  bubblePadding: 12,
  showAvatar: false,
  avatarUrl: null,
};

const DEFAULT_MARKDOWN_STYLING = {
  codeBlockBackground: '#1F2937',
  codeBlockText: '#F9FAFB',
  codeBlockBorder: '#374151',
  inlineCodeBackground: '#F3F4F6',
  inlineCodeText: '#EF4444',
  linkColor: '#3B82F6',
  linkHoverColor: '#2563EB',
  tableHeaderBackground: '#F9FAFB',
  tableBorderColor: '#E5E7EB',
};

const DEFAULT_FILE_ATTACHMENTS = {
  enabled: false,
  allowedExtensions: [],
  maxFileSizeMB: 10,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create default branding configuration
 * @param tier - License tier
 * @returns Deep-cloned BrandingConfig
 */
export function createDefaultBranding(tier: 'basic' | 'pro' | 'agency'): BrandingConfig {
  const brandingEnabled = tier === 'basic'; // Basic tier must show branding

  return structuredClone({
    ...DEFAULT_BRANDING_BASE,
    brandingEnabled,
  });
}

/**
 * Create default theme configuration
 * @param tier - License tier (currently tier-independent)
 * @returns Deep-cloned ThemeConfig
 */
export function createDefaultTheme(tier: 'basic' | 'pro' | 'agency'): ThemeConfig {
  return structuredClone({
    mode: 'light' as const,
    colors: DEFAULT_THEME_COLORS,
    darkOverride: DEFAULT_THEME_DARK_OVERRIDE,
    position: DEFAULT_POSITION,
    size: DEFAULT_SIZE,
    typography: DEFAULT_TYPOGRAPHY,
    cornerRadius: 12,
  });
}

/**
 * Create default behavior configuration
 * @param tier - License tier (currently tier-independent)
 * @returns Deep-cloned BehaviorConfig
 */
export function createDefaultBehavior(tier: 'basic' | 'pro' | 'agency'): BehaviorConfig {
  return structuredClone(DEFAULT_BEHAVIOR);
}

/**
 * Create default connection configuration
 * @returns Deep-cloned ConnectionConfig
 */
export function createDefaultConnection(): ConnectionConfig {
  return structuredClone(DEFAULT_CONNECTION);
}

/**
 * Create default features configuration
 * @param tier - License tier
 * @returns Deep-cloned FeaturesConfig
 */
export function createDefaultFeatures(tier: 'basic' | 'pro' | 'agency'): FeaturesConfig {
  const isPremium = tier === 'pro' || tier === 'agency';

  return structuredClone({
    attachments: DEFAULT_FILE_ATTACHMENTS,
    emailTranscript: isPremium, // Only Pro/Agency
    printTranscript: true,
    ratingPrompt: isPremium,    // Only Pro/Agency
  });
}

/**
 * Create default advanced styling configuration
 * @param tier - License tier
 * @returns Deep-cloned AdvancedStylingConfig
 */
function createDefaultAdvancedStyling(tier: 'basic' | 'pro' | 'agency'): AdvancedStylingConfig {
  const enabled = tier !== 'basic'; // Only Pro/Agency

  return structuredClone({
    enabled,
    messages: DEFAULT_MESSAGE_STYLING,
    markdown: DEFAULT_MARKDOWN_STYLING,
  });
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Create complete default widget configuration
 *
 * Business Rules:
 * - Basic tier: Branding enabled, no advanced features
 * - Pro tier: White-label ready, advanced features enabled
 * - Agency tier: All features, white-label, premium defaults
 *
 * @param tier - License tier ('basic' | 'pro' | 'agency')
 * @returns Complete WidgetConfig with tier-appropriate defaults
 * @throws Error if tier is invalid, undefined, or null
 */
export function createDefaultConfig(tier: 'basic' | 'pro' | 'agency'): WidgetConfig {
  // Validate tier parameter
  if (!tier || tier === null || tier === undefined) {
    throw new Error('Tier parameter is required');
  }

  if (tier !== 'basic' && tier !== 'pro' && tier !== 'agency') {
    throw new Error(`Invalid tier: ${tier}. Must be 'basic', 'pro', or 'agency'`);
  }

  // Build complete configuration
  const config: WidgetConfig = {
    branding: createDefaultBranding(tier),
    theme: createDefaultTheme(tier),
    advancedStyling: createDefaultAdvancedStyling(tier),
    behavior: createDefaultBehavior(tier),
    connection: createDefaultConnection(),
    features: createDefaultFeatures(tier),
  };

  // Return deep clone for immutability
  return structuredClone(config);
}
