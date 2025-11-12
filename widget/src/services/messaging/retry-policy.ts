/**
 * Retry Policy
 *
 * Purpose: Manages retry logic for network requests with exponential backoff
 *
 * Responsibility:
 * - Determines if network errors should be retried
 * - Calculates exponential backoff delays with jitter
 * - Enforces max retry attempts limit
 * - Supports reset for new request cycles
 *
 * Assumptions:
 * - Retryable errors: network, timeout, 5xx HTTP errors
 * - Non-retryable errors: 4xx (except 429), CORS, parse errors
 * - Exponential backoff formula: baseDelay * (2 ^ attempt)
 * - Jitter helps prevent thundering herd problem
 */

import { NetworkError } from '../../utils/network-error-handler';

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (total attempts = initial + retries) */
  maxAttempts: number;
  /** Base delay in milliseconds for exponential backoff */
  baseDelayMs: number;
  /** Maximum delay in milliseconds (cap for exponential backoff) */
  maxDelayMs: number;
  /** Jitter percentage to add randomness (0-100) */
  jitterPercent: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3, // Initial attempt + 2 retries
  baseDelayMs: 1000, // 1 second base delay
  maxDelayMs: 10000, // 10 seconds max delay
  jitterPercent: 25, // ±25% jitter
};

/**
 * RetryPolicy class
 *
 * Manages retry logic with exponential backoff and jitter for network requests.
 */
export class RetryPolicy {
  private config: RetryConfig;

  /**
   * Creates a new RetryPolicy instance
   *
   * @param config - Partial retry configuration (merged with defaults)
   */
  constructor(config?: Partial<RetryConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Determines if a request should be retried based on attempt count and error type
   *
   * @param attempt - The current attempt number (0-indexed: 0 = first retry)
   * @param error - The NetworkError to evaluate
   * @returns true if the request should be retried, false otherwise
   *
   * @example
   * const policy = new RetryPolicy();
   * const error = classifyError(fetchError);
   * if (policy.shouldRetry(0, error)) {
   *   // Retry the request
   * }
   */
  shouldRetry(attempt: number, error: NetworkError): boolean {
    // Check if max attempts reached
    if (attempt >= this.config.maxAttempts - 1) {
      return false;
    }

    // Check if error is retryable
    return error.retryable;
  }

  /**
   * Calculates the delay before the next retry using exponential backoff with jitter
   *
   * Formula:
   * - Base delay: baseDelayMs * (2 ^ attempt)
   * - Cap at maxDelayMs
   * - Apply jitter: delay ± (jitterPercent * delay)
   *
   * @param attempt - The current attempt number (0-indexed)
   * @returns Delay in milliseconds before next retry
   *
   * @example
   * const policy = new RetryPolicy();
   * const delay = policy.getRetryDelay(0);
   * await new Promise(resolve => setTimeout(resolve, delay));
   * // Retry the request
   */
  getRetryDelay(attempt: number): number {
    // Calculate base delay with exponential backoff: baseDelay * (2 ^ attempt)
    const exponentialDelay = this.config.baseDelayMs * Math.pow(2, attempt);

    // Cap at maxDelayMs
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelayMs);

    // Apply jitter: ± jitterPercent
    const jitterFraction = this.config.jitterPercent / 100;
    const jitterAmount = cappedDelay * jitterFraction;
    const randomJitter = (Math.random() * 2 - 1) * jitterAmount; // Random value between -jitterAmount and +jitterAmount

    // Calculate final delay with jitter
    const delayWithJitter = cappedDelay + randomJitter;

    // Ensure delay is non-negative and within bounds
    return Math.max(0, Math.min(delayWithJitter, this.config.maxDelayMs));
  }

  /**
   * Resets the retry policy state for a new request cycle
   *
   * Note: This implementation is stateless, so reset() is a no-op.
   * Included for API completeness and future enhancements.
   *
   * Side effects: None
   */
  reset(): void {
    // Stateless implementation - no state to reset
    // This method is provided for API consistency and future extensibility
  }
}
