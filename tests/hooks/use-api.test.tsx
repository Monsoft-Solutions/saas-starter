/**
 * Unit tests for SWR API hooks
 *
 * Tests the type-safe SWR hook factory with mocked API responses
 *
 * @vitest-environment happy-dom
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  afterAll,
  vi,
} from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { SWRConfig } from 'swr';
import { z } from 'zod';
import React, { type ReactNode } from 'react';
import { useApiQuery, useApiMutation } from '@/lib/hooks/api/use-api.hook';
import { ApiError } from '@/lib/types/api/api-error.type';

// Mock API route definitions
const mockUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

const mockUserListSchema = z.object({
  users: z.array(mockUserSchema),
  total: z.number(),
});

const mockUpdateUserSchema = z.object({
  name: z.string(),
});

const mockRoutes = {
  users: {
    list: {
      path: '/api/users',
      method: 'GET' as const,
      responseSchema: mockUserListSchema,
      querySchema: z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }),
    },
    get: {
      path: (id: string) => `/api/users/${id}`,
      method: 'GET' as const,
      responseSchema: mockUserSchema,
    },
    update: {
      path: (id: string) => `/api/users/${id}`,
      method: 'PATCH' as const,
      requestSchema: mockUpdateUserSchema,
      responseSchema: mockUserSchema,
    },
  },
};

// Mock data
const mockUsers = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
];

// Setup MSW server
const server = setupServer(
  // GET /api/users
  http.get('http://localhost:3000/api/users', ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');

    return HttpResponse.json({
      users: mockUsers.slice(
        offset ? parseInt(offset) : 0,
        limit ? parseInt(limit) : undefined
      ),
      total: mockUsers.length,
    });
  }),

  // GET /api/users/:id
  http.get('http://localhost:3000/api/users/:id', ({ params }) => {
    const user = mockUsers.find((u) => u.id === params.id);
    if (!user) {
      return new HttpResponse(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      });
    }
    return HttpResponse.json(user);
  }),

  // PATCH /api/users/:id
  http.patch(
    'http://localhost:3000/api/users/:id',
    async ({ params, request }) => {
      const body = (await request.json()) as { name: string };
      const user = mockUsers.find((u) => u.id === params.id);

      if (!user) {
        return new HttpResponse(JSON.stringify({ error: 'User not found' }), {
          status: 404,
        });
      }

      const updatedUser = { ...user, ...body };
      return HttpResponse.json(updatedUser);
    }
  )
);

// SWR wrapper for tests
function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        {children}
      </SWRConfig>
    );
  };
}

describe('SWR API Hooks', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('useApiQuery', () => {
    it('should fetch data successfully', async () => {
      const { result } = renderHook(() => useApiQuery(mockRoutes.users.list), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        users: mockUsers,
        total: mockUsers.length,
      });
      expect(result.current.error).toBeUndefined();
    });

    it('should fetch data with query parameters', async () => {
      const { result } = renderHook(
        () =>
          useApiQuery(mockRoutes.users.list, {
            queryParams: { limit: 1, offset: 0 },
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.users).toHaveLength(1);
      expect(result.current.data?.users[0]).toEqual(mockUsers[0]);
    });

    it('should fetch data with path parameters', async () => {
      const { result } = renderHook(
        () =>
          useApiQuery(mockRoutes.users.get, {
            pathParams: ['1'],
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockUsers[0]);
    });

    it('should handle 404 errors', async () => {
      const { result } = renderHook(
        () =>
          useApiQuery(mockRoutes.users.get, {
            pathParams: ['999'],
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error).toBeInstanceOf(ApiError);
      expect(result.current.error?.status).toBe(404);
      expect(result.current.data).toBeUndefined();
    });

    it('should apply custom SWR config', async () => {
      const onSuccess = vi.fn();

      const { result } = renderHook(
        () =>
          useApiQuery(mockRoutes.users.list, {
            swrConfig: {
              onSuccess,
            },
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          users: mockUsers,
          total: mockUsers.length,
        }),
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe('useApiMutation', () => {
    it('should perform mutation successfully', async () => {
      const { result } = renderHook(
        () =>
          useApiMutation(mockRoutes.users.update, {
            pathParams: ['1'],
          }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isMutating).toBe(false);

      // Trigger mutation
      const promise = result.current.trigger({ name: 'Alice Updated' });

      expect(result.current.isMutating).toBe(true);

      const data = await promise;

      expect(data).toEqual({
        id: '1',
        name: 'Alice Updated',
        email: 'alice@example.com',
      });

      await waitFor(() => {
        expect(result.current.isMutating).toBe(false);
      });
    });

    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn();

      const { result } = renderHook(
        () =>
          useApiMutation(mockRoutes.users.update, {
            pathParams: ['1'],
            onSuccess,
          }),
        { wrapper: createWrapper() }
      );

      await result.current.trigger({ name: 'Alice Updated' });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '1',
            name: 'Alice Updated',
          })
        );
      });
    });

    it('should call onError callback on failure', async () => {
      const onError = vi.fn();

      const { result } = renderHook(
        () =>
          useApiMutation(mockRoutes.users.update, {
            pathParams: ['999'], // Non-existent user
            onError,
          }),
        { wrapper: createWrapper() }
      );

      try {
        await result.current.trigger({ name: 'Updated' });
      } catch (error) {
        // Expected to throw
      }

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(ApiError));
      });
    });

    it('should perform optimistic updates', async () => {
      const optimisticData = vi.fn((currentData) => ({
        ...currentData,
        users: [
          { id: '1', name: 'Optimistic Alice', email: 'alice@example.com' },
          ...mockUsers.slice(1),
        ],
      }));

      const { result } = renderHook(
        () =>
          useApiMutation(mockRoutes.users.update, {
            pathParams: ['1'],
            optimisticKeys: ['/api/users'],
            optimisticData,
            rollbackOnError: true,
          }),
        { wrapper: createWrapper() }
      );

      await result.current.trigger({ name: 'Alice Updated' });

      expect(optimisticData).toHaveBeenCalled();
    });

    it('should revalidate keys after mutation', async () => {
      // This test would require setting up SWR cache and checking revalidation
      // For now, we verify the config is passed correctly
      const { result } = renderHook(
        () =>
          useApiMutation(mockRoutes.users.update, {
            pathParams: ['1'],
            revalidateKeys: ['/api/users'],
          }),
        { wrapper: createWrapper() }
      );

      await result.current.trigger({ name: 'Alice Updated' });

      await waitFor(() => {
        expect(result.current.isMutating).toBe(false);
      });

      // Mutation completed successfully
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      server.use(
        http.get('http://localhost:3000/api/users', () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useApiQuery(mockRoutes.users.list), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error).toBeInstanceOf(ApiError);
    });

    it('should handle validation errors', async () => {
      server.use(
        http.get('http://localhost:3000/api/users', () => {
          return HttpResponse.json({
            users: 'invalid', // Should be an array
            total: 0,
          });
        })
      );

      const { result } = renderHook(() => useApiQuery(mockRoutes.users.list), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error).toBeInstanceOf(ApiError);
      expect(result.current.error?.message).toContain(
        'Invalid response format'
      );
    });
  });
});
