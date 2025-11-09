/**
 * License API Routes
 *
 * POST /api/licenses - Create a new license
 * GET /api/licenses - List user's licenses
 *
 * Purpose: License management endpoints for authenticated users
 * Responsibilities: Create licenses with tier-specific settings, list user's licenses
 * Assumptions: requireAuth middleware handles authentication, schemas validate input
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createLicenseSchema } from '@/lib/api/schemas';
import { generateLicenseKey } from '@/lib/license/generate';
import { normalizeDomain } from '@/lib/license/domain';
import { db } from '@/lib/db/client';
import { licenses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { handleAPIError, successResponse } from '@/lib/utils/api-error';

/**
 * POST /api/licenses
 * Create a new license for authenticated user
 *
 * Body: { tier, domains, expiresInDays? }
 * Returns: { license: {...} }
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request) as any;
    const userId = user.userId || user.sub; // Support both test mock and real JWT

    // Parse and validate request body
    const body = await request.json();
    const parsed = createLicenseSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { tier, domains, expiresInDays = 365 } = parsed.data;

    // Generate unique license key
    const licenseKey = generateLicenseKey();

    // Normalize all domains
    const normalizedDomains = domains.map((domain) => normalizeDomain(domain));

    // Calculate expiration date
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    // Set tier-specific properties
    let domainLimit: number;
    let brandingEnabled: boolean;

    if (tier === 'basic') {
      domainLimit = 1;
      brandingEnabled = true;
    } else if (tier === 'pro') {
      domainLimit = 1;
      brandingEnabled = false;
    } else {
      // agency
      domainLimit = -1; // unlimited
      brandingEnabled = false;
    }

    // Insert into database
    const [license] = await db
      .insert(licenses)
      .values({
        userId,
        licenseKey,
        tier,
        domains: normalizedDomains,
        domainLimit,
        brandingEnabled,
        status: 'active',
        expiresAt,
      })
      .returning();

    return successResponse({ license }, 201);
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * GET /api/licenses
 * List all licenses for authenticated user
 *
 * Returns: { licenses: [...] }
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request) as any;
    const userId = user.userId || user.sub; // Support both test mock and real JWT

    // Query licenses for authenticated user
    const userLicenses = await db
      .select()
      .from(licenses)
      .where(eq(licenses.userId, userId));

    return successResponse({ licenses: userLicenses }, 200);
  } catch (error) {
    return handleAPIError(error);
  }
}
