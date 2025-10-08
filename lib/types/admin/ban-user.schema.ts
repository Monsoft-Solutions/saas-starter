import { z } from 'zod';

/**
 * Zod schema for banning a user.
 */
export const banUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  expiresInDays: z.number().int().positive().optional(),
});

export type BanUserInput = z.infer<typeof banUserSchema>;

export const unbanUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export type UnbanUserInput = z.infer<typeof unbanUserSchema>;
