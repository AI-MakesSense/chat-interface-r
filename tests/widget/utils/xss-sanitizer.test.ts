/**
 * @vitest-environment jsdom
 *
 * RED Tests for XSS Sanitizer
 *
 * Tests for widget/src/utils/xss-sanitizer.ts
 *
 * Note: Uses JSDOM environment instead of Happy-DOM because DOMPurify creates iframes
 * for sanitization, which Happy-DOM doesn't fully support.
 *
 * WHY THESE TESTS WILL FAIL:
 * - Production module does not exist yet (widget/src/utils/xss-sanitizer.ts)
 * - XssSanitizer class is not implemented
 * - SanitizerConfig interface is not defined
 * - This is the RED phase of TDD - tests are written BEFORE production code
 *
 * Test Coverage:
 * 1. Strip dangerous script tags
 * 2. Remove onclick/onerror event handlers
 * 3. Strip style tags with CSS
 * 4. Remove javascript: protocol in links
 * 5. Remove data: URIs when disabled
 * 6. Allow data: URIs when enabled
 * 7. Preserve safe HTML tags (p, strong, em, code, pre)
 * 8. Preserve safe list tags (ul, ol, li)
 * 9. Preserve safe links with https://
 * 10. Preserve safe blockquotes
 * 11. Preserve safe tables
 * 12. Remove iframe tags
 * 13. Remove object/embed tags
 * 14. Strip base64-encoded XSS attempts
 * 15. Handle empty string input
 * 16. Handle deeply nested tags
 * 17. Respect allowedTags configuration
 * 18. Respect allowedAttributes configuration
 * 19. Handle unicode and special characters
 * 20. Use MARKDOWN_PRESET configuration
 *
 * Module Purpose:
 * - Sanitize HTML output to prevent XSS attacks
 * - Whitelist approach: only allow safe tags/attributes
 * - Support configurable presets (MARKDOWN_PRESET, STRICT_PRESET)
 * - Use DOMPurify library for production implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
// @ts-expect-error - Module does not exist yet (RED phase)
import { XssSanitizer, SanitizerConfig } from '@/widget/src/utils/xss-sanitizer';

describe('XssSanitizer - RED Tests', () => {
  let sanitizer: XssSanitizer;

  beforeEach(() => {
    // @ts-expect-error - MARKDOWN_PRESET does not exist yet
    sanitizer = new XssSanitizer(XssSanitizer.MARKDOWN_PRESET);
  });

  // ============================================================
  // Test 1: Strip dangerous script tags
  // ============================================================

  it('should strip script tags', () => {
    // ARRANGE
    const html = '<p>Hello</p><script>alert("XSS")</script><p>World</p>';

    // ACT
    const result = sanitizer.sanitize(html);

    // ASSERT
    expect(result).toBe('<p>Hello</p><p>World</p>');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert');
  });

  // ============================================================
  // Test 2: Remove onclick/onerror event handlers
  // ============================================================

  it('should remove onclick and onerror event handlers', () => {
    // ARRANGE
    const html = '<p onclick="alert(\'XSS\')">Click me</p><img src="x" onerror="alert(\'XSS\')">';

    // ACT
    const result = sanitizer.sanitize(html);

    // ASSERT
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert');
  });

  // ============================================================
  // Test 3: Strip style tags with CSS
  // ============================================================

  it('should strip style tags', () => {
    // ARRANGE
    const html = '<style>body { background: red; }</style><p>Content</p>';

    // ACT
    const result = sanitizer.sanitize(html);

    // ASSERT
    expect(result).toBe('<p>Content</p>');
    expect(result).not.toContain('<style');
    expect(result).not.toContain('background');
  });

  // ============================================================
  // Test 4: Remove javascript: protocol in links
  // ============================================================

  it('should remove javascript: protocol in links', () => {
    // ARRANGE
    const html = '<a href="javascript:alert(\'XSS\')">Click</a>';

    // ACT
    const result = sanitizer.sanitize(html);

    // ASSERT
    expect(result).not.toContain('javascript:');
    // Should either strip href entirely or replace with safe value
    if (result.includes('href')) {
      expect(result).not.toContain('alert');
    }
  });

  // ============================================================
  // Test 5: Remove data: URIs when disabled
  // ============================================================

  it('should remove data: URIs when allowDataUri is false', () => {
    // ARRANGE
    const config: SanitizerConfig = {
      allowedTags: ['img'],
      allowedAttributes: { img: ['src'] },
      allowedSchemes: ['https', 'http'],
      allowDataUri: false,
    };
    const customSanitizer = new XssSanitizer(config);
    const html = '<img src="data:image/png;base64,iVBORw0KGgo=">';

    // ACT
    const result = customSanitizer.sanitize(html);

    // ASSERT
    expect(result).not.toContain('data:');
  });

  // ============================================================
  // Test 6: Allow data: URIs when enabled
  // ============================================================

  it('should allow data: URIs when allowDataUri is true', () => {
    // ARRANGE
    const config: SanitizerConfig = {
      allowedTags: ['img'],
      allowedAttributes: { img: ['src'] },
      allowedSchemes: ['https', 'http'],
      allowDataUri: true,
    };
    const customSanitizer = new XssSanitizer(config);
    const html = '<img src="data:image/png;base64,iVBORw0KGgo=">';

    // ACT
    const result = customSanitizer.sanitize(html);

    // ASSERT
    expect(result).toContain('data:image/png;base64');
    expect(result).toContain('<img');
  });

  // ============================================================
  // Test 7: Preserve safe HTML tags (p, strong, em, code, pre)
  // ============================================================

  it('should preserve safe HTML formatting tags', () => {
    // ARRANGE
    const html = '<p>Paragraph with <strong>bold</strong> and <em>italic</em> text. <code>code()</code> and <pre>preformatted</pre></p>';

    // ACT
    const result = sanitizer.sanitize(html);

    // ASSERT
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
    expect(result).toContain('<em>');
    expect(result).toContain('<code>');
    expect(result).toContain('<pre>');
    expect(result).toContain('</p>');
    expect(result).toContain('</strong>');
    expect(result).toContain('</em>');
  });

  // ============================================================
  // Test 8: Preserve safe list tags (ul, ol, li)
  // ============================================================

  it('should preserve safe list tags', () => {
    // ARRANGE
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul><ol><li>First</li><li>Second</li></ol>';

    // ACT
    const result = sanitizer.sanitize(html);

    // ASSERT
    expect(result).toContain('<ul>');
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>');
    expect(result).toContain('Item 1');
    expect(result).toContain('First');
  });

  // ============================================================
  // Test 9: Preserve safe links with https://
  // ============================================================

  it('should preserve safe links with https protocol', () => {
    // ARRANGE
    const html = '<a href="https://example.com">Safe Link</a>';

    // ACT
    const result = sanitizer.sanitize(html);

    // ASSERT
    expect(result).toContain('<a');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('Safe Link');
  });

  // ============================================================
  // Test 10: Preserve safe blockquotes
  // ============================================================

  it('should preserve blockquote tags', () => {
    // ARRANGE
    const html = '<blockquote>This is a quote</blockquote>';

    // ACT
    const result = sanitizer.sanitize(html);

    // ASSERT
    expect(result).toContain('<blockquote>');
    expect(result).toContain('This is a quote');
    expect(result).toContain('</blockquote>');
  });

  // ============================================================
  // Test 11: Preserve safe tables
  // ============================================================

  it('should preserve table tags', () => {
    // ARRANGE
    const html = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>';

    // ACT
    const result = sanitizer.sanitize(html);

    // ASSERT
    expect(result).toContain('<table>');
    expect(result).toContain('<thead>');
    expect(result).toContain('<th>');
    expect(result).toContain('<tbody>');
    expect(result).toContain('<td>');
    expect(result).toContain('Header');
    expect(result).toContain('Cell');
  });

  // ============================================================
  // Test 12: Remove iframe tags
  // ============================================================

  it('should remove iframe tags', () => {
    // ARRANGE
    const html = '<p>Content</p><iframe src="https://evil.com"></iframe>';

    // ACT
    const result = sanitizer.sanitize(html);

    // ASSERT
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('evil.com');
    expect(result).toContain('<p>Content</p>');
  });

  // ============================================================
  // Test 13: Remove object/embed tags
  // ============================================================

  it('should remove object and embed tags', () => {
    // ARRANGE
    const html = '<p>Content</p><object data="evil.swf"></object><embed src="evil.swf">';

    // ACT
    const result = sanitizer.sanitize(html);

    // ASSERT
    expect(result).not.toContain('<object');
    expect(result).not.toContain('<embed');
    expect(result).not.toContain('evil.swf');
    expect(result).toContain('<p>Content</p>');
  });

  // ============================================================
  // Test 14: Strip base64-encoded XSS attempts
  // ============================================================

  it('should strip base64-encoded XSS in href', () => {
    // ARRANGE
    const html = '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=">Click</a>';

    // ACT
    const result = sanitizer.sanitize(html);

    // ASSERT
    // Should not contain the dangerous data URI (unless allowDataUri is true)
    expect(result).not.toContain('PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=');
  });

  // ============================================================
  // Test 15: Handle empty string input
  // ============================================================

  it('should handle empty string input', () => {
    // ARRANGE
    const html = '';

    // ACT
    const result = sanitizer.sanitize(html);

    // ASSERT
    expect(result).toBe('');
  });

  // ============================================================
  // Test 16: Handle deeply nested tags
  // ============================================================

  it('should handle deeply nested tags without breaking', () => {
    // ARRANGE
    const html = '<p><strong><em><code><span>Deeply nested</span></code></em></strong></p>';

    // ACT
    const result = sanitizer.sanitize(html);

    // ASSERT
    expect(result).toContain('Deeply nested');
    // Should preserve allowed tags
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
    expect(result).toContain('<em>');
    expect(result).toContain('<code>');
  });

  // ============================================================
  // Test 17: Respect allowedTags configuration
  // ============================================================

  it('should respect allowedTags configuration', () => {
    // ARRANGE
    const config: SanitizerConfig = {
      allowedTags: ['p', 'strong'], // Only allow p and strong
      allowedAttributes: {},
      allowedSchemes: [],
      allowDataUri: false,
    };
    const customSanitizer = new XssSanitizer(config);
    const html = '<p>Text with <strong>bold</strong> and <em>italic</em></p>';

    // ACT
    const result = customSanitizer.sanitize(html);

    // ASSERT
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
    expect(result).not.toContain('<em>'); // Should be stripped
    expect(result).toContain('italic'); // Text should remain
  });

  // ============================================================
  // Test 18: Respect allowedAttributes configuration
  // ============================================================

  it('should respect allowedAttributes configuration', () => {
    // ARRANGE
    const config: SanitizerConfig = {
      allowedTags: ['a'],
      allowedAttributes: {
        a: ['href'], // Only allow href attribute
      },
      allowedSchemes: ['https'],
      allowDataUri: false,
    };
    const customSanitizer = new XssSanitizer(config);
    const html = '<a href="https://example.com" title="Example" class="link">Link</a>';

    // ACT
    const result = customSanitizer.sanitize(html);

    // ASSERT
    expect(result).toContain('href="https://example.com"');
    expect(result).not.toContain('title='); // Should be stripped
    expect(result).not.toContain('class='); // Should be stripped
    expect(result).toContain('Link'); // Text should remain
  });

  // ============================================================
  // Test 19: Handle unicode and special characters
  // ============================================================

  it('should handle unicode and special characters', () => {
    // ARRANGE
    const html = '<p>Hello 世界 🌍 &lt;script&gt;</p>';

    // ACT
    const result = sanitizer.sanitize(html);

    // ASSERT
    expect(result).toContain('Hello 世界 🌍');
    expect(result).toContain('&lt;script&gt;'); // Should preserve HTML entities
    expect(result).toContain('<p>');
  });

  // ============================================================
  // Test 20: Use MARKDOWN_PRESET configuration
  // ============================================================

  it('should use MARKDOWN_PRESET with correct allowed tags', () => {
    // ARRANGE
    // @ts-expect-error - MARKDOWN_PRESET does not exist yet
    const presetSanitizer = new XssSanitizer(XssSanitizer.MARKDOWN_PRESET);
    const html = `
      <p>Paragraph</p>
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <ul><li>List item</li></ul>
      <code>inline code</code>
      <pre>code block</pre>
      <a href="https://example.com">Link</a>
      <blockquote>Quote</blockquote>
      <table><tr><td>Cell</td></tr></table>
      <script>alert("XSS")</script>
    `;

    // ACT
    const result = presetSanitizer.sanitize(html);

    // ASSERT
    // Should allow all markdown-safe tags
    expect(result).toContain('<p>');
    expect(result).toContain('<h1>');
    expect(result).toContain('<h2>');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>');
    expect(result).toContain('<code>');
    expect(result).toContain('<pre>');
    expect(result).toContain('<a');
    expect(result).toContain('<blockquote>');
    expect(result).toContain('<table>');

    // Should strip dangerous tags
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
  });

  // ============================================================
  // Additional Test: STRICT_PRESET configuration
  // ============================================================

  it('should use STRICT_PRESET with minimal allowed tags', () => {
    // ARRANGE
    // @ts-expect-error - STRICT_PRESET does not exist yet
    const strictSanitizer = new XssSanitizer(XssSanitizer.STRICT_PRESET);
    const html = '<p>Text with <strong>bold</strong> and <a href="https://example.com">link</a></p>';

    // ACT
    const result = strictSanitizer.sanitize(html);

    // ASSERT
    // STRICT_PRESET should only allow very basic formatting
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
    // May or may not allow links depending on preset definition
    expect(result).toContain('Text with');
    expect(result).toContain('bold');
  });
});
