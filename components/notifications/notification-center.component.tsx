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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/design-system';
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
 * Section header component for time groups
 */
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="sticky top-0 z-10  backdrop-blur-sm px-4 ">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </h4>
    </div>
  );
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

  // Count notifications by filter
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );
  const readCount = useMemo(
    () => notifications.filter((n) => n.isRead).length,
    [notifications]
  );

  const hasNotifications = filteredNotifications.length > 0;
  const hasUnreadNotifications = notifications.some((n) => !n.isRead);

  return (
    <Card className="flex flex-col max-h-[600px] py-2 gap-1.5">
      {/* Header */}
      <CardHeader className="flex items-center justify-between px-6 py-3 shrink-0">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="font-semibold">Notifications</CardTitle>

          {/* Filter Tabs */}
          <CardAction className="flex gap-2">
            <button
              onClick={() => setReadFilter('unread')}
              className={cn(
                'relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5',
                readFilter === 'unread'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50'
              )}
              aria-label={`Show unread notifications (${unreadCount})`}
            >
              Unread
              {unreadCount > 0 && (
                <Badge
                  variant="secondary"
                  className="h-5 min-w-[20px] px-1 text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setReadFilter('read')}
              className={cn(
                'relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5',
                readFilter === 'read'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50'
              )}
              aria-label={`Show read notifications (${readCount})`}
            >
              Read
              {readCount > 0 && (
                <Badge
                  variant="secondary"
                  className="h-5 min-w-[20px] px-1 text-xs"
                >
                  {readCount > 99 ? '99+' : readCount}
                </Badge>
              )}
            </button>
          </CardAction>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="flex flex-col flex-1 overflow-hidden p-0 min-h-0">
        {/* Loading State */}
        {isLoading && (
          <div className="flex h-full items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasNotifications && (
          <NotificationEmpty filter={readFilter} />
        )}

        {/* Notifications List */}
        {!isLoading && hasNotifications && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Mark all read button */}
            {hasUnreadNotifications && readFilter === 'unread' && (
              <div className="flex justify-end px-4 py-2 border-b border-border/50 bg-muted/30 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsRead()}
                  className="h-8 text-xs font-medium hover:bg-background"
                >
                  <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                  Mark all as read
                </Button>
              </div>
            )}

            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-2 p-2">
                {[
                  {
                    key: 'today',
                    title: 'Today',
                    notifications: groupedNotifications.today,
                  },
                  {
                    key: 'yesterday',
                    title: 'Yesterday',
                    notifications: groupedNotifications.yesterday,
                  },
                  {
                    key: 'thisWeek',
                    title: 'Earlier this week',
                    notifications: groupedNotifications.thisWeek,
                  },
                  {
                    key: 'earlier',
                    title: 'Earlier',
                    notifications: groupedNotifications.earlier,
                  },
                ].map(
                  ({ key, title, notifications: sectionNotifications }) =>
                    sectionNotifications.length > 0 && (
                      <div key={key} className="flex flex-col">
                        <SectionHeader title={title} />
                        <div className="flex flex-col gap-2 p-2">
                          {sectionNotifications.map((notification) => (
                            <NotificationItem
                              key={notification.id}
                              notification={notification}
                              onToggleRead={toggleRead}
                            />
                          ))}
                        </div>
                      </div>
                    )
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
