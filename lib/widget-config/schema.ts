/**
 * Canonical Widget Configuration Schema
 *
 * Purpose: THE single source of truth for widget configuration shape.
 * Types (z.infer), defaults (schema.parse({})), API validation, and DB-boundary
 * parsing ALL derive from this file. Do not define WidgetConfig anywhere else.
 *
 * schemaVersion history:
 *   1 — implicit legacy shapes (store-style `style`/flat playground fields). Never
 *       written explicitly; absence of schemaVersion means v1. See migrate.ts.
 *   2 — this canonical shape.
 *
 * Zod 4 note: `.default(value)` hands out the SAME value object by reference on
 * every parse — two parsed configs would share (and corrupt) nested state. Every
 * object/array default therefore uses the factory form `.default(() => ...)`,
 * which Zod calls fresh per parse. Nested object schemas with their own field
 * defaults use `.default(() => subSchema.parse({}))` so defaults cascade.
 */
import { z } from 'zod';

export const CONFIG_SCHEMA_VERSION = 2;

// ---------- shared validators ----------
const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (#RRGGBB)');

/** True only when the URL's hostname is exactly localhost/127.0.0.1 (path tricks like http://evil.com/localhost/x don't pass). */
const isLocalhostUrl = (u: string): boolean => {
  try {
    const { hostname } = new URL(u);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

const httpsUrl = z
  .string()
  .url('Must be a valid URL')
  .refine((u) => u.startsWith('https://') || isLocalhostUrl(u), 'Must use HTTPS (or localhost for development)');
const optionalHttpsUrl = httpsUrl.nullable();
const webhookUrl = z
  .string()
  .refine((u) => u === '' || z.string().url().safeParse(u).success, 'Must be a valid URL or empty')
  .refine((u) => u === '' || u.startsWith('https://') || isLocalhostUrl(u), 'Must be HTTPS (or empty until configured)');

// ---------- sections ----------
export const brandingSchema = z.object({
  companyName: z.string().min(1).max(100).default('My Company'),
  welcomeText: z.string().min(1).max(200).default('Welcome! How can we help you today?'),
  logoUrl: optionalHttpsUrl.default(null),
  responseTimeText: z.string().max(100).default('Typically replies within minutes'),
  firstMessage: z.string().min(1).max(500).default('Hello! How can I assist you today?'),
  inputPlaceholder: z.string().max(100).default('Type your message...'),
  launcherIcon: z.enum(['chat', 'support', 'bot', 'custom']).default('chat'),
  customLauncherIconUrl: optionalHttpsUrl.default(null),
  brandingEnabled: z.boolean().default(true),
});

const themeColorsSchema = z.object({
  primary: hexColor.default('#4F46E5'),
  secondary: hexColor.default('#818CF8'),
  background: hexColor.default('#FFFFFF'),
  userMessage: hexColor.default('#4F46E5'),
  botMessage: hexColor.default('#F3F4F6'),
  text: hexColor.default('#111827'),
  textSecondary: hexColor.default('#6B7280'),
  border: hexColor.default('#E5E7EB'),
  inputBackground: hexColor.default('#FFFFFF'),
  inputText: hexColor.default('#111827'),
});

const darkOverrideSchema = z.object({
  enabled: z.boolean().default(false),
  colors: themeColorsSchema.partial().default(() => ({})),
});

const positionSchema = z.object({
  position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).default('bottom-right'),
  offsetX: z.number().int().min(0).max(500).default(20),
  offsetY: z.number().int().min(0).max(500).default(20),
});

const sizeSchema = z.object({
  mode: z.enum(['compact', 'standard', 'expanded']).default('standard'),
  customWidth: z.number().int().min(300).max(1000).nullable().default(null),
  customHeight: z.number().int().min(400).max(1000).nullable().default(null),
  fullscreenOnMobile: z.boolean().default(false),
});

const typographySchema = z.object({
  fontFamily: z.string().max(100).default('system-ui'),
  fontSize: z.number().int().min(12).max(20).default(14),
  fontUrl: optionalHttpsUrl.default(null),
  disableDefaultFont: z.boolean().default(false),
});

export const themeSchema = z.object({
  mode: z.enum(['light', 'dark', 'auto']).default('light'),
  colors: themeColorsSchema.default(() => themeColorsSchema.parse({})),
  darkOverride: darkOverrideSchema.default(() => darkOverrideSchema.parse({})),
  position: positionSchema.default(() => positionSchema.parse({})),
  size: sizeSchema.default(() => sizeSchema.parse({})),
  typography: typographySchema.default(() => typographySchema.parse({})),
  cornerRadius: z.number().int().min(0).max(20).default(12),
});

const advancedMessagesSchema = z.object({
  userMessageBackground: hexColor.default('#4F46E5'),
  userMessageText: hexColor.default('#FFFFFF'),
  botMessageBackground: hexColor.default('#F3F4F6'),
  botMessageText: hexColor.default('#111827'),
  messageSpacing: z.number().int().min(0).max(50).default(12),
  bubblePadding: z.number().int().min(5).max(30).default(12),
  showAvatar: z.boolean().default(false),
  avatarUrl: optionalHttpsUrl.default(null),
});

const advancedMarkdownSchema = z.object({
  codeBlockBackground: hexColor.default('#1F2937'),
  codeBlockText: hexColor.default('#F9FAFB'),
  codeBlockBorder: hexColor.default('#374151'),
  inlineCodeBackground: hexColor.default('#F3F4F6'),
  inlineCodeText: hexColor.default('#EF4444'),
  linkColor: hexColor.default('#3B82F6'),
  linkHoverColor: hexColor.default('#2563EB'),
  tableHeaderBackground: hexColor.default('#F9FAFB'),
  tableBorderColor: hexColor.default('#E5E7EB'),
});

export const advancedStylingSchema = z.object({
  enabled: z.boolean().default(false),
  messages: advancedMessagesSchema.default(() => advancedMessagesSchema.parse({})),
  markdown: advancedMarkdownSchema.default(() => advancedMarkdownSchema.parse({})),
});

export const behaviorSchema = z.object({
  autoOpen: z.boolean().default(false),
  autoOpenDelay: z.number().int().min(0).max(60).default(0),
  showCloseButton: z.boolean().default(true),
  persistMessages: z.boolean().default(true),
  enableSoundNotifications: z.boolean().default(false),
  enableTypingIndicator: z.boolean().default(true),
});

export const connectionSchema = z.object({
  provider: z.enum(['n8n', 'chatkit']).default('n8n'),
  webhookUrl: webhookUrl.default(''),
  route: z.string().max(100).nullable().default(null),
  timeoutSeconds: z.number().int().min(10).max(60).default(30),
  captureContext: z.boolean().default(true),
});

const attachmentsSchema = z.object({
  enabled: z.boolean().default(false),
  allowedExtensions: z.array(z.string().regex(/^\.[a-z0-9]+$/)).max(20).default(() => []),
  maxFileSizeMB: z.number().int().min(1).max(50).default(10),
});

export const featuresSchema = z.object({
  attachments: attachmentsSchema.default(() => attachmentsSchema.parse({})),
  emailTranscript: z.boolean().default(false),
  printTranscript: z.boolean().default(true),
  ratingPrompt: z.boolean().default(false),
});

// Absorbs the "playground-style" flat fields the runtime renders (greeting,
// starter prompts, composer placeholder). migrate.ts maps the old flat keys here.
export const startScreenSchema = z.object({
  greeting: z.string().max(500).default(''),
  starterPrompts: z
    .array(z.object({ label: z.string().min(1).max(100), icon: z.string().min(1).max(50) }))
    .max(6)
    .default(() => []),
});

export const composerSchema = z.object({
  placeholder: z.string().max(200).default('Type your message...'),
  disclaimer: z.string().max(500).default(''),
});

// ---------- the canonical chat config ----------
export const chatWidgetConfigSchema = z.object({
  schemaVersion: z.number().int().default(CONFIG_SCHEMA_VERSION),
  kind: z.literal('chat').default('chat'),
  branding: brandingSchema.default(() => brandingSchema.parse({})),
  theme: themeSchema.default(() => themeSchema.parse({})),
  advancedStyling: advancedStylingSchema.default(() => advancedStylingSchema.parse({})),
  behavior: behaviorSchema.default(() => behaviorSchema.parse({})),
  connection: connectionSchema.default(() => connectionSchema.parse({})),
  features: featuresSchema.default(() => featuresSchema.parse({})),
  startScreen: startScreenSchema.default(() => startScreenSchema.parse({})),
  composer: composerSchema.default(() => composerSchema.parse({})),
});

// ---------- tier-aware validation ----------
export type LicenseTier = 'basic' | 'pro' | 'agency';

/** Collapse any raw tier value ('free', null, garbage) to a valid LicenseTier. */
export function normalizeTier(raw: string | null | undefined): LicenseTier {
  if (raw === 'basic' || raw === 'pro' || raw === 'agency') return raw;
  return 'basic';
}

export const createTierAwareSchema = (tier: LicenseTier, brandingRequired: boolean) =>
  chatWidgetConfigSchema.superRefine((config, ctx) => {
    if (tier === 'basic' && brandingRequired && config.branding.brandingEnabled === false) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Branding must be enabled for Basic tier', path: ['branding', 'brandingEnabled'] });
    }
    if (tier === 'basic' && config.advancedStyling.enabled === true) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Advanced styling is only available for Pro and Agency tiers', path: ['advancedStyling', 'enabled'] });
    }
    if (tier === 'basic' && config.features.emailTranscript === true) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Email transcript is only available for Pro and Agency tiers', path: ['features', 'emailTranscript'] });
    }
    if (tier === 'basic' && config.features.ratingPrompt === true) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Rating prompt is only available for Pro and Agency tiers', path: ['features', 'ratingPrompt'] });
    }
    if (config.branding.launcherIcon === 'custom' && !config.branding.customLauncherIconUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Custom launcher icon URL required when launcher icon type is "custom"', path: ['branding', 'customLauncherIconUrl'] });
    }
    if (config.advancedStyling.enabled && config.advancedStyling.messages.showAvatar && !config.advancedStyling.messages.avatarUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Avatar URL required when show avatar is enabled', path: ['advancedStyling', 'messages', 'avatarUrl'] });
    }
  });

// ---------- kind dispatch (display schema stays where it is for now) ----------
import { displayWidgetConfigSchema } from '@/lib/validation/display-widget-schema';
export { displayWidgetConfigSchema };

/**
 * Returns the validation schema for a widget kind.
 *
 * ASYMMETRY WARNING: the two branches behave differently with empty input.
 * - 'chat' returns the tier-aware canonical schema, where every field has a
 *   default — `schema.parse({})` succeeds and yields a complete config.
 * - 'display' returns `displayWidgetConfigSchema` (from
 *   lib/validation/display-widget-schema.ts), which has REQUIRED fields —
 *   `schema.parse({})` THROWS. Callers must not parse `{}` generically across
 *   kinds; display configs must already carry their required fields.
 */
export function getSchemaForKind(kind: 'chat' | 'display', tier: LicenseTier, brandingRequired: boolean) {
  if (kind === 'chat') return createTierAwareSchema(tier, brandingRequired);
  if (kind === 'display') return displayWidgetConfigSchema;
  throw new Error(`Unknown widget kind: ${kind}`);
}

// ---------- types ----------
export type ChatWidgetConfig = z.infer<typeof chatWidgetConfigSchema>;
export type BrandingConfig = z.infer<typeof brandingSchema>;
export type ThemeConfig = z.infer<typeof themeSchema>;
export type AdvancedStylingConfig = z.infer<typeof advancedStylingSchema>;
export type BehaviorConfig = z.infer<typeof behaviorSchema>;
export type ConnectionConfig = z.infer<typeof connectionSchema>;
export type FeaturesConfig = z.infer<typeof featuresSchema>;
export type StartScreenConfig = z.infer<typeof startScreenSchema>;
export type ComposerConfig = z.infer<typeof composerSchema>;
