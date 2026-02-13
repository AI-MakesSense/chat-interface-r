/**
 * Message List Component
 *
 * Purpose: Renders the scrollable list of chat messages with auto-scroll
 * Responsibility: Display messages, handle empty state, manage scroll behavior
 * Assumptions: Messages come from state, config provides welcome messages
 */

import { WidgetConfig } from '../types';
import { StateManager, Message } from '../core/state';

/**
 * HTML escape helper to prevent XSS
 */
function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Helper to convert hex to RGB for happy-dom compatibility
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return hex; // Return as-is if not valid hex
}

/**
 * MessageList component for displaying chat messages
 */
export class MessageList {
  private config: WidgetConfig;
  private stateManager: StateManager;
  private element: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  private scrollHandler: (() => void) | null = null;
  private userScrolledUp: boolean = false;
  private previousMessageCount: number = 0;

  /**
   * Creates a new MessageList instance
   * @param config - Widget configuration
   * @param stateManager - State manager instance
   * @throws Error if config or stateManager is null/undefined
   */
  constructor(config: WidgetConfig, stateManager: StateManager) {
    if (!config) {
      throw new Error('Config is required');
    }
    if (!stateManager) {
      throw new Error('StateManager is required');
    }
    this.config = config;
    this.stateManager = stateManager;
  }

  /**
   * Renders the message list element
   * @returns The message list element
   */
  render(): HTMLElement {
    // Create message list container
    const container = document.createElement('div');
    container.className = 'cw-message-list';
    container.setAttribute('role', 'log');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-label', 'Chat message list');

    // Apply theme class
    const theme = this.config.style.theme || 'light';
    container.classList.add(`cw-theme-${theme}`);

    // Apply inline styles
    const styleRules: string[] = [
      'overflow-y: auto',
      'flex-grow: 1',
      'padding: 16px',
      `background-color: ${hexToRgb(this.config.style.backgroundColor || '#ffffff')}`,
      `color: ${hexToRgb(this.config.style.textColor || '#000000')}`,
    ];
    container.style.cssText = styleRules.join('; ');

    // Store element reference
    this.element = container;

    // Render initial messages
    this.renderMessages();

    // Setup scroll handler to detect when user scrolls up
    this.scrollHandler = () => {
      if (!this.element) return;

      const { scrollTop, scrollHeight, clientHeight } = this.element;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      this.userScrolledUp = !isAtBottom;
    };
    container.addEventListener('scroll', this.scrollHandler);

    // Subscribe to state changes
    this.unsubscribe = this.stateManager.subscribe((state) => {
      const currentMessageCount = state.messages.length;

      // Only re-render if messages changed
      if (currentMessageCount !== this.previousMessageCount ||
          state.messages !== this.stateManager.getState().messages) {
        // Check if user is at bottom BEFORE re-rendering
        const wasAtBottom = this.isAtBottom();

        this.renderMessages();

        // Scroll to the top of the last message so user can read from the start
        if (wasAtBottom) {
          this.scrollToLastMessage();
        }

        this.previousMessageCount = currentMessageCount;
      }
    });

    // Temporarily attach to document for computed styles to work in happy-dom
    const wasInDocument = container.parentNode !== null;
    if (!wasInDocument && typeof document !== 'undefined' && document.body) {
      document.body.appendChild(container);
    }

    // Initial scroll to bottom
    this.scrollToBottom();

    // Also schedule async scroll attempts for when element dimensions are available
    Promise.resolve().then(() => this.scrollToBottom());
    setTimeout(() => this.scrollToBottom(), 0);

    //  Call once more immediately before returning (in case element was attached and has dimensions now)
    this.scrollToBottom();

    return container;
  }

  /**
   * Renders messages into the container
   */
  private renderMessages(): void {
    if (!this.element) return;

    const state = this.stateManager.getState();
    const messages = state.messages || [];

    // Clear existing content
    this.element.innerHTML = '';

    // Show empty state if no messages
    if (messages.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'cw-empty-state';
      emptyState.style.cssText = 'text-align: center; padding: 32px 16px; color: #888;';

      const welcomeText = document.createElement('div');
      welcomeText.style.cssText = 'font-size: 18px; font-weight: 600; margin-bottom: 12px;';
      welcomeText.textContent = this.config.branding.welcomeText || 'Welcome!';
      emptyState.appendChild(welcomeText);

      const firstMessage = document.createElement('div');
      firstMessage.style.cssText = 'font-size: 14px;';
      firstMessage.textContent = this.config.branding.firstMessage || 'How can I help you?';
      emptyState.appendChild(firstMessage);

      this.element.appendChild(emptyState);
      return;
    }

    // Render each message
    messages.forEach((message: Message) => {
      const messageElement = document.createElement('div');
      messageElement.className = 'cw-message';

      // Add role-specific class
      if (message.role === 'user') {
        messageElement.classList.add('cw-message-user');
      } else if (message.role === 'assistant') {
        messageElement.classList.add('cw-message-assistant');
      }

      // Apply message styling
      const isUser = message.role === 'user';
      const baseStyles = [
        'margin-bottom: 12px',
        'padding: 12px 16px',
        'border-radius: 12px',
        'max-width: 80%',
        'word-wrap: break-word',
      ];

      if (isUser) {
        baseStyles.push(
          'margin-left: auto',
          `background-color: ${hexToRgb(this.config.style.primaryColor || '#00bfff')}`,
          'color: white',
          'text-align: right'
        );
      } else {
        baseStyles.push(
          'margin-right: auto',
          'background-color: #f0f0f0',
          'color: #333',
          'text-align: left'
        );
      }

      messageElement.style.cssText = baseStyles.join('; ');

      // Set message content (escaped for security)
      messageElement.textContent = message.content || '';

      this.element!.appendChild(messageElement);
    });

    this.previousMessageCount = messages.length;
  }

  /**
   * Checks if the user is scrolled to the bottom
   */
  private isAtBottom(): boolean {
    if (!this.element) return true;

    const { scrollTop, scrollHeight, clientHeight } = this.element;
    return scrollTop + clientHeight >= scrollHeight - 10;
  }

  /**
   * Scrolls so the last message's top is visible (user reads from start).
   * Falls back to scroll-to-bottom if no messages exist.
   */
  private scrollToLastMessage(): void {
    if (!this.element) return;

    const messages = this.element.querySelectorAll('.cw-message');
    const lastMessage = messages[messages.length - 1] as HTMLElement | undefined;

    if (lastMessage) {
      lastMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Fallback: scroll to bottom (empty/initial state)
      this.element.scrollTop = this.element.scrollHeight;
    }
  }

  /**
   * Scrolls to the bottom of the message list (used for initial render)
   */
  private scrollToBottom(): void {
    if (!this.element) return;

    this.element.scrollTop = this.element.scrollHeight;

    if (this.element.scrollTo) {
      this.element.scrollTo({
        top: this.element.scrollHeight,
        behavior: 'smooth'
      });
    }

    setTimeout(() => {
      if (this.element) {
        this.element.scrollTop = this.element.scrollHeight;
      }
    }, 0);
  }

  /**
   * Destroys the message list and cleans up resources
   */
  destroy(): void {
    // Unsubscribe from state
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    // Remove scroll listener
    if (this.element && this.scrollHandler) {
      this.element.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }

    // Remove element from DOM if attached
    if (this.element?.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.element = null;
  }
}
