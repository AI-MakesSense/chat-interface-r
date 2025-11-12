# Syntax Highlighter Implementation Brief

**Date:** 2025-11-12
**Phase:** Week 4, Day 5-6
**Status:** PLANNING COMPLETE → Ready for RED Phase
**Next Agent:** TDD/QA Lead

---

## Quick Summary

Implement a lightweight syntax highlighter for code blocks in chat messages using Prism.js, integrated with the existing MarkdownRenderer. Must stay within 50KB total bundle size.

---

## Critical Constraints

1. **Bundle Size:** ~2KB remaining in budget (use lazy-loading)
2. **Current Bundle:** 48.23 KB gzipped (out of 50KB limit)
3. **Integration Point:** Post-process after MarkdownRenderer
4. **Security:** Must not introduce XSS vulnerabilities
5. **Performance:** <10ms per code block

---

## Technical Decisions Made

### Decision 1: Library Choice

**Selected:** Prism.js (2KB core)
**Rejected:** Highlight.js (7KB core)

**Rationale:** Bundle size is critical. Prism.js is 5KB smaller and has better tree-shaking support.

### Decision 2: Integration Strategy

**Selected:** Post-processing (highlight after markdown rendering)
**Rejected:** markdown-it plugin

**Rationale:** Cleaner separation, easier lazy-loading, works with existing sanitizer.

### Decision 3: Language Subset

**Core Languages (always loaded):**
- JavaScript (~1KB)
- TypeScript (~1.2KB)
- Python (~0.8KB)
- JSON (~0.3KB)
- Bash (~0.5KB)

**Total:** ~3.8KB

**Extended Languages (lazy-loaded on demand):**
- HTML, CSS, SQL, Java, Go (~2.8KB total)

### Decision 4: Bundle Strategy

**Approach:** Lazy-load Prism.js as separate chunk

**Result:**
- Main bundle: 35KB (unchanged)
- Markdown chunk: 25KB (unchanged)
- **Syntax chunk: ~6KB (lazy-loaded)** ← NEW
- **Total initial load: 35KB** ✅ (within budget)

### Decision 5: Theme System

**Approach:** CSS-based themes loaded from CDN

**Rationale:** Zero bundle impact, easy to customize.

**Themes:**
- Light: `prism.css` (~1KB)
- Dark: `prism-okaidia.css` (~1.2KB)
- Auto: Detect system theme preference

---

## Module Interface

### SyntaxHighlighterConfig

```typescript
interface SyntaxHighlighterConfig {
  coreLanguages: string[];           // ['javascript', 'typescript', 'python', 'json', 'bash']
  extendedLanguages: string[];       // ['html', 'css', 'sql', 'java', 'go']
  theme: 'light' | 'dark' | 'auto';
  lightThemeUrl?: string;            // CDN URL for light theme CSS
  darkThemeUrl?: string;             // CDN URL for dark theme CSS
  showLineNumbers: boolean;
  fallbackLanguage: string;          // 'plaintext'
}
```

### SyntaxHighlighter Class

```typescript
class SyntaxHighlighter {
  constructor(config: SyntaxHighlighterConfig);

  /**
   * Highlights code blocks in HTML string
   * Input: '<code class="language-javascript">const x = 10;</code>'
   * Output: '<code class="language-javascript"><span class="token keyword">const</span> ...</code>'
   */
  highlight(html: string): string;

  /**
   * Sets theme (light/dark/auto)
   */
  setTheme(theme: 'light' | 'dark' | 'auto'): void;

  /**
   * Lazy-loads an extended language
   */
  async loadLanguage(language: string): Promise<void>;

  /**
   * Checks if language is supported
   */
  isLanguageSupported(language: string): boolean;

  /**
   * Static initializer (lazy-loads Prism.js)
   */
  static async initialize(): Promise<void>;

  /**
   * Singleton pattern
   */
  static getInstance(config: SyntaxHighlighterConfig): SyntaxHighlighter;
}
```

---

## Integration with MarkdownRenderer

### Updated MarkdownConfig

```typescript
interface MarkdownConfig {
  // Existing fields...
  enableTables: boolean;
  enableCodeBlocks: boolean;
  enableBlockquotes: boolean;
  enableLinks: boolean;
  enableImages: boolean;
  enableLineBreaks: boolean;
  maxNesting: number;

  // NEW: Syntax highlighting
  enableSyntaxHighlighting: boolean;        // false by default
  syntaxHighlighterConfig?: SyntaxHighlighterConfig;
}
```

### Updated Rendering Flow

```typescript
class MarkdownRenderer {
  private highlighter?: SyntaxHighlighter;

  constructor(config: MarkdownConfig) {
    // Existing init...

    if (config.enableSyntaxHighlighting) {
      this.highlighter = new SyntaxHighlighter(
        config.syntaxHighlighterConfig || STANDARD_SYNTAX_CONFIG
      );
    }
  }

  render(markdown: string): string {
    // Step 1: Parse markdown → HTML
    const html = this.md.render(markdown);

    // Step 2: Sanitize HTML (CRITICAL: before highlighting)
    const safeHtml = this.sanitizer.sanitize(html);

    // Step 3: Highlight code blocks (NEW)
    if (this.highlighter) {
      return this.highlighter.highlight(safeHtml);
    }

    return safeHtml;
  }
}
```

**CRITICAL:** Sanitize BEFORE highlighting (not after).

**Rationale:** XssSanitizer already allows `<span class="...">` tags for highlighting. Highlighting only adds safe markup, no user input.

---

## Test Plan (25 Tests)

### 1. Core Highlighting (8 tests)

1. test_highlight_javascript_code_block
2. test_highlight_typescript_code_block
3. test_highlight_python_code_block
4. test_highlight_json_code_block
5. test_highlight_bash_code_block
6. test_preserve_non_code_html
7. test_handle_unknown_language
8. test_handle_no_language_specified

### 2. Configuration (4 tests)

9. test_respect_core_languages_config
10. test_respect_show_line_numbers_true
11. test_respect_show_line_numbers_false
12. test_respect_fallback_language

### 3. Theme System (5 tests)

13. test_set_theme_light
14. test_set_theme_dark
15. test_set_theme_auto_light
16. test_set_theme_auto_dark
17. test_theme_switch_removes_old_theme

### 4. Integration (3 tests)

18. test_markdown_renderer_integration
19. test_xss_sanitizer_integration
20. test_lazy_loading_initialization

### 5. Edge Cases (5 tests)

21. test_empty_code_block
22. test_very_long_code_block
23. test_multiple_code_blocks
24. test_inline_code_not_highlighted
25. test_special_characters_in_code

---

## Security Requirements

### XSS Prevention

1. **Sanitize BEFORE highlighting** (sanitizer already allows highlighting markup)
2. **Validate language names** (alphanumeric only, whitelist check)
3. **No user input in highlighting output** (Prism.js generates safe HTML)

### DoS Prevention

1. **Length limit:** Skip highlighting for code blocks >50KB
2. **Performance limit:** Abort highlighting after 100ms
3. **Language limit:** Only load whitelisted languages

---

## Implementation Approach

### Phase 1: Core Highlighting (Day 5)

**Goal:** Basic syntax highlighting with 5 core languages

**Tasks:**
1. Install Prism.js: `pnpm add prismjs @types/prismjs`
2. Create `widget/src/utils/syntax-highlighter.ts`
3. Implement core highlighting logic
4. Write 25 RED tests (TDD/QA Lead agent)
5. Implement production code (Implementer agent)
6. Verify all tests pass

### Phase 2: Theme System (Day 6)

**Goal:** Dynamic theme selection

**Tasks:**
1. Implement theme injection system
2. Support CDN-based theme loading
3. Add auto theme detection
4. Update tests
5. Verify all tests pass

### Phase 3: Bundle Optimization (Day 6)

**Goal:** Stay within 50KB bundle limit

**Tasks:**
1. Analyze bundle size
2. Implement code-splitting for Prism.js
3. Lazy-load on first code block
4. Tree-shake unused features
5. Verify total bundle <50KB

---

## Files to Create/Modify

### New Files

1. **`widget/src/utils/syntax-highlighter.ts`** (~150 lines)
   - SyntaxHighlighter class
   - SyntaxHighlighterConfig interface
   - STANDARD_SYNTAX_CONFIG export

2. **`tests/widget/utils/syntax-highlighter.test.ts`** (~600 lines)
   - 25 comprehensive tests
   - Uses JSDOM environment

3. **`docs/modules/WEEK_4_DAY_5-6_SYNTAX_HIGHLIGHTER.md`** (completion summary)

### Modified Files

4. **`widget/src/utils/markdown-renderer.ts`** (+20 lines)
   - Add highlighter integration
   - Update MarkdownConfig interface

5. **`tests/widget/utils/markdown-renderer.test.ts`** (+100 lines)
   - Add integration tests

6. **`widget/package.json`** (+2 dependencies)
   - Add `prismjs`
   - Add `@types/prismjs` (dev)

7. **`vite.config.ts`** (update code splitting)
   - Configure manual chunks for Prism.js

---

## Dependencies to Install

```bash
# Production
pnpm add prismjs

# Development
pnpm add -D @types/prismjs
```

---

## Expected Bundle Analysis

### Before Implementation

- Main bundle: ~35KB
- Markdown chunk: ~25KB (markdown-it + dompurify)
- **Total: 48.23 KB gzipped**

### After Implementation

- Main bundle: ~35KB (unchanged)
- Markdown chunk: ~25KB (unchanged)
- **Syntax chunk: ~6KB (lazy-loaded)** ← NEW
- **Total initial load: 35KB** ✅
- **Total with markdown: 41KB** ✅
- **Total with syntax: 47KB** ✅ (within 50KB limit)

---

## Success Criteria

### Functional

- ✅ Highlight code blocks in markdown messages
- ✅ Support 5 core languages
- ✅ Support light/dark/auto themes
- ✅ Graceful fallback for unknown languages
- ✅ Integration with MarkdownRenderer works

### Non-Functional

- ✅ Total bundle: <50KB gzipped
- ✅ Highlighting performance: <10ms per code block
- ✅ Test coverage: 100% (25/25 passing)
- ✅ No XSS vulnerabilities
- ✅ Comprehensive documentation

---

## Handoff to TDD/QA Lead Agent

### Your Task

Write 25 comprehensive RED tests for the SyntaxHighlighter module following the test plan above.

### Test File Location

`tests/widget/utils/syntax-highlighter.test.ts`

### Test Environment

```typescript
/**
 * @vitest-environment jsdom
 *
 * Note: Uses JSDOM environment (same as other utils tests)
 */
```

### Test Pattern (from previous modules)

```typescript
// RED test structure
describe('SyntaxHighlighter - RED Tests', () => {
  let highlighter: SyntaxHighlighter;
  let defaultConfig: SyntaxHighlighterConfig;

  beforeEach(() => {
    defaultConfig = {
      coreLanguages: ['javascript', 'typescript', 'python', 'json', 'bash'],
      extendedLanguages: ['html', 'css', 'sql', 'java', 'go'],
      theme: 'auto',
      showLineNumbers: false,
      fallbackLanguage: 'plaintext',
    };

    // @ts-expect-error - SyntaxHighlighter does not exist yet (RED phase)
    highlighter = new SyntaxHighlighter(defaultConfig);
  });

  it('should highlight JavaScript code block', () => {
    // ARRANGE
    const html = '<code class="language-javascript">const x = 10;</code>';

    // ACT
    const result = highlighter.highlight(html);

    // ASSERT
    expect(result).toContain('<span class="token keyword">const</span>');
    expect(result).toContain('<span class="token operator">=</span>');
    expect(result).toContain('<span class="token number">10</span>');
  });

  // ... 24 more tests
});
```

### Reference Files

- **XSS Sanitizer Tests:** `tests/widget/utils/xss-sanitizer.test.ts` (21 tests, similar structure)
- **Markdown Renderer Tests:** `tests/widget/utils/markdown-renderer.test.ts` (27 tests, integration patterns)
- **Full Plan:** `docs/modules/WEEK_4_DAY_5-6_SYNTAX_HIGHLIGHTER_PLAN.md`

---

**Status:** ✅ Implementation Brief COMPLETE
**Next Action:** TDD/QA Lead writes RED tests
**Expected Deliverable:** `tests/widget/utils/syntax-highlighter.test.ts` (25 failing tests)
