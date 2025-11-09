/**
 * Domain normalization and validation utilities for license management.
 * Ensures consistent domain formatting and validates domain structure.
 */

/**
 * Normalizes a domain string by removing protocol, www prefix, port, path, and converting to lowercase.
 * @param domain - The domain string to normalize
 * @returns The normalized domain string
 */
export function normalizeDomain(domain: string): string {
  // Step 1: Trim whitespace
  let normalized = domain.trim();

  // Step 2: Return empty string for empty/whitespace-only input
  if (!normalized) {
    return '';
  }

  // Step 3: Convert to lowercase first for case-insensitive operations
  normalized = normalized.toLowerCase();

  // Step 4: Remove protocol (http://, https://)
  normalized = normalized.replace(/^https?:\/\//i, '');

  // Step 5: Remove www. prefix (but preserve other subdomains)
  // Only remove www. if it's at the start (after protocol removal)
  normalized = normalized.replace(/^www\./i, '');

  // Step 6: Remove port numbers
  // Match port at the end of domain or before path
  normalized = normalized.replace(/:\d+/, '');

  // Step 7: Remove paths, query strings, and hash fragments
  // Everything after and including the first /
  const slashIndex = normalized.indexOf('/');
  if (slashIndex !== -1) {
    normalized = normalized.substring(0, slashIndex);
  }

  // Final trim in case any operations introduced whitespace
  normalized = normalized.trim();

  return normalized;
}

/**
 * Validates if a domain string is a valid domain name.
 * @param domain - The domain string to validate
 * @returns True if the domain is valid, false otherwise
 */
export function isValidDomain(domain: string): boolean {
  // Check for empty or whitespace-only
  if (!domain || !domain.trim()) {
    return false;
  }

  const trimmed = domain.trim();

  // Must contain at least one dot (TLD required)
  if (!trimmed.includes('.')) {
    return false;
  }

  // Cannot start or end with dot
  if (trimmed.startsWith('.') || trimmed.endsWith('.')) {
    return false;
  }

  // Cannot have consecutive dots
  if (trimmed.includes('..')) {
    return false;
  }

  // Special case: reject localhost
  if (trimmed === 'localhost') {
    return false;
  }

  // Special case: reject IP addresses (simple check for 4 numeric segments)
  const parts = trimmed.split('.');
  if (parts.length === 4 && parts.every(part => /^\d+$/.test(part))) {
    // It looks like an IP address
    return false;
  }

  // Check total domain length (1-253 characters)
  if (trimmed.length < 1 || trimmed.length > 253) {
    return false;
  }

  // Split into labels (parts between dots)
  const labels = trimmed.split('.');

  // Check each label
  for (const label of labels) {
    // Label cannot be empty (would mean consecutive dots, but double-check)
    if (!label) {
      return false;
    }

    // Label length must be 1-63 characters
    if (label.length < 1 || label.length > 63) {
      return false;
    }

    // Label cannot start or end with hyphen
    if (label.startsWith('-') || label.endsWith('-')) {
      return false;
    }

    // Label can only contain letters, digits, and hyphens
    // Use regex to validate allowed characters
    if (!/^[a-z0-9-]+$/i.test(label)) {
      return false;
    }
  }

  return true;
}