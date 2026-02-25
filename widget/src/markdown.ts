/**
 * Simple Markdown Parser for Chat Widget
 *
 * Renders markdown to HTML:
 * - # h1 through ###### h6
 * - **bold**, *italic*
 * - [links](url)
 * - `inline code`, ```code blocks```
 * - | tables | with | alignment |
 * - - unordered lists, 1. ordered lists
 * - > blockquotes (multi-line merged)
 * - --- horizontal rules
 * - Newlines to <br>
 *
 * Replaces heavy 'markdown-it' dependency to save bundle size.
 */

export function renderMarkdown(text: string): string {
  if (!text) return '';

  try {
    // Normalize line endings and ensure trailing newline for block-level regex
    let src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    if (!src.endsWith('\n')) src += '\n';

    // 1. Escape HTML to prevent XSS
    let html = escapeHtml(src);

    // 2. Code blocks (``` with optional language) — extract early to protect contents
    const codeBlocks: string[] = [];
    html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, (_m, code: string) => {
      codeBlocks.push(`<pre><code>${code.replace(/\n$/, '')}</code></pre>`);
      return `\x00CB${codeBlocks.length - 1}\x00`;
    });

    // 3. Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 4. Tables — must run before line-level transforms
    // Match consecutive lines that start and end with |
    html = html.replace(
      /(?:^\|.+\|[ \t]*$\n?)+/gm,
      (block: string) => {
        const rows = block.trim().split('\n').filter(r => r.trim());
        if (rows.length < 2) return block;

        const isSep = /^\|[\s\-:|]+\|$/.test(rows[1].trim());
        if (!isSep) {
          const body = rows.map(r => {
            const cells = r.replace(/^\||\|$/g, '').split('|').map(c => `<td>${c.trim()}</td>`).join('');
            return `<tr>${cells}</tr>`;
          }).join('');
          return `<table><tbody>${body}</tbody></table>\n`;
        }

        // Parse column alignment from separator row
        const aligns = rows[1].replace(/^\||\|$/g, '').split('|').map(c => {
          const t = c.trim();
          if (t.startsWith(':') && t.endsWith(':')) return 'center';
          if (t.endsWith(':')) return 'right';
          if (t.startsWith(':')) return 'left';
          return '';
        });
        const attr = (i: number) => aligns[i] ? ` align="${aligns[i]}"` : '';

        const header = rows[0].replace(/^\||\|$/g, '').split('|')
          .map((c, i) => `<th${attr(i)}>${c.trim()}</th>`).join('');

        const body = rows.slice(2).map(r => {
          const cells = r.replace(/^\||\|$/g, '').split('|')
            .map((c, i) => `<td${attr(i)}>${c.trim()}</td>`).join('');
          return `<tr>${cells}</tr>`;
        }).join('');

        return `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>\n`;
      }
    );

    // 5. Headers (# through ######)
    html = html.replace(/^(#{1,6})\s+(.+)$/gm, (_m, h: string, content: string) => {
      return `<h${h.length}>${content}</h${h.length}>`;
    });

    // 6. Bold (**)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 7. Italic (*)
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 8. Horizontal rules (---, ___, ***)
    html = html.replace(/^(?:---+|___+|\*\*\*+)\s*$/gm, '<hr>');

    // 9. Blockquotes — merge consecutive lines
    html = html.replace(
      /(?:^&gt;\s?(.+)$\n?)+/gm,
      (block: string) => {
        const lines = block.trim().split('\n')
          .map(l => l.replace(/^&gt;\s?/, ''));
        return `<blockquote>${lines.join('<br>')}</blockquote>`;
      }
    );

    // 10. Ordered lists — collect consecutive numbered lines
    html = html.replace(
      /(?:^\d+\.\s+.+$\n?)+/gm,
      (block: string) => {
        const items = block.trim().split('\n')
          .map(l => `<li>${l.replace(/^\d+\.\s+/, '')}</li>`).join('');
        return `<ol>${items}</ol>`;
      }
    );

    // 11. Unordered lists — collect consecutive - or * lines
    html = html.replace(
      /(?:^[-*]\s+.+$\n?)+/gm,
      (block: string) => {
        const items = block.trim().split('\n')
          .map(l => `<li>${l.replace(/^[-*]\s+/, '')}</li>`).join('');
        return `<ul>${items}</ul>`;
      }
    );

    // 12. Links [text](url)
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // 13. Newlines to <br> (but not inside block elements)
    html = html.replace(/\n/g, '<br>');

    // Clean up <br> adjacent to block elements
    html = html.replace(/<\/(h[1-6]|pre|blockquote|ul|ol|li|hr|table|thead|tbody|tr|th|td)><br>/g, '</$1>');
    html = html.replace(/<br><(h[1-6]|pre|blockquote|ul|ol|hr|table|thead|tbody|tr)/g, '<$1');
    // Remove trailing <br> at end
    html = html.replace(/(<br>)+$/, '');

    // 14. Restore code blocks
    html = html.replace(/\x00CB(\d+)\x00/g, (_m, idx: string) => codeBlocks[parseInt(idx)]);

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
    "'": '&#039;'
  };
  return unsafe.replace(/[&<>"']/g, (char) => map[char] || char);
}
