/**
 * PATCH /api/notifications/[id]
 *
 * Update a notification (mark as read/unread, dismiss)
 * User can only update their own notifications
 *
 * Uses validated API handler with:
 * - Route param validation: ID must be a valid numeric string
 * - Input validation: Request body (action)
 * - Output validation: Success response schema
 * - Authentication: Required (via validated handler)
 * - Authorization: User must own the notification
 */

import { z } from 'zod';
import {
  createValidatedRouteParamHandler,
  HandlerError,
} from '@/lib/server/validated-api-handler';
import {
  markNotificationAsRead,
  toggleNotificationRead,
  dismissNotification,
  getNotification,
} from '@/lib/notifications/notification.service';
import { notificationUpdateRequestSchema } from '@/lib/types/notifications/notification-update-request.schema';
import { successResponseSchema } from '@/lib/types/common/success-response.schema';

// Schema for route parameters
const notificationParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number'),
});

export const PATCH = createValidatedRouteParamHandler(
  notificationParamsSchema,
  notificationUpdateRequestSchema,
  successResponseSchema,
  async ({ params, data, context }) => {
    const notificationId = parseInt(params.id, 10);
    const { action } = data;
    const { user } = context;

    // Verify notification exists and belongs to user
    const notification = await getNotification(notificationId);
    if (!notification) {
      throw new HandlerError('Notification not found', 404);
    }

    if (notification.userId !== user.id) {
      throw new HandlerError('Unauthorized to update this notification', 403);
    }

    // Perform action
    if (action === 'mark_read') {
      await markNotificationAsRead(notificationId, user.id);
    } else if (action === 'toggle_read') {
      await toggleNotificationRead(notificationId, user.id);
    } else if (action === 'dismiss') {
      await dismissNotification(notificationId, user.id);
    }

    // Response is automatically validated against successResponseSchema
    return { success: true };
  },
  {
    logName: 'Update notification',
  }
);
