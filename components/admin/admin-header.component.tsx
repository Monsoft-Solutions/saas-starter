'use client';

import Link from 'next/link';
import { Shield, LogOut, User, ArrowLeft, Menu, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { authClient } from '@/lib/auth/auth-client';
import { useAdminAccess } from '@/components/admin/shared/admin-access.provider';

type AdminHeaderProps = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: 'admin' | 'super-admin';
  };
  onMobileMenuToggle?: () => void;
};

/**
 * Admin panel header with user dropdown and exit admin mode.
 */
export function AdminHeader({ user, onMobileMenuToggle }: AdminHeaderProps) {
  const { isSuperAdmin } = useAdminAccess();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/sign-in';
        },
      },
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile Menu Button */}
          {onMobileMenuToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
              className="lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}

          {/* Logo and Admin Badge */}
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-3 text-foreground hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight">
                    Admin Panel
                  </span>
                  {!isSuperAdmin && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] gap-1 px-2 py-0.5"
                    >
                      <Eye className="h-2.5 w-2.5" />
                      Read-Only
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Exit Admin Mode Button */}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Link href="/app">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Exit Admin Mode</span>
              </Link>
            </Button>

            <ThemeToggle />

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="hidden md:inline max-w-[150px] truncate">
                    {user.name || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name || 'Admin User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/app" className="cursor-pointer">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return to App
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
