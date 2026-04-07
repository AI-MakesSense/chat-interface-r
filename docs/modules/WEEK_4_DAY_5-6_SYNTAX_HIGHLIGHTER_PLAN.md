# Week 4, Day 5-6: Syntax Highlighter Implementation Plan

**Date:** 2025-11-12
**Status:** PLANNING (Architect/Planner Phase)
**Agent:** Architect/Planner
**Next Phase:** RED Tests (TDD/QA Lead Agent)

---

## Executive Summary

This document provides a comprehensive plan for implementing a lightweight Syntax Highlighter module that integrates with the Markdown Renderer to provide code syntax highlighting in chat widget messages. The implementation follows TDD principles and stays within the strict 50KB bundle size limit.

**Key Decision:** Use **Prism.js** (not Highlight.js) for smaller bundle size and better tree-shaking support.

---

## Context & Current State

### Completed Modules

1. **Week 4 Day 1-2: XSS Sanitizer** ✅ COMPLETE
   - 21/21 tests passing
   - Bundle: ~18KB (isomorphic-dompurify)
   - File: `widget/src/utils/xss-sanitizer.ts`

2. **Week 4 Day 3-4: Markdown Renderer** ✅ COMPLETE
   - 27/27 tests passing
   - Bundle: ~7KB (markdown-it)
   - File: `widget/src/utils/markdown-renderer.ts`

### Current Bundle Status

```
Total bundle: 48.23 KB gzipped (out of 50KB target)
Remaining budget: ~2KB
```

**Bundle Breakdown:**
- Main widget bundle: ~35KB
- Markdown-it: ~7KB
- isomorphic-dompurify: ~18KB
- **Available for syntax highlighting: ~2KB**

### Integration Point

The Syntax Highlighter will integrate with the Markdown Renderer's code block output:

```typescript
// Current markdown-it output (no highlighting):
<pre><code class="language-javascript">
function hello() {
  console.log("Hello");
}
</code></pre>

// After syntax highlighting:
<pre><code class="language-javascript">
<span class="token keyword">function</span> <span class="token function">hello</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"Hello"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre>
```

---

## Problem Statement

**Goal:** Add syntax highlighting to code blocks in markdown without exceeding the 50KB bundle limit.

**Constraints:**
1. **Bundle size limit:** ~2KB remaining (strict)
2. **Integration:** Must work seamlessly with MarkdownRenderer
3. **Performance:** Highlighting must be fast (<10ms per code block)
4. **Security:** Must not introduce XSS vulnerabilities
5. **Configuration:** Support theme selection and language subsets
6. **Browser support:** IE11+ (if using Prism.js)

**Assumptions:**
1. Most chat messages contain 0-2 code blocks
2. JavaScript, Python, JSON, TypeScript are most common languages
3. Users expect syntax highlighting for better code readability
4. Lazy loading is acceptable for syntax highlighter (separate chunk)

---

## Technical Decisions

### 1. Library Choice: Prism.js vs Highlight.js

#### Comparison Matrix

| Feature | Prism.js | Highlight.js |
|---------|----------|--------------|
| **Core size (gzipped)** | ~2KB | ~7KB |
| **Modular system** | Excellent (per-language) | Good (bundled) |
| **Tree-shaking** | Excellent | Moderate |
| **Language support** | 270+ languages | 190+ languages |
| **Theme system** | CSS-based | CSS-based |
| **Line numbers** | Plugin available | Plugin available |
| **Auto-detection** | No (explicit only) | Yes |
| **Bundle impact** | 2-3KB | 5-7KB |

#### Decision: Use Prism.js

**Rationale:**
1. **Bundle size:** Prism.js core is 2KB vs 7KB for Highlight.js
2. **Modular:** Import only needed languages (JavaScript, Python, JSON, TypeScript, etc.)
3. **Tree-shaking:** Vite can eliminate unused languages automatically
4. **CSS themes:** Multiple built-in themes with minimal CSS overhead (~1KB each)
5. **Widget-friendly:** Manual highlighting (no auto-detection overhead)
6. **Battle-tested:** Used by GitHub, MDN, Stack Overflow

**Trade-offs:**
- ❌ No auto language detection (must specify language in ```language blocks)
- ✅ Smaller bundle (more important for widget)
- ✅ Better tree-shaking support

### 2. Integration Strategy

#### Option A: Post-processing (Selected)

**Approach:** Highlight code blocks AFTER markdown rendering

```typescript
class MarkdownRenderer {
  render(markdown: string): string {
    // Step 1: Parse markdown to HTML
    const html = this.md.render(markdown);

    // Step 2: Sanitize HTML
    const safeHtml = this.sanitizer.sanitize(html);

    // Step 3: Highlight code blocks (NEW)
    const highlightedHtml = this.highlighter.highlight(safeHtml);

    return highlightedHtml;
  }
}
```

**Advantages:**
- ✅ Clean separation of concerns
- ✅ Highlighter can be lazy-loaded
- ✅ Easy to disable (skip step 3)
- ✅ Works with existing sanitizer

**Disadvantages:**
- ❌ Requires DOM parsing or regex to find code blocks

#### Option B: markdown-it Plugin (Not Selected)

**Approach:** Replace markdown-it's default code renderer

```typescript
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const code = token.content;
  const lang = token.info;
  return highlightedHTML;
};
```

**Advantages:**
- ✅ Integrates directly with markdown-it
- ✅ No post-processing needed

**Disadvantages:**
- ❌ Harder to lazy-load
- ❌ More complex integration
- ❌ Sanitizer must run after highlighting
- ❌ More tightly coupled

**Decision:** Use **Option A** (post-processing) for cleaner architecture.

### 3. Language Subset Selection

**Problem:** Prism.js supports 270+ languages, but we can't bundle them all.

**Solution:** Include only the most common languages for chat widgets.

#### Core Languages (Must Include)

1. **JavaScript** (language-javascript) - ~1KB
2. **TypeScript** (language-typescript) - ~1.2KB
3. **Python** (language-python) - ~0.8KB
4. **JSON** (language-json) - ~0.3KB
5. **Bash/Shell** (language-bash) - ~0.5KB

**Total core:** ~3.8KB (within budget with tree-shaking)

#### Extended Languages (Optional, lazy-load on demand)

6. **HTML** (language-markup) - ~0.6KB
7. **CSS** (language-css) - ~0.5KB
8. **SQL** (language-sql) - ~0.4KB
9. **Java** (language-java) - ~0.7KB
10. **Go** (language-go) - ~0.6KB

**Total extended:** ~2.8KB (lazy-loaded separately)

#### Configuration Approach

```typescript
interface SyntaxHighlighterConfig {
  // Core languages (always loaded)
  coreLanguages: string[];

  // Extended languages (lazy-loaded on first use)
  extendedLanguages: string[];

  // Theme selection
  theme: 'light' | 'dark' | 'auto';

  // Theme CSS URLs
  lightThemeUrl?: string;
  darkThemeUrl?: string;

  // Line numbers
  showLineNumbers: boolean;

  // Fallback for unknown languages
  fallbackLanguage: string; // 'plaintext'
}
```

### 4. Theme System

#### CSS-Based Themes

Prism.js uses pure CSS for themes (no JS overhead).

**Built-in themes:**
- `prism.css` (default light theme) - ~1KB
- `prism-dark.css` (dark theme) - ~1KB
- `prism-okaidia.css` (popular dark theme) - ~1.2KB
- `prism-tomorrow.css` (GitHub-style) - ~1KB

**Integration:**
```typescript
class SyntaxHighlighter {
  private currentTheme: 'light' | 'dark' = 'light';

  setTheme(theme: 'light' | 'dark' | 'auto') {
    if (theme === 'auto') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Inject theme CSS dynamically
    this.injectThemeCSS(theme);
    this.currentTheme = theme;
  }

  private injectThemeCSS(theme: 'light' | 'dark') {
    const themeUrl = theme === 'dark' ? this.config.darkThemeUrl : this.config.lightThemeUrl;

    // Remove old theme
    document.querySelector('link[data-prism-theme]')?.remove();

    // Inject new theme
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = themeUrl;
    link.setAttribute('data-prism-theme', theme);
    document.head.appendChild(link);
  }
}
```

**Theme Configuration Example:**
```typescript
const config: SyntaxHighlighterConfig = {
  theme: 'auto',
  lightThemeUrl: 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism.min.css',
  darkThemeUrl: 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-okaidia.min.css',
  // ...
};
```

**Trade-off:** Using CDN for themes keeps bundle size minimal.

---

## Module Design

### SyntaxHighlighter Class

**File:** `widget/src/utils/syntax-highlighter.ts`

**Responsibilities:**
1. Highlight code blocks in HTML strings
2. Manage language loading (core + lazy-loaded)
3. Manage theme selection and injection
4. Handle unknown languages gracefully
5. Support line numbers (optional)
6. Integrate with MarkdownRenderer

**Interface:**
```typescript
interface SyntaxHighlighterConfig {
  coreLanguages: string[];
  extendedLanguages: string[];
  theme: 'light' | 'dark' | 'auto';
  lightThemeUrl?: string;
  darkThemeUrl?: string;
  showLineNumbers: boolean;
  fallbackLanguage: string;
}

class SyntaxHighlighter {
  constructor(config: SyntaxHighlighterConfig);

  /**
   * Highlights code blocks in HTML string
   * @param html - HTML with <code class="language-*"> blocks
   * @returns HTML with syntax-highlighted code blocks
   */
  highlight(html: string): string;

  /**
   * Sets theme (light/dark/auto)
   * @param theme - Theme mode
   */
  setTheme(theme: 'light' | 'dark' | 'auto'): void;

  /**
   * Lazy-loads an extended language
   * @param language - Language name (e.g., 'java', 'go')
   */
  async loadLanguage(language: string): Promise<void>;

  /**
   * Checks if a language is supported
   * @param language - Language name
   * @returns True if language is loaded or available
   */
  isLanguageSupported(language: string): boolean;

  /**
   * Static initializer for lazy loading
   */
  static async initialize(): Promise<void>;

  /**
   * Singleton pattern (optional)
   */
  static getInstance(config: SyntaxHighlighterConfig): SyntaxHighlighter;
}
```

### Default Configuration

```typescript
export const STANDARD_SYNTAX_CONFIG: SyntaxHighlighterConfig = {
  coreLanguages: ['javascript', 'typescript', 'python', 'json', 'bash'],
  extendedLanguages: ['html', 'css', 'sql', 'java', 'go'],
  theme: 'auto',
  lightThemeUrl: 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism.min.css',
  darkThemeUrl: 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-okaidia.min.css',
  showLineNumbers: false,
  fallbackLanguage: 'plaintext',
};
```

---

## Integration with MarkdownRenderer

### Updated MarkdownRenderer Interface

```typescript
interface MarkdownConfig {
  // Existing config
  enableTables: boolean;
  enableCodeBlocks: boolean;
  enableBlockquotes: boolean;
  enableLinks: boolean;
  enableImages: boolean;
  enableLineBreaks: boolean;
  maxNesting: number;

  // NEW: Syntax highlighting config
  enableSyntaxHighlighting: boolean;
  syntaxHighlighterConfig?: SyntaxHighlighterConfig;
}
```

### Updated MarkdownRenderer Implementation

```typescript
class MarkdownRenderer {
  private md: MarkdownIt;
  private sanitizer: XssSanitizer;
  private highlighter?: SyntaxHighlighter; // NEW: Optional highlighter
  private config: MarkdownConfig;

  constructor(config: MarkdownConfig) {
    // Existing initialization...

    // NEW: Initialize syntax highlighter if enabled
    if (config.enableSyntaxHighlighting) {
      this.highlighter = new SyntaxHighlighter(
        config.syntaxHighlighterConfig || STANDARD_SYNTAX_CONFIG
      );
    }
  }

  render(markdown: string): string {
    // Step 1: Parse markdown to HTML
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

**CRITICAL DECISION:** Sanitize BEFORE highlighting, not after.

**Rationale:**
1. Highlighting adds `<span>` tags with `class` attributes
2. XssSanitizer already allows `<span class="...">` (for syntax highlighting)
3. This prevents sanitizer from stripping highlighting markup
4. Security is maintained (no user input in highlighting output)

---

## Implementation Strategy

### Phase 1: Core Highlighting (Day 5)

**Goal:** Basic syntax highlighting with core languages

**Tasks:**
1. Install Prism.js: `pnpm add prismjs`
2. Create `widget/src/utils/syntax-highlighter.ts`
3. Implement core highlighting logic
4. Integrate with MarkdownRenderer
5. Write 15 RED tests (TDD/QA Lead agent)
6. Implement production code (Implementer agent)
7. Verify all tests pass

**Expected Bundle Impact:**
- Prism.js core: ~2KB
- Core languages (JS, TS, Python, JSON, Bash): ~3.8KB
- Total: ~5.8KB (exceeds budget by 3.8KB)

**Solution:** Lazy-load Prism.js and languages as separate chunk.

### Phase 2: Theme System (Day 6)

**Goal:** Dynamic theme selection (light/dark/auto)

**Tasks:**
1. Implement theme injection system
2. Support CDN-based theme loading
3. Add auto theme detection (prefers-color-scheme)
4. Write 5 RED tests for theme system
5. Implement production code
6. Verify all tests pass

**Expected Bundle Impact:**
- Theme CSS injection logic: ~0.5KB
- Total: ~0.5KB (within budget)

### Phase 3: Bundle Optimization (Day 6)

**Goal:** Stay within 50KB bundle limit

**Tasks:**
1. Analyze bundle size with `rollup-plugin-visualizer`
2. Implement code-splitting for Prism.js
3. Lazy-load syntax highlighter on first code block
4. Tree-shake unused Prism.js features
5. Verify total bundle: <50KB gzipped

**Expected Final Bundle:**
- Main bundle: ~35KB (unchanged)
- Markdown chunk: ~7KB (markdown-it) + ~18KB (dompurify) = ~25KB
- **Prism chunk: ~6KB (lazy-loaded)** (NEW)
- **Total initial load: ~35KB** (within budget)
- **Total with markdown: ~41KB** (within budget)
- **Total with syntax highlighting: ~47KB** (within budget)

---

## Bundle Size Strategy

### Code Splitting Approach

```typescript
// widget/src/utils/syntax-highlighter.ts
// Use dynamic imports for Prism.js

class SyntaxHighlighter {
  private prism: any = null;

  async initialize() {
    if (!this.prism) {
      // Lazy-load Prism.js core
      this.prism = await import('prismjs');

      // Lazy-load core languages
      await import('prismjs/components/prism-javascript');
      await import('prismjs/components/prism-typescript');
      await import('prismjs/components/prism-python');
      await import('prismjs/components/prism-json');
      await import('prismjs/components/prism-bash');
    }
  }

  highlight(html: string): string {
    if (!this.prism) {
      // Not initialized yet - return unhighlighted HTML
      return html;
    }

    // Highlight code blocks...
  }
}
```

**Vite Configuration:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'markdown': ['markdown-it', 'isomorphic-dompurify'],
          'syntax': ['prismjs'],
        },
      },
    },
  },
});
```

**Result:**
- Main bundle: ~35KB (widget core)
- Markdown chunk: ~25KB (loaded when first message with markdown is received)
- Syntax chunk: ~6KB (loaded when first code block is encountered)

**Total initial load:** 35KB ✅ (within budget)

---

## Test Plan

### Test Coverage Categories

#### 1. Core Highlighting Tests (8 tests)

1. **test_highlight_javascript_code_block**
   - Input: HTML with `<code class="language-javascript">` block
   - Expected: Highlighted HTML with `<span class="token ..." >` tags

2. **test_highlight_typescript_code_block**
   - Input: TypeScript code block
   - Expected: Highlighted with TypeScript syntax

3. **test_highlight_python_code_block**
   - Input: Python code block
   - Expected: Highlighted with Python syntax

4. **test_highlight_json_code_block**
   - Input: JSON code block
   - Expected: Highlighted with JSON syntax

5. **test_highlight_bash_code_block**
   - Input: Bash/shell code block
   - Expected: Highlighted with Bash syntax

6. **test_preserve_non_code_html**
   - Input: HTML with code blocks AND regular content
   - Expected: Only code blocks highlighted, rest unchanged

7. **test_handle_unknown_language**
   - Input: `<code class="language-unknown">` block
   - Expected: Rendered as plaintext (no highlighting)

8. **test_handle_no_language_specified**
   - Input: `<code>` without class attribute
   - Expected: Rendered as plaintext (no highlighting)

#### 2. Configuration Tests (4 tests)

9. **test_respect_core_languages_config**
   - Config: Only include JavaScript
   - Input: JS code block
   - Expected: Highlighted
   - Input: Python code block
   - Expected: Not highlighted (language not loaded)

10. **test_respect_show_line_numbers_true**
    - Config: `showLineNumbers: true`
    - Expected: Line numbers rendered

11. **test_respect_show_line_numbers_false**
    - Config: `showLineNumbers: false`
    - Expected: No line numbers

12. **test_respect_fallback_language**
    - Config: `fallbackLanguage: 'plaintext'`
    - Input: Unknown language
    - Expected: Rendered as plaintext

#### 3. Theme System Tests (5 tests)

13. **test_set_theme_light**
    - Action: `setTheme('light')`
    - Expected: Light theme CSS injected

14. **test_set_theme_dark**
    - Action: `setTheme('dark')`
    - Expected: Dark theme CSS injected

15. **test_set_theme_auto_light**
    - Action: `setTheme('auto')` with light system theme
    - Expected: Light theme CSS injected

16. **test_set_theme_auto_dark**
    - Action: `setTheme('auto')` with dark system theme
    - Expected: Dark theme CSS injected

17. **test_theme_switch_removes_old_theme**
    - Action: Set light theme, then switch to dark
    - Expected: Old theme CSS removed, new theme injected

#### 4. Integration Tests (3 tests)

18. **test_markdown_renderer_integration**
    - Input: Markdown with code block
    - Expected: Rendered and highlighted HTML

19. **test_xss_sanitizer_integration**
    - Input: Code block with XSS attempt
    - Expected: XSS removed, code highlighted

20. **test_lazy_loading_initialization**
    - Action: Create highlighter without initialization
    - Expected: Returns unhighlighted HTML gracefully
    - Action: Initialize highlighter
    - Expected: Now highlights code

#### 5. Edge Cases (5 tests)

21. **test_empty_code_block**
    - Input: `<code class="language-javascript"></code>`
    - Expected: Empty highlighted block (no crash)

22. **test_very_long_code_block**
    - Input: Code block >10KB
    - Expected: Highlighted without performance issues

23. **test_multiple_code_blocks**
    - Input: HTML with 5 different code blocks
    - Expected: All highlighted correctly

24. **test_inline_code_not_highlighted**
    - Input: Inline `<code>` tags (no language class)
    - Expected: Not highlighted (only block code)

25. **test_special_characters_in_code**
    - Input: Code with unicode, emojis, HTML entities
    - Expected: Preserved and highlighted correctly

**Total Tests:** 25 RED tests

---

## Security Considerations

### XSS Prevention

**Critical:** Syntax highlighting must not introduce XSS vulnerabilities.

**Strategy:**
1. **Sanitize BEFORE highlighting** (not after)
   - XssSanitizer already allows `<span class="token-*">` tags
   - Highlighting only adds safe markup

2. **No user input in highlighting output**
   - Prism.js generates safe `<span>` tags
   - No user-controlled attributes in generated HTML

3. **Language name validation**
   - Validate language names against whitelist
   - Prevent code injection via language parameter

**Implementation:**
```typescript
highlight(html: string): string {
  // Find code blocks with language classes
  const codeBlockRegex = /<code class="language-(\w+)">(.*?)<\/code>/gs;

  return html.replace(codeBlockRegex, (match, language, code) => {
    // SECURITY: Validate language name (alphanumeric only)
    if (!/^[a-z0-9]+$/i.test(language)) {
      return match; // Return unhighlighted if invalid
    }

    // SECURITY: Check if language is loaded
    if (!this.isLanguageSupported(language)) {
      return match; // Return unhighlighted if not supported
    }

    // Safe to highlight (Prism.js generates safe HTML)
    const highlighted = Prism.highlight(code, Prism.languages[language], language);
    return `<code class="language-${language}">${highlighted}</code>`;
  });
}
```

### DoS Prevention

**Concern:** Very long code blocks could cause performance issues.

**Mitigations:**
1. **Length limit:** Skip highlighting for code blocks >50KB
2. **Timeout:** Abort highlighting after 100ms
3. **Debouncing:** Highlight code blocks asynchronously

**Implementation:**
```typescript
highlight(html: string): string {
  const MAX_CODE_LENGTH = 50 * 1024; // 50KB

  return html.replace(codeBlockRegex, (match, language, code) => {
    // PERFORMANCE: Skip highlighting for very long code
    if (code.length > MAX_CODE_LENGTH) {
      return match;
    }

    // Highlight normally...
  });
}
```

---

## Performance Targets

### Highlighting Performance

- **Small code block (<100 lines):** <1ms
- **Medium code block (100-500 lines):** <10ms
- **Large code block (500-1000 lines):** <50ms
- **Very large code block (>1000 lines):** Skip highlighting (fallback to plaintext)

### Bundle Size Targets

- **Main bundle:** 35KB (unchanged)
- **Markdown chunk:** 25KB (unchanged)
- **Syntax chunk:** <6KB (lazy-loaded)
- **Total initial load:** 35KB ✅
- **Total with all chunks:** <48KB ✅

### Memory Targets

- **Prism.js memory:** <5MB
- **Per code block:** <100KB
- **Total widget memory:** <20MB

---

## Risks & Mitigations

### Risk 1: Bundle Size Exceeds 50KB

**Probability:** Medium
**Impact:** High (violates core constraint)

**Mitigations:**
1. ✅ Use Prism.js (not Highlight.js) for smaller size
2. ✅ Lazy-load Prism.js as separate chunk
3. ✅ Include only core languages (5 total)
4. ✅ Use CDN for theme CSS
5. ✅ Tree-shake unused Prism.js features

### Risk 2: Integration Breaks MarkdownRenderer

**Probability:** Low
**Impact:** High (breaks existing functionality)

**Mitigations:**
1. ✅ Add syntax highlighting as optional feature (`enableSyntaxHighlighting: false` by default)
2. ✅ Extensive integration tests
3. ✅ Fallback to unhighlighted code if highlighter fails

### Risk 3: Performance Degradation on Mobile

**Probability:** Medium
**Impact:** Medium (poor UX on mobile devices)

**Mitigations:**
1. ✅ Lazy-load highlighter (only when needed)
2. ✅ Skip highlighting for very long code blocks
3. ✅ Benchmark on mobile devices (target: <50ms)

### Risk 4: Theme Conflicts with Widget Styles

**Probability:** Medium
**Impact:** Low (visual glitch, not functional)

**Mitigations:**
1. ✅ Use scoped CSS (namespace Prism.js classes)
2. ✅ Test with different widget themes
3. ✅ Provide theme override mechanism

---

## Alternative Approaches Considered

### Alternative 1: Server-Side Highlighting

**Approach:** Highlight code on server before sending to widget

**Pros:**
- ✅ Zero bundle size impact
- ✅ Faster initial load

**Cons:**
- ❌ Requires backend changes
- ❌ Not feasible for N8n webhook responses
- ❌ Latency overhead (RTT for highlighting)

**Verdict:** Not feasible for this architecture.

### Alternative 2: No Syntax Highlighting

**Approach:** Skip syntax highlighting entirely

**Pros:**
- ✅ Zero bundle size impact
- ✅ Simpler implementation

**Cons:**
- ❌ Poor developer experience
- ❌ Competitive disadvantage (most chat widgets have highlighting)
- ❌ Reduced readability for code-heavy conversations

**Verdict:** Not acceptable for MVP (syntax highlighting is expected).

### Alternative 3: Use Highlight.js

**Approach:** Use Highlight.js instead of Prism.js

**Pros:**
- ✅ Auto language detection
- ✅ Slightly better language support

**Cons:**
- ❌ 7KB core (vs 2KB for Prism.js)
- ❌ Less modular (harder to tree-shake)
- ❌ Would exceed bundle budget

**Verdict:** Prism.js is better fit for bundle constraints.

---

## Success Criteria

### Functional Requirements

- ✅ Highlight code blocks in markdown messages
- ✅ Support 5 core languages (JS, TS, Python, JSON, Bash)
- ✅ Support light/dark/auto themes
- ✅ Graceful fallback for unknown languages
- ✅ Integration with MarkdownRenderer
- ✅ No XSS vulnerabilities introduced

### Non-Functional Requirements

- ✅ Total bundle size: <50KB gzipped
- ✅ Highlighting performance: <10ms per code block
- ✅ Initial load: <100ms (lazy-loading)
- ✅ Test coverage: 100% (25/25 tests passing)
- ✅ Documentation: Comprehensive inline docs

### Quality Gates

- ✅ All RED tests passing (25/25)
- ✅ Bundle size verified: <50KB
- ✅ Performance benchmarked: <10ms per block
- ✅ Security audit: No XSS vulnerabilities
- ✅ Integration tests: MarkdownRenderer + SyntaxHighlighter work together
- ✅ Code review: Approved by reviewer agent

---

## Implementation Brief (for TDD/QA Lead Agent)

### Target Files

**Production Code:**
- `widget/src/utils/syntax-highlighter.ts` (~150 lines)

**Test Code:**
- `tests/widget/utils/syntax-highlighter.test.ts` (~600 lines, 25 tests)

**Integration Updates:**
- `widget/src/utils/markdown-renderer.ts` (add highlighter integration, ~20 lines added)
- `tests/widget/utils/markdown-renderer.test.ts` (add integration tests, ~100 lines added)

### Test Structure

```typescript
// tests/widget/utils/syntax-highlighter.test.ts

/**
 * @vitest-environment jsdom
 *
 * RED Tests for Syntax Highlighter
 *
 * WHY THESE TESTS WILL FAIL:
 * - Production module does not exist yet (widget/src/utils/syntax-highlighter.ts)
 * - SyntaxHighlighter class is not implemented
 * - SyntaxHighlighterConfig interface is not defined
 * - prismjs library is not installed
 * - This is the RED phase of TDD
 */

describe('SyntaxHighlighter - Core Highlighting', () => {
  // 8 core tests...
});

describe('SyntaxHighlighter - Configuration', () => {
  // 4 config tests...
});

describe('SyntaxHighlighter - Theme System', () => {
  // 5 theme tests...
});

describe('SyntaxHighlighter - Integration', () => {
  // 3 integration tests...
});

describe('SyntaxHighlighter - Edge Cases', () => {
  // 5 edge case tests...
});
```

### Dependencies to Install

```bash
# Production dependency
pnpm add prismjs

# Dev dependencies (types)
pnpm add -D @types/prismjs
```

---

## Next Steps

### Step 1: Planning Complete (This Document)

**Status:** ✅ COMPLETE
**Agent:** Architect/Planner

### Step 2: Write RED Tests

**Agent:** TDD/QA Lead
**Task:** Write 25 comprehensive RED tests for SyntaxHighlighter
**Deliverable:** `tests/widget/utils/syntax-highlighter.test.ts`

### Step 3: Implement Production Code (GREEN)

**Agent:** Implementer
**Task:** Implement SyntaxHighlighter to pass all 25 RED tests
**Deliverable:** `widget/src/utils/syntax-highlighter.ts`

### Step 4: Integration

**Agent:** Implementer
**Task:** Integrate SyntaxHighlighter with MarkdownRenderer
**Deliverable:** Updated `widget/src/utils/markdown-renderer.ts`

### Step 5: Bundle Analysis

**Agent:** Implementer
**Task:** Verify bundle size <50KB and optimize if needed
**Deliverable:** Bundle size report

### Step 6: Documentation

**Agent:** Docs/Changelog
**Task:** Document module and update changelog
**Deliverable:** `docs/modules/WEEK_4_DAY_5-6_SYNTAX_HIGHLIGHTER.md`

---

## References

### Documentation

- **Prism.js Official Docs:** https://prismjs.com/
- **Prism.js GitHub:** https://github.com/PrismJS/prism
- **Prism.js Languages:** https://prismjs.com/#supported-languages
- **Prism.js Themes:** https://github.com/PrismJS/prism-themes

### Related Modules

- **XSS Sanitizer:** `docs/modules/WEEK_4_DAY_1-2_XSS_SANITIZER.md`
- **Markdown Renderer:** `docs/modules/WEEK_4_DAY_3-4_MARKDOWN_RENDERER.md`

### Architecture Documents

- **Architecture.md:** Main architecture document
- **PLAN.md:** 12-week implementation plan
- **TODO.md:** Task checklist

---

## Conclusion

This plan provides a comprehensive roadmap for implementing a production-ready Syntax Highlighter that:

1. ✅ Stays within 50KB bundle size limit (using lazy-loading)
2. ✅ Integrates seamlessly with MarkdownRenderer
3. ✅ Supports 5 core languages + lazy-loaded extensions
4. ✅ Provides light/dark/auto theme support
5. ✅ Maintains security (no XSS vulnerabilities)
6. ✅ Delivers excellent performance (<10ms per code block)

**Next Action:** Hand off to TDD/QA Lead agent to write 25 RED tests.

---

**Status:** ✅ Planning Phase COMPLETE
**Ready for:** RED Phase (TDD/QA Lead Agent)
**Date:** 2025-11-12
