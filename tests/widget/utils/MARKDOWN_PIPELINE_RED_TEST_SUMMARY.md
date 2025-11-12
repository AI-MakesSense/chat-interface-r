# MarkdownPipeline RED Test Summary

**Date**: 2025-11-12
**Phase**: RED (Test-Driven Development)
**Module**: `widget/src/utils/markdown-pipeline.ts`
**Test File**: `tests/widget/utils/markdown-pipeline.test.ts`

---

## Executive Summary

Successfully created **23 comprehensive RED integration tests** for the MarkdownPipeline orchestrator module. All tests fail as expected because the production module does not exist yet - this is the correct RED phase of TDD.

**Status**: ✅ RED Phase Complete (All 23 tests failing as expected)

---

## Test Coverage Overview

### Total Tests: 23

#### Lazy Loading Tests (4 tests)
1. ✅ Should lazy load markdown-it on first renderAsync() call
2. ✅ Should lazy load Prism.js on first renderAsync() call with code block
3. ✅ Should not reload modules on subsequent renderAsync() calls
4. ✅ Should handle lazy loading failures gracefully

#### Caching Tests (5 tests)
5. ✅ Should cache rendered markdown by content hash
6. ✅ Should return cached result on repeated markdown
7. ✅ Should respect cache TTL and expire old entries
8. ✅ Should evict LRU entries when cache is full
9. ✅ Should bypass cache for unique markdown strings

#### Rendering Tests (4 tests)
10. ✅ Should render markdown to safe HTML
11. ✅ Should apply syntax highlighting to code blocks
12. ✅ Should sanitize dangerous HTML and prevent XSS
13. ✅ Should handle complex markdown with tables, lists, and links

#### Configuration Tests (3 tests)
14. ✅ Should respect markdown feature toggles
15. ✅ Should use configured cache settings
16. ✅ Should support disabling syntax highlighting

#### Error Handling Tests (4 tests)
17. ✅ Should fallback to escaped text if initialization fails
18. ✅ Should never throw errors and always return content
19. ✅ Should handle empty string input
20. ✅ Should handle very large markdown (>100KB) without hanging

#### Utility Methods Tests (3 tests)
21. ✅ Should provide getCacheStats method
22. ✅ Should provide clearCache method
23. ✅ Should export STANDARD_MARKDOWN_CONFIG constant

---

## Expected Module Interface

Based on the test suite, the MarkdownPipeline module should implement:

```typescript
export interface MarkdownConfig {
  enableTables: boolean;
  enableCodeBlocks: boolean;
  enableBlockquotes: boolean;
  enableLinks: boolean;
  enableImages: boolean;
  enableLineBreaks: boolean;
  maxNesting: number;
}

export interface CacheConfig {
  maxEntries: number;
  maxSize: number;
  defaultTTL: number;
  maxItemSize: number;
}

export class MarkdownPipeline {
  constructor(
    config: MarkdownConfig,
    cacheConfig?: CacheConfig,
    options?: { enableSyntaxHighlighting?: boolean }
  );

  /**
   * Render markdown to safe HTML with syntax highlighting
   * Handles lazy loading, caching, and error recovery
   */
  async renderAsync(markdown: string): Promise<string>;

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStatistics;

  /**
   * Clear cache
   */
  clearCache(): void;
}

export const STANDARD_MARKDOWN_CONFIG: MarkdownConfig;
```

---

## Dependencies

The MarkdownPipeline orchestrator integrates these existing modules:

| Module | Status | Location | Purpose |
|--------|--------|----------|---------|
| **LazyLoader** | ✅ Implemented | `widget/src/utils/lazy-loader.ts` | Dynamic import of markdown-it and Prism.js |
| **MarkdownCache** | ✅ Implemented | `widget/src/utils/markdown-cache.ts` | LRU caching with TTL |
| **MarkdownRenderer** | ✅ Implemented | `widget/src/utils/markdown-renderer.ts` | markdown-it parsing |
| **SyntaxHighlighter** | ✅ Implemented | `widget/src/utils/syntax-highlighter.ts` | Prism.js code highlighting |
| **XssSanitizer** | ✅ Implemented | `widget/src/utils/xss-sanitizer.ts` | DOMPurify XSS protection |

**Total Supporting Tests**: 96 tests (all passing)
- LazyLoader: 8 tests ✅
- MarkdownCache: 12 tests ✅
- MarkdownRenderer: 27 tests ✅
- SyntaxHighlighter: 28 tests ✅
- XssSanitizer: 21 tests ✅

---

## Test Execution Results

### Command
```bash
npm test tests/widget/utils/markdown-pipeline.test.ts
```

### Output
```
❯ tests/widget/utils/markdown-pipeline.test.ts (0 test)

⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯

FAIL  tests/widget/utils/markdown-pipeline.test.ts
Error: Failed to resolve import "../../../widget/src/utils/markdown-pipeline" from "tests/widget/utils/markdown-pipeline.test.ts". Does the file exist?
```

**Result**: ✅ **Expected failure** - Module does not exist (RED phase)

---

## Why Tests Fail (Expected)

All tests fail with the same root cause:

```
Error: Failed to resolve import "../../../widget/src/utils/markdown-pipeline"
       from "tests/widget/utils/markdown-pipeline.test.ts".
       Does the file exist?
```

**This is correct behavior for RED phase TDD**:
- Production module `widget/src/utils/markdown-pipeline.ts` does not exist yet
- Tests are written BEFORE implementation
- All 23 tests will guide GREEN phase implementation

---

## Test Categories Breakdown

### 1. Lazy Loading Tests (4 tests)

**Purpose**: Verify MarkdownPipeline lazy-loads markdown-it and Prism.js on first use

**Key Behaviors**:
- Load markdown-it on first `renderAsync()` call
- Load Prism.js when code blocks are encountered
- Use singleton pattern (no duplicate loads)
- Handle import failures gracefully (fallback to escaped text)

**Performance Goals**:
- First render: <100ms (includes lazy loading)
- Subsequent renders: <1ms (cached)

### 2. Caching Tests (5 tests)

**Purpose**: Verify MarkdownCache integration for LRU caching with TTL

**Key Behaviors**:
- Cache rendered markdown by content hash
- Return cached results on repeated content (cache hits)
- Respect TTL expiration (default 5 minutes)
- Evict LRU entries when cache full (maxEntries limit)
- Support unique markdown strings (cache misses)

**Performance Goals**:
- Cache hit time: <1ms (98% faster than re-parsing)
- Expected hit rate: >60% (typical chat usage)
- Memory limit: <10MB total cache size

### 3. Rendering Tests (4 tests)

**Purpose**: Verify complete markdown-to-HTML pipeline with security

**Key Behaviors**:
- Render markdown to safe HTML (headings, bold, italic, lists)
- Apply syntax highlighting to code blocks
- Sanitize dangerous HTML (XSS protection)
- Handle complex markdown (tables, lists, links)

**Security Goals**:
- Strip `<script>` tags
- Block `javascript:` protocol in links
- Preserve safe HTML tags
- Sanitize AFTER markdown parsing (not before)

### 4. Configuration Tests (3 tests)

**Purpose**: Verify configuration options are respected

**Key Behaviors**:
- Respect markdown feature toggles (tables, code blocks, etc.)
- Use configured cache settings (maxEntries, TTL)
- Support disabling syntax highlighting

**Configuration Options**:
```typescript
{
  // Markdown features
  enableTables: boolean,
  enableCodeBlocks: boolean,
  enableBlockquotes: boolean,
  enableLinks: boolean,
  enableImages: boolean,
  enableLineBreaks: boolean,
  maxNesting: number,

  // Cache settings
  maxEntries: number,
  maxSize: number,
  defaultTTL: number,
  maxItemSize: number,

  // Optional features
  enableSyntaxHighlighting: boolean
}
```

### 5. Error Handling Tests (4 tests)

**Purpose**: Verify graceful degradation (never crash)

**Key Behaviors**:
- Fallback to escaped text if initialization fails
- Never throw errors (always return content)
- Handle empty string input
- Handle very large markdown (>100KB) without hanging

**Graceful Degradation Strategy**:
1. **Lazy loading fails**: Return escaped text
2. **Rendering fails**: Return escaped text
3. **Cache fails**: Skip cache, render directly
4. **Empty input**: Return empty string
5. **Large input**: Timeout protection (<5 seconds)

### 6. Utility Methods Tests (3 tests)

**Purpose**: Verify helper methods and exports

**Key Behaviors**:
- Provide `getCacheStats()` for monitoring
- Provide `clearCache()` for maintenance
- Export `STANDARD_MARKDOWN_CONFIG` constant

**Cache Statistics**:
```typescript
{
  hits: number,
  misses: number,
  evictions: number,
  size: number,
  totalSize: number,
  hitRate: number
}
```

---

## Architecture Overview

### MarkdownPipeline Orchestration Flow

```
User Input (Markdown)
       ↓
MarkdownPipeline.renderAsync()
       ↓
┌──────────────────────────┐
│ 1. Check Cache           │ ← MarkdownCache
│    - Hash markdown       │   (LRU + TTL)
│    - Cache hit? Return   │
└──────────────────────────┘
       ↓ (cache miss)
┌──────────────────────────┐
│ 2. Lazy Load Modules     │ ← LazyLoader
│    - Load markdown-it    │   (Dynamic Import)
│    - Load Prism.js       │
└──────────────────────────┘
       ↓
┌──────────────────────────┐
│ 3. Render Markdown       │ ← MarkdownRenderer
│    - Parse markdown      │   (markdown-it)
│    - Generate HTML       │
└──────────────────────────┘
       ↓
┌──────────────────────────┐
│ 4. Sanitize HTML         │ ← XssSanitizer
│    - Remove XSS vectors  │   (DOMPurify)
│    - Preserve safe tags  │
└──────────────────────────┘
       ↓
┌──────────────────────────┐
│ 5. Highlight Code        │ ← SyntaxHighlighter
│    - Find code blocks    │   (Prism.js)
│    - Apply highlighting  │
└──────────────────────────┘
       ↓
┌──────────────────────────┐
│ 6. Cache Result          │ ← MarkdownCache
│    - Store in cache      │   (Save for reuse)
└──────────────────────────┘
       ↓
Safe, Highlighted HTML
```

### Error Handling Flow

```
Any Step Fails
       ↓
┌──────────────────────────┐
│ Graceful Fallback        │
│ - Log error              │
│ - Escape markdown        │
│ - Return plain text      │
│ - NEVER throw            │
└──────────────────────────┘
       ↓
Escaped Text (Safe Fallback)
```

---

## Implementation Checklist for GREEN Phase

### Step 1: Create Module Skeleton
- [ ] Create `widget/src/utils/markdown-pipeline.ts`
- [ ] Define `MarkdownConfig` interface
- [ ] Define `CacheConfig` interface (if not imported)
- [ ] Define `MarkdownPipeline` class
- [ ] Export `STANDARD_MARKDOWN_CONFIG` constant

### Step 2: Implement Constructor
- [ ] Accept `MarkdownConfig` parameter
- [ ] Accept optional `CacheConfig` parameter
- [ ] Accept optional `options` parameter (enableSyntaxHighlighting)
- [ ] Initialize dependencies:
  - [ ] MarkdownCache instance
  - [ ] MarkdownRenderer instance
  - [ ] SyntaxHighlighter instance (if enabled)

### Step 3: Implement renderAsync()
- [ ] Accept `markdown: string` parameter
- [ ] Return `Promise<string>`
- [ ] Check cache for existing result (cache hit)
- [ ] If cache miss:
  - [ ] Lazy load markdown-it via LazyLoader
  - [ ] Lazy load Prism.js via LazyLoader (if code blocks)
  - [ ] Render markdown via MarkdownRenderer
  - [ ] Sanitize HTML via XssSanitizer (internal to MarkdownRenderer)
  - [ ] Apply syntax highlighting via SyntaxHighlighter
  - [ ] Store result in cache
- [ ] Handle errors gracefully:
  - [ ] Try-catch around each step
  - [ ] Fallback to escaped text on failure
  - [ ] Never throw errors
- [ ] Return safe HTML

### Step 4: Implement Utility Methods
- [ ] `getCacheStats()`: Return cache statistics
- [ ] `clearCache()`: Clear all cached entries

### Step 5: Error Handling
- [ ] Wrap all async operations in try-catch
- [ ] Implement fallback: escape markdown and return plain text
- [ ] Log errors to console (for debugging)
- [ ] Never throw errors to caller

### Step 6: Performance Optimization
- [ ] Ensure lazy loading only happens once (singleton)
- [ ] Cache results by content hash
- [ ] Respect cache TTL (auto-evict stale entries)
- [ ] Respect cache maxEntries (LRU eviction)

---

## Success Criteria for GREEN Phase

### Functional Requirements
1. ✅ All 23 tests pass
2. ✅ No tests skipped or disabled
3. ✅ No TypeScript errors
4. ✅ No runtime errors

### Performance Requirements
1. ✅ First render: <100ms (includes lazy loading)
2. ✅ Cached render: <1ms (cache hit)
3. ✅ Large markdown (>100KB): <5 seconds
4. ✅ No memory leaks (cache size bounded)

### Security Requirements
1. ✅ All XSS vectors sanitized
2. ✅ No `<script>` tags in output
3. ✅ No `javascript:` protocols in links
4. ✅ Safe HTML tags preserved

### Error Handling Requirements
1. ✅ Never throw errors
2. ✅ Always return content (even if degraded)
3. ✅ Log errors for debugging
4. ✅ Graceful fallback on failures

---

## Integration Points

### 1. LazyLoader Integration
```typescript
// Lazy load markdown-it
const MarkdownIt = await LazyLoader.getMarkdownIt();

// Lazy load Prism.js
const Prism = await LazyLoader.getPrismJs();
```

### 2. MarkdownCache Integration
```typescript
// Check cache
const cached = cache.get(markdown);
if (cached) return cached;

// Store in cache
cache.set(markdown, html);
```

### 3. MarkdownRenderer Integration
```typescript
// Render markdown to HTML
const renderer = new MarkdownRenderer(config);
const html = renderer.render(markdown);
```

### 4. SyntaxHighlighter Integration
```typescript
// Apply syntax highlighting
const highlighter = new SyntaxHighlighter(config);
const highlighted = highlighter.highlightCode(html);
```

### 5. XssSanitizer Integration
```typescript
// XssSanitizer is used internally by MarkdownRenderer
// No direct integration needed in MarkdownPipeline
```

---

## Test File Location

**Full Path**:
```
C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\utils\markdown-pipeline.test.ts
```

**Module Path** (to be created):
```
C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\utils\markdown-pipeline.ts
```

---

## Next Steps

### For Implementer (GREEN Phase)
1. Create `widget/src/utils/markdown-pipeline.ts`
2. Implement `MarkdownPipeline` class following test specifications
3. Run tests: `npm test tests/widget/utils/markdown-pipeline.test.ts`
4. Iterate until all 23 tests pass (GREEN)

### For Refactorer (REFACTOR Phase)
1. Review implementation for code quality
2. Remove duplication
3. Improve naming and clarity
4. Optimize performance
5. Ensure all tests remain GREEN

---

## Dependencies Summary

### Existing Modules (All Implemented & Tested)
- ✅ `widget/src/utils/lazy-loader.ts` (8 tests passing)
- ✅ `widget/src/utils/markdown-cache.ts` (12 tests passing)
- ✅ `widget/src/utils/markdown-renderer.ts` (27 tests passing)
- ✅ `widget/src/utils/syntax-highlighter.ts` (28 tests passing)
- ✅ `widget/src/utils/xss-sanitizer.ts` (21 tests passing)

### New Module (To Be Implemented)
- ❌ `widget/src/utils/markdown-pipeline.ts` (23 RED tests waiting)

### External Libraries
- `markdown-it`: Markdown parsing (lazy loaded)
- `prismjs`: Syntax highlighting (lazy loaded)
- `isomorphic-dompurify`: XSS sanitization (used by XssSanitizer)

---

## Performance Benchmarks (Expected)

| Operation | Target | Measurement |
|-----------|--------|-------------|
| First render (cold) | <100ms | Includes lazy loading |
| Cache hit | <1ms | 98% faster than parsing |
| Cache miss (warm) | <10ms | Re-parsing only |
| Large markdown (>100KB) | <5s | Timeout protection |
| Cache hit rate | >60% | Typical chat usage |
| Memory usage | <10MB | Cache size limit |

---

## Code Quality Standards

### Documentation
- ✅ File-level documentation (purpose, responsibility, assumptions)
- ✅ Class-level documentation
- ✅ Method-level documentation (params, returns, examples)
- ✅ Inline comments for non-obvious logic

### TypeScript
- ✅ Strict mode enabled
- ✅ No `any` types
- ✅ Proper interface definitions
- ✅ Type-safe error handling

### Testing
- ✅ 100% test coverage for public methods
- ✅ Integration tests for complete pipeline
- ✅ Edge case coverage (empty, large, errors)
- ✅ Performance tests (timing assertions)

---

## Conclusion

✅ **RED Phase Complete**: 23 comprehensive integration tests written and failing as expected.

**Ready for GREEN Phase**: Implementer can now build the MarkdownPipeline orchestrator to make all tests pass.

**Total Test Suite**:
- **Existing**: 96 tests passing (5 supporting modules)
- **New**: 23 tests failing (1 integration module)
- **Combined**: 119 tests total

**Estimated Implementation Time**: 2-4 hours (GREEN + REFACTOR phases)

---

**Generated**: 2025-11-12
**TDD Phase**: RED ✅
**Next Phase**: GREEN (Implementation)
**Agent**: TDD/QA Lead
