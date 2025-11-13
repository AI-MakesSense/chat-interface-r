'use client';

/**
 * Portal Widget Component
 *
 * Purpose: Client-side component that initializes the widget in portal mode
 * Renders full-screen chat interface with server-provided configuration
 */

import { useEffect, useRef } from 'react';
import Script from 'next/script';

interface PortalWidgetProps {
  widgetId: string;
  config: any;
  license: string;
}

export default function PortalWidget({ widgetId, config, license }: PortalWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetInitialized = useRef(false);

  useEffect(() => {
    // Initialize widget only once when script is loaded
    const initializeWidget = () => {
      if (widgetInitialized.current) return;
      if (typeof window === 'undefined') return;
      if (!(window as any).Widget) return;

      widgetInitialized.current = true;

      try {
        const { Widget } = (window as any);

        // Merge config with portal mode settings
        const portalConfig = {
          ...config,
          mode: 'portal',
          license: license,
          portal: {
            showHeader: config?.portal?.showHeader ?? true,
            headerTitle: config?.portal?.headerTitle || config?.branding?.companyName || 'Chat',
          },
        };

        // Initialize widget in portal mode
        const widget = new Widget(portalConfig);
        widget.render();

        console.log('[Portal] Widget initialized:', widgetId);
      } catch (error) {
        console.error('[Portal] Widget initialization failed:', error);
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
  }, [widgetId, config, license]);

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

      {/* Portal Container */}
      <div id="chat-portal" ref={containerRef} className="chat-portal-container" />

      {/* Styles */}
      <style jsx>{`
        .chat-portal-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }

        :global(body) {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        :global(html) {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
