/**
 * Cache Statistics API Route
 *
 * Provides cache statistics and management operations for system administrators.
 * Requires organization admin role for access.
 *
 * @route GET /api/cache/stats - Retrieve cache statistics
 * @route DELETE /api/cache/stats - Clear all cache entries
 */

import { cacheService } from '@/lib/cache';
import { requireOrganizationAdminContext } from '@/lib/auth/server-context';
import { cacheStatsResponseSchema } from '@/lib/types/cache/cache-stats-response.schema';

import z from 'zod';
import { createValidatedApiHandler } from '@/lib/server/validated-api-handler';
import { successResponseSchema } from '@/lib/types/common';

/**
 * GET /api/cache/stats
 *
 * Get cache statistics (admin only)
 */
export const GET = createValidatedApiHandler(
  z.object({}),
  cacheStatsResponseSchema,
  async () => {
    // Require admin user (owner of organization)
    await requireOrganizationAdminContext();

    const stats = await cacheService.getStats();

    return {
      success: true,
      data: stats,
    };
  },
  {
    logName: 'GET /api/cache/stats',
  }
);

/**
 * DELETE /api/cache/stats
 *
 * Clear cache (admin only)
 */
export const DELETE = createValidatedApiHandler(
  z.object({}),
  successResponseSchema,
  async () => {
    // Require admin user (owner of organization)
    await requireOrganizationAdminContext();

    await cacheService.clear();

    return {
      success: true,
      message: 'Cache cleared successfully',
    };
  },
  {
    logName: 'DELETE /api/cache/stats',
  }
);
