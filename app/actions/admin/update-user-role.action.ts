'use server';

import { z } from 'zod';
import { withSuperAdmin } from '@/lib/auth/super-admin-middleware';
import { updateUserRole } from '@/lib/db/queries/admin-user.query';
import { logActivity } from '@/lib/db/queries/activity-log.query';
import { USER_ROLES } from '@/lib/types/admin/user-role.enum';

/**
 * Schema for updating user role
 */
const updateUserRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(USER_ROLES, {
    errorMap: () => ({ message: 'Invalid role' }),
  }),
});

/**
 * Server action to update a user's role.
 * Only accessible by super-admins.
 */
export const updateUserRoleAction = withSuperAdmin(
  async (formData, context) => {
    try {
      const data = updateUserRoleSchema.parse({
        userId: formData.get('userId'),
        role: formData.get('role'),
      });

      // Update role via Better Auth
      await updateUserRole(data.userId, data.role);

      // Log admin action
      await logActivity({
        userId: context.user.id,
        action: 'admin.user.role_updated',
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
  {
    logAction: 'admin.user.role_updated',
  }
);
