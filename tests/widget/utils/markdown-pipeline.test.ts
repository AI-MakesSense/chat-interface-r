/**
 * @vitest-environment jsdom
 *
 * RED Integration Tests for MarkdownPipeline
 *
 * Tests for widget/src/utils/markdown-pipeline.ts
 *
 * WHY THESE TESTS WILL FAIL:
 * - Production module does not exist yet (widget/src/utils/markdown-pipeline.ts)
 * - MarkdownPipeline class is not implemented
 * - Integration between LazyLoader, MarkdownCache, MarkdownRenderer, SyntaxHighlighter not built
 * - This is the RED phase of TDD - tests are written BEFORE production code
 *
 * Test Coverage:
 * - Lazy Loading (4 tests): Tests 1-4
 * - Caching (5 tests): Tests 5-9
 * - Rendering (4 tests): Tests 10-13
 * - Configuration (3 tests): Tests 14-16
 * - Error Handling (4 tests): Tests 17-20
 *
 * Module Purpose:
 * - Orchestrate complete markdown rendering pipeline
 * - Coordinate LazyLoader, MarkdownCache, MarkdownRenderer, SyntaxHighlighter
 * - Provide graceful degradation (never crash, always show content)
 * - Optimize performance (lazy load, cache, async rendering)
 *
 * Architecture:
 * - MarkdownPipeline is the public-facing orchestrator
 * - Uses LazyLoader to dynamically import markdown-it and Prism.js
 * - Uses MarkdownCache for LRU caching with TTL
 * - Uses MarkdownRenderer for markdown-to-HTML conversion
 * - Uses SyntaxHighlighter for code syntax highlighting
 * - Handles all errors gracefully (returns escaped text on failure)
 *
 * Performance Goals:
 * - First render: <100ms (includes lazy loading)
 * - Cached render: <1ms (cache hit)
 * - Cache hit rate: >60% (typical chat widget usage)
 * - Bundle size: Lazy modules not in initial bundle
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Import existing utilities (already implemented and tested)
import { XssSanitizer } from '../../../widget/src/utils/xss-sanitizer';
import { MarkdownRenderer, MarkdownConfig } from '../../../widget/src/utils/markdown-renderer';
import { SyntaxHighlighter, STANDARD_HIGHLIGHTER_CONFIG } from '../../../widget/src/utils/syntax-highlighter';
import { LazyLoader } from '../../../widget/src/utils/lazy-loader';
import { MarkdownCache, CacheConfig, CacheStatistics } from '../../../widget/src/utils/markdown-cache';

// @ts-expect-error - Module does not exist yet (RED phase)
import { MarkdownPipeline, STANDARD_MARKDOWN_CONFIG } from '../../../widget/src/utils/markdown-pipeline';

describe('MarkdownPipeline - RED Integration Tests', () => {
  let pipeline: MarkdownPipeline;
  let defaultConfig: MarkdownConfig;
  let defaultCacheConfig: CacheConfig;

  beforeEach(() => {
    // Default markdown configuration
    defaultConfig = {
      enableTables: true,
      enableCodeBlocks: true,
      enableBlockquotes: true,
      enableLinks: true,
      enableImages: true,
      enableLineBreaks: true,
      maxNesting: 20,
    };

    // Default cache configuration
    defaultCacheConfig = {
      maxEntries: 100,
      maxSize: 10 * 1024 * 1024, // 10MB
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxItemSize: 100 * 1024, // 100KB
    };

    // @ts-expect-error - MarkdownPipeline does not exist yet
    pipeline = new MarkdownPipeline(defaultConfig, defaultCacheConfig);

    // Reset any global state
    vi.clearAllMocks();
  });

  // ============================================================
  // LAZY LOADING TESTS (4 tests)
  // Tests that MarkdownPipeline lazy-loads markdown-it and Prism.js
  // ============================================================

  // ============================================================
  // Test 1: Should lazy load markdown-it on first renderAsync() call
  // WHY IT WILL FAIL: MarkdownPipeline.renderAsync does not exist yet
  // ============================================================

  it('should lazy load markdown-it on first renderAsync call', async () => {
    // ARRANGE
    const markdown = '# Hello World';

    // SPY: Track if LazyLoader.getMarkdownIt is called
    const getMarkdownItSpy = vi.spyOn(LazyLoader, 'getMarkdownIt');

    // ACT
    const result = await pipeline.renderAsync(markdown);

    // ASSERT
    // Should have called LazyLoader.getMarkdownIt to load markdown-it
    expect(getMarkdownItSpy).toHaveBeenCalledTimes(1);

    // Should render markdown correctly
    expect(result).toContain('<h1>');
    expect(result).toContain('Hello World');
    expect(result).toContain('</h1>');
  });

  // ============================================================
  // Test 2: Should lazy load Prism.js on first renderAsync() call with code
  // WHY IT WILL FAIL: MarkdownPipeline.renderAsync does not exist yet
  // ============================================================

  it('should lazy load Prism.js on first renderAsync call with code block', async () => {
    // ARRANGE
    const markdown = '```javascript\nconst x = 10;\n```';

    // SPY: Track if LazyLoader.getPrismJs is called
    const getPrismJsSpy = vi.spyOn(LazyLoader, 'getPrismJs');

    // ACT
    const result = await pipeline.renderAsync(markdown);

    // ASSERT
    // Should have called LazyLoader.getPrismJs to load Prism.js
    expect(getPrismJsSpy).toHaveBeenCalledTimes(1);

    // Should render code block with syntax highlighting
    expect(result).toContain('<pre>');
    expect(result).toContain('<code');
    // Check for individual tokens (Prism.js tokenizes code into spans)
    expect(result).toContain('const');   // keyword token
    expect(result).toContain('10');      // number token
  });

  // ============================================================
  // Test 3: Should not reload modules on subsequent renderAsync() calls
  // WHY IT WILL FAIL: MarkdownPipeline.renderAsync does not exist yet
  // ============================================================

  it('should not reload modules on subsequent renderAsync calls', async () => {
    // ARRANGE
    const markdown1 = '# First render';
    const markdown2 = '# Second render';

    // SPY: Track LazyLoader calls
    const getMarkdownItSpy = vi.spyOn(LazyLoader, 'getMarkdownIt');

    // ACT
    await pipeline.renderAsync(markdown1); // First call (lazy load)
    await pipeline.renderAsync(markdown2); // Second call (should reuse)

    // ASSERT
    // Should only call LazyLoader.getMarkdownIt once (singleton pattern)
    expect(getMarkdownItSpy).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // Test 4: Should handle lazy loading failures gracefully
  // WHY IT WILL FAIL: MarkdownPipeline.renderAsync does not exist yet
  // ============================================================

  it('should handle lazy loading failures gracefully', async () => {
    // ARRANGE
    const markdown = '# Hello **World**';

    // MOCK: Force LazyLoader.getMarkdownIt to fail
    vi.spyOn(LazyLoader, 'getMarkdownIt').mockRejectedValueOnce(
      new Error('Failed to load markdown-it')
    );

    // ACT
    const result = await pipeline.renderAsync(markdown);

    // ASSERT
    // Should not throw error
    expect(result).toBeDefined();

    // Should return escaped text as fallback
    // Fallback behavior: escape HTML entities and return plain text
    expect(result).toContain('Hello');
    expect(result).toContain('World');

    // Should NOT contain raw markdown syntax (should be escaped or removed)
    // The exact fallback format is implementation-dependent
    expect(result).toBeTruthy(); // Just verify it returns something
  });

  // ============================================================
  // CACHING TESTS (5 tests)
  // Tests that MarkdownPipeline caches rendered markdown
  // ============================================================

  // ============================================================
  // Test 5: Should cache rendered markdown by content hash
  // WHY IT WILL FAIL: MarkdownPipeline.getCacheStats does not exist yet
  // ============================================================

  it('should cache rendered markdown by content hash', async () => {
    // ARRANGE
    const markdown = '**Bold text**';

    // ACT
    await pipeline.renderAsync(markdown); // First render (cache miss)
    const stats = pipeline.getCacheStats();

    // ASSERT
    // Should have 1 cache miss (first render)
    expect(stats.misses).toBe(1);

    // Should have cached the result
    expect(stats.size).toBe(1);
    expect(stats.totalSize).toBeGreaterThan(0);
  });

  // ============================================================
  // Test 6: Should return cached result on repeated markdown
  // WHY IT WILL FAIL: MarkdownPipeline.renderAsync does not exist yet
  // ============================================================

  it('should return cached result on repeated markdown', async () => {
    // ARRANGE
    const markdown = '**Bold text**';

    // ACT
    const result1 = await pipeline.renderAsync(markdown); // Cache miss
    const result2 = await pipeline.renderAsync(markdown); // Cache hit

    const stats = pipeline.getCacheStats();

    // ASSERT
    // Results should be identical
    expect(result1).toBe(result2);

    // Should have 1 cache miss and 1 cache hit
    expect(stats.misses).toBe(1);
    expect(stats.hits).toBe(1);
    expect(stats.hitRate).toBe(0.5); // 1 hit / 2 total = 50%
  });

  // ============================================================
  // Test 7: Should respect cache TTL (expired entries not returned)
  // WHY IT WILL FAIL: MarkdownPipeline.renderAsync does not exist yet
  // ============================================================

  it('should respect cache TTL and expire old entries', async () => {
    // ARRANGE
    const shortTTLConfig: CacheConfig = {
      maxEntries: 100,
      maxSize: 10 * 1024 * 1024,
      defaultTTL: 1000, // 1 second TTL
      maxItemSize: 100 * 1024,
    };

    // @ts-expect-error - MarkdownPipeline does not exist yet
    const shortTTLPipeline = new MarkdownPipeline(defaultConfig, shortTTLConfig);

    const markdown = '**Bold text**';

    // Use fake timers for deterministic TTL testing
    vi.useFakeTimers();

    // ACT
    await shortTTLPipeline.renderAsync(markdown); // Cache miss (t=0)

    // Fast-forward time past TTL
    vi.advanceTimersByTime(1500); // 1.5 seconds (past 1 second TTL)

    await shortTTLPipeline.renderAsync(markdown); // Should be cache miss (expired)

    const stats = shortTTLPipeline.getCacheStats();

    // ASSERT
    // Should have 2 cache misses (second render expired)
    expect(stats.misses).toBe(2);
    expect(stats.hits).toBe(0);

    // CLEANUP
    vi.useRealTimers();
  });

  // ============================================================
  // Test 8: Should evict LRU entries when cache full
  // WHY IT WILL FAIL: MarkdownPipeline does not exist yet
  // ============================================================

  it('should evict LRU entries when cache is full', async () => {
    // ARRANGE
    const smallCacheConfig: CacheConfig = {
      maxEntries: 3, // Only 3 entries allowed
      maxSize: 10 * 1024 * 1024,
      defaultTTL: 5 * 60 * 1000,
      maxItemSize: 100 * 1024,
    };

    // @ts-expect-error - MarkdownPipeline does not exist yet
    const smallCachePipeline = new MarkdownPipeline(defaultConfig, smallCacheConfig);

    // ACT
    await smallCachePipeline.renderAsync('**Text 1**'); // Entry 1
    await smallCachePipeline.renderAsync('**Text 2**'); // Entry 2
    await smallCachePipeline.renderAsync('**Text 3**'); // Entry 3
    await smallCachePipeline.renderAsync('**Text 4**'); // Entry 4 (evicts Entry 1 - LRU)

    const stats = smallCachePipeline.getCacheStats();

    // ASSERT
    // Should have evicted 1 entry
    expect(stats.evictions).toBe(1);

    // Cache size should not exceed maxEntries
    expect(stats.size).toBeLessThanOrEqual(3);

    // Should have 4 cache misses (all new entries)
    expect(stats.misses).toBe(4);
  });

  // ============================================================
  // Test 9: Should bypass cache for unique markdown strings
  // WHY IT WILL FAIL: MarkdownPipeline.renderAsync does not exist yet
  // ============================================================

  it('should bypass cache for unique markdown strings', async () => {
    // ARRANGE
    const markdown1 = '**Unique text 1**';
    const markdown2 = '**Unique text 2**';
    const markdown3 = '**Unique text 3**';

    // ACT
    await pipeline.renderAsync(markdown1); // Cache miss
    await pipeline.renderAsync(markdown2); // Cache miss
    await pipeline.renderAsync(markdown3); // Cache miss

    const stats = pipeline.getCacheStats();

    // ASSERT
    // Should have 3 cache misses (all unique)
    expect(stats.misses).toBe(3);
    expect(stats.hits).toBe(0);

    // Should have cached all 3 entries
    expect(stats.size).toBe(3);
  });

  // ============================================================
  // RENDERING TESTS (4 tests)
  // Tests that MarkdownPipeline renders markdown correctly
  // ============================================================

  // ============================================================
  // Test 10: Should render markdown to safe HTML
  // WHY IT WILL FAIL: MarkdownPipeline.renderAsync does not exist yet
  // ============================================================

  it('should render markdown to safe HTML', async () => {
    // ARRANGE
    const markdown = '# Heading\n\n**Bold** and *italic* text.\n\n- List item 1\n- List item 2';

    // ACT
    const result = await pipeline.renderAsync(markdown);

    // ASSERT
    // Should contain heading
    expect(result).toContain('<h1>Heading</h1>');

    // Should contain bold and italic
    expect(result).toContain('<strong>Bold</strong>');
    expect(result).toContain('<em>italic</em>');

    // Should contain list
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>List item 1</li>');
    expect(result).toContain('<li>List item 2</li>');
    expect(result).toContain('</ul>');
  });

  // ============================================================
  // Test 11: Should apply syntax highlighting to code blocks
  // WHY IT WILL FAIL: MarkdownPipeline.renderAsync does not exist yet
  // ============================================================

  it('should apply syntax highlighting to code blocks', async () => {
    // ARRANGE
    const markdown = '```javascript\nconst greeting = "Hello World";\nconsole.log(greeting);\n```';

    // ACT
    const result = await pipeline.renderAsync(markdown);

    // ASSERT
    // Should contain code block
    expect(result).toContain('<pre>');
    expect(result).toContain('<code');

    // Should have language class for syntax highlighting
    expect(result).toContain('language-javascript');

    // Should contain the code content
    expect(result).toContain('greeting');
    expect(result).toContain('Hello World');
  });

  // ============================================================
  // Test 12: Should sanitize dangerous HTML (XSS protection)
  // WHY IT WILL FAIL: MarkdownPipeline.renderAsync does not exist yet
  // ============================================================

  it('should sanitize dangerous HTML and prevent XSS', async () => {
    // ARRANGE
    const markdown = '# Safe Heading\n\n<script>alert("XSS")</script>\n\n[Link](javascript:alert("XSS"))';

    // ACT
    const result = await pipeline.renderAsync(markdown);

    // ASSERT
    // Should render safe content
    expect(result).toContain('<h1>Safe Heading</h1>');

    // Should strip script tags
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert("XSS")');

    // Should strip javascript: protocol
    expect(result).not.toContain('javascript:');

    // Link text might remain (implementation-dependent)
    expect(result).toContain('Link');
  });

  // ============================================================
  // Test 13: Should handle markdown with tables, lists, and links
  // WHY IT WILL FAIL: MarkdownPipeline.renderAsync does not exist yet
  // ============================================================

  it('should handle complex markdown with tables, lists, and links', async () => {
    // ARRANGE
    const markdown = `
# Documentation

## Features

- Feature 1
- Feature 2

## API Reference

| Method | Description |
|--------|-------------|
| GET    | Fetch data  |
| POST   | Create data |

[Learn more](https://example.com)
`;

    // ACT
    const result = await pipeline.renderAsync(markdown);

    // ASSERT
    // Should contain headings
    expect(result).toContain('<h1>Documentation</h1>');
    expect(result).toContain('<h2>Features</h2>');

    // Should contain list
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Feature 1</li>');

    // Should contain table
    expect(result).toContain('<table>');
    expect(result).toContain('<th>Method</th>');
    expect(result).toContain('<td>GET</td>');

    // Should contain link
    expect(result).toContain('<a');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('Learn more');
  });

  // ============================================================
  // CONFIGURATION TESTS (3 tests)
  // Tests that MarkdownPipeline respects configuration options
  // ============================================================

  // ============================================================
  // Test 14: Should respect markdown feature toggles
  // WHY IT WILL FAIL: MarkdownPipeline does not exist yet
  // ============================================================

  it('should respect markdown feature toggles', async () => {
    // ARRANGE
    const restrictedConfig: MarkdownConfig = {
      enableTables: false,
      enableCodeBlocks: false,
      enableBlockquotes: false,
      enableLinks: true,
      enableImages: false,
      enableLineBreaks: true,
      maxNesting: 20,
    };

    // @ts-expect-error - MarkdownPipeline does not exist yet
    const restrictedPipeline = new MarkdownPipeline(restrictedConfig, defaultCacheConfig);

    const markdown = `
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |

\`\`\`javascript
const x = 10;
\`\`\`

> Blockquote text

![Image](https://example.com/image.png)

[Link](https://example.com)
`;

    // ACT
    const result = await restrictedPipeline.renderAsync(markdown);

    // ASSERT
    // Should NOT contain disabled features
    expect(result).not.toContain('<table>');
    expect(result).not.toContain('<pre>');
    expect(result).not.toContain('<blockquote>');
    expect(result).not.toContain('<img');

    // Should contain enabled features
    expect(result).toContain('<a'); // Links enabled
    expect(result).toContain('href="https://example.com"');
  });

  // ============================================================
  // Test 15: Should use configured cache settings
  // WHY IT WILL FAIL: MarkdownPipeline does not exist yet
  // ============================================================

  it('should use configured cache settings', async () => {
    // ARRANGE
    const customCacheConfig: CacheConfig = {
      maxEntries: 50, // Half the default
      maxSize: 5 * 1024 * 1024, // 5MB
      defaultTTL: 2 * 60 * 1000, // 2 minutes
      maxItemSize: 50 * 1024, // 50KB
    };

    // @ts-expect-error - MarkdownPipeline does not exist yet
    const customPipeline = new MarkdownPipeline(defaultConfig, customCacheConfig);

    const markdown = '**Test**';

    // ACT
    await customPipeline.renderAsync(markdown);
    const stats = customPipeline.getCacheStats();

    // ASSERT
    // Cache should exist and be working
    expect(stats.size).toBe(1);
    expect(stats.misses).toBe(1);

    // Note: We can't directly verify maxEntries/TTL without filling cache
    // But we verify the cache is operational with custom config
  });

  // ============================================================
  // Test 16: Should support disabling syntax highlighting
  // WHY IT WILL FAIL: MarkdownPipeline does not exist yet
  // ============================================================

  it('should support disabling syntax highlighting', async () => {
    // ARRANGE
    const noHighlightConfig: MarkdownConfig = {
      ...defaultConfig,
      enableCodeBlocks: true, // Code blocks enabled
    };

    // @ts-expect-error - MarkdownPipeline does not exist yet
    const noHighlightPipeline = new MarkdownPipeline(
      noHighlightConfig,
      defaultCacheConfig,
      { enableSyntaxHighlighting: false } // Disable syntax highlighting
    );

    const markdown = '```javascript\nconst x = 10;\n```';

    // ACT
    const result = await noHighlightPipeline.renderAsync(markdown);

    // ASSERT
    // Should contain code block
    expect(result).toContain('<pre>');
    expect(result).toContain('<code');

    // Should contain the code content
    expect(result).toContain('const x = 10');

    // Should NOT have syntax highlighting spans
    // (Exact behavior depends on implementation - might just have plain code)
    expect(result).not.toContain('class="token"');
  });

  // ============================================================
  // ERROR HANDLING TESTS (4 tests)
  // Tests that MarkdownPipeline handles errors gracefully
  // ============================================================

  // ============================================================
  // Test 17: Should fallback to escaped text if initialization fails
  // WHY IT WILL FAIL: MarkdownPipeline.renderAsync does not exist yet
  // ============================================================

  it('should fallback to escaped text if initialization fails', async () => {
    // ARRANGE
    const markdown = '**Bold** and <script>alert("XSS")</script>';

    // MOCK: Force LazyLoader to fail
    vi.spyOn(LazyLoader, 'getMarkdownIt').mockRejectedValueOnce(
      new Error('Import failed')
    );

    // ACT
    const result = await pipeline.renderAsync(markdown);

    // ASSERT
    // Should not throw error
    expect(result).toBeDefined();

    // Should return safe fallback (escaped text)
    expect(result).not.toContain('<script>');

    // Should contain text content (escaped)
    expect(result).toContain('Bold');
    expect(result).toBeTruthy();
  });

  // ============================================================
  // Test 18: Should never throw errors (graceful degradation)
  // WHY IT WILL FAIL: MarkdownPipeline.renderAsync does not exist yet
  // ============================================================

  it('should never throw errors and always return content', async () => {
    // ARRANGE
    const markdown = '# Valid markdown';

    // MOCK: Force all dependencies to fail
    vi.spyOn(LazyLoader, 'getMarkdownIt').mockRejectedValueOnce(
      new Error('markdown-it failed')
    );

    // ACT & ASSERT
    // Should NOT throw error
    await expect(pipeline.renderAsync(markdown)).resolves.toBeDefined();

    const result = await pipeline.renderAsync(markdown);

    // Should return SOMETHING (not empty, not undefined)
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  // ============================================================
  // Test 19: Should handle empty string input
  // WHY IT WILL FAIL: MarkdownPipeline.renderAsync does not exist yet
  // ============================================================

  it('should handle empty string input', async () => {
    // ARRANGE
    const markdown = '';

    // ACT
    const result = await pipeline.renderAsync(markdown);

    // ASSERT
    // Should return empty string (not crash)
    expect(result).toBe('');
  });

  // ============================================================
  // Test 20: Should handle very large markdown (>100KB)
  // WHY IT WILL FAIL: MarkdownPipeline.renderAsync does not exist yet
  // ============================================================

  it('should handle very large markdown without hanging', async () => {
    // ARRANGE
    // Generate >100KB of markdown
    const largeMarkdown = '# Large Document\n\n' + 'Lorem ipsum dolor sit amet. '.repeat(5000);

    expect(largeMarkdown.length).toBeGreaterThan(100 * 1024); // >100KB

    // ACT
    const startTime = Date.now();
    const result = await pipeline.renderAsync(largeMarkdown);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // ASSERT
    // Should not hang (complete in reasonable time)
    expect(duration).toBeLessThan(5000); // <5 seconds

    // Should render successfully
    expect(result).toContain('<h1>Large Document</h1>');
    expect(result).toContain('Lorem ipsum');
    expect(result.length).toBeGreaterThan(1000);
  });

  // ============================================================
  // UTILITY METHODS TESTS (Bonus)
  // ============================================================

  // ============================================================
  // Test 21: Should provide getCacheStats method
  // WHY IT WILL FAIL: MarkdownPipeline.getCacheStats does not exist yet
  // ============================================================

  it('should provide getCacheStats method', () => {
    // ACT
    const stats = pipeline.getCacheStats();

    // ASSERT
    // Should return CacheStatistics object
    expect(stats).toBeDefined();
    expect(typeof stats.hits).toBe('number');
    expect(typeof stats.misses).toBe('number');
    expect(typeof stats.evictions).toBe('number');
    expect(typeof stats.size).toBe('number');
    expect(typeof stats.totalSize).toBe('number');
    expect(typeof stats.hitRate).toBe('number');
  });

  // ============================================================
  // Test 22: Should provide clearCache method
  // WHY IT WILL FAIL: MarkdownPipeline.clearCache does not exist yet
  // ============================================================

  it('should provide clearCache method', async () => {
    // ARRANGE
    await pipeline.renderAsync('**Text 1**');
    await pipeline.renderAsync('**Text 2**');

    let stats = pipeline.getCacheStats();
    expect(stats.size).toBe(2); // 2 entries cached

    // ACT
    pipeline.clearCache();

    // ASSERT
    stats = pipeline.getCacheStats();
    expect(stats.size).toBe(0); // Cache cleared
    expect(stats.totalSize).toBe(0);
  });

  // ============================================================
  // Test 23: STANDARD_MARKDOWN_CONFIG should be exported
  // WHY IT WILL FAIL: STANDARD_MARKDOWN_CONFIG does not exist yet
  // ============================================================

  it('should export STANDARD_MARKDOWN_CONFIG constant', () => {
    // ASSERT
    // @ts-expect-error - STANDARD_MARKDOWN_CONFIG does not exist yet
    expect(STANDARD_MARKDOWN_CONFIG).toBeDefined();

    // @ts-expect-error - STANDARD_MARKDOWN_CONFIG does not exist yet
    expect(STANDARD_MARKDOWN_CONFIG.enableTables).toBe(true);

    // @ts-expect-error - STANDARD_MARKDOWN_CONFIG does not exist yet
    expect(STANDARD_MARKDOWN_CONFIG.enableCodeBlocks).toBe(true);

    // @ts-expect-error - STANDARD_MARKDOWN_CONFIG does not exist yet
    expect(STANDARD_MARKDOWN_CONFIG.maxNesting).toBe(20);
  });
});
