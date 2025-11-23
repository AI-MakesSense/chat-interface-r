import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WidgetConfig } from '@/widget/src/types';

export async function GET(
    request: NextRequest,
    { params }: { params: { license: string } }
) {
    try {
        const licenseKey = params.license;

        if (!licenseKey) {
            return NextResponse.json(
                { error: 'License key is required' },
                { status: 400 }
            );
        }

        // Find the license and associated widget
        const license = await prisma.license.findUnique({
            where: { key: licenseKey },
            include: {
                user: {
                    include: {
                        widgets: {
                            where: { active: true },
                            take: 1, // Get the first active widget for this user
                        },
                    },
                },
            },
        });

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
        if (origin && license.allowedDomains.length > 0) {
            const domain = new URL(origin).hostname;
            const isAllowed = license.allowedDomains.some((d: string) =>
                domain === d || domain.endsWith('.' + d)
            );

            if (!isAllowed) {
                return NextResponse.json(
                    { error: 'Domain not allowed' },
                    { status: 403 }
                );
            }
        }

        // Get the widget configuration
        const widget = license.user.widgets[0];

        if (!widget) {
            return NextResponse.json(
                { error: 'No active widget configuration found' },
                { status: 404 }
            );
        }

        // Construct the config object
        const config: WidgetConfig = {
            license: { key: licenseKey, active: true, plan: license.tier },
            branding: {
                companyName: widget.companyName,
                logoUrl: widget.logoUrl || undefined,
                welcomeText: widget.welcomeText || undefined,
                firstMessage: widget.firstMessage || undefined,
            },
            style: {
                primaryColor: widget.primaryColor,
                theme: widget.theme as 'light' | 'dark',
                position: widget.position as 'bottom-right' | 'bottom-left',
                cornerRadius: widget.cornerRadius,
                // Default values for required fields that might be missing in DB
                backgroundColor: '#ffffff',
                textColor: '#000000',
                fontFamily: 'Inter, sans-serif',
                fontSize: 16,
            },
            features: {
                fileAttachmentsEnabled: true,
                allowedExtensions: ['.jpg', '.png', '.pdf'],
                maxFileSizeKB: 5120,
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
