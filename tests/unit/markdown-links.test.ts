import { renderMarkdown } from '@/widget/src/markdown';

describe('renderMarkdown — raw URL auto-linking', () => {
  it('converts a bare https URL to a clickable link', () => {
    const html = renderMarkdown('Visit https://example.com for more');
    expect(html).toContain('<a href="https://example.com"');
    expect(html).toContain('>https://example.com</a>');
  });

  it('converts a bare http URL to a clickable link', () => {
    const html = renderMarkdown('See http://example.com/page');
    expect(html).toContain('<a href="http://example.com/page"');
  });

  it('converts www. URL to a clickable link with https prefix', () => {
    const html = renderMarkdown('Go to www.example.com');
    expect(html).toContain('<a href="https://www.example.com"');
    expect(html).toContain('>www.example.com</a>');
  });

  it('does not double-link markdown links', () => {
    const html = renderMarkdown('[click here](https://example.com)');
    const matches = html.match(/<a /g);
    expect(matches).toHaveLength(1);
    expect(html).toContain('>click here</a>');
  });

  it('does not auto-link URLs inside code blocks', () => {
    const html = renderMarkdown('```\nhttps://example.com\n```');
    expect(html).not.toContain('<a href="https://example.com"');
  });

  it('does not auto-link URLs inside inline code', () => {
    const html = renderMarkdown('Use `https://example.com` in config');
    expect(html).toContain('<code>https://example.com</code>');
    expect(html).not.toContain('<a href="https://example.com"');
  });

  it('handles URL with path, query, and fragment', () => {
    const html = renderMarkdown('https://example.com/path?q=1&r=2#section');
    expect(html).toContain('href="https://example.com/path?q=1&amp;r=2#section"');
  });

  it('handles multiple URLs in one message', () => {
    const html = renderMarkdown('See https://a.com and https://b.com');
    const matches = html.match(/<a /g);
    expect(matches).toHaveLength(2);
  });

  it('strips trailing period from URL', () => {
    const html = renderMarkdown('Visit https://example.com.');
    expect(html).toContain('href="https://example.com"');
    expect(html).not.toContain('href="https://example.com."');
  });

  it('strips trailing comma from URL', () => {
    const html = renderMarkdown('Check https://example.com, then proceed');
    expect(html).toContain('href="https://example.com"');
  });

  it('handles URL-as-link-text in markdown syntax', () => {
    const html = renderMarkdown('[https://display.com](https://target.com)');
    // Should link to target.com, not display.com
    expect(html).toContain('href="https://target.com"');
    expect(html).toContain('>https://display.com</a>');
    // Should be exactly one link
    const matches = html.match(/<a /g);
    expect(matches).toHaveLength(1);
  });
});

describe('renderMarkdown — existing markdown link behavior', () => {
  it('renders markdown links with target=_blank', () => {
    const html = renderMarkdown('[Example](https://example.com)');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
