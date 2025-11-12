/**
 * RED Tests for SSE Client
 *
 * Tests for widget/src/services/messaging/sse-client.ts
 *
 * WHY THESE TESTS WILL FAIL:
 * - Production module does not exist yet (widget/src/services/messaging/sse-client.ts)
 * - SSEClient class is not implemented
 * - SSEConnectionState type is not defined
 * - This is the RED phase of TDD - tests are written BEFORE production code
 *
 * Test Coverage:
 * 1. Establish EventSource connection
 * 2. Parse message chunks and call onMessageChunk callback
 * 3. Handle [DONE] signal and close connection
 * 4. Auto-reconnect on connection error (with backoff)
 * 5. Stop reconnecting after max attempts
 * 6. Update connection state on lifecycle events
 * 7. Clean up EventSource on disconnect()
 *
 * Module Purpose:
 * - Manages Server-Sent Events (SSE) connection for streaming responses
 * - Parses message chunks from N8n webhook
 * - Handles [DONE] signal to close connection
 * - Implements auto-reconnect with exponential backoff
 * - Exposes connection state and lifecycle callbacks
 * - Cleans up resources on disconnect
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StateManager, WidgetState } from '@/widget/src/core/state';
// @ts-expect-error - Module does not exist yet (RED phase)
import { SSEClient, SSEConnectionState } from '@/widget/src/services/messaging/sse-client';

// Mock EventSource since Happy-DOM doesn't provide it
class MockEventSource {
  url: string;
  readyState: number;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  constructor(url: string) {
    this.url = url;
    this.readyState = MockEventSource.CONNECTING;

    // Simulate connection open after a short delay
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
  }

  // Helper method to simulate receiving a message
  simulateMessage(data: string) {
    if (this.onmessage) {
      const event = new MessageEvent('message', { data });
      this.onmessage(event);
    }
  }

  // Helper method to simulate an error
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Set up global EventSource mock
(global as any).EventSource = MockEventSource;

describe('SSEClient - RED Tests', () => {
  let stateManager: StateManager;
  let sseClient: SSEClient;
  let originalEventSource: any;

  beforeEach(() => {
    // Save original EventSource
    originalEventSource = (global as any).EventSource;
    // Reset to MockEventSource
    (global as any).EventSource = MockEventSource;

    // Initialize state manager
    const initialState: WidgetState = {
      isOpen: true,
      messages: [],
      isLoading: false,
      error: null,
      currentStreamingMessage: null,
    };
    stateManager = new StateManager(initialState);

    // Initialize SSE client
    sseClient = new SSEClient(stateManager);

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    if (sseClient) {
      sseClient.disconnect();
    }

    // Restore original EventSource
    (global as any).EventSource = originalEventSource;
  });

  // ============================================================
  // Test 1: Establish EventSource connection
  // ============================================================

  it('should establish EventSource connection', async () => {
    // ARRANGE
    const sseUrl = 'https://n8n.example.com/webhook/stream/session-123';

    const stateChangeSpy = vi.fn();
    sseClient.onStateChange(stateChangeSpy);

    // ACT
    sseClient.connect(sseUrl);

    // Wait for connection to open
    await new Promise((resolve) => setTimeout(resolve, 50));

    // ASSERT
    expect(sseClient.getState()).toBe('connected');

    // Verify state changes: disconnected -> connecting -> connected
    expect(stateChangeSpy).toHaveBeenCalledWith('connecting');
    expect(stateChangeSpy).toHaveBeenCalledWith('connected');
  });

  // ============================================================
  // Test 2: Parse message chunks and call onMessageChunk callback
  // ============================================================

  it('should parse message chunks and call onMessageChunk callback', async () => {
    // ARRANGE
    const sseUrl = 'https://n8n.example.com/webhook/stream/session-123';
    const messageChunkSpy = vi.fn();

    sseClient.onMessageChunk(messageChunkSpy);
    sseClient.connect(sseUrl);

    // Wait for connection to open
    await new Promise((resolve) => setTimeout(resolve, 50));

    // ACT
    // Get the EventSource instance created by connect()
    const mockEventSource = sseClient.getEventSource() as any;

    mockEventSource.simulateMessage('Hello');
    mockEventSource.simulateMessage(' world');
    mockEventSource.simulateMessage('!');

    // ASSERT
    expect(messageChunkSpy).toHaveBeenCalledTimes(3);
    expect(messageChunkSpy).toHaveBeenNthCalledWith(1, 'Hello');
    expect(messageChunkSpy).toHaveBeenNthCalledWith(2, ' world');
    expect(messageChunkSpy).toHaveBeenNthCalledWith(3, '!');
  });

  // ============================================================
  // Test 3: Handle [DONE] signal and close connection
  // ============================================================

  it('should handle [DONE] signal and close connection', async () => {
    // ARRANGE
    const sseUrl = 'https://n8n.example.com/webhook/stream/session-123';
    const messageChunkSpy = vi.fn();
    const stateChangeSpy = vi.fn();

    sseClient.onMessageChunk(messageChunkSpy);
    sseClient.onStateChange(stateChangeSpy);
    sseClient.connect(sseUrl);

    // Wait for connection to open
    await new Promise((resolve) => setTimeout(resolve, 50));

    // ACT
    // Get the EventSource instance created by connect()
    const mockEventSource = sseClient.getEventSource() as any;

    // Simulate receiving messages followed by [DONE] signal
    mockEventSource.simulateMessage('Hello');
    mockEventSource.simulateMessage('[DONE]');

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 50));

    // ASSERT
    // Only "Hello" should be passed to callback, not "[DONE]"
    expect(messageChunkSpy).toHaveBeenCalledTimes(1);
    expect(messageChunkSpy).toHaveBeenCalledWith('Hello');

    // Connection should be closed
    expect(sseClient.getState()).toBe('closed');

    // State should change to 'closed'
    expect(stateChangeSpy).toHaveBeenCalledWith('closed');
  });

  // ============================================================
  // Test 4: Auto-reconnect on connection error (with backoff)
  // ============================================================

  it('should auto-reconnect on connection error with backoff', async () => {
    // ARRANGE
    const sseUrl = 'https://n8n.example.com/webhook/stream/session-123';
    const stateChangeSpy = vi.fn();
    const errorSpy = vi.fn();

    sseClient.onStateChange(stateChangeSpy);
    sseClient.onError(errorSpy);
    sseClient.connect(sseUrl);

    // Wait for initial connection
    await new Promise((resolve) => setTimeout(resolve, 50));

    // ACT
    // Get the EventSource instance created by connect()
    const mockEventSource = sseClient.getEventSource() as any;

    // Simulate connection error
    mockEventSource.simulateError();

    // Wait for reconnection attempt
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // ASSERT
    // Should transition to 'error' state
    expect(stateChangeSpy).toHaveBeenCalledWith('error');

    // Should call error callback
    expect(errorSpy).toHaveBeenCalled();

    // Should attempt to reconnect (state should be 'connecting' again)
    expect(stateChangeSpy).toHaveBeenCalledWith('connecting');
  }, 10000);

  // ============================================================
  // Test 5: Stop reconnecting after max attempts
  // ============================================================

  it('should stop reconnecting after max attempts', async () => {
    // ARRANGE
    const sseUrl = 'https://n8n.example.com/webhook/stream/session-123';
    const errorSpy = vi.fn();
    const stateChangeSpy = vi.fn();

    sseClient.onError(errorSpy);
    sseClient.onStateChange(stateChangeSpy);

    // Configure max reconnect attempts (e.g., 3)
    // This should be configurable in SSEClient constructor

    // Mock EventSource to always fail
    const eventSourceInstances: MockEventSource[] = [];

    (global as any).EventSource = class {
      url: string;
      readyState: number;
      onopen: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;

      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSED = 2;

      constructor(url: string) {
        this.url = url;
        this.readyState = (global as any).EventSource.CONNECTING;
        eventSourceInstances.push(this);

        // Simulate immediate error instead of successful connection
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Event('error'));
          }
        }, 10);
      }

      close() {
        this.readyState = (global as any).EventSource.CLOSED;
      }
    };

    // ACT
    sseClient.connect(sseUrl);

    // Wait for all reconnection attempts to complete
    // With exponential backoff: 1000, 2000, 4000, 8000, 16000 ms
    // Total: ~31000ms, but we can check earlier
    await new Promise((resolve) => setTimeout(resolve, 8000));

    // ASSERT
    // After max attempts, should stop reconnecting
    // State should remain 'error' or 'closed'
    const finalState = sseClient.getState();
    expect(['error', 'closed']).toContain(finalState);

    // Error callback should be called multiple times (but not indefinitely)
    // Should be called at most maxReconnectAttempts + 1 times (initial + retries)
    expect(errorSpy.mock.calls.length).toBeLessThanOrEqual(6);
  }, 15000);

  // ============================================================
  // Test 6: Update connection state on lifecycle events
  // ============================================================

  it('should update connection state on lifecycle events', async () => {
    // ARRANGE
    const sseUrl = 'https://n8n.example.com/webhook/stream/session-123';
    const stateChangeSpy = vi.fn();

    sseClient.onStateChange(stateChangeSpy);

    // ACT & ASSERT

    // Initial state should be 'disconnected'
    expect(sseClient.getState()).toBe('disconnected');

    // Connect
    sseClient.connect(sseUrl);

    // Should transition to 'connecting'
    expect(stateChangeSpy).toHaveBeenCalledWith('connecting');

    // Wait for connection to open
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should transition to 'connected'
    expect(stateChangeSpy).toHaveBeenCalledWith('connected');
    expect(sseClient.getState()).toBe('connected');

    // Disconnect
    sseClient.disconnect();

    // Should transition to 'closed'
    expect(sseClient.getState()).toBe('closed');
    expect(stateChangeSpy).toHaveBeenCalledWith('closed');

    // Verify state transition order
    const stateTransitions = stateChangeSpy.mock.calls.map((call) => call[0]);
    expect(stateTransitions).toEqual(['connecting', 'connected', 'closed']);
  });

  // ============================================================
  // Test 7: Clean up EventSource on disconnect()
  // ============================================================

  it('should clean up EventSource on disconnect()', async () => {
    // ARRANGE
    const sseUrl = 'https://n8n.example.com/webhook/stream/session-123';
    const messageChunkSpy = vi.fn();

    sseClient.onMessageChunk(messageChunkSpy);
    sseClient.connect(sseUrl);

    // Wait for connection to open
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Get the EventSource instance created by connect()
    const mockEventSource = sseClient.getEventSource() as any;

    // Verify connection is active
    expect(sseClient.getState()).toBe('connected');

    // ACT
    sseClient.disconnect();

    // ASSERT
    // State should be 'closed'
    expect(sseClient.getState()).toBe('closed');

    // EventSource should be closed (readyState === CLOSED)
    expect(mockEventSource.readyState).toBe(MockEventSource.CLOSED);

    // Subsequent messages should not trigger callback
    mockEventSource.simulateMessage('Should not be received');
    expect(messageChunkSpy).not.toHaveBeenCalledWith('Should not be received');
  });

  // ============================================================
  // Additional Test: Multiple callbacks
  // ============================================================

  it('should support multiple message chunk callbacks', async () => {
    // ARRANGE
    const sseUrl = 'https://n8n.example.com/webhook/stream/session-123';
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    sseClient.onMessageChunk(callback1);
    sseClient.onMessageChunk(callback2);
    sseClient.connect(sseUrl);

    // Wait for connection to open
    await new Promise((resolve) => setTimeout(resolve, 50));

    // ACT
    // Get the EventSource instance created by connect()
    const mockEventSource = sseClient.getEventSource() as any;
    mockEventSource.simulateMessage('Test message');

    // ASSERT
    // Both callbacks should be called
    expect(callback1).toHaveBeenCalledWith('Test message');
    expect(callback2).toHaveBeenCalledWith('Test message');
  });

  // ============================================================
  // Additional Test: Update StateManager during streaming
  // ============================================================

  it('should update StateManager with streaming message', async () => {
    // ARRANGE
    const sseUrl = 'https://n8n.example.com/webhook/stream/session-123';
    const setStateSpy = vi.spyOn(stateManager, 'setState');

    sseClient.connect(sseUrl);

    // Wait for connection to open
    await new Promise((resolve) => setTimeout(resolve, 50));

    // ACT
    // Get the EventSource instance created by connect()
    const mockEventSource = sseClient.getEventSource() as any;

    mockEventSource.simulateMessage('Chunk 1');
    mockEventSource.simulateMessage(' Chunk 2');

    // ASSERT
    // StateManager should be updated with streaming message chunks
    expect(setStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStreamingMessage: expect.stringContaining('Chunk'),
      })
    );
  });

  // ============================================================
  // Additional Test: Handle connection already in progress
  // ============================================================

  it('should handle multiple connect() calls gracefully', async () => {
    // ARRANGE
    const sseUrl = 'https://n8n.example.com/webhook/stream/session-123';

    // ACT
    sseClient.connect(sseUrl);
    sseClient.connect(sseUrl); // Second call while first is connecting

    // Wait for connection
    await new Promise((resolve) => setTimeout(resolve, 50));

    // ASSERT
    // Should not create multiple connections
    // Should be in 'connected' state
    expect(sseClient.getState()).toBe('connected');
  });
});
