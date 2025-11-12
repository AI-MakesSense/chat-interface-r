# Markdown Renderer - GREEN Implementation Guide

**Quick Reference for Implementer (GREEN Phase)**

---

## Status

🔴 **RED Phase Complete** (27 tests written and failing)
🟢 **GREEN Phase Ready** (implement minimal code to pass tests)

---

## Quick Start

### 1. Install Dependencies

```bash
cd "C:\Projects\Chat Interfacer\n8n-widget-designer"
npm install markdown-it @types/markdown-it
```

### 2. Create Production File

**File:** `widget/src/utils/markdown-renderer.ts`

**Location:** `C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\utils\markdown-renderer.ts`

### 3. Run Tests

```bash
npm test tests/widget/utils/markdown-renderer.test.ts
```

**Current:** 0 tests run (import error)
**Goal:** 27 tests passing

---

## Required Interface

### MarkdownConfig Interface

```typescript
export interface MarkdownConfig {
  enableTables: boolean;
  enableCodeBlocks: boolean;
  enableBlockquotes: boolean;
  enableLinks: boolean;
  enableImages: boolean;
  enableLineBreaks: boolean;
  maxNesting: number; // Default: 20
}
```

### MarkdownRenderer Class

```typescript
export class MarkdownRenderer {
  constructor(config: MarkdownConfig);

  render(markdown: string): string;

  // Optional (bonus tests)
  static async initialize(): Promise<void>;
  static getInstance(config: MarkdownConfig): MarkdownRenderer;
}
```

---

## Implementation Checklist

### Core Functionality (Required for GREEN)

- [ ] **Import markdown-it**
  ```typescript
  import MarkdownIt from 'markdown-it';
  ```

- [ ] **Import XssSanitizer**
  ```typescript
  import { XssSanitizer } from './xss-sanitizer';
  ```

- [ ] **Configure markdown-it with MarkdownConfig**
  - Enable/disable tables
  - Enable/disable code blocks
  - Enable/disable blockquotes
  - Enable/disable links
  - Enable/disable images
  - Enable/disable line breaks

- [ ] **Implement render() method**
  1. Parse markdown with markdown-it
  2. Sanitize HTML with XssSanitizer.MARKDOWN_PRESET
  3. Return safe HTML

- [ ] **Handle edge cases**
  - Empty string input → return ""
  - Unicode/emoji characters
  - HTML entities
  - Very long markdown (>10KB)

- [ ] **Enforce maxNesting limit**
  - Prevent DoS via deeply nested markdown
  - Use markdown-it options or post-processing

### Optional Enhancements (Bonus)

- [ ] **Singleton pattern**
  ```typescript
  static getInstance(config: MarkdownConfig): MarkdownRenderer
  ```

- [ ] **Async initialization**
  ```typescript
  static async initialize(): Promise<void>
  ```

- [ ] **Inline documentation**
  - File-level purpose comment
  - Function-level JSDoc comments

---

## markdown-it Configuration Example

```typescript
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true, // Allow HTML (will be sanitized)
  linkify: config.enableLinks,
  breaks: config.enableLineBreaks,
  typographer: true,
});

// Disable features based on config
if (!config.enableTables) {
  md.disable('table');
}
if (!config.enableCodeBlocks) {
  md.disable('fence');
  md.disable('code');
}
if (!config.enableBlockquotes) {
  md.disable('blockquote');
}
if (!config.enableLinks) {
  md.disable('link');
}
if (!config.enableImages) {
  md.disable('image');
}

// Render markdown
const html = md.render(markdown);
```

---

## XssSanitizer Integration

```typescript
import { XssSanitizer } from './xss-sanitizer';

export class MarkdownRenderer {
  private sanitizer: XssSanitizer;

  constructor(config: MarkdownConfig) {
    // Use MARKDOWN_PRESET for sanitization
    this.sanitizer = new XssSanitizer(XssSanitizer.MARKDOWN_PRESET);
  }

  render(markdown: string): string {
    if (!markdown || markdown.trim() === '') {
      return '';
    }

    // 1. Parse markdown to HTML
    const html = this.markdownIt.render(markdown);

    // 2. Sanitize HTML (critical for security!)
    const safeHtml = this.sanitizer.sanitize(html);

    return safeHtml;
  }
}
```

---

## Test Categories

### 1. Basic Markdown (8 tests)
- Headings (h1-h6)
- Paragraphs with line breaks
- Bold/italic/strikethrough
- Inline code
- Code blocks with language
- Unordered lists
- Ordered lists
- Nested lists

### 2. Configuration Respect (6 tests)
- enableTables = false
- enableCodeBlocks = false
- enableBlockquotes = false
- enableLinks = false
- enableImages = false
- enableLineBreaks = false

### 3. XSS Integration (5 tests)
- Strip script tags
- Strip javascript: URLs
- Preserve safe HTML
- Handle nested XSS
- Sanitize after parsing

### 4. Edge Cases (6 tests)
- Empty string
- Very long markdown (>10KB)
- Deeply nested (maxNesting)
- Code block isolation
- Unicode/emojis
- HTML entities

### 5. Bonus (2 tests)
- getInstance singleton
- initialize async

---

## Common Pitfalls to Avoid

### ❌ DON'T: Sanitize before parsing

```typescript
// WRONG - sanitizes markdown syntax
const safeMarkdown = sanitizer.sanitize(markdown);
const html = md.render(safeMarkdown); // Broken markdown
```

### ✅ DO: Parse then sanitize

```typescript
// CORRECT - parse markdown first, then sanitize HTML
const html = md.render(markdown);
const safeHtml = sanitizer.sanitize(html);
```

### ❌ DON'T: Allow all HTML without sanitization

```typescript
// WRONG - XSS vulnerability
return md.render(markdown); // Unsafe!
```

### ✅ DO: Always sanitize output

```typescript
// CORRECT - safe HTML
const html = md.render(markdown);
return sanitizer.sanitize(html); // Safe
```

### ❌ DON'T: Ignore maxNesting limit

```typescript
// WRONG - DoS vulnerability
const md = new MarkdownIt(); // Unlimited nesting
```

### ✅ DO: Enforce maxNesting

```typescript
// CORRECT - prevent DoS
const md = new MarkdownIt({
  maxNesting: config.maxNesting || 20,
});
```

---

## File Template

```typescript
/**
 * Markdown Renderer
 *
 * Purpose: Transform markdown text to safe HTML
 *
 * Responsibility:
 * - Parse markdown syntax using markdown-it
 * - Sanitize HTML output using XssSanitizer
 * - Enforce configuration-based feature toggles
 * - Prevent XSS attacks and markdown DoS
 *
 * Assumptions:
 * - markdown-it is installed and available
 * - XssSanitizer is implemented and tested
 * - User input is potentially malicious
 */

import MarkdownIt from 'markdown-it';
import { XssSanitizer } from './xss-sanitizer';

/**
 * Markdown renderer configuration
 */
export interface MarkdownConfig {
  /** Enable table rendering */
  enableTables: boolean;
  /** Enable code block rendering */
  enableCodeBlocks: boolean;
  /** Enable blockquote rendering */
  enableBlockquotes: boolean;
  /** Enable link rendering */
  enableLinks: boolean;
  /** Enable image rendering */
  enableImages: boolean;
  /** Enable line breaks (two spaces + newline) */
  enableLineBreaks: boolean;
  /** Maximum nesting depth (prevent DoS) */
  maxNesting: number;
}

/**
 * Markdown to HTML renderer with XSS protection
 */
export class MarkdownRenderer {
  private config: MarkdownConfig;
  private markdownIt: MarkdownIt;
  private sanitizer: XssSanitizer;

  /**
   * Creates a new Markdown Renderer
   *
   * @param config - Markdown configuration
   */
  constructor(config: MarkdownConfig) {
    this.config = config;

    // TODO: Configure markdown-it
    // TODO: Initialize XssSanitizer with MARKDOWN_PRESET
  }

  /**
   * Renders markdown to safe HTML
   *
   * @param markdown - Markdown text (potentially malicious)
   * @returns Safe HTML string
   *
   * @example
   * const renderer = new MarkdownRenderer({ enableTables: true, ... });
   * const html = renderer.render('# Hello **World**');
   * // Returns: '<h1>Hello <strong>World</strong></h1>'
   */
  render(markdown: string): string {
    // TODO: Implement
    return '';
  }

  /**
   * Lazy loads markdown-it library (optional)
   */
  static async initialize(): Promise<void> {
    // TODO: Implement lazy loading
  }

  /**
   * Gets singleton instance (optional)
   */
  static getInstance(config: MarkdownConfig): MarkdownRenderer {
    // TODO: Implement singleton pattern
    return new MarkdownRenderer(config);
  }
}
```

---

## Verification Steps

### Step 1: Run Tests
```bash
npm test tests/widget/utils/markdown-renderer.test.ts
```

### Step 2: Check Coverage
All 27 tests should pass:
- ✅ 8 basic markdown tests
- ✅ 6 configuration tests
- ✅ 5 XSS integration tests
- ✅ 6 edge case tests
- ✅ 2 bonus tests (optional)

### Step 3: Verify Output
```bash
npm test -- --reporter=verbose
```

Expected output:
```
✓ should render all heading levels (h1-h6)
✓ should render paragraphs with line breaks
✓ should render bold, italic, and strikethrough text
... (27 total)

Test Files  1 passed (1)
Tests  27 passed (27)
Duration  < 1s
```

---

## Dependencies

### Required
- **markdown-it** (markdown parser)
- **@types/markdown-it** (TypeScript types)
- **XssSanitizer** (already implemented, in same directory)

### Install Command
```bash
npm install markdown-it @types/markdown-it
```

---

## Reference Files

### Test File
**Path:** `tests/widget/utils/markdown-renderer.test.ts`
**Lines:** 709
**Tests:** 27

### XSS Sanitizer (Already Implemented)
**Path:** `widget/src/utils/xss-sanitizer.ts`
**Status:** ✅ GREEN (21/21 tests passing)
**Import:** `import { XssSanitizer } from './xss-sanitizer';`

### Detailed Report
**Path:** `MARKDOWN_RENDERER_RED_TESTS_REPORT.md`
**Content:** Complete test breakdown and implementation requirements

---

## Success Criteria

### GREEN Phase Complete When:

1. ✅ All 27 tests passing
2. ✅ No test skips or .only() usage
3. ✅ Minimal implementation (no over-engineering)
4. ✅ XSS protection verified
5. ✅ Configuration toggles working
6. ✅ Edge cases handled

### Then Move to REFACTOR Phase:

- Optimize performance
- Add caching/memoization
- Implement singleton (if not done)
- Add inline documentation
- Extract helper functions
- Run performance benchmarks

---

## Questions to Ask Before Implementation

1. **Should we cache markdown-it instances per config?**
   - Same config = reuse instance
   - Performance optimization

2. **Should maxNesting be enforced in markdown-it or post-processing?**
   - markdown-it has `maxNesting` option
   - Or manually truncate nested elements

3. **Should we lazy-load markdown-it to reduce bundle size?**
   - Use dynamic import() for widget
   - Pre-load in platform

4. **Should enableLinks/enableImages affect sanitization or parsing?**
   - Option A: Disable in markdown-it (don't parse)
   - Option B: Parse but strip in sanitizer

---

## Minimal Implementation Strategy

### Phase 1: Basic Rendering (Get 8 tests passing)
1. Install markdown-it
2. Create MarkdownConfig interface
3. Create MarkdownRenderer class
4. Implement basic render() with default config
5. Run tests → see 8 basic tests pass

### Phase 2: XSS Integration (Get +5 tests passing)
1. Import XssSanitizer
2. Apply sanitization after markdown parsing
3. Run tests → see XSS tests pass

### Phase 3: Configuration (Get +6 tests passing)
1. Implement feature toggles (disable markdown-it rules)
2. Run tests → see config tests pass

### Phase 4: Edge Cases (Get +6 tests passing)
1. Handle empty input
2. Enforce maxNesting
3. Preserve code blocks
4. Run tests → see edge case tests pass

### Phase 5: Bonus (Get +2 tests passing - optional)
1. Implement getInstance singleton
2. Implement initialize async
3. Run tests → all 27 passing

---

## Ready to Implement!

🔴 **RED Phase:** Complete ✅
🟢 **GREEN Phase:** Ready to start
♻️ **REFACTOR Phase:** After GREEN

**Next Action:** Create `widget/src/utils/markdown-renderer.ts` and implement minimal code to pass all 27 tests.

---

**Guide Version:** 1.0
**Date:** 2025-11-12
**Author:** Claude Code (TDD/QA Lead)
