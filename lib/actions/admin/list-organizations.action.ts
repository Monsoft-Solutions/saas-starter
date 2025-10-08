'use server';

import { withPermission } from '@/lib/auth/permission-middleware';
import {
  listAllOrganizations,
  getOrganizationWithDetails,
  searchOrganizations,
  getOrganizationStatistics,
} from '@/lib/db/queries/admin-organization.query';
import type { OrganizationListFilters } from '@/lib/types/admin';

/**
 * Server action to list all organizations with filters and pagination.
 * Requires the `organizations:read` admin permission.
 */
export const listAllOrganizationsAction = withPermission(
  'organizations:read',
  async (filters: OrganizationListFilters) => {
    return await listAllOrganizations(filters);
  },
  'admin.organizations.list'
);

/**
 * Server action to get organization with full details (members, subscription).
 * Requires the `organizations:read` admin permission.
 */
export const getOrganizationWithDetailsAction = withPermission(
  'organizations:read',
  async (organizationId: string) => {
    return await getOrganizationWithDetails(organizationId);
  },
  'admin.organizations.details'
);

/**
 * Server action to search organizations by name or slug.
 * Requires the `organizations:read` admin permission.
 */
export const searchOrganizationsAction = withPermission(
  'organizations:read',
  async ({ query, limit = 20 }: { query: string; limit?: number }) => {
    return await searchOrganizations(query, limit);
  },
  'admin.organizations.search'
);

/**
 * Server action to get organization statistics grouped by status.
 * Requires the `organizations:read` admin permission.
 */
export const getOrganizationStatisticsAction = withPermission(
  'organizations:read',
  async () => {
    return await getOrganizationStatistics();
  },
  'admin.organizations.statistics'
);
