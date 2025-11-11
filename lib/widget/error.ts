/**
 * Widget Error Utilities
 *
 * Purpose: Generate JavaScript error scripts and log widget serving errors
 * Responsibility: Error handling and client-side error reporting
 * Assumptions: Error scripts must be valid JavaScript and not expose sensitive data
 */

/**
 * Error types for widget serving failures
 */
export type ErrorType =
  | 'LICENSE_INVALID'
  | 'LICENSE_EXPIRED'
  | 'DOMAIN_UNAUTHORIZED'
  | 'LICENSE_CANCELLED'
  | 'REFERER_MISSING'
  | 'INTERNAL_ERROR';

/**
 * Error messages for each error type (generic, no sensitive data)
 */
const ERROR_MESSAGES: Record<ErrorType, string> = {
  LICENSE_INVALID: 'Invalid license',
  LICENSE_EXPIRED: 'License has expired',
  DOMAIN_UNAUTHORIZED: 'Domain not authorized for this license',
  LICENSE_CANCELLED: 'License has been cancelled',
  REFERER_MISSING: 'Missing referer header',
  INTERNAL_ERROR: 'Internal server error'
};

/**
 * Create a JavaScript error script to send to the client
 *
 * @param errorType - The type of error that occurred
 * @returns JavaScript code that logs error and sets window flag
 *
 * The script will:
 * - Log error to console.error with [ChatWidget] prefix
 * - Set window.__CHAT_WIDGET_ERROR__ to the error type
 * - Not expose any sensitive data (keys, secrets, etc.)
 */
export function createErrorScript(errorType: ErrorType): string {
  const message = ERROR_MESSAGES[errorType];

  // Return an IIFE that logs error and sets window flag
  return `(function() {
  console.error('[ChatWidget] Failed to load: ${message}');
  window.__CHAT_WIDGET_ERROR__ = '${errorType}';
})();`;
}

/**
 * Log widget error with context information
 *
 * @param errorType - The type of error that occurred
 * @param context - Additional context about the error (domain, IP, etc.)
 *
 * Logs to console.error with:
 * - Timestamp
 * - Error type
 * - Context object
 */
export function logWidgetError(errorType: ErrorType, context?: Record<string, any>): void {
  const timestamp = new Date().toISOString();

  console.error('[Widget Error]', {
    timestamp,
    errorType,
    context: context || {}
  });
}