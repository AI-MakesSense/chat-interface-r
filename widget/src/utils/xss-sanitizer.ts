/**
 * XSS Sanitizer
 *
 * Purpose: Sanitize HTML output to prevent XSS attacks
 *
 * Responsibility:
 * - Sanitize HTML strings using DOMPurify
 * - Whitelist approach: only allow safe tags/attributes
 * - Support configurable presets (MARKDOWN_PRESET, STRICT_PRESET)
 * - Handle URL scheme validation
 * - Control data URI support
 *
 * Assumptions:
 * - Input HTML is potentially malicious
 * - DOMPurify is available (isomorphic-dompurify)
 * - Safe defaults prevent all XSS vectors
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizer configuration interface
 */
export interface SanitizerConfig {
  /** Allowed HTML tags (whitelist) */
  allowedTags: string[];
  /** Allowed attributes per tag */
  allowedAttributes: Record<string, string[]>;
  /** Allowed URL schemes (e.g., https, http) */
  allowedSchemes: string[];
  /** Allow data: URIs (default: false for security) */
  allowDataUri: boolean;
}

/**
 * XSS Sanitizer class
 *
 * Provides HTML sanitization to prevent XSS attacks using DOMPurify.
 */
export class XssSanitizer {
  private config: SanitizerConfig;

  /**
   * Preset for markdown-rendered HTML
   *
   * Allows all markdown-safe tags and attributes
   */
  static readonly MARKDOWN_PRESET: SanitizerConfig = {
    allowedTags: [
      // Text formatting
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'sup',
      'sub',
      // Headings
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      // Lists
      'ul',
      'ol',
      'li',
      // Links
      'a',
      // Code
      'code',
      'pre',
      'span', // For syntax highlighting classes
      // Blockquotes
      'blockquote',
      // Tables
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      // Images (for markdown images)
      'img',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      code: ['class'], // For syntax highlighting (language-*)
      pre: ['class'],
      span: ['class'], // For syntax highlighting
      th: ['align'],
      td: ['align'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowDataUri: false,
  };

  /**
   * Strict preset for minimal HTML
   *
   * Only allows basic text formatting
   */
  static readonly STRICT_PRESET: SanitizerConfig = {
    allowedTags: ['p', 'br', 'strong', 'em', 'code'],
    allowedAttributes: {},
    allowedSchemes: [],
    allowDataUri: false,
  };

  /**
   * Creates a new XSS Sanitizer instance
   *
   * @param config - Sanitizer configuration
   */
  constructor(config: SanitizerConfig) {
    this.config = config;
  }

  /**
   * Sanitizes HTML string to prevent XSS attacks
   *
   * @param html - Potentially malicious HTML string
   * @returns Safe HTML string with dangerous content removed
   *
   * @example
   * const sanitizer = new XssSanitizer(XssSanitizer.MARKDOWN_PRESET);
   * const safe = sanitizer.sanitize('<p>Safe</p><script>alert("XSS")</script>');
   * // Returns: '<p>Safe</p>'
   */
  sanitize(html: string): string {
    if (!html || html.trim() === '') {
      return '';
    }

    // Configure DOMPurify with our whitelist
    const purifyConfig: any = {
      ALLOWED_TAGS: this.config.allowedTags,
      ALLOWED_ATTR: this.extractAllowedAttributes(),
      ALLOW_DATA_ATTR: false, // Never allow data-* attributes
      ALLOW_UNKNOWN_PROTOCOLS: false,
      KEEP_CONTENT: true, // Keep text content even if tags are removed
      WHOLE_DOCUMENT: false, // Only sanitize HTML fragment, not full document
      RETURN_DOM: false, // Return string, not DOM
      RETURN_DOM_FRAGMENT: false, // Return string, not DocumentFragment
    };

    // Only set ALLOWED_URI_REGEXP if we have allowed schemes
    if (this.config.allowedSchemes.length > 0 || this.config.allowDataUri) {
      purifyConfig.ALLOWED_URI_REGEXP = this.buildUriRegexp();
    }

    // Add hooks to handle data URIs more strictly
    DOMPurify.addHook('uponSanitizeAttribute', (node: any, data: any) => {
      // Block data URIs in src/href if not allowed
      if (!this.config.allowDataUri && data.attrValue && data.attrValue.trim().toLowerCase().startsWith('data:')) {
        data.attrValue = '';
      }
    });

    // Sanitize with DOMPurify
    const sanitized = DOMPurify.sanitize(html, purifyConfig);

    // Remove hooks to avoid affecting other uses
    DOMPurify.removeAllHooks();

    return sanitized as unknown as string;
  }

  /**
   * Extracts flat list of allowed attributes from config
   *
   * @returns Array of allowed attribute names
   * @private
   */
  private extractAllowedAttributes(): string[] {
    const attributes = new Set<string>();

    // Collect all allowed attributes across all tags
    Object.values(this.config.allowedAttributes).forEach((attrs) => {
      attrs.forEach((attr) => attributes.add(attr));
    });

    return Array.from(attributes);
  }

  /**
   * Builds regexp for allowed URI schemes
   *
   * Supports configured schemes + data URIs if enabled
   *
   * @returns RegExp matching allowed URI schemes
   * @private
   */
  private buildUriRegexp(): RegExp {
    const schemes = [...this.config.allowedSchemes];

    // Add data scheme if allowed
    if (this.config.allowDataUri) {
      schemes.push('data');
    }

    // Build regexp: /^(https?|mailto|data):/i
    if (schemes.length === 0) {
      // No schemes allowed - match nothing
      return /^$/;
    }

    const schemePattern = schemes.join('|');
    return new RegExp(`^(${schemePattern}):`, 'i');
  }
}
