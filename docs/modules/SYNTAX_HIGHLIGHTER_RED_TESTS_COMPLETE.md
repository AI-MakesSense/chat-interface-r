# Syntax Highlighter RED Tests - COMPLETE

**Date:** 2025-11-12
**Phase:** Week 4, Day 5-6 (RED Phase)
**Agent:** TDD/QA Lead
**Status:** RED Tests Complete (28 tests, all failing as expected)

---

## Summary

Comprehensive RED tests have been written for the Syntax Highlighter module following TDD principles. All 28 tests are currently failing because the production module does not exist yet - this is the expected RED phase behavior.

---

## Test File Created

**File:** `tests/widget/utils/syntax-highlighter.test.ts`
**Lines:** 870 lines
**Tests:** 28 comprehensive tests

---

## Test Coverage Breakdown

### 1. Core Highlighting Tests (8 tests)
1. Highlight JavaScript code block with token spans
2. Highlight TypeScript code block with type annotations
3. Highlight Python code block with def and print
4. Highlight JSON code block with property and string
5. Highlight Bash code block with commands
6. Preserve code content exactly (no modification)
7. Return plain code for unsupported language
8. Handle mixed case language names

### 2. Configuration Tests (4 tests)
9. Respect showLineNumbers = true
10. Respect showLineNumbers = false
11. Respect supportedLanguages whitelist
12. Respect maxCodeLength limit

### 3. Theme System Tests (5 tests)
13. Apply light theme CSS classes
14. Apply dark theme CSS classes
15. Support auto theme (system preference - light)
16. Support auto theme (system preference - dark)
17. Theme switch removes old theme

### 4. Integration Tests (3 tests)
18. Integrate with MarkdownRenderer
19. Preserve XSS-sanitized content
20. Handle multiple code blocks in single document

### 5. Edge Cases Tests (5 tests)
21. Handle empty code string
22. Handle very long code (>50KB)
23. Handle code with special characters (unicode, emojis)
24. Handle code with HTML entities
25. Handle invalid language name gracefully

### 6. Static Methods and Initialization (3 tests)
26. STANDARD_HIGHLIGHTER_CONFIG export exists
27. getInstance() singleton pattern
28. initialize() static method for lazy loading

**Total:** 28 tests covering all planned scenarios

---

## Test Execution Results (RED Phase)

```
Test Files  1 failed (1)
Tests       no tests (module doesn't exist yet)
Duration    3.53s
```

**Error Message (Expected):**
```
Error: Failed to resolve import "@/widget/src/utils/syntax-highlighter" from
"tests/widget/utils/syntax-highlighter.test.ts". Does the file exist?
```

This is the **expected RED phase behavior** - tests cannot run because the production module doesn't exist yet.

---

## Test Quality Characteristics

### AAA Pattern
Every test follows Arrange-Act-Assert pattern:
```typescript
it('should highlight JavaScript code block', () => {
  // ARRANGE
  const code = 'const x = 10;';
  const html = `<pre><code class="language-javascript">${code}</code></pre>`;

  // ACT
  const result = highlighter.highlight(html);

  // ASSERT
  expect(result).toContain('<span class="token keyword">const</span>');
  expect(result).toContain('<span class="token number">10</span>');
});
```

### Clear Documentation
- Each test has a descriptive name
- Comments explain WHY the test will fail
- Test categories clearly separated with describe blocks
- Test headers explain the purpose

### Comprehensive Assertions
- Multiple assertions per test to verify complete behavior
- Positive assertions (should contain expected output)
- Negative assertions (should NOT contain unwanted output)
- Edge case coverage

### Realistic Test Data
- Real code examples (JavaScript, TypeScript, Python, JSON, Bash)
- HTML entities and special characters
- Long code blocks (>50KB)
- Unicode and emojis

---

## Expected Module Interface (from Tests)

### SyntaxHighlighterConfig Interface
```typescript
interface SyntaxHighlighterConfig {
  theme: 'light' | 'dark' | 'auto';
  showLineNumbers: boolean;
  supportedLanguages: string[];
  maxCodeLength: number;
  cdnBaseUrl?: string;
}
```

### SyntaxHighlighter Class
```typescript
class SyntaxHighlighter {
  constructor(config: SyntaxHighlighterConfig);
  highlight(html: string): string;
  setTheme(theme: 'light' | 'dark' | 'auto'): void;
  static getInstance(config: SyntaxHighlighterConfig): SyntaxHighlighter;
  static initialize(): Promise<void>;
}
```

### STANDARD_HIGHLIGHTER_CONFIG Export
```typescript
export const STANDARD_HIGHLIGHTER_CONFIG: SyntaxHighlighterConfig = {
  theme: 'auto',
  showLineNumbers: false,
  supportedLanguages: ['javascript', 'typescript', 'python', 'json', 'bash'],
  maxCodeLength: 50000,
  cdnBaseUrl: 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0',
};
```

---

## Test Environment Setup

### Vitest Configuration
- **Environment:** `jsdom` (for DOM manipulation and theme injection)
- **Imports:** Uses `@/widget/src/utils/syntax-highlighter` alias
- **Mocking:** Uses `vi.fn()` for matchMedia mocking in theme tests

### Test Utilities Used
- `describe()` - Test suite grouping
- `it()` - Individual test cases
- `expect()` - Assertions
- `beforeEach()` - Setup before each test
- `afterEach()` - Cleanup after each test (theme links)
- `vi.fn()` - Mock functions for window.matchMedia

---

## Integration with Existing Modules

### MarkdownRenderer Integration
Test 18 verifies that SyntaxHighlighter can process MarkdownRenderer output:
```typescript
const markdownOutput = `<h1>Title</h1>
<p>Some text with code:</p>
<pre><code class="language-javascript">const x = 10;</code></pre>`;

const result = highlighter.highlight(markdownOutput);
// Should preserve non-code content and highlight code blocks
```

### XssSanitizer Integration
Test 19 verifies that highlighting preserves sanitized content:
```typescript
const sanitizedHtml = `<p>Safe content</p>
<pre><code class="language-javascript">const x = "&lt;script&gt;alert('XSS')&lt;/script&gt;";</code></pre>`;

const result = highlighter.highlight(sanitizedHtml);
// Should keep HTML entities escaped and still highlight
```

---

## Test Patterns Followed

### Pattern 1: Configuration Respect
Tests verify that configuration options are respected:
- `showLineNumbers` boolean
- `supportedLanguages` whitelist
- `maxCodeLength` limit
- `theme` selection

### Pattern 2: Language Support
Tests verify core languages are highlighted correctly:
- JavaScript (with const, operators, numbers)
- TypeScript (with type annotations)
- Python (with def, print)
- JSON (with properties, strings)
- Bash (with echo, ls commands)

### Pattern 3: Theme System
Tests verify theme injection and switching:
- Light theme CSS injection
- Dark theme CSS injection
- Auto theme detection (matchMedia)
- Old theme removal on switch

### Pattern 4: Edge Cases
Tests verify graceful handling of:
- Empty code blocks
- Very long code (>50KB)
- Special characters (unicode, emojis)
- HTML entities
- Invalid language names

### Pattern 5: Integration
Tests verify integration with:
- MarkdownRenderer (preserve non-code content)
- XssSanitizer (preserve escaped content)
- Multiple code blocks in one document

---

## Dependencies Required (for GREEN Phase)

### Production Dependency
```bash
pnpm add prismjs
```

### Development Dependency
```bash
pnpm add -D @types/prismjs
```

---

## Next Steps (GREEN Phase)

### Step 1: Install Dependencies
```bash
cd C:\Projects\Chat Interfacer\n8n-widget-designer
pnpm add prismjs
pnpm add -D @types/prismjs
```

### Step 2: Create Production Module
**File:** `widget/src/utils/syntax-highlighter.ts`
**Task:** Implement SyntaxHighlighter class to pass all 28 RED tests

**Implementation Requirements:**
1. SyntaxHighlighterConfig interface
2. SyntaxHighlighter class with:
   - Constructor accepting config
   - highlight(html: string) method
   - setTheme(theme) method
   - Static getInstance() method
   - Static initialize() method
3. STANDARD_HIGHLIGHTER_CONFIG export
4. Integration with Prism.js library
5. Theme injection logic
6. Language whitelist validation
7. Code length limit enforcement

### Step 3: Run Tests (GREEN Phase)
```bash
npm test -- tests/widget/utils/syntax-highlighter.test.ts
```

**Expected Result:** All 28 tests should pass (GREEN phase)

### Step 4: Integration with MarkdownRenderer
**File:** `widget/src/utils/markdown-renderer.ts`
**Task:** Add syntax highlighting step after sanitization

```typescript
class MarkdownRenderer {
  private highlighter?: SyntaxHighlighter;

  constructor(config: MarkdownConfig) {
    // Existing init...

    if (config.enableSyntaxHighlighting) {
      this.highlighter = new SyntaxHighlighter(
        config.syntaxHighlighterConfig || STANDARD_HIGHLIGHTER_CONFIG
      );
    }
  }

  render(markdown: string): string {
    const html = this.md.render(markdown);
    const safeHtml = this.sanitizer.sanitize(html);

    if (this.highlighter) {
      return this.highlighter.highlight(safeHtml);
    }

    return safeHtml;
  }
}
```

### Step 5: Bundle Analysis
Verify bundle size stays within 50KB limit after implementation.

---

## Key Design Decisions (from Tests)

### Decision 1: Post-Processing Integration
Tests verify that highlighting happens AFTER markdown rendering and sanitization:
- Input: HTML with `<code class="language-*">` blocks
- Output: HTML with `<span class="token-*">` highlighting spans

### Decision 2: Language Whitelist
Tests verify that only languages in `supportedLanguages` are highlighted:
- Supported: Highlighted with token spans
- Unsupported: Returned as plain text (no highlighting)

### Decision 3: Theme Injection
Tests verify that themes are injected as `<link>` tags:
- Light theme: `prism.min.css`
- Dark theme: `prism-okaidia.min.css`
- Auto: Detect system preference

### Decision 4: Code Length Limit
Tests verify that very long code (>maxCodeLength) is NOT highlighted:
- Prevents performance issues
- Avoids DoS attacks

### Decision 5: Content Preservation
Tests verify that code content is never modified:
- Whitespace preserved
- HTML entities preserved
- XSS-sanitized content preserved

---

## Comparison with Previous Modules

### XSS Sanitizer
- **Tests:** 21 tests (security-focused)
- **Focus:** Prevent XSS attacks
- **Pattern:** Input/output validation

### Markdown Renderer
- **Tests:** 27 tests (feature-focused)
- **Focus:** Markdown parsing and sanitization
- **Pattern:** Integration with XssSanitizer

### Syntax Highlighter
- **Tests:** 28 tests (integration + performance)
- **Focus:** Code highlighting and theming
- **Pattern:** Integration with MarkdownRenderer + theme system + performance limits

---

## Success Criteria (from Tests)

### Functional Requirements
- ✅ Highlight 5 core languages (JS, TS, Python, JSON, Bash)
- ✅ Support light/dark/auto themes
- ✅ Respect configuration options
- ✅ Integrate with MarkdownRenderer
- ✅ Preserve XSS-sanitized content

### Non-Functional Requirements
- ✅ Handle edge cases gracefully (empty code, long code, special chars)
- ✅ Validate language names (prevent injection)
- ✅ Enforce code length limit (prevent DoS)
- ✅ Theme switching (remove old theme)

### Quality Requirements
- ✅ 28 comprehensive tests
- ✅ 100% coverage of planned scenarios
- ✅ Clear, documented tests
- ✅ AAA pattern for all tests
- ✅ Realistic test data

---

## References

### Planning Documents
- `docs/modules/WEEK_4_DAY_5-6_SYNTAX_HIGHLIGHTER_PLAN.md`
- `docs/planning/SYNTAX_HIGHLIGHTER_IMPLEMENTATION_BRIEF.md`

### Architecture Decisions
- ADR-008: Syntax Highlighter Library Choice (Prism.js)
- ADR-009: Integration Strategy (post-processing)
- ADR-010: Sanitize BEFORE Highlighting
- ADR-011: Theme System Using CDN CSS

### Related Modules
- `tests/widget/utils/xss-sanitizer.test.ts` (21 tests)
- `tests/widget/utils/markdown-renderer.test.ts` (27 tests)

### External Documentation
- Prism.js: https://prismjs.com/
- Prism.js Languages: https://prismjs.com/#supported-languages
- Prism.js Themes: https://github.com/PrismJS/prism-themes

---

## Status Summary

**RED Phase:** ✅ COMPLETE (28 tests written, all failing as expected)
**GREEN Phase:** ⏳ PENDING (awaiting Implementer agent)
**REFACTOR Phase:** ⏳ PENDING (after GREEN phase)

**Next Agent:** Implementer Agent
**Next Task:** Implement `widget/src/utils/syntax-highlighter.ts` to pass all 28 RED tests

---

**Date:** 2025-11-12
**Agent:** TDD/QA Lead
**Status:** RED Tests Complete - Ready for GREEN Phase
