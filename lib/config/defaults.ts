/**
 * @deprecated Import from '@/lib/widget-config' instead. Kept as a re-export shim.
 *
 * The canonical default factory is createDefaultConfig in lib/widget-config/defaults.ts.
 * All helpers below are thin wrappers that extract sections from the canonical defaults.
 */
export { createDefaultConfig } from '@/lib/widget-config/defaults';

import { createDefaultConfig } from '@/lib/widget-config/defaults';
import type {
  BrandingConfig,
  ThemeConfig,
  BehaviorConfig,
  ConnectionConfig,
  FeaturesConfig,
} from '@/lib/widget-config/schema';

type ClassicTier = 'basic' | 'pro' | 'agency';

/** @deprecated Use createDefaultConfig from '@/lib/widget-config' instead. */
export function createDefaultBranding(tier: ClassicTier): BrandingConfig {
  return createDefaultConfig(tier, 'chat').branding;
}

/** @deprecated Use createDefaultConfig from '@/lib/widget-config' instead. */
export function createDefaultTheme(tier: ClassicTier): ThemeConfig {
  return createDefaultConfig(tier, 'chat').theme;
}

/** @deprecated Use createDefaultConfig from '@/lib/widget-config' instead. */
export function createDefaultBehavior(tier: ClassicTier): BehaviorConfig {
  return createDefaultConfig(tier, 'chat').behavior;
}

/** @deprecated Use createDefaultConfig from '@/lib/widget-config' instead. */
export function createDefaultConnection(): ConnectionConfig {
  return createDefaultConfig('basic', 'chat').connection;
}

/** @deprecated Use createDefaultConfig from '@/lib/widget-config' instead. */
export function createDefaultFeatures(tier: ClassicTier): FeaturesConfig {
  return createDefaultConfig(tier, 'chat').features;
}
