/**
 * @vitest-environment jsdom
 *
 * Unit Tests for Link Detector Utility
 *
 * Tests for widget/src/utils/link-detector.ts
 *
 * Test Coverage:
 * - isPdfUrl: URL pattern matching for PDF files
 * - findPdfLinks: DOM querying for PDF anchor elements
 * - Edge cases: malformed URLs, empty inputs, special characters
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { isPdfUrl, findPdfLinks } from '@/widget/src/utils/link-detector';

describe('Link Detector', () => {
  // ============================================================
  // isPdfUrl Tests
  // ============================================================

  describe('isPdfUrl', () => {
    it('should detect simple .pdf URLs', () => {
      expect(isPdfUrl('https://example.com/document.pdf')).toBe(true);
    });

    it('should detect .pdf URLs with path segments', () => {
      expect(isPdfUrl('https://example.com/files/reports/q4-2024.pdf')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isPdfUrl('https://example.com/doc.PDF')).toBe(true);
      expect(isPdfUrl('https://example.com/doc.Pdf')).toBe(true);
    });

    it('should detect .pdf URLs with query parameters', () => {
      expect(isPdfUrl('https://example.com/doc.pdf?token=abc123')).toBe(true);
    });

    it('should detect .pdf URLs with hash fragments', () => {
      expect(isPdfUrl('https://example.com/doc.pdf#page=3')).toBe(true);
    });

    it('should reject non-PDF URLs', () => {
      expect(isPdfUrl('https://example.com/page.html')).toBe(false);
      expect(isPdfUrl('https://example.com/image.png')).toBe(false);
      expect(isPdfUrl('https://example.com/data.json')).toBe(false);
    });

    it('should reject URLs where pdf is part of the path but not the extension', () => {
      expect(isPdfUrl('https://example.com/pdf-viewer')).toBe(false);
      expect(isPdfUrl('https://example.com/pdftools/convert')).toBe(false);
    });

    it('should handle empty or null inputs', () => {
      expect(isPdfUrl('')).toBe(false);
      expect(isPdfUrl(null as any)).toBe(false);
      expect(isPdfUrl(undefined as any)).toBe(false);
    });

    it('should handle malformed URLs gracefully', () => {
      expect(isPdfUrl('not-a-url')).toBe(false);
      expect(isPdfUrl('://broken')).toBe(false);
    });

    it('should handle relative paths ending in .pdf', () => {
      expect(isPdfUrl('/files/doc.pdf')).toBe(true);
      expect(isPdfUrl('doc.pdf')).toBe(true);
    });

    it('should handle http and https schemes', () => {
      expect(isPdfUrl('http://example.com/doc.pdf')).toBe(true);
      expect(isPdfUrl('https://example.com/doc.pdf')).toBe(true);
    });
  });

  // ============================================================
  // findPdfLinks Tests
  // ============================================================

  describe('findPdfLinks', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
    });

    it('should find PDF links in a container', () => {
      container.innerHTML = `
        <a href="https://example.com/doc.pdf">Download PDF</a>
        <a href="https://example.com/page.html">Visit Page</a>
      `;

      const pdfLinks = findPdfLinks(container);
      expect(pdfLinks).toHaveLength(1);
      expect(pdfLinks[0].href).toContain('doc.pdf');
    });

    it('should return empty array when no PDF links exist', () => {
      container.innerHTML = `
        <a href="https://example.com/page.html">Page</a>
        <a href="https://example.com/image.png">Image</a>
      `;

      const pdfLinks = findPdfLinks(container);
      expect(pdfLinks).toHaveLength(0);
    });

    it('should find multiple PDF links', () => {
      container.innerHTML = `
        <a href="https://example.com/report.pdf">Report</a>
        <a href="https://example.com/invoice.pdf">Invoice</a>
        <a href="https://example.com/page.html">Page</a>
      `;

      const pdfLinks = findPdfLinks(container);
      expect(pdfLinks).toHaveLength(2);
    });

    it('should return empty array for container with no links', () => {
      container.innerHTML = '<p>No links here</p>';

      const pdfLinks = findPdfLinks(container);
      expect(pdfLinks).toHaveLength(0);
    });

    it('should find nested PDF links', () => {
      container.innerHTML = `
        <div><p><a href="https://example.com/nested.pdf">Nested PDF</a></p></div>
      `;

      const pdfLinks = findPdfLinks(container);
      expect(pdfLinks).toHaveLength(1);
    });

    it('should ignore links without href', () => {
      container.innerHTML = '<a>No href</a>';

      const pdfLinks = findPdfLinks(container);
      expect(pdfLinks).toHaveLength(0);
    });

    it('should return HTMLAnchorElement instances', () => {
      container.innerHTML = '<a href="https://example.com/doc.pdf">PDF</a>';

      const pdfLinks = findPdfLinks(container);
      expect(pdfLinks[0]).toBeInstanceOf(HTMLAnchorElement);
    });
  });
});
