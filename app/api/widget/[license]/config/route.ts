import { NextRequest, NextResponse } from 'next/server';
import { getLicenseByKey, getWidgetsByLicenseId } from '@/lib/db/queries';
import type { WidgetConfig } from '@/widget/src/types';

/**
 * Translate the new playground-style config to the widget's expected format
 *
 * This bridges the gap between:
 * - New configurator format: themeMode, accentColor, greeting, etc.
 * - Widget bundle format: branding.welcomeText, style.primaryColor, etc.
 *
 * Extended to support ChatKit-compatible theming options:
 * - grayscale palette with tinted hue
 * - accent colors with intensity
 * - surface colors
 * - user message colors
 * - radius, density, typography
 * - starter prompts
 * - composer options
 */
function translateConfig(dbConfig: any, requestUrl: string): WidgetConfig {
    // Map theme mode
    const themeMode = dbConfig.themeMode === 'dark' ? 'dark' : 'light';

    // Calculate primary color based on config
    let primaryColor = '#0066FF'; // default
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

    // Get radius option name for extended theming
    const radius = dbConfig.radius || 'medium';

    // Get radius as number for legacy styling
    const radiusMap: Record<string, number> = {
        'none': 0,
        'small': 6,
        'medium': 12,
        'large': 18,
        'pill': 24
    };
    const cornerRadius = radiusMap[radius] ||
                        dbConfig.style?.cornerRadius ||
                        12;

    // Get webhook URL - check multiple locations
    const webhookUrl = dbConfig.n8nWebhookUrl ||
                       dbConfig.connection?.webhookUrl ||
                       '';

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

    // Grayscale with tinted hue - check both naming conventions
    // Preview uses: useTintedGrayscale, tintHue, tintLevel, shadeLevel
    // May also be: grayHue, grayTint, grayShade
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

    // Icon color
    if (dbConfig.iconColor) {
        theme.color.icon = dbConfig.iconColor;
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
                maxSize: dbConfig.maxFileSize || 5 * 1024 * 1024, // 5MB default
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
            theme: themeMode as 'light' | 'dark' | 'auto',
            primaryColor,
            backgroundColor,
            textColor,
            position: dbConfig.style?.position || 'bottom-right',
            cornerRadius,
            fontFamily: dbConfig.fontFamily || dbConfig.typography?.fontFamily || 'system-ui',
            fontSize: dbConfig.fontSize || dbConfig.typography?.fontSize || 16,
            customFontUrl: dbConfig.customFontCss,
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
        // AgentKit / OpenAI configuration
        // Note: API key and workflow ID are NOT sent to client - they stay server-side
        agentKit: dbConfig.enableAgentKit ? {
            enabled: true,
            relayEndpoint: `${new URL(requestUrl).origin}/api/chat-relay/openai`,
            // Indicate if credentials are configured (without exposing them)
            hasWorkflowId: !!dbConfig.agentKitWorkflowId,
            hasApiKey: !!dbConfig.agentKitApiKey,
        } : {
            enabled: false,
        },
        // Extended theming configuration
        theme,
        startScreen,
        composer,
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ license: string }> }
) {
    try {
        const { license: licenseKey } = await params;

        if (!licenseKey) {
            return new NextResponse(
                JSON.stringify({ error: 'License key is required' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            );
        }


        // Find the license
        const license = await getLicenseByKey(licenseKey);

        if (!license) {
            return new NextResponse(
                JSON.stringify({ error: 'Invalid license key' }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            );
        }

        if (license!.status !== 'active') {
            return new NextResponse(
                JSON.stringify({ error: 'License is not active' }),
                {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            );
        }

        // Check domain restrictions if applicable
        const origin = request.headers.get('origin');
        if (origin && license!.domains.length > 0) {
            const domain = new URL(origin!).hostname;
            const isAllowed = license!.domains.some((d: string) =>
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

        // Get the first active widget for this license
        const widgets = await getWidgetsByLicenseId(license!.id, false);

        if (!widgets || widgets.length === 0) {
            return new NextResponse(
                JSON.stringify({ error: 'No active widget configuration found' }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            );
        }

        const widget = widgets[0];
        const dbConfig = widget.config as any; // JSONB config from database

        // Translate the config to widget format
        const config = translateConfig(
            {
                ...dbConfig,
                widgetId: widget.id,
                license: {
                    key: licenseKey,
                    active: true,
                    plan: license!.tier
                }
            },
            request.url
        );

        return NextResponse.json(config, {
            headers: {
                'Access-Control-Allow-Origin': '*', // Allow all origins for the config fetch
                'Cache-Control': 'public, max-age=60, stale-while-revalidate=300', // Cache for 1 minute
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
