/**
 * Widget Config Route (v2.0)
 *
 * Purpose: Serve widget configuration using widgetKey
 * Route: GET /w/:widgetKey/config
 *
 * Returns the translated widget configuration for the embeddable widget
 * to consume. Uses the new widgetKey instead of licenseKey.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWidgetByKeyWithUser } from '@/lib/db/queries';
import { isValidWidgetKey } from '@/lib/embed';
import type { WidgetConfig } from '@/widget/src/types';

/**
 * Translate the database config to widget format
 * Same translation logic as the legacy endpoint
 */
function translateConfig(dbConfig: any, requestUrl: string, userTier: string): WidgetConfig {
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

  // Get radius
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

  // Build extended theme configuration
  const theme: WidgetConfig['theme'] = {
    colorScheme: themeMode as 'light' | 'dark',
    radius: radius as 'none' | 'small' | 'medium' | 'large' | 'pill',
    density: (dbConfig.density || 'normal') as 'compact' | 'normal' | 'spacious',
  };

  // Typography configuration
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

  // Color configuration
  theme.color = {};

  // Grayscale with tinted hue
  if (dbConfig.useTintedGrayscale || dbConfig.tintHue !== undefined || dbConfig.grayHue !== undefined) {
    theme.color.grayscale = {
      hue: dbConfig.tintHue ?? dbConfig.grayHue ?? 220,
      tint: dbConfig.tintLevel ?? dbConfig.grayTint ?? 10,
      shade: dbConfig.shadeLevel ?? dbConfig.grayShade ?? 50,
    };
  }

  // Accent colors
  if (dbConfig.useAccent && dbConfig.accentColor) {
    theme.color.accent = {
      primary: dbConfig.accentColor,
      level: dbConfig.accentLevel ?? 1,
    };
  }

  // Surface colors
  if (dbConfig.useCustomSurfaceColors && (dbConfig.surfaceBackgroundColor || dbConfig.surfaceForegroundColor)) {
    theme.color.surface = {
      background: dbConfig.surfaceBackgroundColor || backgroundColor,
      foreground: dbConfig.surfaceForegroundColor || (themeMode === 'dark' ? '#2a2a2a' : '#f8fafc'),
    };
  }

  // Icon color (for subText/icon coloring)
  if (dbConfig.useCustomIconColor && dbConfig.customIconColor) {
    theme.color.icon = dbConfig.customIconColor;
  } else if (dbConfig.iconColor) {
    theme.color.icon = dbConfig.iconColor;
  }

  // Custom text color
  if (dbConfig.useCustomTextColor && dbConfig.customTextColor) {
    theme.color.text = dbConfig.customTextColor;
  }

  // User message colors
  if (dbConfig.useCustomUserMessageColors && (dbConfig.userMessageTextColor || dbConfig.userMessageBgColor)) {
    theme.color.userMessage = {
      text: dbConfig.userMessageTextColor || '#ffffff',
      background: dbConfig.userMessageBgColor || primaryColor,
    };
  }

  // Build start screen configuration
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

  // Build composer configuration
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
    license: dbConfig.license,
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

    // Validate widget key format
    if (!widgetKey || !isValidWidgetKey(widgetKey)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid widget key' }),
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
      return new NextResponse(
        JSON.stringify({ error: 'Widget not found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Check user subscription status (default to 'active' if null for new users)
    const subscriptionStatus = widget.user.subscriptionStatus || 'active';
    if (subscriptionStatus !== 'active') {
      // Allow past_due for grace period
      if (subscriptionStatus !== 'past_due') {
        return new NextResponse(
          JSON.stringify({ error: 'Subscription is not active' }),
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

    // Check domain restrictions if applicable
    const origin = request.headers.get('origin');
    if (origin && widget.allowedDomains && widget.allowedDomains.length > 0) {
      const domain = new URL(origin).hostname;
      const isAllowed = domain === 'localhost' || widget.allowedDomains.some((d: string) =>
        domain === d || domain.endsWith('.' + d)
      );

      if (!isAllowed) {
        return new NextResponse(
          JSON.stringify({ error: `Domain not allowed: ${domain}` }),
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

    const dbConfig = widget.config as any;

    // Translate the config to widget format
    const config = translateConfig(
      {
        ...dbConfig,
        widgetId: widget.id,
        license: {
          key: widgetKey,
          active: true,
          plan: widget.user.tier || 'free'
        }
      },
      request.url,
      widget.user.tier || 'free'
    );

    return NextResponse.json(config, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=10, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Error fetching widget config:', error);
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
