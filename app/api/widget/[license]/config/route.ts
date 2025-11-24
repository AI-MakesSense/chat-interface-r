import { NextRequest, NextResponse } from 'next/server';
import { getLicenseByKey, getWidgetsByLicenseId } from '@/lib/db/queries';
import type { WidgetConfig } from '@/widget/src/types';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ license: string }> }
) {
    try {
        const { license: licenseKey } = await params;

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
        const widgetConfig = widget.config as any; // JSONB config from database

        // Construct the config object from the widget
        const config: WidgetConfig = {
            widgetId: widget.id, // Add widgetId for relay API
            license: {
                key: licenseKey,
                active: true,
                plan: license!.tier
            },
            branding: widgetConfig.branding || {
                companyName: '',
            },
            style: widgetConfig.style || {
                theme: 'light',
                primaryColor: '#0066FF',
                position: 'bottom-right',
            },
            features: widgetConfig.features || {
                fileAttachmentsEnabled: false,
            },
            connection: {
                // We don't expose the raw webhook URL here for security
                // The widget will use the relay endpoint
                webhookUrl: '',
                relayEndpoint: `${new URL(request.url).origin}/api/chat-relay`,
            },
        };

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
            { status: 500 }
        );
    }
}
