/**
 * Password Utilities
 *
 * Purpose: Secure password hashing and verification using bcrypt
 * Responsibility: Hash passwords for storage and verify passwords during login
 *
 * Security Notes:
 * - Uses bcrypt with salt rounds of 12 (good balance of security and performance)
 * - Never store plain text passwords
 * - Never log passwords or hashes
 */

import bcrypt from 'bcryptjs';

/**
 * Salt rounds for bcrypt
 * Higher = more secure but slower
 * 12 is a good balance (recommended by OWASP)
 */
const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 *
 * @param password - Plain text password to hash
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against a hash
 *
 * @param password - Plain text password to verify
 * @param hash - Stored password hash to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const isValid = await bcrypt.compare(password, hash);
    return isValid;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Validate password strength
 * Returns error message if invalid, null if valid
 *
 * Requirements:
 * - At least 8 characters
 * - At least one number
 * - At least one special character (optional, can be enforced)
 */
export function validatePasswordStrength(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number';
  }

  // Optional: Check for special character
  // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  //   return 'Password must contain at least one special character';
  // }

  return null; // Valid
}
