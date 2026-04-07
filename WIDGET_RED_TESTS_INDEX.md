# Widget Phase 3.7 RED Tests - Complete Index

**Phase:** 3.7 Widget Bundle - Week 1: Core Infrastructure
**Status:** RED Phase Complete
**Total Tests:** 124 (all failing as expected)
**Date:** 2025-11-11

---

## Quick Navigation

### For First-Time Readers (5 minutes)
Start here: **WIDGET_RED_TESTS_QUICK_START.md**
- Overview of all 5 modules
- Key requirements at a glance
- Common pitfalls to avoid
- Quick reference table

### For Detailed Implementation (30 minutes)
Read: **tests/WIDGET_CORE_IMPLEMENTATION_HANDOFF.md**
- Complete specifications for each module
- Default configuration structure
- Validation rules
- Implementation strategy and order
- Code examples and patterns

### For Test Details (20 minutes)
Read: **tests/WIDGET_CORE_TEST_SUMMARY.md**
- Comprehensive breakdown of each test
- Expected behaviors
- Coverage analysis
- Test execution commands

### For Overview (10 minutes)
Read: **WIDGET_PHASE_3_7_RED_TESTS.md**
- Executive summary
- Test statistics
- Next steps for GREEN phase
- File locations

### For Completion Status
Read: **RED_TESTS_COMPLETION_REPORT.md**
- What was completed
- Deliverables list
- Handoff checklist
- Success criteria

---

## Test File Locations

### Core Module Tests
```
tests/widget/core/
├── config.test.ts (32 tests)
│   Tests: mergeConfig, validateConfig, readConfigFromWindow, readLicenseFlagsFromWindow
│   Location: C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\core\config.test.ts
│
└── state.test.ts (23 tests)
    Tests: StateManager class, getState, setState, subscribe/unsubscribe
    Location: C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\core\state.test.ts
```

### Theming Module Tests
```
tests/widget/theming/
├── theme-manager.test.ts (22 tests)
│   Tests: ThemeManager, applyTheme, getCurrentTheme, destroy
│   Location: C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\theming\theme-manager.test.ts
│
├── css-injector.test.ts (21 tests)
│   Tests: generateCSSVariables, injectStyles
│   Location: C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\theming\css-injector.test.ts
│
└── css-variables.test.ts (26 tests)
    Tests: createCSSVariables
    Location: C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\theming\css-variables.test.ts
```

---

## Documentation Files

### Main Documents

1. **WIDGET_RED_TESTS_QUICK_START.md** (This Directory)
   - Start here for quick overview
   - TL;DR of each module
   - Key requirements
   - File size: ~4 KB
   - Read time: 5-10 minutes

2. **WIDGET_PHASE_3_7_RED_TESTS.md** (This Directory)
   - Executive summary
   - Test statistics
   - Design decisions tested
   - File size: ~12 KB
   - Read time: 10-15 minutes

3. **RED_TESTS_COMPLETION_REPORT.md** (This Directory)
   - Completion status
   - Deliverables checklist
   - Handoff criteria
   - File size: ~8 KB
   - Read time: 10 minutes

### Detailed Guides

4. **tests/WIDGET_CORE_IMPLEMENTATION_HANDOFF.md**
   - Complete specifications
   - Function/class signatures
   - Validation rules
   - Implementation strategy
   - File size: ~20 KB
   - Read time: 30-40 minutes

5. **tests/WIDGET_CORE_TEST_SUMMARY.md**
   - Test breakdown by module
   - Expected behaviors
   - Coverage details
   - Test execution commands
   - File size: ~15 KB
   - Read time: 20-30 minutes

---

## What Tests Are Testing

### Configuration Management (32 tests)
File: `tests/widget/core/config.test.ts`

Tests for:
- Merging user config with defaults
- Validating configuration values
- Reading from window.ChatWidgetConfig
- Reading license flags
- Handling missing/invalid values
- Default value application

To Implement: `widget/src/core/config.ts`

---

### State Management (23 tests)
File: `tests/widget/core/state.test.ts`

Tests for:
- StateManager class
- State initialization
- Getting current state
- Setting partial state updates
- Subscribing/unsubscribing to changes
- Multiple listeners
- Listener notification

To Implement: `widget/src/core/state.ts`

---

### Theme Management (22 tests)
File: `tests/widget/theming/theme-manager.test.ts`

Tests for:
- Light/dark/auto theme modes
- System preference detection (matchMedia)
- Theme application
- Theme switching
- Event listener management
- Cleanup/destroy

To Implement: `widget/src/theming/theme-manager.ts`

---

### CSS Variable Injection (21 tests)
File: `tests/widget/theming/css-injector.test.ts`

Tests for:
- Generating CSS variable strings
- Injecting styles into document.head
- Style element reuse
- CSS variable formatting
- Custom color handling
- Multiple injections

To Implement: `widget/src/theming/css-injector.ts`

---

### CSS Variables (26 tests)
File: `tests/widget/theming/css-variables.test.ts`

Tests for:
- Creating CSS variable objects
- Variable naming convention
- Color preservation
- Unit formatting (px)
- Font family handling
- Edge cases

To Implement: `widget/src/theming/css-variables.ts`

---

## Test Execution Commands

### Run All Tests
```bash
npm test tests/widget
```
Expected: 124 FAILED (all RED)

### Run by Module
```bash
npm test tests/widget/core/config.test.ts          # 32 tests
npm test tests/widget/core/state.test.ts           # 23 tests
npm test tests/widget/theming/theme-manager.test.ts # 22 tests
npm test tests/widget/theming/css-injector.test.ts  # 21 tests
npm test tests/widget/theming/css-variables.test.ts # 26 tests
```

### Run Specific Test
```bash
npm test -- tests/widget/core/config.test.ts -t "should merge"
```

### Watch Mode
```bash
npm test -- --watch tests/widget
```

### With Coverage
```bash
npm test -- tests/widget --coverage
```

---

## Modules to Implement

| Module | Tests | Location | Priority |
|--------|-------|----------|----------|
| CSS Variables | 26 | widget/src/theming/css-variables.ts | 1 (Simplest) |
| CSS Injector | 21 | widget/src/theming/css-injector.ts | 2 |
| Config Manager | 32 | widget/src/core/config.ts | 3 |
| State Manager | 23 | widget/src/core/state.ts | 4 |
| Theme Manager | 22 | widget/src/theming/theme-manager.ts | 5 (Most Complex) |

---

## Key Specifications (Quick Reference)

### Config Manager Default
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

### State Manager Interface
```typescript
interface WidgetState {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentStreamingMessage: string | null;
}
```

### CSS Variables Generated
```
--cw-primary-color: <primaryColor>
--cw-bg-color: <backgroundColor>
--cw-text-color: <textColor>
--cw-font-family: <fontFamily>
--cw-font-size: <fontSize>px
--cw-corner-radius: <cornerRadius>px
```

---

## Document Reading Guide

### For Quick Start (5-10 minutes)
1. WIDGET_RED_TESTS_QUICK_START.md
2. Skim the test files to understand test names

### For Full Understanding (30-40 minutes)
1. WIDGET_RED_TESTS_QUICK_START.md
2. tests/WIDGET_CORE_IMPLEMENTATION_HANDOFF.md
3. tests/WIDGET_CORE_TEST_SUMMARY.md

### For Detailed Implementation (60+ minutes)
1. All above documents
2. Read actual test files to understand expected behavior
3. Reference handoff document while implementing

### For Project Context
1. WIDGET_PHASE_3_7_RED_TESTS.md
2. RED_TESTS_COMPLETION_REPORT.md

---

## Next Steps

### For Implementer

1. Read WIDGET_RED_TESTS_QUICK_START.md (5 min)
2. Read tests/WIDGET_CORE_IMPLEMENTATION_HANDOFF.md (30 min)
3. Choose implementation order (recommended: css-variables → css-injector → config → state → theme-manager)
4. Create first module and run tests
5. Implement remaining modules
6. All tests pass (GREEN phase)
7. Code review and refactor if needed (REFACTOR phase)

### Estimated Timeline
- Reading/Understanding: 30-40 minutes
- Implementation: 2-3 hours
- Testing/Debugging: 30 minutes
- **Total: 3-4 hours**

---

## Success Metrics

- All 124 tests PASS
- No hardcoded values
- Clean, readable code
- TypeScript strict mode
- No console errors
- Proper error handling

---

## Contact/Questions

For questions about:
- **Test expectations:** See test file comments
- **Specifications:** Read WIDGET_CORE_IMPLEMENTATION_HANDOFF.md
- **Test details:** Read WIDGET_CORE_TEST_SUMMARY.md
- **Quick reference:** Read WIDGET_RED_TESTS_QUICK_START.md

---

## File Tree

```
n8n-widget-designer/
├── tests/
│   ├── widget/
│   │   ├── core/
│   │   │   ├── config.test.ts (32 tests)
│   │   │   └── state.test.ts (23 tests)
│   │   └── theming/
│   │       ├── theme-manager.test.ts (22 tests)
│   │       ├── css-injector.test.ts (21 tests)
│   │       └── css-variables.test.ts (26 tests)
│   ├── WIDGET_CORE_TEST_SUMMARY.md
│   └── WIDGET_CORE_IMPLEMENTATION_HANDOFF.md
│
├── widget/
│   └── src/
│       ├── core/
│       │   ├── config.ts (TO IMPLEMENT)
│       │   └── state.ts (TO IMPLEMENT)
│       └── theming/
│           ├── theme-manager.ts (TO IMPLEMENT)
│           ├── css-injector.ts (TO IMPLEMENT)
│           └── css-variables.ts (TO IMPLEMENT)
│
├── WIDGET_PHASE_3_7_RED_TESTS.md
├── WIDGET_RED_TESTS_QUICK_START.md
├── RED_TESTS_COMPLETION_REPORT.md
└── WIDGET_RED_TESTS_INDEX.md (THIS FILE)
```

---

**Status:** RED Phase Complete
**Ready for:** GREEN Phase Implementation
**Quality:** Production-Ready Tests
**Documentation:** Comprehensive and Complete

**All systems go for implementation!**
