import { z } from 'zod';

/**
 * Admin statistics response schema.
 * Returns comprehensive admin dashboard statistics from the database.
 * Matches the admin_statistics table structure.
 */
export const adminStatsResponseSchema = z.object({
  id: z.number().int(),
  // User metrics
  totalUsers: z.number().int().min(0),
  activeUsersLast30Days: z.number().int().min(0),
  newUsersLast30Days: z.number().int().min(0),
  // Organization metrics
  totalOrganizations: z.number().int().min(0),
  organizationsWithSubscriptions: z.number().int().min(0),
  // Subscription metrics
  totalMRR: z.number().min(0),
  totalActiveSubscriptions: z.number().int().min(0),
  trialOrganizations: z.number().int().min(0),
  // Growth metrics
  userGrowthRate: z.number().nullable(),
  revenueGrowthRate: z.number().nullable(),
  churnRate: z.number().nullable(),
  // Metadata
  calculatedAt: z.date(),
  metadata: z.string().nullable(),
  calculationDurationMs: z.number().nullable(),
});

/**
 * Admin stats response type (inferred from schema).
 */
export type AdminStatsResponse = z.infer<typeof adminStatsResponseSchema>;
