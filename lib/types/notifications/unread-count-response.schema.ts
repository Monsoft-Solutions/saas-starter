import { z } from 'zod';

/**
 * Schema for unread notification count response
 * GET /api/notifications/unread-count
 */
export const unreadCountResponseSchema = z.object({
  unreadCount: z.number().int().nonnegative(),
});

/**
 * Type for unread notification count response
 */
export type UnreadCountResponse = z.infer<typeof unreadCountResponseSchema>;
