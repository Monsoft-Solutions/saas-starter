'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { adminNav } from '@/config/navigation';
import { filterNavigationItems } from '@/lib/navigation/filter-navigation-items.util';
import { resolveRoute } from '@/lib/navigation/resolve-route.util';

/**
 * Admin navigation sidebar.
 * Displays admin panel navigation items with active state.
 */
export function AdminNav() {
  const pathname = usePathname();
  const navigationItems = filterNavigationItems(adminNav.items);

  return (
    <aside className="w-64 border-r bg-muted/20 min-h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-1">
        {navigationItems.map((item) => {
          if (item.external) {
            return null;
          }

          const href = resolveRoute(item.key);
          const Icon = item.icon;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={item.key}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
