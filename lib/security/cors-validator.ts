/**
 * CORS Validator - Domain Authorization for Cross-Origin Requests
 *
 * Purpose: Validate CORS Origin header against license's authorized domains
 * This ensures only authorized domains can make requests to protected endpoints.
 */

import { normalizeDomain } from '@/lib/license/domain';

/**
 * Result of CORS validation
 */
export interface CorsValidationResult {
  allowed: boolean;
  origin?: string;  // The origin to use in Access-Control-Allow-Origin header
  error?: string;
}

/**
 * Check if an origin is allowed based on the license's authorized domains
 *
 * @param origin - The Origin header from the request
 * @param authorizedDomains - Array of domains authorized for this license
 * @param options - Validation options
 * @returns Validation result with the origin to use in CORS headers
 */
export function validateCorsOrigin(
  origin: string | null,
  authorizedDomains: string[],
  options: {
    allowNoOrigin?: boolean;      // Allow requests without Origin header (default: true for non-browser clients)
    allowLocalhost?: boolean;     // Allow localhost in development (default: based on NODE_ENV)
    isAgencyTier?: boolean;       // Agency tier allows any domain
  } = {}
): CorsValidationResult {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const allowNoOrigin = options.allowNoOrigin ?? true;
  const allowLocalhost = options.allowLocalhost ?? isDevelopment;
  const isAgencyTier = options.isAgencyTier ?? false;

  // 1. Handle missing Origin header
  // Requests without Origin (like direct curl requests) may be allowed
  if (!origin) {
    if (allowNoOrigin) {
      return { allowed: true };
    }
    return { allowed: false, error: 'Origin header is required' };
  }

  // 2. Parse the origin URL to extract hostname
  let originHostname: string;
  try {
    const url = new URL(origin);
    originHostname = url.hostname.toLowerCase();
  } catch {
    return { allowed: false, error: 'Invalid Origin header format' };
  }

  // 3. Agency tier bypass - allow any origin
  if (isAgencyTier) {
    return { allowed: true, origin };
  }

  // 4. Localhost handling
  if (originHostname === 'localhost' || originHostname === '127.0.0.1') {
    if (allowLocalhost) {
      return { allowed: true, origin };
    }
    return { allowed: false, error: 'Localhost is not allowed in production' };
  }

  // 5. Check against authorized domains
  if (!authorizedDomains || authorizedDomains.length === 0) {
    // No domains configured - deny by default in production
    if (!isDevelopment) {
      return { allowed: false, error: 'No authorized domains configured' };
    }
    // In development, allow all if no domains configured
    return { allowed: true, origin };
  }

  // Normalize the origin hostname
  const normalizedOrigin = normalizeDomain(originHostname);

  // Check for exact match or subdomain match
  const isAuthorized = authorizedDomains.some(authorizedDomain => {
    const normalizedAuthorized = normalizeDomain(authorizedDomain);

    // Exact match
    if (normalizedOrigin === normalizedAuthorized) {
      return true;
    }

    // Subdomain match (e.g., api.example.com matches example.com)
    if (normalizedOrigin.endsWith('.' + normalizedAuthorized)) {
      return true;
    }

    return false;
  });

  if (isAuthorized) {
    return { allowed: true, origin };
  }

  return {
    allowed: false,
    error: `Origin ${originHostname} is not authorized for this license`
  };
}

/**
 * Build CORS headers based on validation result
 *
 * @param validationResult - Result from validateCorsOrigin
 * @param options - Additional CORS options
 * @returns CORS headers to include in the response
 */
export function buildCorsHeaders(
  validationResult: CorsValidationResult,
  options: {
    allowMethods?: string[];
    allowHeaders?: string[];
    exposeHeaders?: string[];
    maxAge?: number;
    allowCredentials?: boolean;
  } = {}
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Only set CORS headers if origin is allowed
  if (!validationResult.allowed || !validationResult.origin) {
    // Return empty headers - browser will block the request
    return headers;
  }

  // Set specific origin (not wildcard) for better security
  headers['Access-Control-Allow-Origin'] = validationResult.origin;

  // Allow methods
  const methods = options.allowMethods ?? ['GET', 'POST', 'OPTIONS'];
  headers['Access-Control-Allow-Methods'] = methods.join(', ');

  // Allow headers
  const allowHeaders = options.allowHeaders ?? ['Content-Type'];
  headers['Access-Control-Allow-Headers'] = allowHeaders.join(', ');

  // Expose headers (if any)
  if (options.exposeHeaders && options.exposeHeaders.length > 0) {
    headers['Access-Control-Expose-Headers'] = options.exposeHeaders.join(', ');
  }

  // Max age for preflight caching
  if (options.maxAge !== undefined) {
    headers['Access-Control-Max-Age'] = String(options.maxAge);
  }

  // Credentials (cookies, authorization headers)
  if (options.allowCredentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  // Vary header to indicate response varies by origin
  headers['Vary'] = 'Origin';

  return headers;
}

/**
 * Quick helper to get CORS headers for a request
 *
 * @param origin - The Origin header from the request
 * @param authorizedDomains - Array of domains authorized for this license
 * @param options - Combined validation and header options
 * @returns CORS headers to include in the response
 */
export function getCorsHeaders(
  origin: string | null,
  authorizedDomains: string[],
  options: {
    allowNoOrigin?: boolean;
    allowLocalhost?: boolean;
    isAgencyTier?: boolean;
    allowMethods?: string[];
    allowHeaders?: string[];
  } = {}
): Record<string, string> {
  const validationResult = validateCorsOrigin(origin, authorizedDomains, options);
  return buildCorsHeaders(validationResult, options);
}

/**
 * Log a blocked CORS attempt (for security monitoring)
 */
export function logBlockedCorsAttempt(
  origin: string | null,
  reason: string,
  context: Record<string, unknown>
): void {
  console.warn('[CORS Protection] Blocked request:', {
    timestamp: new Date().toISOString(),
    origin: origin || 'no-origin',
    reason,
    ...context,
  });
}
