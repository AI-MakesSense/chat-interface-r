'use client';

/**
 * Fullpage Widget Component (Schema v2.0)
 *
 * Purpose: Client-side component that initializes the widget in fullpage mode
 * Supports both ChatKit and N8n widget types
 * Uses widgetKey instead of license for configuration
 */

import { useEffect } from 'react';
import Script from 'next/script';
import { ChatKitEmbed } from '@/components/chatkit-embed';
import { WidgetConfig } from '@/stores/widget-store';
import { CHATKIT_UI_ENABLED } from '@/lib/feature-flags';

interface FullpageWidgetProps {
  widgetKey: string;
  config: WidgetConfig;
}

export default function FullpageWidget({ widgetKey, config }: FullpageWidgetProps) {
  // Check if this is a ChatKit widget
  const isChatKit = CHATKIT_UI_ENABLED && config?.connection?.provider === 'chatkit';

  // Apply global styles via useEffect
  useEffect(() => {
    // Set html/body styles for fullpage — override the app's dark-mode
    // background so the page is white (not black) while the widget loads.
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.background = '#ffffff';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = '';
      document.body.style.background = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // ChatKit widget - render the ChatKit embed component
  if (isChatKit) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <ChatKitEmbed widgetId={widgetKey} config={config} />
      </div>
    );
  }

  // N8n widget - use the script-based widget
  return (
    <>
      {/* Widget Script */}
      <Script
        id={`n8n-fullpage-${widgetKey}`}
        src={`/w/${widgetKey}.js`}
        data-mode="portal"
        data-container="chat-portal"
        strategy="afterInteractive"
      />

      {/* Portal Container - widget looks for id="chat-portal" */}
      <div
        id="chat-portal"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
        }}
      />
    </>
  );
}
