# Implementer Handoff: UI Components (Phase 3.7)

## Status: RED Phase Complete - Ready for GREEN

**Date:** 2025-11-11
**From:** TDD-QA-Lead Agent
**To:** Implementer Agent

---

## Summary

113 RED tests have been written for the Toggle Button and Chat Container UI components. All tests are currently failing because the modules don't exist yet. Your task is to implement these modules to make the tests pass (GREEN phase).

---

## Test Files Created

1. **C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\ui\toggle-button.test.ts**
   - 49 test cases
   - Tests for ToggleButton class

2. **C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\ui\chat-container.test.ts**
   - 64 test cases
   - Tests for ChatContainer class

---

## Required Implementations

### 1. Toggle Button Module

**File to Create:** `C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\ui\toggle-button.ts`

**Required Class:**
```typescript
export class ToggleButton {
  constructor(config: WidgetConfig, stateManager: StateManager);
  render(): HTMLElement;
  mount(container: HTMLElement): void;
  unmount(): void;
  destroy(): void;
}
```

**Key Requirements:**
- Create floating action button (60px x 60px circular)
- Position at configured corner (bottom-right, bottom-left, top-right, top-left)
- 20px offset from edges
- Z-index: 9999
- Toggle state.isOpen on click
- Subscribe to state changes
- Add/remove 'cw-active' class based on state
- Keyboard accessible (Enter, Space keys)
- ARIA attributes (aria-label, aria-expanded)
- Clean up listeners on destroy

**Expected Tests to Pass:** 49/49

---

### 2. Chat Container Module

**File to Create:** `C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\ui\chat-container.ts`

**Required Class:**
```typescript
export class ChatContainer {
  constructor(config: WidgetConfig, stateManager: StateManager);
  render(): HTMLElement;
  mount(container: HTMLElement): void;
  unmount(): void;
  destroy(): void;
}
```

**Key Requirements:**
- Create main chat window with header, messages, input placeholders
- Position aligned to toggle button (80px offset for button clearance)
- Size: 400px x 600px on desktop, full-screen on mobile (<768px)
- Z-index: 9998 (below toggle button)
- Hidden by default (display: none)
- Show/hide based on state.isOpen
- Add/remove 'cw-open' class for visibility
- Subscribe to state changes (isOpen, currentTheme)
- Responsive to window resize
- Keyboard accessible (Escape to close)
- ARIA attributes (role="dialog", aria-label, aria-hidden)
- Clean up listeners on destroy

**Expected Tests to Pass:** 64/64

---

## Implementation Strategy

### Step 1: Create UI Directory
```bash
cd "C:\Projects\Chat Interfacer\n8n-widget-designer\widget"
mkdir -p src/ui
```

### Step 2: Implement ToggleButton (Minimal GREEN)

Start with the simplest tests first:

1. **Constructor and Render** (7 tests)
   - Create button element
   - Add base class
   - Set basic styles

2. **Positioning** (6 tests)
   - Apply position classes
   - Set fixed positioning
   - Apply edge offsets

3. **Interaction** (6 tests)
   - Add click handler
   - Toggle state.isOpen
   - Manage active class

4. **State Management** (4 tests)
   - Subscribe to state
   - Update UI on state changes

5. **Lifecycle** (6 tests)
   - Implement mount/unmount
   - Implement destroy

6. **Accessibility** (6 tests)
   - Add ARIA attributes
   - Add keyboard handlers

7. **Performance & Edge Cases** (14 tests)
   - Optimize render
   - Handle edge cases

**Run Tests After Each Step:**
```bash
npm test -- tests/widget/ui/toggle-button.test.ts --run
```

### Step 3: Implement ChatContainer (Minimal GREEN)

Follow similar incremental approach:

1. **Constructor and Render** (8 tests)
2. **Visibility** (6 tests)
3. **Positioning** (8 tests)
4. **Sizing** (6 tests)
5. **Styling** (8 tests)
6. **State Subscription** (5 tests)
7. **Lifecycle** (5 tests)
8. **Accessibility** (7 tests)
9. **Performance & Edge Cases** (11 tests)

**Run Tests After Each Step:**
```bash
npm test -- tests/widget/ui/chat-container.test.ts --run
```

### Step 4: Integration Verification

Once both modules pass their tests, verify they work together:

```bash
npm test -- tests/widget/ui/ --run
```

Expected output:
```
Test Files  2 passed (2)
Tests       113 passed (113)
```

---

## Dependencies Available

These modules are already implemented and tested:

- **StateManager:** `widget/src/core/state.ts` (124 tests passing)
- **WidgetConfig types:** `widget/src/types.ts`
- **ThemeManager:** `widget/src/theming/theme-manager.ts`
- **CSS Injector:** `widget/src/theming/css-injector.ts`

You can import and use these in your implementations.

---

## Design Patterns to Follow

### 1. Component Lifecycle
```typescript
class Component {
  private element: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(config: WidgetConfig, stateManager: StateManager) {
    // Store config and state manager
  }

  render(): HTMLElement {
    // Create and return element (idempotent)
  }

  mount(container: HTMLElement): void {
    // Append element and subscribe to state
  }

  unmount(): void {
    // Remove element
  }

  destroy(): void {
    // Clean up listeners and subscriptions
  }
}
```

### 2. State Subscription
```typescript
this.unsubscribe = this.stateManager.subscribe((state) => {
  // Update UI based on state changes
  if (state.isOpen !== this.previousOpen) {
    this.updateVisibility(state.isOpen);
  }
});
```

### 3. DOM Creation
```typescript
render(): HTMLElement {
  if (this.element) {
    return this.element;
  }

  this.element = document.createElement('button');
  this.element.className = 'cw-toggle-button';
  this.element.setAttribute('aria-label', 'Toggle chat');

  // Add event listeners
  this.element.addEventListener('click', this.handleClick);

  return this.element;
}
```

### 4. Cleanup
```typescript
destroy(): void {
  if (this.unsubscribe) {
    this.unsubscribe();
    this.unsubscribe = null;
  }

  if (this.element) {
    this.element.removeEventListener('click', this.handleClick);
  }

  this.unmount();
}
```

---

## Styling Approach

### Option 1: Inline Styles (Simplest for GREEN)
```typescript
element.style.position = 'fixed';
element.style.bottom = '20px';
element.style.right = '20px';
element.style.width = '60px';
element.style.height = '60px';
element.style.zIndex = '9999';
```

### Option 2: CSS Classes (Better for REFACTOR)
```typescript
element.className = 'cw-toggle-button cw-position-bottom-right';
// Then inject CSS using CSS Injector
```

**Recommendation:** Start with inline styles for minimal GREEN, then refactor to CSS classes.

---

## Test Execution Commands

```bash
# Run all UI tests
npm test -- tests/widget/ui/

# Run specific test file
npm test -- tests/widget/ui/toggle-button.test.ts --run

# Run with watch mode (re-run on changes)
npm test -- tests/widget/ui/toggle-button.test.ts

# Run with coverage
npm test -- tests/widget/ui/ --coverage

# Run single test by name
npm test -- tests/widget/ui/toggle-button.test.ts -t "should create button element"
```

---

## Performance Targets

- **Render:** <50ms per component
- **State Updates:** <16ms (for 60fps)
- **Bundle Size:** Contribute to <50KB gzipped total

Monitor with:
```typescript
const startTime = performance.now();
component.render();
const duration = performance.now() - startTime;
console.log(`Render time: ${duration}ms`);
```

---

## Common Pitfalls to Avoid

1. **Don't forget to bind event handlers:**
   ```typescript
   this.handleClick = this.handleClick.bind(this);
   ```

2. **Don't forget to remove event listeners:**
   ```typescript
   element.removeEventListener('click', this.handleClick);
   ```

3. **Don't forget to check for null:**
   ```typescript
   if (!this.element) return;
   ```

4. **Don't forget to unsubscribe from state:**
   ```typescript
   if (this.unsubscribe) this.unsubscribe();
   ```

5. **Don't forget responsive breakpoints:**
   ```typescript
   const isMobile = window.innerWidth < 768;
   ```

---

## Verification Checklist

Before marking GREEN complete:

- [ ] All 49 ToggleButton tests pass
- [ ] All 64 ChatContainer tests pass
- [ ] No TypeScript compilation errors
- [ ] No ESLint warnings
- [ ] Components render in DOM correctly
- [ ] State synchronization works
- [ ] Accessibility attributes present
- [ ] Performance targets met
- [ ] Memory leaks prevented (cleanup works)

---

## Questions to Consider

If tests are unclear or seem incorrect, ask:

1. Is the expected behavior realistic?
2. Are there conflicts between requirements?
3. Are edge cases handled appropriately?
4. Are performance targets achievable?

Feel free to propose test modifications if needed (with justification).

---

## Next Steps After GREEN

Once all 113 tests pass:

1. **Commit the implementations:**
   ```bash
   git add widget/src/ui/
   git commit -m "feat(widget): implement ToggleButton and ChatContainer components

   - Create floating action button with positioning
   - Create chat container with visibility management
   - Add accessibility support (ARIA, keyboard)
   - Implement responsive sizing
   - Pass all 113 tests"
   ```

2. **Hand off to Refactorer** for code quality improvements:
   - Extract common styles to CSS
   - Optimize bundle size
   - Improve maintainability
   - Add inline documentation

3. **Update TODO.md** to mark tasks complete

---

## Reference Documentation

- **Test Summary:** `docs/testing/PHASE_3_7_UI_COMPONENTS_TEST_SUMMARY.md`
- **Architecture:** `docs/Architecture.md` (Widget component patterns)
- **PLAN.md:** Phase 3.7 implementation guide
- **Existing Examples:** `widget/src/core/state.ts`, `widget/src/theming/theme-manager.ts`

---

**Good luck! Focus on minimal GREEN implementations first, then refactor for quality.**
