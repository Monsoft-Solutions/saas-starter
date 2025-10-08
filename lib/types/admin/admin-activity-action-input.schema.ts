import { z } from 'zod';

/**
 * Validation schema for activity log filters used in server actions.
 * Ensures proper types, bounds checking, and sanitization.
 */
export const activityLogFiltersSchema = z.object({
  /**
   * Filter by specific user ID.
   */
  userId: z.string().min(1).optional(),

  /**
   * Filter by action type.
   */
  action: z.string().min(1).optional(),

  /**
   * Filter by start date.
   */
  startDate: z.coerce.date().optional(),

  /**
   * Filter by end date.
   */
  endDate: z.coerce.date().optional(),

  /**
   * Search query for filtering (max 200 characters).
   */
  search: z.string().max(200).optional(),

  /**
   * Maximum number of items to return (1-1000).
   */
  limit: z.coerce.number().int().min(1).max(1000).optional(),

  /**
   * Offset for pagination (0+).
   */
  offset: z.coerce.number().int().min(0).optional(),
});

/**
 * Validation schema for activity statistics parameters.
 * Limits the days parameter to a reasonable range.
 */
export const activityStatisticsParamsSchema = z.object({
  /**
   * Number of days to include in statistics (1-365).
   */
  days: z.coerce.number().int().min(1).max(365).default(30),
});

/**
 * Validation schema for most active users parameters.
 */
export const mostActiveUsersParamsSchema = z.object({
  /**
   * Maximum number of users to return (1-100).
   */
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Validation schema for activity breakdown parameters.
 */
export const activityBreakdownParamsSchema = z.object({
  /**
   * Number of days to include in breakdown (1-365).
   */
  days: z.coerce.number().int().min(1).max(365).default(30),
});

/**
 * Validation schema for activity log ID parameter.
 */
export const activityLogIdSchema = z.object({
  /**
   * Activity log ID (positive integer).
   */
  id: z.coerce.number().int().positive(),
});

/**
 * Inferred types for use in server actions.
 */
export type ActivityLogFilters = z.infer<typeof activityLogFiltersSchema>;
export type ActivityStatisticsParams = z.infer<
  typeof activityStatisticsParamsSchema
>;
export type MostActiveUsersParams = z.infer<typeof mostActiveUsersParamsSchema>;
export type ActivityBreakdownParams = z.infer<
  typeof activityBreakdownParamsSchema
>;
export type ActivityLogId = z.infer<typeof activityLogIdSchema>;
