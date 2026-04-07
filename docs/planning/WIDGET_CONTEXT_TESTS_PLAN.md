# Widget Context-Passing Tests - Implementation Plan

**Date:** 2025-11-10
**Agent:** Architect/Planner
**Project:** N8n Widget Designer Platform
**Phase:** Widget Testing (Phase 3)
**Module:** Context Passing Integration Tests

---

## Executive Summary

This plan outlines the implementation strategy for 7 high-quality integration tests that validate the widget's context-passing functionality. The tests are already defined but currently fail due to missing implementation and dependency issues.

**Status:** RED Phase (Tests exist but fail)
**Next Step:** Install dependencies → Make tests pass (GREEN) → Refactor if needed
**Quality Target:** 10/10 - Essential, non-redundant tests only

---

## 1. Problem Statement

### Current Situation
- Test file exists: `tests/integration/widget/context-passing.test.ts` (355 lines)
- Widget implementation exists: `widget/src/widget.ts` with `capturePageContext()` function
- Tests currently FAIL due to:
  1. Missing `jsdom` dependency (import fails)
  2. Widget not properly initialized in test environment
  3. Possible module resolution issues

### Requirements
The widget must capture and transmit page context to N8n webhooks:
- **Page URL** (full URL including protocol, domain, path, query params)
- **Page Path** (pathname only, e.g., `/products`)
- **Page Title** (`document.title`)
- **Domain** (`window.location.hostname`)
- **Query Parameters** (parsed as key-value object)
- **Custom Context** (user-provided metadata)

### Constraints
- Default behavior: Context capture is ENABLED (unless explicitly disabled)
- Privacy: NO userAgent or referrer fields (sensitive data)
- Configuration: `captureContext` flag controls behavior
- Bundle size: Keep widget under 50KB gzipped

---

## 2. Test Strategy Analysis

### Existing Tests (7 total)

| # | Test Name | Purpose | Quality | Keep? |
|---|-----------|---------|---------|-------|
| 1 | Capture full page context by default | Validates complete context object structure | ✅ 10/10 | **YES** |
| 2 | Capture context when captureContext is undefined | Tests default behavior (true) | ✅ 10/10 | **YES** |
| 3 | NOT capture context when captureContext is false | Tests explicit opt-out | ✅ 10/10 | **YES** |
| 4 | Handle URLs without query parameters | Edge case: empty queryParams object | ✅ 9/10 | **YES** |
| 5 | Include custom context when provided | Tests customContext field passthrough | ✅ 10/10 | **YES** |
| 6 | Handle special characters in query parameters | URL encoding/decoding correctness | ✅ 8/10 | **YES** |
| 7 | Not include sensitive fields (userAgent, referrer) | Privacy compliance | ✅ 10/10 | **YES** |

### Assessment: Keep All 7 Tests

**Rationale:**
- **Tests 1-3** cover the three behavioral modes (enabled/default/disabled) - **Essential**
- **Test 4** covers edge case (no query params) - **Important for robustness**
- **Test 5** covers additional feature (custom context) - **Essential for feature coverage**
- **Test 6** covers data integrity (URL encoding) - **Important for real-world usage**
- **Test 7** covers privacy compliance - **Essential for GDPR/security**

**Redundancy Check:** No redundant tests. Each validates a distinct behavior or edge case.

**Coverage Analysis:**
- ✅ Happy path (tests 1-2)
- ✅ Opt-out behavior (test 3)
- ✅ Edge cases (test 4, 6)
- ✅ Feature completeness (test 5)
- ✅ Security/privacy (test 7)

---

## 3. Current Implementation Review

### Widget Code (`widget/src/widget.ts`)

**Lines 316-337:** `capturePageContext()` function
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
    console.error('[N8n Chat Widget] Error capturing page context:', error);
    return {
      pageUrl: window.location.href,
      pagePath: window.location.pathname,
      pageTitle: document.title,
      queryParams: {},
      domain: window.location.hostname,
    };
  }
}
```

**Lines 355-364:** Context inclusion logic
```typescript
// Add page context if enabled (default: true)
const shouldCaptureContext = mergedConfig.connection.captureContext !== false;
if (shouldCaptureContext) {
  payload.context = capturePageContext();
}

// Add custom context if provided
if (mergedConfig.connection.customContext) {
  payload.customContext = mergedConfig.connection.customContext;
}
```

**Assessment:**
- ✅ Implementation already exists
- ✅ Default behavior is correct (capture unless explicitly false)
- ✅ Error handling is present
- ✅ Query params parsing uses `URLSearchParams`
- ✅ No sensitive fields (userAgent, referrer)
- ⚠️ Needs testing to confirm it works in JSDOM environment

---

## 4. Dependencies & Environment

### Required Dependencies

**Missing:** `jsdom` (test file imports it but not installed)

```bash
pnpm add -D jsdom @types/jsdom
```

**Already Installed:**
- ✅ vitest (v2.1.9)
- ✅ happy-dom (v15.11.7) - Alternative DOM environment (not used in tests)
- ✅ @vitest/ui (v2.1.9)

### Test Environment Setup

**Current Setup (per test file):**
```typescript
import { JSDOM } from 'jsdom';

beforeEach(() => {
  dom = new JSDOM(`...`, {
    url: 'http://example.com/products?category=widgets&utm_source=google&utm_campaign=summer',
    pretendToBeVisual: true,
  });

  window = dom.window as any;
  document = window.document;

  global.window = window as any;
  global.document = document as any;
  global.navigator = window.navigator as any;

  // Mock fetch
  fetchSpy = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ response: 'Test response' }),
  });
  global.fetch = fetchSpy;
});
```

**Assessment:**
- ✅ Proper JSDOM setup with URL injection
- ✅ Global mocks for window, document, navigator
- ✅ Fetch spy for API call verification
- ✅ Clean teardown in `afterEach`

### Module Resolution

**Potential Issue:** Widget import path
```typescript
const widgetCode = await import('../../../widget/src/index');
```

**Check Required:**
- Does `widget/src/index.ts` exist?
- Does it export the widget initialization?
- Is TypeScript path mapping configured?

---

## 5. Implementation Steps (TDD Workflow)

### Phase 1: RED (Verify Tests Fail) ✅ CURRENT PHASE

**Step 1.1:** Install missing dependencies
```bash
cd "C:\Projects\Chat Interfacer\n8n-widget-designer"
pnpm add -D jsdom @types/jsdom
```

**Step 1.2:** Verify test file can be parsed
```bash
pnpm test tests/integration/widget/context-passing.test.ts --run
```

**Expected:** Tests fail with meaningful errors (not import errors)

**Step 1.3:** Document failure reasons
- Are tests failing because widget not initialized?
- Are tests failing because context not captured?
- Are tests failing because DOM elements not found?

### Phase 2: GREEN (Make Tests Pass) 🎯 NEXT PHASE

**Step 2.1:** Fix widget initialization in tests
- Ensure `widget/src/index.ts` exists and exports properly
- Verify widget auto-initializes when imported
- Add debug logging if needed

**Step 2.2:** Verify fetch is called with correct payload
- Check fetch spy is invoked after sending message
- Verify payload structure matches expectations
- Ensure context object is present/absent based on config

**Step 2.3:** Handle timing issues
- Tests use `setTimeout` for async operations
- May need to increase wait times or use better async handling
- Consider using `vi.advanceTimersByTime()` with fake timers

**Step 2.4:** Fix any test-specific issues
- Handle JSDOM limitations (e.g., localStorage, timers)
- Mock additional browser APIs if needed
- Ensure URL parsing works in JSDOM environment

### Phase 3: REFACTOR (Optimize & Clean) 🔧 FINAL PHASE

**Step 3.1:** Reduce test duplication
- Extract common setup into helper functions
- Create factory functions for widget config
- Simplify assertions with custom matchers

**Step 3.2:** Improve test readability
- Add descriptive comments for complex setup
- Use meaningful variable names
- Group related assertions

**Step 3.3:** Optimize test performance
- Use fake timers instead of real `setTimeout`
- Reuse JSDOM instances where possible
- Parallelize independent tests

---

## 6. Success Criteria

### Definition of "Passing"

**All 7 tests must:**
1. ✅ Execute without errors (no import failures, no runtime crashes)
2. ✅ Complete within reasonable time (<5 seconds total)
3. ✅ Pass all assertions (100% pass rate)
4. ✅ Verify correct payload sent to webhook
5. ✅ Test both positive and negative cases
6. ✅ Cover all configuration modes (enabled/default/disabled)
7. ✅ Validate edge cases (no query params, special chars, privacy)

### Validation Checklist

- [ ] `pnpm test tests/integration/widget/context-passing.test.ts` passes
- [ ] All 7 tests show green checkmarks
- [ ] No test warnings or deprecation notices
- [ ] Fetch spy receives expected payload structure
- [ ] Context object matches specification in all scenarios
- [ ] Privacy requirements met (no sensitive fields)
- [ ] Performance acceptable (<1 second per test)

---

## 7. Risk Assessment & Mitigations

### Identified Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| JSDOM doesn't support URL API | Low | High | Use polyfill or mock URLSearchParams |
| Widget doesn't initialize in test env | Medium | High | Add explicit initialization call in tests |
| Timing issues cause flaky tests | Medium | Medium | Use fake timers, avoid real setTimeout |
| Module import path incorrect | Medium | High | Fix path or add TypeScript path alias |
| Tests take too long to run | Low | Low | Optimize with fake timers, parallel execution |

### Mitigation Strategies

**Strategy 1: JSDOM Compatibility**
- Test URL API support in JSDOM environment first
- If unsupported, add polyfill or conditional logic
- Document any JSDOM-specific workarounds

**Strategy 2: Widget Initialization**
- Ensure widget exports a testable function
- Add explicit initialization in test setup
- Mock global `ChatWidgetConfig` before import

**Strategy 3: Timing Control**
- Replace `setTimeout` with `vi.useFakeTimers()`
- Use `vi.advanceTimersByTime()` for controlled delays
- Document timing requirements in comments

**Strategy 4: Module Resolution**
- Verify `widget/src/index.ts` exists
- Check `tsconfig.json` for path mappings
- Use relative paths if absolute paths fail

---

## 8. File & Module Structure

### Files to Verify/Modify

| File | Purpose | Action | Status |
|------|---------|--------|--------|
| `tests/integration/widget/context-passing.test.ts` | Test definitions | ✅ Exists, review | ✅ Ready |
| `widget/src/widget.ts` | Widget implementation | ✅ Exists, verify | ✅ Ready |
| `widget/src/index.ts` | Widget entry point | ⚠️ Verify exports | ❓ Check |
| `widget/src/types.ts` | Type definitions | ✅ Exists, verify | ✅ Ready |
| `package.json` | Dependencies | 🔧 Add jsdom | ❌ Missing dep |
| `vitest.config.ts` | Test configuration | ⚠️ Verify setup | ❓ Check |

### Expected Widget Export Structure

**`widget/src/index.ts` should contain:**
```typescript
import { createChatWidget } from './widget';
import type { WidgetConfig } from './types';

// Auto-initialize if config is present
if (typeof window !== 'undefined' && (window as any).ChatWidgetConfig) {
  createChatWidget((window as any).ChatWidgetConfig);
}

// Export for programmatic usage
export { createChatWidget };
export type { WidgetConfig };
```

### Module Responsibility

**`widget/src/widget.ts`** (Current file - 395 lines)
- ✅ Single responsibility: Widget UI and messaging logic
- ✅ Size: Within 200-400 line ideal range
- ✅ Cohesion: All functions related to widget behavior
- ✅ No split needed

---

## 9. Test Implementation Brief

### For TDD-QA-Lead Agent

**Objective:** Make all 7 tests in `context-passing.test.ts` pass.

**Prerequisites:**
1. Install `jsdom` and `@types/jsdom`
2. Verify `widget/src/index.ts` exists and exports `createChatWidget`
3. Confirm `vitest.config.ts` allows dynamic imports

**First Test to Fix:** Test #1 - "Capture full page context by default"

**Expected Failure Mode:**
- Import error: `Cannot find module 'jsdom'`
- OR: Widget not initialized (DOM elements not found)
- OR: Fetch not called (timing issue)

**Success Criteria for First Test:**
```typescript
// When this test passes:
expect(fetchSpy).toHaveBeenCalled();
expect(payload.context).toMatchObject({
  pageUrl: 'http://example.com/products?category=widgets&utm_source=google&utm_campaign=summer',
  pagePath: '/products',
  pageTitle: 'Test Page - Product Listing',
  domain: 'example.com',
  queryParams: {
    category: 'widgets',
    utm_source: 'google',
    utm_campaign: 'summer',
  },
});
```

**Debugging Hints:**
- Add `console.log(fetchSpy.mock.calls)` to see what's sent
- Check `global.window.location.href` in test
- Verify widget actually creates DOM elements
- Use `await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalled())`

**Constraints:**
- Do NOT modify `widget/src/widget.ts` unless absolutely necessary (implementation looks correct)
- Do NOT change test assertions (they match requirements)
- Do NOT skip tests (all 7 must pass)
- Do fix imports, timing, initialization issues

---

## 10. Architectural Decisions

### Decision Log

**AD-01: Use JSDOM instead of happy-dom**
- **Rationale:** Test file already uses JSDOM; happy-dom is installed but unused
- **Trade-offs:** JSDOM is heavier but more complete browser environment
- **Alternative:** Could refactor to happy-dom for smaller footprint
- **Status:** Accepted (follow existing test structure)

**AD-02: Keep all 7 tests (no reduction)**
- **Rationale:** Each test validates distinct behavior; no redundancy
- **Trade-offs:** Slightly longer test suite runtime (~5-7 seconds)
- **Alternative:** Could combine tests 1-2, but reduces clarity
- **Status:** Accepted (quality > speed)

**AD-03: Default context capture to TRUE**
- **Rationale:** Most users want context; explicit opt-out is clearer
- **Trade-offs:** Slight privacy concern, but no sensitive data captured
- **Alternative:** Default to false (opt-in)
- **Status:** Accepted (already implemented, matches test expectations)

**AD-04: Use real setTimeout in tests (initially)**
- **Rationale:** Simpler, easier to debug; can optimize later
- **Trade-offs:** Tests run slower (~100ms per async operation)
- **Alternative:** Use fake timers from start
- **Status:** Accepted for GREEN phase, revisit in REFACTOR phase

---

## 11. Next Steps

### Immediate Actions (TDD-QA-Lead)

1. **Install Dependencies**
   ```bash
   cd "C:\Projects\Chat Interfacer\n8n-widget-designer"
   pnpm add -D jsdom @types/jsdom
   ```

2. **Verify Widget Entry Point**
   ```bash
   # Check if file exists
   test -f widget/src/index.ts && echo "EXISTS" || echo "MISSING"

   # If missing, create it with proper exports
   ```

3. **Run Tests (Expect Failures)**
   ```bash
   pnpm test tests/integration/widget/context-passing.test.ts --run
   ```

4. **Document Failure Reasons**
   - Create RED test report with:
     - Test name
     - Expected behavior
     - Actual failure reason
     - Fix needed

5. **Fix Issues One-by-One**
   - Start with import errors
   - Then initialization issues
   - Then timing issues
   - Then assertion failures

### Handoff to Implementer

**When all tests pass (GREEN):**
- Run `pnpm test:coverage` to verify coverage
- Check for any flaky tests (run 5 times)
- Document any workarounds or test-specific mocks
- Prepare for REFACTOR phase

---

## 12. Documentation Requirements

### Files to Update

**After GREEN Phase:**
- ✅ `docs/development/DEVELOPMENT_LOG.md` - Log test implementation
- ✅ `docs/development/PROGRESS.md` - Update Phase 3 progress
- ✅ `docs/testing/TEST_SUMMARY.md` - Add widget test section
- ✅ `docs/modules/WIDGET_CONTEXT_MODULE_SUMMARY.md` - Create module doc

**After REFACTOR Phase:**
- ✅ `docs/development/decisions.md` - Document any test architecture decisions
- ✅ `README.md` - Add "Running Widget Tests" section

---

## 13. Quality Gates

### Before Moving to Next Phase

**RED → GREEN:**
- [ ] All 7 tests execute without import errors
- [ ] At least 1 test passes (proves setup is correct)
- [ ] Failure reasons are understood and documented

**GREEN → REFACTOR:**
- [ ] All 7 tests pass consistently (100% pass rate)
- [ ] No flaky tests (must pass 10 consecutive times)
- [ ] Test execution time <10 seconds total
- [ ] Coverage of context-passing code >80%

**REFACTOR → COMPLETE:**
- [ ] Test code is DRY (no unnecessary duplication)
- [ ] Tests are readable (clear setup, execution, assertion)
- [ ] Tests are maintainable (easy to update when requirements change)
- [ ] Performance is acceptable (<5 seconds total)

---

## 14. Conclusion

### Summary

This plan provides a complete roadmap for implementing widget context-passing tests:
- **7 high-quality tests** covering all scenarios (keep all, no redundancy)
- **Clear implementation strategy** following RED → GREEN → REFACTOR
- **Risk mitigation** for JSDOM compatibility, timing, and module resolution
- **Success criteria** with specific, measurable outcomes

### Key Takeaways

1. **Tests are well-designed** - No changes needed to test logic
2. **Implementation exists** - Widget code already captures context correctly
3. **Main blocker** - Missing `jsdom` dependency
4. **Potential issues** - Widget initialization, timing, module imports
5. **Low risk** - Implementation looks solid, just needs verification

### Estimated Effort

- **RED Phase:** 30 minutes (install deps, verify failures)
- **GREEN Phase:** 1-2 hours (fix initialization, timing, assertions)
- **REFACTOR Phase:** 30 minutes (optimize, reduce duplication)
- **Total:** ~2-3 hours for complete implementation

### Approval & Sign-off

**Ready for TDD-QA-Lead Agent:** ✅ YES
**Blockers:** None (can proceed immediately)
**Prerequisites:** None (all context provided in this plan)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Next Review:** After GREEN phase completion
