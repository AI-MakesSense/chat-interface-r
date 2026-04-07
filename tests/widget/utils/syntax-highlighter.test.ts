/**
 * @vitest-environment jsdom
 *
 * RED Tests for Syntax Highlighter
 *
 * Tests for widget/src/utils/syntax-highlighter.ts
 *
 * Note: Uses JSDOM environment (same as other utils tests) to support DOM manipulation
 * for theme injection and code block processing.
 *
 * WHY THESE TESTS WILL FAIL:
 * - Production module does not exist yet (widget/src/utils/syntax-highlighter.ts)
 * - SyntaxHighlighter class is not implemented
 * - SyntaxHighlighterConfig interface is not defined
 * - STANDARD_HIGHLIGHTER_CONFIG constant is not defined
 * - prismjs library is not installed
 * - This is the RED phase of TDD - tests are written BEFORE production code
 *
 * Test Coverage:
 *
 * CORE HIGHLIGHTING (8 tests):
 * 1. Highlight JavaScript code block
 * 2. Highlight TypeScript code block
 * 3. Highlight Python code block
 * 4. Highlight JSON code block
 * 5. Highlight Bash code block
 * 6. Preserve code content exactly (no modification)
 * 7. Return plain code for unsupported language
 * 8. Handle mixed case language names
 *
 * CONFIGURATION (4 tests):
 * 9. Respect showLineNumbers = true
 * 10. Respect showLineNumbers = false
 * 11. Respect supportedLanguages whitelist
 * 12. Respect maxCodeLength limit
 *
 * THEME SYSTEM (5 tests):
 * 13. Apply light theme CSS classes
 * 14. Apply dark theme CSS classes
 * 15. Support auto theme (system preference - light)
 * 16. Support auto theme (system preference - dark)
 * 17. Theme switch removes old theme
 *
 * INTEGRATION (3 tests):
 * 18. Integrate with MarkdownRenderer
 * 19. Preserve XSS-sanitized content
 * 20. Handle multiple code blocks in single document
 *
 * EDGE CASES (5 tests):
 * 21. Handle empty code string
 * 22. Handle very long code (>50KB, should truncate/warn)
 * 23. Handle code with special characters (unicode, emojis)
 * 24. Handle code with HTML entities
 * 25. Handle invalid language name gracefully
 *
 * Module Purpose:
 * - Add syntax highlighting to code blocks in markdown messages
 * - Use Prism.js for highlighting (2KB core + 3.8KB languages)
 * - Support light/dark/auto themes via CDN CSS
 * - Integrate seamlessly with MarkdownRenderer
 * - Stay within 50KB bundle size limit (lazy-loading)
 * - Maintain security (no XSS vulnerabilities)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
// @ts-expect-error - Module does not exist yet (RED phase)
import {
  SyntaxHighlighter,
  SyntaxHighlighterConfig,
  STANDARD_HIGHLIGHTER_CONFIG,
} from '@/widget/src/utils/syntax-highlighter';

describe('SyntaxHighlighter - Core Highlighting Tests', () => {
  let highlighter: SyntaxHighlighter;
  let defaultConfig: SyntaxHighlighterConfig;

  beforeEach(() => {
    // Default configuration matching STANDARD_HIGHLIGHTER_CONFIG
    defaultConfig = {
      theme: 'light',
      showLineNumbers: false,
      supportedLanguages: ['javascript', 'typescript', 'python', 'json', 'bash'],
      maxCodeLength: 50000, // 50KB
      cdnBaseUrl: 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0',
    };

    // @ts-expect-error - SyntaxHighlighter does not exist yet
    highlighter = new SyntaxHighlighter(defaultConfig);
  });

  // ============================================================
  // Test 1: Highlight JavaScript code block
  // WHY IT WILL FAIL: SyntaxHighlighter class does not exist yet
  // ============================================================

  it('should highlight JavaScript code block with token spans', () => {
    // ARRANGE
    const code = 'const x = 10;';
    const html = `<pre><code class="language-javascript">${code}</code></pre>`;

    // ACT
    const result = highlighter.highlight(html);

    // ASSERT
    expect(result).toContain('<span class="token keyword">const</span>');
    expect(result).toContain('<span class="token operator">=</span>');
    expect(result).toContain('<span class="token number">10</span>');
    expect(result).toContain('language-javascript');
  });

  // ============================================================
  // Test 2: Highlight TypeScript code block
  // WHY IT WILL FAIL: SyntaxHighlighter.highlight() method does not exist
  // ============================================================

  it('should highlight TypeScript code block with type annotations', () => {
    // ARRANGE
    const code = 'const message: string = "Hello";';
    const html = `<pre><code class="language-typescript">${code}</code></pre>`;

    // ACT
    const result = highlighter.highlight(html);

    // ASSERT
    expect(result).toContain('<span class="token keyword">const</span>');
    expect(result).toContain('<span class="token builtin">string</span>');
    expect(result).toContain('<span class="token string">"Hello"</span>');
    expect(result).toContain('language-typescript');
  });

  // ============================================================
  // Test 3: Highlight Python code block
  // WHY IT WILL FAIL: Python language support not implemented
  // ============================================================

  it('should highlight Python code block with def and print', () => {
    // ARRANGE
    const code = 'def hello():\n    print("Hello")';
    const html = `<pre><code class="language-python">${code}</code></pre>`;

    // ACT
    const result = highlighter.highlight(html);

    // ASSERT
    expect(result).toContain('<span class="token keyword">def</span>');
    expect(result).toContain('<span class="token function">hello</span>');
    expect(result).toContain('<span class="token builtin">print</span>');
    expect(result).toContain('language-python');
  });

  // ============================================================
  // Test 4: Highlight JSON code block
  // WHY IT WILL FAIL: JSON language support not implemented
  // ============================================================

  it('should highlight JSON code block with property and string', () => {
    // ARRANGE
    const code = '{"name": "John", "age": 30}';
    const html = `<pre><code class="language-json">${code}</code></pre>`;

    // ACT
    const result = highlighter.highlight(html);

    // ASSERT
    expect(result).toContain('<span class="token property">"name"</span>');
    expect(result).toContain('<span class="token string">"John"</span>');
    expect(result).toContain('<span class="token number">30</span>');
    expect(result).toContain('language-json');
  });

  // ============================================================
  // Test 5: Highlight Bash code block
  // WHY IT WILL FAIL: Bash language support not implemented
  // ============================================================

  it('should highlight Bash code block with commands', () => {
    // ARRANGE
    const code = 'echo "Hello World"\nls -la';
    const html = `<pre><code class="language-bash">${code}</code></pre>`;

    // ACT
    const result = highlighter.highlight(html);

    // ASSERT
    expect(result).toContain('<span class="token builtin">echo</span>');
    expect(result).toContain('<span class="token string">"Hello World"</span>');
    expect(result).toContain('<span class="token builtin">ls</span>');
    expect(result).toContain('language-bash');
  });

  // ============================================================
  // Test 6: Preserve code content exactly (no modification)
  // WHY IT WILL FAIL: Content preservation logic not implemented
  // ============================================================

  it('should preserve code content exactly without modifying the actual code', () => {
    // ARRANGE
    const code = 'const   spaces  =   "preserved";';
    const html = `<pre><code class="language-javascript">${code}</code></pre>`;

    // ACT
    const result = highlighter.highlight(html);

    // ASSERT
    // Whitespace should be preserved in the output
    expect(result).toContain('spaces');
    expect(result).toContain('preserved');
    // Should not collapse multiple spaces
    expect(result.replace(/<[^>]*>/g, '')).toContain('const   spaces  =   "preserved";');
  });

  // ============================================================
  // Test 7: Return plain code for unsupported language
  // WHY IT WILL FAIL: Fallback logic not implemented
  // ============================================================

  it('should return plain code for unsupported language without highlighting', () => {
    // ARRANGE
    const code = 'some code in unknown language';
    const html = `<pre><code class="language-unknown">${code}</code></pre>`;

    // ACT
    const result = highlighter.highlight(html);

    // ASSERT
    // Should return original HTML without highlighting spans
    expect(result).toContain(code);
    expect(result).not.toContain('<span class="token');
    expect(result).toContain('language-unknown');
  });

  // ============================================================
  // Test 8: Handle mixed case language names
  // WHY IT WILL FAIL: Case normalization logic not implemented
  // ============================================================

  it('should handle mixed case language names (JavaScript, PYTHON, etc)', () => {
    // ARRANGE
    const code1 = 'const x = 10;';
    const html1 = `<pre><code class="language-JavaScript">${code1}</code></pre>`;

    const code2 = 'print("hello")';
    const html2 = `<pre><code class="language-PYTHON">${code2}</code></pre>`;

    // ACT
    const result1 = highlighter.highlight(html1);
    const result2 = highlighter.highlight(html2);

    // ASSERT
    // Should normalize to lowercase and highlight correctly
    expect(result1).toContain('<span class="token keyword">const</span>');
    expect(result2).toContain('<span class="token builtin">print</span>');
  });
});

describe('SyntaxHighlighter - Configuration Tests', () => {
  let highlighter: SyntaxHighlighter;

  // ============================================================
  // Test 9: Respect showLineNumbers = true
  // WHY IT WILL FAIL: Line numbers feature not implemented
  // ============================================================

  it('should show line numbers when showLineNumbers = true', () => {
    // ARRANGE
    const config: SyntaxHighlighterConfig = {
      theme: 'light',
      showLineNumbers: true,
      supportedLanguages: ['javascript'],
      maxCodeLength: 50000,
    };

    // @ts-expect-error - SyntaxHighlighter does not exist yet
    highlighter = new SyntaxHighlighter(config);

    const code = 'const x = 10;\nconst y = 20;';
    const html = `<pre><code class="language-javascript">${code}</code></pre>`;

    // ACT
    const result = highlighter.highlight(html);

    // ASSERT
    // Line numbers should be present in output (Prism uses .line-numbers class)
    expect(result).toContain('line-numbers');
    expect(result).toMatch(/data-line="1"/);
    expect(result).toMatch(/data-line="2"/);
  });

  // ============================================================
  // Test 10: Respect showLineNumbers = false
  // WHY IT WILL FAIL: Configuration not respected
  // ============================================================

  it('should not show line numbers when showLineNumbers = false', () => {
    // ARRANGE
    const config: SyntaxHighlighterConfig = {
      theme: 'light',
      showLineNumbers: false,
      supportedLanguages: ['javascript'],
      maxCodeLength: 50000,
    };

    // @ts-expect-error - SyntaxHighlighter does not exist yet
    highlighter = new SyntaxHighlighter(config);

    const code = 'const x = 10;\nconst y = 20;';
    const html = `<pre><code class="language-javascript">${code}</code></pre>`;

    // ACT
    const result = highlighter.highlight(html);

    // ASSERT
    // Line numbers should NOT be present
    expect(result).not.toContain('line-numbers');
    expect(result).not.toMatch(/data-line/);
  });

  // ============================================================
  // Test 11: Respect supportedLanguages whitelist
  // WHY IT WILL FAIL: Language whitelist validation not implemented
  // ============================================================

  it('should only highlight languages in supportedLanguages whitelist', () => {
    // ARRANGE
    const config: SyntaxHighlighterConfig = {
      theme: 'light',
      showLineNumbers: false,
      supportedLanguages: ['javascript'], // Only JavaScript supported
      maxCodeLength: 50000,
    };

    // @ts-expect-error - SyntaxHighlighter does not exist yet
    highlighter = new SyntaxHighlighter(config);

    const jsCode = 'const x = 10;';
    const jsHtml = `<pre><code class="language-javascript">${jsCode}</code></pre>`;

    const pythonCode = 'print("hello")';
    const pythonHtml = `<pre><code class="language-python">${pythonCode}</code></pre>`;

    // ACT
    const jsResult = highlighter.highlight(jsHtml);
    const pythonResult = highlighter.highlight(pythonHtml);

    // ASSERT
    // JavaScript should be highlighted
    expect(jsResult).toContain('<span class="token keyword">const</span>');

    // Python should NOT be highlighted (not in whitelist)
    expect(pythonResult).not.toContain('<span class="token');
    expect(pythonResult).toContain('print("hello")');
  });

  // ============================================================
  // Test 12: Respect maxCodeLength limit
  // WHY IT WILL FAIL: Code length validation not implemented
  // ============================================================

  it('should not highlight code longer than maxCodeLength', () => {
    // ARRANGE
    const config: SyntaxHighlighterConfig = {
      theme: 'light',
      showLineNumbers: false,
      supportedLanguages: ['javascript'],
      maxCodeLength: 100, // Very small limit for testing
    };

    // @ts-expect-error - SyntaxHighlighter does not exist yet
    highlighter = new SyntaxHighlighter(config);

    // Create code longer than 100 characters
    const longCode = 'const x = 10; '.repeat(20); // 280 characters
    const html = `<pre><code class="language-javascript">${longCode}</code></pre>`;

    // ACT
    const result = highlighter.highlight(html);

    // ASSERT
    // Should NOT be highlighted due to length limit
    expect(result).not.toContain('<span class="token');
    expect(result).toContain(longCode);
  });
});

describe('SyntaxHighlighter - Theme System Tests', () => {
  let highlighter: SyntaxHighlighter;
  let defaultConfig: SyntaxHighlighterConfig;

  beforeEach(() => {
    defaultConfig = {
      theme: 'light',
      showLineNumbers: false,
      supportedLanguages: ['javascript'],
      maxCodeLength: 50000,
      cdnBaseUrl: 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0',
    };

    // @ts-expect-error - SyntaxHighlighter does not exist yet
    highlighter = new SyntaxHighlighter(defaultConfig);

    // Clear any existing theme links
    document.querySelectorAll('link[data-prism-theme]').forEach((el) => el.remove());
  });

  afterEach(() => {
    // Cleanup theme links after each test
    document.querySelectorAll('link[data-prism-theme]').forEach((el) => el.remove());
  });

  // ============================================================
  // Test 13: Apply light theme CSS classes
  // WHY IT WILL FAIL: setTheme() method not implemented
  // ============================================================

  it('should inject light theme CSS when theme is "light"', () => {
    // ARRANGE
    // @ts-expect-error - SyntaxHighlighter does not exist yet
    highlighter = new SyntaxHighlighter({ ...defaultConfig, theme: 'light' });

    // ACT
    highlighter.setTheme('light');

    // ASSERT
    const themeLink = document.querySelector('link[data-prism-theme="light"]');
    expect(themeLink).not.toBeNull();
    expect(themeLink?.getAttribute('href')).toContain('prism.min.css');
    expect(themeLink?.getAttribute('href')).not.toContain('dark');
  });

  // ============================================================
  // Test 14: Apply dark theme CSS classes
  // WHY IT WILL FAIL: Dark theme logic not implemented
  // ============================================================

  it('should inject dark theme CSS when theme is "dark"', () => {
    // ARRANGE
    // @ts-expect-error - SyntaxHighlighter does not exist yet
    highlighter = new SyntaxHighlighter({ ...defaultConfig, theme: 'dark' });

    // ACT
    highlighter.setTheme('dark');

    // ASSERT
    const themeLink = document.querySelector('link[data-prism-theme="dark"]');
    expect(themeLink).not.toBeNull();
    expect(themeLink?.getAttribute('href')).toContain('prism-okaidia.min.css');
  });

  // ============================================================
  // Test 15: Support auto theme (system preference - light)
  // WHY IT WILL FAIL: Auto theme detection not implemented
  // ============================================================

  it('should detect system preference for light theme when theme is "auto"', () => {
    // ARRANGE
    // Mock matchMedia for light theme
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // @ts-expect-error - SyntaxHighlighter does not exist yet
    highlighter = new SyntaxHighlighter({ ...defaultConfig, theme: 'auto' });

    // ACT
    highlighter.setTheme('auto');

    // ASSERT
    const themeLink = document.querySelector('link[data-prism-theme="light"]');
    expect(themeLink).not.toBeNull();
    expect(themeLink?.getAttribute('href')).toContain('prism.min.css');
  });

  // ============================================================
  // Test 16: Support auto theme (system preference - dark)
  // WHY IT WILL FAIL: Auto theme detection for dark not implemented
  // ============================================================

  it('should detect system preference for dark theme when theme is "auto"', () => {
    // ARRANGE
    // Mock matchMedia for dark theme
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // @ts-expect-error - SyntaxHighlighter does not exist yet
    highlighter = new SyntaxHighlighter({ ...defaultConfig, theme: 'auto' });

    // ACT
    highlighter.setTheme('auto');

    // ASSERT
    const themeLink = document.querySelector('link[data-prism-theme="dark"]');
    expect(themeLink).not.toBeNull();
    expect(themeLink?.getAttribute('href')).toContain('prism-okaidia.min.css');
  });

  // ============================================================
  // Test 17: Theme switch removes old theme
  // WHY IT WILL FAIL: Theme switching logic not implemented
  // ============================================================

  it('should remove old theme CSS when switching themes', () => {
    // ARRANGE
    // @ts-expect-error - SyntaxHighlighter does not exist yet
    highlighter = new SyntaxHighlighter({ ...defaultConfig, theme: 'light' });

    // ACT
    highlighter.setTheme('light');
    expect(document.querySelectorAll('link[data-prism-theme]')).toHaveLength(1);

    highlighter.setTheme('dark');

    // ASSERT
    // Should only have ONE theme link (dark), old light theme should be removed
    const themeLinks = document.querySelectorAll('link[data-prism-theme]');
    expect(themeLinks).toHaveLength(1);
    expect(themeLinks[0].getAttribute('data-prism-theme')).toBe('dark');
    expect(themeLinks[0].getAttribute('href')).toContain('prism-okaidia.min.css');
  });
});

describe('SyntaxHighlighter - Integration Tests', () => {
  let highlighter: SyntaxHighlighter;
  let defaultConfig: SyntaxHighlighterConfig;

  beforeEach(() => {
    defaultConfig = {
      theme: 'light',
      showLineNumbers: false,
      supportedLanguages: ['javascript', 'python'],
      maxCodeLength: 50000,
    };

    // @ts-expect-error - SyntaxHighlighter does not exist yet
    highlighter = new SyntaxHighlighter(defaultConfig);
  });

  // ============================================================
  // Test 18: Integrate with MarkdownRenderer
  // WHY IT WILL FAIL: Integration logic not implemented
  // ============================================================

  it('should integrate with MarkdownRenderer to highlight code blocks', () => {
    // ARRANGE
    // Simulate output from MarkdownRenderer (after markdown parsing and sanitization)
    const markdownOutput = `<h1>Title</h1>
<p>Some text with code:</p>
<pre><code class="language-javascript">const x = 10;</code></pre>
<p>More text</p>`;

    // ACT
    const result = highlighter.highlight(markdownOutput);

    // ASSERT
    // Non-code content should be preserved
    expect(result).toContain('<h1>Title</h1>');
    expect(result).toContain('<p>Some text with code:</p>');
    expect(result).toContain('<p>More text</p>');

    // Code block should be highlighted
    expect(result).toContain('<span class="token keyword">const</span>');
    expect(result).toContain('<span class="token number">10</span>');
  });

  // ============================================================
  // Test 19: Preserve XSS-sanitized content
  // WHY IT WILL FAIL: XSS preservation logic not implemented
  // ============================================================

  it('should preserve XSS-sanitized content without re-introducing vulnerabilities', () => {
    // ARRANGE
    // Simulate sanitized HTML (XSS attempt already removed by XssSanitizer)
    const sanitizedHtml = `<p>Safe content</p>
<pre><code class="language-javascript">const x = "&lt;script&gt;alert('XSS')&lt;/script&gt;";</code></pre>`;

    // ACT
    const result = highlighter.highlight(sanitizedHtml);

    // ASSERT
    // XSS should remain escaped (no <script> tags in output)
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('&lt;/script&gt;');

    // Code should still be highlighted
    expect(result).toContain('<span class="token keyword">const</span>');
  });

  // ============================================================
  // Test 20: Handle multiple code blocks in single document
  // WHY IT WILL FAIL: Multiple block handling not implemented
  // ============================================================

  it('should handle multiple code blocks in single document', () => {
    // ARRANGE
    const html = `<h1>Examples</h1>
<p>JavaScript example:</p>
<pre><code class="language-javascript">const x = 10;</code></pre>
<p>Python example:</p>
<pre><code class="language-python">print("hello")</code></pre>
<p>Unknown language:</p>
<pre><code class="language-rust">fn main() {}</code></pre>`;

    // ACT
    const result = highlighter.highlight(html);

    // ASSERT
    // JavaScript should be highlighted
    expect(result).toContain('<span class="token keyword">const</span>');

    // Python should be highlighted
    expect(result).toContain('<span class="token builtin">print</span>');

    // Rust should NOT be highlighted (not in supportedLanguages)
    expect(result).toContain('fn main() {}');
    // The Rust block should not have token spans
    const rustBlockMatch = result.match(/<code class="language-rust">.*?<\/code>/s);
    expect(rustBlockMatch).toBeTruthy();
    expect(rustBlockMatch?.[0]).not.toContain('<span class="token');
  });
});

describe('SyntaxHighlighter - Edge Cases Tests', () => {
  let highlighter: SyntaxHighlighter;
  let defaultConfig: SyntaxHighlighterConfig;

  beforeEach(() => {
    defaultConfig = {
      theme: 'light',
      showLineNumbers: false,
      supportedLanguages: ['javascript', 'typescript', 'python', 'json', 'bash'],
      maxCodeLength: 50000,
    };

    // @ts-expect-error - SyntaxHighlighter does not exist yet
    highlighter = new SyntaxHighlighter(defaultConfig);
  });

  // ============================================================
  // Test 21: Handle empty code string
  // WHY IT WILL FAIL: Empty string handling not implemented
  // ============================================================

  it('should handle empty code string without crashing', () => {
    // ARRANGE
    const html = '<pre><code class="language-javascript"></code></pre>';

    // ACT
    const result = highlighter.highlight(html);

    // ASSERT
    expect(result).toContain('<code class="language-javascript">');
    expect(result).not.toContain('<span class="token');
  });

  // ============================================================
  // Test 22: Handle very long code (>50KB, should truncate/warn)
  // WHY IT WILL FAIL: Long code handling not implemented
  // ============================================================

  it('should handle very long code by not highlighting (>50KB)', () => {
    // ARRANGE
    // Create code longer than 50KB
    const longCode = 'const x = 10; // comment\n'.repeat(2500); // ~62KB
    const html = `<pre><code class="language-javascript">${longCode}</code></pre>`;

    // ACT
    const result = highlighter.highlight(html);

    // ASSERT
    // Should NOT be highlighted due to maxCodeLength
    expect(result).not.toContain('<span class="token');
    expect(result).toContain(longCode);
  });

  // ============================================================
  // Test 23: Handle code with special characters (unicode, emojis)
  // WHY IT WILL FAIL: Special character handling not implemented
  // ============================================================

  it('should handle code with unicode and emojis', () => {
    // ARRANGE
    const code = 'const emoji = "🚀"; // Unicode: \\u{1F680}';
    const html = `<pre><code class="language-javascript">${code}</code></pre>`;

    // ACT
    const result = highlighter.highlight(html);

    // ASSERT
    // Emojis and unicode should be preserved
    expect(result).toContain('🚀');
    expect(result).toContain('\\u{1F680}');

    // Code should still be highlighted
    expect(result).toContain('<span class="token keyword">const</span>');
  });

  // ============================================================
  // Test 24: Handle code with HTML entities
  // WHY IT WILL FAIL: HTML entity handling not implemented
  // ============================================================

  it('should handle code with HTML entities', () => {
    // ARRANGE
    const code = 'const html = "&lt;div&gt;Hello&lt;/div&gt;";';
    const html = `<pre><code class="language-javascript">${code}</code></pre>`;

    // ACT
    const result = highlighter.highlight(html);

    // ASSERT
    // HTML entities should be preserved (not decoded)
    expect(result).toContain('&lt;div&gt;');
    expect(result).toContain('&lt;/div&gt;');

    // Should NOT contain actual HTML tags
    expect(result).not.toContain('<div>Hello</div>');

    // Code should still be highlighted
    expect(result).toContain('<span class="token keyword">const</span>');
  });

  // ============================================================
  // Test 25: Handle invalid language name gracefully
  // WHY IT WILL FAIL: Invalid language handling not implemented
  // ============================================================

  it('should handle invalid language name gracefully', () => {
    // ARRANGE
    const code = 'some code';
    const invalidHtml1 = `<pre><code class="language-123-invalid">${code}</code></pre>`;
    const invalidHtml2 = `<pre><code class="language-java script">${code}</code></pre>`; // Space in name
    const invalidHtml3 = `<pre><code class="language-">${code}</code></pre>`; // Empty language

    // ACT
    const result1 = highlighter.highlight(invalidHtml1);
    const result2 = highlighter.highlight(invalidHtml2);
    const result3 = highlighter.highlight(invalidHtml3);

    // ASSERT
    // All should return unhighlighted code (no crash)
    expect(result1).toContain(code);
    expect(result1).not.toContain('<span class="token');

    expect(result2).toContain(code);
    expect(result2).not.toContain('<span class="token');

    expect(result3).toContain(code);
    expect(result3).not.toContain('<span class="token');
  });
});

describe('SyntaxHighlighter - Static Methods and Initialization', () => {
  // ============================================================
  // Test 26: STANDARD_HIGHLIGHTER_CONFIG export exists
  // WHY IT WILL FAIL: STANDARD_HIGHLIGHTER_CONFIG not defined
  // ============================================================

  it('should export STANDARD_HIGHLIGHTER_CONFIG with default values', () => {
    // ARRANGE & ACT
    // @ts-expect-error - STANDARD_HIGHLIGHTER_CONFIG does not exist yet
    const config = STANDARD_HIGHLIGHTER_CONFIG;

    // ASSERT
    expect(config).toBeDefined();
    expect(config.theme).toBe('auto');
    expect(config.showLineNumbers).toBe(false);
    expect(config.supportedLanguages).toContain('javascript');
    expect(config.supportedLanguages).toContain('typescript');
    expect(config.supportedLanguages).toContain('python');
    expect(config.supportedLanguages).toContain('json');
    expect(config.supportedLanguages).toContain('bash');
    expect(config.maxCodeLength).toBe(50000);
  });

  // ============================================================
  // Test 27: getInstance() singleton pattern
  // WHY IT WILL FAIL: getInstance() static method not implemented
  // ============================================================

  it('should return singleton instance via getInstance()', () => {
    // ARRANGE
    const config: SyntaxHighlighterConfig = {
      theme: 'light',
      showLineNumbers: false,
      supportedLanguages: ['javascript'],
      maxCodeLength: 50000,
    };

    // ACT
    // @ts-expect-error - SyntaxHighlighter.getInstance() does not exist yet
    const instance1 = SyntaxHighlighter.getInstance(config);
    // @ts-expect-error - SyntaxHighlighter.getInstance() does not exist yet
    const instance2 = SyntaxHighlighter.getInstance(config);

    // ASSERT
    // Should return same instance (singleton)
    expect(instance1).toBe(instance2);
  });

  // ============================================================
  // Test 28: initialize() static method for lazy loading
  // WHY IT WILL FAIL: initialize() static method not implemented
  // ============================================================

  it('should support lazy initialization via initialize() static method', async () => {
    // ARRANGE & ACT
    // @ts-expect-error - SyntaxHighlighter.initialize() does not exist yet
    await SyntaxHighlighter.initialize();

    // ASSERT
    // Prism.js should be loaded (we can't easily test this in unit tests,
    // but we expect no errors to be thrown)
    expect(true).toBe(true); // Placeholder assertion
  });
});
