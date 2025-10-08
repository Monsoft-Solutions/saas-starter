/**
 * Domain-specific hooks for admin analytics
 *
 * Provides type-safe interfaces for accessing analytics data in the admin panel.
 *
 * @module lib/hooks/api/admin/use-admin-analytics.hook
 */

'use client';

import { useApiQuery } from '../use-api.hook';
import { apiRoutes } from '@/lib/api/routes.config';
import type { SWRConfiguration } from 'swr';

/**
 * Hook to fetch admin dashboard statistics
 *
 * @param params - Query parameters for time range
 * @param options - SWR configuration options
 * @returns SWR response with statistics data
 *
 * @example
 * ```tsx
 * function AdminDashboard() {
 *   const { data, error, isLoading } = useAdminStats({
 *     period: 'week'
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       <p>Total Users: {data.totalUsers}</p>
 *       <p>Total Organizations: {data.totalOrganizations}</p>
 *       <p>Active Subscriptions: {data.activeSubscriptions}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAdminStats(
  params?: {
    period?: 'day' | 'week' | 'month' | 'year';
  },
  options?: SWRConfiguration
) {
  return useApiQuery(apiRoutes.admin.stats.get, {
    queryParams: params,
    swrConfig: {
      refreshInterval: 60000, // Refresh every minute
      ...options,
    },
  });
}

/**
 * Hook to fetch subscription analytics data
 *
 * @param params - Query parameters for filtering and pagination
 * @param options - SWR configuration options
 * @returns SWR response with subscription analytics data
 *
 * @example
 * ```tsx
 * function SubscriptionAnalytics() {
 *   const { data, error, isLoading } = useAdminSubscriptionAnalytics({
 *     status: 'active',
 *     planName: 'Pro',
 *     limit: 50,
 *     offset: 0,
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <table>
 *       <thead>
 *         <tr>
 *           <th>Organization</th>
 *           <th>Plan</th>
 *           <th>MRR</th>
 *           <th>Members</th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         {data.data.map((sub) => (
 *           <tr key={sub.id}>
 *             <td>{sub.organizationName}</td>
 *             <td>{sub.planName}</td>
 *             <td>${sub.mrr}</td>
 *             <td>{sub.memberCount}</td>
 *           </tr>
 *         ))}
 *       </tbody>
 *     </table>
 *   );
 * }
 * ```
 */
export function useAdminSubscriptionAnalytics(
  params?: {
    search?: string;
    status?: 'active' | 'trialing' | 'canceled' | 'past_due' | 'incomplete';
    planName?: string;
    minMRR?: number;
    maxMRR?: number;
    limit?: number;
    offset?: number;
  },
  options?: SWRConfiguration
) {
  return useApiQuery(apiRoutes.admin.analytics.subscriptions, {
    queryParams: params,
    swrConfig: options,
  });
}
