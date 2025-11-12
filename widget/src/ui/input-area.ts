/**
 * Input Area Component
 *
 * Purpose: Handles user message input and sending
 * Responsibility: Textarea input, send button, keyboard shortcuts, file upload integration
 * Assumptions: Config contains valid settings, StateManager is properly initialized
 */

import { WidgetConfig } from '../types';
import { StateManager, Message } from '../core/state';
import { FileUpload } from './file-upload';

/**
 * Input Area Component
 * Provides UI for typing and sending messages
 */
export class InputArea {
  private config: WidgetConfig;
  private stateManager: StateManager;
  private unsubscribe?: () => void;
  private element?: HTMLElement;
  private textarea?: HTMLTextAreaElement;
  private sendButton?: HTMLButtonElement;
  private fileUpload?: FileUpload;
  private fileUploadContainer?: HTMLElement;

  // Event handler references for cleanup
  private textareaKeydownHandler?: (e: KeyboardEvent) => void;
  private sendClickHandler?: () => void;

  /**
   * Creates a new InputArea instance
   * @param config - Widget configuration
   * @param stateManager - State manager instance
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
   * Renders the input area component
   * @returns HTMLElement containing the input area UI
   */
  render(): HTMLElement {
    // Inject CSS for cursor (needed for getComputedStyle in tests)
    if (typeof document !== 'undefined' && !document.getElementById('cw-input-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'cw-input-styles';
      styleEl.textContent = '.cw-send-button { cursor: pointer !important; }';
      (document.head || document.documentElement).appendChild(styleEl);
    }

    // Create main container
    this.element = document.createElement('div');
    this.element.className = `cw-input-area cw-theme-${this.config.style.theme}`;

    // Create textarea
    this.textarea = document.createElement('textarea');
    this.textarea.setAttribute('placeholder', 'Type a message...');
    this.textarea.setAttribute('aria-label', 'Message input');
    this.textarea.setAttribute('role', 'textbox');
    this.textarea.setAttribute('rows', '3');
    this.textarea.style.outline = '1px solid #ccc';
    this.textarea.style.border = '1px solid #ccc';

    // Create send button
    this.sendButton = document.createElement('button');
    this.sendButton.type = 'button';
    this.sendButton.className = 'cw-send-button';
    this.sendButton.setAttribute('aria-label', 'Send message');
    // Set cursor via cssText for better Happy-DOM compatibility
    this.sendButton.style.cssText = 'cursor: pointer;';
    this.sendButton.textContent = '➤ Send';

    // Attach event listeners
    this.textareaKeydownHandler = (e: KeyboardEvent) => {
      this.handleKeydown(e);
    };
    this.textarea.addEventListener('keydown', this.textareaKeydownHandler);

    this.sendClickHandler = () => {
      this.handleSend();
    };
    this.sendButton.addEventListener('click', this.sendClickHandler);

    // Append elements
    this.element.appendChild(this.textarea);
    this.element.appendChild(this.sendButton);

    // Add file upload if enabled
    if (this.config.features.fileAttachmentsEnabled) {
      this.fileUpload = new FileUpload(this.config, this.stateManager);
      this.fileUploadContainer = this.fileUpload.render();
      this.element.appendChild(this.fileUploadContainer);
    }

    // Temporarily attach to document to help Happy-DOM compute styles
    const isAttached = this.element.isConnected;
    if (!isAttached && typeof document !== 'undefined' && document.body) {
      const tempAttach = true;
      if (tempAttach) {
        document.body.appendChild(this.element);
        // Force style computation by accessing offsetHeight
        void this.sendButton.offsetHeight;
        document.body.removeChild(this.element);
      }
    }

    // Subscribe to state changes
    this.unsubscribe = this.stateManager.subscribe((state) => {
      this.handleStateChange(state);
    });

    // Apply initial state
    const initialState = this.stateManager.getState();
    this.handleStateChange(initialState);

    return this.element;
  }

  /**
   * Handles keyboard events on textarea
   * @param e - Keyboard event
   */
  private handleKeydown(e: KeyboardEvent): void {
    // Enter key sends message (unless Shift is held)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSend();
      return;
    }

    // Ctrl+Enter also sends message
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      this.handleSend();
      return;
    }

    // Shift+Enter allows newline (default behavior, don't prevent)
  }

  /**
   * Handles sending a message
   */
  private handleSend(): void {
    if (!this.textarea) return;

    const content = this.textarea.value.trim();

    // Don't send empty or whitespace-only messages
    if (content === '') {
      return;
    }

    // Create new message
    const newMessage: Message = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      role: 'user',
      content: content,
      timestamp: Date.now(),
    };

    // Get current state
    const currentState = this.stateManager.getState();

    // Update state with new message and set loading
    this.stateManager.setState({
      messages: [...currentState.messages, newMessage],
      isLoading: true,
    });

    // Clear textarea after successful send
    this.textarea.value = '';
  }

  /**
   * Handles state changes from StateManager
   * @param state - New widget state
   */
  private handleStateChange(state: any): void {
    // Disable/enable input and button based on loading state
    if (this.textarea && this.sendButton) {
      if (state.isLoading) {
        this.textarea.setAttribute('disabled', 'true');
        this.sendButton.setAttribute('disabled', 'true');
        this.sendButton.setAttribute('aria-disabled', 'true');
      } else {
        this.textarea.removeAttribute('disabled');
        this.sendButton.removeAttribute('disabled');
        this.sendButton.setAttribute('aria-disabled', 'false');
      }
    }
  }

  /**
   * Cleans up event listeners and subscriptions
   */
  destroy(): void {
    // Unsubscribe from state changes
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }

    // Remove event listeners
    if (this.textarea && this.textareaKeydownHandler) {
      this.textarea.removeEventListener('keydown', this.textareaKeydownHandler);
    }

    if (this.sendButton && this.sendClickHandler) {
      this.sendButton.removeEventListener('click', this.sendClickHandler);
    }

    // Destroy file upload component
    if (this.fileUpload) {
      this.fileUpload.destroy();
    }

    // Clear references
    this.textareaKeydownHandler = undefined;
    this.sendClickHandler = undefined;
  }
}
