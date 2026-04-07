# Widget Core Infrastructure - Implementation Handoff

**Phase:** 3.7 Widget Bundle - Week 1: Core Infrastructure
**From:** TDD-QA-Lead Agent (RED Phase Complete)
**To:** Implementer Agent (GREEN Phase)
**Status:** Ready for Implementation
**Date:** 2025-11-11

---

## Summary

124 comprehensive RED tests have been written for the 5 core modules of the widget infrastructure. All tests are currently FAILING because the modules don't exist yet. Your task is to implement the minimal code required to make these tests pass.

**Total Tests:** 124 (all currently failing)
**Test Files:** 5
**Modules to Create:** 5

---

## Failing Tests Overview

### Tests by Module

1. **Config Manager** (`tests/widget/core/config.test.ts`) - 32 tests
   - Config merging with defaults
   - Configuration validation
   - Reading from window.ChatWidgetConfig
   - License flags from window.__LICENSE_FLAGS__

2. **State Manager** (`tests/widget/core/state.test.ts`) - 23 tests
   - State initialization
   - setState() updates
   - getState() retrieval
   - subscribe/unsubscribe pub-sub pattern

3. **Theme Manager** (`tests/widget/theming/theme-manager.test.ts`) - 22 tests
   - Light/dark/auto theme modes
   - System preference detection (matchMedia)
   - Theme application and state updates
   - Cleanup/destroy lifecycle

4. **CSS Injector** (`tests/widget/theming/css-injector.test.ts`) - 21 tests
   - CSS variable generation
   - Style element injection into document
   - CSS variable formatting
   - Style reuse and updates

5. **CSS Variables** (`tests/widget/theming/css-variables.test.ts`) - 26 tests
   - CSS variable object creation
   - Variable naming convention (--cw- prefix)
   - Color/size/font formatting
   - Edge cases for various input formats

---

## Module Specifications

### Module 1: Config Manager
**Location:** `widget/src/core/config.ts`

**Exports Required:**

```typescript
import { WidgetConfig, LicenseConfig } from '@/widget/src/types';

/**
 * Merges user config with sensible defaults
 * Returns complete config with all fields populated
 */
export function mergeConfig(userConfig: Partial<WidgetConfig>): WidgetConfig;

/**
 * Validates configuration against business rules
 * Throws error if validation fails
 */
export function validateConfig(config: WidgetConfig): void;

/**
 * Reads configuration from window.ChatWidgetConfig
 * Returns empty object if not found
 */
export function readConfigFromWindow(): Partial<WidgetConfig>;

/**
 * Reads license flags from window.__LICENSE_FLAGS__
 * Returns object with branding flag (default: true)
 */
export function readLicenseFlagsFromWindow(): LicenseConfig;
```

**Default Config:**
```typescript
{
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
    webhookUrl: '', // REQUIRED - must be HTTPS
  },
}
```

**Validation Rules:**
- `connection.webhookUrl` is required (cannot be empty)
- `connection.webhookUrl` must start with `https://` (security)
- `style.primaryColor` must be valid hex color (#RRGGBB or #RGB)
- `style.backgroundColor` must be valid hex color
- `style.textColor` must be valid hex color
- `style.theme` must be one of: 'light', 'dark', 'auto'
- `style.position` must be one of: 'bottom-right', 'bottom-left'

**Test Expectations:**
- Merging handles partial configs (missing some fields)
- Defaults are applied for missing fields
- User values override defaults
- Nested objects merge correctly
- Validation throws descriptive errors

---

### Module 2: State Manager
**Location:** `widget/src/core/state.ts`

**Exports Required:**

```typescript
import { Message } from '@/widget/src/types';

/**
 * Current widget state shape
 */
export interface WidgetState {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentStreamingMessage: string | null;
}

/**
 * Simple pub-sub state manager
 * Notifies subscribers on state changes
 */
export class StateManager {
  constructor(initialState: WidgetState);

  /**
   * Get current state
   */
  getState(): WidgetState;

  /**
   * Update state with partial changes
   * Notifies all subscribers
   */
  setState(partial: Partial<WidgetState>): void;

  /**
   * Subscribe to state changes
   * @returns unsubscribe function
   */
  subscribe(listener: (state: WidgetState) => void): () => void;
}
```

**Behavior Requirements:**
- Maintains internal state
- Performs shallow merge for setState()
- Calls all listeners when setState() is called
- Returns new unsubscribe function that removes listener
- getState() returns current complete state
- Multiple listeners can be subscribed independently
- Unsubscribed listeners are not called

**Test Expectations:**
- Listeners are called immediately when state changes
- Unsubscribe function prevents future notifications
- Multiple subscribers work independently
- State updates are merged, not replaced
- Complete state is passed to listeners

---

### Module 3: Theme Manager
**Location:** `widget/src/theming/theme-manager.ts`

**Exports Required:**

```typescript
import { WidgetConfig } from '@/widget/src/types';
import { StateManager } from '@/widget/src/core/state';

/**
 * Manages theme switching and system preference detection
 */
export class ThemeManager {
  constructor(config: WidgetConfig, stateManager: StateManager);

  /**
   * Apply a theme ('light', 'dark', or 'auto')
   * For 'auto', detects system preference
   */
  applyTheme(theme: 'light' | 'dark' | 'auto'): void;

  /**
   * Get current resolved theme
   * Returns 'light' or 'dark' (never 'auto')
   */
  getCurrentTheme(): 'light' | 'dark';

  /**
   * Cleanup: remove event listeners, clear state
   */
  destroy(): void;
}
```

**Behavior Requirements:**
- Accepts 'light', 'dark', or 'auto' theme modes
- For 'auto' mode, uses `window.matchMedia('(prefers-color-scheme: dark)')`
- Listens to system theme changes with matchMedia.addEventListener
- Always returns 'light' or 'dark' from getCurrentTheme()
- Integrates with StateManager for state updates
- destroy() removes all event listeners
- destroy() can be called multiple times safely

**Implementation Notes:**
- System preference detection uses `matchMedia('(prefers-color-scheme: dark)').matches`
- Listen for 'change' events on the media query listener
- Store the media query listener reference for cleanup
- Update state when theme changes

**Test Expectations:**
- Theme application updates internal state
- System preference is detected correctly
- Theme changes trigger listener notifications
- Cleanup properly removes event listeners
- Auto mode resolves to actual theme (light or dark)

---

### Module 4: CSS Injector
**Location:** `widget/src/theming/css-injector.ts`

**Exports Required:**

```typescript
import { WidgetConfig } from '@/widget/src/types';

/**
 * Generate CSS custom properties string from config
 * Returns CSS string with :root { ... }
 */
export function generateCSSVariables(config: WidgetConfig): string;

/**
 * Inject styles into document head
 * Creates or reuses <style data-widget-id="n8n-chat-widget-styles">
 */
export function injectStyles(config: WidgetConfig): void;
```

**CSS Variables to Generate:**
```css
:root {
  --cw-primary-color: <from config.style.primaryColor>;
  --cw-bg-color: <from config.style.backgroundColor>;
  --cw-text-color: <from config.style.textColor>;
  --cw-font-family: <from config.style.fontFamily>;
  --cw-font-size: <from config.style.fontSize>px;
  --cw-corner-radius: <from config.style.cornerRadius>px;
}
```

**injectStyles() Behavior:**
- Creates `<style data-widget-id="n8n-chat-widget-styles">` in document.head
- If style element already exists, updates its content
- Style element contains both:
  - Generated CSS variables (from generateCSSVariables)
  - Base CSS for widget components
- Multiple calls should reuse the same style element (not create duplicates)

**Base CSS Content:**
Should include base styles for:
- Widget container positioning
- Chat bubble styling
- Chat window layout
- Messages container
- Input field
- Message bubbles (user vs assistant)
- Button styling
- Any other widget UI components

**Test Expectations:**
- generateCSSVariables returns valid CSS with :root selector
- Font sizes and radius include 'px' units
- Colors remain as provided (hex values)
- injectStyles creates style element in document.head
- Subsequent calls update existing style element
- CSS variables are properly formatted
- Base CSS is included for widget styling

---

### Module 5: CSS Variables
**Location:** `widget/src/theming/css-variables.ts`

**Exports Required:**

```typescript
import { WidgetConfig } from '@/widget/src/types';

/**
 * Create CSS variable object from config
 * Returns Record<string, string> with --cw-* keys
 */
export function createCSSVariables(config: WidgetConfig): Record<string, string>;
```

**Variable Mapping:**
```typescript
{
  '--cw-primary-color': config.style.primaryColor,      // e.g., '#00bfff'
  '--cw-bg-color': config.style.backgroundColor,        // e.g., '#ffffff'
  '--cw-text-color': config.style.textColor,            // e.g., '#000000'
  '--cw-font-family': config.style.fontFamily,          // e.g., 'system-ui, sans-serif'
  '--cw-font-size': `${config.style.fontSize}px`,       // e.g., '14px'
  '--cw-corner-radius': `${config.style.cornerRadius}px`, // e.g., '8px'
}
```

**Behavior:**
- Returns plain JavaScript object with string key-value pairs
- All numeric values (fontSize, cornerRadius) must include 'px' unit
- All hex colors must be preserved as-is (including case)
- Font family strings with quotes must be preserved exactly
- Object keys must use '--cw-' prefix for widget namespacing

**Test Expectations:**
- Returns object with all required CSS variables
- Font sizes and radius formatted with px units
- Colors preserved exactly as provided
- Handles both 3-digit (#RGB) and 6-digit (#RRGGBB) hex colors
- Works with various font family formats
- Consistent object structure across calls

---

## Test Files Location

```
tests/
├── widget/
│   ├── core/
│   │   ├── config.test.ts          (32 tests)
│   │   └── state.test.ts           (23 tests)
│   └── theming/
│       ├── theme-manager.test.ts   (22 tests)
│       ├── css-injector.test.ts    (21 tests)
│       └── css-variables.test.ts   (26 tests)
└── WIDGET_CORE_TEST_SUMMARY.md
```

---

## Implementation Strategy

### Order of Implementation (Recommended)

1. **CSS Variables** (`css-variables.ts`)
   - Simplest module, no dependencies
   - Pure function, no side effects
   - Builds confidence for other modules

2. **CSS Injector** (`css-injector.ts`)
   - Depends on CSS Variables
   - DOM manipulation required
   - Still relatively simple

3. **Config Manager** (`config.ts`)
   - No external dependencies
   - Validation logic needed
   - Can use Zod for schema validation

4. **State Manager** (`state.ts`)
   - No external dependencies
   - Pub-sub pattern implementation
   - Core for widget functionality

5. **Theme Manager** (`theme-manager.ts`)
   - Depends on StateManager
   - Browser API usage (matchMedia)
   - Lifecycle management needed

### Minimal Code Approach

For each module:
1. Write the absolute minimum code to pass the tests
2. Do NOT add features beyond what tests require
3. Do NOT generalize or optimize prematurely
4. Focus on test-driven implementation

Example for StateManager:
```typescript
export class StateManager {
  private state: WidgetState;
  private listeners: Set<(state: WidgetState) => void> = new Set();

  constructor(initialState: WidgetState) {
    this.state = initialState;
  }

  getState(): WidgetState {
    return this.state;
  }

  setState(partial: Partial<WidgetState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener: (state: WidgetState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
```

---

## Running Tests

```bash
# Run all widget tests
npm test tests/widget

# Run specific module tests
npm test tests/widget/core/config.test.ts
npm test tests/widget/core/state.test.ts
npm test tests/widget/theming/theme-manager.test.ts
npm test tests/widget/theming/css-injector.test.ts
npm test tests/widget/theming/css-variables.test.ts

# Run with coverage
npm test -- tests/widget --coverage

# Run in watch mode (for development)
npm test -- --watch tests/widget

# Run specific test by name
npm test -- tests/widget/core/config.test.ts -t "should merge"
```

---

## Passing Criteria

- All 124 tests must pass
- No test skipping or disabling
- No hardcoding of return values to pass tests
- Clean code that follows the existing project conventions
- TypeScript strict mode compliance
- No console errors or warnings

---

## Important Notes

1. **No Hardcoding:** Tests check behavior, not specific implementations. Hard-coding values just to pass tests will cause real-world failures.

2. **Test Comments:** Each test has a comment explaining why it's expected to fail. Read these to understand the requirement.

3. **Edge Cases:** Tests include edge cases like null configs, missing fields, invalid values. Handle these properly.

4. **DOM Isolation:** Tests mock the DOM. Ensure your code works with the happy-dom environment used in tests.

5. **Types:** Use the existing WidgetConfig and Message types from `widget/src/types.ts`. Don't create duplicate types.

6. **Dependencies:** Keep dependencies minimal. These are core modules that other modules will depend on. Avoid circular dependencies.

---

## Questions for Clarification

Before implementing, confirm:

1. Can Config Manager use Zod for validation, or prefer plain TypeScript?
2. Should CSS Injector generate complete widget CSS, or just variables?
3. Should StateManager be observable/reactive, or just pub-sub?
4. Should Theme Manager initialize theme on construction, or require explicit applyTheme()?
5. Should CSS Variables module be exported as utility function, or class?

---

## Next Phase: REFACTOR

After all tests pass (GREEN phase), we'll review:
- Code quality and clarity
- DRY principle adherence
- Performance optimization
- Consolidation of similar logic
- Documentation completeness

---

**Status:** Ready for GREEN phase
**Test Status:** 124 FAILING (as expected)
**Estimated Implementation Time:** 2-3 hours for experienced developer

Good luck with the implementation!
