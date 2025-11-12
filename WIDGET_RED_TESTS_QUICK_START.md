# Widget Phase 3.7 - RED Tests Quick Start Guide

**TL;DR:** 124 failing tests are ready. Implement 5 modules to make them pass.

---

## The 5 Test Files (All RED)

| Test File | Tests | What to Implement | Key Functions |
|-----------|-------|-------------------|---------------|
| `tests/widget/core/config.test.ts` | 32 | `widget/src/core/config.ts` | `mergeConfig()`, `validateConfig()`, `readConfigFromWindow()`, `readLicenseFlagsFromWindow()` |
| `tests/widget/core/state.test.ts` | 23 | `widget/src/core/state.ts` | `StateManager` class with `getState()`, `setState()`, `subscribe()` |
| `tests/widget/theming/theme-manager.test.ts` | 22 | `widget/src/theming/theme-manager.ts` | `ThemeManager` class with `applyTheme()`, `getCurrentTheme()`, `destroy()` |
| `tests/widget/theming/css-injector.test.ts` | 21 | `widget/src/theming/css-injector.ts` | `generateCSSVariables()`, `injectStyles()` |
| `tests/widget/theming/css-variables.test.ts` | 26 | `widget/src/theming/css-variables.ts` | `createCSSVariables()` |

**Total: 124 tests, 5 modules**

---

## Quick Facts

- **Status:** All tests FAILING (correct for RED phase)
- **Format:** Vitest with happy-dom
- **Environment:** Window/DOM mocked, no network calls
- **Quality:** Behavioral tests, no implementation details
- **Coverage:** Edge cases, error scenarios, integration flows

---

## Run Tests

```bash
# All widget tests
npm test tests/widget

# Specific module
npm test tests/widget/core/config.test.ts

# Watch mode
npm test -- --watch tests/widget

# Specific test
npm test -- tests/widget/core/config.test.ts -t "should merge"
```

---

## Implementation Order (Recommended)

1. **css-variables.ts** (26 tests)
   - Simplest: pure function
   - Maps config to CSS object
   - No dependencies

2. **css-injector.ts** (21 tests)
   - DOM manipulation
   - Depends on: css-variables
   - Injects style element

3. **config.ts** (32 tests)
   - Config merging and validation
   - No external dependencies
   - Use Zod for validation

4. **state.ts** (23 tests)
   - Pub-sub pattern
   - No dependencies
   - Foundation for other modules

5. **theme-manager.ts** (22 tests)
   - System preference detection
   - Depends on: state.ts
   - Most complex: matchMedia listening

---

## Key Requirements

### Config Manager
```typescript
mergeConfig(config) // Returns complete config with defaults
validateConfig(config) // Throws if invalid
readConfigFromWindow() // Reads window.ChatWidgetConfig
readLicenseFlagsFromWindow() // Reads window.__LICENSE_FLAGS__
```

**Validation Rules:**
- `webhookUrl` required + must be HTTPS
- Colors must be valid hex
- Theme: 'light', 'dark', or 'auto'
- Position: 'bottom-right' or 'bottom-left'

### State Manager
```typescript
new StateManager(initialState)
getState() // Returns current state
setState(partial) // Shallow merge, notify listeners
subscribe(listener) // Returns unsubscribe function
```

**Important:** Shallow merge on setState, full state to listeners.

### Theme Manager
```typescript
new ThemeManager(config, stateManager)
applyTheme('light' | 'dark' | 'auto') // Apply theme
getCurrentTheme() // Returns 'light' or 'dark'
destroy() // Cleanup event listeners
```

**System Detection:**
- Use `matchMedia('(prefers-color-scheme: dark)')`
- Listen for 'change' events
- Call stateManager.setState on changes

### CSS Injector
```typescript
generateCSSVariables(config) // Returns CSS string with :root {}
injectStyles(config) // Creates/reuses <style> in document.head
```

**Variables Generated:**
- --cw-primary-color
- --cw-bg-color
- --cw-text-color
- --cw-font-family
- --cw-font-size (with px)
- --cw-corner-radius (with px)

### CSS Variables
```typescript
createCSSVariables(config) // Returns Record<string, string>
```

**Mapping:**
- primaryColor → --cw-primary-color
- backgroundColor → --cw-bg-color
- textColor → --cw-text-color
- fontFamily → --cw-font-family
- fontSize → --cw-font-size (add px)
- cornerRadius → --cw-corner-radius (add px)

---

## Default Config (for reference)

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
    webhookUrl: '', // REQUIRED
  },
}
```

---

## Documentation

- **Detailed Specs:** `tests/WIDGET_CORE_IMPLEMENTATION_HANDOFF.md`
- **Test Summary:** `tests/WIDGET_CORE_TEST_SUMMARY.md`
- **This Overview:** `WIDGET_PHASE_3_7_RED_TESTS.md`

---

## Passing Criteria

- All 124 tests pass
- No skipped tests
- No hardcoding (tests check behavior)
- Clean, readable code
- TypeScript strict mode
- Proper error handling

---

## Common Pitfalls to Avoid

1. **Don't hardcode values** - Make the code actually work
2. **Don't skip edge cases** - Tests cover null, undefined, empty
3. **Don't over-engineer** - Minimal code that passes tests
4. **Don't forget cleanup** - Event listeners must be removed
5. **Don't ignore validation** - webhookUrl HTTPS is required

---

## Testing Tips

- Read test names - they describe the behavior
- Read test comments - they explain why it fails
- Run single tests to debug: `npm test -- -t "test name"`
- Check the test file imports to understand dependencies
- Use the handoff document for full specifications

---

## Done! What's Next?

1. Read the handoff document
2. Create the 5 modules
3. Run tests frequently: `npm test tests/widget`
4. Watch all 124 tests turn GREEN
5. Hand off to REFACTOR phase

---

**Status:** RED Phase Complete - Ready for Implementation
**Estimated Time:** 2-3 hours to implement all 5 modules
**Success Metric:** 124/124 tests passing
