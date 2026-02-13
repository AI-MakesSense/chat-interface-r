import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { getPlatformStats } from '@/lib/db/admin-queries';
import { handleAPIError } from '@/lib/utils/api-error';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const stats = await getPlatformStats();
    return Response.json({ stats });
  } catch (error) {
    return handleAPIError(error);
  }
}
