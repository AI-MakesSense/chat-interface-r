/**
 * @vitest-environment jsdom
 *
 * RED Tests for Markdown Renderer
 *
 * Tests for widget/src/utils/markdown-renderer.ts
 *
 * Note: Uses JSDOM environment (same as XSS Sanitizer) to support DOMPurify
 * used internally by XssSanitizer during markdown sanitization.
 *
 * WHY THESE TESTS WILL FAIL:
 * - Production module does not exist yet (widget/src/utils/markdown-renderer.ts)
 * - MarkdownRenderer class is not implemented
 * - MarkdownConfig interface is not defined
 * - markdown-it library is not installed
 * - Integration with XssSanitizer is not implemented
 * - This is the RED phase of TDD - tests are written BEFORE production code
 *
 * Test Coverage:
 *
 * BASIC MARKDOWN (8 tests):
 * 1. Render headings (h1-h6)
 * 2. Render paragraphs with line breaks
 * 3. Render bold/italic/strikethrough
 * 4. Render inline code
 * 5. Render code blocks with language
 * 6. Render unordered lists
 * 7. Render ordered lists
 * 8. Render nested lists
 *
 * CONFIGURATION RESPECT (6 tests):
 * 9. Respect enableTables = false
 * 10. Respect enableCodeBlocks = false
 * 11. Respect enableBlockquotes = false
 * 12. Respect enableLinks = false
 * 13. Respect enableImages = false
 * 14. Respect enableLineBreaks = false
 *
 * XSS INTEGRATION (5 tests):
 * 15. Strip XSS in markdown (script tags)
 * 16. Strip XSS in links (javascript: protocol)
 * 17. Preserve safe HTML in markdown
 * 18. Handle malicious nested markdown
 * 19. Sanitize after markdown parsing (not before)
 *
 * EDGE CASES (6 tests):
 * 20. Handle empty string input
 * 21. Handle very long markdown (>10KB)
 * 22. Handle deeply nested markdown (maxNesting limit)
 * 23. Preserve code block content (no markdown parsing inside)
 * 24. Handle special characters (unicode, emojis)
 * 25. Handle markdown with HTML entities
 *
 * Module Purpose:
 * - Transform markdown text to safe HTML
 * - Use markdown-it for markdown parsing
 * - Integrate XssSanitizer (MARKDOWN_PRESET) for security
 * - Support configurable markdown features
 * - Prevent XSS attacks and markdown DoS
 */

import { describe, it, expect, beforeEach } from 'vitest';
// @ts-expect-error - Module does not exist yet (RED phase)
import { MarkdownRenderer, MarkdownConfig } from '@/widget/src/utils/markdown-renderer';

describe('MarkdownRenderer - RED Tests', () => {
  let renderer: MarkdownRenderer;
  let defaultConfig: MarkdownConfig;

  beforeEach(() => {
    // Default configuration with all features enabled
    defaultConfig = {
      enableTables: true,
      enableCodeBlocks: true,
      enableBlockquotes: true,
      enableLinks: true,
      enableImages: true,
      enableLineBreaks: true,
      maxNesting: 20,
    };

    // @ts-expect-error - MarkdownRenderer does not exist yet
    renderer = new MarkdownRenderer(defaultConfig);
  });

  // ============================================================
  // BASIC MARKDOWN TESTS (8 tests)
  // ============================================================

  // ============================================================
  // Test 1: Render headings (h1-h6)
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should render all heading levels (h1-h6)', () => {
    // ARRANGE
    const markdown = `# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6`;

    // ACT
    const result = renderer.render(markdown);

    // ASSERT
    expect(result).toContain('<h1>Heading 1</h1>');
    expect(result).toContain('<h2>Heading 2</h2>');
    expect(result).toContain('<h3>Heading 3</h3>');
    expect(result).toContain('<h4>Heading 4</h4>');
    expect(result).toContain('<h5>Heading 5</h5>');
    expect(result).toContain('<h6>Heading 6</h6>');
  });

  // ============================================================
  // Test 2: Render paragraphs with line breaks
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should render paragraphs with line breaks', () => {
    // ARRANGE
    const markdown = `First paragraph.

Second paragraph with
a line break.

Third paragraph.`;

    // ACT
    const result = renderer.render(markdown);

    // ASSERT
    expect(result).toContain('<p>First paragraph.</p>');
    expect(result).toContain('<p>Second paragraph with');
    expect(result).toContain('<br>'); // Line break from two trailing spaces
    expect(result).toContain('a line break.</p>');
    expect(result).toContain('<p>Third paragraph.</p>');
  });

  // ============================================================
  // Test 3: Render bold/italic/strikethrough
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should render bold, italic, and strikethrough text', () => {
    // ARRANGE
    const markdown = '**bold text** *italic text* ~~strikethrough~~';

    // ACT
    const result = renderer.render(markdown);

    // ASSERT
    expect(result).toContain('<strong>bold text</strong>');
    expect(result).toContain('<em>italic text</em>');
    expect(result).toContain('<s>strikethrough</s>');
  });

  // ============================================================
  // Test 4: Render inline code
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should render inline code', () => {
    // ARRANGE
    const markdown = 'Use `const x = 10;` for variables.';

    // ACT
    const result = renderer.render(markdown);

    // ASSERT
    expect(result).toContain('<code>const x = 10;</code>');
    expect(result).toContain('Use');
    expect(result).toContain('for variables');
  });

  // ============================================================
  // Test 5: Render code blocks with language
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should render code blocks with language specification', () => {
    // ARRANGE
    const markdown = `\`\`\`javascript
function hello() {
  console.log("Hello World");
}
\`\`\``;

    // ACT
    const result = renderer.render(markdown);

    // ASSERT
    expect(result).toContain('<pre>');
    expect(result).toContain('<code');
    expect(result).toContain('class="language-javascript"');
    expect(result).toContain('function hello()');
    expect(result).toContain('console.log("Hello World")');
  });

  // ============================================================
  // Test 6: Render unordered lists
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should render unordered lists', () => {
    // ARRANGE
    const markdown = `- Item 1
- Item 2
- Item 3`;

    // ACT
    const result = renderer.render(markdown);

    // ASSERT
    expect(result).toContain('<ul>');
    expect(result).toContain('</ul>');
    expect(result).toContain('<li>Item 1</li>');
    expect(result).toContain('<li>Item 2</li>');
    expect(result).toContain('<li>Item 3</li>');
  });

  // ============================================================
  // Test 7: Render ordered lists
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should render ordered lists', () => {
    // ARRANGE
    const markdown = `1. First item
2. Second item
3. Third item`;

    // ACT
    const result = renderer.render(markdown);

    // ASSERT
    expect(result).toContain('<ol>');
    expect(result).toContain('</ol>');
    expect(result).toContain('<li>First item</li>');
    expect(result).toContain('<li>Second item</li>');
    expect(result).toContain('<li>Third item</li>');
  });

  // ============================================================
  // Test 8: Render nested lists
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should render nested lists', () => {
    // ARRANGE
    const markdown = `- Parent 1
  - Child 1
  - Child 2
- Parent 2`;

    // ACT
    const result = renderer.render(markdown);

    // ASSERT
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Parent 1');
    expect(result).toContain('<li>Child 1</li>');
    expect(result).toContain('<li>Child 2</li>');
    expect(result).toContain('<li>Parent 2</li>');
    // Should have nested ul inside parent li
    const parentLiMatch = result.match(/<li>Parent 1[\s\S]*?<ul>[\s\S]*?<\/ul>[\s\S]*?<\/li>/);
    expect(parentLiMatch).toBeTruthy();
  });

  // ============================================================
  // CONFIGURATION RESPECT TESTS (6 tests)
  // ============================================================

  // ============================================================
  // Test 9: Respect enableTables = false
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should not render tables when enableTables is false', () => {
    // ARRANGE
    const config: MarkdownConfig = {
      ...defaultConfig,
      enableTables: false,
    };
    // @ts-expect-error - MarkdownRenderer does not exist yet
    const customRenderer = new MarkdownRenderer(config);
    const markdown = `| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;

    // ACT
    const result = customRenderer.render(markdown);

    // ASSERT
    // Should not render as table
    expect(result).not.toContain('<table>');
    expect(result).not.toContain('<th>');
    expect(result).not.toContain('<td>');
    // Text should still be present
    expect(result).toContain('Column 1');
    expect(result).toContain('Cell 1');
  });

  // ============================================================
  // Test 10: Respect enableCodeBlocks = false
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should not render code blocks when enableCodeBlocks is false', () => {
    // ARRANGE
    const config: MarkdownConfig = {
      ...defaultConfig,
      enableCodeBlocks: false,
    };
    // @ts-expect-error - MarkdownRenderer does not exist yet
    const customRenderer = new MarkdownRenderer(config);
    const markdown = `\`\`\`javascript
const x = 10;
\`\`\``;

    // ACT
    const result = customRenderer.render(markdown);

    // ASSERT
    // Should not render as code block
    expect(result).not.toContain('<pre>');
    // Text might be escaped or rendered as plain text
    expect(result).toContain('const x = 10');
  });

  // ============================================================
  // Test 11: Respect enableBlockquotes = false
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should not render blockquotes when enableBlockquotes is false', () => {
    // ARRANGE
    const config: MarkdownConfig = {
      ...defaultConfig,
      enableBlockquotes: false,
    };
    // @ts-expect-error - MarkdownRenderer does not exist yet
    const customRenderer = new MarkdownRenderer(config);
    const markdown = '> This is a quote';

    // ACT
    const result = customRenderer.render(markdown);

    // ASSERT
    // Should not render as blockquote
    expect(result).not.toContain('<blockquote>');
    // Text should still be present
    expect(result).toContain('This is a quote');
  });

  // ============================================================
  // Test 12: Respect enableLinks = false
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should not render links when enableLinks is false', () => {
    // ARRANGE
    const config: MarkdownConfig = {
      ...defaultConfig,
      enableLinks: false,
    };
    // @ts-expect-error - MarkdownRenderer does not exist yet
    const customRenderer = new MarkdownRenderer(config);
    const markdown = '[Click here](https://example.com)';

    // ACT
    const result = customRenderer.render(markdown);

    // ASSERT
    // Should not render as link
    expect(result).not.toContain('<a');
    expect(result).not.toContain('href');
    // Text should still be present
    expect(result).toContain('Click here');
  });

  // ============================================================
  // Test 13: Respect enableImages = false
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should not render images when enableImages is false', () => {
    // ARRANGE
    const config: MarkdownConfig = {
      ...defaultConfig,
      enableImages: false,
    };
    // @ts-expect-error - MarkdownRenderer does not exist yet
    const customRenderer = new MarkdownRenderer(config);
    const markdown = '![Alt text](https://example.com/image.png)';

    // ACT
    const result = customRenderer.render(markdown);

    // ASSERT
    // Should not render as image
    expect(result).not.toContain('<img');
    expect(result).not.toContain('src=');
    // Alt text might still be present
    expect(result).toContain('Alt text');
  });

  // ============================================================
  // Test 14: Respect enableLineBreaks = false
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should not render line breaks when enableLineBreaks is false', () => {
    // ARRANGE
    const config: MarkdownConfig = {
      ...defaultConfig,
      enableLineBreaks: false,
    };
    // @ts-expect-error - MarkdownRenderer does not exist yet
    const customRenderer = new MarkdownRenderer(config);
    const markdown = 'Line one  \nLine two';

    // ACT
    const result = customRenderer.render(markdown);

    // ASSERT
    // Should not render as <br> tag
    expect(result).not.toContain('<br>');
    // Text should be combined or in single paragraph
    expect(result).toContain('Line one');
    expect(result).toContain('Line two');
  });

  // ============================================================
  // XSS INTEGRATION TESTS (5 tests)
  // ============================================================

  // ============================================================
  // Test 15: Strip XSS in markdown (script tags)
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should strip script tags from markdown', () => {
    // ARRANGE
    const markdown = '# Hello\n\n<script>alert("XSS")</script>\n\nWorld';

    // ACT
    const result = renderer.render(markdown);

    // ASSERT
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('<h1>Hello</h1>');
    expect(result).toContain('World');
  });

  // ============================================================
  // Test 16: Strip XSS in links (javascript: protocol)
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should strip javascript: protocol from links', () => {
    // ARRANGE
    const markdown = '[Click me](javascript:alert("XSS"))';

    // ACT
    const result = renderer.render(markdown);

    // ASSERT
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('alert');
    // Link text should remain
    expect(result).toContain('Click me');
  });

  // ============================================================
  // Test 17: Preserve safe HTML in markdown
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should preserve safe HTML tags in markdown', () => {
    // ARRANGE
    const markdown = 'Text with <strong>bold</strong> and <em>italic</em>';

    // ACT
    const result = renderer.render(markdown);

    // ASSERT
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
    expect(result).toContain('Text with');
  });

  // ============================================================
  // Test 18: Handle malicious nested markdown
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should handle malicious nested HTML/markdown', () => {
    // ARRANGE
    const markdown = '<div onclick="alert(\'XSS\')"><p>**bold**</p></div>';

    // ACT
    const result = renderer.render(markdown);

    // ASSERT
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('alert');
    // Safe content should be preserved
    expect(result).toContain('bold');
  });

  // ============================================================
  // Test 19: Sanitize after markdown parsing (not before)
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should sanitize HTML after markdown parsing, not before', () => {
    // ARRANGE
    // This markdown generates HTML with a link
    const markdown = '[Safe Link](https://example.com) <script>alert("XSS")</script>';

    // ACT
    const result = renderer.render(markdown);

    // ASSERT
    // Should parse markdown first (creating <a> tag)
    expect(result).toContain('<a');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('Safe Link');
    // Then sanitize (removing script)
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
  });

  // ============================================================
  // EDGE CASES TESTS (6 tests)
  // ============================================================

  // ============================================================
  // Test 20: Handle empty string input
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should handle empty string input', () => {
    // ARRANGE
    const markdown = '';

    // ACT
    const result = renderer.render(markdown);

    // ASSERT
    expect(result).toBe('');
  });

  // ============================================================
  // Test 21: Handle very long markdown (>10KB)
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should handle very long markdown without hanging', () => {
    // ARRANGE
    // Generate >10KB of markdown
    const longMarkdown = '# Heading\n\n' + 'Lorem ipsum dolor sit amet. '.repeat(500);

    // ACT
    const result = renderer.render(longMarkdown);

    // ASSERT
    expect(result).toContain('<h1>Heading</h1>');
    expect(result).toContain('Lorem ipsum');
    expect(result.length).toBeGreaterThan(1000);
  });

  // ============================================================
  // Test 22: Handle deeply nested markdown (maxNesting limit)
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should respect maxNesting limit to prevent DoS', () => {
    // ARRANGE
    const config: MarkdownConfig = {
      ...defaultConfig,
      maxNesting: 3, // Only allow 3 levels of nesting
    };
    // @ts-expect-error - MarkdownRenderer does not exist yet
    const customRenderer = new MarkdownRenderer(config);

    // Create deeply nested list (5 levels)
    const markdown = `- Level 1
  - Level 2
    - Level 3
      - Level 4
        - Level 5`;

    // ACT
    const result = customRenderer.render(markdown);

    // ASSERT
    // Should render up to maxNesting, but not beyond
    // Exact behavior depends on implementation (could flatten or strip)
    expect(result).toContain('Level 1');
    expect(result).toContain('Level 2');
    expect(result).toContain('Level 3');
    // Level 4 and 5 might be flattened or stripped
    // Just ensure it doesn't crash
    expect(result).toBeTruthy();
  });

  // ============================================================
  // Test 23: Preserve code block content (no markdown parsing inside)
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should preserve markdown syntax inside code blocks', () => {
    // ARRANGE
    const markdown = `\`\`\`markdown
# This should not become a heading
**This should not be bold**
\`\`\``;

    // ACT
    const result = renderer.render(markdown);

    // ASSERT
    // Should contain literal markdown syntax, not rendered
    expect(result).toContain('# This should not become a heading');
    expect(result).toContain('**This should not be bold**');
    // Should NOT contain rendered HTML from the code block content
    expect(result).not.toContain('<h1>This should not become a heading</h1>');
    expect(result).not.toContain('<strong>This should not be bold</strong>');
  });

  // ============================================================
  // Test 24: Handle special characters (unicode, emojis)
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should handle unicode and emoji characters', () => {
    // ARRANGE
    const markdown = '# Hello 世界 🌍\n\n**Bold 文字** with emoji 🚀';

    // ACT
    const result = renderer.render(markdown);

    // ASSERT
    expect(result).toContain('Hello 世界 🌍');
    expect(result).toContain('<strong>Bold 文字</strong>');
    expect(result).toContain('emoji 🚀');
    expect(result).toContain('<h1>');
  });

  // ============================================================
  // Test 25: Handle markdown with HTML entities
  // WHY IT WILL FAIL: MarkdownRenderer class does not exist yet
  // ============================================================

  it('should handle HTML entities correctly', () => {
    // ARRANGE
    const markdown = 'Use &lt;script&gt; tags safely: `<script>alert("safe")</script>`';

    // ACT
    const result = renderer.render(markdown);

    // ASSERT
    // HTML entities should be preserved
    expect(result).toContain('&lt;script&gt;');
    // Inline code should contain literal script tag
    expect(result).toContain('<code>');
    expect(result).toContain('&lt;script&gt;alert("safe")&lt;/script&gt;');
  });

  // ============================================================
  // BONUS: Singleton Pattern Tests
  // ============================================================

  // ============================================================
  // Test 26: getInstance returns singleton instance
  // WHY IT WILL FAIL: MarkdownRenderer.getInstance does not exist yet
  // ============================================================

  it('should return singleton instance with getInstance', () => {
    // ARRANGE & ACT
    // @ts-expect-error - getInstance does not exist yet
    const instance1 = MarkdownRenderer.getInstance(defaultConfig);
    // @ts-expect-error - getInstance does not exist yet
    const instance2 = MarkdownRenderer.getInstance(defaultConfig);

    // ASSERT
    expect(instance1).toBe(instance2); // Same instance
  });

  // ============================================================
  // Test 27: initialize method prepares async resources
  // WHY IT WILL FAIL: MarkdownRenderer.initialize does not exist yet
  // ============================================================

  it('should have async initialize method for lazy loading', async () => {
    // ARRANGE & ACT
    // @ts-expect-error - initialize does not exist yet
    await MarkdownRenderer.initialize();

    // ASSERT
    // Should not throw
    // Future: might preload markdown-it library
    expect(true).toBe(true);
  });
});
