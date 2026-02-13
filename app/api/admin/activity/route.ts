import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { getRecentActivity } from '@/lib/db/admin-queries';
import { handleAPIError } from '@/lib/utils/api-error';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const action = url.searchParams.get('action') || undefined;

    const result = await getRecentActivity({ limit, offset, action });

    return Response.json({
      entries: result.entries,
      total: result.total,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
