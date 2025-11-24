'use client';

/**
 * Preview Frame Component
 * * Renders widget preview in an isolated iframe.
 * FIX: Matches the exact payload structure of the working Relay (route.ts)
 * ensuring N8n receives 'chatInput' and a persistent 'sessionId'.
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

export function PreviewFrame({ config, className = '' }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
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

  const debouncedConfigUpdate = useDebouncedCallback(
    (newConfig: WidgetConfig) => {
      sendConfigUpdate(newConfig);
    },
    50
  );

  useEffect(() => {
    if (iframeRef.current) {
      setIframeRef(iframeRef.current);
    }

    const handleMessage = (event: MessageEvent) => {
      const message = event.data as PreviewMessage;
      if (!message || !message.type) return;

      switch (message.type) {
        case PreviewMessageType.PREVIEW_READY:
          setPreviewReady(true);
          setIsLoading(false);
          if (iframeRef.current) sendConfigUpdate(config);
          break;
        case PreviewMessageType.PREVIEW_ERROR:
          setPreviewError(message.payload?.error || 'Unknown preview error');
          setIsLoading(false);
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

  useEffect(() => {
    if (isPreviewReady) debouncedConfigUpdate(config);
  }, [config, isPreviewReady, debouncedConfigUpdate]);

  const getPreviewHTML = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Widget Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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
      box-shadow: 0 20px 60px rgba(0,0,0,0.1);
      text-align: center;
    }
    h1 { margin-bottom: 16px; color: #1a202c; }
    p { color: #4a5568; line-height: 1.6; margin-bottom: 12px; }

    /* Markdown Styles */
    pre { background: #f1f5f9; padding: 12px; border-radius: 8px; overflow-x: auto; margin: 8px 0; font-family: monospace; font-size: 13px; }
    code { background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 13px; }
    pre code { background: transparent; padding: 0; }
    a { color: #3182ce; text-decoration: underline; }
    strong { font-weight: 600; }

    /* Typing Animation */
    @keyframes n8n-bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }
    .n8n-typing-dot {
      width: 6px;
      height: 6px;
      background: #9ca3af;
      border-radius: 50%;
      animation: n8n-bounce 1.4s infinite ease-in-out both;
    }
    .n8n-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .n8n-typing-dot:nth-child(2) { animation-delay: -0.16s; }
    .n8n-typing-container {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 2px;
      min-height: 20px;
    }
  </style>
</head>
<body>
  <div class="demo-content">
    <h1>Widget Preview</h1>
    <p>This is a live preview of your chat widget.</p>
    <p>Test your branding, colors, and N8n connection here before deploying.</p>
  </div>

  <script>
    window.ChatWidgetConfig = ${JSON.stringify(config, null, 2)};

    window.addEventListener('message', function(event) {
      const message = event.data;
      if (message && message.type === 'CONFIG_UPDATE') {
        window.ChatWidgetConfig = message.payload;
        if (window.ChatWidget && window.ChatWidget.updateConfig) {
          window.ChatWidget.updateConfig(message.payload);
        }
      }
    });

    window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
  </script>

  <script>
    (function() {
      // FIX: Generate Session ID ONCE per load, not per message
      const sessionId = 'preview-' + Math.random().toString(36).substring(7);

      function renderMarkdown(text) {
        if (!text) return '';
        try {
          let html = escapeHtml(text);
          // Code Blocks
          html = html.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>');
          // Inline Code
          html = html.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
          // Bold
          html = html.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
          // Italic
          html = html.replace(/\\*([^*]+)\\*/g, '<em>$1</em>');
          // Links
          html = html.replace(/\\[([^\\]]+)\\]\\((https?:\\/\\/[^\\)]+)\\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
          // Newlines
          html = html.replace(/\\n/g, '<br>');
          return html;
        } catch (error) {
          console.warn('Markdown rendering failed', error);
          return text;
        }
      }

      function escapeHtml(unsafe) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return unsafe.replace(/[&<>"']/g, (char) => map[char] || char);
      }

      const widget = {
        isOpen: false,
        messages: [],
        isLoading: false,

        init: function() {
          try {
            this.render();
            this.attachEventListeners();
            const initialMessage = window.ChatWidgetConfig?.branding?.firstMessage || 'Hello!';
            this.addMessage('assistant', initialMessage);
          } catch (e) {
            window.parent.postMessage({ type: 'PREVIEW_ERROR', payload: { error: e.message } }, '*');
          }
        },

        render: function() {
          const config = window.ChatWidgetConfig;
          if (!config) return;

          const oldC = document.getElementById('chat-widget-container');
          const oldW = document.getElementById('chat-widget-window');
          if (oldC) oldC.remove();
          if (oldW) oldW.remove();

          const container = document.createElement('div');
          container.id = 'chat-widget-container';
          container.style.cssText = \`position: fixed; z-index: 9999; \${this.getPositionStyles(config.style?.position || 'bottom-right')}\`;

          // Button
          const button = document.createElement('button');
          button.id = 'chat-widget-button';
          button.innerHTML = '💬';
          button.style.cssText = \`
            width: 60px; height: 60px;
            border-radius: \${config.style?.cornerRadius || 12}px;
            background-color: \${config.style?.primaryColor || '#667eea'};
            color: white; border: none; font-size: 24px; cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: transform 0.2s;
          \`;
          button.onclick = () => this.open();
          container.appendChild(button);

          // Window
          const chatWindow = document.createElement('div');
          chatWindow.id = 'chat-widget-window';
          chatWindow.style.cssText = \`
            display: none; position: fixed;
            \${this.getPositionStyles(config.style?.position || 'bottom-right', true)}
            width: 380px; height: 600px; background: white;
            border-radius: \${config.style?.cornerRadius || 12}px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden; flex-direction: column;
          \`;

          const logoImg = config.branding?.logoUrl 
            ? '<img src="' + config.branding.logoUrl + '" style="width:24px;height:24px;border-radius:50%;margin-right:8px;object-fit:cover;">' 
            : '';

          chatWindow.innerHTML = \`
            <div style="background-color: \${config.style?.primaryColor || '#667eea'}; color: white; padding: 16px; display: flex; align-items: center; justify-content: space-between;">
              <div style="display:flex; align-items:center;">
                \${logoImg}
                <div>
                  <div style="font-weight: bold; font-size: 16px;">\${config.branding?.companyName || 'Chat'}</div>
                  <div style="font-size: 12px; opacity: 0.9;">\${config.branding?.welcomeText || 'Online'}</div>
                </div>
              </div>
              <button id="chat-close-btn" style="background:transparent; border:none; color:white; font-size: 24px; cursor: pointer;">×</button>
            </div>
            <div id="messages-container" style="flex: 1; padding: 20px; overflow-y: auto; background: #f7fafc; display: flex; flex-direction: column; gap: 12px;"></div>
            <div style="padding: 16px; border-top: 1px solid #e2e8f0; background: white; display: flex; gap: 8px;">
              <input id="message-input" type="text" placeholder="\${config.branding?.inputPlaceholder || 'Type a message...'}" style="flex: 1; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <button id="send-btn" style="padding: 10px 16px; background-color: \${config.style?.primaryColor || '#667eea'}; color: white; border: none; border-radius: 8px; cursor: pointer;">Send</button>
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

        addMessage: function(role, content, isLoading = false) {
          if (!this.messagesContainer) return;
          const messageEl = document.createElement('div');
          const isUser = role === 'user';
          messageEl.style.cssText = \`display: flex; justify-content: \${isUser ? 'flex-end' : 'flex-start'};\`;
          
          const bubble = document.createElement('div');
          const primaryColor = window.ChatWidgetConfig?.style?.primaryColor || '#667eea';
          bubble.style.cssText = \`
            max-width: 75%; padding: 10px 14px; border-radius: 12px;
            background: \${isUser ? primaryColor : 'white'};
            color: \${isUser ? 'white' : '#1a202c'};
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          \`;
          if (role === 'assistant') {
            if (isLoading) {
              bubble.innerHTML = \`
                <div class="n8n-typing-container">
                  <div class="n8n-typing-dot"></div>
                  <div class="n8n-typing-dot"></div>
                  <div class="n8n-typing-dot"></div>
                </div>
              \`;
            } else {
              bubble.innerHTML = renderMarkdown(content);
            }
          } else {
            bubble.textContent = content;
          }
          
          messageEl.appendChild(bubble);
          this.messagesContainer.appendChild(messageEl);
          this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        },

        sendMessage: async function() {
          const text = this.messageInput.value.trim();
          if (!text || this.isLoading) return;

          this.addMessage('user', text);
          this.messageInput.value = '';
          this.isLoading = true;
          this.sendBtn.disabled = true;
          this.sendBtn.textContent = '...';
          
          // Show typing indicator
          this.addMessage('assistant', '', true);

          try {
            const config = window.ChatWidgetConfig;
            const webhookUrl = config?.connection?.webhookUrl;

            if (!webhookUrl) throw new Error('No webhook URL configured');

            // FIX: This payload now matches EXACTLY what route.ts sends
            const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: text,
                chatInput: text,     // REQUIRED by N8n
                sessionId: sessionId, // REQUIRED for memory
                widgetId: 'preview-widget',
                licenseKey: 'preview-license',
                metadata: { source: 'preview_mode' }
              })
            });

            if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
            
            const data = await response.json();
            const reply = data.output || data.text || data.message || JSON.stringify(data);
            
            // Update the loading message with the actual response
            const lastMsg = this.messagesContainer.lastElementChild;
            if (lastMsg) {
              const bubble = lastMsg.querySelector('div > div'); // The bubble is inside the messageEl
              if (bubble) bubble.innerHTML = renderMarkdown(reply);
            }

          } catch (error) {
            console.error('Preview Error:', error);
            this.addMessage('assistant', \`⚠️ Error: \${error.message}\`);
          } finally {
            this.isLoading = false;
            if (this.sendBtn) {
              this.sendBtn.disabled = false;
              this.sendBtn.textContent = 'Send';
              this.messageInput.focus();
            }
          }
        },

        getPositionStyles: function(position, isWindow) {
          const offset = isWindow ? '80px' : '20px';
          if (position === 'bottom-left') return \`bottom: \${offset}; left: 20px;\`;
          if (position === 'top-right') return \`top: \${offset}; right: 20px;\`;
          if (position === 'top-left') return \`top: \${offset}; left: 20px;\`;
          return \`bottom: \${offset}; right: 20px;\`;
        },

        attachEventListeners: function() {
          if (!this.button) return;
          this.button.onclick = () => this.open();
          const closeBtn = document.getElementById('chat-close-btn');
          if (closeBtn) closeBtn.onclick = () => this.close();
          this.sendBtn.onclick = () => this.sendMessage();
          this.messageInput.onkeypress = (e) => {
            if (e.key === 'Enter') this.sendMessage();
          };
        },

        open: function() {
          this.chatWindow.style.display = 'flex';
          this.button.style.display = 'none';
          this.messageInput.focus();
        },

        close: function() {
          this.chatWindow.style.display = 'none';
          this.button.style.display = 'block';
        },

        updateConfig: function(newConfig) {
          const oldC = document.getElementById('chat-widget-container');
          const oldW = document.getElementById('chat-widget-window');
          if (oldC) oldC.remove();
          if (oldW) oldW.remove();
          
          window.ChatWidgetConfig = newConfig;
          this.render();
          this.attachEventListeners();
          // Reset messages for clean preview update
          this.messages = [];
          this.addMessage('assistant', newConfig.branding?.firstMessage || 'Hello!');
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => widget.init());
      } else {
        widget.init();
      }
      window.ChatWidget = widget;
    })();
  </script>
</body>
</html>
    `.trim();
  };

  return (
    <div className={`preview-frame-container ${className}`}>
      {previewError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex justify-between">
            <span>{previewError}</span>
            <button onClick={clearError} className="underline">Dismiss</button>
          </AlertDescription>
        </Alert>
      )}
      <div className="relative w-full h-full flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden">
        <iframe
          ref={iframeRef}
          title="Widget Preview"
          srcDoc={getPreviewHTML()}
          sandbox="allow-scripts allow-forms allow-same-origin"
          className="border-0 bg-white rounded-lg shadow-lg"
          style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
        />
      </div>
    </div>
  );
}