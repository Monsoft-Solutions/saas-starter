'use client';

import { BellOff, CheckCheck } from 'lucide-react';

type NotificationEmptyProps = {
  filter?: 'read' | 'unread';
};

/**
 * NotificationEmpty component
 * Displays context-aware empty state based on filter
 */
export function NotificationEmpty({
  filter = 'unread',
}: NotificationEmptyProps) {
  const isUnreadFilter = filter === 'unread';

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        {isUnreadFilter ? (
          <CheckCheck className="h-8 w-8 text-muted-foreground" />
        ) : (
          <BellOff className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <h3 className="text-sm font-medium mb-1">
        {isUnreadFilter ? 'All caught up!' : 'No read notifications'}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {isUnreadFilter
          ? 'You have no unread notifications. Check back later for updates.'
          : "You haven't read any notifications yet. They'll appear here once you mark them as read."}
      </p>
    </div>
  );
}
