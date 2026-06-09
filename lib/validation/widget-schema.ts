/**
 * @deprecated Import from '@/lib/widget-config' instead. Kept as a re-export shim.
 *
 * The canonical schemas live in lib/widget-config/schema.ts.
 * All export names from this file are preserved as aliases so existing imports compile.
 *
 * BEHAVIORAL NOTE: widgetConfigBaseSchema was previously a permissive passthrough
 * schema that accepted legacy config shapes. It now aliases chatWidgetConfigSchema,
 * which is the canonical strict schema (all fields have defaults, but legacy shapes
 * like { style: {...} } are stripped rather than tolerated). Route handlers that
 * ingest raw DB configs should call migrateConfig() first — that is Task 5's job.
 */
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

// Additional type aliases that callers may import — all backed by canonical types.
export type {
  BrandingConfig as BrandingInput,
  ThemeConfig as ThemeInput,
  AdvancedStylingConfig as AdvancedStylingInput,
  BehaviorConfig as BehaviorInput,
  ConnectionConfig as ConnectionInput,
  FeaturesConfig as FeaturesInput,
} from '@/lib/widget-config/schema';

export type { DisplayWidgetConfig } from './display-widget-schema';

// PlaygroundConfigInput and StarterPromptInput had no callers outside test files.
// Inline stub types keep the names compile-able if referenced.
export type PlaygroundConfigInput = Record<string, unknown>;
export type StarterPromptInput = { label: string; icon: string };
