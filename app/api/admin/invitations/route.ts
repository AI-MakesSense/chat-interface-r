import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { createInvitation, getInvitations, logActivity } from '@/lib/db/admin-queries';
import { handleAPIError, errorResponse } from '@/lib/utils/api-error';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') || undefined;

    const result = await getInvitations({ page, limit, status });

    return Response.json({
      invitations: result.invitations,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    const type = body.type as 'email' | 'code';
    if (!type || !['email', 'code'].includes(type)) {
      return errorResponse('Invalid invitation type. Must be "email" or "code".', 400);
    }

    if (type === 'email' && !body.email) {
      return errorResponse('Email is required for email-type invitations.', 400);
    }

    const code = randomBytes(16).toString('hex');
    const expiresInDays = body.expiresInDays || 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const invitation = await createInvitation({
      email: type === 'email' ? body.email : undefined,
      code,
      type,
      invitedBy: admin.sub,
      expiresAt,
    });

    void logActivity(admin.sub, 'invitation_created', {
      invitationId: invitation.id,
      type,
      email: body.email || null,
    });

    // Build signup URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '';
    const signupUrl = `${baseUrl}/auth/signup?invite=${code}`;

    return Response.json({ invitation, signupUrl }, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}
