/**
 * Type-safe SWR hook factory for API requests
 *
 * This module provides generic SWR hooks with full type inference from API route definitions.
 * It wraps the base API client with SWR's caching, revalidation, and mutation capabilities.
 *
 * @module lib/hooks/api/use-api.hook
 */

import useSWR, { type SWRConfiguration, type SWRResponse } from 'swr';
import useSWRMutation, {
  type SWRMutationConfiguration,
  type SWRMutationResponse,
} from 'swr/mutation';
import { z } from 'zod';
import { apiRequest } from '@/lib/api/client.util';
import { ApiError } from '@/lib/types/api/api-error.type';

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
 * Configuration options for useApiQuery hook
 */
type UseApiQueryConfig<TResponse extends z.ZodTypeAny> = {
  /**
   * Query parameters for GET requests
   */
  queryParams?: Record<string, string | number | boolean | undefined>;

  /**
   * Path parameters for dynamic routes
   */
  pathParams?: string[];

  /**
   * Enable/disable the query
   * When false, the query will not execute
   * @default true
   */
  enabled?: boolean;

  /**
   * SWR configuration options
   */
  swrConfig?: SWRConfiguration<z.infer<TResponse>, ApiError>;
};

/**
 * Configuration options for useApiMutation hook
 */
type UseApiMutationConfig<
  TRequest extends z.ZodTypeAny | undefined,
  TResponse extends z.ZodTypeAny,
> = {
  /**
   * Path parameters for dynamic routes
   */
  pathParams?: string[];

  /**
   * Callback invoked on successful mutation
   */
  onSuccess?: (data: z.infer<TResponse>) => void | Promise<void>;

  /**
   * Callback invoked on mutation error
   */
  onError?: (error: ApiError) => void;

  /**
   * Keys to revalidate after successful mutation
   */
  revalidateKeys?: string[];

  /**
   * Enable optimistic updates
   * Provide a function that returns the optimistic data to update
   */
  optimisticData?: (
    currentData: unknown,
    newData: TRequest extends z.ZodTypeAny ? z.infer<TRequest> : never
  ) => unknown;

  /**
   * Keys to optimistically update before mutation
   * Works in conjunction with optimisticData
   */
  optimisticKeys?: string[];

  /**
   * Whether to rollback optimistic updates on error
   * @default true
   */
  rollbackOnError?: boolean;

  /**
   * SWR mutation configuration options
   */
  swrConfig?: SWRMutationConfiguration<
    z.infer<TResponse>,
    ApiError,
    string,
    TRequest extends z.ZodTypeAny ? z.infer<TRequest> : never
  >;
};

/**
 * Type-safe SWR hook for GET requests with automatic caching and revalidation
 *
 * @param route - Route definition from apiRoutes registry
 * @param config - Query and SWR configuration options
 * @returns SWR response with typed data and error
 *
 * @example
 * ```typescript
 * // Basic usage
 * const { data, error, isLoading } = useApiQuery(apiRoutes.notifications.list);
 *
 * // With query parameters
 * const { data } = useApiQuery(apiRoutes.notifications.list, {
 *   queryParams: { limit: 10, offset: 0 },
 * });
 *
 * // With path parameters
 * const { data } = useApiQuery(apiRoutes.notifications.get, {
 *   pathParams: ['notification-123'],
 * });
 *
 * // Conditional fetching
 * const { data } = useApiQuery(apiRoutes.users.current, {
 *   enabled: !!userId, // Only fetch when userId is available
 * });
 *
 * // With SWR config
 * const { data } = useApiQuery(apiRoutes.users.current, {
 *   swrConfig: {
 *     revalidateOnFocus: false,
 *     refreshInterval: 30000,
 *   },
 * });
 * ```
 */
export function useApiQuery<TResponse extends z.ZodTypeAny>(
  route: RouteDefinition<undefined, TResponse> & { method: 'GET' },
  config?: UseApiQueryConfig<TResponse>
): SWRResponse<z.infer<TResponse>, ApiError> {
  const {
    queryParams,
    pathParams = [],
    enabled = true,
    swrConfig,
  } = config || {};

  // Build SWR key
  const path =
    typeof route.path === 'function' ? route.path(...pathParams) : route.path;

  // Create key with query params for cache invalidation
  const key = queryParams
    ? `${path}?${new URLSearchParams(queryParams as Record<string, string>).toString()}`
    : path;

  // Use null key to disable the query when enabled is false
  const swrKey = enabled ? key : null;

  return useSWR<z.infer<TResponse>, ApiError>(
    swrKey,
    () => apiRequest(route, { queryParams, pathParams }),
    {
      // User overrides
      ...swrConfig,
    }
  );
}

/**
 * Type-safe SWR mutation hook for POST, PUT, PATCH, DELETE requests
 *
 * @param route - Route definition from apiRoutes registry
 * @param config - Mutation configuration options
 * @returns SWR mutation response with typed trigger function
 *
 * @example
 * ```typescript
 * // Basic POST request
 * const { trigger, isMutating } = useApiMutation(
 *   apiRoutes.notifications.markAllRead
 * );
 *
 * const handleMarkAllRead = async () => {
 *   try {
 *     await trigger({});
 *   } catch (error) {
 *     console.error('Failed:', error);
 *   }
 * };
 *
 * // PATCH request with path params and revalidation
 * const { trigger: updateNotification } = useApiMutation(
 *   apiRoutes.notifications.update,
 *   {
 *     pathParams: [notificationId],
 *     onSuccess: () => console.log('Updated!'),
 *     revalidateKeys: ['/api/notifications'],
 *   }
 * );
 *
 * await updateNotification({ action: 'mark_read' });
 *
 * // With optimistic updates
 * const { trigger: markAsRead } = useApiMutation(
 *   apiRoutes.notifications.update,
 *   {
 *     pathParams: [notificationId],
 *     optimisticKeys: ['/api/notifications'],
 *     optimisticData: (currentData, newData) => {
 *       // Update the notification in the list immediately
 *       if (!currentData || !Array.isArray(currentData.notifications)) {
 *         return currentData;
 *       }
 *       return {
 *         ...currentData,
 *         notifications: currentData.notifications.map((n) =>
 *           n.id === notificationId ? { ...n, isRead: true } : n
 *         ),
 *       };
 *     },
 *     rollbackOnError: true,
 *   }
 * );
 * ```
 */
export function useApiMutation<
  TRequest extends z.ZodTypeAny | undefined,
  TResponse extends z.ZodTypeAny,
>(
  route: RouteDefinition<TRequest, TResponse> & {
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  },
  config?: UseApiMutationConfig<TRequest, TResponse>
): SWRMutationResponse<
  z.infer<TResponse>,
  ApiError,
  string,
  TRequest extends z.ZodTypeAny ? z.infer<TRequest> : never
> {
  const {
    pathParams = [],
    onSuccess,
    onError,
    revalidateKeys = [],
    optimisticData,
    optimisticKeys = [],
    rollbackOnError = true,
    swrConfig,
  } = config || {};

  // Build SWR key
  const path =
    typeof route.path === 'function' ? route.path(...pathParams) : route.path;

  return useSWRMutation<
    z.infer<TResponse>,
    ApiError,
    string,
    TRequest extends z.ZodTypeAny ? z.infer<TRequest> : never
  >(
    path,
    async (
      _key,
      {
        arg,
      }: { arg: TRequest extends z.ZodTypeAny ? z.infer<TRequest> : never }
    ) => {
      // Import mutate for optimistic updates
      const { mutate } = await import('swr');

      // Store previous data for rollback
      const previousDataMap = new Map<string, unknown>();

      try {
        // Perform optimistic updates
        if (optimisticData && optimisticKeys.length > 0) {
          for (const key of optimisticKeys) {
            // Get current data
            const currentData = await mutate(key, undefined, false);
            previousDataMap.set(key, currentData);

            // Set optimistic data
            await mutate(key, optimisticData(currentData, arg), false);
          }
        }

        // Make actual API request
        const result = await apiRequest(route, {
          data: arg,
          pathParams,
        });

        // Call success callback
        if (onSuccess) {
          await onSuccess(result);
        }

        return result;
      } catch (error) {
        // Rollback optimistic updates on error
        if (rollbackOnError && previousDataMap.size > 0) {
          for (const [key, previousData] of previousDataMap) {
            await mutate(key, previousData, false);
          }
        }

        // Call error callback
        if (onError && error instanceof ApiError) {
          onError(error);
        }
        throw error;
      }
    },
    {
      // Revalidate specified keys after successful mutation
      onSuccess: async (data, key, config) => {
        const { mutate } = await import('swr');

        // Revalidate specified keys
        for (const revalidateKey of revalidateKeys) {
          await mutate(revalidateKey);
        }

        // Call user's onSuccess if provided
        if (swrConfig?.onSuccess) {
          swrConfig.onSuccess(data, key, config);
        }
      },
      // Pass through user config
      ...swrConfig,
    }
  );
}

/**
 * Type-safe SWR hook for POST requests (convenience wrapper)
 *
 * @example
 * ```typescript
 * const { trigger, isMutating } = useApiPost(
 *   apiRoutes.notifications.markAllRead,
 *   {
 *     onSuccess: () => console.log('Marked all as read'),
 *     revalidateKeys: ['/api/notifications'],
 *   }
 * );
 * ```
 */
export function useApiPost<
  TRequest extends z.ZodTypeAny,
  TResponse extends z.ZodTypeAny,
>(
  route: RouteDefinition<TRequest, TResponse> & { method: 'POST' },
  config?: UseApiMutationConfig<TRequest, TResponse>
) {
  return useApiMutation(route, config);
}

/**
 * Type-safe SWR hook for PATCH requests (convenience wrapper)
 *
 * @example
 * ```typescript
 * const { trigger: updateNotification } = useApiPatch(
 *   apiRoutes.notifications.update,
 *   {
 *     pathParams: [notificationId],
 *     onSuccess: () => console.log('Updated'),
 *   }
 * );
 * ```
 */
export function useApiPatch<
  TRequest extends z.ZodTypeAny,
  TResponse extends z.ZodTypeAny,
>(
  route: RouteDefinition<TRequest, TResponse> & { method: 'PATCH' },
  config?: UseApiMutationConfig<TRequest, TResponse>
) {
  return useApiMutation(route, config);
}

/**
 * Type-safe SWR hook for DELETE requests (convenience wrapper)
 *
 * @example
 * ```typescript
 * const { trigger: deleteNotification } = useApiDelete(
 *   apiRoutes.notifications.delete,
 *   {
 *     pathParams: [notificationId],
 *     onSuccess: () => console.log('Deleted'),
 *   }
 * );
 * ```
 */
export function useApiDelete<TResponse extends z.ZodTypeAny>(
  route: RouteDefinition<undefined, TResponse> & { method: 'DELETE' },
  config?: UseApiMutationConfig<undefined, TResponse>
) {
  return useApiMutation(route, config);
}
