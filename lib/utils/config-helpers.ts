/**
 * Configuration Helper Functions
 *
 * Shared utilities for widget configuration manipulation.
 * Used by both widget creation and update API routes.
 */

// Re-export the canonical shared deepMerge so existing call sites keep working.
// The old inline implementation assigned `undefined` values (incorrectly clobbering
// base values); the shared one skips `undefined`, which is the correct semantics.
export { deepMerge } from '@/lib/utils/deep-merge';
import { TIER_LIMITS, normalizeUserTier } from '@/lib/license/tiers';

/**
 * Sanitize configuration to ensure it passes validation
 * Handles legacy data, invalid formats, and tier restrictions
 *
 * @param config - The widget configuration to sanitize
 * @param tier - Subscription tier for restriction enforcement
 * @param kind - Widget kind ('chat' | 'display'). Defaults to 'chat' for backward compatibility.
 *               Chat-only transformations (launcherIcon, advancedStyling) are skipped
 *               when kind === 'display' to avoid injecting chat fields into display configs.
 *
 * NOTE: this function repairs invalid data (bad hex, http URLs, tier violations).
 * It must NOT supply defaults — those live in exactly one place, the canonical
 * Zod schema (lib/widget-config/schema.ts), and sanitize runs before safeParse.
 */
export function sanitizeConfig(config: any, tier: string, kind: 'chat' | 'display' = 'chat'): any {
  const sanitized = JSON.parse(JSON.stringify(config)); // Deep clone

  // Helper to fix hex colors
  const fixColor = (color: any, defaultColor: string = '#000000') => {
    if (!color || typeof color !== 'string') return defaultColor;
    // Fix 3-digit hex
    if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
      return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    }
    // Return if valid 6-digit hex
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color;
    return defaultColor;
  };

  // Helper to fix URLs
  const fixUrl = (url: any) => {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('http://')) return url.replace('http://', 'https://');
    if (url.startsWith('https://') || url.includes('localhost')) return url;
    return null;
  };

  // 1. Tier Restrictions — enforce via the central entitlements module.
  if (!TIER_LIMITS[normalizeUserTier(tier)].brandingRemovable) {
    // advancedStyling and features are chat-only; guard ensures no-op for display configs
    if (kind === 'chat') {
      if (sanitized.advancedStyling) sanitized.advancedStyling.enabled = false;
      if (sanitized.features) {
        sanitized.features.emailTranscript = false;
        sanitized.features.ratingPrompt = false;
      }
    }
    if (sanitized.branding) sanitized.branding.brandingEnabled = true;
  }

  // 2. Data Integrity - Branding
  if (sanitized.branding) {
    // companyName / firstMessage fallbacks intentionally removed: sanitize runs
    // BEFORE safeParse, so hardcoding values here suppressed the canonical
    // schema defaults (same divergence class as the welcomeText fix). Let the
    // schema apply them.

    // welcomeText and firstMessage are chat-only branding fields.
    // Injecting them into a display config would add unexpected fields and corrupt validation.
    if (kind === 'chat') {
      // welcomeText fallback intentionally removed: it diverged from the canonical
      // schema default ('Welcome! How can we help you today?') and, since sanitize
      // runs before safeParse, suppressed the schema default. Let the schema apply it.

      // Fix launcher icon (chat-only concept)
      if (sanitized.branding.launcherIcon === 'custom') {
        const validUrl = fixUrl(sanitized.branding.customLauncherIconUrl);
        if (!validUrl) {
          sanitized.branding.launcherIcon = 'chat'; // Revert to default if URL invalid
          sanitized.branding.customLauncherIconUrl = null;
        } else {
          sanitized.branding.customLauncherIconUrl = validUrl;
        }
      } else {
        // Ensure it's null if not custom, to avoid validation errors
        sanitized.branding.customLauncherIconUrl = null;
      }
    }

    sanitized.branding.logoUrl = fixUrl(sanitized.branding.logoUrl);
  }

  // 3. Data Integrity - Colors (Recursive fix for all color fields)
  const fixColorsInObject = (obj: any) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].startsWith('#')) {
        obj[key] = fixColor(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        fixColorsInObject(obj[key]);
      }
    }
  };

  if (sanitized.theme) fixColorsInObject(sanitized.theme);
  if (sanitized.advancedStyling) fixColorsInObject(sanitized.advancedStyling);

  // 4. Theme Mode
  if (sanitized.themeMode && !['light', 'dark'].includes(sanitized.themeMode)) {
    delete sanitized.themeMode; // Let it fall back to default
  }

  return sanitized;
}

/**
 * Forces configuration to use the n8n provider.
 * Used when ChatKit/Agent mode is disabled behind feature flags.
 */
export function forceN8nProviderConfig(config: any): any {
  const normalized = JSON.parse(JSON.stringify(config ?? {}));

  const connection =
    normalized.connection && typeof normalized.connection === 'object'
      ? normalized.connection
      : {};

  connection.provider = 'n8n';
  delete connection.workflowId;
  delete connection.apiKey;
  normalized.connection = connection;

  // Legacy AgentKit fields (flat config shape)
  if ('enableAgentKit' in normalized) {
    normalized.enableAgentKit = false;
  }
  delete normalized.agentKitWorkflowId;
  delete normalized.agentKitApiKey;

  // Runtime-only server response shape (defensive cleanup)
  delete normalized.agentKit;

  return normalized;
}
