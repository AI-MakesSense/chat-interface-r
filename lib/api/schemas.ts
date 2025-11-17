/**
 * API Validation Schemas
 *
 * Purpose: Provides Zod validation schemas for API request payloads.
 * Ensures consistent input validation across all API endpoints.
 *
 * Schemas:
 * - createLicenseSchema: Validates POST /api/licenses requests
 * - validateLicenseSchema: Validates POST /api/licenses/validate requests
 * - updateLicenseSchema: Validates PATCH /api/licenses/:id requests
 *
 * Assumptions:
 * - Domain validation delegated to isValidDomain() from lib/license/domain
 * - License keys are 32-character lowercase hexadecimal strings
 * - Tier limits: basic/pro = 1 domain, agency = unlimited
 */

import { z } from 'zod';
import { isValidDomain } from '@/lib/license/domain';

/**
 * Schema for creating a new license.
 * Validates tier, domains, and optional expiration days.
 */
export const createLicenseSchema = z
  .object({
    tier: z.enum(['basic', 'pro', 'agency']),
    domains: z
      .array(z.string())
      .min(1, { message: 'At least one domain required' })
      .refine((domains) => domains.every((d) => isValidDomain(d)), {
        message: 'All domains must be valid',
      }),
    expiresInDays: z
      .number()
      .int({ message: 'expiresInDays must be an integer' })
      .positive({ message: 'expiresInDays must be positive' })
      .default(365)
      .optional(),
  })
  .refine(
    (data) => {
      // Basic and Pro tiers: max 1 domain
      if ((data.tier === 'basic' || data.tier === 'pro') && data.domains.length > 1) {
        return false;
      }
      return true;
    },
    {
      message: 'Basic and Pro tiers are limited to 1 domain',
    }
  );

/**
 * Schema for validating a license.
 * Validates license key format and domain presence.
 */
export const validateLicenseSchema = z.object({
  licenseKey: z
    .string()
    .length(32, { message: 'License key must be exactly 32 characters' })
    .regex(/^[0-9a-f]{32}$/, {
      message: 'License key must be lowercase hexadecimal',
    }),
  domain: z
    .string()
    .min(1, { message: 'Domain is required' }),
});

/**
 * Schema for updating an existing license.
 * At least one field must be provided. Validates domains, status, and expiration date.
 */
export const updateLicenseSchema = z
  .object({
    domains: z
      .array(z.string())
      .min(1, { message: 'At least one domain required' })
      .refine((domains) => domains.every((d) => isValidDomain(d)), {
        message: 'All domains must be valid',
      })
      .optional(),
    status: z
      .enum(['active', 'cancelled', 'expired'])
      .optional(),
    expiresAt: z
      .string()
      .datetime({ message: 'Must be valid ISO datetime' })
      .refine(
        (date) => new Date(date) > new Date(),
        { message: 'Expiration date must be in the future' }
      )
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });
