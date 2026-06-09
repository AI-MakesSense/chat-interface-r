/**
 * Config Migration
 *
 * Purpose: Normalize any historical stored config shape to the canonical
 * schemaVersion 2 shape. Idempotent: migrateConfig(migrateConfig(x)) ≡ migrateConfig(x).
 *
 * Three legacy shapes handled:
 *   (a) Widget-store shape — `style.*`, top-level `typography.*`, `features.fileAttachments`
 *   (b) Playground flat fields — `themeMode`, `accentColor`, `greeting`, `starterPrompts`,
 *       `placeholder`, `n8nWebhookUrl`
 *   (c) Already-structured shape missing `schemaVersion`/`startScreen`/`composer`
 *
 * Strategy: build a candidate object section by section from whichever legacy
 * keys are present, then run it through chatWidgetConfigSchema with per-field
 * fallback (invalid leaf values are replaced by defaults).
 *
 * Display-kind configs are NOT routed through migrateConfig — callers check
 * `widget.kind` first. This module handles chat only. A blob mistagged as
 * `{ schemaVersion: 2, kind: 'display' }` fails the `kind` literal and is
 * repaired to chat defaults — that is the intended contract.
 */
import {
  chatWidgetConfigSchema,
  CONFIG_SCHEMA_VERSION,
  type ChatWidgetConfig,
} from './schema';

type AnyRecord = Record<string, unknown>;

function isHex(v: unknown): v is string {
  return typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v);
}

/**
 * Drop invalid leaves by safeParsing each section independently, falling back
 * to the section default when a section fails to parse. This tolerates configs
 * where top-level unknown keys (like `style`) are present — Zod strips unknown
 * keys by default, so they disappear from the output cleanly.
 *
 * Both exits double-parse so the result is a strict fixed point of the schema:
 * a single Zod parse is not idempotent here (e.g. `darkOverride.colors: {}`
 * inflates to full per-field defaults on the next parse), but parse(parse(x))
 * converges. Double-parsing means migrateConfig output never changes if it is
 * migrated again.
 */
function lenientParse(candidate: AnyRecord): ChatWidgetConfig {
  const direct = chatWidgetConfigSchema.safeParse(candidate);
  if (direct.success) return chatWidgetConfigSchema.parse(direct.data);

  // Per-section fallback: keep sections that parse clean, default the ones that don't.
  const sections = [
    'branding',
    'theme',
    'advancedStyling',
    'behavior',
    'connection',
    'features',
    'startScreen',
    'composer',
  ] as const;

  const repaired: AnyRecord = { schemaVersion: CONFIG_SCHEMA_VERSION, kind: 'chat' };
  for (const s of sections) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sectionSchema = (chatWidgetConfigSchema.shape as any)[s];
    const r = sectionSchema.safeParse(candidate[s] ?? {});
    repaired[s] = r.success ? r.data : sectionSchema.parse({});
  }

  return chatWidgetConfigSchema.parse(chatWidgetConfigSchema.parse(repaired));
}

export function migrateConfig(raw: unknown): ChatWidgetConfig {
  const src: AnyRecord = (raw && typeof raw === 'object' ? raw : {}) as AnyRecord;

  // Already tagged canonical → still validate. A v2 tag is a claim, not proof:
  // the blob may carry invalid leaves (bad colors, javascript: URLs) or missing
  // sections, so it goes through lenientParse like everything else. lenientParse
  // double-parses to a fixed point, so this stays idempotent under toEqual.
  if (src.schemaVersion === CONFIG_SCHEMA_VERSION) return lenientParse(src);

  const candidate: AnyRecord = {
    schemaVersion: CONFIG_SCHEMA_VERSION,
    kind: 'chat',
    branding: { ...(src.branding && typeof src.branding === 'object' ? (src.branding as AnyRecord) : {}) },
    theme: { ...(src.theme && typeof src.theme === 'object' ? (src.theme as AnyRecord) : {}) },
    advancedStyling: { ...(src.advancedStyling && typeof src.advancedStyling === 'object' ? (src.advancedStyling as AnyRecord) : {}) },
    behavior: { ...(src.behavior && typeof src.behavior === 'object' ? (src.behavior as AnyRecord) : {}) },
    connection: { ...(src.connection && typeof src.connection === 'object' ? (src.connection as AnyRecord) : {}) },
    features: { ...(src.features && typeof src.features === 'object' ? (src.features as AnyRecord) : {}) },
    startScreen: { ...(src.startScreen && typeof src.startScreen === 'object' ? (src.startScreen as AnyRecord) : {}) },
    composer: { ...(src.composer && typeof src.composer === 'object' ? (src.composer as AnyRecord) : {}) },
  };

  // ---- (a) legacy store shape: style.* / top-level typography.* ----
  const style = (src.style && typeof src.style === 'object' ? src.style : {}) as AnyRecord;

  if (style.theme) (candidate.theme as AnyRecord).mode = style.theme;
  if (isHex(style.primaryColor)) {
    (candidate.theme as AnyRecord).colors = {
      ...((candidate.theme as AnyRecord).colors && typeof (candidate.theme as AnyRecord).colors === 'object'
        ? ((candidate.theme as AnyRecord).colors as AnyRecord)
        : {}),
      primary: style.primaryColor,
      userMessage: style.primaryColor,
    };
  }
  if (isHex(style.backgroundColor)) {
    (candidate.theme as AnyRecord).colors = {
      ...((candidate.theme as AnyRecord).colors && typeof (candidate.theme as AnyRecord).colors === 'object'
        ? ((candidate.theme as AnyRecord).colors as AnyRecord)
        : {}),
      background: style.backgroundColor,
    };
  }
  if (isHex(style.textColor)) {
    (candidate.theme as AnyRecord).colors = {
      ...((candidate.theme as AnyRecord).colors && typeof (candidate.theme as AnyRecord).colors === 'object'
        ? ((candidate.theme as AnyRecord).colors as AnyRecord)
        : {}),
      text: style.textColor,
    };
  }
  if (style.position) {
    (candidate.theme as AnyRecord).position = {
      ...((candidate.theme as AnyRecord).position && typeof (candidate.theme as AnyRecord).position === 'object'
        ? ((candidate.theme as AnyRecord).position as AnyRecord)
        : {}),
      position: style.position,
    };
  }
  if (typeof style.cornerRadius === 'number') {
    (candidate.theme as AnyRecord).cornerRadius = style.cornerRadius;
  }

  // Top-level typography section (legacy store shape)
  const typo = (src.typography && typeof src.typography === 'object' ? src.typography : {}) as AnyRecord;
  if (typo.fontFamily || typo.fontSize) {
    (candidate.theme as AnyRecord).typography = {
      ...((candidate.theme as AnyRecord).typography && typeof (candidate.theme as AnyRecord).typography === 'object'
        ? ((candidate.theme as AnyRecord).typography as AnyRecord)
        : {}),
      ...(typo.fontFamily ? { fontFamily: typo.fontFamily } : {}),
      ...(typeof typo.fontSize === 'number' ? { fontSize: typo.fontSize } : {}),
    };
  }

  // Legacy features shape: fileAttachments / allowedExtensions / maxFileSize
  const feat = candidate.features as AnyRecord;
  if (
    typeof feat.fileAttachments === 'boolean' ||
    feat.allowedExtensions !== undefined ||
    feat.maxFileSize !== undefined
  ) {
    feat.attachments = {
      ...(feat.attachments && typeof feat.attachments === 'object' ? (feat.attachments as AnyRecord) : {}),
      ...(typeof feat.fileAttachments === 'boolean' ? { enabled: feat.fileAttachments } : {}),
      ...(Array.isArray(feat.allowedExtensions) ? { allowedExtensions: feat.allowedExtensions } : {}),
      ...(typeof feat.maxFileSize === 'number' ? { maxFileSizeMB: feat.maxFileSize } : {}),
    };
    // Remove legacy keys so the canonical features section parses cleanly
    delete feat.fileAttachments;
    delete feat.allowedExtensions;
    delete feat.maxFileSize;
  }

  // Legacy connection shape: routeParam → route
  const conn = candidate.connection as AnyRecord;
  if (conn.routeParam && !conn.route) {
    conn.route = conn.routeParam;
  }
  delete conn.routeParam;

  // ---- (b) playground flat fields ----
  if (src.themeMode) (candidate.theme as AnyRecord).mode = src.themeMode;
  if (isHex(src.accentColor)) {
    (candidate.theme as AnyRecord).colors = {
      ...((candidate.theme as AnyRecord).colors && typeof (candidate.theme as AnyRecord).colors === 'object'
        ? ((candidate.theme as AnyRecord).colors as AnyRecord)
        : {}),
      primary: src.accentColor,
      userMessage: src.accentColor,
    };
  }
  if (typeof src.greeting === 'string') {
    (candidate.startScreen as AnyRecord).greeting = src.greeting;
  }
  if (Array.isArray(src.starterPrompts)) {
    (candidate.startScreen as AnyRecord).starterPrompts = src.starterPrompts;
  }
  if (typeof src.placeholder === 'string') {
    (candidate.composer as AnyRecord).placeholder = src.placeholder;
  }
  if (typeof src.disclaimer === 'string') {
    (candidate.composer as AnyRecord).disclaimer = src.disclaimer;
  }
  if (typeof src.fontFamily === 'string') {
    (candidate.theme as AnyRecord).typography = {
      ...((candidate.theme as AnyRecord).typography && typeof (candidate.theme as AnyRecord).typography === 'object'
        ? ((candidate.theme as AnyRecord).typography as AnyRecord)
        : {}),
      fontFamily: src.fontFamily,
    };
  }
  if (typeof src.fontSize === 'number') {
    (candidate.theme as AnyRecord).typography = {
      ...((candidate.theme as AnyRecord).typography && typeof (candidate.theme as AnyRecord).typography === 'object'
        ? ((candidate.theme as AnyRecord).typography as AnyRecord)
        : {}),
      fontSize: src.fontSize,
    };
  }
  if (typeof src.n8nWebhookUrl === 'string' && src.n8nWebhookUrl) {
    (candidate.connection as AnyRecord).webhookUrl = src.n8nWebhookUrl;
  }
  if (typeof src.enableAttachments === 'boolean') {
    (candidate.features as AnyRecord).attachments = {
      ...((candidate.features as AnyRecord).attachments && typeof (candidate.features as AnyRecord).attachments === 'object'
        ? ((candidate.features as AnyRecord).attachments as AnyRecord)
        : {}),
      enabled: src.enableAttachments,
    };
  }

  return lenientParse(candidate);
}
