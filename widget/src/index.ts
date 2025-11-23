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

  console.log('%c[N8n Chat Widget] Script Loaded', 'background: #222; color: #bada55; padding: 4px; border-radius: 4px;');

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

    // 2. Determine License Key & API Base URL
    let licenseKey = '';
    let apiBaseUrl = '';

    // Strategy A: Check for container with ID (Legacy/Manual Embed)
    const container = document.querySelector('div[id^="n8n-chat-"]');
    if (container) {
      const containerId = container.id;
      licenseKey = containerId.replace('n8n-chat-', '');
      console.log(`[N8n Chat Widget] Found container for license: ${licenseKey}`);
    }

    // Strategy B: Extract from Script Tag (Auto-Embed)
    const scriptTag = document.querySelector('script[src*="/chat-widget.js"], script[src*="/bundle.js"]') as HTMLScriptElement;
    if (scriptTag && scriptTag.src) {
      const url = new URL(scriptTag.src);
      apiBaseUrl = url.origin;

      // Try to extract license key from URL if not found in container
      // Pattern: /api/widget/[LICENSE_KEY]/chat-widget.js
      if (!licenseKey) {
        const match = url.pathname.match(/\/api\/widget\/([^\/]+)\/chat-widget\.js/);
        if (match && match[1]) {
          licenseKey = match[1];
          console.log(`[N8n Chat Widget] Extracted license from script URL: ${licenseKey}`);
        }
      }
    }

    // If we still don't have a license key, we can't proceed
    if (!licenseKey) {
      console.warn('[N8n Chat Widget] Could not determine license key from container or script URL');
      return;
    }

    // Fallback for API Base URL if script tag wasn't found (unlikely)
    if (!apiBaseUrl) {
      apiBaseUrl = window.location.origin;
    }

    // 3. Fetch configuration
    try {
      const response = await fetch(`${apiBaseUrl}/api/widget/${licenseKey}/config`);
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
      }

      const config: WidgetConfig = await response.json();

      // 4. Construct Runtime Config
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
      // Optional: Render error state in container if it exists
      if (container) {
        container.innerHTML = '<div style="color: red; padding: 10px; border: 1px solid red;">Widget Error: Failed to load configuration</div>';
      }
    }
  }
})();
