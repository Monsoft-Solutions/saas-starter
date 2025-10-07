'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminNav } from '@/config/navigation';
import { filterNavigationItems } from '@/lib/navigation/filter-navigation-items.util';
import { resolveRoute } from '@/lib/navigation/resolve-route.util';

interface AdminNavProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * Admin navigation sidebar.
 * Displays admin panel navigation items with active state and responsive behavior.
 */
export function AdminNav({
  collapsed = false,
  onToggleCollapse,
}: AdminNavProps) {
  const pathname = usePathname();
  const navigationItems = filterNavigationItems(adminNav.items);

  return (
    <aside
      className={cn(
        'border-r bg-muted/20 min-h-[calc(100vh-4rem)] transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-foreground">Admin Panel</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
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
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {Icon && <Icon className={cn('h-4 w-4', !collapsed && 'mr-2')} />}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
