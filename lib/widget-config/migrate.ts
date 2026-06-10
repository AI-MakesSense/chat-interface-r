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
/**
 * Replace a section with schema defaults, loudly. Every call site here is a
 * data-loss path — existing stored data for the section is discarded — so the
 * warning makes the loss visible in logs (ADV-006). Absent/null sections
 * getting defaults is the NORMAL case and must NOT route through this helper.
 */
function sectionDefaultFallback(
  sectionName: string,
  sectionSchema: z.ZodTypeAny,
  reason: string
): unknown {
  console.warn(
    `[migrateConfig] Section '${sectionName}' could not be repaired (${reason}) — replaced with schema defaults. Original data for this section is dropped.`
  );
  return sectionSchema.parse({});
}

function repairSection(
  sectionName: string,
  sectionSchema: z.ZodTypeAny,
  raw: unknown
): unknown {
  let candidate: AnyRecord;
  if (raw && typeof raw === 'object') {
    try {
      candidate = structuredClone(raw) as AnyRecord;
    } catch {
      // Non-cloneable values (functions, etc.) — fall back to section defaults
      return sectionDefaultFallback(sectionName, sectionSchema, 'non-cloneable value');
    }
  } else if (raw == null) {
    // Absent/null section — filling with defaults is normal, not data loss.
    candidate = {};
  } else {
    // Data-bearing primitive (string/number/boolean) where an object section
    // was expected — nothing to leaf-repair; the stored value is discarded.
    return sectionDefaultFallback(sectionName, sectionSchema, 'section is wrong type');
  }

  for (let i = 0; i < 25; i++) {
    const r = sectionSchema.safeParse(candidate);
    if (r.success) return r.data;

    let deleted = false;
    // Collect array-element removals so same-array indices splice in
    // descending order after all issues in this pass are examined.
    const splices = new Map<unknown[], Set<number>>();

    for (const issue of r.error.issues) {
      // Section itself rejected at the root — no point deleting leaves
      if (issue.path.length === 0) {
        return sectionDefaultFallback(sectionName, sectionSchema, 'section is wrong type');
      }

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

    if (!deleted) {
      return sectionDefaultFallback(sectionName, sectionSchema, 'no repair progress');
    }
  }

  return sectionDefaultFallback(sectionName, sectionSchema, 'iteration cap reached');
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
    'colorSystem',
    'chatkit',
    'advanced',
  ] as const;

  const repaired: AnyRecord = { schemaVersion: CONFIG_SCHEMA_VERSION, kind: 'chat' };
  for (const s of sections) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sectionSchema = (chatWidgetConfigSchema.shape as any)[s];
    repaired[s] = repairSection(s, sectionSchema, candidate[s]);
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
    colorSystem: { ...(src.colorSystem && typeof src.colorSystem === 'object' ? (src.colorSystem as AnyRecord) : {}) },
    chatkit: { ...(src.chatkit && typeof src.chatkit === 'object' ? (src.chatkit as AnyRecord) : {}) },
    advanced: { ...(src.advanced && typeof src.advanced === 'object' ? (src.advanced as AnyRecord) : {}) },
  };

  // Legacy `advanced.customJs` is intentionally dropped (never executed; XSS
  // surface). Zod would strip it anyway, but delete explicitly for clarity.
  delete (candidate.advanced as AnyRecord).customJs;

  /**
   * Write `value` to `obj[key]` only when the key is not already present.
   * Used for the Task 4a flat-field mappings: these fields have no tier-3
   * legacy (`style.*`) source, so "absent in candidate" is exactly
   * "no canonical structured value" — canonical-over-flat precedence for free.
   *
   * PRECONDITION: the candidate section passed as `obj` must have been built
   * from a spread of the raw `src.X` input (as in the candidate construction
   * above), NEVER from schema defaults. If a section were pre-filled with
   * defaults, every key would already be present and the flat-field
   * migrations below would silently no-op.
   */
  const setIfAbsent = (obj: AnyRecord, key: string, value: unknown): void => {
    if (obj[key] === undefined) obj[key] = value;
  };

  /** Replace parent[key] with a shallow copy (avoids mutating caller-owned nested objects) and return it. */
  const ensureOwnObject = (parent: AnyRecord, key: string): AnyRecord => {
    const existing = parent[key];
    parent[key] = existing && typeof existing === 'object' ? { ...(existing as AnyRecord) } : {};
    return parent[key] as AnyRecord;
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
  //
  // allowedExtensions normalization: legacy serving accepted bare extensions
  // ('pdf', 'PNG'); the canonical schema requires /^\.[a-z0-9]+$/ ('.pdf').
  // Without normalization, valid legacy entries would be spliced to [] by
  // repairSection — silently dropping the owner's whitelist.
  //
  // maxFileSize default drift (DELIBERATE): legacy serving defaulted to 5MB
  // when the value was unset; the canonical schema default is 10MB. The more
  // permissive default is intentional — the relay and the n8n workflow enforce
  // their own upload caps, so the widget-side limit is a UX hint, not a
  // security boundary. Explicit legacy maxFileSize values still carry over.
  const normalizeExtension = (ext: unknown): unknown => {
    if (typeof ext !== 'string') return ext;
    const lower = ext.toLowerCase();
    return lower.startsWith('.') ? lower : '.' + lower;
  };
  // Units heuristic for legacy maxFileSize: the old serving path read
  // features.maxFileSize as KILOBYTES (`maxFileSizeKB: ... || 5120`), but the
  // canonical field is maxFileSizeMB (1–50). Carrying a KB value through
  // unchanged would either overflow the range (5120 → repaired to the 10MB
  // default) or silently reinterpret it (a 20KB cap becomes 20MB). Values
  // above 50 cannot possibly be MB (the schema caps at 50), so they are
  // treated as KB and converted; values ≤ 50 are taken as MB as-is. A small
  // KB value (≤ 50) is indistinguishable from MB and is read as MB — that is
  // accepted: such caps were almost certainly authored as MB.
  //
  // Edge case for the KB branch (v > 50): KB values in [51, 511] divide to
  // < 0.5 MB and round to 0; the Math.max(1, …) floor clamps them up to 1 MB
  // (e.g. 100 KB → round(0.098) = 0 → clamped to 1 MB). This is intentional —
  // 1 MB is the schema minimum, so a sub-1-MB cap can't be represented anyway.
  const normalizeMaxFileSizeMB = (v: number): number =>
    v > 50 ? Math.max(1, Math.round(v / 1024)) : Math.max(1, Math.round(v));
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
        ? { allowedExtensions: feat.allowedExtensions.map(normalizeExtension) }
        : {}),
      ...(typeof feat.maxFileSize === 'number' && canonicalAttachments.maxFileSizeMB === undefined
        ? { maxFileSizeMB: normalizeMaxFileSizeMB(feat.maxFileSize) }
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
  // Top-level flat allowedExtensions / maxFileSize: the old translate read
  // these alongside enableAttachments (`accept: dbConfig.allowedExtensions`,
  // `maxSize: dbConfig.maxFileSize`). Same normalization as the legacy
  // features.* path; canonical features.attachments keys win (absent-check
  // against the canonical snapshot captured before any legacy writes).
  // Flat beats legacy store shape, so overwriting a features.* value here is
  // the intended tier-2-over-tier-3 precedence.
  if (Array.isArray(src.allowedExtensions) && canonicalAttachments.allowedExtensions === undefined) {
    (candidate.features as AnyRecord).attachments = {
      ...((candidate.features as AnyRecord).attachments && typeof (candidate.features as AnyRecord).attachments === 'object'
        ? ((candidate.features as AnyRecord).attachments as AnyRecord)
        : {}),
      allowedExtensions: src.allowedExtensions.map(normalizeExtension),
    };
  }
  if (typeof src.maxFileSize === 'number' && canonicalAttachments.maxFileSizeMB === undefined) {
    (candidate.features as AnyRecord).attachments = {
      ...((candidate.features as AnyRecord).attachments && typeof (candidate.features as AnyRecord).attachments === 'object'
        ? ((candidate.features as AnyRecord).attachments as AnyRecord)
        : {}),
      maxFileSizeMB: normalizeMaxFileSizeMB(src.maxFileSize),
    };
  }

  // ---- (2b) Task 4a playground fields → new canonical sections ----
  // These flat keys have no tier-3 (`style.*`) source, so setIfAbsent gives
  // canonical-over-flat precedence directly: explicit structured values were
  // spread into candidate at construction and are never overwritten here.

  // Color system (flat useAccent/accentColor/tint*/surface*/custom* → colorSystem.*).
  // NOTE: flat accentColor does NOT force useAccent on — the UI treats the flag
  // as independent (chat-preview: `config.useAccent || false`). The existing
  // accentColor → theme.colors.primary mirror above stays in place.
  const colorSys = candidate.colorSystem as AnyRecord;
  if (typeof src.useAccent === 'boolean') setIfAbsent(colorSys, 'useAccent', src.useAccent);
  if (isHex(src.accentColor)) setIfAbsent(colorSys, 'accentColor', src.accentColor);
  if (typeof src.useTintedGrayscale === 'boolean') setIfAbsent(colorSys, 'useTintedGrayscale', src.useTintedGrayscale);
  if (typeof src.tintHue === 'number') setIfAbsent(colorSys, 'tintHue', src.tintHue);
  if (typeof src.tintLevel === 'number') setIfAbsent(colorSys, 'tintLevel', src.tintLevel);
  if (typeof src.shadeLevel === 'number') setIfAbsent(colorSys, 'shadeLevel', src.shadeLevel);
  if (typeof src.useCustomSurfaceColors === 'boolean') setIfAbsent(colorSys, 'useCustomSurfaceColors', src.useCustomSurfaceColors);
  if (isHex(src.surfaceBackgroundColor)) setIfAbsent(colorSys, 'surfaceBackgroundColor', src.surfaceBackgroundColor);
  if (isHex(src.surfaceForegroundColor)) setIfAbsent(colorSys, 'surfaceForegroundColor', src.surfaceForegroundColor);
  if (typeof src.useCustomTextColor === 'boolean') setIfAbsent(colorSys, 'useCustomTextColor', src.useCustomTextColor);
  if (isHex(src.customTextColor)) setIfAbsent(colorSys, 'customTextColor', src.customTextColor);
  if (typeof src.useCustomIconColor === 'boolean') setIfAbsent(colorSys, 'useCustomIconColor', src.useCustomIconColor);
  if (isHex(src.customIconColor)) setIfAbsent(colorSys, 'customIconColor', src.customIconColor);
  if (typeof src.useCustomUserMessageColors === 'boolean') setIfAbsent(colorSys, 'useCustomUserMessageColors', src.useCustomUserMessageColors);
  if (isHex(src.customUserMessageTextColor)) setIfAbsent(colorSys, 'customUserMessageTextColor', src.customUserMessageTextColor);
  if (isHex(src.customUserMessageBackgroundColor)) setIfAbsent(colorSys, 'customUserMessageBackgroundColor', src.customUserMessageBackgroundColor);

  // useAccent backstop (legacy path only — v2-tagged configs never reach here):
  // colorSystem.useAccent defaults TRUE in the canonical schema, but the OLD
  // runtime translate emitted an accent ONLY when the stored config carried an
  // explicit truthy `useAccent` flag (`if (dbConfig.useAccent && dbConfig.accentColor)`).
  // A legacy config with no flag — including one that has an accentColor but no
  // flag — never showed an accent. Letting the schema default win would repaint
  // those widgets #0ea5e9 (launcher/send/bubbles) on live embeds. So: unless the
  // source set useAccent explicitly (flat key or structured colorSystem.useAccent,
  // both already written into colorSys above when present), pin it to false.
  // Configurator-created configs always store the flag explicitly, and fresh
  // configs from createDefaultConfig are parsed from {} (not migrated), so both
  // still get the schema default of true.
  setIfAbsent(colorSys, 'useAccent', false);

  // Playground style (flat radius/density → theme.radius/theme.density)
  if (typeof src.radius === 'string') setIfAbsent(candidate.theme as AnyRecord, 'radius', src.radius);
  if (typeof src.density === 'string') setIfAbsent(candidate.theme as AnyRecord, 'density', src.density);

  // Custom font (flat useCustomFont/customFontName/customFontCss → theme.typography.*)
  if (
    typeof src.useCustomFont === 'boolean' ||
    typeof src.customFontName === 'string' ||
    typeof src.customFontCss === 'string'
  ) {
    const typography = ensureOwnObject(candidate.theme as AnyRecord, 'typography');
    if (typeof src.useCustomFont === 'boolean') setIfAbsent(typography, 'useCustomFont', src.useCustomFont);
    if (typeof src.customFontName === 'string') setIfAbsent(typography, 'customFontName', src.customFontName);
    if (typeof src.customFontCss === 'string') setIfAbsent(typography, 'customFontCss', src.customFontCss);
  }

  // Inline embed dimensions (flat inlineWidth/inlineHeight → theme.size.*)
  if (typeof src.inlineWidth === 'number' || typeof src.inlineHeight === 'number') {
    const size = ensureOwnObject(candidate.theme as AnyRecord, 'size');
    if (typeof src.inlineWidth === 'number') setIfAbsent(size, 'inlineWidth', src.inlineWidth);
    if (typeof src.inlineHeight === 'number') setIfAbsent(size, 'inlineHeight', src.inlineHeight);
  }

  // ChatKit (flat chatkit* + enableModelPicker → chatkit.* with prefix stripped)
  const ck = candidate.chatkit as AnyRecord;
  if (typeof src.chatkitGrayscaleHue === 'number') setIfAbsent(ck, 'grayscaleHue', src.chatkitGrayscaleHue);
  if (typeof src.chatkitGrayscaleTint === 'number') setIfAbsent(ck, 'grayscaleTint', src.chatkitGrayscaleTint);
  if (typeof src.chatkitGrayscaleShade === 'number') setIfAbsent(ck, 'grayscaleShade', src.chatkitGrayscaleShade);
  if (isHex(src.chatkitAccentPrimary)) setIfAbsent(ck, 'accentPrimary', src.chatkitAccentPrimary);
  if (typeof src.chatkitAccentLevel === 'number') setIfAbsent(ck, 'accentLevel', src.chatkitAccentLevel);
  if (typeof src.enableModelPicker === 'boolean') setIfAbsent(ck, 'enableModelPicker', src.enableModelPicker);

  // PDF lightbox (flat enablePdfLightbox → features.pdfLightbox)
  if (typeof src.enablePdfLightbox === 'boolean') {
    setIfAbsent(candidate.features as AnyRecord, 'pdfLightbox', src.enablePdfLightbox);
  }

  // Custom CSS (flat customCss → advanced.customCss; structured advanced.customCss wins)
  if (typeof src.customCss === 'string') {
    setIfAbsent(candidate.advanced as AnyRecord, 'customCss', src.customCss);
  }

  // ChatKit/AgentKit credentials (legacy flat agentKitWorkflowId/agentKitApiKey
  // → connection.workflowId/apiKey; structured connection values win)
  if (typeof src.agentKitWorkflowId === 'string') {
    setIfAbsent(candidate.connection as AnyRecord, 'workflowId', src.agentKitWorkflowId);
  }
  if (typeof src.agentKitApiKey === 'string') {
    setIfAbsent(candidate.connection as AnyRecord, 'apiKey', src.agentKitApiKey);
  }

  return lenientParse(candidate);
}
