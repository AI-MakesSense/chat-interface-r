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

    // 9. Unordered lists (- or *)
    html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
    // Merge adjacent <ul> tags
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // 10. Ordered lists (1. 2. etc.)
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // 11. Links [text](url)
    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // 12. Newlines to <br> (but not inside block elements)
    html = html.replace(/\n/g, '<br>');

    // Clean up <br> after block elements
    html = html.replace(/<\/(h[1-6]|pre|blockquote|ul|ol|li|hr)><br>/g, '</$1>');
    html = html.replace(/<br><(h[1-6]|pre|blockquote|ul|ol|hr)/g, '<$1');

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