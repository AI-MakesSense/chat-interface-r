/**
 * Widget Config Endpoint (Schema v2.0)
 *
 * GET /api/w/[widgetKey]/config
 *
 * Purpose: Return widget configuration for client-side initialization
 * Uses widgetKey instead of license key
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthorizedWidget } from '@/lib/widget/resolve-widget';
import { normalizeDomain } from '@/lib/license/domain';
import { CHATKIT_SERVER_ENABLED } from '@/lib/feature-flags';
import { migrateConfig } from '@/lib/widget-config/migrate';
import { translateDisplayConfig } from '@/lib/widget/translate-display-config';
import { COMPOSER_DEFAULT_PLACEHOLDER } from '@/lib/widget-config/schema';
import { getBundlePath } from '@/lib/widget/manifest';
import { TIER_LIMITS, normalizeUserTier } from '@/lib/license/tiers';
import type { WidgetConfig } from '@/widget/src/types';
import type { ChatWidgetConfig } from '@/lib/widget-config/schema';

/**
 * Translate a CANONICAL (schemaVersion 2) ChatWidgetConfig to the public WidgetConfig
 * runtime format. All fields are read exclusively from canonical paths — there are no
 * legacy-field fallbacks. Call migrateConfig() on the raw DB record before passing here.
 *
 * SECURITY: webhookUrl and apiKey are NEVER included in this output.
 */
function translateConfig(cfg: ChatWidgetConfig, requestUrl: string, widgetKey: string, userTier: string): WidgetConfig {
  // Theme mode: canonical theme.mode ('light' | 'dark' | 'auto')
  const themeMode: 'light' | 'dark' = cfg.theme.mode === 'dark' ? 'dark' : 'light';

  // Build theme configuration from canonical paths
  const theme: WidgetConfig['theme'] = {
    colorScheme: themeMode,
    radius: cfg.theme.radius,
    density: cfg.theme.density,
  };

  // Typography: canonical theme.typography.*
  const typo = cfg.theme.typography;
  if (typo.fontFamily !== 'system-ui' || typo.fontSize !== 14 || typo.customFontCss) {
    theme.typography = {
      fontFamily: typo.fontFamily,
      baseSize: typo.fontSize,
    };
    if (typo.useCustomFont && typo.customFontCss) {
      theme.typography.fontSources = [{
        family: typo.customFontName || typo.fontFamily,
        src: typo.customFontCss,
      }];
    }
  }

  // Colors: canonical colorSystem.*
  theme.color = {};
  const cs = cfg.colorSystem;

  if (cs.useTintedGrayscale) {
    theme.color.grayscale = {
      hue: cs.tintHue,
      tint: cs.tintLevel,
      shade: cs.shadeLevel,
    };
  }

  if (cs.useAccent) {
    theme.color.accent = {
      primary: cs.accentColor,
      level: cfg.chatkit.accentLevel,
    };
  }

  if (cs.useCustomSurfaceColors) {
    theme.color.surface = {
      background: cs.surfaceBackgroundColor,
      foreground: cs.surfaceForegroundColor,
    };
  }

  if (cs.useCustomIconColor) {
    theme.color.icon = cs.customIconColor;
  }

  if (cs.useCustomUserMessageColors) {
    theme.color.userMessage = {
      text: cs.customUserMessageTextColor,
      background: cs.customUserMessageBackgroundColor,
    };
  }

  // Start screen: canonical startScreen.*
  let startScreen: WidgetConfig['startScreen'];
  if (cfg.startScreen.greeting || cfg.startScreen.starterPrompts.length > 0) {
    startScreen = {
      greeting: cfg.startScreen.greeting || undefined,
      prompts: cfg.startScreen.starterPrompts.map((p) => ({
        label: p.label,
        icon: p.icon,
        // Match legacy translate: prefer the full prompt text when present
        prompt: p.prompt || p.label,
      })),
    };
  }

  // Composer: canonical composer.*
  let composer: WidgetConfig['composer'];
  const hasComposer = cfg.composer.placeholder !== COMPOSER_DEFAULT_PLACEHOLDER ||
    !!cfg.composer.disclaimer ||
    cfg.features.attachments.enabled;
  if (hasComposer) {
    composer = {
      placeholder: cfg.composer.placeholder,
      disclaimer: cfg.composer.disclaimer || undefined,
    };
    if (cfg.features.attachments.enabled) {
      composer.attachments = {
        enabled: true,
        maxSize: cfg.features.attachments.maxFileSizeMB * 1024 * 1024,
        maxCount: 5,
        accept: cfg.features.attachments.allowedExtensions,
      };
    }
  }

  return {
    widgetId: undefined, // not exposed in v2 (widgetKey is the identifier)
    license: {
      key: widgetKey,
      active: true,
      plan: userTier,
    },
    branding: {
      companyName: cfg.branding.companyName,
      logoUrl: cfg.branding.logoUrl ?? undefined,
      welcomeText: cfg.branding.welcomeText,
      firstMessage: cfg.branding.firstMessage,
    },
    style: {
      position: cfg.theme.position.position,
    },
    features: {
      fileAttachmentsEnabled: cfg.features.attachments.enabled,
      allowedExtensions: cfg.features.attachments.allowedExtensions,
      maxFileSizeKB: cfg.features.attachments.maxFileSizeMB * 1024,
    },
    connection: {
      relayEndpoint: `${new URL(requestUrl).origin}/api/chat-relay`,
    },
    agentKit: CHATKIT_SERVER_ENABLED && cfg.connection.provider === 'chatkit' ? {
      enabled: true,
      relayEndpoint: `${new URL(requestUrl).origin}/api/chat-relay/openai`,
      hasWorkflowId: !!cfg.connection.workflowId,
      hasApiKey: !!cfg.connection.apiKey,
    } : {
      enabled: false,
    },
    theme,
    startScreen,
    composer,
    advancedStyling: cfg.advancedStyling,
    behavior: cfg.behavior,
  };
}

/**
 * Extract a normalized request domain from Origin/Referer headers.
 * Returns null when both headers are absent or unparseable.
 */
function getRequestDomain(request: NextRequest): string | null {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const ctx = origin || referer;
  if (!ctx) return null;
  try {
    return normalizeDomain(new URL(ctx).hostname) || null;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetKey: string }> }
) {
  try {
    const { widgetKey } = await params;

    const requestDomain = getRequestDomain(request);
    const requestHost = request.headers.get('host') || '';

    const resolved = await resolveAuthorizedWidget(widgetKey, requestDomain, requestHost);

    if (!resolved.ok) {
      return NextResponse.json(
        { error: resolved.error },
        {
          status: resolved.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const { widget, user } = resolved;
    const userTier = user.tier || 'free';

    // Translate config.
    // For chat widgets: run migrateConfig first to normalize any legacy stored shape
    // to the canonical schemaVersion 2 form, then translate canonical paths only.
    // For display widgets: pass through to translateDisplayConfig unchanged.
    const dbConfig = widget.config as any;

    // brandingEnabled (license flag): the "Powered by" footer is forced ON unless the
    // user's tier may remove branding AND the stored config opts out. Mirrors the old
    // inject.ts flag derivation (license.brandingEnabled), but sourced from the central
    // entitlements module + canonical config instead of the legacy licenses row.
    let brandingEnabled = true;
    let uiConfig: WidgetConfig;

    if (widget.kind === 'display') {
      uiConfig = translateDisplayConfig(dbConfig, request.url);
      const tierBranding = TIER_LIMITS[normalizeUserTier(userTier)].brandingRemovable;
      brandingEnabled = tierBranding ? dbConfig?.branding?.brandingEnabled !== false : true;
    } else {
      const canonical = migrateConfig(dbConfig);
      uiConfig = translateConfig(canonical, request.url, widgetKey, userTier);
      const tierBranding = TIER_LIMITS[normalizeUserTier(userTier)].brandingRemovable;
      brandingEnabled = tierBranding ? canonical.branding.brandingEnabled : true;
    }

    const origin = new URL(request.url).origin;

    // Loader-compatible envelope (Task 16/17): the embed loader sets
    // window.ChatWidgetConfig = runtime, then injects origin + bundlePath. The runtime
    // shape { uiConfig, relay, flags } matches the legacy serve.ts/inject.ts injection
    // shape ({ uiConfig, relay }) plus an additive `flags` block.
    return NextResponse.json(
      {
        bundlePath: getBundlePath(),
        runtime: {
          uiConfig,
          relay: {
            relayUrl: `${origin}/api/chat-relay`,
            widgetId: widget.id,
            licenseKey: widget.widgetKey,
          },
          flags: {
            tier: userTier,
            brandingEnabled,
          },
        },
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60',
        },
      }
    );

  } catch (error) {
    console.error('[Widget Config v2] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
