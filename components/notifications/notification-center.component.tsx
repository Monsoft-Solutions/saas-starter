'use client';

import { useState, useMemo } from 'react';
import { CheckCheck, Loader2 } from 'lucide-react';
import { isToday, isYesterday, isThisWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type {
  Notification,
  NotificationCategory,
} from '@/lib/types/notifications';
import { useNotificationContext } from './notification-provider.component';
import { NotificationFilters } from './notification-filters.component';
import { NotificationItem } from './notification-item.component';
import { NotificationEmpty } from './notification-empty.component';

/**
 * Group notifications by time period
 */
type GroupedNotifications = {
  today: Notification[];
  yesterday: Notification[];
  thisWeek: Notification[];
  earlier: Notification[];
};

/**
 * Group notifications by time period
 */
function groupNotificationsByTime(
  notifications: Notification[]
): GroupedNotifications {
  const groups: GroupedNotifications = {
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt);

    if (isToday(date)) {
      groups.today.push(notification);
    } else if (isYesterday(date)) {
      groups.yesterday.push(notification);
    } else if (isThisWeek(date, { weekStartsOn: 0 })) {
      groups.thisWeek.push(notification);
    } else {
      groups.earlier.push(notification);
    }
  });

  return groups;
}

/**
 * NotificationCenter component
 * Displays grouped and filtered notifications with actions
 */
export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismiss,
  } = useNotificationContext();

  const [activeCategory, setActiveCategory] = useState<
    NotificationCategory | 'all'
  >('all');

  // Filter notifications by category
  const filteredNotifications = useMemo(() => {
    if (activeCategory === 'all') {
      return notifications;
    }
    return notifications.filter((n) => n.category === activeCategory);
  }, [notifications, activeCategory]);

  // Group filtered notifications by time
  const groupedNotifications = useMemo(
    () => groupNotificationsByTime(filteredNotifications),
    [filteredNotifications]
  );

  const hasNotifications = filteredNotifications.length > 0;

  return (
    <div className="flex h-[600px] w-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">Notifications</h2>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead()}
            className="text-xs"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="border-b p-4">
        <NotificationFilters
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !hasNotifications && <NotificationEmpty />}

      {/* Notifications List */}
      {!isLoading && hasNotifications && (
        <ScrollArea className="flex-1">
          <div className="space-y-6 p-4">
            {/* Today */}
            {groupedNotifications.today.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                  Today
                </h3>
                <div className="space-y-2">
                  {groupedNotifications.today.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDismiss={dismiss}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Yesterday */}
            {groupedNotifications.yesterday.length > 0 && (
              <>
                {groupedNotifications.today.length > 0 && <Separator />}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                    Yesterday
                  </h3>
                  <div className="space-y-2">
                    {groupedNotifications.yesterday.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onDismiss={dismiss}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* This Week */}
            {groupedNotifications.thisWeek.length > 0 && (
              <>
                {(groupedNotifications.today.length > 0 ||
                  groupedNotifications.yesterday.length > 0) && <Separator />}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                    This Week
                  </h3>
                  <div className="space-y-2">
                    {groupedNotifications.thisWeek.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onDismiss={dismiss}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Earlier */}
            {groupedNotifications.earlier.length > 0 && (
              <>
                {(groupedNotifications.today.length > 0 ||
                  groupedNotifications.yesterday.length > 0 ||
                  groupedNotifications.thisWeek.length > 0) && <Separator />}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                    Earlier
                  </h3>
                  <div className="space-y-2">
                    {groupedNotifications.earlier.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onDismiss={dismiss}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
