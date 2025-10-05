import { NextResponse } from 'next/server';
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import {
  getUserWithDetails,
  updateUserRole,
  banUserById,
  unbanUserById,
} from '@/lib/db/queries/admin-user.query';
import { updateUserRoleSchema } from '@/lib/types/admin/update-user-role.schema';
import { banUserSchema } from '@/lib/types/admin/ban-user.schema';
import { logActivity } from '@/lib/db/queries/activity-log.query';
import logger from '@/lib/logger/logger.service';
import { z } from 'zod';

/**
 * GET /api/admin/users/[id]
 *
 * Get detailed information about a specific user.
 *
 * @requires Super-admin role
 * @returns User details with organizations and activity
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify super-admin access
    await requireSuperAdminContext();

    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await getUserWithDetails(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    logger.error('[api/admin/users/[id]] Failed to load user details', {
      error,
    });

    return NextResponse.json(
      { error: 'Failed to load user details' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 *
 * Update user properties (role, ban status).
 *
 * Supported operations:
 * - Update role: { action: "update_role", role: "user" | "admin" | "super-admin" }
 * - Ban user: { action: "ban", reason: string, expiresInDays?: number }
 * - Unban user: { action: "unban" }
 *
 * @requires Super-admin role
 * @returns Success message
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify super-admin access
    const context = await requireSuperAdminContext();

    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'update_role': {
        // Validate input
        const validated = updateUserRoleSchema.parse({
          userId,
          role: body.role,
        });

        // Update role via Better Auth
        await updateUserRole(validated.userId, validated.role);

        // Log admin action
        await logActivity({
          userId: context.user.id,
          action: 'admin.user.role_updated',
          metadata: {
            targetUserId: validated.userId,
            newRole: validated.role,
          },
        });

        logger.info('[api/admin/users/[id]] User role updated', {
          targetUserId: validated.userId,
          newRole: validated.role,
          adminUserId: context.user.id,
        });

        return NextResponse.json({
          success: true,
          message: 'User role updated successfully',
        });
      }

      case 'ban': {
        // Validate input
        const validated = banUserSchema.parse({
          userId,
          reason: body.reason,
          expiresInDays: body.expiresInDays,
        });

        // Ban user via Better Auth
        await banUserById(
          validated.userId,
          validated.reason,
          validated.expiresInDays
        );

        // Log admin action
        await logActivity({
          userId: context.user.id,
          action: 'admin.user.banned',
          metadata: {
            targetUserId: validated.userId,
            reason: validated.reason,
            expiresInDays: validated.expiresInDays,
          },
        });

        logger.info('[api/admin/users/[id]] User banned', {
          targetUserId: validated.userId,
          reason: validated.reason,
          adminUserId: context.user.id,
        });

        return NextResponse.json({
          success: true,
          message: 'User banned successfully',
        });
      }

      case 'unban': {
        // Unban user via Better Auth
        await unbanUserById(userId);

        // Log admin action
        await logActivity({
          userId: context.user.id,
          action: 'admin.user.unbanned',
          metadata: {
            targetUserId: userId,
          },
        });

        logger.info('[api/admin/users/[id]] User unbanned', {
          targetUserId: userId,
          adminUserId: context.user.id,
        });

        return NextResponse.json({
          success: true,
          message: 'User unbanned successfully',
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('[api/admin/users/[id]] Failed to update user', { error });

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
