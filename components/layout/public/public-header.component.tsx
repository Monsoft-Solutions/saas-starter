'use client';

import Link from 'next/link';
import { CircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { marketingNav } from '@/config/navigation';
import { filterNavigationItems } from '@/lib/navigation/filter-navigation-items.util';
import { resolveRoute } from '@/lib/navigation/resolve-route.util';
import type { NavigationItem } from '@/lib/types';

type MarketingLinkProps = {
  item: NavigationItem;
  className?: string;
};

function getNavigationHref(item: NavigationItem) {
  return item.external ? item.slug : resolveRoute(item.key);
}

function MarketingAnchor({ item, className }: MarketingLinkProps) {
  const href = getNavigationHref(item);

  if (item.external) {
    const isMailLink = href.startsWith('mailto:');
    const externalProps = !isMailLink
      ? { target: '_blank', rel: 'noreferrer' as const }
      : {};

    return (
      <a href={href} className={className} {...externalProps}>
        {item.label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {item.label}
    </Link>
  );
}

export function PublicHeader() {
  const visibleItems = filterNavigationItems(marketingNav.items);
  const homeItem = visibleItems.find((item) => item.key === 'marketing.home');
  const homeHref = homeItem ? getNavigationHref(homeItem) : '/';
  const navItems = visibleItems.filter((item) => item.key !== 'marketing.home');
  const pricingItem = navItems.find((item) => item.key === 'marketing.pricing');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link
              href={homeHref}
              className="flex items-center gap-3 text-foreground hover:opacity-80 transition-opacity"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <CircleIcon className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight">ACME</span>
            </Link>

            {/* Navigation */}
            {navItems.length > 0 && (
              <nav className="hidden items-center gap-1 md:flex">
                {navItems.map((item) => {
                  if (item.children && item.children.length > 0) {
                    return (
                      <DropdownMenu key={item.key}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors px-3 py-2 h-auto"
                          >
                            {item.label}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="mt-2">
                          {item.children.map((child) => (
                            <DropdownMenuItem key={child.key} asChild>
                              <MarketingAnchor
                                item={child}
                                className="w-full"
                              />
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }

                  return (
                    <MarketingAnchor
                      key={item.key}
                      item={item}
                      className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                    />
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {pricingItem && (
              <MarketingAnchor
                item={pricingItem}
                className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors md:hidden"
              />
            )}

            <ThemeToggle />

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors px-3 py-2 h-auto"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>

            <Button
              asChild
              size="sm"
              className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all px-4 py-2 h-auto font-medium"
            >
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
