/**
 * PDF Lightbox Component
 *
 * Purpose: Display PDF files in a fullscreen overlay within the chat widget
 * Responsibility: Create/manage overlay DOM, iframe PDF rendering, fallback handling
 * Assumptions: PDFs are served from URLs accessible to the browser (CORS-permitting)
 */

const LIGHTBOX_Z_INDEX = 1000000;
const MOBILE_BREAKPOINT = 768;

/**
 * Extracts a display filename from a PDF URL
 */
function getFilenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/');
    const last = segments[segments.length - 1];
    if (last && last.length > 0) {
      return decodeURIComponent(last);
    }
  } catch {
    // ignore
  }
  return 'Document.pdf';
}

/**
 * PdfLightbox - Vanilla DOM lightbox for viewing PDFs inline
 */
export class PdfLightbox {
  private overlay: HTMLDivElement | null = null;
  private escHandler: ((e: KeyboardEvent) => void) | null = null;

  /**
   * Opens the lightbox with a PDF URL
   *
   * On mobile viewports, opens in a new tab instead.
   */
  open(pdfUrl: string): void {
    // Close any existing lightbox first
    if (this.overlay) {
      this.close();
    }

    // Mobile: just open in new tab
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Create overlay backdrop
    const overlay = document.createElement('div');
    overlay.className = 'cw-pdf-lightbox-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.75);
      z-index: ${LIGHTBOX_Z_INDEX};
      display: flex;
      align-items: center;
      justify-content: center;
      animation: cw-fade-in 0.2s ease-out;
    `;

    // Click outside to close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'cw-pdf-lightbox-modal';
    modal.style.cssText = `
      width: 90vw;
      height: 90vh;
      max-width: 1200px;
      background: #fff;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;

    // Create toolbar
    const toolbar = this.createToolbar(pdfUrl);
    modal.appendChild(toolbar);

    // Create PDF viewer area
    const viewerArea = document.createElement('div');
    viewerArea.className = 'cw-pdf-viewer-area';
    viewerArea.style.cssText = `
      flex: 1;
      position: relative;
      background: #525659;
    `;

    // Create iframe for PDF
    const iframe = document.createElement('iframe');
    iframe.className = 'cw-pdf-iframe';
    iframe.src = pdfUrl;
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
    `;
    iframe.setAttribute('title', 'PDF Viewer');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');

    // Fallback: if iframe fails to load, show fallback UI
    const fallbackTimeout = setTimeout(() => {
      this.showFallback(viewerArea, pdfUrl);
    }, 8000);

    iframe.addEventListener('load', () => {
      clearTimeout(fallbackTimeout);
    });

    iframe.addEventListener('error', () => {
      clearTimeout(fallbackTimeout);
      this.showFallback(viewerArea, pdfUrl);
    });

    viewerArea.appendChild(iframe);
    modal.appendChild(viewerArea);
    overlay.appendChild(modal);

    // Inject animation keyframes if not already present
    this.injectStyles();

    // Add to DOM
    document.body.appendChild(overlay);
    this.overlay = overlay;

    // ESC key handler
    this.escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escHandler);
  }

  /**
   * Creates the toolbar with title, action buttons, and close button
   */
  private createToolbar(pdfUrl: string): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'cw-pdf-toolbar';
    toolbar.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      min-height: 48px;
    `;

    // Left: filename
    const title = document.createElement('span');
    title.className = 'cw-pdf-title';
    title.textContent = getFilenameFromUrl(pdfUrl);
    title.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 50%;
    `;

    // Right: action buttons
    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    // Open in new tab button
    const openBtn = document.createElement('a');
    openBtn.href = pdfUrl;
    openBtn.target = '_blank';
    openBtn.rel = 'noopener noreferrer';
    openBtn.textContent = 'Open in new tab';
    openBtn.style.cssText = `
      font-size: 13px;
      color: #0066cc;
      text-decoration: none;
      padding: 6px 12px;
      border-radius: 4px;
      background: #e8f0fe;
      cursor: pointer;
    `;

    // Download button
    const downloadBtn = document.createElement('a');
    downloadBtn.href = pdfUrl;
    downloadBtn.download = getFilenameFromUrl(pdfUrl);
    downloadBtn.textContent = 'Download';
    downloadBtn.style.cssText = `
      font-size: 13px;
      color: #333;
      text-decoration: none;
      padding: 6px 12px;
      border-radius: 4px;
      background: #eee;
      cursor: pointer;
    `;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close PDF viewer');
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    `;
    closeBtn.addEventListener('click', () => this.close());

    actions.appendChild(openBtn);
    actions.appendChild(downloadBtn);
    actions.appendChild(closeBtn);

    toolbar.appendChild(title);
    toolbar.appendChild(actions);

    return toolbar;
  }

  /**
   * Shows a fallback UI when iframe PDF rendering fails
   */
  private showFallback(container: HTMLElement, pdfUrl: string): void {
    // Don't show fallback if there's no iframe (already closed)
    const iframe = container.querySelector('iframe');
    if (iframe) {
      iframe.style.display = 'none';
    }

    const fallback = document.createElement('div');
    fallback.className = 'cw-pdf-fallback';
    fallback.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #fff;
      text-align: center;
      padding: 32px;
    `;

    fallback.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">&#128196;</div>
      <div style="font-size: 16px; margin-bottom: 8px;">Unable to display PDF inline</div>
      <div style="font-size: 14px; color: #ccc; margin-bottom: 24px;">Your browser may not support inline PDF viewing, or the file may be restricted.</div>
      <div style="display: flex; gap: 12px;">
        <a href="${this.escapeAttr(pdfUrl)}" target="_blank" rel="noopener noreferrer"
           style="padding: 10px 20px; background: #0066cc; color: #fff; border-radius: 6px; text-decoration: none; font-size: 14px;">
          Open in new tab
        </a>
        <a href="${this.escapeAttr(pdfUrl)}" download
           style="padding: 10px 20px; background: #555; color: #fff; border-radius: 6px; text-decoration: none; font-size: 14px;">
          Download
        </a>
      </div>
    `;

    container.appendChild(fallback);
  }

  /**
   * Escapes a string for use in an HTML attribute
   */
  private escapeAttr(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Injects CSS animation keyframes (once)
   */
  private injectStyles(): void {
    if (document.getElementById('cw-pdf-lightbox-styles')) return;

    const style = document.createElement('style');
    style.id = 'cw-pdf-lightbox-styles';
    style.textContent = `
      @keyframes cw-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Closes the lightbox and removes it from the DOM
   */
  close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }

    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
      this.escHandler = null;
    }
  }

  /**
   * Full cleanup - close and remove injected styles
   */
  destroy(): void {
    this.close();
    const styleEl = document.getElementById('cw-pdf-lightbox-styles');
    if (styleEl) styleEl.remove();
  }
}
