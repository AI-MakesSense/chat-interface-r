'use client';

/**
 * Fullpage Widget Component (Schema v2.0)
 *
 * Purpose: Client-side component that initializes the widget in fullpage mode
 * Supports both ChatKit and N8n widget types
 * Uses widgetKey instead of license for configuration
 *
 * Note: The N8n widget script is injected manually via useEffect instead of
 * the Next.js <Script> component. The <Script> with strategy="afterInteractive"
 * only creates a <link rel="preload"> in the SSR HTML and depends on React
 * hydration to inject the actual <script> tag — which silently fails in iframe
 * contexts, leaving the widget blank. Manual injection is reliable.
 */

import { useEffect, useRef } from 'react';
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
  const scriptInjected = useRef(false);

  // Apply global styles and inject widget script via useEffect
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

  // Inject the widget script manually (not via Next.js <Script>)
  useEffect(() => {
    if (isChatKit || scriptInjected.current) return;
    scriptInjected.current = true;

    const script = document.createElement('script');
    script.src = `/w/${widgetKey}.js`;
    script.async = true;
    script.setAttribute('data-mode', 'portal');
    script.setAttribute('data-container', 'chat-portal');
    script.id = `n8n-fullpage-${widgetKey}`;
    document.body.appendChild(script);

    return () => {
      // Clean up on unmount
      const el = document.getElementById(`n8n-fullpage-${widgetKey}`);
      if (el) el.remove();
    };
  }, [widgetKey, isChatKit]);

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

  // N8n widget - portal container only; script is injected via useEffect above
  return (
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
  );
}
