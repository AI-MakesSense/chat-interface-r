/**
 * License validation module
 *
 * Purpose: Validates license keys against database and checks domain authorization
 * Responsibilities: License lookup, status validation, expiration check, domain authorization
 * Assumptions: Database connection is available, normalizeDomain handles all URL formats
 */

import { db } from '@/lib/db/client';
import { licenses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { normalizeDomain } from '@/lib/license/domain';

/**
 * Result of a license validation attempt
 */
export type ValidationResult = {
  valid: boolean;
  reason?: string;  // Only present if valid === false
  license?: {       // Only present if valid === true
    id: string;
    userId: string;
    tier: 'basic' | 'pro' | 'agency';
    expiresAt: Date;
  };
};

/**
 * Validates a license key and checks if the domain is authorized for use
 *
 * @param licenseKey - The license key to validate
 * @param domain - The domain where the widget will be used
 * @returns Promise<ValidationResult> with validation status and details
 */
export async function validateLicense(
  licenseKey: string,
  domain: string
): Promise<ValidationResult> {
  // Step 1: Query database for license
  const result = await db
    .select()
    .from(licenses)
    .where(eq(licenses.licenseKey, licenseKey));

  // Check if license exists
  if (!result || result.length === 0) {
    return {
      valid: false,
      reason: 'License not found'
    };
  }

  // Use first license if multiple exist (edge case)
  const license = result[0];

  // Step 2: Check license status
  if (license.status !== 'active') {
    return {
      valid: false,
      reason: 'License is not active'
    };
  }

  // Step 3: Check expiration
  if (license.expiresAt !== null) {
    const now = new Date();
    // Use <= to handle exact boundary case (expires at exactly now)
    if (license.expiresAt <= now) {
      return {
        valid: false,
        reason: 'License has expired'
      };
    }
  }
  // If expiresAt is null, treat as never expires (valid)

  // Step 4: Normalize domain
  const normalizedDomain = normalizeDomain(domain);

  // Check for empty normalized domain
  if (!normalizedDomain) {
    return {
      valid: false,
      reason: 'Domain not authorized'
    };
  }

  // Step 5: Check domain authorization
  // Agency tier allows ANY domain (unlimited domains)
  if (license.tier === 'agency') {
    return {
      valid: true,
      license: {
        id: license.id,
        userId: license.userId,
        tier: license.tier as 'agency',
        expiresAt: license.expiresAt ?? new Date('2099-12-31T23:59:59Z')
      }
    };
  }

  // Basic and Pro tiers: check if domain is in allowedDomains array
  // First ensure domains array exists and is not empty
  if (!license.domains || !Array.isArray(license.domains) || license.domains.length === 0) {
    return {
      valid: false,
      reason: 'Domain not authorized'
    };
  }

  // Perform case-insensitive domain comparison
  const isAuthorized = license.domains.some(allowedDomain => {
    // Normalize the allowed domain for comparison
    const normalizedAllowedDomain = normalizeDomain(allowedDomain);
    return normalizedAllowedDomain.toLowerCase() === normalizedDomain.toLowerCase();
  });

  if (!isAuthorized) {
    return {
      valid: false,
      reason: 'Domain not authorized'
    };
  }

  // Step 6: Success response
  return {
    valid: true,
    license: {
      id: license.id,
      userId: license.userId,
      tier: license.tier as 'basic' | 'pro' | 'agency',
      expiresAt: license.expiresAt ?? new Date('2099-12-31T23:59:59Z')
    }
  };
}