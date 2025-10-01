'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { Notification } from '@/lib/types/notifications';
import { useNotifications } from './use-notifications.hook';

/**
 * Notification context shape
 */
type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | undefined;
  toggleRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (notificationId: number) => Promise<void>;
  refetch: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

/**
 * NotificationProvider component
 * Wraps the app with notification state management and SWR polling
 */
export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const notificationHook = useNotifications();
  const previousUnreadCount = useRef<number>(0);

  // Show toast for new notifications
  useEffect(() => {
    if (notificationHook.isLoading) return;

    const currentUnreadCount = notificationHook.unreadCount;
    const previousCount = previousUnreadCount.current;

    // Check if there are new unread notifications
    if (currentUnreadCount > previousCount && previousCount > 0) {
      const newCount = currentUnreadCount - previousCount;
      const latestNotification = notificationHook.notifications.find(
        (n) => !n.isRead
      );

      if (latestNotification) {
        toast(latestNotification.title, {
          description: latestNotification.message,
          action: latestNotification.metadata?.actionUrl
            ? {
                label: latestNotification.metadata.actionLabel || 'View',
                onClick: () => {
                  window.location.href =
                    latestNotification.metadata!.actionUrl!;
                },
              }
            : undefined,
        });
      } else if (newCount > 1) {
        toast('New notifications', {
          description: `You have ${newCount} new notifications`,
        });
      }
    }

    previousUnreadCount.current = currentUnreadCount;
  }, [
    notificationHook.unreadCount,
    notificationHook.notifications,
    notificationHook.isLoading,
  ]);

  return (
    <NotificationContext.Provider
      value={{
        notifications: notificationHook.notifications,
        unreadCount: notificationHook.unreadCount,
        isLoading: notificationHook.isLoading,
        error: notificationHook.error,
        toggleRead: notificationHook.toggleRead,
        markAllAsRead: notificationHook.markAllAsRead,
        dismiss: notificationHook.dismiss,
        refetch: notificationHook.refetch,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to access notification context
 */
export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotificationContext must be used within NotificationProvider'
    );
  }
  return context;
}
