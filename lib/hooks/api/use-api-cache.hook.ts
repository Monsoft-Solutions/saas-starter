/**
 * SWR Cache Management Utilities
 *
 * Provides utilities for managing SWR cache, including cache invalidation,
 * prefetching, and cache updates.
 *
 * @module lib/hooks/api/use-api-cache.hook
 */

import { useSWRConfig } from 'swr';
import { useCallback } from 'react';
import type { z } from 'zod';
import { apiRequest } from '@/lib/api/client.util';

/**
 * Route definition type (from routes.config.ts)
 */
type RouteDefinition<
  TRequest extends z.ZodTypeAny | undefined,
  TResponse extends z.ZodTypeAny,
> = {
  path: string | ((...args: string[]) => string);
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  requestSchema?: TRequest;
  querySchema?: z.ZodTypeAny;
  responseSchema: TResponse;
};

/**
 * Build cache key from route and parameters
 */
function buildCacheKey(
  route: RouteDefinition<any, any>,
  pathParams: string[] = [],
  queryParams?: Record<string, string | number | boolean | undefined>
): string {
  const path =
    typeof route.path === 'function' ? route.path(...pathParams) : route.path;

  if (queryParams) {
    const searchParams = new URLSearchParams(
      queryParams as Record<string, string>
    ).toString();
    return `${path}?${searchParams}`;
  }

  return path;
}

/**
 * Hook for managing SWR cache
 *
 * Provides utilities to:
 * - Invalidate specific cache keys
 * - Prefetch data
 * - Update cache optimistically
 * - Clear entire cache
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const cache = useApiCache();
 *
 *   // Invalidate a specific route
 *   const handleRefresh = () => {
 *     cache.invalidate(apiRoutes.notifications.list);
 *   };
 *
 *   // Prefetch data
 *   const handlePrefetch = () => {
 *     cache.prefetch(apiRoutes.users.current);
 *   };
 *
 *   // Update cache optimistically
 *   const handleUpdate = () => {
 *     cache.update(apiRoutes.notifications.list, (data) => ({
 *       ...data,
 *       notifications: [...data.notifications, newNotification],
 *     }));
 *   };
 *
 *   // Clear all cache
 *   const handleClearAll = () => {
 *     cache.clear();
 *   };
 * }
 * ```
 */
export function useApiCache() {
  const { mutate, cache } = useSWRConfig();

  /**
   * Invalidate and refetch data for a specific route
   */
  const invalidate = useCallback(
    async <TResponse extends z.ZodTypeAny>(
      route: RouteDefinition<undefined, TResponse> & { method: 'GET' },
      options?: {
        pathParams?: string[];
        queryParams?: Record<string, string | number | boolean | undefined>;
      }
    ) => {
      const key = buildCacheKey(
        route,
        options?.pathParams,
        options?.queryParams
      );
      await mutate(key);
    },
    [mutate]
  );

  /**
   * Invalidate multiple routes at once
   */
  const invalidateMultiple = useCallback(
    async (keys: string[]) => {
      await Promise.all(keys.map((key) => mutate(key)));
    },
    [mutate]
  );

  /**
   * Invalidate all cache keys matching a pattern
   */
  const invalidatePattern = useCallback(
    async (pattern: string | RegExp) => {
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      const keys = Array.from(cache.keys()).filter((key) =>
        regex.test(String(key))
      );
      await Promise.all(keys.map((key) => mutate(key)));
    },
    [cache, mutate]
  );

  /**
   * Prefetch data for a route
   */
  const prefetch = useCallback(
    async <TResponse extends z.ZodTypeAny>(
      route: RouteDefinition<undefined, TResponse> & { method: 'GET' },
      options?: {
        pathParams?: string[];
        queryParams?: Record<string, string | number | boolean | undefined>;
      }
    ) => {
      const key = buildCacheKey(
        route,
        options?.pathParams,
        options?.queryParams
      );
      // Fetch data and populate cache
      await mutate(
        key,
        apiRequest(route, {
          pathParams: options?.pathParams,
          queryParams: options?.queryParams,
        })
      );
    },
    [mutate]
  );

  /**
   * Update cache for a route without revalidating
   */
  const update = useCallback(
    async <TResponse extends z.ZodTypeAny>(
      route: RouteDefinition<undefined, TResponse> & { method: 'GET' },
      updater: (current: z.infer<TResponse>) => z.infer<TResponse>,
      options?: {
        pathParams?: string[];
        queryParams?: Record<string, string | number | boolean | undefined>;
        revalidate?: boolean;
      }
    ) => {
      const key = buildCacheKey(
        route,
        options?.pathParams,
        options?.queryParams
      );
      await mutate(key, updater, { revalidate: options?.revalidate ?? false });
    },
    [mutate]
  );

  /**
   * Set cache data directly without revalidating
   */
  const set = useCallback(
    async <TResponse extends z.ZodTypeAny>(
      route: RouteDefinition<undefined, TResponse> & { method: 'GET' },
      data: z.infer<TResponse>,
      options?: {
        pathParams?: string[];
        queryParams?: Record<string, string | number | boolean | undefined>;
        revalidate?: boolean;
      }
    ) => {
      const key = buildCacheKey(
        route,
        options?.pathParams,
        options?.queryParams
      );
      await mutate(key, data, { revalidate: options?.revalidate ?? false });
    },
    [mutate]
  );

  /**
   * Get current cache data without triggering a fetch
   */
  const get = useCallback(
    <TResponse extends z.ZodTypeAny>(
      route: RouteDefinition<undefined, TResponse> & { method: 'GET' },
      options?: {
        pathParams?: string[];
        queryParams?: Record<string, string | number | boolean | undefined>;
      }
    ): z.infer<TResponse> | undefined => {
      const key = buildCacheKey(
        route,
        options?.pathParams,
        options?.queryParams
      );
      return cache.get(key)?.data;
    },
    [cache]
  );

  /**
   * Clear entire SWR cache
   */
  const clear = useCallback(async () => {
    // Clear all keys from cache
    Array.from(cache.keys()).forEach((key) => {
      mutate(key, undefined, { revalidate: false });
    });
  }, [cache, mutate]);

  /**
   * Check if a route is currently cached
   */
  const has = useCallback(
    <TResponse extends z.ZodTypeAny>(
      route: RouteDefinition<undefined, TResponse> & { method: 'GET' },
      options?: {
        pathParams?: string[];
        queryParams?: Record<string, string | number | boolean | undefined>;
      }
    ): boolean => {
      const key = buildCacheKey(
        route,
        options?.pathParams,
        options?.queryParams
      );
      // Check if key exists in cache
      return Array.from(cache.keys()).some((k) => k === key);
    },
    [cache]
  );

  return {
    invalidate,
    invalidateMultiple,
    invalidatePattern,
    prefetch,
    update,
    set,
    get,
    clear,
    has,
  };
}

/**
 * Utility function to build cache keys for external use
 *
 * @example
 * ```typescript
 * const key = getCacheKey(apiRoutes.notifications.list, {
 *   queryParams: { limit: 10 }
 * });
 * ```
 */
export function getCacheKey<TResponse extends z.ZodTypeAny>(
  route: RouteDefinition<undefined, TResponse> & { method: 'GET' },
  options?: {
    pathParams?: string[];
    queryParams?: Record<string, string | number | boolean | undefined>;
  }
): string {
  return buildCacheKey(route, options?.pathParams, options?.queryParams);
}
