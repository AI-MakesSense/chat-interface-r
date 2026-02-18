/**
 * @vitest-environment jsdom
 *
 * Unit Tests for PDF Lightbox Component
 *
 * Tests for widget/src/ui/pdf-lightbox.ts
 *
 * Test Coverage:
 * - Opening lightbox creates overlay DOM
 * - Toolbar elements (title, open in new tab, download, close)
 * - Close via button, ESC key, click-outside
 * - Mobile fallback (window.open instead of overlay)
 * - Iframe creation and attributes
 * - Cleanup and destroy
 * - Multiple open/close cycles
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PdfLightbox } from '@/widget/src/ui/pdf-lightbox';

describe('PdfLightbox', () => {
  let lightbox: PdfLightbox;
  const testPdfUrl = 'https://example.com/reports/quarterly-report.pdf';

  beforeEach(() => {
    lightbox = new PdfLightbox();
    // Default to desktop viewport
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
  });

  afterEach(() => {
    lightbox.destroy();
    // Clean up any remaining overlay elements
    document.querySelectorAll('.cw-pdf-lightbox-overlay').forEach((el) => el.remove());
    document.getElementById('cw-pdf-lightbox-styles')?.remove();
  });

  // ============================================================
  // Opening Tests
  // ============================================================

  describe('open()', () => {
    it('should create an overlay element in the DOM', () => {
      lightbox.open(testPdfUrl);

      const overlay = document.querySelector('.cw-pdf-lightbox-overlay');
      expect(overlay).toBeTruthy();
      expect(overlay?.parentNode).toBe(document.body);
    });

    it('should create a modal container inside the overlay', () => {
      lightbox.open(testPdfUrl);

      const modal = document.querySelector('.cw-pdf-lightbox-modal');
      expect(modal).toBeTruthy();
    });

    it('should create an iframe with the PDF URL', () => {
      lightbox.open(testPdfUrl);

      const iframe = document.querySelector('.cw-pdf-iframe') as HTMLIFrameElement;
      expect(iframe).toBeTruthy();
      expect(iframe.src).toBe(testPdfUrl);
    });

    it('should set iframe sandbox attribute for security', () => {
      lightbox.open(testPdfUrl);

      const iframe = document.querySelector('.cw-pdf-iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('sandbox')).toContain('allow-scripts');
      expect(iframe.getAttribute('sandbox')).toContain('allow-same-origin');
    });

    it('should set iframe title for accessibility', () => {
      lightbox.open(testPdfUrl);

      const iframe = document.querySelector('.cw-pdf-iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('title')).toBeTruthy();
    });

    it('should set high z-index on overlay', () => {
      lightbox.open(testPdfUrl);

      const overlay = document.querySelector('.cw-pdf-lightbox-overlay') as HTMLElement;
      expect(parseInt(overlay.style.zIndex)).toBeGreaterThanOrEqual(1000000);
    });

    it('should close existing lightbox before opening a new one', () => {
      lightbox.open('https://example.com/first.pdf');
      lightbox.open('https://example.com/second.pdf');

      const overlays = document.querySelectorAll('.cw-pdf-lightbox-overlay');
      expect(overlays).toHaveLength(1);

      const iframe = document.querySelector('.cw-pdf-iframe') as HTMLIFrameElement;
      expect(iframe.src).toBe('https://example.com/second.pdf');
    });
  });

  // ============================================================
  // Toolbar Tests
  // ============================================================

  describe('toolbar', () => {
    it('should display the filename from the URL', () => {
      lightbox.open(testPdfUrl);

      const title = document.querySelector('.cw-pdf-title');
      expect(title?.textContent).toBe('quarterly-report.pdf');
    });

    it('should have an "Open in new tab" link', () => {
      lightbox.open(testPdfUrl);

      const links = document.querySelectorAll('.cw-pdf-toolbar a');
      const openLink = Array.from(links).find((l) => l.textContent?.includes('Open in new tab'));
      expect(openLink).toBeTruthy();
      expect((openLink as HTMLAnchorElement).href).toBe(testPdfUrl);
      expect((openLink as HTMLAnchorElement).target).toBe('_blank');
    });

    it('should have a "Download" link', () => {
      lightbox.open(testPdfUrl);

      const links = document.querySelectorAll('.cw-pdf-toolbar a');
      const downloadLink = Array.from(links).find((l) => l.textContent?.includes('Download'));
      expect(downloadLink).toBeTruthy();
      expect((downloadLink as HTMLAnchorElement).href).toBe(testPdfUrl);
    });

    it('should have a close button', () => {
      lightbox.open(testPdfUrl);

      const closeBtn = document.querySelector('.cw-pdf-toolbar button');
      expect(closeBtn).toBeTruthy();
      expect(closeBtn?.getAttribute('aria-label')).toContain('Close');
    });
  });

  // ============================================================
  // Close Tests
  // ============================================================

  describe('close()', () => {
    it('should remove overlay from DOM', () => {
      lightbox.open(testPdfUrl);
      expect(document.querySelector('.cw-pdf-lightbox-overlay')).toBeTruthy();

      lightbox.close();
      expect(document.querySelector('.cw-pdf-lightbox-overlay')).toBeNull();
    });

    it('should be safe to call multiple times', () => {
      lightbox.open(testPdfUrl);

      expect(() => {
        lightbox.close();
        lightbox.close();
        lightbox.close();
      }).not.toThrow();
    });

    it('should close when close button is clicked', () => {
      lightbox.open(testPdfUrl);

      const closeBtn = document.querySelector('.cw-pdf-toolbar button') as HTMLElement;
      closeBtn.click();

      expect(document.querySelector('.cw-pdf-lightbox-overlay')).toBeNull();
    });

    it('should close when ESC key is pressed', () => {
      lightbox.open(testPdfUrl);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(document.querySelector('.cw-pdf-lightbox-overlay')).toBeNull();
    });

    it('should close when clicking on the overlay backdrop', () => {
      lightbox.open(testPdfUrl);

      const overlay = document.querySelector('.cw-pdf-lightbox-overlay') as HTMLElement;
      // Simulate clicking the overlay itself (not the modal inside it)
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: overlay });
      overlay.dispatchEvent(event);

      expect(document.querySelector('.cw-pdf-lightbox-overlay')).toBeNull();
    });

    it('should NOT close when clicking inside the modal', () => {
      lightbox.open(testPdfUrl);

      const modal = document.querySelector('.cw-pdf-lightbox-modal') as HTMLElement;
      modal.click();

      expect(document.querySelector('.cw-pdf-lightbox-overlay')).toBeTruthy();
    });

    it('should remove ESC key listener after close', () => {
      lightbox.open(testPdfUrl);
      lightbox.close();

      const removeListenerSpy = vi.spyOn(document, 'removeEventListener');
      // Opening and closing again should work cleanly
      lightbox.open(testPdfUrl);
      lightbox.close();

      expect(removeListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeListenerSpy.mockRestore();
    });
  });

  // ============================================================
  // Mobile Fallback Tests
  // ============================================================

  describe('mobile fallback', () => {
    it('should open in new tab on mobile viewports', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });

      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

      lightbox.open(testPdfUrl);

      expect(openSpy).toHaveBeenCalledWith(testPdfUrl, '_blank', 'noopener,noreferrer');
      expect(document.querySelector('.cw-pdf-lightbox-overlay')).toBeNull();

      openSpy.mockRestore();
    });

    it('should NOT create overlay on mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 767, writable: true });

      vi.spyOn(window, 'open').mockReturnValue(null);

      lightbox.open(testPdfUrl);

      expect(document.querySelector('.cw-pdf-lightbox-overlay')).toBeNull();
    });

    it('should create overlay on desktop viewports', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });

      lightbox.open(testPdfUrl);

      expect(document.querySelector('.cw-pdf-lightbox-overlay')).toBeTruthy();
    });
  });

  // ============================================================
  // Styles Injection Tests
  // ============================================================

  describe('styles', () => {
    it('should inject animation keyframes stylesheet', () => {
      lightbox.open(testPdfUrl);

      const styleEl = document.getElementById('cw-pdf-lightbox-styles');
      expect(styleEl).toBeTruthy();
      expect(styleEl?.textContent).toContain('cw-fade-in');
    });

    it('should only inject styles once across multiple opens', () => {
      lightbox.open(testPdfUrl);
      lightbox.close();
      lightbox.open(testPdfUrl);

      const styleEls = document.querySelectorAll('#cw-pdf-lightbox-styles');
      expect(styleEls).toHaveLength(1);
    });
  });

  // ============================================================
  // Destroy Tests
  // ============================================================

  describe('destroy()', () => {
    it('should remove overlay and clean up', () => {
      lightbox.open(testPdfUrl);
      lightbox.destroy();

      expect(document.querySelector('.cw-pdf-lightbox-overlay')).toBeNull();
    });

    it('should be safe to call without opening first', () => {
      expect(() => {
        lightbox.destroy();
      }).not.toThrow();
    });

    it('should allow re-opening after destroy', () => {
      lightbox.open(testPdfUrl);
      lightbox.destroy();

      lightbox.open(testPdfUrl);
      expect(document.querySelector('.cw-pdf-lightbox-overlay')).toBeTruthy();
    });
  });

  // ============================================================
  // URL Handling Tests
  // ============================================================

  describe('URL handling', () => {
    it('should handle URLs with special characters in filename', () => {
      lightbox.open('https://example.com/my%20report%20(final).pdf');

      const title = document.querySelector('.cw-pdf-title');
      expect(title?.textContent).toBe('my report (final).pdf');
    });

    it('should show fallback filename for URLs without a clear filename', () => {
      lightbox.open('https://example.com/');

      const title = document.querySelector('.cw-pdf-title');
      expect(title?.textContent).toBeTruthy();
    });
  });
});
