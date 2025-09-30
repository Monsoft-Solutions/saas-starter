import { NextResponse } from 'next/server';
import { cacheService } from '@/lib/cache';
import { requireServerContext } from '@/lib/auth/server-context';

/**
 * GET /api/cache/stats
 *
 * Get cache statistics (admin only)
 */
export async function GET() {
  try {
    // Require authenticated user
    const { user: _user } = await requireServerContext();

    // TODO: Add admin role check
    // if (!isAdmin(user)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const stats = await cacheService.getStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cache stats' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cache/stats
 *
 * Clear cache (admin only)
 */
export async function DELETE() {
  try {
    // Require authenticated user
    const { user: _user } = await requireServerContext();

    // TODO: Add admin role check
    // if (!isAdmin(user)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    await cacheService.clear();

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
