/**
 * Unit tests for API error handling
 */

import { describe, it, expect } from 'vitest';
import { ApiError, isApiError } from '@/lib/types/api/api-error.type';

describe('ApiError', () => {
  describe('Constructor', () => {
    it('should create an ApiError with basic properties', () => {
      const error = new ApiError('Test error', 400);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should create an ApiError with details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = new ApiError('Validation error', 400, details);

      expect(error.details).toEqual(details);
    });

    it('should create an ApiError with URL and method', () => {
      const error = new ApiError(
        'Not found',
        404,
        undefined,
        '/api/users/123',
        'GET'
      );

      expect(error.url).toBe('/api/users/123');
      expect(error.method).toBe('GET');
    });

    it('should have a proper stack trace', () => {
      const error = new ApiError('Test error', 500);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ApiError');
    });
  });

  describe('Error Type Checks', () => {
    it('should identify client errors (4xx)', () => {
      const error400 = new ApiError('Bad request', 400);
      const error404 = new ApiError('Not found', 404);
      const error499 = new ApiError('Client error', 499);

      expect(error400.isClientError).toBe(true);
      expect(error404.isClientError).toBe(true);
      expect(error499.isClientError).toBe(true);

      expect(error400.isServerError).toBe(false);
    });

    it('should identify server errors (5xx)', () => {
      const error500 = new ApiError('Internal error', 500);
      const error502 = new ApiError('Bad gateway', 502);
      const error599 = new ApiError('Server error', 599);

      expect(error500.isServerError).toBe(true);
      expect(error502.isServerError).toBe(true);
      expect(error599.isServerError).toBe(true);

      expect(error500.isClientError).toBe(false);
    });

    it('should identify authentication errors (401)', () => {
      const error = new ApiError('Unauthorized', 401);

      expect(error.isAuthError).toBe(true);
      expect(error.isForbiddenError).toBe(false);
      expect(error.isNotFoundError).toBe(false);
      expect(error.isValidationError).toBe(false);
    });

    it('should identify forbidden errors (403)', () => {
      const error = new ApiError('Forbidden', 403);

      expect(error.isForbiddenError).toBe(true);
      expect(error.isAuthError).toBe(false);
    });

    it('should identify not found errors (404)', () => {
      const error = new ApiError('Not found', 404);

      expect(error.isNotFoundError).toBe(true);
      expect(error.isValidationError).toBe(false);
    });

    it('should identify validation errors (400)', () => {
      const error = new ApiError('Validation failed', 400);

      expect(error.isValidationError).toBe(true);
      expect(error.isAuthError).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should convert error to JSON object', () => {
      const error = new ApiError(
        'Test error',
        400,
        { field: 'email' },
        '/api/test',
        'POST'
      );

      const json = error.toJSON();

      expect(json).toMatchObject({
        name: 'ApiError',
        message: 'Test error',
        status: 400,
        details: { field: 'email' },
        url: '/api/test',
        method: 'POST',
      });
      expect(json.timestamp).toBeDefined();
      expect(json.stack).toBeDefined();
    });

    it('should include ISO timestamp in JSON', () => {
      const error = new ApiError('Test', 500);
      const json = error.toJSON();

      expect(typeof json.timestamp).toBe('string');
      expect(new Date(json.timestamp as string).toISOString()).toBe(
        json.timestamp
      );
    });
  });

  describe('fromResponse', () => {
    it('should create ApiError from Response with error data', async () => {
      const mockResponse = new Response(
        JSON.stringify({
          error: 'Invalid request',
          details: { field: 'email' },
        }),
        {
          status: 400,
          statusText: 'Bad Request',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const error = await ApiError.fromResponse(mockResponse);

      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Invalid request');
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should create ApiError from Response without JSON body', async () => {
      const mockResponse = new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      });

      const error = await ApiError.fromResponse(mockResponse);

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(404);
    });

    it('should handle Response with non-standard error format', async () => {
      const mockResponse = new Response(
        JSON.stringify({
          message: 'Custom error',
        }),
        {
          status: 500,
        }
      );

      const error = await ApiError.fromResponse(mockResponse);

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(500);
    });
  });

  describe('networkError', () => {
    it('should create network error', () => {
      const error = ApiError.networkError('/api/test', 'GET');

      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Network request failed');
      expect(error.status).toBe(0);
      expect(error.url).toBe('/api/test');
      expect(error.method).toBe('GET');
    });

    it('should include cause in network error', () => {
      const cause = new Error('Connection refused');
      const error = ApiError.networkError('/api/test', 'POST', cause);

      expect(error.details).toEqual({ cause: 'Connection refused' });
      expect(error.stack).toBe(cause.stack);
    });
  });

  describe('isApiError type guard', () => {
    it('should return true for ApiError instances', () => {
      const error = new ApiError('Test', 500);

      expect(isApiError(error)).toBe(true);
    });

    it('should return false for regular Error instances', () => {
      const error = new Error('Regular error');

      expect(isApiError(error)).toBe(false);
    });

    it('should return false for non-Error values', () => {
      expect(isApiError(null)).toBe(false);
      expect(isApiError(undefined)).toBe(false);
      expect(isApiError('error')).toBe(false);
      expect(isApiError({ message: 'error' })).toBe(false);
    });

    it('should narrow type correctly', () => {
      const error: unknown = new ApiError('Test', 400);

      if (isApiError(error)) {
        // TypeScript should know this is ApiError
        expect(error.status).toBe(400);
        expect(error.isClientError).toBe(true);
      }
    });
  });
});
