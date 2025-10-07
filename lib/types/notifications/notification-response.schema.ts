import { z } from 'zod';
import { NOTIFICATION_TYPES } from './notification-type.constant';
import { NOTIFICATION_CATEGORIES } from './notification-category.constant';
import { NOTIFICATION_PRIORITIES } from './notification-priority.constant';

/**
 * Zod schema for notification metadata.
 * Contains optional contextual information and action data for notifications.
 */
export const notificationMetadataSchema = z
  .object({
    actionUrl: z.string().regex(new RegExp('^/.*$')).optional(),
    actionLabel: z.string().optional(),
    actorId: z.string().optional(),
    actorName: z.string().optional(),
    entityId: z.string().optional(),
    entityType: z.string().optional(),
    imageUrl: z.string().url().optional(),
  })
  .catchall(z.unknown());

/**
 * Zod schema for a single notification response.
 * Matches the Notification type from the database.
 */
export const notificationResponseSchema = z.object({
  id: z.number().int().positive(),
  userId: z.string(),
  type: z.enum(NOTIFICATION_TYPES),
  category: z.enum(NOTIFICATION_CATEGORIES),
  priority: z.enum(NOTIFICATION_PRIORITIES),
  title: z.string(),
  message: z.string(),
  metadata: notificationMetadataSchema.nullable(),
  isRead: z.boolean(),
  readAt: z.date().nullable(),
  isDismissed: z.boolean(),
  createdAt: z.date(),
  expiresAt: z.date().nullable(),
});

/**
 * Single notification response type (inferred from schema).
 */
export type NotificationResponse = z.infer<typeof notificationResponseSchema>;
