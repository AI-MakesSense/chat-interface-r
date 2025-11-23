import { NextRequest, NextResponse } from 'next/server';
import { getLicenseByKey, getWidgetsByLicenseId } from '@/lib/db/queries';
import type { WidgetConfig } from '@/widget/src/types';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ license: string }> }
) {
    try {
        const { license: licenseKey } = await params;

        if (!licenseKey) {
            return NextResponse.json(
                { error: 'License key is required' },
                { status: 400 }
            );
        }

        // Find the license
        const license = await getLicenseByKey(licenseKey);

        if (!license) {
            return NextResponse.json(
                { error: 'Invalid license key' },
                { status: 404 }
            );
        }

        if (license.status !== 'active') {
            return NextResponse.json(
                { error: 'License is not active' },
                { status: 403 }
            );
        }

        // Check domain restrictions if applicable
        const origin = request.headers.get('origin');
        if (origin && license.domains.length > 0) {
            const domain = new URL(origin).hostname;
            const isAllowed = license.domains.some((d: string) =>
                domain === d || domain.endsWith('.' + d)
            );

            if (!isAllowed) {
                return NextResponse.json(
                    { error: 'Domain not allowed' },
                    { status: 403 }
                );
            }
        }

        // Get the first active widget for this license
        const widgets = await getWidgetsByLicenseId(license.id, false);

        if (!widgets || widgets.length === 0) {
            return NextResponse.json(
                { error: 'No active widget configuration found' },
                { status: 404 }
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
                plan: license.tier
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
