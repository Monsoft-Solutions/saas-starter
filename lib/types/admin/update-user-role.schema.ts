import { z } from 'zod';
import { USER_ROLES } from './user-role.enum';

/**
 * Zod schema for updating user role.
 */
export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(USER_ROLES, {
    errorMap: () => ({ message: 'Invalid role' }),
  }),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
