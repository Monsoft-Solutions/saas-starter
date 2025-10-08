/**
 * Domain-specific notification hooks using type-safe API client
 *
 * These hooks provide a type-safe interface for notification-related operations,
 * leveraging SWR for caching, revalidation, and optimistic updates.
 *
 * @module lib/hooks/api/use-notifications.hook
 */

'use client';

import { useCallback } from 'react';
import type { SWRConfiguration } from 'swr';
import { useApiQuery } from '../use-api.hook';
import { apiRoutes } from '@/lib/api/routes.config';
import { apiRequest } from '@/lib/api/client.util';

/**
 * Configuration for notifications polling
 */
const NOTIFICATIONS_CONFIG: SWRConfiguration = {
  refreshInterval: 30000, // Poll every 30 seconds
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 10000, // Prevent duplicate requests within 10s
};

/**
 * Hook to fetch paginated list of notifications with automatic polling
 *
 * @param params - Query parameters (limit, offset)
 * @param options - Override SWR configuration options
 * @returns SWR response with notifications data
 *
 * @example
 * ```tsx
 * function NotificationList() {
 *   const { data, error, isLoading } = useNotifications({ limit: 10, offset: 0 });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <ul>
 *       {data.notifications.map((notification) => (
 *         <li key={notification.id}>{notification.message}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useNotifications(
  params?: { limit?: number; offset?: number },
  options?: SWRConfiguration
) {
  return useApiQuery(apiRoutes.notifications.list, {
    queryParams: params,
    swrConfig: { ...NOTIFICATIONS_CONFIG, ...options },
  });
}

/**
 * Hook to fetch a single notification by ID
 *
 * @param id - Notification ID
 * @returns SWR response with notification data
 *
 * @example
 * ```tsx
 * function NotificationDetail({ id }: { id: string }) {
 *   const { data, error, isLoading } = useNotification(id);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return <div>{data.message}</div>;
 * }
 * ```
 */
export function useNotification(id: string) {
  return useApiQuery(apiRoutes.notifications.get, { pathParams: [id] });
}

/**
 * Hook to get unread notification count
 *
 * @returns SWR response with unread count
 *
 * @example
 * ```tsx
 * function NotificationBadge() {
 *   const { data } = useUnreadCount();
 *
 *   if (!data || data.unreadCount === 0) return null;
 *
 *   return <Badge>{data.unreadCount}</Badge>;
 * }
 * ```
 */
export function useUnreadCount() {
  return useApiQuery(apiRoutes.notifications.unreadCount, {
    swrConfig: {
      refreshInterval: 60000, // Poll every minute
      revalidateOnFocus: true,
    },
  });
}

/**
 * Combined hook with all notification operations
 * Provides a convenient API similar to the old hook interface
 *
 * @param params - Query parameters for notifications list
 * @returns Combined notification operations
 *
 * @example
 * ```tsx
 * function NotificationCenter() {
 *   const {
 *     notifications,
 *     unreadCount,
 *     isLoading,
 *     toggleRead,
 *     markAllAsRead,
 *     dismiss,
 *     refetch,
 *   } = useNotificationOperations({ limit: 20 });
 *
 *   return (
 *     <div>
 *       <h2>Notifications ({unreadCount})</h2>
 *       <button onClick={markAllAsRead}>Mark All Read</button>
 *       {notifications.map((notification) => (
 *         <div key={notification.id}>
 *           <p>{notification.message}</p>
 *           <button onClick={() => toggleRead(notification.id)}>
 *             Toggle Read
 *           </button>
 *           <button onClick={() => dismiss(notification.id)}>Dismiss</button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNotificationOperations(params?: {
  limit?: number;
  offset?: number;
}) {
  const { data, error, isLoading, mutate } = useNotifications(params);

  /**
   * Toggle notification read status (optimistic update)
   */
  const toggleRead = useCallback(
    async (notificationId: number) => {
      if (!data) return;

      const notification = data.notifications.find(
        (n) => n.id === notificationId
      );
      if (!notification) return;

      const newReadStatus = !notification.isRead;
      const unreadChange = newReadStatus ? -1 : 1;

      // Optimistic update - deep clone to avoid cache mutation
      await mutate(
        {
          ...data,
          notifications: data.notifications.map((n) =>
            n.id === notificationId
              ? {
                  ...n,
                  isRead: newReadStatus,
                  readAt: newReadStatus ? new Date() : null,
                }
              : { ...n }
          ),
          unreadCount: Math.max(0, data.unreadCount + unreadChange),
        },
        false
      );

      // Server update
      try {
        await apiRequest(apiRoutes.notifications.update, {
          pathParams: [String(notificationId)],
          data: { action: 'toggle_read' },
        });

        // Revalidate after success
        await mutate();
      } catch (error) {
        console.error('Failed to toggle notification read status:', error);
        // Revert on error
        await mutate();
      }
    },
    [data, mutate]
  );

  /**
   * Mark all notifications as read (optimistic update)
   */
  const markAllAsRead = useCallback(async () => {
    if (!data) return;

    // Optimistic update - deep clone to avoid cache mutation
    await mutate(
      {
        ...data,
        notifications: data.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date(),
        })),
        unreadCount: 0,
      },
      false
    );

    // Server update
    try {
      await apiRequest(apiRoutes.notifications.markAllRead, {
        data: {},
      });

      // Revalidate after success
      await mutate();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Revert on error
      await mutate();
    }
  }, [data, mutate]);

  /**
   * Dismiss a notification (optimistic update)
   */
  const dismiss = useCallback(
    async (notificationId: number) => {
      if (!data) return;

      const notification = data.notifications.find(
        (n) => n.id === notificationId
      );
      const wasUnread = notification && !notification.isRead;

      // Optimistic update - deep clone and remove from list
      await mutate(
        {
          ...data,
          notifications: data.notifications
            .filter((n) => n.id !== notificationId)
            .map((n) => ({ ...n })),
          unreadCount: wasUnread
            ? Math.max(0, data.unreadCount - 1)
            : data.unreadCount,
        },
        false
      );

      // Server update
      try {
        await apiRequest(apiRoutes.notifications.update, {
          pathParams: [String(notificationId)],
          data: { action: 'dismiss' },
        });

        // Revalidate after success
        await mutate();
      } catch (error) {
        console.error('Failed to dismiss notification:', error);
        // Revert on error
        await mutate();
      }
    },
    [data, mutate]
  );

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    pagination: data?.pagination,
    isLoading,
    error,
    toggleRead,
    markAllAsRead,
    dismiss,
    refetch: mutate,
  };
}
