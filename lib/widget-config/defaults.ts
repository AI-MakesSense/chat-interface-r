/**
 * Default Config Factory
 *
 * Purpose: The ONLY place defaults are produced. Derived from the canonical
 * schema (schema.parse({})) with tier-specific adjustments layered on top.
 *
 * All other modules that previously produced defaults are now deprecated
 * re-export shims pointing here.
 */
import { chatWidgetConfigSchema, type ChatWidgetConfig } from './schema';
import { createDefaultDisplayConfig, type DisplayWidgetConfig } from '@/lib/validation/display-widget-schema';

export type InputTier = 'free' | 'basic' | 'pro' | 'agency';

export function createDefaultConfig(tier: InputTier, kind?: 'chat'): ChatWidgetConfig;
export function createDefaultConfig(tier: InputTier, kind: 'display'): DisplayWidgetConfig & { kind: 'display' };
export function createDefaultConfig(
  tier: InputTier,
  kind: 'chat' | 'display'
): ChatWidgetConfig | (DisplayWidgetConfig & { kind: 'display' });
export function createDefaultConfig(
  tier: InputTier,
  kind: 'chat' | 'display' = 'chat'
): ChatWidgetConfig | (DisplayWidgetConfig & { kind: 'display' }) {
  if (!['free', 'basic', 'pro', 'agency'].includes(tier)) {
    throw new Error(`Invalid tier: ${tier}. Must be 'free', 'basic', 'pro', or 'agency'`);
  }
  if (kind === 'display') return createDefaultDisplayConfig(tier);

  const effective = tier === 'free' ? 'basic' : tier;
  const cfg = chatWidgetConfigSchema.parse({});
  const premium = effective === 'pro' || effective === 'agency';
  cfg.branding.brandingEnabled = !premium;
  cfg.advancedStyling.enabled = premium;
  cfg.features.emailTranscript = premium;
  cfg.features.ratingPrompt = premium;
  return cfg;
}
