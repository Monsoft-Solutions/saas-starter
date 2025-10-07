/**
 * Server action to mark a notification as read
 */

'use server';

import { z } from 'zod';
import {
  validatedActionWithUser,
  type ActionState,
} from '@/lib/auth/middleware';
import {
  markNotificationAsRead,
  getNotification,
} from '@/lib/notifications/notification.service';
import logger from '@/lib/logger/logger.service';

const markAsReadSchema = z.object({
  notificationId: z.coerce.number().int().positive(),
});

export const markAsReadAction = validatedActionWithUser(
  markAsReadSchema,
  async (data, _, user): Promise<ActionState> => {
    try {
      const { notificationId } = data;

      // Verify notification exists and belongs to user
      const notification = await getNotification(notificationId);
      if (!notification) {
        return { error: 'Notification not found' };
      }

      if (notification.userId !== user.id) {
        return { error: 'Unauthorized to update this notification' };
      }

      // Mark as read
      await markNotificationAsRead(notificationId, user.id);

      logger.debug('[action/mark-as-read] Notification marked as read', {
        notificationId,
        userId: user.id,
      });

      return { success: 'Notification marked as read' };
    } catch (error) {
      logger.error(
        '[action/mark-as-read] Failed to mark notification as read',
        {
          notificationId: data.notificationId,
          error,
        }
      );

      return { error: 'Failed to mark notification as read' };
    }
  }
);
