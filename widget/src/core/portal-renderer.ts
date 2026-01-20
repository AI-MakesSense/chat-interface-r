/**
 * PortalRenderer
 *
 * Handles rendering logic for portal mode (fullscreen chat)
 * Extracted from Widget class for better separation of concerns
 */

import { ExtendedWidgetConfig, Widget } from './widget';

export class PortalRenderer {
  private config: ExtendedWidgetConfig;
  private widget: Widget;
  private chatWindow: HTMLElement | null = null;

  constructor(config: ExtendedWidgetConfig, widget: Widget) {
    this.config = config;
    this.widget = widget;
  }

  /**
   * Render portal mode - fullscreen chat
   */
  public render(): HTMLElement {
    const targetContainer = document.getElementById('chat-portal') || document.body;

    // Create chat window (no bubble in portal mode)
    this.chatWindow = this.createChatWindow({
      position: 'fullscreen',
      showMinimize: false,
      showHeader: this.config.portal?.showHeader ?? true,
      headerTitle: this.config.portal?.headerTitle || this.config.branding?.companyName || 'Chat'
    });

    // Apply portal-specific styles
    this.applyPortalStyles(this.chatWindow);

    // Add responsive classes
    this.addResponsiveClasses(this.chatWindow);

    // Add to DOM
    targetContainer.appendChild(this.chatWindow);

    // Make visible immediately
    this.chatWindow.classList.add('visible');
    this.chatWindow.style.display = 'flex';

    // Populate widget UI references
    this.widget.ui.chatWindow = this.chatWindow;
    this.widget.ui.messagesContainer = this.chatWindow.querySelector('.chat-messages');
    this.widget.ui.input = this.chatWindow.querySelector('.chat-input');
    this.widget.ui.sendBtn = this.chatWindow.querySelector('.send-btn') as HTMLElement;

    // Bind events
    this.bindEvents();

    // Auto-focus input
    this.autoFocusInput();

    return this.chatWindow;
  }

  /**
   * Bind DOM events to widget methods
   */
  private bindEvents(): void {
    if (this.widget.ui.sendBtn) {
      this.widget.ui.sendBtn.addEventListener('click', () => this.widget.handleSendMessage());
    }

    if (this.widget.ui.input) {
      this.widget.ui.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.widget.handleSendMessage();
        }
      });
    }
  }

  /**
   * Create chat window element
   */
  private createChatWindow(options: {
    position: 'fullscreen' | 'normal';
    showMinimize: boolean;
    showHeader: boolean;
    headerTitle: string;
  }): HTMLElement {
    const chatWindow = document.createElement('div');
    chatWindow.className = 'chat-window';
    chatWindow.id = 'n8n-chat-window';

    // Apply base styles
    const baseStyles = `
      background: ${this.config.style?.theme === 'dark' ? '#1a1a1a' : 'white'};
      color: ${this.config.style?.theme === 'dark' ? 'white' : 'inherit'};
      flex-direction: column;
      overflow: hidden;
    `;

    chatWindow.style.cssText = baseStyles;

    // Create header (if enabled)
    if (options.showHeader) {
      const header = this.createHeader(options.headerTitle, options.showMinimize);
      chatWindow.appendChild(header);
    }

    // Create messages area
    const messagesArea = this.createMessagesArea();
    chatWindow.appendChild(messagesArea);

    // Create input area
    const inputArea = this.createInputArea();
    chatWindow.appendChild(inputArea);

    return chatWindow;
  }

  /**
   * Create header element
   */
  private createHeader(title: string, showMinimize: boolean): HTMLElement {
    const header = document.createElement('div');
    header.className = 'chat-header';
    header.style.cssText = `
      padding: 16px;
      background: ${this.config.style?.primaryColor || '#00bfff'};
      color: white;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    // Title
    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    header.appendChild(titleEl);

    return header;
  }

  /**
   * Create messages area
   */
  private createMessagesArea(): HTMLElement {
    const messagesArea = document.createElement('div');
    messagesArea.className = 'chat-messages';
    messagesArea.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    `;

    // Add welcome message
    if (this.config.branding?.firstMessage) {
      // We don't verify against widget.messages length here because render usually happens once.
      // But we should let the Widget class manage messages.
      // However, for initial render, we can just rely on the Widget class adding it if needed.
      // Or we can pre-render it here if the widget state is empty.
      // Given Widget logic: it adds message on toggleChat. For Portal, it's always open.
      // So we should probably let Widget add it in render() or manually here.
      // Current Widget logic adds it in toggleChat() if messages.length === 0.
      // Since Portal calls addMessage explicitly on init in my new Widget class, we might duplicate it if we keep this.
      // I will REMOVE this manual addition here and rely on Widget class state.
      // Wait, the Widget.ts addMessage logic adds to DOM.
      // So we just return an empty container here.
    }

    return messagesArea;
  }

  /**
   * Create input area
   */
  private createInputArea(): HTMLElement {
    const inputArea = document.createElement('div');
    inputArea.className = 'chat-input-area';
    inputArea.style.cssText = `
      padding: 16px;
      border-top: 1px solid ${this.config.style?.theme === 'dark' ? '#333' : '#e0e0e0'};
      display: flex;
      gap: 8px;
    `;

    // Input field
    const input = document.createElement('input');
    input.className = 'chat-input';
    input.type = 'text';
    input.placeholder = 'Type your message...';
    input.style.cssText = `
      flex: 1;
      padding: 12px;
      border: 1px solid ${this.config.style?.theme === 'dark' ? '#333' : '#e0e0e0'};
      border-radius: 8px;
      font-size: 14px;
      background: ${this.config.style?.theme === 'dark' ? '#262626' : 'white'};
      color: ${this.config.style?.theme === 'dark' ? 'white' : 'inherit'};
    `;

    // Send button
    const sendBtn = document.createElement('button');
    sendBtn.className = 'send-btn';
    sendBtn.textContent = 'Send';
    sendBtn.style.cssText = `
      padding: 12px 24px;
      background: ${this.config.style?.primaryColor || '#00bfff'};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    `;

    inputArea.appendChild(input);
    inputArea.appendChild(sendBtn);

    return inputArea;
  }

  /**
   * Apply portal-specific styles (fullscreen)
   */
  private applyPortalStyles(element: HTMLElement): void {
    Object.assign(element.style, {
      width: '100%',
      height: '100%',
      position: 'fixed',
      top: '0',
      left: '0',
      bottom: '0',
      right: '0',
      borderRadius: '0',
      maxWidth: 'none',
      maxHeight: 'none',
      zIndex: '999999',
      display: 'flex'
    });
  }

  /**
   * Add responsive classes based on viewport
   */
  private addResponsiveClasses(element: HTMLElement): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (width < 768) {
      element.classList.add('mobile');
    }

    if (width > height) {
      element.classList.add('landscape');
    }
  }

  /**
   * Auto-focus the input field after render
   */
  private autoFocusInput(): void {
    setTimeout(() => {
      const input = document.querySelector('.chat-input') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 100);
  }
}
