/**
 * Widget Config Endpoint (Schema v2.0)
 *
 * GET /api/w/[widgetKey]/config
 *
 * Purpose: Return widget configuration for client-side initialization
 * Uses widgetKey instead of license key
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWidgetByKeyWithUser } from '@/lib/db/queries';
import { normalizeDomain } from '@/lib/license/domain';
import { CHATKIT_SERVER_ENABLED } from '@/lib/feature-flags';
import { migrateConfig } from '@/lib/widget-config/migrate';
import { translateDisplayConfig } from '@/lib/widget/translate-display-config';
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
        prompt: p.label,
      })),
    };
  }

  // Composer: canonical composer.*
  let composer: WidgetConfig['composer'];
  const hasComposer = cfg.composer.placeholder !== 'Type your message...' ||
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetKey: string }> }
) {
  try {
    const { widgetKey } = await params;

    // Validate widgetKey format
    if (!widgetKey || !/^[A-Za-z0-9]{16}$/.test(widgetKey)) {
      return NextResponse.json(
        { error: 'Invalid widget key format' },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Fetch widget with user data
    const widget = await getWidgetByKeyWithUser(widgetKey);

    if (!widget) {
      return NextResponse.json(
        { error: 'Widget not found' },
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    if (widget.status !== 'active') {
      return NextResponse.json(
        { error: 'Widget is not active' },
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Check user subscription status
    const user = widget.user as any;
    const subscriptionStatus = user.subscriptionStatus || 'active';
    const currentPeriodEnd = user.currentPeriodEnd;

    if (subscriptionStatus === 'canceled') {
      if (!currentPeriodEnd || new Date(currentPeriodEnd) <= new Date()) {
        return NextResponse.json(
          { error: 'Subscription expired' },
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
    }

    // Fail closed: require origin context for public config access.
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const originContext = origin || referer;
    if (!originContext) {
      return NextResponse.json(
        { error: 'Origin or referer header is required' },
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    let domain = '';
    try {
      domain = new URL(originContext).hostname;
    } catch {
      return NextResponse.json(
        { error: 'Invalid origin or referer header' },
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Check domain restrictions
    const allowedDomains = (widget as any).allowedDomains || [];
    const userTier = user.tier || 'free';

    if (allowedDomains.length > 0 && userTier !== 'agency') {
      const normalizedDomain = normalizeDomain(domain);
      const requestHost = normalizeDomain((request.headers.get('host') || '').split(':')[0] || '');
      const isFirstPartyOrigin =
        normalizedDomain !== 'unknown' &&
        requestHost !== 'unknown' &&
        normalizedDomain === requestHost;
      const isAllowed = isFirstPartyOrigin || normalizedDomain === 'localhost' || allowedDomains.some((d: string) => {
        const normalizedAllowed = normalizeDomain(d);
        return normalizedDomain === normalizedAllowed ||
          normalizedDomain.endsWith('.' + normalizedAllowed);
      });

      if (!isAllowed) {
        return NextResponse.json(
          { error: `Domain not allowed: ${domain}` },
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
    }

    // Translate config.
    // For chat widgets: run migrateConfig first to normalize any legacy stored shape
    // to the canonical schemaVersion 2 form, then translate canonical paths only.
    // For display widgets: pass through to translateDisplayConfig unchanged.
    const dbConfig = widget.config as any;
    const config =
      widget.kind === 'display'
        ? translateDisplayConfig(dbConfig, request.url)
        : translateConfig(
            migrateConfig(dbConfig),
            request.url,
            widgetKey,
            userTier
          );

    return NextResponse.json(config, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=10, must-revalidate',
      },
    });

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
