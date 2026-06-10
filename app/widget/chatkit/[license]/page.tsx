import { notFound } from 'next/navigation';
import { db } from '@/lib/db/client';
import { licenses, widgets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ChatKitEmbed } from '@/components/chatkit-embed';
import { migrateConfig } from '@/lib/widget-config/migrate';
import { CHATKIT_SERVER_ENABLED } from '@/lib/feature-flags';

interface PageProps {
    params: {
        license: string;
    };
}

export default async function ChatKitWidgetPage({ params }: PageProps) {
    if (!CHATKIT_SERVER_ENABLED) {
        notFound();
    }

    const { license: licenseKey } = params;

    // Fetch license
    const [license] = await db
        .select()
        .from(licenses)
        .where(eq(licenses.licenseKey, licenseKey));

    if (!license || license.status !== 'active') {
        return (
            <div className="flex items-center justify-center h-screen bg-neutral-50 text-neutral-500">
                <p>Invalid or inactive license.</p>
            </div>
        );
    }

    // Fetch widgets for this license's user (Schema v2.0: licenseId removed from widgets)
    const licenseWidgets = await db
        .select()
        .from(widgets)
        .where(eq(widgets.userId, license.userId));

    // Find the active widget
    const widget = licenseWidgets.find(w => w.status === 'active') || licenseWidgets[0];

    if (!widget) {
        return (
            <div className="flex items-center justify-center h-screen bg-neutral-50 text-neutral-500">
                <p>No widget configured for this license.</p>
            </div>
        );
    }

    const config = migrateConfig(widget.config);

    // Only ChatKit widgets may render through this route — an n8n widget
    // loaded here would silently render with the wrong provider.
    if (widget.widgetType !== 'chatkit' && config.connection.provider !== 'chatkit') {
        notFound();
    }

    return (
        <div className="h-screen w-screen overflow-hidden bg-transparent pointer-events-none">
            <ChatKitEmbed widgetId={widget.id} config={config} />
        </div>
    );
}
