'use client';

import { BellOff } from 'lucide-react';

/**
 * NotificationEmpty component
 * Displays an empty state when there are no notifications
 */
export function NotificationEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <BellOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium mb-1">No notifications</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        You're all caught up! Check back later for updates.
      </p>
    </div>
  );
}
