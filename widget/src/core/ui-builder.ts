/**
 * UIBuilder
 *
 * Shared UI element builder for widget renderers
 * Extracts common element creation logic
 */

import { ExtendedWidgetConfig } from './widget';

export class UIBuilder {
  private config: ExtendedWidgetConfig;

  constructor(config: ExtendedWidgetConfig) {
    this.config = config;
  }

  /**
   * Create header element
   */
  public createHeader(options: {
    title: string;
    showMinimize?: boolean;
    showFullscreenToggle?: boolean;
    onMinimize?: () => void;
    onFullscreenToggle?: () => void;
  }): HTMLElement {
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
    titleEl.textContent = options.title;
    header.appendChild(titleEl);

    // Button container
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    // Fullscreen toggle button (if enabled)
    if (options.showFullscreenToggle && options.onFullscreenToggle) {
      const fullscreenBtn = this.createButton({
        className: 'fullscreen-toggle-btn',
        innerHTML: '◱',
        title: 'Enter fullscreen',
        onClick: options.onFullscreenToggle
      });
      btnContainer.appendChild(fullscreenBtn);
    }

    // Minimize button (if enabled)
    if (options.showMinimize && options.onMinimize) {
      const minimizeBtn = this.createButton({
        className: 'minimize-btn',
        innerHTML: '×',
        title: 'Close',
        fontSize: '24px',
        onClick: options.onMinimize
      });
      btnContainer.appendChild(minimizeBtn);
    }

    header.appendChild(btnContainer);

    return header;
  }

  /**
   * Create messages area
   */
  public createMessagesArea(): HTMLElement {
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
  public createInputArea(): HTMLElement {
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
   * Create button element
   */
  private createButton(options: {
    className: string;
    innerHTML: string;
    title: string;
    fontSize?: string;
    onClick: () => void;
  }): HTMLElement {
    const button = document.createElement('button');
    button.className = options.className;
    button.innerHTML = options.innerHTML;
    button.title = options.title;
    button.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: ${options.fontSize || '20px'};
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
    `;
    button.addEventListener('click', options.onClick);
    return button;
  }
}
