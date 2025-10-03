'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, HelpCircle } from 'lucide-react';
import { BreadcrumbNav } from './breadcrumb-nav';
import { NotificationBell } from '@/components/notifications/notification-bell.component';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  onSearchClick?: () => void;
  showSearch?: boolean;
  showNotifications?: boolean;
  showHelp?: boolean;
  badge?: {
    text: string;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  };
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  children,
  className,
  onSearchClick,
  showSearch = true,
  showNotifications = false,
  showHelp = false,
  badge,
  actions,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav />

      {/* Header Content */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          {title && (
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              {badge && (
                <Badge variant={badge.variant || 'secondary'}>
                  {badge.text}
                </Badge>
              )}
            </div>
          )}
          {description && (
            <p className="text-sm text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Help button */}
          {showHelp && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="sr-only">Help</span>
            </Button>
          )}

          {/* Notifications button */}
          {showNotifications && <NotificationBell />}

          {/* Quick search button */}
          {showSearch && onSearchClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSearchClick}
              className="relative hidden sm:flex"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
              <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          )}

          {/* Mobile search button */}
          {showSearch && onSearchClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSearchClick}
              className="sm:hidden"
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          )}

          {/* Custom actions */}
          {actions}

          {/* Additional actions from children (for backward compatibility) */}
          {children}
        </div>
      </div>
    </div>
  );
}
