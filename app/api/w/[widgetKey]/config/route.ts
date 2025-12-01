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
import type { WidgetConfig } from '@/widget/src/types';

/**
 * Translate database config to widget format
 * Same translation logic as the legacy config endpoint
 */
function translateConfig(dbConfig: any, requestUrl: string, widgetKey: string, userTier: string): WidgetConfig {
  // Map theme mode
  let themeMode = 'light';
  if (dbConfig.themeMode) {
    themeMode = dbConfig.themeMode === 'dark' ? 'dark' : 'light';
  } else if (dbConfig.style?.theme) {
    themeMode = dbConfig.style.theme === 'dark' ? 'dark' : 'light';
  }

  // Calculate primary color
  let primaryColor = '#0066FF';
  if (dbConfig.useAccent && dbConfig.accentColor) {
    primaryColor = dbConfig.accentColor;
  } else if (dbConfig.style?.primaryColor) {
    primaryColor = dbConfig.style.primaryColor;
  }

  // Calculate background color
  let backgroundColor = themeMode === 'dark' ? '#1a1a1a' : '#ffffff';
  if (dbConfig.useCustomSurfaceColors && dbConfig.surfaceBackgroundColor) {
    backgroundColor = dbConfig.surfaceBackgroundColor;
  } else if (dbConfig.style?.backgroundColor) {
    backgroundColor = dbConfig.style.backgroundColor;
  }

  // Calculate text color
  let textColor = themeMode === 'dark' ? '#e5e5e5' : '#111827';
  if (dbConfig.useCustomTextColor && dbConfig.customTextColor) {
    textColor = dbConfig.customTextColor;
  } else if (dbConfig.style?.textColor) {
    textColor = dbConfig.style.textColor;
  }

  // Get radius option
  const radius = dbConfig.radius || 'medium';
  const radiusMap: Record<string, number> = {
    'none': 0,
    'small': 6,
    'medium': 12,
    'large': 18,
    'pill': 24
  };
  const cornerRadius = radiusMap[radius] || dbConfig.style?.cornerRadius || 12;

  // Get webhook URL
  const webhookUrl = dbConfig.n8nWebhookUrl || dbConfig.connection?.webhookUrl || '';

  // Build theme configuration
  const theme: WidgetConfig['theme'] = {
    colorScheme: themeMode as 'light' | 'dark',
    radius: radius as 'none' | 'small' | 'medium' | 'large' | 'pill',
    density: (dbConfig.density || 'normal') as 'compact' | 'normal' | 'spacious',
  };

  // Typography
  if (dbConfig.fontFamily || dbConfig.fontSize || dbConfig.customFontCss) {
    theme.typography = {
      fontFamily: dbConfig.fontFamily || 'system-ui',
      baseSize: dbConfig.fontSize || 16,
    };
    if (dbConfig.customFontCss) {
      theme.typography.fontSources = [{
        family: dbConfig.fontFamily || 'Custom',
        src: dbConfig.customFontCss,
      }];
    }
  }

  // Colors
  theme.color = {};

  if (dbConfig.useTintedGrayscale || dbConfig.tintHue !== undefined || dbConfig.grayHue !== undefined) {
    theme.color.grayscale = {
      hue: dbConfig.tintHue ?? dbConfig.grayHue ?? 220,
      tint: dbConfig.tintLevel ?? dbConfig.grayTint ?? 10,
      shade: dbConfig.shadeLevel ?? dbConfig.grayShade ?? 50,
    };
  }

  if (dbConfig.useAccent && dbConfig.accentColor) {
    theme.color.accent = {
      primary: dbConfig.accentColor,
      level: dbConfig.accentLevel ?? 1,
    };
  }

  if (dbConfig.useCustomSurfaceColors && (dbConfig.surfaceBackgroundColor || dbConfig.surfaceForegroundColor)) {
    theme.color.surface = {
      background: dbConfig.surfaceBackgroundColor || backgroundColor,
      foreground: dbConfig.surfaceForegroundColor || (themeMode === 'dark' ? '#2a2a2a' : '#f8fafc'),
    };
  }

  if (dbConfig.iconColor) {
    theme.color.icon = dbConfig.iconColor;
  }

  if (dbConfig.useCustomUserMessageColors && (dbConfig.userMessageTextColor || dbConfig.userMessageBgColor)) {
    theme.color.userMessage = {
      text: dbConfig.userMessageTextColor || '#ffffff',
      background: dbConfig.userMessageBgColor || primaryColor,
    };
  }

  // Start screen
  let startScreen: WidgetConfig['startScreen'];
  if (dbConfig.greeting || (dbConfig.starterPrompts && dbConfig.starterPrompts.length > 0)) {
    startScreen = {
      greeting: dbConfig.greeting,
      prompts: dbConfig.starterPrompts?.map((p: any) => ({
        label: typeof p === 'string' ? p : p.label,
        icon: typeof p === 'object' ? p.icon : undefined,
        prompt: typeof p === 'object' ? (p.prompt || p.label) : p,
      })),
    };
  }

  // Composer
  let composer: WidgetConfig['composer'];
  if (dbConfig.placeholder || dbConfig.disclaimer || dbConfig.enableAttachments) {
    composer = {
      placeholder: dbConfig.placeholder || 'Type your message...',
      disclaimer: dbConfig.disclaimer,
    };
    if (dbConfig.enableAttachments) {
      composer.attachments = {
        enabled: true,
        maxSize: dbConfig.maxFileSize || 5 * 1024 * 1024,
        maxCount: dbConfig.maxFileCount || 5,
        accept: dbConfig.allowedExtensions || ['pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg'],
      };
    }
  }

  return {
    widgetId: dbConfig.widgetId,
    // Schema v2.0: Use widgetKey as the license key
    license: {
      key: widgetKey,
      active: true,
      plan: userTier
    },
    branding: {
      companyName: dbConfig.branding?.companyName || 'Chat Assistant',
      logoUrl: dbConfig.branding?.logoUrl,
      welcomeText: dbConfig.greeting || dbConfig.branding?.welcomeText || 'How can I help you today?',
      firstMessage: dbConfig.branding?.firstMessage || '',
    },
    style: {
      position: dbConfig.style?.position || 'bottom-right',
    },
    features: {
      fileAttachmentsEnabled: dbConfig.enableAttachments || dbConfig.features?.fileAttachments || false,
      allowedExtensions: dbConfig.features?.allowedExtensions || ['pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg'],
      maxFileSizeKB: dbConfig.features?.maxFileSize || 5120,
    },
    connection: {
      webhookUrl: webhookUrl,
      relayEndpoint: `${new URL(requestUrl).origin}/api/chat-relay`,
    },
    agentKit: dbConfig.enableAgentKit ? {
      enabled: true,
      relayEndpoint: `${new URL(requestUrl).origin}/api/chat-relay/openai`,
      hasWorkflowId: !!dbConfig.agentKitWorkflowId,
      hasApiKey: !!dbConfig.agentKitApiKey,
    } : {
      enabled: false,
    },
    theme,
    startScreen,
    composer,
    advancedStyling: dbConfig.advancedStyling,
    behavior: dbConfig.behavior,
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

    // Check domain restrictions
    const origin = request.headers.get('origin');
    const allowedDomains = (widget as any).allowedDomains || [];
    const userTier = user.tier || 'free';

    if (origin && allowedDomains.length > 0 && userTier !== 'agency') {
      const domain = new URL(origin).hostname;
      const normalizedDomain = normalizeDomain(domain);
      const isAllowed = normalizedDomain === 'localhost' || allowedDomains.some((d: string) => {
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

    // Translate config
    const dbConfig = widget.config as any;
    const config = translateConfig(
      {
        ...dbConfig,
        widgetId: widget.id,
      },
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
