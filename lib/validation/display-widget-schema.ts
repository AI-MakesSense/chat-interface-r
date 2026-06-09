import { z } from 'zod';

const hexColor = z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'must be a hex color');
const httpsUrl = z.string().url().refine(
  (u) => {
    try {
      const parsed = new URL(u);
      if (parsed.protocol === 'https:') return true;
      if (parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) return true;
      return false;
    } catch {
      return false;
    }
  },
  'must use HTTPS (or http://localhost for development)'
);
const optionalHttpsUrl = z.union([httpsUrl, z.null()]);

const brandingSchema = z.object({
  companyName: z.string().min(1).max(100),
  logoUrl: optionalHttpsUrl,
  brandingEnabled: z.boolean(),
});

const themeSchema = z.object({
  colorScheme: z.enum(['light', 'dark', 'auto']),
  radius: z.enum(['none', 'small', 'medium', 'large', 'pill']),
  density: z.enum(['compact', 'normal', 'spacious']),
  color: z.object({
    accent: hexColor,
    surface: hexColor,
    text: hexColor,
    subText: hexColor,
    border: hexColor,
  }),
});

const displaySchema = z.object({
  position: z.enum(['right', 'left']),
  defaultOpen: z.boolean(),
  header: z.object({
    title: z.string().min(1).max(80),
    showCount: z.boolean(),
  }),
  emptyMessage: z.string().min(1).max(200),
});

const connectionSchema = z.object({
  provider: z.literal('n8n'),
  webhookUrl: httpsUrl,
  triggerMessage: z.string().min(1, 'Trigger message is required').max(500),
  captureContext: z.boolean(),
  customContext: z.record(z.string(), z.unknown()),
});

export const displayWidgetConfigSchema = z.object({
  branding: brandingSchema,
  theme: themeSchema,
  display: displaySchema,
  connection: connectionSchema,
});

export type DisplayWidgetConfig = z.infer<typeof displayWidgetConfigSchema>;

/**
 * Create a default display widget configuration for the given tier.
 * Matches the display-shaped literal from the old lib/config/defaults.ts.
 * Includes a `kind: 'display'` discriminant (not in the schema, but expected
 * by callers that switch on kind to dispatch configs).
 *
 * SENTINEL VALUES: `connection.webhookUrl` ('https://example.com/webhook') and
 * `connection.triggerMessage` ('List documents') are schema-forced placeholders,
 * NOT working defaults — displayWidgetConfigSchema rejects empty strings, so the
 * old ''-style "user must configure" defaults cannot pass validation. These
 * sentinels MUST be replaced by the user before deploy; the configurator UI is
 * responsible for prompting that replacement.
 */
export function createDefaultDisplayConfig(tier: string): DisplayWidgetConfig & { kind: 'display' } {
  const brandingEnabled = tier === 'basic' || tier === 'free';
  // Round-trip through the schema so it is the enforced source of truth for
  // display defaults — a drifting literal fails loudly here, not at deploy time.
  const base = displayWidgetConfigSchema.parse({
    branding: {
      companyName: 'My Company',
      logoUrl: null,
      brandingEnabled,
    },
    theme: {
      colorScheme: 'light',
      radius: 'medium',
      density: 'normal',
      color: {
        accent: '#6366F1',
        surface: '#FFFFFF',
        text: '#111827',
        subText: '#6B7280',
        border: '#E5E7EB',
      },
    },
    display: {
      position: 'right',
      defaultOpen: true,
      header: {
        title: 'Required documents',
        showCount: true,
      },
      emptyMessage: 'No documents available.',
    },
    connection: {
      provider: 'n8n',
      webhookUrl: 'https://example.com/webhook',
      triggerMessage: 'List documents',
      captureContext: true,
      customContext: {},
    },
  });
  return { ...base, kind: 'display' as const };
}
