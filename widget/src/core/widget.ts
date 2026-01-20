/**
 * Widget Class
 *
 * Purpose: Main widget class with support for multiple rendering modes
 * Modes:
 * - normal: Traditional bubble + chat window (default)
 * - portal: Full-screen chat (no bubble)
 * - embedded: Embedded in container (no bubble)
 *
 * Responsibility:
 * - State management (messages, session, open/close)
 * - Messaging logic (send, receive, stream)
 * - Coordination between UI renderers and services
 */

import { WidgetConfig, Message, ExtendedWidgetConfig, WidgetMode, FileAttachment } from '../types';
import { PortalRenderer } from './portal-renderer';
import { NormalRenderer } from './normal-renderer';
import { ConfigValidator } from './config-validator';
import { SessionManager } from '../services/messaging/session-manager';
import { buildRelayPayload } from '../services/messaging/payload';
import { renderMarkdown } from '../markdown';
import { createCSSVariables, createFontFaceCSS } from '../theming/css-variables';

export class Widget {
  public config: ExtendedWidgetConfig;
  private mode: WidgetMode;

  // State
  private messages: Message[] = [];
  private isOpen: boolean = false;
  private messageIdCounter: number = 0;
  private selectedFiles: File[] = [];
  private sessionManager: SessionManager;

  // UI References (to be populated by renderers)
  public ui: {
    chatWindow: HTMLElement | null;
    messagesContainer: HTMLElement | null;
    input: HTMLInputElement | null;
    sendBtn: HTMLElement | null;
    fileInput: HTMLInputElement | null;
    bubble: HTMLElement | null;
  } = {
      chatWindow: null,
      messagesContainer: null,
      input: null,
      sendBtn: null,
      fileInput: null,
      bubble: null
    };

  constructor(config: ExtendedWidgetConfig) {
    ConfigValidator.validate(config);
    this.config = this.mergeConfig(config);
    this.mode = config.mode || 'normal';

    // Initialize SessionManager
    const licenseKey = this.config.license?.key || 'default';
    this.sessionManager = new SessionManager(licenseKey);
  }

  /**
   * Merge provided config with defaults and legacy mapping
   */
  private mergeConfig(config: ExtendedWidgetConfig): ExtendedWidgetConfig {
    const colorScheme = config.theme?.colorScheme || config.style?.theme || 'light';
    const isDark = colorScheme === 'dark';

    return {
      ...config,
      branding: {
        companyName: config.branding?.companyName || 'Support',
        welcomeText: config.branding?.welcomeText || config.startScreen?.greeting || 'How can we help you?',
        firstMessage: config.branding?.firstMessage || 'Hello! Ask me anything.',
        logoUrl: config.branding?.logoUrl,
      },
      style: {
        theme: colorScheme as 'light' | 'dark' | 'auto',
        primaryColor: config.theme?.color?.accent?.primary || config.style?.primaryColor || '#0ea5e9',
        backgroundColor: config.theme?.color?.surface?.background || config.style?.backgroundColor || (isDark ? '#1a1a1a' : '#ffffff'),
        textColor: config.style?.textColor || (isDark ? '#e5e5e5' : '#1f2937'),
        fontFamily: config.theme?.typography?.fontFamily || config.style?.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: config.theme?.typography?.baseSize || config.style?.fontSize || 14,
        position: config.style?.position || 'bottom-right',
        cornerRadius: config.style?.cornerRadius || 12,
      },
      features: {
        fileAttachmentsEnabled: config.composer?.attachments?.enabled || config.features?.fileAttachmentsEnabled || false,
        allowedExtensions: config.composer?.attachments?.accept || config.features?.allowedExtensions || ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
        maxFileSizeKB: config.composer?.attachments?.maxSize ? config.composer.attachments.maxSize / 1024 : config.features?.maxFileSizeKB || 5000,
      }
    };
  }

  /**
   * Initialize and render the widget
   */
  public render(): void {
    // Inject global styles
    this.injectGlobalStyles();

    // Render based on mode
    if (this.mode === 'portal') {
      const renderer = new PortalRenderer(this.config, this);
      renderer.render();
    } else if (this.mode === 'embedded') {
      // Embedded renderer implementation
      const renderer = new NormalRenderer(this.config, this);
      renderer.render();
    } else {
      const renderer = new NormalRenderer(this.config, this);
      renderer.render(); // This populates this.ui
    }

    // Auto-open if configured or in portal mode
    if (this.mode === 'portal' || this.mode === 'embedded') {
      this.isOpen = true;
      // In portal/embedded, we might not need to toggle, but ensure visibility
    }
  }

  /**
   * Inject CSS variables and font faces
   */
  private injectGlobalStyles(): void {
    const cssVariables = createCSSVariables(this.config);
    const fontFaceCSS = createFontFaceCSS(this.config);

    const styleEl = document.createElement('style');
    styleEl.id = 'n8n-chat-widget-styles';
    styleEl.textContent = `
      ${fontFaceCSS}
      :root {
        ${Object.entries(cssVariables).map(([key, value]) => `${key}: ${value};`).join('\n        ')}
      }
      /* Shared Utility Classes */
      .n8n-typing-container { display: flex; gap: 4px; padding: 4px 0; }
      .n8n-typing-dot {
        width: 8px; height: 8px; background: var(--cw-icon-color, #64748b);
        border-radius: 50%; animation: n8n-typing 1.4s infinite ease-in-out both;
      }
      .n8n-typing-dot:nth-child(1) { animation-delay: -0.32s; }
      .n8n-typing-dot:nth-child(2) { animation-delay: -0.16s; }
      @keyframes n8n-typing {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }
      .n8n-message-content p { margin: 0 0 0.5em 0; }
      .n8n-message-content p:last-child { margin-bottom: 0; }
      .n8n-message-content code {
        background: var(--cw-surface-fg, #f1f5f9); padding: 2px 6px;
        border-radius: 4px; font-family: var(--cw-font-family-mono, ui-monospace, monospace);
        font-size: 0.9em;
      }
      .n8n-message-content pre {
        background: ${this.config.style?.theme === 'dark' ? '#0d0d0d' : '#1e293b'};
        color: #e2e8f0; padding: 12px; border-radius: 8px; overflow-x: auto; margin: 0.5em 0;
      }
    `;
    document.head.appendChild(styleEl);
  }

  /**
   * Toggle chat window visibility
   */
  public toggleChat(): void {
    if (this.mode === 'portal' || this.mode === 'embedded') return; // Always open

    this.isOpen = !this.isOpen;
    if (this.ui.chatWindow && this.ui.bubble) {
      if (this.isOpen) {
        this.ui.chatWindow.style.display = 'flex';
        this.ui.bubble.style.display = 'none';

        // Add first message if needed
        if (this.messages.length === 0 && this.config.branding?.firstMessage) {
          this.addMessage('assistant', this.config.branding.firstMessage);
        }

        this.ui.input?.focus();
      } else {
        this.ui.chatWindow.style.display = 'none';
        this.ui.bubble.style.display = 'flex';
      }
    }
  }

  /**
   * Add a message to the state and UI
   */
  public addMessage(role: 'user' | 'assistant', content: string, isLoading = false): Message {
    const message: Message = {
      id: `msg-${++this.messageIdCounter}`,
      role,
      content,
      timestamp: Date.now(),
    };
    this.messages.push(message);

    if (this.ui.messagesContainer) {
      const messageEl = document.createElement('div');
      messageEl.id = message.id;
      messageEl.style.cssText = `
        margin-bottom: var(--cw-spacing-md, 12px);
        display: flex;
        ${role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
      `;

      const bubble = document.createElement('div');
      bubble.className = 'n8n-message-content';
      bubble.style.cssText = `
        max-width: 75%;
        padding: var(--cw-spacing-sm, 10px) var(--cw-spacing-md, 14px);
        border-radius: var(--cw-radius-lg, 12px);
        font-size: var(--cw-font-size, 14px);
        line-height: 1.5;
        ${role === 'user'
          ? `background: var(--cw-user-msg-bg, var(--cw-accent-primary, ${this.config.style?.primaryColor})); color: var(--cw-user-msg-text, #ffffff);`
          : `background: var(--cw-assistant-msg-bg, ${this.config.style?.theme === 'dark' ? '#2a2a2a' : '#f3f4f6'}); color: var(--cw-assistant-msg-text, ${this.config.style?.theme === 'dark' ? '#e5e5e5' : '#1f2937'}); box-shadow: var(--cw-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));`}
      `;

      if (role === 'assistant') {
        if (isLoading) {
          bubble.innerHTML = `
            <div class="n8n-typing-container">
              <div class="n8n-typing-dot"></div><div class="n8n-typing-dot"></div><div class="n8n-typing-dot"></div>
            </div>
          `;
        } else {
          bubble.innerHTML = renderMarkdown(content);
        }
      } else {
        bubble.textContent = content;
      }

      messageEl.appendChild(bubble);
      this.ui.messagesContainer.appendChild(messageEl);
      this.ui.messagesContainer.scrollTop = this.ui.messagesContainer.scrollHeight;
    }

    return message;
  }

  /**
   * Update an existing message (for streaming or stop loading)
   */
  public updateMessage(messageId: string, content: string): void {
    const messageEl = this.ui.messagesContainer?.querySelector(`#${messageId}`);
    if (messageEl) {
      const bubble = messageEl.querySelector('.n8n-message-content');
      if (bubble) {
        bubble.innerHTML = renderMarkdown(content);
      }
    }

    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.content = content;
    }

    if (this.ui.messagesContainer) {
      this.ui.messagesContainer.scrollTop = this.ui.messagesContainer.scrollHeight;
    }
  }

  /**
   * Handle send action
   */
  public async handleSendMessage(): Promise<void> {
    if (!this.ui.input) return;

    const text = this.ui.input.value.trim();
    if (!text) return;

    this.addMessage('user', text);
    this.ui.input.value = '';

    const assistantMessage = this.addMessage('assistant', '', true);

    try {
      await this.streamResponse(text, assistantMessage.id);
    } catch (error) {
      console.error('[N8n Chat Widget] Error sending message:', error);
      this.updateMessage(assistantMessage.id, 'Sorry, there was an error processing your message. Please try again.');
    }
  }

  /**
   * Send message to N8n/Relay
   */
  private async streamResponse(userMessage: string, assistantMessageId: string): Promise<void> {
    const relayUrl = this.config.connection?.relayEndpoint || this.config.connection?.webhookUrl;
    if (!relayUrl) throw new Error('No relay URL configured');

    const sessionId = this.sessionManager.getSessionId();
    const shouldCaptureContext = this.config.connection?.captureContext !== false;

    let fileAttachments: FileAttachment[] | undefined;
    if (this.selectedFiles.length > 0 && this.config.features.fileAttachmentsEnabled) {
      fileAttachments = await Promise.all(this.selectedFiles.map(f => this.encodeFile(f)));
      this.selectedFiles = [];
      if (this.ui.fileInput) this.ui.fileInput.value = '';
    }

    const payload = buildRelayPayload({
      uiConfig: this.config,
      relay: {
        relayUrl,
        widgetId: this.config.widgetId || 'default',
        licenseKey: this.config.license?.key || 'default'
      }
    }, {
      message: userMessage,
      sessionId,
      context: shouldCaptureContext ? this.capturePageContext() : undefined,
      customContext: this.config.connection?.customContext,
      attachments: fileAttachments
    });

    const response = await fetch(relayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const assistantResponse = data.response || data.message || data.output || 'No response received';
    this.updateMessage(assistantMessageId, assistantResponse);
  }

  /**
   * Capture page context
   */
  private capturePageContext() {
    try {
      const url = new URL(window.location.href);
      return {
        pageUrl: window.location.href,
        pagePath: window.location.pathname,
        pageTitle: document.title,
        queryParams: Object.fromEntries(url.searchParams),
        domain: window.location.hostname,
      };
    } catch {
      return {};
    }
  }

  /**
   * Encode file to base64
   */
  private async encodeFile(file: File): Promise<FileAttachment> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        name: file.name,
        type: file.type,
        data: (reader.result as string).split(',')[1],
        size: file.size
      });
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Handle file selection from input
   */
  public handleFileSelect(files: FileList | null): void {
    if (files) {
      this.selectedFiles = Array.from(files);
      console.log(`[Widget] Selected ${this.selectedFiles.length} files`);
    }
  }
}
