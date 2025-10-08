/**
 * Notification components and hooks
 * Centralized exports for clean imports across the application
 */

// Core components
export { NotificationProvider } from './notification-provider.component';
export { NotificationBell } from './notification-bell.component';
export { NotificationCenter } from './notification-center.component';
export { NotificationItem } from './notification-item.component';
export { NotificationEmpty } from './notification-empty.component';
export { NotificationFilters } from './notification-filters.component';

// Hooks
export {
  useNotifications,
  useNotification,
  useUnreadCount,
  useNotificationOperations,
} from '@/lib/hooks/api/notifications/use-notifications.hook';
export { useNotificationContext } from './notification-provider.component';
