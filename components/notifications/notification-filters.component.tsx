'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
} from '@/lib/types/notifications';

type NotificationFiltersProps = {
  activeCategory: NotificationCategory | 'all';
  onCategoryChange: (category: NotificationCategory | 'all') => void;
};

/**
 * Category display labels
 */
const categoryLabels: Record<NotificationCategory | 'all', string> = {
  all: 'All',
  system: 'System',
  security: 'Security',
  billing: 'Billing',
  team: 'Team',
  activity: 'Activity',
  product: 'Product',
};

/**
 * NotificationFilters component
 * Provides category filter tabs for notifications
 */
export function NotificationFilters({
  activeCategory,
  onCategoryChange,
}: NotificationFiltersProps) {
  return (
    <Tabs
      value={activeCategory}
      onValueChange={(value) =>
        onCategoryChange(value as NotificationCategory | 'all')
      }
      className="w-full"
    >
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="all" className="text-xs">
          {categoryLabels.all}
        </TabsTrigger>
        {NOTIFICATION_CATEGORIES.map((category) => (
          <TabsTrigger key={category} value={category} className="text-xs">
            {categoryLabels[category]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
