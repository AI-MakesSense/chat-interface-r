# Phase 3.7: UI Components Test Summary (RED Phase)

## Overview

This document summarizes the RED phase tests for Week 2, Days 5-6: Toggle Button and Chat Container components.

**Status:** RED (All tests failing as expected - modules not implemented yet)
**Date:** 2025-11-11
**Test Files Created:** 2
**Total Test Cases:** 113

---

## Test Files

### 1. Toggle Button Tests
**File:** `tests/widget/ui/toggle-button.test.ts`
**Module Under Test:** `widget/src/ui/toggle-button.ts` (not yet created)
**Test Cases:** 49

#### Test Coverage Areas

**Rendering (7 tests)**
- Button element creation with correct class
- Position class application from config
- Z-index set to 9999
- Chat bubble icon inclusion
- Default visibility
- Fixed positioning
- Circular shape (60px x 60px)

**Positioning (6 tests)**
- Bottom-right (default) positioning
- Bottom-left positioning
- Top-right positioning
- Top-left positioning
- 20px edge offset
- Fixed position on scroll

**Styling (6 tests)**
- Primary color from config
- Corner radius from config
- Box shadow for depth
- Cursor pointer
- Light theme styles
- Dark theme styles

**Interaction (6 tests)**
- Toggle state.isOpen on click
- Toggle from open to closed
- Active class when chat is open
- Active class removal when chat is closed
- Visual state updates from state manager
- Hover effects

**State Management Integration (4 tests)**
- Subscribe to state changes on mount
- Update when state.isOpen changes
- No updates for irrelevant state changes
- Handle rapid state changes

**Lifecycle (6 tests)**
- Mount element to container
- Unmount element from container
- Clean up event listeners on destroy
- Unsubscribe from state on destroy
- Handle destroy without mount
- Handle multiple destroy calls safely

**Accessibility (6 tests)**
- aria-label for screen readers
- aria-expanded state management
- Keyboard accessible with Enter key
- Keyboard accessible with Space key
- role="button" attribute
- Visible focus indicator

**Performance (3 tests)**
- Render in less than 50ms
- State update in less than 16ms (60fps)
- No memory leaks with multiple instances

**Edge Cases (5 tests)**
- Handle missing config gracefully
- Handle missing state manager gracefully
- Handle invalid position value
- Handle very long company names
- Handle rapid mount/unmount cycles

---

### 2. Chat Container Tests
**File:** `tests/widget/ui/chat-container.test.ts`
**Module Under Test:** `widget/src/ui/chat-container.ts` (not yet created)
**Test Cases:** 64

#### Test Coverage Areas

**Rendering (8 tests)**
- Container div creation with correct class
- Fixed position
- Z-index set to 9998 (below toggle button)
- Header placeholder inclusion
- Message list placeholder inclusion
- Input area placeholder inclusion
- Hidden by default
- Proper DOM structure

**Visibility (6 tests)**
- Hidden when state.isOpen is false
- Visible when state.isOpen is true
- Add cw-open class when visible
- Remove cw-open class when hidden
- Toggle visibility on state changes
- Animate opening transition

**Positioning (8 tests)**
- Align to bottom-right by default
- Align to bottom-left when configured
- Align to top-right when configured
- Align to top-left when configured
- Leave 80px space for toggle button
- Position with bottom-left spacing
- Position with top-right spacing
- Position with top-left spacing

**Sizing (6 tests)**
- Width 400px on desktop
- Height 600px on desktop
- Full-screen on mobile width (<768px)
- Adapt to tablet width
- Respond to window resize events
- Maintain aspect ratio

**Styling (8 tests)**
- Use background color from config
- Apply corner radius from config
- Apply light theme class
- Apply dark theme class
- Use CSS variables for colors
- Have shadow for depth
- Apply font family from config
- Apply custom font URL if provided

**State Subscription (5 tests)**
- Update visibility when state.isOpen changes
- Update theme when state.currentTheme changes
- Subscribe to state on mount
- No re-render on irrelevant state changes
- Handle rapid state changes

**Lifecycle (5 tests)**
- Mount to provided container
- Unmount from container
- Clean up subscriptions on destroy
- Remove resize listener on destroy
- Handle destroy without mount
- Handle multiple destroy calls safely

**Accessibility (7 tests)**
- role="dialog" attribute
- aria-label attribute
- aria-hidden when closed
- Remove aria-hidden when open
- Trap focus when open
- Handle Escape key to close
- Proper heading hierarchy

**Performance (4 tests)**
- Render in less than 50ms
- Update visibility in less than 16ms (60fps)
- No reflow on state changes (use transform/opacity)
- Debounce resize events

**Edge Cases (6 tests)**
- Handle missing config gracefully
- Handle missing state manager gracefully
- Handle invalid position value
- Handle very small viewport
- Handle rapid open/close cycles
- Handle config updates

---

## Required Module Interfaces

### ToggleButton Class

```typescript
export class ToggleButton {
  constructor(config: WidgetConfig, stateManager: StateManager);
  render(): HTMLElement;
  mount(container: HTMLElement): void;
  unmount(): void;
  destroy(): void;
}
```

**Expected DOM Structure:**
```html
<button class="cw-toggle-button cw-position-bottom-right" aria-label="Toggle chat" aria-expanded="false">
  <svg><!-- Chat icon --></svg>
</button>
```

**CSS Classes:**
- `.cw-toggle-button` - Base button class
- `.cw-position-{position}` - Positioning class
- `.cw-active` - Active state when chat is open
- `.cw-theme-{light|dark}` - Theme class

**Key Behaviors:**
- Fixed positioning at configured corner (20px offset)
- 60px x 60px circular button
- Click toggles state.isOpen
- Subscribes to state changes
- Keyboard accessible (Enter, Space)
- ARIA attributes for accessibility

---

### ChatContainer Class

```typescript
export class ChatContainer {
  constructor(config: WidgetConfig, stateManager: StateManager);
  render(): HTMLElement;
  mount(container: HTMLElement): void;
  unmount(): void;
  destroy(): void;
}
```

**Expected DOM Structure:**
```html
<div class="cw-chat-container cw-position-bottom-right cw-theme-light" role="dialog" aria-label="Chat widget" aria-hidden="true">
  <div class="cw-header"><!-- Header component --></div>
  <div class="cw-messages"><!-- Message list component --></div>
  <div class="cw-input"><!-- Input area component --></div>
</div>
```

**CSS Classes:**
- `.cw-chat-container` - Base container class
- `.cw-position-{position}` - Positioning class
- `.cw-open` - Visible state
- `.cw-theme-{light|dark}` - Theme class
- `.cw-mobile` - Mobile responsive class

**Key Behaviors:**
- Fixed positioning aligned to toggle button (80px offset)
- 400px x 600px on desktop, full-screen on mobile
- Hidden by default (display: none)
- Shows when state.isOpen = true
- Subscribes to state changes
- Responsive to window resize
- Keyboard accessible (Escape to close)
- ARIA attributes for accessibility

---

## Test Execution

### Current Status: RED Phase

Both test files fail to compile because the modules don't exist yet:

```bash
npm test -- tests/widget/ui/

# Output:
# FAIL  tests/widget/ui/toggle-button.test.ts
# Error: Failed to resolve import "@/widget/src/ui/toggle-button"
#
# FAIL  tests/widget/ui/chat-container.test.ts
# Error: Failed to resolve import "@/widget/src/ui/chat-container"
#
# Test Files  2 failed (2)
# Tests       no tests
```

This is **expected behavior** for the RED phase. Tests will pass once the Implementer creates the modules.

---

## Next Steps (GREEN Phase)

1. **Create UI Directory Structure**
   ```bash
   mkdir -p widget/src/ui
   ```

2. **Implement ToggleButton Module**
   - File: `widget/src/ui/toggle-button.ts`
   - Implement minimal logic to pass tests
   - Focus on core functionality first (rendering, positioning, click handler)
   - Add styling and accessibility features
   - Ensure all 49 tests pass

3. **Implement ChatContainer Module**
   - File: `widget/src/ui/chat-container.ts`
   - Implement minimal logic to pass tests
   - Focus on visibility management and positioning
   - Add responsive sizing and theme support
   - Ensure all 64 tests pass

4. **Run Tests Incrementally**
   ```bash
   # Test toggle button
   npm test -- tests/widget/ui/toggle-button.test.ts

   # Test chat container
   npm test -- tests/widget/ui/chat-container.test.ts

   # Test all UI components
   npm test -- tests/widget/ui/
   ```

5. **Verify Integration**
   - Both components should work together
   - Toggle button should control chat container visibility
   - State manager should coordinate changes

---

## Success Criteria

- [ ] All 49 ToggleButton tests pass
- [ ] All 64 ChatContainer tests pass
- [ ] No TypeScript compilation errors
- [ ] No console warnings or errors
- [ ] Components render correctly in DOM
- [ ] Accessibility requirements met
- [ ] Performance targets achieved (<50ms render, <16ms updates)

---

## Design Constraints

1. **Bundle Size:** Must contribute to <50KB gzipped widget target
2. **Performance:** Render <50ms, updates <16ms (60fps)
3. **Accessibility:** WCAG 2.1 AA compliant
4. **Responsive:** Desktop (400x600), Mobile (full-screen)
5. **Browser Support:** ES2015+ (no framework dependencies)

---

## Test Quality Metrics

- **Coverage:** Comprehensive (rendering, interaction, lifecycle, accessibility, performance, edge cases)
- **Isolation:** Each test is independent with proper setup/teardown
- **Clarity:** Test names describe expected behavior
- **Assertions:** Clear, specific assertions for each behavior
- **Mocking:** Minimal mocking (only browser APIs like matchMedia)

---

## Notes

- Tests use happy-dom for DOM environment
- State manager is already implemented and tested (124 tests passing)
- Config types are defined in `widget/src/types.ts`
- Tests follow existing patterns from Phase 3 Week 1
- All tests have "FAILS:" comments explaining why they fail
- Edge cases and error handling are tested
- Performance and accessibility are first-class concerns

---

## Related Documentation

- **PLAN.md:** Phase 3.7 implementation details
- **TODO.md:** Task tracking for Phase 3 Widget Bundle
- **Architecture.md:** Widget architecture and component design
- **TESTING_QUICK_START.md:** Running tests guide

---

**Next Action:** Hand off to Implementer agent to create the modules and achieve GREEN phase.
