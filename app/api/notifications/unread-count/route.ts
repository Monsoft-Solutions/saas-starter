/**
 * GET /api/notifications/unread-count
 *
 * Get unread notification count for the authenticated user
 * Cached for 30 seconds to optimize frequent polling
 */

import { NextResponse } from 'next/server';
import { requireServerContext } from '@/lib/auth/server-context';
import { getUnreadNotificationCount } from '@/lib/notifications/notification.service';
import logger from '@/lib/logger/logger.service';

export async function GET() {
  try {
    // Authenticate user
    const { user } = await requireServerContext();

    // Fetch unread count (cached internally)
    const unreadCount = await getUnreadNotificationCount(user.id);

    return NextResponse.json({ unreadCount });
  } catch (error) {
    logger.error('[api/notifications/unread-count] Failed to fetch count', {
      error,
    });

    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
