/**
 * Global SWR configuration and middleware
 *
 * This module provides centralized SWR configuration for consistent
 * data fetching behavior across the application.
 *
 * @module lib/api/swr-config
 */

import type { SWRConfiguration, Middleware, SWRHook } from 'swr';
import { ApiError } from '@/lib/types/api/api-error.type';

/**
 * SWR middleware for logging requests (development only)
 */
export const swrLogger: Middleware = (useSWRNext: SWRHook) => {
  return (key, fetcher, config) => {
    const swr = useSWRNext(key, fetcher, config);

    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      // Log on error
      if (swr.error) {
        console.error('[SWR]', {
          key,
          status: 'error',
          error: swr.error,
        });
      }
    }

    return swr;
  };
};

/**
 * SWR middleware for handling authentication errors
 *
 * Automatically redirects to login page when receiving 401 Unauthorized
 */
export const swrAuthHandler: Middleware = (useSWRNext: SWRHook) => {
  return (key, fetcher, config) => {
    const swr = useSWRNext(key, fetcher, config);

    // Handle authentication errors
    if (swr.error instanceof ApiError && swr.error.status === 401) {
      // Only redirect if we're in the browser
      if (typeof window !== 'undefined') {
        // Store the current URL for redirect after login
        const currentUrl = window.location.pathname + window.location.search;
        const redirectUrl =
          currentUrl !== '/' && !currentUrl.startsWith('/sign-')
            ? `?redirect=${encodeURIComponent(currentUrl)}`
            : '';

        // Redirect to sign-in page
        window.location.href = `/sign-in${redirectUrl}`;
      }
    }

    return swr;
  };
};

/**
 * SWR middleware for handling rate limit errors
 *
 * Adds exponential backoff retry for rate limit (429) errors
 */
export const swrRateLimitHandler: Middleware = (useSWRNext: SWRHook) => {
  return (key, fetcher, config) => {
    return useSWRNext(key, fetcher, {
      ...config,
      onErrorRetry: (
        error: any,
        key: string,
        config: any,
        revalidate: any,
        { retryCount }: { retryCount: number }
      ) => {
        // Never retry on 404
        if (error.status === 404) return;

        // Exponential backoff for rate limits
        if (error.status === 429) {
          const delay = Math.min(1000 * 2 ** retryCount, 30000); // Max 30 seconds
          setTimeout(() => revalidate({ retryCount }), delay);
          return;
        }

        // Default retry behavior for other errors
        if (config.onErrorRetry) {
          config.onErrorRetry(error, key, config, revalidate, { retryCount });
        }
      },
    });
  };
};

/**
 * Global SWR configuration
 *
 * Apply this configuration at the root of your application using SWRConfig
 *
 * @example
 * ```tsx
 * import { SWRConfig } from 'swr';
 * import { swrGlobalConfig } from '@/lib/api/swr-config';
 *
 * export default function App({ children }) {
 *   return (
 *     <SWRConfig value={swrGlobalConfig}>
 *       {children}
 *     </SWRConfig>
 *   );
 * }
 * ```
 */
export const swrGlobalConfig: SWRConfiguration = {
  /**
   * Enable revalidation on window focus
   * Ensures data is fresh when user returns to the tab
   */
  revalidateOnFocus: true,

  /**
   * Enable revalidation on network reconnection
   * Refreshes data when connection is restored
   */
  revalidateOnReconnect: true,

  /**
   * Enable automatic revalidation when component mounts
   * Set to false if you want to manually control when data is fetched
   */
  revalidateOnMount: true,

  /**
   * Disable revalidation if data is stale
   * Only revalidate on focus/reconnect if explicitly enabled
   */
  revalidateIfStale: true,

  /**
   * Dedupe requests within this time window (milliseconds)
   * Prevents duplicate requests for the same key
   */
  dedupingInterval: 2000,

  /**
   * Time to consider cached data as fresh (milliseconds)
   * SWR won't revalidate during this period
   */
  focusThrottleInterval: 5000,

  /**
   * Keep previous data while fetching new data
   * Prevents UI flickering during revalidation
   */
  keepPreviousData: true,

  /**
   * Retry failed requests
   * Useful for handling transient network errors
   */
  shouldRetryOnError: true,

  /**
   * Number of retry attempts
   */
  errorRetryCount: 3,

  /**
   * Retry interval (milliseconds)
   * Time to wait before retrying failed requests
   */
  errorRetryInterval: 5000,

  /**
   * Load initial data from cache
   * Provides instant UI updates with cached data
   */
  fallbackData: undefined,

  /**
   * SWR middleware stack
   * Applied in order: logger → auth handler → rate limit handler
   */
  use: [
    // Development logging (disabled in production)
    ...(process.env.NODE_ENV === 'development' ? [swrLogger] : []),
    // Authentication error handling
    swrAuthHandler,
    // Rate limit handling
    swrRateLimitHandler,
  ],
};

/**
 * SWR configuration for infinite loading (pagination)
 *
 * Use with useSWRInfinite for paginated data
 */
export const swrInfiniteConfig: SWRConfiguration = {
  ...swrGlobalConfig,
  // Don't revalidate on mount for infinite loading
  // Let user explicitly trigger loading more
  revalidateOnMount: false,
  // Increase deduping interval for pagination
  dedupingInterval: 5000,
  // Keep previous data to prevent UI jumps
  keepPreviousData: true,
};

/**
 * SWR configuration for static data (rarely changes)
 *
 * Use for data that updates infrequently (e.g., user settings, configuration)
 */
export const swrStaticConfig: SWRConfiguration = {
  ...swrGlobalConfig,
  // Don't revalidate on focus for static data
  revalidateOnFocus: false,
  // Only revalidate on mount
  revalidateOnReconnect: false,
  // Cache for 10 minutes
  dedupingInterval: 600000,
  // No automatic retries for static data
  shouldRetryOnError: false,
};

/**
 * SWR configuration for real-time data (frequently updates)
 *
 * Use for data that needs to be as fresh as possible (e.g., notifications, live stats)
 */
export const swrRealtimeConfig: SWRConfiguration = {
  ...swrGlobalConfig,
  // Aggressive revalidation
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateOnMount: true,
  // Short deduping interval
  dedupingInterval: 1000,
  // Short focus throttle
  focusThrottleInterval: 2000,
  // Optional: Add polling for real-time updates
  // refreshInterval: 5000, // Poll every 5 seconds
};
