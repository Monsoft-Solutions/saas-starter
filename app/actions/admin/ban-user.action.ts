'use server';

import { z } from 'zod';
import { withSuperAdmin } from '@/lib/auth/super-admin-middleware';
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
 * Only accessible by super-admins.
 */
export const banUserAction = withSuperAdmin(
  async (formData, context) => {
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
        userId: context.user.id,
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
  {
    logAction: 'admin.user.banned',
  }
);

/**
 * Server action to unban a user.
 * Only accessible by super-admins.
 */
export const unbanUserAction = withSuperAdmin(
  async (formData, context) => {
    try {
      const data = unbanUserSchema.parse({
        userId: formData.get('userId'),
      });

      // Unban user via Better Auth
      await unbanUserById(data.userId);

      // Log admin action
      await logActivity({
        userId: context.user.id,
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
  {
    logAction: 'admin.user.unbanned',
  }
);
