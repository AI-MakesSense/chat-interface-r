import { notFound } from 'next/navigation';
import { db } from '@/lib/db/client';
import { licenses, widgets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ChatKitEmbed } from '@/components/chatkit-embed';
import { WidgetConfig } from '@/stores/widget-store';
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

    // Fetch widgets for this license
    const licenseWidgets = await db
        .select()
        .from(widgets)
        .where(eq(widgets.licenseId, license.id));

    // Find the active widget
    const widget = licenseWidgets.find(w => w.status === 'active') || licenseWidgets[0];

    if (!widget) {
        return (
            <div className="flex items-center justify-center h-screen bg-neutral-50 text-neutral-500">
                <p>No widget configured for this license.</p>
            </div>
        );
    }

    // Check if it's a ChatKit widget
    if (widget.widgetType !== 'chatkit' && (widget.config as WidgetConfig).connection?.provider !== 'chatkit') {
        // Fallback or error if trying to load N8n widget via ChatKit route
        // But for now, we might just render it if the config is compatible, or show error
        // Ideally, the embed code should point to the correct URL.
    }

    const config = widget.config as WidgetConfig;

    return (
        <div className="h-screen w-screen overflow-hidden bg-transparent pointer-events-none">
            <ChatKitEmbed widgetId={widget.id} config={config} />
        </div>
    );
}
