import { z } from 'zod';
import { NOTIFICATION_CATEGORIES } from './notification-category.constant';
import { NOTIFICATION_PRIORITIES } from './notification-priority.constant';
import { NOTIFICATION_TYPES } from './notification-type.constant';

/**
 * Zod schema for notification event validation.
 * Uses the same constant arrays as pgEnum for consistency.
 * This is used to validate notification creation payloads.
 */
export const notificationEventSchema = z.object({
  /** ID of the user who will receive this notification */
  userId: z.string().min(1, 'User ID is required'),
  /** Specific notification type */
  type: z.enum(NOTIFICATION_TYPES, {
    errorMap: () => ({ message: 'Invalid notification type' }),
  }),
  /** Category - auto-derived from type if not provided */
  category: z
    .enum(NOTIFICATION_CATEGORIES, {
      errorMap: () => ({ message: 'Invalid notification category' }),
    })
    .optional(),
  /** Priority level - defaults to 'info' */
  priority: z.enum(NOTIFICATION_PRIORITIES).default('info'),
  /** Short notification title (1-255 characters) */
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  /** Detailed message (1-1000 characters) */
  message: z
    .string()
    .min(1, 'Message is required')
    .max(1000, 'Message is too long'),
  /** Optional metadata for additional context */
  metadata: z.record(z.unknown()).optional(),

  /** Optional expiration date */
  expiresAt: z.date().optional(),
});

/**
 * TypeScript type inferred from the Zod schema.
 */
export type NotificationEvent = z.infer<typeof notificationEventSchema>;
