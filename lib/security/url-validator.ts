/**
 * URL Validator - SSRF Protection
 *
 * Purpose: Validate URLs to prevent Server-Side Request Forgery (SSRF) attacks
 * This module blocks requests to internal/private networks, localhost, and cloud metadata endpoints.
 */

import { URL } from 'url';

/**
 * List of blocked hostnames that should never be accessed
 */
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
  // AWS metadata endpoints
  '169.254.169.254',
  'metadata.google.internal',
  'metadata.gcp.internal',
  // Azure metadata
  '169.254.169.254',
  // Common internal hostnames
  'internal',
  'intranet',
  'corp',
  'private',
]);

/**
 * IPv4 private ranges that should be blocked
 * Format: [prefix, description]
 */
const BLOCKED_IPV4_RANGES: Array<{ prefix: string; description: string }> = [
  { prefix: '10.', description: 'Private Class A' },
  { prefix: '172.16.', description: 'Private Class B' },
  { prefix: '172.17.', description: 'Private Class B' },
  { prefix: '172.18.', description: 'Private Class B' },
  { prefix: '172.19.', description: 'Private Class B' },
  { prefix: '172.20.', description: 'Private Class B' },
  { prefix: '172.21.', description: 'Private Class B' },
  { prefix: '172.22.', description: 'Private Class B' },
  { prefix: '172.23.', description: 'Private Class B' },
  { prefix: '172.24.', description: 'Private Class B' },
  { prefix: '172.25.', description: 'Private Class B' },
  { prefix: '172.26.', description: 'Private Class B' },
  { prefix: '172.27.', description: 'Private Class B' },
  { prefix: '172.28.', description: 'Private Class B' },
  { prefix: '172.29.', description: 'Private Class B' },
  { prefix: '172.30.', description: 'Private Class B' },
  { prefix: '172.31.', description: 'Private Class B' },
  { prefix: '192.168.', description: 'Private Class C' },
  { prefix: '169.254.', description: 'Link-local / Cloud metadata' },
  { prefix: '127.', description: 'Loopback' },
  { prefix: '0.', description: 'Current network' },
];

/**
 * Result of URL validation
 */
export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  url?: URL;
}

/**
 * Check if a hostname is an IPv4 address
 */
function isIPv4(hostname: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  return ipv4Regex.test(hostname);
}

/**
 * Check if a hostname is an IPv6 address
 */
function isIPv6(hostname: string): boolean {
  // Remove brackets if present
  const cleaned = hostname.replace(/^\[|\]$/g, '');
  // Simple IPv6 check (contains colons)
  return cleaned.includes(':');
}

/**
 * Check if an IPv4 address is in a private/blocked range
 */
function isPrivateIPv4(ip: string): boolean {
  return BLOCKED_IPV4_RANGES.some(range => ip.startsWith(range.prefix));
}

/**
 * Check if an IPv6 address is private/local
 */
function isPrivateIPv6(ip: string): boolean {
  const cleaned = ip.replace(/^\[|\]$/g, '').toLowerCase();

  // Loopback
  if (cleaned === '::1') return true;

  // Link-local (fe80::/10)
  if (cleaned.startsWith('fe80:')) return true;

  // Unique local (fc00::/7)
  if (cleaned.startsWith('fc') || cleaned.startsWith('fd')) return true;

  // Site-local (deprecated but still block)
  if (cleaned.startsWith('fec') || cleaned.startsWith('fed') ||
      cleaned.startsWith('fee') || cleaned.startsWith('fef')) return true;

  return false;
}

/**
 * Validate a webhook URL for SSRF protection
 *
 * @param webhookUrl - The URL to validate
 * @param options - Validation options
 * @returns Validation result with error message if invalid
 */
export function validateWebhookUrl(
  webhookUrl: string,
  options: {
    allowHttp?: boolean;        // Allow http:// (default: only in development)
    allowLocalhost?: boolean;   // Allow localhost (default: only in development)
  } = {}
): UrlValidationResult {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const allowHttp = options.allowHttp ?? isDevelopment;
  const allowLocalhost = options.allowLocalhost ?? isDevelopment;

  // 1. Basic URL validation
  if (!webhookUrl || typeof webhookUrl !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmedUrl = webhookUrl.trim();
  if (!trimmedUrl) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  // 2. Parse URL
  let url: URL;
  try {
    url = new URL(trimmedUrl);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // 3. Protocol validation
  const protocol = url.protocol.toLowerCase();
  if (protocol === 'http:' && !allowHttp) {
    return { valid: false, error: 'HTTPS is required for webhook URLs' };
  }

  if (protocol !== 'http:' && protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP/HTTPS protocols are allowed' };
  }

  // 4. Get hostname (lowercase for comparison)
  const hostname = url.hostname.toLowerCase();

  // 5. Check blocked hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (!allowLocalhost) {
        return { valid: false, error: 'Localhost URLs are not allowed in production' };
      }
      // Localhost allowed in development - skip remaining checks
      return { valid: true, url };
    }
    return { valid: false, error: 'This hostname is not allowed' };
  }

  // 6. Check if hostname looks like it might be internal
  const suspiciousPatterns = [
    /^internal\./i,
    /\.internal$/i,
    /^intranet\./i,
    /\.intranet$/i,
    /^corp\./i,
    /\.corp$/i,
    /^private\./i,
    /\.private$/i,
    /\.local$/i,
    /^localhost\./i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(hostname)) {
      return { valid: false, error: 'Internal network hostnames are not allowed' };
    }
  }

  // 7. Check IPv4 addresses
  if (isIPv4(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return { valid: false, error: 'Private IP addresses are not allowed' };
    }
  }

  // 8. Check IPv6 addresses
  if (isIPv6(hostname)) {
    if (isPrivateIPv6(hostname)) {
      return { valid: false, error: 'Private IPv6 addresses are not allowed' };
    }
  }

  // 9. Port restrictions (optional - block commonly abused ports)
  const port = url.port;
  const blockedPorts = new Set(['22', '23', '25', '3306', '5432', '6379', '27017']);
  if (port && blockedPorts.has(port)) {
    return { valid: false, error: 'This port is not allowed for webhook URLs' };
  }

  // All checks passed
  return { valid: true, url };
}

/**
 * Quick check if a URL is safe (returns boolean)
 */
export function isUrlSafe(url: string, options?: Parameters<typeof validateWebhookUrl>[1]): boolean {
  return validateWebhookUrl(url, options).valid;
}

/**
 * Log a blocked URL attempt (for security monitoring)
 */
export function logBlockedUrlAttempt(
  url: string,
  reason: string,
  context: Record<string, unknown>
): void {
  console.warn('[SSRF Protection] Blocked URL attempt:', {
    timestamp: new Date().toISOString(),
    reason,
    // Don't log the full URL in production (could contain sensitive info in query params)
    urlHost: (() => {
      try {
        return new URL(url).hostname;
      } catch {
        return 'invalid-url';
      }
    })(),
    ...context,
  });
}
