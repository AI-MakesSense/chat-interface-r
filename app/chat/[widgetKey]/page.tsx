/**
 * Fullpage Chat Route (Schema v2.0)
 *
 * Purpose: Full-page chat widget accessible via /chat/[widgetKey]
 * Features:
 * - Server-side widget config loading using widgetKey
 * - Full-screen chat interface
 * - No bubble button (always visible)
 * - Public access (no authentication required)
 *
 * Route: /chat/[widgetKey]
 * Example: /chat/AbCdEfGh12345678
 */

import { notFound } from 'next/navigation';
import { getWidgetByKey, getWidgetByKeyWithUser } from '@/lib/db/queries';
import { CHATKIT_SERVER_ENABLED } from '@/lib/feature-flags';
import FullpageWidget from './fullpage-widget';

interface PageProps {
  params: Promise<{
    widgetKey: string;
  }>;
}

export default async function FullpageChatPage({ params }: PageProps) {
  const { widgetKey } = await params;

  // Validate widgetKey format (16-char alphanumeric)
  if (!widgetKey || !/^[A-Za-z0-9]{16}$/.test(widgetKey)) {
    notFound();
  }

  // Fetch widget configuration from database using widgetKey
  const widget = await getWidgetByKeyWithUser(widgetKey);

  // Return 404 if widget not found or not active
  if (!widget || widget.status !== 'active') {
    notFound();
  }

  // Check user subscription status (Schema v2.0)
  const userTier = (widget.user as any).tier || 'free';
  const subscriptionStatus = (widget.user as any).subscriptionStatus || 'active';

  // Return 404 if subscription is not active (past_due allowed for grace period)
  if (subscriptionStatus === 'canceled') {
    // Check if within grace period
    const currentPeriodEnd = (widget.user as any).currentPeriodEnd;
    if (!currentPeriodEnd || new Date(currentPeriodEnd) < new Date()) {
      notFound();
    }
  }

  // Extract config from JSONB
  const config = widget.config as any;

  // ChatKit fullpage is disabled when provider flag is off.
  if (!CHATKIT_SERVER_ENABLED) {
    const isChatKitWidget = widget.widgetType === 'chatkit' || config?.connection?.provider === 'chatkit';
    if (isChatKitWidget) {
      notFound();
    }
  }

  return (
    <div className="fullpage-container">
      <FullpageWidget
        widgetKey={widgetKey}
        config={config}
      />
    </div>
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps) {
  const { widgetKey } = await params;

  // Validate widgetKey format
  if (!widgetKey || !/^[A-Za-z0-9]{16}$/.test(widgetKey)) {
    return {
      title: 'Widget Not Found',
    };
  }

  const widget = await getWidgetByKey(widgetKey);

  if (!widget) {
    return {
      title: 'Widget Not Found',
    };
  }

  const config = widget.config as any;
  const companyName = config?.branding?.companyName || 'Chat';

  return {
    title: `${companyName} - Chat`,
    description: `Connect with ${companyName}`,
  };
}
