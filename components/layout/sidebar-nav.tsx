'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Settings,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/design-system';
import { appNav } from '@/config/navigation';
import { resolveRoute } from '@/lib/navigation/resolve-route.util';
import { filterNavigationItems } from '@/lib/navigation/filter-navigation-items.util';

interface SidebarNavProps {
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SidebarNav({
  className,
  collapsed = false,
  onToggleCollapse,
}: SidebarNavProps) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(true);
  const navigationItems = filterNavigationItems(appNav.items);

  return (
    <div className={cn('flex flex-col h-full bg-muted/20 border-r', className)}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-foreground">Workspace</h2>
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
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-2">
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start h-8 px-2',
                  collapsed && 'justify-center px-0'
                )}
              >
                {collapsed ? (
                  <Settings className="h-4 w-4" />
                ) : (
                  <>
                    {settingsOpen ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    Settings
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              {navigationItems.map((item) => {
                if (item.external) {
                  return null;
                }

                const href = resolveRoute(item.key);
                const Icon = item.icon;
                const isActive = pathname === href;
                return (
                  <Button
                    key={item.key}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start h-8 px-2 text-sm',
                      collapsed && 'justify-center px-0',
                      !collapsed && 'ml-6',
                      isActive && 'bg-accent text-accent-foreground'
                    )}
                    asChild
                  >
                    <Link href={href}>
                      {Icon && (
                        <Icon className={cn('h-4 w-4', !collapsed && 'mr-2')} />
                      )}
                      {!collapsed && item.label}
                    </Link>
                  </Button>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Sidebar Footer */}
      {!collapsed && (
        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground">Dashboard v1.0</div>
        </div>
      )}
    </div>
  );
}
