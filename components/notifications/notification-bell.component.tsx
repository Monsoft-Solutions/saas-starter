'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/design-system';
import { useNotificationContext } from './notification-provider.component';
import { NotificationCenter } from './notification-center.component';

/**
 * NotificationBell component
 * Displays a bell icon with badge count and opens notification center
 */
export function NotificationBell() {
  const { unreadCount } = useNotificationContext();
  const [open, setOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  // Pulse animation for new notifications
  useEffect(() => {
    if (unreadCount > 0) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  // Close popover on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell
            className={cn('h-5 w-5', isPulsing && 'animate-pulse text-primary')}
          />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                'absolute -right-1 -top-1 h-5 min-w-[20px] px-1 text-xs flex items-center justify-center',
                isPulsing && 'animate-pulse'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[400px] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <NotificationCenter />
      </PopoverContent>
    </Popover>
  );
}
