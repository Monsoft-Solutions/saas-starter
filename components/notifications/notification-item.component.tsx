'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CreditCard,
  Info,
  Lock,
  Package,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/design-system';
import type {
  Notification,
  NotificationCategory,
  NotificationPriority,
} from '@/lib/types/notifications';

/**
 * Get icon component based on notification category
 */
function getCategoryIcon(category: NotificationCategory) {
  const iconClass = 'h-4 w-4';
  switch (category) {
    case 'system':
      return <Bell className={iconClass} />;
    case 'security':
      return <Lock className={iconClass} />;
    case 'billing':
      return <CreditCard className={iconClass} />;
    case 'team':
      return <Users className={iconClass} />;
    case 'activity':
      return <AlertCircle className={iconClass} />;
    case 'product':
      return <Package className={iconClass} />;
    default:
      return <Info className={iconClass} />;
  }
}

/**
 * Get priority badge variant and icon
 */
function getPriorityDisplay(priority: NotificationPriority) {
  switch (priority) {
    case 'critical':
      return {
        variant: 'destructive' as const,
        icon: <AlertCircle className="h-3 w-3" />,
        label: 'Critical',
      };
    case 'important':
      return {
        variant: 'default' as const,
        icon: <AlertTriangle className="h-3 w-3" />,
        label: 'Important',
      };
    case 'info':
    default:
      return null;
  }
}

/**
 * Format notification timestamp
 */
function formatTimestamp(date: Date): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return 'recently';
  }
}

type NotificationItemProps = {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDismiss: (id: number) => void;
};

/**
 * NotificationItem component
 * Displays a single notification with actions
 */
export function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss,
}: NotificationItemProps) {
  const priorityDisplay = getPriorityDisplay(notification.priority);

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(notification.id);
  };

  const content = (
    <div
      className={cn(
        'relative flex gap-3 rounded-lg border p-4 transition-colors',
        notification.isRead
          ? 'bg-background hover:bg-muted/50'
          : 'bg-muted/30 hover:bg-muted/50 border-l-4 border-l-primary'
      )}
      onClick={handleClick}
    >
      {/* Category Icon */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          notification.isRead ? 'bg-muted' : 'bg-primary/10'
        )}
      >
        {getCategoryIcon(notification.category)}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1">
        {/* Title and Priority Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium leading-none">
              {notification.title}
            </p>
            {priorityDisplay && (
              <Badge
                variant={priorityDisplay.variant}
                className="flex items-center gap-1"
              >
                {priorityDisplay.icon}
                <span className="text-xs">{priorityDisplay.label}</span>
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Dismiss notification</span>
          </Button>
        </div>

        {/* Message */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.message}
        </p>

        {/* Footer: Timestamp and Action */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(notification.createdAt)}
          </span>

          {notification.metadata?.actionUrl && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              asChild
            >
              <Link href={notification.metadata.actionUrl}>
                {notification.metadata.actionLabel || 'View'}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // If there's an action URL, wrap the whole item in a link
  if (notification.metadata?.actionUrl) {
    return (
      <Link
        href={notification.metadata.actionUrl}
        className="block"
        onClick={handleClick}
      >
        {content}
      </Link>
    );
  }

  return content;
}
