# Performance Optimization - Implementation Brief
**Week 4, Day 7-8**

**Date:** 2025-11-12
**Phase:** Implementation Brief (for TDD/QA Lead → Implementer)
**Full Plan:** `docs/modules/WEEK_4_DAY_7-8_PERFORMANCE_OPTIMIZATION_PLAN.md`

---

## Quick Summary

Optimize the completed markdown rendering system through **lazy loading**, **LRU caching**, **code splitting**, and **memory management** to reduce the initial bundle from 48KB to 17KB while improving rendering performance by 98% for cached content.

---

## Critical Constraints

1. **Bundle Size:** Initial bundle must be <35KB (target: 17KB)
2. **Total Size:** Combined chunks must stay <50KB
3. **Performance:** Cache hit must be <1ms, miss <50ms
4. **Memory:** Total widget memory must stay <10MB
5. **Compatibility:** All 76 existing tests must remain GREEN

---

## Architecture Overview

### Current State (Before Optimization)

```
chat-widget.iife.js (48.23 KB)
├── Widget Core: 17KB
├── DOMPurify: 18KB
├── markdown-it: 7KB
└── Prism.js: 6KB

Performance:
├── Initial load: 48KB (slow)
├── Render time: 25ms (no caching)
└── Memory: 5MB (no cache)
```

### Target State (After Optimization)

```
main.js (17KB) - Instant load
markdown.js (25KB) - Lazy-loaded on first message
syntax.js (6KB) - Lazy-loaded on first code block

Performance:
├── Initial load: 17KB (64% faster!)
├── Cache hit: <1ms (98% faster!)
├── Cache miss: 25ms (same)
└── Memory: 10MB (with cache)
```

---

## Implementation Phases

### Phase 1: Lazy Loading (Day 7 AM)

**Goal:** Reduce initial bundle to 17KB

**Create:**
1. `widget/src/utils/markdown-loader.ts` (~150 lines)

**Key Features:**
- Dynamic import of markdown modules
- Singleton pattern for loaded renderer
- In-flight promise deduplication
- Error handling with fallback

**Interface:**

```typescript
export class MarkdownLoader {
  private static markdownRenderer: MarkdownRenderer | null = null;
  private static loading: Promise<MarkdownRenderer> | null = null;

  static async loadRenderer(config: MarkdownConfig): Promise<MarkdownRenderer>;
  static async render(markdown: string, config: MarkdownConfig): Promise<string>;
  static isLoaded(): boolean;
  static reset(): void;  // For testing
}
```

**Tests:** 6 lazy loading tests
- Test lazy load on first call
- Test cached loader on second call
- Test concurrent loads (no race conditions)
- Test load failure handling
- Test timeout handling
- Test memory cleanup

---

### Phase 2: Caching (Day 7 PM)

**Goal:** Reduce render time from 25ms to <1ms for cached content

**Create:**
1. `widget/src/utils/markdown-cache.ts` (~200 lines)

**Key Features:**
- LRU eviction strategy
- TTL (5 minutes) for stale entries
- Memory limit (10MB) enforcement
- Hit/miss statistics tracking

**Interface:**

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

**Tests:** 8 caching tests
- Test cache hit for duplicate markdown
- Test cache miss for new markdown
- Test LRU eviction (maxEntries)
- Test TTL eviction (stale entries)
- Test memory limit enforcement
- Test cache statistics
- Test cache clear
- Test large messages (edge case)

---

### Phase 3: Performance Tracking (Day 8 AM)

**Goal:** Measure and monitor performance metrics

**Create:**
1. `widget/src/utils/performance-tracker.ts` (~150 lines)
2. `widget/src/utils/performance-monitor.ts` (~100 lines)

**Key Features:**
- Event-based tracking system
- Statistics calculation (avg, p50, p95, p99)
- Memory usage monitoring
- Data export for analysis

**Interface:**

```typescript
// performance-tracker.ts
type PerformanceEvent =
  | 'markdown.render'
  | 'markdown.cache.hit'
  | 'markdown.cache.miss'
  | 'syntax.highlight'
  | 'bundle.load';

export class PerformanceTracker {
  static record(event: PerformanceEvent, duration: number, metadata?: any): void;
  static async measure<T>(event: PerformanceEvent, fn: () => T | Promise<T>): Promise<T>;
  static getStats(event: PerformanceEvent): PerformanceStats;
  static export(): string;
}

// performance-monitor.ts
export class PerformanceMonitor {
  constructor();
  isMemoryLimitExceeded(limitMB: number): boolean;
  logMemoryStats(): void;
}
```

**Tests:** 6 benchmark tests
- Benchmark cold load time (<100ms)
- Benchmark cache hit time (<1ms)
- Benchmark cache miss time (<50ms)
- Benchmark memory usage (<10MB)
- Benchmark cache hit rate (>60%)
- Benchmark bundle load time (<200ms)

---

### Phase 4: Memory Management (Day 8 PM)

**Goal:** Prevent memory leaks and enforce limits

**Enhancements:**
1. Add memory pressure detection to `MarkdownCache`
2. Add cleanup on widget destroy
3. Add periodic memory checks

**Key Features:**
- Auto-evict 50% of cache when memory high
- Listen for `memorypressure` events
- Clear cache on widget destroy
- Periodic memory monitoring (every 30s)

**Tests:** 5 memory tests
- Test memory stays under 10MB
- Test cache eviction on memory pressure
- Test cleanup on widget destroy
- Test no memory leaks (1000 messages)
- Test cache size limit

---

### Phase 5: Bundle Optimization (Day 8 PM)

**Goal:** Minimize bundle sizes through configuration

**Update:**
1. `widget/vite.config.ts` (code splitting config)

**Key Changes:**
- Manual chunk splitting (markdown, syntax, main)
- Terser optimization settings
- Tree-shaking verification
- Source map configuration

**Vite Config:**

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

**Tests:** 5 bundle size tests
- Verify main bundle <35KB
- Verify markdown chunk <25KB
- Verify syntax chunk <6KB
- Verify total <50KB
- Verify tree-shaking works

---

## Integration Points

### Update Markdown Loader

```typescript
// widget/src/utils/markdown-loader.ts

import { MarkdownCache } from './markdown-cache';
import { PerformanceTracker } from './performance-tracker';

export class MarkdownLoader {
  private static cache = new MarkdownCache({
    maxEntries: 100,
    maxMemory: 10 * 1024 * 1024,  // 10MB
    ttl: 5 * 60 * 1000,           // 5 minutes
  });

  static async render(markdown: string, config: MarkdownConfig): Promise<string> {
    return PerformanceTracker.measure('markdown.render', async () => {
      // Check cache first
      const cached = this.cache.get(markdown);
      if (cached) {
        PerformanceTracker.record('markdown.cache.hit', 0);
        return cached;
      }

      PerformanceTracker.record('markdown.cache.miss', 0);

      // Load renderer (lazy)
      const renderer = await this.loadRenderer(config);

      // Render markdown
      const html = renderer.render(markdown);

      // Cache result
      this.cache.set(markdown, html);

      return html;
    });
  }
}
```

### Update Widget to Use Loader

```typescript
// widget/src/ui/message-list.ts

import { MarkdownLoader } from '../utils/markdown-loader';

class MessageList {
  async addMessage(content: string, sender: 'user' | 'assistant') {
    const messageElement = document.createElement('div');

    // Only load markdown for assistant messages
    if (sender === 'assistant') {
      const html = await MarkdownLoader.render(content, this.markdownConfig);
      messageElement.innerHTML = html;
    } else {
      messageElement.textContent = content;
    }

    this.container.appendChild(messageElement);
  }
}
```

---

## Testing Strategy

### Test Organization

```
tests/widget/performance/
├── lazy-loading.test.ts       (6 tests)
├── markdown-cache.test.ts     (8 tests)
├── memory-management.test.ts  (5 tests)
├── integration.test.ts        (4 tests)
├── benchmarks.test.ts         (6 tests)
└── bundle-size.test.ts        (5 tests)
```

### Test Environment

All tests use `@vitest-environment jsdom` and measure actual performance:

```typescript
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';

describe('Performance Tests', () => {
  it('should load markdown lazily', async () => {
    const start = performance.now();
    await MarkdownLoader.render('**test**', config);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);  // <100ms
  });

  it('should cache repeated renders', async () => {
    await MarkdownLoader.render('**test**', config);  // Prime cache

    const start = performance.now();
    await MarkdownLoader.render('**test**', config);  // From cache
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(1);  // <1ms
  });
});
```

---

## Performance Targets

### Bundle Targets

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Main bundle | 48KB | <35KB (17KB ideal) | 🔴 Too large |
| Markdown chunk | N/A | <25KB | 🟢 Target |
| Syntax chunk | N/A | <6KB | 🟢 Target |
| Total size | 48KB | <50KB | 🟢 Within limit |

### Rendering Targets

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Cache hit | N/A | <1ms | 🟢 Target |
| Cache miss | 25ms | <50ms | 🟢 Already fast |
| Syntax highlight | 10ms | <10ms | 🟢 Already fast |
| Cache hit rate | 0% | >60% | 🔴 No cache |

### Memory Targets

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Widget memory | 5MB | <10MB | 🟢 Within limit |
| Cache size | 0 | <100 entries | 🟢 Target |
| Memory leaks | Unknown | 0 | 🟡 Must test |

---

## Success Criteria

### Must Have (P0)

- ✅ Main bundle <35KB (current: 48KB)
- ✅ Total bundle <50KB (current: 48KB)
- ✅ All 76 existing tests still GREEN
- ✅ All 34 new performance tests GREEN
- ✅ Cache hit time <1ms (p95)
- ✅ Memory usage <10MB (p95)
- ✅ No memory leaks in stress test (1000 messages)

### Should Have (P1)

- ✅ Cache hit rate >60% (typical usage)
- ✅ Lazy load success rate >99%
- ✅ Performance tracking integrated
- ✅ Memory monitoring integrated
- ✅ Bundle analysis documented

### Nice to Have (P2)

- ✅ Performance dashboard (optional)
- ✅ IndexedDB persistent cache (future)
- ✅ Web Worker for parsing (future)
- ✅ Progressive loading (future)

---

## Risk Mitigation

### High-Priority Risks

**Risk 1: Bundle Size Regression**
- **Mitigation:** Add CI tests that fail if bundle >50KB
- **Mitigation:** Use rollup-plugin-visualizer to analyze
- **Monitoring:** Check bundle size in every PR

**Risk 2: Cache Memory Leaks**
- **Mitigation:** Enforce strict maxEntries (100) and maxMemory (10MB)
- **Mitigation:** Add TTL for automatic eviction (5 minutes)
- **Monitoring:** Test with 1000+ messages in stress test

**Risk 3: Lazy Loading Failures**
- **Mitigation:** Add retry logic (3 attempts with exponential backoff)
- **Mitigation:** Add timeout handling (10 seconds)
- **Monitoring:** Track load failures in analytics

---

## Implementation Order

### Day 7 (8 hours)

**Morning (4h):**
1. Create `markdown-loader.ts` + tests (6 tests)
2. Update `vite.config.ts` for code splitting
3. Verify bundle reduction (48KB → 17KB initial)

**Afternoon (4h):**
4. Create `markdown-cache.ts` + tests (8 tests)
5. Integrate cache with loader
6. Benchmark cache performance

---

### Day 8 (8 hours)

**Morning (3h):**
7. Create `performance-tracker.ts` + tests
8. Create `performance-monitor.ts`
9. Integrate tracking + monitoring

**Afternoon (3h):**
10. Add memory management to cache
11. Write memory tests (5 tests)
12. Stress test with 1000 messages

**Evening (2h):**
13. Final bundle optimization
14. Write bundle size tests (5 tests)
15. Update documentation

---

## Files to Create/Modify

### New Files (Production - 600 lines)

1. `widget/src/utils/markdown-loader.ts` (~150 lines)
2. `widget/src/utils/markdown-cache.ts` (~200 lines)
3. `widget/src/utils/performance-tracker.ts` (~150 lines)
4. `widget/src/utils/performance-monitor.ts` (~100 lines)

### New Files (Tests - 1200 lines)

5. `tests/widget/performance/lazy-loading.test.ts` (~200 lines, 6 tests)
6. `tests/widget/performance/markdown-cache.test.ts` (~300 lines, 8 tests)
7. `tests/widget/performance/memory-management.test.ts` (~200 lines, 5 tests)
8. `tests/widget/performance/integration.test.ts` (~200 lines, 4 tests)
9. `tests/widget/performance/benchmarks.test.ts` (~200 lines, 6 tests)
10. `tests/widget/performance/bundle-size.test.ts` (~100 lines, 5 tests)

### Modified Files

11. `widget/vite.config.ts` (add code splitting config)
12. `widget/src/ui/message-list.ts` (use MarkdownLoader instead of direct render)

### Documentation

13. `docs/modules/WEEK_4_DAY_7-8_PERFORMANCE_OPTIMIZATION.md` (completion summary)

---

## Key Architectural Decisions

### ADR-012: Lazy Load Markdown Modules

**Decision:** Use dynamic imports to split markdown modules into separate chunk

**Rationale:**
- Reduces initial bundle by 64% (48KB → 17KB)
- Most users see widget before markdown messages
- 100ms load time is acceptable for first message

**Trade-offs:**
- ✅ Much faster initial load
- ✅ Stays within bundle budget
- ❌ Slight delay on first markdown message
- ❌ More async complexity

---

### ADR-013: LRU Cache with TTL

**Decision:** Implement LRU cache with 5-minute TTL and 10MB limit

**Rationale:**
- 60-80% cache hit rate expected
- Cache hit is 25x faster (1ms vs 25ms)
- LRU prevents unbounded growth
- TTL prevents stale content

**Trade-offs:**
- ✅ 98% faster for cached content
- ✅ Reduced CPU usage
- ❌ Added memory usage (5-10MB)
- ❌ Cache management complexity

---

### ADR-014: Split Prism.js Separately

**Decision:** Split Prism.js into separate chunk from markdown-it

**Rationale:**
- Not all messages contain code blocks
- 6KB savings for users without code
- Easy to implement with existing lazy loading

**Trade-offs:**
- ✅ Smaller markdown chunk
- ✅ Optional feature separated
- ❌ Two network requests if code present
- ❌ Slightly more loading logic

---

## Handoff Instructions

### For TDD/QA Lead Agent

**Your Task:** Write 34 RED tests across 6 test files

**Input:**
- This implementation brief
- Full plan: `docs/modules/WEEK_4_DAY_7-8_PERFORMANCE_OPTIMIZATION_PLAN.md`

**Output:**
- 6 test files with 34 failing tests
- Handoff document for Implementer agent

**Test Pattern:**

```typescript
describe('Performance Optimization', () => {
  it('should reduce initial bundle to <35KB', async () => {
    // Test bundle size after lazy loading
    expect(mainBundleSize).toBeLessThan(35 * 1024);
  });

  it('should cache duplicate markdown renders', async () => {
    await render('**test**');  // Prime cache
    const start = performance.now();
    await render('**test**');  // From cache
    expect(performance.now() - start).toBeLessThan(1);
  });
});
```

---

### For Implementer Agent

**Your Task:** Implement all modules to pass 34 RED tests

**Input:**
- RED tests from TDD/QA Lead
- This implementation brief
- Full plan document

**Output:**
- 4 production modules (~600 lines)
- All 110 tests GREEN (76 existing + 34 new)
- Bundle size verified <50KB

**Implementation Pattern:**

1. **Start with lazy loading** (biggest impact)
2. **Add caching** (fastest wins)
3. **Add tracking** (visibility)
4. **Add memory management** (stability)
5. **Optimize bundles** (final polish)

---

## Questions & Answers

**Q: Will lazy loading break existing functionality?**
A: No. Widget core remains synchronous. Only markdown rendering becomes async.

**Q: What if cache grows too large?**
A: LRU eviction + memory limit + TTL ensure cache stays under 10MB.

**Q: What if dynamic imports fail?**
A: Retry logic (3 attempts) + timeout (10s) + error fallback.

**Q: How do we verify bundle sizes?**
A: Automated tests + CI checks + rollup-plugin-visualizer.

**Q: What about older browsers?**
A: Dynamic imports work in Chrome 90+, Firefox 88+, Safari 14+.

---

## Related Documents

### Planning
- **Full Plan:** `docs/modules/WEEK_4_DAY_7-8_PERFORMANCE_OPTIMIZATION_PLAN.md`
- **Week 4 Overview:** `docs/planning/PLANNING.md`

### Architecture
- **Architecture.md:** Performance requirements
- **decisions.md:** ADR-012, ADR-013, ADR-014

### Previous Modules
- **XSS Sanitizer:** `docs/modules/WEEK_4_DAY_1-2_XSS_SANITIZER.md`
- **Markdown Renderer:** `docs/modules/WEEK_4_DAY_3-4_MARKDOWN_RENDERER.md`
- **Syntax Highlighter:** `docs/modules/WEEK_4_DAY_5-6_SYNTAX_HIGHLIGHTER_PLAN.md`

---

**Status:** IMPLEMENTATION BRIEF COMPLETE ✅
**Ready for:** TDD/QA Lead (write RED tests)
**Timeline:** Day 7-8 (2 days)

---

**Good luck building!**
