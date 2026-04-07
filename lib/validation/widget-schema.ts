/**
 * Widget Configuration Validation Schemas
 *
 * Purpose: Provides Zod schemas for validating widget configurations
 * with tier-based restrictions.
 *
 * Responsibility: Runtime validation of widget configurations before saving to database
 * Assumptions: Input data comes from untrusted user input and must be validated
 *
 * External Boundaries:
 * - Used by API routes to validate widget config submissions
 * - Enforces tier-based feature restrictions (Basic/Pro/Agency)
 * - Validates HTTPS URLs and hex color formats for security
 */

import { z } from 'zod';

// =============================================================================
// Shared Validators
// =============================================================================

/**
 * Hex color validator (#RRGGBB format)
 * Enforces 6-character hex codes with # prefix
 */
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (#RRGGBB)');

/**
 * HTTPS URL validator (or localhost for development)
 * Security: Requires HTTPS except for localhost development
 */
const httpsUrlSchema = z
  .string()
  .url('Must be a valid URL')
  .refine(
    (url) => url.startsWith('https://') || url.includes('localhost'),
    'Must use HTTPS (or localhost for development)'
  );

/**
 * Optional HTTPS URL (null allowed)
 */
const optionalHttpsUrlSchema = z.union([
  httpsUrlSchema,
  z.null(),
]);

// =============================================================================
// Branding Schema
// =============================================================================

export const brandingSchema = z.object({
  companyName: z
    .string()
    .min(1, 'Company name required')
    .max(100, 'Company name must be 100 characters or less'),

  welcomeText: z
    .string()
    .min(1, 'Welcome text required')
    .max(200, 'Welcome text must be 200 characters or less'),

  logoUrl: optionalHttpsUrlSchema,

  responseTimeText: z
    .string()
    .max(100, 'Response time text must be 100 characters or less'),

  firstMessage: z
    .string()
    .min(1, 'First message required')
    .max(500, 'First message must be 500 characters or less'),

  inputPlaceholder: z
    .string()
    .max(100, 'Input placeholder must be 100 characters or less'),

  launcherIcon: z.enum(['chat', 'support', 'bot', 'custom']),

  customLauncherIconUrl: optionalHttpsUrlSchema,

  brandingEnabled: z.boolean(),
});

// =============================================================================
// Theme Schema
// =============================================================================

const themeColorsSchema = z.object({
  primary: hexColorSchema,
  secondary: hexColorSchema,
  background: hexColorSchema,
  userMessage: hexColorSchema,
  botMessage: hexColorSchema,
  text: hexColorSchema,
  textSecondary: hexColorSchema,
  border: hexColorSchema,
  inputBackground: hexColorSchema,
  inputText: hexColorSchema,
});

const themeDarkOverrideSchema = z.object({
  enabled: z.boolean(),
  colors: themeColorsSchema.partial(), // Partial colors for overrides
});

const positionSchema = z.object({
  position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']),
  offsetX: z.number().int().min(0).max(500),
  offsetY: z.number().int().min(0).max(500),
});

const sizeSchema = z.object({
  mode: z.enum(['compact', 'standard', 'expanded']),
  customWidth: z.number().int().min(300).max(1000).nullable(),
  customHeight: z.number().int().min(400).max(1000).nullable(),
  fullscreenOnMobile: z.boolean(),
});

const typographySchema = z.object({
  fontFamily: z.string().max(100),
  fontSize: z.number().int().min(12).max(20),
  fontUrl: optionalHttpsUrlSchema,
  disableDefaultFont: z.boolean(),
});

export const themeSchema = z.object({
  mode: z.enum(['light', 'dark', 'auto']),
  colors: themeColorsSchema,
  darkOverride: themeDarkOverrideSchema,
  position: positionSchema,
  size: sizeSchema,
  typography: typographySchema,
  cornerRadius: z.number().int().min(0).max(20),
});

// =============================================================================
// Advanced Styling Schema (Pro/Agency only)
// =============================================================================

const messageStylingSchema = z.object({
  userMessageBackground: hexColorSchema,
  userMessageText: hexColorSchema,
  botMessageBackground: hexColorSchema,
  botMessageText: hexColorSchema,
  messageSpacing: z.number().int().min(0).max(50),
  bubblePadding: z.number().int().min(5).max(30),
  showAvatar: z.boolean(),
  avatarUrl: optionalHttpsUrlSchema,
});

const markdownStylingSchema = z.object({
  codeBlockBackground: hexColorSchema,
  codeBlockText: hexColorSchema,
  codeBlockBorder: hexColorSchema,
  inlineCodeBackground: hexColorSchema,
  inlineCodeText: hexColorSchema,
  linkColor: hexColorSchema,
  linkHoverColor: hexColorSchema,
  tableHeaderBackground: hexColorSchema,
  tableBorderColor: hexColorSchema,
});

export const advancedStylingSchema = z.object({
  enabled: z.boolean(),
  messages: messageStylingSchema,
  markdown: markdownStylingSchema,
});

// =============================================================================
// Behavior Schema
// =============================================================================

export const behaviorSchema = z.object({
  autoOpen: z.boolean(),
  autoOpenDelay: z.number().int().min(0).max(60),
  showCloseButton: z.boolean(),
  persistMessages: z.boolean(),
  enableSoundNotifications: z.boolean(),
  enableTypingIndicator: z.boolean(),
});

// =============================================================================
// Connection Schema
// =============================================================================

/**
 * Webhook URL validator
 * Allows empty string for default configs (user must configure)
 * Otherwise requires HTTPS URL
 */
const webhookUrlSchema = z
  .string()
  .refine(
    (url) => url === '' || (url.startsWith('https://') || url.includes('localhost')),
    'Must be a valid HTTPS URL (or empty for configuration)'
  )
  .refine(
    (url) => url === '' || z.string().url().safeParse(url).success,
    'Must be a valid URL format or empty'
  );

export const connectionSchema = z.object({
  webhookUrl: webhookUrlSchema,
  route: z.string().max(100).nullable(),
  timeoutSeconds: z.number().int().min(10).max(60),
});

// =============================================================================
// Features Schema
// =============================================================================

const fileAttachmentsSchema = z.object({
  enabled: z.boolean(),
  allowedExtensions: z
    .array(z.string().regex(/^\.[a-z0-9]+$/, 'Extensions must start with dot'))
    .max(20, 'Maximum 20 file extensions allowed'),
  maxFileSizeMB: z.number().int().min(1).max(50),
});

export const featuresSchema = z.object({
  attachments: fileAttachmentsSchema,
  emailTranscript: z.boolean(),
  printTranscript: z.boolean(),
  ratingPrompt: z.boolean(),
});

// =============================================================================
// NEW: Playground-style Configuration Schemas
// =============================================================================

/**
 * Starter prompt schema for conversation starters
 */
const starterPromptSchema = z.object({
  label: z.string().min(1).max(100),
  icon: z.string().min(1).max(50),
});

/**
 * Playground-style widget configuration schema
 * These are optional to maintain backward compatibility with existing widgets
 */
export const playgroundConfigSchema = z.object({
  // Color System
  themeMode: z.enum(['light', 'dark']).optional(),
  useAccent: z.boolean().optional(),
  accentColor: hexColorSchema.optional(),
  useTintedGrayscale: z.boolean().optional(),
  tintHue: z.number().int().min(0).max(360).optional(),
  tintLevel: z.number().int().min(0).max(100).optional(),
  shadeLevel: z.number().int().min(0).max(100).optional(),
  useCustomSurfaceColors: z.boolean().optional(),
  surfaceBackgroundColor: hexColorSchema.optional(),
  surfaceForegroundColor: hexColorSchema.optional(),
  useCustomTextColor: z.boolean().optional(),
  customTextColor: hexColorSchema.optional(),

  // Component Colors
  useCustomIconColor: z.boolean().optional(),
  customIconColor: hexColorSchema.optional(),
  useCustomUserMessageColors: z.boolean().optional(),
  customUserMessageTextColor: hexColorSchema.optional(),
  customUserMessageBackgroundColor: hexColorSchema.optional(),

  // Typography (new style)
  fontFamily: z.string().max(100).optional(),
  fontSize: z.number().int().min(12).max(24).optional(),
  useCustomFont: z.boolean().optional(),
  customFontName: z.string().max(100).optional(),
  customFontCss: z.string().max(2000).optional(),

  // Style
  radius: z.enum(['none', 'small', 'medium', 'large', 'pill']).optional(),
  density: z.enum(['compact', 'normal', 'spacious']).optional(),

  // Start Screen
  greeting: z.string().max(500).optional(),
  starterPrompts: z.array(starterPromptSchema).max(6).optional(),

  // Composer
  placeholder: z.string().max(200).optional(),
  disclaimer: z.string().max(500).optional(),
  enableAttachments: z.boolean().optional(),
  enableModelPicker: z.boolean().optional(),

  // Connect (new style)
  enableN8n: z.boolean().optional(),
  n8nWebhookUrl: webhookUrlSchema.optional(),
  enableAgentKit: z.boolean().optional(),
  agentKitWorkflowId: z.string().max(100).optional(),
  agentKitApiKey: z.string().max(200).optional(),
});

// =============================================================================
// Legacy Store Schema (for backward compatibility with widget-store.ts)
// =============================================================================

/**
 * Legacy style object from widget-store.ts
 * Maps to the newer theme structure
 */
const legacyStyleSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  primaryColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).optional(),
  cornerRadius: z.number().optional(),
}).optional();

/**
 * Legacy branding schema (less strict than full brandingSchema)
 */
const legacyBrandingSchema = z.object({
  companyName: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  welcomeText: z.string().optional(),
  firstMessage: z.string().optional(),
  responseTimeText: z.string().optional(),
  inputPlaceholder: z.string().optional(),
  launcherIcon: z.enum(['chat', 'support', 'bot', 'custom']).optional(),
  customLauncherIconUrl: z.string().nullable().optional(),
  brandingEnabled: z.boolean().optional(),
}).optional();

/**
 * Legacy connection schema (allows both n8n and chatkit providers)
 */
const legacyConnectionSchema = z.object({
  provider: z.enum(['n8n', 'chatkit']).optional(),
  webhookUrl: z.string().optional(),
  routeParam: z.string().optional(),
  workflowId: z.string().optional(),
  apiKey: z.string().optional(),
  route: z.string().nullable().optional(),
  timeoutSeconds: z.number().optional(),
}).optional();

/**
 * Legacy typography schema
 */
const legacyTypographySchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
}).optional();

/**
 * Legacy features schema
 */
const legacyFeaturesSchema = z.object({
  fileAttachments: z.boolean().optional(),
  allowedExtensions: z.array(z.string()).optional(),
  maxFileSize: z.number().optional(),
  attachments: z.object({
    enabled: z.boolean().optional(),
    allowedExtensions: z.array(z.string()).optional(),
    maxFileSizeMB: z.number().optional(),
  }).optional(),
  emailTranscript: z.boolean().optional(),
  printTranscript: z.boolean().optional(),
  ratingPrompt: z.boolean().optional(),
}).optional();

/**
 * Legacy advanced schema
 */
const legacyAdvancedSchema = z.object({
  customCss: z.string().optional(),
  customJs: z.string().optional(),
}).optional();

// =============================================================================
// Complete Widget Config Schema (Base - No Tier Restrictions)
// =============================================================================

/**
 * Flexible widget config schema that accepts both:
 * 1. Legacy structure from widget-store.ts (branding, style, connection, typography, features, advanced)
 * 2. New playground-style flat properties (themeMode, accentColor, etc.)
 * 3. Full structured format (branding, theme, advancedStyling, behavior, connection, features)
 *
 * This permissive approach allows gradual migration and backward compatibility.
 */
export const widgetConfigBaseSchema = z.object({
  // Legacy structure fields (optional for backward compatibility)
  branding: legacyBrandingSchema,
  style: legacyStyleSchema,
  typography: legacyTypographySchema,
  features: legacyFeaturesSchema,
  advanced: legacyAdvancedSchema,
  connection: legacyConnectionSchema,

  // New structured format fields (all optional for flexibility)
  theme: themeSchema.optional(),
  advancedStyling: advancedStylingSchema.optional(),
  behavior: behaviorSchema.optional(),

  // Widget metadata
  widgetId: z.string().optional(),
  license: z.object({
    key: z.string().optional(),
    active: z.boolean().optional(),
    plan: z.string().optional(),
  }).optional(),
}).merge(playgroundConfigSchema).passthrough();

// =============================================================================
// Tier-Aware Validation
// =============================================================================

export type LicenseTier = 'basic' | 'pro' | 'agency';

/**
 * Create tier-aware widget config schema
 *
 * Business Rules:
 * - Basic tier: Must show branding, no advanced features
 * - Pro/Agency tiers: Can disable branding, access all features
 *
 * @param tier - License tier (basic/pro/agency)
 * @param brandingRequired - Whether branding must be enabled
 */
export const createWidgetConfigSchema = (tier: LicenseTier, brandingRequired: boolean) => {
  return widgetConfigBaseSchema.superRefine((config, ctx) => {
    // Safe access helpers for optional nested properties
    const branding = config.branding;
    const advancedStyling = config.advancedStyling;
    const features = config.features;

    // RESTRICTION 1: Branding must be enabled for Basic tier
    // Only check if branding object exists and brandingEnabled is explicitly false
    if (tier === 'basic' && brandingRequired && branding?.brandingEnabled === false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Branding must be enabled for Basic tier',
        path: ['branding', 'brandingEnabled'],
      });
    }

    // RESTRICTION 2: Advanced styling only for Pro/Agency
    // Only check if advancedStyling exists and is enabled
    if (tier === 'basic' && advancedStyling?.enabled === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Advanced styling is only available for Pro and Agency tiers',
        path: ['advancedStyling', 'enabled'],
      });
    }

    // RESTRICTION 3: Email transcript only for Pro/Agency
    if (tier === 'basic' && features?.emailTranscript === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email transcript is only available for Pro and Agency tiers',
        path: ['features', 'emailTranscript'],
      });
    }

    // RESTRICTION 4: Rating prompt only for Pro/Agency
    if (tier === 'basic' && features?.ratingPrompt === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Rating prompt is only available for Pro and Agency tiers',
        path: ['features', 'ratingPrompt'],
      });
    }

    // RESTRICTION 5: Custom launcher icon requires URL
    if (branding?.launcherIcon === 'custom' && !branding?.customLauncherIconUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Custom launcher icon URL required when launcher icon type is "custom"',
        path: ['branding', 'customLauncherIconUrl'],
      });
    }

    // RESTRICTION 6: Avatar URL required if showAvatar is true
    if (advancedStyling?.enabled === true &&
        advancedStyling?.messages?.showAvatar === true &&
        !advancedStyling?.messages?.avatarUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Avatar URL required when show avatar is enabled',
        path: ['advancedStyling', 'messages', 'avatarUrl'],
      });
    }
  });
};

// =============================================================================
// Type Exports
// =============================================================================

export type BrandingInput = z.infer<typeof brandingSchema>;
export type ThemeInput = z.infer<typeof themeSchema>;
export type AdvancedStylingInput = z.infer<typeof advancedStylingSchema>;
export type BehaviorInput = z.infer<typeof behaviorSchema>;
export type ConnectionInput = z.infer<typeof connectionSchema>;
export type FeaturesInput = z.infer<typeof featuresSchema>;
export type PlaygroundConfigInput = z.infer<typeof playgroundConfigSchema>;
export type StarterPromptInput = z.infer<typeof starterPromptSchema>;
export type WidgetConfigInput = z.infer<typeof widgetConfigBaseSchema>;
