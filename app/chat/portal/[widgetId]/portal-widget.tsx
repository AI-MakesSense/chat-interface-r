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

  // Apply global styles via useEffect
  useEffect(() => {
    // Set html/body styles for portal
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
      <div
        id="chat-portal"
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
