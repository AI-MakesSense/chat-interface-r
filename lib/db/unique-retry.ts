/**
 * Retry helper for operations that may fail on a unique-constraint collision
 * (e.g. generating a random unique key and inserting it).
 *
 * Non-unique errors are rethrown immediately; unique violations are retried
 * up to maxAttempts total attempts.
 */

/**
 * Returns true if the error looks like a Postgres unique-constraint violation.
 * Matches on message text and the Postgres error code 23505.
 */
export function isUniqueViolation(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes('unique') ||
    msg.includes('duplicate') ||
    msg.includes('23505')
  );
}

/**
 * Run `fn`, retrying only on unique-constraint violations.
 *
 * @param fn          The operation to run (should generate a fresh value each attempt)
 * @param maxAttempts Total attempts allowed (default 4 = 1 try + 3 retries)
 */
export async function withUniqueRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 4
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (!isUniqueViolation(e) || attempt >= maxAttempts) throw e;
      // unique collision — loop and try again with a fresh value
    }
  }
}
