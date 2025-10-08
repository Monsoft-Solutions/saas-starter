/**
 * Domain-specific hooks for admin activity log management
 *
 * Provides type-safe interfaces for viewing and filtering activity logs
 * in the admin panel.
 *
 * @module lib/hooks/api/admin/use-admin-activity.hook
 */

'use client';

import { useApiQuery } from '../use-api.hook';
import { apiRoutes } from '@/lib/api/routes.config';
import type { SWRConfiguration } from 'swr';

/**
 * Hook to fetch paginated list of activity logs
 *
 * @param params - Query parameters for filtering and pagination
 * @param options - SWR configuration options
 * @returns SWR response with activity logs data
 *
 * @example
 * ```tsx
 * function ActivityLogList() {
 *   const { data, error, isLoading } = useAdminActivityLogs({
 *     search: 'user@example.com',
 *     action: 'user.sign_in',
 *     limit: 50,
 *     offset: 0,
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <ul>
 *       {data.data.map((log) => (
 *         <li key={log.id}>
 *           {log.userEmail} - {log.action}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useAdminActivityLogs(
  params?: {
    search?: string;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  },
  options?: SWRConfiguration
) {
  return useApiQuery(apiRoutes.admin.activity.list, {
    queryParams: params,
    swrConfig: options,
  });
}

/**
 * Hook to fetch a single activity log by ID with full details
 *
 * @param id - Activity log ID
 * @param options - Configuration options
 * @returns SWR response with activity log details
 *
 * @example
 * ```tsx
 * function ActivityLogDetails({ id }: { id: number }) {
 *   const { data, error, isLoading } = useAdminActivityLog(id);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!data) return null;
 *
 *   return (
 *     <div>
 *       <h2>Activity: {data.action}</h2>
 *       <p>User: {data.userEmail}</p>
 *       <p>IP: {data.ipAddress}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAdminActivityLog(
  id: number | undefined,
  options?: {
    enabled?: boolean;
    swrConfig?: SWRConfiguration;
  }
) {
  return useApiQuery(apiRoutes.admin.activity.get, {
    pathParams: id !== undefined ? [String(id)] : [],
    enabled: options?.enabled !== false && id !== undefined,
    swrConfig: options?.swrConfig,
  });
}
