import { NextResponse } from 'next/server';
import { cacheService } from '@/lib/cache';
import { requireAdminContext } from '@/lib/auth/server-context';
import { logError } from '@/lib/logger';

/**
 * GET /api/cache/stats
 *
 * Get cache statistics (admin only)
 */
export async function GET() {
  try {
    // Require admin user (owner of organization)
    await requireAdminContext();

    const stats = await cacheService.getStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logError('Failed to fetch cache stats', error);
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
    // Require admin user (owner of organization)
    await requireAdminContext();

    await cacheService.clear();

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    logError('Failed to clear cache', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
