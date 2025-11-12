/**
 * RED Tests for Message Sender
 *
 * Tests for widget/src/services/messaging/message-sender.ts
 *
 * WHY THESE TESTS WILL FAIL:
 * - Production module does not exist yet (widget/src/services/messaging/message-sender.ts)
 * - MessageSender class is not implemented
 * - SendMessageOptions and SendMessageResult interfaces are not defined
 * - This is the RED phase of TDD - tests are written BEFORE production code
 *
 * Test Coverage:
 * 1. Send message successfully with valid config
 * 2. Include session ID in payload
 * 3. Include file attachments as base64
 * 4. Update StateManager.isLoading during request
 * 5. Handle 200 response and add assistant message
 * 6. Throw NetworkError on fetch failure
 * 7. Throw TimeoutError after 30s
 * 8. Abort request when abort() called
 *
 * Module Purpose:
 * - Sends user messages to N8n webhook via HTTP POST
 * - Includes session ID for conversation continuity
 * - Handles file attachments (base64 encoding)
 * - Updates StateManager during request lifecycle
 * - Implements timeout and abort functionality
 * - Returns success/error status
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StateManager, WidgetState } from '@/widget/src/core/state';
import { WidgetConfig } from '@/widget/src/types';
// @ts-expect-error - Module does not exist yet (RED phase)
import {
  MessageSender,
  SendMessageOptions,
  SendMessageResult,
} from '@/widget/src/services/messaging/message-sender';
// @ts-expect-error - Module does not exist yet (RED phase)
import { SessionManager } from '@/widget/src/services/messaging/session-manager';
// @ts-expect-error - Module does not exist yet (RED phase)
import { RetryPolicy } from '@/widget/src/services/messaging/retry-policy';
// @ts-expect-error - Module does not exist yet (RED phase)
import { NetworkError } from '@/widget/src/utils/network-error-handler';

describe('MessageSender - RED Tests', () => {
  let stateManager: StateManager;
  let sessionManager: SessionManager;
  let retryPolicy: RetryPolicy;
  let messageSender: MessageSender;
  let mockConfig: WidgetConfig;

  // Mock fetch globally
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Initialize state manager
    const initialState: WidgetState = {
      isOpen: true,
      messages: [],
      isLoading: false,
      error: null,
      currentStreamingMessage: null,
    };
    stateManager = new StateManager(initialState);

    // Mock session manager
    sessionManager = {
      getSessionId: vi.fn().mockReturnValue('test-session-123'),
      hasSession: vi.fn().mockReturnValue(true),
      resetSession: vi.fn(),
      getSessionStartTime: vi.fn().mockReturnValue(new Date()),
    } as any;

    // Mock retry policy
    retryPolicy = {
      shouldRetry: vi.fn().mockReturnValue(false),
      getRetryDelay: vi.fn().mockReturnValue(1000),
      reset: vi.fn(),
    } as any;

    // Widget config
    mockConfig = {
      connection: {
        webhookUrl: 'https://n8n.example.com/webhook/test123',
        routeParam: undefined,
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

    // Mock fetch
    global.fetch = vi.fn();

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  // ============================================================
  // Test 1: Send message successfully with valid config
  // ============================================================

  it('should send message successfully with valid config', async () => {
    // ARRANGE
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        message: 'Hello! How can I help you?',
        messageId: 'msg-456',
      }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const options: SendMessageOptions = {
      text: 'Hello, I need help',
    };

    // ACT
    const result = await messageSender.sendMessage(options);

    // ASSERT
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-456');
    expect(result.error).toBeUndefined();

    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://n8n.example.com/webhook/test123',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: expect.any(String),
      })
    );

    // Verify request body contains message and session ID
    const callArgs = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.text).toBe('Hello, I need help');
    expect(body.sessionId).toBe('test-session-123');
  });

  // ============================================================
  // Test 2: Include session ID in payload
  // ============================================================

  it('should include session ID in payload', async () => {
    // ARRANGE
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ message: 'Response', messageId: 'msg-789' }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const sessionId = 'custom-session-xyz';
    (sessionManager.getSessionId as any).mockReturnValue(sessionId);

    const options: SendMessageOptions = {
      text: 'Test message',
    };

    // ACT
    await messageSender.sendMessage(options);

    // ASSERT
    const callArgs = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body.sessionId).toBe(sessionId);
    expect(sessionManager.getSessionId).toHaveBeenCalled();
  });

  // ============================================================
  // Test 3: Include file attachments as base64
  // ============================================================

  it('should include file attachments as base64', async () => {
    // ARRANGE
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ message: 'File received', messageId: 'msg-file' }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    // Create mock file
    const fileContent = 'mock file content';
    const mockFile = new File([fileContent], 'test.txt', { type: 'text/plain' });

    const options: SendMessageOptions = {
      text: 'Here is a file',
      attachments: [mockFile],
    };

    // ACT
    await messageSender.sendMessage(options);

    // ASSERT
    const callArgs = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body.attachments).toBeDefined();
    expect(Array.isArray(body.attachments)).toBe(true);
    expect(body.attachments.length).toBe(1);

    // Verify attachment structure
    const attachment = body.attachments[0];
    expect(attachment.name).toBe('test.txt');
    expect(attachment.type).toBe('text/plain');
    expect(attachment.data).toBeDefined(); // Base64 data
    expect(typeof attachment.data).toBe('string');
  });

  // ============================================================
  // Test 4: Update StateManager.isLoading during request
  // ============================================================

  it('should update StateManager.isLoading during request', async () => {
    // ARRANGE
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ message: 'Response', messageId: 'msg-123' }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const setStateSpy = vi.spyOn(stateManager, 'setState');

    const options: SendMessageOptions = {
      text: 'Test message',
    };

    // ACT
    await messageSender.sendMessage(options);

    // ASSERT
    // setState should be called at least twice:
    // 1. Set isLoading: true (start)
    // 2. Set isLoading: false (end)
    expect(setStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        isLoading: true,
      })
    );

    expect(setStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        isLoading: false,
      })
    );

    // Verify call order: true before false
    const calls = setStateSpy.mock.calls;
    const loadingTrueCalls = calls.filter((call) => call[0].isLoading === true);
    const loadingFalseCalls = calls.filter((call) => call[0].isLoading === false);

    expect(loadingTrueCalls.length).toBeGreaterThan(0);
    expect(loadingFalseCalls.length).toBeGreaterThan(0);
  });

  // ============================================================
  // Test 5: Handle 200 response and add assistant message
  // ============================================================

  it('should handle 200 response and add assistant message', async () => {
    // ARRANGE
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        message: 'Hello! I can help you with that.',
        messageId: 'msg-response-123',
      }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const setStateSpy = vi.spyOn(stateManager, 'setState');

    const options: SendMessageOptions = {
      text: 'I need help',
    };

    // ACT
    const result = await messageSender.sendMessage(options);

    // ASSERT
    expect(result.success).toBe(true);

    // Verify assistant message is added to state
    expect(setStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'assistant',
            content: 'Hello! I can help you with that.',
          }),
        ]),
      })
    );
  });

  // ============================================================
  // Test 6: Throw NetworkError on fetch failure
  // ============================================================

  it('should throw NetworkError on fetch failure', async () => {
    // ARRANGE
    const fetchError = new TypeError('Failed to fetch');
    (global.fetch as any).mockRejectedValueOnce(fetchError);

    const options: SendMessageOptions = {
      text: 'Test message',
    };

    // ACT & ASSERT
    await expect(messageSender.sendMessage(options)).rejects.toThrow();

    // Verify error is classified as NetworkError
    try {
      await messageSender.sendMessage(options);
    } catch (error: any) {
      expect(error.type).toBe('network');
      expect(error.retryable).toBe(true);
    }
  });

  // ============================================================
  // Test 7: Throw TimeoutError after 30s
  // ============================================================

  it('should throw TimeoutError after timeout', async () => {
    // ARRANGE
    // Mock fetch to never resolve
    (global.fetch as any).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          // Never resolves
        })
    );

    const options: SendMessageOptions = {
      text: 'Test message',
      timeoutMs: 100, // Short timeout for testing
    };

    // ACT & ASSERT
    await expect(messageSender.sendMessage(options)).rejects.toThrow();

    try {
      await messageSender.sendMessage(options);
    } catch (error: any) {
      expect(error.type).toBe('timeout');
      expect(error.retryable).toBe(true);
    }
  }, 10000); // Increase test timeout

  // ============================================================
  // Test 8: Abort request when abort() called
  // ============================================================

  it('should abort request when abort() called', async () => {
    // ARRANGE
    let abortSignal: AbortSignal | undefined;

    (global.fetch as any).mockImplementationOnce((_url: string, options: any) => {
      abortSignal = options.signal;
      return new Promise((resolve, reject) => {
        // Simulate long request
        setTimeout(() => resolve({ ok: true, status: 200, json: async () => ({}) }), 5000);

        // Listen for abort
        if (abortSignal) {
          abortSignal.addEventListener('abort', () => {
            reject(new DOMException('Request aborted', 'AbortError'));
          });
        }
      });
    });

    const options: SendMessageOptions = {
      text: 'Test message',
    };

    // ACT
    const sendPromise = messageSender.sendMessage(options);

    // Abort immediately
    setTimeout(() => {
      messageSender.abort();
    }, 50);

    // ASSERT
    await expect(sendPromise).rejects.toThrow();

    try {
      await sendPromise;
    } catch (error: any) {
      expect(error.type).toBe('abort');
      expect(error.retryable).toBe(false);
    }
  }, 10000);

  // ============================================================
  // Additional Test: isBusy() flag
  // ============================================================

  it('should set isBusy() to true during request', async () => {
    // ARRANGE
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ message: 'Response', messageId: 'msg-123' }),
    };

    (global.fetch as any).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockResponse), 100);
        })
    );

    const options: SendMessageOptions = {
      text: 'Test message',
    };

    // ACT
    const sendPromise = messageSender.sendMessage(options);

    // ASSERT
    // Should be busy during request
    expect(messageSender.isBusy()).toBe(true);

    // Wait for completion
    await sendPromise;

    // Should not be busy after completion
    expect(messageSender.isBusy()).toBe(false);
  });
});
