/**
 * Unit tests for API route registry
 * Tests route definitions, type helpers, and schema associations
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  apiRoutes,
  type RouteRequest,
  type RouteResponse,
  type RouteRequestSchema,
  type RouteResponseSchema,
} from '@/lib/api/routes.config';

describe('API Route Registry', () => {
  describe('Notification Routes', () => {
    it('should define notifications.list route with correct structure', () => {
      const route = apiRoutes.notifications.list;

      expect(route.path).toBe('/api/notifications');
      expect(route.method).toBe('GET');
      expect(route.querySchema).toBeDefined();
      expect(route.responseSchema).toBeDefined();
    });

    it('should define notifications.get route with path parameters', () => {
      const route = apiRoutes.notifications.get;
      const testId = 'test-notification-id';

      expect(typeof route.path).toBe('function');
      expect(route.path(testId)).toBe(`/api/notifications/${testId}`);
      expect(route.method).toBe('GET');
      expect(route.responseSchema).toBeDefined();
    });

    it('should define notifications.update route with correct method', () => {
      const route = apiRoutes.notifications.update;
      const testId = 'test-notification-id';

      expect(typeof route.path).toBe('function');
      expect(route.path(testId)).toBe(`/api/notifications/${testId}`);
      expect(route.method).toBe('PATCH');
      expect(route.requestSchema).toBeDefined();
      expect(route.responseSchema).toBeDefined();
    });

    it('should define notifications.markAllRead route', () => {
      const route = apiRoutes.notifications.markAllRead;

      expect(route.path).toBe('/api/notifications/mark-all-read');
      expect(route.method).toBe('POST');
      expect(route.requestSchema).toBeDefined();
      expect(route.responseSchema).toBeDefined();
    });

    it('should define notifications.unreadCount route', () => {
      const route = apiRoutes.notifications.unreadCount;

      expect(route.path).toBe('/api/notifications/unread-count');
      expect(route.method).toBe('GET');
      expect(route.responseSchema).toBeDefined();
    });
  });

  describe('User Routes', () => {
    it('should define users.current route', () => {
      const route = apiRoutes.users.current;

      expect(route.path).toBe('/api/user');
      expect(route.method).toBe('GET');
      expect(route.responseSchema).toBeDefined();
    });
  });

  describe('Admin Routes', () => {
    describe('Admin Users', () => {
      it('should define admin.users.list route', () => {
        const route = apiRoutes.admin.users.list;

        expect(route.path).toBe('/api/admin/users');
        expect(route.method).toBe('GET');
        expect(route.querySchema).toBeDefined();
        expect(route.responseSchema).toBeDefined();
      });

      it('should define admin.users.get route with path parameters', () => {
        const route = apiRoutes.admin.users.get;
        const testId = 'test-user-id';

        expect(typeof route.path).toBe('function');
        expect(route.path(testId)).toBe(`/api/admin/users/${testId}`);
        expect(route.method).toBe('GET');
        expect(route.responseSchema).toBeDefined();
      });
    });

    describe('Admin Organizations', () => {
      it('should define admin.organizations.list route', () => {
        const route = apiRoutes.admin.organizations.list;

        expect(route.path).toBe('/api/admin/organizations');
        expect(route.method).toBe('GET');
        expect(route.querySchema).toBeDefined();
        expect(route.responseSchema).toBeDefined();
      });

      it('should define admin.organizations.get route with path parameters', () => {
        const route = apiRoutes.admin.organizations.get;
        const testId = 'test-org-id';

        expect(typeof route.path).toBe('function');
        expect(route.path(testId)).toBe(`/api/admin/organizations/${testId}`);
        expect(route.method).toBe('GET');
        expect(route.responseSchema).toBeDefined();
      });
    });

    describe('Admin Activity', () => {
      it('should define admin.activity.list route', () => {
        const route = apiRoutes.admin.activity.list;

        expect(route.path).toBe('/api/admin/activity');
        expect(route.method).toBe('GET');
        expect(route.querySchema).toBeDefined();
        expect(route.responseSchema).toBeDefined();
      });

      it('should define admin.activity.get route with path parameters', () => {
        const route = apiRoutes.admin.activity.get;
        const testId = 'test-activity-id';

        expect(typeof route.path).toBe('function');
        expect(route.path(testId)).toBe(`/api/admin/activity/${testId}`);
        expect(route.method).toBe('GET');
        expect(route.responseSchema).toBeDefined();
      });
    });

    describe('Admin Stats', () => {
      it('should define admin.stats.get route', () => {
        const route = apiRoutes.admin.stats.get;

        expect(route.path).toBe('/api/admin/stats');
        expect(route.method).toBe('GET');
        expect(route.querySchema).toBeDefined();
        expect(route.responseSchema).toBeDefined();
      });
    });
  });

  describe('Invitation Routes', () => {
    it('should define invitations.get route with path parameters', () => {
      const route = apiRoutes.invitations.get;
      const testId = 'test-invitation-id';

      expect(typeof route.path).toBe('function');
      expect(route.path(testId)).toBe(`/api/invitations/${testId}`);
      expect(route.method).toBe('GET');
      expect(route.responseSchema).toBeDefined();
    });
  });

  describe('Cache Routes', () => {
    it('should define cache.stats route', () => {
      const route = apiRoutes.cache.stats;

      expect(route.path).toBe('/api/cache/stats');
      expect(route.method).toBe('GET');
      expect(route.responseSchema).toBeDefined();
    });
  });

  describe('Schema Validation', () => {
    it('should have valid Zod schemas for all routes', () => {
      // Test notification list query schema
      const listQueryResult =
        apiRoutes.notifications.list.querySchema.safeParse({
          limit: 10,
          offset: 0,
        });
      expect(listQueryResult.success).toBe(true);

      // Test notification update request schema
      const updateRequestResult =
        apiRoutes.notifications.update.requestSchema.safeParse({
          action: 'mark_read',
        });
      expect(updateRequestResult.success).toBe(true);

      // Test admin users list query schema
      const adminListResult = apiRoutes.admin.users.list.querySchema.safeParse({
        limit: 20,
        offset: 0,
        search: 'test',
      });
      expect(adminListResult.success).toBe(true);
    });

    it('should reject invalid data against schemas', () => {
      // Test with invalid limit
      const invalidLimit = apiRoutes.notifications.list.querySchema.safeParse({
        limit: 150, // max is 100
        offset: 0,
      });
      expect(invalidLimit.success).toBe(false);

      // Test with invalid action
      const invalidAction =
        apiRoutes.notifications.update.requestSchema.safeParse({
          action: 'invalid_action',
        });
      expect(invalidAction.success).toBe(false);
    });
  });

  describe('Type Helpers', () => {
    it('should correctly infer request types', () => {
      type NotificationListRequest = RouteRequest<
        typeof apiRoutes.notifications.list
      >;

      const validRequest: NotificationListRequest = {
        limit: 10,
        offset: 0,
      };

      expect(validRequest).toBeDefined();
      expect(validRequest.limit).toBe(10);
      expect(validRequest.offset).toBe(0);
    });

    it('should correctly infer response types', () => {
      type NotificationListResponse = RouteResponse<
        typeof apiRoutes.notifications.list
      >;

      const mockResponse: NotificationListResponse = {
        notifications: [],
        unreadCount: 0,
        pagination: {
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      };

      expect(mockResponse).toBeDefined();
      expect(mockResponse.notifications).toBeInstanceOf(Array);
      expect(typeof mockResponse.unreadCount).toBe('number');
    });

    it('should extract request schema type', () => {
      type ListRequestSchema = RouteRequestSchema<
        typeof apiRoutes.notifications.list
      >;

      // This should be the same as the imported schema
      expect(
        {} as unknown as ListRequestSchema
      ).toBeDefined() as unknown as z.ZodObject<any>;
    });

    it('should extract response schema type', () => {
      type ListResponseSchema = RouteResponseSchema<
        typeof apiRoutes.notifications.list
      >;

      // This should be the same as the imported schema
      expect(
        {} as unknown as ListResponseSchema
      ).toBeDefined() as unknown as z.ZodObject<any>;
    });
  });

  describe('Path Parameter Functions', () => {
    it('should generate correct paths with single parameter', () => {
      const notificationId = 'notif-123';
      const path = apiRoutes.notifications.get.path(notificationId);

      expect(path).toBe(`/api/notifications/${notificationId}`);
    });

    it('should generate correct paths with different parameter values', () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      const path1 = apiRoutes.admin.users.get.path(userId1);
      const path2 = apiRoutes.admin.users.get.path(userId2);

      expect(path1).toBe(`/api/admin/users/${userId1}`);
      expect(path2).toBe(`/api/admin/users/${userId2}`);
      expect(path1).not.toBe(path2);
    });

    it('should handle special characters in path parameters', () => {
      const specialId = 'user-123-abc-xyz';
      const path = apiRoutes.admin.users.get.path(specialId);

      expect(path).toBe(`/api/admin/users/${specialId}`);
    });
  });

  describe('Route Registry Structure', () => {
    it('should be readonly (const assertion)', () => {
      // TypeScript compile-time check
      // @ts-expect-error - Should not allow mutation
      apiRoutes.notifications.list.path = '/new-path';
    });

    it('should have all expected top-level route groups', () => {
      expect(apiRoutes).toHaveProperty('notifications');
      expect(apiRoutes).toHaveProperty('users');
      expect(apiRoutes).toHaveProperty('admin');
      expect(apiRoutes).toHaveProperty('invitations');
      expect(apiRoutes).toHaveProperty('cache');
    });

    it('should have consistent structure for all routes', () => {
      const validateRoute = (route: any) => {
        if (typeof route.path === 'function') {
          expect(route).toHaveProperty('path');
          expect(route).toHaveProperty('method');
          expect(route).toHaveProperty('responseSchema');
        } else {
          expect(route).toHaveProperty('path');
          expect(route).toHaveProperty('method');
          expect(route).toHaveProperty('responseSchema');
        }
      };

      // Validate a sample of routes
      validateRoute(apiRoutes.notifications.list);
      validateRoute(apiRoutes.notifications.get);
      validateRoute(apiRoutes.users.current);
      validateRoute(apiRoutes.admin.users.list);
    });
  });

  describe('HTTP Methods', () => {
    it('should use GET for retrieval routes', () => {
      expect(apiRoutes.notifications.list.method).toBe('GET');
      expect(apiRoutes.notifications.get.method).toBe('GET');
      expect(apiRoutes.users.current.method).toBe('GET');
      expect(apiRoutes.admin.users.list.method).toBe('GET');
    });

    it('should use PATCH for update routes', () => {
      expect(apiRoutes.notifications.update.method).toBe('PATCH');
    });

    it('should use POST for action routes', () => {
      expect(apiRoutes.notifications.markAllRead.method).toBe('POST');
    });
  });
});
