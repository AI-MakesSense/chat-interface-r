/**
 * Simple Markdown Parser for Chat Widget
 *
 * Renders basic markdown:
 * - # h1, ## h2, ### h3, #### h4, ##### h5, ###### h6
 * - **bold**
 * - *italic*
 * - [links](url)
 * - `code`
 * - ```code blocks```
 * - - unordered lists
 * - 1. ordered lists
 * - > blockquotes
 * - --- horizontal rules
 * - Newlines to <br>
 *
 * Replaces heavy 'markdown-it' dependency to save bundle size.
 */

export function renderMarkdown(text: string): string {
  if (!text) return '';

  try {
    // 1. Escape HTML first to prevent XSS
    let html = escapeHtml(text);

    // 2. Code Blocks (``` with optional language)
    html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // 3. Inline Code (`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 4. Headers (# through ######) — must be at start of line
    html = html.replace(/^(#{1,6})\s+(.+)$/gm, (_match, hashes: string, content: string) => {
      const level = hashes.length;
      return `<h${level}>${content}</h${level}>`;
    });

    // 5. Bold (**)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 6. Italic (*)
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 7. Horizontal rules (--- or ___ or ***)
    html = html.replace(/^(?:---+|___+|\*\*\*+)\s*$/gm, '<hr>');

    // 8. Blockquotes (>)
    html = html.replace(/^&gt;\s?(.+)$/gm, '<blockquote>$1</blockquote>');
    // Merge adjacent blockquotes
    html = html.replace(/<\/blockquote>\s*<blockquote>/g, '<br>');

    // 9. Tables (| col | col | with header separator)
    html = html.replace(
      /(?:^\|.+\|[ \t]*\n)+/gm,
      (block: string) => {
        const rows = block.trim().split('\n');
        if (rows.length < 2) return block;
        // Check if second row is a separator (|---|---|)
        const isSep = /^\|[\s\-:|]+\|$/.test(rows[1].trim());
        if (!isSep) {
          // No header separator — render all as body rows
          const bodyRows = rows.map(r => {
            const cells = r.replace(/^\||\|$/g, '').split('|').map(c => `<td>${c.trim()}</td>`).join('');
            return `<tr>${cells}</tr>`;
          }).join('');
          return `<table><tbody>${bodyRows}</tbody></table>`;
        }
        // Parse alignment from separator row
        const aligns = rows[1].replace(/^\||\|$/g, '').split('|').map(c => {
          const t = c.trim();
          if (t.startsWith(':') && t.endsWith(':')) return 'center';
          if (t.endsWith(':')) return 'right';
          return '';
        });
        const alignAttr = (i: number) => aligns[i] ? ` align="${aligns[i]}"` : '';
        // Header
        const hCells = rows[0].replace(/^\||\|$/g, '').split('|').map((c, i) => `<th${alignAttr(i)}>${c.trim()}</th>`).join('');
        // Body (skip rows 0 and 1)
        const bRows = rows.slice(2).map(r => {
          const cells = r.replace(/^\||\|$/g, '').split('|').map((c, i) => `<td${alignAttr(i)}>${c.trim()}</td>`).join('');
          return `<tr>${cells}</tr>`;
        }).join('');
        return `<table><thead><tr>${hCells}</tr></thead><tbody>${bRows}</tbody></table>`;
      }
    );

    // 10. Unordered lists (- or *)
    html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
    // Merge adjacent <ul> tags
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // 11. Ordered lists (1. 2. etc.)
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<oli>$1</oli>');
    // Wrap adjacent ordered list items in <ol> and convert tags
    html = html.replace(/(<oli>[\s\S]*?<\/oli>)/g, '<ol>$1</ol>');
    html = html.replace(/<\/ol>\s*<ol>/g, '');
    html = html.replace(/<\/?oli>/g, (m: string) => m.replace('oli', 'li'));

    // 12. Links [text](url)
    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // 13. Newlines to <br> (but not inside block elements)
    html = html.replace(/\n/g, '<br>');

    // Clean up <br> after block elements
    html = html.replace(/<\/(h[1-6]|pre|blockquote|ul|ol|li|hr|table|thead|tbody|tr|th|td)><br>/g, '</$1>');
    html = html.replace(/<br><(h[1-6]|pre|blockquote|ul|ol|hr|table|thead|tbody|tr)/g, '<$1');

    return html;
  } catch (error) {
    console.warn('Markdown rendering failed, falling back to plain text', error);
    return text;
  }
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
    "'": '&#039;' // FIX: Correctly quoted key and value
  };

  return unsafe.replace(/[&<>"']/g, (char) => map[char] || char);
}