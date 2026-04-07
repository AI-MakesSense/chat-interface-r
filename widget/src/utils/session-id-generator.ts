/**
 * Session ID Generator
 *
 * Purpose: Generate RFC 4122 compliant UUID v4 identifiers for chat sessions
 *
 * Responsibility:
 * - Generate cryptographically secure UUID v4 strings
 * - Fallback to manual generation if crypto API is unavailable
 *
 * Assumptions:
 * - Modern browsers support crypto.randomUUID()
 * - UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */

/**
 * Generates a RFC 4122 compliant UUID v4 string
 *
 * Uses the native crypto.randomUUID() API when available, otherwise falls back
 * to a manual implementation using crypto.getRandomValues().
 *
 * @returns A UUID v4 string in the format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 *
 * @example
 * const sessionId = generateSessionId();
 * // Returns: "a1b2c3d4-e5f6-4789-a012-3456789abcde"
 */
export function generateSessionId(): string {
  // Use native crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback: Manual UUID v4 generation using crypto.getRandomValues()
  // Template: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // - Version 4: 13th character is always '4'
  // - Variant bits: 17th character is one of [8, 9, a, b]

  const randomValues = new Uint8Array(16);
  crypto.getRandomValues(randomValues);

  // Set version (4) in the 7th byte
  randomValues[6] = (randomValues[6] & 0x0f) | 0x40;

  // Set variant (10xx) in the 9th byte
  randomValues[8] = (randomValues[8] & 0x3f) | 0x80;

  // Convert bytes to hex string with hyphens
  const hex = Array.from(randomValues)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}
