import { NextRequest, NextResponse } from 'next/server';
import { getLicenseByKey, getWidgetsByLicenseId } from '@/lib/db/queries';
import type { WidgetConfig } from '@/widget/src/types';

/**
 * Translate the new playground-style config to the widget's expected format
 *
 * This bridges the gap between:
 * - New configurator format: themeMode, accentColor, greeting, etc.
 * - Widget bundle format: branding.welcomeText, style.primaryColor, etc.
 */
function translateConfig(dbConfig: any, requestUrl: string): WidgetConfig {
    // Map theme mode
    const theme = dbConfig.themeMode === 'dark' ? 'dark' : 'light';

    // Calculate primary color based on config
    let primaryColor = '#0066FF'; // default
    if (dbConfig.useAccent && dbConfig.accentColor) {
        primaryColor = dbConfig.accentColor;
    } else if (dbConfig.style?.primaryColor) {
        primaryColor = dbConfig.style.primaryColor;
    }

    // Calculate background color
    let backgroundColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
    if (dbConfig.useCustomSurfaceColors && dbConfig.surfaceBackgroundColor) {
        backgroundColor = dbConfig.surfaceBackgroundColor;
    } else if (dbConfig.style?.backgroundColor) {
        backgroundColor = dbConfig.style.backgroundColor;
    }

    // Calculate text color
    let textColor = theme === 'dark' ? '#e5e5e5' : '#111827';
    if (dbConfig.useCustomTextColor && dbConfig.customTextColor) {
        textColor = dbConfig.customTextColor;
    } else if (dbConfig.style?.textColor) {
        textColor = dbConfig.style.textColor;
    }

    // Get radius as number
    const radiusMap: Record<string, number> = {
        'none': 0,
        'small': 6,
        'medium': 12,
        'large': 18,
        'pill': 24
    };
    const cornerRadius = radiusMap[dbConfig.radius || 'medium'] ||
                        dbConfig.style?.cornerRadius ||
                        12;

    // Get webhook URL - check multiple locations
    const webhookUrl = dbConfig.n8nWebhookUrl ||
                       dbConfig.connection?.webhookUrl ||
                       '';

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
            theme: theme as 'light' | 'dark' | 'auto',
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
