/**
 * NormalRenderer
 *
 * Handles rendering logic for normal mode (bubble + chat window)
 * Includes fullscreen toggle capability
 */

import { ExtendedWidgetConfig } from './widget';
import { UIBuilder } from './ui-builder';

export class NormalRenderer {
  private config: ExtendedWidgetConfig;
  private chatWindow: HTMLElement | null = null;
  private bubble: HTMLElement | null = null;
  private isFullscreen: boolean = false;
  private escKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  private uiBuilder: UIBuilder;

  constructor(config: ExtendedWidgetConfig) {
    this.config = config;
    this.uiBuilder = new UIBuilder(config);
  }

  /**
   * Render normal mode - bubble + chat window with fullscreen toggle
   */
  public render(): { chatWindow: HTMLElement; bubble: HTMLElement } {
    // Create bubble button
    this.bubble = this.createBubble();
    document.body.appendChild(this.bubble);

    // Create chat window (initially hidden)
    this.chatWindow = this.createChatWindow();
    document.body.appendChild(this.chatWindow);

    // Setup bubble click handler
    this.bubble.addEventListener('click', () => {
      this.toggleChatWindow();
    });

    // Setup ESC key handler for fullscreen
    this.escKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isFullscreen) {
        this.exitFullscreen();
      }
    };
    document.addEventListener('keydown', this.escKeyHandler);

    return { chatWindow: this.chatWindow, bubble: this.bubble };
  }

  /**
   * Create bubble button
   */
  private createBubble(): HTMLElement {
    const bubble = document.createElement('button');
    bubble.className = 'chat-bubble';
    bubble.innerHTML = '💬';
    bubble.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${this.config.style?.primaryColor || '#00bfff'};
      color: white;
      border: none;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999998;
    `;
    return bubble;
  }

  /**
   * Create chat window
   */
  private createChatWindow(): HTMLElement {
    const chatWindow = document.createElement('div');
    chatWindow.className = 'chat-window';
    chatWindow.id = 'n8n-chat-window';
    chatWindow.style.cssText = `
      position: absolute;
      bottom: 90px;
      right: 20px;
      width: 400px;
      height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.2);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 999999;
      ${this.config.style?.theme === 'dark' ? 'background: #1a1a1a; color: white;' : ''}
    `;

    // Create header with fullscreen toggle
    const header = this.uiBuilder.createHeader({
      title: this.config.branding?.companyName || 'Chat',
      showMinimize: true,
      showFullscreenToggle: true,
      onMinimize: () => this.toggleChatWindow(),
      onFullscreenToggle: () => this.toggleFullscreen()
    });
    chatWindow.appendChild(header);

    // Create messages area
    const messagesArea = this.uiBuilder.createMessagesArea();
    chatWindow.appendChild(messagesArea);

    // Create input area
    const inputArea = this.uiBuilder.createInputArea();
    chatWindow.appendChild(inputArea);

    return chatWindow;
  }

  /**
   * Toggle chat window visibility
   */
  private toggleChatWindow(): void {
    if (!this.chatWindow) return;

    if (this.chatWindow.style.display === 'none') {
      this.chatWindow.style.display = 'flex';
    } else {
      this.chatWindow.style.display = 'none';
    }
  }

  /**
   * Toggle fullscreen mode
   */
  private toggleFullscreen(): void {
    if (this.isFullscreen) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  /**
   * Enter fullscreen mode
   */
  private enterFullscreen(): void {
    if (!this.chatWindow || !this.bubble) return;

    this.isFullscreen = true;

    // Add fullscreen class
    this.chatWindow.classList.add('fullscreen');

    // Hide bubble
    this.bubble.style.display = 'none';

    // Apply fullscreen styles
    Object.assign(this.chatWindow.style, {
      position: 'fixed',
      top: '0px',
      left: '0px',
      bottom: '0',
      right: '0',
      width: '100%',
      height: '100%',
      borderRadius: '0',
      maxWidth: 'none',
      maxHeight: 'none'
    });

    // Update toggle button
    const toggleBtn = this.chatWindow.querySelector('.fullscreen-toggle-btn') as HTMLElement;
    if (toggleBtn) {
      toggleBtn.innerHTML = '◲'; // Exit fullscreen icon
      toggleBtn.title = 'Exit fullscreen';
    }
  }

  /**
   * Exit fullscreen mode
   */
  private exitFullscreen(): void {
    if (!this.chatWindow || !this.bubble) return;

    this.isFullscreen = false;

    // Remove fullscreen class
    this.chatWindow.classList.remove('fullscreen');

    // Show bubble
    this.bubble.style.display = 'block';

    // Restore normal styles
    Object.assign(this.chatWindow.style, {
      position: 'absolute',
      bottom: '90px',
      right: '20px',
      top: 'auto',
      left: 'auto',
      width: '400px',
      height: '600px',
      borderRadius: '12px',
      maxWidth: '400px',
      maxHeight: '600px'
    });

    // Update toggle button
    const toggleBtn = this.chatWindow.querySelector('.fullscreen-toggle-btn') as HTMLElement;
    if (toggleBtn) {
      toggleBtn.innerHTML = '◱'; // Enter fullscreen icon
      toggleBtn.title = 'Enter fullscreen';
    }
  }

  /**
   * Cleanup event listeners
   */
  public destroy(): void {
    if (this.escKeyHandler) {
      document.removeEventListener('keydown', this.escKeyHandler);
    }
  }
}
