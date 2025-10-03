import type { Notification } from './notification.type';
import { Pagination } from './pagination.type';

/**
 * API response shape from GET /api/notifications
 */
export type NotificationsResponse = {
  notifications: Notification[];
  unreadCount: number;
  pagination: Pagination;
};
