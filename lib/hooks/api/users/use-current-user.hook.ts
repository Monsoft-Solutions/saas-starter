/**
 * Domain-specific hook for current user profile
 *
 * Provides a type-safe interface for accessing the current authenticated user's profile.
 *
 * @module lib/hooks/api/users/use-current-user.hook
 */

'use client';

import { useApiQuery } from '../use-api.hook';
import { apiRoutes } from '@/lib/api/routes.config';
import type { SWRConfiguration } from 'swr';

/**
 * Hook to fetch the current authenticated user's profile
 *
 * @param options - SWR configuration options
 * @returns SWR response with user profile data
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { data: user, error, isLoading } = useCurrentUser();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!user) return null;
 *
 *   return (
 *     <div>
 *       <h2>{user.name || user.email}</h2>
 *       <p>Role: {user.role}</p>
 *       {user.image && <img src={user.image} alt="Profile" />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCurrentUser(options?: SWRConfiguration) {
  return useApiQuery(apiRoutes.users.current, {
    swrConfig: {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      ...options,
    },
  });
}
