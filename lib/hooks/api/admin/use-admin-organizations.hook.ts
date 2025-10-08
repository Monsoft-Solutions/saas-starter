/**
 * Domain-specific hooks for admin organization management
 *
 * Provides type-safe interfaces for managing organizations in the admin panel,
 * leveraging SWR for caching and revalidation.
 *
 * @module lib/hooks/api/admin/use-admin-organizations.hook
 */

'use client';

import { useApiQuery } from '../use-api.hook';
import { apiRoutes } from '@/lib/api/routes.config';
import type { SWRConfiguration } from 'swr';

/**
 * Hook to fetch paginated list of organizations
 *
 * @param params - Query parameters for filtering and pagination
 * @param options - SWR configuration options
 * @returns SWR response with organizations data
 *
 * @example
 * ```tsx
 * function OrganizationsList() {
 *   const { data, error, isLoading } = useAdminOrganizations({
 *     search: 'acme',
 *     limit: 20,
 *     offset: 0,
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <ul>
 *       {data.data.map((org) => (
 *         <li key={org.id}>{org.name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useAdminOrganizations(
  params?: {
    search?: string;
    limit?: number;
    offset?: number;
  },
  options?: SWRConfiguration
) {
  return useApiQuery(apiRoutes.admin.organizations.list, {
    queryParams: params,
    swrConfig: options,
  });
}

/**
 * Hook to fetch a single organization by ID with full details
 *
 * @param id - Organization ID
 * @param options - Configuration options
 * @returns SWR response with organization details
 *
 * @example
 * ```tsx
 * function OrganizationDetails({ id }: { id: string }) {
 *   const { data, error, isLoading } = useAdminOrganization(id);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!data) return null;
 *
 *   return (
 *     <div>
 *       <h2>{data.name}</h2>
 *       <p>Members: {data.memberCount}</p>
 *       <p>Plan: {data.planName}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAdminOrganization(
  id: string | undefined,
  options?: {
    enabled?: boolean;
    swrConfig?: SWRConfiguration;
  }
) {
  return useApiQuery(apiRoutes.admin.organizations.get, {
    pathParams: id ? [id] : [],
    enabled: options?.enabled !== false && !!id,
    swrConfig: options?.swrConfig,
  });
}
