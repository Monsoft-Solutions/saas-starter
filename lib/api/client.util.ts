/**
 * Type-safe API client for making HTTP requests
 *
 * This module provides a centralized, type-safe way to make API requests
 * with automatic validation, error handling, and authentication.
 *
 * @module lib/api/client.util
 */

import { z } from 'zod';
import type { ApiResponse } from '@/lib/http/response';
import { ApiError } from '@/lib/types/api/api-error.type';
import { envClient } from '../env-client';

/**
 * Configuration options for API requests
 */
type RequestConfig<TRequest extends z.ZodTypeAny | undefined> = {
  /**
   * Request body data (for POST, PUT, PATCH)
   * Automatically validated against requestSchema if provided
   */
  data?: TRequest extends z.ZodTypeAny ? z.infer<TRequest> : never;

  /**
   * Path parameters for dynamic routes
   * Used when route.path is a function
   */
  pathParams?: string[];

  /**
   * Query parameters for GET requests
   * Automatically validated against querySchema if provided
   */
  queryParams?: Record<string, string | number | boolean | undefined>;

  /**
   * Additional HTTP headers
   */
  headers?: HeadersInit;

  /**
   * Request timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Whether to include credentials (cookies)
   * @default true
   */
  credentials?: RequestCredentials;

  /**
   * AbortSignal for request cancellation
   */
  signal?: AbortSignal;
};

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
 * Makes a type-safe API request with automatic validation and error handling
 *
 * @param route - Route definition from apiRoutes registry
 * @param config - Request configuration options
 * @returns Promise resolving to validated response data
 * @throws {ApiError} When request fails or validation fails
 *
 * @example
 * ```typescript
 * // GET request with query parameters
 * const notifications = await apiRequest(
 *   apiRoutes.notifications.list,
 *   { queryParams: { limit: 10, offset: 0 } }
 * );
 *
 * // POST request with body
 * const result = await apiRequest(
 *   apiRoutes.notifications.markAllRead,
 *   { data: {} }
 * );
 *
 * // Dynamic route with path parameters
 * const notification = await apiRequest(
 *   apiRoutes.notifications.get,
 *   { pathParams: ['notification-123'] }
 * );
 * ```
 */
export async function apiRequest<
  TRequest extends z.ZodTypeAny | undefined,
  TResponse extends z.ZodTypeAny,
>(
  route: RouteDefinition<TRequest, TResponse>,
  config?: RequestConfig<TRequest>
): Promise<z.infer<TResponse>> {
  const {
    data,
    pathParams = [],
    queryParams,
    headers,
    timeout = 30000,
    credentials = 'include',
    signal,
  } = config || {};

  const startTime = performance.now();

  try {
    // Build URL
    const path =
      typeof route.path === 'function' ? route.path(...pathParams) : route.path;

    // Determine base URL (browser or test environment)
    const baseUrl = envClient.BASE_URL;

    const url = new URL(path, baseUrl);

    // Add query parameters
    if (queryParams) {
      // Validate query params if schema exists
      if (route.querySchema) {
        const validation = route.querySchema.safeParse(queryParams);
        if (!validation.success) {
          throw new ApiError(
            'Invalid query parameters',
            400,
            validation.error.format(),
            url.toString(),
            route.method
          );
        }
      }

      // Add validated params to URL
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    // Validate request body if schema exists
    if (route.requestSchema && data !== undefined) {
      const validation = route.requestSchema.safeParse(data);
      if (!validation.success) {
        throw new ApiError(
          'Invalid request data',
          400,
          validation.error.format(),
          url.toString(),
          route.method
        );
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Combine signals if provided
    const combinedSignal = signal
      ? combineAbortSignals([signal, controller.signal])
      : controller.signal;

    try {
      // Make request
      const response = await fetch(url.toString(), {
        method: route.method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body:
          data !== undefined && route.method !== 'GET'
            ? JSON.stringify(data)
            : undefined,
        credentials,
        signal: combinedSignal,
      });

      const duration = Math.round(performance.now() - startTime);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Request Execution] `, {
          duration: `${duration}ms`,
          path,
          method: route.method,
          data: data ? JSON.stringify(data) : undefined,
          queryParams: queryParams ? JSON.stringify(queryParams) : undefined,
        });
      }

      clearTimeout(timeoutId);

      // Parse response
      const json: ApiResponse<unknown> = await response.json();

      // Handle error responses
      if (!response.ok) {
        throw await ApiError.fromResponse(response, json);
      }

      // Validate response with schema
      const validated = route.responseSchema.safeParse(json);

      if (!validated.success) {
        // In development, expose validation errors
        if (process.env.NODE_ENV === 'development') {
          console.error('Response validation failed:', {
            url: url.toString(),
            method: route.method,
            errors: validated.error.format(),
            data: json,
          });
        }

        throw new ApiError(
          'Invalid response format',
          500,
          process.env.NODE_ENV === 'development'
            ? validated.error.format()
            : undefined,
          url.toString(),
          route.method
        );
      }

      return validated.data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(
          'Request timeout',
          408,
          { timeout },
          url.toString(),
          route.method
        );
      }

      // Re-throw ApiErrors
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle other errors
      throw error;
    }
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const path =
        typeof route.path === 'function'
          ? route.path(...pathParams)
          : route.path;
      throw ApiError.networkError(
        path,
        route.method,
        error instanceof Error ? error : undefined
      );
    }

    // Re-throw all other errors
    throw error;
  }
}

/**
 * Combines multiple AbortSignals into a single signal
 * Used to support both timeout and manual cancellation
 *
 * @param signals - Array of AbortSignals to combine
 * @returns Combined AbortSignal
 */
function combineAbortSignals(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  return controller.signal;
}
