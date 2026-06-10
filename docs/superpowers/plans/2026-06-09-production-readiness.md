# Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the N8n Widget Designer platform from "working MVP with a half-finished v1→v2 migration" to production-ready: one canonical widget config schema, a single (v2) identity model, distributed rate limiting + SSRF hardening, a CDN-cacheable static-bundle serving pipeline, a preview that renders the real widget bundle, and a schema-driven configurator.

**Architecture:** Seven sequential phases, each shipping working software on its own. Phase 1 creates a single Zod source of truth for `WidgetConfig` (types, defaults, validation, migration all derive from it). Phase 2 finishes the v1→v2 migration (widgets owned by users, `widgetKey` identity, dead tables dropped). Phase 3 hardens security (Upstash Redis rate limiting, webhook URL SSRF guard, fail-fast env validation, billing explicitly flagged off). Phase 4 splits code from config in serving (tiny stable loader + content-hashed immutable bundle + JSON config endpoint, obfuscator removed). Phase 5 replaces the 973-line React preview re-implementation with the real bundle in a sandboxed iframe driven by `postMessage`. Phase 6 makes the configurator sidebar schema-driven and collapses the three near-identical configurator pages into one. Phase 7 is cleanup + CI gate.

**Tech Stack:** Next.js 16 (App Router), TypeScript 5 strict, Zod 4, Drizzle ORM + Neon Postgres, Zustand 5, esbuild 0.21, Jest 29 + jsdom, pnpm, `@upstash/redis` + `@upstash/ratelimit` (new deps).

**Conventions for every task:**
- Run tests with `pnpm test -- <path>` (Jest). Type-check with `pnpm type-check`.
- Commit after every green task. Branch: do this work on `feat/production-readiness` cut from `master` (after merging or parking the current `feat/document-display-widget` branch).
- All new lib code lives under `lib/widget-config/` (Phase 1), `lib/security/` (Phase 3). Follow the existing file-header comment style (`Purpose / Responsibility / Assumptions`).

**Assumption (verify before Phase 2/4):** there are no real third-party customers embedding via the legacy `/api/widget/[license]/chat-widget.js` URL yet. If there are, keep the compat adapter in Task 9 permanently instead of as a transition shim.

**Explicitly out of scope** (known issues, deliberately deferred — record in `docs/development/todo.md` during Task 26):
- Real Stripe billing integration (Task 15 makes its absence honest instead).
- Internal refactor of the 1,471-line `widget/src/widget.ts` monolith into per-component scoped renders — the preview/serving work doesn't depend on it, and it's high-churn; do it as its own plan once this lands.
- Per-instance isolation of the module-level markdown LRU cache and attachment re-validation at send time in `message-sender.ts` — real but minor; follow-up items.
- Registry-driving the display-kind configurator sections (Task 22 keeps the existing display section components).

---

## Phase 1 — One Canonical WidgetConfig (single source of truth)

**Problem being fixed:** 4 incompatible `WidgetConfig` type definitions (`stores/widget-store.ts`, `widget/src/types.ts`, `lib/types/widget-config.ts`, `chat-widget-playground/types.ts`), 3 conflicting default sources (store hardcodes `#00bfff`, `lib/config/defaults.ts` says `#4F46E5`), a 555-line Zod schema the store never uses, and untyped JSONB at the DB boundary.

**End state:** `lib/widget-config/` is the only place the config shape is defined. Everything else (`z.infer` types, defaults via `schema.parse({})`, tier validation, legacy-shape migration) derives from it. Stored configs carry `schemaVersion: 2`.

### File structure for Phase 1

```
lib/widget-config/
├── index.ts          # barrel: re-export schema, types, defaults, migrate
├── schema.ts         # THE canonical Zod schema (sections + defaults + tier refinements)
├── migrate.ts        # migrateConfig(raw) → canonical v2 shape
└── defaults.ts       # createDefaultConfig(tier, kind) — thin wrapper over schema.parse
lib/types/widget-config.ts    # becomes a deprecated re-export shim
lib/config/defaults.ts        # becomes a deprecated re-export shim
lib/validation/widget-schema.ts # becomes a deprecated re-export shim
stores/widget-store.ts        # local interface + defaults deleted; imports canonical
```

---

### Task 1: Canonical schema module

**Files:**
- Create: `lib/widget-config/schema.ts`
- Create: `lib/widget-config/index.ts`
- Test: `tests/lib/widget-config/schema.test.ts`

The canonical schema reuses the *structured* sections that already exist in `lib/validation/widget-schema.ts` (branding/theme/advancedStyling/behavior/connection/features) — those are the well-designed ones — plus two new sections (`startScreen`, `composer`) that absorb the "playground-style" flat fields the runtime actually uses, plus `schemaVersion`. Every field has a `.default()`, so `chatWidgetConfigSchema.parse({})` yields a complete valid config.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/widget-config/schema.test.ts
import {
  chatWidgetConfigSchema,
  createTierAwareSchema,
  CONFIG_SCHEMA_VERSION,
} from '@/lib/widget-config/schema';

describe('canonical chat widget config schema', () => {
  it('parse({}) yields a complete config with defaults', () => {
    const cfg = chatWidgetConfigSchema.parse({});
    expect(cfg.schemaVersion).toBe(CONFIG_SCHEMA_VERSION);
    expect(cfg.kind).toBe('chat');
    expect(cfg.theme.colors.primary).toBe('#4F46E5');
    expect(cfg.branding.companyName).toBe('My Company');
    expect(cfg.connection.webhookUrl).toBe('');
    expect(cfg.startScreen.starterPrompts).toEqual([]);
    expect(cfg.composer.placeholder).toBe('Type your message...');
  });

  it('rejects invalid hex colors', () => {
    const result = chatWidgetConfigSchema.safeParse({
      theme: { colors: { primary: 'red' } },
    });
    expect(result.success).toBe(false);
  });

  it('basic tier cannot disable branding', () => {
    const schema = createTierAwareSchema('basic', true);
    const cfg = chatWidgetConfigSchema.parse({});
    cfg.branding.brandingEnabled = false;
    const result = schema.safeParse(cfg);
    expect(result.success).toBe(false);
  });

  it('pro tier can disable branding', () => {
    const schema = createTierAwareSchema('pro', false);
    const cfg = chatWidgetConfigSchema.parse({});
    cfg.branding.brandingEnabled = false;
    expect(schema.safeParse(cfg).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/lib/widget-config/schema.test.ts`
Expected: FAIL — `Cannot find module '@/lib/widget-config/schema'`

- [ ] **Step 3: Write the schema**

```ts
// lib/widget-config/schema.ts
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
 */
import { z } from 'zod';

export const CONFIG_SCHEMA_VERSION = 2;

// ---------- shared validators ----------
const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (#RRGGBB)');
const httpsUrl = z
  .string()
  .url('Must be a valid URL')
  .refine((u) => u.startsWith('https://') || u.includes('localhost'), 'Must use HTTPS (or localhost for development)');
const optionalHttpsUrl = httpsUrl.nullable();
const webhookUrl = z
  .string()
  .refine((u) => u === '' || u.startsWith('https://') || u.includes('localhost'), 'Must be HTTPS (or empty until configured)')
  .refine((u) => u === '' || z.string().url().safeParse(u).success, 'Must be a valid URL or empty');

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

export const themeSchema = z.object({
  mode: z.enum(['light', 'dark', 'auto']).default('light'),
  colors: themeColorsSchema.default({}),
  darkOverride: z
    .object({
      enabled: z.boolean().default(false),
      colors: themeColorsSchema.partial().default({}),
    })
    .default({}),
  position: z
    .object({
      position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).default('bottom-right'),
      offsetX: z.number().int().min(0).max(500).default(20),
      offsetY: z.number().int().min(0).max(500).default(20),
    })
    .default({}),
  size: z
    .object({
      mode: z.enum(['compact', 'standard', 'expanded']).default('standard'),
      customWidth: z.number().int().min(300).max(1000).nullable().default(null),
      customHeight: z.number().int().min(400).max(1000).nullable().default(null),
      fullscreenOnMobile: z.boolean().default(false),
    })
    .default({}),
  typography: z
    .object({
      fontFamily: z.string().max(100).default('system-ui'),
      fontSize: z.number().int().min(12).max(20).default(14),
      fontUrl: optionalHttpsUrl.default(null),
      disableDefaultFont: z.boolean().default(false),
    })
    .default({}),
  cornerRadius: z.number().int().min(0).max(20).default(12),
});

export const advancedStylingSchema = z.object({
  enabled: z.boolean().default(false),
  messages: z
    .object({
      userMessageBackground: hexColor.default('#4F46E5'),
      userMessageText: hexColor.default('#FFFFFF'),
      botMessageBackground: hexColor.default('#F3F4F6'),
      botMessageText: hexColor.default('#111827'),
      messageSpacing: z.number().int().min(0).max(50).default(12),
      bubblePadding: z.number().int().min(5).max(30).default(12),
      showAvatar: z.boolean().default(false),
      avatarUrl: optionalHttpsUrl.default(null),
    })
    .default({}),
  markdown: z
    .object({
      codeBlockBackground: hexColor.default('#1F2937'),
      codeBlockText: hexColor.default('#F9FAFB'),
      codeBlockBorder: hexColor.default('#374151'),
      inlineCodeBackground: hexColor.default('#F3F4F6'),
      inlineCodeText: hexColor.default('#EF4444'),
      linkColor: hexColor.default('#3B82F6'),
      linkHoverColor: hexColor.default('#2563EB'),
      tableHeaderBackground: hexColor.default('#F9FAFB'),
      tableBorderColor: hexColor.default('#E5E7EB'),
    })
    .default({}),
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

export const featuresSchema = z.object({
  attachments: z
    .object({
      enabled: z.boolean().default(false),
      allowedExtensions: z.array(z.string().regex(/^\.[a-z0-9]+$/)).max(20).default([]),
      maxFileSizeMB: z.number().int().min(1).max(50).default(10),
    })
    .default({}),
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
    .default([]),
});

export const composerSchema = z.object({
  placeholder: z.string().max(200).default('Type your message...'),
  disclaimer: z.string().max(500).default(''),
});

// ---------- the canonical chat config ----------
export const chatWidgetConfigSchema = z.object({
  schemaVersion: z.number().int().default(CONFIG_SCHEMA_VERSION),
  kind: z.literal('chat').default('chat'),
  branding: brandingSchema.default({}),
  theme: themeSchema.default({}),
  advancedStyling: advancedStylingSchema.default({}),
  behavior: behaviorSchema.default({}),
  connection: connectionSchema.default({}),
  features: featuresSchema.default({}),
  startScreen: startScreenSchema.default({}),
  composer: composerSchema.default({}),
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
```

```ts
// lib/widget-config/index.ts
export * from './schema';
export * from './defaults';
export * from './migrate';
```

(Create `defaults.ts` and `migrate.ts` as empty `export {}` files for now so the barrel compiles; Tasks 2–3 fill them.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/lib/widget-config/schema.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Type-check and commit**

```bash
pnpm type-check
git add lib/widget-config tests/lib/widget-config
git commit -m "feat(config): canonical widget config schema with defaults and tier refinements"
```

---

### Task 2: Legacy-shape migration (`migrateConfig`)

**Files:**
- Create: `lib/widget-config/migrate.ts` (replace the empty stub)
- Test: `tests/lib/widget-config/migrate.test.ts`

Stored configs come in three legacy shapes: (a) the widget-store shape (`style.primaryColor`, `typography`, `features.fileAttachments`), (b) playground flat fields (`themeMode`, `accentColor`, `greeting`, `starterPrompts`, `placeholder`, `n8nWebhookUrl`), (c) the already-structured shape (just missing `schemaVersion`/`startScreen`/`composer`). `migrateConfig` normalizes all of them and is idempotent.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/widget-config/migrate.test.ts
import { migrateConfig } from '@/lib/widget-config/migrate';
import { CONFIG_SCHEMA_VERSION } from '@/lib/widget-config/schema';

describe('migrateConfig', () => {
  it('passes through a v2 config unchanged (idempotent)', () => {
    const v2 = migrateConfig({});
    expect(migrateConfig(v2)).toEqual(v2);
  });

  it('migrates legacy store shape (style.*)', () => {
    const out = migrateConfig({
      branding: { companyName: 'Acme' },
      style: { theme: 'dark', primaryColor: '#00BFFF', backgroundColor: '#101010', textColor: '#EEEEEE', position: 'bottom-left', cornerRadius: 8 },
      typography: { fontFamily: 'Inter', fontSize: 16 },
      features: { fileAttachments: true, allowedExtensions: ['.pdf'], maxFileSize: 5 },
      connection: { webhookUrl: 'https://n8n.example.com/webhook/x', routeParam: 'general' },
    });
    expect(out.schemaVersion).toBe(CONFIG_SCHEMA_VERSION);
    expect(out.branding.companyName).toBe('Acme');
    expect(out.theme.mode).toBe('dark');
    expect(out.theme.colors.primary).toBe('#00BFFF');
    expect(out.theme.colors.userMessage).toBe('#00BFFF');
    expect(out.theme.colors.background).toBe('#101010');
    expect(out.theme.position.position).toBe('bottom-left');
    expect(out.theme.cornerRadius).toBe(8);
    expect(out.theme.typography.fontFamily).toBe('Inter');
    expect(out.features.attachments.enabled).toBe(true);
    expect(out.features.attachments.maxFileSizeMB).toBe(5);
    expect(out.connection.webhookUrl).toBe('https://n8n.example.com/webhook/x');
    expect(out.connection.route).toBe('general');
  });

  it('migrates playground flat fields', () => {
    const out = migrateConfig({
      themeMode: 'dark',
      accentColor: '#FF5733',
      greeting: 'Hi there',
      starterPrompts: [{ label: 'Pricing', icon: 'tag' }],
      placeholder: 'Ask me anything',
      n8nWebhookUrl: 'https://n8n.example.com/webhook/y',
    });
    expect(out.theme.mode).toBe('dark');
    expect(out.theme.colors.primary).toBe('#FF5733');
    expect(out.startScreen.greeting).toBe('Hi there');
    expect(out.startScreen.starterPrompts).toHaveLength(1);
    expect(out.composer.placeholder).toBe('Ask me anything');
    expect(out.connection.webhookUrl).toBe('https://n8n.example.com/webhook/y');
  });

  it('falls back to defaults for unparseable garbage', () => {
    const out = migrateConfig({ theme: { colors: { primary: 'not-a-color' } } });
    expect(out.theme.colors.primary).toBe('#4F46E5'); // default wins over invalid
    expect(out.schemaVersion).toBe(CONFIG_SCHEMA_VERSION);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/lib/widget-config/migrate.test.ts`
Expected: FAIL — `migrateConfig is not a function`

- [ ] **Step 3: Implement migrateConfig**

```ts
// lib/widget-config/migrate.ts
/**
 * Config Migration
 *
 * Purpose: Normalize any historical stored config shape to the canonical
 * schemaVersion 2 shape. Idempotent: migrate(migrate(x)) === migrate(x).
 * Strategy: build a candidate object section by section from whichever legacy
 * keys are present, then run it through chatWidgetConfigSchema with per-field
 * fallback (invalid leaf values are dropped so defaults apply).
 */
import {
  chatWidgetConfigSchema,
  CONFIG_SCHEMA_VERSION,
  type ChatWidgetConfig,
} from './schema';

type AnyRecord = Record<string, any>;

function isHex(v: unknown): v is string {
  return typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v);
}

/** Drop invalid leaves by safeParsing each section independently, falling back to {}. */
function lenientParse(candidate: AnyRecord): ChatWidgetConfig {
  const direct = chatWidgetConfigSchema.safeParse(candidate);
  if (direct.success) return direct.data;
  // Per-section fallback: keep sections that parse, default the ones that don't.
  const sections = ['branding', 'theme', 'advancedStyling', 'behavior', 'connection', 'features', 'startScreen', 'composer'] as const;
  const repaired: AnyRecord = { schemaVersion: CONFIG_SCHEMA_VERSION, kind: 'chat' };
  for (const s of sections) {
    const sectionSchema = (chatWidgetConfigSchema.shape as AnyRecord)[s];
    const r = sectionSchema.safeParse(candidate[s] ?? {});
    repaired[s] = r.success ? r.data : sectionSchema.parse({});
  }
  return chatWidgetConfigSchema.parse(repaired);
}

export function migrateConfig(raw: unknown): ChatWidgetConfig {
  const src: AnyRecord = (raw && typeof raw === 'object' ? raw : {}) as AnyRecord;

  // Already canonical → still run through lenientParse to repair bad leaves.
  if (src.schemaVersion === CONFIG_SCHEMA_VERSION) return lenientParse(src);

  const candidate: AnyRecord = {
    schemaVersion: CONFIG_SCHEMA_VERSION,
    kind: 'chat',
    branding: { ...(src.branding ?? {}) },
    theme: { ...(src.theme ?? {}) },
    advancedStyling: { ...(src.advancedStyling ?? {}) },
    behavior: { ...(src.behavior ?? {}) },
    connection: { ...(src.connection ?? {}) },
    features: { ...(src.features ?? {}) },
    startScreen: { ...(src.startScreen ?? {}) },
    composer: { ...(src.composer ?? {}) },
  };

  // ---- (a) legacy store shape: style.* / typography.* ----
  const style = src.style ?? {};
  if (style.theme) candidate.theme.mode = style.theme;
  if (isHex(style.primaryColor)) {
    candidate.theme.colors = { ...(candidate.theme.colors ?? {}), primary: style.primaryColor, userMessage: style.primaryColor };
  }
  if (isHex(style.backgroundColor)) candidate.theme.colors = { ...(candidate.theme.colors ?? {}), background: style.backgroundColor };
  if (isHex(style.textColor)) candidate.theme.colors = { ...(candidate.theme.colors ?? {}), text: style.textColor };
  if (style.position) candidate.theme.position = { ...(candidate.theme.position ?? {}), position: style.position };
  if (typeof style.cornerRadius === 'number') candidate.theme.cornerRadius = style.cornerRadius;

  const typo = src.typography ?? {};
  if (typo.fontFamily || typo.fontSize) {
    candidate.theme.typography = {
      ...(candidate.theme.typography ?? {}),
      ...(typo.fontFamily ? { fontFamily: typo.fontFamily } : {}),
      ...(typeof typo.fontSize === 'number' ? { fontSize: typo.fontSize } : {}),
    };
  }

  const feat = src.features ?? {};
  if (typeof feat.fileAttachments === 'boolean' || feat.allowedExtensions || feat.maxFileSize) {
    candidate.features.attachments = {
      ...(candidate.features.attachments ?? {}),
      ...(typeof feat.fileAttachments === 'boolean' ? { enabled: feat.fileAttachments } : {}),
      ...(Array.isArray(feat.allowedExtensions) ? { allowedExtensions: feat.allowedExtensions } : {}),
      ...(typeof feat.maxFileSize === 'number' ? { maxFileSizeMB: feat.maxFileSize } : {}),
    };
  }

  const conn = src.connection ?? {};
  if (conn.routeParam && !candidate.connection.route) candidate.connection.route = conn.routeParam;

  // ---- (b) playground flat fields ----
  if (src.themeMode) candidate.theme.mode = src.themeMode;
  if (isHex(src.accentColor)) {
    candidate.theme.colors = { ...(candidate.theme.colors ?? {}), primary: src.accentColor, userMessage: src.accentColor };
  }
  if (typeof src.greeting === 'string') candidate.startScreen.greeting = src.greeting;
  if (Array.isArray(src.starterPrompts)) candidate.startScreen.starterPrompts = src.starterPrompts;
  if (typeof src.placeholder === 'string') candidate.composer.placeholder = src.placeholder;
  if (typeof src.disclaimer === 'string') candidate.composer.disclaimer = src.disclaimer;
  if (typeof src.fontFamily === 'string') candidate.theme.typography = { ...(candidate.theme.typography ?? {}), fontFamily: src.fontFamily };
  if (typeof src.fontSize === 'number') candidate.theme.typography = { ...(candidate.theme.typography ?? {}), fontSize: src.fontSize };
  if (typeof src.n8nWebhookUrl === 'string' && src.n8nWebhookUrl) candidate.connection.webhookUrl = src.n8nWebhookUrl;
  if (typeof src.enableAttachments === 'boolean') {
    candidate.features.attachments = { ...(candidate.features.attachments ?? {}), enabled: src.enableAttachments };
  }

  return lenientParse(candidate);
}
```

Note: display-kind configs (`kind: 'display'`) are NOT routed through `migrateConfig` — they were born after v2 and validate against `displayWidgetConfigSchema` directly. Callers must check `widget.kind` first (Task 5 does this).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/lib/widget-config/migrate.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/widget-config/migrate.ts tests/lib/widget-config/migrate.test.ts
git commit -m "feat(config): migrateConfig normalizes all legacy config shapes to schemaVersion 2"
```

---

### Task 3: Defaults from the schema + deprecate the three old modules

**Files:**
- Create: `lib/widget-config/defaults.ts` (replace stub)
- Modify: `lib/config/defaults.ts` (becomes re-export shim)
- Modify: `lib/types/widget-config.ts` (becomes re-export shim)
- Modify: `lib/validation/widget-schema.ts` (becomes re-export shim)
- Test: `tests/lib/widget-config/defaults.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/widget-config/defaults.test.ts
import { createDefaultConfig } from '@/lib/widget-config/defaults';
import { createTierAwareSchema } from '@/lib/widget-config/schema';

describe('createDefaultConfig', () => {
  it('basic tier defaults have branding enabled and no premium features', () => {
    const cfg = createDefaultConfig('basic', 'chat');
    expect(cfg.branding.brandingEnabled).toBe(true);
    expect(cfg.advancedStyling.enabled).toBe(false);
    expect(cfg.features.emailTranscript).toBe(false);
  });

  it('pro tier defaults are white-label with premium features', () => {
    const cfg = createDefaultConfig('pro', 'chat');
    expect(cfg.branding.brandingEnabled).toBe(false);
    expect(cfg.advancedStyling.enabled).toBe(true);
    expect(cfg.features.emailTranscript).toBe(true);
  });

  it('free maps to basic', () => {
    expect(createDefaultConfig('free', 'chat')).toEqual(createDefaultConfig('basic', 'chat'));
  });

  it('every tier default validates against its own tier schema', () => {
    for (const tier of ['basic', 'pro', 'agency'] as const) {
      const schema = createTierAwareSchema(tier, tier === 'basic');
      expect(schema.safeParse(createDefaultConfig(tier, 'chat')).success).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/lib/widget-config/defaults.test.ts`
Expected: FAIL — `createDefaultConfig is not a function`

- [ ] **Step 3: Implement defaults + shims**

```ts
// lib/widget-config/defaults.ts
/**
 * Default Config Factory
 *
 * Purpose: The ONLY place defaults are produced. Derived from the canonical
 * schema (schema.parse({})) with tier-specific adjustments layered on top.
 */
import { chatWidgetConfigSchema, type ChatWidgetConfig } from './schema';
import { createDefaultDisplayConfig } from '@/lib/validation/display-widget-schema';

export type InputTier = 'free' | 'basic' | 'pro' | 'agency';

export function createDefaultConfig(tier: InputTier, kind: 'chat' | 'display' = 'chat'): ChatWidgetConfig | ReturnType<typeof createDefaultDisplayConfig> {
  if (!['free', 'basic', 'pro', 'agency'].includes(tier)) {
    throw new Error(`Invalid tier: ${tier}. Must be 'free', 'basic', 'pro', or 'agency'`);
  }
  if (kind === 'display') return createDefaultDisplayConfig(tier);

  const effective = tier === 'free' ? 'basic' : tier;
  const cfg = chatWidgetConfigSchema.parse({}); // all schema defaults
  const premium = effective === 'pro' || effective === 'agency';
  cfg.branding.brandingEnabled = !premium;
  cfg.advancedStyling.enabled = premium;
  cfg.features.emailTranscript = premium;
  cfg.features.ratingPrompt = premium;
  return cfg;
}
```

If `createDefaultDisplayConfig` does not yet exist in `lib/validation/display-widget-schema.ts`, extract it there from the `kind === 'display'` branch of the old `lib/config/defaults.ts` `createDefaultConfig` (the object literal at lines 239–277 of that file) — move that literal verbatim into a `createDefaultDisplayConfig(tier)` function in `display-widget-schema.ts` and export it.

Then convert the three old modules to shims (keep every existing import in the app working — same export names):

```ts
// lib/config/defaults.ts  (entire new content)
/** @deprecated Import from '@/lib/widget-config' instead. Kept as a re-export shim. */
export { createDefaultConfig } from '@/lib/widget-config/defaults';
```

```ts
// lib/types/widget-config.ts  (entire new content)
/** @deprecated Import from '@/lib/widget-config' instead. Kept as a re-export shim. */
export type {
  ChatWidgetConfig as WidgetConfig,
  BrandingConfig,
  ThemeConfig,
  AdvancedStylingConfig,
  BehaviorConfig,
  ConnectionConfig,
  FeaturesConfig,
} from '@/lib/widget-config/schema';
```

```ts
// lib/validation/widget-schema.ts  (entire new content)
/** @deprecated Import from '@/lib/widget-config' instead. Kept as a re-export shim. */
export {
  chatWidgetConfigSchema as widgetConfigBaseSchema,
  createTierAwareSchema as createWidgetConfigSchema,
  getSchemaForKind as getWidgetConfigSchemaForKind,
  normalizeTier,
  brandingSchema,
  themeSchema,
  advancedStylingSchema,
  behaviorSchema,
  connectionSchema,
  featuresSchema,
  displayWidgetConfigSchema,
  type LicenseTier,
} from '@/lib/widget-config/schema';
export type { ChatWidgetConfig as WidgetConfigInput } from '@/lib/widget-config/schema';
```

- [ ] **Step 4: Run the new test, then the full suite**

Run: `pnpm test -- tests/lib/widget-config/defaults.test.ts`
Expected: PASS

Run: `pnpm test`
Expected: Some existing tests of the old modules may fail because the old permissive `widgetConfigBaseSchema` accepted legacy shapes that the canonical schema rejects. For each failure, decide: if the test asserts legacy-shape acceptance, rewrite it to call `migrateConfig` first; if it asserts defaults, point it at `createDefaultConfig` from the new module. Do NOT weaken the canonical schema to make old tests pass.

- [ ] **Step 5: Type-check and commit**

```bash
pnpm type-check
git add -A lib tests
git commit -m "feat(config): defaults derived from canonical schema; old modules become deprecated shims"
```

---

> **AMENDMENT (discovered in execution):** the store's `WidgetConfig` carries ~30 playground/ChatKit runtime fields (accent/tint color system, radius/density, custom fonts, inline sizing, chatkit settings, pdfLightbox, customCss) with no canonical home, consumed by ~29 files. Before Task 4 runs, execute **Task 4a**: extend `lib/widget-config/schema.ts` with canonical sections for these (colorSystem, chatkit, theme.radius/density, typography extras, size.inlineWidth/Height, features.pdfLightbox, advanced.customCss), defaults matching the store's current values, and extend `migrateConfig` to map the legacy flat keys into them. Then Task 4 proceeds as written with the enlarged path-mapping table.

### Task 4: Point the Zustand store at the canonical config

**Files:**
- Modify: `stores/widget-store.ts` (delete the local 152-field interface at ~line 29 and the local `defaultConfig` constant at ~lines 268–339)
- Test: `tests/unit/stores/widget-store.test.ts` (or wherever the existing store test lives — `grep -r "widget-store" tests/ --include="*.test.*" -l` to find it)

- [ ] **Step 1: Write the failing test (add to existing store test file)**

```ts
import { useWidgetStore } from '@/stores/widget-store';
import { chatWidgetConfigSchema } from '@/lib/widget-config/schema';

describe('widget store uses canonical config', () => {
  it('initial config is the canonical default and validates', () => {
    const { config } = useWidgetStore.getState();
    expect(chatWidgetConfigSchema.safeParse(config).success).toBe(true);
    expect(config.theme.colors.primary).toBe('#4F46E5'); // NOT the old '#00bfff'
  });

  it('updateConfig rejects values that fail schema validation', () => {
    const { updateConfig } = useWidgetStore.getState();
    updateConfig({ theme: { colors: { primary: 'not-a-color' } } } as any);
    expect(useWidgetStore.getState().config.theme.colors.primary).toBe('#4F46E5');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/unit/stores/widget-store.test.ts`
Expected: FAIL — initial primary color is `#00bfff` (old hardcoded default) and/or type errors.

- [ ] **Step 3: Rewrite the store's config handling**

In `stores/widget-store.ts`:
1. Delete the local `WidgetConfig` interface (the 152-field one) entirely. Replace with `import { type ChatWidgetConfig as WidgetConfig, chatWidgetConfigSchema } from '@/lib/widget-config/schema';` and `import { createDefaultConfig } from '@/lib/widget-config/defaults';` and `import { migrateConfig } from '@/lib/widget-config/migrate';`.
2. Delete the local `defaultConfig` constant. Replace every use with `createDefaultConfig('basic', 'chat') as WidgetConfig`.
3. Make `updateConfig` validate-and-merge instead of blind-merge:

```ts
updateConfig: (partial: DeepPartial<WidgetConfig>) =>
  set((state) => {
    const merged = deepMerge(state.config, partial); // keep the store's existing deepMerge helper
    const result = chatWidgetConfigSchema.safeParse(merged);
    if (!result.success) {
      console.warn('[widget-store] rejected invalid config update', result.error.flatten());
      return state; // reject invalid updates; UI inputs should prevent these anyway
    }
    return { config: result.data, isDirty: true };
  }),
```

4. Where the store loads a widget from the API (`loadWidget`/`setConfig`-style action), pass the raw config through `migrateConfig` for `kind === 'chat'` widgets so legacy DB rows hydrate cleanly:

```ts
setConfigFromServer: (raw: unknown, kind: 'chat' | 'display') =>
  set({ config: kind === 'chat' ? migrateConfig(raw) : (raw as WidgetConfig), isDirty: false }),
```

5. Fix resulting type errors in components that referenced deleted legacy fields (e.g., `config.style.primaryColor` → `config.theme.colors.primary`). Find them all with `pnpm type-check` — fix each call site to the canonical path. The big consumers are `components/configurator/config-sidebar.tsx` and `components/configurator/chat-preview.tsx`; both get rewritten in Phases 5–6, so make minimal mechanical path fixes here, no refactoring.

- [ ] **Step 4: Run tests + type-check**

Run: `pnpm test -- tests/unit/stores && pnpm type-check`
Expected: PASS, zero type errors.

- [ ] **Step 5: Commit**

```bash
git add -A stores components tests
git commit -m "refactor(store): widget-store consumes canonical config schema, validates updates"
```

---

### Task 5: Migrate-on-read at every API boundary

**Files:**
- Modify: `app/api/widgets/route.ts` (POST: validate with `getSchemaForKind`; GET list: map configs through `migrateConfig`)
- Modify: `app/api/widgets/[id]/route.ts` (GET: migrate-on-read; PATCH: migrate then validate then save)
- Modify: `app/api/w/[widgetKey]/config/route.ts` (migrate-on-read before translating to runtime shape)
- Test: `tests/integration/api/widgets-config-migration.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/api/widgets-config-migration.test.ts
// Follow the existing integration-test setup pattern in tests/integration/api/
// (DB mocking/seeding helpers already used by the other 14 API integration tests).
import { migrateConfig } from '@/lib/widget-config/migrate';

describe('widget API config migration boundary', () => {
  it('GET /api/widgets/[id] returns schemaVersion 2 even for a legacy-shaped stored config', async () => {
    // Seed a widget whose config is the legacy store shape:
    const legacy = { style: { primaryColor: '#00BFFF' }, branding: { companyName: 'Legacy Co' } };
    const widget = await seedWidget({ kind: 'chat', config: legacy }); // use existing test seed helper
    const res = await GET_widget(widget.id); // use existing route-invocation helper
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.widget.config.schemaVersion).toBe(2);
    expect(body.widget.config.theme.colors.primary).toBe('#00BFFF');
    expect(body.widget.config.branding.companyName).toBe('Legacy Co');
  });

  it('PATCH /api/widgets/[id] persists canonical shape', async () => {
    const widget = await seedWidget({ kind: 'chat', config: migrateConfig({}) });
    const res = await PATCH_widget(widget.id, { config: { theme: { colors: { primary: '#112233' } } } });
    expect(res.status).toBe(200);
    const stored = await getStoredWidget(widget.id);
    expect(stored.config.schemaVersion).toBe(2);
    expect(stored.config.theme.colors.primary).toBe('#112233');
  });
});
```

(Adapt the helper names — `seedWidget`, `GET_widget`, `PATCH_widget`, `getStoredWidget` — to whatever the existing integration tests in `tests/integration/api/` actually use. Read one of them first and copy its setup verbatim.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/integration/api/widgets-config-migration.test.ts`
Expected: FAIL — returned config has no `schemaVersion` / legacy shape comes back raw.

- [ ] **Step 3: Apply the pattern at each boundary**

The pattern, applied identically in all three routes (only for `kind === 'chat'`; display configs validate against `displayWidgetConfigSchema` directly):

```ts
import { migrateConfig } from '@/lib/widget-config/migrate';
import { getSchemaForKind, normalizeTier } from '@/lib/widget-config/schema';

// READ boundary (GET handlers) — wherever the route does `widget.config`:
const config = widget.kind === 'chat' ? migrateConfig(widget.config) : widget.config;

// WRITE boundary (POST/PATCH handlers) — before db insert/update:
const tier = normalizeTier(user.tier);
const merged = widget.kind === 'chat'
  ? migrateConfig({ ...migrateConfig(existingConfig), ...incomingPartialConfig })
  : incomingConfig;
const schema = getSchemaForKind(widget.kind, tier, tier === 'basic');
const parsed = schema.safeParse(merged);
if (!parsed.success) {
  return NextResponse.json({ error: 'Invalid widget configuration', details: parsed.error.flatten() }, { status: 400 });
}
// persist parsed.data
```

In `app/api/w/[widgetKey]/config/route.ts`, run `migrateConfig` FIRST, then feed the canonical config into the existing 70-field runtime translation — this lets you delete every legacy-field fallback (`config.style?.primaryColor ?? config.accentColor ?? ...`) in that translation, reading only canonical paths.

- [ ] **Step 4: Run the integration tests + full suite**

Run: `pnpm test -- tests/integration && pnpm test`
Expected: PASS. Legacy-shape fixtures in existing route tests now come back migrated — update assertions accordingly.

- [ ] **Step 5: Commit**

```bash
git add -A app/api tests
git commit -m "feat(api): migrate-on-read + validate-on-write with canonical config at all widget API boundaries"
```

---

### Task 6: Widget runtime imports shared config types

**Files:**
- Modify: `widget/src/types.ts` (replace duplicated config interfaces with type-only imports)
- Modify: `widget/src/core/config.ts` (defaults come from shared constants, not a third copy)
- Test: existing widget tests (`pnpm test -- tests/widget`)

- [ ] **Step 1: Replace duplicated types**

In `widget/src/types.ts`, delete the locally-defined config interfaces that duplicate canonical sections and re-export the canonical ones (type-only — esbuild erases them, adding zero bytes to the bundle):

```ts
// widget/src/types.ts — config section types now come from the canonical schema.
export type {
  ChatWidgetConfig,
  BrandingConfig,
  ThemeConfig,
  ConnectionConfig,
  FeaturesConfig,
  StartScreenConfig,
  ComposerConfig,
} from '../../lib/widget-config/schema';
// Keep ONLY runtime-specific types here (RuntimeConfig, relay shapes, message/state types).
```

Note the relative import (`../../lib/...`): the widget package builds with esbuild from `widget/src/index.ts`, not the Next.js tsconfig paths, so `@/` aliases don't resolve there. Verify the widget's tsconfig includes `lib/` or add the path. **Constraint:** `widget/src` may import TYPES from `lib/widget-config/schema.ts`, but must never import runtime values from it (that would pull Zod into the 183KB bundle). Enforce with a comment at the import site and check bundle size in Step 3.

- [ ] **Step 2: Align runtime defaults**

In `widget/src/core/config.ts`, the `mergeConfig` defaults (~18 values) must equal the canonical schema defaults. Update each literal to match `lib/widget-config/schema.ts` (primary `#4F46E5`, position `bottom-right`, fontSize `14`, etc.). Don't import Zod — just align the literals and add:

```ts
// NOTE: These literals MUST mirror lib/widget-config/schema.ts defaults.
// The runtime cannot import the Zod schema (bundle size). Guarded by
// tests/widget/config-defaults-parity.test.ts.
```

Create that parity test:

```ts
// tests/widget/config-defaults-parity.test.ts
import { chatWidgetConfigSchema } from '@/lib/widget-config/schema';
import { mergeConfig } from '@/widget/src/core/config'; // adjust to actual export

it('widget runtime defaults match canonical schema defaults', () => {
  const canonical = chatWidgetConfigSchema.parse({});
  const runtime = mergeConfig({}); // runtime defaults with empty user config
  expect(runtime.style?.primaryColor ?? runtime.theme?.colors?.primary).toBe(canonical.theme.colors.primary);
  expect(runtime.style?.position ?? runtime.theme?.position?.position).toBe(canonical.theme.position.position);
  expect(runtime.branding?.companyName).toBe(canonical.branding.companyName);
});
```

(Adjust property paths to the actual `mergeConfig` return shape in `widget/src/core/config.ts` — read it first.)

- [ ] **Step 3: Build the widget and verify size didn't grow**

Run: `pnpm build:widget && ls -la public/widget/chat-widget.iife.js`
Expected: bundle builds, size within ±2KB of before (type-only imports add nothing). If it grew >10KB, a runtime value of the schema leaked into the bundle — find and remove the value import.

Run: `pnpm test -- tests/widget`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add -A widget tests
git commit -m "refactor(widget): runtime imports canonical config types; defaults parity-tested against schema"
```

**Phase 1 exit criteria:** `grep -rn "interface WidgetConfig" --include="*.ts" --include="*.tsx" .` returns only the canonical module and shims. `pnpm test && pnpm type-check && pnpm build:widget` all green.

---

## Phase 2 — Finish the v1→v2 Migration (one identity model)

**Problem being fixed:** widgets have two nullable ownership paths (`userId` and `licenseId`), the `widgetConfigs` table is dead code, three endpoints serve configs, and domain validation differs per path.

**End state:** every widget has a non-null `userId` and `widgetKey`; `widgetConfigs` is dropped; `licenseId` is dropped; the legacy license-based config endpoint is deleted; the legacy `chat-widget.js` route is a thin compat adapter. The `licenses` table remains (for now) purely as a billing-entitlement record — nothing resolves identity through it.

### Task 7: Backfill script (userId, widgetKey, allowedDomains)

**Files:**
- Create: `scripts/migrate-v2-backfill.ts`
- Test: `tests/lib/db/v2-backfill.test.ts` (unit-test the pure helpers, not the DB run)

- [ ] **Step 1: Write the failing test for the key-generation helper**

```ts
// tests/lib/db/v2-backfill.test.ts
import { generateWidgetKey } from '@/lib/license/widget-key';

describe('generateWidgetKey', () => {
  it('produces 16-char alphanumeric keys', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateWidgetKey()).toMatch(/^[A-Za-z0-9]{16}$/);
    }
  });
  it('produces unique keys', () => {
    const keys = new Set(Array.from({ length: 1000 }, () => generateWidgetKey()));
    expect(keys.size).toBe(1000);
  });
});
```

If `generateWidgetKey` already exists somewhere in `lib/` (check: `grep -rn "widgetKey" lib/license lib/utils --include="*.ts" | grep -i generate`), import from there and skip creating it; otherwise:

```ts
// lib/license/widget-key.ts
import { randomBytes } from 'node:crypto';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export function generateWidgetKey(): string {
  const bytes = randomBytes(16);
  let key = '';
  for (let i = 0; i < 16; i++) key += ALPHABET[bytes[i] % ALPHABET.length];
  return key;
}
```

- [ ] **Step 2: Run test**

Run: `pnpm test -- tests/lib/db/v2-backfill.test.ts`
Expected: PASS after creating the helper (or immediately if it existed).

- [ ] **Step 3: Write the backfill script**

```ts
// scripts/migrate-v2-backfill.ts
/**
 * One-time v1→v2 backfill. Idempotent — safe to re-run.
 * Run with: pnpm tsx scripts/migrate-v2-backfill.ts
 *
 * 1. widgets.userId   ← licenses.userId   (where userId IS NULL and licenseId IS NOT NULL)
 * 2. widgets.widgetKey ← generated 16-char key (where NULL)
 * 3. widgets.allowedDomains ← licenses.domains (where allowedDomains IS NULL/empty and license has domains)
 * Prints a summary and exits non-zero if any widget remains without userId or widgetKey.
 */
import { db } from '@/lib/db'; // adjust to the actual db client export (check lib/db/index.ts)
import { widgets, licenses } from '@/lib/db/schema';
import { eq, isNull, and, isNotNull } from 'drizzle-orm';
import { generateWidgetKey } from '@/lib/license/widget-key';

async function main() {
  // 1. userId from license
  const orphans = await db
    .select({ id: widgets.id, licenseId: widgets.licenseId })
    .from(widgets)
    .where(and(isNull(widgets.userId), isNotNull(widgets.licenseId)));
  for (const w of orphans) {
    const [lic] = await db.select().from(licenses).where(eq(licenses.id, w.licenseId!));
    if (!lic) { console.error(`Widget ${w.id} has dangling licenseId ${w.licenseId}`); continue; }
    await db.update(widgets).set({ userId: lic.userId }).where(eq(widgets.id, w.id));
  }
  console.log(`Backfilled userId for ${orphans.length} widgets`);

  // 2. widgetKey
  const keyless = await db.select({ id: widgets.id }).from(widgets).where(isNull(widgets.widgetKey));
  for (const w of keyless) {
    await db.update(widgets).set({ widgetKey: generateWidgetKey() }).where(eq(widgets.id, w.id));
  }
  console.log(`Generated widgetKey for ${keyless.length} widgets`);

  // 3. allowedDomains from license.domains
  const all = await db.select().from(widgets).where(isNotNull(widgets.licenseId));
  let domainCount = 0;
  for (const w of all) {
    if (Array.isArray(w.allowedDomains) && w.allowedDomains.length > 0) continue;
    const [lic] = await db.select().from(licenses).where(eq(licenses.id, w.licenseId!));
    if (lic && lic.domains.length > 0) {
      await db.update(widgets).set({ allowedDomains: lic.domains }).where(eq(widgets.id, w.id));
      domainCount++;
    }
  }
  console.log(`Copied allowedDomains for ${domainCount} widgets`);

  // Verify
  const remaining = await db.select({ id: widgets.id }).from(widgets).where(isNull(widgets.userId));
  const remainingKeys = await db.select({ id: widgets.id }).from(widgets).where(isNull(widgets.widgetKey));
  if (remaining.length || remainingKeys.length) {
    console.error(`INCOMPLETE: ${remaining.length} widgets without userId, ${remainingKeys.length} without widgetKey`);
    process.exit(1);
  }
  console.log('Backfill complete and verified.');
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 4: Run against the dev database**

Run: `pnpm tsx scripts/migrate-v2-backfill.ts`
Expected: summary lines + `Backfill complete and verified.` Re-run to confirm idempotency (all counts 0 the second time).

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-v2-backfill.ts lib/license/widget-key.ts tests/lib/db
git commit -m "feat(migration): idempotent v1->v2 backfill for userId, widgetKey, allowedDomains"
```

---

### Task 8: Drop dead schema (widgetConfigs, licenseId) and tighten constraints

**Files:**
- Modify: `lib/db/schema.ts`
- Modify: `lib/db/queries.ts` (delete `getConfigByLicenseId`, `saveWidgetConfig`, `updateConfig` — the widgetConfigs functions at ~lines 213–279)
- Create: generated Drizzle migration (via `pnpm db:generate`)

- [ ] **Step 1: Confirm widgetConfigs is truly dead**

Run: `grep -rn "widgetConfigs\|widget_configs\|getConfigByLicenseId\|saveWidgetConfig" app/ lib/ components/ stores/ --include="*.ts" --include="*.tsx" | grep -v "lib/db/schema.ts" | grep -v "lib/db/queries.ts"`
Expected: zero hits. If anything appears, migrate that call site to the `widgets` table first — do not proceed blind.

- [ ] **Step 2: Edit the schema**

In `lib/db/schema.ts`:
1. Delete the entire `widgetConfigs` table definition (lines 76–83), its relations block (`widgetConfigsRelations`, lines 228–233), the `widgetConfig: one(widgetConfigs)` line inside `licensesRelations` (line 223), and the `WidgetConfig`/`NewWidgetConfig` type exports (lines 283–284). Note: the type export name `WidgetConfig` colliding with the config-object type was itself a source of confusion — its removal is intentional.
2. In the `widgets` table: change `userId` to `.notNull()`, change `widgetKey` to `.notNull()`, and delete the `licenseId` column (line 137), its index (line 142), and the `license: one(licenses, ...)` relation (lines 241–245). Delete `widgets: many(widgets)` from `licensesRelations` (line 224).
3. In `analyticsEvents`: change `licenseId` to a nullable `userId` reference instead (analytics follow the new ownership model):

```ts
export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  widgetId: uuid('widget_id').references(() => widgets.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  domain: varchar('domain', { length: 255 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

(Update `analyticsEventsRelations` to match. Check call sites: `grep -rn "analyticsEvents" app/ lib/ --include="*.ts"` and update insertions to pass `userId`/`widgetId`.)

- [ ] **Step 3: Generate and inspect the migration**

Run: `pnpm db:generate`
Expected: a new migration in `drizzle/` containing `DROP TABLE "widget_configs"`, `ALTER TABLE "widgets" ALTER COLUMN "user_id" SET NOT NULL`, `ALTER COLUMN "widget_key" SET NOT NULL`, `DROP COLUMN "license_id"`. Read the generated SQL before applying — Drizzle sometimes generates destructive reorders; if it tries to drop/recreate `widgets`, hand-edit the migration to plain ALTERs.

**Ordering guard:** this migration must run AFTER Task 7's backfill in every environment (dev, staging, prod). The NOT NULL constraints will fail loudly if backfill was skipped — that is the desired safety behavior.

- [ ] **Step 4: Apply, delete dead queries, fix fallout**

Run: `pnpm db:migrate` (dev DB)
Then delete the three widgetConfigs query functions from `lib/db/queries.ts`. Run `pnpm type-check` and fix every error — these are exactly the remaining legacy-path call sites (expect them in `app/api/widget/[license]/...` routes, handled fully in Task 9; for now make them compile by resolving the license's widgets via `licenses → users → widgets` or marking with a `// TASK-9` comment plus a thrown 410 response).

- [ ] **Step 5: Test and commit**

Run: `pnpm test`
Expected: PASS after updating DB-schema tests (`tests/` has 6 schema/query test files — remove widgetConfigs cases, add a case asserting `widgets.userId` is non-nullable).

```bash
git add -A lib/db drizzle app tests
git commit -m "feat(db): drop widgetConfigs and widgets.licenseId; userId/widgetKey now NOT NULL"
```

---

### Task 9: Collapse the three config endpoints to one + legacy compat adapter

**Files:**
- Delete: `app/api/widget/[license]/config/route.ts` (375 lines)
- Modify: `app/api/widget/[license]/chat-widget.js/route.ts` (becomes ~60-line compat adapter)
- Modify: `app/api/w/[widgetKey]/config/route.ts` (becomes THE config endpoint; absorb domain check)
- Create: `lib/widget/resolve-widget.ts` (shared resolution + authorization used by config endpoint and relay)
- Test: `tests/integration/api/widget-resolution.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/api/widget-resolution.test.ts
import { resolveAuthorizedWidget } from '@/lib/widget/resolve-widget';

describe('resolveAuthorizedWidget', () => {
  it('resolves an active widget by widgetKey for an allowed domain', async () => {
    const { widget } = await seedWidgetWithUser({ allowedDomains: ['example.com'], tier: 'pro' });
    const result = await resolveAuthorizedWidget(widget.widgetKey!, 'example.com', 'app.localhost');
    expect(result.ok).toBe(true);
  });
  it('rejects unknown keys', async () => {
    const result = await resolveAuthorizedWidget('AAAAAAAAAAAAAAAA', 'example.com', 'app.localhost');
    expect(result).toEqual({ ok: false, status: 404, error: 'Widget not found' });
  });
  it('rejects unauthorized domains for non-agency tiers', async () => {
    const { widget } = await seedWidgetWithUser({ allowedDomains: ['example.com'], tier: 'basic' });
    const result = await resolveAuthorizedWidget(widget.widgetKey!, 'evil.com', 'app.localhost');
    expect(result).toEqual({ ok: false, status: 403, error: 'Domain not authorized for this widget' });
  });
  it('rejects paused widgets and inactive subscriptions', async () => {
    const { widget } = await seedWidgetWithUser({ status: 'paused' });
    const result = await resolveAuthorizedWidget(widget.widgetKey!, 'example.com', 'app.localhost');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/integration/api/widget-resolution.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the shared resolver**

Extract the logic that today lives duplicated in `chat-relay/route.ts` (lines 67–109 and 156–223) into one place:

```ts
// lib/widget/resolve-widget.ts
/**
 * Shared widget resolution + authorization.
 * Used by: /api/w/[widgetKey]/config, /api/chat-relay, legacy compat adapter.
 * Single place where "may this domain use this widget?" is decided.
 */
import { getWidgetByKeyWithUser } from '@/lib/db/queries';
import { normalizeDomain } from '@/lib/license/domain';

export type ResolveResult =
  | { ok: true; widget: any; user: any }
  | { ok: false; status: number; error: string };

function isSubscriptionActive(user: any): boolean {
  const status = user?.subscriptionStatus || 'active';
  if (status === 'active' || status === 'past_due') return true;
  if (status === 'canceled') return Boolean(user?.currentPeriodEnd && new Date(user.currentPeriodEnd) > new Date());
  return false;
}

export function isDomainAllowed(requestDomain: string, allowedDomains: string[], userTier: string, requestHost: string): boolean {
  if (userTier === 'agency' || allowedDomains.length === 0) return true;
  const normalizedHost = normalizeDomain((requestHost || '').split(':')[0] || '');
  if (requestDomain !== 'unknown' && normalizedHost !== 'unknown' && requestDomain === normalizedHost) return true;
  if (requestDomain === 'localhost' && process.env.NODE_ENV !== 'production') return true;
  return allowedDomains.some((allowed) => {
    const a = normalizeDomain(allowed);
    return a === requestDomain || requestDomain.endsWith(`.${a}`);
  });
}

export async function resolveAuthorizedWidget(widgetKey: string, requestDomain: string | null, requestHost: string): Promise<ResolveResult> {
  if (!/^[A-Za-z0-9]{16}$/.test(widgetKey)) return { ok: false, status: 404, error: 'Widget not found' };
  const widget = await getWidgetByKeyWithUser(widgetKey);
  if (!widget) return { ok: false, status: 404, error: 'Widget not found' };
  if (widget.status !== 'active') return { ok: false, status: 403, error: 'Widget is not active' };
  const user = widget.user;
  if (!user || !isSubscriptionActive(user)) return { ok: false, status: 403, error: 'Subscription is not active' };
  if (!requestDomain) return { ok: false, status: 403, error: 'Origin or referer header is required' };
  const allowed = Array.isArray(widget.allowedDomains) ? widget.allowedDomains : [];
  if (!isDomainAllowed(requestDomain, allowed, user.tier || 'free', requestHost)) {
    return { ok: false, status: 403, error: 'Domain not authorized for this widget' };
  }
  return { ok: true, widget, user };
}
```

Note the one behavior change vs today: `localhost` bypass is now gated on `NODE_ENV !== 'production'` (today it's unconditional — an authorization hole).

- [ ] **Step 4: Rewire the three consumers**

1. `app/api/w/[widgetKey]/config/route.ts`: replace its inline lookup/domain logic with `resolveAuthorizedWidget(...)`; on `!ok` return `NextResponse.json({ error }, { status })`.
2. `app/api/chat-relay/route.ts`: replace lines 156–223 (the dual-path widget/user/domain resolution) with a single `resolveAuthorizedWidget(licenseKey, requestDomain, hostHeader)` call when `licenseKey` matches the widgetKey pattern. **Delete the legacy `widgetId + licenseKey` path entirely** — after Task 7 every widget has a widgetKey; respond 410 `{ error: 'Legacy embed format no longer supported; re-copy your embed code from the dashboard' }` for non-widgetKey values.
3. Delete `app/api/widget/[license]/config/route.ts`. Rewrite `app/api/widget/[license]/chat-widget.js/route.ts` as a compat adapter: look up the license by key, find that user's first active widget, and 302-redirect to the v2 loader URL (Task 17 creates it; until then redirect to `/api/embed/bundle.js`):

```ts
// app/api/widget/[license]/chat-widget.js/route.ts — compat adapter
import { NextRequest, NextResponse } from 'next/server';
import { getLicenseByKey, getFirstActiveWidgetForUser } from '@/lib/db/queries'; // add the query if missing
export async function GET(request: NextRequest, { params }: { params: Promise<{ license: string }> }) {
  const { license } = await params;
  const lic = await getLicenseByKey(license);
  if (!lic || lic.status !== 'active') {
    return new NextResponse('// widget unavailable: invalid license', { status: 404, headers: { 'Content-Type': 'application/javascript' } });
  }
  const widget = await getFirstActiveWidgetForUser(lic.userId);
  if (!widget?.widgetKey) {
    return new NextResponse('// widget unavailable: no active widget', { status: 404, headers: { 'Content-Type': 'application/javascript' } });
  }
  const url = new URL(request.url);
  return NextResponse.redirect(`${url.origin}/widget/loader.js?key=${widget.widgetKey}`, 302);
}
```

- [ ] **Step 5: Test, type-check, commit**

Run: `pnpm test && pnpm type-check`
Expected: PASS — update/delete the tests of the removed legacy config endpoint; chat-relay tests that used `widgetId+licenseKey` now expect 410.

```bash
git add -A app/api lib/widget lib/db tests
git commit -m "feat(api): single widget resolution path; legacy license endpoints reduced to compat adapter"
```

---

### Task 10: Single tier-limits module

**Files:**
- Create: `lib/license/tiers.ts`
- Modify: `app/api/widgets/route.ts` (delete inline `TIER_LIMITS` at ~lines 41–46)
- Test: `tests/lib/license/tiers.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/license/tiers.test.ts
import { TIER_LIMITS, canCreateWidget } from '@/lib/license/tiers';

describe('tier limits', () => {
  it('defines limits for every tier', () => {
    expect(TIER_LIMITS.free.maxWidgets).toBe(3);
    expect(TIER_LIMITS.basic.maxWidgets).toBe(5);
    expect(TIER_LIMITS.pro.maxWidgets).toBe(Infinity);
    expect(TIER_LIMITS.agency.maxWidgets).toBe(Infinity);
  });
  it('canCreateWidget enforces the cap', () => {
    expect(canCreateWidget('free', 2)).toBe(true);
    expect(canCreateWidget('free', 3)).toBe(false);
    expect(canCreateWidget('agency', 9999)).toBe(true);
  });
  it('unknown tiers are treated as free', () => {
    expect(canCreateWidget('garbage' as any, 3)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails, then implement**

Run: `pnpm test -- tests/lib/license/tiers.test.ts` → FAIL.

```ts
// lib/license/tiers.ts
/**
 * Single source of truth for tier entitlements. users.tier is the ONLY tier
 * input — licenses.tier must never be consulted for feature gating.
 */
export type Tier = 'free' | 'basic' | 'pro' | 'agency';

export const TIER_LIMITS: Record<Tier, { maxWidgets: number; brandingRemovable: boolean; unlimitedDomains: boolean }> = {
  free:   { maxWidgets: 3,        brandingRemovable: false, unlimitedDomains: false },
  basic:  { maxWidgets: 5,        brandingRemovable: false, unlimitedDomains: false },
  pro:    { maxWidgets: Infinity, brandingRemovable: true,  unlimitedDomains: false },
  agency: { maxWidgets: Infinity, brandingRemovable: true,  unlimitedDomains: true },
};

export function normalizeUserTier(raw: string | null | undefined): Tier {
  return raw === 'basic' || raw === 'pro' || raw === 'agency' ? raw : 'free';
}

export function canCreateWidget(tier: string, currentCount: number): boolean {
  return currentCount < TIER_LIMITS[normalizeUserTier(tier)].maxWidgets;
}
```

Replace the inline `TIER_LIMITS` in `app/api/widgets/route.ts` with these imports. Run `grep -rn "TIER_LIMITS\|widgetLimit\|tier ===" app/api lib --include="*.ts" | grep -v tiers.ts` and route every tier decision through this module (use `TIER_LIMITS[tier].brandingRemovable` for the `brandingRequired` argument to `getSchemaForKind`).

- [ ] **Step 3: Test and commit**

Run: `pnpm test && pnpm type-check` → PASS.

```bash
git add lib/license/tiers.ts app/api tests
git commit -m "refactor(license): single tier-entitlements module; users.tier is the only gating input"
```

**Phase 2 exit criteria:** `grep -rn "licenseId" app/ lib/ stores/ components/ --include="*.ts*"` returns only the licenses table itself and billing code. All widgets resolve by widgetKey. `pnpm test` green.

---

## Phase 3 — Security Hardening

**Problem being fixed:** in-memory rate limiting is a no-op on serverless; the relay fetches user-controlled webhook URLs with no SSRF guard and no timeout; missing env vars fail at request time; dormant Stripe code paths lie about billing.

### Task 11: Redis-backed rate limiting (with dev fallback)

**Files:**
- Modify: `lib/security/rate-limit.ts` (rewrite; async API)
- Delete: `lib/widget/rate-limit.ts` (the duplicate limiter)
- Modify call sites: `app/api/chat-relay/route.ts`, `app/api/widget/[license]/chat-widget.js/route.ts` (now adapter — limiter likely removable), `app/api/auth/login/route.ts`, `app/api/auth/signup/route.ts` (find the full list: `grep -rln "checkRateLimit" app/ --include="*.ts"`)
- Test: `tests/lib/security/rate-limit.test.ts`

- [ ] **Step 1: Add dependencies**

```bash
pnpm add @upstash/redis @upstash/ratelimit
```

Add to `.env.example`:

```
# Rate limiting (Upstash Redis via Vercel Marketplace). Leave empty in dev to use in-memory fallback.
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

- [ ] **Step 2: Write the failing test (exercises the memory fallback)**

```ts
// tests/lib/security/rate-limit.test.ts
import { checkRateLimit, resetRateLimit } from '@/lib/security/rate-limit';

describe('rate limiter (memory fallback)', () => {
  beforeEach(() => resetRateLimit());

  it('allows up to the limit then blocks with retryAfter', async () => {
    const cfg = { limit: 3, windowMs: 60_000 };
    expect((await checkRateLimit('test', 'ip1', cfg)).allowed).toBe(true);
    expect((await checkRateLimit('test', 'ip1', cfg)).allowed).toBe(true);
    expect((await checkRateLimit('test', 'ip1', cfg)).allowed).toBe(true);
    const blocked = await checkRateLimit('test', 'ip1', cfg);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThanOrEqual(1);
  });

  it('isolates namespaces and identifiers', async () => {
    const cfg = { limit: 1, windowMs: 60_000 };
    await checkRateLimit('a', 'x', cfg);
    expect((await checkRateLimit('a', 'y', cfg)).allowed).toBe(true);
    expect((await checkRateLimit('b', 'x', cfg)).allowed).toBe(true);
  });

  it('fails open if the backend throws (availability over strictness)', async () => {
    // covered implicitly: memory fallback never throws; Redis errors are caught in implementation
  });
});
```

- [ ] **Step 3: Run test (fails on async signature), then implement**

```ts
// lib/security/rate-limit.ts
/**
 * Distributed rate limiting.
 * Backend: Upstash Redis (sliding window) when UPSTASH_REDIS_REST_URL is set;
 * otherwise process-local memory (dev/test only — logs a warning once in prod).
 * Policy: fails OPEN on Redis errors (a broken limiter must not take down chat).
 */
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimitConfig { limit: number; windowMs: number; }
export interface RateLimitResult { allowed: boolean; retryAfter?: number; remaining: number; }

interface RateEntry { count: number; windowStart: number; }
const memoryStores = new Map<string, Map<string, RateEntry>>();
const limiters = new Map<string, Ratelimit>();
let warnedProdMemory = false;

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

function memoryCheck(namespace: string, identifier: string, config: RateLimitConfig): RateLimitResult {
  let store = memoryStores.get(namespace);
  if (!store) { store = new Map(); memoryStores.set(namespace, store); }
  const now = Date.now();
  const current = store.get(identifier);
  if (!current || now - current.windowStart >= config.windowMs) {
    store.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, remaining: Math.max(config.limit - 1, 0) };
  }
  if (current.count >= config.limit) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.windowStart + config.windowMs - now) / 1000)), remaining: 0 };
  }
  current.count += 1;
  return { allowed: true, remaining: Math.max(config.limit - current.count, 0) };
}

export async function checkRateLimit(namespace: string, identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
  if (!redis) {
    if (process.env.NODE_ENV === 'production' && !warnedProdMemory) {
      console.warn('[rate-limit] UPSTASH_REDIS_REST_URL not set — falling back to per-instance memory limiting');
      warnedProdMemory = true;
    }
    return memoryCheck(namespace, identifier || 'unknown', config);
  }
  const limiterKey = `${namespace}:${config.limit}:${config.windowMs}`;
  let limiter = limiters.get(limiterKey);
  if (!limiter) {
    limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(config.limit, `${config.windowMs} ms`), prefix: `rl:${namespace}` });
    limiters.set(limiterKey, limiter);
  }
  try {
    const r = await limiter.limit(identifier || 'unknown');
    return { allowed: r.success, remaining: r.remaining, retryAfter: r.success ? undefined : Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)) };
  } catch (err) {
    console.error('[rate-limit] Redis error, failing open:', err);
    return { allowed: true, remaining: 0 };
  }
}

export function resetRateLimit(namespace?: string): void {
  if (namespace) memoryStores.delete(namespace); else memoryStores.clear();
}
```

- [ ] **Step 4: Update call sites and delete the duplicate**

Every caller changes `const r = checkRateLimit(...)` → `const r = await checkRateLimit(...)` (handlers are already async). Delete `lib/widget/rate-limit.ts`; its only consumer was the legacy serve route, which Task 9 reduced to an adapter — if the adapter still rate-limits, switch it to the shared module (`checkRateLimit('widget-serve:ip', clientIP, { limit: 10, windowMs: 1000 })`).

- [ ] **Step 5: Test and commit**

Run: `pnpm test && pnpm type-check` → PASS (update the old `lib/widget/rate-limit` unit test: delete it; the new module's test replaces it).

```bash
git add -A lib app tests package.json pnpm-lock.yaml .env.example
git commit -m "feat(security): Upstash Redis rate limiting with dev memory fallback; single limiter module"
```

---

### Task 12: SSRF guard for webhook URLs

**Files:**
- Create: `lib/security/url-guard.ts`
- Test: `tests/lib/security/url-guard.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/security/url-guard.test.ts
import { assertPublicWebhookUrl, isPrivateIp } from '@/lib/security/url-guard';

describe('isPrivateIp', () => {
  it.each(['127.0.0.1', '10.0.0.5', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '0.0.0.0', '::1', 'fd00::1', 'fe80::1'])(
    'flags %s as private', (ip) => expect(isPrivateIp(ip)).toBe(true)
  );
  it.each(['8.8.8.8', '1.1.1.1', '93.184.216.34', '2606:4700:4700::1111'])(
    'allows %s as public', (ip) => expect(isPrivateIp(ip)).toBe(false)
  );
});

describe('assertPublicWebhookUrl', () => {
  it('rejects non-https schemes', async () => {
    await expect(assertPublicWebhookUrl('ftp://example.com/x')).rejects.toThrow(/https/i);
    await expect(assertPublicWebhookUrl('javascript:alert(1)')).rejects.toThrow();
    await expect(assertPublicWebhookUrl('http://example.com/x')).rejects.toThrow(/https/i);
  });
  it('rejects literal private IPs without DNS lookup', async () => {
    await expect(assertPublicWebhookUrl('https://169.254.169.254/latest/meta-data')).rejects.toThrow(/private/i);
    await expect(assertPublicWebhookUrl('https://10.0.0.1/hook')).rejects.toThrow(/private/i);
  });
  it('rejects hostnames that resolve to private ranges', async () => {
    // localtest.me resolves to 127.0.0.1; if offline in CI, mock node:dns/promises lookup instead
    await expect(assertPublicWebhookUrl('https://localtest.me/hook')).rejects.toThrow(/private/i);
  });
  it('allows localhost over http ONLY outside production', async () => {
    await expect(assertPublicWebhookUrl('http://localhost:5678/webhook/test')).resolves.toBeInstanceOf(URL);
  });
});
```

- [ ] **Step 2: Run test to verify it fails, then implement**

```ts
// lib/security/url-guard.ts
/**
 * SSRF guard for user-supplied webhook URLs.
 * Enforces: https only (http://localhost allowed outside production), public IPs only.
 * Residual risk (accepted): DNS rebinding between validation and fetch. Mitigated by
 * the 15s fetch timeout in the relay; full mitigation would require fetching by
 * pinned IP, which n8n's TLS setup doesn't support cleanly.
 */
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const PRIVATE_V4 = [
  /^0\./, /^10\./, /^127\./, /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

export function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) return PRIVATE_V4.some((re) => re.test(ip));
  const lower = ip.toLowerCase();
  return (
    lower === '::' || lower === '::1' ||
    lower.startsWith('fc') || lower.startsWith('fd') ||  // unique-local
    lower.startsWith('fe80') ||                           // link-local
    lower.startsWith('::ffff:') && isPrivateIp(lower.slice(7)) // v4-mapped
  );
}

const isDevLocalhost = (u: URL) =>
  process.env.NODE_ENV !== 'production' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1');

export async function assertPublicWebhookUrl(raw: string): Promise<URL> {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error('Webhook URL is not a valid URL'); }

  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isDevLocalhost(url))) {
    throw new Error('Webhook URL must use https');
  }
  if (isDevLocalhost(url)) return url;

  if (isIP(url.hostname)) {
    if (isPrivateIp(url.hostname)) throw new Error('Webhook URL resolves to a private address');
    return url;
  }
  const addrs = await lookup(url.hostname, { all: true });
  if (addrs.length === 0) throw new Error('Webhook URL hostname did not resolve');
  for (const a of addrs) {
    if (isPrivateIp(a.address)) throw new Error('Webhook URL resolves to a private address');
  }
  return url;
}
```

- [ ] **Step 3: Run test, commit**

Run: `pnpm test -- tests/lib/security/url-guard.test.ts` → PASS.

```bash
git add lib/security/url-guard.ts tests/lib/security
git commit -m "feat(security): SSRF guard for webhook URLs (scheme + private-range blocking)"
```

---

### Task 13: Wire the guard + timeout into the relay and the save path

**Files:**
- Modify: `app/api/chat-relay/route.ts` (`handleN8nRelay`, lines 280–342)
- Modify: `app/api/widgets/route.ts` + `app/api/widgets/[id]/route.ts` (validate webhook URL on save)
- Test: extend `tests/integration/api/` chat-relay tests

- [ ] **Step 1: Write the failing tests**

```ts
// add to the existing chat-relay integration test file
it('refuses to relay to a private-address webhook', async () => {
  const { widget } = await seedWidgetWithUser({
    config: withWebhook('https://169.254.169.254/latest/meta-data'),
  });
  const res = await postRelay({ licenseKey: widget.widgetKey, message: 'hi' });
  expect(res.status).toBe(502);
  const body = await res.json();
  expect(body.error).toMatch(/webhook/i);
});

it('times out slow webhooks at 15s', async () => {
  // mock global fetch to never resolve, assert AbortError path returns 504
});
```

- [ ] **Step 2: Implement in handleN8nRelay**

```ts
// app/api/chat-relay/route.ts — replace the fetch block in handleN8nRelay
import { assertPublicWebhookUrl } from '@/lib/security/url-guard';

const RELAY_TIMEOUT_MS = 15_000;

// inside handleN8nRelay, replacing `const response = await fetch(webhookUrl, ...)`:
let safeUrl: URL;
try {
  safeUrl = await assertPublicWebhookUrl(webhookUrl);
} catch (err) {
  console.error('[Chat Relay] Webhook URL rejected:', (err as Error).message);
  return new NextResponse(
    JSON.stringify({ error: 'Webhook URL rejected by security policy' }),
    { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

let response: Response;
try {
  response = await fetch(safeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(RELAY_TIMEOUT_MS),
  });
} catch (networkError) {
  const isTimeout = (networkError as Error).name === 'TimeoutError' || (networkError as Error).name === 'AbortError';
  console.error('[Chat Relay] N8n fetch failed:', networkError);
  return new NextResponse(
    JSON.stringify({ error: isTimeout ? 'Workflow backend timed out' : 'Failed to connect to workflow backend' }),
    { status: isTimeout ? 504 : 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}
```

Also strip relay payload echo: today `handleN8nRelay` spreads the entire client body (`...body`) into the n8n payload, letting embedders inject arbitrary top-level keys. Replace with an explicit allowlist:

```ts
const payload = {
  message: body.message,
  chatInput: body.message,
  sessionId: body.sessionId,
  widgetId: body.widgetId,
  licenseKey: body.licenseKey,
  attachments: body.attachments,
  metadata: { ...(body.metadata || {}), tier: userTier },
};
```

- [ ] **Step 3: Validate webhook on save**

In the widget POST/PATCH handlers, after schema validation, if `parsed.data.connection?.webhookUrl` is a non-empty string, `await assertPublicWebhookUrl(...)` and return 400 with the error message on failure. This catches bad URLs at config time, not first-message time.

- [ ] **Step 4: Test and commit**

Run: `pnpm test -- tests/integration` → PASS.

```bash
git add app/api lib tests
git commit -m "feat(security): SSRF guard + 15s timeout on relay; webhook validated at save time; relay payload allowlisted"
```

---

### Task 14: Fail-fast env validation + consistent route error handling

**Files:**
- Create: `instrumentation.ts` (repo root — Next.js instrumentation hook)
- Create: `lib/env.ts`
- Modify: `app/api/widgets/[id]/route.ts` (route with 100+ lines of manual NextResponse — wrap in `handleAPIError`)
- Delete: `app/api/sentry-example-api/` (example route with no error handling — dev scaffolding)
- Test: `tests/lib/env.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/env.test.ts
import { validateEnv } from '@/lib/env';

describe('validateEnv', () => {
  it('passes when required vars are set', () => {
    expect(() => validateEnv({ DATABASE_URL: 'postgres://x', JWT_SECRET: 'a'.repeat(32), NODE_ENV: 'production' } as any)).not.toThrow();
  });
  it('throws listing ALL missing vars at once', () => {
    expect(() => validateEnv({ NODE_ENV: 'production' } as any)).toThrow(/DATABASE_URL[\s\S]*JWT_SECRET|JWT_SECRET[\s\S]*DATABASE_URL/);
  });
  it('rejects short JWT_SECRET in production', () => {
    expect(() => validateEnv({ DATABASE_URL: 'postgres://x', JWT_SECRET: 'short', NODE_ENV: 'production' } as any)).toThrow(/JWT_SECRET/);
  });
  it('warns but does not throw in development', () => {
    expect(() => validateEnv({ NODE_ENV: 'development' } as any)).not.toThrow();
  });
});
```

- [ ] **Step 2: Implement**

```ts
// lib/env.ts
/** Startup environment validation. Called from instrumentation.ts at boot. */
export function validateEnv(env: NodeJS.ProcessEnv = process.env): void {
  const problems: string[] = [];
  if (!env.DATABASE_URL) problems.push('DATABASE_URL is required');
  if (!env.JWT_SECRET) problems.push('JWT_SECRET is required');
  else if (env.JWT_SECRET.length < 32) problems.push('JWT_SECRET must be at least 32 characters');
  if (env.NODE_ENV === 'production') {
    if (!env.UPSTASH_REDIS_REST_URL) console.warn('[env] UPSTASH_REDIS_REST_URL not set — rate limiting is per-instance only');
    if (problems.length) throw new Error(`Environment validation failed:\n - ${problems.join('\n - ')}`);
  } else if (problems.length) {
    console.warn(`[env] (non-production) issues:\n - ${problems.join('\n - ')}`);
  }
}
```

```ts
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./lib/env');
    validateEnv();
  }
}
```

(If `instrumentation.ts` already exists for Sentry, add the `validateEnv()` call inside the existing `register()` instead of creating a new file.)

- [ ] **Step 3: Standardize the stragglers**

In `app/api/widgets/[id]/route.ts`: wrap each handler body in `try/catch` ending with `return handleAPIError(error)` (import from `lib/utils/` — find exact path: `grep -rn "export function handleAPIError" lib/`). Keep the explicit early-return `NextResponse.json` validation responses; the wrapper only catches *unexpected* errors. Delete `app/api/sentry-example-api/` entirely.

- [ ] **Step 4: Test and commit**

Run: `pnpm test && pnpm type-check && pnpm build` (build verifies instrumentation compiles) → PASS.

```bash
git add instrumentation.ts lib/env.ts app/api tests
git commit -m "feat(ops): fail-fast env validation at boot; consistent error handling in widget routes"
```

---

### Task 15: Make billing state honest (flag off, stubs removed)

Real Stripe integration is its own project and is **explicitly out of scope** for production readiness. What's IN scope: the app must not contain code paths that pretend to bill. Production posture: tiers are admin-managed; `BILLING_ENABLED=false`.

**Files:**
- Create: `lib/feature-flags.ts` addition (file exists — `grep -n "CHATKIT_SERVER_ENABLED" lib/feature-flags.ts`)
- Modify: `app/api/account/subscription/cancel/route.ts`, `app/api/account/subscription/upgrade/route.ts`, `app/api/account/subscription/route.ts`
- Test: `tests/integration/api/subscription-disabled.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/api/subscription-disabled.test.ts
describe('subscription routes with billing disabled', () => {
  it('upgrade returns 501 with a clear message', async () => {
    const res = await POST_upgrade({ tier: 'pro' }); // existing route-invocation helper pattern
    expect(res.status).toBe(501);
    expect((await res.json()).error).toMatch(/billing is not enabled/i);
  });
  it('cancel returns 501', async () => {
    const res = await POST_cancel();
    expect(res.status).toBe(501);
  });
  it('GET subscription still reports current tier (read-only is fine)', async () => {
    const res = await GET_subscription();
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Implement**

Add to `lib/feature-flags.ts`:

```ts
/** Billing is intentionally disabled until Stripe integration ships. Tiers are admin-managed. */
export const BILLING_ENABLED = process.env.BILLING_ENABLED === 'true';
```

In `cancel/route.ts` and `upgrade/route.ts`, as the first statement of the handler:

```ts
import { BILLING_ENABLED } from '@/lib/feature-flags';

if (!BILLING_ENABLED) {
  return NextResponse.json(
    { error: 'Billing is not enabled on this deployment. Contact support to change your plan.' },
    { status: 501 }
  );
}
```

Then DELETE the commented-out Stripe placeholder blocks (the `// const stripe = new Stripe(...)` comments at cancel/route.ts lines 44–55 and equivalents) and any code that mutates `users.tier`/`subscriptionStatus` from these routes. Keep the GET route read-only as-is. Keep the Stripe columns in the schema (they cost nothing and the eventual integration needs them).

- [ ] **Step 3: Test and commit**

Run: `pnpm test -- tests/integration/api/subscription-disabled.test.ts` → PASS.

```bash
git add lib/feature-flags.ts app/api/account tests
git commit -m "feat(billing): gate subscription mutations behind BILLING_ENABLED; remove dormant Stripe stubs"
```

**Phase 3 exit criteria:** relay refuses private-IP webhooks; rate limits hold across instances when Upstash env vars are set; `pnpm build` fails fast without JWT_SECRET in production mode; no commented-out billing code remains.

---

## Phase 4 — Serving Pipeline: Static Loader + Content-Hashed Bundle + JSON Config

**Problem being fixed:** the serve route prepends per-license JavaScript to a 183KB obfuscated bundle on every request — uncacheable by CDNs, silent failures when injection breaks, instant un-canaried rollout to all customers, and obfuscation that bloats/slows for little protection.

**End state:**
- `public/widget/loader.js` — tiny (~1.5KB) stable bootstrap. Embed snippet: `<script src="https://app.example.com/widget/loader.js" data-widget-key="KEY" async></script>`
- `public/widget/v/chat-widget.<contenthash>.js` — immutable, CDN-cacheable, NOT obfuscated (minified only)
- `/api/w/[widgetKey]/config` returns `{ bundlePath, runtime }` JSON; no JS injection anywhere
- `lib/widget/inject.ts` and `lib/widget/serve.ts` deleted

### Task 16: New build script — hashed bundle + loader + manifest, no obfuscator

**Files:**
- Create: `scripts/build-widget.mjs` (replaces `scripts/build-widget-secure.mjs`)
- Create: `widget/src/loader.ts`
- Modify: `package.json` (`build:widget` points at new script)
- Delete: `scripts/build-widget-secure.mjs` (after new one works)

- [ ] **Step 1: Write the loader source**

```ts
// widget/src/loader.ts
/**
 * Embed loader — the ONLY url customers reference. Stays tiny and stable.
 * Reads data-widget-key, fetches config JSON, then injects the content-hashed
 * bundle. All failures log a console error with enough detail to debug.
 */
(() => {
  const script = document.currentScript as HTMLScriptElement | null;
  // Compat adapter (Task 9) redirects legacy embeds here with ?key=...
  const key = script?.dataset.widgetKey || new URL(script?.src || '', location.href).searchParams.get('key');
  if (!script || !key) {
    console.error('[n8n-widget] loader: missing data-widget-key attribute');
    return;
  }
  const origin = new URL(script.src).origin;
  fetch(`${origin}/api/w/${encodeURIComponent(key)}/config`, { mode: 'cors' })
    .then((res) => {
      if (!res.ok) throw new Error(`config fetch failed: HTTP ${res.status}`);
      return res.json();
    })
    .then((data: { bundlePath: string; runtime: unknown }) => {
      (window as any).ChatWidgetConfig = data.runtime;
      const bundle = document.createElement('script');
      bundle.src = origin + data.bundlePath;
      bundle.async = true;
      bundle.onerror = () => console.error('[n8n-widget] loader: bundle failed to load', bundle.src);
      document.head.appendChild(bundle);
    })
    .catch((err) => console.error('[n8n-widget] loader:', err));
})();
```

- [ ] **Step 2: Write the build script**

```js
// scripts/build-widget.mjs
/**
 * Builds: public/widget/v/chat-widget.<hash8>.js  (immutable, minified, NOT obfuscated)
 *         public/widget/loader.js                  (stable URL, short cache)
 *         public/widget/manifest.json              ({ bundlePath, builtAt })
 * Old hashed bundles are pruned (keep latest 3 for in-flight loads during deploy).
 */
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = 'public/widget';
const VERSIONED_DIR = join(OUT_DIR, 'v');
mkdirSync(VERSIONED_DIR, { recursive: true });

// 1. Main bundle → in-memory, then hash, then write
const bundleResult = await build({
  entryPoints: ['widget/src/index.ts'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2018',
  write: false,
  define: { 'process.env.NODE_ENV': '"production"' },
});
const code = bundleResult.outputFiles[0].text;
const hash = createHash('sha256').update(code).digest('hex').slice(0, 8);
const bundleName = `chat-widget.${hash}.js`;
writeFileSync(join(VERSIONED_DIR, bundleName), code);

// 2. Loader → stable path
await build({
  entryPoints: ['widget/src/loader.ts'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2018',
  outfile: join(OUT_DIR, 'loader.js'),
});

// 3. Manifest
writeFileSync(
  join(OUT_DIR, 'manifest.json'),
  JSON.stringify({ bundlePath: `/widget/v/${bundleName}`, builtAt: new Date().toISOString() }, null, 2)
);

// 4. Prune old hashed bundles (keep newest 3 by mtime)
const bundles = readdirSync(VERSIONED_DIR)
  .filter((f) => /^chat-widget\.[0-9a-f]{8}\.js$/.test(f))
  .map((f) => ({ f, mtime: statSync(join(VERSIONED_DIR, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime);
for (const { f } of bundles.slice(3)) unlinkSync(join(VERSIONED_DIR, f));

console.log(`Built ${bundleName} (${(code.length / 1024).toFixed(1)} KB) + loader.js`);
```

Update `package.json`: `"build:widget": "node scripts/build-widget.mjs"`. Delete `scripts/build-widget-secure.mjs` and remove `javascript-obfuscator` from devDependencies (`pnpm remove javascript-obfuscator`). Delete the old committed `public/widget/chat-widget.iife.js` once nothing references it (Step 4 of Task 18 confirms).

Decision recorded: dropping obfuscation is intentional — client-delivered JS is not protectable, the obfuscator adds weight/CPU and breaks debuggability. Legal-notice banner can be re-added as a plain esbuild `banner` option if desired.

- [ ] **Step 3: Run the build**

Run: `pnpm build:widget && ls public/widget public/widget/v && cat public/widget/manifest.json`
Expected: `loader.js`, `manifest.json`, `v/chat-widget.<hash>.js`; bundle noticeably smaller than the old 183KB obfuscated one.

- [ ] **Step 4: Commit**

```bash
git add scripts widget/src/loader.ts package.json pnpm-lock.yaml public/widget
git commit -m "feat(build): content-hashed widget bundle + stable loader; obfuscator removed"
```

---

### Task 17: Cache headers + config endpoint returns bundlePath

**Files:**
- Modify: `next.config.ts` (headers for `/widget/v/*` and `/widget/loader.js`)
- Create: `lib/widget/manifest.ts`
- Modify: `app/api/w/[widgetKey]/config/route.ts` (response shape: `{ bundlePath, runtime }`)
- Test: `tests/lib/widget/manifest.test.ts`

- [ ] **Step 1: Cache headers in next.config.ts**

Add to the exported config (merge with any existing `headers()`):

```ts
async headers() {
  return [
    {
      source: '/widget/v/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      source: '/widget/loader.js',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=300, stale-while-revalidate=3600' },
        { key: 'Access-Control-Allow-Origin', value: '*' },
      ],
    },
  ];
},
```

- [ ] **Step 2: Manifest reader with failing test first**

```ts
// tests/lib/widget/manifest.test.ts
import { getBundlePath } from '@/lib/widget/manifest';

it('returns the bundlePath from the build manifest', () => {
  const p = getBundlePath();
  expect(p).toMatch(/^\/widget\/v\/chat-widget\.[0-9a-f]{8}\.js$/);
});
```

```ts
// lib/widget/manifest.ts
/** Reads the widget build manifest once per process (bundle changes only on deploy). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let cached: { bundlePath: string } | null = null;

export function getBundlePath(): string {
  if (!cached) {
    cached = JSON.parse(readFileSync(join(process.cwd(), 'public/widget/manifest.json'), 'utf-8'));
  }
  return cached!.bundlePath;
}
```

- [ ] **Step 3: Config endpoint response shape**

In `app/api/w/[widgetKey]/config/route.ts`, the (already `resolveAuthorizedWidget`-guarded, migrate-on-read) handler now returns:

```ts
import { getBundlePath } from '@/lib/widget/manifest';

const config = migrateConfig(widget.config); // chat kind; display passes through
return NextResponse.json(
  {
    bundlePath: getBundlePath(),
    runtime: {
      uiConfig: translateToRuntime(config, widget.kind),  // the existing 70-field translation, now reading canonical paths only
      relay: {
        relayUrl: `${baseUrl}/api/chat-relay`,
        widgetId: widget.id,
        licenseKey: widget.widgetKey, // runtime still calls this field licenseKey; it carries the widgetKey
      },
      flags: {
        tier: user.tier,
        brandingEnabled: !TIER_LIMITS[normalizeUserTier(user.tier)].brandingRemovable
          || config.branding?.brandingEnabled !== false,
      },
    },
  },
  { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60' } }
);
```

In `widget/src/index.ts`, delete the `window.N8N_LICENSE_FLAGS` read path and read `window.ChatWidgetConfig.flags` instead (one place: `widget/src/core/config.ts` reads `N8N_LICENSE_FLAGS` — switch it to `ChatWidgetConfig.flags` with the same shape).

- [ ] **Step 4: Test and commit**

Run: `pnpm test -- tests/lib/widget && pnpm build:widget && pnpm test -- tests/widget` → PASS.

```bash
git add next.config.ts lib/widget app/api widget/src tests
git commit -m "feat(serve): config endpoint returns bundlePath + runtime JSON; immutable cache for hashed bundles"
```

---

### Task 18: Update embed snippet generation + delete the injection pipeline

**Files:**
- Modify: `components/configurator/code-modal.tsx` (the embed-code generator — verify filename with `grep -rln "chat-widget.js\|embed" components/configurator/`)
- Modify: dashboard embed-code surfaces (`grep -rln "api/widget/" components/ app/dashboard/`)
- Delete: `lib/widget/inject.ts`, `lib/widget/serve.ts`
- Test: existing code-modal/embed tests

- [ ] **Step 1: New snippet**

Wherever embed code is generated, the snippet becomes:

```ts
const embedSnippet = `<script src="${baseUrl}/widget/loader.js" data-widget-key="${widget.widgetKey}" async></script>`;
```

Update every variant (popup/inline/fullpage if the generator branches on `embedType` — inline/fullpage variants keep their container `<div>` instructions, only the script tag changes).

- [ ] **Step 2: Delete the injection pipeline**

Run: `grep -rln "injectLicenseFlags\|serveWidgetBundle" app/ lib/ tests/`
Delete `lib/widget/inject.ts` and `lib/widget/serve.ts`, their tests, and fix the remaining references (should be none after Task 9's adapter rewrite — the adapter redirects, it doesn't serve). Delete `app/api/embed/bundle.js/route.ts` as well (raw-bundle escape hatch superseded by `/widget/v/...` static serving) unless `grep -rn "embed/bundle" app components` shows a live consumer (the portal page used a Script tag — repoint it at `getBundlePath()`).

- [ ] **Step 3: Update the portal**

`app/chat/portal/[widgetId]/portal-widget.tsx` loads the bundle via `<Script src="/widget/chat-widget.iife.js">` or similar — change the server component (`page.tsx`) to read `getBundlePath()` and pass it down as a prop. Also fix the known re-init leak: the `useEffect` at line ~67 must dispose the prior widget instance in its cleanup function:

```ts
useEffect(() => {
  let widgetInstance: { destroy?: () => void } | null = null;
  // ... existing init code assigns widgetInstance = new Widget(config) ...
  return () => { widgetInstance?.destroy?.(); };
}, [widgetId]); // config/license removed from deps — portal config is fixed per page load
```

(If the `Widget` class has no `destroy()`, add one in `widget/src/widget.ts` that unsubscribes its StateManager listener and removes its root DOM node — the subscribe call site is in the constructor; store the unsubscribe function it returns.)

- [ ] **Step 4: Full verification**

Run: `pnpm test && pnpm type-check && pnpm build`
Manual smoke (use the verify/run flow): `pnpm dev`, create a widget, copy embed snippet into a local `test-embed.html`-style scratch file OUTSIDE the repo, open it, confirm the widget loads via loader.js → config JSON → hashed bundle (check Network tab order), send a message end-to-end against a test n8n webhook.

- [ ] **Step 5: Commit**

```bash
git add -A components app lib widget tests
git commit -m "feat(embed): loader-based embed snippet; injection pipeline deleted; portal uses hashed bundle"
```

**Phase 4 exit criteria:** `curl -I localhost:3000/widget/v/<hash>.js` shows `immutable`; no request anywhere concatenates JS; embed works end-to-end via the three-step loader flow.

---

## Phase 5 — Preview IS the Widget (iframe + postMessage)

**Problem being fixed:** `components/configurator/chat-preview.tsx` (973 lines) re-implements widget rendering in React; it drifts from the real widget and every visual feature is built twice.

**End state:** the configurator preview mounts the REAL compiled bundle in a sandboxed iframe at `/preview/widget`, pushed live config via `postMessage`. `chat-preview.tsx` is deleted.

### Task 19: Preview bridge inside the widget bundle

**Files:**
- Create: `widget/src/preview/preview-bridge.ts`
- Create: `widget/src/preview/mock-fetcher.ts`
- Modify: `widget/src/index.ts` (bootstrap checks for preview mode first)
- Test: `tests/widget/preview-bridge.test.ts`

First, read `widget/src/core/renderer.ts` and `widget/src/index.ts` to get the exact renderer construction call the bootstrap uses (the explorer mapped it as: dispatch on `config.kind` to ChatRenderer or DisplayRenderer, each with `mount(runtimeConfig, container, options?: { fetcher? })`). Mirror that call here exactly.

- [ ] **Step 1: Write the failing test**

```ts
// tests/widget/preview-bridge.test.ts  (jsdom)
import { initPreviewBridge } from '@/widget/src/preview/preview-bridge';

describe('preview bridge', () => {
  it('is inert without ?preview=1', () => {
    // jsdom default URL has no preview param
    expect(initPreviewBridge()).toBe(false);
  });

  it('announces readiness and remounts on widget:config messages', async () => {
    window.history.replaceState({}, '', '/?preview=1');
    const posted: any[] = [];
    jest.spyOn(window.parent, 'postMessage').mockImplementation((msg) => posted.push(msg));
    expect(initPreviewBridge()).toBe(true);
    expect(posted).toContainEqual(expect.objectContaining({ type: 'widget:ready' }));

    window.dispatchEvent(new MessageEvent('message', {
      data: { type: 'widget:config', kind: 'chat', config: {} },
    }));
    await new Promise((r) => setTimeout(r, 50));
    expect(document.querySelector('[data-n8n-widget-root]')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Implement bridge + mock fetcher**

```ts
// widget/src/preview/mock-fetcher.ts
/**
 * Preview-mode fetcher: never hits the network. Echoes canned bot responses so
 * the configurator preview can demonstrate message styling, markdown, and
 * streaming without a webhook.
 */
export const CANNED_RESPONSE = [
  'Thanks for your message! Here is **markdown**, `inline code`, and a list:',
  '- Point one',
  '- Point two',
  '',
  '```ts',
  'const greeting = "hello from the preview";',
  '```',
].join('\n');

export async function mockFetcher(_url: string, _init?: RequestInit): Promise<Response> {
  await new Promise((r) => setTimeout(r, 400)); // visible "thinking" delay
  return new Response(JSON.stringify({ message: CANNED_RESPONSE }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

```ts
// widget/src/preview/preview-bridge.ts
/**
 * Configurator preview bridge. Active ONLY when the page URL has ?preview=1
 * (the /preview/widget host page). Listens for config messages from the parent
 * frame and (re)mounts the real renderer with a mock fetcher.
 * Protocol: parent → { type: 'widget:config', kind, config }
 *           child  → { type: 'widget:ready' }, { type: 'widget:mounted' }, { type: 'widget:error', message }
 */
import { mockFetcher } from './mock-fetcher';
// Import the SAME renderer factory the production bootstrap in index.ts uses:
import { createRenderer } from '../core/renderer'; // adjust to the actual export read in the pre-step

export function initPreviewBridge(): boolean {
  if (!new URLSearchParams(window.location.search).has('preview')) return false;

  let container: HTMLElement | null = null;
  let disposeCurrent: (() => void) | null = null;

  window.addEventListener('message', async (event: MessageEvent) => {
    const msg = event.data;
    if (!msg || msg.type !== 'widget:config') return;
    try {
      disposeCurrent?.();
      container?.remove();
      container = document.createElement('div');
      container.setAttribute('data-n8n-widget-root', '');
      document.body.appendChild(container);

      const renderer = createRenderer(msg.kind ?? 'chat');
      // Build the runtime config the same way index.ts does for production,
      // substituting a fake relay (mockFetcher intercepts all sends anyway).
      const runtimeConfig = {
        uiConfig: msg.config,
        relay: { relayUrl: 'preview://relay', widgetId: 'preview', licenseKey: 'preview' },
        flags: { tier: msg.tier ?? 'agency', brandingEnabled: msg.config?.branding?.brandingEnabled !== false },
      };
      await renderer.mount(runtimeConfig, container, { fetcher: mockFetcher });
      disposeCurrent = () => renderer.unmount?.();
      window.parent.postMessage({ type: 'widget:mounted' }, '*');
    } catch (err) {
      window.parent.postMessage({ type: 'widget:error', message: (err as Error).message }, '*');
    }
  });

  window.parent.postMessage({ type: 'widget:ready' }, '*');
  return true;
}
```

In `widget/src/index.ts`, FIRST thing in the bootstrap IIFE:

```ts
import { initPreviewBridge } from './preview/preview-bridge';
if (initPreviewBridge()) {
  // Preview mode: parent frame drives mounting; skip normal bootstrap entirely.
} else {
  // ...existing bootstrap...
}
```

If `createRenderer(kind)` doesn't exist as a named factory, extract it: `widget/src/index.ts` already contains the `kind → ChatRenderer | DisplayRenderer` dispatch inline — move that dispatch into `core/renderer.ts` as `export function createRenderer(kind)` and have BOTH the production bootstrap and the bridge call it (this guarantees preview and production share one code path). Same for `renderer.unmount` — if renderers lack it, add `unmount()` to the `Renderer` interface, implemented as: remove mounted DOM root, dispose SSE client, unsubscribe state listeners.

- [ ] **Step 3: Build + test**

Run: `pnpm build:widget && pnpm test -- tests/widget/preview-bridge.test.ts`
Expected: PASS. Check bundle size delta — the bridge + mock fetcher should add < 3KB minified.

- [ ] **Step 4: Commit**

```bash
git add widget/src tests
git commit -m "feat(widget): preview bridge — real bundle mountable via postMessage with mock fetcher"
```

---

### Task 20: Preview host page + iframe component; delete chat-preview.tsx

**Files:**
- Create: `app/preview/widget/page.tsx`
- Create: `components/configurator/widget-preview-frame.tsx`
- Modify: `components/configurator/preview-canvas.tsx` (swap `<ChatPreview>` for `<WidgetPreviewFrame>`)
- Delete: `components/configurator/chat-preview.tsx` (973 lines) and its tests
- Test: `tests/unit/components/widget-preview-frame.test.tsx`

- [ ] **Step 1: Host page**

```tsx
// app/preview/widget/page.tsx
/**
 * Preview host. Loaded ONLY inside the configurator's sandboxed iframe.
 * Loads the real hashed widget bundle; the bundle's preview bridge takes over.
 */
import Script from 'next/script';
import { getBundlePath } from '@/lib/widget/manifest';

export const dynamic = 'force-dynamic'; // always read the current manifest

export default function WidgetPreviewPage() {
  return (
    <html>
      <body style={{ margin: 0, background: 'transparent' }}>
        <Script src={`${getBundlePath()}?preview=1`} strategy="afterInteractive" />
      </body>
    </html>
  );
}
```

Note: the bridge checks the PAGE url for `?preview=1`, not the script url — so the iframe src must be `/preview/widget?preview=1`. (The `?preview=1` on the Script src above is harmless cache-busting; the authoritative flag is on the page URL set by the frame component below.)

- [ ] **Step 2: Write the failing component test**

```tsx
// tests/unit/components/widget-preview-frame.test.tsx
import { render, screen } from '@testing-library/react';
import { WidgetPreviewFrame } from '@/components/configurator/widget-preview-frame';

describe('WidgetPreviewFrame', () => {
  it('renders a sandboxed iframe pointing at the preview host', () => {
    render(<WidgetPreviewFrame kind="chat" config={{} as any} tier="pro" />);
    const iframe = screen.getByTitle('Widget preview') as HTMLIFrameElement;
    expect(iframe.src).toContain('/preview/widget?preview=1');
    expect(iframe.sandbox.toString()).toContain('allow-scripts');
    expect(iframe.sandbox.toString()).not.toContain('allow-same-origin');
  });
});
```

Sandbox note: `allow-scripts` without `allow-same-origin` is sufficient — the bridge needs no network or storage (config arrives via postMessage; the mock fetcher never fetches), and `<script src>` loading is not restricted by the same-origin sandbox flag. If Prism's lazy loading fails under sandbox during manual testing, relax to `sandbox="allow-scripts allow-same-origin"` — acceptable since the frame content is first-party code.

- [ ] **Step 3: Implement the frame**

```tsx
// components/configurator/widget-preview-frame.tsx
'use client';
/**
 * Renders the REAL widget bundle in a sandboxed iframe and streams config
 * updates to it via postMessage. Replaces the 973-line React re-implementation.
 */
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import type { ChatWidgetConfig } from '@/lib/widget-config/schema';

interface Props {
  kind: 'chat' | 'display';
  config: ChatWidgetConfig | Record<string, unknown>;
  tier: string;
  className?: string;
}

export function WidgetPreviewFrame({ kind, config, tier, className }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [bridgeReady, setBridgeReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedConfig] = useDebounce(config, 150);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === 'widget:ready') setBridgeReady(true);
      if (event.data?.type === 'widget:error') setError(event.data.message);
      if (event.data?.type === 'widget:mounted') setError(null);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (!bridgeReady) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'widget:config', kind, config: debouncedConfig, tier },
      window.location.origin
    );
  }, [bridgeReady, debouncedConfig, kind, tier]);

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <iframe
        ref={iframeRef}
        title="Widget preview"
        src="/preview/widget?preview=1"
        sandbox="allow-scripts"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
      {error && (
        <div role="alert" style={{ position: 'absolute', bottom: 8, left: 8, right: 8, padding: 8, background: '#FEE2E2', color: '#991B1B', borderRadius: 6, fontSize: 12 }}>
          Preview error: {error}
        </div>
      )}
    </div>
  );
}
```

(One bridge-side adjustment this requires: in `preview-bridge.ts`, post `widget:ready` repeatedly until the first config arrives — `setInterval` 250ms, cleared on first `widget:config` — because the parent may attach its message listener after the iframe boots. Add that to the bridge now.)

- [ ] **Step 4: Swap into preview-canvas and delete the old preview**

In `components/configurator/preview-canvas.tsx`: replace the `<ChatPreview ...>` render with `<WidgetPreviewFrame kind={kind} config={config} tier={tier} />`, sourcing `config` from `useWidgetStore` exactly as before. Keep preview-canvas's device-frame/embed-mode chrome — only the inner renderer changes. Then:

```bash
git rm components/configurator/chat-preview.tsx
```

and remove its test files (`grep -rln "chat-preview" tests/`). Fix any other importers (`grep -rln "chat-preview" app/ components/`) — the demo page may import it; point demo at `WidgetPreviewFrame` too.

- [ ] **Step 5: Verify visually, test, commit**

Run: `pnpm test && pnpm type-check && pnpm build:widget && pnpm dev`
Manual: open the configurator, confirm (1) preview renders the real widget, (2) color/text changes appear within ~200ms, (3) sending a message in preview shows the canned markdown response, (4) no network calls to `/api/chat-relay` from the preview iframe (Network tab).

```bash
git add -A components app tests
git commit -m "feat(preview): configurator preview renders the real widget bundle in a sandboxed iframe; delete 973-line React re-implementation"
```

**Phase 5 exit criteria:** `chat-preview.tsx` is gone; preview is pixel-identical to production by construction; changing any config field updates the live preview.

---

## Phase 6 — Schema-Driven Configurator

**Problem being fixed:** `config-sidebar.tsx` is 1,550 lines of hand-written JSX (one block per option); three near-identical ~330-line configurator pages; tier gating enforced only at the API.

**End state:** sidebar fields are declared as data in a field registry keyed to canonical config paths; one generic renderer; tier gating declarative and enforced in the UI; one configurator page parameterized by widget kind.

### Task 21: Field registry + path helpers

**Files:**
- Create: `lib/widget-config/field-registry.ts`
- Create: `lib/widget-config/path.ts` (typed get/set by dot-path)
- Test: `tests/lib/widget-config/field-registry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/widget-config/field-registry.test.ts
import { CHAT_FIELD_REGISTRY, SECTIONS } from '@/lib/widget-config/field-registry';
import { getAtPath, setAtPath } from '@/lib/widget-config/path';
import { chatWidgetConfigSchema } from '@/lib/widget-config/schema';

describe('field registry', () => {
  const defaults = chatWidgetConfigSchema.parse({});

  it('every registry path exists in the canonical config', () => {
    for (const field of CHAT_FIELD_REGISTRY) {
      expect(getAtPath(defaults, field.path)).not.toBeUndefined();
    }
  });

  it('every registry section is a declared section', () => {
    const ids = SECTIONS.map((s) => s.id);
    for (const field of CHAT_FIELD_REGISTRY) {
      expect(ids).toContain(field.section);
    }
  });

  it('setAtPath produces a new object without mutating the original', () => {
    const next = setAtPath(defaults, 'theme.colors.primary', '#123456');
    expect(getAtPath(next, 'theme.colors.primary')).toBe('#123456');
    expect(getAtPath(defaults, 'theme.colors.primary')).toBe('#4F46E5');
  });
});
```

- [ ] **Step 2: Run test to verify it fails, then implement path helpers**

```ts
// lib/widget-config/path.ts
/** Immutable get/set by dot-path. Paths are validated against the schema by the registry test. */
export function getAtPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function setAtPath<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const clone: any = structuredClone(obj);
  let cursor = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cursor[keys[i]] == null || typeof cursor[keys[i]] !== 'object') cursor[keys[i]] = {};
    cursor = cursor[keys[i]];
  }
  cursor[keys[keys.length - 1]] = value;
  return clone;
}
```

- [ ] **Step 3: Implement the registry**

```ts
// lib/widget-config/field-registry.ts
/**
 * Declarative field registry for the configurator sidebar.
 * Each entry binds a canonical config path to a UI control. The sidebar is
 * GENERATED from this list — to add a config option: add it to schema.ts,
 * then add one line here. The registry test guarantees paths stay valid.
 */
import type { ChatWidgetConfig } from './schema';

export type SectionId = 'branding' | 'theme' | 'layout' | 'typography' | 'startScreen' | 'composer' | 'behavior' | 'advancedStyling' | 'features' | 'connection';

export const SECTIONS: { id: SectionId; title: string; tierGate?: 'pro' }[] = [
  { id: 'branding', title: 'Branding' },
  { id: 'theme', title: 'Colors & Theme' },
  { id: 'layout', title: 'Position & Size' },
  { id: 'typography', title: 'Typography' },
  { id: 'startScreen', title: 'Start Screen' },
  { id: 'composer', title: 'Composer' },
  { id: 'behavior', title: 'Behavior' },
  { id: 'advancedStyling', title: 'Advanced Styling', tierGate: 'pro' },
  { id: 'features', title: 'Features' },
  { id: 'connection', title: 'Connection' },
];

export interface FieldDef {
  path: string;            // dot-path into ChatWidgetConfig
  label: string;
  section: SectionId;
  control: 'text' | 'textarea' | 'color' | 'toggle' | 'slider' | 'select' | 'url' | 'icon-picker' | 'prompt-list';
  tierGate?: 'pro';        // hidden + locked below this tier
  min?: number; max?: number; step?: number;
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
  showIf?: (cfg: ChatWidgetConfig) => boolean;
}

export const CHAT_FIELD_REGISTRY: FieldDef[] = [
  // Branding
  { path: 'branding.companyName', label: 'Company name', section: 'branding', control: 'text' },
  { path: 'branding.welcomeText', label: 'Welcome text', section: 'branding', control: 'textarea' },
  { path: 'branding.logoUrl', label: 'Logo URL', section: 'branding', control: 'url' },
  { path: 'branding.responseTimeText', label: 'Response time text', section: 'branding', control: 'text' },
  { path: 'branding.firstMessage', label: 'First message', section: 'branding', control: 'textarea' },
  { path: 'branding.launcherIcon', label: 'Launcher icon', section: 'branding', control: 'select', options: [
    { value: 'chat', label: 'Chat bubble' }, { value: 'support', label: 'Support' }, { value: 'bot', label: 'Bot' }, { value: 'custom', label: 'Custom…' } ] },
  { path: 'branding.customLauncherIconUrl', label: 'Custom icon URL', section: 'branding', control: 'url',
    showIf: (c) => c.branding.launcherIcon === 'custom' },
  { path: 'branding.brandingEnabled', label: 'Show "Powered by" branding', section: 'branding', control: 'toggle', tierGate: 'pro', help: 'Pro and Agency plans can disable branding.' },

  // Theme
  { path: 'theme.mode', label: 'Theme mode', section: 'theme', control: 'select', options: [
    { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'auto', label: 'Auto' } ] },
  { path: 'theme.colors.primary', label: 'Primary color', section: 'theme', control: 'color' },
  { path: 'theme.colors.secondary', label: 'Secondary color', section: 'theme', control: 'color' },
  { path: 'theme.colors.background', label: 'Background', section: 'theme', control: 'color' },
  { path: 'theme.colors.userMessage', label: 'User message bubble', section: 'theme', control: 'color' },
  { path: 'theme.colors.botMessage', label: 'Bot message bubble', section: 'theme', control: 'color' },
  { path: 'theme.colors.text', label: 'Text color', section: 'theme', control: 'color' },
  { path: 'theme.colors.textSecondary', label: 'Secondary text', section: 'theme', control: 'color' },
  { path: 'theme.colors.border', label: 'Border color', section: 'theme', control: 'color' },
  { path: 'theme.colors.inputBackground', label: 'Input background', section: 'theme', control: 'color' },
  { path: 'theme.colors.inputText', label: 'Input text', section: 'theme', control: 'color' },
  { path: 'theme.cornerRadius', label: 'Corner radius', section: 'theme', control: 'slider', min: 0, max: 20, step: 1 },

  // Layout
  { path: 'theme.position.position', label: 'Position', section: 'layout', control: 'select', options: [
    { value: 'bottom-right', label: 'Bottom right' }, { value: 'bottom-left', label: 'Bottom left' },
    { value: 'top-right', label: 'Top right' }, { value: 'top-left', label: 'Top left' } ] },
  { path: 'theme.position.offsetX', label: 'Horizontal offset', section: 'layout', control: 'slider', min: 0, max: 500, step: 4 },
  { path: 'theme.position.offsetY', label: 'Vertical offset', section: 'layout', control: 'slider', min: 0, max: 500, step: 4 },
  { path: 'theme.size.mode', label: 'Size', section: 'layout', control: 'select', options: [
    { value: 'compact', label: 'Compact' }, { value: 'standard', label: 'Standard' }, { value: 'expanded', label: 'Expanded' } ] },
  { path: 'theme.size.fullscreenOnMobile', label: 'Fullscreen on mobile', section: 'layout', control: 'toggle' },

  // Typography
  { path: 'theme.typography.fontFamily', label: 'Font family', section: 'typography', control: 'text', placeholder: 'system-ui' },
  { path: 'theme.typography.fontSize', label: 'Font size', section: 'typography', control: 'slider', min: 12, max: 20, step: 1 },
  { path: 'theme.typography.fontUrl', label: 'Custom font URL', section: 'typography', control: 'url' },

  // Start screen
  { path: 'startScreen.greeting', label: 'Greeting', section: 'startScreen', control: 'textarea' },
  { path: 'startScreen.starterPrompts', label: 'Starter prompts', section: 'startScreen', control: 'prompt-list' },

  // Composer
  { path: 'composer.placeholder', label: 'Input placeholder', section: 'composer', control: 'text' },
  { path: 'composer.disclaimer', label: 'Disclaimer text', section: 'composer', control: 'textarea' },

  // Behavior
  { path: 'behavior.autoOpen', label: 'Auto-open', section: 'behavior', control: 'toggle' },
  { path: 'behavior.autoOpenDelay', label: 'Auto-open delay (s)', section: 'behavior', control: 'slider', min: 0, max: 60, step: 1,
    showIf: (c) => c.behavior.autoOpen },
  { path: 'behavior.showCloseButton', label: 'Show close button', section: 'behavior', control: 'toggle' },
  { path: 'behavior.persistMessages', label: 'Persist messages', section: 'behavior', control: 'toggle' },
  { path: 'behavior.enableSoundNotifications', label: 'Sound notifications', section: 'behavior', control: 'toggle' },
  { path: 'behavior.enableTypingIndicator', label: 'Typing indicator', section: 'behavior', control: 'toggle' },

  // Advanced styling (Pro+)
  { path: 'advancedStyling.enabled', label: 'Enable advanced styling', section: 'advancedStyling', control: 'toggle', tierGate: 'pro' },
  { path: 'advancedStyling.messages.userMessageBackground', label: 'User bubble background', section: 'advancedStyling', control: 'color', tierGate: 'pro', showIf: (c) => c.advancedStyling.enabled },
  { path: 'advancedStyling.messages.userMessageText', label: 'User bubble text', section: 'advancedStyling', control: 'color', tierGate: 'pro', showIf: (c) => c.advancedStyling.enabled },
  { path: 'advancedStyling.messages.botMessageBackground', label: 'Bot bubble background', section: 'advancedStyling', control: 'color', tierGate: 'pro', showIf: (c) => c.advancedStyling.enabled },
  { path: 'advancedStyling.messages.botMessageText', label: 'Bot bubble text', section: 'advancedStyling', control: 'color', tierGate: 'pro', showIf: (c) => c.advancedStyling.enabled },
  { path: 'advancedStyling.messages.messageSpacing', label: 'Message spacing', section: 'advancedStyling', control: 'slider', min: 0, max: 50, step: 1, tierGate: 'pro', showIf: (c) => c.advancedStyling.enabled },
  { path: 'advancedStyling.messages.bubblePadding', label: 'Bubble padding', section: 'advancedStyling', control: 'slider', min: 5, max: 30, step: 1, tierGate: 'pro', showIf: (c) => c.advancedStyling.enabled },
  { path: 'advancedStyling.messages.showAvatar', label: 'Show avatar', section: 'advancedStyling', control: 'toggle', tierGate: 'pro', showIf: (c) => c.advancedStyling.enabled },
  { path: 'advancedStyling.messages.avatarUrl', label: 'Avatar URL', section: 'advancedStyling', control: 'url', tierGate: 'pro', showIf: (c) => c.advancedStyling.enabled && c.advancedStyling.messages.showAvatar },
  { path: 'advancedStyling.markdown.codeBlockBackground', label: 'Code block background', section: 'advancedStyling', control: 'color', tierGate: 'pro', showIf: (c) => c.advancedStyling.enabled },
  { path: 'advancedStyling.markdown.codeBlockText', label: 'Code block text', section: 'advancedStyling', control: 'color', tierGate: 'pro', showIf: (c) => c.advancedStyling.enabled },
  { path: 'advancedStyling.markdown.inlineCodeBackground', label: 'Inline code background', section: 'advancedStyling', control: 'color', tierGate: 'pro', showIf: (c) => c.advancedStyling.enabled },
  { path: 'advancedStyling.markdown.inlineCodeText', label: 'Inline code text', section: 'advancedStyling', control: 'color', tierGate: 'pro', showIf: (c) => c.advancedStyling.enabled },
  { path: 'advancedStyling.markdown.linkColor', label: 'Link color', section: 'advancedStyling', control: 'color', tierGate: 'pro', showIf: (c) => c.advancedStyling.enabled },
  { path: 'advancedStyling.markdown.tableBorderColor', label: 'Table border', section: 'advancedStyling', control: 'color', tierGate: 'pro', showIf: (c) => c.advancedStyling.enabled },

  // Features
  { path: 'features.attachments.enabled', label: 'File attachments', section: 'features', control: 'toggle' },
  { path: 'features.attachments.maxFileSizeMB', label: 'Max file size (MB)', section: 'features', control: 'slider', min: 1, max: 50, step: 1,
    showIf: (c) => c.features.attachments.enabled },
  { path: 'features.emailTranscript', label: 'Email transcript', section: 'features', control: 'toggle', tierGate: 'pro' },
  { path: 'features.printTranscript', label: 'Print transcript', section: 'features', control: 'toggle' },
  { path: 'features.ratingPrompt', label: 'Rating prompt', section: 'features', control: 'toggle', tierGate: 'pro' },

  // Connection
  { path: 'connection.webhookUrl', label: 'N8n webhook URL', section: 'connection', control: 'url', placeholder: 'https://your-n8n.example.com/webhook/…' },
  { path: 'connection.route', label: 'Route parameter', section: 'connection', control: 'text' },
  { path: 'connection.timeoutSeconds', label: 'Timeout (s)', section: 'connection', control: 'slider', min: 10, max: 60, step: 5 },
  { path: 'connection.captureContext', label: 'Capture page context', section: 'connection', control: 'toggle' },
];
```

(This intentionally does not include every leaf of `advancedStyling.markdown` and `theme.darkOverride` — fields not in the registry simply don't appear in the UI yet; the schema still validates them. Add registry lines as product needs them. The registry test only checks registry→schema direction, so schema fields without registry entries are fine.)

- [ ] **Step 4: Run tests, commit**

Run: `pnpm test -- tests/lib/widget-config/field-registry.test.ts` → PASS.

```bash
git add lib/widget-config tests
git commit -m "feat(configurator): declarative field registry bound to canonical config paths"
```

---

### Task 22: Generic field/section renderers + rebuilt sidebar

**Files:**
- Create: `components/configurator/config-form/field-control.tsx`
- Create: `components/configurator/config-form/section.tsx`
- Rewrite: `components/configurator/config-sidebar.tsx` (1,550 → ~120 lines)
- Test: `tests/unit/components/config-form.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/components/config-form.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigSection } from '@/components/configurator/config-form/section';
import { CHAT_FIELD_REGISTRY } from '@/lib/widget-config/field-registry';
import { chatWidgetConfigSchema } from '@/lib/widget-config/schema';

describe('schema-driven config form', () => {
  const config = chatWidgetConfigSchema.parse({});

  it('renders all visible branding fields for pro tier', () => {
    render(<ConfigSection sectionId="branding" config={config} tier="pro" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Company name')).toBeInTheDocument();
    expect(screen.getByLabelText('Show "Powered by" branding')).toBeInTheDocument();
    // showIf: custom icon URL hidden while launcherIcon !== 'custom'
    expect(screen.queryByLabelText('Custom icon URL')).not.toBeInTheDocument();
  });

  it('locks tier-gated fields for basic tier instead of rendering them editable', () => {
    render(<ConfigSection sectionId="branding" config={config} tier="basic" onChange={jest.fn()} />);
    const toggle = screen.getByLabelText('Show "Powered by" branding');
    expect(toggle).toBeDisabled();
  });

  it('emits path-addressed changes', () => {
    const onChange = jest.fn();
    render(<ConfigSection sectionId="branding" config={config} tier="pro" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Company name'), { target: { value: 'Acme' } });
    expect(onChange).toHaveBeenCalledWith('branding.companyName', 'Acme');
  });
});
```

- [ ] **Step 2: Implement field-control**

```tsx
// components/configurator/config-form/field-control.tsx
'use client';
import type { FieldDef } from '@/lib/widget-config/field-registry';
import type { ChatWidgetConfig } from '@/lib/widget-config/schema';
import { getAtPath } from '@/lib/widget-config/path';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Reuse the existing pickers (verify exact paths/exports before importing):
import { IconPicker } from '@/components/configurator/icon-picker';
import { StarterPromptListEditor } from '@/components/configurator/ui/starter-prompt-list'; // extract from old sidebar if not standalone

interface Props {
  field: FieldDef;
  config: ChatWidgetConfig;
  disabled: boolean;
  onChange: (path: string, value: unknown) => void;
}

export function FieldControl({ field, config, disabled, onChange }: Props) {
  const value = getAtPath(config, field.path);
  const id = `cfg-${field.path.replace(/\./g, '-')}`;
  const set = (v: unknown) => onChange(field.path, v);

  const control = (() => {
    switch (field.control) {
      case 'text':
      case 'url':
        return <Input id={id} type={field.control === 'url' ? 'url' : 'text'} value={value ?? ''} placeholder={field.placeholder} disabled={disabled} onChange={(e) => set(e.target.value === '' && field.control === 'url' ? null : e.target.value)} />;
      case 'textarea':
        return <Textarea id={id} value={value ?? ''} placeholder={field.placeholder} disabled={disabled} onChange={(e) => set(e.target.value)} />;
      case 'toggle':
        return <Switch id={id} checked={Boolean(value)} disabled={disabled} onCheckedChange={set} />;
      case 'slider':
        return (
          <div className="flex items-center gap-3">
            <Slider id={id} value={[Number(value ?? field.min ?? 0)]} min={field.min} max={field.max} step={field.step} disabled={disabled} onValueChange={([v]) => set(v)} />
            <span className="w-10 text-right text-xs tabular-nums">{String(value)}</span>
          </div>
        );
      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input id={id} type="color" value={String(value ?? '#000000')} disabled={disabled} onChange={(e) => set(e.target.value.toUpperCase())} className="h-8 w-8 cursor-pointer rounded border" />
            <Input value={String(value ?? '')} disabled={disabled} onChange={(e) => /^#[0-9A-Fa-f]{6}$/.test(e.target.value) && set(e.target.value.toUpperCase())} className="w-24 font-mono text-xs" />
          </div>
        );
      case 'select':
        return (
          <Select value={String(value)} disabled={disabled} onValueChange={set}>
            <SelectTrigger id={id}><SelectValue /></SelectTrigger>
            <SelectContent>
              {field.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      case 'icon-picker':
        return <IconPicker value={String(value ?? '')} disabled={disabled} onChange={set} />;
      case 'prompt-list':
        return <StarterPromptListEditor value={(value as any[]) ?? []} disabled={disabled} onChange={set} />;
    }
  })();

  return (
    <div className="space-y-1.5 py-2">
      <Label htmlFor={id}>{field.label}</Label>
      {control}
      {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
    </div>
  );
}
```

(If shadcn `Select`/`Textarea` components don't exist in `components/ui/`, add them via `pnpm dlx shadcn@latest add select textarea`. If the old sidebar's starter-prompt editor is inline JSX, extract it into `components/configurator/ui/starter-prompt-list.tsx` with props `{ value, onChange, disabled }` — move the existing JSX, don't redesign it.)

```tsx
// components/configurator/config-form/section.tsx
'use client';
import { CHAT_FIELD_REGISTRY, SECTIONS, type SectionId } from '@/lib/widget-config/field-registry';
import type { ChatWidgetConfig } from '@/lib/widget-config/schema';
import { FieldControl } from './field-control';

interface Props {
  sectionId: SectionId;
  config: ChatWidgetConfig;
  tier: string;
  onChange: (path: string, value: unknown) => void;
}

const TIER_RANK: Record<string, number> = { free: 0, basic: 0, pro: 1, agency: 1 };

export function ConfigSection({ sectionId, config, tier, onChange }: Props) {
  const fields = CHAT_FIELD_REGISTRY.filter((f) => f.section === sectionId);
  return (
    <div>
      {fields.map((field) => {
        if (field.showIf && !field.showIf(config)) return null;
        const locked = field.tierGate === 'pro' && (TIER_RANK[tier] ?? 0) < 1;
        return <FieldControl key={field.path} field={field} config={config} disabled={locked} onChange={onChange} />;
      })}
    </div>
  );
}
```

- [ ] **Step 3: Rebuild the sidebar**

Rewrite `components/configurator/config-sidebar.tsx` as: the existing collapsible-section chrome (keep the current visual shell — accordion or whatever it uses today) mapping over `SECTIONS`, rendering `<ConfigSection sectionId={s.id} config={config} tier={tier} onChange={handleChange} />`, where:

```tsx
const config = useWidgetStore((s) => s.config);
const updateConfig = useWidgetStore((s) => s.updateConfig);
const handleChange = (path: string, value: unknown) => {
  updateConfig(setAtPath({}, path, value) as DeepPartial<WidgetConfig>);
};
```

Delete all the inline per-field JSX. Keep any non-field UI (preset selector, save/deploy buttons) where it is. Display-kind widgets keep their existing dedicated section components (`components/configurator/sections/`) for now — registry-driving the display kind is a follow-up, not part of this plan.

- [ ] **Step 4: Test, visual check, commit**

Run: `pnpm test && pnpm type-check`, then `pnpm dev` → open configurator → every section renders, edits flow to the live preview (Phase 5), basic-tier account sees locked Pro fields.

```bash
git add -A components lib tests
git commit -m "feat(configurator): schema-driven sidebar generated from field registry (1550 -> ~120 lines)"
```

---

### Task 23: Collapse the three configurator pages into one

**Files:**
- Create: `app/configurator/[kind]/page.tsx`
- Create: `hooks/use-configurator-page.ts`
- Modify: `app/configurator/n8n/page.tsx`, `app/configurator/chatkit/page.tsx`, `app/configurator/n8n-display/page.tsx` → become redirects
- Test: `tests/unit/hooks/use-configurator-page.test.ts`

- [ ] **Step 1: Read the three pages and extract the shared orchestration into a hook**

Read `app/configurator/n8n/page.tsx` first — it is the reference implementation. The hook owns: widget loading by `?id=` param, store hydration via `setConfigFromServer`, save (PATCH `/api/widgets/[id]`), deploy (POST `/api/widgets/[id]/deploy`), and unsaved-changes warning.

```ts
// hooks/use-configurator-page.ts
'use client';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWidgetStore } from '@/stores/widget-store';
import { toast } from 'sonner';

export function useConfiguratorPage(kind: 'chat' | 'display') {
  const searchParams = useSearchParams();
  const router = useRouter();
  const widgetId = searchParams.get('id');
  const { config, isDirty, setConfigFromServer, markSaved } = useWidgetStore();
  const [widget, setWidget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!widgetId) { router.replace('/dashboard'); return; }
    (async () => {
      const res = await fetch(`/api/widgets/${widgetId}`);
      if (!res.ok) { toast.error('Failed to load widget'); router.replace('/dashboard'); return; }
      const { widget } = await res.json();
      setWidget(widget);
      setConfigFromServer(widget.config, widget.kind);
      setLoading(false);
    })();
  }, [widgetId, router, setConfigFromServer]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (isDirty) { e.preventDefault(); } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const save = useCallback(async () => {
    if (!widgetId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/widgets/${widgetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? 'Save failed');
        return;
      }
      markSaved();
      toast.success('Widget saved');
    } finally {
      setSaving(false);
    }
  }, [widgetId, config, markSaved]);

  const deploy = useCallback(async () => {
    if (!widgetId) return;
    await save();
    const res = await fetch(`/api/widgets/${widgetId}/deploy`, { method: 'POST' });
    if (res.ok) toast.success('Widget deployed'); else toast.error('Deploy failed');
  }, [widgetId, save]);

  return { kind, widget, config, loading, saving, isDirty, save, deploy };
}
```

(Adjust action names — `markSaved`/`setConfigFromServer` — to the store actions created in Task 4; add `markSaved: () => set({ isDirty: false })` to the store if absent. Match the actual PATCH body/response shape from `app/api/widgets/[id]/route.ts` — read it before writing.)

- [ ] **Step 2: The unified page**

```tsx
// app/configurator/[kind]/page.tsx
import { notFound } from 'next/navigation';
import { ConfiguratorClient } from './configurator-client';

const KIND_MAP: Record<string, 'chat' | 'display'> = { n8n: 'chat', chatkit: 'chat', display: 'display' };

export default async function ConfiguratorPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const widgetKind = KIND_MAP[kind];
  if (!widgetKind) notFound();
  return <ConfiguratorClient kind={widgetKind} variant={kind} />;
}
```

`configurator-client.tsx` (same dir, `'use client'`) composes: `useConfiguratorPage(kind)` + the existing layout shell + `<ConfigSidebar />` + `<PreviewCanvas />` + save/deploy buttons — lift this JSX from the current `app/configurator/n8n/page.tsx`, parameterizing the few `variant`-specific bits (chatkit shows its AgentKit connection section; display shows display sections).

Then delete all three old page directories (`app/configurator/n8n/`, `app/configurator/chatkit/`, `app/configurator/n8n-display/`). The URLs `/configurator/n8n` and `/configurator/chatkit` automatically resolve through the new `[kind]` dynamic route, so existing links keep working; only the renamed display path needs a redirect in `next.config.ts`:

```ts
async redirects() {
  return [
    { source: '/configurator/n8n-display', destination: '/configurator/display', permanent: true },
    // /configurator/n8n and /configurator/chatkit already match the dynamic [kind] route — no redirect needed
  ];
},
```

(Note: `/configurator/n8n` and `/configurator/chatkit` now resolve through `[kind]` — same URLs, no link changes needed elsewhere. Check `app/configurator/page.tsx` (the 180-line index) still links correctly.)

- [ ] **Step 3: Test, type-check, smoke, commit**

Run: `pnpm test && pnpm type-check`, then `pnpm dev` → open each of `/configurator/n8n?id=…`, `/configurator/chatkit?id=…`, `/configurator/display?id=…` → load, edit, save, deploy all work.

```bash
git add -A app hooks components tests next.config.ts
git commit -m "refactor(configurator): one dynamic configurator page; three duplicate pages deleted"
```

**Phase 6 exit criteria:** adding a new config option = 1 line in `schema.ts` + 1 line in `field-registry.ts`; `wc -l components/configurator/config-sidebar.tsx` < 200.

---

## Phase 7 — Cleanup, CI Gate, Final Verification

### Task 24: Repo cleanup

**Files:**
- Delete: `chat-widget-playground/` (legacy standalone Vite project — confirm nothing imports it: `grep -rn "chat-widget-playground" app/ components/ lib/ stores/ widget/ --include="*.ts*"` must be empty)
- Delete: `test-embed.html`, `ui-audit/`, `.playwright-mcp/` (untracked scratch dirs at repo root)
- Modify: `.gitignore` (add `.playwright-mcp/`, `ui-audit/`)
- Modify: `CLAUDE.md` (update the stale sections: schema table list, API route list, "Last Updated" date)
- Modify: `.env.example` (full inventory: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`/public-url var used by `lib/embed.ts`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `BILLING_ENABLED`, `ADMIN_EMAILS`, Sentry vars)

- [ ] **Step 1: Delete + update, verify nothing breaks**

Run after deletions: `pnpm type-check && pnpm test && pnpm build`
Expected: all green.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove legacy playground and scratch artifacts; refresh CLAUDE.md and .env.example"
```

---

### Task 25: CI gate

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the workflow**

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [master]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test -- --ci
      - run: pnpm build:widget
      - run: pnpm build
        env:
          # Build-time only; runtime validation happens at boot via instrumentation.ts
          DATABASE_URL: postgres://ci:ci@localhost:5432/ci
          JWT_SECRET: ci-only-secret-at-least-32-characters-long
```

(If tests need a real Postgres, add a `services: postgres:` block with `postgres:16` and point `DATABASE_URL` at it — check whether the integration tests hit a live DB or mock the Drizzle client; mirror whatever `tests/integration` currently requires.)

- [ ] **Step 2: Push and verify the workflow runs green, then commit protection**

Run: `git push -u origin feat/production-readiness` then `gh run watch`
Expected: all steps green. Enable branch protection on `master` requiring the `verify` check (repo settings or `gh api`).

```bash
git add .github
git commit -m "ci: lint + type-check + test + widget and app builds on every PR"
```

---

### Task 26: Final production-readiness verification

- [ ] **Step 1: Full local gate**

```bash
pnpm install && pnpm lint && pnpm type-check && pnpm test && pnpm build:widget && pnpm build
```
Expected: zero errors.

- [ ] **Step 2: End-to-end smoke (the money path)**

With `pnpm dev` + a disposable n8n webhook:
1. Sign up → create widget → configure (colors, branding, webhook URL) → live preview reflects every change and answers with the canned response.
2. Save → copy embed snippet → paste into a scratch HTML file outside the repo → widget loads (loader → config JSON → hashed bundle in Network tab) → real message round-trips through `/api/chat-relay` → n8n → reply renders with markdown.
3. Negative checks: embed snippet on a non-allowlisted domain → config endpoint 403; webhook set to `https://10.0.0.1/x` → save rejected 400; 91 rapid relay posts from one IP → 429.
4. Portal: `/chat/portal/[widgetId]` renders via the hashed bundle; navigating away doesn't leak (heap snapshot count of widget roots stays 1 after 3 remounts).

- [ ] **Step 3: Deployment checklist (Vercel)**

- Set env vars in Vercel: `DATABASE_URL`, `JWT_SECRET` (32+ chars), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (provision Upstash via Vercel Marketplace), `BILLING_ENABLED=false`, `ADMIN_EMAILS`, public app URL var.
- Run, in order, against the production DB: `pnpm tsx scripts/migrate-v2-backfill.ts` THEN `pnpm db:migrate`.
- Deploy; verify `instrumentation.ts` boot log shows no env warnings; run the smoke pass from Step 2 against production.

- [ ] **Step 4: Update project docs and merge**

Log the change in `docs/development/DEVELOPMENT_LOG.md`; record the three architectural decisions (canonical config schema; loader/hashed-bundle serving; obfuscation removed) in `docs/development/decisions.md`. Open the PR to `master`.

```bash
git add docs
git commit -m "docs: record production-readiness architecture decisions"
```

---

## Execution order & dependencies

```
Phase 1 (Tasks 1–6)  config unification        ──┬─→ Phase 5 (19–20) preview     ─┐
                                                  └─→ Phase 6 (21–23) sidebar     ├─→ Phase 7 (24–26)
Phase 2 (Tasks 7–10) v2 migration  ──→ Phase 4 (16–18) serving pipeline          ─┘
Phase 3 (Tasks 11–15) security — independent; do immediately after Phase 2 (Task 13 touches relay code Task 9 refactors)
```

Strictly sequential is simplest and safe: 1 → 2 → 3 → 4 → 5 → 6 → 7. Each phase ends with the full suite green and is independently shippable.



