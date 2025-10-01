'use client';

import useSWR from 'swr';
import type { Notification } from '@/lib/types/notifications';
import { markAsReadAction } from '@/app/actions/notifications/mark-as-read.action';
import { markAllAsReadAction } from '@/app/actions/notifications/mark-all-as-read.action';
import { dismissNotificationAction } from '@/app/actions/notifications/dismiss-notification.action';

/**
 * API response shape from GET /api/notifications
 * TODO: Thsi sshoul be moved to a shared types file and r-used in the rest of the app
 * Also, check if we can use the existing Notification type from the lib/types/notifications folder
 */
type NotificationsResponse = {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

/**
 * Fetcher function for SWR
 */
const fetcher = async (url: string): Promise<NotificationsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }
  return response.json();
};

/**
 * Custom hook for managing notifications with SWR polling.
 * Polls every 30 seconds and revalidates on focus/reconnect.
 */
export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    '/api/notifications',
    fetcher,
    {
      refreshInterval: 30000, // Poll every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Prevent duplicate requests within 10s
    }
  );

  /**
   * Mark a notification as read (optimistic update)
   */
  const markAsRead = async (notificationId: number) => {
    if (!data) return;

    // Optimistic update
    await mutate(
      {
        ...data,
        notifications: data.notifications.map((n) =>
          n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date() }
            : n
        ),
        unreadCount: Math.max(0, data.unreadCount - 1),
      },
      false
    );

    // Server update
    try {
      await markAsReadAction({ notificationId }, new FormData());
    } catch (error) {
      // Revert on error
      await mutate();
    }
  };

  /**
   * Mark all notifications as read (optimistic update)
   */
  const markAllAsRead = async () => {
    if (!data) return;

    // Optimistic update
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
      await markAllAsReadAction({}, new FormData());
    } catch (error) {
      // Revert on error
      await mutate();
    }
  };

  /**
   * Dismiss a notification (optimistic update)
   */
  const dismiss = async (notificationId: number) => {
    if (!data) return;

    const notification = data.notifications.find(
      (n) => n.id === notificationId
    );
    const wasUnread = notification && !notification.isRead;

    // Optimistic update - remove from list
    await mutate(
      {
        ...data,
        notifications: data.notifications.filter(
          (n) => n.id !== notificationId
        ),
        unreadCount: wasUnread
          ? Math.max(0, data.unreadCount - 1)
          : data.unreadCount,
      },
      false
    );

    // Server update
    try {
      await dismissNotificationAction({ notificationId }, new FormData());
    } catch (error) {
      // Revert on error
      await mutate();
    }
  };

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    pagination: data?.pagination,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
    refetch: mutate,
  };
}
