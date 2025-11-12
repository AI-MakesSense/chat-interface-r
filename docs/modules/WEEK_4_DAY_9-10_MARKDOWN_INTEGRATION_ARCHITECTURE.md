# Markdown Integration Architecture Plan

**Date:** 2025-11-12
**Phase:** Week 4, Day 9-10
**Agent:** Architect/Planner
**Status:** Architecture Design Complete (Pre-Implementation)

---

## Executive Summary

This document defines the integration architecture for connecting the **five completed markdown modules** into the existing chat widget message rendering flow. The design minimizes changes to working code, maintains backward compatibility, optimizes for performance through lazy loading and caching, and provides graceful degradation on errors.

**Key Achievements:**
- 96 tests GREEN across 5 markdown utilities
- Bundle size: 47KB gzipped (within 50KB limit)
- LazyLoader reduces initial bundle to 17KB (64% reduction)
- MarkdownCache provides 98% performance improvement on cache hits

**Integration Goal:**
- Connect markdown modules to `MessageList` component
- Lazy load markdown-it and Prism.js on first use
- Cache rendered HTML for duplicate messages
- Handle plain text vs markdown content
- Gracefully degrade if modules fail to load

---

## 1. Architecture Overview

### 1.1 High-Level Design (Text Diagram)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Message Flow                             │
└─────────────────────────────────────────────────────────────────┘

User Message Received
        │
        ▼
┌──────────────────────┐
│  StateManager        │  ← Message added to state
│  (messages array)    │
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│  MessageList         │  ← State change triggers re-render
│  (renderMessages)    │
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│  Should render as    │  ← Check message role + config
│  markdown?           │
└──────────────────────┘
        │
        ├─── NO ──────────────────────────────────────┐
        │                                              │
        YES                                            │
        │                                              │
        ▼                                              │
┌──────────────────────┐                              │
│  MarkdownPipeline    │  ← NEW orchestrator class    │
│  (renderAsync)       │                              │
└──────────────────────┘                              │
        │                                              │
        ▼                                              │
┌──────────────────────┐                              │
│  Check cache         │  ← MarkdownCache.get()       │
│  (MarkdownCache)     │                              │
└──────────────────────┘                              │
        │                                              │
        ├─── CACHE HIT ────────┐                      │
        │                       │                      │
        CACHE MISS              │                      │
        │                       │                      │
        ▼                       │                      │
┌──────────────────────┐       │                      │
│  Lazy load modules?  │       │                      │
│  (LazyLoader)        │       │                      │
└──────────────────────┘       │                      │
        │                       │                      │
        ├─── LOADED ────┐      │                      │
        │                │      │                      │
        NOT LOADED       │      │                      │
        │                │      │                      │
        ▼                │      │                      │
┌──────────────────────┐│      │                      │
│  await LazyLoader    ││      │                      │
│  .getMarkdownIt()    ││      │                      │
│  .getPrismJs()       ││      │                      │
└──────────────────────┘│      │                      │
        │                │      │                      │
        ◄────────────────┘      │                      │
        │                       │                      │
        ▼                       │                      │
┌──────────────────────┐       │                      │
│  MarkdownRenderer    │       │                      │
│  .render(markdown)   │       │                      │
└──────────────────────┘       │                      │
        │                       │                      │
        ▼                       │                      │
┌──────────────────────┐       │                      │
│  Cache result        │       │                      │
│  (MarkdownCache.set) │       │                      │
└──────────────────────┘       │                      │
        │                       │                      │
        ◄───────────────────────┘                      │
        │                                              │
        ▼                                              ▼
┌──────────────────────────────────────────────────────┐
│  Display HTML in DOM                                 │
│  (messageElement.innerHTML = html)                   │
└──────────────────────────────────────────────────────┘
```

### 1.2 Key Integration Points

**Modified Files:**
1. `widget/src/ui/message-list.ts` - Integrate MarkdownPipeline for message rendering
2. `widget/src/core/config.ts` - Add `enableMarkdown` flag to WidgetConfig
3. `widget/src/types.ts` - Add markdown config to FeaturesConfig interface

**New Files:**
4. `widget/src/utils/markdown-pipeline.ts` - NEW orchestrator class
5. `widget/tests/integration/markdown-pipeline.test.ts` - NEW integration tests

**Existing Modules (No Changes):**
- `widget/src/utils/xss-sanitizer.ts` - Already complete
- `widget/src/utils/markdown-renderer.ts` - Already complete
- `widget/src/utils/syntax-highlighter.ts` - Already complete
- `widget/src/utils/lazy-loader.ts` - Already complete
- `widget/src/utils/markdown-cache.ts` - Already complete

---

## 2. Integration Points

### 2.1 Entry Point: MessageList Component

**File:** `widget/src/ui/message-list.ts`

**Current Implementation (Lines 219-221):**
```typescript
// Set message content (escaped for security)
messageElement.textContent = message.content || '';
```

**Problem:** All messages are rendered as plain text (escaped).

**Solution:** Check message role and config, use MarkdownPipeline for assistant messages.

**Integration Point:**
```typescript
// NEW: Render message content with markdown support
if (message.role === 'assistant' && this.config.features.enableMarkdown) {
  const html = await this.markdownPipeline.renderAsync(message.content);
  messageElement.innerHTML = html;
} else {
  messageElement.textContent = message.content || '';
}
```

**Why This Point:**
- MessageList already handles message rendering (single responsibility)
- Access to WidgetConfig (knows if markdown enabled)
- Access to StateManager (knows message role)
- Minimal changes to existing logic

### 2.2 Configuration: WidgetConfig

**File:** `widget/src/core/config.ts`

**Current FeaturesConfig (Lines 35-38):**
```typescript
features: {
  fileAttachmentsEnabled: false,
  allowedExtensions: [],
  maxFileSizeKB: 5120,
}
```

**Add Markdown Config:**
```typescript
features: {
  fileAttachmentsEnabled: false,
  allowedExtensions: [],
  maxFileSizeKB: 5120,

  // NEW: Markdown rendering config
  enableMarkdown: true,               // Master toggle (default: true)
  markdownConfig: {                   // MarkdownRenderer config
    enableTables: true,
    enableCodeBlocks: true,
    enableBlockquotes: true,
    enableLinks: true,
    enableImages: true,
    enableLineBreaks: true,
    maxNesting: 20,
  },
  cacheConfig: {                      // MarkdownCache config
    maxEntries: 100,
    maxMemory: 10 * 1024 * 1024,     // 10MB
    ttl: 5 * 60 * 1000,              // 5 minutes
  },
}
```

**Why Add to Features:**
- Markdown rendering is a user-facing feature
- Consistent with `fileAttachmentsEnabled` pattern
- Easy to enable/disable per widget instance

### 2.3 Type Definitions

**File:** `widget/src/types.ts`

**Add to FeaturesConfig (Lines 35-39):**
```typescript
export interface FeaturesConfig {
  fileAttachmentsEnabled: boolean;
  allowedExtensions: string[];
  maxFileSizeKB: number;

  // NEW: Markdown feature config
  enableMarkdown?: boolean;
  markdownConfig?: MarkdownConfig;
  cacheConfig?: CacheConfig;
}
```

**Import Types:**
```typescript
import { MarkdownConfig } from './utils/markdown-renderer';
import { CacheConfig } from './utils/markdown-cache';
```

---

## 3. New Files Needed

### 3.1 MarkdownPipeline Orchestrator

**File:** `widget/src/utils/markdown-pipeline.ts`

**Purpose:** Orchestrate lazy loading, caching, and rendering.

**Responsibility:**
- Initialize MarkdownRenderer with config
- Manage LazyLoader for dynamic imports
- Coordinate MarkdownCache for performance
- Handle errors gracefully (fallback to plain text)
- Provide simple async API: `renderAsync(markdown: string): Promise<string>`

**Why Create This File:**
1. **Separation of Concerns:** MessageList shouldn't know about lazy loading or caching
2. **Single Entry Point:** One class to manage all markdown modules
3. **Error Handling:** Centralized fallback logic
4. **Testing:** Easy to mock/test integration

**API Design:**
```typescript
export class MarkdownPipeline {
  private renderer: MarkdownRenderer | null = null;
  private cache: MarkdownCache;
  private isInitialized: boolean = false;

  constructor(config: MarkdownPipelineConfig) {
    // Initialize cache (synchronous)
    this.cache = new MarkdownCache(config.cacheConfig);
  }

  /**
   * Renders markdown to HTML (async for lazy loading)
   *
   * @param markdown - Raw markdown text
   * @returns Safe HTML string
   * @throws Never throws - returns plain text on error
   */
  async renderAsync(markdown: string): Promise<string> {
    // Step 1: Check cache
    const cached = this.cache.get(markdown);
    if (cached) {
      return cached;
    }

    // Step 2: Initialize renderer (lazy load if needed)
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Step 3: Render markdown
    const html = this.renderer!.render(markdown);

    // Step 4: Cache result
    this.cache.set(markdown, html);

    return html;
  }

  /**
   * Lazy loads markdown-it and Prism.js, creates renderer
   * @private
   */
  private async initialize(): Promise<void> {
    try {
      // Lazy load markdown-it
      const MarkdownIt = await LazyLoader.getMarkdownIt();

      // Create renderer (SyntaxHighlighter will lazy load Prism.js internally)
      this.renderer = new MarkdownRenderer(this.config.markdownConfig);

      this.isInitialized = true;
    } catch (error) {
      console.error('[MarkdownPipeline] Failed to initialize:', error);

      // Fallback: Create renderer without lazy loading (throws error on use)
      this.renderer = null;
      this.isInitialized = false;
    }
  }

  /**
   * Checks if markdown modules are loaded
   */
  isLoaded(): boolean {
    return this.isInitialized;
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): CacheStatistics {
    return this.cache.getStats();
  }
}
```

**File Size Estimate:** 200-250 lines (within ideal range)

**Module Size Check:**
- Orchestrator logic: ~100 lines
- Error handling: ~50 lines
- Documentation: ~50 lines
- Exports: ~50 lines
- **Total:** ~250 lines ✅ (within 200-400 LOC ideal)

---

## 4. Message Flow (Detailed)

### 4.1 Message Rendering Flow

```typescript
// Step-by-step flow with timing

User sends message "**Hello** World"
        │
        ▼ (0ms)
StateManager.addMessage({ role: 'user', content: '**Hello** World' })
        │
        ▼ (0ms)
StateManager notifies subscribers (MessageList)
        │
        ▼ (0ms)
MessageList.renderMessages() called
        │
        ▼ (1ms)
Check message.role === 'assistant' && config.features.enableMarkdown
        │
        ├─── NO ─────────────────────────────────────┐
        │                                             │
        YES                                           │
        │                                             │
        ▼ (1ms)                                       │
await markdownPipeline.renderAsync('**Hello** World') │
        │                                             │
        ▼ (1ms)                                       │
MarkdownCache.get('**Hello** World')                 │
        │                                             │
        ├─── CACHE HIT (60-80% of time) ─────────┐  │
        │                                          │  │
        CACHE MISS (20-40% of time)               │  │
        │                                          │  │
        ▼ (1ms)                                   │  │
Check if MarkdownPipeline initialized             │  │
        │                                          │  │
        ├─── YES ──────────────┐                  │  │
        │                       │                  │  │
        NO (first render)       │                  │  │
        │                       │                  │  │
        ▼ (50-100ms)            │                  │  │
await LazyLoader.getMarkdownIt() (dynamic import)  │  │
await LazyLoader.getPrismJs() (dynamic import)     │  │
Create MarkdownRenderer instance                   │  │
        │                       │                  │  │
        ◄───────────────────────┘                  │  │
        │                                          │  │
        ▼ (5-25ms)                                 │  │
MarkdownRenderer.render('**Hello** World')        │  │
        │                                          │  │
        ▼ (1ms)                                    │  │
MarkdownCache.set('**Hello** World', '<p>...</p>')│  │
        │                                          │  │
        ◄──────────────────────────────────────────┘  │
        │                                             │
        ▼ (0ms)                                       ▼
messageElement.innerHTML = '<p><strong>Hello</strong> World</p>'
        │
        ▼ (0ms)
Display in UI
```

### 4.2 Timing Analysis

**First Markdown Message (Cold Start):**
- Cache check: 1ms
- Lazy load markdown-it: 50ms
- Lazy load Prism.js: 30ms
- Render markdown: 25ms
- Cache set: 1ms
- **Total: ~107ms**

**Second Markdown Message (Same Content):**
- Cache check: 1ms
- Cache hit: <1ms
- **Total: ~1ms** (107x faster!)

**Second Markdown Message (Different Content, Warm):**
- Cache check: 1ms
- Cache miss: 0ms
- Render markdown: 25ms (renderer already loaded)
- Cache set: 1ms
- **Total: ~27ms** (4x faster than cold start)

**Plain Text Message (No Markdown):**
- Check if assistant + enableMarkdown: 0ms
- Skip markdown pipeline entirely
- textContent assignment: 0ms
- **Total: <1ms** (no overhead!)

---

## 5. Configuration Design

### 5.1 Configuration Levels

**Level 1: Master Toggle (User Control)**
```typescript
window.ChatWidgetConfig = {
  features: {
    enableMarkdown: true, // ← User can disable all markdown
  }
};
```

**Level 2: Feature Toggles (Advanced Users)**
```typescript
window.ChatWidgetConfig = {
  features: {
    enableMarkdown: true,
    markdownConfig: {
      enableTables: true,       // GitHub tables
      enableCodeBlocks: true,   // Syntax highlighting
      enableBlockquotes: true,  // Quote blocks
      enableLinks: true,        // Hyperlinks
      enableImages: true,       // Image embeds
      enableLineBreaks: true,   // Hard line breaks
      maxNesting: 20,           // DoS prevention
    },
  }
};
```

**Level 3: Cache Configuration (Power Users)**
```typescript
window.ChatWidgetConfig = {
  features: {
    enableMarkdown: true,
    cacheConfig: {
      maxEntries: 100,          // Max cached messages
      maxMemory: 10485760,      // 10MB memory limit
      ttl: 300000,              // 5-minute TTL
    },
  }
};
```

### 5.2 Configuration Defaults

**Default Behavior:**
- `enableMarkdown: true` (on by default)
- All markdown features enabled
- Reasonable cache limits (100 entries, 10MB, 5min TTL)

**Rationale:**
- Most users expect markdown to work out-of-the-box
- Advanced users can disable specific features
- Performance-conscious users can tune cache

### 5.3 Per-Message Control (Future)

**Option:** Add `renderAsMarkdown` flag to Message interface.

```typescript
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  renderAsMarkdown?: boolean; // NEW: Optional per-message override
}
```

**Not Implementing Now:**
- Adds complexity to initial integration
- Role-based rendering is sufficient for MVP
- Can be added later without breaking changes

---

## 6. Error Handling Strategy

### 6.1 Graceful Degradation

**Principle:** Widget should NEVER crash due to markdown failures.

**Error Scenarios:**

**Scenario 1: Lazy Loading Fails**
```typescript
// MarkdownPipeline.initialize()
try {
  const MarkdownIt = await LazyLoader.getMarkdownIt();
  this.renderer = new MarkdownRenderer(config);
} catch (error) {
  console.error('[MarkdownPipeline] Failed to load markdown:', error);

  // Fallback: Disable markdown rendering
  this.renderer = null;
  this.isInitialized = false;

  // Return plain text on subsequent calls
}
```

**Scenario 2: Rendering Fails**
```typescript
// MarkdownPipeline.renderAsync()
try {
  const html = this.renderer.render(markdown);
  return html;
} catch (error) {
  console.error('[MarkdownPipeline] Rendering failed:', error);

  // Fallback: Return escaped plain text
  const div = document.createElement('div');
  div.textContent = markdown;
  return div.innerHTML;
}
```

**Scenario 3: Cache Errors**
```typescript
// MarkdownPipeline.renderAsync()
try {
  const cached = this.cache.get(markdown);
  if (cached) return cached;
} catch (error) {
  console.error('[MarkdownPipeline] Cache error:', error);

  // Continue without cache (degrade performance, not functionality)
}
```

### 6.2 Fallback Hierarchy

```
1. Full markdown rendering with syntax highlighting
        ↓ (if lazy loading fails)
2. Markdown rendering without syntax highlighting
        ↓ (if markdown-it fails)
3. HTML-escaped plain text
        ↓ (always works)
4. Raw text (last resort)
```

### 6.3 User Experience on Errors

**Error State:**
- Message still displays (as plain text)
- No blank messages or crashes
- Console warning for developers
- Cache statistics show 0% hit rate (diagnostic)

**No User-Facing Errors:**
- No error messages in chat UI
- Silent degradation to plain text
- Widget remains functional

---

## 7. Performance Strategy

### 7.1 Bundle Impact

**Before Integration (Current):**
- main.js: 17KB (core widget)
- markdown.js: 25KB (markdown-it + DOMPurify)
- syntax.js: 6KB (Prism.js)
- **Total initial load:** 17KB
- **Total on first markdown:** 17KB + 25KB = 42KB
- **Total on first code block:** 42KB + 6KB = 48KB

**After Integration (Expected):**
- main.js: 18KB (+1KB for MarkdownPipeline integration)
- markdown.js: 25KB (unchanged)
- syntax.js: 6KB (unchanged)
- **Total initial load:** 18KB
- **Total on first markdown:** 18KB + 25KB = 43KB
- **Total on first code block:** 43KB + 6KB = 49KB

**Bundle Budget Check:**
- Current: 47KB gzipped
- After integration: ~49KB gzipped
- Limit: 50KB gzipped
- **Remaining:** ~1KB ✅ (within budget)

### 7.2 Lazy Loading Triggers

**Trigger 1: First Assistant Message**
- MessageList renders first assistant message
- Checks `config.features.enableMarkdown` (true)
- Calls `markdownPipeline.renderAsync()`
- Triggers lazy load (50-100ms)

**Trigger 2: First Code Block**
- MarkdownRenderer detects `<code class="language-">`
- Lazy loads Prism.js (30-50ms)
- Highlights code block
- Subsequent code blocks use cached Prism.js

**No Trigger:**
- User messages: Never trigger lazy load (plain text)
- Plain assistant messages: No markdown syntax detected
- Disabled markdown: `enableMarkdown: false`

### 7.3 Caching Strategy

**Cache Key:** Markdown content (full string)

**Cache Value:** Rendered HTML (safe, highlighted)

**Cache Eviction:**
1. **TTL eviction:** 5-minute expiration (prevents stale content)
2. **LRU eviction:** Least recently used when memory limit reached
3. **Memory eviction:** Total cache size exceeds 10MB

**Cache Hit Scenarios:**
- Repeated common messages ("How can I help?")
- FAQ responses (same answer repeated)
- Code examples (same snippet shown multiple times)
- Greetings and closings (high repetition)

**Expected Hit Rate:** 60-80% (based on typical chat patterns)

**Cache Performance:**
- Cache hit: <1ms (98% faster than re-parsing)
- Cache miss: 25ms (normal markdown rendering)
- Cache set: 1ms (hash + store)

### 7.4 Memory Management

**MarkdownCache Memory Limits:**
- Max entries: 100 messages
- Max memory: 10MB total
- Average entry size: ~500 bytes (typical message)
- Worst case: 100 entries * 100KB each = 10MB (limit enforced)

**LazyLoader Memory:**
- markdown-it instance: ~500KB
- Prism.js instance: ~200KB
- Total lazy-loaded: ~700KB (one-time cost)

**Total Memory Budget:**
- Widget core: ~2MB
- Markdown modules: ~700KB
- Cache: ~5-10MB (variable)
- **Total:** ~13-15MB (acceptable for modern browsers)

---

## 8. Testing Plan

### 8.1 Integration Tests (15-20 Tests)

**Test File:** `widget/tests/integration/markdown-pipeline.test.ts`

**Test Categories:**

**Category 1: Lazy Loading (4 tests)**
```typescript
describe('MarkdownPipeline - Lazy Loading', () => {
  it('should lazy load markdown-it on first render', async () => {
    // ARRANGE: Create pipeline, verify not loaded
    // ACT: Render markdown
    // ASSERT: markdown-it loaded, Prism.js not loaded yet
  });

  it('should lazy load Prism.js on first code block', async () => {
    // ARRANGE: Create pipeline, render plain markdown (no code)
    // ACT: Render markdown with code block
    // ASSERT: Prism.js loaded, syntax highlighting applied
  });

  it('should reuse loaded modules on subsequent renders', async () => {
    // ARRANGE: Render once (load modules)
    // ACT: Render again
    // ASSERT: No additional imports, same module instances
  });

  it('should handle lazy loading failures gracefully', async () => {
    // ARRANGE: Mock LazyLoader to throw error
    // ACT: Render markdown
    // ASSERT: Returns plain text, no crash
  });
});
```

**Category 2: Caching (5 tests)**
```typescript
describe('MarkdownPipeline - Caching', () => {
  it('should cache rendered HTML on first render', async () => {
    // ARRANGE: Create pipeline
    // ACT: Render markdown
    // ASSERT: Cache has entry, stats show 1 miss
  });

  it('should return cached HTML on duplicate content', async () => {
    // ARRANGE: Render markdown once (cache miss)
    // ACT: Render same markdown again
    // ASSERT: Cache hit, stats show 1 hit
  });

  it('should evict expired entries based on TTL', async () => {
    // ARRANGE: Render markdown, set TTL to 100ms
    // ACT: Wait 150ms, render again
    // ASSERT: Cache miss (expired), stats show eviction
  });

  it('should evict LRU entries when memory limit reached', async () => {
    // ARRANGE: Set maxMemory to 1KB
    // ACT: Render 10 large messages (>1KB total)
    // ASSERT: Only recent entries cached, LRU evicted
  });

  it('should handle cache errors gracefully', async () => {
    // ARRANGE: Mock MarkdownCache to throw error
    // ACT: Render markdown
    // ASSERT: Renders without cache, no crash
  });
});
```

**Category 3: Rendering (4 tests)**
```typescript
describe('MarkdownPipeline - Rendering', () => {
  it('should render markdown to safe HTML', async () => {
    // ARRANGE: Create pipeline
    // ACT: Render '**Bold**'
    // ASSERT: Returns '<p><strong>Bold</strong></p>'
  });

  it('should highlight code blocks with Prism.js', async () => {
    // ARRANGE: Create pipeline
    // ACT: Render '```js\nconst x = 1;\n```'
    // ASSERT: Contains '<span class="token keyword">const</span>'
  });

  it('should sanitize malicious markdown', async () => {
    // ARRANGE: Create pipeline
    // ACT: Render '<script>alert("XSS")</script>'
    // ASSERT: Script tags removed, safe HTML
  });

  it('should handle rendering errors gracefully', async () => {
    // ARRANGE: Mock MarkdownRenderer to throw error
    // ACT: Render markdown
    // ASSERT: Returns plain text fallback
  });
});
```

**Category 4: Configuration (3 tests)**
```typescript
describe('MarkdownPipeline - Configuration', () => {
  it('should respect enableMarkdown flag', async () => {
    // ARRANGE: Create pipeline with enableMarkdown: false
    // ACT: Render markdown
    // ASSERT: Returns plain text (no markdown parsing)
  });

  it('should apply markdownConfig to renderer', async () => {
    // ARRANGE: Create pipeline with enableTables: false
    // ACT: Render markdown table
    // ASSERT: Table not parsed (plain text)
  });

  it('should apply cacheConfig to cache', async () => {
    // ARRANGE: Create pipeline with maxEntries: 5
    // ACT: Render 10 messages
    // ASSERT: Only 5 cached (LRU eviction)
  });
});
```

**Category 5: Error Handling (4 tests)**
```typescript
describe('MarkdownPipeline - Error Handling', () => {
  it('should fallback to plain text if LazyLoader fails', async () => {
    // ARRANGE: Mock LazyLoader to reject
    // ACT: Render markdown
    // ASSERT: Returns escaped plain text
  });

  it('should fallback to plain text if MarkdownRenderer fails', async () => {
    // ARRANGE: Mock renderer to throw error
    // ACT: Render markdown
    // ASSERT: Returns escaped plain text
  });

  it('should continue if cache fails', async () => {
    // ARRANGE: Mock cache to throw error
    // ACT: Render markdown
    // ASSERT: Renders without cache, no crash
  });

  it('should never crash the widget', async () => {
    // ARRANGE: Mock all modules to fail
    // ACT: Render markdown
    // ASSERT: Returns plain text, no errors thrown
  });
});
```

**Total Tests:** 20 integration tests

### 8.2 E2E Test Scenarios (5 Tests)

**Test File:** `widget/tests/e2e/markdown-rendering.spec.ts`

**Scenario 1: First Message Lazy Load**
```typescript
test('should lazy load markdown on first assistant message', async ({ page }) => {
  // 1. Open widget
  // 2. Send user message
  // 3. Receive assistant message with markdown
  // 4. Verify markdown rendered (bold, links, etc.)
  // 5. Check network: markdown.js loaded
});
```

**Scenario 2: Code Block Highlighting**
```typescript
test('should highlight code blocks with syntax', async ({ page }) => {
  // 1. Open widget
  // 2. Receive message with ```js code block
  // 3. Verify syntax highlighting applied (<span class="token">)
  // 4. Check network: syntax.js loaded
});
```

**Scenario 3: Cache Performance**
```typescript
test('should cache duplicate messages', async ({ page }) => {
  // 1. Open widget
  // 2. Receive message "**Hello**"
  // 3. Receive same message again
  // 4. Measure render time (second should be <5ms)
});
```

**Scenario 4: Disable Markdown**
```typescript
test('should render plain text when markdown disabled', async ({ page }) => {
  // 1. Set window.ChatWidgetConfig.features.enableMarkdown = false
  // 2. Open widget
  // 3. Receive message "**Hello**"
  // 4. Verify plain text (no <strong> tag)
});
```

**Scenario 5: Error Handling**
```typescript
test('should gracefully degrade if markdown fails to load', async ({ page }) => {
  // 1. Block network requests to markdown.js
  // 2. Open widget
  // 3. Receive assistant message
  // 4. Verify plain text displayed (no crash)
});
```

**Total E2E Tests:** 5 scenarios

### 8.3 Performance Benchmarks

**Benchmark File:** `widget/tests/performance/markdown-pipeline.bench.ts`

**Benchmark 1: Lazy Loading Time**
```typescript
bench('Lazy load markdown-it', async () => {
  await LazyLoader.getMarkdownIt();
  // Target: <100ms
});

bench('Lazy load Prism.js', async () => {
  await LazyLoader.getPrismJs();
  // Target: <50ms
});
```

**Benchmark 2: Rendering Performance**
```typescript
bench('Render markdown (cold)', async () => {
  const pipeline = new MarkdownPipeline(config);
  await pipeline.renderAsync('**Hello** World');
  // Target: <150ms (includes lazy load)
});

bench('Render markdown (warm)', async () => {
  const pipeline = new MarkdownPipeline(config);
  await pipeline.renderAsync('**Hello**'); // Load modules
  await pipeline.renderAsync('**World**'); // Warm render
  // Target: <30ms
});

bench('Render markdown (cached)', async () => {
  const pipeline = new MarkdownPipeline(config);
  await pipeline.renderAsync('**Hello**'); // Cache
  await pipeline.renderAsync('**Hello**'); // Cache hit
  // Target: <1ms
});
```

**Benchmark 3: Cache Performance**
```typescript
bench('Cache lookup', () => {
  const cache = new MarkdownCache(config);
  cache.set('**Hello**', '<p><strong>Hello</strong></p>');
  cache.get('**Hello**');
  // Target: <1ms
});

bench('Cache eviction (LRU)', () => {
  const cache = new MarkdownCache({ maxEntries: 100, maxMemory: 10MB, ttl: 300000 });
  for (let i = 0; i < 200; i++) {
    cache.set(`Message ${i}`, `<p>Message ${i}</p>`);
  }
  // Target: <50ms total (0.5ms per eviction)
});
```

---

## 9. Implementation Checklist

### Phase 1: Type Definitions (Day 9 Morning)

**Task 1.1: Update WidgetConfig Types**
- [ ] Edit `widget/src/types.ts`
- [ ] Add `enableMarkdown?: boolean` to FeaturesConfig
- [ ] Add `markdownConfig?: MarkdownConfig` to FeaturesConfig
- [ ] Add `cacheConfig?: CacheConfig` to FeaturesConfig
- [ ] Import MarkdownConfig from markdown-renderer
- [ ] Import CacheConfig from markdown-cache
- [ ] Run `npm run type-check` (verify no errors)

**Estimated Time:** 15 minutes

---

### Phase 2: Configuration Defaults (Day 9 Morning)

**Task 2.1: Update Config Manager**
- [ ] Edit `widget/src/core/config.ts`
- [ ] Add markdown config to DEFAULT_CONFIG.features
- [ ] Set `enableMarkdown: true` (default enabled)
- [ ] Set sensible markdownConfig defaults (all features enabled)
- [ ] Set sensible cacheConfig defaults (100 entries, 10MB, 5min)
- [ ] Update mergeConfig() to deep merge markdown config
- [ ] Run `npm run test -- config.test.ts` (verify tests pass)

**Estimated Time:** 20 minutes

---

### Phase 3: MarkdownPipeline Orchestrator (Day 9 Afternoon)

**Task 3.1: Create MarkdownPipeline (RED)**
- [ ] Create `widget/tests/integration/markdown-pipeline.test.ts`
- [ ] Write failing test: "should lazy load markdown-it on first render"
- [ ] Run test (verify RED)

**Task 3.2: Implement MarkdownPipeline (GREEN)**
- [ ] Create `widget/src/utils/markdown-pipeline.ts`
- [ ] Implement constructor (initialize cache)
- [ ] Implement renderAsync() method
- [ ] Implement initialize() method (lazy load modules)
- [ ] Implement error handling (graceful degradation)
- [ ] Implement isLoaded() method
- [ ] Implement getCacheStats() method
- [ ] Add JSDoc documentation
- [ ] Run test (verify GREEN)

**Task 3.3: Add More Tests (RED → GREEN)**
- [ ] Write test: "should cache rendered HTML on first render"
- [ ] Implement caching logic (make test GREEN)
- [ ] Write test: "should return cached HTML on duplicate content"
- [ ] Verify cache hit logic (make test GREEN)
- [ ] Write test: "should handle lazy loading failures gracefully"
- [ ] Implement error handling (make test GREEN)
- [ ] Write test: "should lazy load Prism.js on first code block"
- [ ] Verify Prism.js lazy load (make test GREEN)
- [ ] Write remaining 16 tests (see Testing Plan section)
- [ ] Implement features to pass all tests
- [ ] Run `npm run test` (verify all 20 tests GREEN)

**Estimated Time:** 3-4 hours

---

### Phase 4: MessageList Integration (Day 10 Morning)

**Task 4.1: Update MessageList Tests (RED)**
- [ ] Edit `widget/tests/unit/ui/message-list.test.ts`
- [ ] Add test: "should render assistant messages as markdown when enabled"
- [ ] Add test: "should render assistant messages as plain text when disabled"
- [ ] Add test: "should render user messages as plain text always"
- [ ] Add test: "should handle markdown rendering errors gracefully"
- [ ] Run tests (verify RED)

**Task 4.2: Integrate MarkdownPipeline into MessageList (GREEN)**
- [ ] Edit `widget/src/ui/message-list.ts`
- [ ] Import MarkdownPipeline at top
- [ ] Add `private markdownPipeline: MarkdownPipeline | null` field
- [ ] Initialize markdownPipeline in constructor (if enableMarkdown)
- [ ] Update renderMessages() method:
  - [ ] Check if `message.role === 'assistant' && config.features.enableMarkdown`
  - [ ] Call `await markdownPipeline.renderAsync(message.content)`
  - [ ] Use `messageElement.innerHTML = html` for markdown
  - [ ] Use `messageElement.textContent = content` for plain text
- [ ] Add error handling (fallback to plain text)
- [ ] Run tests (verify GREEN)

**Estimated Time:** 2 hours

---

### Phase 5: Integration Testing (Day 10 Afternoon)

**Task 5.1: Run All Unit Tests**
- [ ] Run `npm run test`
- [ ] Verify all tests pass (including MessageList changes)
- [ ] Fix any regressions

**Task 5.2: Manual Testing**
- [ ] Start dev server: `npm run dev`
- [ ] Open widget in browser
- [ ] Test scenario 1: Send message, verify markdown renders
- [ ] Test scenario 2: Send code block, verify syntax highlighting
- [ ] Test scenario 3: Send duplicate messages, verify caching (check console)
- [ ] Test scenario 4: Disable markdown, verify plain text
- [ ] Test scenario 5: Block network, verify graceful degradation

**Task 5.3: Bundle Size Check**
- [ ] Run `npm run build`
- [ ] Check dist/ folder sizes:
  - [ ] main.js: Should be ~18KB gzipped
  - [ ] markdown.js: Should be ~25KB gzipped
  - [ ] syntax.js: Should be ~6KB gzipped
  - [ ] Total initial: Should be ~18KB
  - [ ] Total with markdown: Should be ~43KB
  - [ ] Total with code: Should be ~49KB ✅ (within 50KB limit)
- [ ] If over budget, identify and remove bloat

**Estimated Time:** 2 hours

---

### Phase 6: Documentation & Cleanup (Day 10 End)

**Task 6.1: Update Documentation**
- [ ] Create integration architecture doc (this file)
- [ ] Update PLANNING.md with integration status
- [ ] Update todo.md with completion
- [ ] Update decisions.md with integration decisions
- [ ] Update DEVELOPMENT_LOG.md with Week 4 Day 9-10 entry

**Task 6.2: Code Review**
- [ ] Review all changed files for:
  - [ ] Type safety (no `any` types)
  - [ ] Error handling (no unhandled promises)
  - [ ] Documentation (all public methods documented)
  - [ ] Performance (no blocking operations)
  - [ ] Security (no XSS vectors)
- [ ] Run linter: `npm run lint`
- [ ] Fix any linting issues

**Task 6.3: Git Commit**
- [ ] Stage changes: `git add .`
- [ ] Commit with message:
  ```
  feat(widget): Integrate markdown rendering into MessageList

  - Add MarkdownPipeline orchestrator for lazy loading and caching
  - Update MessageList to render assistant messages as markdown
  - Add enableMarkdown config flag (default: true)
  - Add 20 integration tests (all GREEN)
  - Bundle size: 49KB gzipped (within 50KB limit)

  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude <noreply@anthropic.com>
  ```
- [ ] Push to remote: `git push origin main`

**Estimated Time:** 1 hour

---

### Total Implementation Time

**Day 9:**
- Phase 1: 15 minutes
- Phase 2: 20 minutes
- Phase 3: 4 hours
- **Total Day 9:** ~4.5 hours

**Day 10:**
- Phase 4: 2 hours
- Phase 5: 2 hours
- Phase 6: 1 hour
- **Total Day 10:** ~5 hours

**Grand Total:** ~9-10 hours (fits within 2-day allocation)

---

## 10. Success Criteria

### 10.1 Functional Requirements

- ✅ Assistant messages render as markdown by default
- ✅ User messages render as plain text always
- ✅ Code blocks have syntax highlighting
- ✅ Markdown features configurable (tables, links, images, etc.)
- ✅ Markdown can be disabled via `enableMarkdown: false`
- ✅ Widget works without markdown (backward compatible)

### 10.2 Performance Requirements

- ✅ Initial bundle: <20KB gzipped (target: 18KB)
- ✅ First markdown render: <150ms (includes lazy load)
- ✅ Warm markdown render: <30ms (modules loaded)
- ✅ Cached markdown render: <1ms (cache hit)
- ✅ Cache hit rate: >60% (typical chat patterns)
- ✅ Total bundle with all features: <50KB gzipped

### 10.3 Reliability Requirements

- ✅ No crashes on markdown errors (graceful degradation)
- ✅ No crashes on lazy loading failures (fallback to plain text)
- ✅ No crashes on cache errors (continue without cache)
- ✅ XSS prevention maintained (sanitizer still applied)
- ✅ Memory limits enforced (cache eviction working)

### 10.4 Testing Requirements

- ✅ 20 integration tests GREEN
- ✅ All existing tests still GREEN (no regressions)
- ✅ 5 E2E scenarios pass (manual or Playwright)
- ✅ Performance benchmarks meet targets
- ✅ Bundle size within budget

### 10.5 Code Quality Requirements

- ✅ No `any` types without justification
- ✅ All public methods documented (JSDoc)
- ✅ Error handling for all async operations
- ✅ No console errors in production
- ✅ No linting errors
- ✅ Module size within limits (MarkdownPipeline <400 LOC)

---

## 11. Risks & Mitigations

### Risk 1: Bundle Size Exceeds 50KB

**Probability:** Medium
**Impact:** High (breaks performance target)

**Mitigation:**
- Monitor bundle size after every change
- Use `npm run build` and check dist/ folder
- If over budget:
  - Remove unused markdown features (e.g., tables)
  - Lazy load more aggressively (split cache into chunk)
  - Minify more aggressively (terser options)

**Contingency:**
- Disable syntax highlighting (saves 6KB)
- Disable markdown caching (saves ~1KB)
- Make markdown opt-in instead of default

---

### Risk 2: Async Rendering Causes UI Flicker

**Probability:** Low
**Impact:** Medium (poor UX)

**Mitigation:**
- Show loading spinner during first markdown render
- Pre-render skeleton UI while markdown loads
- Cache renders to make subsequent updates instant

**Contingency:**
- Switch to synchronous rendering (bundle markdown-it in main chunk)
- Accept larger initial bundle (trade-off)

---

### Risk 3: Cache Eviction Too Aggressive

**Probability:** Low
**Impact:** Low (degraded performance, not broken)

**Mitigation:**
- Tune cache config based on telemetry
- Increase maxEntries if hit rate < 60%
- Increase TTL if users report "re-loading" behavior

**Contingency:**
- Disable cache entirely (fallback to no caching)
- Still works, just slower (25ms vs 1ms)

---

### Risk 4: Markdown Rendering Errors

**Probability:** Low
**Impact:** Medium (messages don't display)

**Mitigation:**
- Comprehensive error handling (try-catch everywhere)
- Fallback to plain text on any error
- Log errors to console for debugging

**Contingency:**
- Disable markdown for specific users (server-side flag)
- Roll back integration (plain text only)

---

### Risk 5: Breaking Changes to MessageList

**Probability:** Medium
**Impact:** High (existing tests fail)

**Mitigation:**
- Write tests BEFORE changing MessageList (TDD)
- Run tests after every change
- Keep changes minimal (only add markdown rendering)

**Contingency:**
- Revert changes if tests fail
- Fix regressions before proceeding

---

## 12. Future Enhancements

### Enhancement 1: Auto-Detect Markdown Syntax

**Current:** Always parse markdown for assistant messages.

**Future:** Only parse if message contains markdown syntax.

**Implementation:**
```typescript
function hasMarkdownSyntax(text: string): boolean {
  const patterns = [
    /\*\*.*\*\*/,  // Bold
    /\*.*\*/,      // Italic
    /\[.*\]\(.*\)/, // Links
    /```/,         // Code blocks
    /^#+\s/m,      // Headings
  ];
  return patterns.some(p => p.test(text));
}

// In MessageList
if (message.role === 'assistant' && hasMarkdownSyntax(message.content)) {
  const html = await markdownPipeline.renderAsync(message.content);
  messageElement.innerHTML = html;
} else {
  messageElement.textContent = message.content;
}
```

**Benefits:**
- Faster for plain text messages (no parsing overhead)
- Lazy load only when needed

**Trade-offs:**
- Regex checks add 1-2ms overhead
- May miss edge case markdown syntax

---

### Enhancement 2: Per-Message Markdown Toggle

**Current:** All assistant messages render as markdown.

**Future:** Per-message `renderAsMarkdown` flag.

**Implementation:**
```typescript
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  renderAsMarkdown?: boolean; // NEW
}

// In MessageList
if (message.renderAsMarkdown) {
  const html = await markdownPipeline.renderAsync(message.content);
  messageElement.innerHTML = html;
} else {
  messageElement.textContent = message.content;
}
```

**Benefits:**
- Fine-grained control per message
- N8n workflow can decide markdown vs plain text

**Trade-offs:**
- Adds complexity to Message interface
- Requires N8n workflow changes

---

### Enhancement 3: Custom Markdown Renderers

**Current:** Single MarkdownRenderer with fixed config.

**Future:** Allow users to provide custom markdown-it plugins.

**Implementation:**
```typescript
interface MarkdownPipelineConfig {
  markdownConfig: MarkdownConfig;
  cacheConfig: CacheConfig;
  customPlugins?: Array<(md: MarkdownIt) => void>; // NEW
}

// In MarkdownPipeline
this.renderer = new MarkdownRenderer(config);
if (config.customPlugins) {
  config.customPlugins.forEach(plugin => plugin(this.renderer.md));
}
```

**Benefits:**
- Extensibility for power users
- Support for custom markdown syntax (e.g., math, diagrams)

**Trade-offs:**
- Security risk (user-provided plugins)
- Bundle size impact (plugins add weight)

---

### Enhancement 4: Server-Side Markdown Rendering

**Current:** Client-side rendering with lazy loading.

**Future:** Option to render markdown on server (N8n workflow).

**Implementation:**
```typescript
// N8n workflow returns pre-rendered HTML
{
  "response": "<p><strong>Hello</strong></p>",
  "renderAsMarkdown": false // Already rendered
}

// Widget skips markdown parsing
if (message.role === 'assistant' && !message.preRendered) {
  const html = await markdownPipeline.renderAsync(message.content);
  messageElement.innerHTML = html;
} else {
  messageElement.innerHTML = message.content; // Use pre-rendered
}
```

**Benefits:**
- Zero bundle cost (no markdown-it needed)
- Faster rendering (server pre-renders)
- SEO benefits (for static content)

**Trade-offs:**
- Requires N8n workflow changes
- Server CPU cost
- Less flexible (can't change config client-side)

---

## 13. Appendix: Code Examples

### A1: MarkdownPipeline Full Implementation

```typescript
/**
 * Markdown Pipeline
 *
 * Purpose: Orchestrate lazy loading, caching, and rendering for markdown
 * Responsibility: Coordinate MarkdownRenderer, LazyLoader, and MarkdownCache
 * Assumptions: Modules may fail to load, cache may error, renderer may crash
 */

import { MarkdownRenderer, MarkdownConfig } from './markdown-renderer';
import { MarkdownCache, CacheConfig, CacheStatistics } from './markdown-cache';
import { LazyLoader } from './lazy-loader';

/**
 * Configuration interface for MarkdownPipeline
 */
export interface MarkdownPipelineConfig {
  /** Markdown rendering configuration */
  markdownConfig: MarkdownConfig;

  /** Cache configuration */
  cacheConfig: CacheConfig;

  /** Enable markdown rendering (master toggle) */
  enabled: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: MarkdownPipelineConfig = {
  markdownConfig: {
    enableTables: true,
    enableCodeBlocks: true,
    enableBlockquotes: true,
    enableLinks: true,
    enableImages: true,
    enableLineBreaks: true,
    maxNesting: 20,
  },
  cacheConfig: {
    maxEntries: 100,
    maxMemory: 10 * 1024 * 1024, // 10MB
    ttl: 5 * 60 * 1000, // 5 minutes
  },
  enabled: true,
};

/**
 * Markdown Pipeline Orchestrator
 *
 * Provides high-level API for markdown rendering with lazy loading and caching.
 * Handles errors gracefully and degrades to plain text on failures.
 *
 * @example
 * const pipeline = new MarkdownPipeline({
 *   markdownConfig: { enableTables: true, ... },
 *   cacheConfig: { maxEntries: 100, ... },
 *   enabled: true,
 * });
 *
 * const html = await pipeline.renderAsync('**Hello** World');
 * // Returns: '<p><strong>Hello</strong> World</p>'
 */
export class MarkdownPipeline {
  private config: MarkdownPipelineConfig;
  private renderer: MarkdownRenderer | null = null;
  private cache: MarkdownCache;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Creates a new Markdown Pipeline instance
   *
   * @param config - Pipeline configuration
   */
  constructor(config: Partial<MarkdownPipelineConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      markdownConfig: {
        ...DEFAULT_CONFIG.markdownConfig,
        ...(config.markdownConfig || {}),
      },
      cacheConfig: {
        ...DEFAULT_CONFIG.cacheConfig,
        ...(config.cacheConfig || {}),
      },
    };

    // Initialize cache (synchronous, always available)
    this.cache = new MarkdownCache(this.config.cacheConfig);
  }

  /**
   * Renders markdown to safe HTML (async for lazy loading)
   *
   * Flow:
   * 1. Check if markdown is enabled (if not, return plain text)
   * 2. Check cache for existing render
   * 3. Lazy load modules if needed (first call only)
   * 4. Render markdown to HTML
   * 5. Cache result for future calls
   * 6. Return safe HTML
   *
   * Error Handling:
   * - If lazy loading fails: return plain text
   * - If rendering fails: return plain text
   * - If caching fails: continue without cache
   *
   * @param markdown - Raw markdown text
   * @returns Safe HTML string or plain text on error
   *
   * @example
   * const html = await pipeline.renderAsync('**Bold**');
   * // Returns: '<p><strong>Bold</strong></p>'
   */
  async renderAsync(markdown: string): Promise<string> {
    // Step 0: Check if markdown is enabled
    if (!this.config.enabled) {
      return this.escapeHTML(markdown);
    }

    // Step 1: Check cache (fast path)
    try {
      const cached = this.cache.get(markdown);
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.error('[MarkdownPipeline] Cache error (continuing without cache):', error);
      // Continue without cache (degrade performance, not functionality)
    }

    // Step 2: Initialize renderer (lazy load if needed)
    if (!this.isInitialized) {
      try {
        await this.initialize();
      } catch (error) {
        console.error('[MarkdownPipeline] Initialization failed:', error);
        // Fallback to plain text
        return this.escapeHTML(markdown);
      }
    }

    // Step 3: Render markdown
    try {
      if (!this.renderer) {
        throw new Error('Renderer not initialized');
      }

      const html = this.renderer.render(markdown);

      // Step 4: Cache result
      try {
        this.cache.set(markdown, html);
      } catch (error) {
        console.error('[MarkdownPipeline] Cache set failed (continuing):', error);
        // Continue without caching (performance impact only)
      }

      return html;
    } catch (error) {
      console.error('[MarkdownPipeline] Rendering failed:', error);
      // Fallback to plain text
      return this.escapeHTML(markdown);
    }
  }

  /**
   * Lazy loads markdown-it and creates MarkdownRenderer instance
   *
   * Uses LazyLoader to dynamically import markdown-it.
   * Prism.js is lazy loaded internally by SyntaxHighlighter.
   *
   * @private
   * @throws Error if lazy loading fails
   */
  private async initialize(): Promise<void> {
    // Prevent race conditions (multiple concurrent calls)
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        // Lazy load markdown-it
        const MarkdownIt = await LazyLoader.getMarkdownIt();

        // Create renderer instance
        // Note: SyntaxHighlighter will lazy load Prism.js internally on first code block
        this.renderer = new MarkdownRenderer(this.config.markdownConfig);

        this.isInitialized = true;
      } catch (error) {
        console.error('[MarkdownPipeline] Failed to initialize:', error);

        // Clear state on error
        this.renderer = null;
        this.isInitialized = false;
        this.initializationPromise = null;

        // Re-throw for caller to handle
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Checks if markdown modules are fully loaded
   *
   * @returns true if initialized, false otherwise
   *
   * @example
   * if (pipeline.isLoaded()) {
   *   // Modules ready, rendering will be fast
   * }
   */
  isLoaded(): boolean {
    return this.isInitialized;
  }

  /**
   * Gets cache statistics
   *
   * Useful for monitoring cache performance and hit rates.
   *
   * @returns Cache statistics object
   *
   * @example
   * const stats = pipeline.getCacheStats();
   * console.log(`Hit rate: ${stats.hitRate * 100}%`);
   * console.log(`Cache size: ${stats.totalSize} bytes`);
   */
  getCacheStats(): CacheStatistics {
    return this.cache.getStats();
  }

  /**
   * Clears cache and resets statistics
   *
   * Useful for testing or memory management.
   *
   * @example
   * pipeline.clearCache();
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Escapes HTML special characters to prevent XSS
   *
   * Used as fallback when markdown rendering fails.
   *
   * @param text - Plain text to escape
   * @returns HTML-escaped text
   * @private
   */
  private escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
```

### A2: MessageList Integration Example

```typescript
// In widget/src/ui/message-list.ts

import { MarkdownPipeline } from '../utils/markdown-pipeline';

export class MessageList {
  private config: WidgetConfig;
  private stateManager: StateManager;
  private element: HTMLElement | null = null;
  private markdownPipeline: MarkdownPipeline | null = null; // NEW

  constructor(config: WidgetConfig, stateManager: StateManager) {
    this.config = config;
    this.stateManager = stateManager;

    // Initialize markdown pipeline if enabled
    if (config.features.enableMarkdown) {
      this.markdownPipeline = new MarkdownPipeline({
        markdownConfig: config.features.markdownConfig,
        cacheConfig: config.features.cacheConfig,
        enabled: true,
      });
    }
  }

  /**
   * Renders messages into the container
   */
  private async renderMessages(): Promise<void> {
    if (!this.element) return;

    const state = this.stateManager.getState();
    const messages = state.messages || [];

    // Clear existing content
    this.element.innerHTML = '';

    // Show empty state if no messages
    if (messages.length === 0) {
      this.renderEmptyState();
      return;
    }

    // Render each message
    for (const message of messages) {
      const messageElement = document.createElement('div');
      messageElement.className = 'cw-message';

      // Add role-specific class
      if (message.role === 'user') {
        messageElement.classList.add('cw-message-user');
      } else if (message.role === 'assistant') {
        messageElement.classList.add('cw-message-assistant');
      }

      // Apply message styling
      const isUser = message.role === 'user';
      const baseStyles = [
        'margin-bottom: 12px',
        'padding: 12px 16px',
        'border-radius: 12px',
        'max-width: 80%',
        'word-wrap: break-word',
      ];

      if (isUser) {
        baseStyles.push(
          'margin-left: auto',
          `background-color: ${hexToRgb(this.config.style.primaryColor || '#00bfff')}`,
          'color: white',
          'text-align: right'
        );
      } else {
        baseStyles.push(
          'margin-right: auto',
          'background-color: #f0f0f0',
          'color: #333',
          'text-align: left'
        );
      }

      messageElement.style.cssText = baseStyles.join('; ');

      // NEW: Render message content with markdown support
      if (message.role === 'assistant' && this.markdownPipeline) {
        try {
          const html = await this.markdownPipeline.renderAsync(message.content || '');
          messageElement.innerHTML = html;
        } catch (error) {
          console.error('[MessageList] Markdown rendering failed:', error);
          // Fallback to plain text
          messageElement.textContent = message.content || '';
        }
      } else {
        // User messages or markdown disabled: use plain text
        messageElement.textContent = message.content || '';
      }

      this.element!.appendChild(messageElement);
    }

    this.previousMessageCount = messages.length;
  }

  // ... rest of MessageList implementation
}
```

---

## 14. Decision Log

### Decision 1: Create MarkdownPipeline Orchestrator

**Status:** Accepted
**Date:** 2025-11-12

**Rationale:**
- Separation of concerns: MessageList shouldn't know about lazy loading or caching
- Single entry point: One class to manage all markdown modules
- Error handling: Centralized fallback logic
- Testing: Easy to mock/test integration

**Alternatives Considered:**
1. **Direct integration:** Call LazyLoader, MarkdownRenderer, MarkdownCache from MessageList
   - ❌ Too much complexity in MessageList
   - ❌ Harder to test
   - ❌ Violates single responsibility principle

2. **Use existing MarkdownRenderer directly:**
   - ❌ No lazy loading (bundle size impact)
   - ❌ No caching (performance impact)
   - ❌ No error handling (crashes on errors)

**Impact:**
- Code quality: High positive (clean architecture)
- Testability: High positive (easy to mock)
- Module size: +250 LOC (within ideal range)

---

### Decision 2: Always Enable Markdown by Default

**Status:** Accepted
**Date:** 2025-11-12

**Rationale:**
- User expectation: Most chat widgets support markdown
- Competitive parity: Other widgets (Intercom, Drift) support markdown
- Minimal cost: Lazy loading keeps initial bundle small
- Easy to disable: `enableMarkdown: false` flag available

**Alternatives Considered:**
1. **Opt-in markdown:** Require users to enable markdown explicitly
   - ❌ Poor out-of-box experience
   - ❌ Users may not discover feature
   - ✅ Slightly smaller bundle (no markdown code at all)

2. **Auto-detect markdown:** Only parse if syntax detected
   - ✅ Slightly faster for plain text
   - ❌ Regex overhead (1-2ms per message)
   - ❌ May miss edge cases

**Impact:**
- User experience: High positive (works out-of-box)
- Bundle size: Neutral (lazy loading mitigates)
- Adoption: High positive (feature discoverable)

---

### Decision 3: Render Only Assistant Messages as Markdown

**Status:** Accepted
**Date:** 2025-11-12

**Rationale:**
- Security: User messages are untrusted input (should be escaped)
- Performance: User messages rarely contain markdown
- Consistency: Matches industry standard (Slack, Discord, etc.)
- Simplicity: One rule to remember (assistants = markdown, users = plain text)

**Alternatives Considered:**
1. **Render all messages as markdown:**
   - ❌ Security risk (user input rendered as HTML)
   - ❌ Performance impact (more parsing)
   - ❌ May break existing plain text messages

2. **Per-message flag:**
   - ✅ Maximum flexibility
   - ❌ Adds complexity
   - ❌ Requires backend changes

**Impact:**
- Security: High positive (no XSS from user messages)
- Performance: Medium positive (fewer messages to parse)
- User experience: Neutral (users expect plain text)

---

## 15. Summary

This architecture plan provides a **comprehensive, test-driven approach** to integrating the five completed markdown modules into the chat widget. The design:

**Minimizes Changes:**
- Only 3 files modified (types.ts, config.ts, message-list.ts)
- 1 new file created (markdown-pipeline.ts)
- No changes to existing markdown modules

**Maintains Backward Compatibility:**
- Plain text still works (default if markdown disabled)
- User messages always plain text (no breaking changes)
- Widget loads instantly (lazy loading keeps initial bundle small)

**Optimizes Performance:**
- Lazy loading reduces initial bundle by 64% (48KB → 18KB)
- Caching provides 98% performance improvement on cache hits
- Bundle stays within 50KB limit (49KB total with all features)

**Provides Graceful Degradation:**
- Never crashes (all errors caught and handled)
- Fallback to plain text if modules fail to load
- Continues without cache if cache errors

**Is Fully Testable:**
- 20 integration tests planned
- 5 E2E scenarios defined
- Performance benchmarks specified
- TDD workflow maintained (RED → GREEN → REFACTOR)

**Next Steps:**
1. Review this architecture plan
2. Begin implementation (Day 9 morning)
3. Follow TDD workflow (tests first!)
4. Complete integration by Day 10 end
5. Celebrate successful markdown integration! 🎉

---

**Last Updated:** 2025-11-12
**Author:** Architect/Planner Agent
**Status:** Ready for Implementation ✅
