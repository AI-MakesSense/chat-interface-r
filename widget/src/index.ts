/**
 * N8n Chat Widget - Main Entry Point
 *
 * Purpose: Embeddable chat widget for N8n workflows
 * Responsibility: Initialize widget, create UI, handle user interaction
 *
 * Constraints:
 * - Must work without any framework dependencies
 * - Bundle size target: <50KB gzipped
 * - IIFE format for single script tag deployment
 * - Reads config from window.ChatWidgetConfig OR fetches dynamically
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

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    // 1. Check for existing runtime config (Legacy/Portal mode)
    const legacyConfig = (window as any).ChatWidgetConfig as WidgetRuntimeConfig;
    if (legacyConfig && legacyConfig.relay?.relayUrl) {
      console.log('[N8n Chat Widget] Using legacy/portal configuration');
      try {
        createChatWidget(legacyConfig);
        return;
      } catch (error) {
        console.error('[N8n Chat Widget] Initialization error:', error);
        return;
      }
    }

    // 2. Auto-discovery mode (Pickaxe-style)
    // Look for div with id starting with "n8n-chat-"
    const container = document.querySelector('div[id^="n8n-chat-"]');
    if (!container) {
      // No container found, and no legacy config. 
      // This is expected if the script is loaded but the container isn't present yet,
      // or if used in a different way. We just exit silently.
      return;
    }

    const containerId = container.id;
    const licenseKey = containerId.replace('n8n-chat-', '');

    if (!licenseKey) {
      console.error('[N8n Chat Widget] Found container but no license key in ID');
      return;
    }

    console.log(`[N8n Chat Widget] Found container for license: ${licenseKey}`);

    // 3. Fetch configuration
    try {
      // Determine API base URL from script source if possible, otherwise assume same origin or specific domain
      // For now, we'll try to derive it from the script tag src
      let apiBaseUrl = '';
      const scriptTag = document.querySelector('script[src*="/chat-widget.js"]') as HTMLScriptElement;
      if (scriptTag && scriptTag.src) {
        const url = new URL(scriptTag.src);
        apiBaseUrl = url.origin;
      }

      // Fallback if script tag not found (shouldn't happen usually)
      if (!apiBaseUrl) {
        console.warn('[N8n Chat Widget] Could not determine API base URL from script tag');
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/widget/${licenseKey}/config`);
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
      }

      const config: WidgetConfig = await response.json();

      // 4. Construct Runtime Config
      // Note: We cast to any first because WidgetRuntimeConfig is an intersection type
      // and we're constructing it from the config object + relay object
      const runtimeConfig: WidgetRuntimeConfig = {
        ...config,
        relay: {
          relayUrl: config.connection?.relayEndpoint || `${apiBaseUrl}/api/chat-relay`,
          widgetId: '', // Will be filled by relay response or not needed if relay handles it
          licenseKey: licenseKey
        }
      } as unknown as WidgetRuntimeConfig;

      // 5. Initialize
      createChatWidget(runtimeConfig);

    } catch (error) {
      console.error('[N8n Chat Widget] Auto-discovery initialization error:', error);
      // Optional: Render error state in container
      container.innerHTML = '<div style="color: red; padding: 10px; border: 1px solid red;">Widget Error: Failed to load configuration</div>';
    }
  }
})();
