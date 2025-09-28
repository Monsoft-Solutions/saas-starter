import Link from 'next/link';
import { PropsWithChildren } from 'react';
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

function MarketingHeader() {
  const visibleItems = filterNavigationItems(marketingNav.items);
  const homeItem = visibleItems.find((item) => item.key === 'marketing.home');
  const homeHref = homeItem ? getNavigationHref(homeItem) : '/';
  const navItems = visibleItems.filter((item) => item.key !== 'marketing.home');
  const pricingItem = navItems.find((item) => item.key === 'marketing.pricing');

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href={homeHref}
            className="flex items-center gap-2 text-foreground"
          >
            <CircleIcon className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">ACME</span>
          </Link>
          {navItems.length > 0 && (
            <nav className="hidden items-center gap-4 text-sm font-medium md:flex">
              {navItems.map((item) => {
                if (item.children && item.children.length > 0) {
                  return (
                    <DropdownMenu key={item.key}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {item.label}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {item.children.map((child) => (
                          <DropdownMenuItem key={child.key} asChild>
                            <MarketingAnchor item={child} className="w-full" />
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
                    className="text-muted-foreground transition hover:text-foreground"
                  />
                );
              })}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          {pricingItem && (
            <MarketingAnchor
              item={pricingItem}
              className="text-muted-foreground transition hover:text-foreground md:hidden"
            />
          )}
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function MarketingFooter() {
  const visibleItems = filterNavigationItems(marketingNav.items);
  const footerItems = visibleItems
    .flatMap((item) => {
      if (item.key === 'marketing.home') {
        return item.children ?? [];
      }

      return [item, ...(item.children ?? [])];
    })
    .filter(
      (item, index, array) =>
        array.findIndex((candidate) => candidate.key === item.key) === index
    );
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40">
      <div className="container flex h-16 flex-col items-center justify-center gap-2 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <span>&copy; {currentYear} ACME Inc.</span>
        {footerItems.length > 0 && (
          <nav className="flex items-center gap-4">
            {footerItems.map((item) => (
              <MarketingAnchor
                key={item.key}
                item={item}
                className="hover:text-foreground"
              />
            ))}
          </nav>
        )}
      </div>
    </footer>
  );
}

export default function MarketingLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
