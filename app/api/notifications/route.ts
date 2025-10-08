/**
 * GET /api/notifications
 *
 * Fetch paginated notifications for the authenticated user
 * Supports pagination via query parameters
 *
 * Uses validated API handler with:
 * - Input validation: Query parameters (limit, offset)
 * - Output validation: Notification list response schema
 * - Authentication: Required (withApiAuth)
 */

import { createValidatedAuthenticatedHandler } from '@/lib/server/validated-api-handler';
import {
  getNotifications,
  getUnreadNotificationCount,
} from '@/lib/notifications/notification.service';
import { paginationSchema } from '@/lib/types/notifications/pagination.type';
import { notificationListResponseSchema } from '@/lib/types/notifications/notification-list-response.schema';

export const GET = createValidatedAuthenticatedHandler(
  paginationSchema,
  notificationListResponseSchema,
  async ({ data, context }) => {
    const { limit, offset } = data;
    const { user } = context;

    // Fetch notifications and unread count in parallel
    const [notifications, unreadCount] = await Promise.all([
      getNotifications(user.id, { limit, offset }),
      getUnreadNotificationCount(user.id),
    ]);

    // Response is automatically validated against notificationListResponseSchema
    return {
      notifications,
      unreadCount,
      pagination: {
        limit,
        offset,
        hasMore: notifications.length === limit,
      },
    };
  },
  {
    inputSource: 'query', // Parse from query parameters
    logName: 'Fetch notifications',
  }
);
