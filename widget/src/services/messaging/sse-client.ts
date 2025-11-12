/**
 * SSE Client
 *
 * Purpose: Manages Server-Sent Events (SSE) connections for streaming responses
 *
 * Responsibility:
 * - Establish and maintain EventSource connection
 * - Parse message chunks from N8n webhook
 * - Handle [DONE] signal to close connection
 * - Implement auto-reconnect with exponential backoff
 * - Expose connection state and lifecycle callbacks
 * - Clean up resources on disconnect
 *
 * Assumptions:
 * - N8n webhook sends message chunks as SSE events
 * - [DONE] signal indicates end of stream
 * - Browser supports EventSource API
 * - StateManager handles UI updates
 */

import { StateManager } from '../../core/state';

/**
 * SSE connection states
 */
export type SSEConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'closed';

/**
 * SSE configuration options
 */
export interface SSEClientConfig {
  /** Maximum reconnection attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Base delay for reconnection backoff in ms (default: 1000) */
  baseReconnectDelay?: number;
  /** Maximum delay for reconnection backoff in ms (default: 30000) */
  maxReconnectDelay?: number;
}

/**
 * SSEClient class
 *
 * Manages SSE connections with auto-reconnect and lifecycle callbacks.
 */
export class SSEClient {
  private stateManager: StateManager;
  private config: Required<SSEClientConfig>;
  private eventSource: EventSource | null = null;
  private connectionState: SSEConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: number | null = null;
  private currentUrl: string | null = null;
  private shouldReconnect = true;

  // Callbacks
  private messageChunkCallbacks: Array<(chunk: string) => void> = [];
  private stateChangeCallback: ((state: SSEConnectionState) => void) | null = null;
  private errorCallback: (() => void) | null = null;

  /**
   * Creates a new SSEClient instance
   *
   * @param stateManager - State manager for UI updates
   * @param config - SSE configuration options
   */
  constructor(stateManager: StateManager, config?: SSEClientConfig) {
    this.stateManager = stateManager;
    this.config = {
      maxReconnectAttempts: config?.maxReconnectAttempts ?? 5,
      baseReconnectDelay: config?.baseReconnectDelay ?? 1000,
      maxReconnectDelay: config?.maxReconnectDelay ?? 30000,
    };
  }

  /**
   * Establishes SSE connection to the given URL
   *
   * @param url - SSE endpoint URL
   *
   * Side effects:
   * - Creates EventSource connection
   * - Updates connection state
   * - Calls state change callback
   */
  connect(url: string): void {
    // If already connected or connecting to the same URL, don't create a new connection
    if (
      this.eventSource &&
      this.currentUrl === url &&
      (this.connectionState === 'connected' || this.connectionState === 'connecting')
    ) {
      return;
    }

    // Disconnect existing connection if any
    if (this.eventSource) {
      this.disconnect();
    }

    this.currentUrl = url;
    this.reconnectAttempts = 0;
    this.shouldReconnect = true;
    this.setState('connecting');
    this.establishConnection();
  }

  /**
   * Disconnects from SSE endpoint
   *
   * Side effects:
   * - Closes EventSource connection
   * - Clears reconnect timeout
   * - Resets connection state
   */
  disconnect(): void {
    this.shouldReconnect = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      // Remove event listeners to prevent further callbacks
      this.eventSource.onopen = null;
      this.eventSource.onmessage = null;
      this.eventSource.onerror = null;
      this.eventSource.close();
      this.eventSource = null;
    }

    this.currentUrl = null;
    this.reconnectAttempts = 0;
    this.setState('closed');
  }

  /**
   * Gets the current connection state
   *
   * @returns Current SSE connection state
   */
  getState(): SSEConnectionState {
    return this.connectionState;
  }

  /**
   * Gets the current EventSource instance (for testing)
   *
   * @returns Current EventSource instance or null
   * @internal
   */
  getEventSource(): EventSource | null {
    return this.eventSource;
  }

  /**
   * Registers callback for message chunks
   *
   * @param callback - Function to call when a message chunk is received
   */
  onMessageChunk(callback: (chunk: string) => void): void {
    this.messageChunkCallbacks.push(callback);
  }

  /**
   * Registers callback for state changes
   *
   * @param callback - Function to call when connection state changes
   */
  onStateChange(callback: (state: SSEConnectionState) => void): void {
    this.stateChangeCallback = callback;
  }

  /**
   * Registers callback for errors
   *
   * @param callback - Function to call when an error occurs
   */
  onError(callback: () => void): void {
    this.errorCallback = callback;
  }

  /**
   * Establishes EventSource connection
   *
   * Side effects:
   * - Creates EventSource instance
   * - Sets up event listeners
   * - Handles connection lifecycle
   * @private
   */
  private establishConnection(): void {
    if (!this.currentUrl) {
      return;
    }

    try {
      this.eventSource = new EventSource(this.currentUrl);

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0; // Reset on successful connection
        this.setState('connected');
      };

      this.eventSource.onmessage = (event: MessageEvent) => {
        const chunk = event.data;

        // Check for [DONE] signal
        if (chunk === '[DONE]') {
          this.setState('closed');
          this.disconnect();
          return;
        }

        // Update StateManager with streaming message
        const currentState = this.stateManager.getState();
        const currentMessage = currentState.currentStreamingMessage || '';
        this.stateManager.setState({
          currentStreamingMessage: currentMessage + chunk,
        });

        // Call all message chunk callbacks
        this.messageChunkCallbacks.forEach((callback) => callback(chunk));
      };

      this.eventSource.onerror = () => {
        // Close the current EventSource immediately on error
        if (this.eventSource) {
          this.eventSource.close();
        }

        this.setState('error');

        if (this.errorCallback) {
          this.errorCallback();
        }

        // Attempt reconnection if under max attempts and reconnection is allowed
        if (
          this.shouldReconnect &&
          this.reconnectAttempts < this.config.maxReconnectAttempts
        ) {
          this.scheduleReconnect();
        } else if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
          // Stop reconnecting after max attempts
          this.shouldReconnect = false;
          this.eventSource = null;
          this.setState('closed');
        }
      };
    } catch (error) {
      this.setState('error');
      if (this.errorCallback) {
        this.errorCallback();
      }
    }
  }

  /**
   * Schedules a reconnection attempt with exponential backoff
   *
   * Side effects:
   * - Sets reconnect timeout
   * - Increments reconnect attempts
   * - Calls establishConnection after delay
   * @private
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;

    // Check if we've exceeded max attempts after incrementing
    if (this.reconnectAttempts > this.config.maxReconnectAttempts) {
      this.shouldReconnect = false;
      this.setState('closed');
      return;
    }

    // Calculate exponential backoff delay
    const delay = Math.min(
      this.config.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.config.maxReconnectDelay
    );

    this.reconnectTimeout = window.setTimeout(() => {
      // Double-check we should still reconnect before establishing connection
      if (this.shouldReconnect && this.reconnectAttempts <= this.config.maxReconnectAttempts) {
        this.setState('connecting');
        this.establishConnection();
      }
    }, delay);
  }

  /**
   * Updates connection state and calls state change callback
   *
   * @param newState - New connection state
   *
   * Side effects:
   * - Updates connectionState
   * - Calls stateChangeCallback
   * @private
   */
  private setState(newState: SSEConnectionState): void {
    this.connectionState = newState;

    if (this.stateChangeCallback) {
      this.stateChangeCallback(newState);
    }
  }
}
