'use client';

/**
 * Fullpage Widget Component (Schema v2.0)
 *
 * Purpose: Client-side component that initializes the widget in fullpage mode
 * Supports both ChatKit and N8n widget types
 * Uses widgetKey instead of license for configuration
 */

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { ChatKitEmbed } from '@/components/chatkit-embed';
import { WidgetConfig } from '@/stores/widget-store';

interface FullpageWidgetProps {
  widgetKey: string;
  config: WidgetConfig;
  embedType: string;
}

export default function FullpageWidget({ widgetKey, config, embedType }: FullpageWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetInitialized = useRef(false);

  // Check if this is a ChatKit widget
  const isChatKit = config?.connection?.provider === 'chatkit';

  useEffect(() => {
    // Only initialize N8n widget script if not ChatKit
    if (isChatKit) return;

    // Initialize widget only once when script is loaded
    const initializeWidget = () => {
      if (widgetInitialized.current) return;
      if (typeof window === 'undefined') return;
      if (!(window as any).Widget) return;

      widgetInitialized.current = true;

      try {
        const { Widget } = (window as any);

        // Merge config with fullpage mode settings
        const configAny = config as any;
        const fullpageConfig = {
          ...config,
          mode: 'fullpage',
          widgetKey: widgetKey,
          embedType: embedType,
          fullpage: {
            showHeader: configAny?.fullpage?.showHeader ?? true,
            headerTitle: configAny?.fullpage?.headerTitle || config?.branding?.companyName || 'Chat',
          },
        };

        // Initialize widget in fullpage mode
        const widget = new Widget(fullpageConfig);
        widget.render();

        console.log('[Fullpage] N8n Widget initialized:', widgetKey);
      } catch (error) {
        console.error('[Fullpage] Widget initialization failed:', error);
      }
    };

    // Check if script already loaded
    if ((window as any).Widget) {
      initializeWidget();
    }

    // Listen for script load event
    window.addEventListener('widget-script-loaded', initializeWidget);

    return () => {
      window.removeEventListener('widget-script-loaded', initializeWidget);
    };
  }, [widgetKey, config, embedType, isChatKit]);

  // Apply global styles via useEffect
  useEffect(() => {
    // Set html/body styles for fullpage
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      // Cleanup styles on unmount
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = '';
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
        src="/widget/chat-widget.iife.js"
        strategy="afterInteractive"
        onLoad={() => {
          // Dispatch custom event when script loads
          window.dispatchEvent(new Event('widget-script-loaded'));
        }}
      />

      {/* Fullpage Container */}
      <div
        id="chat-fullpage"
        ref={containerRef}
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
