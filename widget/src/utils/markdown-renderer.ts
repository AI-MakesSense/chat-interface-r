/**
 * Markdown Renderer
 *
 * Purpose: Transform markdown text to safe HTML
 *
 * Responsibility:
 * - Parse markdown using markdown-it library
 * - Configure markdown features based on MarkdownConfig
 * - Sanitize output HTML with XssSanitizer (MARKDOWN_PRESET)
 * - Prevent XSS attacks and markdown-based DoS
 * - Support singleton pattern for efficient reuse
 *
 * Assumptions:
 * - Input markdown may contain malicious content
 * - markdown-it is available (installed via npm)
 * - XssSanitizer is available with MARKDOWN_PRESET
 * - Sanitization happens AFTER markdown parsing (not before)
 */

import MarkdownIt from 'markdown-it';
import { XssSanitizer } from './xss-sanitizer';

/**
 * Markdown configuration interface
 *
 * Controls which markdown features are enabled/disabled
 */
export interface MarkdownConfig {
  /** Enable table parsing (GitHub Flavored Markdown) */
  enableTables: boolean;
  /** Enable code blocks with syntax highlighting support */
  enableCodeBlocks: boolean;
  /** Enable blockquote rendering */
  enableBlockquotes: boolean;
  /** Enable link rendering */
  enableLinks: boolean;
  /** Enable image rendering */
  enableImages: boolean;
  /** Enable line breaks (two spaces + newline = <br>) */
  enableLineBreaks: boolean;
  /** Maximum nesting depth to prevent DoS (default: 20) */
  maxNesting: number;
}

/**
 * Markdown Renderer class
 *
 * Provides markdown-to-HTML conversion with security and configurability.
 *
 * @example
 * const config: MarkdownConfig = {
 *   enableTables: true,
 *   enableCodeBlocks: true,
 *   enableBlockquotes: true,
 *   enableLinks: true,
 *   enableImages: true,
 *   enableLineBreaks: true,
 *   maxNesting: 20,
 * };
 * const renderer = new MarkdownRenderer(config);
 * const html = renderer.render('# Hello **World**');
 * // Returns: '<h1>Hello <strong>World</strong></h1>'
 */
export class MarkdownRenderer {
  private md: MarkdownIt;
  private sanitizer: XssSanitizer;
  private config: MarkdownConfig;

  /** Singleton instance for reuse */
  private static instance: MarkdownRenderer | null = null;

  /**
   * Creates a new Markdown Renderer instance
   *
   * @param config - Markdown configuration
   */
  constructor(config: MarkdownConfig) {
    this.config = config;

    // Initialize markdown-it with core configuration
    this.md = new MarkdownIt({
      html: true, // SECURITY: Allow HTML input (will be sanitized after parsing)
      breaks: config.enableLineBreaks, // Convert \n to <br> if enabled
      linkify: true, // Auto-convert URLs to links (if links enabled)
      typographer: true, // Smart quotes, dashes, ellipses
    });

    // Set maxNesting limit (must use .set() method, not constructor)
    // maxNesting counts ALL nesting (lists, paragraphs, etc.), not just visible levels
    // Multiply by 3 to allow reasonable markdown while preventing DoS
    // Note: TypeScript types don't include maxNesting, but it's a valid runtime option
    this.md.set({ maxNesting: config.maxNesting * 3 } as any);

    // Override link validator to allow all links (will be sanitized by XssSanitizer)
    // This ensures markdown parsing happens BEFORE sanitization (security best practice)
    this.md.validateLink = () => true;

    // Configure feature toggles by disabling unwanted rules
    this.applyFeatureToggles();

    // Initialize XSS sanitizer with markdown preset
    this.sanitizer = new XssSanitizer(XssSanitizer.MARKDOWN_PRESET);
  }

  /**
   * Applies feature toggles to markdown-it by disabling rules
   *
   * markdown-it has specific rule names for each feature.
   * Disabling a rule prevents that markdown syntax from being parsed.
   *
   * @private
   */
  private applyFeatureToggles(): void {
    const disabledRules: string[] = [];

    // Disable tables if not enabled
    if (!this.config.enableTables) {
      disabledRules.push('table');
    }

    // Disable code blocks if not enabled
    if (!this.config.enableCodeBlocks) {
      disabledRules.push('code'); // Inline code
      disabledRules.push('fence'); // Fenced code blocks (```)
    }

    // Disable blockquotes if not enabled
    if (!this.config.enableBlockquotes) {
      disabledRules.push('blockquote');
    }

    // Disable links and images if not enabled
    if (!this.config.enableLinks) {
      disabledRules.push('link');
      disabledRules.push('linkify'); // Auto-linkify URLs
    }

    if (!this.config.enableImages) {
      disabledRules.push('image');
    }

    // Apply all disabled rules at once
    if (disabledRules.length > 0) {
      this.md.disable(disabledRules);
    }

    // Disable line breaks separately (inline rule)
    // The 'newline' rule handles both hard breaks (two spaces + \n) and soft breaks
    if (!this.config.enableLineBreaks) {
      this.md.inline.ruler.disable(['newline']);
    }
  }

  /**
   * Renders markdown to safe HTML
   *
   * SECURITY: Sanitizes output AFTER markdown parsing (not before).
   * This ensures markdown syntax is processed correctly before XSS filtering.
   *
   * @param markdown - Input markdown string
   * @returns Safe HTML string
   *
   * @example
   * renderer.render('**bold** text');
   * // Returns: '<p><strong>bold</strong> text</p>'
   *
   * renderer.render('<script>alert("XSS")</script>');
   * // Returns: '' (script tag removed)
   */
  render(markdown: string): string {
    // Handle empty input
    if (!markdown || markdown.trim() === '') {
      return '';
    }

    // Step 1: Parse markdown to HTML
    const unsafeHtml = this.md.render(markdown);

    // Step 2: Sanitize HTML to prevent XSS
    // CRITICAL: Sanitize AFTER parsing, not before
    // This allows markdown syntax to work while blocking XSS
    const safeHtml = this.sanitizer.sanitize(unsafeHtml);

    return safeHtml;
  }

  /**
   * Async initialization method for lazy loading
   *
   * Placeholder for future async resource loading (e.g., syntax highlighters).
   * Currently does nothing but satisfies test requirements.
   *
   * @returns Promise that resolves when initialization is complete
   *
   * @example
   * await MarkdownRenderer.initialize();
   * const renderer = MarkdownRenderer.getInstance(config);
   */
  static async initialize(): Promise<void> {
    // Future: Could preload markdown-it or syntax highlighting libraries
    // For now, this is a no-op that returns immediately
    return Promise.resolve();
  }

  /**
   * Gets singleton instance of MarkdownRenderer
   *
   * Reuses the same instance across calls for efficiency.
   * Note: Singleton uses the first config passed; subsequent configs are ignored.
   *
   * @param config - Markdown configuration (used only on first call)
   * @returns Singleton MarkdownRenderer instance
   *
   * @example
   * const renderer1 = MarkdownRenderer.getInstance(config);
   * const renderer2 = MarkdownRenderer.getInstance(config);
   * // renderer1 === renderer2 (same instance)
   */
  static getInstance(config: MarkdownConfig): MarkdownRenderer {
    if (!this.instance) {
      this.instance = new MarkdownRenderer(config);
    }
    return this.instance;
  }
}
