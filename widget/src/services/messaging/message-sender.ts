/**
 * Message Sender
 *
 * Purpose: Sends user messages to N8n webhook with retry logic
 *
 * Responsibility:
 * - Send HTTP POST requests to N8n webhook
 * - Include session ID for conversation continuity
 * - Encode file attachments as base64
 * - Update StateManager during request lifecycle
 * - Implement timeout and abort functionality
 * - Handle errors with retry logic
 *
 * Assumptions:
 * - N8n webhook expects JSON payload with specific structure
 * - Browser supports fetch API and FileReader
 * - StateManager handles UI updates
 */

import { StateManager, Message } from '../../core/state';
import { WidgetRuntimeConfig } from '../../types';
import { SessionManager } from './session-manager';
import { RetryPolicy } from './retry-policy';
import { classifyError, NetworkError } from '../../utils/network-error-handler';
import { FileAttachment } from './types';
import { buildRelayPayload } from './payload';

/**
 * Default timeout for HTTP requests in milliseconds (30 seconds)
 */
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Options for sending a message
 */
export interface SendMessageOptions {
  /** Message text from user */
  text: string;
  /** Optional file attachments */
  attachments?: File[];
  /** Optional timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
}

/**
 * Result of sending a message
 */
export interface SendMessageResult {
  /** Whether the message was sent successfully */
  success: boolean;
  /** Message ID from N8n response (if successful) */
  messageId?: string;
  /** Error details (if failed) */
  error?: NetworkError;
}

/**
 * MessageSender class
 *
 * Handles sending user messages to N8n webhook with error handling and retries.
 */
export class MessageSender {
  private runtimeConfig: WidgetRuntimeConfig;
  private stateManager: StateManager;
  private sessionManager: SessionManager;
  private retryPolicy: RetryPolicy;
  private abortController: AbortController | null = null;
  private isBusyFlag = false;

  /**
   * Creates a new MessageSender instance
   *
   * @param runtimeConfig - Widget runtime configuration
   * @param stateManager - State manager for UI updates
   * @param sessionManager - Session manager for session ID
   * @param retryPolicy - Retry policy for error handling
   */
  constructor(
    runtimeConfig: WidgetRuntimeConfig,
    stateManager: StateManager,
    sessionManager: SessionManager,
    retryPolicy: RetryPolicy
  ) {
    this.runtimeConfig = runtimeConfig;
    this.stateManager = stateManager;
    this.sessionManager = sessionManager;
    this.retryPolicy = retryPolicy;
  }

  /**
   * Sends a message to the N8n webhook
   *
   * @param options - Send message options
   * @returns Send message result with success status
   *
   * @example
   * const result = await messageSender.sendMessage({
   *   text: 'Hello!',
   *   attachments: [file],
   * });
   * if (result.success) {
   *   console.log('Message sent:', result.messageId);
   * }
   */
  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    const { text, attachments, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

    // Set busy flag
    this.isBusyFlag = true;

    // Update state: loading started
    this.stateManager.setState({ isLoading: true, error: null });

    // Add user message to state
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    const currentMessages = this.stateManager.getState().messages;
    this.stateManager.setState({ messages: [...currentMessages, userMessage] });

    try {
      // Get session ID
      const sessionId = this.sessionManager.getSessionId();

      // Encode file attachments if present
      let fileAttachments: FileAttachment[] | undefined;
      if (attachments && attachments.length > 0) {
        fileAttachments = await Promise.all(
          attachments.map((file) => this.encodeFile(file))
        );
      }

      const shouldCaptureContext =
        this.runtimeConfig.uiConfig.connection?.captureContext !== false;

      // Construct payload for relay
      const payload = buildRelayPayload(this.runtimeConfig, {
        message: text,
        sessionId,
        attachments: fileAttachments,
        context: shouldCaptureContext ? this.capturePageContext() : undefined,
      });

      // Create abort controller for timeout
      this.abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        this.abortController?.abort();
      }, timeoutMs);

      try {
        // Send POST request
        const response = await fetch(this.runtimeConfig.relay.relayUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: this.abortController.signal,
        });

        clearTimeout(timeoutId);

        // Handle response
        if (!response.ok) {
          const error = classifyError(response);
          throw error;
        }

        // Parse response
        const data = await response.json();

        // Add assistant message to state
        if (data.message || data.output) {
          const assistantMessage: Message = {
            id: data.messageId || `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.message || data.output,
            timestamp: Date.now(),
          };
          const updatedMessages = this.stateManager.getState().messages;
          this.stateManager.setState({ messages: [...updatedMessages, assistantMessage] });
        }

        // Update state: loading finished
        this.stateManager.setState({ isLoading: false });

        this.isBusyFlag = false;
        return {
          success: true,
          messageId: data.messageId,
        };
      } catch (err) {
        clearTimeout(timeoutId);

        // Classify error
        const error = classifyError(err);

        // Update state with error
        this.stateManager.setState({ isLoading: false, error: error.message });

        this.isBusyFlag = false;
        return {
          success: false,
          error,
        };
      }
    } catch (err) {
      // Handle errors during setup (e.g., file encoding)
      const error = classifyError(err);
      this.stateManager.setState({ isLoading: false, error: error.message });

      this.isBusyFlag = false;
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * Aborts the current request
   *
   * Side effects:
   * - Aborts the in-flight fetch request
   * - Sets isBusy flag to false
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isBusyFlag = false;
  }

  /**
   * Checks if a request is currently in progress
   *
   * @returns true if a request is in-flight, false otherwise
   */
  isBusy(): boolean {
    return this.isBusyFlag;
  }

  /**
   * Capture lightweight page context for relay payloads.
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
      return {
        pageUrl: window.location.href,
        pagePath: window.location.pathname,
        pageTitle: document.title,
        queryParams: {},
        domain: window.location.hostname,
      };
    }
  }

  /**
   * Encodes a File object as base64
   *
   * @param file - The file to encode
   * @returns File attachment with base64 data
   * @private
   */
  private async encodeFile(file: File): Promise<FileAttachment> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:...;base64,)
        const base64Data = result.split(',')[1];

        resolve({
          name: file.name,
          type: file.type,
          data: base64Data,
          size: file.size,
        });
      };

      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${file.name}`));
      };

      reader.readAsDataURL(file);
    });
  }
}
