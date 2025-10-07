/**
 * Mark All Notifications as Read API Route
 *
 * Mark all unread notifications as read for the authenticated user.
 *
 * @route POST /api/notifications/mark-all-read
 */

import { withApiAuth } from '@/lib/server/api-handler';
import { markAllNotificationsAsRead } from '@/lib/notifications/notification.service';
import {
  simpleSuccessResponseSchema,
  type SimpleSuccessResponse,
} from '@/lib/types/common/simple-success-response.schema';

/**
 * POST /api/notifications/mark-all-read
 *
 * Mark all unread notifications as read
 */
export const POST = withApiAuth<SimpleSuccessResponse>(
  async ({ context }) => {
    await markAllNotificationsAsRead(context.user.id);

    return {
      success: true,
    };
  },
  {
    logName: 'POST /api/notifications/mark-all-read',
    outputSchema: simpleSuccessResponseSchema,
  }
);
