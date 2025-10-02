/**
 * GET /api/notifications
 *
 * Fetch paginated notifications for the authenticated user
 * Supports pagination via query parameters
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireServerContext } from '@/lib/auth/server-context';
import {
  getNotifications,
  getUnreadNotificationCount,
} from '@/lib/notifications/notification.service';
import logger from '@/lib/logger/logger.service';

// Define validation schema for pagination
const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user } = await requireServerContext();

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validationResult = paginationSchema.safeParse(searchParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid pagination parameters',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { limit, offset } = validationResult.data;

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
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.format() },
        { status: 400 }
      );
    }

    // Handle authentication errors
    if (error instanceof Error && error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle unexpected errors
    logger.error('[api/notifications] Failed to fetch notifications', {
      error,
    });

    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
