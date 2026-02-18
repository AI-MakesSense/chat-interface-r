/**
 * Link Detector
 *
 * Purpose: Detect PDF URLs in rendered message content
 * Responsibility: URL pattern matching and DOM querying for PDF links
 */

/**
 * Checks if a URL points to a PDF file
 *
 * @param url - URL string to check
 * @returns true if the URL appears to be a PDF
 */
export function isPdfUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url, 'https://placeholder.com');
    const pathname = parsed.pathname.toLowerCase();

    // Check file extension
    if (pathname.endsWith('.pdf')) return true;

    // Check if URL path contains .pdf before query params
    if (/\.pdf$/i.test(pathname)) return true;

    return false;
  } catch {
    // If URL parsing fails, do simple string check
    return /\.pdf(\?|#|$)/i.test(url);
  }
}

/**
 * Finds all anchor elements in a container that link to PDFs
 *
 * @param container - DOM element to search within
 * @returns Array of anchor elements linking to PDFs
 */
export function findPdfLinks(container: HTMLElement): HTMLAnchorElement[] {
  const links = container.querySelectorAll('a[href]');
  const pdfLinks: HTMLAnchorElement[] = [];

  links.forEach((link) => {
    const anchor = link as HTMLAnchorElement;
    if (isPdfUrl(anchor.href)) {
      pdfLinks.push(anchor);
    }
  });

  return pdfLinks;
}
