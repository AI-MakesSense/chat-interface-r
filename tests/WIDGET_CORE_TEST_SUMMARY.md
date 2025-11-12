# Widget Core Infrastructure - RED Tests Summary

**Phase:** 3.7 Widget Bundle - Week 1: Core Infrastructure
**Status:** RED (All tests failing - modules not implemented yet)
**Date:** 2025-11-11
**Total Tests:** 124

## Test Files Created

### 1. Config Manager Tests
**File:** `tests/widget/core/config.test.ts`
**Tests:** 32
**Coverage:**

- `mergeConfig()` - Merges user config with defaults (9 tests)
  - Default values for missing fields
  - User-provided value preservation
  - Partial config handling (branding-only, style-only)
  - Nested object merging
  - Features configuration
  - Connection config preservation
  - Complete default field presence

- `validateConfig()` - Validates configuration (9 tests)
  - Missing webhookUrl detection
  - Non-HTTPS URL detection
  - Invalid hex colors detection
  - Invalid theme values detection
  - Invalid position values detection
  - Valid complete config acceptance
  - Multiple validation errors

- `readConfigFromWindow()` - Reads window.ChatWidgetConfig (5 tests)
  - Reading from window.ChatWidgetConfig
  - Missing config handling
  - Null config handling
  - Partial config reading
  - Non-destructive reading

- `readLicenseFlagsFromWindow()` - Reads window.__LICENSE_FLAGS__ (9 tests)
  - Branding flag reading
  - Default branding to true
  - Missing flags handling
  - Null flags handling
  - Explicit false value preservation
  - Explicit true value preservation

**Expected Failures:** All 32 tests should fail because `widget/src/core/config.ts` doesn't exist

---

### 2. State Manager Tests
**File:** `tests/widget/core/state.test.ts`
**Tests:** 23
**Coverage:**

- Initialization (2 tests)
  - Default state initialization
  - Custom state initialization

- `setState()` (8 tests)
  - State value updates
  - Unchanged field preservation
  - Partial state updates
  - Nested array updates
  - Boolean flag updates
  - Error state updates
  - Streaming message updates

- `getState()` (4 tests)
  - Current state retrieval
  - State updates reflection
  - Reference changes on updates
  - Consistent state during multiple reads

- `subscribe()` (7 tests)
  - Listener notification on state changes
  - State passing to listeners
  - Multiple listener support
  - Unsubscribe function return
  - Unsubscribed listener isolation
  - Resubscription after unsubscribe
  - Multiple consecutive state updates

- Integration (2 tests)
  - Complete widget lifecycle
  - Concurrent subscriber independence

**Expected Failures:** All 23 tests should fail because `widget/src/core/state.ts` doesn't exist

---

### 3. Theme Manager Tests
**File:** `tests/widget/theming/theme-manager.test.ts`
**Tests:** 22
**Coverage:**

- Initialization (3 tests)
  - Auto theme initialization
  - Light theme initialization
  - Dark theme initialization

- `applyTheme()` (7 tests)
  - Light theme application
  - Dark theme application
  - Auto theme with system dark preference
  - Auto theme with system light preference
  - State updates on theme change
  - Light-to-dark theme switching
  - Dark-to-light theme switching

- `getCurrentTheme()` (3 tests)
  - Current theme retrieval
  - Theme switching verification
  - Auto mode resolution

- System Preference Detection (5 tests)
  - Dark mode preference detection
  - Light mode preference detection
  - Event listener attachment
  - System theme change response
  - matchMedia query verification

- `destroy()` (3 tests)
  - Event listener cleanup
  - Theme change handler disabling
  - Multiple destroy calls safety

- Integration (1 test)
  - Full theme lifecycle management

**Expected Failures:** All 22 tests should fail because `widget/src/theming/theme-manager.ts` doesn't exist

---

### 4. CSS Injector Tests
**File:** `tests/widget/theming/css-injector.test.ts`
**Tests:** 21
**Coverage:**

- `generateCSSVariables()` (9 tests)
  - CSS variables generation for all config
  - primaryColor mapping
  - backgroundColor mapping
  - textColor mapping
  - fontFamily mapping
  - fontSize px formatting
  - cornerRadius px formatting
  - Valid CSS generation
  - Custom color handling
  - Font family variations

- `injectStyles()` (10 tests)
  - Style element creation in document.head
  - Style tag element creation
  - Existing style element reuse
  - CSS variables inclusion
  - Base CSS inclusion
  - Unique ID assignment
  - Custom color injection
  - Multiple injection calls handling
  - Config change updates
  - Valid style injection

- Integration (2 tests)
  - Full generation and injection flow
  - Complete theme configuration handling

**Expected Failures:** All 21 tests should fail because `widget/src/theming/css-injector.ts` doesn't exist

---

### 5. CSS Variables Tests
**File:** `tests/widget/theming/css-variables.test.ts`
**Tests:** 26
**Coverage:**

- `createCSSVariables()` (13 tests)
  - primaryColor mapping to --cw-primary-color
  - backgroundColor mapping to --cw-bg-color
  - textColor mapping to --cw-text-color
  - fontFamily mapping to --cw-font-family
  - fontSize formatting with px unit
  - cornerRadius formatting with px unit
  - All CSS variables returned
  - Custom color handling
  - Various font families
  - Font size variations
  - Corner radius variations
  - Required properties presence
  - Plain object return

- Edge Cases (8 tests)
  - Uppercase hex colors
  - Mixed case hex colors
  - Large font sizes
  - Small font sizes
  - Large corner radius
  - Zero corner radius
  - Font families with fallbacks

- Variable Naming (5 tests)
  - CSS variable naming convention (--cw- prefix)
  - Consistent object structure
  - Short-form hex colors
  - Font family quotes preservation
  - 3-digit hex color support

**Expected Failures:** All 26 tests should fail because `widget/src/theming/css-variables.ts` doesn't exist

---

## Test Statistics

| Module | Tests | Status |
|--------|-------|--------|
| Config Manager | 32 | RED |
| State Manager | 23 | RED |
| Theme Manager | 22 | RED |
| CSS Injector | 21 | RED |
| CSS Variables | 26 | RED |
| **TOTAL** | **124** | **RED** |

---

## Test Quality Metrics

### Comprehensiveness
- **Coverage Type:** Behavior-driven (black-box)
- **Test Levels:** Unit tests with DOM/Window mocking
- **Edge Cases:** Included for all modules
- **Error Scenarios:** Comprehensive validation testing

### Structure
- **Setup/Teardown:** Proper beforeEach/afterEach in all files
- **Mocking:** Window APIs (matchMedia, localStorage, postMessage)
- **Assertion Style:** Explicit expect() statements
- **Documentation:** Each test has a failure reason comment

### Expected Behaviors Defined

#### Config Manager
```typescript
// Default config structure
const defaults = {
  branding: {
    companyName: 'Support',
    welcomeText: 'How can we help?',
    firstMessage: 'Hello! How can I assist you today?',
  },
  style: {
    theme: 'auto',
    primaryColor: '#00bfff',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    position: 'bottom-right',
    cornerRadius: 8,
    fontFamily: 'system-ui, sans-serif',
    fontSize: 14,
  },
  features: {
    fileAttachmentsEnabled: false,
    allowedExtensions: [],
    maxFileSizeKB: 5120,
  },
  connection: {
    webhookUrl: '', // REQUIRED
  },
};
```

#### State Manager
```typescript
interface WidgetState {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentStreamingMessage: string | null;
}

class StateManager {
  constructor(initialState: WidgetState);
  getState(): WidgetState;
  setState(partial: Partial<WidgetState>): void;
  subscribe(listener: (state: WidgetState) => void): () => void;
}
```

#### Theme Manager
```typescript
class ThemeManager {
  constructor(config: WidgetConfig, stateManager: StateManager);
  applyTheme(theme: 'light' | 'dark' | 'auto'): void;
  getCurrentTheme(): 'light' | 'dark';
  destroy(): void;
}
```

#### CSS Injector
```typescript
function generateCSSVariables(config: WidgetConfig): string;
function injectStyles(config: WidgetConfig): void;
```

#### CSS Variables
```typescript
function createCSSVariables(config: WidgetConfig): Record<string, string>;
```

---

## Next Steps (GREEN Phase)

### For Implementer:
1. Create `widget/src/core/config.ts` with:
   - `mergeConfig()` implementation
   - `validateConfig()` with Zod schema
   - `readConfigFromWindow()`
   - `readLicenseFlagsFromWindow()`

2. Create `widget/src/core/state.ts` with:
   - `StateManager` class (pub-sub pattern)
   - `WidgetState` type definition

3. Create `widget/src/theming/theme-manager.ts` with:
   - `ThemeManager` class
   - matchMedia listener for auto mode
   - State management integration

4. Create `widget/src/theming/css-injector.ts` with:
   - `generateCSSVariables()` function
   - `injectStyles()` with DOM manipulation
   - Style element reuse logic

5. Create `widget/src/theming/css-variables.ts` with:
   - `createCSSVariables()` utility function
   - Variable naming with --cw- prefix

### For QA/Tester:
- Verify all 124 tests pass (GREEN)
- Check for any edge cases in real usage
- Validate bundle size impact
- Test with various config combinations

---

## Test Execution Commands

```bash
# Run all widget tests
npm test tests/widget

# Run specific test file
npm test tests/widget/core/config.test.ts

# Run with coverage
npm test -- tests/widget --coverage

# Run in watch mode
npm test -- --watch tests/widget

# Run with verbose output
npm test -- --reporter=verbose tests/widget
```

---

## Notes

- All tests use Vitest with happy-dom environment
- Tests follow TDD RED→GREEN→REFACTOR pattern
- No production code should be written until tests are RED first
- All modules are currently MISSING - tests will fail on module import
- Proper cleanup in afterEach ensures test isolation
- Window/DOM mocking ensures no side effects

---

**Created:** 2025-11-11
**By:** TDD-QA-Lead Agent
**Status:** Ready for GREEN phase implementation
