/**
 * PortalRenderer
 *
 * Handles rendering logic for portal mode (fullscreen chat)
 * Extracted from Widget class for better separation of concerns
 */

import { ExtendedWidgetConfig } from './widget';

export class PortalRenderer {
  private config: ExtendedWidgetConfig;
  private chatWindow: HTMLElement | null = null;

  constructor(config: ExtendedWidgetConfig) {
    this.config = config;
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

    // Make visible immediately (no toggle needed)
    this.chatWindow.classList.add('visible');
    this.chatWindow.style.display = 'flex';

    // Auto-focus input
    this.autoFocusInput();

    return this.chatWindow;
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
      background: white;
      flex-direction: column;
      overflow: hidden;
      ${this.config.style?.theme === 'dark' ? 'background: #1a1a1a; color: white;' : ''}
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

    // Minimize button (only if not portal mode)
    if (showMinimize) {
      const minimizeBtn = document.createElement('button');
      minimizeBtn.className = 'minimize-btn';
      minimizeBtn.innerHTML = '×';
      minimizeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
      `;
      header.appendChild(minimizeBtn);
    }

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
      const welcomeMsg = document.createElement('div');
      welcomeMsg.className = 'message assistant';
      welcomeMsg.style.cssText = `
        background: #f0f0f0;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
      `;
      welcomeMsg.textContent = this.config.branding.firstMessage;
      messagesArea.appendChild(welcomeMsg);
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
      border-top: 1px solid #e0e0e0;
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
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
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

    // Mobile detection
    if (width < 768) {
      element.classList.add('mobile');
    }

    // Landscape detection
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
