/**
 * License Key Generation Module
 *
 * Purpose: Generate cryptographically secure, unique license keys for the application.
 *
 * Responsibility: Provide a single function that generates 32-character hexadecimal
 * license keys using Node.js crypto module for security.
 *
 * Assumptions:
 * - Node.js crypto module is available (Node.js 16+)
 * - 16 bytes of randomness provides sufficient entropy for uniqueness
 * - Lowercase hexadecimal format is acceptable for license keys
 */

import * as crypto from 'crypto';

/**
 * Generate a cryptographically secure license key.
 *
 * This function creates a 32-character hexadecimal string using Node.js's
 * crypto.randomBytes for cryptographic security. Each call generates a unique
 * key with 128 bits of entropy (16 bytes).
 *
 * @returns {string} A 32-character lowercase hexadecimal string
 *
 * @example
 * ```typescript
 * const licenseKey = generateLicenseKey();
 * // Returns: "a1b2c3d4e5f67890abcdef1234567890"
 * ```
 *
 * Security: Uses crypto.randomBytes which provides cryptographically strong
 * pseudo-random data, suitable for generating license keys, tokens, and secrets.
 */
export function generateLicenseKey(): string {
  // Generate 16 random bytes (128 bits of entropy)
  const bytes = crypto.randomBytes(16);

  // Convert to lowercase hexadecimal string (32 characters)
  return bytes.toString('hex');
}

/**
 * Generate a cryptographically secure widget key.
 *
 * This function creates a 16-character alphanumeric string using Node.js's
 * crypto.randomBytes for cryptographic security. Each call generates a unique
 * key with ~95 bits of entropy (16 characters from 62-character alphabet).
 *
 * Widget keys are used in embed URLs as a safer alternative to license keys:
 * - Shorter and more user-friendly in URLs
 * - Scoped to a single widget (not all widgets under a license)
 * - Can be rotated without affecting other widgets
 *
 * @returns {string} A 16-character alphanumeric string
 *
 * @example
 * ```typescript
 * const widgetKey = generateWidgetKey();
 * // Returns: "aB3cD4eF5gH6iJ7k"
 * ```
 */
export function generateWidgetKey(): string {
  // Use alphanumeric characters (62 chars total)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  // Generate 16 random bytes
  const bytes = crypto.randomBytes(16);

  // Convert each byte to a character from our alphabet
  let result = '';
  for (let i = 0; i < 16; i++) {
    // Use modulo to map byte value to alphabet index
    result += alphabet[bytes[i] % alphabet.length];
  }

  return result;
}
