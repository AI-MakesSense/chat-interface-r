# Widget Phase 3.7 - Week 1 Core Infrastructure: RED Tests Complete

**Phase:** 3.7 Widget Bundle - Week 1: Core Infrastructure
**Milestone:** RED Phase (All Tests Failing)
**Date:** 2025-11-11
**Agent:** TDD-QA-Lead
**Status:** COMPLETE - Ready for Implementer

---

## Executive Summary

124 comprehensive, failing tests have been written for 5 core widget infrastructure modules. All tests are RED (failing) because the modules don't exist yet. This is correct TDD flow: write tests first, then implement code to make them pass.

**Key Metrics:**
- Total Tests Written: **124**
- Total Test Files: **5**
- Total Modules to Implement: **5**
- Current Status: **100% RED** ✓

---

## Test Files Created

### 1. Config Manager Tests
**File:** `tests/widget/core/config.test.ts`
**Tests:** 32
**Module to Implement:** `widget/src/core/config.ts`

Functions to implement:
- `mergeConfig(userConfig)` - Merge user config with defaults
- `validateConfig(config)` - Validate configuration
- `readConfigFromWindow()` - Read from window.ChatWidgetConfig
- `readLicenseFlagsFromWindow()` - Read license flags

---

### 2. State Manager Tests
**File:** `tests/widget/core/state.test.ts`
**Tests:** 23
**Module to Implement:** `widget/src/core/state.ts`

Class to implement:
- `StateManager` - Pub-sub state management pattern
  - `constructor(initialState)`
  - `getState()`
  - `setState(partial)`
  - `subscribe(listener)`

Interface to implement:
- `WidgetState` - State shape for open, messages, loading, error, etc.

---

### 3. Theme Manager Tests
**File:** `tests/widget/theming/theme-manager.test.ts`
**Tests:** 22
**Module to Implement:** `widget/src/theming/theme-manager.ts`

Class to implement:
- `ThemeManager` - Light/dark/auto theme management
  - `constructor(config, stateManager)`
  - `applyTheme(theme)`
  - `getCurrentTheme()`
  - `destroy()`

Features:
- System preference detection (matchMedia)
- Theme change listening
- Proper cleanup

---

### 4. CSS Injector Tests
**File:** `tests/widget/theming/css-injector.test.ts`
**Tests:** 21
**Module to Implement:** `widget/src/theming/css-injector.ts`

Functions to implement:
- `generateCSSVariables(config)` - Generate CSS variable string
- `injectStyles(config)` - Inject styles into document.head

Features:
- CSS custom properties generation
- Dynamic style element creation/reuse
- Base widget CSS inclusion

---

### 5. CSS Variables Tests
**File:** `tests/widget/theming/css-variables.test.ts`
**Tests:** 26
**Module to Implement:** `widget/src/theming/css-variables.ts`

Function to implement:
- `createCSSVariables(config)` - Create CSS variable object

Features:
- Color variable mapping
- Size unit formatting (px)
- Font family preservation

---

## Test Statistics

| Component | Tests | File Size | Status |
|-----------|-------|-----------|--------|
| Config Manager | 32 | 16.5 KB | RED |
| State Manager | 23 | 12.3 KB | RED |
| Theme Manager | 22 | 13.0 KB | RED |
| CSS Injector | 21 | 12.6 KB | RED |
| CSS Variables | 26 | 11.8 KB | RED |
| **TOTAL** | **124** | **66.2 KB** | **RED** |

---

## Test Execution Results

When running `npm test tests/widget`:

**Expected Output:**
```
FAIL  tests/widget/core/config.test.ts (module not found)
FAIL  tests/widget/core/state.test.ts (module not found)
FAIL  tests/widget/theming/theme-manager.test.ts (module not found)
FAIL  tests/widget/theming/css-injector.test.ts (module not found)
FAIL  tests/widget/theming/css-variables.test.ts (module not found)

TOTAL: 124 FAILED
```

This is correct! The tests are RED as expected.

---

## Key Design Decisions Tested

### 1. Configuration Management
- Deep merge defaults with user config
- Validation on webhook URL (HTTPS required)
- License flag injection from server
- Feature flags for future extensibility

### 2. State Management
- Simple pub-sub pattern (not Redux/Zustand)
- Shallow state merges
- Listener notifications on every change
- Unsubscribe function for cleanup

### 3. Theme Management
- Three theme modes: light, dark, auto
- Auto mode uses matchMedia for system preference
- Real-time system preference listening
- Proper event listener cleanup

### 4. Styling Architecture
- CSS custom properties (variables) for theming
- CSS variable naming convention: `--cw-*`
- Injected style element reuse
- Base CSS + dynamic variables separation

### 5. CSS Variables
- Standardized mapping from config to CSS variables
- Consistent naming (--cw-primary-color, etc.)
- Automatic unit formatting (px for sizes)
- Support for various hex color formats

---

## Test Quality Highlights

### Comprehensive Coverage
- **Behavioral Tests:** Black-box, not implementation-specific
- **Edge Cases:** Null/undefined/empty config handling
- **Error Scenarios:** Invalid colors, missing required fields
- **Integration:** Full lifecycle tests
- **Isolation:** Proper setup/teardown for DOM

### Deterministic
- No real network calls
- No real DOM (happy-dom)
- No async operations
- No flaky timing dependencies

### Well-Documented
- Each test has a comment explaining why it fails
- Clear, descriptive test names
- Expected behavior defined in implementation handoff

---

## Documentation Artifacts

### 1. Test Summary
**File:** `tests/WIDGET_CORE_TEST_SUMMARY.md`

Contains:
- Detailed test listing by module
- Coverage breakdown
- Expected behaviors
- Test statistics
- Execution commands

### 2. Implementation Handoff
**File:** `tests/WIDGET_CORE_IMPLEMENTATION_HANDOFF.md`

Contains:
- Failing tests overview
- Complete module specifications
- Expected behaviors
- Default config structure
- Validation rules
- Implementation strategy
- Passing criteria

---

## Next Phase: GREEN

When Implementer completes the 5 modules:

1. All 124 tests should pass
2. No test skipping allowed
3. Code must follow TDD principles
4. No hardcoding to pass tests
5. Proper error handling

**Estimated Implementation Time:** 2-3 hours

---

## File Locations

```
n8n-widget-designer/
├── tests/
│   ├── widget/
│   │   ├── core/
│   │   │   ├── config.test.ts (32 tests) ✓
│   │   │   └── state.test.ts (23 tests) ✓
│   │   └── theming/
│   │       ├── theme-manager.test.ts (22 tests) ✓
│   │       ├── css-injector.test.ts (21 tests) ✓
│   │       └── css-variables.test.ts (26 tests) ✓
│   ├── WIDGET_CORE_TEST_SUMMARY.md ✓
│   └── WIDGET_CORE_IMPLEMENTATION_HANDOFF.md ✓
│
└── widget/
    └── src/
        ├── core/
        │   ├── config.ts (to implement)
        │   └── state.ts (to implement)
        └── theming/
            ├── theme-manager.ts (to implement)
            ├── css-injector.ts (to implement)
            └── css-variables.ts (to implement)
```

---

## Testing Best Practices Followed

✓ **RED First:** Tests written before implementation
✓ **Failing Tests:** All tests correctly fail
✓ **Clear Names:** Test names describe behavior
✓ **Isolation:** Each test is independent
✓ **Setup/Teardown:** Proper cleanup between tests
✓ **Mocking:** Window/DOM APIs properly mocked
✓ **Edge Cases:** Null, undefined, empty, invalid inputs
✓ **Integration:** End-to-end workflows tested
✓ **Documentation:** Every test has failure reason
✓ **No Assumptions:** No hardcoded values or guesses

---

## Handoff Checklist

- [x] 124 tests written and failing (RED)
- [x] 5 test files created in proper locations
- [x] All tests syntactically valid (TypeScript)
- [x] Tests use Vitest + happy-dom
- [x] Proper mocking of window/DOM
- [x] Setup/teardown in all test suites
- [x] Edge cases covered
- [x] Integration tests included
- [x] Documentation complete
- [x] Implementation handoff document created
- [x] Test summary document created

---

## Ready for Implementation

**Status:** GREEN LIGHT

The Implementer can now:
1. Read `WIDGET_CORE_IMPLEMENTATION_HANDOFF.md` for detailed specifications
2. Create 5 modules in `widget/src/`
3. Run `npm test tests/widget` to verify implementation
4. Watch all 124 tests turn GREEN

---

## Questions or Issues?

If tests don't pass after implementation:
1. Check test name - it describes the expected behavior
2. Read the test comment - it explains why it should fail initially
3. Review the handoff document - it has detailed specifications
4. Run single test to debug: `npm test tests/widget/core/config.test.ts -t "should merge"`

---

**Created:** 2025-11-11
**Agent:** TDD-QA-Lead
**Phase:** RED (Complete)
**Next Phase:** GREEN (Implementation)
**Status:** Ready for Handoff
