'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useNotificationOperations } from '@/lib/hooks/api/use-notifications.hook';

/**
 * Notification context shape - derived from hook return type
 */
type NotificationContextType = Pick<
  ReturnType<typeof useNotificationOperations>,
  | 'notifications'
  | 'unreadCount'
  | 'isLoading'
  | 'error'
  | 'toggleRead'
  | 'markAllAsRead'
  | 'dismiss'
  | 'refetch'
>;

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

/**
 * NotificationProvider component
 * Wraps the app with notification state management and SWR polling
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const notificationHook = useNotificationOperations();
  const previousUnreadCount = useRef<number>(0);
  const hasInitialized = useRef(false);

  // Show toast for new notifications
  useEffect(() => {
    if (notificationHook.isLoading) return;

    const currentUnreadCount = notificationHook.unreadCount;
    const previousCount = previousUnreadCount.current;

    // Skip the very first run to establish baseline
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      previousUnreadCount.current = currentUnreadCount;
      return;
    }

    // Show toast for ALL increases, including 0 → n
    if (currentUnreadCount > previousCount) {
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
                  router.push(latestNotification.metadata!.actionUrl!);
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
    router,
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
