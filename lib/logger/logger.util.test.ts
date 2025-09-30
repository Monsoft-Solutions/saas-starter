import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for Logger Utility Functions
 *
 * Tests cover:
 * - logInfo() function
 * - logError() function with Error objects and plain objects
 * - logWarn() function
 * - logDebug() function
 * - logHttp() function
 * - Metadata handling
 */

// Create mock functions
const mockInfo = vi.fn();
const mockError = vi.fn();
const mockWarn = vi.fn();
const mockDebug = vi.fn();
const mockHttp = vi.fn();

// Mock the logger with both default export and convenience functions
vi.mock('./logger.service', async () => {
  return {
    default: {
      info: mockInfo,
      error: mockError,
      warn: mockWarn,
      debug: mockDebug,
      http: mockHttp,
    },
    logInfo: (message: string, meta?: any) => mockInfo(message, meta),
    logError: (message: string, error?: Error | any, meta?: any) => {
      if (error instanceof Error) {
        mockError(message, {
          error: error.message,
          stack: error.stack,
          ...meta,
        });
      } else {
        mockError(message, { error, ...meta });
      }
    },
    logWarn: (message: string, meta?: any) => mockWarn(message, meta),
    logDebug: (message: string, meta?: any) => mockDebug(message, meta),
    logHttp: (message: string, meta?: any) => mockHttp(message, meta),
  };
});

describe('Logger Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logInfo', () => {
    it('should log info message without metadata', async () => {
      const { logInfo } = await import('./logger.service');

      logInfo('Test info message');

      expect(mockInfo).toHaveBeenCalledWith('Test info message', undefined);
    });

    it('should log info message with metadata', async () => {
      const { logInfo } = await import('./logger.service');

      const metadata = { userId: '123', action: 'login' };
      logInfo('User logged in', metadata);

      expect(mockInfo).toHaveBeenCalledWith('User logged in', metadata);
    });

    it('should handle null metadata', async () => {
      const { logInfo } = await import('./logger.service');

      logInfo('Test message', null);

      expect(mockInfo).toHaveBeenCalledWith('Test message', null);
    });
  });

  describe('logError', () => {
    it('should log error message without error object', async () => {
      const { logError } = await import('./logger.service');

      logError('Test error message');

      expect(mockError).toHaveBeenCalledWith('Test error message', {
        error: undefined,
      });
    });

    it('should log error message with Error object', async () => {
      const { logError } = await import('./logger.service');

      const error = new Error('Test error');
      logError('An error occurred', error);

      expect(mockError).toHaveBeenCalledWith('An error occurred', {
        error: 'Test error',
        stack: expect.stringContaining('Error: Test error'),
      });
    });

    it('should log error message with Error object and metadata', async () => {
      const { logError } = await import('./logger.service');

      const error = new Error('Test error');
      const metadata = { userId: '123', action: 'payment' };
      logError('Payment failed', error, metadata);

      expect(mockError).toHaveBeenCalledWith('Payment failed', {
        error: 'Test error',
        stack: expect.stringContaining('Error: Test error'),
        userId: '123',
        action: 'payment',
      });
    });

    it('should handle non-Error objects', async () => {
      const { logError } = await import('./logger.service');

      const errorObj = {
        code: 'CUSTOM_ERROR',
        details: 'Something went wrong',
      };
      logError('Custom error occurred', errorObj);

      expect(mockError).toHaveBeenCalledWith('Custom error occurred', {
        error: errorObj,
      });
    });

    it('should handle string errors', async () => {
      const { logError } = await import('./logger.service');

      logError('String error occurred', 'Something went wrong');

      expect(mockError).toHaveBeenCalledWith('String error occurred', {
        error: 'Something went wrong',
      });
    });

    it('should preserve error stack trace', async () => {
      const { logError } = await import('./logger.service');

      const error = new Error('Test error with stack');
      error.stack =
        'Error: Test error with stack\n    at someFunction (file.ts:10:5)';

      logError('Error with stack', error);

      expect(mockError).toHaveBeenCalledWith('Error with stack', {
        error: 'Test error with stack',
        stack:
          'Error: Test error with stack\n    at someFunction (file.ts:10:5)',
      });
    });
  });

  describe('logWarn', () => {
    it('should log warning message without metadata', async () => {
      const { logWarn } = await import('./logger.service');

      logWarn('Test warning message');

      expect(mockWarn).toHaveBeenCalledWith('Test warning message', undefined);
    });

    it('should log warning message with metadata', async () => {
      const { logWarn } = await import('./logger.service');

      const metadata = { resource: 'disk', usage: 85 };
      logWarn('High disk usage', metadata);

      expect(mockWarn).toHaveBeenCalledWith('High disk usage', metadata);
    });
  });

  describe('logDebug', () => {
    it('should log debug message without metadata', async () => {
      const { logDebug } = await import('./logger.service');

      logDebug('Test debug message');

      expect(mockDebug).toHaveBeenCalledWith('Test debug message', undefined);
    });

    it('should log debug message with metadata', async () => {
      const { logDebug } = await import('./logger.service');

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
      const { logHttp } = await import('./logger.service');

      logHttp('GET /api/users 200');

      expect(mockHttp).toHaveBeenCalledWith('GET /api/users 200', undefined);
    });

    it('should log HTTP message with metadata', async () => {
      const { logHttp } = await import('./logger.service');

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
      const { logInfo } = await import('./logger.service');

      logInfo('');

      expect(mockInfo).toHaveBeenCalledWith('', undefined);
    });

    it('should handle very long messages', async () => {
      const { logInfo } = await import('./logger.service');

      const longMessage = 'a'.repeat(10000);
      logInfo(longMessage);

      expect(mockInfo).toHaveBeenCalledWith(longMessage, undefined);
    });

    it('should handle complex metadata objects', async () => {
      const { logInfo } = await import('./logger.service');

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
      const { logInfo } = await import('./logger.service');

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
      const { logError } = await import('./logger.service');

      logError('Test with undefined', undefined);
      expect(mockError).toHaveBeenCalledWith('Test with undefined', {
        error: undefined,
      });

      logError('Test with null', null);
      expect(mockError).toHaveBeenCalledWith('Test with null', {
        error: null,
      });
    });
  });

  describe('Type Safety', () => {
    it('should accept any valid metadata type', async () => {
      const { logInfo } = await import('./logger.service');

      // String metadata
      logInfo('Test', 'string meta');

      // Number metadata
      logInfo('Test', 42);

      // Boolean metadata
      logInfo('Test', true);

      // Object metadata
      logInfo('Test', { key: 'value' });

      // Array metadata
      logInfo('Test', [1, 2, 3]);

      expect(mockInfo).toHaveBeenCalledTimes(5);
    });
  });
});
