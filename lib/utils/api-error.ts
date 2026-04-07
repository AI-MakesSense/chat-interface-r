/**
 * API Error Handling Utilities
 *
 * Purpose: Standardized error responses for API routes
 * Responsibility: Convert errors to consistent JSON responses
 */

import { ZodError } from 'zod';

/**
 * Standard API error response format
 */
export interface APIErrorResponse {
  error: string;
  details?: any;
}

/**
 * Handle API errors and convert to Response
 *
 * @param error - Error object (any type)
 * @returns Next.js Response object with appropriate status code
 */
export function handleAPIError(error: unknown): Response {
  console.error('API Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return Response.json(
      {
        error: 'Validation failed',
        details: error.issues,
      } as APIErrorResponse,
      { status: 400 }
    );
  }

  // Known errors with messages
  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return Response.json(
        { error: error.message } as APIErrorResponse,
        { status: 401 }
      );
    }

    if (error.message === 'Forbidden') {
      return Response.json(
        { error: error.message } as APIErrorResponse,
        { status: 403 }
      );
    }

    // Generic error with message
    return Response.json(
      { error: error.message } as APIErrorResponse,
      { status: 400 }
    );
  }

  // Unknown error type
  return Response.json(
    { error: 'Internal server error' } as APIErrorResponse,
    { status: 500 }
  );
}

/**
 * Create a success response with data
 */
export function successResponse<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

/**
 * Create an error response
 */
export function errorResponse(message: string, status = 400): Response {
  return Response.json(
    { error: message } as APIErrorResponse,
    { status }
  );
}
