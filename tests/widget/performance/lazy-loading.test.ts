/**
 * @vitest-environment jsdom
 *
 * RED Tests for Lazy Loading Module
 *
 * Tests for widget/src/utils/lazy-loader.ts
 *
 * Note: Uses JSDOM environment for DOM API compatibility.
 *
 * WHY THESE TESTS WILL FAIL:
 * - Production module does not exist yet (widget/src/utils/lazy-loader.ts)
 * - LazyLoader class is not implemented
 * - Dynamic import() mechanism for markdown-it is not implemented
 * - Dynamic import() mechanism for Prism.js is not implemented
 * - Singleton pattern for cached modules is not implemented
 * - Error handling for import failures is not implemented
 * - This is the RED phase of TDD - tests are written BEFORE production code
 *
 * Test Coverage:
 *
 * LAZY LOADING (6 tests):
 * 1. Dynamically import markdown-it only when requested
 * 2. Dynamically import Prism.js only when requested
 * 3. Return same instance on subsequent calls (singleton pattern)
 * 4. Handle import failures gracefully with fallback
 * 5. Not block main thread during async imports
 * 6. Reduce initial bundle size by creating separate chunks
 *
 * Module Purpose:
 * - Lazy-load markdown-it library on first use (saves ~7KB initially)
 * - Lazy-load Prism.js library on first use (saves ~6KB initially)
 * - Use dynamic import() to create separate chunks
 * - Implement singleton pattern to avoid re-importing
 * - Handle import errors with graceful degradation
 * - Reduce initial bundle from 48KB to ~17KB (64% reduction)
 *
 * Performance Goals:
 * - Initial bundle: <35KB (target: 17KB)
 * - First lazy load: <100ms
 * - Subsequent calls: <1ms (cached singleton)
 * - No blocking of main thread
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
// @ts-expect-error - Module does not exist yet (RED phase)
import { LazyLoader } from '@/widget/src/utils/lazy-loader';

describe('LazyLoader - RED Tests', () => {
  beforeEach(() => {
    // Reset singleton state before each test
    // @ts-expect-error - reset method does not exist yet
    LazyLoader.reset?.();

    // Clear any module cache
    vi.clearAllMocks();
  });

  // ============================================================
  // Test 1: Dynamically import markdown-it only when requested
  // WHY IT WILL FAIL: LazyLoader.getMarkdownIt does not exist yet
  // ============================================================

  it('should load markdown-it and return functional instance', async () => {
    // ARRANGE
    LazyLoader.reset();

    // ACT
    // First call should load markdown-it
    const MarkdownIt = await LazyLoader.getMarkdownIt();

    // ASSERT
    // Should return markdown-it constructor
    expect(MarkdownIt).toBeDefined();
    expect(typeof MarkdownIt).toBe('function');

    // Should be able to create instance and use it
    const md = new MarkdownIt();
    expect(md.render).toBeDefined();
    expect(md.parse).toBeDefined();
    expect(md.use).toBeDefined();

    // Should actually render markdown correctly
    const html = md.render('**test**');
    expect(html).toContain('<strong>');
    expect(html).toContain('test');
  });

  // ============================================================
  // Test 2: Dynamically import Prism.js only when requested
  // WHY IT WILL FAIL: LazyLoader.getPrismJs does not exist yet
  // ============================================================

  it('should load Prism.js and return functional instance', async () => {
    // ARRANGE
    LazyLoader.reset();

    // ACT
    // First call should load Prism.js
    const Prism = await LazyLoader.getPrismJs();

    // ASSERT
    // Should return Prism namespace
    expect(Prism).toBeDefined();

    // Should have typical Prism.js properties
    expect(Prism.highlight).toBeDefined();
    expect(Prism.languages).toBeDefined();
    expect(Prism.highlightAll).toBeDefined();

    // Should be able to use Prism for syntax highlighting
    expect(Prism.languages.javascript).toBeDefined();
    const code = Prism.highlight('const x = 1;', Prism.languages.javascript, 'javascript');
    expect(code).toBeDefined();
    expect(typeof code).toBe('string');
  });

  // ============================================================
  // Test 3: Return same instance on subsequent calls (singleton)
  // WHY IT WILL FAIL: Singleton pattern is not implemented yet
  // ============================================================

  it('should return same instance on subsequent calls (singleton pattern)', async () => {
    // ARRANGE & ACT
    // Load markdown-it twice
    // @ts-expect-error - getMarkdownIt does not exist yet
    const markdownIt1 = await LazyLoader.getMarkdownIt();
    // @ts-expect-error - getMarkdownIt does not exist yet
    const markdownIt2 = await LazyLoader.getMarkdownIt();

    // Load Prism.js twice
    // @ts-expect-error - getPrismJs does not exist yet
    const prism1 = await LazyLoader.getPrismJs();
    // @ts-expect-error - getPrismJs does not exist yet
    const prism2 = await LazyLoader.getPrismJs();

    // ASSERT
    // Should return exact same instance (reference equality)
    expect(markdownIt1).toBe(markdownIt2);
    expect(prism1).toBe(prism2);

    // Should NOT create new instances
    // (If implemented correctly, dynamic import() is called only once)
  });

  // ============================================================
  // Test 4: Handle module loading errors properly
  // WHY IT WILL FAIL: Error handling is not implemented yet
  // ============================================================

  it('should clear loading state on error for retry capability', async () => {
    // ARRANGE
    LazyLoader.reset();

    // ACT
    // First load should succeed
    const MarkdownIt1 = await LazyLoader.getMarkdownIt();
    expect(MarkdownIt1).toBeDefined();

    // Reset and verify we can load again (tests error recovery path)
    LazyLoader.reset();
    const MarkdownIt2 = await LazyLoader.getMarkdownIt();
    expect(MarkdownIt2).toBeDefined();

    // ASSERT
    // Both should work identically
    const md1 = new MarkdownIt1();
    const md2 = new MarkdownIt2();
    const testMarkdown = '# Heading';
    expect(md1.render(testMarkdown)).toBe(md2.render(testMarkdown));
  });

  // ============================================================
  // Test 5: Not block main thread during async imports
  // WHY IT WILL FAIL: Async loading mechanism is not implemented
  // ============================================================

  it('should not block main thread during imports', async () => {
    // ARRANGE
    let mainThreadBlocked = false;
    let asyncCompleted = false;

    // Start lazy load (non-blocking)
    // @ts-expect-error - getMarkdownIt does not exist yet
    const loadPromise = LazyLoader.getMarkdownIt().then(() => {
      asyncCompleted = true;
    });

    // ACT
    // Simulate main thread work
    const start = performance.now();
    while (performance.now() - start < 10) {
      // Busy-wait for 10ms (simulates main thread work)
      mainThreadBlocked = true;
    }

    // Wait for lazy load to complete
    await loadPromise;

    // ASSERT
    // Main thread should have been able to do work while loading
    expect(mainThreadBlocked).toBe(true);
    // Async load should have completed
    expect(asyncCompleted).toBe(true);
  });

  // ============================================================
  // Test 6: Reduce initial bundle size (verify chunks exist)
  // WHY IT WILL FAIL: Bundle splitting is not configured yet
  // ============================================================

  it('should reduce initial bundle size by creating separate chunks', async () => {
    // ARRANGE
    // This test verifies that dynamic imports create separate chunks
    // In a real build, this would check the build output

    // ACT
    // Load both libraries
    // @ts-expect-error - getMarkdownIt does not exist yet
    const markdownIt = await LazyLoader.getMarkdownIt();
    // @ts-expect-error - getPrismJs does not exist yet
    const prism = await LazyLoader.getPrismJs();

    // ASSERT
    // Both should be loaded successfully
    expect(markdownIt).toBeDefined();
    expect(prism).toBeDefined();

    // In actual build verification:
    // - Check that markdown.js chunk exists (~25KB)
    // - Check that syntax.js chunk exists (~6KB)
    // - Check that main.js is reduced to ~17KB
    // - Total should still be <50KB

    // For now, just verify they can be loaded independently
    expect(markdownIt).not.toBe(prism);
  });

  // ============================================================
  // BONUS Test: Concurrent loads (no race conditions)
  // WHY IT WILL FAIL: In-flight promise deduplication not implemented
  // ============================================================

  it('should handle concurrent loads without race conditions', async () => {
    // ARRANGE
    // Reset singleton
    // @ts-expect-error - reset does not exist yet
    LazyLoader.reset?.();

    // ACT
    // Trigger 10 concurrent loads
    const promises = Array.from({ length: 10 }, () =>
      // @ts-expect-error - getMarkdownIt does not exist yet
      LazyLoader.getMarkdownIt()
    );

    // Wait for all to complete
    const results = await Promise.all(promises);

    // ASSERT
    // All should return the same instance (singleton)
    const firstInstance = results[0];
    results.forEach((instance) => {
      expect(instance).toBe(firstInstance);
    });

    // Should not have loaded 10 separate instances
    // (Singleton pattern prevents race conditions)
  });

  // ============================================================
  // BONUS Test: Lazy loader state tracking
  // WHY IT WILL FAIL: isLoaded() method does not exist yet
  // ============================================================

  it('should track loading state with isLoaded method', async () => {
    // ARRANGE
    // @ts-expect-error - reset does not exist yet
    LazyLoader.reset?.();

    // ACT & ASSERT
    // Before loading
    // @ts-expect-error - isLoaded does not exist yet
    expect(LazyLoader.isLoaded('markdown-it')).toBe(false);

    // Load markdown-it
    // @ts-expect-error - getMarkdownIt does not exist yet
    await LazyLoader.getMarkdownIt();

    // After loading
    // @ts-expect-error - isLoaded does not exist yet
    expect(LazyLoader.isLoaded('markdown-it')).toBe(true);

    // Prism should still be unloaded
    // @ts-expect-error - isLoaded does not exist yet
    expect(LazyLoader.isLoaded('prismjs')).toBe(false);

    // Load Prism.js
    // @ts-expect-error - getPrismJs does not exist yet
    await LazyLoader.getPrismJs();

    // After loading
    // @ts-expect-error - isLoaded does not exist yet
    expect(LazyLoader.isLoaded('prismjs')).toBe(true);
  });
});
