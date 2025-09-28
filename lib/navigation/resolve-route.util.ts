import { navigationIndex, NavigationIndexEntry } from '@/config/navigation';

/**
 * Resolves a navigation key to its metadata or throws if the key is unknown.
 */
export function getNavigationEntry(key: string): NavigationIndexEntry {
  const entry = navigationIndex[key];

  if (!entry) {
    throw new Error(`Unknown navigation key: ${key}`);
  }

  return entry;
}

/**
 * Safely resolves a navigation key to its metadata, returning null on failure.
 */
export function tryGetNavigationEntry(
  key: string
): NavigationIndexEntry | null {
  return navigationIndex[key] ?? null;
}

/**
 * Returns the fully-qualified path for a navigation key or a fallback if provided.
 */
export function resolveRoute(key: string, fallback?: string): string {
  const entry = tryGetNavigationEntry(key);

  if (!entry) {
    if (fallback) {
      return fallback;
    }

    throw new Error(`Unknown navigation key: ${key}`);
  }

  return entry.path;
}

/**
 * Returns the resolved route for a navigation key, or null if the key is unknown.
 */
export function tryResolveRoute(key: string): string | null {
  const entry = tryGetNavigationEntry(key);

  return entry ? entry.path : null;
}
