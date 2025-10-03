'use client';

import useSWR from 'swr';
import type { NotificationsResponse } from '@/lib/types/notifications';

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
   * Toggle notification read status (optimistic update)
   */
  const toggleRead = async (notificationId: number) => {
    if (!data) return;

    // Find the notification to check current status
    const notification = data.notifications.find(
      (n) => n.id === notificationId
    );
    if (!notification) return;

    const newReadStatus = !notification.isRead;
    const unreadChange = newReadStatus ? -1 : 1; // -1 if marking as read, +1 if marking as unread

    // Optimistic update
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
            : n
        ),
        unreadCount: Math.max(0, data.unreadCount + unreadChange),
      },
      false
    );

    // Server update via API route
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'toggle_read' }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle notification read status');
      }
    } catch (error) {
      console.error('Failed to toggle notification read status:', error);
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

    // Server update via API route
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
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

    // Server update via API route
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'dismiss' }),
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss notification');
      }
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
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
    toggleRead,
    markAllAsRead,
    dismiss,
    refetch: mutate,
  };
}
