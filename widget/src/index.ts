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

import { createChatWidget } from './widget';
import { WidgetConfig } from './types';

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
    const userConfig = (window as any).ChatWidgetConfig as WidgetConfig || {};

    // Validate required config
    if (!userConfig.connection?.webhookUrl) {
      console.error('[N8n Chat Widget] Error: webhookUrl is required in ChatWidgetConfig');
      return;
    }

    // Initialize widget
    try {
      createChatWidget(userConfig);
    } catch (error) {
      console.error('[N8n Chat Widget] Initialization error:', error);
    }
  }
})();
