# Implementation Brief: Widget Context-Passing Tests

**For:** TDD-QA-Lead Agent
**Date:** 2025-11-10
**Phase:** RED → GREEN → REFACTOR
**Module:** Widget Context Passing Integration Tests

---

## Quick Summary

**What:** Make 7 existing integration tests pass for widget context-passing feature
**Why:** Validate that widget correctly captures and sends page context to N8n webhooks
**Current Status:** RED (tests fail due to missing jsdom dependency)
**Files Involved:**
- Test: `tests/integration/widget/context-passing.test.ts` (355 lines, 7 tests)
- Implementation: `widget/src/widget.ts` (395 lines, `capturePageContext()` function)
- Entry: `widget/src/index.ts` (46 lines, IIFE wrapper)

---

## Critical Information

### Widget Implementation Status: ✅ COMPLETE

The `capturePageContext()` function **already exists** in `widget/src/widget.ts` (lines 316-337):

```typescript
function capturePageContext() {
  try {
    const url = new URL(window.location.href);
    return {
      pageUrl: window.location.href,
      pagePath: window.location.pathname,
      pageTitle: document.title,
      queryParams: Object.fromEntries(url.searchParams),
      domain: window.location.hostname,
    };
  } catch (error) {
    // Error handling with fallback
    return { /* safe defaults */ };
  }
}
```

**Context inclusion logic** (lines 355-364):
```typescript
// Default behavior: capture context unless explicitly disabled
const shouldCaptureContext = mergedConfig.connection.captureContext !== false;
if (shouldCaptureContext) {
  payload.context = capturePageContext();
}

// Custom context is always included if provided
if (mergedConfig.connection.customContext) {
  payload.customContext = mergedConfig.connection.customContext;
}
```

**Result:** You should NOT need to modify `widget.ts` - implementation is correct.

---

## Test Structure

### All 7 Tests (Keep All)

| Test | Lines | Purpose | Expected Behavior |
|------|-------|---------|-------------------|
| 1. Capture full context by default | 54-114 | Verify complete context object | context object with 5 fields |
| 2. Capture when undefined | 116-148 | Test default behavior | context object present |
| 3. NOT capture when false | 150-183 | Test explicit opt-out | NO context object |
| 4. Handle no query params | 185-234 | Edge case: empty queryParams | queryParams: {} |
| 5. Include custom context | 236-275 | Test customContext field | Both context + customContext |
| 6. Handle special chars | 277-323 | URL encoding test | Decoded query params |
| 7. No sensitive fields | 325-355 | Privacy compliance | No userAgent/referrer |

**Quality Assessment:** All 7 tests are essential (10/10 quality, no redundancy)

---

## Known Issues & Solutions

### Issue #1: Missing jsdom Dependency ⚠️

**Error:** `Cannot find module 'jsdom'`

**Solution:**
```bash
cd "C:\Projects\Chat Interfacer\n8n-widget-designer"
pnpm add -D jsdom @types/jsdom
```

**Verification:**
```bash
pnpm list jsdom
# Should show: jsdom 24.x.x
```

### Issue #2: Widget Initialization in Tests ⚠️

**Current widget entry (`widget/src/index.ts`):**
- Uses IIFE wrapper
- Auto-initializes on DOMContentLoaded
- Requires `window.ChatWidgetConfig` to be set BEFORE import

**Problem:** Tests import widget dynamically, but config might be set too late.

**Solution:** Tests already set config before import:
```typescript
(window as any).ChatWidgetConfig = { /* config */ };
const widgetCode = await import('../../../widget/src/index');
```

**But:** Widget IIFE might execute immediately. Need to verify timing.

**Potential Fix:** Add explicit initialization export in `index.ts`:
```typescript
// At end of index.ts (after IIFE)
export { createChatWidget }; // Allow programmatic init
```

Then in tests, call it explicitly:
```typescript
const { createChatWidget } = await import('../../../widget/src/index');
createChatWidget((window as any).ChatWidgetConfig);
```

### Issue #3: Timing & Async Operations ⚠️

**Current test pattern:**
```typescript
// Send message
sendBtn.click();

// Wait for fetch
await new Promise(resolve => setTimeout(resolve, 100));

// Verify
expect(fetchSpy).toHaveBeenCalled();
```

**Potential problem:** 100ms might not be enough if widget has delays.

**Solution:** Use `vi.waitFor()` for more robust waiting:
```typescript
await vi.waitFor(() => {
  expect(fetchSpy).toHaveBeenCalled();
}, { timeout: 1000 });
```

### Issue #4: Module Path Resolution ✅

**Test import:**
```typescript
const widgetCode = await import('../../../widget/src/index');
```

**Verified:** Widget files exist at correct paths:
- ✅ `widget/src/index.ts`
- ✅ `widget/src/widget.ts`
- ✅ `widget/src/types.ts`
- ✅ `widget/src/markdown.ts`

**vitest.config.ts alias:**
```typescript
alias: {
  '@': path.resolve(__dirname, './'),
}
```

**Result:** Relative import should work. If not, can use `@/widget/src/index`.

---

## Step-by-Step Implementation

### RED Phase: Document Failures

**Step 1:** Install jsdom
```bash
pnpm add -D jsdom @types/jsdom
```

**Step 2:** Run tests
```bash
pnpm test tests/integration/widget/context-passing.test.ts --run
```

**Step 3:** Document each failure
For each failing test, note:
- Test name
- Error message
- Line number
- Root cause (initialization? timing? assertion?)

**Expected failures:**
- Widget not creating DOM elements
- Fetch spy not being called
- Payload missing context object

### GREEN Phase: Fix One Test at a Time

**Priority order:**
1. Test #1 (full context) - Most comprehensive
2. Test #2 (default behavior) - Similar to #1
3. Test #3 (opt-out) - Tests negative case
4. Test #4 (no query params) - Edge case
5. Test #5 (custom context) - Additional feature
6. Test #6 (special chars) - Data integrity
7. Test #7 (privacy) - Security

**Debugging steps for each test:**

1. **Verify widget initialized:**
   ```typescript
   const bubble = document.querySelector('#n8n-chat-bubble');
   console.log('Bubble found:', !!bubble);
   ```

2. **Check config was read:**
   ```typescript
   console.log('Config:', (window as any).ChatWidgetConfig);
   ```

3. **Verify DOM elements created:**
   ```typescript
   console.log('Input:', !!document.querySelector('#n8n-chat-input'));
   console.log('Send:', !!document.querySelector('#n8n-chat-send'));
   ```

4. **Check fetch was called:**
   ```typescript
   console.log('Fetch calls:', fetchSpy.mock.calls.length);
   console.log('Payload:', fetchSpy.mock.calls[0]?.[1]?.body);
   ```

5. **Inspect payload:**
   ```typescript
   const payload = JSON.parse(fetchSpy.mock.calls[0][1].body);
   console.log('Context:', payload.context);
   ```

**Common fixes:**

**Fix A: Widget not initializing**
```typescript
// In test setup, after setting config and importing widget:
await new Promise(resolve => setTimeout(resolve, 200)); // Wait for init
```

**Fix B: Fetch not called**
```typescript
// Use waitFor instead of setTimeout
import { waitFor } from '@testing-library/dom'; // If available
// OR
await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalled());
```

**Fix C: DOM elements not found**
```typescript
// Verify JSDOM is properly set up
expect(document.body).toBeTruthy();
expect(document.querySelector).toBeDefined();
```

### REFACTOR Phase: Optimize & Clean

**Refactor 1: Extract setup helper**
```typescript
async function setupWidgetTest(config: any) {
  (window as any).ChatWidgetConfig = {
    branding: { companyName: 'Test Company' },
    connection: {
      webhookUrl: 'https://test.n8n.cloud/webhook/test123',
      ...config,
    },
  };

  await import('../../../widget/src/index');
  await new Promise(resolve => setTimeout(resolve, 100));

  const bubble = document.querySelector('#n8n-chat-bubble') as HTMLButtonElement;
  expect(bubble).toBeTruthy();
  bubble?.click();

  await new Promise(resolve => setTimeout(resolve, 100));

  const input = document.querySelector('#n8n-chat-input') as HTMLInputElement;
  const sendBtn = document.querySelector('#n8n-chat-send') as HTMLButtonElement;

  return { input, sendBtn };
}
```

**Refactor 2: Extract send helper**
```typescript
async function sendMessage(input: HTMLInputElement, sendBtn: HTMLButtonElement, text: string) {
  input.value = text;
  sendBtn.click();
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

**Refactor 3: Extract assertion helper**
```typescript
function expectContextPayload(fetchSpy: any, expectedContext: any) {
  expect(fetchSpy).toHaveBeenCalled();
  const payload = JSON.parse(fetchSpy.mock.calls[0][1].body);
  expect(payload).toHaveProperty('context');
  expect(payload.context).toMatchObject(expectedContext);
}
```

**Refactor 4: Use fake timers (optional)**
```typescript
beforeEach(() => {
  vi.useFakeTimers();
  // ... rest of setup
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// In tests, replace setTimeout with:
await vi.advanceTimersByTimeAsync(100);
```

---

## Success Criteria Checklist

### RED Phase Complete When:
- [ ] jsdom is installed (`pnpm list jsdom` succeeds)
- [ ] Tests run without import errors
- [ ] All 7 tests execute (even if failing assertions)
- [ ] Failure reasons are documented

### GREEN Phase Complete When:
- [ ] All 7 tests pass (100% pass rate)
- [ ] No console errors during test execution
- [ ] Fetch spy receives expected payloads
- [ ] Context object matches specification
- [ ] Privacy requirements met (no userAgent/referrer)

### REFACTOR Phase Complete When:
- [ ] No duplicated setup code (DRY principle)
- [ ] Tests are readable (clear AAA structure)
- [ ] Helper functions are well-named
- [ ] Performance is acceptable (<5s total)
- [ ] Tests pass 10 consecutive times (no flakiness)

---

## Test Execution Commands

**Run all context tests:**
```bash
pnpm test tests/integration/widget/context-passing.test.ts
```

**Run single test:**
```bash
pnpm test tests/integration/widget/context-passing.test.ts -t "capture full page context"
```

**Run with coverage:**
```bash
pnpm test:coverage tests/integration/widget/context-passing.test.ts
```

**Run in watch mode:**
```bash
pnpm test tests/integration/widget/context-passing.test.ts --watch
```

**Run with UI:**
```bash
pnpm test:ui tests/integration/widget/context-passing.test.ts
```

---

## Constraints & Guardrails

### DO:
- ✅ Install jsdom as first step
- ✅ Fix tests one at a time (incremental)
- ✅ Add debug logging to understand failures
- ✅ Use `vi.waitFor()` for async operations
- ✅ Extract helpers after tests pass (refactor phase)

### DON'T:
- ❌ Modify `widget/src/widget.ts` unless absolutely necessary
- ❌ Change test assertions (they match requirements)
- ❌ Skip any of the 7 tests
- ❌ Remove privacy checks (test #7)
- ❌ Hard-code values just to pass tests

---

## Expected Payload Structure

### Test #1: Full Context (captureContext: true)
```json
{
  "message": "Test message",
  "sessionId": "session-1234567890",
  "context": {
    "pageUrl": "http://example.com/products?category=widgets&utm_source=google&utm_campaign=summer",
    "pagePath": "/products",
    "pageTitle": "Test Page - Product Listing",
    "domain": "example.com",
    "queryParams": {
      "category": "widgets",
      "utm_source": "google",
      "utm_campaign": "summer"
    }
  }
}
```

### Test #3: No Context (captureContext: false)
```json
{
  "message": "Test message",
  "sessionId": "session-1234567890"
  // NO context field
}
```

### Test #5: Custom Context
```json
{
  "message": "Test message",
  "sessionId": "session-1234567890",
  "context": { /* standard context */ },
  "customContext": {
    "userId": "12345",
    "tier": "premium",
    "experimentVariant": "B"
  }
}
```

---

## File Paths (Absolute)

**Test file:**
```
C:\Projects\Chat Interfacer\n8n-widget-designer\tests\integration\widget\context-passing.test.ts
```

**Widget implementation:**
```
C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\widget.ts
```

**Widget entry point:**
```
C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\index.ts
```

**Package.json:**
```
C:\Projects\Chat Interfacer\n8n-widget-designer\package.json
```

**Vitest config:**
```
C:\Projects\Chat Interfacer\n8n-widget-designer\vitest.config.ts
```

---

## Estimated Timeline

- **RED Phase:** 15-30 minutes (install deps, run tests, document failures)
- **GREEN Phase:** 1-2 hours (fix initialization, timing, make tests pass)
- **REFACTOR Phase:** 30-45 minutes (extract helpers, optimize)
- **Total:** 2-3 hours

---

## Contact Points

**Blocker:** Can't get widget to initialize in tests?
→ Check if `window.ChatWidgetConfig` is set before import
→ Try adding explicit `createChatWidget()` export and call

**Blocker:** Fetch never called?
→ Increase wait time (200ms)
→ Use `vi.waitFor()` with timeout
→ Check if send button click is working

**Blocker:** Context object missing fields?
→ Verify JSDOM URL is set in constructor
→ Check `window.location` in test
→ Console.log the captured context

**Blocker:** Tests are flaky?
→ Use fake timers
→ Increase timeouts
→ Check for race conditions

---

## Next Agent

**After GREEN phase complete:**
→ Hand off to **Refactorer Agent** for optimization
→ Provide test execution log
→ Document any workarounds or test-specific hacks
→ Note any potential improvements for future iterations

---

**Ready to proceed:** ✅ YES
**Prerequisites met:** ✅ All context provided
**First action:** Install jsdom dependency

Good luck! 🎯
