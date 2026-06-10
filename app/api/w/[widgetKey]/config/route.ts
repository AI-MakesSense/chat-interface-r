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
import { getBundlePath } from '@/lib/widget/manifest';
import { TIER_LIMITS, normalizeUserTier } from '@/lib/license/tiers';
import { translateConfig } from '@/lib/widget/translate-config';
import type { WidgetConfig } from '@/widget/src/types';

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

    const resolved = await resolveAuthorizedWidget(widgetKey, requestDomain);

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
      uiConfig = translateConfig(canonical, new URL(request.url).origin, widgetKey, userTier, CHATKIT_SERVER_ENABLED);
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
          // Vary on Origin so a CDN never serves one origin's domain-authorized
          // config to a different origin within the max-age window.
          'Vary': 'Origin',
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
