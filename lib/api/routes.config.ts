/**
 * Central API Route Registry
 *
 * This file serves as the single source of truth for all API routes in the application.
 * Each route is mapped to its request/response schemas, enabling type-safe API calls
 * from the client side.
 *
 * @module lib/api/routes.config
 */

import { z } from 'zod';

// Import request schemas
import { paginationRequestSchema } from '@/lib/types/common/pagination-request.schema';
import { notificationUpdateRequestSchema } from '@/lib/types/notifications/notification-update-request.schema';
import { adminUserListRequestSchema } from '@/lib/types/admin/admin-user-list-request.schema';
import { adminOrganizationListRequestSchema } from '@/lib/types/admin/admin-organization-list-request.schema';
import { adminActivityListRequestSchema } from '@/lib/types/admin/admin-activity-list-request.schema';
import { adminStatsRequestSchema } from '@/lib/types/admin/admin-stats-request.schema';
import { organizationSubscriptionResponseSchema } from '@/lib/types/api/subscription.type';

// Import response schemas
import { notificationListResponseSchema } from '@/lib/types/notifications/notification-list-response.schema';
import { notificationResponseSchema } from '@/lib/types/notifications/notification-response.schema';
import { unreadCountResponseSchema } from '@/lib/types/notifications/unread-count-response.schema';
import { simpleSuccessResponseSchema } from '@/lib/types/common/simple-success-response.schema';
import { userProfileResponseSchema } from '@/lib/types/auth/user-profile-response.schema';
import { adminUserListResponseSchema } from '@/lib/types/admin/admin-user-list-response.schema';
import { adminOrganizationListResponseSchema } from '@/lib/types/admin/admin-organization-list-response.schema';
import { adminActivityListResponseSchema } from '@/lib/types/admin/admin-activity-list-response.schema';
import { adminStatsResponseSchema } from '@/lib/types/admin/admin-stats-response.schema';
import { invitationDetailsResponseSchema } from '@/lib/types/invitations/invitation-details-response.schema';
import { cacheStatsResponseSchema } from '@/lib/types/cache/cache-stats-response.schema';
import { subscriptionAnalyticsResponseSchema } from '@/lib/types/analytics/subscription-analytics-response.schema';
import { subscriptionAnalyticsFiltersSchema } from '@/lib/types/analytics/subscription-analytics-filters.schema';
import { adminOrganizationDetailsResponseSchema } from '@/lib/types/admin/admin-organization-details-response.schema';
import { adminActivityDetailsResponseSchema } from '@/lib/types/admin/admin-activity-details-response.schema';

/**
 * Route definition structure for GET requests with query parameters
 */
type GetRouteWithQuery<
  TQuerySchema extends z.ZodTypeAny,
  TResponseSchema extends z.ZodTypeAny,
> = {
  readonly path: string;
  readonly method: 'GET';
  readonly querySchema: TQuerySchema;
  readonly responseSchema: TResponseSchema;
};

/**
 * Route definition structure for GET requests without query parameters
 */
type GetRoute<TResponseSchema extends z.ZodTypeAny> = {
  readonly path: string;
  readonly method: 'GET';
  readonly responseSchema: TResponseSchema;
};

/**
 * Route definition structure for GET requests with dynamic path parameters
 */
type GetRouteWithParams<
  TParams extends readonly string[],
  TResponseSchema extends z.ZodTypeAny,
> = {
  readonly path: (...params: TParams) => string;
  readonly method: 'GET';
  readonly responseSchema: TResponseSchema;
};

/**
 * Route definition structure for POST/PUT/PATCH requests with body
 */
type MutationRoute<
  TRequestSchema extends z.ZodTypeAny,
  TResponseSchema extends z.ZodTypeAny,
> = {
  readonly path: string;
  readonly method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly requestSchema: TRequestSchema;
  readonly responseSchema: TResponseSchema;
};

/**
 * Route definition structure for POST/PUT/PATCH requests with dynamic path parameters
 */
type MutationRouteWithParams<
  TParams extends readonly string[],
  TRequestSchema extends z.ZodTypeAny,
  TResponseSchema extends z.ZodTypeAny,
> = {
  readonly path: (...params: TParams) => string;
  readonly method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly requestSchema: TRequestSchema;
  readonly responseSchema: TResponseSchema;
};

/**
 * Central API route registry.
 * All API routes in the application should be defined here.
 *
 * @example
 * // Import in client components
 * import { apiRoutes } from '@/lib/api/routes.config';
 *
 * // Use with type-safe hooks
 * const { data } = useApi(apiRoutes.notifications.list);
 */
export const apiRoutes = {
  /**
   * Notification-related API routes
   */
  notifications: {
    /**
     * Get paginated list of notifications
     * GET /api/notifications
     */
    list: {
      path: '/api/notifications',
      method: 'GET',
      querySchema: paginationRequestSchema,
      responseSchema: notificationListResponseSchema,
    } as const satisfies GetRouteWithQuery<
      typeof paginationRequestSchema,
      typeof notificationListResponseSchema
    >,

    /**
     * Get single notification by ID
     * GET /api/notifications/:id
     */
    get: {
      path: (id: string) => `/api/notifications/${id}`,
      method: 'GET',
      responseSchema: notificationResponseSchema,
    } as const satisfies GetRouteWithParams<
      [string],
      typeof notificationResponseSchema
    >,

    /**
     * Update notification (mark read, toggle read, dismiss)
     * PATCH /api/notifications/:id
     */
    update: {
      path: (id: string) => `/api/notifications/${id}`,
      method: 'PATCH',
      requestSchema: notificationUpdateRequestSchema,
      responseSchema: simpleSuccessResponseSchema,
    } as const satisfies MutationRouteWithParams<
      [string],
      typeof notificationUpdateRequestSchema,
      typeof simpleSuccessResponseSchema
    >,

    /**
     * Mark all notifications as read
     * POST /api/notifications/mark-all-read
     */
    markAllRead: {
      path: '/api/notifications/mark-all-read',
      method: 'POST',
      requestSchema: z.object({}),
      responseSchema: simpleSuccessResponseSchema,
    } as const satisfies MutationRoute<
      z.ZodObject<Record<string, never>>,
      typeof simpleSuccessResponseSchema
    >,

    /**
     * Get unread notification count
     * GET /api/notifications/unread-count
     */
    unreadCount: {
      path: '/api/notifications/unread-count',
      method: 'GET',
      responseSchema: unreadCountResponseSchema,
    } as const satisfies GetRoute<typeof unreadCountResponseSchema>,
  },

  /**
   * User-related API routes
   */
  users: {
    /**
     * Get current user profile
     * GET /api/user
     */
    current: {
      path: '/api/user',
      method: 'GET',
      responseSchema: userProfileResponseSchema,
    } as const satisfies GetRoute<typeof userProfileResponseSchema>,
  },

  /**
   * Admin-related API routes
   */
  admin: {
    /**
     * User management routes
     */
    users: {
      /**
       * Get paginated list of users
       * GET /api/admin/users
       */
      list: {
        path: '/api/admin/users',
        method: 'GET',
        querySchema: adminUserListRequestSchema,
        responseSchema: adminUserListResponseSchema,
      } as const satisfies GetRouteWithQuery<
        typeof adminUserListRequestSchema,
        typeof adminUserListResponseSchema
      >,

      /**
       * Get single user by ID
       * GET /api/admin/users/:id
       */
      get: {
        path: (id: string) => `/api/admin/users/${id}`,
        method: 'GET',
        responseSchema: userProfileResponseSchema,
      } as const satisfies GetRouteWithParams<
        [string],
        typeof userProfileResponseSchema
      >,
    },

    /**
     * Organization management routes
     */
    organizations: {
      /**
       * Get paginated list of organizations
       * GET /api/admin/organizations
       */
      list: {
        path: '/api/admin/organizations',
        method: 'GET',
        querySchema: adminOrganizationListRequestSchema,
        responseSchema: adminOrganizationListResponseSchema,
      } as const satisfies GetRouteWithQuery<
        typeof adminOrganizationListRequestSchema,
        typeof adminOrganizationListResponseSchema
      >,

      /**
       * Get single organization by ID with full details
       * GET /api/admin/organizations/:id
       */
      get: {
        path: (id: string) => `/api/admin/organizations/${id}`,
        method: 'GET',
        responseSchema: adminOrganizationDetailsResponseSchema,
      } as const satisfies GetRouteWithParams<
        [string],
        typeof adminOrganizationDetailsResponseSchema
      >,
    },

    /**
     * Activity log routes
     */
    activity: {
      /**
       * Get paginated activity logs
       * GET /api/admin/activity
       */
      list: {
        path: '/api/admin/activity',
        method: 'GET',
        querySchema: adminActivityListRequestSchema,
        responseSchema: adminActivityListResponseSchema,
      } as const satisfies GetRouteWithQuery<
        typeof adminActivityListRequestSchema,
        typeof adminActivityListResponseSchema
      >,

      /**
       * Get single activity log by ID with full details
       * GET /api/admin/activity/:id
       */
      get: {
        path: (id: string) => `/api/admin/activity/${id}`,
        method: 'GET',
        responseSchema: adminActivityDetailsResponseSchema,
      } as const satisfies GetRouteWithParams<
        [string],
        typeof adminActivityDetailsResponseSchema
      >,
    },

    /**
     * Admin statistics
     */
    stats: {
      /**
       * Get admin dashboard statistics
       * GET /api/admin/stats
       */
      get: {
        path: '/api/admin/stats',
        method: 'GET',
        querySchema: adminStatsRequestSchema,
        responseSchema: adminStatsResponseSchema,
      } as const satisfies GetRouteWithQuery<
        typeof adminStatsRequestSchema,
        typeof adminStatsResponseSchema
      >,
    },

    /**
     * Admin analytics routes
     */
    analytics: {
      /**
       * Get subscription analytics data
       * GET /api/admin/analytics/subscriptions
       */
      subscriptions: {
        path: '/api/admin/analytics/subscriptions',
        method: 'GET',
        querySchema: subscriptionAnalyticsFiltersSchema,
        responseSchema: subscriptionAnalyticsResponseSchema,
      } as const satisfies GetRouteWithQuery<
        typeof subscriptionAnalyticsFiltersSchema,
        typeof subscriptionAnalyticsResponseSchema
      >,
    },
  },

  /**
   * Invitation-related API routes
   */
  invitations: {
    /**
     * Get invitation details by ID
     * GET /api/invitations/:invitationId
     */
    get: {
      path: (invitationId: string) => `/api/invitations/${invitationId}`,
      method: 'GET',
      responseSchema: invitationDetailsResponseSchema,
    } as const satisfies GetRouteWithParams<
      [string],
      typeof invitationDetailsResponseSchema
    >,
  },

  /**
   * Cache-related API routes
   */
  cache: {
    /**
     * Get cache statistics
     * GET /api/cache/stats
     */
    stats: {
      path: '/api/cache/stats',
      method: 'GET',
      responseSchema: cacheStatsResponseSchema,
    } as const satisfies GetRoute<typeof cacheStatsResponseSchema>,
  },

  /**
   * Organization-related API routes
   */
  organization: {
    /**
     * Get organization subscription details
     * GET /api/organization/subscription
     */
    subscription: {
      path: '/api/organization/subscription',
      method: 'GET',
      responseSchema: organizationSubscriptionResponseSchema,
    } as const satisfies GetRoute<
      typeof organizationSubscriptionResponseSchema
    >,
  },
} as const;

/**
 * Type helper to extract the route definition
 */
export type ApiRoute = typeof apiRoutes;

/**
 * Type helper to extract all route paths
 */
export type ApiRoutePath = keyof ApiRoute;

/**
 * Type helper to extract request schema from a route
 */
export type RouteRequestSchema<
  T extends
    | GetRouteWithQuery<any, any>
    | MutationRoute<any, any>
    | MutationRouteWithParams<any, any, any>,
> =
  T extends GetRouteWithQuery<infer Q, any>
    ? Q
    : T extends MutationRoute<infer R, any>
      ? R
      : T extends MutationRouteWithParams<any, infer R, any>
        ? R
        : never;

/**
 * Type helper to extract response schema from a route
 */
export type RouteResponseSchema<
  T extends
    | GetRoute<any>
    | GetRouteWithQuery<any, any>
    | GetRouteWithParams<any, any>
    | MutationRoute<any, any>
    | MutationRouteWithParams<any, any, any>,
> =
  T extends GetRoute<infer R>
    ? R
    : T extends GetRouteWithQuery<any, infer R>
      ? R
      : T extends GetRouteWithParams<any, infer R>
        ? R
        : T extends MutationRoute<any, infer R>
          ? R
          : T extends MutationRouteWithParams<any, any, infer R>
            ? R
            : never;

/**
 * Type helper to infer response type from a route
 */
export type RouteResponse<T extends { responseSchema: z.ZodTypeAny }> = z.infer<
  T['responseSchema']
>;

/**
 * Type helper to infer request type from a route
 */
export type RouteRequest<
  T extends { requestSchema?: z.ZodTypeAny; querySchema?: z.ZodTypeAny },
> = T extends { requestSchema: z.ZodTypeAny }
  ? z.infer<T['requestSchema']>
  : T extends { querySchema: z.ZodTypeAny }
    ? z.infer<T['querySchema']>
    : never;
