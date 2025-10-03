import type { NotificationCategory } from './notification-category.constant';
import type { NotificationMetadata } from './notification-metadata.type';
import type { NotificationPriority } from './notification-priority.constant';
import type { NotificationType } from './notification-type.constant';

/**
 * Notification type (inferred from database schema).
 * Represents a single in-app notification for a user.
 */
export type Notification = {
  /** Auto-incrementing notification ID */
  id: number;
  /** ID of the user who receives this notification */
  userId: string;
  /** Specific notification type (e.g., 'billing.payment_failed') */
  type: NotificationType;
  /** High-level category (e.g., 'billing', 'security') */
  category: NotificationCategory;
  /** Priority level (critical, important, info) */
  priority: NotificationPriority;
  /** Short notification title */
  title: string;
  /** Detailed notification message */
  message: string;
  /** Additional contextual metadata */
  metadata: NotificationMetadata | null;
  /** Whether the notification has been read */
  isRead: boolean;
  /** Timestamp when the notification was marked as read */
  readAt: Date | null;
  /** Whether the notification has been dismissed */
  isDismissed: boolean;
  /** Timestamp when the notification was created */
  createdAt: Date;
  /** Timestamp when the notification should expire and be auto-deleted */
  expiresAt: Date | null;
};
