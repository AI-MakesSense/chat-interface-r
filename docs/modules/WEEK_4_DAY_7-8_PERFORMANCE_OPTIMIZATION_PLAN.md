# Week 4, Day 7-8: Performance Optimization Plan
**Markdown Rendering System**

**Date:** 2025-11-12
**Status:** PLANNING (Architect/Planner Phase)
**Agent:** Architect/Planner
**Phase:** Week 4, Day 7-8

---

## Executive Summary

This document provides a comprehensive performance optimization strategy for the completed markdown rendering system (XSS Sanitizer + Markdown Renderer + Syntax Highlighter). The plan focuses on **lazy loading**, **caching**, **bundle optimization**, and **memory management** to maintain the <50KB bundle size while maximizing rendering performance.

**Current Status:**
- **Bundle Size:** 48.23 KB gzipped (2KB under target ✅)
- **Test Coverage:** 76/76 tests passing (100% ✅)
- **Module Count:** 3 complete modules (XSS, Markdown, Syntax)

**Performance Goals:**
1. **Reduce initial bundle to <35KB** through lazy loading
2. **Implement LRU caching** for parsed markdown (50ms → 1ms)
3. **Optimize code splitting** for markdown + syntax chunks
4. **Memory management** to stay under 10MB cache limit
5. **Measure and track** performance metrics in production

---

## Table of Contents

1. [Context & Current State](#context--current-state)
2. [Problem Statement](#problem-statement)
3. [Performance Optimization Strategy](#performance-optimization-strategy)
4. [Lazy Loading Architecture](#lazy-loading-architecture)
5. [Caching Strategy](#caching-strategy)
6. [Bundle Size Optimization](#bundle-size-optimization)
7. [Memory Management](#memory-management)
8. [Performance Measurement](#performance-measurement)
9. [Test Plan](#test-plan)
10. [Implementation Phases](#implementation-phases)
11. [Success Criteria](#success-criteria)
12. [Risks & Mitigations](#risks--mitigations)

---

## Context & Current State

### Completed Modules (Week 4 Day 1-6)

#### 1. XSS Sanitizer ✅
- **File:** `widget/src/utils/xss-sanitizer.ts` (215 lines)
- **Tests:** 21/21 passing
- **Bundle Impact:** ~18KB (isomorphic-dompurify)
- **Purpose:** Sanitize HTML to prevent XSS attacks

#### 2. Markdown Renderer ✅
- **File:** `widget/src/utils/markdown-renderer.ts` (226 lines)
- **Tests:** 27/27 passing
- **Bundle Impact:** ~7KB (markdown-it)
- **Purpose:** Parse markdown to HTML with feature toggles

#### 3. Syntax Highlighter ✅
- **File:** `widget/src/utils/syntax-highlighter.ts` (298 lines)
- **Tests:** 28/28 passing
- **Bundle Impact:** ~6KB (prismjs + 5 languages)
- **Purpose:** Add syntax highlighting to code blocks

### Current Bundle Analysis

```
Total Bundle: 48.23 KB gzipped
├── Main widget core: ~17KB
│   ├── Widget class
│   ├── UI components
│   ├── Messaging system
│   └── Theme manager
├── DOMPurify: ~18KB
│   └── XSS sanitization engine
├── markdown-it: ~7KB
│   └── Markdown parser
├── Prism.js: ~6KB
│   ├── Core: ~2KB
│   ├── 5 languages: ~3KB
│   └── Line numbers plugin: ~1KB
└── Remaining: ~0.23KB
```

**Key Observation:** All markdown modules are bundled in the main chunk (no code-splitting yet).

### Performance Baseline (Before Optimization)

```
Rendering Performance (average):
├── Small message (<100 chars): ~5ms
├── Medium message with code (500 chars): ~25ms
├── Large message with tables (2KB): ~75ms
└── Multiple code blocks (5 blocks): ~150ms

Bundle Performance:
├── Initial download: 48.23KB
├── Parse time: ~200ms
├── Time to Interactive: ~400ms
└── Memory usage: ~5MB (no caching)
```

---

## Problem Statement

### Performance Goals

**Primary Objectives:**
1. **Reduce initial bundle to <35KB** (save 13KB for lazy loading)
2. **Cache parsed markdown** to reduce repeat render time by 98%
3. **Split code into chunks** for on-demand loading
4. **Monitor memory usage** to prevent memory leaks
5. **Track performance metrics** for production monitoring

### Constraints

1. **Bundle Size:** Must stay under 50KB total (including lazy chunks)
2. **Browser Support:** Must work in Chrome 90+, Firefox 88+, Safari 14+
3. **Memory:** Cache must not exceed 10MB
4. **Performance:** No degradation to existing functionality
5. **Testing:** All 76 tests must remain green

### User Experience Requirements

**Critical Path (First Message):**
- Initial load: <100ms (lazy-load markdown modules)
- First render: <50ms (with caching)
- Smooth scrolling: 60fps

**Subsequent Messages:**
- Render from cache: <1ms (if cached)
- Cache miss: <50ms (normal render)

---

## Performance Optimization Strategy

### Strategy Overview

We'll implement **4 optimization layers** in order:

```
Layer 1: Lazy Loading (Bundle Reduction)
    ↓
Layer 2: Caching (Speed Improvement)
    ↓
Layer 3: Code Splitting (Chunk Optimization)
    ↓
Layer 4: Memory Management (Cleanup)
```

### Why This Order?

1. **Lazy loading first:** Reduces initial bundle immediately (biggest impact)
2. **Caching second:** Improves perceived performance (fastest wins)
3. **Code splitting third:** Optimizes chunk sizes (technical optimization)
4. **Memory management last:** Prevents long-term issues (stability)

---

## Lazy Loading Architecture

### Current Problem

All markdown modules are in the main bundle:

```typescript
// widget/src/utils/markdown-renderer.ts
import MarkdownIt from 'markdown-it';  // ❌ Always loaded
import { XssSanitizer } from './xss-sanitizer';  // ❌ Always loaded

// widget/src/utils/syntax-highlighter.ts
import Prism from 'prismjs';  // ❌ Always loaded
```

**Impact:** Users pay 31KB upfront even if they never see markdown messages.

### Solution: Lazy Module Loader

**New Architecture:**

```typescript
// widget/src/utils/markdown-loader.ts
export class MarkdownLoader {
  private static markdownRenderer: MarkdownRenderer | null = null;
  private static loading: Promise<MarkdownRenderer> | null = null;

  /**
   * Lazy-loads markdown renderer on first use
   */
  static async loadRenderer(config: MarkdownConfig): Promise<MarkdownRenderer> {
    // Return cached instance if already loaded
    if (this.markdownRenderer) {
      return this.markdownRenderer;
    }

    // Return in-flight promise if loading
    if (this.loading) {
      return this.loading;
    }

    // Start loading
    this.loading = (async () => {
      // Dynamic import (creates separate chunk)
      const { MarkdownRenderer } = await import(
        /* webpackChunkName: "markdown" */
        './markdown-renderer'
      );

      this.markdownRenderer = new MarkdownRenderer(config);
      this.loading = null;
      return this.markdownRenderer;
    })();

    return this.loading;
  }

  /**
   * Renders markdown (loads on first call)
   */
  static async render(markdown: string, config: MarkdownConfig): Promise<string> {
    const renderer = await this.loadRenderer(config);
    return renderer.render(markdown);
  }
}
```

### Bundle Impact After Lazy Loading

```
Before:
├── main.js: 48.23 KB (everything bundled)

After:
├── main.js: ~17KB (core widget only)
└── markdown.js: ~31KB (loaded on first markdown message)
    ├── DOMPurify: ~18KB
    ├── markdown-it: ~7KB
    └── Prism.js: ~6KB

Initial load: 17KB (64% reduction! ✅)
With markdown: 48KB (same as before)
```

### Usage in Widget

```typescript
// widget/src/ui/message-list.ts
class MessageList {
  async addMessage(content: string, sender: 'user' | 'assistant') {
    const messageElement = document.createElement('div');

    // Only load markdown for assistant messages (user messages are plain text)
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

**User Experience:**
1. User loads page → 17KB (instant)
2. User sends first message → 31KB lazy-loaded (~100ms)
3. All subsequent messages → instant (cached)

---

## Caching Strategy

### Problem

Every markdown message re-parses from scratch:

```typescript
// Current behavior (SLOW):
render("Hello **world**");  // Parse: 5ms
render("Hello **world**");  // Parse: 5ms (duplicate work!)
render("Hello **world**");  // Parse: 5ms (duplicate work!)
```

**Impact:** Wasted CPU cycles on duplicate parsing.

### Solution: LRU Cache with TTL

**Architecture:**

```typescript
// widget/src/utils/markdown-cache.ts

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  html: string;
  timestamp: number;
  accessCount: number;
  size: number;  // bytes
}

/**
 * LRU Cache configuration
 */
interface CacheConfig {
  maxEntries: number;      // Max number of cached items
  maxMemory: number;       // Max memory in bytes (10MB)
  ttl: number;            // Time to live in ms (5 minutes)
}

/**
 * LRU Cache for markdown rendering
 *
 * Features:
 * - Least Recently Used eviction
 * - TTL (time to live) for stale entries
 * - Memory limit (10MB total)
 * - Hit rate tracking
 */
export class MarkdownCache {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
  };

  constructor(config: CacheConfig) {
    this.config = config;
  }

  /**
   * Gets cached HTML or returns null
   */
  get(markdown: string): string | null {
    const key = this.hashKey(markdown);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    const age = Date.now() - entry.timestamp;
    if (age > this.config.ttl) {
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.misses++;
      return null;
    }

    // Update access count (for LRU)
    entry.accessCount++;
    entry.timestamp = Date.now();

    this.stats.hits++;
    return entry.html;
  }

  /**
   * Stores HTML in cache
   */
  set(markdown: string, html: string): void {
    const key = this.hashKey(markdown);
    const size = new Blob([html]).size;

    // Enforce memory limit
    if (this.stats.totalSize + size > this.config.maxMemory) {
      this.evictLRU(size);
    }

    // Enforce entry limit
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU(size);
    }

    // Add to cache
    this.cache.set(key, {
      html,
      timestamp: Date.now(),
      accessCount: 1,
      size,
    });

    this.stats.totalSize += size;
  }

  /**
   * Evicts least recently used entries
   */
  private evictLRU(neededSize: number): void {
    // Sort by access count (ascending)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].accessCount - b[1].accessCount);

    let freedSize = 0;

    for (const [key, entry] of entries) {
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.evictions++;
      freedSize += entry.size;

      // Stop when we've freed enough
      if (freedSize >= neededSize) {
        break;
      }
    }
  }

  /**
   * Creates cache key from markdown
   */
  private hashKey(markdown: string): string {
    // Simple hash for demo (use better hash in production)
    let hash = 0;
    for (let i = 0; i < markdown.length; i++) {
      hash = ((hash << 5) - hash) + markdown.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Gets cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses),
      size: this.cache.size,
    };
  }

  /**
   * Clears cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
    };
  }
}
```

### Cache Configuration

```typescript
// Default cache config (tuned for chat widget)
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxEntries: 100,           // 100 messages cached
  maxMemory: 10 * 1024 * 1024,  // 10MB
  ttl: 5 * 60 * 1000,        // 5 minutes
};
```

### Integration with Markdown Loader

```typescript
// widget/src/utils/markdown-loader.ts (updated)
export class MarkdownLoader {
  private static cache = new MarkdownCache(DEFAULT_CACHE_CONFIG);

  /**
   * Renders markdown with caching
   */
  static async render(markdown: string, config: MarkdownConfig): Promise<string> {
    // Check cache first
    const cached = this.cache.get(markdown);
    if (cached) {
      return cached;  // 🚀 INSTANT (1ms)
    }

    // Load renderer (lazy)
    const renderer = await this.loadRenderer(config);

    // Render markdown
    const html = renderer.render(markdown);

    // Store in cache
    this.cache.set(markdown, html);

    return html;
  }
}
```

### Performance Impact

```
Before Caching:
├── First render: 25ms
├── Second render (same message): 25ms
└── Third render (same message): 25ms

After Caching:
├── First render (cache miss): 25ms
├── Second render (cache hit): <1ms (25x faster! ✅)
└── Third render (cache hit): <1ms
```

**Expected Cache Hit Rate:** 60-80% (based on typical chat patterns)

---

## Bundle Size Optimization

### Current Bundle Structure

```
chat-widget.iife.js (48.23 KB)
├── Widget Core (17KB)
├── DOMPurify (18KB)
├── markdown-it (7KB)
└── Prism.js (6KB)
```

### Target Bundle Structure

```
main.js (17KB) - Initial load
├── Widget Core (17KB)

markdown.js (25KB) - Lazy-loaded
├── DOMPurify (18KB)
└── markdown-it (7KB)

syntax.js (6KB) - Lazy-loaded
└── Prism.js (6KB)

Total: 48KB (same size, better loading)
```

### Vite Configuration for Code Splitting

```typescript
// widget/vite.config.ts (updated)
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Manual chunk splitting
        manualChunks: (id) => {
          // Separate DOMPurify chunk
          if (id.includes('dompurify')) {
            return 'markdown';  // Group with markdown
          }

          // Separate markdown-it chunk
          if (id.includes('markdown-it')) {
            return 'markdown';
          }

          // Separate Prism.js chunk
          if (id.includes('prismjs')) {
            return 'syntax';
          }

          // Everything else in main chunk
          return 'main';
        },
      },
    },

    // Terser minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.log in production
        dead_code: true,     // Remove unreachable code
        passes: 2,           // Multiple passes for better minification
      },
      mangle: {
        toplevel: true,      // Mangle top-level variables
      },
    },

    // Target modern browsers for smaller output
    target: 'es2020',

    // Source maps for debugging (separate file)
    sourcemap: true,
  },
});
```

### Tree-Shaking Optimization

**Prism.js Languages:**

```typescript
// widget/src/utils/syntax-highlighter.ts

// ❌ BAD: Import all languages
import 'prismjs/components/prism-*';

// ✅ GOOD: Import only needed languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
```

**Savings:** ~10KB by excluding unused languages.

### DOMPurify Configuration

```typescript
// widget/src/utils/xss-sanitizer.ts

// ❌ BAD: Import full DOMPurify
import DOMPurify from 'dompurify';

// ✅ GOOD: Import only core (no additional sanitizers)
import DOMPurify from 'isomorphic-dompurify';
```

**Note:** We're already using `isomorphic-dompurify` (correct).

---

## Memory Management

### Memory Lifecycle

```
Widget Load (0MB)
    ↓
First Markdown Message (+5MB for modules)
    ↓
Cache 100 Messages (+5MB for cache)
    ↓
Total: ~10MB (acceptable)
```

### Memory Leak Prevention

**Problem Areas:**
1. **Unbounded cache growth** → Use LRU eviction
2. **Event listeners not cleaned** → Track and remove on destroy
3. **DOM references not released** → Use WeakMap/WeakSet
4. **Circular references** → Avoid or use WeakRef

### Memory Monitoring

```typescript
// widget/src/utils/performance-monitor.ts

/**
 * Monitors widget memory usage
 */
export class PerformanceMonitor {
  private startMemory: number;

  constructor() {
    this.startMemory = this.getMemoryUsage();
  }

  /**
   * Gets current memory usage (if available)
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Checks if memory limit exceeded
   */
  isMemoryLimitExceeded(limitMB: number): boolean {
    const currentMemory = this.getMemoryUsage();
    const usedMB = (currentMemory - this.startMemory) / 1024 / 1024;
    return usedMB > limitMB;
  }

  /**
   * Logs memory stats
   */
  logMemoryStats(): void {
    const currentMemory = this.getMemoryUsage();
    const usedMB = (currentMemory - this.startMemory) / 1024 / 1024;

    console.log(`Widget memory: ${usedMB.toFixed(2)}MB`);
  }
}
```

### Cache Cleanup on Memory Pressure

```typescript
// widget/src/utils/markdown-cache.ts (addition)

/**
 * Clears cache when memory pressure detected
 */
export class MarkdownCache {
  // ... existing code ...

  private monitorMemoryPressure(): void {
    // Listen for memory pressure events (if supported)
    if ('onmemorypressure' in window) {
      window.addEventListener('memorypressure', () => {
        console.warn('Memory pressure detected - clearing cache');
        this.clear();
      });
    }

    // Fallback: Check periodically
    setInterval(() => {
      if (this.stats.totalSize > this.config.maxMemory * 0.9) {
        console.warn('Cache near memory limit - evicting 50%');
        this.evictHalf();
      }
    }, 30000);  // Every 30 seconds
  }

  private evictHalf(): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].accessCount - b[1].accessCount);

    const halfSize = Math.floor(entries.length / 2);

    for (let i = 0; i < halfSize; i++) {
      const [key, entry] = entries[i];
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.evictions++;
    }
  }
}
```

---

## Performance Measurement

### Key Metrics to Track

**1. Bundle Metrics**
- Initial bundle size (target: <35KB)
- Total bundle size (target: <50KB)
- Chunk load time (target: <100ms)

**2. Rendering Metrics**
- Markdown parse time (target: <25ms)
- Syntax highlight time (target: <10ms)
- Cache hit rate (target: >60%)

**3. Memory Metrics**
- Widget memory usage (target: <10MB)
- Cache size (target: <100 entries)
- Eviction count (target: <10/minute)

### Performance Tracking Module

```typescript
// widget/src/utils/performance-tracker.ts

/**
 * Performance event types
 */
type PerformanceEvent =
  | 'markdown.render'
  | 'markdown.cache.hit'
  | 'markdown.cache.miss'
  | 'syntax.highlight'
  | 'bundle.load';

/**
 * Performance data point
 */
interface PerformanceData {
  event: PerformanceEvent;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Tracks widget performance metrics
 */
export class PerformanceTracker {
  private static data: PerformanceData[] = [];
  private static enabled = true;

  /**
   * Records a performance measurement
   */
  static record(event: PerformanceEvent, duration: number, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    this.data.push({
      event,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    // Limit to 1000 entries
    if (this.data.length > 1000) {
      this.data = this.data.slice(-1000);
    }
  }

  /**
   * Measures execution time of a function
   */
  static async measure<T>(
    event: PerformanceEvent,
    fn: () => T | Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    this.record(event, duration, metadata);

    return result;
  }

  /**
   * Gets performance statistics
   */
  static getStats(event: PerformanceEvent): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } {
    const samples = this.data
      .filter(d => d.event === event)
      .map(d => d.duration)
      .sort((a, b) => a - b);

    if (samples.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sum = samples.reduce((a, b) => a + b, 0);
    const avg = sum / samples.length;

    return {
      count: samples.length,
      avg,
      min: samples[0],
      max: samples[samples.length - 1],
      p50: samples[Math.floor(samples.length * 0.5)],
      p95: samples[Math.floor(samples.length * 0.95)],
      p99: samples[Math.floor(samples.length * 0.99)],
    };
  }

  /**
   * Exports performance data for analysis
   */
  static export(): string {
    return JSON.stringify({
      data: this.data,
      stats: {
        'markdown.render': this.getStats('markdown.render'),
        'markdown.cache.hit': this.getStats('markdown.cache.hit'),
        'markdown.cache.miss': this.getStats('markdown.cache.miss'),
        'syntax.highlight': this.getStats('syntax.highlight'),
        'bundle.load': this.getStats('bundle.load'),
      },
    }, null, 2);
  }
}
```

### Usage in Markdown Loader

```typescript
// widget/src/utils/markdown-loader.ts (with tracking)
export class MarkdownLoader {
  static async render(markdown: string, config: MarkdownConfig): Promise<string> {
    return PerformanceTracker.measure('markdown.render', async () => {
      // Check cache
      const cached = this.cache.get(markdown);
      if (cached) {
        PerformanceTracker.record('markdown.cache.hit', 0);
        return cached;
      }

      PerformanceTracker.record('markdown.cache.miss', 0);

      // Load and render
      const renderer = await this.loadRenderer(config);
      const html = renderer.render(markdown);
      this.cache.set(markdown, html);

      return html;
    }, { length: markdown.length });
  }
}
```

---

## Test Plan

### Performance Test Categories

**1. Bundle Size Tests (5 tests)**
- Verify main bundle <35KB
- Verify markdown chunk <25KB
- Verify syntax chunk <6KB
- Verify total size <50KB
- Verify tree-shaking removes unused code

**2. Lazy Loading Tests (6 tests)**
- Test lazy load on first markdown message
- Test cached loader returns immediately
- Test concurrent loads (race condition)
- Test load failure handling
- Test loader timeout handling
- Test loader memory cleanup

**3. Caching Tests (8 tests)**
- Test cache hit for duplicate markdown
- Test cache miss for new markdown
- Test LRU eviction when maxEntries reached
- Test TTL eviction for stale entries
- Test memory limit enforcement
- Test cache statistics accuracy
- Test cache clear functionality
- Test cache with large messages (edge case)

**4. Memory Management Tests (5 tests)**
- Test memory usage stays under 10MB
- Test cache eviction on memory pressure
- Test memory cleanup on widget destroy
- Test no memory leaks after 100 messages
- Test cache size limit enforcement

**5. Integration Tests (4 tests)**
- Test lazy loading + caching together
- Test markdown + syntax highlighting cached
- Test performance tracking integration
- Test error handling doesn't break caching

**6. Performance Benchmarks (6 tests)**
- Benchmark cold load time (<100ms)
- Benchmark cache hit time (<1ms)
- Benchmark cache miss time (<50ms)
- Benchmark memory usage (<10MB)
- Benchmark cache hit rate (>60%)
- Benchmark bundle load time (<200ms)

**Total:** 34 performance tests

### Test File Structure

```
tests/widget/performance/
├── bundle-size.test.ts        (5 tests)
├── lazy-loading.test.ts       (6 tests)
├── markdown-cache.test.ts     (8 tests)
├── memory-management.test.ts  (5 tests)
├── integration.test.ts        (4 tests)
└── benchmarks.test.ts         (6 tests)
```

### Sample Tests

```typescript
// tests/widget/performance/lazy-loading.test.ts

/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarkdownLoader } from '../../../widget/src/utils/markdown-loader';

describe('Lazy Loading Tests', () => {
  beforeEach(() => {
    // Reset loader state
    MarkdownLoader['markdownRenderer'] = null;
    MarkdownLoader['loading'] = null;
  });

  it('should lazy-load markdown renderer on first call', async () => {
    const config = { /* ... */ };

    // First call should trigger dynamic import
    const start = performance.now();
    const html = await MarkdownLoader.render('**test**', config);
    const duration = performance.now() - start;

    expect(html).toContain('<strong>');
    expect(duration).toBeLessThan(100);  // Should load within 100ms
  });

  it('should return cached renderer on second call', async () => {
    const config = { /* ... */ };

    // First call (loads)
    await MarkdownLoader.render('**test**', config);

    // Second call (cached)
    const start = performance.now();
    await MarkdownLoader.render('**test2**', config);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(10);  // Should be instant
  });

  it('should handle concurrent loads without race conditions', async () => {
    const config = { /* ... */ };

    // Trigger 10 concurrent renders
    const promises = Array.from({ length: 10 }, (_, i) =>
      MarkdownLoader.render(`**test${i}**`, config)
    );

    const results = await Promise.all(promises);

    // All should succeed
    expect(results).toHaveLength(10);
    results.forEach((html, i) => {
      expect(html).toContain(`test${i}`);
    });
  });
});
```

---

## Implementation Phases

### Phase 1: Lazy Loading (Day 7 Morning) - 4 hours

**Goal:** Reduce initial bundle to <35KB

**Tasks:**
1. Create `markdown-loader.ts` module
2. Update `vite.config.ts` for code splitting
3. Update widget to use lazy loader
4. Write lazy loading tests (6 tests)
5. Verify bundle size reduction

**Expected Outcome:**
- Main bundle: 17KB ✅
- Markdown chunk: 31KB (lazy-loaded)
- All existing tests still passing

---

### Phase 2: Caching Implementation (Day 7 Afternoon) - 4 hours

**Goal:** Add LRU cache for markdown rendering

**Tasks:**
1. Create `markdown-cache.ts` module
2. Integrate cache with markdown loader
3. Write caching tests (8 tests)
4. Benchmark cache performance
5. Tune cache parameters (maxEntries, TTL)

**Expected Outcome:**
- Cache hit time: <1ms ✅
- Cache hit rate: >60% ✅
- Memory usage: <5MB ✅

---

### Phase 3: Performance Tracking (Day 8 Morning) - 3 hours

**Goal:** Add performance measurement and monitoring

**Tasks:**
1. Create `performance-tracker.ts` module
2. Create `performance-monitor.ts` module
3. Integrate tracking in markdown loader
4. Write performance tests (6 benchmarks)
5. Create performance dashboard (optional)

**Expected Outcome:**
- All metrics tracked ✅
- Performance data exportable ✅
- Baseline benchmarks established ✅

---

### Phase 4: Memory Management (Day 8 Afternoon) - 3 hours

**Goal:** Implement memory cleanup and monitoring

**Tasks:**
1. Add memory pressure detection
2. Implement cache eviction strategies
3. Add widget destroy cleanup
4. Write memory tests (5 tests)
5. Stress test with 1000+ messages

**Expected Outcome:**
- Memory stays under 10MB ✅
- No memory leaks ✅
- Cache auto-evicts when needed ✅

---

### Phase 5: Bundle Optimization (Day 8 Evening) - 2 hours

**Goal:** Final bundle size optimization

**Tasks:**
1. Analyze bundle with rollup-plugin-visualizer
2. Remove dead code
3. Optimize terser settings
4. Verify tree-shaking
5. Write bundle size tests (5 tests)

**Expected Outcome:**
- Total bundle: <48KB ✅
- Main bundle: <17KB ✅
- All chunks optimized ✅

---

## Success Criteria

### Functional Requirements

- ✅ All 76 existing tests remain GREEN
- ✅ All 34 new performance tests GREEN
- ✅ No regressions in markdown rendering
- ✅ Lazy loading works on all browsers
- ✅ Cache invalidation works correctly

### Performance Requirements

**Bundle Size:**
- ✅ Main bundle: <35KB (target: 17KB)
- ✅ Total bundle: <50KB (target: 48KB)
- ✅ Chunk load time: <100ms (p95)

**Rendering Performance:**
- ✅ Cache hit time: <1ms (p95)
- ✅ Cache miss time: <50ms (p95)
- ✅ Syntax highlight time: <10ms (p95)

**Memory:**
- ✅ Widget memory: <10MB (p95)
- ✅ Cache size: <100 entries
- ✅ No memory leaks after 1000 messages

**Reliability:**
- ✅ Cache hit rate: >60%
- ✅ Lazy load success rate: >99%
- ✅ Zero crashes in testing

---

## Risks & Mitigations

### Risk 1: Bundle Size Regression

**Risk:** Code splitting might increase total bundle size due to chunk overhead.

**Mitigation:**
- ✅ Use rollup-plugin-visualizer to analyze chunks
- ✅ Set strict bundle size tests (fail CI if >50KB)
- ✅ Use manual chunks (not automatic)
- ✅ Monitor bundle size in every PR

**Likelihood:** Low
**Impact:** High

---

### Risk 2: Cache Memory Leaks

**Risk:** LRU cache might grow unbounded and cause memory issues.

**Mitigation:**
- ✅ Enforce strict maxEntries (100)
- ✅ Enforce strict maxMemory (10MB)
- ✅ Add TTL for stale entries (5 minutes)
- ✅ Test with 1000+ messages
- ✅ Monitor memory in production

**Likelihood:** Medium
**Impact:** High

---

### Risk 3: Lazy Loading Failures

**Risk:** Dynamic imports might fail in some environments or networks.

**Mitigation:**
- ✅ Add retry logic (3 attempts with exponential backoff)
- ✅ Add timeout handling (10 seconds)
- ✅ Fallback to synchronous import if dynamic fails
- ✅ Show user-friendly error message
- ✅ Track failures in analytics

**Likelihood:** Low
**Impact:** Medium

---

### Risk 4: Cache Invalidation Bugs

**Risk:** Cache might serve stale content if invalidation logic is wrong.

**Mitigation:**
- ✅ Use hash-based cache keys (not timestamps)
- ✅ Add TTL for automatic expiration
- ✅ Add manual cache clear API
- ✅ Test cache invalidation thoroughly
- ✅ Log cache misses for debugging

**Likelihood:** Medium
**Impact:** Medium

---

### Risk 5: Performance Tracking Overhead

**Risk:** Performance tracking might slow down rendering.

**Mitigation:**
- ✅ Use lightweight tracking (only record timestamps)
- ✅ Limit tracked events to 1000 entries
- ✅ Make tracking opt-in (disable in production if needed)
- ✅ Benchmark tracking overhead (<1ms)

**Likelihood:** Low
**Impact:** Low

---

## Architectural Decisions

### ADR-012: Use Lazy Loading for Markdown Modules

**Date:** 2025-11-12
**Status:** Accepted
**Context:** Initial bundle is 48KB (96% of 50KB limit)
**Decision:** Lazy-load markdown modules (31KB) on first use
**Rationale:**
- Reduces initial bundle by 64% (48KB → 17KB)
- Most users see widget before markdown messages
- Dynamic imports well-supported in modern browsers
- No UX degradation (100ms load time acceptable)

**Consequences:**
- ✅ Much faster initial load
- ✅ Stays within bundle budget
- ❌ Slight delay on first markdown message
- ❌ More complex code (async loading)

---

### ADR-013: Use LRU Cache with TTL for Markdown

**Date:** 2025-11-12
**Status:** Accepted
**Context:** Duplicate markdown messages parsed repeatedly
**Decision:** Implement LRU cache with 5-minute TTL and 10MB limit
**Rationale:**
- 60-80% cache hit rate expected (based on chat patterns)
- Cache hit is 25x faster than re-parsing (1ms vs 25ms)
- LRU prevents unbounded growth
- TTL prevents serving stale content

**Consequences:**
- ✅ 98% faster for cached messages
- ✅ Reduced CPU usage
- ✅ Better battery life on mobile
- ❌ Added memory usage (5-10MB)
- ❌ Cache management complexity

---

### ADR-014: Split Prism.js into Separate Chunk

**Date:** 2025-11-12
**Status:** Accepted
**Context:** Syntax highlighting is optional feature
**Decision:** Split Prism.js (6KB) into separate lazy-loaded chunk
**Rationale:**
- Not all messages contain code blocks
- 6KB savings for users who don't see code
- Already using dynamic imports for markdown
- No additional complexity

**Consequences:**
- ✅ Smaller markdown chunk (25KB instead of 31KB)
- ✅ Optional feature properly separated
- ❌ Two network requests instead of one (if code present)
- ❌ Slightly more complex loading logic

---

## Next Steps

### Immediate Actions (Day 7)

1. **Morning:** Implement lazy loading + tests
2. **Afternoon:** Implement caching + tests
3. **Evening:** Benchmark and tune parameters

### Follow-up Actions (Day 8)

1. **Morning:** Add performance tracking
2. **Afternoon:** Implement memory management
3. **Evening:** Final optimizations + documentation

### Post-Optimization

1. Monitor performance metrics in production
2. Tune cache parameters based on real usage
3. Investigate Web Worker for heavy parsing (Phase 2)
4. Consider IndexedDB for persistent cache (Phase 2)

---

## Files to Create

### Production Code (~600 lines)

1. `widget/src/utils/markdown-loader.ts` (~150 lines)
2. `widget/src/utils/markdown-cache.ts` (~200 lines)
3. `widget/src/utils/performance-tracker.ts` (~150 lines)
4. `widget/src/utils/performance-monitor.ts` (~100 lines)

### Test Code (~1200 lines, 34 tests)

5. `tests/widget/performance/lazy-loading.test.ts` (~200 lines, 6 tests)
6. `tests/widget/performance/markdown-cache.test.ts` (~300 lines, 8 tests)
7. `tests/widget/performance/memory-management.test.ts` (~200 lines, 5 tests)
8. `tests/widget/performance/integration.test.ts` (~200 lines, 4 tests)
9. `tests/widget/performance/benchmarks.test.ts` (~200 lines, 6 tests)
10. `tests/widget/performance/bundle-size.test.ts` (~100 lines, 5 tests)

### Configuration

11. `widget/vite.config.ts` (update for code splitting)

### Documentation

12. `docs/modules/WEEK_4_DAY_7-8_PERFORMANCE_OPTIMIZATION.md` (completion summary)

---

## References

### Related Planning Documents

- **Week 4 Day 1-2:** XSS Sanitizer Plan
- **Week 4 Day 3-4:** Markdown Renderer Plan
- **Week 4 Day 5-6:** Syntax Highlighter Plan

### Architecture Documents

- **Architecture.md:** Performance requirements
- **PLAN.md:** Week 4 performance optimization tasks

### External References

- **Vite Code Splitting:** https://vitejs.dev/guide/build.html#chunking-strategy
- **Rollup Manual Chunks:** https://rollupjs.org/configuration-options/#output-manualchunks
- **LRU Cache Pattern:** https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU)
- **Performance API:** https://developer.mozilla.org/en-US/docs/Web/API/Performance

---

**Status:** PLANNING COMPLETE ✅
**Next Phase:** Implementation (TDD Approach)
**Est. Duration:** 2 days (Day 7-8)
**Architect:** Planner Agent

---

**This concludes the performance optimization planning phase. Ready for implementation!**
