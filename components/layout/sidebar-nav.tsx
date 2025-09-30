'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Settings,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Loader2,
  LogOut,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/design-system';
import { notionSpacing } from '@/lib/design-system';
import { appNav } from '@/config/navigation';
import { resolveRoute } from '@/lib/navigation/resolve-route.util';
import { filterNavigationItems } from '@/lib/navigation/filter-navigation-items.util';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { signOut } from '@/app/(login)/actions';
import type { User } from '@/lib/db/schemas';

/**
 * Fetches the authenticated user record from the session-backed API endpoint.
 */
const userFetcher = async (url: string): Promise<User> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Unable to load user profile.');
  }

  return (await response.json()) as User;
};

/**
 * Derives the initials to display in the avatar fallback from the user profile.
 */
function getUserInitials(user?: User | null) {
  if (!user) {
    return 'U';
  }

  const source = user.name || user.email || 'User';
  const initials = source
    .split(' ')
    .map((segment) => segment.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return initials || 'U';
}

/**
 * Resolves the preferred display name for the authenticated user.
 */
function getUserDisplayName(user?: User | null) {
  if (!user) {
    return 'Unnamed user';
  }

  return user.name || user.email || 'Unnamed user';
}

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
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [isSigningOut, startSignOutTransition] = useTransition();
  const navigationItems = filterNavigationItems(appNav.items);
  const { data: user } = useSWR<User>('/api/user', userFetcher);

  const userInitials = useMemo(() => getUserInitials(user), [user]);
  const userDisplayName = useMemo(() => getUserDisplayName(user), [user]);
  const userEmail = user?.email || 'No email available';

  const handleSignOut = () => {
    if (isSigningOut) {
      return;
    }

    startSignOutTransition(async () => {
      try {
        await signOut();
        router.push('/sign-in');
      } catch (error) {
        console.error('Failed to sign out user:', error);
      }
    });
  };

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
      <div
        className="border-t"
        style={{
          padding: notionSpacing.sidebarPadding,
        }}
      >
        <div
          className={cn(
            'flex items-center',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && (
            <div className="text-xs text-muted-foreground">Dashboard v1.0</div>
          )}
          <ThemeToggle />
        </div>

        <div className={cn('mt-4', collapsed ? 'flex justify-center' : '')}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full h-auto px-2 py-2',
                  collapsed
                    ? 'flex items-center justify-center'
                    : 'flex items-center justify-start gap-3'
                )}
              >
                <Avatar className="h-10 w-10">
                  {user?.image ? (
                    <AvatarImage src={user.image} alt={userDisplayName} />
                  ) : (
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  )}
                </Avatar>
                {!collapsed && (
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-foreground">
                      {userDisplayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {userEmail}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {user?.image ? (
                      <AvatarImage src={user.image} alt={userDisplayName} />
                    ) : (
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {userDisplayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {userEmail}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/app/general" className="flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  Account settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={handleSignOut}
                disabled={isSigningOut}
              >
                <span className="flex items-center gap-2">
                  {isSigningOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  {isSigningOut ? 'Signing out...' : 'Sign out'}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
