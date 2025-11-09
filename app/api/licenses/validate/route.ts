/**
 * License Validation API Route
 *
 * POST /api/licenses/validate
 *
 * Purpose: Public endpoint to validate license keys for widget embedding
 * Responsibilities: Validate license format, check against database, verify domain authorization
 * Assumptions: No authentication required (public endpoint), validateLicense handles all validation logic
 */

import { NextRequest } from 'next/server';
import { validateLicenseSchema } from '@/lib/api/schemas';
import { validateLicense } from '@/lib/license/validate';
import { handleAPIError, successResponse } from '@/lib/utils/api-error';

/**
 * POST /api/licenses/validate
 * Validate a license key for a specific domain
 *
 * Body: { licenseKey, domain }
 * Returns: { valid: boolean, license?: {...}, reason?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const parsed = validateLicenseSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { licenseKey, domain } = parsed.data;

    // Validate license against database
    const result = await validateLicense(licenseKey, domain);

    return successResponse(result, 200);
  } catch (error) {
    return handleAPIError(error);
  }
}
