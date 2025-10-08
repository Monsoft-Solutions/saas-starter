import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createValidatedApiHandler,
  createValidatedAuthenticatedHandler,
  createValidatedOrganizationHandler,
} from '@/lib/server/validated-api-handler';
import * as serverContext from '@/lib/auth/server-context';

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

// Test schemas
const testInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).optional(),
});

const testOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string().datetime(),
});

type TestInput = z.infer<typeof testInputSchema>;
type TestOutput = z.infer<typeof testOutputSchema>;

// Helper to create a mock NextRequest
function createMockRequest(
  body?: unknown,
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL('http://localhost:3000/api/test');

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const mockJson = vi.fn().mockResolvedValue(body ?? {});

  return {
    json: mockJson,
    nextUrl: url,
    headers: new Headers(),
  } as unknown as NextRequest;
}

// Helper to create mock route context
const mockRouteContext = {
  params: Promise.resolve({}),
};

describe('createValidatedApiHandler', () => {
  describe('Input Validation', () => {
    it('should successfully validate valid input from request body', async () => {
      const validInput: TestInput = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      const handler = createValidatedApiHandler(
        testInputSchema,
        testOutputSchema,
        async ({ data }) => {
          expect(data).toEqual(validInput);
          return {
            id: '123',
            name: data.name,
            email: data.email,
            createdAt: new Date().toISOString(),
          };
        }
      );

      const request = createMockRequest(validInput);
      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('id', '123');
    });

    it('should reject invalid input with 400 status', async () => {
      const invalidInput = {
        name: '', // Invalid: min length 1
        email: 'not-an-email', // Invalid email format
      };

      const handler = createValidatedApiHandler(
        testInputSchema,
        testOutputSchema,
        async () => {
          throw new Error('Should not reach handler');
        }
      );

      const request = createMockRequest(invalidInput);
      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it('should handle invalid JSON with 400 status', async () => {
      const handler = createValidatedApiHandler(
        testInputSchema,
        testOutputSchema,
        async () => {
          throw new Error('Should not reach handler');
        }
      );

      const request = {
        json: vi.fn().mockRejectedValue(new SyntaxError('Invalid JSON')),
        nextUrl: new URL('http://localhost:3000/api/test'),
        headers: new Headers(),
      } as unknown as NextRequest;

      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid JSON');
    });

    it('should validate query parameters when inputSource is query', async () => {
      const querySchema = z.object({
        page: z.coerce.number().min(1),
        limit: z.coerce.number().min(1).max(100),
      });

      const outputSchema = z.object({
        items: z.array(z.string()),
        total: z.number(),
      });

      const handler = createValidatedApiHandler(
        querySchema,
        outputSchema,
        async ({ data }) => {
          expect(data.page).toBe(2);
          expect(data.limit).toBe(20);
          return {
            items: ['item1', 'item2'],
            total: 100,
          };
        },
        { inputSource: 'query' }
      );

      const request = createMockRequest(undefined, {
        page: '2',
        limit: '20',
      });

      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('items');
      expect(body).toHaveProperty('total');
    });
  });

  describe('Output Validation', () => {
    it('should successfully validate valid output', async () => {
      const validOutput: TestOutput = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date().toISOString(),
      };

      const handler = createValidatedApiHandler(
        testInputSchema,
        testOutputSchema,
        async () => validOutput
      );

      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(validOutput);
    });

    it('should reject invalid output with 500 status in development', async () => {
      const invalidOutput = {
        id: '123',
        name: 'John Doe',
        // Missing required email field
        createdAt: 'not-a-datetime', // Invalid datetime format
      };

      const handler = createValidatedApiHandler(
        testInputSchema,
        testOutputSchema,
        async () => invalidOutput as TestOutput
      );

      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });
  });

  describe('Success Status Codes', () => {
    it('should use custom success status when provided', async () => {
      const handler = createValidatedApiHandler(
        testInputSchema,
        testOutputSchema,
        async () => ({
          id: '123',
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date().toISOString(),
        }),
        { successStatus: 201 }
      );

      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(201);
    });
  });
});

describe('createValidatedAuthenticatedHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject requests without authentication', async () => {
    vi.spyOn(serverContext, 'getServerContextFromHeaders').mockResolvedValue(
      null
    );

    const handler = createValidatedAuthenticatedHandler(
      testInputSchema,
      testOutputSchema,
      async () => {
        throw new Error('Should not reach handler');
      }
    );

    const request = createMockRequest({
      name: 'John Doe',
      email: 'john@example.com',
    });

    const response = await handler(request, mockRouteContext);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toContain('Unauthorized');
  });

  it('should process authenticated requests with valid input/output', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    };

    const mockContext = {
      user: mockUser,
      session: { id: 'session-123' },
      organization: null,
      headers: new Headers(),
    };

    vi.spyOn(serverContext, 'getServerContextFromHeaders').mockResolvedValue(
      mockContext as unknown as serverContext.ServerContext
    );

    const handler = createValidatedAuthenticatedHandler(
      testInputSchema,
      testOutputSchema,
      async ({ data, context }) => {
        expect(context.user).toEqual(mockUser);
        return {
          id: '123',
          name: data.name,
          email: data.email,
          createdAt: new Date().toISOString(),
        };
      }
    );

    const request = createMockRequest({
      name: 'John Doe',
      email: 'john@example.com',
    });

    const response = await handler(request, mockRouteContext);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('id');
  });

  it('should support query parameter validation with authentication', async () => {
    const mockContext = {
      user: { id: 'user-123' },
      session: { id: 'session-123' },
      organization: null,
      headers: new Headers(),
    };

    vi.spyOn(serverContext, 'getServerContextFromHeaders').mockResolvedValue(
      mockContext as unknown as serverContext.ServerContext
    );

    const querySchema = z.object({
      filter: z.string(),
    });

    const outputSchema = z.object({
      results: z.array(z.string()),
    });

    const handler = createValidatedAuthenticatedHandler(
      querySchema,
      outputSchema,
      async ({ data, context }) => {
        expect(data.filter).toBe('active');
        expect(context.user.id).toBe('user-123');
        return { results: ['item1', 'item2'] };
      },
      { inputSource: 'query' }
    );

    const request = createMockRequest(undefined, { filter: 'active' });

    const response = await handler(request, mockRouteContext);

    expect(response.status).toBe(200);
  });
});

describe('createValidatedOrganizationHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject requests without authentication', async () => {
    vi.spyOn(serverContext, 'getServerContextFromHeaders').mockResolvedValue(
      null
    );

    const handler = createValidatedOrganizationHandler(
      testInputSchema,
      testOutputSchema,
      async () => {
        throw new Error('Should not reach handler');
      }
    );

    const request = createMockRequest({
      name: 'John Doe',
      email: 'john@example.com',
    });

    const response = await handler(request, mockRouteContext);

    expect(response.status).toBe(401);
  });

  it('should reject authenticated requests without organization', async () => {
    const mockContext = {
      user: { id: 'user-123' },
      session: { id: 'session-123' },
      organization: null,
      headers: new Headers(),
    };

    vi.spyOn(serverContext, 'getServerContextFromHeaders').mockResolvedValue(
      mockContext as unknown as serverContext.ServerContext
    );

    const handler = createValidatedOrganizationHandler(
      testInputSchema,
      testOutputSchema,
      async () => {
        throw new Error('Should not reach handler');
      }
    );

    const request = createMockRequest({
      name: 'John Doe',
      email: 'john@example.com',
    });

    const response = await handler(request, mockRouteContext);

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toContain('organization');
  });

  it('should process requests with valid authentication and organization', async () => {
    const mockOrganization = {
      id: 'org-123',
      name: 'Test Org',
    };

    const mockContext = {
      user: { id: 'user-123' },
      session: { id: 'session-123' },
      organization: mockOrganization,
      headers: new Headers(),
    };

    vi.spyOn(serverContext, 'getServerContextFromHeaders').mockResolvedValue(
      mockContext as unknown as serverContext.ServerContext
    );

    const handler = createValidatedOrganizationHandler(
      testInputSchema,
      testOutputSchema,
      async ({ data, context }) => {
        expect(data).toEqual({
          name: 'John Doe',
          email: 'john@example.com',
        });
        expect(context.organization).toEqual(mockOrganization);
        expect(context.user.id).toBe('user-123');
        return {
          id: '123',
          name: data.name,
          email: data.email,
          createdAt: new Date().toISOString(),
        };
      }
    );

    const request = createMockRequest({
      name: 'John Doe',
      email: 'john@example.com',
    });

    const response = await handler(request, mockRouteContext);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('id');
  });
});

describe('Type Helpers', () => {
  it('should correctly infer input and output types', () => {
    const handler = createValidatedApiHandler(
      testInputSchema,
      testOutputSchema,
      async ({ data }) => {
        // Type assertion to verify types are correct
        const _input: TestInput = data;
        const output: TestOutput = {
          id: '123',
          name: _input.name,
          email: _input.email,
          createdAt: new Date().toISOString(),
        };
        return output;
      }
    );

    expect(handler).toBeDefined();
  });
});
