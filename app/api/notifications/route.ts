/**
 * GET /api/notifications
 *
 * Fetch paginated notifications for the authenticated user
 * Supports pagination via query parameters
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireServerContext } from '@/lib/auth/server-context';
import {
  getNotifications,
  getUnreadNotificationCount,
} from '@/lib/notifications/notification.service';
import logger from '@/lib/logger/logger.service';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user } = await requireServerContext();

    // Parse pagination params
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get('limit') || '20', 10)),
      50
    ); // Max 50
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    // Fetch notifications and unread count in parallel
    const [notifications, unreadCount] = await Promise.all([
      getNotifications(user.id, { limit, offset }),
      getUnreadNotificationCount(user.id),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        limit,
        offset,
        hasMore: notifications.length === limit,
      },
    });
  } catch (error) {
    logger.error('[api/notifications] Failed to fetch notifications', {
      error,
    });

    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
