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
 * - Reads config from window.ChatWidgetConfig
 * - License flags injected at serve time
 */

// __START_LICENSE_FLAGS__
// __END_LICENSE_FLAGS__

import { createChatWidget } from './widget';
import { WidgetRuntimeConfig } from './types';
import { Widget as WidgetConstructor } from './core/widget';

// Expose the Widget constructor globally for portal/embedded modes.
if (typeof window !== 'undefined') {
  const globalWindow = window as any;
  globalWindow.Widget = WidgetConstructor;
  globalWindow.N8nWidget = WidgetConstructor;
}

(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // Get user configuration from window
    const runtimeConfig = (window as any).ChatWidgetConfig as WidgetRuntimeConfig || {};

    // Validate required config
    if (!runtimeConfig.relay?.relayUrl || !runtimeConfig.relay.licenseKey || !runtimeConfig.relay.widgetId) {
      console.error('[N8n Chat Widget] Error: relay configuration is missing (relayUrl, widgetId, licenseKey required)');
      return;
    }

    // Initialize widget
    try {
      createChatWidget(runtimeConfig);
    } catch (error) {
      console.error('[N8n Chat Widget] Initialization error:', error);
    }
  }
})();
