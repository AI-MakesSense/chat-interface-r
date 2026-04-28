import { renderMarkdown } from '@/widget/src/markdown';

describe('renderMarkdown', () => {
  it('returns empty string for falsy input', () => {
    expect(renderMarkdown('')).toBe('');
  });

  it('renders bold and italic', () => {
    expect(renderMarkdown('**hi**')).toContain('<strong>hi</strong>');
    expect(renderMarkdown('*hi*')).toContain('<em>hi</em>');
  });

  it('renders inline code and code blocks', () => {
    expect(renderMarkdown('`x`')).toContain('<code>x</code>');
    expect(renderMarkdown('```\nx\n```')).toContain('<pre><code>');
  });

  it('escapes HTML in plain text', () => {
    const out = renderMarkdown('<script>alert(1)</script>');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
  });

  describe('explicit links', () => {
    it('renders [text](url) with target/rel attrs', () => {
      const out = renderMarkdown('[Google](https://google.com)');
      expect(out).toContain('href="https://google.com"');
      expect(out).toContain('target="_blank"');
      expect(out).toContain('rel="noopener noreferrer"');
      expect(out).toContain('>Google</a>');
    });

    it('only allows http(s) — ignores javascript: and other schemes', () => {
      const out = renderMarkdown('[x](javascript:alert(1))');
      expect(out).not.toContain('href="javascript:');
    });
  });

  describe('auto-linkify (bare URLs)', () => {
    it('linkifies a bare https URL', () => {
      const out = renderMarkdown('Visit https://example.com today');
      expect(out).toContain('<a href="https://example.com"');
      expect(out).toContain('>https://example.com</a>');
    });

    it('strips trailing sentence punctuation from the URL', () => {
      const out = renderMarkdown('See https://example.com.');
      expect(out).toContain('href="https://example.com"');
      expect(out).toContain('</a>.');
      expect(out).not.toContain('href="https://example.com."');
    });

    it('strips trailing closing paren', () => {
      const out = renderMarkdown('(see https://example.com)');
      expect(out).toContain('href="https://example.com"');
      expect(out).toContain('</a>)');
    });

    it('does not double-wrap an already explicit-linked URL', () => {
      const out = renderMarkdown('[here](https://example.com)');
      const matches = out.match(/<a /g) || [];
      expect(matches.length).toBe(1);
    });

    it('does not linkify URLs inside inline code', () => {
      const out = renderMarkdown('use `https://example.com` carefully');
      expect(out).toContain('<code>https://example.com</code>');
      expect(out).not.toContain('<a href="https://example.com"');
    });

    it('does not linkify URLs inside code blocks', () => {
      const out = renderMarkdown('```\nhttps://example.com\n```');
      expect(out).toContain('<pre><code>');
      expect(out).not.toContain('<a href="https://example.com"');
    });

    it('handles a mix of explicit + bare in one message', () => {
      const out = renderMarkdown('[A](https://a.com) and https://b.com');
      expect(out).toContain('href="https://a.com"');
      expect(out).toContain('href="https://b.com"');
      const matches = out.match(/<a /g) || [];
      expect(matches.length).toBe(2);
    });

    it('preserves query strings and fragments', () => {
      const out = renderMarkdown('https://x.com/path?a=1&b=2#frag');
      // After escapeHtml, '&' becomes '&amp;' which is valid in href.
      expect(out).toMatch(/href="https:\/\/x\.com\/path\?a=1&amp;b=2#frag"/);
    });

    it('does not linkify ftp/mailto/etc.', () => {
      const out = renderMarkdown('ftp://example.com mail me at a@b.com');
      expect(out).not.toContain('<a ');
    });
  });
});
