'use client';

import { useState, useMemo } from 'react';
import { CheckCheck, Loader2 } from 'lucide-react';
import { isToday, isYesterday, isThisWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Notification } from '@/lib/types/notifications';
import { useNotificationContext } from './notification-provider.component';
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
  const { notifications, isLoading, toggleRead, markAllAsRead } =
    useNotificationContext();

  const [readFilter, setReadFilter] = useState<'read' | 'unread'>('unread');

  // Filter notifications by read status
  const filteredNotifications = useMemo(() => {
    if (readFilter === 'unread') {
      return notifications.filter((n) => !n.isRead);
    }
    // Filter by read
    return notifications.filter((n) => n.isRead);
  }, [notifications, readFilter]);

  // Group filtered notifications by time
  const groupedNotifications = useMemo(
    () => groupNotificationsByTime(filteredNotifications),
    [filteredNotifications]
  );

  const hasNotifications = filteredNotifications.length > 0;
  const hasUnreadNotifications = notifications.some((n) => !n.isRead);

  return (
    <Card>
      {/* Header */}
      <CardHeader className="flex items-center justify-between px-6 py-0">
        <CardTitle className=" font-semibold">Notifications</CardTitle>

        {/* Filter Tabs */}
        <CardAction className="flex gap-2">
          <button
            onClick={() => setReadFilter('unread')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              readFilter === 'unread'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setReadFilter('read')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              readFilter === 'read'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Read
          </button>
        </CardAction>
      </CardHeader>

      {/* Content */}
      <CardContent className="flex h-[calc(100%-73px)] flex-col overflow-hidden p-0">
        {/* Loading State */}
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasNotifications && <NotificationEmpty />}

        {/* Notifications List */}
        {!isLoading && hasNotifications && (
          <>
            {/* Mark all read button */}
            {hasUnreadNotifications && (
              <div className=" flex justify-end pr-2 text-muted-foreground">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsRead()}
                  className="h-8 text-xs font-medium hover:bg-muted align-end justify-end"
                >
                  <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                  Mark all as read
                </Button>
              </div>
            )}

            <ScrollArea className="flex-1">
              <div className="flex flex-col">
                {/* Today */}
                {groupedNotifications.today.length > 0 && (
                  <div className="flex flex-col">
                    {groupedNotifications.today.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onToggleRead={toggleRead}
                      />
                    ))}
                  </div>
                )}

                {/* Yesterday */}
                {groupedNotifications.yesterday.length > 0 && (
                  <>
                    {groupedNotifications.today.length > 0 && (
                      <Separator className="my-2" />
                    )}
                    <div className="flex flex-col">
                      {groupedNotifications.yesterday.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onToggleRead={toggleRead}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* This Week */}
                {groupedNotifications.thisWeek.length > 0 && (
                  <>
                    {(groupedNotifications.today.length > 0 ||
                      groupedNotifications.yesterday.length > 0) && (
                      <Separator className="my-2" />
                    )}
                    <div className="flex flex-col">
                      {groupedNotifications.thisWeek.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onToggleRead={toggleRead}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Earlier */}
                {groupedNotifications.earlier.length > 0 && (
                  <>
                    {(groupedNotifications.today.length > 0 ||
                      groupedNotifications.yesterday.length > 0 ||
                      groupedNotifications.thisWeek.length > 0) && (
                      <Separator className="my-2" />
                    )}
                    <div className="flex flex-col">
                      {groupedNotifications.earlier.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onToggleRead={toggleRead}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}
