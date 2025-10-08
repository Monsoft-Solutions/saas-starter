/**
 * Unread Notification Count API Route
 *
 * Get unread notification count for the authenticated user.
 * Cached for 30 seconds to optimize frequent polling.
 *
 * @route GET /api/notifications/unread-count
 */

import { getUnreadNotificationCount } from '@/lib/notifications/notification.service';
import { unreadCountResponseSchema } from '@/lib/types/notifications/unread-count-response.schema';
import { createValidatedAuthenticatedHandler } from '@/lib/server/validated-api-handler';
import z from 'zod';

/**
 * GET /api/notifications/unread-count
 *
 * Get unread notification count
 */
export const GET = createValidatedAuthenticatedHandler(
  z.object({}),
  unreadCountResponseSchema,
  async ({ context }) => {
    // Fetch unread count (cached internally for 30 seconds)
    const unreadCount = await getUnreadNotificationCount(context.user.id);

    return {
      unreadCount,
    };
  },
  {
    inputSource: 'query',
  }
);
