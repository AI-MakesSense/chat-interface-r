# Performance Optimization - RED Tests Complete

**Date:** 2025-11-12
**Agent:** TDD/QA Lead
**Phase:** RED (Tests Written, Production Code Not Implemented)
**Status:** ✅ COMPLETE - Ready for Implementer Agent

---

## Executive Summary

Comprehensive RED tests have been written for Week 4 Day 7-8 performance optimization modules. All tests are **intentionally failing** because production code does not exist yet. This follows strict TDD methodology: RED → GREEN → REFACTOR.

**Test Count:** 14 tests (6 lazy loading + 8 caching)
**Test Lines:** 759 lines total
**Production Modules:** 0 (not implemented yet)

---

## Test Files Created

### 1. Lazy Loading Tests ✅

**File:** `tests/widget/performance/lazy-loading.test.ts`
**Lines:** 297 lines
**Tests:** 6 core tests + 2 bonus tests = 8 total

**Core Tests (6):**
1. ✅ Should dynamically import markdown-it only when requested
2. ✅ Should dynamically import Prism.js only when requested
3. ✅ Should return same instance on subsequent calls (singleton pattern)
4. ✅ Should handle import failures gracefully
5. ✅ Should not block main thread during imports
6. ✅ Should reduce initial bundle size by creating separate chunks

**Bonus Tests (2):**
7. ✅ Should handle concurrent loads without race conditions
8. ✅ Should track loading state with isLoaded method

**Production Module (Not Implemented):**
- `widget/src/utils/lazy-loader.ts` (does not exist yet)

**Expected Interface:**
```typescript
export class LazyLoader {
  static async getMarkdownIt(): Promise<MarkdownIt>;
  static async getPrismJs(): Promise<typeof Prism>;
  static isLoaded(moduleName: string): boolean;
  static reset(): void;  // For testing
}
```

---

### 2. Markdown Cache Tests ✅

**File:** `tests/widget/performance/markdown-cache.test.ts`
**Lines:** 462 lines
**Tests:** 8 core tests + 5 bonus tests = 13 total

**Core Tests (8):**
1. ✅ Should cache markdown render results
2. ✅ Should return cached result on subsequent calls
3. ✅ Should respect maxEntries and evict least recently used (LRU)
4. ✅ Should evict entries after TTL expires
5. ✅ Should handle cache key collisions correctly
6. ✅ Should clear all cached entries
7. ✅ Should track cache hit/miss statistics
8. ✅ Should not cache results larger than size limit

**Bonus Tests (5):**
9. ✅ Should evict entries when memory limit is reached
10. ✅ Should update access count for LRU tracking
11. ✅ Should generate consistent hash keys for same markdown
12. ✅ Should provide fast cache hits (<1ms)

**Production Module (Not Implemented):**
- `widget/src/utils/markdown-cache.ts` (does not exist yet)

**Expected Interface:**
```typescript
export interface CacheConfig {
  maxEntries: number;      // 100
  maxMemory: number;       // 10MB
  ttl: number;            // 5 minutes
}

export interface CacheEntry {
  html: string;
  timestamp: number;
  accessCount: number;
  size: number;
}

export class MarkdownCache {
  constructor(config: CacheConfig);

  get(markdown: string): string | null;
  set(markdown: string, html: string): void;
  clear(): void;
  getStats(): CacheStats;

  private evictLRU(neededSize: number): void;
  private hashKey(markdown: string): string;
}
```

---

## Test Environment

All tests use **JSDOM environment** for DOM API compatibility:

```typescript
/**
 * @vitest-environment jsdom
 */
```

**Key Testing Patterns:**

1. **AAA Pattern:** Arrange, Act, Assert
2. **Performance Measurement:** Uses `performance.now()` for timing
3. **Fake Timers:** Uses `vi.useFakeTimers()` for TTL testing
4. **Mock Imports:** Uses `vi.spyOn()` for dynamic import tracking
5. **Comprehensive Documentation:** Every test has inline comments explaining behavior

---

## Why Tests Are Failing (RED Phase)

### Lazy Loading Tests Fail Because:
1. ❌ `LazyLoader` class does not exist
2. ❌ `getMarkdownIt()` method not implemented
3. ❌ `getPrismJs()` method not implemented
4. ❌ Singleton pattern not implemented
5. ❌ Error handling not implemented
6. ❌ Bundle splitting not configured

### Markdown Cache Tests Fail Because:
1. ❌ `MarkdownCache` class does not exist
2. ❌ `CacheConfig` interface not defined
3. ❌ `CacheEntry` interface not defined
4. ❌ `get()` and `set()` methods not implemented
5. ❌ LRU eviction algorithm not implemented
6. ❌ TTL expiration logic not implemented
7. ❌ Memory limit enforcement not implemented
8. ❌ Statistics tracking not implemented

**This is expected and correct behavior for TDD RED phase.**

---

## Performance Targets

### Bundle Size Targets
| Metric | Current | Target | Test Verification |
|--------|---------|--------|-------------------|
| Initial bundle | 48KB | <35KB (17KB ideal) | Bundle size tests |
| Markdown chunk | N/A | <25KB | Dynamic import verification |
| Syntax chunk | N/A | <6KB | Dynamic import verification |
| Total size | 48KB | <50KB | Sum of all chunks |

### Rendering Performance Targets
| Metric | Current | Target | Test Verification |
|--------|---------|--------|-------------------|
| Cache hit | N/A | <1ms | Performance timing in tests |
| Cache miss | 25ms | <50ms | Performance timing in tests |
| Lazy load | N/A | <100ms | Dynamic import timing |
| Cache hit rate | 0% | >60% | Statistics tracking |

### Memory Targets
| Metric | Current | Target | Test Verification |
|--------|---------|--------|-------------------|
| Widget memory | 5MB | <10MB | Memory monitoring tests |
| Cache size | 0 | <100 entries | LRU eviction tests |
| Memory leaks | Unknown | 0 | Stress test (future) |

---

## Test Documentation

Each test file includes comprehensive documentation:

### File-Level Documentation
- Module purpose and responsibilities
- Why tests will fail (RED phase explanation)
- Complete test coverage breakdown
- Performance goals and targets
- Expected interfaces and types

### Test-Level Documentation
- Clear test description
- AAA pattern (Arrange, Act, Assert) with comments
- Expected behavior explanation
- Performance assertions where applicable

### Example Test Pattern
```typescript
// ============================================================
// Test 1: Cache markdown render results
// WHY IT WILL FAIL: MarkdownCache.set does not exist yet
// ============================================================

it('should cache markdown render results', () => {
  // ARRANGE
  const markdown = '**Hello World**';
  const html = '<p><strong>Hello World</strong></p>';

  // ACT
  cache.set(markdown, html);

  // ASSERT
  const cached = cache.get(markdown);
  expect(cached).toBe(html);
  expect(cached).not.toBeNull();
});
```

---

## Next Steps for Implementer Agent

### Phase 1: Lazy Loading Implementation (Day 7 AM)

**Create:** `widget/src/utils/lazy-loader.ts` (~150 lines)

**Requirements:**
1. Implement `getMarkdownIt()` with dynamic import
2. Implement `getPrismJs()` with dynamic import
3. Add singleton pattern to cache loaded modules
4. Add error handling with retry logic (3 attempts)
5. Add timeout handling (10 seconds)
6. Add `isLoaded()` state tracking
7. Add `reset()` for testing

**Success Criteria:**
- ✅ All 8 lazy loading tests pass (GREEN)
- ✅ Dynamic imports create separate chunks
- ✅ No race conditions in concurrent loads
- ✅ Error handling prevents crashes

---

### Phase 2: Caching Implementation (Day 7 PM)

**Create:** `widget/src/utils/markdown-cache.ts` (~200 lines)

**Requirements:**
1. Implement `CacheConfig` interface
2. Implement `CacheEntry` interface
3. Implement `get()` method with TTL checking
4. Implement `set()` method with size tracking
5. Implement LRU eviction algorithm
6. Implement memory limit enforcement
7. Implement `getStats()` for hit/miss tracking
8. Implement `clear()` method
9. Implement `hashKey()` for consistent cache keys

**Success Criteria:**
- ✅ All 13 markdown cache tests pass (GREEN)
- ✅ LRU eviction works correctly
- ✅ TTL expiration works correctly
- ✅ Memory limit enforced (<10MB)
- ✅ Cache hit rate >60% in real usage
- ✅ Cache hit time <1ms

---

## Integration Requirements

### Update Vite Configuration

**File:** `widget/vite.config.ts`

**Add manual chunk splitting:**
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('dompurify') || id.includes('markdown-it')) {
            return 'markdown';
          }
          if (id.includes('prismjs')) {
            return 'syntax';
          }
          return 'main';
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        dead_code: true,
        passes: 2,
      },
      mangle: { toplevel: true },
    },
    target: 'es2020',
    sourcemap: true,
  },
});
```

---

### Integration with Markdown Renderer

**After both modules are GREEN**, create integration layer:

**File:** `widget/src/utils/markdown-loader.ts` (NEW)

```typescript
import { MarkdownCache } from './markdown-cache';
import { LazyLoader } from './lazy-loader';

export class MarkdownLoader {
  private static cache = new MarkdownCache({
    maxEntries: 100,
    maxMemory: 10 * 1024 * 1024,
    ttl: 5 * 60 * 1000,
  });

  static async render(markdown: string, config: MarkdownConfig): Promise<string> {
    // Check cache first
    const cached = this.cache.get(markdown);
    if (cached) {
      return cached;  // Cache hit: <1ms
    }

    // Load markdown-it lazily
    const markdownIt = await LazyLoader.getMarkdownIt();

    // Render markdown
    const html = markdownIt.render(markdown);

    // Cache result
    this.cache.set(markdown, html);

    return html;
  }
}
```

---

## Verification Checklist

Before marking as GREEN, verify:

### Lazy Loading Module
- [ ] All 8 tests pass
- [ ] `getMarkdownIt()` returns MarkdownIt instance
- [ ] `getPrismJs()` returns Prism instance
- [ ] Singleton pattern prevents duplicate imports
- [ ] Error handling works with fallback
- [ ] No race conditions in concurrent loads
- [ ] `isLoaded()` tracks state correctly
- [ ] Dynamic imports create separate chunks in build

### Markdown Cache Module
- [ ] All 13 tests pass
- [ ] `get()` returns cached HTML
- [ ] `set()` stores HTML in cache
- [ ] LRU eviction works when maxEntries reached
- [ ] TTL eviction works after 5 minutes
- [ ] Memory limit enforced (<10MB)
- [ ] Cache statistics accurate (hits, misses, hit rate)
- [ ] `clear()` removes all entries
- [ ] Hash keys are consistent for same markdown
- [ ] Cache hit is <1ms

### Bundle Size
- [ ] Initial bundle <35KB (target: 17KB)
- [ ] Markdown chunk <25KB
- [ ] Syntax chunk <6KB
- [ ] Total bundle <50KB

### Performance
- [ ] Cache hit time <1ms (p95)
- [ ] Lazy load time <100ms (p95)
- [ ] Memory usage <10MB (p95)
- [ ] No memory leaks in stress test

---

## Related Documents

### Planning Documents
- **Full Plan:** `docs/modules/WEEK_4_DAY_7-8_PERFORMANCE_OPTIMIZATION_PLAN.md`
- **Implementation Brief:** `docs/planning/PERFORMANCE_OPTIMIZATION_IMPLEMENTATION_BRIEF.md`

### Architecture Documents
- **Architecture.md:** Performance requirements
- **decisions.md:** ADR-012, ADR-013, ADR-014

### Previous Modules
- **XSS Sanitizer:** `docs/modules/WEEK_4_DAY_1-2_XSS_SANITIZER.md`
- **Markdown Renderer:** `docs/modules/WEEK_4_DAY_3-4_MARKDOWN_RENDERER.md`
- **Syntax Highlighter:** `docs/modules/WEEK_4_DAY_5-6_SYNTAX_HIGHLIGHTER_PLAN.md`

---

## Files Created

### Test Files (759 lines)
1. ✅ `tests/widget/performance/lazy-loading.test.ts` (297 lines, 8 tests)
2. ✅ `tests/widget/performance/markdown-cache.test.ts` (462 lines, 13 tests)

### Production Files (Not Created Yet)
3. ❌ `widget/src/utils/lazy-loader.ts` (150 lines) - **For Implementer**
4. ❌ `widget/src/utils/markdown-cache.ts` (200 lines) - **For Implementer**

### Configuration (Not Updated Yet)
5. ❌ `widget/vite.config.ts` (code splitting config) - **For Implementer**

---

## Expected Test Results

### Current State (RED)
```
FAIL  tests/widget/performance/lazy-loading.test.ts
  ✗ Should dynamically import markdown-it only when requested
  ✗ Should dynamically import Prism.js only when requested
  ✗ Should return same instance on subsequent calls
  ✗ Should handle import failures gracefully
  ✗ Should not block main thread during imports
  ✗ Should reduce initial bundle size
  ✗ Should handle concurrent loads without race conditions
  ✗ Should track loading state with isLoaded method

FAIL  tests/widget/performance/markdown-cache.test.ts
  ✗ Should cache markdown render results
  ✗ Should return cached result on subsequent calls
  ✗ Should respect maxEntries and evict LRU
  ✗ Should evict entries after TTL expires
  ✗ Should handle cache key collisions
  ✗ Should clear all cached entries
  ✗ Should track cache hit/miss statistics
  ✗ Should not cache results larger than size limit
  ✗ Should evict entries when memory limit reached
  ✗ Should update access count for LRU tracking
  ✗ Should generate consistent hash keys
  ✗ Should provide fast cache hits (<1ms)

Tests:  21 failed (expected in RED phase)
```

### After Implementation (GREEN)
```
PASS  tests/widget/performance/lazy-loading.test.ts
  ✓ Should dynamically import markdown-it only when requested (50ms)
  ✓ Should dynamically import Prism.js only when requested (45ms)
  ✓ Should return same instance on subsequent calls (5ms)
  ✓ Should handle import failures gracefully (100ms)
  ✓ Should not block main thread during imports (15ms)
  ✓ Should reduce initial bundle size (10ms)
  ✓ Should handle concurrent loads without race conditions (80ms)
  ✓ Should track loading state with isLoaded method (8ms)

PASS  tests/widget/performance/markdown-cache.test.ts
  ✓ Should cache markdown render results (5ms)
  ✓ Should return cached result on subsequent calls (3ms)
  ✓ Should respect maxEntries and evict LRU (12ms)
  ✓ Should evict entries after TTL expires (1005ms)
  ✓ Should handle cache key collisions (8ms)
  ✓ Should clear all cached entries (6ms)
  ✓ Should track cache hit/miss statistics (10ms)
  ✓ Should not cache results larger than size limit (7ms)
  ✓ Should evict entries when memory limit reached (15ms)
  ✓ Should update access count for LRU tracking (11ms)
  ✓ Should generate consistent hash keys (4ms)
  ✓ Should provide fast cache hits (<1ms) (1ms)

Tests:  21 passed
Time:   ~1.5s
```

---

## Handoff to Implementer Agent

### Your Mission

Implement the **lazy-loader** and **markdown-cache** modules to make all 21 tests pass (GREEN).

### Your Input
- ✅ 21 failing RED tests (this is correct!)
- ✅ Comprehensive test documentation
- ✅ Expected interfaces and types
- ✅ Performance targets and constraints

### Your Output
- 🎯 `widget/src/utils/lazy-loader.ts` (150 lines)
- 🎯 `widget/src/utils/markdown-cache.ts` (200 lines)
- 🎯 Updated `widget/vite.config.ts` (code splitting)
- 🎯 All 21 tests GREEN
- 🎯 Bundle size <50KB verified
- 🎯 Performance targets met

### Success Criteria
- ✅ All 21 performance tests GREEN
- ✅ All 76 existing tests remain GREEN (no regressions)
- ✅ Initial bundle reduced to <35KB (64% reduction)
- ✅ Cache hit time <1ms (98% faster)
- ✅ Memory usage <10MB (no leaks)
- ✅ No race conditions in concurrent loads

### Implementation Order

**Phase 1 (4 hours):**
1. Implement `lazy-loader.ts` (singleton + dynamic imports)
2. Update `vite.config.ts` (code splitting)
3. Run lazy loading tests → All 8 should pass

**Phase 2 (4 hours):**
4. Implement `markdown-cache.ts` (LRU + TTL + stats)
5. Run cache tests → All 13 should pass
6. Verify bundle sizes and performance

---

## Notes for Implementer

### Lazy Loading Tips
- Use `import('markdown-it')` for dynamic imports
- Use `import('prismjs')` for dynamic imports
- Store loaded modules in static properties (singleton)
- Track in-flight promises to prevent race conditions
- Add retry logic with exponential backoff (3 attempts)
- Add timeout handling (10 seconds max)

### Caching Tips
- Use `Map<string, CacheEntry>` for cache storage
- Generate hash keys with simple algorithm (or use library)
- Track `accessCount` for LRU eviction
- Check TTL on every `get()` call
- Use `Blob` API to calculate size: `new Blob([html]).size`
- Evict LRU entries when `maxEntries` or `maxMemory` exceeded
- Track stats: `{ hits, misses, evictions, totalSize }`

### Performance Optimization
- Minimize overhead in hot paths (`get()` method)
- Use simple hash function (not crypto)
- Pre-calculate sizes when storing
- Keep eviction logic efficient (sort only when needed)
- Use `performance.now()` for accurate timing

---

**Status:** RED TESTS COMPLETE ✅
**Next Phase:** GREEN Implementation (Implementer Agent)
**Timeline:** Day 7 (8 hours total)

---

**Good luck implementing! Follow the tests closely—they define the exact behavior needed.**
