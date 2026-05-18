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
