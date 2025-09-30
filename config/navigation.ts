/**
 * Central registry for marketing and app navigation metadata plus derived helpers.
 */
import {
  Home,
  Users,
  Settings,
  Activity,
  Shield,
  FileText,
  Mail,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import type { NavigationItem, NavigationTree, QuickAction } from '@/lib/types';

export const APP_BASE_PATH = '/app';

const marketingItems: NavigationItem[] = [
  {
    key: 'marketing.home',
    slug: '',
    label: 'Home',
    description: 'Overview of the platform',
    icon: Home,
  },
  {
    key: 'marketing.features',
    slug: 'features',
    label: 'Features',
    description: 'Deep dive into every core capability',
    icon: Sparkles,
  },
  {
    key: 'marketing.pricing',
    slug: 'pricing',
    label: 'Pricing',
    description: 'Compare plans and billing options',
    icon: FileText,
  },
  {
    key: 'marketing.contact',
    slug: 'mailto:hello@example.com',
    label: 'Contact',
    description: 'Reach out to our support team',
    icon: Mail,
    external: true,
  },
];

const appItems: NavigationItem[] = [
  {
    key: 'app.organization',
    slug: '',
    label: 'Organization',
    description: 'Manage organization members and invitations',
    icon: Users,
  },
  {
    key: 'app.general',
    slug: 'general',
    label: 'General',
    description: 'Update workspace preferences',
    icon: Settings,
  },
  {
    key: 'app.activity',
    slug: 'activity',
    label: 'Activity',
    description: 'Review recent account actions',
    icon: Activity,
  },
  {
    key: 'app.security',
    slug: 'security',
    label: 'Security',
    description: 'Manage security and authentication options',
    icon: Shield,
  },
  {
    key: 'app.billing',
    slug: 'billing',
    label: 'Billing',
    description: 'Manage your subscription and billing settings',
    icon: CreditCard,
  },
];

export const marketingNav: NavigationTree = {
  key: 'marketing',
  basePath: '/',
  items: marketingItems,
};

export const appNav: NavigationTree = {
  key: 'app',
  basePath: APP_BASE_PATH,
  items: appItems,
};

export const quickActions: QuickAction[] = [
  {
    key: 'action.app.organization',
    label: 'Open Organization',
    description: 'Manage organization members and invitations',
    category: 'Navigation',
    target: 'app.organization',
    icon: Users,
  },
  {
    key: 'action.app.general',
    label: 'Open General Settings',
    description: 'Update workspace preferences',
    category: 'Navigation',
    target: 'app.general',
    icon: Settings,
  },
  {
    key: 'action.app.activity',
    label: 'Open Activity Log',
    description: 'Review recent account actions',
    category: 'Navigation',
    target: 'app.activity',
    icon: Activity,
  },
  {
    key: 'action.app.security',
    label: 'Open Security',
    description: 'Manage security and authentication options',
    category: 'Navigation',
    target: 'app.security',
    icon: Shield,
  },
  {
    key: 'action.app.billing',
    label: 'Open Billing',
    description: 'Manage your subscription and billing settings',
    category: 'Navigation',
    target: 'app.billing',
    icon: CreditCard,
  },
];

export type NavigationIndexEntry = {
  treeKey: string;
  item: NavigationItem;
  path: string;
};

/**
 * All navigation trees; useful when rendering headers or aggregating metadata.
 */
export const navigationTrees: readonly NavigationTree[] = [
  marketingNav,
  appNav,
];

/**
 * Lookup table keyed by navigation item key for fast path resolution.
 */
export const navigationIndex = buildNavigationIndex(navigationTrees);

/**
 * Lists internal app routes that must be considered protected by auth-aware middleware.
 */
export const appProtectedRoutePrefixes = buildProtectedRoutePrefixes(appNav);

function buildNavigationIndex(
  trees: readonly NavigationTree[]
): Record<string, NavigationIndexEntry> {
  const index: Record<string, NavigationIndexEntry> = {};

  trees.forEach((tree) => {
    const basePath = sanitizeBasePath(tree.basePath);
    const initialParent = basePath || '/';

    traverse(tree.items, initialParent, tree.key);

    function traverse(
      items: NavigationItem[],
      parentPath: string,
      treeKey: string
    ) {
      items.forEach((item) => {
        const path = resolveItemPath(parentPath, item);

        index[item.key] = {
          treeKey,
          item,
          path,
        };

        if (item.children?.length) {
          traverse(item.children, path, treeKey);
        }
      });
    }
  });

  return index;
}

function sanitizeBasePath(value: string): string {
  if (!value || value === '/') {
    return '';
  }

  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function resolveItemPath(parentPath: string, item: NavigationItem): string {
  if (item.external) {
    return item.slug;
  }

  if (!item.slug) {
    return parentPath || '/';
  }

  if (!parentPath || parentPath === '/') {
    return `/${item.slug}`;
  }

  return `${parentPath}/${item.slug}`;
}

/**
 * Computes the set of app navigation paths that should be guarded by authentication.
 */
function buildProtectedRoutePrefixes(tree: NavigationTree): string[] {
  const prefixes = new Set<string>();
  const basePath = sanitizeBasePath(tree.basePath);
  const normalizedBase = basePath || '/';

  if (normalizedBase !== '/') {
    prefixes.add(normalizedBase);
  }

  const traverse = (items: NavigationItem[], parentPath: string) => {
    items.forEach((item) => {
      if (item.external) {
        return;
      }

      const path = resolveItemPath(parentPath, item);

      if (path.startsWith('/') && path !== '/') {
        prefixes.add(path);
      }

      if (item.children?.length) {
        traverse(item.children, path);
      }
    });
  };

  traverse(tree.items, normalizedBase);

  return Array.from(prefixes);
}
