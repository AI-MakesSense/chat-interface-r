import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { updateInvitationStatus, deleteInvitation, logActivity } from '@/lib/db/admin-queries';
import { handleAPIError, errorResponse } from '@/lib/utils/api-error';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;

    // Soft revoke by setting status to expired
    const updated = await updateInvitationStatus(id, 'expired');
    if (!updated) {
      // Try hard delete if not found by update
      const deleted = await deleteInvitation(id);
      if (!deleted) {
        return errorResponse('Invitation not found', 404);
      }
    }

    void logActivity(admin.sub, 'invitation_revoked', { invitationId: id });

    return Response.json({ success: true });
  } catch (error) {
    return handleAPIError(error);
  }
}
