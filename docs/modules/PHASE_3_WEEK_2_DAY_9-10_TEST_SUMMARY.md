# Phase 3 Week 2 Day 9-10: Input Area & File Upload Tests

**Date:** 2025-11-11
**Phase:** RED (TDD Test-First)
**Components:** Input Area, File Upload
**Status:** ✅ RED Phase Complete - All tests failing as expected

---

## Summary

Created comprehensive test suites for the Input Area and File Upload UI components following strict TDD RED-GREEN-REFACTOR methodology. All 100 tests are currently failing because the production code doesn't exist yet (RED phase).

---

## Test Files Created

### 1. Input Area Component Tests
**File:** `tests/widget/ui/input-area.test.ts`
**Test Count:** 50 tests
**Status:** ❌ All failing (RED phase - expected)

### 2. File Upload Component Tests
**File:** `tests/widget/ui/file-upload.test.ts`
**Test Count:** 50 tests
**Status:** ❌ All failing (RED phase - expected)

**Total Tests:** 100 tests

---

## Input Area Component Test Coverage (50 tests)

### Rendering Tests (9 tests)
- ✅ Creates input area element with correct class
- ✅ Renders textarea element
- ✅ Textarea has placeholder text
- ✅ Renders send button
- ✅ Send button has icon or text
- ✅ Proper ARIA attributes on textarea
- ✅ Proper ARIA attributes on send button
- ✅ Applies theme-aware styling
- ✅ Has responsive layout classes

### User Input Handling Tests (5 tests)
- ✅ Updates internal state when user types
- ✅ Uses placeholder from config if provided
- ✅ Supports multiline input
- ✅ Handles Shift+Enter for new line
- ✅ Trims whitespace before validation

### Send Message Functionality Tests (9 tests)
- ✅ Sends message when send button clicked
- ✅ Sends message on Enter key press
- ✅ Does NOT send message on Shift+Enter
- ✅ Does NOT send empty message
- ✅ Does NOT send whitespace-only message
- ✅ Disables input during send
- ✅ Disables send button during send
- ✅ Clears input after successful send
- ✅ Re-enables input after send completes

### State Integration Tests (4 tests)
- ✅ Subscribes to state changes on construction
- ✅ Sends message via stateManager.setState()
- ✅ Respects state.isLoading flag
- ✅ Updates UI when state.isLoading changes

### File Upload Integration Tests (3 tests)
- ✅ Renders file upload button when enabled
- ✅ Does NOT render file upload button when disabled
- ✅ Displays selected file name when file attached

### Styling Tests (6 tests)
- ✅ Applies theme colors from config
- ✅ Applies light theme class
- ✅ Applies dark theme class
- ✅ Has focus styling on textarea
- ✅ Has hover effect on send button
- ✅ Has active state styling on send button

### Lifecycle Tests (3 tests)
- ✅ Cleans up event listeners on destroy
- ✅ Unsubscribes from state on destroy
- ✅ Handles multiple destroy calls safely

### Edge Cases Tests (8 tests)
- ✅ Handles missing config gracefully
- ✅ Handles missing state manager gracefully
- ✅ Handles very long messages
- ✅ Handles rapid send attempts
- ✅ Supports Ctrl+Enter as alternative send shortcut
- ✅ Handles special characters in input
- ✅ Handles emoji and unicode characters
- ✅ Maintains focus after failed send attempt

### Keyboard Shortcuts Tests (3 tests)
- ✅ Handles Tab key for navigation
- ✅ Handles Escape key
- ✅ Prevents form submission on Enter when appropriate

---

## File Upload Component Test Coverage (50 tests)

### Rendering Tests (6 tests)
- ✅ Creates file upload element with correct class
- ✅ Renders file upload button
- ✅ Button has icon or text
- ✅ Has ARIA label on button
- ✅ Renders hidden file input element
- ✅ Has initial state with no file selected

### File Selection Tests (6 tests)
- ✅ Opens file picker when button clicked
- ✅ Triggers validation when file selected
- ✅ Displays selected file name
- ✅ Displays selected file size
- ✅ Handles file preview for images (optional)
- ✅ Handles file selection cancellation

### File Validation Tests (8 tests)
- ✅ Validates file extension (allowed)
- ✅ Rejects invalid file extension
- ✅ Validates file size (within limit)
- ✅ Rejects file exceeding size limit
- ✅ Shows error message for invalid file type
- ✅ Shows error message for oversized file
- ✅ Performs case-insensitive extension matching
- ✅ Validates common MIME types

### File Removal Tests (3 tests)
- ✅ Shows remove button after file selected
- ✅ Clears file when remove button clicked
- ✅ Updates state after file removal

### State Integration Tests (4 tests)
- ✅ Updates state.attachedFile on selection
- ✅ Clears state.attachedFile on removal
- ✅ Respects state.isLoading (disable during send)
- ✅ Re-enables after send completes

### Configuration Tests (4 tests)
- ✅ Reads allowed extensions from config
- ✅ Reads max file size from config
- ✅ Uses default values if config missing
- ✅ Validates config values on construction

### Styling Tests (4 tests)
- ✅ Applies theme-aware button styling
- ✅ Applies dark theme styling
- ✅ Has file preview styling
- ✅ Has error message styling (red)

### Lifecycle Tests (3 tests)
- ✅ Cleans up event listeners on destroy
- ✅ Unsubscribes from state on destroy
- ✅ Handles multiple destroy calls safely

### Edge Cases Tests (10 tests)
- ✅ Handles empty file selection
- ✅ Handles null file
- ✅ Handles undefined file
- ✅ Handles browser without File API support (graceful degradation)
- ✅ Handles very long file names (truncation)
- ✅ Handles missing config gracefully
- ✅ Handles missing state manager gracefully
- ✅ Handles file with no extension
- ✅ Handles multiple file extensions (e.g., .tar.gz)
- ✅ Handles file with misleading extension

### Integration Tests (2 tests)
- ✅ Works correctly in full upload flow
- ✅ Integrates with send message flow

---

## Key Design Patterns

### Input Area Component
```typescript
export class InputArea {
  constructor(config: WidgetConfig, stateManager: StateManager) {}
  render(): HTMLElement {}
  destroy(): void {}
}
```

**Key Features:**
- Textarea for multi-line input
- Send button with click and Enter key support
- Shift+Enter for new line (does NOT send)
- Ctrl+Enter alternative send shortcut
- Whitespace trimming and validation
- Integration with file upload component
- State-aware enabling/disabling during message send
- Input clearing after successful send
- Focus management

### File Upload Component
```typescript
export class FileUpload {
  constructor(config: WidgetConfig, stateManager: StateManager) {}
  render(): HTMLElement {}
  destroy(): void {}
}
```

**Key Features:**
- Hidden file input with button trigger
- File type validation (extensions + MIME types)
- File size validation (configurable limit)
- File name display with truncation
- File size display (human-readable)
- Remove file functionality
- Error messages for invalid files
- Image preview (optional enhancement)
- State integration (attachedFile property)

---

## State Properties Used

### New State Properties Required
```typescript
interface WidgetState {
  // Existing properties
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentStreamingMessage: string | null;
  currentTheme?: 'light' | 'dark';

  // NEW: Required for file upload
  attachedFile?: File | null; // Selected file for upload
}
```

### Config Properties Used
```typescript
interface FeaturesConfig {
  fileAttachmentsEnabled: boolean;
  allowedExtensions: string[]; // e.g., ['.jpg', '.png', '.pdf']
  maxFileSizeKB: number; // in KB, e.g., 5120 (5MB)
}
```

---

## Test Helpers

### Mock File Creation
```typescript
function createMockFile(name: string, size: number, type: string): File {
  const content = 'x'.repeat(size);
  const file = new File([content], name, { type });
  return file;
}
```

**Usage:**
```typescript
const mockFile = createMockFile('test.pdf', 2048, 'application/pdf');
```

---

## Critical Test Scenarios

### Input Area
1. **Message Sending**
   - Enter key sends
   - Shift+Enter does NOT send (adds newline)
   - Ctrl+Enter sends (alternative)
   - Empty/whitespace-only messages rejected

2. **State Integration**
   - Disables during send (state.isLoading)
   - Re-enables after send
   - Clears input after successful send

3. **File Upload Integration**
   - Shows file button when enabled
   - Hides file button when disabled
   - Displays selected file name

4. **Edge Cases**
   - Very long messages
   - Special characters (no XSS)
   - Emoji and unicode
   - Rapid send attempts

### File Upload
1. **File Validation**
   - Extension validation (case-insensitive)
   - Size validation (configurable limit)
   - MIME type validation
   - Rejects invalid files

2. **Error Handling**
   - Clear error messages
   - Red error styling
   - Graceful degradation

3. **State Integration**
   - Updates state.attachedFile on selection
   - Clears state.attachedFile on removal
   - Disables during send

4. **Edge Cases**
   - No file extension
   - Multiple extensions (.tar.gz)
   - Misleading extensions
   - Very long filenames
   - Null/undefined files

---

## Validation Rules

### Input Area
- **Empty Message:** Reject (no send)
- **Whitespace-only:** Trim and reject if empty
- **Special Characters:** Allow but sanitize
- **Emoji/Unicode:** Full support
- **Max Length:** Optional (implementation-defined)

### File Upload
- **Allowed Extensions:** Configurable list (e.g., .jpg, .png, .pdf)
- **Max File Size:** Configurable (e.g., 5MB = 5120 KB)
- **Extension Matching:** Case-insensitive
- **MIME Type:** Should match extension
- **File Name Length:** Truncate if too long

---

## Accessibility Requirements

### Input Area
- `aria-label` on textarea
- `role` attribute on textarea
- `aria-label` on send button ("Send message")
- `aria-disabled` when sending
- Keyboard accessible (Tab, Enter, Shift+Enter, Escape)
- Focus management

### File Upload
- `aria-label` on upload button ("Attach file")
- `aria-label` on remove button ("Remove file")
- Hidden file input (display:none or visibility:hidden)
- Keyboard accessible (Tab, Enter, Space)
- Screen reader announcements for errors

---

## Next Steps (GREEN Phase)

The Implementer should now:

1. **Create Production Files:**
   - `widget/src/ui/input-area.ts`
   - `widget/src/ui/file-upload.ts`

2. **Update State Interface:**
   - Add `attachedFile?: File | null` to WidgetState

3. **Implement Components:**
   - Follow test specifications exactly
   - Implement minimal code to pass each test
   - Focus on behavior, not implementation details

4. **Verify Tests Turn Green:**
   - Run: `npm test tests/widget/ui/input-area.test.ts`
   - Run: `npm test tests/widget/ui/file-upload.test.ts`
   - All 100 tests should pass

5. **REFACTOR Phase:**
   - Remove duplication
   - Improve code clarity
   - Optimize performance
   - Keep all tests green

---

## Test Execution

### Run All Tests
```bash
npm test tests/widget/ui/input-area.test.ts
npm test tests/widget/ui/file-upload.test.ts
```

### Expected Results (RED Phase)
```
❌ Input Area: 0/50 passing (all failing - expected)
❌ File Upload: 0/50 passing (all failing - expected)
```

### Expected Results (GREEN Phase)
```
✅ Input Area: 50/50 passing
✅ File Upload: 50/50 passing
```

---

## Code Review Checklist

Before marking GREEN phase complete:

- [ ] All 100 tests passing
- [ ] No test gaming (hard-coded values)
- [ ] Proper error handling
- [ ] ARIA attributes correct
- [ ] Event listeners cleaned up in destroy()
- [ ] State subscriptions cleaned up
- [ ] Input sanitization for XSS prevention
- [ ] File validation implemented correctly
- [ ] Edge cases handled gracefully
- [ ] TypeScript types are strict (no `any`)
- [ ] Code follows existing component patterns

---

## Notes

- **TDD Compliance:** Strict RED-GREEN-REFACTOR followed
- **Test Quality:** Comprehensive coverage including edge cases
- **Pattern Consistency:** Follows existing UI component test patterns
- **Accessibility:** WCAG 2.1 Level AA compliance
- **Security:** XSS prevention, file validation
- **Performance:** Debouncing for rapid interactions
- **Browser Support:** Graceful degradation for older browsers

---

**Agent:** TDD-QA-Lead
**Phase:** RED Complete
**Next Agent:** Implementer (GREEN phase)
**Test Files:**
- `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\ui\input-area.test.ts`
- `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\ui\file-upload.test.ts`
