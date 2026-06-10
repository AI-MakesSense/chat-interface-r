/**
 * N8n Chat Widget - Main Entry Point
 *
 * Purpose: Embeddable chat widget for N8n workflows
 * Responsibility: Initialize widget, create UI, handle user interaction
 */

import { createRenderer } from './core/create-renderer';
import { WidgetRuntimeConfig } from './types';
import { Widget as WidgetConstructor } from './core/widget';
import { initPreviewBridge } from './preview/preview-bridge';

// Expose the Widget constructor globally for portal/embedded modes.
if (typeof window !== 'undefined') {
  const globalWindow = window as any;
  globalWindow.Widget = WidgetConstructor;
  globalWindow.N8nWidget = WidgetConstructor;
}

(function () {
  'use strict';

  // Preview mode (configurator iframe, ?preview=1): the parent frame drives
  // mounting via postMessage. Skip the normal embed bootstrap entirely.
  if (initPreviewBridge()) {
    return;
  }

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
      document.querySelectorAll('script[src*="/widget/v/chat-widget."], script[src*="/chat-widget.js"], script[src*="/bundle.js"], script[src*="/w/"]')
    ) as HTMLScriptElement[];
    scriptTag = scriptCandidates[scriptCandidates.length - 1] || null;
  }

  // Expose a teardown hook so host pages (e.g. the SPA fullpage route) can
  // dispose the active renderer on unmount. SPA navigation does not re-evaluate
  // the injected bundle script, so without this the renderer's listeners/timers
  // would leak across client-side route changes.
  //
  // Multi-widget pages (chat + display on one page is a supported case) mount more
  // than one renderer, so compose LIFO: the latest teardown disposes its own
  // renderer, restores the previous hook, then chains into it — disposing all
  // renderers without leaking the earlier ones.
  function exposeTeardown(renderer: { dispose: () => void | Promise<void> }): void {
    if (typeof window === 'undefined') return;
    const prev = (window as any).__n8nWidgetTeardown;
    (window as any).__n8nWidgetTeardown = async () => {
      try {
        await renderer.dispose();
      } finally {
        (window as any).__n8nWidgetTeardown = prev ?? undefined;
      }
      if (typeof prev === 'function') await prev();
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
        const fastRenderer = createRenderer(isDisplay ? 'display' : 'chat');
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

    // 2. No pre-injected config → error clearly. We do NOT fall back to a
    //    runtime config fetch.
    //
    // The bundle is only ever loaded by /widget/loader.js (the sole customer-facing
    // URL; the legacy /api/widget/<license>/chat-widget.js compat route bootstraps
    // the same loader). The loader always fetches /api/w/<key>/config and pre-injects
    // window.ChatWidgetConfig (the { uiConfig, relay, flags } runtime) BEFORE this
    // bundle runs, so the fast path above is the only reachable mount path.
    //
    // The previous slow-path fetch fell back to two DELETED routes
    // (/w/<key>/config — missing the /api prefix — and /api/widget/<key>/config,
    // removed in Tasks 9 & 19), so it could never have succeeded. If config is
    // somehow absent, surface a clear error instead of fetching a dead endpoint.
    console.error(
      '[N8n Chat Widget] No pre-injected configuration found. The widget must be ' +
      'loaded via /widget/loader.js, which injects window.ChatWidgetConfig before ' +
      'this bundle runs. Direct bundle embeds are not supported.'
    );
    const errorContainer = document.querySelector('div[id^="n8n-chat-"]');
    if (errorContainer) {
      errorContainer.innerHTML =
        '<div style="color:red;padding:10px;border:1px solid red">Widget Error: Configuration not found</div>';
    }
  }
})();
