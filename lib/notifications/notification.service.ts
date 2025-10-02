/**
 * Notification Service
 *
 * High-level business logic for in-app notifications.
 * Provides functions for creating, reading, and managing user notifications.
 *
 * Features:
 * - Synchronous and asynchronous notification creation
 * - Automatic category inference from notification type
 * - Unread count tracking with caching
 * - Bulk operations for efficiency
 * - Integration with job queue for async processing
 */

import 'server-only';

import {
  getUserNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  toggleRead,
  markMultipleAsRead,
  markAllAsRead,
  dismissNotification as dismissNotificationQuery,
  invalidateUserNotificationCache,
} from '@/lib/db/queries/notification.query';
import {
  createNotification as createNotificationRepo,
  createNotificationsBulk,
} from '@/lib/db/repositories/notification.repository';
import type {
  NotificationEvent,
  Notification,
  NotificationType,
  NotificationCategory,
} from '@/lib/types/notifications';
import type { NewNotification } from '@/lib/db/schemas';
import logger from '@/lib/logger/logger.service';

/**
 * Category mapping for automatic category inference from notification type
 */
const TYPE_TO_CATEGORY_MAP: Record<NotificationType, NotificationCategory> = {
  'system.maintenance': 'system',
  'system.update': 'system',
  'security.password_changed': 'security',
  'security.login_new_device': 'security',
  'security.two_factor_enabled': 'security',
  'billing.payment_success': 'billing',
  'billing.payment_failed': 'billing',
  'billing.subscription_created': 'billing',
  'billing.subscription_canceled': 'billing',
  'billing.trial_ending': 'billing',
  'team.invitation_received': 'team',
  'team.invitation_accepted': 'team',
  'team.member_added': 'team',
  'team.member_removed': 'team',
  'team.role_changed': 'team',
  'activity.comment_mention': 'activity',
  'activity.task_assigned': 'activity',
  'product.feature_released': 'product',
  'product.announcement': 'product',
};

/**
 * Derive category from notification type
 */
function getCategoryFromType(type: NotificationType): NotificationCategory {
  return TYPE_TO_CATEGORY_MAP[type];
}

/**
 * Create a notification synchronously
 * Use this for critical notifications that must be created immediately
 *
 * @param event - Notification event data
 */
export async function createNotification(
  event: NotificationEvent
): Promise<Notification> {
  const category = event.category ?? getCategoryFromType(event.type);

  const notificationData: NewNotification = {
    userId: event.userId,
    type: event.type,
    category,
    priority: event.priority ?? 'info',
    title: event.title,
    message: event.message,
    metadata: event.metadata ?? null,
    expiresAt: event.expiresAt ?? null,
  };

  const notification = await createNotificationRepo(notificationData);

  // Invalidate cache
  await invalidateUserNotificationCache(event.userId);

  logger.debug('[notifications] Created notification', {
    notificationId: notification.id,
    userId: event.userId,
    type: event.type,
  });

  return notification;
}

/**
 * Create notifications for multiple users (bulk operation)
 * Useful for system-wide announcements or team notifications
 *
 * @param userIds - Array of user IDs
 * @param event - Notification event data (without userId)
 */
export async function createNotificationsForUsers(
  userIds: string[],
  event: Omit<NotificationEvent, 'userId'>
): Promise<Notification[]> {
  if (userIds.length === 0) return [];

  const category = event.category ?? getCategoryFromType(event.type);

  const notificationsData: NewNotification[] = userIds.map((userId) => ({
    userId,
    type: event.type,
    category,
    priority: event.priority ?? 'info',
    title: event.title,
    message: event.message,
    metadata: event.metadata ?? null,
    expiresAt: event.expiresAt ?? null,
  }));

  const notifications = await createNotificationsBulk(notificationsData);

  // Invalidate cache for all users
  await Promise.all(
    userIds.map((userId) => invalidateUserNotificationCache(userId))
  );

  logger.debug('[notifications] Created bulk notifications', {
    count: notifications.length,
    type: event.type,
  });

  return notifications;
}

/**
 * Get paginated notifications for a user
 *
 * @param userId - User ID
 * @param options - Pagination options
 */
export async function getNotifications(
  userId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<Notification[]> {
  const { limit = 20, offset = 0 } = options;
  return getUserNotifications(userId, limit, offset);
}

/**
 * Get unread notification count for a user
 *
 * @param userId - User ID
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  return getUnreadCount(userId);
}

/**
 * Get a single notification by ID
 *
 * @param notificationId - Notification ID
 */
export async function getNotification(
  notificationId: number
): Promise<Notification | null> {
  return getNotificationById(notificationId);
}

/**
 * Mark a notification as read
 *
 * @param notificationId - Notification ID
 * @param userId - User ID
 */
export async function markNotificationAsRead(
  notificationId: number,
  userId: string
): Promise<void> {
  await markAsRead(notificationId, userId);

  logger.debug('[notifications] Marked notification as read', {
    notificationId,
    userId,
  });
}

/**
 * Toggle notification read status
 *
 * @param notificationId - Notification ID
 * @param userId - User ID
 */
export async function toggleNotificationRead(
  notificationId: number,
  userId: string
): Promise<void> {
  // Get current notification to check read status
  const notification = await getNotificationById(notificationId);
  if (!notification) {
    throw new Error('Notification not found');
  }

  await toggleRead(notificationId, userId, notification.isRead);

  logger.debug('[notifications] Toggled notification read status', {
    notificationId,
    userId,
    newStatus: !notification.isRead,
  });
}

/**
 * Mark multiple notifications as read
 *
 * @param notificationIds - Array of notification IDs
 * @param userId - User ID
 */
export async function markNotificationsAsRead(
  notificationIds: number[],
  userId: string
): Promise<void> {
  await markMultipleAsRead(notificationIds, userId);

  logger.debug('[notifications] Marked notifications as read', {
    count: notificationIds.length,
    userId,
  });
}

/**
 * Mark all notifications as read for a user
 *
 * @param userId - User ID
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<void> {
  await markAllAsRead(userId);

  logger.debug('[notifications] Marked all notifications as read', { userId });
}

/**
 * Dismiss a notification
 *
 * @param notificationId - Notification ID
 * @param userId - User ID
 */
export async function dismissNotification(
  notificationId: number,
  userId: string
): Promise<void> {
  await dismissNotificationQuery(notificationId, userId);

  logger.debug('[notifications] Dismissed notification', {
    notificationId,
    userId,
  });
}
