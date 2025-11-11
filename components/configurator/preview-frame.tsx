'use client';

/**
 * Preview Frame Component
 *
 * Renders widget preview in an isolated iframe with postMessage communication.
 * Provides real-time preview updates with <100ms latency.
 *
 * Features:
 * - Iframe isolation for CSS/JS encapsulation
 * - PostMessage communication for config updates
 * - Responsive device modes
 * - Preview ready state detection
 */

import { useEffect, useRef, useState } from 'react';
import { usePreviewStore, PreviewMessageType, type PreviewMessage } from '@/stores/preview-store';
import { WidgetConfig } from '@/stores/widget-store';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDebouncedCallback } from 'use-debounce';

interface PreviewFrameProps {
  config: WidgetConfig;
  className?: string;
}

/**
 * Preview frame component
 *
 * Displays widget preview in an isolated iframe environment
 */
export function PreviewFrame({ config, className = '' }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    deviceMode,
    isPreviewReady,
    previewError,
    setIframeRef,
    setPreviewReady,
    setPreviewError,
    sendConfigUpdate,
    getDeviceDimensions,
    clearError,
  } = usePreviewStore();

  const dimensions = getDeviceDimensions();

  /**
   * Send config update with debouncing for performance
   * Debounce to 50ms to achieve <100ms total latency
   */
  const debouncedConfigUpdate = useDebouncedCallback(
    (newConfig: WidgetConfig) => {
      sendConfigUpdate(newConfig);
    },
    50 // 50ms debounce
  );

  /**
   * Setup iframe reference and message listener
   */
  useEffect(() => {
    if (iframeRef.current) {
      setIframeRef(iframeRef.current);
    }

    // Message listener for iframe communication
    const handleMessage = (event: MessageEvent) => {
      // In production, verify event.origin for security
      // For now, accept all messages during development

      const message = event.data as PreviewMessage;

      if (!message || !message.type) {
        return;
      }

      switch (message.type) {
        case PreviewMessageType.PREVIEW_READY:
          setPreviewReady(true);
          setIsLoading(false);
          // Send initial config
          if (iframeRef.current) {
            sendConfigUpdate(config);
          }
          break;

        case PreviewMessageType.PREVIEW_ERROR:
          setPreviewError(message.payload?.error || 'Unknown preview error');
          setIsLoading(false);
          break;

        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      setIframeRef(null);
      setPreviewReady(false);
    };
  }, [setIframeRef, setPreviewReady, setPreviewError, sendConfigUpdate, config]);

  /**
   * Send config updates when config changes
   */
  useEffect(() => {
    if (isPreviewReady) {
      debouncedConfigUpdate(config);
    }
  }, [config, isPreviewReady, debouncedConfigUpdate]);

  /**
   * Generate preview HTML document
   * This creates a standalone HTML page with the widget embedded
   */
  const getPreviewHTML = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Widget Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .demo-content {
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    h1 {
      font-size: 28px;
      margin-bottom: 16px;
      color: #1a202c;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: #4a5568;
      margin-bottom: 12px;
    }
    .highlight {
      background: #edf2f7;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
      border-left: 4px solid #667eea;
    }
  </style>
</head>
<body>
  <div class="demo-content">
    <h1>Welcome to Our Website</h1>
    <p>
      This is a demo page to showcase your chat widget. The widget will appear in the
      ${config.style.position.replace('-', ' ')} corner of this preview.
    </p>
    <div class="highlight">
      <p><strong>Try it out:</strong> Click the chat button to test your widget's appearance and behavior.</p>
    </div>
    <p>
      Your widget is fully customizable with colors, position, welcome text, and more.
      Changes you make in the configurator will appear here in real-time.
    </p>
  </div>

  <!-- Widget Configuration -->
  <script>
    // Initial configuration (will be updated via postMessage)
    window.ChatWidgetConfig = ${JSON.stringify(config, null, 2)};

    // PostMessage handler for config updates
    window.addEventListener('message', function(event) {
      const message = event.data;

      if (message && message.type === 'CONFIG_UPDATE') {
        // Update widget config
        window.ChatWidgetConfig = message.payload;

        // If widget is already loaded, update it
        if (window.ChatWidget && window.ChatWidget.updateConfig) {
          window.ChatWidget.updateConfig(message.payload);
        }
      } else if (message && message.type === 'OPEN_WIDGET') {
        if (window.ChatWidget && window.ChatWidget.open) {
          window.ChatWidget.open();
        }
      } else if (message && message.type === 'CLOSE_WIDGET') {
        if (window.ChatWidget && window.ChatWidget.close) {
          window.ChatWidget.close();
        }
      }
    });

    // Signal that preview is ready
    window.parent.postMessage({
      type: 'PREVIEW_READY'
    }, '*');
  </script>

  <!-- Widget Script (placeholder - will be replaced with actual widget) -->
  <script>
    // Placeholder widget implementation for preview
    // In production, this would load the actual widget from /api/widget/:license/chat-widget.js

    (function() {
      // Simple widget implementation for preview purposes
      const widget = {
        isOpen: false,

        init: function() {
          this.render();
          this.attachEventListeners();
        },

        render: function() {
          const config = window.ChatWidgetConfig;

          // Create widget container
          const container = document.createElement('div');
          container.id = 'chat-widget-container';
          container.style.cssText = \`
            position: fixed;
            z-index: 9999;
            \${this.getPositionStyles(config.style.position)}
          \`;

          // Create widget button
          const button = document.createElement('button');
          button.id = 'chat-widget-button';
          button.innerHTML = '💬';
          button.style.cssText = \`
            width: 60px;
            height: 60px;
            border-radius: \${config.style.cornerRadius || 12}px;
            background-color: \${config.style.primaryColor};
            color: white;
            border: none;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
          \`;

          button.onmouseenter = () => {
            button.style.transform = 'scale(1.1)';
          };

          button.onmouseleave = () => {
            button.style.transform = 'scale(1)';
          };

          container.appendChild(button);

          // Create chat window (hidden by default)
          const chatWindow = document.createElement('div');
          chatWindow.id = 'chat-widget-window';
          chatWindow.style.cssText = \`
            display: none;
            position: fixed;
            \${this.getPositionStyles(config.style.position, true)}
            width: 380px;
            height: 600px;
            background: white;
            border-radius: \${config.style.cornerRadius || 12}px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            flex-direction: column;
          \`;

          chatWindow.innerHTML = \`
            <div style="
              background-color: \${config.style.primaryColor};
              color: white;
              padding: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            ">
              <div>
                <div style="font-weight: bold; font-size: 16px;">\${config.branding.companyName || 'Chat Widget'}</div>
                <div style="font-size: 12px; opacity: 0.9;">\${config.branding.welcomeText || 'How can we help?'}</div>
              </div>
              <button id="chat-close-btn" style="
                background: transparent;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
              ">×</button>
            </div>
            <div style="
              flex: 1;
              padding: 20px;
              overflow-y: auto;
              background: #f7fafc;
            ">
              <div style="
                background: white;
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 12px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              ">
                \${config.branding.firstMessage || 'Hello! How can I help you today?'}
              </div>
            </div>
            <div style="
              padding: 16px;
              border-top: 1px solid #e2e8f0;
              background: white;
            ">
              <input type="text" placeholder="Type a message..." style="
                width: 100%;
                padding: 12px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                font-size: 14px;
              ">
            </div>
          \`;

          document.body.appendChild(container);
          document.body.appendChild(chatWindow);

          this.button = button;
          this.chatWindow = chatWindow;
        },

        getPositionStyles: function(position, isWindow = false) {
          const offset = isWindow ? '80px' : '20px';

          switch(position) {
            case 'bottom-right':
              return \`bottom: \${offset}; right: \${offset};\`;
            case 'bottom-left':
              return \`bottom: \${offset}; left: \${offset};\`;
            case 'top-right':
              return \`top: \${offset}; right: \${offset};\`;
            case 'top-left':
              return \`top: \${offset}; left: \${offset};\`;
            default:
              return \`bottom: \${offset}; right: \${offset};\`;
          }
        },

        attachEventListeners: function() {
          this.button.addEventListener('click', () => this.open());

          const closeBtn = document.getElementById('chat-close-btn');
          if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
          }
        },

        open: function() {
          if (this.chatWindow) {
            this.chatWindow.style.display = 'flex';
            this.button.style.display = 'none';
            this.isOpen = true;
          }
        },

        close: function() {
          if (this.chatWindow) {
            this.chatWindow.style.display = 'none';
            this.button.style.display = 'block';
            this.isOpen = false;
          }
        },

        updateConfig: function(newConfig) {
          // Remove old widget
          const oldContainer = document.getElementById('chat-widget-container');
          const oldWindow = document.getElementById('chat-widget-window');
          if (oldContainer) oldContainer.remove();
          if (oldWindow) oldWindow.remove();

          // Re-render with new config
          window.ChatWidgetConfig = newConfig;
          this.render();
          this.attachEventListeners();
        }
      };

      // Initialize widget
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => widget.init());
      } else {
        widget.init();
      }

      // Expose widget API
      window.ChatWidget = widget;
    })();
  </script>
</body>
</html>
    `.trim();
  };

  return (
    <div className={`preview-frame-container ${className}`}>
      {/* Error Display */}
      {previewError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex items-center justify-between">
            <span>{previewError}</span>
            <button
              onClick={clearError}
              className="text-sm underline"
            >
              Dismiss
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading preview...</p>
          </div>
        </div>
      )}

      {/* Preview Iframe */}
      <div className="relative w-full h-full flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden">
        <iframe
          ref={iframeRef}
          title="Widget Preview"
          srcDoc={getPreviewHTML()}
          sandbox="allow-scripts allow-same-origin allow-forms"
          className="border-0 bg-white rounded-lg shadow-lg transition-all duration-300"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        />
      </div>

      {/* Device Label */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
        {dimensions.label} ({dimensions.width} × {dimensions.height})
      </div>
    </div>
  );
}
