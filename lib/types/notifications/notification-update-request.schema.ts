import { z } from 'zod';

/**
 * Zod schema for notification update request (PATCH /api/notifications/[id]).
 * Defines valid actions that can be performed on a notification.
 */
export const notificationUpdateRequestSchema = z.object({
  action: z.enum(['mark_read', 'toggle_read', 'dismiss'], {
    errorMap: () => ({
      message:
        "Invalid action. Must be one of: 'mark_read', 'toggle_read', 'dismiss'",
    }),
  }),
});

/**
 * Notification update request type (inferred from schema).
 * Use this for validating PATCH requests to update notifications.
 */
export type NotificationUpdateRequest = z.infer<
  typeof notificationUpdateRequestSchema
>;
