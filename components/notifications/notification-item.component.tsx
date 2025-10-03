'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Circle,
  CircleCheck,
  CreditCard,
  Info,
  Lock,
  Package,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { cn, notionRadius } from '@/lib/design-system';
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
 * Get priority icon for top-right corner indicator
 */
function getPriorityIcon(priority: NotificationPriority) {
  switch (priority) {
    case 'critical':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case 'important':
      return <AlertTriangle className="h-4 w-4 text-warning" />;
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
  onToggleRead: (id: number) => void;
};

/**
 * NotificationItem component
 * Displays a single notification with actions
 */
export function NotificationItem({
  notification,
  onToggleRead,
}: NotificationItemProps) {
  const router = useRouter();
  const priorityIcon = getPriorityIcon(notification.priority);

  const handleClick = () => {
    if (!notification.isRead) {
      onToggleRead(notification.id);
    }

    // Navigate to action URL if present
    if (notification.metadata?.actionUrl) {
      router.push(notification.metadata.actionUrl);
    }
  };

  const handleToggleRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onToggleRead(notification.id);
  };

  return (
    <Card
      className={cn(
        'group relative transition-all duration-200 gap-2 py-3',
        'hover:shadow-md hover:border-border/80 hover:scale-[1.01] shadow-xs',
        notification.isRead
          ? 'bg-background/50 border-border/50'
          : 'bg-primary-50/40 dark:bg-primary-950/20 border-l-primary-500 border-border/60',
        notification.metadata?.actionUrl ? 'cursor-pointer' : ''
      )}
      onClick={notification.metadata?.actionUrl ? handleClick : undefined}
    >
      {/* Priority Icon - Top Right Corner */}
      {priorityIcon && (
        <div className="absolute top-2 right-2 z-10">{priorityIcon}</div>
      )}

      <CardHeader className="pb-0 px-4">
        <div className="flex gap-2">
          {/* Category Icon & Title */}
          <CardTitle className="text-sm truncate flex-1 flex gap-2 justify-start items-center flex-row">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center transition-all',
                notification.isRead
                  ? ' text-muted-foreground'
                  : 'text-foreground '
              )}
              style={{ borderRadius: notionRadius.default }}
            >
              {getCategoryIcon(notification.category)}
            </div>
            <span className="text-sm truncate pr-6">{notification.title}</span>
          </CardTitle>
        </div>

        {/* Toggle Read Button */}
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            className="z-20 h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/80"
            onClick={handleToggleRead}
            aria-label={notification.isRead ? 'Mark as unread' : 'Mark as read'}
          >
            {notification.isRead ? (
              <CircleCheck className="h-4 w-4 text-success" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </Button>
        </CardAction>
      </CardHeader>

      {/* Message */}
      <CardContent className="pt-0 px-4">
        <p className="text-sm text-muted-foreground/90 leading-snug line-clamp-2">
          {notification.message}
        </p>
      </CardContent>

      {/* Footer: Timestamp and Action */}
      <CardFooter className="pt-0 px-4 justify-between">
        <span className="text-xs text-muted-foreground/70 font-medium">
          {formatTimestamp(notification.createdAt)}
        </span>

        {notification.metadata?.actionUrl && (
          <span className="text-xs font-semibold text-primary">
            {notification.metadata.actionLabel || 'View'} →
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
