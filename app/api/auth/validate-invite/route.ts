import { NextRequest } from 'next/server';
import { getInvitationByCode } from '@/lib/db/admin-queries';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return Response.json({ valid: false, error: 'No invite code provided' });
    }

    const invitation = await getInvitationByCode(code);

    if (!invitation) {
      return Response.json({ valid: false, error: 'Invalid invite code' });
    }

    if (invitation.status !== 'pending') {
      return Response.json({ valid: false, error: 'Invitation has already been used or expired' });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return Response.json({ valid: false, error: 'Invitation has expired' });
    }

    return Response.json({
      valid: true,
      type: invitation.type,
      email: invitation.email || null,
    });
  } catch (error) {
    console.error('[validate-invite] Error:', error);
    return Response.json({ valid: false, error: 'Failed to validate invite' });
  }
}
