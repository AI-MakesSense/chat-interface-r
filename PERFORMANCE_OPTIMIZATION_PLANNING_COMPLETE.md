# Performance Optimization Planning Complete
**Week 4, Day 7-8**

**Date:** 2025-11-12
**Phase:** PLANNING COMPLETE
**Agent:** Architect/Planner
**Status:** ✅ Ready for Implementation

---

## Summary

Comprehensive performance optimization plan completed for the markdown rendering system (XSS Sanitizer + Markdown Renderer + Syntax Highlighter). The plan focuses on **lazy loading**, **LRU caching**, **code splitting**, and **memory management** to achieve a 64% reduction in initial bundle size and 98% improvement in cached rendering performance.

---

## Current Status

### Completed Modules (Week 4 Day 1-6)

**All GREEN ✅ (76/76 tests passing)**

1. **XSS Sanitizer** (Day 1-2)
   - File: `widget/src/utils/xss-sanitizer.ts` (215 lines)
   - Tests: 21/21 passing
   - Bundle: ~18KB (isomorphic-dompurify)

2. **Markdown Renderer** (Day 3-4)
   - File: `widget/src/utils/markdown-renderer.ts` (226 lines)
   - Tests: 27/27 passing
   - Bundle: ~7KB (markdown-it)

3. **Syntax Highlighter** (Day 5-6)
   - File: `widget/src/utils/syntax-highlighter.ts` (298 lines)
   - Tests: 28/28 passing
   - Bundle: ~6KB (prismjs)

**Total Bundle:** 48.23 KB gzipped (within 50KB target ✅)

---

## Performance Goals (Day 7-8)

### Bundle Size Optimization

**Current:**
```
chat-widget.iife.js: 48.23 KB
└── All modules in main bundle
```

**Target:**
```
main.js: 17KB (core widget) ← 64% reduction!
markdown.js: 25KB (lazy-loaded)
syntax.js: 6KB (lazy-loaded)
```

**Key Metric:** Initial load reduces from **48KB to 17KB** (64% faster!)

---

### Rendering Performance

**Current:**
- No caching (every message re-parsed)
- Render time: 25ms per message
- Cache hit rate: 0%

**Target:**
- LRU cache with TTL
- Cache hit: <1ms (98% faster!)
- Cache miss: 25ms (unchanged)
- Cache hit rate: >60%

**Key Metric:** Cached renders are **25x faster** (1ms vs 25ms)

---

### Memory Management

**Current:**
- Widget memory: ~5MB
- No cache (no memory overhead)
- Unknown memory leak status

**Target:**
- Widget memory: <10MB (with cache)
- Cache size: <100 entries
- LRU + TTL eviction
- No memory leaks after 1000 messages

**Key Metric:** Memory stays **under 10MB** with full cache

---

## Optimization Strategy

### Layer 1: Lazy Loading (Biggest Impact)

**Implementation:** Dynamic imports to split markdown modules

```typescript
// Before: Everything in main bundle (48KB)
import { MarkdownRenderer } from './markdown-renderer';

// After: Lazy-load on first use (17KB initial)
const { MarkdownRenderer } = await import('./markdown-renderer');
```

**Impact:**
- Initial bundle: 48KB → 17KB (64% reduction)
- Markdown load time: ~100ms (acceptable)
- User sees widget instantly, markdown loads on demand

**Files to Create:**
- `widget/src/utils/markdown-loader.ts` (~150 lines)

**Tests:** 6 lazy loading tests

---

### Layer 2: LRU Caching (Fastest Wins)

**Implementation:** Cache parsed markdown with LRU eviction

```typescript
class MarkdownCache {
  maxEntries: 100
  maxMemory: 10MB
  ttl: 5 minutes

  get(markdown) → cached HTML or null
  set(markdown, html) → store with eviction
  evictLRU() → remove least recently used
}
```

**Impact:**
- Cache hit: <1ms (98% faster than 25ms)
- Cache hit rate: 60-80% (typical chat patterns)
- Memory overhead: 5-10MB

**Files to Create:**
- `widget/src/utils/markdown-cache.ts` (~200 lines)

**Tests:** 8 caching tests

---

### Layer 3: Performance Tracking (Visibility)

**Implementation:** Measure and monitor performance metrics

```typescript
class PerformanceTracker {
  record(event, duration, metadata)
  measure(event, fn) → tracked execution
  getStats(event) → avg, p50, p95, p99
  export() → JSON data
}
```

**Tracked Metrics:**
- Bundle load time
- Markdown render time
- Cache hit/miss rate
- Memory usage
- Syntax highlight time

**Files to Create:**
- `widget/src/utils/performance-tracker.ts` (~150 lines)
- `widget/src/utils/performance-monitor.ts` (~100 lines)

**Tests:** 6 benchmark tests

---

### Layer 4: Memory Management (Stability)

**Implementation:** Prevent memory leaks and enforce limits

**Features:**
- Memory pressure detection
- Auto-evict 50% on high memory
- Cleanup on widget destroy
- Periodic memory checks (30s)

**Files to Modify:**
- `widget/src/utils/markdown-cache.ts` (add memory monitoring)

**Tests:** 5 memory management tests

---

### Layer 5: Bundle Optimization (Polish)

**Implementation:** Vite code-splitting configuration

```typescript
// vite.config.ts
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
  },
});
```

**Files to Modify:**
- `widget/vite.config.ts` (add code splitting)

**Tests:** 5 bundle size tests

---

## Test Plan

### Total: 34 Performance Tests

**Breakdown by Category:**
1. **Lazy Loading Tests:** 6 tests (~200 lines)
2. **Caching Tests:** 8 tests (~300 lines)
3. **Memory Management Tests:** 5 tests (~200 lines)
4. **Integration Tests:** 4 tests (~200 lines)
5. **Benchmark Tests:** 6 tests (~200 lines)
6. **Bundle Size Tests:** 5 tests (~100 lines)

**Total Test Code:** ~1200 lines

**Test Files to Create:**
```
tests/widget/performance/
├── lazy-loading.test.ts       (6 tests)
├── markdown-cache.test.ts     (8 tests)
├── memory-management.test.ts  (5 tests)
├── integration.test.ts        (4 tests)
├── benchmarks.test.ts         (6 tests)
└── bundle-size.test.ts        (5 tests)
```

---

## Deliverables Created

### 1. Comprehensive Planning Document ✅

**File:** `docs/modules/WEEK_4_DAY_7-8_PERFORMANCE_OPTIMIZATION_PLAN.md` (620 lines)

**Contents:**
- Executive summary
- Context & current state
- Problem statement
- 5-layer optimization strategy
- Lazy loading architecture
- LRU caching design
- Bundle optimization techniques
- Memory management approach
- Performance measurement system
- Test plan (34 tests)
- Implementation phases (5 phases)
- Success criteria
- Risks & mitigations

---

### 2. Implementation Brief ✅

**File:** `docs/planning/PERFORMANCE_OPTIMIZATION_IMPLEMENTATION_BRIEF.md` (550 lines)

**Contents:**
- Quick summary
- Critical constraints
- Architecture overview (before/after)
- Implementation phases (Day 7-8 breakdown)
- Module interfaces
- Integration points
- Testing strategy
- Performance targets
- Success criteria
- Handoff instructions (TDD/QA Lead → Implementer)

---

### 3. Architectural Decision Records ✅

**File:** `docs/development/decisions.md` (updated, +3 ADRs)

**New Decisions:**
- **ADR-012:** Lazy Load Markdown Modules (dynamic imports)
- **ADR-013:** LRU Cache with TTL (caching strategy)
- **ADR-014:** Split Prism.js into Separate Chunk (bundle optimization)

---

### 4. Planning Summary ✅

**File:** `PERFORMANCE_OPTIMIZATION_PLANNING_COMPLETE.md` (this document)

**Contents:**
- Planning status
- Current state
- Performance goals
- Optimization strategy overview
- Test plan summary
- Deliverables checklist
- Files to create/modify
- Next steps

---

## Files to Create/Modify

### Production Code (~600 lines)

**New Files:**
1. `widget/src/utils/markdown-loader.ts` (~150 lines)
   - Dynamic import lazy loading
   - Singleton pattern
   - Error handling

2. `widget/src/utils/markdown-cache.ts` (~200 lines)
   - LRU cache implementation
   - TTL eviction
   - Memory management

3. `widget/src/utils/performance-tracker.ts` (~150 lines)
   - Event tracking system
   - Statistics calculation
   - Data export

4. `widget/src/utils/performance-monitor.ts` (~100 lines)
   - Memory usage monitoring
   - Memory pressure detection

**Modified Files:**
5. `widget/vite.config.ts` (add code splitting config)
6. `widget/src/ui/message-list.ts` (use MarkdownLoader)

---

### Test Code (~1200 lines, 34 tests)

**New Test Files:**
1. `tests/widget/performance/lazy-loading.test.ts` (~200 lines, 6 tests)
2. `tests/widget/performance/markdown-cache.test.ts` (~300 lines, 8 tests)
3. `tests/widget/performance/memory-management.test.ts` (~200 lines, 5 tests)
4. `tests/widget/performance/integration.test.ts` (~200 lines, 4 tests)
5. `tests/widget/performance/benchmarks.test.ts` (~200 lines, 6 tests)
6. `tests/widget/performance/bundle-size.test.ts` (~100 lines, 5 tests)

---

### Documentation (~500 lines)

**New Documentation:**
7. `docs/modules/WEEK_4_DAY_7-8_PERFORMANCE_OPTIMIZATION.md` (completion summary)

---

## Implementation Timeline

### Day 7 (8 hours)

**Morning (4h):**
- Create `markdown-loader.ts` + tests (6 tests)
- Update `vite.config.ts` for code splitting
- Verify bundle reduction (48KB → 17KB)

**Afternoon (4h):**
- Create `markdown-cache.ts` + tests (8 tests)
- Integrate cache with loader
- Benchmark cache performance

---

### Day 8 (8 hours)

**Morning (3h):**
- Create `performance-tracker.ts` + tests
- Create `performance-monitor.ts`
- Integrate tracking + monitoring

**Afternoon (3h):**
- Add memory management to cache
- Write memory tests (5 tests)
- Stress test with 1000 messages

**Evening (2h):**
- Final bundle optimization
- Write bundle size tests (5 tests)
- Update documentation

---

## Success Criteria

### Must Have (P0) ✅

- ✅ Main bundle <35KB (target: 17KB)
- ✅ Total bundle <50KB (target: 48KB)
- ✅ All 76 existing tests GREEN
- ✅ All 34 new performance tests GREEN
- ✅ Cache hit time <1ms (p95)
- ✅ Memory usage <10MB (p95)
- ✅ No memory leaks (1000 messages)

### Should Have (P1) ✅

- ✅ Cache hit rate >60%
- ✅ Lazy load success rate >99%
- ✅ Performance tracking integrated
- ✅ Memory monitoring integrated
- ✅ Bundle analysis documented

### Nice to Have (P2) 🔄

- 🔄 Performance dashboard (optional)
- 🔄 IndexedDB persistent cache (Phase 2)
- 🔄 Web Worker for parsing (Phase 2)
- 🔄 Progressive loading (Phase 2)

---

## Key Performance Improvements

### Bundle Size

**Before:** 48.23 KB (main bundle)
**After:** 17 KB (main) + 25 KB (lazy markdown) + 6 KB (lazy syntax)

**Improvement:** 64% reduction in initial load (48KB → 17KB)

---

### Rendering Speed

**Before:** 25ms per message (no caching)
**After:** <1ms for cached, 25ms for new

**Improvement:** 98% faster for cached content (25x speedup)

---

### Memory Usage

**Before:** ~5MB (no cache)
**After:** <10MB (with full cache)

**Improvement:** Controlled memory growth with LRU + TTL eviction

---

## Risk Mitigation

### High-Priority Risks

**1. Bundle Size Regression**
- **Mitigation:** CI tests fail if bundle >50KB
- **Monitoring:** Bundle size checks in every PR

**2. Cache Memory Leaks**
- **Mitigation:** Strict maxEntries (100) and maxMemory (10MB)
- **Monitoring:** Stress test with 1000 messages

**3. Lazy Loading Failures**
- **Mitigation:** Retry logic (3 attempts) + timeout (10s)
- **Monitoring:** Track load failures in analytics

---

## Next Steps

### Immediate Actions (Now)

1. **Handoff to TDD/QA Lead Agent**
   - Input: Implementation Brief
   - Task: Write 34 RED tests
   - Output: Failing test suite

2. **Handoff to Implementer Agent**
   - Input: RED tests + Implementation Brief
   - Task: Implement all modules
   - Output: 110 tests GREEN (76 + 34)

---

### Follow-up Actions (Post-Implementation)

1. **Performance Monitoring** (Week 5+)
   - Monitor metrics in production
   - Tune cache parameters based on real usage
   - Track bundle sizes in CI

2. **Phase 2 Enhancements** (Month 2+)
   - IndexedDB persistent cache
   - Web Worker for heavy parsing
   - Progressive loading
   - Performance dashboard

---

## References

### Planning Documents

- **Full Plan:** `docs/modules/WEEK_4_DAY_7-8_PERFORMANCE_OPTIMIZATION_PLAN.md`
- **Implementation Brief:** `docs/planning/PERFORMANCE_OPTIMIZATION_IMPLEMENTATION_BRIEF.md`
- **Decision Records:** `docs/development/decisions.md` (ADR-012 to ADR-014)

### Related Modules

- **XSS Sanitizer:** `docs/modules/WEEK_4_DAY_1-2_XSS_SANITIZER.md`
- **Markdown Renderer:** `docs/modules/WEEK_4_DAY_3-4_MARKDOWN_RENDERER.md`
- **Syntax Highlighter:** `docs/modules/WEEK_4_DAY_5-6_SYNTAX_HIGHLIGHTER_PLAN.md`

### Architecture Documents

- **Architecture.md:** Performance requirements
- **PLAN.md:** 12-week implementation plan
- **TODO.md:** Task checklist

### External References

- **Vite Code Splitting:** https://vitejs.dev/guide/build.html#chunking-strategy
- **Rollup Manual Chunks:** https://rollupjs.org/configuration-options/#output-manualchunks
- **LRU Cache Pattern:** https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU)
- **Performance API:** https://developer.mozilla.org/en-US/docs/Web/API/Performance

---

## Planning Phase Checklist

### Planning Documents ✅

- ✅ Comprehensive performance optimization plan (620 lines)
- ✅ Implementation brief for TDD/QA Lead (550 lines)
- ✅ Architectural decision records (3 ADRs)
- ✅ Planning summary (this document)

### Technical Design ✅

- ✅ Lazy loading architecture defined
- ✅ LRU caching strategy designed
- ✅ Bundle optimization approach specified
- ✅ Memory management approach defined
- ✅ Performance tracking system designed

### Test Plan ✅

- ✅ 34 performance tests planned
- ✅ Test categories defined (6 categories)
- ✅ Test files structured
- ✅ Success criteria defined
- ✅ Performance targets set

### Implementation Roadmap ✅

- ✅ 5 implementation phases defined
- ✅ Day-by-day timeline (Day 7-8)
- ✅ Files to create listed (10 production + 6 test)
- ✅ Dependencies identified
- ✅ Integration points documented

### Risk Management ✅

- ✅ High-priority risks identified
- ✅ Mitigation strategies defined
- ✅ Monitoring approach specified
- ✅ Fallback plans documented

---

**Status:** ✅ PLANNING PHASE COMPLETE

**Ready for:** TDD/QA Lead Agent (write RED tests)

**Expected Timeline:** Day 7-8 (2 days, 16 hours)

**Expected Outcome:**
- 110 tests GREEN (76 existing + 34 new)
- Bundle size: 17KB initial (64% reduction)
- Cache hit time: <1ms (98% improvement)
- Memory usage: <10MB (controlled)
- All functionality maintained (no regressions)

---

**Architect/Planner Agent Sign-Off**

**Date:** 2025-11-12
**Phase:** Week 4, Day 7-8 (Planning)
**Status:** COMPLETE ✅
**Ready for:** RED Phase (TDD/QA Lead Agent)

---

**End of Planning Phase**
