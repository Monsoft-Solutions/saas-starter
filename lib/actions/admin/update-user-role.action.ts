'use server';

import { z } from 'zod';
import { withPermission } from '@/lib/auth/permission-middleware';
import { updateUserRole } from '@/lib/db/queries/admin-user.query';
import { logActivity } from '@/lib/db/queries/activity-log.query';
import { ActivityType } from '@/lib/types/activity-log';
import { updateUserRoleSchema } from '@/lib/types/admin/update-user-role.schema';

/**
 * Server action to update a user's role.
 * Requires the `users:write` admin permission.
 */
export const updateUserRoleAction = withPermission(
  'users:write',
  async (formData) => {
    try {
      const data = updateUserRoleSchema.parse({
        userId: formData.get('userId'),
        role: formData.get('role'),
      });

      // Update role via Better Auth
      await updateUserRole(data.userId, data.role);

      // Log admin action
      await logActivity({
        action: ActivityType.ADMIN_USER_ROLE_UPDATED,
        metadata: {
          targetUserId: data.userId,
          newRole: data.role,
        },
      });

      return { success: 'User role updated successfully' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { error: error.errors[0].message };
      }

      return { error: 'Failed to update user role' };
    }
  },
  'admin.users.update-role'
);
