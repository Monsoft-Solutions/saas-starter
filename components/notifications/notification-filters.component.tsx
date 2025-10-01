'use client';

import {
  Bell,
  CreditCard,
  Lock,
  Package,
  Users,
  AlertCircle,
  Filter,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
} from '@/lib/types/notifications';

type NotificationFiltersProps = {
  activeCategory: NotificationCategory | 'all';
  onCategoryChange: (category: NotificationCategory | 'all') => void;
  readFilter: 'all' | 'unread' | 'read';
  onReadFilterChange: (filter: 'all' | 'unread' | 'read') => void;
};

/**
 * Category display configuration with labels and icons
 */
const categoryConfig: Record<
  NotificationCategory | 'all',
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  all: { label: 'All notifications', icon: Bell },
  system: { label: 'System', icon: Bell },
  security: { label: 'Security', icon: Lock },
  billing: { label: 'Billing', icon: CreditCard },
  team: { label: 'Team', icon: Users },
  activity: { label: 'Activity', icon: AlertCircle },
  product: { label: 'Product', icon: Package },
};

/**
 * NotificationFilters component
 * Provides filters for notification categories and read status
 */
export function NotificationFilters({
  activeCategory,
  onCategoryChange,
  readFilter,
  onReadFilterChange,
}: NotificationFiltersProps) {
  const ActiveIcon = categoryConfig[activeCategory].icon;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Category Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 border-dashed hover:bg-accent/50 transition-colors"
          >
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">
              {categoryConfig[activeCategory].label}
            </span>
            <div className="h-4 w-px bg-border" />
            <ActiveIcon className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            Filter by category
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onCategoryChange('all')}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span>All notifications</span>
            </div>
            {activeCategory === 'all' && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {NOTIFICATION_CATEGORIES.map((category) => {
            const Icon = categoryConfig[category].icon;
            return (
              <DropdownMenuItem
                key={category}
                onClick={() => onCategoryChange(category)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">
                    {categoryConfig[category].label}
                  </span>
                </div>
                {activeCategory === category && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Read Status Filter */}
      <ToggleGroup
        type="single"
        value={readFilter}
        onValueChange={(value: string) => {
          if (value) onReadFilterChange(value as 'all' | 'unread' | 'read');
        }}
        className="justify-start sm:justify-end"
      >
        <ToggleGroupItem
          value="all"
          aria-label="Show all notifications"
          className="h-9 px-3 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          All
        </ToggleGroupItem>
        <ToggleGroupItem
          value="unread"
          aria-label="Show unread notifications"
          className="h-9 px-3 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          Unread
        </ToggleGroupItem>
        <ToggleGroupItem
          value="read"
          aria-label="Show read notifications"
          className="h-9 px-3 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          Read
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
