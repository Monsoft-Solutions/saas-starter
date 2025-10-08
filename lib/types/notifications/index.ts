/**
 * Notification types and constants.
 * Centralized exports for clean imports across the application.
 */

// Constants (single source of truth)
export {
  NOTIFICATION_PRIORITIES,
  type NotificationPriority,
} from './notification-priority.constant';
export {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
} from './notification-category.constant';
export {
  NOTIFICATION_TYPES,
  type NotificationType,
} from './notification-type.constant';

// Core types
export type { NotificationMetadata } from './notification-metadata.type';
export type { Notification } from './notification.type';
export type { NotificationsResponse } from './notifications-response.type';

// Zod schemas
export {
  notificationEventSchema,
  type NotificationEvent,
} from './notification-event.schema';
export {
  notificationMetadataSchema,
  notificationResponseSchema,
  type NotificationResponse,
} from './notification-response.schema';
export {
  notificationListResponseSchema,
  type NotificationListResponse,
} from './notification-list-response.schema';
