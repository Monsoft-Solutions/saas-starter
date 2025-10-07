'use server';

import { z } from 'zod';
import { withPermission } from '@/lib/auth/permission-middleware';
import { banUserById, unbanUserById } from '@/lib/db/queries/admin-user.query';
import { logActivity } from '@/lib/db/queries/activity-log.query';

/**
 * Schema for banning a user
 */
const banUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  expiresInDays: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined))
    .refine((val) => val === undefined || (val > 0 && Number.isInteger(val)), {
      message: 'Expiry must be a positive integer',
    }),
});

/**
 * Schema for unbanning a user
 */
const unbanUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

/**
 * Server action to ban a user.
 * Requires the `users:write` admin permission.
 */
export const banUserAction = withPermission(
  'users:write',
  async (formData) => {
    try {
      const data = banUserSchema.parse({
        userId: formData.get('userId'),
        reason: formData.get('reason'),
        expiresInDays: formData.get('expiresInDays'),
      });

      // Ban user via Better Auth
      await banUserById(data.userId, data.reason, data.expiresInDays);

      // Log admin action
      await logActivity({
        action: 'admin.user.banned',
        metadata: {
          targetUserId: data.userId,
          reason: data.reason,
          expiresInDays: data.expiresInDays,
        },
      });

      return { success: 'User banned successfully' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { error: error.errors[0].message };
      }

      return { error: 'Failed to ban user' };
    }
  },
  'admin.users.ban'
);

/**
 * Server action to unban a user.
 * Requires the `users:write` admin permission.
 */
export const unbanUserAction = withPermission(
  'users:write',
  async (formData) => {
    try {
      const data = unbanUserSchema.parse({
        userId: formData.get('userId'),
      });

      // Unban user via Better Auth
      await unbanUserById(data.userId);

      // Log admin action
      await logActivity({
        action: 'admin.user.unbanned',
        metadata: {
          targetUserId: data.userId,
        },
      });

      return { success: 'User unbanned successfully' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { error: error.errors[0].message };
      }

      return { error: 'Failed to unban user' };
    }
  },
  'admin.users.unban'
);
