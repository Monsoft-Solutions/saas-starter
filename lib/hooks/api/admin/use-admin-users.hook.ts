/**
 * Domain-specific hooks for admin user management
 *
 * Provides type-safe interfaces for managing users in the admin panel.
 *
 * @module lib/hooks/api/admin/use-admin-users.hook
 */

'use client';

import { useApiQuery } from '../use-api.hook';
import { apiRoutes } from '@/lib/api/routes.config';
import type { SWRConfiguration } from 'swr';

/**
 * Hook to fetch paginated list of users
 *
 * @param params - Query parameters for filtering and pagination
 * @param options - SWR configuration options
 * @returns SWR response with users data
 *
 * @example
 * ```tsx
 * function UsersList() {
 *   const { data, error, isLoading } = useAdminUsers({
 *     search: 'john',
 *     role: 'user',
 *     limit: 20,
 *     offset: 0,
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <ul>
 *       {data.data.map((user) => (
 *         <li key={user.id}>{user.email}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useAdminUsers(
  params?: {
    search?: string;
    role?: string;
    banned?: boolean;
    limit?: number;
    offset?: number;
  },
  options?: SWRConfiguration
) {
  return useApiQuery(apiRoutes.admin.users.list, {
    queryParams: params,
    swrConfig: options,
  });
}

/**
 * Hook to fetch a single user by ID
 *
 * @param id - User ID
 * @param options - Configuration options
 * @returns SWR response with user details
 *
 * @example
 * ```tsx
 * function UserDetails({ id }: { id: string }) {
 *   const { data, error, isLoading } = useAdminUser(id);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!data) return null;
 *
 *   return (
 *     <div>
 *       <h2>{data.name}</h2>
 *       <p>Email: {data.email}</p>
 *       <p>Role: {data.role}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAdminUser(
  id: string | undefined,
  options?: {
    enabled?: boolean;
    swrConfig?: SWRConfiguration;
  }
) {
  return useApiQuery(apiRoutes.admin.users.get, {
    pathParams: id ? [id] : [],
    enabled: options?.enabled !== false && !!id,
    swrConfig: options?.swrConfig,
  });
}
