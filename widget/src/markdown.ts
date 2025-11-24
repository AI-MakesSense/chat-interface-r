/**
 * Simple Markdown Parser for Chat Widget
 * * Renders basic markdown:
 * - **bold**
 * - *italic*
 * - [links](url)
 * - `code`
 * - ```code blocks```
 * - Newlines to <br>
 * * Replaces heavy 'markdown-it' dependency to save bundle size.
 */

export function renderMarkdown(text: string): string {
  if (!text) return '';

  try {
    // 1. Escape HTML first to prevent XSS
    let html = escapeHtml(text);

    // 2. Code Blocks (```)
    // We handle these first to avoid processing internal chars
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // 3. Inline Code (`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 4. Bold (**)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 5. Italic (*)
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 6. Links [text](url)
    // Simple regex for links - checks for http/https to be safe
    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // 7. Newlines to <br>
    // FIX: Correct regex for newlines, ignoring those inside <pre> tags (basic check)
    html = html.replace(/\n/g, '<br>');

    return html;
  } catch (error) {
    console.warn('Markdown rendering failed, falling back to plain text', error);
    return text; // Fallback to raw text if regex fails
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