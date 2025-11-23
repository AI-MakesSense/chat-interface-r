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

  <!-- Widget Script -->
  <script>
    // Functional widget implementation for preview with real API integration
    (function() {
      const widget = {
        isOpen: false,
        messages: [],
        isLoading: false,

        init: function() {
          try {
            this.render();
            this.attachEventListeners();
            // Add initial greeting message
            const initialMessage = window.ChatWidgetConfig?.branding?.firstMessage || 'Hello! How can I help you today?';
            this.addMessage('assistant', initialMessage);
          } catch (e) {
            console.error('Chat widget initialization failed:', e);
            window.parent.postMessage({ type: 'PREVIEW_ERROR', payload: { error: 'Widget initialization failed: ' + e.message } }, '*');
          }
        },

        render: function() {
          const config = window.ChatWidgetConfig;
          if (!config) {
            console.error('ChatWidgetConfig is not defined during render.');
            return;
          }

          // Create widget container
          const container = document.createElement('div');
          container.id = 'chat-widget-container';
          container.style.cssText = \`
            position: fixed;
            z-index: 9999;
            \${this.getPositionStyles(config.style?.position || 'bottom-right')}
          \`;

          // Create widget button
          const button = document.createElement('button');
          button.id = 'chat-widget-button';
          button.innerHTML = '💬';
          button.style.cssText = \`
            width: 60px;
            height: 60px;
            border-radius: \${config.style?.cornerRadius || 12}px;
            background-color: \${config.style?.primaryColor || '#667eea'};
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
            \${this.getPositionStyles(config.style?.position || 'bottom-right', true)}
            width: 380px;
            height: 600px;
            background: white;
            border-radius: \${config.style?.cornerRadius || 12}px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            flex-direction: column;
          \`;

          chatWindow.innerHTML = \`
            <div style="
              background-color: \${config.style?.primaryColor || '#667eea'};
              color: white;
              padding: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            ">
              <div>
                <div style="font-weight: bold; font-size: 16px;">\${config.branding?.companyName || 'Chat Widget'}</div>
                <div style="font-size: 12px; opacity: 0.9;" id="connection-status">
                  <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #4ade80; margin-right: 4px;"></span>
                  Preview Mode - Testing Connection
                </div>
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
            <div id="messages-container" style="
              flex: 1;
              padding: 20px;
              overflow-y: auto;
              background: #f7fafc;
              display: flex;
              flex-direction: column;
              gap: 12px;
            ">
            </div>
            <div style="
              padding: 16px;
              border-top: 1px solid #e2e8f0;
              background: white;
            ">
              <div style="display: flex; gap: 8px;">
                <input 
                  id="message-input" 
                  type="text" 
                  placeholder="Type a message..." 
                  style="
                    flex: 1;
                    padding: 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 14px;
                  "
                >
                <button 
                  id="send-btn"
                  style="
                    padding: 12px 20px;
                    background-color: \${config.style?.primaryColor || '#667eea'};
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                  "
                >Send</button>
              </div>
            </div>
          \`;

          document.body.appendChild(container);
          document.body.appendChild(chatWindow);

          this.button = button;
          this.chatWindow = chatWindow;
          this.messagesContainer = chatWindow.querySelector('#messages-container');
          this.messageInput = chatWindow.querySelector('#message-input');
          this.sendBtn = chatWindow.querySelector('#send-btn');
        },

        addMessage: function(role, content) {
          if (!this.messagesContainer) {
            console.error('Messages container not found.');
            return;
          }
          const message = { role, content, timestamp: new Date() };
          this.messages.push(message);
          this.renderMessage(message);
        },

        renderMessage: function(message) {
          if (!this.messagesContainer) return;

          const messageEl = document.createElement('div');
          const isUser = message.role === 'user';
          
          messageEl.style.cssText = \`
            display: flex;
            justify-content: \${isUser ? 'flex-end' : 'flex-start'};
          \`;

          const bubble = document.createElement('div');
          const primaryColor = window.ChatWidgetConfig?.style?.primaryColor || '#667eea';
          bubble.style.cssText = \`
            max-width: 70%;
            padding: 12px 16px;
            border-radius: 12px;
            background: \${isUser ? primaryColor : 'white'};
            color: \${isUser ? 'white' : '#1a202c'};
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            word-wrap: break-word;
          \`;
          bubble.textContent = message.content;

          messageEl.appendChild(bubble);
          this.messagesContainer.appendChild(messageEl);
          
          // Scroll to bottom
          this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        },

        showLoading: function() {
          if (!this.messagesContainer) return;

          const loadingEl = document.createElement('div');
          loadingEl.id = 'loading-indicator';
          loadingEl.style.cssText = \`
            display: flex;
            justify-content: flex-start;
          \`;

          loadingEl.innerHTML = \`
            <div style="
              background: white;
              padding: 12px 16px;
              border-radius: 12px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            ">
              <div style="display: flex; gap: 4px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #cbd5e0; animation: bounce 1.4s infinite ease-in-out;"></div>
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #cbd5e0; animation: bounce 1.4s infinite ease-in-out 0.2s;"></div>
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #cbd5e0; animation: bounce 1.4s infinite ease-in-out 0.4s;"></div>
              </div>
            </div>
          \`;

          this.messagesContainer.appendChild(loadingEl);
          this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        },

        hideLoading: function() {
          const loadingEl = document.getElementById('loading-indicator');
          if (loadingEl) loadingEl.remove();
        },

        updateConnectionStatus: function(status, message) {
          const statusEl = document.getElementById('connection-status');
          if (!statusEl) return;

          const colors = {
            success: '#4ade80',
            error: '#f87171',
            warning: '#fbbf24'
          };

          statusEl.innerHTML = \`
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: \${colors[status] || colors.warning}; margin-right: 4px;"></span>
            \${message}
          \`;
        },

        sendMessage: async function() {
          if (!this.messageInput || !this.sendBtn) {
            console.error('Message input or send button not found.');
            return;
          }

          const text = this.messageInput.value.trim();
          if (!text || this.isLoading) return;

          // Add user message
          this.addMessage('user', text);
          this.messageInput.value = '';
          this.isLoading = true;
          this.sendBtn.disabled = true;
          this.showLoading();

          try {
            // Get current widget config
            const config = window.ChatWidgetConfig;
            
            // Check if webhook URL is configured
            if (!config?.connection?.webhookUrl && !config?.connection?.relayEndpoint) {
              throw new Error('No webhook URL or relay endpoint configured');
            }

            // Send message via relay API
            const relayUrl = '/api/chat-relay';
            const response = await fetch(relayUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId: 'preview-' + Date.now(),
                action: 'sendMessage',
                chatInput: text,
                licenseKey: config.license?.key || 'preview',
              }),
            });

            this.hideLoading();

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || \`HTTP \${response.status}: \${response.statusText}\`);
            }

            const data = await response.json();
            
            // Add assistant response
            if (data.output) {
              this.addMessage('assistant', data.output);
              this.updateConnectionStatus('success', 'Connected to n8n');
            } else {
              throw new Error('No response from webhook');
            }

          } catch (error) {
            this.hideLoading();
            console.error('Chat error:', error);
            
            // Show error message
            const errorMsg = error.message || 'Failed to send message';
            this.addMessage('assistant', \`❌ Error: \${errorMsg}\`);
            this.updateConnectionStatus('error', 'Connection failed');
          } finally {
            this.isLoading = false;
            if (this.sendBtn) {
              this.sendBtn.disabled = false;
            }
          }
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
          if (this.button) {
            this.button.addEventListener('click', () => this.open());
          } else {
            console.warn('Chat button not found, cannot attach event listener.');
          }

          const closeBtn = document.getElementById('chat-close-btn');
          if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
          } else {
            console.warn('Chat close button not found, cannot attach event listener.');
          }

          if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
          } else {
            console.warn('Send button not found, cannot attach event listener.');
          }
          
          if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
              }
            });
          } else {
            console.warn('Message input not found, cannot attach event listener.');
          }
        },

        open: function() {
          if (this.chatWindow) {
            this.chatWindow.style.display = 'flex';
            if (this.button) this.button.style.display = 'none';
            this.isOpen = true;
            if (this.messageInput) this.messageInput.focus();
          }
        },

        close: function() {
          if (this.chatWindow) {
            this.chatWindow.style.display = 'none';
            if (this.button) this.button.style.display = 'block';
            this.isOpen = false;
          }
        },

        updateConfig: function(newConfig) {
          try {
            // Remove old widget
            const oldContainer = document.getElementById('chat-widget-container');
            const oldWindow = document.getElementById('chat-widget-window');
            if (oldContainer) oldContainer.remove();
            if (oldWindow) oldWindow.remove();

            // Re-render with new config
            window.ChatWidgetConfig = newConfig;
            this.messages = []; // Reset messages
            this.render();
            this.attachEventListeners();
            const firstMessage = newConfig.branding?.firstMessage || 'Hello! How can I help you today?';
            this.addMessage('assistant', firstMessage);
          } catch (e) {
            console.error('Failed to update widget config:', e);
            window.parent.postMessage({ type: 'PREVIEW_ERROR', payload: { error: 'Widget update failed: ' + e.message } }, '*');
          }
        }
      };

      // Add CSS for bounce animation
      const style = document.createElement('style');
      style.textContent = \`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      \`;
      document.head.appendChild(style);

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
