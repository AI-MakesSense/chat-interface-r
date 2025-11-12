/**
 * RED Integration Tests for N8n Messaging Services
 *
 * Tests integration between:
 * - SessionManager
 * - MessageSender
 * - SSEClient
 * - RetryPolicy
 * - StateManager
 *
 * WHY THESE TESTS WILL FAIL:
 * - Production modules do not exist yet
 * - All messaging service classes are not implemented
 * - This is the RED phase of TDD - tests are written BEFORE production code
 *
 * Test Coverage:
 * 1. Send message and receive non-streaming response
 * 2. Send message and receive SSE streaming response
 * 3. Retry on network error and succeed on 2nd attempt
 * 4. Retry on timeout and succeed on 3rd attempt
 * 5. Fail after max retries and show error
 * 6. Handle SSE connection drop and reconnect
 * 7. Update StateManager.messages on successful send
 * 8. Update StateManager.isLoading during request lifecycle
 * 9. Update streaming message incrementally
 * 10. Preserve session ID across widget reload
 *
 * Module Purpose:
 * - Verify all messaging services work together correctly
 * - Test complete user message flow: send -> retry -> receive -> display
 * - Validate state management during entire lifecycle
 * - Ensure session persistence across page reloads
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StateManager, WidgetState } from '@/widget/src/core/state';
import { WidgetConfig } from '@/widget/src/types';
// @ts-expect-error - Modules do not exist yet (RED phase)
import { SessionManager } from '@/widget/src/services/messaging/session-manager';
// @ts-expect-error - Modules do not exist yet (RED phase)
import { MessageSender } from '@/widget/src/services/messaging/message-sender';
// @ts-expect-error - Modules do not exist yet (RED phase)
import { SSEClient } from '@/widget/src/services/messaging/sse-client';
// @ts-expect-error - Modules do not exist yet (RED phase)
import { RetryPolicy } from '@/widget/src/services/messaging/retry-policy';

// Mock EventSource (same as in sse-client.test.ts)
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

  simulateMessage(data: string) {
    if (this.onmessage) {
      const event = new MessageEvent('message', { data });
      this.onmessage(event);
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

(global as any).EventSource = MockEventSource;

describe('N8n Messaging Integration - RED Tests', () => {
  let stateManager: StateManager;
  let sessionManager: SessionManager;
  let retryPolicy: RetryPolicy;
  let messageSender: MessageSender;
  let sseClient: SSEClient;
  let mockConfig: WidgetConfig;

  const originalFetch = global.fetch;

  beforeEach(() => {
    // Clear sessionStorage
    sessionStorage.clear();

    // Initialize state manager
    const initialState: WidgetState = {
      isOpen: true,
      messages: [],
      isLoading: false,
      error: null,
      currentStreamingMessage: null,
    };
    stateManager = new StateManager(initialState);

    // Initialize session manager
    sessionManager = new SessionManager('test-license-123');

    // Initialize retry policy
    retryPolicy = new RetryPolicy({
      maxAttempts: 3,
      baseDelayMs: 100, // Short delays for testing
      maxDelayMs: 1000,
      jitterPercent: 10,
    });

    // Widget config
    mockConfig = {
      connection: {
        webhookUrl: 'https://n8n.example.com/webhook/test123',
      },
      features: {
        fileAttachmentsEnabled: true,
        allowedExtensions: ['.jpg', '.png', '.pdf'],
        maxFileSizeKB: 5000,
      },
      branding: {
        companyName: 'Test Company',
        welcomeText: 'Hello',
        firstMessage: 'How can I help?',
      },
      style: {
        theme: 'light',
        primaryColor: '#000',
        backgroundColor: '#fff',
        textColor: '#000',
        position: 'bottom-right',
        cornerRadius: 8,
        fontFamily: 'Arial',
        fontSize: 14,
      },
    };

    // Initialize message sender
    messageSender = new MessageSender(mockConfig, stateManager, sessionManager, retryPolicy);

    // Initialize SSE client
    sseClient = new SSEClient(stateManager);

    // Mock fetch
    global.fetch = vi.fn();

    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    sessionStorage.clear();
    if (sseClient) {
      sseClient.disconnect();
    }
  });

  // ============================================================
  // Test 1: Send message and receive non-streaming response
  // ============================================================

  it('should send message and receive non-streaming response', async () => {
    // ARRANGE
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        message: 'Hello! How can I help you?',
        messageId: 'msg-123',
        streaming: false,
      }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    // ACT
    const result = await messageSender.sendMessage({
      text: 'I need help',
    });

    // ASSERT
    expect(result.success).toBe(true);

    // Verify message added to state
    const state = stateManager.getState();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe('assistant');
    expect(state.messages[0].content).toBe('Hello! How can I help you?');

    // Verify loading state cleared
    expect(state.isLoading).toBe(false);
  });

  // ============================================================
  // Test 2: Send message and receive SSE streaming response
  // ============================================================

  it('should send message and receive SSE streaming response', async () => {
    // ARRANGE
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        streaming: true,
        streamUrl: 'https://n8n.example.com/webhook/stream/session-123',
        messageId: 'msg-stream-456',
      }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    // ACT
    const result = await messageSender.sendMessage({
      text: 'Tell me a story',
    });

    // ASSERT
    expect(result.success).toBe(true);

    // SSE client should establish connection
    // (In real implementation, MessageSender would call sseClient.connect())

    // Wait for SSE connection
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Simulate streaming chunks
    const mockEventSource = new MockEventSource(
      'https://n8n.example.com/webhook/stream/session-123'
    );

    mockEventSource.simulateMessage('Once upon');
    mockEventSource.simulateMessage(' a time');
    mockEventSource.simulateMessage('...');
    mockEventSource.simulateMessage('[DONE]');

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify streaming message updated in state
    const state = stateManager.getState();
    expect(state.currentStreamingMessage).toContain('Once upon a time');

    // After [DONE], message should be added to messages array
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe('assistant');
  });

  // ============================================================
  // Test 3: Retry on network error and succeed on 2nd attempt
  // ============================================================

  it('should retry on network error and succeed on 2nd attempt', async () => {
    // ARRANGE
    const networkError = new TypeError('Failed to fetch');
    const successResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        message: 'Success after retry',
        messageId: 'msg-retry-success',
      }),
    };

    // First attempt fails, second succeeds
    (global.fetch as any)
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce(successResponse);

    // ACT
    const result = await messageSender.sendMessage({
      text: 'Test message',
    });

    // ASSERT
    expect(result.success).toBe(true);

    // Verify fetch was called twice (initial + 1 retry)
    expect(global.fetch).toHaveBeenCalledTimes(2);

    // Verify message added after successful retry
    const state = stateManager.getState();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].content).toBe('Success after retry');
  }, 15000);

  // ============================================================
  // Test 4: Retry on timeout and succeed on 3rd attempt
  // ============================================================

  it('should retry on timeout and succeed on 3rd attempt', async () => {
    // ARRANGE
    const timeoutError = new DOMException('The operation was aborted', 'TimeoutError');
    const successResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        message: 'Success after 2 retries',
        messageId: 'msg-retry-timeout',
      }),
    };

    // First two attempts timeout, third succeeds
    (global.fetch as any)
      .mockRejectedValueOnce(timeoutError)
      .mockRejectedValueOnce(timeoutError)
      .mockResolvedValueOnce(successResponse);

    // ACT
    const result = await messageSender.sendMessage({
      text: 'Test message',
      timeoutMs: 5000,
    });

    // ASSERT
    expect(result.success).toBe(true);

    // Verify fetch was called 3 times (initial + 2 retries)
    expect(global.fetch).toHaveBeenCalledTimes(3);

    // Verify message added after successful retry
    const state = stateManager.getState();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].content).toBe('Success after 2 retries');
  }, 15000);

  // ============================================================
  // Test 5: Fail after max retries and show error
  // ============================================================

  it('should fail after max retries and show error', async () => {
    // ARRANGE
    const networkError = new TypeError('Failed to fetch');

    // All attempts fail
    (global.fetch as any).mockRejectedValue(networkError);

    // ACT & ASSERT
    await expect(
      messageSender.sendMessage({
        text: 'Test message',
      })
    ).rejects.toThrow();

    // Verify max attempts reached (initial + 2 retries = 3 total)
    expect(global.fetch).toHaveBeenCalledTimes(3);

    // Verify error state updated
    const state = stateManager.getState();
    expect(state.error).toBeTruthy();
    expect(state.isLoading).toBe(false);
  }, 15000);

  // ============================================================
  // Test 6: Handle SSE connection drop and reconnect
  // ============================================================

  it('should handle SSE connection drop and reconnect', async () => {
    // ARRANGE
    const sseUrl = 'https://n8n.example.com/webhook/stream/session-123';

    sseClient.connect(sseUrl);

    // Wait for initial connection
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(sseClient.getState()).toBe('connected');

    // ACT
    const mockEventSource = new MockEventSource(sseUrl);

    // Simulate connection error
    mockEventSource.simulateError();

    // Wait for reconnection attempt
    await new Promise((resolve) => setTimeout(resolve, 200));

    // ASSERT
    // Should attempt to reconnect
    expect(sseClient.getState()).toMatch(/connecting|connected/);
  }, 10000);

  // ============================================================
  // Test 7: Update StateManager.messages on successful send
  // ============================================================

  it('should update StateManager.messages on successful send', async () => {
    // ARRANGE
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        message: 'Message received successfully',
        messageId: 'msg-state-test',
      }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    // ACT
    await messageSender.sendMessage({
      text: 'User message',
    });

    // ASSERT
    const state = stateManager.getState();

    // Should have assistant message
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe('assistant');
    expect(state.messages[0].content).toBe('Message received successfully');
    expect(state.messages[0].id).toBe('msg-state-test');
  });

  // ============================================================
  // Test 8: Update StateManager.isLoading during request lifecycle
  // ============================================================

  it('should update StateManager.isLoading during request lifecycle', async () => {
    // ARRANGE
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        message: 'Response',
        messageId: 'msg-loading',
      }),
    };

    (global.fetch as any).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockResponse), 100);
        })
    );

    const setStateSpy = vi.spyOn(stateManager, 'setState');

    // ACT
    const sendPromise = messageSender.sendMessage({
      text: 'Test message',
    });

    // Verify loading state is set immediately
    expect(setStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        isLoading: true,
      })
    );

    // Wait for completion
    await sendPromise;

    // ASSERT
    // Verify loading state is cleared
    expect(setStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        isLoading: false,
      })
    );

    // Verify final state
    const state = stateManager.getState();
    expect(state.isLoading).toBe(false);
  });

  // ============================================================
  // Test 9: Update streaming message incrementally
  // ============================================================

  it('should update streaming message incrementally', async () => {
    // ARRANGE
    const sseUrl = 'https://n8n.example.com/webhook/stream/session-123';
    const setStateSpy = vi.spyOn(stateManager, 'setState');

    sseClient.connect(sseUrl);

    // Wait for connection
    await new Promise((resolve) => setTimeout(resolve, 50));

    // ACT
    const mockEventSource = new MockEventSource(sseUrl);

    // Simulate incremental chunks
    mockEventSource.simulateMessage('Hello');
    mockEventSource.simulateMessage(' ');
    mockEventSource.simulateMessage('world');
    mockEventSource.simulateMessage('!');

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 50));

    // ASSERT
    // StateManager should be updated incrementally
    expect(setStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStreamingMessage: expect.stringContaining('Hello'),
      })
    );

    // Final streaming message should contain full text
    const state = stateManager.getState();
    expect(state.currentStreamingMessage).toContain('Hello world!');
  });

  // ============================================================
  // Test 10: Preserve session ID across widget reload
  // ============================================================

  it('should preserve session ID across widget reload', () => {
    // ARRANGE
    const firstSessionManager = new SessionManager('license-persist-test');
    const firstSessionId = firstSessionManager.getSessionId();

    // Store session ID
    expect(firstSessionId).toBeTruthy();
    expect(sessionStorage.getItem('chat-widget-session-license-persist-test')).toBe(
      firstSessionId
    );

    // ACT
    // Simulate widget reload by creating new SessionManager instance
    const secondSessionManager = new SessionManager('license-persist-test');
    const secondSessionId = secondSessionManager.getSessionId();

    // ASSERT
    // Session ID should be preserved
    expect(secondSessionId).toBe(firstSessionId);

    // Verify sessionStorage still contains the same ID
    expect(sessionStorage.getItem('chat-widget-session-license-persist-test')).toBe(
      firstSessionId
    );
  });

  // ============================================================
  // Additional Test: Complete user flow with multiple messages
  // ============================================================

  it('should handle complete user flow with multiple messages', async () => {
    // ARRANGE
    const responses = [
      {
        ok: true,
        status: 200,
        json: async () => ({
          message: 'Hello! How can I help?',
          messageId: 'msg-1',
        }),
      },
      {
        ok: true,
        status: 200,
        json: async () => ({
          message: 'I can help with that.',
          messageId: 'msg-2',
        }),
      },
      {
        ok: true,
        status: 200,
        json: async () => ({
          message: 'Anything else?',
          messageId: 'msg-3',
        }),
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1])
      .mockResolvedValueOnce(responses[2]);

    // ACT
    // Send multiple messages
    await messageSender.sendMessage({ text: 'Hi' });
    await messageSender.sendMessage({ text: 'I need help' });
    await messageSender.sendMessage({ text: 'Thanks' });

    // ASSERT
    const state = stateManager.getState();

    // Should have 3 assistant messages
    expect(state.messages).toHaveLength(3);
    expect(state.messages[0].content).toBe('Hello! How can I help?');
    expect(state.messages[1].content).toBe('I can help with that.');
    expect(state.messages[2].content).toBe('Anything else?');

    // All messages should have same session ID
    const sessionId = sessionManager.getSessionId();
    expect(global.fetch).toHaveBeenCalledTimes(3);

    // Verify all requests included session ID
    for (let i = 0; i < 3; i++) {
      const callArgs = (global.fetch as any).mock.calls[i];
      const body = JSON.parse(callArgs[1].body);
      expect(body.sessionId).toBe(sessionId);
    }
  });
});
