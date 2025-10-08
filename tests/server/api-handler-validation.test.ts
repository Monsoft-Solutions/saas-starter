import { describe, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler } from '@/lib/server/api-handler';

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

// Test schema
const testOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
});

type TestOutput = z.infer<typeof testOutputSchema>;

// Helper to create a mock NextRequest
function createMockRequest(): NextRequest {
  const url = new URL('http://localhost:3000/api/test');

  return {
    json: vi.fn(),
    nextUrl: url,
    headers: new Headers(),
  } as unknown as NextRequest;
}

// Helper to create mock route context
const mockRouteContext = {
  params: Promise.resolve({}),
};

describe('createApiHandler with Output Validation', () => {
  describe('Without Output Schema', () => {
    it('should work as before when no output schema is provided', async () => {
      const handler = createApiHandler<TestOutput>(async () => {
        return {
          id: '123',
          name: 'Test',
          value: 42,
        };
      });

      const request = createMockRequest();
      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: '123',
        name: 'Test',
        value: 42,
      });
    });

    it('should handle NextResponse returns', async () => {
      const handler = createApiHandler(async () => {
        return NextResponse.json({ custom: true }, { status: 201 });
      });

      const request = createMockRequest();
      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(201);
    });

    it('should handle void returns (204 No Content)', async () => {
      const handler = createApiHandler(async () => {
        return undefined;
      });

      const request = createMockRequest();
      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(204);
    });
  });

  describe('With Output Schema', () => {
    it('should validate valid output against schema', async () => {
      const validOutput: TestOutput = {
        id: '123',
        name: 'Valid Test',
        value: 100,
      };

      const handler = createApiHandler<TestOutput>(async () => validOutput, {
        outputSchema: testOutputSchema,
      });

      const request = createMockRequest();
      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(validOutput);
    });

    it('should reject invalid output in development mode', async () => {
      const invalidOutput = {
        id: '123',
        name: 'Invalid Test',
        // Missing 'value' field
      };

      const handler = createApiHandler<TestOutput>(
        async () => invalidOutput as TestOutput,
        { outputSchema: testOutputSchema }
      );

      const request = createMockRequest();
      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it('should transform output when schema has transforms', async () => {
      const transformSchema = z.object({
        id: z.string(),
        name: z.string().transform((s) => s.toUpperCase()),
        value: z.number(),
      });

      const handler = createApiHandler(
        async () => ({
          id: '123',
          name: 'lowercase',
          value: 42,
        }),
        { outputSchema: transformSchema }
      );

      const request = createMockRequest();
      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.name).toBe('LOWERCASE');
    });

    it('should use custom success status with output validation', async () => {
      const handler = createApiHandler<TestOutput>(
        async () => ({
          id: '123',
          name: 'Created',
          value: 1,
        }),
        {
          outputSchema: testOutputSchema,
          successStatus: 201,
        }
      );

      const request = createMockRequest();
      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toHaveProperty('id');
    });
  });

  describe('Error Handling', () => {
    it('should handle handler errors gracefully', async () => {
      const handler = createApiHandler(
        async () => {
          throw new Error('Handler error');
        },
        { outputSchema: testOutputSchema }
      );

      const request = createMockRequest();
      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Internal Server Error');
    });

    it('should call onError callback when provided', async () => {
      const onError = vi.fn();
      const testError = new Error('Test error');

      const handler = createApiHandler(
        async () => {
          throw testError;
        },
        {
          outputSchema: testOutputSchema,
          onError,
        }
      );

      const request = createMockRequest();
      await handler(request, mockRouteContext);

      expect(onError).toHaveBeenCalledWith(testError);
    });
  });

  describe('Backward Compatibility', () => {
    it('should not break existing handlers without output schema', async () => {
      // This tests that existing code continues to work
      const legacyHandler = createApiHandler(async () => {
        return {
          id: '123',
          name: 'Legacy',
          value: 999,
          extraField:
            'This would fail validation but should pass without schema',
        };
      });

      const request = createMockRequest();
      const response = await legacyHandler(request, mockRouteContext);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.extraField).toBe(
        'This would fail validation but should pass without schema'
      );
    });
  });

  describe('Complex Schemas', () => {
    it('should handle nested object schemas', async () => {
      const nestedSchema = z.object({
        id: z.string(),
        user: z.object({
          name: z.string(),
          email: z.string().email(),
        }),
        metadata: z.object({
          created: z.string().datetime(),
          tags: z.array(z.string()),
        }),
      });

      const validData = {
        id: '123',
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        metadata: {
          created: new Date().toISOString(),
          tags: ['tag1', 'tag2'],
        },
      };

      const handler = createApiHandler(async () => validData, {
        outputSchema: nestedSchema,
      });

      const request = createMockRequest();
      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(validData);
    });

    it('should handle array schemas', async () => {
      const arraySchema = z.array(
        z.object({
          id: z.string(),
          name: z.string(),
        })
      );

      const validArray = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];

      const handler = createApiHandler(async () => validArray, {
        outputSchema: arraySchema,
      });

      const request = createMockRequest();
      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(validArray);
    });

    it('should handle optional fields correctly', async () => {
      const schemaWithOptional = z.object({
        id: z.string(),
        name: z.string(),
        optional: z.string().optional(),
      });

      const dataWithoutOptional = {
        id: '123',
        name: 'Test',
      };

      const handler = createApiHandler(async () => dataWithoutOptional, {
        outputSchema: schemaWithOptional,
      });

      const request = createMockRequest();
      const response = await handler(request, mockRouteContext);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(dataWithoutOptional);
    });
  });
});
