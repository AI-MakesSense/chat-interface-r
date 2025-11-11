/**
 * Markdown Rendering Module
 *
 * Purpose: Convert markdown to HTML for assistant messages
 * Responsibility: Basic markdown parsing (bold, italic, links, code, lists)
 *
 * Constraints:
 * - Lightweight implementation to minimize bundle size
 * - Sanitize output to prevent XSS
 * - Support common markdown syntax only
 */

import MarkdownIt from 'markdown-it';

// Initialize markdown-it with basic config
const md = new MarkdownIt({
  html: false, // Disable HTML tags for security
  linkify: true, // Auto-convert URLs to links
  typographer: true, // Enable smart quotes and other typography
  breaks: true, // Convert \n to <br>
});

/**
 * Render markdown string to HTML
 * Sanitizes output to prevent XSS attacks
 */
export function renderMarkdown(markdown: string): string {
  try {
    return md.render(markdown);
  } catch (error) {
    console.error('[N8n Chat Widget] Markdown rendering error:', error);
    // Fallback to escaped plain text
    return escapeHtml(markdown).replace(/\n/g, '<br>');
  }
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
