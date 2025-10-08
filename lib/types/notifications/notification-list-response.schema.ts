import { z } from 'zod';
import { notificationResponseSchema } from './notification-response.schema';
import { paginationResponseSchema } from '../common/pagination-response.schema';

/**
 * Zod schema for notification list response from GET /api/notifications.
 * Includes the list of notifications, unread count, and pagination metadata.
 */
export const notificationListResponseSchema = z.object({
  notifications: z.array(notificationResponseSchema),
  unreadCount: z.number().int().min(0),
  pagination: paginationResponseSchema,
});

/**
 * Notification list response type (inferred from schema).
 * Use this for the API response from GET /api/notifications.
 */
export type NotificationListResponse = z.infer<
  typeof notificationListResponseSchema
>;
