import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { getAllUsers } from '@/lib/db/admin-queries';
import { handleAPIError } from '@/lib/utils/api-error';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || undefined;
    const tier = url.searchParams.get('tier') || undefined;
    const sort = (url.searchParams.get('sort') || 'newest') as 'newest' | 'oldest' | 'name';

    const result = await getAllUsers({ page, limit, search, tier, sort });

    return Response.json({
      users: result.users,
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
