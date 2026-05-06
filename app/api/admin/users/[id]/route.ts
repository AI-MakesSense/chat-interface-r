import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { getUserWithDetails, adminUpdateUser, getUserWidgets, logActivity } from '@/lib/db/admin-queries';
import { handleAPIError, errorResponse } from '@/lib/utils/api-error';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const user = await getUserWithDetails(id);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    const userWidgets = await getUserWidgets(id);

    return Response.json({ user, widgets: userWidgets });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();

    const updates: { tier?: string; subscriptionStatus?: string } = {};
    if (body.tier && ['free', 'basic', 'pro', 'agency'].includes(body.tier)) {
      updates.tier = body.tier;
    }
    if (body.subscriptionStatus && ['active', 'canceled', 'past_due'].includes(body.subscriptionStatus)) {
      updates.subscriptionStatus = body.subscriptionStatus;
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse('No valid fields to update', 400);
    }

    const updated = await adminUpdateUser(id, updates);
    if (!updated) {
      return errorResponse('User not found', 404);
    }

    void logActivity(admin.sub, 'admin_update_user', { targetUserId: id, changes: updates });

    return Response.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        tier: updated.tier,
        subscriptionStatus: updated.subscriptionStatus,
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
