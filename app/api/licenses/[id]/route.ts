/**
 * License Update API Route
 *
 * PATCH /api/licenses/[id]
 *
 * Purpose: Update an existing license for authenticated user
 * Responsibilities: Verify ownership, validate updates, apply changes
 * Assumptions: requireAuth middleware handles authentication, updateLicenseSchema validates input
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { updateLicenseSchema } from '@/lib/api/schemas';
import { normalizeDomain } from '@/lib/license/domain';
import { db } from '@/lib/db/client';
import { licenses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { handleAPIError, successResponse, errorResponse } from '@/lib/utils/api-error';

/**
 * PATCH /api/licenses/[id]
 * Update a license owned by authenticated user
 *
 * Body: { domains?, status?, expiresAt? }
 * Returns: { license: {...} }
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await requireAuth(request) as any;
    const userId = user.userId || user.sub; // Support both test mock and real JWT

    // Await params to get license ID (Next.js 15 requirement)
    const { id } = await context.params;

    // Parse and validate request body
    const body = await request.json();
    const parsed = updateLicenseSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Query license by ID
    const result = await db
      .select()
      .from(licenses)
      .where(eq(licenses.id, id))
      .limit(1);

    // Check if license exists
    if (!result || result.length === 0) {
      return errorResponse('License not found', 404);
    }

    const license = result[0];

    // Check ownership
    if (license.userId !== userId) {
      return errorResponse('Forbidden', 403);
    }

    // Build update object
    const updates: any = {};

    if (parsed.data.domains !== undefined) {
      // Normalize domains
      updates.domains = parsed.data.domains.map((domain) => normalizeDomain(domain));
    }

    if (parsed.data.status !== undefined) {
      updates.status = parsed.data.status;
    }

    if (parsed.data.expiresAt !== undefined) {
      updates.expiresAt = new Date(parsed.data.expiresAt);
    }

    // Update timestamp
    updates.updatedAt = new Date();

    // Update license in database
    const [updatedLicense] = await db
      .update(licenses)
      .set(updates)
      .where(eq(licenses.id, id))
      .returning();

    return successResponse({ license: updatedLicense }, 200);
  } catch (error) {
    return handleAPIError(error);
  }
}
