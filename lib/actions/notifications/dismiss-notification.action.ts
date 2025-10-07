/**
 * Server action to dismiss a notification
 */

'use server';

import { z } from 'zod';
import {
  validatedActionWithUser,
  type ActionState,
} from '@/lib/auth/middleware';
import {
  dismissNotification,
  getNotification,
} from '@/lib/notifications/notification.service';
import logger from '@/lib/logger/logger.service';

const dismissNotificationSchema = z.object({
  notificationId: z.coerce.number().int().positive(),
});

export const dismissNotificationAction = validatedActionWithUser(
  dismissNotificationSchema,
  async (data, _, user): Promise<ActionState> => {
    try {
      const { notificationId } = data;

      // Verify notification exists and belongs to user
      const notification = await getNotification(notificationId);
      if (!notification) {
        return { error: 'Notification not found' };
      }

      if (notification.userId !== user.id) {
        return { error: 'Unauthorized to dismiss this notification' };
      }

      // Dismiss notification
      await dismissNotification(notificationId, user.id);

      logger.debug('[action/dismiss-notification] Notification dismissed', {
        notificationId,
        userId: user.id,
      });

      return { success: 'Notification dismissed' };
    } catch (error) {
      logger.error(
        '[action/dismiss-notification] Failed to dismiss notification',
        {
          notificationId: data.notificationId,
          error,
        }
      );

      return { error: 'Failed to dismiss notification' };
    }
  }
);
