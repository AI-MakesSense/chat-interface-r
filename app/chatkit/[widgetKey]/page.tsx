/**
 * ChatKit Widget Page (Schema v2.0)
 *
 * Purpose: Serve ChatKit widget iframe using widgetKey
 * Route: /chatkit/[widgetKey]
 *
 * This is used when a ChatKit widget is embedded via the v2.0 scheme.
 * The main widget route (/w/[widgetKey]) returns a script that creates
 * an iframe pointing to this page.
 */

import { notFound } from 'next/navigation';
import { getWidgetByKeyWithUser } from '@/lib/db/queries';
import { ChatKitEmbed } from '@/components/chatkit-embed';
import { WidgetConfig } from '@/stores/widget-store';

interface PageProps {
  params: Promise<{
    widgetKey: string;
  }>;
}

export default async function ChatKitWidgetPage({ params }: PageProps) {
  const { widgetKey } = await params;

  // Validate widgetKey format (16-char alphanumeric)
  if (!widgetKey || !/^[A-Za-z0-9]{16}$/.test(widgetKey)) {
    notFound();
  }

  // Fetch widget with user data using widgetKey
  const widget = await getWidgetByKeyWithUser(widgetKey);

  if (!widget) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50 text-neutral-500">
        <p>Widget not found.</p>
      </div>
    );
  }

  // Check user subscription status
  const subscriptionStatus = (widget.user as any).subscriptionStatus || 'active';
  if (subscriptionStatus !== 'active' && subscriptionStatus !== 'past_due') {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50 text-neutral-500">
        <p>Subscription is not active.</p>
      </div>
    );
  }

  // Check if it's a ChatKit widget
  const config = widget.config as WidgetConfig;
  if (widget.widgetType !== 'chatkit' && config.connection?.provider !== 'chatkit') {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50 text-neutral-500">
        <p>This widget is not configured for ChatKit.</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-transparent pointer-events-none">
      <ChatKitEmbed widgetId={widget.id} config={config} />
    </div>
  );
}

// Metadata for the iframe page
export async function generateMetadata({ params }: PageProps) {
  const { widgetKey } = await params;

  if (!widgetKey || !/^[A-Za-z0-9]{16}$/.test(widgetKey)) {
    return { title: 'Widget Not Found' };
  }

  const widget = await getWidgetByKeyWithUser(widgetKey);
  if (!widget) {
    return { title: 'Widget Not Found' };
  }

  const config = widget.config as WidgetConfig;
  const companyName = config?.branding?.companyName || 'ChatKit Widget';

  return {
    title: `${companyName} - Chat`,
    description: `Chat with ${companyName}`,
  };
}
