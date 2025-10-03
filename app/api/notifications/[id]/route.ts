/**
 * PATCH /api/notifications/[id]
 *
 * Update a notification (mark as read/unread, dismiss)
 * User can only update their own notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireServerContext } from '@/lib/auth/server-context';
import {
  markNotificationAsRead,
  toggleNotificationRead,
  dismissNotification,
  getNotification,
} from '@/lib/notifications/notification.service';
import logger from '@/lib/logger/logger.service';

const updateNotificationSchema = z.object({
  action: z.enum(['mark_read', 'toggle_read', 'dismiss']),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    // Authenticate user
    const { user } = await requireServerContext();

    // Parse notification ID
    const notificationId = parseInt(params.id, 10);
    if (isNaN(notificationId)) {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = updateNotificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { action } = validation.data;

    // Verify notification exists and belongs to user
    const notification = await getNotification(notificationId);
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this notification' },
        { status: 403 }
      );
    }

    // Perform action
    if (action === 'mark_read') {
      await markNotificationAsRead(notificationId, user.id);
    } else if (action === 'toggle_read') {
      await toggleNotificationRead(notificationId, user.id);
    } else if (action === 'dismiss') {
      await dismissNotification(notificationId, user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[api/notifications/[id]] Failed to update notification', {
      notificationId: params.id,
      error,
    });

    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}
