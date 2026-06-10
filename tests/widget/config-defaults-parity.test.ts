/**
 * Widget Runtime Defaults Parity Test
 *
 * Asserts that widget/src/core/config.ts mergeConfig({}) fallback defaults align
 * with the values that the server's translateConfig() would produce for a canonical
 * schema default config (lib/widget-config/schema.ts chatWidgetConfigSchema.parse({})).
 *
 * WHY THIS TEST EXISTS
 * ────────────────────
 * The widget bundle cannot import lib/widget-config/schema.ts (Zod would bloat the
 * bundle). So widget/src/core/config.ts duplicates certain defaults as literals,
 * with a comment saying they must mirror the canonical schema. This test is the
 * machine-enforceable guard for that constraint.
 *
 * SCOPE: only fields where the server translateConfig() reads from canonical defaults
 * and the widget mergeConfig() provides a fallback for the same semantic value.
 * Fields with no canonical counterpart (style.primaryColor, style.backgroundColor,
 * connection.captureContext, etc.) are tested for their local defaults only.
 *
 * NOTE: this file uses @/... paths (resolved by jest.config.js moduleNameMapper).
 * It imports Zod schema types for the test; that is fine — the TEST can import Zod,
 * only the BUNDLE cannot.
 */

import { chatWidgetConfigSchema, type ChatWidgetConfig } from '@/lib/widget-config/schema';
import { mergeConfig } from '@/widget/src/core/config';
import { normalizeMaxFileSizeKB } from '@/widget/src/widget';
import type { WidgetConfig } from '@/widget/src/types';

describe('widget runtime defaults parity with canonical schema', () => {
  let canonical: ChatWidgetConfig;
  let runtime: WidgetConfig;

  beforeAll(() => {
    canonical = chatWidgetConfigSchema.parse({});
    runtime = mergeConfig({});
  });

  // ── Branding ────────────────────────────────────────────────────────────────
  // translateConfig() maps: cfg.branding.companyName → branding.companyName
  it('branding.companyName matches canonical brandingSchema default', () => {
    expect(runtime.branding.companyName).toBe(canonical.branding.companyName);
  });

  // translateConfig() maps: cfg.branding.welcomeText → branding.welcomeText
  it('branding.welcomeText matches canonical brandingSchema default', () => {
    expect(runtime.branding.welcomeText).toBe(canonical.branding.welcomeText);
  });

  // translateConfig() maps: cfg.branding.firstMessage → branding.firstMessage
  it('branding.firstMessage matches canonical brandingSchema default', () => {
    expect(runtime.branding.firstMessage).toBe(canonical.branding.firstMessage);
  });

  // ── Style / Position ────────────────────────────────────────────────────────
  // translateConfig() maps: cfg.theme.position.position → style.position
  it('style.position matches canonical positionSchema default', () => {
    expect(runtime.style).toBeDefined();
    expect(runtime.style?.position).toBe(canonical.theme.position.position);
  });

  // translateConfig() maps: cfg.theme.typography.fontSize → theme.typography.baseSize
  // Widget reads fontSize from style.fontSize as a fallback.
  it('style.fontSize matches canonical typographySchema default', () => {
    expect(runtime.style).toBeDefined();
    expect(runtime.style?.fontSize).toBe(canonical.theme.typography.fontSize);
  });

  // ── Features ────────────────────────────────────────────────────────────────
  // translateConfig() maps: cfg.features.attachments.enabled → features.fileAttachmentsEnabled
  it('features.fileAttachmentsEnabled matches canonical attachmentsSchema default', () => {
    expect(runtime.features.fileAttachmentsEnabled).toBe(canonical.features.attachments.enabled);
  });

  // translateConfig() maps: cfg.features.attachments.allowedExtensions → features.allowedExtensions
  it('features.allowedExtensions matches canonical attachmentsSchema default', () => {
    expect(runtime.features.allowedExtensions).toEqual(canonical.features.attachments.allowedExtensions);
  });

  // translateConfig() maps: cfg.features.attachments.maxFileSizeMB * 1024 → features.maxFileSizeKB
  it('features.maxFileSizeKB equals canonical maxFileSizeMB * 1024', () => {
    expect(runtime.features.maxFileSizeKB).toBe(canonical.features.attachments.maxFileSizeMB * 1024);
  });

  // ── Connection (server-only defaults — no canonical counterpart in runtime) ─
  // connection.captureContext is a local default only; canonical has it but it's not
  // sent in the translated runtime payload. Test local value only.
  it('connection.captureContext local default is true', () => {
    expect(runtime.connection?.captureContext).toBe(true);
  });

  // ── Snapshot guard ──────────────────────────────────────────────────────────
  // Locks down mergeConfig({}) shape so diffs are visible in PR review.
  it('mergeConfig({}) branding snapshot', () => {
    expect(runtime.branding).toEqual({
      companyName: 'My Company',
      welcomeText: 'Welcome! How can we help you today?',
      firstMessage: 'Hello! How can I assist you today?',
    });
  });

  it('mergeConfig({}) features snapshot', () => {
    expect(runtime.features).toEqual({
      fileAttachmentsEnabled: false,
      allowedExtensions: [],
      maxFileSizeKB: 10240,
    });
  });
});

describe('widget.ts normalizeMaxFileSizeKB (createChatWidget normalisation path)', () => {
  let canonical: ChatWidgetConfig;

  beforeAll(() => {
    canonical = chatWidgetConfigSchema.parse({});
  });

  // C-02 guard: when neither composer.attachments.maxSize nor
  // features.maxFileSizeKB is present, the fallback must be the canonical
  // default (maxFileSizeMB 10 × 1024 = 10240), NOT a stale literal.
  it('falls back to canonical 10240 KB when config lacks features.maxFileSizeKB', () => {
    expect(normalizeMaxFileSizeKB({})).toBe(10240);
    expect(normalizeMaxFileSizeKB({})).toBe(canonical.features.attachments.maxFileSizeMB * 1024);
  });

  it('falls back to 10240 when features exists but maxFileSizeKB is absent', () => {
    expect(
      normalizeMaxFileSizeKB({
        features: { fileAttachmentsEnabled: true, allowedExtensions: ['.pdf'] } as never,
      })
    ).toBe(10240);
  });

  it('prefers composer.attachments.maxSize (bytes → KB) over the legacy path', () => {
    expect(
      normalizeMaxFileSizeKB({
        composer: { attachments: { enabled: true, maxSize: 2048 * 1024 } },
        features: { fileAttachmentsEnabled: true, allowedExtensions: [], maxFileSizeKB: 512 },
      })
    ).toBe(2048);
  });

  it('uses explicit features.maxFileSizeKB when composer maxSize is absent', () => {
    expect(
      normalizeMaxFileSizeKB({
        features: { fileAttachmentsEnabled: true, allowedExtensions: [], maxFileSizeKB: 512 },
      })
    ).toBe(512);
  });

  // ?? semantics: an explicit 0 is passed through (0 is invalid upstream, but
  // the normaliser must not silently rewrite explicit values).
  it('does not clobber an explicit 0 (?? not ||)', () => {
    expect(
      normalizeMaxFileSizeKB({
        features: { fileAttachmentsEnabled: false, allowedExtensions: [], maxFileSizeKB: 0 },
      })
    ).toBe(0);
  });
});
