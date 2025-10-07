import { z } from 'zod';

/**
 * Activity log table data schema for admin activity list responses.
 * Represents a single activity log entry with user details.
 */
export const activityLogTableDataSchema = z.object({
  id: z.number().int(),
  userId: z.string(),
  userEmail: z.string(),
  userName: z.string(),
  userImage: z.string().nullable(),
  action: z.string(),
  timestamp: z.date(),
  ipAddress: z.string().nullable(),
});

/**
 * Activity statistics schema (optional, included when includeStats=true).
 * Matches the structure returned by getActivityStatistics query.
 */
export const activityStatisticsSchema = z.object({
  totalActivities: z.number().int().min(0),
  uniqueUsers: z.number().int().min(0),
  signIns: z.number().int().min(0),
  signUps: z.number().int().min(0),
  adminActions: z.number().int().min(0),
});

/**
 * Activity breakdown item schema.
 */
export const activityBreakdownItemSchema = z.object({
  action: z.string(),
  count: z.number().int().min(0),
});

/**
 * Activity breakdown schema (optional, included when includeStats=true).
 * Matches the structure returned by getActivityBreakdown query.
 */
export const activityBreakdownSchema = z.array(activityBreakdownItemSchema);

/**
 * Admin activity list response schema.
 * Returns paginated list of activity logs with optional statistics and breakdown.
 */
export const adminActivityListResponseSchema = z.object({
  logs: z.array(activityLogTableDataSchema),
  total: z.number().int().min(0),
  limit: z.number().int().min(1).max(1000),
  offset: z.number().int().min(0),
  hasMore: z.boolean(),
  statistics: activityStatisticsSchema.optional(),
  breakdown: z.array(activityBreakdownItemSchema).optional(),
});

/**
 * Admin activity list response type (inferred from schema).
 */
export type AdminActivityListResponse = z.infer<
  typeof adminActivityListResponseSchema
>;

/**
 * Activity log table data type (inferred from schema).
 */
export type ActivityLogTableData = z.infer<typeof activityLogTableDataSchema>;

/**
 * Activity statistics type (inferred from schema).
 */
export type ActivityStatistics = z.infer<typeof activityStatisticsSchema>;

/**
 * Activity breakdown item type (inferred from schema).
 */
export type ActivityBreakdownItem = z.infer<typeof activityBreakdownItemSchema>;

/**
 * Activity breakdown type (inferred from schema).
 */
export type ActivityBreakdown = z.infer<typeof activityBreakdownSchema>;
