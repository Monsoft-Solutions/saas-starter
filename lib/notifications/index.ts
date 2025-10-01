/**
 * Notifications Module Exports
 *
 * Centralized exports for the notification system.
 * Import from this file for consistent notification access across the application.
 *
 * @example
 * import { createNotification, getNotifications } from '@/lib/notifications';
 *
 * // Create a notification
 * await createNotification({
 *   userId: 'user123',
 *   type: 'billing.payment_failed',
 *   title: 'Payment Failed',
 *   message: 'Your payment method was declined.',
 *   priority: 'critical',
 * });
 *
 * // Get user notifications
 * const notifications = await getNotifications('user123', { limit: 10 });
 */

export {
  createNotification,
  createNotificationsForUsers,
  getNotifications,
  getUnreadNotificationCount,
  getNotification,
  markNotificationAsRead,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
} from './notification.service';

// Re-export types for convenience
export type {
  Notification,
  NotificationEvent,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationMetadata,
} from '@/lib/types/notifications';
