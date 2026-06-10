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
  /** Content-hashed bundle path from the build manifest (server-read). */
  bundlePath: string;
}

export default function FullpageWidget({ widgetKey, config, bundlePath }: FullpageWidgetProps) {
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

  // Boot the widget from the content-hashed bundle (Task 18).
  //
  // Mirrors the embed loader: fetch /api/w/<key>/config to get the runtime
  // envelope, set window.ChatWidgetConfig, then inject the hashed bundle. The
  // bundle's fast-path reads ChatWidgetConfig and the data-mode attribute off
  // its own <script> tag to mount in portal mode.
  //
  // Why not the loader.js URL? The fullpage route already knows the bundlePath
  // (server-read from the manifest), so it injects the bundle directly and skips
  // the loader's extra round-trip. The cleanup path disposes the renderer via the
  // bundle's teardown hook so SPA navigation does not leak listeners/timers.
  //
  // bundlePath/widgetKey are fixed per page load; config is intentionally NOT a
  // dep (it never changes after the server render).
  useEffect(() => {
    if (isChatKit || scriptInjected.current) return;
    scriptInjected.current = true;

    let cancelled = false;
    const scriptId = `n8n-fullpage-${widgetKey}`;

    (async () => {
      try {
        const res = await fetch(`/api/w/${encodeURIComponent(widgetKey)}/config`, {
          mode: 'cors',
        });
        if (!res.ok) throw new Error(`config fetch failed: HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        (window as any).ChatWidgetConfig = data.runtime;

        const script = document.createElement('script');
        // Prefer the manifest path the config endpoint returns; fall back to the
        // server-provided bundlePath prop.
        script.src = data.bundlePath || bundlePath;
        script.async = true;
        script.setAttribute('data-mode', 'portal');
        script.setAttribute('data-container', 'chat-portal');
        script.id = scriptId;
        document.body.appendChild(script);
      } catch (err) {
        console.error('[Fullpage] Widget boot failed:', err);
      }
    })();

    return () => {
      cancelled = true;
      // Dispose the active renderer (removes listeners/timers/DOM) before SPA nav.
      const teardown = (window as any).__n8nWidgetTeardown;
      if (typeof teardown === 'function') {
        try {
          teardown();
        } catch {
          /* best-effort cleanup */
        }
      }
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [widgetKey, isChatKit, bundlePath]);

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
