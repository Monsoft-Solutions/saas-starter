import { z } from 'zod';

/**
 * Response schema for activity log details API
 */
export const adminActivityDetailsResponseSchema = z
  .object({
    id: z.number(),
    userId: z.string(),
    action: z.string(),
    timestamp: z.date(),
    ipAddress: z.string().nullable(),
    userEmail: z.string(),
    userName: z.string().nullable(),
    userImage: z.string().nullable(),
    metadata: z.record(z.unknown()).nullable().optional(),
  })
  .strict();

export type AdminActivityDetailsResponse = z.infer<
  typeof adminActivityDetailsResponseSchema
>;
