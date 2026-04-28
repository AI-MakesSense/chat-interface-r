/**
 * Simple Markdown Parser for Chat Widget
 *
 * Supported syntax:
 * - **bold**, *italic*
 * - `code`, ```code blocks```
 * - [text](http(s)://url) explicit links
 * - bare http(s):// URLs (auto-linkified)
 * - newlines → <br>
 *
 * Replaces heavy 'markdown-it' dependency to save bundle size.
 */

const LINK_ATTRS = 'target="_blank" rel="noopener noreferrer"';
// Trailing characters that are almost always sentence punctuation, not part of the URL.
const TRAILING_PUNCT = /[.,;:!?)\]'"]+$/;

export function renderMarkdown(text: string): string {
  if (!text) return '';

  try {
    // 1. Escape HTML first to prevent XSS. After this, no real `<` / `>` exist.
    let html = escapeHtml(text);

    // 2. Code blocks (```) — protected from later passes.
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // 3. Inline code (`) — also protected.
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 4. Bold / italic.
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 5. Explicit markdown links: [text](http(s)://url)
    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      `<a href="$2" ${LINK_ATTRS}>$1</a>`
    );

    // 6. Auto-linkify bare URLs without double-wrapping links already produced above
    //    or URLs inside <code>/<pre> blocks. We extract those segments to placeholders,
    //    linkify the remainder, then restore.
    html = autoLinkify(html);

    // 7. Newlines → <br>
    html = html.replace(/\n/g, '<br>');

    return html;
  } catch (error) {
    console.warn('Markdown rendering failed, falling back to plain text', error);
    return text;
  }
}

function autoLinkify(html: string): string {
  const protectedRe = /<a [^>]*>[\s\S]*?<\/a>|<pre>[\s\S]*?<\/pre>|<code>[\s\S]*?<\/code>/g;
  const placeholders: string[] = [];

  // Stash already-linked / code segments so the linkifier can't touch them.
  const stashed = html.replace(protectedRe, (match) => {
    const token = `\u0000LINKMD${placeholders.length}\u0000`;
    placeholders.push(match);
    return token;
  });

  // Linkify bare URLs in the remaining text.
  // Stops at whitespace, tag boundaries, or our placeholder sentinel (\u0000).
  const linkified = stashed.replace(/\bhttps?:\/\/[^\s<\u0000]+/g, (url) => {
    const trailing = url.match(TRAILING_PUNCT);
    let target = url;
    let suffix = '';
    if (trailing) {
      target = url.slice(0, url.length - trailing[0].length);
      suffix = trailing[0];
    }
    if (!target) return url;
    return `<a href="${target}" ${LINK_ATTRS}>${target}</a>${suffix}`;
  });

  // Restore placeholders.
  return linkified.replace(/\u0000LINKMD(\d+)\u0000/g, (_, i) => placeholders[Number(i)]);
}

/**
 * HTML Escaping to prevent XSS
 */
function escapeHtml(unsafe: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return unsafe.replace(/[&<>"']/g, (char) => map[char] || char);
}
