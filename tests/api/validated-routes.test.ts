import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock server-only module
vi.mock('server-only', () => ({}));

// Mock dependencies
vi.mock('@/lib/logger/logger.service', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Replace the current vi.mock for server-context with one that mocks both functions to the same value.
vi.mock('@/lib/auth/server-context', () => ({
  requireServerContext: vi.fn().mockResolvedValue({
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
    },
    session: {
      id: 'session-123',
      user: {},
    },
    headers: {},
    organization: null,
  }),
  getServerContextFromHeaders: vi.fn().mockResolvedValue({
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
    },
    session: {
      id: 'session-123',
      user: {},
    },
    headers: {},
    organization: null,
  }),
}));

vi.mock('@/lib/notifications/notification.service', () => ({
  getNotifications: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  markNotificationAsRead: vi.fn(),
  toggleNotificationRead: vi.fn(),
  dismissNotification: vi.fn(),
  getNotification: vi.fn(),
}));

// Mock the notification service - this is what the API route actually calls
vi.mock('@/lib/notifications/notification.service', () => ({
  getNotification: vi.fn(),
  getNotifications: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  markNotificationAsRead: vi.fn(),
  toggleNotificationRead: vi.fn(),
  dismissNotification: vi.fn(),
}));

// Mock the entire db module to avoid complex query chain mocking
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock the database schemas
vi.mock('@/lib/db/schemas', () => ({
  user: {
    id: 'id',
    name: 'name',
    email: 'email',
    emailVerified: 'emailVerified',
    image: 'image',
    role: 'role',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    banned: 'banned',
    banReason: 'banReason',
    banExpires: 'banExpires',
  },
}));


import { GET as getNotifications } from '@/app/api/notifications/route';
import { PATCH as updateNotification } from '@/app/api/notifications/[id]/route';
import { POST as logError } from '@/app/api/log-error/route';
import { GET as getUser } from '@/app/api/user/route';
import {
  getNotifications as getNotificationsService,
  getUnreadNotificationCount,
  getNotification,
  markNotificationAsRead,
} from '@/lib/notifications/notification.service';

// Helper to create a mock NextRequest
function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const fullUrl = new URL(url, 'http://localhost:3000');

  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      fullUrl.searchParams.set(key, value);
    });
  }

  const bodyText = options.body ? JSON.stringify(options.body) : '';

  const request = {
    json: vi.fn().mockResolvedValue(options.body ?? {}),
    text: vi.fn().mockResolvedValue(bodyText),
    nextUrl: fullUrl,
    headers: new Headers(),
    method: options.method ?? 'GET',
  } as unknown as NextRequest;

  return request;
}

// Helper to create mock route context
const createMockRouteContext = (params = {}) => ({
  params: Promise.resolve(params),
});

describe('Validated API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('should return validated notification list with pagination', async () => {
      const mockNotifications = [
        {
          id: 1,
          userId: 'user-123',
          type: 'system.update' as const,
          category: 'system' as const,
          priority: 'important' as const,
          title: 'Test Notification',
          message: 'This is a test',
          metadata: null,
          isRead: false,
          readAt: null,
          isDismissed: false,
          createdAt: new Date(),
          expiresAt: null,
        },
      ];

      vi.mocked(getNotificationsService).mockResolvedValue(mockNotifications);
      vi.mocked(getUnreadNotificationCount).mockResolvedValue(5);

      const request = createMockRequest('/api/notifications', {
        searchParams: { limit: '20', offset: '0' },
      });

      const response = await getNotifications(
        request,
        createMockRouteContext()
      );

      // Debug: log the response body if status is not 200
      if (response.status !== 200) {
        const body = await response.json();
        console.log('Response body:', body);
      }

      expect(response.status).toBe(200);
      const body = await response.json();

      // Verify response structure matches schema
      expect(body).toHaveProperty('notifications');
      expect(body).toHaveProperty('unreadCount', 5);
      expect(body).toHaveProperty('pagination');
      expect(body.pagination).toEqual({
        limit: 20,
        offset: 0,
        hasMore: false,
      });
    });

    it('should reject invalid pagination parameters', async () => {
      const request = createMockRequest('/api/notifications', {
        searchParams: { limit: 'invalid', offset: '0' },
      });

      const response = await getNotifications(
        request,
        createMockRouteContext()
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it('should use default pagination values when not provided', async () => {
      vi.mocked(getNotificationsService).mockResolvedValue([]);
      vi.mocked(getUnreadNotificationCount).mockResolvedValue(0);

      const request = createMockRequest('/api/notifications');

      const response = await getNotifications(
        request,
        createMockRouteContext()
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.pagination.limit).toBe(20); // Default limit
      expect(body.pagination.offset).toBe(0); // Default offset
    });
  });

  describe('PATCH /api/notifications/[id]', () => {
    beforeEach(() => {
      // Reset all mocks before each test
      vi.clearAllMocks();
    });

    it('should successfully update notification with valid action', async () => {
      const mockNotification = {
        id: 1,
        userId: 'user-123',
        type: 'system.update' as const,
        category: 'system' as const,
        priority: 'important' as const,
        title: 'Test',
        message: 'Test message',
        metadata: null,
        isRead: false,
        readAt: null,
        isDismissed: false,
        createdAt: new Date(),
        expiresAt: null,
      };

      // Mock the service function to return our test notification
      vi.mocked(getNotification).mockResolvedValue(mockNotification);
      vi.mocked(markNotificationAsRead).mockResolvedValue();

      const request = createMockRequest('/api/notifications/1', {
        method: 'PATCH',
        body: { action: 'mark_read' },
      });

      const response = await updateNotification(
        request,
        createMockRouteContext({ id: '1' })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(markNotificationAsRead).toHaveBeenCalledWith(1, 'user-123');
    });

    it('should reject invalid notification ID', async () => {
      const request = createMockRequest('/api/notifications/invalid', {
        method: 'PATCH',
        body: { action: 'mark_read' },
      });

      const response = await updateNotification(
        request,
        createMockRouteContext({ id: 'invalid' })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('ID must be a number');
    });

    it('should reject invalid action', async () => {
      const request = createMockRequest('/api/notifications/1', {
        method: 'PATCH',
        body: { action: 'invalid_action' },
      });

      const response = await updateNotification(
        request,
        createMockRouteContext({ id: '1' })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it('should return 404 when notification not found', async () => {
      // Mock the service function to return null (notification not found)
      vi.mocked(getNotification).mockResolvedValue(null);

      const request = createMockRequest('/api/notifications/999', {
        method: 'PATCH',
        body: { action: 'mark_read' },
      });

      const response = await updateNotification(
        request,
        createMockRouteContext({ id: '999' })
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Notification not found');
    });

    it('should return 403 when user does not own notification', async () => {
      const mockNotification = {
        id: 1,
        userId: 'different-user',
        type: 'system.update' as const,
        category: 'system' as const,
        priority: 'important' as const,
        title: 'Test',
        message: 'Test message',
        metadata: null,
        isRead: false,
        readAt: null,
        isDismissed: false,
        createdAt: new Date(),
        expiresAt: null,
      };

      // Mock the service function to return a notification owned by a different user
      vi.mocked(getNotification).mockResolvedValue(mockNotification);

      const request = createMockRequest('/api/notifications/1', {
        method: 'PATCH',
        body: { action: 'mark_read' },
      });

      const response = await updateNotification(
        request,
        createMockRouteContext({ id: '1' })
      );

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized to update this notification');
    });
  });

  describe('POST /api/log-error', () => {
    it('should successfully log client error with valid payload', async () => {
      const validPayload = {
        message: 'Client error occurred',
        userAgent: 'Mozilla/5.0...',
        url: 'https://example.com',
        timestamp: new Date().toISOString(),
        error: {
          name: 'Error',
          message: 'Something went wrong',
          stack: 'Error: Something went wrong\n  at...',
        },
      };

      const request = createMockRequest('/api/log-error', {
        method: 'POST',
        body: validPayload,
      });

      const response = await logError(request, createMockRouteContext());

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should reject invalid error payload', async () => {
      const invalidPayload = {
        message: 'Client error',
        // Missing required fields
      };

      const request = createMockRequest('/api/log-error', {
        method: 'POST',
        body: invalidPayload,
      });

      const response = await logError(request, createMockRouteContext());

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });
  });

  describe('GET /api/user', () => {
    it('should return validated user profile', async () => {
      // Set up database mock for normal user
      const { db } = vi.mocked(await import('@/lib/db/drizzle'));
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 'user-123',
                name: 'Test User',
                email: 'test@example.com',
                emailVerified: true,
                image: null,
                role: 'user',
                createdAt: new Date('2024-01-01').toISOString(),
                updatedAt: new Date('2024-01-01').toISOString(),
                banned: null,
                banReason: null,
                banExpires: null,
              },
            ]),
          }),
        }),
      } as any);

      const request = createMockRequest('/api/user');

      const response = await getUser(request, createMockRouteContext());

      expect(response.status).toBe(200);
      const body = await response.json();

      // Verify response structure matches schema
      expect(body).toHaveProperty('id', 'user-123');
      expect(body).toHaveProperty('name', 'Test User');
      expect(body).toHaveProperty('email', 'test@example.com');
      expect(body).toHaveProperty('emailVerified', true);
      expect(body).toHaveProperty('image');
      expect(body).toHaveProperty('role', 'user');
      expect(body).toHaveProperty('createdAt');
      expect(body).toHaveProperty('updatedAt');

      // Verify null is converted to undefined for optional fields
      expect(body).not.toHaveProperty('banned');
      expect(body).not.toHaveProperty('banReason');
      expect(body).not.toHaveProperty('banExpires');
    });

    it('should include admin fields when user is banned', async () => {
      // Set up database mock for banned user
      const { db } = vi.mocked(await import('@/lib/db/drizzle'));
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 'user-123',
                name: 'Test User',
                email: 'test@example.com',
                emailVerified: true,
                image: null,
                role: 'user',
                createdAt: new Date('2024-01-01').toISOString(),
                updatedAt: new Date('2024-01-01').toISOString(),
                banned: true,
                banReason: 'Violation of terms',
                banExpires: new Date('2024-12-31').toISOString(),
              },
            ]),
          }),
        }),
      } as any);

      const request = createMockRequest('/api/user');

      const response = await getUser(request, createMockRouteContext());

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.banned).toBe(true);
      expect(body.banReason).toBe('Violation of terms');
      expect(body.banExpires).toBeDefined();
    });
  });

  describe('Response Schema Validation', () => {
    it('should fail validation when response does not match schema', async () => {
      // Mock a service that returns invalid data
      vi.mocked(getNotificationsService).mockResolvedValue([
        {
          id: 1,
          // Missing required fields
        } as any,
      ]);
      vi.mocked(getUnreadNotificationCount).mockResolvedValue(0);

      const request = createMockRequest('/api/notifications', {
        searchParams: { limit: '20', offset: '0' },
      });

      const response = await getNotifications(
        request,
        createMockRouteContext()
      );

      // In development, should return 500 with validation error
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });
  });
});
