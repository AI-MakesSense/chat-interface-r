/**
 * Widget Headers Utilities
 *
 * Purpose: Extract domain from referer headers and create response headers for widget serving
 * Responsibility: Domain normalization and HTTP header generation
 * Assumptions: All widget requests should include a referer header
 */

/**
 * Extract and normalize domain from referer header
 *
 * @param referer - The referer header value from the HTTP request
 * @returns Normalized domain string or null if invalid
 *
 * Normalization rules:
 * - Convert to lowercase
 * - Remove 'www.' prefix
 * - Remove port numbers
 * - Preserve subdomains (except www)
 */
export function extractDomainFromReferer(referer: string): string | null {
  // Handle null, undefined, or empty values
  if (!referer) {
    return null;
  }

  try {
    // Parse the URL - will throw for invalid URLs
    const url = new URL(referer);

    // Extract hostname and normalize to lowercase
    let domain = url.hostname.toLowerCase();

    // Remove www prefix if present
    if (domain.startsWith('www.')) {
      domain = domain.slice(4);
    }

    return domain;
  } catch {
    // Return null for any URL parsing errors
    return null;
  }
}

/**
 * Create standard response headers for serving widget JavaScript
 *
 * @returns Object with HTTP headers for widget response
 *
 * Headers included:
 * - Content-Type: Identifies response as JavaScript
 * - Cache-Control: Browser and CDN caching strategy
 * - Access-Control-Allow-Origin: CORS header for cross-origin loading
 */
/**
 * Headers for the JS bundle (rarely changes)
 */
export function createResponseHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/javascript',
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400, no-transform',
    'Access-Control-Allow-Origin': '*'
  };
}

/**
 * Headers for the config endpoint (changes frequently)
 */
export function createConfigResponseHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=10, must-revalidate',
    'Access-Control-Allow-Origin': '*'
  };
}