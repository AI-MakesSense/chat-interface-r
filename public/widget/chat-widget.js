/**
 * N8N Chat Widget - Embeddable Chat Interface
 *
 * This is a mock widget bundle for testing purposes.
 * The actual production widget would be much larger and more feature-rich.
 *
 * Features:
 * - Customizable branding
 * - Multiple theme support
 * - SSE streaming for real-time responses
 * - File attachment support
 * - Markdown rendering
 */

(function() {
  'use strict';

  // __START_LICENSE_FLAGS__
  window.N8N_LICENSE_FLAGS = {"tier":"PLACEHOLDER","brandingEnabled":true};
  // __END_LICENSE_FLAGS__

  // Widget initialization
  console.log('[ChatWidget] Loaded with flags:', window.N8N_LICENSE_FLAGS);

  // Mock widget state
  const widgetState = {
    isOpen: false,
    messages: [],
    config: window.ChatWidgetConfig || {}
  };

  // Mock widget functions
  function initWidget() {
    console.log('[ChatWidget] Initializing widget...');
    createWidgetContainer();
    attachEventListeners();
    applyTheme();
    applyBranding();
  }

  function createWidgetContainer() {
    const container = document.createElement('div');
    container.id = 'n8n-chat-widget';
    container.className = 'n8n-widget-container';
    document.body.appendChild(container);
  }

  function attachEventListeners() {
    document.addEventListener('click', function(e) {
      if (e.target && e.target.id === 'n8n-widget-toggle') {
        toggleWidget();
      }
    });
  }

  function toggleWidget() {
    widgetState.isOpen = !widgetState.isOpen;
    console.log('[ChatWidget] Widget toggled:', widgetState.isOpen);
  }

  function applyTheme() {
    const theme = widgetState.config.theme || 'light';
    console.log('[ChatWidget] Applying theme:', theme);
  }

  function applyBranding() {
    const branding = window.N8N_LICENSE_FLAGS.brandingEnabled;
    console.log('[ChatWidget] Branding enabled:', branding);

    if (!branding) {
      console.log('[ChatWidget] White-label mode - hiding branding');
    }
  }

  function sendMessage(text) {
    console.log('[ChatWidget] Sending message:', text);
    widgetState.messages.push({
      type: 'user',
      text: text,
      timestamp: Date.now()
    });

    // Mock API call
    setTimeout(function() {
      receiveMessage('This is a mock response');
    }, 1000);
  }

  function receiveMessage(text) {
    console.log('[ChatWidget] Received message:', text);
    widgetState.messages.push({
      type: 'bot',
      text: text,
      timestamp: Date.now()
    });
  }

  function renderMessages() {
    const container = document.getElementById('n8n-chat-widget');
    if (!container) return;

    let html = '<div class="messages">';
    widgetState.messages.forEach(function(msg) {
      html += '<div class="message message-' + msg.type + '">';
      html += '<span>' + msg.text + '</span>';
      html += '</div>';
    });
    html += '</div>';

    container.innerHTML = html;
  }

  function cleanup() {
    console.log('[ChatWidget] Cleaning up widget...');
    const container = document.getElementById('n8n-chat-widget');
    if (container) {
      container.remove();
    }
  }

  // Export widget API
  window.N8NChatWidget = {
    init: initWidget,
    toggle: toggleWidget,
    send: sendMessage,
    cleanup: cleanup,
    getState: function() { return widgetState; }
  };

  // Auto-initialize if config is present
  if (window.ChatWidgetConfig) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initWidget);
    } else {
      initWidget();
    }
  }

  console.log('[ChatWidget] Widget script loaded successfully');
  console.log('[ChatWidget] License tier:', window.N8N_LICENSE_FLAGS.tier);
  console.log('[ChatWidget] Domain limit:', window.N8N_LICENSE_FLAGS.domainLimit);
})();