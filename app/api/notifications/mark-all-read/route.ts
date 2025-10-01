/**
 * POST /api/notifications/mark-all-read
 *
 * Mark all unread notifications as read for the authenticated user
 */

import { NextResponse } from 'next/server';
import { requireServerContext } from '@/lib/auth/server-context';
import { markAllNotificationsAsRead } from '@/lib/notifications/notification.service';
import logger from '@/lib/logger/logger.service';

export async function POST() {
  try {
    // Authenticate user
    const { user } = await requireServerContext();

    // Mark all as read
    await markAllNotificationsAsRead(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      '[api/notifications/mark-all-read] Failed to mark all as read',
      { error }
    );

    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
