import type { NavigationItem } from '@/lib/types';

export type FeatureFlagMap = Record<string, boolean>;

/**
 * Produces a filtered navigation tree that respects hidden flags and feature toggles.
 */
export function filterNavigationItems(
  items: NavigationItem[],
  featureFlags: FeatureFlagMap = {}
): NavigationItem[] {
  return items.reduce<NavigationItem[]>((acc, item) => {
    if (item.hidden) {
      return acc;
    }

    if (item.featureFlag && !featureFlags[item.featureFlag]) {
      return acc;
    }

    const children = item.children
      ? filterNavigationItems(item.children, featureFlags)
      : undefined;

    const nextItem: NavigationItem = {
      ...item,
      ...(children ? { children } : {}),
    };

    if (!children?.length) {
      nextItem.children = undefined;
    }

    acc.push(nextItem);
    return acc;
  }, []);
}
