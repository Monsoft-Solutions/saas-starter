'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { appNav, navigationIndex } from '@/config/navigation';
import { resolveRoute } from '@/lib/navigation/resolve-route.util';

const appRouteLabels = Object.values(navigationIndex).reduce<
  Record<string, string>
>((labels, entry) => {
  if (entry.treeKey === appNav.key && !entry.item.external) {
    labels[entry.path] = entry.item.label;
  }
  return labels;
}, {});

interface BreadcrumbNavProps {
  className?: string;
}

export function BreadcrumbNav({ className }: BreadcrumbNavProps) {
  const pathname = usePathname();

  // Generate breadcrumb segments
  const segments = pathname.split('/').filter(Boolean);
  const appRootPath = resolveRoute('app.organization');

  // Build breadcrumb paths
  const breadcrumbs = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const label =
      appRouteLabels[path] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    return {
      path,
      label,
      isLast,
    };
  });

  // Don't show breadcrumbs for root dashboard
  if (pathname === appRootPath) {
    return null;
  }

  return (
    <nav
      className={cn(
        'flex items-center space-x-1 text-sm text-muted-foreground',
        className
      )}
    >
      {/* Home/Dashboard root */}
      <Link
        href={appRootPath}
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((breadcrumb) => (
        <div key={breadcrumb.path} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4" />
          {breadcrumb.isLast ? (
            <span className="font-medium text-foreground">
              {breadcrumb.label}
            </span>
          ) : (
            <Link
              href={breadcrumb.path}
              className="hover:text-foreground transition-colors"
            >
              {breadcrumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
