/**
 * N8n Chat Widget - Main Entry Point
 *
 * Purpose: Embeddable chat widget for N8n workflows
 * Responsibility: Initialize widget, create UI, handle user interaction
 */

import { createChatWidget } from './widget';
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

    // Check if we have a FULL configuration (Legacy or fully injected mode)
    // We check both flat structure and nested uiConfig structure
    if (injectedRelay && injectedRelay.relayUrl && (injectedConfig.branding || (injectedConfig.uiConfig && injectedConfig.uiConfig.branding))) {
      console.log('[N8n Chat Widget] Using existing full configuration');
      try {
        createChatWidget(injectedConfig as WidgetRuntimeConfig);
        return;
      } catch (error) {
        console.error('[N8n Chat Widget] Initialization error:', error);
        return;
      }
    }

    // 2. Determine License Key & API Base URL
    let licenseKey = injectedRelay.licenseKey || '';
    let apiBaseUrl = '';

    // Strategy A: Check container ID
    const container = document.querySelector('div[id^="n8n-chat-"]');
    if (!licenseKey && container) {
      licenseKey = container.id.replace('n8n-chat-', '');
    }

    // Strategy B: Check script tag
    const scriptTag = document.querySelector('script[src*="/chat-widget.js"], script[src*="/bundle.js"]') as HTMLScriptElement;
    if (scriptTag && scriptTag.src) {
      const url = new URL(scriptTag.src);
      apiBaseUrl = url.origin;

      if (!licenseKey) {
        const match = url.pathname.match(/\/api\/widget\/([^\/]+)\/chat-widget/);
        if (match && match[1]) licenseKey = match[1];
      }
    }

    // Fallback: If no script tag found, default to window origin (e.g. development)
    if (!apiBaseUrl) {
      apiBaseUrl = window.location.origin;
    }

    if (!licenseKey) {
      console.warn('[N8n Chat Widget] Could not determine license key.');
      return;
    }

    // 3. Fetch UI Configuration
    try {
      const response = await fetch(`${apiBaseUrl}/api/widget/${licenseKey}/config`);
      if (!response.ok) throw new Error('Config fetch failed');

      const remoteConfig: WidgetConfig = await response.json();

      // 4. Construct Runtime Config
      // CRITICAL FIX: Nest the remoteConfig inside 'uiConfig' to match widget.ts expectations
      const runtimeConfig: WidgetRuntimeConfig = {
        uiConfig: remoteConfig, // Nesting the config here!
        relay: {
          relayUrl: injectedRelay.relayUrl || remoteConfig.connection?.relayEndpoint || `${apiBaseUrl}/api/chat-relay`,
          widgetId: injectedRelay.widgetId || '', // Use injected ID if available
          licenseKey: licenseKey
        }
      } as unknown as WidgetRuntimeConfig;

      // Save config to window so the internal message handler can find it if needed
      (window as any).ChatWidgetConfig = runtimeConfig;

      // 5. Initialize
      createChatWidget(runtimeConfig);

    } catch (error) {
      console.error('[N8n Chat Widget] Boot error:', error);
      if (container) {
        container.innerHTML = '<div style="color:red;padding:10px;border:1px solid red">Widget Error: Config Load Failed</div>';
      }
    }
  }
})();