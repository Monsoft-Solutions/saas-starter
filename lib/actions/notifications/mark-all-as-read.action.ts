/**
 * Server action to mark all notifications as read
 */

'use server';

import { z } from 'zod';
import {
  validatedActionWithUser,
  type ActionState,
} from '@/lib/auth/middleware';
import { markAllNotificationsAsRead } from '@/lib/notifications/notification.service';
import logger from '@/lib/logger/logger.service';

// Empty schema since no params needed
const markAllAsReadSchema = z.object({});

export const markAllAsReadAction = validatedActionWithUser(
  markAllAsReadSchema,
  async (_, __, user): Promise<ActionState> => {
    try {
      // Mark all as read
      await markAllNotificationsAsRead(user.id);

      logger.debug(
        '[action/mark-all-as-read] All notifications marked as read',
        {
          userId: user.id,
        }
      );

      return { success: 'All notifications marked as read' };
    } catch (error) {
      logger.error(
        '[action/mark-all-as-read] Failed to mark all notifications as read',
        {
          userId: user.id,
          error,
        }
      );

      return { error: 'Failed to mark all notifications as read' };
    }
  }
);
