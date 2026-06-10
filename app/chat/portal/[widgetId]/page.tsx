/**
 * Portal Mode Page
 *
 * Purpose: Full-page chat widget portal accessible via /chat/portal/[widgetId]
 * Features:
 * - Server-side widget config loading
 * - Full-screen chat interface
 * - No bubble button (always visible)
 * - Public access (no authentication required)
 *
 * Route: /chat/portal/[widgetId]
 * Example: /chat/portal/550e8400-e29b-41d4-a716-446655440000
 */

import { notFound, redirect } from 'next/navigation';
import { getWidgetById, getUserById } from '@/lib/db/queries';
import { isSubscriptionActive } from '@/lib/widget/resolve-widget';
import PortalWidget from './portal-widget';

interface PageProps {
  params: Promise<{
    widgetId: string;
  }>;
}

export default async function PortalPage({ params }: PageProps) {
  const { widgetId } = await params;

  // Canonical v2 route uses /chat/[widgetKey].
  if (/^[A-Za-z0-9]{16}$/.test(widgetId)) {
    redirect(`/chat/${widgetId}`);
  }

  // Fetch widget configuration from database
  const widget = await getWidgetById(widgetId);

  // Return 404 if widget not found or not active
  if (!widget || widget.status !== 'active') {
    notFound();
  }

  // Resolve user for subscription/status gate (replaces the old wrong-license-status gate)
  const user = await getUserById(widget.userId);
  if (!user || !isSubscriptionActive(user)) {
    notFound();
  }

  // v2 widgets should use widgetKey route
  if ((widget as any).widgetKey) {
    redirect(`/chat/${(widget as any).widgetKey}`);
  }

  // Extract config from JSONB
  const config = widget.config as any;

  return (
    <div className="portal-container">
      <PortalWidget
        widgetId={widgetId}
        config={config}
        license={(widget as any).widgetKey || widgetId}
      />
    </div>
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps) {
  const { widgetId } = await params;

  if (/^[A-Za-z0-9]{16}$/.test(widgetId)) {
    return {
      title: 'Chat Portal',
      description: 'Open chat portal',
    };
  }

  const widget = await getWidgetById(widgetId);

  if (!widget) {
    return {
      title: 'Widget Not Found',
    };
  }

  const config = widget.config as any;
  const companyName = config?.branding?.companyName || 'Chat';

  return {
    title: `${companyName} - Support Chat`,
    description: `Connect with ${companyName} support team`,
  };
}
