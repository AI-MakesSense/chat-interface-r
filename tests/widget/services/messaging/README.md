# N8n Messaging Services - RED Test Suite

## Overview

This directory contains RED (failing) tests for Phase 3.7 Week 3: N8n Integration. All tests are written following strict TDD methodology where tests are written BEFORE production code.

## Test Status: RED PHASE

All tests are currently FAILING as expected - this confirms proper TDD workflow.

**Failure Reason:** Production modules do not exist yet (imports fail with "Cannot find module").

## Test Coverage Summary

### Total Tests: 35 tests across 6 test files

| Test File | Tests | Status | Priority |
|-----------|-------|--------|----------|
| session-manager.test.ts | 4 tests | RED | Phase 1 (Start Here) |
| retry-policy.test.ts | 6 tests | RED | Phase 2 |
| network-error-handler.test.ts | 8 tests | RED | Phase 3 |
| message-sender.test.ts | 9 tests | RED | Phase 4 |
| sse-client.test.ts | 10 tests | RED | Phase 5 |
| integration.test.ts | 11 tests | RED | Phase 6 (Final) |

## Implementation Order

Follow this order for GREEN phase (Implementer agent):

### Phase 1: Session Manager (SIMPLEST - Start Here)
**File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\services\messaging\session-manager.ts`

**Why First:** No dependencies, simple UUID + sessionStorage operations

**Tests (4):**
1. Generate new UUID when no existing session
2. Restore session ID from sessionStorage
3. Reset session and generate new ID
4. Scope session to licenseId (multiple widgets isolated)

**Expected API:**
```typescript
class SessionManager {
  constructor(licenseId: string)
  getSessionId(): string
  resetSession(): void
  hasSession(): boolean
  getSessionStartTime(): Date
}
```

### Phase 2: Retry Policy
**File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\services\messaging\retry-policy.ts`

**Why Second:** Pure logic, no side effects, no dependencies

**Tests (6):**
1. Return true for retryable errors (network, timeout, 5xx) at attempt 0
2. Return false for non-retryable errors (4xx, CORS, parse)
3. Calculate exponential backoff with jitter
4. Stop retrying after max attempts
5. Reset retry state for new request cycle
6. Support custom retry configuration

**Expected API:**
```typescript
interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterPercent: number;
}

class RetryPolicy {
  constructor(config: RetryConfig)
  shouldRetry(attempt: number, error: NetworkError): boolean
  getRetryDelay(attempt: number): number
  reset(): void
}
```

### Phase 3: Network Error Handler
**File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\utils\network-error-handler.ts`

**Why Third:** Utility function, supports message-sender

**Tests (8):**
1. Classify network errors (fetch failures)
2. Classify timeout errors
3. Classify abort errors
4. Classify CORS errors
5. Classify parse errors (invalid JSON)
6. Classify 4xx client errors as non-retryable
7. Classify 5xx server errors as retryable
8. Provide user-friendly error messages
9. Handle unknown errors gracefully

**Expected API:**
```typescript
interface NetworkError {
  type: 'network' | 'timeout' | 'cors' | 'http' | 'parse' | 'abort';
  message: string;
  statusCode?: number;
  retryable: boolean;
  originalError?: Error;
}

function classifyError(error: unknown): NetworkError
function getUserMessage(error: NetworkError): string
```

### Phase 4: Message Sender
**File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\services\messaging\message-sender.ts`

**Why Fourth:** Core functionality, depends on session-manager + retry-policy

**Tests (9):**
1. Send message successfully with valid config
2. Include session ID in payload
3. Include file attachments as base64
4. Update StateManager.isLoading during request
5. Handle 200 response and add assistant message
6. Throw NetworkError on fetch failure
7. Throw TimeoutError after timeout
8. Abort request when abort() called
9. Set isBusy() to true during request

**Expected API:**
```typescript
interface SendMessageOptions {
  text: string;
  attachments?: File[];
  timeoutMs?: number;
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: NetworkError;
}

class MessageSender {
  constructor(
    config: WidgetConfig,
    stateManager: StateManager,
    sessionManager: SessionManager,
    retryPolicy: RetryPolicy
  )

  sendMessage(options: SendMessageOptions): Promise<SendMessageResult>
  abort(): void
  isBusy(): boolean
}
```

### Phase 5: SSE Client
**File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\services\messaging\sse-client.ts`

**Why Fifth:** Depends on message-sender (SSE URL from webhook response)

**Tests (10):**
1. Establish EventSource connection
2. Parse message chunks and call onMessageChunk callback
3. Handle [DONE] signal and close connection
4. Auto-reconnect on connection error (with backoff)
5. Stop reconnecting after max attempts
6. Update connection state on lifecycle events
7. Clean up EventSource on disconnect()
8. Support multiple message chunk callbacks
9. Update StateManager with streaming message
10. Handle multiple connect() calls gracefully

**Expected API:**
```typescript
type SSEConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error' | 'closed';

class SSEClient {
  constructor(stateManager: StateManager)

  connect(url: string): void
  disconnect(): void
  getState(): SSEConnectionState
  onMessageChunk(callback: (chunk: string) => void): void
  onError(callback: (error: NetworkError) => void): void
  onStateChange(callback: (state: SSEConnectionState) => void): void
}
```

### Phase 6: Integration Tests
**File:** Tests interaction between all modules

**Tests (11):**
1. Send message and receive non-streaming response
2. Send message and receive SSE streaming response
3. Retry on network error and succeed on 2nd attempt
4. Retry on timeout and succeed on 3rd attempt
5. Fail after max retries and show error
6. Handle SSE connection drop and reconnect
7. Update StateManager.messages on successful send
8. Update StateManager.isLoading during request lifecycle
9. Update streaming message incrementally
10. Preserve session ID across widget reload
11. Handle complete user flow with multiple messages

## Test Patterns

### Mock Strategy
- Mock `fetch` using Vitest `vi.fn()` for HTTP requests
- Mock `EventSource` using custom class (Happy-DOM doesn't provide it)
- Mock `sessionStorage` for session tests
- Mock `StateManager` for isolated service tests
- Use actual StateManager for integration tests

### Assertion Patterns
- UUID format validation: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`
- State updates: Verify `setState()` called with correct partial state
- Network errors: Check `error.type`, `error.retryable`, `error.message`
- Retry delays: Verify exponential backoff (1s, 2s, 4s) with ±25% jitter tolerance

### Test Structure (ARRANGE-ACT-ASSERT)
```typescript
it('should do something', () => {
  // ARRANGE - Setup test data and mocks
  const input = 'test';
  const mock = vi.fn();

  // ACT - Execute the function under test
  const result = functionUnderTest(input);

  // ASSERT - Verify expected behavior
  expect(result).toBe(expected);
  expect(mock).toHaveBeenCalled();
});
```

## Running Tests

### Run all N8n messaging tests:
```bash
npm test -- tests/widget/services/messaging/ tests/widget/utils/network-error-handler.test.ts
```

### Run specific test file:
```bash
npm test -- tests/widget/services/messaging/session-manager.test.ts
```

### Run tests in watch mode:
```bash
npm test -- tests/widget/services/messaging/ --watch
```

### Run with coverage:
```bash
npm test -- tests/widget/services/messaging/ --coverage
```

## Expected Test Output (Current State)

```
❌ FAIL  tests/widget/services/messaging/session-manager.test.ts
Error: Failed to resolve import "@/widget/src/services/messaging/session-manager"

❌ FAIL  tests/widget/services/messaging/retry-policy.test.ts
Error: Failed to resolve import "@/widget/src/services/messaging/retry-policy"

❌ FAIL  tests/widget/utils/network-error-handler.test.ts
Error: Failed to resolve import "@/widget/src/utils/network-error-handler"

❌ FAIL  tests/widget/services/messaging/message-sender.test.ts
Error: Failed to resolve import "@/widget/src/services/messaging/message-sender"

❌ FAIL  tests/widget/services/messaging/sse-client.test.ts
Error: Failed to resolve import "@/widget/src/services/messaging/sse-client"

❌ FAIL  tests/widget/services/messaging/integration.test.ts
Error: Failed to resolve import "@/widget/src/services/messaging/session-manager"

Test Files  6 failed (6)
Tests       no tests
```

This confirms proper RED phase - all tests fail because production code doesn't exist yet.

## Next Steps for GREEN Phase

### For Implementer Agent:

1. **Start with Session Manager** (simplest module)
   - Create `widget/src/services/messaging/session-manager.ts`
   - Implement minimal code to pass the 4 tests
   - Run tests to verify GREEN phase
   - Do NOT add extra features beyond test requirements

2. **Continue with Retry Policy**
   - Create `widget/src/services/messaging/retry-policy.ts`
   - Implement minimal code to pass the 6 tests
   - Verify all tests pass

3. **Proceed through phases 3-6 in order**
   - Each module depends on previous ones
   - Do not skip ahead or implement out of order
   - Verify GREEN after each module

### TDD Rules for GREEN Phase:

- Implement ONLY what the tests require
- No "future-proofing" or speculative features
- Keep implementations minimal and simple
- Run tests after each change
- If test fails, fix the implementation (not the test)
- If test is inadequate, strengthen it (RED again)

## Integration with StateManager

The messaging services integrate with the existing StateManager. Required state updates:

```typescript
interface WidgetState {
  // Existing fields
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentStreamingMessage: string | null;
  currentTheme?: 'light' | 'dark';
  attachedFile?: File | null;

  // ADD THESE for messaging:
  sessionId?: string;
  isConnected: boolean;
  lastError?: NetworkError;
  retryCount: number;
  streamingMessageId?: string;
}
```

## Success Criteria

### RED Phase (COMPLETE)
- ✅ 35 tests created across 6 test files
- ✅ All tests fail with expected error ("Cannot find module")
- ✅ Test structure follows TDD best practices
- ✅ Each test has clear ARRANGE-ACT-ASSERT sections
- ✅ Tests cover happy path + error cases + edge cases

### GREEN Phase (Next - Implementer Agent)
- ⏳ Implement session-manager.ts (4 tests pass)
- ⏳ Implement retry-policy.ts (6 tests pass)
- ⏳ Implement network-error-handler.ts (8 tests pass)
- ⏳ Implement message-sender.ts (9 tests pass)
- ⏳ Implement sse-client.ts (10 tests pass)
- ⏳ All integration tests pass (11 tests pass)
- ⏳ Total: 35/35 tests passing

### REFACTOR Phase (Final - Refactorer Agent)
- ⏳ Remove duplication
- ⏳ Improve names
- ⏳ Add inline documentation
- ⏳ Optimize performance
- ⏳ All tests still pass

## Architecture Notes

### Module Responsibilities

**SessionManager:**
- Generates and persists session IDs (UUID v4)
- Scopes sessions by licenseId
- Stores sessions in sessionStorage
- Provides session reset functionality

**RetryPolicy:**
- Determines if errors should be retried
- Calculates exponential backoff delays
- Enforces max retry attempts
- Supports reset for new request cycles

**NetworkErrorHandler:**
- Classifies JavaScript/fetch errors into typed NetworkError categories
- Maps HTTP status codes to error types
- Determines error retryability
- Provides user-friendly error messages

**MessageSender:**
- Sends user messages to N8n webhook (HTTP POST)
- Includes session ID and file attachments
- Updates StateManager during request lifecycle
- Implements timeout and abort functionality
- Integrates with RetryPolicy for error handling

**SSEClient:**
- Manages Server-Sent Events connection
- Parses message chunks from N8n
- Handles [DONE] signal to close connection
- Auto-reconnects on errors with backoff
- Updates StateManager with streaming messages

### Error Handling Strategy

**Retryable Errors:**
- Network errors (fetch failures)
- Timeout errors
- 5xx server errors (500, 502, 503, 504)
- 429 Too Many Requests

**Non-Retryable Errors:**
- 4xx client errors (400, 401, 404, etc.)
- CORS errors
- JSON parse errors
- Abort errors (user-initiated)

**Retry Configuration:**
```typescript
{
  maxAttempts: 3,      // Initial + 2 retries
  baseDelayMs: 1000,   // 1 second
  maxDelayMs: 10000,   // 10 seconds
  jitterPercent: 25    // ±25%
}
```

**Exponential Backoff:**
- Attempt 0: 1000ms ± 25% = 750-1250ms
- Attempt 1: 2000ms ± 25% = 1500-2500ms
- Attempt 2: 4000ms ± 25% = 3000-5000ms

## File Paths Reference

**Test Files:**
- `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\services\messaging\session-manager.test.ts`
- `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\services\messaging\retry-policy.test.ts`
- `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\utils\network-error-handler.test.ts`
- `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\services\messaging\message-sender.test.ts`
- `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\services\messaging\sse-client.test.ts`
- `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\services\messaging\integration.test.ts`

**Production Files (to be created):**
- `C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\services\messaging\session-manager.ts`
- `C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\services\messaging\retry-policy.ts`
- `C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\utils\network-error-handler.ts`
- `C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\services\messaging\message-sender.ts`
- `C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\services\messaging\sse-client.ts`
- `C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\services\messaging\types.ts` (shared types)
- `C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\services\index.ts` (exports)

## Contact

For questions about these tests or the TDD workflow, refer to:
- Project CLAUDE.md for TDD standards
- Architecture.md for system design patterns
- PLAN.md for implementation roadmap

---

**Document Created:** 2025-11-12
**TDD Phase:** RED (Complete)
**Total Tests:** 35
**Test Status:** All failing as expected
**Ready for:** GREEN Phase (Implementer Agent)
