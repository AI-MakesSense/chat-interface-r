/**
 * Network Error Handler
 *
 * Purpose: Classify and handle network/HTTP errors with user-friendly messages
 *
 * Responsibility:
 * - Classify JavaScript/fetch errors into typed NetworkError categories
 * - Map HTTP status codes to error types
 * - Determine if errors are retryable
 * - Provide user-friendly error messages
 * - Centralize error handling logic for consistency
 *
 * Assumptions:
 * - Errors follow standard JavaScript error types (TypeError, DOMException, etc.)
 * - HTTP responses follow standard fetch API Response interface
 * - CORS errors manifest as TypeError with specific messages
 */

/**
 * Network error classification types
 */
export type NetworkErrorType =
  | 'network' // Failed to fetch / connection issues
  | 'timeout' // Request timed out
  | 'cors' // CORS policy blocked request
  | 'http' // HTTP error response (4xx, 5xx)
  | 'parse' // Failed to parse response (invalid JSON)
  | 'abort'; // Request was aborted

/**
 * Structured network error with classification and retry information
 */
export interface NetworkError {
  /** Error type classification */
  type: NetworkErrorType;
  /** Error message (technical) */
  message: string;
  /** HTTP status code (only for 'http' type) */
  statusCode?: number;
  /** Whether this error should be retried */
  retryable: boolean;
  /** Original error object for debugging */
  originalError?: Error | Response;
}

/**
 * Classifies an error into a structured NetworkError
 *
 * Handles various error types from fetch API, HTTP responses, and JavaScript errors.
 *
 * @param error - The error to classify (Error, Response, or unknown)
 * @param response - Optional Response object for additional context
 * @returns Structured NetworkError with type, message, and retry information
 *
 * @example
 * try {
 *   const response = await fetch(url);
 *   if (!response.ok) {
 *     const error = classifyError(response);
 *     // { type: 'http', statusCode: 500, retryable: true, ... }
 *   }
 * } catch (err) {
 *   const error = classifyError(err);
 *   // { type: 'network', retryable: true, ... }
 * }
 */
export function classifyError(error: unknown, response?: Response): NetworkError {
  // Handle Response objects (HTTP errors)
  if (error instanceof Response) {
    const statusCode = error.status;
    const isRetryable = statusCode >= 500 || statusCode === 429; // 5xx or rate limit

    return {
      type: 'http',
      message: `HTTP ${statusCode}: ${error.statusText}`,
      statusCode,
      retryable: isRetryable,
      originalError: error,
    };
  }

  // Handle DOMException errors (AbortError, TimeoutError)
  if (error instanceof DOMException) {
    if (error.name === 'AbortError') {
      return {
        type: 'abort',
        message: 'Request was cancelled',
        retryable: false,
        originalError: error,
      };
    }

    if (error.name === 'TimeoutError') {
      return {
        type: 'timeout',
        message: 'Request timeout',
        retryable: true,
        originalError: error,
      };
    }
  }

  // Handle SyntaxError (JSON parse failures)
  if (error instanceof SyntaxError) {
    return {
      type: 'parse',
      message: 'Failed to parse response',
      retryable: false,
      originalError: error,
    };
  }

  // Handle TypeError (network errors, CORS)
  if (error instanceof TypeError) {
    const errorMessage = error.message.toLowerCase();

    // Check for CORS-specific error messages
    if (
      errorMessage.includes('cors') ||
      errorMessage.includes('network error') ||
      errorMessage.includes('networkerror')
    ) {
      return {
        type: 'cors',
        message: 'CORS policy blocked the request',
        retryable: false,
        originalError: error,
      };
    }

    // Generic network error (failed to fetch)
    const msg = error.message || 'Failed to fetch';
    return {
      type: 'network',
      message: `network error: ${msg}`,
      retryable: true,
      originalError: error,
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    const msg = error.message || 'An error occurred';
    return {
      type: 'network',
      message: `network error: ${msg}`,
      retryable: true,
      originalError: error,
    };
  }

  // Handle unknown error types (string, null, undefined, etc.)
  return {
    type: 'network',
    message: String(error || 'Unknown error'),
    retryable: true,
  };
}

/**
 * Gets a user-friendly error message for display in the UI
 *
 * Converts technical error details into human-readable messages
 * suitable for end users.
 *
 * @param error - The NetworkError to get a message for
 * @returns User-friendly error message string
 *
 * @example
 * const error = classifyError(fetchError);
 * const message = getUserMessage(error);
 * // "Connection lost. Please check your internet."
 */
export function getUserMessage(error: NetworkError): string {
  switch (error.type) {
    case 'network':
      return 'Something went wrong. Unable to connect. Please check your internet and try again.';

    case 'timeout':
      return 'Request is taking too long. Please try again.';

    case 'cors':
      return 'Configuration error. Not accessible. Please contact support.';

    case 'http':
      if (error.statusCode && error.statusCode >= 500) {
        return 'Server error. Service temporarily unavailable. Please try again later.';
      }
      return 'Request failed. Please check your input.';

    case 'parse':
      return 'Unexpected response format.';

    case 'abort':
      return 'Request cancelled.';

    default:
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Checks if an error is retryable
 *
 * Convenience function to check the retryable flag.
 *
 * @param error - The NetworkError to check
 * @returns true if the error should be retried, false otherwise
 */
export function isRetryableError(error: NetworkError): boolean {
  return error.retryable;
}
