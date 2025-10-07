'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/drizzle';
import { organization } from '@/lib/db/schemas/organization.table';
import { eq } from 'drizzle-orm';
import { hasAdminPermission } from '@/lib/auth/admin-context';
import { PermissionDeniedError } from '@/lib/auth/permission-middleware';
import { logAdminActivity } from '@/lib/db/queries/activity-log.query';
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import { logger } from '@/lib/logger';

/**
 * Server action to delete an organization.
 * Requires the `organizations:write` admin permission.
 *
 * @param organizationId - The ID of the organization to delete
 * @returns Success status and optional error message
 */
export async function deleteOrganization(organizationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const context = await requireSuperAdminContext();

    if (!hasAdminPermission(context, 'organizations:write')) {
      logger.error('[delete-organization] Permission denied', {
        userId: context.user.id,
        action: 'admin.organizations.delete',
        actorRole: context.user.role,
        grantedPermissions: ['organizations:write'],
        additionalMetadata: { organizationId },
      });
      await logAdminActivity({
        userId: context.user.id,
        action: 'admin.organizations.delete',
        actorRole: context.user.role,
        grantedPermissions: ['organizations:write'],
        additionalMetadata: { organizationId },
      });
      throw new PermissionDeniedError(
        ['organizations:write'],
        'admin.organizations.delete'
      );
    }

    // Delete the organization
    await db.delete(organization).where(eq(organization.id, organizationId));

    await logAdminActivity({
      userId: context.user.id,
      action: 'admin.organizations.delete',
      actorRole: context.user.role,
      additionalMetadata: {
        organizationId,
        organizationName: organization.name,
      },
    });

    // Revalidate the organizations page to reflect the deletion
    revalidatePath('/admin/organizations');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof PermissionDeniedError
          ? 'Forbidden: organizations:write permission required.'
          : error instanceof Error
            ? error.message
            : 'Failed to delete organization',
    };
  }
}
