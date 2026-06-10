/**
 * N8n Chat Widget - Main Entry Point
 *
 * Purpose: Embeddable chat widget for N8n workflows
 * Responsibility: Initialize widget, create UI, handle user interaction
 */

import { ChatRenderer } from './renderers/chat/chat-renderer';
import { DisplayRenderer } from './renderers/display/display-renderer';
import { WidgetRuntimeConfig, WidgetConfig } from './types';
import { Widget as WidgetConstructor } from './core/widget';

// Expose the Widget constructor globally for portal/embedded modes.
if (typeof window !== 'undefined') {
  const globalWindow = window as any;
  globalWindow.Widget = WidgetConstructor;
  globalWindow.N8nWidget = WidgetConstructor;
}

(function () {
  'use strict';

  console.log('%c[N8n Chat Widget] Script Loaded', 'background: #222; color: #bada55; padding: 4px; border-radius: 4px;');

  // Capture document.currentScript synchronously at IIFE evaluation time —
  // BEFORE any await or addEventListener. Once the event loop yields,
  // document.currentScript becomes null.
  let scriptTag: HTMLScriptElement | null = null;
  const currentScript = document.currentScript;
  if (currentScript instanceof HTMLScriptElement) {
    scriptTag = currentScript;
  } else {
    // Fallback for async/deferred scripts or environments where currentScript
    // is unavailable. Last-wins selector mirrors legacy behaviour.
    const scriptCandidates = Array.from(
      document.querySelectorAll('script[src*="/chat-widget.js"], script[src*="/bundle.js"], script[src*="/w/"]')
    ) as HTMLScriptElement[];
    scriptTag = scriptCandidates[scriptCandidates.length - 1] || null;
  }

  // Expose a teardown hook so host pages (e.g. the SPA fullpage route) can
  // dispose the active renderer on unmount. SPA navigation does not re-evaluate
  // the injected bundle script, so without this the renderer's listeners/timers
  // would leak across client-side route changes.
  function exposeTeardown(renderer: { dispose: () => void | Promise<void> }): void {
    if (typeof window === 'undefined') return;
    (window as any).__n8nWidgetTeardown = () => {
      try {
        void renderer.dispose();
      } finally {
        delete (window as any).__n8nWidgetTeardown;
      }
    };
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    // 1. Get Injected Configuration (Pre-injected by serve.ts or manual embed)
    const injectedConfig = (window as any).ChatWidgetConfig || {};
    // Handle case where injectedConfig might be nested or flat
    const injectedRelay = injectedConfig.relay || (injectedConfig.uiConfig ? injectedConfig.uiConfig.relay : {});

    const scriptModeAttr = (scriptTag?.getAttribute('data-mode') || scriptTag?.getAttribute('data-embed') || '')
      .trim()
      .toLowerCase();

    let displayMode: 'popup' | 'inline' | 'portal' = 'popup';
    if (scriptModeAttr === 'inline') {
      displayMode = 'inline';
    } else if (scriptModeAttr === 'portal' || scriptModeAttr === 'fullpage') {
      displayMode = 'portal';
    }

    const injectedDisplayMode = injectedConfig?.display?.mode;
    if (injectedDisplayMode === 'popup' || injectedDisplayMode === 'inline' || injectedDisplayMode === 'portal') {
      displayMode = injectedDisplayMode;
    }

    const displayConfig = {
      mode: displayMode,
      containerId: injectedConfig?.display?.containerId || scriptTag?.getAttribute('data-container') || undefined,
    };

    // Check if we have a FULL configuration (Legacy or fully injected mode).
    // The loader always sets relay.relayUrl alongside a pre-injected uiConfig, so
    // relay.relayUrl + uiConfig is the reliable "already injected" signal. We do NOT
    // require uiConfig.branding — translateConfig only sets branding for CHAT widgets,
    // so a display-kind (or branding-less) config would otherwise fall through to the
    // slow path and trigger a wasted re-fetch of /api/w/<key>/config on every load.
    if (injectedRelay && injectedRelay.relayUrl && injectedConfig.uiConfig) {
      console.log('[N8n Chat Widget] Using existing full configuration');
      try {
        // Mirror pre-injected license flags onto the legacy global some renderers read.
        if (injectedConfig.flags && typeof window !== 'undefined' && !(window as any).N8N_LICENSE_FLAGS) {
          (window as any).N8N_LICENSE_FLAGS = injectedConfig.flags;
        }
        const fastConfig = injectedConfig.uiConfig ?? injectedConfig;
        const isDisplay = (fastConfig as any).kind === 'display';
        const fastRenderer = isDisplay ? new DisplayRenderer() : new ChatRenderer();
        await fastRenderer.mount(
          { ...(injectedConfig as WidgetRuntimeConfig), display: displayConfig },
          document.body
        );
        exposeTeardown(fastRenderer);
        return;
      } catch (error) {
        console.error('[N8n Chat Widget] Initialization error:', error);
        return;
      }
    }

    // 2. Determine Widget Key & API Base URL
    let widgetKey = injectedRelay.licenseKey || '';
    let apiBaseUrl = '';
    let isV2 = false; // Track if using v2.0 URL pattern

    // Strategy A: Check container ID
    const container = document.querySelector('div[id^="n8n-chat-"]');
    if (!widgetKey && container) {
      widgetKey = container.id.replace('n8n-chat-', '');
    }

    // Strategy B: Check script tag (supports both legacy and v2.0 URL patterns)
    // IMPORTANT: Always check script URL to detect v2 pattern, even if we have a widgetKey
    if (scriptTag && scriptTag.src) {
      const url = new URL(scriptTag.src);
      apiBaseUrl = url.origin;

      // Always check for v2.0 URL pattern to set isV2 flag
      const v2Match = url.pathname.match(/\/w\/([A-Za-z0-9]{16})(?:\.js)?$/);
      if (v2Match && v2Match[1]) {
        // v2.0 pattern detected: /w/[widgetKey].js
        if (!widgetKey) {
          widgetKey = v2Match[1];
        }
        isV2 = true;
      } else if (!widgetKey) {
        // Fallback to legacy pattern: /api/widget/[licenseKey]/chat-widget.js
        const legacyMatch = url.pathname.match(/\/api\/widget\/([^\/]+)\/chat-widget/);
        if (legacyMatch && legacyMatch[1]) {
          widgetKey = legacyMatch[1];
        }
      }
    }

    // Fallback: If no script tag found, default to window origin (e.g. development)
    if (!apiBaseUrl) {
      apiBaseUrl = window.location.origin;
    }

    if (!widgetKey) {
      console.warn('[N8n Chat Widget] Could not determine widget key.');
      return;
    }

    // 3. Fetch UI Configuration
    // Use v2.0 endpoint for v2 widgets, legacy endpoint otherwise
    const configUrl = isV2
      ? `${apiBaseUrl}/w/${widgetKey}/config`
      : `${apiBaseUrl}/api/widget/${widgetKey}/config`;

    try {
      const fetchController = new AbortController();
      const fetchTimeout = setTimeout(() => fetchController.abort(), 8000);
      const response = await fetch(configUrl, { signal: fetchController.signal });
      clearTimeout(fetchTimeout);
      if (!response.ok) throw new Error('Config fetch failed');

      const payload = await response.json();

      // 4. Normalize to the runtime { uiConfig, relay, flags } shape.
      // The v2 endpoint (/w/<key>/config) now returns { bundlePath, runtime } where
      // `runtime` is { uiConfig, relay, flags } (Task 17). The legacy endpoint
      // (/api/widget/<license>/config) still returns a FLAT WidgetConfig. Detect which.
      const isEnvelope = !!(payload && payload.runtime && payload.runtime.uiConfig);
      const envelopeRuntime = isEnvelope ? payload.runtime : null;
      const remoteConfig: WidgetConfig = envelopeRuntime ? envelopeRuntime.uiConfig : payload;
      const envelopeRelay = envelopeRuntime?.relay || {};
      const envelopeFlags = envelopeRuntime?.flags;

      // 5. Construct Runtime Config
      // CRITICAL FIX: Nest the remoteConfig inside 'uiConfig' to match widget.ts expectations
      const runtimeConfig: WidgetRuntimeConfig = {
        uiConfig: remoteConfig, // Nesting the config here!
        relay: {
          relayUrl: injectedRelay.relayUrl || envelopeRelay.relayUrl || remoteConfig.connection?.relayEndpoint || `${apiBaseUrl}/api/chat-relay`,
          widgetId: injectedRelay.widgetId || envelopeRelay.widgetId || '', // Use injected ID if available
          licenseKey: envelopeRelay.licenseKey || widgetKey // Use widgetKey for v2.0 (licenseKey for backward compatibility)
        },
        ...(envelopeFlags ? { flags: envelopeFlags } : {}),
        display: displayConfig,
      } as unknown as WidgetRuntimeConfig;

      // Mirror license flags onto the legacy global some renderers still read.
      if (envelopeFlags && typeof window !== 'undefined') {
        (window as any).N8N_LICENSE_FLAGS = envelopeFlags;
      }

      // Save config to window so the internal message handler can find it if needed
      (window as any).ChatWidgetConfig = runtimeConfig;

      // 6. Initialize — dispatch on config.kind
      const isDisplay = remoteConfig.kind === 'display';
      const renderer = isDisplay ? new DisplayRenderer() : new ChatRenderer();
      await renderer.mount(runtimeConfig, document.body);
      exposeTeardown(renderer);

    } catch (error) {
      console.error('[N8n Chat Widget] Boot error:', error);
      if (container) {
        container.innerHTML = '<div style="color:red;padding:10px;border:1px solid red">Widget Error: Config Load Failed</div>';
      }
    }
  }
})();
