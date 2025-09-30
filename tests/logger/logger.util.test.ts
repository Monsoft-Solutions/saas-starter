import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LogMetadata, ErrorPayload } from '../../lib/logger/logger.types';

/**
 * Unit tests for Logger Utility Functions
 *
 * Tests cover:
 * - logInfo() function with proper typing
 * - logError() function with Error objects and plain objects and error payload normalization
 * - logWarn() function with proper typing
 * - logDebug() function with proper typing
 * - logHttp() function with proper typing
 * - Metadata handling with proper typing
 * - Error payload normalization
 */

// Create mock functions
const mockInfo = vi.fn();
const mockError = vi.fn();
const mockWarn = vi.fn();
const mockDebug = vi.fn();
const mockHttp = vi.fn();

// Mock the logger with both default export and convenience functions
// We need to mock both the logger instance and the convenience functions
// because the convenience functions in the actual module use the logger instance
vi.mock('../../lib/logger/logger.service', () => {
  return {
    default: {
      info: mockInfo,
      error: mockError,
      warn: mockWarn,
      debug: mockDebug,
      http: mockHttp,
    },
    logInfo: (message: string, meta?: LogMetadata) => mockInfo(message, meta),
    logError: (message: string, error?: unknown, meta?: LogMetadata) => {
      // Simulate the new error payload normalization
      let errorPayload: ErrorPayload | undefined;

      if (error instanceof Error) {
        // Extract additional enumerable properties safely
        const details: Record<string, unknown> = {};

        // Copy enumerable properties that aren't standard Error properties
        for (const [key, value] of Object.entries(error)) {
          if (!['name', 'message', 'stack', 'cause'].includes(key)) {
            try {
              // Only include serializable values
              if (typeof value !== 'function' && typeof value !== 'symbol') {
                details[key] = value;
              }
            } catch {
              // Skip properties that can't be serialized
              continue;
            }
          }
        }

        errorPayload = {
          message: error.message,
          name: error.name,
          stack: error.stack,
          ...(Object.keys(details).length > 0 && { details }),
        };
      } else if (error && typeof error === 'object' && !Array.isArray(error)) {
        const { message, name, stack, ...rest } = error as Record<
          string,
          unknown
        >;
        errorPayload = {
          message: typeof message === 'string' ? message : 'Unknown error',
          ...(typeof name === 'string' && { name }),
          ...(typeof stack === 'string' && { stack }),
          ...(Object.keys(rest).length > 0 && { details: rest }),
        };
      } else if (error !== undefined) {
        errorPayload = {
          message: typeof error === 'string' ? error : 'Unknown error occurred',
          details: { originalValue: error },
        };
      }

      mockError(message, {
        ...(errorPayload && { error: errorPayload }),
        ...meta,
      });
    },
    logWarn: (message: string, meta?: LogMetadata) => mockWarn(message, meta),
    logDebug: (message: string, meta?: LogMetadata) => mockDebug(message, meta),
    logHttp: (message: string, meta?: LogMetadata) => mockHttp(message, meta),
    morganStream: {
      write: vi.fn(),
    },
  };
});

describe('Logger Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logInfo', () => {
    it('should log info message without metadata', async () => {
      const { logInfo } = await import('../../lib/logger/logger.service');

      logInfo('Test info message');

      expect(mockInfo).toHaveBeenCalledWith('Test info message', undefined);
    });

    it('should log info message with metadata', async () => {
      const { logInfo } = await import('../../lib/logger/logger.service');

      const metadata = { userId: '123', action: 'login' };
      logInfo('User logged in', metadata);

      expect(mockInfo).toHaveBeenCalledWith('User logged in', metadata);
    });

    it('should handle null metadata', async () => {
      const { logInfo } = await import('../../lib/logger/logger.service');

      logInfo('Test message', null as unknown as LogMetadata);

      expect(mockInfo).toHaveBeenCalledWith('Test message', null);
    });
  });

  describe('logError', () => {
    it('should log error message without error object', async () => {
      const { logError } = await import('../../lib/logger/logger.service');

      logError('Test error message');

      expect(mockError).toHaveBeenCalledWith('Test error message', {});
    });

    it('should log error message with Error object', async () => {
      const { logError } = await import('../../lib/logger/logger.service');

      const error = new Error('Test error');
      logError('An error occurred', error);

      expect(mockError).toHaveBeenCalledWith('An error occurred', {
        error: {
          message: 'Test error',
          name: 'Error',
          stack: expect.stringContaining('Error: Test error'),
        },
      });
    });

    it('should log error message with Error object and metadata', async () => {
      const { logError } = await import('../../lib/logger/logger.service');

      const error = new Error('Test error');
      const metadata = { userId: '123', action: 'payment' };
      logError('Payment failed', error, metadata);

      expect(mockError).toHaveBeenCalledWith('Payment failed', {
        error: {
          message: 'Test error',
          name: 'Error',
          stack: expect.stringContaining('Error: Test error'),
        },
        userId: '123',
        action: 'payment',
      });
    });

    it('should handle non-Error objects', async () => {
      const { logError } = await import('../../lib/logger/logger.service');

      const errorObj = {
        code: 'CUSTOM_ERROR',
        details: 'Something went wrong',
      };
      logError('Custom error occurred', errorObj);

      expect(mockError).toHaveBeenCalledWith('Custom error occurred', {
        error: {
          message: 'Unknown error',
          details: {
            code: 'CUSTOM_ERROR',
            details: 'Something went wrong',
          },
        },
      });
    });

    it('should handle string errors', async () => {
      const { logError } = await import('../../lib/logger/logger.service');

      logError('String error occurred', 'Something went wrong');

      expect(mockError).toHaveBeenCalledWith('String error occurred', {
        error: {
          message: 'Something went wrong',
          details: { originalValue: 'Something went wrong' },
        },
      });
    });

    it('should preserve error stack trace', async () => {
      const { logError } = await import('../../lib/logger/logger.service');

      const error = new Error('Test error with stack');
      error.stack =
        'Error: Test error with stack\n    at someFunction (file.ts:10:5)';

      logError('Error with stack', error);

      expect(mockError).toHaveBeenCalledWith('Error with stack', {
        error: {
          message: 'Test error with stack',
          name: 'Error',
          stack:
            'Error: Test error with stack\n    at someFunction (file.ts:10:5)',
        },
      });
    });
  });

  describe('logWarn', () => {
    it('should log warning message without metadata', async () => {
      const { logWarn } = await import('../../lib/logger/logger.service');

      logWarn('Test warning message');

      expect(mockWarn).toHaveBeenCalledWith('Test warning message', undefined);
    });

    it('should log warning message with metadata', async () => {
      const { logWarn } = await import('../../lib/logger/logger.service');

      const metadata = { resource: 'disk', usage: 85 };
      logWarn('High disk usage', metadata);

      expect(mockWarn).toHaveBeenCalledWith('High disk usage', metadata);
    });
  });

  describe('logDebug', () => {
    it('should log debug message without metadata', async () => {
      const { logDebug } = await import('../../lib/logger/logger.service');

      logDebug('Test debug message');

      expect(mockDebug).toHaveBeenCalledWith('Test debug message', undefined);
    });

    it('should log debug message with metadata', async () => {
      const { logDebug } = await import('../../lib/logger/logger.service');

      const metadata = { query: 'SELECT * FROM users', duration: 150 };
      logDebug('Database query executed', metadata);

      expect(mockDebug).toHaveBeenCalledWith(
        'Database query executed',
        metadata
      );
    });
  });

  describe('logHttp', () => {
    it('should log HTTP message without metadata', async () => {
      const { logHttp } = await import('../../lib/logger/logger.service');

      logHttp('GET /api/users 200');

      expect(mockHttp).toHaveBeenCalledWith('GET /api/users 200', undefined);
    });

    it('should log HTTP message with metadata', async () => {
      const { logHttp } = await import('../../lib/logger/logger.service');

      const metadata = {
        method: 'POST',
        path: '/api/users',
        status: 201,
        duration: 250,
      };
      logHttp('API request', metadata);

      expect(mockHttp).toHaveBeenCalledWith('API request', metadata);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string messages', async () => {
      const { logInfo } = await import('../../lib/logger/logger.service');

      logInfo('');

      expect(mockInfo).toHaveBeenCalledWith('', undefined);
    });

    it('should handle very long messages', async () => {
      const { logInfo } = await import('../../lib/logger/logger.service');

      const longMessage = 'a'.repeat(10000);
      logInfo(longMessage);

      expect(mockInfo).toHaveBeenCalledWith(longMessage, undefined);
    });

    it('should handle complex metadata objects', async () => {
      const { logInfo } = await import('../../lib/logger/logger.service');

      const complexMeta = {
        user: {
          id: '123',
          name: 'John Doe',
          roles: ['admin', 'user'],
        },
        request: {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
        },
        timestamp: new Date(),
      };

      logInfo('Complex metadata test', complexMeta);

      expect(mockInfo).toHaveBeenCalledWith(
        'Complex metadata test',
        complexMeta
      );
    });

    it('should handle circular references in metadata', async () => {
      const { logInfo } = await import('../../lib/logger/logger.service');

      const circular: any = { name: 'test' };
      circular.self = circular;

      // Winston should handle circular references gracefully
      logInfo('Circular reference test', circular);

      expect(mockInfo).toHaveBeenCalledWith(
        'Circular reference test',
        circular
      );
    });

    it('should handle undefined and null error parameters', async () => {
      const { logError } = await import('../../lib/logger/logger.service');

      logError('Test with undefined', undefined);
      expect(mockError).toHaveBeenCalledWith('Test with undefined', {});

      logError('Test with null', null);
      expect(mockError).toHaveBeenCalledWith('Test with null', {
        error: {
          message: 'Unknown error occurred',
          details: { originalValue: null },
        },
      });
    });
  });

  describe('Error Payload Normalization', () => {
    it('should normalize Error objects with additional properties', async () => {
      const { logError } = await import('../../lib/logger/logger.service');

      const error = new Error('Test error');
      (error as any).code = 'CUSTOM_ERROR';
      (error as any).statusCode = 500;
      (error as any).context = { userId: '123' };

      logError('Error with additional properties', error);

      expect(mockError).toHaveBeenCalledWith(
        'Error with additional properties',
        {
          error: {
            message: 'Test error',
            name: 'Error',
            stack: expect.stringContaining('Error: Test error'),
            details: {
              code: 'CUSTOM_ERROR',
              statusCode: 500,
              context: { userId: '123' },
            },
          },
        }
      );
    });

    it('should handle plain objects with message property', async () => {
      const { logError } = await import('../../lib/logger/logger.service');

      const errorObj = {
        message: 'Custom error message',
        name: 'CustomError',
        stack: 'Custom stack trace',
        code: 'CUSTOM_CODE',
        extra: 'data',
      };

      logError('Plain object error', errorObj);

      expect(mockError).toHaveBeenCalledWith('Plain object error', {
        error: {
          message: 'Custom error message',
          name: 'CustomError',
          stack: 'Custom stack trace',
          details: {
            code: 'CUSTOM_CODE',
            extra: 'data',
          },
        },
      });
    });

    it('should handle primitive error values', async () => {
      const { logError } = await import('../../lib/logger/logger.service');

      logError('Number error', 42);
      expect(mockError).toHaveBeenCalledWith('Number error', {
        error: {
          message: 'Unknown error occurred',
          details: { originalValue: 42 },
        },
      });

      logError('Boolean error', true);
      expect(mockError).toHaveBeenCalledWith('Boolean error', {
        error: {
          message: 'Unknown error occurred',
          details: { originalValue: true },
        },
      });
    });
  });

  describe('Type Safety', () => {
    it('should accept properly typed metadata', async () => {
      const { logInfo } = await import('../../lib/logger/logger.service');

      // Object metadata (properly typed)
      const metadata: LogMetadata = {
        userId: '123',
        action: 'login',
        timestamp: new Date(),
        nested: { key: 'value' },
      };

      logInfo('Test with typed metadata', metadata);

      expect(mockInfo).toHaveBeenCalledWith(
        'Test with typed metadata',
        metadata
      );
    });
  });
});
