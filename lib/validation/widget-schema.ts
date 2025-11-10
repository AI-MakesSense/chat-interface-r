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

export const connectionSchema = z.object({
  webhookUrl: httpsUrlSchema,
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
// Complete Widget Config Schema (Base - No Tier Restrictions)
// =============================================================================

export const widgetConfigBaseSchema = z.object({
  branding: brandingSchema,
  theme: themeSchema,
  advancedStyling: advancedStylingSchema,
  behavior: behaviorSchema,
  connection: connectionSchema,
  features: featuresSchema,
});

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

    // RESTRICTION 1: Branding must be enabled for Basic tier
    if (tier === 'basic' && brandingRequired && !config.branding.brandingEnabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Branding must be enabled for Basic tier',
        path: ['branding', 'brandingEnabled'],
      });
    }

    // RESTRICTION 2: Advanced styling only for Pro/Agency
    if (tier === 'basic' && config.advancedStyling.enabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Advanced styling is only available for Pro and Agency tiers',
        path: ['advancedStyling', 'enabled'],
      });
    }

    // RESTRICTION 3: Email transcript only for Pro/Agency
    if (tier === 'basic' && config.features.emailTranscript) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email transcript is only available for Pro and Agency tiers',
        path: ['features', 'emailTranscript'],
      });
    }

    // RESTRICTION 4: Rating prompt only for Pro/Agency
    if (tier === 'basic' && config.features.ratingPrompt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Rating prompt is only available for Pro and Agency tiers',
        path: ['features', 'ratingPrompt'],
      });
    }

    // RESTRICTION 5: Custom launcher icon requires URL
    if (config.branding.launcherIcon === 'custom' && !config.branding.customLauncherIconUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Custom launcher icon URL required when launcher icon type is "custom"',
        path: ['branding', 'customLauncherIconUrl'],
      });
    }

    // RESTRICTION 6: Avatar URL required if showAvatar is true
    if (config.advancedStyling.enabled &&
        config.advancedStyling.messages.showAvatar &&
        !config.advancedStyling.messages.avatarUrl) {
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
export type WidgetConfigInput = z.infer<typeof widgetConfigBaseSchema>;
