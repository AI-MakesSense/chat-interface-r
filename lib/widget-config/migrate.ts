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
import { z } from 'zod';
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
 * Surgically repair a single section by deleting only the offending leaf values
 * that Zod rejects, rather than replacing the entire section with defaults.
 * This preserves all valid sibling data when one leaf is invalid.
 *
 * Algorithm: repeatedly safeParse → remove each invalid leaf/element → repeat
 * until success, capped at 25 iterations. Falls back to section defaults only
 * if the section is itself the wrong type, no progress can be made, or the
 * iteration cap is hit.
 *
 * Array handling: when an issue path crosses an array (e.g.
 * `starterPrompts[1].label`), deleting the leaf would leave the element
 * required-missing (and `delete arr[i]` would leave a sparse hole) — both fail
 * forever. Instead we splice out the whole offending ELEMENT at the first
 * array container. Splices for the same array are applied in descending index
 * order within a pass so earlier removals don't shift later indices.
 */
function repairSection(sectionSchema: z.ZodTypeAny, raw: unknown): unknown {
  let candidate: AnyRecord;
  if (raw && typeof raw === 'object') {
    try {
      candidate = structuredClone(raw) as AnyRecord;
    } catch {
      // Non-cloneable values (functions, etc.) — fall back to section defaults
      return sectionSchema.parse({});
    }
  } else {
    candidate = {};
  }

  for (let i = 0; i < 25; i++) {
    const r = sectionSchema.safeParse(candidate);
    if (r.success) return r.data;

    let deleted = false;
    // Collect array-element removals so same-array indices splice in
    // descending order after all issues in this pass are examined.
    const splices = new Map<unknown[], Set<number>>();

    for (const issue of r.error.issues) {
      // Section itself is the wrong type — no point deleting leaves
      if (issue.path.length === 0) return sectionSchema.parse({});

      // Array-aware: if the path crosses an array, schedule removal of the
      // offending ELEMENT at the FIRST array container.
      let container: unknown = candidate;
      let spliceTarget: { arr: unknown[]; index: number } | null = null;
      for (let k = 0; k < issue.path.length; k++) {
        const seg = issue.path[k];
        if (Array.isArray(container) && typeof seg === 'number') {
          spliceTarget = { arr: container, index: seg };
          break;
        }
        if (container == null || typeof container !== 'object') {
          container = null;
          break;
        }
        container = (container as AnyRecord)[seg as string];
      }
      if (spliceTarget) {
        const indices = splices.get(spliceTarget.arr) ?? new Set<number>();
        indices.add(spliceTarget.index);
        splices.set(spliceTarget.arr, indices);
        continue;
      }

      // Pure object path: walk to the parent of the offending leaf, delete it.
      // Only count as progress when the key actually existed — a missing
      // required key can never be repaired by deletion, so the honest guard
      // exits to section defaults immediately instead of spinning the cap.
      let cursor: AnyRecord | null = candidate;
      for (let k = 0; k < issue.path.length - 1; k++) {
        const key = issue.path[k] as string;
        if (cursor![key] == null || typeof cursor![key] !== 'object') {
          cursor = null;
          break;
        }
        cursor = cursor![key] as AnyRecord;
      }
      if (cursor) {
        const leafKey = issue.path[issue.path.length - 1] as string;
        if (Object.prototype.hasOwnProperty.call(cursor, leafKey)) {
          delete cursor[leafKey];
          deleted = true;
        }
      }
    }

    // Apply scheduled splices, highest index first per array.
    for (const [arr, indices] of splices) {
      for (const idx of [...indices].sort((a, b) => b - a)) {
        if (idx >= 0 && idx < arr.length) {
          arr.splice(idx, 1);
          deleted = true;
        }
      }
    }

    if (!deleted) return sectionSchema.parse({});
  }

  return sectionSchema.parse({});
}

/**
 * Drop invalid leaves by safeParsing each section independently, repairing
 * only the specific invalid leaves rather than replacing whole sections.
 * This tolerates configs where top-level unknown keys (like `style`) are
 * present — Zod strips unknown keys by default, so they disappear cleanly.
 *
 * Both exits double-parse so the result is a strict fixed point of the schema.
 * The mechanism: the first parse leaves `darkOverride.colors: {}` as-is
 * (partial allows the empty object); on the second parse `{}` is explicit input
 * and partial's per-field defaults inflate it; parse∘parse is therefore the
 * fixed point. This convergence ensures migrateConfig output is always
 * idempotent under a second call.
 */
function lenientParse(candidate: AnyRecord): ChatWidgetConfig {
  const direct = chatWidgetConfigSchema.safeParse(candidate);
  if (direct.success) return chatWidgetConfigSchema.parse(direct.data);

  // Per-section leaf-level repair: preserve valid sibling data, delete only bad leaves.
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
    repaired[s] = repairSection(sectionSchema, candidate[s] ?? {});
  }

  return chatWidgetConfigSchema.parse(chatWidgetConfigSchema.parse(repaired));
}

/**
 * Normalize any raw config shape to the canonical ChatWidgetConfig (schemaVersion 2).
 *
 * Precedence (highest → lowest) for any given canonical field:
 *   1. Structured canonical  — explicit nested keys already in the canonical sections
 *      (e.g. `theme.colors.primary`, `features.attachments.enabled`).
 *   2. Playground flat fields — top-level shorthand (`themeMode`, `accentColor`,
 *      `greeting`, `starterPrompts`, `placeholder`, `n8nWebhookUrl`). Beat legacy
 *      store keys when both are present and canonical is absent.
 *   3. Legacy store shape    — `style.*`, top-level `typography.*`,
 *      `features.fileAttachments` / `allowedExtensions` / `maxFileSize`.
 *
 * Implementation note: each tier is applied in reverse precedence order (3 → 2 → 1),
 * so later writes WIN. This means canonical values are written last and always win.
 *
 * Hot read-path note: callers should cache the result of migrateConfig, keyed on
 * the widget's (version, updatedAt) pair, to avoid re-parsing unchanged configs on
 * every request.
 */
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

  // ---- Capture canonical theme.colors and theme.mode BEFORE any legacy writes ----
  // Used below to enforce canonical > playground > legacy precedence.
  const canonicalTheme = (src.theme && typeof src.theme === 'object' ? src.theme : {}) as AnyRecord;
  const canonicalColors = (canonicalTheme.colors && typeof canonicalTheme.colors === 'object'
    ? canonicalTheme.colors
    : {}) as AnyRecord;
  const hasCanonicalMode = canonicalTheme.mode !== undefined;
  const hasCanonicalPrimary = canonicalColors.primary !== undefined;

  // ---- Capture canonical features.attachments BEFORE any legacy writes ----
  const canonicalFeat = (src.features && typeof src.features === 'object' ? src.features : {}) as AnyRecord;
  const canonicalAttachments = (canonicalFeat.attachments && typeof canonicalFeat.attachments === 'object'
    ? canonicalFeat.attachments
    : {}) as AnyRecord;

  // ---- (3) Legacy store shape: style.* / top-level typography.* ----
  // Applied first so playground (2) and canonical (1) can overwrite.
  const style = (src.style && typeof src.style === 'object' ? src.style : {}) as AnyRecord;

  if (style.theme && !hasCanonicalMode) (candidate.theme as AnyRecord).mode = style.theme;
  if (isHex(style.primaryColor) && !hasCanonicalPrimary) {
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

  // Legacy features shape: fileAttachments / allowedExtensions / maxFileSize.
  // Only write to attachments keys that are NOT already defined in the canonical
  // features.attachments object — canonical wins.
  const feat = candidate.features as AnyRecord;
  if (
    typeof feat.fileAttachments === 'boolean' ||
    feat.allowedExtensions !== undefined ||
    feat.maxFileSize !== undefined
  ) {
    const existingAttachments = (feat.attachments && typeof feat.attachments === 'object'
      ? (feat.attachments as AnyRecord)
      : {});
    feat.attachments = {
      ...(typeof feat.fileAttachments === 'boolean' && canonicalAttachments.enabled === undefined
        ? { enabled: feat.fileAttachments }
        : {}),
      ...(Array.isArray(feat.allowedExtensions) && canonicalAttachments.allowedExtensions === undefined
        ? { allowedExtensions: feat.allowedExtensions }
        : {}),
      ...(typeof feat.maxFileSize === 'number' && canonicalAttachments.maxFileSizeMB === undefined
        ? { maxFileSizeMB: feat.maxFileSize }
        : {}),
      // Canonical attachment keys always win — spread them last
      ...existingAttachments,
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

  // ---- (2) Playground flat fields — beat legacy, but not canonical ----
  // theme.mode: playground themeMode beats legacy style.theme, but not canonical theme.mode
  if (src.themeMode && !hasCanonicalMode) (candidate.theme as AnyRecord).mode = src.themeMode;
  // theme.colors.primary: playground accentColor beats legacy style.primaryColor, but not canonical
  if (isHex(src.accentColor) && !hasCanonicalPrimary) {
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
